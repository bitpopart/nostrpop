import { useState, useRef } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import {
  useOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
  getStoredOrders,
  type Order,
  type OrderStatus,
} from '@/hooks/useOrders';
import { formatCurrency } from '@/hooks/usePayment';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Printer,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileText,
  ArrowLeft,
  Zap,
  Globe,
  Copy,
  CheckCheck,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800', icon: Clock },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', icon: CreditCard },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800', icon: RefreshCw },
  shipped: { label: 'Shipped', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800', icon: Truck },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', icon: XCircle },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── PDF / Print Order Template ───────────────────────────────────────────────

function OrderPrintTemplate({ order, onClose }: { order: Order; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const hasPhysical = order.items.some(i => i.type === 'physical');

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${order.order_number} — BitPopArt</title>
          <meta charset="UTF-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 28px; }
            .brand { font-size: 26px; font-weight: 900; color: #f97316; letter-spacing: -0.5px; }
            .brand-sub { font-size: 11px; color: #888; margin-top: 2px; }
            .order-badge { background: #fff7ed; border: 2px solid #f97316; border-radius: 8px; padding: 10px 18px; text-align: right; }
            .order-badge .num { font-size: 18px; font-weight: 800; color: #ea580c; }
            .order-badge .lbl { font-size: 11px; color: #888; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
            .info-row .key { color: #666; }
            .info-row .val { font-weight: 600; text-align: right; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #fff7ed; color: #ea580c; font-weight: 700; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
            tr:last-child td { border-bottom: none; }
            .totals { margin-top: 16px; padding: 16px; background: #fff7ed; border-radius: 8px; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
            .total-row.grand { font-size: 17px; font-weight: 800; color: #ea580c; border-top: 2px solid #f97316; margin-top: 8px; padding-top: 8px; }
            .address-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.7; }
            .status-chip { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #dcfce7; color: #166534; }
            .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; font-size: 11px; color: #aaa; }
            .lightning { color: #eab308; font-weight: 700; }
            @media print {
              body { padding: 20px; }
              button { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = function(){ window.print(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const emailBody = [
    `Order: ${order.order_number}`,
    `Date: ${fmtDateShort(order.created_at)}`,
    `Status: ${STATUS_CONFIG[order.status].label}`,
    '',
    '— ITEMS —',
    ...order.items.map(i => `  • ${i.product_name}  ×${i.quantity}  ${i.price} ${i.currency}`),
    '',
    `Total: ${order.total_price} ${order.currency}`,
    `Payment: ${order.payment_method ?? 'Lightning'}`,
    '',
    order.buyer_name ? `Buyer: ${order.buyer_name}` : '',
    order.buyer_email ? `Email: ${order.buyer_email}` : '',
    '',
    hasPhysical && order.shipping_address ? [
      '— SHIP TO —',
      order.shipping_address.line1,
      order.shipping_address.line2 ?? '',
      `${order.shipping_address.city}${order.shipping_address.state ? ', ' + order.shipping_address.state : ''} ${order.shipping_address.postal_code}`,
      order.shipping_address.country,
    ].filter(Boolean).join('\n') : '',
    order.tracking_number ? `Tracking: ${order.tracking_number}` : '',
    order.notes ? `Notes: ${order.notes}` : '',
  ].filter(line => line !== undefined).join('\n').trim();

  const copyOrderText = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`Order ${order.order_number} — BitPopArt`);
    const body = encodeURIComponent(emailBody);
    window.open(`mailto:shop@bitpopart.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-orange-500" />
            Order Document — {order.order_number}
          </DialogTitle>
        </DialogHeader>

        {/* Action bar */}
        <div className="flex gap-2 px-6 py-3 bg-muted/30 border-b flex-wrap">
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Print / Save PDF
          </Button>
          <Button size="sm" variant="outline" onClick={copyOrderText} className="gap-1.5">
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy order text'}
          </Button>
          <Button size="sm" variant="outline" onClick={openEmail} className="gap-1.5 text-orange-700 border-orange-200 hover:bg-orange-50">
            <Mail className="h-3.5 w-3.5" /> Email to shop@bitpopart.com
          </Button>
        </div>

        {/* The printable template */}
        <div className="px-6 py-5" ref={printRef}>
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-orange-400 pb-5 mb-6">
            <div>
              <div className="text-2xl font-black text-orange-500 tracking-tight">BitPopArt</div>
              <div className="text-xs text-muted-foreground mt-0.5">shop@bitpopart.com · bitpopart.com</div>
              <div className="mt-3">
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div className="text-right bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-5 py-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Order</div>
              <div className="text-xl font-black text-orange-600 mt-0.5">{order.order_number}</div>
              <div className="text-xs text-muted-foreground mt-1">{fmtDateShort(order.created_at)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Buyer */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <User className="h-3 w-3" /> Customer
              </div>
              <div className="space-y-1 text-sm">
                {order.buyer_name && <p className="font-semibold">{order.buyer_name}</p>}
                {order.buyer_email && (
                  <p className="text-orange-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <a href={`mailto:${order.buyer_email}`}>{order.buyer_email}</a>
                  </p>
                )}
                {order.buyer_npub && (
                  <p className="text-xs font-mono text-muted-foreground break-all">{order.buyer_npub}</p>
                )}
                {!order.buyer_name && !order.buyer_email && (
                  <p className="text-muted-foreground italic text-xs">No buyer info provided</p>
                )}
              </div>
            </div>

            {/* Ship-to */}
            {hasPhysical && order.shipping_address && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Ship To
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed">
                  {order.buyer_name && <p className="font-semibold">{order.buyer_name}</p>}
                  <p>{order.shipping_address.line1}</p>
                  {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                  <p>
                    {order.shipping_address.city}
                    {order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}
                    {order.shipping_address.postal_code ? ` ${order.shipping_address.postal_code}` : ''}
                  </p>
                  <p className="font-semibold flex items-center gap-1 mt-0.5">
                    <Globe className="h-3 w-3" /> {order.shipping_address.country}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <Package className="h-3 w-3" /> Order Items
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orange-50 dark:bg-orange-900/20">
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">Product</th>
                    <th className="text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">Type</th>
                    <th className="text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">Price</th>
                    <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} className="border-t border-muted">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.image && (
                            <img src={item.image} alt={item.product_name} className="h-9 w-9 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="font-medium">{item.product_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.type === 'digital' ? '⬇ Digital' : '📦 Physical'}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.price / item.quantity, item.currency)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.price, item.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-3 flex justify-end">
              <div className="w-64 space-y-1.5 bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 border border-orange-100 dark:border-orange-900">
                {order.items.length > 1 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.items.reduce((s, i) => s + i.price, 0), order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-orange-600 border-t border-orange-200 dark:border-orange-800 pt-1.5">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_price, order.currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" /> Payment</span>
                  <span>{order.payment_method ?? 'Lightning'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking / notes */}
          {(order.tracking_number || order.notes) && (
            <div className="mt-4 space-y-3">
              {order.tracking_number && (
                <div className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg p-3">
                  <Truck className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Tracking:</span>
                  <span className="font-mono font-semibold">{order.tracking_number}</span>
                </div>
              )}
              {order.notes && (
                <div className="text-sm bg-muted/40 rounded-lg p-3">
                  <span className="text-muted-foreground font-medium">Notes: </span>
                  {order.notes}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
            <span>BitPopArt · shop@bitpopart.com</span>
            <span>Generated {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Detail / Edit Dialog ────────────────────────────────────────────────

function OrderEditDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '');
  const [notes, setNotes] = useState(order.notes ?? '');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const hasPhysical = order.items.some(i => i.type === 'physical');

  const handleSave = () => {
    updateStatus(
      { orderId: order.id, status: selectedStatus, trackingNumber: trackingNumber || undefined, notes: notes || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-orange-500" />
            Edit Order {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground">{fmtDate(order.created_at)}</span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Update Status</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v as OrderStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label className="text-xs">Tracking Number</Label>
                  <Input placeholder="e.g. 1Z999AA…" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Admin Notes</Label>
              <Textarea placeholder="Internal notes…" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {hasPhysical && order.status !== 'shipped' && (
              <Button size="sm" variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => setSelectedStatus('shipped')}>
                <Truck className="h-3.5 w-3.5 mr-1.5" /> Mark Shipped
              </Button>
            )}
            {order.status !== 'completed' && (
              <Button size="sm" variant="outline" className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => setSelectedStatus('completed')}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark Completed
              </Button>
            )}
            {order.buyer_email && (
              <Button size="sm" variant="outline" onClick={() =>
                window.open(`mailto:${order.buyer_email}?subject=Your Order ${order.order_number} — BitPopArt`, '_blank')
              }>
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Email Buyer
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white">
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
  onEdit,
  onPrint,
}: {
  order: Order;
  onEdit: (order: Order) => void;
  onPrint: (order: Order) => void;
}) {
  const { mutate: updateStatus } = useUpdateOrderStatus();
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();
  const [expanded, setExpanded] = useState(false);
  const hasPhysical = order.items.some(i => i.type === 'physical');
  const hasDigital = order.items.some(i => i.type === 'digital');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Order info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm font-mono">{order.order_number}</span>
              <StatusBadge status={order.status} />
              {hasDigital && <Badge variant="outline" className="text-[10px] py-0 bg-blue-50 text-blue-700 border-blue-200">⬇ Digital</Badge>}
              {hasPhysical && <Badge variant="outline" className="text-[10px] py-0 bg-gray-50 text-gray-700 border-gray-200">📦 Physical</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {order.items.map(i => i.product_name).join(', ')}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-0.5">
              <span className="text-xs text-muted-foreground">{fmtDate(order.created_at)}</span>
              {order.buyer_name && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><User className="h-3 w-3" />{order.buyer_name}</span>}
              {order.buyer_email && <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Mail className="h-3 w-3" />{order.buyer_email}</span>}
              {order.shipping_address?.country && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Globe className="h-3 w-3" />{order.shipping_address.country}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-green-600 dark:text-green-400">
              {formatCurrency(order.total_price, order.currency)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {order.status === 'paid' && hasPhysical && (
              <Button size="sm" variant="outline" className="h-8 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={() => updateStatus({ orderId: order.id, status: 'shipped' })}>
                <Truck className="h-3.5 w-3.5 mr-1" /> Ship
              </Button>
            )}
            {(order.status === 'shipped' || (order.status === 'paid' && hasDigital && !hasPhysical)) && (
              <Button size="sm" variant="outline" className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => updateStatus({ orderId: order.id, status: 'completed' })}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
              </Button>
            )}

            <Button size="sm" variant="outline" className="h-8" onClick={() => onPrint(order)} title="Print / PDF">
              <Printer className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => onEdit(order)} title="Edit">
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
                  <AlertDialogTitle>Delete Order</AlertDialogTitle>
                  <AlertDialogDescription>Remove {order.order_number} from the dashboard? This only affects the local view.</AlertDialogDescription>
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
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-orange-400" />
                <span>
                  {order.shipping_address.line1}, {order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''} {order.shipping_address.postal_code} — {order.shipping_address.country}
                </span>
              </div>
            )}
            {order.tracking_number && (
              <div className="text-xs flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-muted-foreground">Tracking:</span>
                <span className="font-mono font-semibold">{order.tracking_number}</span>
              </div>
            )}
            {order.notes && (
              <div className="text-xs flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{order.notes}</span>
              </div>
            )}
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-muted/40 rounded-lg p-2.5">
                {item.image && <img src={item.image} alt={item.product_name} className="h-8 w-8 rounded object-cover flex-shrink-0" />}
                <span className="flex-1 truncate font-medium">{item.product_name}</span>
                <span className="text-muted-foreground">×{item.quantity}</span>
                <span className="font-semibold">{formatCurrency(item.price, item.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Revenue Stats ─────────────────────────────────────────────────────────────

function RevenueStats({ orders }: { orders: Order[] }) {
  const active = orders.filter(o => o.status !== 'cancelled');
  const completed = orders.filter(o => o.status === 'completed');
  const totalRevenue = active.reduce((s, o) => s + o.total_price, 0);
  const completedRevenue = completed.reduce((s, o) => s + o.total_price, 0);
  const currency = orders[0]?.currency ?? 'USD';
  const physical = active.filter(o => o.items.some(i => i.type === 'physical')).length;
  const digital = active.filter(o => o.items.some(i => i.type === 'digital')).length;
  const toShip = orders.filter(o => o.status === 'paid' && o.items.some(i => i.type === 'physical')).length;
  const thisMonth = active.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue, currency), sub: `${active.length} orders`, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: DollarSign },
    { label: 'Completed Revenue', value: formatCurrency(completedRevenue, currency), sub: `${completed.length} completed`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: TrendingUp },
    { label: 'This Month', value: `${thisMonth}`, sub: 'orders placed', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: BarChart3 },
    { label: 'To Ship', value: `${toShip}`, sub: `${physical} physical total`, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: Truck },
    { label: 'Digital Orders', value: `${digital}`, sub: 'in all time', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: Download },
    { label: 'Pending/Paid', value: `${orders.filter(o => ['pending','paid'].includes(o.status)).length}`, sub: 'need action', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: Clock },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(s => (
        <Card key={s.label} className={`${s.bg} border-0 shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                <p className={`text-xl font-black mt-0.5 ${s.color} truncate`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
              <s.icon className={`h-5 w-5 ${s.color} opacity-60 flex-shrink-0 mt-0.5`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Orders Page ──────────────────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { data: orders, isLoading, refetch, isFetching } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'physical' | 'digital'>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  useSeoMeta({
    title: 'Orders — BitPopArt Admin',
    robots: 'noindex, nofollow',
  });

  const allOrders = orders ?? [];

  const filtered = allOrders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchType = typeFilter === 'all' || o.items.some(i => i.type === typeFilter);
    const matchSearch = !searchQuery ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shipping_address?.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(i => i.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchType && matchSearch;
  });

  const paidCount = allOrders.filter(o => o.status === 'paid').length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Log in to view and manage orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginArea className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Only the BitPopArt admin can view orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/shop')}>← Back to Shop</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 via-background to-pink-50/40 dark:from-gray-900 dark:via-background dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Admin
              </Button>
            </div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-orange-500" />
              Orders
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All sales · manage shipping · print order documents · shop@bitpopart.com
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/shop?tab=admin')}>
              <Package className="h-4 w-4 mr-1.5" /> Shop Admin
            </Button>
          </div>
        </div>

        {/* Revenue Stats */}
        {allOrders.length > 0 && <RevenueStats orders={allOrders} />}

        {/* Alerts */}
        {paidCount > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-800 dark:text-orange-300">
                <strong>{paidCount}</strong> paid order{paidCount !== 1 ? 's' : ''} waiting to be shipped or fulfilled.
              </p>
              <Button size="sm" variant="outline" className="ml-auto border-orange-300 text-orange-700"
                onClick={() => setStatusFilter('paid')}>
                View
              </Button>
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
                  placeholder="Search by order #, buyer, product, country…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as OrderStatus | 'all')}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
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
                <Select value={typeFilter} onValueChange={v => setTypeFilter(v as 'all' | 'physical' | 'digital')}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
                {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
                  <Button size="sm" variant="ghost" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchQuery(''); }}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
              <CardTitle className="text-lg">
                {allOrders.length === 0 ? 'No Orders Yet' : 'No Matching Orders'}
              </CardTitle>
              <CardDescription className="max-w-sm mx-auto">
                {allOrders.length === 0
                  ? 'Orders placed through your shop will appear here automatically after payment.'
                  : 'Try adjusting your search or filters.'}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Showing <strong>{filtered.length}</strong> of <strong>{allOrders.length}</strong> orders
            </p>
            {filtered.map(order => (
              <OrderRow key={order.id} order={order} onEdit={setEditingOrder} onPrint={setPrintingOrder} />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {editingOrder && <OrderEditDialog order={editingOrder} onClose={() => setEditingOrder(null)} />}
      {printingOrder && <OrderPrintTemplate order={printingOrder} onClose={() => setPrintingOrder(null)} />}
    </div>
  );
}
