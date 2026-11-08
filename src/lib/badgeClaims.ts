import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

/**
 * Badge claim codes for /badges.
 *
 * How it works (same idea as "Verify my item" on /b):
 *  - The owner hands out claim codes, one per badge, from /badges (admin mode).
 *  - A PUBLIC registry (kind 30078) lists only salted hashes of the unused
 *    codes, so the page can tell a visitor "this code is real" without ever
 *    publishing a code.
 *  - A PRIVATE list (kind 30078, NIP-44 encrypted to the owner) keeps the codes
 *    themselves, so the owner can look them up again and check claims.
 *  - A visitor who enters a valid code signs a public kind-1 claim note. The
 *    note carries a proof that is bound to BOTH the code and the visitor's npub.
 *    Copying someone else's note, or reading the public hashes, is not enough
 *    to forge it.
 *  - The owner sees the claim in /badges (admin mode), the proof is checked
 *    against the private code list, and one click awards the NIP-58 badge
 *    (kind 8) and retires the code so it works only once.
 */

/** NIP-78 application data. */
export const BADGE_REGISTRY_KIND = 30078;
/** Public registry: salted hashes of unused codes, grouped by badge id. */
export const BADGE_REGISTRY_D = 'com.bitpopart.badge-codes';
/** Private list: the codes themselves, NIP-44 encrypted to the owner. */
export const BADGE_PRIVATE_D = 'com.bitpopart.badge-codes.private';
/** Hashtag every claim note carries, so the owner's inbox can find them. */
export const BADGE_CLAIM_HASHTAG = 'badgeclaim';
/** Hard cap on codes across all badges (keeps the public event small). */
export const MAX_REGISTRY_CODES = 1500;
/** Codes are 16 characters from a 32 character alphabet = 80 bits. */
export const CODE_LENGTH = 16;

/** No I, O, 0 or 1, so a code read off a card or message is hard to mistype. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const HASH_HEX_LENGTH = 32;
const HASH_RE = /^[0-9a-f]{32}$/;
const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/** badge id (the NIP-58 d-tag) to a list of hashes, or to a list of codes. */
export type CodeMap = Record<string, string[]>;

/* ---------- codes ---------- */

/** A fresh random code, normalized (no dashes). */
export function generateBadgeCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  // 32 symbols, so `& 31` is unbiased.
  for (const b of bytes) out += CODE_ALPHABET[b & 31];
  return out;
}

/** Trim, upper-case and drop dashes/spaces, so any way of typing a code matches. */
export function normalizeBadgeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** XXXX-XXXX-XXXX-XXXX for showing to people. */
export function formatBadgeCode(code: string): string {
  return (normalizeBadgeCode(code).match(/.{1,4}/g) ?? []).join('-');
}

/** True when the text is shaped like one of our codes. */
export function isBadgeCode(input: string): boolean {
  return CODE_RE.test(normalizeBadgeCode(input));
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** What the public registry stores for a code. Salted with the badge id. */
export async function hashBadgeCode(badgeId: string, code: string): Promise<string> {
  const full = await sha256Hex(`badge:${badgeId}:${normalizeBadgeCode(code)}`);
  return full.slice(0, HASH_HEX_LENGTH);
}

/**
 * The proof inside a claim note. Needs the code AND the claimant's pubkey, so
 * it cannot be built from the public hashes and cannot be replayed by someone
 * else's npub.
 */
export async function claimProof(badgeId: string, code: string, pubkeyHex: string): Promise<string> {
  return sha256Hex(`claim:${badgeId}:${normalizeBadgeCode(code)}:${pubkeyHex.toLowerCase()}`);
}

/* ---------- registries ---------- */

function cleanMap(raw: unknown, valid: (v: string) => boolean): CodeMap {
  const out: CodeMap = {};
  if (!raw || typeof raw !== 'object') return out;
  let total = 0;
  for (const [id, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || id.length > 120 || !Array.isArray(list)) continue;
    const seen = new Set<string>();
    for (const v of list) {
      if (total >= MAX_REGISTRY_CODES) break;
      if (typeof v === 'string' && valid(v) && !seen.has(v)) {
        seen.add(v);
        total++;
      }
    }
    if (seen.size > 0) out[id] = Array.from(seen);
  }
  return out;
}

/** Parse the public registry event content. Anything malformed is dropped. */
export function parseHashRegistry(content: string): CodeMap {
  try {
    const o = JSON.parse(content) as { badges?: unknown } | null;
    return cleanMap(o?.badges, (v) => HASH_RE.test(v));
  } catch {
    return {};
  }
}

export function serializeHashRegistry(map: CodeMap): string {
  return JSON.stringify({ v: 1, badges: cleanMap(map, (v) => HASH_RE.test(v)) });
}

/** Parse the decrypted private list. */
export function parseCodeList(plaintext: string): CodeMap {
  try {
    const o = JSON.parse(plaintext) as { codes?: unknown } | null;
    return cleanMap(o?.codes, (v) => CODE_RE.test(v));
  } catch {
    return {};
  }
}

export function serializeCodeList(map: CodeMap): string {
  return JSON.stringify({ v: 1, codes: cleanMap(map, (v) => CODE_RE.test(v)) });
}

export function countCodes(map: CodeMap): number {
  return Object.values(map).reduce((n, list) => n + list.length, 0);
}

/* ---------- claim notes ---------- */

export interface ParsedClaim {
  eventId: string;
  claimant: string;
  createdAt: number;
  badgeId: string;
  proof: string;
  event: NostrEvent;
}

/**
 * Read a claim out of a kind-1 note. The signed tag is preferred; the line in
 * the note text is the fallback for people who copied the note and posted it
 * from another Nostr app (those apps drop our custom tag).
 */
export function parseClaim(event: NostrEvent): ParsedClaim | null {
  if (event.kind !== 1) return null;
  let badgeId: string | undefined;
  let proof: string | undefined;

  const tag = event.tags.find((t) => t[0] === 'badge-claim' && !!t[1] && /^[0-9a-f]{64}$/.test(t[2] ?? ''));
  if (tag) {
    badgeId = tag[1];
    proof = tag[2];
  } else {
    const m = event.content.match(/badge-claim:([^\s:]+):([0-9a-fA-F]{64})/);
    if (m) {
      badgeId = m[1];
      proof = m[2].toLowerCase();
    }
  }
  if (!badgeId || !proof) return null;

  return {
    eventId: event.id,
    claimant: event.pubkey,
    createdAt: event.created_at,
    badgeId,
    proof,
    event,
  };
}

/** The text of the claim note. Readable by people, parseable by the owner. */
export function buildClaimNote(p: { badgeName: string; badgeId: string; proof: string; ownerPubkey: string }): string {
  const ownerNpub = nip19.npubEncode(p.ownerPubkey);
  return `Claiming my ${p.badgeName} badge from BitPopArt. nostr:${ownerNpub} #BitPopArt #BadgeClaim\n\nbadge-claim:${p.badgeId}:${p.proof}`;
}

export function claimTags(ownerPubkey: string, badgeId: string, proof: string): string[][] {
  return [
    ['p', ownerPubkey],
    ['a', `30009:${ownerPubkey}:${badgeId}`],
    ['t', BADGE_CLAIM_HASHTAG],
    ['t', 'bitpopart'],
    ['badge-claim', badgeId, proof],
  ];
}

/** Accept an npub, nprofile or 64-char hex key; return the hex pubkey. */
export function parsePubkey(value: string): string | null {
  const t = value.trim();
  if (/^[0-9a-f]{64}$/i.test(t)) return t.toLowerCase();
  try {
    const decoded = nip19.decode(t);
    if (decoded.type === 'npub') return decoded.data;
    if (decoded.type === 'nprofile') return decoded.data.pubkey;
  } catch {
    /* not a nip19 string */
  }
  return null;
}

/** Link that opens the claim form with a badge and code filled in. */
export function claimLink(origin: string, badgeId: string, code: string): string {
  return `${origin}/badges?badge=${encodeURIComponent(badgeId)}&code=${formatBadgeCode(code)}#claim`;
}
