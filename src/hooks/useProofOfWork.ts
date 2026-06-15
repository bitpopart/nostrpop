import { useQuery } from '@tanstack/react-query';
import { NPool, NRelay1 } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_HEX = nip19.decode(ADMIN_NPUB).data as string;

/**
 * These relays are queried specifically for the Proof of Work section.
 * They are well-known archive/index relays that store full Nostr history,
 * independent of the relay the rest of the site uses.
 * This is so we can find the *true* earliest note from 2023, even if the
 * site relay (e.g. relay.ditto.pub) only has recent data.
 */
const POW_ARCHIVE_RELAYS = [
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.damus.io',
  'wss://purplepages.es',
  'wss://relay.primal.net',
];

export interface ProofOfWorkData {
  allNotes: NostrEvent[];
  latestNotes: NostrEvent[];
  earliestNote: NostrEvent | null;
  nostrSinceDate: Date | null;
  totalCount: number;
}

/**
 * Fetches all Nostr notes from BitPopArt admin for the Proof of Work archive.
 * Uses a dedicated NPool targeting multiple archive relays so the full history
 * (back to 2023) is always available, regardless of which relay the site uses.
 */
export function useProofOfWork() {
  return useQuery({
    queryKey: ['proof-of-work', ADMIN_HEX],
    queryFn: async (c): Promise<ProofOfWorkData> => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Create a short-lived NPool pointing only at our archive relays.
      // This is independent of the site's global relay setting.
      const pool = new NPool({
        open(url: string) {
          return new NRelay1(url);
        },
        reqRouter(filters) {
          const map = new Map<string, typeof filters>();
          for (const relay of POW_ARCHIVE_RELAYS) {
            map.set(relay, filters);
          }
          return map;
        },
        eventRouter() {
          return POW_ARCHIVE_RELAYS;
        },
        eoseTimeout: 5000,
      });

      try {
        // Query 1: latest notes (sorted by time descending — newest first)
        const latestEvents = await pool.query(
          [
            {
              kinds: [1],
              authors: [ADMIN_HEX],
              limit: 200,
            },
          ],
          { signal }
        );

        // Query 2: earliest notes (sorted by time ascending — oldest first)
        // Some relays support `since: 0` with a small limit to get oldest events.
        // We ask for a small limit anchored at the oldest possible time.
        const earliestEvents = await pool.query(
          [
            {
              kinds: [1],
              authors: [ADMIN_HEX],
              since: 0,
              until: Math.floor(Date.now() / 1000),
              limit: 50,
            },
          ],
          { signal }
        );

        // Merge both batches and deduplicate by id
        const allById = new Map<string, NostrEvent>();
        for (const e of [...latestEvents, ...earliestEvents]) {
          allById.set(e.id, e);
        }
        const allRaw = Array.from(allById.values());

        // Filter out replies (notes with 'e' tags)
        const originalNotes = allRaw.filter(
          (event) => !event.tags.some((tag) => tag[0] === 'e')
        );

        // Sort newest first for archive display
        const sortedNewest = [...originalNotes].sort((a, b) => b.created_at - a.created_at);

        // Find the absolute earliest note across all results
        const sortedOldest = [...originalNotes].sort((a, b) => a.created_at - b.created_at);
        const earliestNote = sortedOldest[0] ?? null;

        return {
          allNotes: sortedNewest,
          latestNotes: sortedNewest.slice(0, 3),
          earliestNote,
          nostrSinceDate: earliestNote ? new Date(earliestNote.created_at * 1000) : null,
          totalCount: sortedNewest.length,
        };
      } finally {
        pool.close();
      }
    },
    staleTime: 300000, // 5 minutes — archive data doesn't change often
    refetchInterval: 600000, // Refetch every 10 minutes
  });
}
