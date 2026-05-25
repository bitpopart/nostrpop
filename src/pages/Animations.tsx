import { useState, useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RelaySelector } from '@/components/RelaySelector';
import { HashtagCloud } from '@/components/HashtagCloud';
import { useAnimations } from '@/hooks/useAnimations';
import { useAuthor } from '@/hooks/useAuthor';
import { useZap } from '@/hooks/useZap';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import {
  Clapperboard,
  Play,
  Download,
  Zap,
  Sparkles,
  Heart,
  Loader2,
  RectangleHorizontal,
  RectangleVertical,
  LayoutGrid,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ADMIN_PUBKEY = getAdminPubkeyHex();
const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const LIGHTNING_ADDRESS = 'bitpopart@rizful.com';

// ── Always-visible Zap dialog (no self-check) ─────────────
// ZapButton hides itself when the logged-in user is the author.
// InlineZapButton uses useZap directly and always renders.
const PRESET_AMOUNTS = [21, 100, 500, 1000, 5000, 10000];

interface InlineZapButtonProps {
  /** Title shown in the dialog header */
  label: string;
  /** Optional event id to attach the zap to */
  eventId?: string;
  /** Button appearance variant */
  variant?: 'banner' | 'card' | 'dialog';
}

function InlineZapButton({ label, eventId, variant = 'card' }: InlineZapButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(210);
  const [customAmount, setCustomAmount] = useState('');
  const [comment, setComment] = useState('');
  const { sendZap, isZapping, canZap } = useZap(LIGHTNING_ADDRESS);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const handleSend = async () => {
    const success = await sendZap({
      recipientPubkey: ADMIN_PUBKEY,
      amount: finalAmount,
      comment: comment.trim(),
      eventId,
    });
    if (success) {
      setOpen(false);
      setComment('');
      setCustomAmount('');
      setAmount(210);
    }
  };

  const triggerClass =
    variant === 'banner'
      ? 'w-full sm:w-auto bg-white text-orange-600 border-white hover:bg-white/90 font-bold px-8 py-3 text-base shadow-md'
      : variant === 'dialog'
      ? 'flex-1 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
      : 'w-full h-8 gap-1.5 text-xs font-semibold text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20';

  return (
    <>
      <Button
        size={variant === 'banner' ? 'lg' : 'sm'}
        variant="outline"
        onClick={() => setOpen(true)}
        className={triggerClass}
      >
        <Zap className={`fill-current ${variant === 'banner' ? 'h-5 w-5 mr-2' : 'h-3.5 w-3.5 mr-1'}`} />
        {variant === 'banner' ? '⚡ Zap' : 'Zap ⚡'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Zap: {label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Amount (sats)</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map(p => (
                  <Button
                    key={p}
                    variant={amount === p && !customAmount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setAmount(p); setCustomAmount(''); }}
                    className="text-xs"
                  >
                    {p.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount"
                value={customAmount}
                onChange={e => {
                  setCustomAmount(e.target.value);
                  const n = parseInt(e.target.value);
                  if (!isNaN(n) && n > 0) setAmount(n);
                }}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea
                placeholder="Love your animations! ⚡"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                maxLength={280}
              />
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 flex justify-between items-center">
              <span className="text-sm font-medium">Total:</span>
              <Badge variant="secondary" className="text-orange-700 dark:text-orange-300">
                <Zap className="w-3 h-3 mr-1" />
                {(customAmount || amount).toLocaleString()} sats
              </Badge>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isZapping}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                disabled={isZapping || !canZap || finalAmount <= 0}
              >
                {isZapping
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                  : <><Zap className="w-4 h-4 mr-2" />Send Tip</>
                }
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ⚡ Sent via Lightning · NIP-57 zap receipt published on Nostr
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Download helper ────────────────────────────────────────
function triggerDownload(url: string, filename: string) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    })
    .catch(() => window.open(url, '_blank'));
}

// ── Watch dialog ───────────────────────────────────────────
interface WatchDialogProps {
  anim: ReturnType<typeof useAnimations>['data'] extends (infer T)[] ? T : never;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function WatchDialog({ anim, open, onOpenChange }: WatchDialogProps) {
  const author = useAuthor(anim.event.pubkey);
  const metadata = author.data?.metadata;
  const name = metadata?.name || 'BitPopArt';
  const picture = metadata?.picture || '';

  const isVertical = anim.orientation === 'vertical';
  const filename = `${anim.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${anim.video_url.split('.').pop()?.split('?')[0] || 'mp4'}`;

  // Vertical → narrow dialog centred; horizontal → wide dialog
  const dialogMaxW = isVertical ? 'max-w-sm' : 'max-w-3xl';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogMaxW} p-0 overflow-hidden rounded-2xl bg-black border-0`}>
        <DialogTitle className="sr-only">{anim.title}</DialogTitle>

        {/* Video — fills dialog width; vertical videos naturally stay narrow */}
        <video
          src={anim.video_url}
          controls
          autoPlay
          playsInline
          className="w-full block"
          style={{
            maxHeight: isVertical ? '75vh' : '65vh',
            background: '#000',
            // If we have exact dimensions, hint the browser for correct intrinsic ratio
            aspectRatio: anim.video_width && anim.video_height
              ? `${anim.video_width} / ${anim.video_height}`
              : undefined,
          }}
        />

        {/* Info panel */}
        <div className="bg-background px-5 pt-4 pb-5 space-y-3">
          {/* Author + time + orientation badge */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={picture} alt={name} />
              <AvatarFallback className="text-xs">{name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(anim.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {anim.duration && (
                <Badge variant="outline" className="text-xs">{anim.duration}</Badge>
              )}
              {isVertical ? (
                <Badge className="gap-1 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0">
                  <RectangleVertical className="h-3 w-3" /> Vertical
                </Badge>
              ) : (
                <Badge className="gap-1 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0">
                  <RectangleHorizontal className="h-3 w-3" /> Horizontal
                </Badge>
              )}
            </div>
          </div>

          {/* Title + description */}
          <div>
            <h2 className="font-bold text-lg leading-tight">{anim.title}</h2>
            {anim.description && (
              <p className="text-sm text-muted-foreground mt-1">{anim.description}</p>
            )}
            {anim.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {anim.hashtags.map(tag => (
                  <span key={tag} className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 gap-1.5 text-white border-0 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => triggerDownload(anim.video_url, filename)}
            >
              <Download className="h-3.5 w-3.5" />
              Download Free
            </Button>
            <InlineZapButton label={anim.title} eventId={anim.event.id} variant="dialog" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Animation card ─────────────────────────────────────────
function AnimationCard({ anim }: { anim: NonNullable<ReturnType<typeof useAnimations>['data']>[number] }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const filename = `${anim.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${anim.video_url.split('.').pop()?.split('?')[0] || 'mp4'}`;

  return (
    <>
      <div className="group cursor-pointer" onClick={() => setDialogOpen(true)}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-md group-hover:shadow-xl transition-all duration-300">
          {anim.thumb_url ? (
            <img
              src={anim.thumb_url}
              alt={anim.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-900 to-orange-900 flex items-center justify-center">
              <Clapperboard className="w-12 h-12 text-amber-400 opacity-50" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
              <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Duration */}
          {anim.duration && (
            <span className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-medium px-2 py-0.5 rounded-md">
              {anim.duration}
            </span>
          )}

          {/* Orientation badge — top-left */}
          <span className={`absolute top-2 left-2 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            anim.orientation === 'vertical'
              ? 'bg-violet-600/90 text-white'
              : 'bg-blue-600/90 text-white'
          }`}>
            {anim.orientation === 'vertical'
              ? <RectangleVertical className="w-2.5 h-2.5" />
              : <RectangleHorizontal className="w-2.5 h-2.5" />
            }
            {anim.orientation === 'vertical' ? 'Vertical' : 'Horizontal'}
          </span>

          {/* Download button — hover */}
          <button
            onClick={(e) => { e.stopPropagation(); triggerDownload(anim.video_url, filename); }}
            className="absolute bottom-2 right-2 bg-amber-600/90 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
            title="Download free"
          >
            <Download className="w-3 h-3" />
            Free
          </button>
        </div>

        {/* Info below */}
        <div className="mt-2.5 space-y-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {anim.title}
          </h3>
          {anim.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{anim.description}</p>
          )}
          {anim.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {anim.hashtags.slice(0, 5).map(tag => (
                <span key={tag} className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card action row */}
        <div className="mt-2 space-y-1.5" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 gap-1.5"
            onClick={() => triggerDownload(anim.video_url, filename)}
          >
            <Download className="h-3.5 w-3.5" />
            Download Free
          </Button>
          <InlineZapButton label={anim.title} eventId={anim.event.id} variant="card" />
        </div>
      </div>

      <WatchDialog anim={anim} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

// ── Skeleton card ──────────────────────────────────────────
function AnimationSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-7 flex-1 rounded-md" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
    </div>
  );
}

// ── BitPopArt profile banner ───────────────────────────────
function ProfileBanner() {
  const author = useAuthor(ADMIN_PUBKEY);
  const metadata = author.data?.metadata;

  const name = metadata?.name || 'BitPopArt';
  const about = metadata?.about || '';
  const picture = metadata?.picture || '';
  const banner = metadata?.banner || '';

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg mb-8">
      {/* Banner image */}
      <div className="h-36 md:h-48 relative">
        {banner ? (
          <img src={banner} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <div className="flex items-end gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-xl flex-shrink-0">
            <AvatarImage src={picture} alt={name} />
            <AvatarFallback className="text-2xl font-bold bg-amber-500 text-white">
              {name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{name}</h1>
            {about && <p className="text-sm text-white/80 mt-0.5 line-clamp-2 drop-shadow">{about}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
type OrientationFilter = 'all' | 'horizontal' | 'vertical';

export default function Animations() {
  const { data: animations = [], isLoading, error } = useAnimations();
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);
  const [orientationFilter, setOrientationFilter] = useState<OrientationFilter>('all');

  // Apply both orientation + hashtag filters
  const filtered = useMemo(() => {
    let list = animations;
    if (orientationFilter !== 'all') {
      list = list.filter(a => a.orientation === orientationFilter);
    }
    if (activeTag) {
      list = list.filter(a => a.hashtags.includes(activeTag));
    }
    return list;
  }, [animations, activeTag, orientationFilter]);

  // Tag sets for the cloud (from all animations, not filtered, so cloud stays stable)
  const tagSets = useMemo(() => animations.map(a => a.hashtags), [animations]);

  // Count per orientation for the toggle buttons
  const hCount = useMemo(() => animations.filter(a => a.orientation === 'horizontal').length, [animations]);
  const vCount = useMemo(() => animations.filter(a => a.orientation === 'vertical').length, [animations]);

  useSeoMeta({
    title: 'Animations - BitPopArt',
    description: 'Free Bitcoin PopArt animations by BitPopArt — watch, download, and zap!',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-rose-900/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Free download notice */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 md:p-6 shadow-lg text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Icon + text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 rounded-xl bg-white/20 flex-shrink-0">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">All animations are free to download!</h2>
                <p className="text-white/85 text-sm mt-0.5">
                  A donation ⚡ Zap is welcome to keep creating more and more animations.
                </p>
              </div>
            </div>

            {/* Zap button — always visible */}
            <div className="flex-shrink-0">
              <InlineZapButton label="BitPopArt Animations" variant="banner" />
            </div>
          </div>
        </div>

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Clapperboard className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Animations</h2>
              {!isLoading && animations.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {filtered.length !== animations.length
                    ? `${filtered.length} of ${animations.length} animation${animations.length !== 1 ? 's' : ''}`
                    : `${animations.length} animation${animations.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>

          {/* Orientation toggle — only show when content is loaded */}
          {!isLoading && animations.length > 0 && (
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setOrientationFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  orientationFilter === 'all'
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                All
                <span className="opacity-60">({animations.length})</span>
              </button>
              <button
                onClick={() => setOrientationFilter('horizontal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  orientationFilter === 'horizontal'
                    ? 'bg-blue-600 shadow text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <RectangleHorizontal className="h-3.5 w-3.5" />
                Horizontal
                <span className="opacity-60">({hCount})</span>
              </button>
              <button
                onClick={() => setOrientationFilter('vertical')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  orientationFilter === 'vertical'
                    ? 'bg-violet-600 shadow text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <RectangleVertical className="h-3.5 w-3.5" />
                Vertical
                <span className="opacity-60">({vCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Hashtag cloud */}
        <HashtagCloud
          tagSets={tagSets}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          isLoading={isLoading}
          accent="amber"
        />

        {/* Grid */}
        {error ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-4">
              <Clapperboard className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-muted-foreground">Failed to load animations. Try another relay?</p>
              <RelaySelector className="w-full max-w-xs mx-auto" />
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <AnimationSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 && animations.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-16 text-center space-y-4">
              <div className="relative inline-flex">
                <Clapperboard className="h-16 w-16 text-amber-400" />
                <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Animations coming soon!</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Check back soon or try switching relay.
                </p>
              </div>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-3">
              <Clapperboard className="h-10 w-10 mx-auto text-amber-300" />
              <p className="text-muted-foreground text-sm">No animations tagged <strong>#{activeTag}</strong>.</p>
              <button onClick={() => setActiveTag(undefined)} className="text-xs text-amber-600 underline">Clear filter</button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(anim => (
              <AnimationCard key={anim.id} anim={anim} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t text-xs text-muted-foreground space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
            All animations free to download — zap to support more creations
            <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400" />
          </p>
          <p>BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
