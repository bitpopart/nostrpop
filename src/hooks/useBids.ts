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
 * Parse a raw Nostr event into a BidData object.
 * Returns null if the event is not a valid bid.
 */
function parseBidEvent(event: NostrEvent, artworkEventId: string): BidData | null {
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
    };
  } catch {
    return null;
  }
}

/**
 * Parse a raw Nostr event into a BidConfirmation.
 * Returns null if invalid.
 */
function parseConfirmationEvent(event: NostrEvent, artworkEventId: string): BidConfirmation | null {
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
    };
  } catch {
    return null;
  }
}

/**
 * Query all bids and bid confirmations for a specific artwork auction.
 *
 * Queries by BOTH:
 *  - #e tag (event ID of whichever version of the artwork was current when the bid was placed)
 *  - #a tag (stable addressable coordinate: "kind:pubkey:d-tag")
 *
 * This ensures bids placed against old versions of the artwork event are still found,
 * since addressable events (kind 39239) get a new event ID every time they are edited.
 *
 * @param artworkEventId  Current event ID (hash) of the artwork event
 * @param artworkATag     Stable address e.g. "39239:<pubkey>:<d-tag>"
 */
export function useBids(artworkEventId: string | undefined, artworkATag?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['bids', artworkEventId, artworkATag],
    enabled: !!(artworkEventId || artworkATag),
    queryFn: async (c) => {
      if (!artworkEventId && !artworkATag) return { bids: [], confirmations: [] };

      // Use a generous timeout — relay round-trips can be slow
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Build filter list — always query by both mechanisms so we catch
      // bids placed against any version of the artwork event.
      const bidFilters = [];
      const confirmationFilters = [];

      if (artworkEventId) {
        bidFilters.push({ kinds: [1021], '#e': [artworkEventId], limit: 200 });
        confirmationFilters.push({ kinds: [1022], '#e': [artworkEventId], limit: 400 });
      }
      if (artworkATag) {
        bidFilters.push({ kinds: [1021], '#a': [artworkATag], limit: 200 });
        confirmationFilters.push({ kinds: [1022], '#a': [artworkATag], limit: 400 });
      }

      const [bidEvents, confirmationEvents] = await Promise.all([
        nostr.query(bidFilters, { signal }),
        nostr.query(confirmationFilters, { signal }),
      ]);

      // Deduplicate by event ID (the two queries may return overlapping events)
      const uniqueBidEvents = Array.from(
        new Map(bidEvents.map(e => [e.id, e])).values()
      );
      const uniqueConfirmationEvents = Array.from(
        new Map(confirmationEvents.map(e => [e.id, e])).values()
      );

      // Parse
      const bids: BidData[] = uniqueBidEvents
        .map(e => parseBidEvent(e, artworkEventId ?? artworkATag ?? ''))
        .filter(Boolean) as BidData[];

      const confirmations: BidConfirmation[] = uniqueConfirmationEvents
        .map(e => parseConfirmationEvent(e, artworkEventId ?? artworkATag ?? ''))
        .filter(Boolean) as BidConfirmation[];

      // Sort bids: highest amount first, tie-break by earliest timestamp
      bids.sort((a, b) => b.amount - a.amount || a.timestamp - b.timestamp);

      console.log(`[useBids] Found ${bids.length} bids, ${confirmations.length} confirmations for artwork`, artworkEventId ?? artworkATag);

      return { bids, confirmations };
    },
    staleTime: 10000,
    refetchInterval: 15000,
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
 *
 * Tags both the current event ID (#e) AND the stable addressable coordinate (#a)
 * so the bid is discoverable regardless of whether the artwork event is later updated.
 */
export function usePlaceBid() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      artworkEventId,
      artworkATag,
      amount,
      currency = 'SAT',
    }: {
      artworkEventId: string;
      artworkATag?: string; // stable "kind:pubkey:d-tag" coordinate
      amount: number;
      currency?: string;
    }) => {
      if (!user) {
        throw new Error('User must be logged in to place bids');
      }
      if (amount <= 0) {
        throw new Error('Bid amount must be greater than 0');
      }

      const tags: string[][] = [
        ['e', artworkEventId], // Reference to the specific event version
        ['currency', currency],
      ];

      // Also tag the stable address so bids survive artwork updates
      if (artworkATag) {
        tags.push(['a', artworkATag]);
      }

      const bidEvent = {
        kind: 1021,
        content: String(amount),
        tags,
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
          ['e', bidEventId],
          ['e', auctionEventId],
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
      toast({ title: statusMessages[data.status] });
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
