/**
 * ArtworkSalesManager
 *
 * Admin panel showing all artwork sales/purchases recorded in the order store.
 * Displayed inside Admin → Art tab.
 *
 * Features:
 *  - Filterable/searchable list of artwork orders
 *  - Full order detail: order number, buyer, price, date, shipping address
 *  - Quick status update: mark as shipped, completed, etc.
 *  - One-click "Email Buyer" shortcut
 *  - Alert banner for new unpacked sales
 *  - "Mark artwork as Sold" shortcut to update the Nostr artwork event
 */

import { useState, useMemo } from 'react';
import { useOrders, useUpdateOrderStatus, useDeleteOrder, type Order, type OrderStatus } from '@/hooks/useOrders';
import { useArtworks } from '@/hooks/useArtworks';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Palette, ShoppingCart, Package, Truck, CheckCircle2, Clock, XCircle,
  CreditCard, Mail, MapPin, User, RefreshCw, Search, Filter, Trash2,
  Edit, ChevronDown, ChevronUp, AlertCircle, Zap, ExternalLink,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
  paid:       { label: 'Paid',       color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',   icon: CreditCard },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300', icon: RefreshCw },
  shipped:    { label: 'Shipped',    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300', icon: Truck },
  completed:  { label: 'Completed',  color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',     icon: XCircle },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 text-xs ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Order Detail Dialog ───────────────────────────────────────────────────────

function OrderDetailDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '');
  const [notes, setNotes] = useState(order.notes ?? '');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);

  const item = order.items[0];
  const isPhysical = order.items.some(i => i.type === 'physical');

  const handleSave = () => {
    updateStatus({ orderId: order.id, status: selectedStatus, trackingNumber: trackingNumber || undefined, notes: notes || undefined }, { onSuccess: onClose });
  };

  const emailBody = encodeURIComponent(
    `Hi ${order.buyer_name || 'there'},\n\nThank you for purchasing "${item?.product_name}" from BitPopArt!\n\n` +
    `Order Number: ${order.order_number}\n` +
    `Amount Paid: ${order.total_price} ${order.currency}\n` +
    (trackingNumber ? `Tracking Number: ${trackingNumber}\n` : '') +
    `\nKind regards,\nJohannes\nBitPopArt`
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Artwork Sale — {order.order_number}
          </DialogTitle>
          <DialogDescription>{formatDate(order.created_at)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Artwork + price */}
          <div className="flex items-start gap-4 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
            {item?.image && (
              <img src={item.image} alt={item.product_name} className="h-20 w-20 rounded-lg object-cover flex-shrink-0 shadow" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">{item?.product_name}</p>
              <p className="text-2xl font-extrabold text-green-600 mt-1">{order.total_price} {order.currency}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={order.status} />
                <Badge variant="outline" className="text-xs">⚡ Lightning</Badge>
              </div>
            </div>
          </div>

          {/* Buyer info */}
          {(order.buyer_name || order.buyer_email) && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><User className="h-4 w-4" />Buyer</h4>
              <div className="space-y-1 text-sm bg-muted/40 rounded-lg p-3">
                {order.buyer_name && <p><span className="text-muted-foreground">Name:</span> <strong>{order.buyer_name}</strong></p>}
                {order.buyer_email && (
                  <p>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <a href={`mailto:${order.buyer_email}`} className="underline text-purple-600 font-medium">{order.buyer_email}</a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Shipping address */}
          {order.shipping_address && isPhysical && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><MapPin className="h-4 w-4" />Shipping Address</h4>
              <div className="text-sm bg-muted/40 rounded-lg p-3 space-y-0.5">
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>{order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}{order.shipping_address.postal_code ? ` ${order.shipping_address.postal_code}` : ''}</p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">Notes</p>
              <p className="text-amber-700 dark:text-amber-400">{order.notes}</p>
            </div>
          )}

          <Separator />

          {/* Update form */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Update Sale</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v as OrderStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    {isPhysical && <SelectItem value="shipped">Shipped</SelectItem>}
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isPhysical && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Tracking Number</Label>
                  <Input placeholder="e.g. 1Z999AA10123456784" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Admin Notes</Label>
              <Textarea placeholder="Internal notes about this sale..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2">
            {order.status !== 'completed' && (
              <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" onClick={() => setSelectedStatus('completed')}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark Completed
              </Button>
            )}
            {order.status !== 'shipped' && isPhysical && (
              <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => setSelectedStatus('shipped')}>
                <Truck className="h-3.5 w-3.5 mr-1.5" /> Mark Shipped
              </Button>
            )}
            {order.buyer_email && (
              <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${order.buyer_email}?subject=Your BitPopArt Order ${order.order_number}&body=${emailBody}`, '_blank')}>
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Email Buyer
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => window.open(`mailto:shop@bitpopart.com?subject=Artwork Sale ${order.order_number}`, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open shop@bitpopart.com
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Artwork status updater ───────────────────────────────────────────────────

function MarkArtworkSoldButton({ artworkId, artworkTitle }: { artworkId: string; artworkTitle: string }) {
  const { user } = useCurrentUser();
  const { mutate: publish } = useNostrPublish();
  const { data: artworks = [] } = useArtworks('all');

  const artwork = artworks.find(a => a.id === artworkId);
  if (!artwork?.event || !user) return null;
  if (artwork.sale_type === 'sold') return (
    <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
      <CheckCircle2 className="h-3 w-3 mr-1" /> Already marked sold
    </Badge>
  );

  const handleMark = () => {
    try {
      const content = JSON.parse(artwork.event!.content);
      const tags = artwork.event!.tags.map(t => t[0] === 'sale' ? ['sale', 'sold'] : t);
      if (!tags.find(t => t[0] === 'sale')) tags.push(['sale', 'sold']);
      publish({ kind: 39239, content: JSON.stringify(content), tags });
    } catch {
      // ignore parse errors
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
          <Palette className="h-3.5 w-3.5 mr-1" /> Mark Artwork as Sold
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark "{artworkTitle}" as Sold?</AlertDialogTitle>
          <AlertDialogDescription>
            This will update the Nostr artwork event to show the artwork as sold in the gallery. This cannot be undone without editing the artwork.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMark} className="bg-purple-600 hover:bg-purple-700">Mark as Sold</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Sale row ─────────────────────────────────────────────────────────────────

function SaleRow({ order, onView }: { order: Order; onView: (o: Order) => void }) {
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const [expanded, setExpanded] = useState(false);
  const item = order.items[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Thumbnail */}
          {item?.image ? (
            <img src={item.image} alt={item.product_name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border shadow-sm" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0 border">
              <Palette className="h-5 w-5 text-purple-400" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{order.order_number}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate mt-0.5">{item?.product_name}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
              {order.buyer_name && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <User className="h-3 w-3" /> {order.buyer_name}
                </span>
              )}
              {order.buyer_email && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Mail className="h-3 w-3" /> {order.buyer_email}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-extrabold text-green-600 dark:text-green-400 text-lg">
              {order.total_price} {order.currency}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
              <Zap className="h-2.5 w-2.5" /> Lightning
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {order.status === 'paid' && (
              <Button size="sm" variant="outline" className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => updateStatus({ orderId: order.id, status: 'completed' })}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
              </Button>
            )}
            {order.buyer_email && (
              <Button size="sm" variant="outline" className="h-8" onClick={() =>
                window.open(`mailto:${order.buyer_email}?subject=Your BitPopArt Order ${order.order_number}`, '_blank')}>
                <Mail className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8" onClick={() => onView(order)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive" disabled={isDeleting}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Sale Record?</AlertDialogTitle>
                  <AlertDialogDescription>Remove this sale from your admin panel? This only removes it locally.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => deleteOrder({ orderId: order.id })}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {order.shipping_address && (
              <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span>
                  {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.country}
                </span>
              </div>
            )}
            {order.tracking_number && (
              <div className="text-xs flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-muted-foreground">Tracking:</span>
                <span className="font-mono">{order.tracking_number}</span>
              </div>
            )}
            {item && (
              <div className="mt-2">
                <MarkArtworkSoldButton artworkId={item.product_id} artworkTitle={item.product_name} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ArtworkSalesManager() {
  const { data: allOrders = [], isLoading, refetch, isFetching } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Filter to artwork orders only
  const artworkOrders = useMemo(() =>
    allOrders.filter(o =>
      o.items.some(i =>
        i.product_id?.startsWith('artwork') ||
        i.category === 'Artwork' ||
        // Orders saved from artwork stall_id
        o.items.some(item => item.type === 'digital' && (
          item.product_id.toLowerCase().includes('art') ||
          item.product_name.toLowerCase().includes('art') ||
          item.product_name.toLowerCase().includes('painting') ||
          item.product_name.toLowerCase().includes('print')
        ))
      ) ||
      // Catch anything from art-gallery stall (stored in order notes/source)
      o.notes?.includes('art') ||
      o.source === 'checkout'
    ),
    [allOrders]
  );

  // For art admin, show ALL orders from checkout (paintings are checkout type)
  // but let admin filter — just show all orders with artsy names or digital type
  const salesOrders = useMemo(() => {
    // Show all orders — admin can filter. Artwork orders arrive via OrderConfirmation
    return allOrders;
  }, [allOrders]);

  const filtered = useMemo(() => {
    return salesOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch = !searchQuery ||
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(i => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [salesOrders, statusFilter, searchQuery]);

  // Stats
  const newSales = salesOrders.filter(o => o.status === 'paid' || o.status === 'pending').length;
  const completedSales = salesOrders.filter(o => o.status === 'completed').length;
  const totalRevenue = salesOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.currency === 'SAT' ? o.total_price / 100_000_000 : o.total_price), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-purple-500" />
            Artwork Sales
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            All purchases recorded through the BitPopArt checkout
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'New Sales', value: newSales, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Clock },
          { label: 'Completed', value: completedSales, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
          { label: 'Total Orders', value: salesOrders.length, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: Palette },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border-0 shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-6 w-6 ${s.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New sales alert */}
      {newSales > 0 && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                {newSales} new sale{newSales !== 1 ? 's' : ''} waiting for your attention
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                Open each order to email the buyer and update the status
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email reminder */}
      <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Mail className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Notification email — shop@bitpopart.com</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              When a buyer completes checkout, an email draft is automatically opened so they can send their details to <strong>shop@bitpopart.com</strong>.
              If you missed a sale, use the <strong>Email Buyer</strong> button below to follow up.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders, buyers, artworks…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v as OrderStatus | 'all')}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted/40" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
            <CardTitle className="text-lg mb-2">
              {salesOrders.length === 0 ? 'No Sales Yet' : 'No Matching Sales'}
            </CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              {salesOrders.length === 0
                ? 'Artwork purchases will appear here automatically once a buyer completes checkout.'
                : 'Try adjusting your search or filter.'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Showing {filtered.length} of {salesOrders.length} sale{salesOrders.length !== 1 ? 's' : ''}</p>
          {filtered.map(order => (
            <SaleRow key={order.id} order={order} onView={setViewingOrder} />
          ))}
        </div>
      )}

      {viewingOrder && (
        <OrderDetailDialog order={viewingOrder} open={!!viewingOrder} onClose={() => setViewingOrder(null)} />
      )}
    </div>
  );
}
