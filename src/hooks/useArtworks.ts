import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getArtworksByFilter, getArtworkById, type ArtworkData, type ArtworkFilter } from '@/lib/artTypes';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';

// Local storage for deleted artworks (prevents them from reappearing)
const DELETED_ARTWORKS_KEY = 'nostrpop_deleted_artworks';

function getDeletedArtworks(): Set<string> {
  try {
    const stored = localStorage.getItem(DELETED_ARTWORKS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function addDeletedArtwork(artworkAddress: string) {
  const deleted = getDeletedArtworks();
  deleted.add(artworkAddress);
  localStorage.setItem(DELETED_ARTWORKS_KEY, JSON.stringify(Array.from(deleted)));
  console.log(`📝 Stored artwork deletion locally: ${artworkAddress}`);
}

export function useArtworks(filter: ArtworkFilter = 'all', options?: { enabled?: boolean }) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['artworks', filter],
    enabled: options?.enabled !== false,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for artwork events (kind 39239 and legacy kind 30023) and deletion events (kind 5)
      const [artworkEvents, deletionEvents] = await Promise.all([
        nostr.query([
          {
            kinds: [39239, 30023], // Support both new and legacy artwork kinds
            '#t': ['artwork'], // Tag to identify artwork posts
            limit: 50,
          }
        ], { signal }),
        nostr.query([
          {
            kinds: [5], // Deletion events
            limit: 1000,
          }
        ], { signal })
      ]);

      console.log(`Found ${artworkEvents.length} artworks and ${deletionEvents.length} deletion events`);

      // Build set of deleted artwork addresses from ALL deletion events
      const deletedAddresses = new Set<string>();
      
      // Add deletions from Nostr events
      deletionEvents.forEach(delEvent => {
        const aTags = delEvent.tags.filter(([name]) => name === 'a');
        aTags.forEach(([, address]) => {
          if (address && (address.startsWith('39239:') || address.startsWith('30023:'))) {
            deletedAddresses.add(address);
            console.log(`Found deletion event for artwork: ${address}`);
          }
        });
      });

      // Add locally stored deletions (prevents deleted artworks from reappearing)
      const locallyDeleted = getDeletedArtworks();
      locallyDeleted.forEach(address => deletedAddresses.add(address));

      console.log(`Total deleted artwork addresses: ${deletedAddresses.size} (${locallyDeleted.size} local + ${deletedAddresses.size - locallyDeleted.size} from network)`);

      // Deduplicate events by d-tag + pubkey (prefer kind 39239 over legacy kind 30023)
      const eventsByAddress = new Map<string, typeof artworkEvents[0]>();
      artworkEvents.forEach(event => {
        const dTag = event.tags.find(([name]) => name === 'd')?.[1];
        if (!dTag) return;
        
        const address = `${event.pubkey}:${dTag}`;
        const existing = eventsByAddress.get(address);
        
        // If no existing event, or existing is legacy kind and new one is 39239, replace
        if (!existing || (existing.kind === 30023 && event.kind === 39239)) {
          eventsByAddress.set(address, event);
        }
      });

      const events = Array.from(eventsByAddress.values());

      // Process and validate artwork events, filtering out deleted ones
      const artworks = events
        .map(event => {
          try {
            const content = JSON.parse(event.content);
            const dTag = event.tags.find(([name]) => name === 'd')?.[1];
            const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
            const saleTags = event.tags.filter(([name]) => name === 'sale').map(([, value]) => value);
            const featured = event.tags.find(([name]) => name === 'featured')?.[1] === 'true';
            const orderTag = event.tags.find(([name]) => name === 'order')?.[1];

            // Basic validation
            if (!dTag || !titleTag || !content.title || !content.images?.length) {
              return null;
            }

            // Check if this artwork has been deleted (support both kinds)
            const artworkAddress = `${event.kind}:${event.pubkey}:${dTag}`;
            if (deletedAddresses.has(artworkAddress)) {
              console.log(`Filtering out deleted artwork: ${artworkAddress}`);
              return null;
            }

            // Determine sale type
            let saleType: ArtworkData['sale_type'] = 'not_for_sale';
            let price: number | undefined;
            let currency: string | undefined;
            let auctionStart: string | undefined;
            let auctionEnd: string | undefined;
            let startingBid: number | undefined;
            let currentBid: number | undefined;

            if (saleTags.includes('fixed') && content.price) {
              saleType = 'fixed';
              price = content.price;
              currency = content.currency || 'BTC';
            } else if (saleTags.includes('auction')) {
              saleType = 'auction';
              startingBid = content.starting_bid;
              currentBid = content.current_bid || content.starting_bid;
              currency = content.currency || 'BTC';
              auctionStart = content.auction_start;
              auctionEnd = content.auction_end;
            } else if (saleTags.includes('sold')) {
              saleType = 'sold';
              price = content.price;
              currency = content.currency || 'BTC';
            }

            return {
              id: dTag,
              event,
              title: content.title,
              description: content.description || '',
              images: content.images || [],
              artist_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              sale_type: saleType,
              price,
              currency,
              auction_start: auctionStart,
              auction_end: auctionEnd,
              starting_bid: startingBid,
              current_bid: currentBid,
              shipping: content.shipping ? {
                local_countries: content.shipping.local_countries,
                local_cost: content.shipping.local_cost,
                international_cost: content.shipping.international_cost
              } : undefined,
              medium: content.medium,
              dimensions: content.dimensions,
              year: content.year,
              tags: content.tags || [],
              edition: content.edition,
              certificate_url: content.certificate_url,
              featured,
              order: orderTag ? parseInt(orderTag) : undefined
            } as ArtworkData;
          } catch (error) {
            console.warn('Failed to parse artwork event:', error);
            return null;
          }
        })
        .filter(Boolean) as ArtworkData[];

      // Sort by order field (if present), otherwise by creation date
      const sortedArtworks = artworks.sort((a, b) => {
        // If both have order, sort by order (lower numbers first)
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // If only one has order, prioritize it
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Otherwise sort by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // If no artworks found from Nostr events, return sample data for demonstration
      if (sortedArtworks.length === 0) {
        return getArtworksByFilter(filter);
      }

      // Apply filter to Nostr data
      if (filter === 'all') {
        return sortedArtworks;
      }

      return sortedArtworks.filter(artwork => {
        switch (filter) {
          case 'for_sale':
            return artwork.sale_type === 'fixed';
          case 'auction':
            return artwork.sale_type === 'auction';
          case 'sold':
            return artwork.sale_type === 'sold';
          default:
            return true;
        }
      });
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useArtwork(artworkId: string, authorPubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['artwork', artworkId, authorPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for the artwork and deletion events (support both new and legacy kinds)
      const [artworkEvents, deletionEvents] = await Promise.all([
        nostr.query([
          {
            kinds: [39239, 30023],
            '#d': [artworkId],
            '#t': ['artwork'],
            ...(authorPubkey && { authors: [authorPubkey] }),
            limit: 1
          }
        ], { signal }),
        nostr.query([
          {
            kinds: [5], // Deletion events
            limit: 1000,
          }
        ], { signal })
      ]);

      if (artworkEvents.length === 0) {
        // If no Nostr event found, try sample data
        const sampleArtwork = getArtworkById(artworkId);
        if (!sampleArtwork) {
          throw new Error('Artwork not found');
        }
        return sampleArtwork;
      }

      const event = artworkEvents[0];

      // Check if this artwork has been deleted (support both kinds)
      const artworkAddress = `${event.kind}:${event.pubkey}:${artworkId}`;
      
      // Build set of deleted artwork addresses
      const deletedAddresses = new Set<string>();
      
      // Add deletions from Nostr events
      deletionEvents.forEach(delEvent => {
        const aTags = delEvent.tags.filter(([name]) => name === 'a');
        aTags.forEach(([, address]) => {
          if (address && (address.startsWith('39239:') || address.startsWith('30023:'))) {
            deletedAddresses.add(address);
          }
        });
      });

      // Add locally stored deletions
      const locallyDeleted = getDeletedArtworks();
      locallyDeleted.forEach(address => deletedAddresses.add(address));

      if (deletedAddresses.has(artworkAddress)) {
        console.log(`Artwork has been deleted: ${artworkAddress}`);
        throw new Error('Artwork not found');
      }

      const content = JSON.parse(event.content);
      const saleTags = event.tags.filter(([name]) => name === 'sale').map(([, value]) => value);
      const featured = event.tags.find(([name]) => name === 'featured')?.[1] === 'true';
      const orderTag = event.tags.find(([name]) => name === 'order')?.[1];

      // Process sale type and pricing
      let saleType: ArtworkData['sale_type'] = 'not_for_sale';
      let price: number | undefined;
      let currency: string | undefined;
      let auctionStart: string | undefined;
      let auctionEnd: string | undefined;
      let startingBid: number | undefined;
      let currentBid: number | undefined;

      if (saleTags.includes('fixed') && content.price) {
        saleType = 'fixed';
        price = content.price;
        currency = content.currency || 'BTC';
      } else if (saleTags.includes('auction')) {
        saleType = 'auction';
        startingBid = content.starting_bid;
        currentBid = content.current_bid || content.starting_bid;
        currency = content.currency || 'BTC';
        auctionStart = content.auction_start;
        auctionEnd = content.auction_end;
      } else if (saleTags.includes('sold')) {
        saleType = 'sold';
        price = content.price;
        currency = content.currency || 'BTC';
      }

      return {
        id: artworkId,
        event,
        title: content.title,
        description: content.description || '',
        images: content.images || [],
        artist_pubkey: event.pubkey,
        created_at: new Date(event.created_at * 1000).toISOString(),
        sale_type: saleType,
        price,
        currency,
        auction_start: auctionStart,
        auction_end: auctionEnd,
        starting_bid: startingBid,
        current_bid: currentBid,
        shipping: content.shipping ? {
          local_countries: content.shipping.local_countries,
          local_cost: content.shipping.local_cost,
          international_cost: content.shipping.international_cost
        } : undefined,
        medium: content.medium,
        dimensions: content.dimensions,
        year: content.year,
        tags: content.tags || [],
        edition: content.edition,
        certificate_url: content.certificate_url,
        featured,
        order: orderTag ? parseInt(orderTag) : undefined
      } as ArtworkData;
    },
    enabled: !!artworkId,
    staleTime: 30000,
  });
}

export function useCreateArtwork() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artworkData: {
      title: string;
      description: string;
      images: string[];
      saleType: ArtworkData['sale_type'];
      price?: number;
      currency?: string;
      auctionStart?: string;
      auctionEnd?: string;
      startingBid?: number;
      medium?: string;
      dimensions?: string;
      year?: string;
      tags?: string[];
      edition?: string;
      certificateUrl?: string;
      featured?: boolean;
      shipping?: {
        localCountries?: string;
        localShippingCost?: number;
        internationalShippingCost?: number;
      };
    }) => {
      if (!user) {
        throw new Error('User must be logged in to create artwork');
      }

      // Create artwork content
      const content = {
        title: artworkData.title,
        description: artworkData.description,
        images: artworkData.images,
        medium: artworkData.medium,
        dimensions: artworkData.dimensions,
        year: artworkData.year,
        tags: artworkData.tags,
        edition: artworkData.edition,
        certificate_url: artworkData.certificateUrl,
        shipping: artworkData.shipping ? {
          local_countries: artworkData.shipping.localCountries,
          local_cost: artworkData.shipping.localShippingCost,
          international_cost: artworkData.shipping.internationalShippingCost
        } : undefined,
        ...(artworkData.saleType === 'fixed' && {
          price: artworkData.price,
          currency: artworkData.currency
        }),
        ...(artworkData.saleType === 'auction' && {
          starting_bid: artworkData.startingBid,
          current_bid: artworkData.startingBid,
          currency: artworkData.currency,
          auction_start: artworkData.auctionStart,
          auction_end: artworkData.auctionEnd
        })
      };

      // Create tags
      const tags = [
        ['d', `artwork-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`],
        ['title', artworkData.title],
        ['t', 'artwork'],
        ['t', 'art'],
        ...(artworkData.saleType !== 'not_for_sale' ? [['sale', artworkData.saleType]] : []),
        ...(artworkData.featured ? [['featured', 'true']] : []),
        ...(artworkData.tags?.map(tag => ['t', tag.toLowerCase()]) || [])
      ];

      // Add price tags if applicable
      if (artworkData.price && artworkData.currency) {
        tags.push(['price', artworkData.price.toString()]);
        tags.push(['currency', artworkData.currency]);
      }

      const artworkEvent = {
        kind: 39239,
        content: JSON.stringify(content),
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(artworkEvent);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return { artwork: artworkData, event: signedEvent };
    },
    onSuccess: (data) => {
      toast({
        title: "Artwork Created",
        description: `"${data.artwork.title}" has been added to the gallery.`,
      });

      // Invalidate and refetch artworks
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    },
    onError: (error) => {
      console.error('Failed to create artwork:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create artwork. Please try again.",
        variant: "destructive"
      });
    },
  });
}

export function useDeleteArtwork() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artworkId, artistPubkey }: { artworkId: string; artistPubkey: string }) => {
      if (!user) {
        throw new Error('User must be logged in to delete artwork');
      }

      // Try to determine the kind from the existing artwork
      // For deletion, we need to support both kinds
      let artworkAddress = `39239:${artistPubkey}:${artworkId}`;
      
      // Query to check if this is a legacy artwork
      try {
        const checkEvents = await nostr.query([
          {
            kinds: [30023],
            '#d': [artworkId],
            authors: [artistPubkey],
            limit: 1
          }
        ], { signal: AbortSignal.timeout(2000) });
        
        if (checkEvents.length > 0) {
          artworkAddress = `30023:${artistPubkey}:${artworkId}`;
        }
      } catch (error) {
        // If check fails, default to new kind
      }
      
      console.log(`🗑️ Deleting artwork: ${artworkAddress}`);

      // Create a deletion event (kind 5) for the artwork
      const deletionEvent = {
        kind: 5,
        content: 'Artwork deleted',
        tags: [
          ['a', artworkAddress] // Reference to the addressable event
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(deletionEvent);
      console.log('📤 Publishing deletion event:', signedEvent);
      
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });
      
      console.log('✓ Deletion event published to relay');

      // Store deletion locally so it persists across refreshes
      addDeletedArtwork(artworkAddress);

      return { artworkId, artworkAddress, deletionEvent: signedEvent };
    },
    onSuccess: (data) => {
      console.log(`✓ Deletion handler completed for: ${data.artworkAddress}`);
      
      toast({
        title: "Artwork Deleted",
        description: "The artwork has been successfully removed from the gallery.",
      });

      // HARD DELETE: Remove from ALL cached queries immediately
      queryClient.setQueriesData(
        { queryKey: ['artworks'] }, 
        (oldData: ArtworkData[] | undefined) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          const filtered = oldData.filter((artwork: ArtworkData) => {
            // Support both old and new kind numbers
            const artworkAddress39239 = `39239:${artwork.artist_pubkey}:${artwork.id}`;
            const artworkAddress30023 = `30023:${artwork.artist_pubkey}:${artwork.id}`;
            return artworkAddress39239 !== data.artworkAddress && artworkAddress30023 !== data.artworkAddress;
          });
          console.log(`Cache update: ${oldData.length} -> ${filtered.length} artworks`);
          return filtered;
        }
      );

      // Remove specific artwork query
      queryClient.removeQueries({ queryKey: ['artwork', data.artworkId] });

      // Cancel any in-flight queries
      queryClient.cancelQueries({ queryKey: ['artworks'] });
      
      console.log('✓ Cache cleared, artwork removed');
    },
    onError: (error) => {
      console.error('Failed to delete artwork:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the artwork. Please try again.",
        variant: "destructive"
      });
    },
  });
}