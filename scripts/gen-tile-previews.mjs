#!/usr/bin/env node
/**
 * gen-tile-previews.mjs — generate small static previews for animated-GIF
 * homepage grid tiles and a same-origin manifest for the display layer.
 *
 * Why: the homepage Photo Grid renders tile thumbs through the wsrv.nl image
 * proxy. That works for normal images (tens of KB), but animated-GIF tiles are
 * often multi-megabyte originals (wallpapers etc.). The proxy can time out on
 * such sources for minutes (it must download+decode the whole source before
 * serving even one resized frame), and the runtime fallback to the direct
 * original means downloading ~11 MB per GIF per visitor. Result: those tiles
 * stay gray forever — the recurring "homepage thumbs don't appear" bug.
 *
 * This script runs at deploy time (GitHub Actions, before `vite build`). It
 * reads the live homepage settings event from the same relays the site reads,
 * and for every GIF grid tile it renders a small JPEG of the first frame into
 * public/tiles/<sha256-of-url>.jpg (plus public/tiles/manifest.json mapping
 * each GIF URL → its local preview). The names are content-addressed by URL,
 * so they are stable across builds and cache well. Vite copies public/ into
 * dist/, so the previews are served from the same origin with no third-party
 * dependency and no CORS.
 *
 * It is deliberately failure-tolerant: a tile that cannot be downloaded or
 * decoded is skipped (the site then falls back to the original GIF URL), and
 * the script never fails the deploy.
 *
 * Usage: node tools/gen-tile-previews.mjs
 * Exit codes: 0 always (warnings on stderr), 1 only on internal fatal errors.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SimplePool } from 'nostr-tools';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_TILES = join(__dirname, '..', 'public', 'tiles');
const MANIFEST_PATH = join(PUBLIC_TILES, 'manifest.json');

// Homepage settings author — keep in sync with PRIMARY_OWNER_PUBKEY in
// src/lib/adminUtils.ts (the site queries exactly this key for settings).
const SETTINGS_AUTHOR =
  '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

// Relays that serve kind-30078 to anonymous readers (same rationale as the
// site's read pool: Ditto + Dreamith NIP-42 AUTH-gate these reads).
const RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
  'wss://relay.nostr.net',
  'wss://nos.lol',
];

const MAX_SOURCE_BYTES = 60 * 1024 * 1024; // sanity cap per GIF
const PREVIEW_MAX_DIM = 640;
const JPEG_QUALITY = 80;

async function loadNewestSettings() {
  const pool = new SimplePool();
  let newest = null;
  try {
    for (const relay of RELAYS) {
      try {
        const events = await pool.querySync(
          [relay],
          { kinds: [30078], authors: [SETTINGS_AUTHOR], '#d': ['com.bitpopart.homepage-settings'], limit: 5 },
          { maxWait: 6000 },
        );
        for (const ev of events) {
          if (!newest || ev.created_at > newest.created_at) newest = ev;
        }
      } catch (err) {
        console.warn(`[tile-previews] ${relay} error: ${err?.message ?? err}`);
      }
    }
  } finally {
    try { pool.close(); } catch { /* noop */ }
  }
  return newest;
}

const warn = (msg) => console.warn(`[tile-previews] ${msg}`);

async function main() {
  mkdirSync(PUBLIC_TILES, { recursive: true });

  const event = await loadNewestSettings();
  if (!event) {
    warn('could not fetch homepage settings from any relay — skipping tile preview generation');
    return;
  }

  let settings;
  try {
    settings = JSON.parse(event.content);
  } catch (err) {
    warn(`settings event ${event.id} has unparseable content — skipping`);
    return;
  }

  const gridTiles = Array.isArray(settings.gridTiles) ? settings.gridTiles : [];
  const gifTiles = gridTiles.filter((t) => /\.gif(\?|$)/i.test(String(t.imageUrl || '')));

  if (gifTiles.length === 0) {
    warn(`no GIF grid tiles in settings event ${event.id} (${gridTiles.length} tiles total)`);
    return;
  }

  warn(`${gifTiles.length} GIF grid tiles found (event ${event.id.slice(0, 12)}, ${gridTiles.length} tiles total)`);

  const manifest = {};
  let ok = 0;
  for (const [idx, tile] of gifTiles.entries()) {
    const url = String(tile.imageUrl);
    const hash = createHash('sha256').update(url).digest('hex');
    const outPath = join(PUBLIC_TILES, `${hash}.jpg`);
    const relPath = `/tiles/${hash}.jpg`;
    const t0 = Date.now();

    // Reuse an existing preview (idempotent local runs).
    try {
      if (existsSync(outPath) && statSync(outPath).size > 0) {
        manifest[url] = relPath;
        ok += 1;
        continue;
      }
    } catch { /* fall through to regenerate */ }

    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(120_000),
        headers: { 'user-agent': 'bitpopart-tile-previews/1.0' },
      });
      if (!res.ok) {
        warn(`download failed (${res.status}) for ${url.slice(0, 80)} — skipping`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > MAX_SOURCE_BYTES) {
        warn(`source too large (${(buf.byteLength / 1048576).toFixed(1)} MB) for ${url.slice(0, 80)} — skipping`);
        continue;
      }

      // sharp without `animated: true` renders the first frame of a GIF.
      await sharp(buf, { animated: false })
        .resize({ width: PREVIEW_MAX_DIM, height: PREVIEW_MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toFile(outPath);

      manifest[url] = relPath;
      ok += 1;
      warn(`[${idx + 1}/${gifTiles.length}] preview ${hash.slice(0, 8)}.jpg (${(Date.now() - t0) / 1000}s)`);
    } catch (err) {
      warn(`[${idx + 1}/${gifTiles.length}] preview generation failed for ${url.slice(0, 80)}: ${err?.message ?? err} — skipping`);
    }
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  warn(`wrote ${ok}/${gifTiles.length} previews → ${MANIFEST_PATH}`);
}

main()
  .catch((err) => {
    console.error('[tile-previews] fatal:', err);
    process.exit(1);
  })
  .finally(() => {
    // Exit explicitly — lingering undici keep-alive sockets or relay
    // connections must not keep the CI job alive after the work is done.
    process.exit(0);
  });
