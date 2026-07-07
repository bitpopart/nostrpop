/**
 * OrderMessaging — Gamma Spec NIP-17 encrypted order communication UI
 *
 * Shows the admin (merchant) incoming order messages and allows sending
 * payment requests, status updates, and shipping notifications.
 *
 * Implements the Gamma Spec order flow:
 *   type 1 — Order Creation (buyer → merchant)
 *   type 2 — Payment Request (merchant → buyer)
 *   type 3 — Order Status Update
 *   type 4 — Shipping Update
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useGammaOrderMessages,
  useSendPaymentRequest,
  useSendOrderStatusUpdate,
  useSendShippingUpdate,
} from '@/hooks/useGammaOrders';
import type { GammaOrderStatus, GammaShippingStatus } from '@/hooks/useGammaOrders';
import { useAuthor } from '@/hooks/useAuthor';
import {
  MessageSquare,
  Send,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { genUserName } from '@/lib/genUserName';

// ── Type badges ─────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<number, string> = {
  1: 'Order Created',
  2: 'Payment Request',
  3: 'Status Update',
  4: 'Shipping Update',
};

const TYPE_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  3: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  4: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

// ── Message Row ─────────────────────────────────────────────────────────────────

interface MessageRowProps {
  msg: {
    eventId: string;
    buyerPubkey: string;
    type: number;
    orderId?: string;
    status?: string;
    items?: Array<{ productRef: string; quantity: number }>;
    raw: object;
    createdAt: number;
  };
}

function MessageRow({ msg }: MessageRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const author = useAuthor(msg.buyerPubkey);
  const displayName = author.data?.metadata?.name ?? genUserName(msg.buyerPubkey);

  const { mutate: sendPaymentReq, isPending: isSendingPayment } = useSendPaymentRequest();
  const { mutate: sendStatus, isPending: isSendingStatus } = useSendOrderStatusUpdate();
  const { mutate: sendShipping, isPending: isSendingShipping } = useSendShippingUpdate();

  const [lightningInvoice, setLightningInvoice] = useState('');
  const [replyType, setReplyType] = useState<'payment' | 'status' | 'shipping'>('payment');
  const [statusVal, setStatusVal] = useState<GammaOrderStatus>('confirmed');
  const [shippingStatus, setShippingStatus] = useState<GammaShippingStatus>('shipped');
  const [trackingNum, setTrackingNum] = useState('');
  const [carrier, setCarrier] = useState('');

  const handleSendReply = () => {
    if (!msg.orderId) return;

    if (replyType === 'payment' && lightningInvoice.trim()) {
      sendPaymentReq({
        req: {
          orderId: msg.orderId,
          amountSats: 0, // amount comes from the invoice
          lightning: lightningInvoice.trim(),
        },
        buyerPubkey: msg.buyerPubkey,
      }, { onSuccess: () => setShowReply(false) });
    } else if (replyType === 'status') {
      sendStatus({
        update: { orderId: msg.orderId, status: statusVal },
        recipientPubkey: msg.buyerPubkey,
      }, { onSuccess: () => setShowReply(false) });
    } else if (replyType === 'shipping') {
      sendShipping({
        update: {
          orderId: msg.orderId,
          status: shippingStatus,
          trackingNumber: trackingNum.trim() || undefined,
          carrier: carrier.trim() || undefined,
        },
        buyerPubkey: msg.buyerPubkey,
      }, { onSuccess: () => setShowReply(false) });
    }
  };

  const isSending = isSendingPayment || isSendingStatus || isSendingShipping;

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-3">
        {/* Buyer avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
          {displayName.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{displayName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[msg.type] || 'bg-gray-100 text-gray-700'}`}>
              {TYPE_LABELS[msg.type] || `Type ${msg.type}`}
            </span>
            <Lock className="h-3 w-3 text-muted-foreground" title="Encrypted message" />
          </div>
          {msg.orderId && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Order: {msg.orderId.slice(0, 12)}…
            </p>
          )}
          {msg.status && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Status: <span className="font-medium text-foreground">{msg.status}</span>
            </p>
          )}
          {msg.items && msg.items.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {msg.items.length} item{msg.items.length !== 1 ? 's' : ''}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(msg.createdAt * 1000).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {msg.type === 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReply(!showReply)}
              className="gap-1 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Reply
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="px-2"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Reply form */}
      {showReply && msg.orderId && (
        <div className="border-t px-4 py-3 bg-muted/20 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Reply Type</Label>
            <Select value={replyType} onValueChange={v => setReplyType(v as typeof replyType)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment">💳 Send Payment Request (type 2)</SelectItem>
                <SelectItem value="status">📋 Send Status Update (type 3)</SelectItem>
                <SelectItem value="shipping">📦 Send Shipping Update (type 4)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {replyType === 'payment' && (
            <div className="space-y-1.5">
              <Label htmlFor="ln-invoice" className="text-xs">Lightning Invoice / LUD-16</Label>
              <Input
                id="ln-invoice"
                value={lightningInvoice}
                onChange={e => setLightningInvoice(e.target.value)}
                placeholder="lnbc... or user@wallet.com"
                className="h-8 text-xs font-mono"
              />
            </div>
          )}

          {replyType === 'status' && (
            <div className="space-y-1.5">
              <Label className="text-xs">New Status</Label>
              <Select value={statusVal} onValueChange={v => setStatusVal(v as GammaOrderStatus)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['pending', 'confirmed', 'processing', 'completed', 'cancelled'] as GammaOrderStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {replyType === 'shipping' && (
            <div className="space-y-2">
              <Select value={shippingStatus} onValueChange={v => setShippingStatus(v as GammaShippingStatus)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['processing', 'shipped', 'delivered', 'exception'] as GammaShippingStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={trackingNum}
                  onChange={e => setTrackingNum(e.target.value)}
                  placeholder="Tracking #"
                  className="h-8 text-xs"
                />
                <Input
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  placeholder="Carrier (PostNL…)"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleSendReply}
            disabled={isSending}
            className="gap-1.5 w-full text-xs"
          >
            {isSending ? 'Sending…' : <><Send className="h-3.5 w-3.5" />Send Encrypted Reply</>}
          </Button>
        </div>
      )}

      {/* Expanded raw data */}
      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Decrypted payload:</p>
          <pre className="text-xs font-mono bg-background p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(msg.raw, null, 2)}
          </pre>
          {msg.items && msg.items.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Items:</p>
              <div className="space-y-1">
                {msg.items.map((item, i) => (
                  <div key={i} className="text-xs font-mono bg-background px-2 py-1 rounded border">
                    {item.productRef} × {item.quantity}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────

export function OrderMessaging() {
  const { data: messages = [], isLoading, error } = useGammaOrderMessages();

  const orderMessages = messages.filter(m => m.type === 1);
  const otherMessages = messages.filter(m => m.type !== 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-green-600" />
          Encrypted Order Messages
          <Badge variant="outline" className="text-xs font-mono">kind 16 · NIP-17</Badge>
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gamma Spec encrypted buyer-merchant communication. All messages are end-to-end encrypted.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">New Orders</p>
              <p className="text-lg font-bold">{orderMessages.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">All Messages</p>
              <p className="text-lg font-bold">{messages.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Protocol</p>
              <p className="text-sm font-bold">Gamma</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="py-4 text-center text-sm text-red-600">
            <p>Log in as admin to view encrypted order messages.</p>
          </CardContent>
        </Card>
      )}

      {/* Order messages */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {orderMessages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Pending Orders ({orderMessages.length})
              </p>
              {orderMessages.map(msg => (
                <MessageRow key={msg.eventId} msg={msg} />
              ))}
            </div>
          )}

          {otherMessages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Other Messages ({otherMessages.length})
              </p>
              {otherMessages.map(msg => (
                <MessageRow key={msg.eventId} msg={msg} />
              ))}
            </div>
          )}

          {messages.length === 0 && !isLoading && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <CardTitle className="text-sm mb-1">No Order Messages Yet</CardTitle>
                <CardDescription className="text-xs">
                  Gamma Spec encrypted orders will appear here when buyers place orders.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
