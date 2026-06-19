import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePopFans, type ZapperEntry, type ReactorEntry, type LikeEntry } from '@/hooks/usePopFans';
import { useAuthor } from '@/hooks/useAuthor';
import { useProofOfWork, NOSTR_SINCE_DATE } from '@/hooks/useProofOfWork';
import { useLatestAdminNotes } from '@/hooks/useAdminNotes';
import { useContentOverview } from '@/hooks/useContentOverview';
import { genUserName } from '@/lib/genUserName';
import { nip19 } from 'nostr-tools';
import { getFirstImage, stripImagesFromContent } from '@/lib/extractImages';
import { RelaySelector } from '@/components/RelaySelector';
import {
  Zap,
  Heart,
  Star,
  Trophy,
  Clock,
  Users,
  Hammer,
  Search,
  Calendar,
  MessageSquare,
  ArrowRight,
  Rss,
  ExternalLink,
  Gift,
  Clapperboard,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Play,
  Gamepad2,
  Palette,
  ShoppingBag,
  Printer,
  Newspaper,
  FolderKanban,
  TrendingUp,
  BarChart2,
  Flame,
} from 'lucide-react';
import type { NostrEvent, NostrMetadata } from '@nostrify/nostrify';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(1)}k`;
  return sats.toString();
}

function timeAgo(unixTs: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixTs;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(unixTs * 1000).toLocaleDateString();
}

function pubkeyToNpub(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey);
  } catch {
    return pubkey;
  }
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function ProfileAvatar({ pubkey, size = 'md' }: { pubkey: string; size?: 'sm' | 'md' | 'lg' }) {
  const author = useAuthor(pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const sizeClass = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <Avatar className={sizeClass}>
      <AvatarImage src={metadata?.picture} alt={displayName} />
      <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-xs">
        {displayName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function ProfileName({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.display_name ?? metadata?.name ?? genUserName(pubkey);
  const npub = pubkeyToNpub(pubkey);
  const shortNpub = `${npub.slice(0, 10)}…`;

  return (
    <div className="min-w-0">
      <p className="font-semibold text-sm truncate">{displayName}</p>
      <p className="text-xs text-muted-foreground truncate">{shortNpub}</p>
    </div>
  );
}

// ── rank medal colours ────────────────────────────────────────────────────────

const medalColour = (rank: number) => {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-amber-600';
  return 'text-muted-foreground';
};

const medalBg = (rank: number) => {
  if (rank === 1) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
  if (rank === 2) return 'bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-600';
  if (rank === 3) return 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800';
  return 'bg-background border-border';
};

// ── skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// ── All-time top 10 zappers ───────────────────────────────────────────────────

function AllTimeZapperRow({ entry, rank }: { entry: ZapperEntry; rank: number }) {
  const npub = pubkeyToNpub(entry.pubkey);
  return (
    <a
      href={`https://njump.me/${npub}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-md ${medalBg(rank)}`}
    >
      {/* Rank */}
      <span className={`text-xl font-black w-8 text-center flex-shrink-0 ${medalColour(rank)}`}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </span>

      <ProfileAvatar pubkey={entry.pubkey} size={rank <= 3 ? 'lg' : 'md'} />
      <ProfileName pubkey={entry.pubkey} />

      <div className="ml-auto flex flex-col items-end gap-1 flex-shrink-0">
        <Badge
          className="text-white font-bold px-2.5 py-0.5 flex items-center gap-1"
          style={{ background: '#f7931a' }}
        >
          <Zap className="h-3 w-3" />
          {formatSats(entry.totalSats)} sats
        </Badge>
        <span className="text-xs text-muted-foreground">{entry.zapCount} zap{entry.zapCount !== 1 ? 's' : ''}</span>
      </div>
    </a>
  );
}

// ── Latest top 5 zappers ──────────────────────────────────────────────────────

function LatestZapperRow({ entry, rank }: { entry: ZapperEntry; rank: number }) {
  const npub = pubkeyToNpub(entry.pubkey);
  return (
    <a
      href={`https://njump.me/${npub}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all hover:shadow-sm"
    >
      <ProfileAvatar pubkey={entry.pubkey} />
      <ProfileName pubkey={entry.pubkey} />
      <div className="ml-auto flex flex-col items-end gap-1 flex-shrink-0">
        <Badge
          className="text-white font-bold px-2 py-0.5 flex items-center gap-1 text-xs"
          style={{ background: '#f7931a' }}
        >
          <Zap className="h-3 w-3" />
          {formatSats(entry.totalSats)}
        </Badge>
        <span className="text-xs text-muted-foreground">{timeAgo(entry.latestZapAt)}</span>
      </div>
    </a>
  );
}

// ── Latest top 5 reactors ─────────────────────────────────────────────────────

function LatestReactorRow({ entry }: { entry: ReactorEntry }) {
  const npub = pubkeyToNpub(entry.pubkey);
  const emoji = entry.latestContent || '⚡';
  return (
    <a
      href={`https://njump.me/${npub}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all hover:shadow-sm"
    >
      <div className="relative flex-shrink-0">
        <ProfileAvatar pubkey={entry.pubkey} />
        <span className="absolute -bottom-1 -right-1 text-base leading-none">{emoji}</span>
      </div>
      <ProfileName pubkey={entry.pubkey} />
      <div className="ml-auto flex flex-col items-end gap-1 flex-shrink-0">
        <Badge variant="secondary" className="text-xs font-medium">
          {entry.reactionCount} reaction{entry.reactionCount !== 1 ? 's' : ''}
        </Badge>
        <span className="text-xs text-muted-foreground">{timeAgo(entry.latestReactionAt)}</span>
      </div>
    </a>
  );
}

// ── Latest likes ──────────────────────────────────────────────────────────────

function LikeRow({ entry }: { entry: LikeEntry }) {
  const npub = pubkeyToNpub(entry.pubkey);
  const emoji = entry.content === '+' ? '❤️' : entry.content;
  return (
    <a
      href={`https://njump.me/${npub}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors"
    >
      <div className="relative flex-shrink-0">
        <ProfileAvatar pubkey={entry.pubkey} size="sm" />
        <span className="absolute -bottom-1 -right-1 text-sm leading-none">{emoji}</span>
      </div>
      <ProfileName pubkey={entry.pubkey} />
      <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">{timeAgo(entry.createdAt)}</span>
    </a>
  );
}

// ── Note Card (for POW archive) ───────────────────────────────────────────────

function NoteCard({ event }: { event: NostrEvent }) {
  const noteId = nip19.noteEncode(event.id);
  const firstImage = getFirstImage(event.content, event.tags);
  const cleanContent = stripImagesFromContent(event.content);
  const preview = cleanContent.length > 140 ? cleanContent.substring(0, 140) + '…' : cleanContent;
  const date = new Date(event.created_at * 1000);

  return (
    <a
      href={`https://njump.me/${noteId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden hover:border-purple-300 dark:hover:border-purple-700">
        {firstImage && (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={firstImage.url}
              alt={firstImage.alt || 'Note image'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const container = e.currentTarget.parentElement;
                if (container) container.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {preview && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4 mb-3">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
            <ExternalLink className="h-3 w-3" />
            <span className="text-xs font-medium">View on Nostr</span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// ── Nostr News Note Thumbnail (same as homepage) ──────────────────────────────

function NoteThumbnail({ event }: { event: NostrEvent }) {
  const author = useAuthor(event.pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  const createdAt = new Date(event.created_at * 1000);
  const firstImage = getFirstImage(event.content, event.tags);
  const cleanContent = stripImagesFromContent(event.content);
  const preview = cleanContent.length > 100 ? cleanContent.substring(0, 100) + '...' : cleanContent;
  const noteId = nip19.noteEncode(event.id);

  return (
    <a href={`https://njump.me/${noteId}`} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm group overflow-hidden h-full">
        {firstImage && (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={firstImage.url}
              alt={firstImage.alt || 'Note image'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const container = e.currentTarget.parentElement;
                if (container) container.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {profileImage ? (
                <img src={profileImage} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-semibold truncate">{displayName}</CardTitle>
                <Badge variant="secondary" className="text-xs">Artist</Badge>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {preview && (
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{preview}</div>
          )}
          <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors">
            <span className="text-xs font-medium">Read on Nostr</span>
            <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// ── Activity Chart ────────────────────────────────────────────────────────────

interface MonthBucket {
  label: string;      // "Feb '23"
  monthKey: string;   // "2023-02"
  posts: number;
  cumulative: number;
  isCurrent: boolean;
}

/** Build a continuous month-by-month timeline from startDate to today */
function buildMonthTimeline(
  notes: { created_at: number }[],
  startDate: Date,
): MonthBucket[] {
  // Count posts per month
  const counts = new Map<string, number>();
  for (const note of notes) {
    const d = new Date(note.created_at * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const buckets: MonthBucket[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  let cumulative = 0;

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth(); // 0-indexed
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const posts = counts.get(key) ?? 0;
    cumulative += posts;

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${shortMonths[month]} '${String(year).slice(2)}`;

    buckets.push({
      label,
      monthKey: key,
      posts,
      cumulative,
      isCurrent: key === currentKey,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
}

// Custom tooltip for the chart
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const posts = payload.find(p => p.name === 'Posts')?.value ?? 0;
  const total = payload.find(p => p.name === 'Total')?.value ?? 0;
  return (
    <div className="bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-purple-700 dark:text-purple-300 mb-1">{label}</p>
      <p className="text-gray-700 dark:text-gray-300">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 mr-1.5 align-middle" />
        Notes this month: <span className="font-bold">{posts}</span>
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 mr-1.5 align-middle" />
        Total on Nostr: <span className="font-bold">{total}</span>
      </p>
    </div>
  );
}

interface ActivityChartProps {
  notes: { created_at: number }[];
  isLoading: boolean;
}

function ActivityChart({ notes, isLoading }: ActivityChartProps) {
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');

  const monthlyData = useMemo(
    () => buildMonthTimeline(notes, NOSTR_SINCE_DATE),
    [notes],
  );

  // Yearly rollup
  const yearlyData = useMemo(() => {
    const byYear = new Map<string, number>();
    for (const b of monthlyData) {
      const yr = b.monthKey.slice(0, 4);
      byYear.set(yr, (byYear.get(yr) ?? 0) + b.posts);
    }
    const now = new Date();
    const currentYear = String(now.getFullYear());
    let cum = 0;
    return Array.from(byYear.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yr, posts]) => {
        cum += posts;
        return { label: yr, posts, cumulative: cum, isCurrent: yr === currentYear };
      });
  }, [monthlyData]);

  const data = view === 'monthly' ? monthlyData : yearlyData;

  // Stats
  const totalPosts = monthlyData[monthlyData.length - 1]?.cumulative ?? 0;
  const thisMonthPosts = monthlyData.find(b => b.isCurrent)?.posts ?? 0;
  const bestMonth = useMemo(() =>
    [...monthlyData].sort((a, b) => b.posts - a.posts)[0],
    [monthlyData],
  );
  // Streak: consecutive months with at least 1 post, counting backwards
  const streak = useMemo(() => {
    let s = 0;
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i].posts > 0) s++;
      else break;
    }
    return s;
  }, [monthlyData]);

  if (isLoading) {
    return (
      <Card className="mb-8 overflow-hidden border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardContent className="py-8 px-6">
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) return null;

  return (
    <Card className="mb-8 overflow-hidden border-2 border-purple-200 dark:border-purple-800 shadow-lg"
      style={{ background: 'linear-gradient(135deg, #8b5cf608, #6366f104)' }}>
      <CardHeader className="pb-2 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart2 className="h-5 w-5 text-purple-500" />
            <span style={{
              background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Consistency Chart
            </span>
          </CardTitle>
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg sm:ml-auto">
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                view === 'monthly'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setView('yearly')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                view === 'yearly'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Notes posted to Nostr — proof of consistent creation since February 2023
        </p>
      </CardHeader>

      <CardContent className="pt-2 pb-4">
        {/* Stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-purple-500 font-semibold mb-0.5">Total Notes</p>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{totalPosts}</p>
          </div>
          <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-semibold mb-0.5">This Month</p>
            <p className="text-2xl font-black text-orange-600 dark:text-orange-300">{thisMonthPosts}</p>
          </div>
          <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold mb-0.5">Best Month</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{bestMonth?.posts ?? 0}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{bestMonth?.label}</p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-rose-500 font-semibold mb-0.5 flex items-center justify-center gap-0.5">
              <Flame className="h-2.5 w-2.5" /> Streak
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-300">{streak}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">month{streak !== 1 ? 's' : ''} running</p>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf620" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval={view === 'monthly' ? Math.max(0, Math.floor(data.length / 10) - 1) : 0}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#f97316' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconSize={10}
              />
              <Bar
                yAxisId="left"
                dataKey="posts"
                name="Posts"
                radius={[3, 3, 0, 0]}
                maxBarSize={view === 'monthly' ? 18 : 60}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.monthKey}
                    fill={entry.isCurrent ? '#f7931a' : entry.posts === 0 ? '#e5e7eb' : '#8b5cf6'}
                  />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name="Total"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#f97316' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-2">
          <span className="inline-block w-2 h-2 rounded-sm bg-purple-500 mr-1 align-middle" />
          Monthly notes &nbsp;·&nbsp;
          <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1 align-middle" />
          Running total &nbsp;·&nbsp;
          <span className="inline-block w-2 h-2 rounded-sm bg-orange-400 mr-1 align-middle" />
          Current month
        </p>
      </CardContent>
    </Card>
  );
}

// ── Content Overview ──────────────────────────────────────────────────────────

interface OverviewCardProps {
  icon: React.ReactNode;
  label: string;
  count: number | undefined;
  href: string;
  color: string;          // Tailwind bg class for the icon circle
  textColor: string;      // Tailwind text class for the count
  borderColor: string;    // Tailwind border class
}

function OverviewCard({ icon, label, count, href, color, textColor, borderColor }: OverviewCardProps) {
  return (
    <Link
      to={href}
      className={`group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${borderColor} bg-white dark:bg-gray-900/60 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-center`}
    >
      {/* Icon circle */}
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>

      {/* Count */}
      <div className={`text-2xl font-black leading-none ${textColor}`}>
        {count === undefined ? (
          <Skeleton className="h-7 w-10 mx-auto rounded" />
        ) : (
          count
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-semibold text-muted-foreground leading-tight">
        {label}
      </p>
    </Link>
  );
}

function SiteOverview() {
  const overview = useContentOverview();

  const cards: OverviewCardProps[] = [
    {
      icon: <Gift className="h-6 w-6 text-teal-600" />,
      label: 'Free Images',
      count: overview.freeImages,
      href: '/free/images',
      color: 'bg-teal-100 dark:bg-teal-900/40',
      textColor: 'text-teal-700 dark:text-teal-300',
      borderColor: 'border-teal-200 dark:border-teal-800',
    },
    {
      icon: <Clapperboard className="h-6 w-6 text-amber-600" />,
      label: 'GIFs',
      count: overview.gifs,
      href: '/gifs',
      color: 'bg-amber-100 dark:bg-amber-900/40',
      textColor: 'text-amber-700 dark:text-amber-300',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      label: 'Wallpapers',
      count: overview.wallpapers,
      href: '/wallpapers',
      color: 'bg-blue-100 dark:bg-blue-900/40',
      textColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      icon: <Monitor className="h-6 w-6 text-cyan-600" />,
      label: 'Desktop Wallpapers',
      count: overview.desktopWallpapers,
      href: '/desktop-wallpapers',
      color: 'bg-cyan-100 dark:bg-cyan-900/40',
      textColor: 'text-cyan-700 dark:text-cyan-300',
      borderColor: 'border-cyan-200 dark:border-cyan-800',
    },
    {
      icon: <Play className="h-6 w-6 text-orange-600" />,
      label: 'Animations',
      count: overview.animations,
      href: '/animations',
      color: 'bg-orange-100 dark:bg-orange-900/40',
      textColor: 'text-orange-700 dark:text-orange-300',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      icon: <Newspaper className="h-6 w-6 text-violet-600" />,
      label: 'News Posts',
      count: overview.news,
      href: '/blog',
      color: 'bg-violet-100 dark:bg-violet-900/40',
      textColor: 'text-violet-700 dark:text-violet-300',
      borderColor: 'border-violet-200 dark:border-violet-800',
    },
    {
      icon: <FolderKanban className="h-6 w-6 text-indigo-600" />,
      label: 'Projects',
      count: overview.projects,
      href: '/nostr-projects',
      color: 'bg-indigo-100 dark:bg-indigo-900/40',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      icon: <Palette className="h-6 w-6 text-pink-600" />,
      label: 'Art',
      count: overview.art,
      href: '/art',
      color: 'bg-pink-100 dark:bg-pink-900/40',
      textColor: 'text-pink-700 dark:text-pink-300',
      borderColor: 'border-pink-200 dark:border-pink-800',
    },
    {
      icon: <ShoppingBag className="h-6 w-6 text-rose-600" />,
      label: 'Shop Items',
      count: overview.shop,
      href: '/shop',
      color: 'bg-rose-100 dark:bg-rose-900/40',
      textColor: 'text-rose-700 dark:text-rose-300',
      borderColor: 'border-rose-200 dark:border-rose-800',
    },
    {
      icon: <Printer className="h-6 w-6 text-emerald-600" />,
      label: 'Print Posters',
      count: overview.print,
      href: '/print',
      color: 'bg-emerald-100 dark:bg-emerald-900/40',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
  ];

  return (
    <div className="mb-12">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 shadow-md flex-shrink-0">
          <ImageIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight">BitPopArt Content</h2>
          <p className="text-xs text-muted-foreground">Live item counts — click any card to explore</p>
        </div>
      </div>

      {/* Grid of overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {cards.map(card => (
          <OverviewCard key={card.label} {...card} />
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">
        Counts update automatically as new content is published on Nostr
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Community() {
  useSeoMeta({
    title: 'PopFans Community – BitPopArt',
    description: 'Meet the top supporters of BitPopArt on Nostr. See who zapped and reacted the most to bitpopart\'s posts.',
    ogTitle: 'PopFans Community – BitPopArt',
    ogDescription: 'Top zappers and fans of BitPopArt on Nostr',
  });

  const { data, isLoading, error } = usePopFans();
  const { data: pow, isLoading: powLoading } = useProofOfWork();
  const { data: latestNotes, isLoading: notesLoading, error: notesError } = useLatestAdminNotes(3);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    if (!pow?.allNotes) return [];
    if (!searchQuery.trim()) return pow.allNotes;
    const q = searchQuery.toLowerCase();
    return pow.allNotes.filter((note) =>
      note.content.toLowerCase().includes(q)
    );
  }, [pow?.allNotes, searchQuery]);

  // Show only first 6 unless "show all" is toggled
  const displayedNotes = showAll ? filteredNotes : filteredNotes.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-pink-50 dark:from-gray-950 dark:via-background dark:to-gray-900">
      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Page title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-1">
            <span style={{
              background: 'linear-gradient(90deg, #f7931a, #ff6b6b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              BitPopArt Community
            </span>
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Your gateway to all BitPopArt content &amp; the community keeping it alive on Nostr
          </p>
        </div>

        {/* ── SITE OVERVIEW ── */}
        <SiteOverview />

        {/* Section divider before PopFans */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fan Community
            </span>
          </div>
        </div>

        {/* PopFans Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f7931a, #ff6b6b)' }}>
            <Users className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-2">
            <span style={{
              background: 'linear-gradient(90deg, #f7931a, #ff6b6b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              PopFans
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            The community that keeps BitPopArt alive on Nostr — top zappers, reactors &amp; fans ⚡
          </p>
        </div>

        {/* Error state */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="py-6 text-center text-red-600 dark:text-red-400">
              Could not load fan data. Check your relay connection and try again.
            </CardContent>
          </Card>
        )}

        {/* ── SECTION 1: All-time top 10 zappers ── */}
        <Card className="mb-8 shadow-lg border-2 border-orange-200 dark:border-orange-800 overflow-hidden">
          <CardHeader className="pb-2 pt-5"
            style={{ background: 'linear-gradient(135deg, #f7931a22, #ff6b6b11)' }}>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-yellow-500" />
              All-Time Top Zappers
              <span className="ml-auto text-sm font-normal text-muted-foreground">Hall of Fame</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-4 space-y-2">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            {!isLoading && data?.allTimeTopZappers.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No zaps found yet. Be the first to zap! ⚡</p>
            )}
            {!isLoading && data?.allTimeTopZappers.map((entry, i) => (
              <AllTimeZapperRow key={entry.pubkey} entry={entry} rank={i + 1} />
            ))}
          </CardContent>
        </Card>

        {/* ── SECTION 2: Latest top 5 zappers ── */}
        <Card className="mb-8 shadow-md border border-orange-100 dark:border-orange-900 overflow-hidden">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-orange-500" />
              Latest Zappers
              <span className="ml-auto text-sm font-normal text-muted-foreground">Top 5 most recent</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4 space-y-2">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            {!isLoading && data?.latestTopZappers.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No recent zaps found.</p>
            )}
            {!isLoading && data?.latestTopZappers.map((entry, i) => (
              <LatestZapperRow key={`${entry.pubkey}-${i}`} entry={entry} rank={i + 1} />
            ))}
          </CardContent>
        </Card>

        {/* ── SECTION 3: Latest top 5 reactors ── */}
        <Card className="mb-8 shadow-md border border-pink-100 dark:border-pink-900 overflow-hidden">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-pink-500" />
              Latest Reactors
              <span className="ml-auto text-sm font-normal text-muted-foreground">Top 5 most recent</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4 space-y-2">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            {!isLoading && data?.latestTopReactors.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No recent reactions found.</p>
            )}
            {!isLoading && data?.latestTopReactors.map((entry) => (
              <LatestReactorRow key={entry.pubkey} entry={entry} />
            ))}
          </CardContent>
        </Card>

        {/* ── SECTION 4: Latest likes ── */}
        <Card className="mb-10 shadow-md overflow-hidden">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-red-500" />
              Latest Likes
              <span className="ml-auto text-sm font-normal text-muted-foreground">Most recent</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4 space-y-1">
            {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            {!isLoading && data?.latestLikes.length === 0 && (
              <p className="text-center text-muted-foreground py-6">No likes found yet.</p>
            )}
            {!isLoading && data?.latestLikes.map((entry, i) => (
              <LikeRow key={`${entry.pubkey}-${entry.createdAt}-${i}`} entry={entry} />
            ))}
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── PROOF OF WORK SECTION ── */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        {/* Section divider */}
        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground flex items-center gap-2">
              <Hammer className="h-4 w-4" />
              BitPopArt Proof of Work
            </span>
          </div>
        </div>

        {/* POW Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
            <Hammer className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            <span style={{
              background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Proof Of Work
            </span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            The full archive of BitPopArt notes on Nostr — a living record of creation, community &amp; art.
          </p>
        </div>

        {/* "On Nostr Since" date card */}
        <Card className="mb-8 overflow-hidden border-2 border-purple-200 dark:border-purple-800 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #8b5cf611, #6366f108)' }}>
          <CardContent className="py-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">
              🟣 On Nostr Since
            </p>
            <p
              className="text-4xl sm:text-5xl font-black mb-3 tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatFullDate(NOSTR_SINCE_DATE)}
            </p>

          </CardContent>
        </Card>

        {/* ── Activity / Consistency Chart ── */}
        <ActivityChart notes={pow?.allNotes ?? []} isLoading={powLoading} />

        {/* Latest 2 notes highlight */}
        {(powLoading || (pow?.latestNotes && pow.latestNotes.length > 0)) && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Clock className="h-5 w-5" />
              Latest Notes
            </h3>
            {powLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <CardHeader className="pb-2">
                      <Skeleton className="h-3 w-28" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-4/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {pow?.latestNotes.slice(0, 2).map((note) => (
                  <NoteCard key={note.id} event={note} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search bar */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Search the Archive
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search BitPopArt notes…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowAll(false);
              }}
              className="pl-9 bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:ring-purple-400"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found <span className="font-semibold text-purple-600 dark:text-purple-400">{filteredNotes.length}</span> note{filteredNotes.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Notes archive grid */}
        {powLoading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardHeader className="pb-2">
                  <Skeleton className="h-3 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-4/5 mb-1" />
                  <Skeleton className="h-4 w-3/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!powLoading && filteredNotes.length === 0 && (
          <Card className="border-dashed mb-6">
            <CardContent className="py-10 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? `No notes found for "${searchQuery}"` : 'No notes found. Try another relay.'}
              </p>
              {!searchQuery && <RelaySelector className="max-w-xs mx-auto mt-4" />}
            </CardContent>
          </Card>
        )}

        {!powLoading && displayedNotes.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {displayedNotes.map((note) => (
                <NoteCard key={note.id} event={note} />
              ))}
            </div>

            {filteredNotes.length > 6 && (
              <div className="flex justify-center mb-10">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  {showAll
                    ? `Show less`
                    : `Show all ${filteredNotes.length} notes`}
                  <ArrowRight className={`h-4 w-4 ml-2 transition-transform ${showAll ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── NOSTR NEWS BOX ── */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        {/* Section divider */}
        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground flex items-center gap-2">
              <Rss className="h-4 w-4" />
              Latest from Nostr
            </span>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Nostr News</h2>
              <p className="text-muted-foreground text-sm">Latest posts from BitPopArt</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/feed" className="flex items-center gap-2">
                <Rss className="h-4 w-4" />
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {notesError && (
            <Card className="border-dashed border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
              <CardContent className="py-8 px-6 text-center">
                <div className="max-w-sm mx-auto space-y-4">
                  <MessageSquare className="h-8 w-8 mx-auto text-orange-500" />
                  <div>
                    <CardTitle className="text-orange-600 dark:text-orange-400 mb-2 text-lg">
                      Unable to Load Updates
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Try switching to a different relay to see the latest updates.
                    </p>
                  </div>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {notesLoading && (
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-4/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!notesLoading && latestNotes && latestNotes.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 px-6 text-center">
                <div className="max-w-sm mx-auto space-y-4">
                  <MessageSquare className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <CardTitle className="mb-2">No Updates Found</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      No recent updates found. Try switching to a different relay.
                    </p>
                  </div>
                  <RelaySelector className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {!notesLoading && latestNotes && latestNotes.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {latestNotes.map((note, index) => (
                <div
                  key={note.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <NoteThumbnail event={note} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-center text-sm text-muted-foreground pb-6">
          <p>
            Engagement sourced live from Nostr relays. Data refreshes every 2 minutes.
          </p>
          <p className="mt-1">
            Built with{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors">
              Shakespeare
            </a>
            {' '}·{' '}
            <Link to="/" className="underline hover:text-foreground transition-colors">
              Back to BitPopArt
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
