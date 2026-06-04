import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import type { NostrEvent } from '@nostrify/nostrify';

export interface BidData {
  id: string;
  event: NostrEvent;
  bidder_pubkey: string;
  amount: number;
  currency: string;
  timestamp: number;
  artwork_event_id: string;
}

export interface BidConfirmation {
  id: string;
  event: NostrEvent;
  bid_event_id: string;
  auction_event_id: string;
  status: 'accepted' | 'rejected' | 'pending' | 'winner';
  message?: string;
  duration_extended?: number; // seconds to extend auction
}

/**
 * Query all bids and bid confirmations for a specific artwork event.
 * @param artworkEventId - the Nostr event ID of the auction event (kind 30020 or 39239)
 */
export function useBids(artworkEventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['bids', artworkEventId],
    enabled: !!artworkEventId,
    queryFn: async (c) => {
      if (!artworkEventId) return { bids: [], confirmations: [] };

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const [bidEvents, confirmationEvents] = await Promise.all([
        nostr.query([
          {
            kinds: [1021],
            '#e': [artworkEventId],
            limit: 100,
          }
        ], { signal }),
        nostr.query([
          {
            kinds: [1022],
            '#e': [artworkEventId],
            limit: 200,
          }
        ], { signal })
      ]);

      // Parse bids
      const bids: BidData[] = bidEvents
        .map(event => {
          try {
            const amount = parseInt(event.content);
            if (isNaN(amount) || amount <= 0) return null;

            return {
              id: event.id,
              event,
              bidder_pubkey: event.pubkey,
              amount,
              currency: 'SAT',
              timestamp: event.created_at,
              artwork_event_id: artworkEventId,
            } as BidData;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as BidData[];

      // Parse bid confirmations
      const confirmations: BidConfirmation[] = confirmationEvents
        .map(event => {
          try {
            const content = JSON.parse(event.content);
            const eTags = event.tags.filter(([name]) => name === 'e');
            const bidEventId = eTags[0]?.[1];
            const auctionEventId = eTags[1]?.[1] ?? artworkEventId;

            if (!bidEventId || !content.status) return null;

            return {
              id: event.id,
              event,
              bid_event_id: bidEventId,
              auction_event_id: auctionEventId,
              status: content.status,
              message: content.message,
              duration_extended: content.duration_extended,
            } as BidConfirmation;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as BidConfirmation[];

      // Sort bids by amount descending, then by timestamp ascending (earliest first for ties)
      bids.sort((a, b) => b.amount - a.amount || a.timestamp - b.timestamp);

      return { bids, confirmations };
    },
    staleTime: 10000,
    refetchInterval: 15000, // Poll every 15 seconds for live updates
  });
}

/**
 * Returns the total auction extension in seconds from all bid confirmations.
 */
export function getAuctionExtension(confirmations: BidConfirmation[]): number {
  return confirmations.reduce((total, c) => total + (c.duration_extended ?? 0), 0);
}

/**
 * Returns the effective auction end date, accounting for extensions.
 */
export function getEffectiveAuctionEnd(auctionEnd: string, confirmations: BidConfirmation[]): Date {
  const baseEnd = new Date(auctionEnd).getTime();
  const extensionMs = getAuctionExtension(confirmations) * 1000;
  return new Date(baseEnd + extensionMs);
}

/**
 * Place a bid on an artwork auction.
 * Uses NIP-15 kind 1021 - Bid event.
 */
export function usePlaceBid() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      artworkEventId,
      amount,
      currency = 'SAT',
    }: {
      artworkEventId: string;
      amount: number;
      currency?: string;
    }) => {
      if (!user) {
        throw new Error('User must be logged in to place bids');
      }

      if (amount <= 0) {
        throw new Error('Bid amount must be greater than 0');
      }

      // Kind 1021 - Bid event per NIP-15
      const bidEvent = {
        kind: 1021,
        content: String(amount), // amount in sats
        tags: [
          ['e', artworkEventId], // Reference to the auction event ID
          ['currency', currency],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(bidEvent);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return { signedEvent, amount, currency };
    },
    onSuccess: (data) => {
      toast({
        title: '🔨 Bid Placed!',
        description: `Your bid of ${data.amount.toLocaleString()} sats has been submitted. Watch for confirmation.`,
      });

      // Invalidate bids cache so it refetches
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    },
    onError: (error) => {
      console.error('Failed to place bid:', error);
      toast({
        title: 'Bid Failed',
        description: error instanceof Error ? error.message : 'Failed to place bid. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Confirm or reject a bid (admin only).
 * Uses NIP-15 kind 1022 - Bid confirmation event.
 */
export function useConfirmBid() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bidEventId,
      auctionEventId,
      status,
      message,
      durationExtended,
    }: {
      bidEventId: string;
      auctionEventId: string;
      status: 'accepted' | 'rejected' | 'pending' | 'winner';
      message?: string;
      durationExtended?: number;
    }) => {
      if (!user) {
        throw new Error('User must be logged in to confirm bids');
      }

      const content: Record<string, unknown> = { status };
      if (message) content.message = message;
      if (durationExtended) content.duration_extended = durationExtended;

      const confirmEvent = {
        kind: 1022,
        content: JSON.stringify(content),
        tags: [
          ['e', bidEventId],       // The bid being confirmed
          ['e', auctionEventId],   // The auction event
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(confirmEvent);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return { signedEvent, status };
    },
    onSuccess: (data) => {
      const statusMessages = {
        accepted: 'Bid accepted!',
        rejected: 'Bid rejected.',
        pending: 'Bid marked as pending.',
        winner: '🏆 Winning bid confirmed!',
      };

      toast({
        title: statusMessages[data.status],
      });

      queryClient.invalidateQueries({ queryKey: ['bids'] });
    },
    onError: (error) => {
      console.error('Failed to confirm bid:', error);
      toast({
        title: 'Confirmation Failed',
        description: 'Failed to confirm bid. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
