import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_HEX = nip19.decode(ADMIN_NPUB).data as string;

export interface ProofOfWorkData {
  allNotes: NostrEvent[];
  latestNotes: NostrEvent[];
  earliestNote: NostrEvent | null;
  nostrSinceDate: Date | null;
  totalCount: number;
}

/**
 * Fetches all Nostr notes from BitPopArt admin for the Proof of Work archive.
 * Includes the earliest note to show when they joined Nostr.
 */
export function useProofOfWork() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['proof-of-work', ADMIN_HEX],
    queryFn: async (c): Promise<ProofOfWorkData> => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      // Fetch a large batch of notes to get archive + earliest
      const events = await nostr.query(
        [
          {
            kinds: [1],
            authors: [ADMIN_HEX],
            limit: 500,
          },
        ],
        { signal }
      );

      // Filter out replies (notes with 'e' tags)
      const originalNotes = events.filter(
        (event) => !event.tags.some((tag) => tag[0] === 'e')
      );

      // Sort newest first for display
      const sorted = [...originalNotes].sort((a, b) => b.created_at - a.created_at);

      // Sort oldest first to find earliest note
      const sortedOldest = [...originalNotes].sort((a, b) => a.created_at - b.created_at);
      const earliestNote = sortedOldest[0] ?? null;

      return {
        allNotes: sorted,
        latestNotes: sorted.slice(0, 3),
        earliestNote,
        nostrSinceDate: earliestNote ? new Date(earliestNote.created_at * 1000) : null,
        totalCount: sorted.length,
      };
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}
