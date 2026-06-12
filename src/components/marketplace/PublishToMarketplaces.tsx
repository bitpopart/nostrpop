import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  usePublishToMarketplace,
  type PublishResult,
} from '@/hooks/usePublishToMarketplace';
import type { MarketplaceProduct } from '@/lib/sampleProducts';
import {
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Store,
  Info,
  ShoppingBag,
  Zap,
} from 'lucide-react';

interface PublishToMarketplacesProps {
  product: MarketplaceProduct;
}

function RelayStatusBadge({ result }: { result: PublishResult }) {
  if (result.success) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate max-w-[180px]">{result.relay.replace('wss://', '')}</span>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 cursor-help">
            <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate max-w-[180px]">{result.relay.replace('wss://', '')}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{result.error ?? 'Failed'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PublishToMarketplaces({ product }: PublishToMarketplacesProps) {
  const [open, setOpen] = useState(false);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(
    NOSTR_MARKETPLACES.map((m) => m.id)
  );
  const { publishProduct, publishStatuses } = usePublishToMarketplace();

  const status = publishStatuses[product.id];
  const isPublishing = status?.isPublishing ?? false;
  const lastResults = status?.results ?? [];

  const toggleMarketplace = (id: string) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    await publishProduct(product, selectedMarketplaces);
  };

  const successCount = lastResults.filter((r) => r.success).length;
  const hasResults = lastResults.length > 0;

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

      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            Publish to Nostr Marketplaces
          </DialogTitle>
          <DialogDescription>
            Broadcast{' '}
            <span className="font-medium text-foreground">"{product.name}"</span> to Nostr-powered
            marketplaces. Your product will be discoverable by buyers on each platform.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-5 py-2">
            {/* Product Preview */}
            <Card className="bg-muted/40">
              <CardContent className="p-4 flex gap-4">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-16 w-16 rounded-lg object-cover flex-shrink-0 border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0 border">
                    <ShoppingBag className="h-7 w-7 text-purple-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {product.type === 'digital' ? '⬇️ Digital' : '📦 Physical'}
                    </Badge>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-yellow-500" />
                      {product.price} {product.currency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Format Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">How it works</p>
                <p className="text-xs mt-0.5 text-blue-600 dark:text-blue-400">
                  Your product is published as a signed Nostr event to multiple relays.{' '}
                  <strong>NIP-99</strong> (Shopstr, Conduit, Cypher) and{' '}
                  <strong>NIP-15</strong> (Plebeian Market, Cypher) formats are created automatically so
                  your listing appears natively on each platform.
                </p>
              </div>
            </div>

            {/* Marketplace Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Select Marketplaces</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedMarketplaces(NOSTR_MARKETPLACES.map((m) => m.id))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedMarketplaces([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {NOSTR_MARKETPLACES.map((marketplace) => {
                  const isSelected = selectedMarketplaces.includes(marketplace.id);
                  const marketplaceResults = lastResults.filter(
                    (r) => r.marketplaceId === marketplace.id
                  );
                  const marketSuccess = marketplaceResults.filter((r) => r.success).length;

                  return (
                    <Card
                      key={marketplace.id}
                      className={`transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-purple-400 dark:ring-purple-600 bg-purple-50/50 dark:bg-purple-900/10'
                          : 'opacity-60'
                      }`}
                      onClick={() => toggleMarketplace(marketplace.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={marketplace.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleMarketplace(marketplace.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Label
                                htmlFor={marketplace.id}
                                className="font-semibold text-sm cursor-pointer flex items-center gap-1.5"
                              >
                                <span
                                  className={`inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-r ${marketplace.color} text-white text-xs`}
                                >
                                  {marketplace.logo}
                                </span>
                                {marketplace.name}
                              </Label>

                              <div className="flex gap-1">
                                {marketplace.formats.map((fmt) => (
                                  <Badge
                                    key={fmt}
                                    variant="secondary"
                                    className="text-xs py-0 px-1.5"
                                  >
                                    {fmt === 'nip99' ? 'NIP-99' : 'NIP-15'}
                                  </Badge>
                                ))}
                              </div>

                              <a
                                href={marketplace.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 ml-auto"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1">
                              {marketplace.description}
                            </p>

                            {/* Relay list */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {marketplace.relays.slice(0, 3).map((relay) => (
                                <span
                                  key={relay}
                                  className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono"
                                >
                                  {relay.replace('wss://', '')}
                                </span>
                              ))}
                              {marketplace.relays.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{marketplace.relays.length - 3} more
                                </span>
                              )}
                            </div>

                            {/* Publish results for this marketplace */}
                            {marketplaceResults.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <Separator className="my-2" />
                                <p className="text-xs font-medium">
                                  Publish results ({marketSuccess}/{marketplaceResults.length} relays):
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {marketplaceResults.map((r, i) => (
                                    <RelayStatusBadge key={i} result={r} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Overall Results Summary */}
            {hasResults && !isPublishing && (
              <Card
                className={`${
                  successCount > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {successCount > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {successCount > 0
                      ? `Published to ${successCount} relay${successCount !== 1 ? 's' : ''}!`
                      : 'Publish failed'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {successCount > 0
                      ? `Your product is now live on the selected Nostr marketplaces. Buyers can discover it using your Nostr public key.`
                      : `All relays rejected the event or timed out. Check your Nostr signer and try again.`}
                  </CardDescription>
                </CardHeader>
                {successCount > 0 && (
                  <CardContent className="pb-4 px-4 pt-0">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {NOSTR_MARKETPLACES.filter((m) =>
                        selectedMarketplaces.includes(m.id)
                      ).map((m) => (
                        <a
                          key={m.id}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-0.5"
                        >
                          {m.name}
                          <ExternalLink className="h-3 w-3 ml-0.5" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t mt-2 flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            {selectedMarketplaces.length === 0
              ? 'Select at least one marketplace'
              : `Publishing to ${selectedMarketplaces.length} marketplace${selectedMarketplaces.length !== 1 ? 's' : ''}`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} size="sm">
              {hasResults ? 'Done' : 'Cancel'}
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing || selectedMarketplaces.length === 0}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {hasResults ? 'Republish' : 'Publish'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
