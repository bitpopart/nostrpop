import { useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import {
  BADGE_CLAIM_HASHTAG,
  BADGE_PRIVATE_D,
  BADGE_REGISTRY_D,
  BADGE_REGISTRY_KIND,
  MAX_REGISTRY_CODES,
  claimProof,
  countCodes,
  generateBadgeCode,
  hashBadgeCode,
  parseClaim,
  parseCodeList,
  parseHashRegistry,
  serializeCodeList,
  serializeHashRegistry,
  type CodeMap,
  type ParsedClaim,
} from '@/lib/badgeClaims';

const OWNER = getAdminPubkeyHex();

/** Relays can disagree about which copy is newest, so pick it ourselves. */
function newestOf(events: NostrEvent[]): NostrEvent | null {
  return [...events].sort((a, b) => b.created_at - a.created_at)[0] ?? null;
}

/* ---------- public registry (anyone) ---------- */

/** Hashes of the unused claim codes. Contains no codes. */
export function usePublicBadgeCodes() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['badge-codes-public'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{ kinds: [BADGE_REGISTRY_KIND], authors: [OWNER], '#d': [BADGE_REGISTRY_D], limit: 3 }],
        { signal },
      );
      const event = newestOf(events);
      return { registry: event ? parseHashRegistry(event.content) : ({} as CodeMap), event };
    },
    staleTime: 30_000,
  });
}

/* ---------- private list (owner only) ---------- */

export interface PrivateCodes {
  codes: CodeMap;
  event: NostrEvent | null;
  /** False when a list exists but this signer could not open it. */
  readable: boolean;
}

/** The codes themselves, decrypted with the owner's signer. */
export function usePrivateBadgeCodes() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ['badge-codes-private', user?.pubkey],
    enabled: isAdmin && !!user,
    queryFn: async (c): Promise<PrivateCodes> => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{ kinds: [BADGE_REGISTRY_KIND], authors: [OWNER], '#d': [BADGE_PRIVATE_D], limit: 3 }],
        { signal },
      );
      const event = newestOf(events);
      if (!event) return { codes: {}, event: null, readable: true };
      if (!user?.signer.nip44) return { codes: {}, event, readable: false };
      try {
        const plain = await user.signer.nip44.decrypt(user.pubkey, event.content);
        return { codes: parseCodeList(plain), event, readable: true };
      } catch {
        return { codes: {}, event, readable: false };
      }
    },
    staleTime: 15_000,
  });
}

/* ---------- claims inbox (owner) ---------- */

/** Public claim notes from people who entered a valid code. */
export function useBadgeClaims(enabled: boolean) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['badge-claims'],
    enabled,
    queryFn: async (c): Promise<ParsedClaim[]> => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(6000)]);
      const events = await nostr.query(
        [{ kinds: [1], '#t': [BADGE_CLAIM_HASHTAG], limit: 200 }],
        { signal },
      );
      // One row per person and badge. The earliest claim wins.
      const byKey = new Map<string, ParsedClaim>();
      for (const ev of events) {
        const claim = parseClaim(ev);
        if (!claim) continue;
        const key = `${claim.claimant}:${claim.badgeId}:${claim.proof}`;
        const prev = byKey.get(key);
        if (!prev || claim.createdAt < prev.createdAt) byKey.set(key, claim);
      }
      return Array.from(byKey.values()).sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 15_000,
  });
}

/** Which unused code (if any) produces this claim's proof. */
export async function matchClaimCode(claim: ParsedClaim, codes: string[]): Promise<string | null> {
  for (const code of codes) {
    if ((await claimProof(claim.badgeId, code, claim.claimant)) === claim.proof) return code;
  }
  return null;
}

/* ---------- owner actions ---------- */

/** Make and retire claim codes. Publishes the public registry and the private list together. */
export function useBadgeCodeAdmin() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();

  /** Newest copies straight from the relays, so an edit never builds on stale data. */
  const loadLatest = useCallback(async () => {
    const signal = AbortSignal.timeout(6000);
    const events = await nostr.query(
      [
        { kinds: [BADGE_REGISTRY_KIND], authors: [OWNER], '#d': [BADGE_REGISTRY_D], limit: 3 },
        { kinds: [BADGE_REGISTRY_KIND], authors: [OWNER], '#d': [BADGE_PRIVATE_D], limit: 3 },
      ],
      { signal },
    );
    const pubEvent = newestOf(events.filter((e) => e.tags.some((t) => t[0] === 'd' && t[1] === BADGE_REGISTRY_D)));
    const privEvent = newestOf(events.filter((e) => e.tags.some((t) => t[0] === 'd' && t[1] === BADGE_PRIVATE_D)));

    const registry = pubEvent ? parseHashRegistry(pubEvent.content) : {};

    let codes: CodeMap = {};
    if (privEvent) {
      if (!user?.signer.nip44) {
        throw new Error('Your signer cannot open the encrypted code list (NIP-44). Log in with a signer that supports NIP-44.');
      }
      try {
        codes = parseCodeList(await user.signer.nip44.decrypt(user.pubkey, privEvent.content));
      } catch {
        throw new Error('Could not open the existing code list with this account. Nothing was changed.');
      }
    }
    return { registry, codes, pubEvent, privEvent };
  }, [nostr, user]);

  const saveBoth = useCallback(
    async (
      registry: CodeMap,
      codes: CodeMap,
      prev: { pubEvent: NostrEvent | null; privEvent: NostrEvent | null },
    ) => {
      if (!user?.signer.nip44) {
        throw new Error('Your signer does not support NIP-44 encryption, which is needed to keep the codes safe.');
      }
      const encrypted = await user.signer.nip44.encrypt(user.pubkey, serializeCodeList(codes));

      // Private list first, so a code can never be live without being recoverable.
      await publish({
        kind: BADGE_REGISTRY_KIND,
        content: encrypted,
        tags: [
          ['d', BADGE_PRIVATE_D],
          ['alt', 'Encrypted BitPopArt badge claim codes (readable only by the owner)'],
        ],
        prev: prev.privEvent ?? undefined,
      });
      await publish({
        kind: BADGE_REGISTRY_KIND,
        content: serializeHashRegistry(registry),
        tags: [
          ['d', BADGE_REGISTRY_D],
          ['alt', 'BitPopArt badge claim code hashes (no codes inside)'],
        ],
        prev: prev.pubEvent ?? undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['badge-codes-public'] }),
        queryClient.invalidateQueries({ queryKey: ['badge-codes-private'] }),
      ]);
    },
    [user, publish, queryClient],
  );

  /** Create `count` new codes for a badge. Returns them (normalized). */
  const issueCodes = useCallback(
    async (badgeId: string, count: number): Promise<string[]> => {
      const latest = await loadLatest();
      if (countCodes(latest.registry) + count > MAX_REGISTRY_CODES) {
        throw new Error(`That would go over ${MAX_REGISTRY_CODES} unused codes in total. Retire some first.`);
      }
      const fresh = Array.from({ length: count }, () => generateBadgeCode());
      const hashes = await Promise.all(fresh.map((c) => hashBadgeCode(badgeId, c)));

      const registry: CodeMap = { ...latest.registry, [badgeId]: [...(latest.registry[badgeId] ?? []), ...hashes] };
      const codes: CodeMap = { ...latest.codes, [badgeId]: [...(latest.codes[badgeId] ?? []), ...fresh] };
      await saveBoth(registry, codes, latest);
      return fresh;
    },
    [loadLatest, saveBoth],
  );

  /** Make a code stop working (used once it has been awarded). */
  const retireCode = useCallback(
    async (badgeId: string, code: string) => {
      const latest = await loadLatest();
      const hash = await hashBadgeCode(badgeId, code);
      const registry: CodeMap = { ...latest.registry, [badgeId]: (latest.registry[badgeId] ?? []).filter((h) => h !== hash) };
      const codes: CodeMap = { ...latest.codes, [badgeId]: (latest.codes[badgeId] ?? []).filter((c) => c !== code) };
      await saveBoth(registry, codes, latest);
    },
    [loadLatest, saveBoth],
  );

  return { issueCodes, retireCode };
}
