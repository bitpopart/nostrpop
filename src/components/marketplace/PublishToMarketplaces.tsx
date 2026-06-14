import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  NOSTR_MARKETPLACES,
  ADMIN_NPUB,
  ADMIN_HEX_PUBKEY,
  usePublishToMarketplace,
  buildNip99Event,
  buildNip15Event,
  getLastPublished,
  type PublishResult,
} from '@/hooks/usePublishToMarketplace';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { MarketplaceProduct } from '@/lib/sampleProducts';
import {
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Store,
  Eye,
  ShoppingBag,
  Zap,
  Clock,
  Package,
  Download,
  Code2,
  RefreshCw,
  ArrowUpRight,
  Terminal,
} from 'lucide-react';

interface PublishToMarketplacesProps {
  product: MarketplaceProduct;
}

// ─── Relay status row ────────────────────────────────────────────────────────
function RelayStatusRow({ result }: { result: PublishResult }) {
  const label = result.relay.replace('wss://', '');
  const tooltip = [...(result.log ?? []), result.error ? `Error: ${result.error}` : ''].filter(Boolean).join('\n');

  if (result.success) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 cursor-default">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </div>
          </TooltipTrigger>
          {tooltip && <TooltipContent className="max-w-xs whitespace-pre-wrap font-mono text-[10px]"><p>{tooltip}</p></TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 cursor-help">
            <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{label}</span>
            {result.error && <span className="text-[10px] text-red-400 truncate max-w-[120px]">— {result.error}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-pre-wrap font-mono text-[10px]">
          <p>{tooltip || result.error || 'Failed'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Listing preview card ────────────────────────────────────────────────────
function ListingPreview({ product, pubkey }: { product: MarketplaceProduct; pubkey: string }) {
  const [tab, setTab] = useState<'card' | 'nip99' | 'nip15'>('card');

  const nip99 = useMemo(() => buildNip99Event(product, pubkey), [product, pubkey]);
  const nip15 = useMemo(() => buildNip15Event(product), [product]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Listing Preview</h3>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="h-8 text-xs">
          <TabsTrigger value="card" className="text-xs">Card View</TabsTrigger>
          <TabsTrigger value="nip99" className="text-xs">NIP-99 Event</TabsTrigger>
          <TabsTrigger value="nip15" className="text-xs">NIP-15 Event</TabsTrigger>
        </TabsList>

        {/* Card preview — how it roughly looks on marketplace UIs */}
        <TabsContent value="card">
          <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm max-w-xs">
            {/* Image */}
            {product.images.length > 0 ? (
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                {product.type === 'digital' ? (
                  <Download className="h-12 w-12 text-purple-400" />
                ) : (
                  <Package className="h-12 w-12 text-purple-400" />
                )}
              </div>
            )}

            {/* Info */}
            <div className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
                <Badge variant="secondary" className="text-xs whitespace-nowrap flex-shrink-0">
                  {product.type === 'digital' ? '⬇️' : '📦'} {product.type}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 font-bold text-sm text-orange-600 dark:text-orange-400">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  {product.price} {product.currency}
                </div>
                <Badge variant="outline" className="text-xs">{product.category}</Badge>
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {['bitpopart', 'bitcoin-art', product.category.toLowerCase()].map((t) => (
                  <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Seller */}
              <div className="flex items-center gap-1.5 pt-1 border-t">
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {ADMIN_NPUB.slice(0, 12)}…{ADMIN_NPUB.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Approximate card appearance on Shopstr, Plebeian Market, and Conduit.
          </p>
        </TabsContent>

            {/* NIP-99 raw event */}
            <TabsContent value="nip99">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Code2 className="h-3.5 w-3.5" />
                  <span>kind: 30402 — Published to all marketplaces (Shopstr, Plebeian, Conduit, Cypher)</span>
                </div>
            <ScrollArea className="h-56 border rounded-lg">
              <pre className="text-xs p-3 font-mono whitespace-pre-wrap break-all text-foreground/80">
                {JSON.stringify({ ...nip99, content: nip99.content }, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>

            {/* NIP-15 raw event */}
            <TabsContent value="nip15">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Code2 className="h-3.5 w-3.5" />
                  <span>kind: 30018 — Legacy format (NIP-15, no longer published)</span>
                </div>
            <ScrollArea className="h-56 border rounded-lg">
              <pre className="text-xs p-3 font-mono whitespace-pre-wrap break-all text-foreground/80">
                {JSON.stringify(nip15, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Per-marketplace published status pill ───────────────────────────────────
function PublishedPill({ productId, marketplaceId }: { productId: string; marketplaceId: string }) {
  const entry = getLastPublished(productId, marketplaceId);
  if (!entry) return null;

  const date = new Date(entry.publishedAt);
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${
              entry.success
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}
          >
            {entry.success ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
            {label}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{entry.success ? 'Published' : 'Failed'} on {date.toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function PublishToMarketplaces({ product }: PublishToMarketplacesProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'publish' | 'preview' | 'shops'>('publish');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(
    NOSTR_MARKETPLACES.map((m) => m.id)
  );
  const { publishProduct, publishStatuses } = usePublishToMarketplace();
  const { user } = useCurrentUser();

  const status = publishStatuses[product.id];
  const isPublishing = status?.isPublishing ?? false;
  const lastResults = status?.results ?? [];
  const successCount = lastResults.filter((r) => r.success).length;
  const hasResults = lastResults.length > 0;

  const toggleMarketplace = (id: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    await publishProduct(product, selectedMarketplaces);
  };

  const pubkey = user?.pubkey ?? ADMIN_HEX_PUBKEY;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
        >
          <Store className="h-3.5 w-3.5" />
          Publish to Markets
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            Nostr Marketplace Publisher
          </DialogTitle>

          {/* Product mini-bar */}
          <div className="flex items-center gap-3 mt-3 p-3 bg-muted/50 rounded-lg border">
            {product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-10 w-10 rounded-md object-cover flex-shrink-0 border"
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0 border">
                <ShoppingBag className="h-5 w-5 text-purple-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] py-0">{product.category}</Badge>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  {product.price} {product.currency}
                </span>
              </div>
            </div>
            {/* Published status pills */}
            <div className="flex flex-col gap-1 items-end">
              {NOSTR_MARKETPLACES.map((m) => (
                <PublishedPill key={m.id} productId={product.id} marketplaceId={m.id} />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b mt-3 px-6 flex-shrink-0">
          {([
            { id: 'publish', label: 'Publish', icon: Send },
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'shops', label: 'My Shops', icon: Store },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400 font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">

            {/* ── PUBLISH TAB ── */}
            {activeTab === 'publish' && (
              <div className="space-y-4">
                {/* Info */}
                <p className="text-xs text-muted-foreground">
                  Your product is signed with your Nostr key and broadcast as a <strong>NIP-99</strong> classified
                  listing to each marketplace's relay set. Plebeian Market migrated fully to NIP-99 in January 2026,
                  so all four marketplaces now use the same format.
                </p>

                {/* Marketplace selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select marketplaces</p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2"
                        onClick={() => setSelectedMarketplaces(NOSTR_MARKETPLACES.map((m) => m.id))}>
                        All
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2"
                        onClick={() => setSelectedMarketplaces([])}>
                        None
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {NOSTR_MARKETPLACES.map((marketplace) => {
                      const isSelected = selectedMarketplaces.includes(marketplace.id);
                      const marketplaceResults = lastResults.filter((r) => r.marketplaceId === marketplace.id);
                      const marketSuccess = marketplaceResults.filter((r) => r.success).length;
                      const lastPub = getLastPublished(product.id, marketplace.id);

                      return (
                        <div
                          key={marketplace.id}
                          onClick={() => toggleMarketplace(marketplace.id)}
                          className={`rounded-lg border p-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-purple-400 dark:ring-purple-600 bg-purple-50/40 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800'
                              : 'opacity-60 hover:opacity-80 bg-muted/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleMarketplace(marketplace.id)}
                              onClick={(e) => e.stopPropagation()}
                            />

                            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-r ${marketplace.color} text-white text-sm flex-shrink-0`}>
                              {marketplace.logo}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Label className="font-semibold text-sm cursor-pointer">{marketplace.name}</Label>
                                <div className="flex gap-1">
                                  {marketplace.formats.map((fmt) => (
                                    <Badge key={fmt} variant="secondary" className="text-[10px] py-0 px-1">
                                      {fmt === 'nip99' ? 'NIP-99' : 'NIP-15'}
                                    </Badge>
                                  ))}
                                </div>
                                {lastPub && (
                                  <div className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                                    lastPub.success
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    <Clock className="h-2.5 w-2.5" />
                                    Last: {new Date(lastPub.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                                )}
                              </div>

                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{marketplace.description}</p>

                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {marketplace.relays.slice(0, 3).map((relay) => (
                                  <span key={relay} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                    {relay.replace('wss://', '')}
                                  </span>
                                ))}
                                {marketplace.relays.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{marketplace.relays.length - 3}</span>
                                )}
                              </div>
                            </div>

                            <a
                              href={marketplace.shopUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground hover:text-foreground p-1 rounded flex-shrink-0"
                              title={`Visit ${marketplace.name}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>

                          {/* Relay results after publishing */}
                          {marketplaceResults.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-dashed">
                              <p className="text-[10px] text-muted-foreground mb-1">
                                Relay results ({marketSuccess}/{marketplaceResults.length}):
                              </p>
                              <div className="grid grid-cols-2 gap-0.5">
                                {marketplaceResults.map((r, i) => (
                                  <RelayStatusRow key={i} result={r} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Success summary */}
                {hasResults && !isPublishing && (
                  <div className={`rounded-lg border p-3 ${
                    successCount > 0
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {successCount > 0
                        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                        : <XCircle className="h-4 w-4 text-red-500" />}
                      <p className="text-sm font-semibold">
                        {successCount > 0
                          ? `Live on ${successCount} relay${successCount !== 1 ? 's' : ''}!`
                          : 'Publish failed on all relays'}
                      </p>
                    </div>
                    {successCount > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {NOSTR_MARKETPLACES.filter((m) => selectedMarketplaces.includes(m.id)).map((m) => (
                          <a
                            key={m.id}
                            href={m.shopUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline"
                          >
                            {m.logo} {m.name} <ArrowUpRight className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Debug log — full relay transcript */}
                {hasResults && !isPublishing && (
                  <details className="group">
                    <summary className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none list-none">
                      <Terminal className="h-3.5 w-3.5" />
                      Relay debug log
                      <span className="text-[10px] opacity-60">(click to expand)</span>
                    </summary>
                    <ScrollArea className="h-40 mt-2 border rounded-lg bg-black/90 dark:bg-black/70">
                      <div className="p-3 font-mono text-[10px] space-y-0.5">
                        {lastResults.map((r, i) => (
                          <div key={i}>
                            <p className="text-yellow-400/80"># {r.relay.replace('wss://', '')} [{r.marketplaceId}]</p>
                            {(r.log ?? []).map((line, j) => (
                              <p key={j} className={
                                line.startsWith('✓') ? 'text-green-400' :
                                line.startsWith('✗') ? 'text-red-400' :
                                line.startsWith('←') ? 'text-purple-300' :
                                'text-gray-300'
                              }>{line}</p>
                            ))}
                            {!r.success && r.error && !(r.log ?? []).some(l => l.includes(r.error!)) && (
                              <p className="text-red-400">✗ {r.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </details>
                )}
              </div>
            )}

            {/* ── PREVIEW TAB ── */}
            {activeTab === 'preview' && (
              <ListingPreview product={product} pubkey={pubkey} />
            )}

            {/* ── MY SHOPS TAB ── */}
            {activeTab === 'shops' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Direct links to your BitPopArt seller profile on each Nostr marketplace.
                  These pages show all listings you've published with your Nostr key.
                </p>

                <div className="grid gap-3">
                  {NOSTR_MARKETPLACES.map((marketplace) => {
                    const lastPub = getLastPublished(product.id, marketplace.id);

                    return (
                      <Card key={marketplace.id} className={`border ${marketplace.colorLight}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r ${marketplace.color} text-white text-lg flex-shrink-0 shadow-sm`}>
                              {marketplace.logo}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm">{marketplace.name}</p>
                                {lastPub?.success && (
                                  <Badge className="text-[10px] bg-green-500 text-white border-0 py-0">
                                    ✓ Published
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{marketplace.description}</p>

                              <div className="mt-3 space-y-2">
                                {/* My shop link */}
                                <a
                                  href={marketplace.shopUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2.5 rounded-lg border bg-white/70 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 transition-colors group"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium">My Shop Page</p>
                                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                                      {marketplace.shopUrl.replace('https://', '')}
                                    </p>
                                  </div>
                                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-2" />
                                </a>

                                {/* Marketplace home */}
                                <a
                                  href={marketplace.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2.5 rounded-lg border bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors group"
                                >
                                  <div>
                                    <p className="text-xs font-medium">Browse {marketplace.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                      {marketplace.url.replace('https://', '')}
                                    </p>
                                  </div>
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-2" />
                                </a>
                              </div>

                              {/* Relay list */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {marketplace.relays.map((relay) => (
                                  <span key={relay} className="text-[10px] bg-white/60 dark:bg-gray-800/60 border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                    {relay.replace('wss://', '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Nostr identity note */}
                <Card className="border bg-muted/30">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Your Nostr Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 px-4 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12 flex-shrink-0">npub</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all flex-1">
                        {ADMIN_NPUB}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12 flex-shrink-0">hex</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all flex-1">
                        {ADMIN_HEX_PUBKEY}
                      </code>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      All marketplace clients use your Nostr public key to show your shop. No registration needed.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </ScrollArea>

        {/* Footer actions */}
        {activeTab === 'publish' && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20 flex-shrink-0">
            <p className="text-xs text-muted-foreground">
              {selectedMarketplaces.length === 0
                ? 'Select at least one marketplace'
                : `${selectedMarketplaces.length} marketplace${selectedMarketplaces.length !== 1 ? 's' : ''} selected`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                {hasResults ? 'Close' : 'Cancel'}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || selectedMarketplaces.length === 0}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
              >
                {isPublishing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>
                ) : hasResults ? (
                  <><RefreshCw className="h-4 w-4" />Republish</>
                ) : (
                  <><Send className="h-4 w-4" />Publish Now</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
