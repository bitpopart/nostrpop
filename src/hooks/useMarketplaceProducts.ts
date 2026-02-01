import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { getProductsByCategory, getProductById } from '@/lib/sampleProducts';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';

interface MarketplaceProduct {
  id: string;
  event?: NostrEvent;
  name: string;
  description: string;
  images: string[];
  currency: string;
  price: number;
  quantity?: number;
  category: string;
  type: 'physical' | 'digital';
  specs?: Array<[string, string]>;
  shipping?: Array<{ id: string; cost: number }>;
  digital_files?: string[];
  digital_file_names?: string[];
  product_url?: string;
  contact_url?: string;
  stall_id: string;
  created_at: string;
}

export function useMarketplaceProducts(category?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['marketplace-products', category],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for NIP-15 product events (kind 30018)
      const filters = [
        {
          kinds: [30018], // NIP-15 product events
          limit: 100,
          ...(category && { '#t': [category.toLowerCase()] })
        }
      ];



      const events = await nostr.query(filters, { signal });

      // Process and validate product events
      const products = events
        .map(event => {
          try {
            const content = JSON.parse(event.content);
            const dTag = event.tags.find(([name]) => name === 'd')?.[1];
            const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
            const categoryTags = event.tags.filter(([name]) => name === 't').map(([, value]) => value);

            // Basic validation
            if (!dTag || !titleTag || !content.name || !content.price) {
              return null;
            }

            // Determine product type
            const isDigital = categoryTags.includes('digital');
            const isPhysical = categoryTags.includes('physical');
            const type = isDigital ? 'digital' : isPhysical ? 'physical' : 'physical';

            // Get main category (exclude type tags)
            const mainCategory = categoryTags.find(tag => !['digital', 'physical'].includes(tag)) || 'Other';

            return {
              id: dTag,
              event,
              name: content.name,
              description: content.description || '',
              images: content.images || [],
              currency: content.currency || 'USD',
              price: content.price,
              quantity: content.quantity,
              category: mainCategory,
              type,
              specs: content.specs || [],
              shipping: content.shipping || [],
              digital_files: content.digital_files || [],
              digital_file_names: content.digital_file_names || [],
              product_url: content.product_url,
              contact_url: content.contact_url,
              stall_id: content.stall_id || 'default',
              created_at: new Date(event.created_at * 1000).toISOString()
            } as MarketplaceProduct;
          } catch (error) {
            console.warn('Failed to parse product event:', error);
            return null;
          }
        })
        .filter(Boolean) as MarketplaceProduct[];

      // Sort by creation date (newest first)
      const sortedProducts = products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return sortedProducts;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useMarketplaceProduct(productId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['marketplace-product', productId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query([
        {
          kinds: [30018],
          '#d': [productId],
          limit: 1
        }
      ], { signal });

      if (events.length === 0) {
        throw new Error('Product not found');
      }

      const event = events[0];
      const content = JSON.parse(event.content);
      const categoryTags = event.tags.filter(([name]) => name === 't').map(([, value]) => value);

      const isDigital = categoryTags.includes('digital');
      const isPhysical = categoryTags.includes('physical');
      const type = isDigital ? 'digital' : isPhysical ? 'physical' : 'physical';
      const mainCategory = categoryTags.find(tag => !['digital', 'physical'].includes(tag)) || 'Other';

      return {
        id: productId,
        event,
        name: content.name,
        description: content.description || '',
        images: content.images || [],
        currency: content.currency || 'USD',
        price: content.price,
        quantity: content.quantity,
        category: mainCategory,
        type,
        specs: content.specs || [],
        shipping: content.shipping || [],
        digital_files: content.digital_files || [],
        digital_file_names: content.digital_file_names || [],
        product_url: content.product_url,
        contact_url: content.contact_url,
        stall_id: content.stall_id || 'default',
        created_at: new Date(event.created_at * 1000).toISOString()
      } as MarketplaceProduct;
    },
    enabled: !!productId,
    staleTime: 30000,
  });
}

export function useDeleteProduct() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) {
        throw new Error('User must be logged in to delete products');
      }

      // Create a deletion event (kind 5) for the product
      const deletionEvent = {
        kind: 5,
        content: 'Product deleted',
        tags: [
          ['e', ''], // We don't have the event ID, so we'll use the d tag approach
          ['a', `30018:${user.pubkey}:${productId}`] // Reference to the addressable event
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(deletionEvent);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return { productId, deletionEvent: signedEvent };
    },
    onSuccess: (data) => {
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted from the marketplace.",
      });

      // Invalidate and refetch marketplace products
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-product', data.productId] });
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive"
      });
    },
  });
}