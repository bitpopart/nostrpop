import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const ADMIN_PUBKEY = getAdminPubkeyHex();

/**
 * NIP-58 Badge Definition (kind 30009)
 */
export interface NIP58BadgeDefinition {
  /** The d-tag identifier (e.g. "bravery") */
  id: string;
  /** Short name for the badge */
  name: string;
  /** Description of what the badge means */
  description?: string;
  /** High-res image URL (recommended 1024x1024) */
  image?: string;
  /** Thumbnail URLs keyed by dimension string e.g. "256x256" */
  thumbs: { url: string; size?: string }[];
  /** The author's pubkey */
  pubkey: string;
  /** The raw event */
  event: NostrEvent;
  /** naddr coordinate for this badge definition */
  naddr: string;
}

/**
 * NIP-58 Badge Award (kind 8)
 */
export interface NIP58BadgeAward {
  /** The event id of the award */
  id: string;
  /** naddr of the badge definition (30009:pubkey:d) */
  badgeAddr: string;
  /** Pubkeys that received this award */
  awardees: string[];
  /** The raw event */
  event: NostrEvent;
}

/**
 * Combined badge: definition + awards
 */
export interface NIP58Badge {
  definition: NIP58BadgeDefinition;
  awards: NIP58BadgeAward[];
  /** Total number of unique awardees */
  awardeeCount: number;
}

/**
 * Fetch NIP-58 badge definitions (kind 30009) published by the admin pubkey.
 */
export function useNIP58BadgeDefinitions() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nip58-badge-definitions', ADMIN_PUBKEY],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query(
        [{ kinds: [30009], authors: [ADMIN_PUBKEY], limit: 100 }],
        { signal }
      );

      const definitions: NIP58BadgeDefinition[] = events
        .map((event): NIP58BadgeDefinition | null => {
          try {
            const d = event.tags.find(t => t[0] === 'd')?.[1];
            const name = event.tags.find(t => t[0] === 'name')?.[1];
            const description = event.tags.find(t => t[0] === 'description')?.[1];
            const imageTag = event.tags.find(t => t[0] === 'image');
            const image = imageTag?.[1];
            const thumbs = event.tags
              .filter(t => t[0] === 'thumb')
              .map(t => ({ url: t[1], size: t[2] }));

            if (!d || !name) return null;

            // Build naddr
            const naddr = nip19.naddrEncode({
              kind: 30009,
              pubkey: event.pubkey,
              identifier: d,
            });

            return {
              id: d,
              name,
              description,
              image,
              thumbs,
              pubkey: event.pubkey,
              event,
              naddr,
            };
          } catch {
            return null;
          }
        })
        .filter((b): b is NIP58BadgeDefinition => b !== null)
        .sort((a, b) => b.event.created_at - a.event.created_at);

      return definitions;
    },
  });
}

/**
 * Fetch NIP-58 badge awards (kind 8) for a set of badge definition addresses.
 * Pass an array of "30009:pubkey:d" strings.
 */
export function useNIP58BadgeAwards(badgeAddrs: string[]) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nip58-badge-awards', ADMIN_PUBKEY, badgeAddrs],
    queryFn: async (c) => {
      if (badgeAddrs.length === 0) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query(
        [{ kinds: [8], authors: [ADMIN_PUBKEY], '#a': badgeAddrs, limit: 500 }],
        { signal }
      );

      const awards: NIP58BadgeAward[] = events.map((event): NIP58BadgeAward => {
        const badgeAddr = event.tags.find(t => t[0] === 'a')?.[1] ?? '';
        const awardees = event.tags.filter(t => t[0] === 'p').map(t => t[1]);
        return {
          id: event.id,
          badgeAddr,
          awardees,
          event,
        };
      });

      return awards;
    },
    enabled: badgeAddrs.length > 0,
  });
}

/**
 * Fetch a user's profile badges (kind 10008 per NIP-2275, falling back to 30008)
 * Returns the ordered list of { badgeAddr, awardEventId } pairs.
 */
export function useProfileBadges(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['profile-badges', pubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query both kind 10008 (new spec from issue #2275) and 30008 (legacy)
      const events = await nostr.query(
        [{
          kinds: [10008, 30008],
          authors: [pubkey],
          limit: 5,
        }],
        { signal }
      );

      if (events.length === 0) return [];

      // Prefer kind 10008 (proposed new standard) over 30008
      const kind10008 = events.filter(e => e.kind === 10008);
      const kind30008 = events.filter(e => e.kind === 30008);
      
      // Use the newest event from the preferred kind
      const sorted10008 = kind10008.sort((a, b) => b.created_at - a.created_at);
      const sorted30008 = kind30008.sort((a, b) => b.created_at - a.created_at);
      
      // Prefer 10008 if available, otherwise fall back to 30008
      const event = sorted10008[0] ?? sorted30008[0];
      if (!event) return [];

      // Extract pairs of (a, e) tags
      const pairs: { badgeAddr: string; awardEventId: string }[] = [];
      const tags = event.tags;
      for (let i = 0; i < tags.length - 1; i++) {
        if (tags[i][0] === 'a' && tags[i + 1][0] === 'e') {
          pairs.push({
            badgeAddr: tags[i][1],
            awardEventId: tags[i + 1][1],
          });
          i++; // skip the 'e' tag we just consumed
        }
      }
      return pairs;
    },
    enabled: !!pubkey,
  });
}
