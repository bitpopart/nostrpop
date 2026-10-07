#!/usr/bin/env node
/**
 * sync-nfcs.mjs — snapshot BitPopArt's NFT collection from
 * https://nonfungible.cash (Nonfungible.cash = "NFC") into a same-origin JSON
 * file the /NFT page can read without CORS.
 *
 * Why: the nonfungible.cash API sends NO CORS headers and the site is a static
 * GitHub Pages SPA, so browsers cannot fetch it cross-origin at runtime.
 * This script runs at build time (hooked into `npm run build` / `build:ci`)
 * and writes public/nfts/collection.json. The /NFT page renders this snapshot
 * and additionally tries a live refresh through the site's existing CORS proxy
 * (proxy.shakespeare.diy) so newly minted NFTs appear without a redeploy.
 *
 * Data model (from GET /api/profiles/<pubkey>):
 *   { pubkey, name, created, cards: [{ id, pubkey, h, title, showing,
 *     signature, status, created, sent, custody }], likes, followers,
 *     following, cover, custom_cover, previews, avatar }
 *   - h       = sha256 hash of the card's image; image at /api/images/<h>
 *   - status  = "owned" | "sent"
 *   - created = unix seconds
 * The API enriches a profile automatically on first read, so cards reflect
 * what the profile page shows. Sorted newest first (created desc).
 *
 * Usage:
 *   node scripts/sync-nfcs.mjs [--out public/nfts/collection.json] [--quiet]
 * Exit codes: 0 ok (or fetched nothing but kept a fresh-enough cache),
 *             1 network / parse / write failure without usable cache.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const NFC_PROFILE =
  'https://nonfungible.cash/api/profiles/43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';
const NFC_PROFILE_URL =
  'https://nonfungible.cash/p/43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';
const DEFAULT_OUT = join('public', 'nfts', 'collection.json');

function arg(name, fallback) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}
const OUT = arg('--out', DEFAULT_OUT);
const QUIET = process.argv.includes('--quiet');
const log = QUIET ? () => {} : (m) => console.log(m);

/** Fetch the NFC profile; throws on non-200 / non-JSON / empty cards. */
async function fetchProfile() {
  const res = await fetch(NFC_PROFILE, {
    headers: { Accept: 'application/json', 'User-Agent': 'bitpopart-site-sync/1.0' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`NFC profile HTTP ${res.status}`);
  const data = await res.json();
  if (!data || !Array.isArray(data.cards)) throw new Error('NFC profile: no cards array');
  if (data.cards.length === 0) throw new Error('NFC profile: empty cards');
  return data;
}

function normalize(data) {
  const cards = data.cards
    .map((c) => ({
      title: c.title ?? 'Untitled',
      h: c.h ?? c.id ?? '',
      created: c.created ?? 0,
      status: c.status ?? 'owned',
      image: `https://nonfungible.cash/api/images/${c.h ?? c.id ?? ''}`,
    }))
    .filter((c) => c.h)
    .sort((a, b) => b.created - a.created); // newest first
  return {
    pubkey: data.pubkey,
    name: data.name ?? 'BitPopArt',
    profile_url: NFC_PROFILE_URL,
    updated_at: Math.floor(Date.now() / 1000),
    total: cards.length,
    cards,
  };
}

/** Keep an existing cache only if it's under maxAgeSeconds old; else null. */
function readCache(maxAgeSeconds = 12 * 3600) {
  try {
    const raw = JSON.parse(readFileSync(OUT, 'utf8'));
    const age = Date.now() / 1000 - (raw.updated_at ?? 0);
    if (age <= maxAgeSeconds && Array.isArray(raw.cards) && raw.cards.length > 0) return raw;
  } catch {
    /* no cache */
  }
  return null;
}

async function main() {
  try {
    const data = await fetchProfile();
    const json = normalize(data);
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(json, null, 2) + '\n', 'utf8');
    log(`✅ NFC snapshot: ${json.total} cards (newest: ${json.cards[0]?.title ?? '?'}) → ${OUT}`);
    process.exit(0);
  } catch (err) {
    log(`⚠️  NFC sync failed: ${err.message}`);
    const cache = readCache();
    if (cache) {
      log(`   Kept existing cache (${cache.total} cards, updated ${new Date(cache.updated_at * 1000).toISOString()})`);
      process.exit(0);
    }
    log('   No usable cache — failing build.');
    process.exit(1);
  }
}

main();
