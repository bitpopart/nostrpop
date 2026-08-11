#!/usr/bin/env node
/**
 * poppost-sync.mjs — mirror image posts from the "Schedule POP posts" Buzz
 * channel into public/poppost/posts.json so the admin PopPost scheduler's
 * Channel inbox can import them as scheduled Nostr posts.
 *
 * Flow:
 *   1. `buzz messages get --channel <SCHEDULE_CHANNEL>` (authenticated bot).
 *   2. Keep messages authored by the channel owner that contain images
 *      (imeta tags and/or image URLs in the content).
 *   3. Download each image into public/poppost/images/<eventId>/N.<ext>.
 *      Media hosted on the Buzz relay is fetched with `buzz media get`
 *      (Blossom get auth, since the URLs 401 anonymously); external image
 *      URLs (nostr.build, blossom.primal.net, …) are fetched with plain fetch.
 *   4. Append new entries to public/poppost/posts.json, newest first.
 *
 * URLs in posts.json are ABSOLUTE (https://bitpopart.com/poppost/images/…):
 * the private relay's media URLs 401 anonymously, and the composer publishes
 * imeta `url …` values verbatim — so imported scheduler posts must carry
 * publicly reachable image URLs.
 *
 * Idempotent: already-ingested event IDs are skipped. Safe to re-run.
 *
 * Usage:
 *   node scripts/poppost-sync.mjs [--commit] [--data-file X] [--image-dir Y] [--events-json Z]
 *   --commit      git add + commit + push origin main (uses git config identity)
 *   --data-file   override posts.json path (testing)
 *   --image-dir   override image output dir (testing)
 *   --events-json read channel events from a JSON file instead of `buzz`
 *                 (offline / fixture testing)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const CHANNEL = 'f831a1a5-389f-426b-9df6-b5d3b9ec2133'; // "Schedule POP posts"
const OWNER = '7eb59ca9f99bf6ddace147794035855a91eac5c378fc5177a16b3f540afae41a'; // BitPopArt
const BUZZ_MEDIA_HOST = 'bitpopart.communities.buzz.xyz';
const SITE_BASE = 'https://bitpopart.com'; // public deploy; posts.json refs must be absolute
const KINDS = '1,9,20';

function parseArgs(argv) {
  const args = { commit: false, dataFile: join(REPO_ROOT, 'public/poppost/posts.json'), imageDir: join(REPO_ROOT, 'public/poppost/images') };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--commit') args.commit = true;
    else if (a === '--data-file') args.dataFile = join(REPO_ROOT, argv[++i]);
    else if (a === '--image-dir') args.imageDir = join(REPO_ROOT, argv[++i]);
    else if (a === '--events-json') args.eventsJson = join(REPO_ROOT, argv[++i]);
    else { console.error(`Unknown arg: ${a}`); process.exit(1); }
  }
  return args;
}

// ── buzz CLI helpers ────────────────────────────────────────────────────────

function buzzJson(args) {
  const out = execFileSync('buzz', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out);
}

function fetchChannelEvents(eventsJson) {
  if (eventsJson) {
    const raw = readFileSync(eventsJson, 'utf8');
    return JSON.parse(raw);
  }
  return buzzJson(['messages', 'get', '--channel', CHANNEL, '--limit', '200', '--kinds', KINDS]);
}

// ── image extraction ────────────────────────────────────────────────────────

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|svg)(?:$|[?#])/i;

function isImageUrl(url) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (IMAGE_EXT_RE.test(url)) return true;
  // extless: trust known image/media hosts (nostr.build, primal files, blossom, void.cat, m.nosta.me)
  return /^https?:\/\/(i\.nostr\.build|files\.primal\.net|blossom\.|void\.cat|m\.nosta\.me)\//i.test(url);
}

function extractImages(event) {
  const images = [];
  const seen = new Set();

  // 1. imeta tags (NIP-92) — how `buzz messages send --file` attaches uploads
  for (const tag of event.tags ?? []) {
    if (tag[0] !== 'imeta') continue;
    const urlParam = tag.find((p) => p.startsWith('url '));
    if (!urlParam) continue;
    const url = urlParam.slice(4).trim();
    if (!isImageUrl(url) || seen.has(url)) continue;
    seen.add(url);
    const altParam = tag.find((p) => p.startsWith('alt '));
    images.push({ url, alt: altParam ? altParam.slice(4) : undefined });
  }

  // 2. markdown images ![alt](url)
  const mdRe = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  let m;
  while ((m = mdRe.exec(event.content ?? '')) !== null) {
    if (isImageUrl(m[2]) && !seen.has(m[2])) {
      seen.add(m[2]);
      images.push({ url: m[2], alt: m[1] || undefined });
    }
  }

  // 3. bare image URLs in content
  const urlRe = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  while ((m = urlRe.exec(event.content ?? '')) !== null) {
    const url = m[0].replace(/[),;}]+$/, '');
    if (isImageUrl(url) && !seen.has(url)) {
      seen.add(url);
      images.push({ url, alt: undefined });
    }
  }

  return images;
}

// ── downloads ───────────────────────────────────────────────────────────────

function sniffExt(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return '.png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return '.gif';
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return '.webp';
  if (buf.length >= 12 && (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70)) return '.avif';
  const head = buf.subarray(0, 512).toString('latin1').trimStart();
  if (head.startsWith('<svg') || head.startsWith('<?xml')) return '.svg';
  return '.img';
}

function extFromUrl(url) {
  const path = url.split(/[?#]/)[0];
  const m = path.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i);
  return m ? m[0].toLowerCase() : null;
}

async function downloadImage(url, destDir, index) {
  const tmp = join(destDir, `.tmp-${index}`);
  const urlHost = new URL(url).hostname;

  if (urlHost === BUZZ_MEDIA_HOST) {
    // Authenticated Blossom get — anonymous fetches 401
    execFileSync('buzz', ['media', 'get', url, '-o', tmp], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } else {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(tmp, buf);
    } finally {
      clearTimeout(timer);
    }
  }

  const buf = readFileSync(tmp);
  const ext = extFromUrl(url) ?? sniffExt(buf);
  const dest = join(destDir, `${index}${ext}`);
  renameSync(tmp, dest);
  return dest;
}

// ── posts.json state ────────────────────────────────────────────────────────

function loadState(dataFile) {
  if (!existsSync(dataFile)) return { generatedAt: 0, posts: [] };
  try {
    const data = JSON.parse(readFileSync(dataFile, 'utf8'));
    return { generatedAt: data.generatedAt ?? 0, posts: Array.isArray(data.posts) ? data.posts : [] };
  } catch {
    console.warn(`⚠️  Could not parse ${dataFile}, starting fresh`);
    return { generatedAt: 0, posts: [] };
  }
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const events = fetchChannelEvents(args.eventsJson);

  const { posts: existing } = loadState(args.dataFile);
  const seen = new Set(existing.map((p) => p.eventId));
  const newPosts = [];

  for (const ev of events) {
    if (ev.pubkey !== OWNER) continue; // only the channel owner's posts
    if (seen.has(ev.id)) continue;     // already ingested
    const images = extractImages(ev);
    if (images.length === 0) continue; // text-only / mention — not a POP post

    const destDir = join(args.imageDir, ev.id);
    const stored = [];
    let failed = 0;
    for (let i = 0; i < images.length; i++) {
      try {
        mkdirSync(destDir, { recursive: true });
        const dest = await downloadImage(images[i].url, destDir, i);
        stored.push({ src: `${SITE_BASE}/poppost/images/${ev.id}/${i}${extname(dest)}`, alt: images[i].alt });
      } catch (err) {
        failed++;
        console.error(`  ⚠️  Failed to download ${images[i].url}: ${err.message}`);
      }
    }
    if (stored.length === 0) {
      console.warn(`  ⚠️  Event ${ev.id.slice(0, 12)}… had images but none downloaded — skipped`);
      continue;
    }

    const caption = (ev.content ?? '').trim().slice(0, 1000);
    const hashtags = [...caption.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]);

    newPosts.push({
      eventId: ev.id,
      author: ev.pubkey,
      createdAt: ev.created_at,
      caption: caption || undefined,
      hashtags,
      images: stored,
    });
    console.log(`  + ${ev.id.slice(0, 12)}… ${stored.length} image(s) ${new Date(ev.created_at * 1000).toISOString()} ${caption.slice(0, 60) || ''}`);
  }

  if (newPosts.length === 0) {
    console.log(`No new posts (channel has ${events.length} scanned, ${seen.size} already ingested).`);
    return;
  }

  const merged = [...newPosts, ...existing].sort((a, b) => b.createdAt - a.createdAt);
  const out = { generatedAt: Math.floor(Date.now() / 1000), posts: merged };
  mkdirSync(join(args.dataFile, '..'), { recursive: true });
  writeFileSync(args.dataFile, JSON.stringify(out, null, 2) + '\n');
  console.log(`✅ ${newPosts.length} new post(s) → ${args.dataFile} (total ${merged.length})`);

  if (args.commit) {
    const name = execFileSync('git', ['config', 'user.name'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const email = execFileSync('git', ['config', 'user.email'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const identity = `${name} <${email}>`;
    const body = `poppost: add ${newPosts.length} new channel post(s) from Schedule POP posts channel\n\nCo-authored-by: ${identity}\nSigned-off-by: ${identity}`;
    execFileSync('git', ['add', 'public/poppost'], { cwd: REPO_ROOT, encoding: 'utf8' });
    execFileSync('git', ['commit', '-m', body], { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'inherit' });
    execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'inherit' });
    console.log('🚀 Pushed — GitHub Pages deploy will publish the feed.');
  } else {
    console.log('ℹ️  Run with --commit (or commit manually) to publish.');
  }
}

main().catch((err) => {
  console.error('❌ poppost-sync failed:', err.message);
  process.exit(1);
});
