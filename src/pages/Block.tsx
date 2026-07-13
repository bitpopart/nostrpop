import { useState, useRef, useCallback, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  useRecentBlocks,
  useBlockCharacter,
  generateBlockArtWithLayers,
  generateBlockArt,
  pickLayersForBlock,
  type BitcoinBlock,
} from '@/hooks/useBlockArt';
import { ZapButton } from '@/components/ZapButton';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { LoginArea } from '@/components/auth/LoginArea';
import {
  Bitcoin,
  Download,
  Share2,
  Zap,
  RefreshCw,
  X,
  ExternalLink,
  Clock,
  Hash,
  Activity,
  Cpu,
} from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Share dialog ─────────────────────────────────────────────────────────────

interface ShareBlockDialogProps {
  block: BitcoinBlock;
  dataUrl: string | null;
  open: boolean;
  onClose: () => void;
}

function ShareBlockDialog({ block, dataUrl, open, onClose }: ShareBlockDialogProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { mutate: publish, isPending } = useNostrPublish();

  const defaultMsg = `Bitcoin Block #${block.height.toLocaleString()} ⛏️\n\n${block.tx_count.toLocaleString()} transactions · mined ${timeAgo(block.timestamp)}${block.extras?.pool?.name ? `\nPool: ${block.extras.pool.name}` : ''}${block.extras?.totalFees != null ? `\nFees: ${(block.extras.totalFees / 100_000_000).toFixed(5)} BTC` : ''}\n\nhttps://mempool.space/block/${block.id}\n\n#Bitcoin #Block${block.height}`;

  const [msg, setMsg] = useState('');

  const handlePublish = () => {
    const content = msg.trim() || defaultMsg;
    publish(
      {
        kind: 1,
        content,
        tags: [
          ['r', `https://mempool.space/block/${block.id}`],
          ['t', 'bitcoin'],
          ['t', 'block'],
        ],
      },
      {
        onSuccess: () => {
          toast({ title: 'Shared to Nostr! ⚡', description: `Block #${block.height} posted.` });
          onClose();
          setMsg('');
        },
        onError: () => toast({ title: 'Failed to share', variant: 'destructive' }),
      }
    );
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-orange-500" />
            <h2 className="font-bold text-base">Share Block #{block.height.toLocaleString()} to Nostr</h2>
          </div>

          {dataUrl && (
            <div className="rounded-xl overflow-hidden border-2 border-orange-200 dark:border-orange-800">
              <img src={dataUrl} alt={`Block ${block.height}`} className="w-full" />
            </div>
          )}

          <Textarea
            rows={6}
            placeholder={defaultMsg}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            className="text-sm resize-none"
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPending}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            >
              {isPending ? 'Publishing…' : 'Publish to Nostr ⚡'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Single block art card ────────────────────────────────────────────────────

interface BlockArtCardProps {
  block: BitcoinBlock;
  layerUrls: string[];   // pre-picked layer URLs for this block
  onExpand: (dataUrl: string, block: BitcoinBlock) => void;
}

function BlockArtCard({ block, layerUrls, onExpand }: BlockArtCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    setGenerating(true);

    async function run() {
      if (!canvas) return;
      try {
        const url = await generateBlockArtWithLayers(canvas, block, layerUrls);
        if (!cancelled) setDataUrl(url);
      } catch {
        // fallback to plain canvas
        try {
          const url = generateBlockArt(canvas, block);
          if (!cancelled) setDataUrl(url);
        } catch {/* ignore */}
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }

    // Stagger generation so all cards don't hammer at once
    const t = setTimeout(run, 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [block, layerUrls]);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `bitcoin-block-${block.height}.png`;
    a.click();
  }, [dataUrl, block.height]);

  const handleShare = () => {
    if (!user) {
      toast({ title: 'Login required', description: 'Log in with Nostr to share blocks.', variant: 'destructive' });
      return;
    }
    setShareOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden group border-2 border-transparent hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20">
        {/* Hidden working canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Art preview */}
        <div
          className="relative aspect-square bg-gradient-to-br from-orange-950 to-orange-900 cursor-pointer overflow-hidden"
          onClick={() => dataUrl && onExpand(dataUrl, block)}
        >
          {generating || !dataUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Skeleton className="w-full h-full absolute inset-0" />
              <div className="relative z-10 text-center">
                <div className="text-orange-300 text-xs font-mono animate-pulse">generating…</div>
              </div>
            </div>
          ) : (
            <img
              src={dataUrl}
              alt={`Bitcoin Block #${block.height}`}
              className="w-full h-full object-cover"
            />
          )}

          {/* Hover expand hint */}
          {dataUrl && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
                <ExternalLink className="h-3 w-3" />
                View full size
              </span>
            </div>
          )}

          {/* Block height badge */}
          <Badge className="absolute top-2 left-2 bg-orange-500 text-white border-orange-600 text-xs font-mono font-bold shadow-md">
            #{block.height.toLocaleString()}
          </Badge>

          {/* Pool badge */}
          {block.extras?.pool?.name && (
            <Badge className="absolute top-2 right-2 bg-black/70 text-white border-white/20 text-xs max-w-[6rem] truncate">
              {block.extras.pool.name}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <CardContent className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-orange-500 shrink-0" />
              {block.tx_count.toLocaleString()} txs
            </span>
            <span className="flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3 text-orange-500 shrink-0" />
              {timeAgo(block.timestamp)}
            </span>
            <span className="flex items-center gap-1 col-span-2 truncate">
              <Hash className="h-3 w-3 text-orange-500 shrink-0" />
              <span className="font-mono truncate">{block.id.slice(0, 20)}…</span>
            </span>
            {block.extras?.totalFees != null && (
              <span className="flex items-center gap-1 col-span-2">
                <Zap className="h-3 w-3 text-yellow-500 shrink-0" />
                {(block.extras.totalFees / 100_000_000).toFixed(5)} BTC fees
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8"
              onClick={handleDownload}
              disabled={!dataUrl}
            >
              <Download className="h-3 w-3 mr-1" />
              Save
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={handleShare}
              title="Share to Nostr"
            >
              <Share2 className="h-3 w-3" />
            </Button>

            <ZapButton
              authorPubkey={ADMIN_PUBKEY}
              lightningAddress="bitpopart@rizful.com"
              eventTitle={`Bitcoin Block #${block.height}`}
              variant="outline"
              size="sm"
              alwaysShow
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Share dialog */}
      {user && (
        <ShareBlockDialog
          block={block}
          dataUrl={dataUrl}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}

// ─── Full-size preview dialog ─────────────────────────────────────────────────

interface PreviewDialogProps {
  block: BitcoinBlock | null;
  dataUrl: string | null;
  onClose: () => void;
}

function PreviewDialog({ block, dataUrl, onClose }: PreviewDialogProps) {
  if (!block || !dataUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `bitcoin-block-${block.height}.png`;
    a.click();
  };

  return (
    <Dialog open={!!block} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden [&>button]:hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <img
          src={dataUrl}
          alt={`Bitcoin Block #${block.height}`}
          className="w-full"
        />

        <div className="p-4 bg-background border-t flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">Bitcoin Block #{block.height.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {block.tx_count.toLocaleString()} txs · {timeAgo(block.timestamp)}
              {block.extras?.pool?.name ? ` · ${block.extras.pool.name}` : ''}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => window.open(`https://mempool.space/block/${block.id}`, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              mempool.space
            </Button>
            <ZapButton
              authorPubkey={ADMIN_PUBKEY}
              lightningAddress="bitpopart@rizful.com"
              eventTitle={`Bitcoin Block #${block.height}`}
              variant="outline"
              size="sm"
              alwaysShow
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BlockPage() {
  useSeoMeta({
    title: 'Bitcoin Block Art – BitPopArt',
    description: 'Every Bitcoin block gets its own unique pop-art image built from layered art. Watch new blocks arrive live, share them on Nostr, and send a zap.',
    ogTitle: 'Bitcoin Block Art – BitPopArt',
    ogDescription: 'Pop-art layered image for every Bitcoin block. Live from mempool.space · Share on Nostr · Zap ⚡',
  });

  const { data: blocks, isLoading: blocksLoading, isError, refetch, isFetching } = useRecentBlocks(24);
  const { character: blockChar, isLoading: charLoading } = useBlockCharacter();
  const [previewBlock, setPreviewBlock] = useState<BitcoinBlock | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isLoading = blocksLoading || charLoading;

  const handleExpand = useCallback((url: string, block: BitcoinBlock) => {
    setPreviewUrl(url);
    setPreviewBlock(block);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5">

      {/* ── Compact header ── */}
      <div className="container mx-auto px-4 pt-4 pb-2">

        {/* Row 1: live badge + refresh */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-xs px-2 py-0.5 gap-1 shrink-0">
            <Bitcoin className="h-3 w-3" />
            Live · mempool.space
          </Badge>

          {blocks?.[0] && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span>
                Latest: <span className="font-bold text-foreground">#{blocks[0].height.toLocaleString()}</span>
                {' '}· {timeAgo(blocks[0].timestamp)}
                {blocks[0].extras?.pool?.name && ` · ${blocks[0].extras.pool.name}`}
              </span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? '…' : 'Refresh'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://mempool.space', '_blank')}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Row 2: 3-column info strip */}
        <div className="mt-2 grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-orange-100 dark:border-orange-900/40 text-xs">
          <div className="bg-orange-50 dark:bg-orange-950/25 px-3 py-2 flex items-start gap-2">
            <Cpu className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground leading-tight">Unique every block</p>
              <p className="text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                Layers are randomly combined using the block height as seed — the same block always gets the same art, different blocks never match
              </p>
            </div>
          </div>
          <div className="bg-orange-50/70 dark:bg-orange-950/20 px-3 py-2 flex items-start gap-2 border-x border-orange-100 dark:border-orange-900/40">
            <Share2 className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground leading-tight">Share on Nostr</p>
              <p className="text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                Post your block image directly to the Nostr network with one click
              </p>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/25 px-3 py-2 flex items-start gap-2">
            <Zap className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground leading-tight">Zap the artist</p>
              <p className="text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                Support the creator with a Bitcoin Lightning zap if you love the art
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Block grid — right below header ── */}
      <div className="container mx-auto px-4 pt-3 pb-16">

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-7 rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="max-w-md mx-auto text-center py-12 space-y-4">
            <Bitcoin className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">Could not load blocks from mempool.space.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </Button>
          </div>
        ) : !blocks || blocks.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12 space-y-4">
            <Bitcoin className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground text-sm">No blocks found yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {blocks.map(block => {
              const layerUrls = blockChar
                ? pickLayersForBlock(blockChar.layerGroups, block)
                : [];
              return (
                <BlockArtCard
                  key={block.id}
                  block={block}
                  layerUrls={layerUrls}
                  onExpand={handleExpand}
                />
              );
            })}
          </div>
        )}

        {/* ── Login nudge ── */}
        <div className="mt-8 max-w-lg mx-auto">
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 text-sm space-y-0.5">
                <p className="font-bold text-foreground">Log in to share blocks on Nostr</p>
                <p className="text-muted-foreground text-xs">
                  Connect your Nostr account to post block art to the network.
                </p>
              </div>
              <LoginArea className="max-w-48 shrink-0" />
            </CardContent>
          </Card>
        </div>

        {/* ── Big statement ── */}
        <div className="mt-12 text-center">
          <p className="text-2xl md:text-4xl font-black leading-tight tracking-tight">
            <span className="text-foreground">Every 10 minutes.</span>
            {' '}
            <span className="text-foreground">A new block.</span>
            {' '}
            <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
              A new piece of art. ₿
            </span>
          </p>
        </div>

        {/* ── BTClock BitPopArt Edition ── */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Card className="overflow-hidden border-2 border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/20">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image side */}
                <div className="relative overflow-hidden bg-orange-100 dark:bg-orange-900/30">
                  <img
                    src="https://btclock.store/storage/2025/11/BTClock-BitPopArt-withframe.jpeg"
                    alt="BTClock BitPopArt Edition"
                    className="w-full h-full object-cover min-h-[220px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-50/40 dark:to-orange-950/40 md:block hidden" />
                </div>

                {/* Text side */}
                <div className="p-6 flex flex-col justify-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-500 text-white border-orange-600 text-xs font-bold">
                        Special Edition
                      </Badge>
                      <Badge className="bg-yellow-400 text-yellow-900 border-yellow-500 text-xs font-bold">
                        Physical Art
                      </Badge>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-foreground leading-tight">
                      BTClock <span className="text-orange-500">BitPopArt</span> Edition
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">€200 – €250</p>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed">
                    The same pop-art designs generated for every Bitcoin block are printed on the front panel of this physical BTClock. A fully built &amp; tested clock with multiple eInk displays, flashed and ready to use — now in a special edition collaboration with BitPopArt.
                  </p>

                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="text-orange-500 font-bold">●</span>
                      7 eInk displays showing live Bitcoin data
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-orange-500 font-bold">●</span>
                      BitPopArt art panel — with or without outline
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-orange-500 font-bold">●</span>
                      Optional frontlight · fully open-source firmware
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-orange-500 font-bold">●</span>
                      Built &amp; tested · ships worldwide
                    </li>
                  </ul>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-1.5"
                      size="sm"
                      onClick={() => window.open('https://btclock.store/product/btclock-bitpopart/', '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Order on BTClock.store
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-orange-300 dark:border-orange-700"
                      onClick={() => window.open('https://btclock.store', '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      btclock.store
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Full-size preview ── */}
      <PreviewDialog
        block={previewBlock}
        dataUrl={previewUrl}
        onClose={() => { setPreviewBlock(null); setPreviewUrl(null); }}
      />
    </div>
  );
}
