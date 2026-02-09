import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { FundraiserData, FundraiserContribution } from '@/lib/fundraiserTypes';

const ADMIN_PUBKEY = '7d33ba57d8a6e8869a1f1d5215254597594ac0dbfeb01b690def8c461b82db35';

/**
 * Fetch all fundraisers
 */
export function useFundraisers() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['fundraisers'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38178], authors: [ADMIN_PUBKEY], limit: 50 }],
        { signal }
      );

      const fundraisers: FundraiserData[] = events
        .map((event): FundraiserData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const title = event.tags.find(t => t[0] === 'title')?.[1];
            const goal = event.tags.find(t => t[0] === 'goal')?.[1];
            const thumbnail = event.tags.find(t => t[0] === 'image')?.[1];
            const status = event.tags.find(t => t[0] === 'status')?.[1] as 'active' | 'completed' | 'cancelled' || 'active';
            const deadline = event.tags.find(t => t[0] === 'deadline')?.[1];
            
            if (!id || !title || !goal || !thumbnail) return null;

            return {
              id,
              event,
              title,
              description: content.description || '',
              goal_sats: parseInt(goal),
              thumbnail,
              author_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              deadline,
              status,
            };
          } catch {
            return null;
          }
        })
        .filter((f): f is FundraiserData => f !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return fundraisers;
    },
  });
}

/**
 * Fetch active fundraisers only
 */
export function useActiveFundraisers() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['active-fundraisers'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38178], authors: [ADMIN_PUBKEY], '#status': ['active'], limit: 20 }],
        { signal }
      );

      const fundraisers: FundraiserData[] = events
        .map((event): FundraiserData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const title = event.tags.find(t => t[0] === 'title')?.[1];
            const goal = event.tags.find(t => t[0] === 'goal')?.[1];
            const thumbnail = event.tags.find(t => t[0] === 'image')?.[1];
            
            if (!id || !title || !goal || !thumbnail) return null;

            return {
              id,
              event,
              title,
              description: content.description || '',
              goal_sats: parseInt(goal),
              thumbnail,
              author_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              status: 'active',
            };
          } catch {
            return null;
          }
        })
        .filter((f): f is FundraiserData => f !== null);

      return fundraisers;
    },
  });
}

/**
 * Fetch a single fundraiser
 */
export function useFundraiser(fundraiserId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['fundraiser', fundraiserId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38178], authors: [ADMIN_PUBKEY], '#d': [fundraiserId], limit: 1 }],
        { signal }
      );

      if (events.length === 0) return null;

      const event = events[0];
      try {
        const content = JSON.parse(event.content);
        const id = event.tags.find(t => t[0] === 'd')?.[1];
        const title = event.tags.find(t => t[0] === 'title')?.[1];
        const goal = event.tags.find(t => t[0] === 'goal')?.[1];
        const thumbnail = event.tags.find(t => t[0] === 'image')?.[1];
        const status = event.tags.find(t => t[0] === 'status')?.[1] as 'active' | 'completed' | 'cancelled' || 'active';
        const deadline = event.tags.find(t => t[0] === 'deadline')?.[1];

        if (!id || !title || !goal || !thumbnail) return null;

        return {
          id,
          event,
          title,
          description: content.description || '',
          goal_sats: parseInt(goal),
          thumbnail,
          author_pubkey: event.pubkey,
          created_at: new Date(event.created_at * 1000).toISOString(),
          deadline,
          status,
        } as FundraiserData;
      } catch {
        return null;
      }
    },
  });
}

/**
 * Fetch contributions for a fundraiser
 */
export function useFundraiserContributions(fundraiserId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['fundraiser-contributions', fundraiserId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38179], '#f': [fundraiserId], limit: 500 }],
        { signal }
      );

      const contributions: FundraiserContribution[] = events
        .map((event): FundraiserContribution | null => {
          try {
            const content = JSON.parse(event.content);
            const fundraiserIdTag = event.tags.find(t => t[0] === 'f')?.[1];
            const npub = event.tags.find(t => t[0] === 'npub')?.[1];
            const amount = event.tags.find(t => t[0] === 'amount')?.[1];
            const name = event.tags.find(t => t[0] === 'name')?.[1];

            if (!fundraiserIdTag || !npub || !amount) return null;

            return {
              fundraiser_id: fundraiserIdTag,
              contributor_npub: npub,
              contributor_name: name,
              amount_sats: parseInt(amount),
              message: content.message,
              payment_proof: content.payment_proof,
              contributed_at: new Date(event.created_at * 1000).toISOString(),
              event,
            };
          } catch {
            return null;
          }
        })
        .filter((c): c is FundraiserContribution => c !== null)
        .sort((a, b) => new Date(b.contributed_at).getTime() - new Date(a.contributed_at).getTime());

      return contributions;
    },
  });
}
