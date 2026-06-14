import { useState } from 'react';
import {
  useOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
  type Order,
  type OrderStatus,
} from '@/hooks/useOrders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Package,
  Download,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  ShoppingCart,
  Mail,
  MapPin,
  User,
  CreditCard,
  Trash2,
  Edit,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    icon: Clock,
  },
  paid: {
    label: 'Paid',
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    icon: CreditCard,
  },
  processing: {
    label: 'Processing',
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    icon: RefreshCw,
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    icon: Truck,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── Order Detail Dialog ───────────────────────────────────────────────────────

function OrderDetailDialog({
  order,
  open,
  onClose,
}: {
  order: Order;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '');
  const [notes, setNotes] = useState(order.notes ?? '');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);

  const hasPhysical = order.items.some((i) => i.type === 'physical');
  const hasDigital = order.items.some((i) => i.type === 'digital');

  const handleSave = () => {
    updateStatus(
      {
        orderId: order.id,
        status: selectedStatus,
        trackingNumber: trackingNumber || undefined,
        notes: notes || undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Order {order.order_number}
          </DialogTitle>
          <DialogDescription>
            {formatDate(order.created_at)} · via {order.source === 'nip15' ? 'NIP-15 Nostr' : order.source === 'checkout' ? 'Checkout' : 'Manual'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {order.shipped_at && (
              <span className="text-xs text-muted-foreground">
                Shipped {formatDate(order.shipped_at)}
              </span>
            )}
            {hasDigital && order.digital_downloaded && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <Download className="h-3 w-3 mr-1" />
                Downloaded {order.digital_downloaded_at ? formatDate(order.digital_downloaded_at) : ''}
              </Badge>
            )}
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Order Items</h4>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                  {item.image ? (
                    <img src={item.image} alt={item.product_name} className="h-10 w-10 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      {item.type === 'digital' ? <Download className="h-4 w-4 text-muted-foreground" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} · {item.price} {item.currency} ·{' '}
                      <Badge variant="secondary" className="text-[10px] py-0 px-1">
                        {item.type === 'digital' ? '⬇ Digital' : '📦 Physical'}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sm font-bold">Total: {order.total_price} {order.currency}</span>
            </div>
          </div>

          <Separator />

          {/* Buyer info */}
          {(order.buyer_name || order.buyer_email || order.buyer_npub) && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <User className="h-4 w-4" /> Buyer
              </h4>
              <div className="space-y-1 text-sm">
                {order.buyer_name && <p><span className="text-muted-foreground">Name:</span> {order.buyer_name}</p>}
                {order.buyer_email && (
                  <p>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <a href={`mailto:${order.buyer_email}`} className="underline text-orange-600">{order.buyer_email}</a>
                  </p>
                )}
                {order.buyer_npub && <p className="font-mono text-xs break-all"><span className="text-muted-foreground">npub:</span> {order.buyer_npub}</p>}
              </div>
            </div>
          )}

          {/* Shipping address */}
          {order.shipping_address && hasPhysical && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Shipping Address
              </h4>
              <div className="text-sm bg-muted/40 rounded-lg p-3 space-y-0.5">
                <p>{order.shipping_address.line1}</p>
                {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                <p>
                  {order.shipping_address.city}
                  {order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}
                  {order.shipping_address.postal_code ? ` ${order.shipping_address.postal_code}` : ''}
                </p>
                <p>{order.shipping_address.country}</p>
              </div>
            </div>
          )}

          {order.payment_method && (
            <p className="text-sm">
              <span className="text-muted-foreground">Payment:</span> {order.payment_method}
            </p>
          )}

          {order.notes && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Notes</h4>
              <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2">{order.notes}</p>
            </div>
          )}

          <Separator />

          {/* Update status */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Update Order</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status-select" className="text-xs">Status</Label>
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as OrderStatus)}>
                  <SelectTrigger id="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    {hasPhysical && <SelectItem value="shipped">Shipped</SelectItem>}
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasPhysical && (
                <div className="space-y-1.5">
                  <Label htmlFor="tracking" className="text-xs">Tracking Number</Label>
                  <Input
                    id="tracking"
                    placeholder="e.g. 1Z999AA10123456784"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Admin Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes about this order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2">
            {order.status !== 'shipped' && hasPhysical && (
              <Button
                size="sm"
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => {
                  setSelectedStatus('shipped');
                }}
              >
                <Truck className="h-3.5 w-3.5 mr-1.5" />
                Mark as Shipped
              </Button>
            )}
            {order.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => {
                  setSelectedStatus('completed');
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Mark Completed
              </Button>
            )}
            {order.buyer_email && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `mailto:${order.buyer_email}?subject=Your Order ${order.order_number}`,
                    '_blank'
                  )
                }
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" />
                Email Buyer
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Row ─────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  onView,
}: {
  order: Order;
  onView: (order: Order) => void;
}) {
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const [expanded, setExpanded] = useState(false);

  const hasPhysical = order.items.some((i) => i.type === 'physical');
  const hasDigital = order.items.some((i) => i.type === 'digital');
  const itemSummary = order.items.map((i) => i.product_name).join(', ');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Main row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Order number + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{order.order_number}</span>
              <StatusBadge status={order.status} />
              {hasDigital && (
                <Badge variant="outline" className="text-[10px] py-0 bg-blue-50 text-blue-700 border-blue-200">
                  ⬇ Digital
                </Badge>
              )}
              {hasPhysical && (
                <Badge variant="outline" className="text-[10px] py-0 bg-gray-50 text-gray-700 border-gray-200">
                  📦 Physical
                </Badge>
              )}
              {hasDigital && order.digital_downloaded && (
                <Badge variant="outline" className="text-[10px] py-0 bg-green-50 text-green-700 border-green-200">
                  ✓ Downloaded
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{itemSummary}</p>
            <div className="flex items-center gap-3 mt-0.5">
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
            <p className="font-bold text-green-600 dark:text-green-400">
              {order.total_price} {order.currency}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick ship button for paid physical orders */}
            {order.status === 'paid' && hasPhysical && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => updateStatus({ orderId: order.id, status: 'shipped' })}
              >
                <Truck className="h-3.5 w-3.5 mr-1" />
                Ship
              </Button>
            )}
            {/* Quick complete button for shipped / digital paid */}
            {(order.status === 'shipped' || (order.status === 'paid' && hasDigital && !hasPhysical)) && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => updateStatus({ orderId: order.id, status: 'completed' })}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Done
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => onView(order)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => setExpanded((e) => !e)}
            >
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
                  <AlertDialogTitle>Delete Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    Remove order {order.order_number} from the admin panel? This only affects the local view — no Nostr event is deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => deleteOrder({ orderId: order.id })}
                  >
                    Delete
                  </AlertDialogAction>
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
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  {order.shipping_address.line1},{' '}
                  {order.shipping_address.city},{' '}
                  {order.shipping_address.country}
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
            {order.notes && (
              <div className="text-xs flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{order.notes}</span>
              </div>
            )}
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-muted/40 rounded p-2">
                {item.image && <img src={item.image} alt={item.product_name} className="h-8 w-8 rounded object-cover flex-shrink-0" />}
                <span className="flex-1 truncate">{item.product_name}</span>
                <span className="text-muted-foreground">× {item.quantity}</span>
                <span className="font-medium">{item.price} {item.currency}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrdersManagement() {
  const { data: orders, isLoading, refetch, isFetching } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'physical' | 'digital'>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Stats
  const allOrders = orders ?? [];
  const pendingCount = allOrders.filter((o) => o.status === 'pending').length;
  const paidCount = allOrders.filter((o) => o.status === 'paid').length;
  const shippedCount = allOrders.filter((o) => o.status === 'shipped').length;
  const completedCount = allOrders.filter((o) => o.status === 'completed').length;
  const digitalUndownloaded = allOrders.filter(
    (o) => o.items.some((i) => i.type === 'digital') && !o.digital_downloaded && o.status !== 'cancelled'
  ).length;

  // Filtered list
  const filtered = allOrders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType =
      typeFilter === 'all' ||
      order.items.some((i) => i.type === typeFilter);
    const matchesSearch =
      !searchQuery ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-orange-500" />
            Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track purchases, manage shipping, and confirm digital downloads
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'New Orders', value: pendingCount + paidCount, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Clock },
          { label: 'To Ship', value: paidCount, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: Package },
          { label: 'Shipped', value: shippedCount, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: Truck },
          { label: 'Completed', value: completedCount, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
          { label: 'Digital Pending', value: digitalUndownloaded, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: Download },
        ].map((stat) => (
          <Card key={stat.label} className={`${stat.bg} border-0 shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 ${stat.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert for unshipped physical orders */}
      {paidCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-800 dark:text-orange-300">
              <strong>{paidCount}</strong> paid order{paidCount !== 1 ? 's' : ''} waiting to be shipped or fulfilled.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Digital download alert */}
      {digitalUndownloaded > 0 && (
        <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-800">
          <CardContent className="p-4 flex items-center gap-3">
            <Download className="h-5 w-5 text-indigo-600 flex-shrink-0" />
            <p className="text-sm text-indigo-800 dark:text-indigo-300">
              <strong>{digitalUndownloaded}</strong> digital order{digitalUndownloaded !== 1 ? 's' : ''} — download not yet confirmed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, buyers, products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
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
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'physical' | 'digital')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-lg mb-2">
              {allOrders.length === 0 ? 'No Orders Yet' : 'No Matching Orders'}
            </CardTitle>
            <CardDescription className="max-w-sm mx-auto">
              {allOrders.length === 0
                ? 'Orders placed through your shop or via NIP-15 Nostr DMs will appear here automatically.'
                : 'Try adjusting your search or filter criteria.'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {allOrders.length} orders
          </p>
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} onView={setViewingOrder} />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      {viewingOrder && (
        <OrderDetailDialog
          order={viewingOrder}
          open={!!viewingOrder}
          onClose={() => setViewingOrder(null)}
        />
      )}
    </div>
  );
}
