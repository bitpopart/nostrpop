/**
 * useOrders — Admin order management hook
 *
 * Orders arrive via three channels:
 *   1. The in-app checkout flow (OrderConfirmation page) — stored locally
 *   2. NIP-15 encrypted DM orders (kind 4) — decrypted and listed here
 *   3. Manual orders that can be created by the admin
 *
 * Order status lifecycle:
 *   pending → paid → processing → shipped → completed
 *   or:   pending → cancelled
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type ProductType = 'physical' | 'digital';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  currency: string;
  type: ProductType;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  total_price: number;
  currency: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_npub?: string;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  payment_method?: string;
  payment_proof?: string;
  notes?: string;
  source: 'checkout' | 'nip15' | 'manual';
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  tracking_number?: string;
  digital_downloaded?: boolean;
  digital_downloaded_at?: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const ORDERS_KEY = 'nostrpop_orders';

export function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function storeOrder(order: Order) {
  const orders = getStoredOrders();
  const existingIndex = orders.findIndex((o) => o.id === order.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.unshift(order); // newest first
  }
  saveOrders(orders);
}

// ─── Hook: list all orders ───────────────────────────────────────────────────

export function useOrders() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['shop-orders'],
    queryFn: async (c) => {
      // Start with locally stored orders (checkout + manual)
      const localOrders = getStoredOrders();

      // Try to fetch NIP-15 order DMs (kind 4) sent to the admin
      // These are encrypted, so we can only read them if we're logged in as admin
      if (user && adminPubkey) {
        try {
          const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
          const dmEvents = await nostr.query(
            [{ kinds: [4], '#p': [adminPubkey], limit: 200 }],
            { signal }
          );

          for (const event of dmEvents) {
            try {
              // Attempt to decrypt
              const decrypted = await user.signer.nip44?.decrypt(event.pubkey, event.content)
                ?? await user.signer.nip04?.decrypt(event.pubkey, event.content);

              if (!decrypted) continue;

              const msg = JSON.parse(decrypted) as Record<string, unknown>;

              // NIP-15 order message type = 0
              if (msg.type !== 0) continue;

              const orderId = `nip15-${event.id}`;

              // Skip if we already have this order locally
              if (localOrders.find((o) => o.id === orderId)) continue;

              const items = (msg.items as Array<{ product_id: string; quantity: number }> | undefined) ?? [];
              const contact = msg.contact as Record<string, string> | undefined;

              const newOrder: Order = {
                id: orderId,
                order_number: `NIP15-${event.id.slice(0, 8).toUpperCase()}`,
                status: 'pending',
                items: items.map((item) => ({
                  product_id: item.product_id,
                  product_name: item.product_id, // enriched later
                  quantity: item.quantity,
                  price: 0,
                  currency: 'SAT',
                  type: 'physical',
                })),
                total_price: 0,
                currency: 'SAT',
                buyer_name: msg.name as string | undefined,
                buyer_email: contact?.email,
                buyer_npub: contact?.nostr,
                shipping_address: msg.address
                  ? {
                      line1: msg.address as string,
                      city: '',
                      postal_code: '',
                      country: '',
                    }
                  : undefined,
                notes: msg.message as string | undefined,
                source: 'nip15',
                payment_method: 'Lightning',
                created_at: new Date(event.created_at * 1000).toISOString(),
                updated_at: new Date(event.created_at * 1000).toISOString(),
              };

              storeOrder(newOrder);
              localOrders.unshift(newOrder);
            } catch {
              // Failed to decrypt — not for us or wrong key
            }
          }
        } catch {
          // Relay error — fall back to local data
        }
      }

      // Sort newest first
      return localOrders.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: true,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ─── Hook: update order status ───────────────────────────────────────────────

export function useUpdateOrderStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      trackingNumber,
      notes,
    }: {
      orderId: string;
      status: OrderStatus;
      trackingNumber?: string;
      notes?: string;
    }) => {
      const orders = getStoredOrders();
      const index = orders.findIndex((o) => o.id === orderId);
      if (index < 0) throw new Error('Order not found');

      const now = new Date().toISOString();
      orders[index] = {
        ...orders[index],
        status,
        updated_at: now,
        ...(status === 'shipped' ? { shipped_at: now } : {}),
        ...(trackingNumber !== undefined ? { tracking_number: trackingNumber } : {}),
        ...(notes !== undefined ? { notes } : {}),
      };

      saveOrders(orders);
      return orders[index];
    },
    onSuccess: (order) => {
      const statusLabels: Record<OrderStatus, string> = {
        pending: 'Pending',
        paid: 'Paid',
        processing: 'Processing',
        shipped: 'Shipped',
        completed: 'Completed',
        cancelled: 'Cancelled',
      };
      toast({
        title: 'Order Updated',
        description: `Order ${order.order_number} marked as ${statusLabels[order.status]}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
    },
    onError: (error) => {
      console.error('Failed to update order:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update the order. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

// ─── Hook: mark digital download ────────────────────────────────────────────

export function useMarkDigitalDownloaded() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const orders = getStoredOrders();
      const index = orders.findIndex((o) => o.id === orderId);
      if (index < 0) throw new Error('Order not found');

      orders[index] = {
        ...orders[index],
        digital_downloaded: true,
        digital_downloaded_at: new Date().toISOString(),
        status: 'completed',
        updated_at: new Date().toISOString(),
      };

      saveOrders(orders);
      return orders[index];
    },
    onSuccess: () => {
      toast({ title: 'Marked as Downloaded', description: 'Digital download confirmed.' });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
    },
    onError: () => {
      toast({ title: 'Failed', description: 'Could not update download status.', variant: 'destructive' });
    },
  });
}

// ─── Hook: delete order ──────────────────────────────────────────────────────

export function useDeleteOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const orders = getStoredOrders();
      const filtered = orders.filter((o) => o.id !== orderId);
      saveOrders(filtered);
      return orderId;
    },
    onSuccess: () => {
      toast({ title: 'Order Deleted', description: 'The order has been removed.' });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
    },
    onError: () => {
      toast({ title: 'Delete Failed', description: 'Could not delete order.', variant: 'destructive' });
    },
  });
}

// ─── Utility: create a checkout order ────────────────────────────────────────

/**
 * Called from the OrderConfirmation page to persist an order.
 */
export function createCheckoutOrder(params: {
  productId: string;
  productName: string;
  productType: ProductType;
  productImage?: string;
  price: number;
  currency: string;
  buyerName?: string;
  buyerEmail?: string;
  shippingAddress?: Order['shipping_address'];
  paymentMethod?: string;
}): Order {
  const id = `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const order: Order = {
    id,
    order_number: `ORD-${Date.now().toString(36).toUpperCase()}`,
    status: 'paid',
    items: [
      {
        product_id: params.productId,
        product_name: params.productName,
        quantity: 1,
        price: params.price,
        currency: params.currency,
        type: params.productType,
        image: params.productImage,
      },
    ],
    total_price: params.price,
    currency: params.currency,
    buyer_name: params.buyerName,
    buyer_email: params.buyerEmail,
    shipping_address: params.shippingAddress,
    payment_method: params.paymentMethod ?? 'Lightning',
    source: 'checkout',
    created_at: now,
    updated_at: now,
  };

  storeOrder(order);
  return order;
}
