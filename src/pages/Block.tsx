import { useState, useRef, useCallback, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useRecentBlocks, generateBlockArt, type BitcoinBlock } from '@/hooks/useBlockArt';
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

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Single block art card ────────────────────────────────────────────────────

interface BlockArtCardProps {
  block: BitcoinBlock;
  onExpand: (dataUrl: string, block: BitcoinBlock) => void;
}

function BlockArtCard({ block, onExpand }: BlockArtCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  // Generate art as soon as the canvas mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Use rAF to avoid blocking the main thread for many cards at once
    const id = requestAnimationFrame(() => {
      try {
        const url = generateBlockArt(canvas, block);
        setDataUrl(url);
      } catch {
        // silently ignore
      }
    });
    return () => cancelAnimationFrame(id);
  }, [block]);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `bitcoin-block-${block.height}.png`;
    a.click();
  }, [dataUrl, block.height]);

  return (
    <Card className="overflow-hidden group border-2 border-transparent hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20">
      {/* Hidden working canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Art preview */}
      <div
        className="relative aspect-square bg-gradient-to-br from-orange-900 to-orange-950 cursor-pointer overflow-hidden"
        onClick={() => dataUrl && onExpand(dataUrl, block)}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Bitcoin Block #${block.height}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
            <ExternalLink className="h-3 w-3" />
            View full size
          </span>
        </div>

        {/* Block height badge */}
        <Badge className="absolute top-2 left-2 bg-black/70 text-orange-400 border-orange-500/50 text-xs font-mono font-bold">
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

          <ShareBlockButton block={block} dataUrl={dataUrl} />

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
  );
}

// ─── Share button with Nostr dialog ──────────────────────────────────────────

interface ShareBlockButtonProps {
  block: BitcoinBlock;
  dataUrl: string | null;
}

function ShareBlockButton({ block, dataUrl }: ShareBlockButtonProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { mutate: publish, isPending } = useNostrPublish();
  const [open, setOpen] = useState(false);

  const defaultMsg = `Bitcoin Block #${block.height.toLocaleString()} ⛏️\n\n${block.tx_count.toLocaleString()} transactions · mined ${timeAgo(block.timestamp)}\n${block.extras?.pool?.name ? `Pool: ${block.extras.pool.name}\n` : ''}${block.extras?.totalFees != null ? `Fees: ${(block.extras.totalFees / 100_000_000).toFixed(5)} BTC\n` : ''}\nhttps://mempool.space/block/${block.id}\n\n#Bitcoin #Block${block.height}`;

  const [msg, setMsg] = useState('');

  const handlePublish = () => {
    const content = (msg.trim() || defaultMsg);

    publish(
      { kind: 1, content, tags: [['r', `https://mempool.space/block/${block.id}`], ['t', 'bitcoin'], ['t', 'block']] },
      {
        onSuccess: () => {
          toast({ title: 'Shared to Nostr! ⚡', description: `Block #${block.height} posted to the network.` });
          setOpen(false);
          setMsg('');
        },
        onError: () => {
          toast({ title: 'Failed to share', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2"
        onClick={() => {
          if (!user) {
            toast({ title: 'Login required', description: 'Log in with Nostr to share blocks.', variant: 'destructive' });
            return;
          }
          setOpen(true);
        }}
        title="Share to Nostr"
      >
        <Share2 className="h-3 w-3" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md [&>button]:hidden">
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 z-50 bg-black/10 hover:bg-black/20 rounded-full p-1.5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              <h2 className="font-bold text-base">Share Block #{block.height.toLocaleString()} to Nostr</h2>
            </div>

            {/* Art preview */}
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
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
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
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Full art */}
        <img
          src={dataUrl}
          alt={`Bitcoin Block #${block.height}`}
          className="w-full"
        />

        {/* Action bar */}
        <div className="p-4 bg-background border-t flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">Bitcoin Block #{block.height.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {block.tx_count.toLocaleString()} txs · {timeAgo(block.timestamp)}{block.extras?.pool?.name ? ` · ${block.extras.pool.name}` : ''}
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
    description: 'Every Bitcoin block gets its own pop-art image. Watch new blocks arrive live, share them on Nostr, and send a zap.',
    ogTitle: 'Bitcoin Block Art – BitPopArt',
    ogDescription: 'Pop-art image for every Bitcoin block. Live from mempool.space · Share on Nostr · Zap ⚡',
  });

  const { data: blocks, isLoading, isError, refetch, isFetching } = useRecentBlocks(24);
  const [previewBlock, setPreviewBlock] = useState<BitcoinBlock | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleExpand = useCallback((url: string, block: BitcoinBlock) => {
    setPreviewUrl(url);
    setPreviewBlock(block);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5">

      {/* ── Hero header ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 w-40 h-40 bg-orange-300/20 dark:bg-orange-800/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-12 w-56 h-56 bg-yellow-300/15 dark:bg-yellow-700/15 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 pt-10 pb-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center">
              <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-sm px-3 py-1 gap-1.5">
                <Bitcoin className="h-3.5 w-3.5" />
                Live from mempool.space
              </Badge>
            </div>

            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-600 bg-clip-text text-transparent">
                Bitcoin
              </span>
              {' '}
              <span className="text-foreground">Block Art</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every new Bitcoin block gets its own pop-art image — generated live from the blockchain.
              Share yours on Nostr and send a zap ⚡
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Refreshing…' : 'Refresh Blocks'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://mempool.space', '_blank')}
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open mempool.space
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works strip ── */}
      <div className="container mx-auto px-4 pb-6">
        <div className="max-w-3xl mx-auto bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
            <div className="space-y-1">
              <Cpu className="h-5 w-5 text-orange-500 mx-auto" />
              <p className="font-semibold text-foreground">Every new block</p>
              <p className="text-xs text-muted-foreground">A unique pop-art image is generated from the block data — height, hash, fees & pool</p>
            </div>
            <div className="space-y-1">
              <Share2 className="h-5 w-5 text-orange-500 mx-auto" />
              <p className="font-semibold text-foreground">Share on Nostr</p>
              <p className="text-xs text-muted-foreground">Post your block image directly to the Nostr network with one click</p>
            </div>
            <div className="space-y-1">
              <Zap className="h-5 w-5 text-yellow-500 mx-auto" />
              <p className="font-semibold text-foreground">Zap the artist</p>
              <p className="text-xs text-muted-foreground">Support the creator with a Bitcoin Lightning zap if you love the art</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="container mx-auto px-4 pb-16">

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="max-w-md mx-auto text-center py-16 space-y-4">
            <Bitcoin className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Could not load blocks from mempool.space.</p>
            <Button variant="outline" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : !blocks || blocks.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16 space-y-4">
            <Bitcoin className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No blocks found yet.</p>
          </div>
        ) : (
          <>
            {/* Latest block callout */}
            {blocks[0] && (
              <div className="mb-6 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">
                  Latest block: <span className="text-foreground font-bold">#{blocks[0].height.toLocaleString()}</span>
                  {' '}· {timeAgo(blocks[0].timestamp)}
                  {blocks[0].extras?.pool?.name && ` · ${blocks[0].extras.pool.name}`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {blocks.map(block => (
                <BlockArtCard
                  key={block.id}
                  block={block}
                  onExpand={handleExpand}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Login nudge ── */}
        <div className="mt-10 max-w-lg mx-auto">
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-sm space-y-1">
                <p className="font-bold text-foreground">Log in to share blocks on Nostr</p>
                <p className="text-muted-foreground text-xs">
                  Connect your Nostr account to post block art directly to the decentralised network.
                </p>
              </div>
              <LoginArea className="max-w-52 shrink-0" />
            </CardContent>
          </Card>
        </div>

        {/* ── Big statement ── */}
        <div className="mt-16 text-center">
          <p className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
            <span className="text-foreground">Every 10 minutes.</span>
            <br />
            <span className="text-foreground">A new block.</span>
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
              A new piece of art. ₿
            </span>
          </p>
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
