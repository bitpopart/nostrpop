import { useQuery } from '@tanstack/react-query';
import { NPool, NRelay1 } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_HEX = nip19.decode(ADMIN_NPUB).data as string;

/**
 * The confirmed date BitPopArt joined Nostr.
 * Hardcoded because old relays prune history and won't have events this far back.
 * February 2023 is the known start — relays only return as far back as July 2023.
 */
export const NOSTR_SINCE_DATE = new Date('2023-02-01');

/**
 * These relays are queried specifically for the Proof of Work section.
 * They are well-known archive/index relays that store full Nostr history,
 * independent of the relay the rest of the site uses.
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
  /** True if relay coverage may be incomplete — some years might have gaps */
  isPartial: boolean;
}

/**
 * Build unix timestamp boundaries for a given year.
 */
function yearWindow(year: number): { since: number; until: number } {
  const since = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000);
  const until = Math.floor(new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000);
  return { since, until };
}

/**
 * Fetches all Nostr notes from BitPopArt admin for the Proof of Work archive.
 *
 * Strategy: query each year independently (2023 → current year) in parallel,
 * each with a high per-year limit. This prevents the 200-event cap from hiding
 * 2023/2024 data when the relay returns newest-first.
 *
 * Relays may still prune old events — noted in isPartial.
 */
export function useProofOfWork() {
  return useQuery({
    queryKey: ['proof-of-work-v2', ADMIN_HEX],
    queryFn: async (c): Promise<ProofOfWorkData> => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(20000)]);

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
        eoseTimeout: 6000,
      });

      try {
        const currentYear = new Date().getFullYear();
        const startYear = 2023;

        // Build one query per year from 2023 → now.
        // Each year window gets up to 500 events so a busy year doesn't lose data.
        const yearQueries = [];
        for (let yr = startYear; yr <= currentYear; yr++) {
          const { since, until } = yearWindow(yr);
          yearQueries.push(
            pool.query(
              [{ kinds: [1], authors: [ADMIN_HEX], since, until, limit: 500 }],
              { signal },
            ).catch(() => [] as NostrEvent[]), // if one year fails, keep going
          );
        }

        const yearResults = await Promise.all(yearQueries);

        // Merge + deduplicate by event id
        const allById = new Map<string, NostrEvent>();
        for (const batch of yearResults) {
          for (const e of batch) {
            allById.set(e.id, e);
          }
        }

        // Filter out replies (events that reference other events via 'e' tags)
        const originalNotes = Array.from(allById.values()).filter(
          (event) => !event.tags.some((tag) => tag[0] === 'e'),
        );

        // Sort newest → oldest for archive display
        const sortedNewest = [...originalNotes].sort((a, b) => b.created_at - a.created_at);
        const sortedOldest = [...originalNotes].sort((a, b) => a.created_at - b.created_at);
        const earliestNote = sortedOldest[0] ?? null;

        // Consider data partial if we got fewer than 10 events for 2023
        // (relay pruning means the early history may be missing)
        const count2023 = yearResults[0]?.length ?? 0;
        const isPartial = count2023 < 10;

        return {
          allNotes: sortedNewest,
          latestNotes: sortedNewest.slice(0, 3),
          earliestNote,
          nostrSinceDate: NOSTR_SINCE_DATE,
          totalCount: sortedNewest.length,
          isPartial,
        };
      } finally {
        pool.close();
      }
    },
    staleTime: 300000,    // 5 minutes
    refetchInterval: 600000, // 10 minutes
  });
}
