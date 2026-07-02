import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
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
import { getAdminPubkeyHex } from '@/lib/adminUtils';
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
  Network,
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

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
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
      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all hover:scale-[1.01] hover:shadow-md ${medalBg(rank)}`}
    >
      {/* Rank */}
      <span className={`text-lg sm:text-xl font-black w-7 sm:w-8 text-center flex-shrink-0 ${medalColour(rank)}`}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
      </span>

      <ProfileAvatar pubkey={entry.pubkey} size={rank <= 3 ? 'lg' : 'md'} />
      {/* min-w-0 keeps the name from overflowing on narrow screens */}
      <div className="min-w-0 flex-1">
        <ProfileName pubkey={entry.pubkey} />
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <Badge
          className="text-white font-bold px-2 py-0.5 flex items-center gap-1 text-xs"
          style={{ background: '#f7931a' }}
        >
          <Zap className="h-3 w-3" />
          {formatSats(entry.totalSats)}
        </Badge>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{entry.zapCount} zap{entry.zapCount !== 1 ? 's' : ''}</span>
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
      className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-border bg-background hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all hover:shadow-sm"
    >
      <ProfileAvatar pubkey={entry.pubkey} />
      <div className="min-w-0 flex-1"><ProfileName pubkey={entry.pubkey} /></div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
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
      <div className="min-w-0 flex-1"><ProfileName pubkey={entry.pubkey} /></div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <Badge variant="secondary" className="text-xs font-medium whitespace-nowrap">
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
      <div className="min-w-0 flex-1"><ProfileName pubkey={entry.pubkey} /></div>
      <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">{timeAgo(entry.createdAt)}</span>
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

// ── WOT Network ──────────────────────────────────────────────────────────────

interface FanNode {
  pubkey: string;
  /** Combined engagement score: zap sats * 3 + reaction count */
  score: number;
  /** Radius of the orbit ring this node sits on */
  orbitRadius: number;
  /** Angle in degrees (0–360) on its orbit ring */
  angle: number;
  /** Pixel offset for the floating animation */
  floatOffset: number;
  /** Duration of one full float cycle (s) */
  floatDuration: number;
}


interface FanAvatarNodeProps {
  pubkey: string;
  cx: number;
  cy: number;
  size: number;
  score: number;
  floatOffset: number;
  floatDuration: number;
  delay: number;
}

function FanAvatarNode({ pubkey, cx, cy, size, floatOffset, floatDuration, delay }: FanAvatarNodeProps) {
  const author = useAuthor(pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.display_name ?? metadata?.name ?? genUserName(pubkey);
  const picture = metadata?.picture;
  const npub = pubkeyToNpub(pubkey);
  const initials = displayName.slice(0, 2).toUpperCase();

  const r = size / 2;
  const clipId = `clip-fan-${pubkey.slice(0, 8)}`;
  const animId = `float-${pubkey.slice(0, 8)}`;

  return (
    <g transform={`translate(${cx - r}, ${cy - r})`}>
      {/* Floating animation */}
      <animateTransform
        attributeName="transform"
        type="translate"
        values={`${cx - r},${cy - r + floatOffset} ; ${cx - r},${cy - r - floatOffset} ; ${cx - r},${cy - r + floatOffset}`}
        dur={`${floatDuration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        id={animId}
      />

      {/* Glow ring */}
      <circle
        cx={r}
        cy={r}
        r={r + 3}
        fill="none"
        stroke="#f97316"
        strokeWidth="1.5"
        opacity="0.4"
      />

      {/* Avatar clip */}
      <defs>
        <clipPath id={clipId}>
          <circle cx={r} cy={r} r={r} />
        </clipPath>
      </defs>

      {picture ? (
        <image
          href={picture}
          width={size}
          height={size}
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <>
          <circle cx={r} cy={r} r={r} fill="#f97316" opacity="0.9" />
          <text
            x={r}
            y={r}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={r * 0.7}
            fontWeight="bold"
            fill="white"
          >
            {initials}
          </text>
        </>
      )}

      {/* Invisible hit area linking to njump */}
      <a href={`https://njump.me/${npub}`} target="_blank" rel="noopener noreferrer">
        <circle cx={r} cy={r} r={r + 4} fill="transparent" cursor="pointer">
          <title>{displayName}</title>
        </circle>
      </a>
    </g>
  );
}

interface WotNetworkProps {
  data: ReturnType<typeof usePopFans>['data'];
  isLoading: boolean;
}

function WotNetwork({ data, isLoading }: WotNetworkProps) {
  const adminPubkey = getAdminPubkeyHex();
  const adminAuthor = useAuthor(adminPubkey);
  const adminMeta: NostrMetadata | undefined = adminAuthor.data?.metadata;
  const adminPicture = adminMeta?.picture;
  const adminName = adminMeta?.display_name ?? adminMeta?.name ?? 'BitPopArt';
  const adminClipId = 'clip-admin-center';

  // Build combined unique fan list from top zappers + top reactors, scored by engagement
  const fans: FanNode[] = useMemo(() => {
    if (!data) return [];

    const scoreMap = new Map<string, number>();

    // Zaps: weight heavily (sats * 3 to give zaps more impact, min 1 per zap)
    for (const z of data.allTimeTopZappers) {
      const s = Math.max(z.totalSats * 3, z.zapCount * 100);
      scoreMap.set(z.pubkey, (scoreMap.get(z.pubkey) ?? 0) + s);
    }
    // Reactions: each reaction = 50 score
    for (const r of data.latestTopReactors) {
      scoreMap.set(r.pubkey, (scoreMap.get(r.pubkey) ?? 0) + r.reactionCount * 50);
    }

    // Sort by score desc, take top 12
    const sorted = Array.from(scoreMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12);

    // Assign orbits: 3 rings with radii 120, 175, 220
    // Ring 0 (innermost): top 4, Ring 1: next 4, Ring 2: last 4
    const rings = [120, 175, 220];

    return sorted.map(([pubkey, score], i) => {
      const ring = Math.min(Math.floor(i / 4), 2);
      const posInRing = i % 4;
      // Evenly space within the ring but rotate each ring to avoid visual clash
      const ringOffset = ring * 22; // degrees
      const angle = ringOffset + (posInRing / 4) * 360 + (ring % 2 === 0 ? 0 : 45);

      return {
        pubkey,
        score,
        orbitRadius: rings[ring],
        angle,
        floatOffset: 4 + (i % 4) * 1.5,
        floatDuration: 3.5 + (i % 6) * 0.7,
      };
    });
  }, [data]);

  // SVG dimensions — responsive via viewBox
  const W = 480;
  const H = 480;
  const cx = W / 2;
  const cy = H / 2;
  const ADMIN_R = 38; // admin avatar radius
  const FAN_SIZE = 40; // fan avatar diameter

  if (isLoading) {
    return (
      <Card className="mb-10 shadow-md overflow-hidden">
        <CardContent className="py-10 flex items-center justify-center">
          <Skeleton className="w-64 h-64 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || fans.length === 0) return null;

  return (
    <Card className="mb-10 shadow-lg overflow-hidden border-2 border-orange-100 dark:border-orange-900"
      style={{ background: 'linear-gradient(135deg, #fff7ed, #fdf4ff)' }}>
      <CardHeader className="pb-1 pt-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Network className="h-5 w-5 text-orange-500" />
          Web of Trust
          <span className="ml-auto text-xs font-normal text-muted-foreground">Top fans &amp; friends</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          The real people keeping BitPopArt alive — connected by zaps, reactions &amp; love ⚡❤️
        </p>
      </CardHeader>

      <CardContent className="pt-2 pb-5">
        <div className="w-full max-w-sm mx-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ overflow: 'visible' }}
            aria-label="BitPopArt Web of Trust network"
          >
            <defs>
              {/* Radial glow for centre */}
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f7931a" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f7931a" stopOpacity="0" />
              </radialGradient>
              {/* Orbit ring gradient */}
              <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fdf6ee" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#f7931a" stopOpacity="0.04" />
              </radialGradient>
              <clipPath id={adminClipId}>
                <circle cx={cx} cy={cy} r={ADMIN_R} />
              </clipPath>
            </defs>

            {/* Background subtle glow */}
            <circle cx={cx} cy={cy} r={230} fill="url(#bgGrad)" />

            {/* Orbit rings — dashed circles */}
            {[120, 175, 220].map((r, i) => (
              <circle
                key={r}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#f7931a"
                strokeWidth="1"
                strokeDasharray="4 8"
                opacity={0.18 - i * 0.04}
              />
            ))}

            {/* Connection lines from centre to each fan */}
            {fans.map((fan) => {
              const rad = (fan.angle * Math.PI) / 180;
              const fx = cx + Math.cos(rad) * fan.orbitRadius;
              const fy = cy + Math.sin(rad) * fan.orbitRadius;
              return (
                <line
                  key={`line-${fan.pubkey}`}
                  x1={cx}
                  y1={cy}
                  x2={fx}
                  y2={fy}
                  stroke="#f7931a"
                  strokeWidth="1.2"
                  strokeDasharray="3 5"
                  opacity="0.35"
                >
                  {/* Pulse animation on the line opacity */}
                  <animate
                    attributeName="opacity"
                    values="0.2;0.55;0.2"
                    dur={`${3 + (fan.angle % 3)}s`}
                    repeatCount="indefinite"
                  />
                </line>
              );
            })}

            {/* Fan avatar nodes */}
            {fans.map((fan, i) => {
              const rad = (fan.angle * Math.PI) / 180;
              const fx = cx + Math.cos(rad) * fan.orbitRadius;
              const fy = cy + Math.sin(rad) * fan.orbitRadius;
              return (
                <FanAvatarNode
                  key={fan.pubkey}
                  pubkey={fan.pubkey}
                  cx={fx}
                  cy={fy}
                  size={FAN_SIZE}
                  score={fan.score}
                  floatOffset={fan.floatOffset}
                  floatDuration={fan.floatDuration}
                  delay={i * 0.3}
                />
              );
            })}

            {/* Centre glow halo */}
            <circle cx={cx} cy={cy} r={ADMIN_R + 20} fill="url(#centerGlow)" />

            {/* Admin pulse ring */}
            <circle cx={cx} cy={cy} r={ADMIN_R + 6} fill="none" stroke="#f7931a" strokeWidth="2" opacity="0.5">
              <animate attributeName="r" values={`${ADMIN_R + 4};${ADMIN_R + 12};${ADMIN_R + 4}`} dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.8s" repeatCount="indefinite" />
            </circle>

            {/* Admin avatar (centre) */}
            {adminPicture ? (
              <image
                href={adminPicture}
                x={cx - ADMIN_R}
                y={cy - ADMIN_R}
                width={ADMIN_R * 2}
                height={ADMIN_R * 2}
                clipPath={`url(#${adminClipId})`}
              />
            ) : (
              <>
                <circle cx={cx} cy={cy} r={ADMIN_R} fill="#f7931a" />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="bold" fill="white">BP</text>
              </>
            )}

            {/* Admin border ring */}
            <circle cx={cx} cy={cy} r={ADMIN_R} fill="none" stroke="#f7931a" strokeWidth="2.5" />

            {/* "BitPopArt" label below centre */}
            <text x={cx} y={cy + ADMIN_R + 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#f7931a" opacity="0.9">
              {adminName}
            </text>
          </svg>
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-1">
          Avatars ranked by zaps ⚡ &amp; reactions — tap any to view profile on Nostr
        </p>
      </CardContent>
    </Card>
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
  isPartial: boolean;
}

function ActivityChart({ notes, isLoading, isPartial }: ActivityChartProps) {
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
        return { label: yr, posts, cumulative: cum, isCurrent: yr === currentYear, monthKey: yr };
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
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
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

      <CardContent className="pt-2 pb-5">
        {/* Stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-widest text-purple-500 font-semibold mb-0.5">Total Notes</p>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{totalPosts}+</p>
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

        {/* Chart — extra bottom padding lets the angled labels breathe */}
        <div className="w-full" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 4, right: 8, left: -22, bottom: view === 'monthly' ? 48 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf620" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                /* Show every 3rd month (quarterly) so labels never crowd on any screen */
                interval={view === 'monthly' ? 2 : 0}
                angle={view === 'monthly' ? -45 : 0}
                textAnchor={view === 'monthly' ? 'end' : 'middle'}
                height={view === 'monthly' ? 52 : 20}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9, fill: '#f97316' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                yAxisId="left"
                dataKey="posts"
                name="Posts"
                radius={[3, 3, 0, 0]}
                maxBarSize={view === 'monthly' ? 14 : 56}
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

        {/* Legend key */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-1 mb-3">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-purple-500" />
            Notes per month
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" />
            Running total
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400" />
            Current month
          </span>
        </div>

        {/* Relay data disclaimer — always shown, emphasised when partial */}
        <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${
          isPartial
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300'
            : 'bg-muted/60 border-border text-muted-foreground'
        }`}>
          <p className="font-semibold mb-0.5 flex items-center gap-1.5">
            {isPartial ? '⚠️' : 'ℹ️'} About this data
          </p>
          <p>
            Counts are retrieved live from multiple Nostr archive relays (relay.nostr.band, nos.lol, Damus, Primal &amp; more).
            <strong> The real number of notes posted in 2023, 2024 &amp; 2025 is significantly higher</strong> — many older events
            are no longer stored by relays due to pruning, server issues or relay shutdowns over the years.
            The chart shows what relays currently return, not the full lifetime output.
            True Proof of Work is larger than these numbers suggest. 💜
          </p>
        </div>
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

// ── FAQ & Contact section ─────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'What is BitPopArt?',
    a: 'BitPopArt is a free Bitcoin & Pop Art creative platform by Johannes Oppewal (World Traveler, 88+ countries). Download wallpapers, GIFs, avatars, banners, coloring pages and more — completely free.',
  },
  {
    q: 'How do I download art?',
    a: 'Browse any category on the App page (Wallpapers, GIFs, Avatars, etc.), click on an image, then hit the "Download" button. You can also share directly to Nostr or your social apps.',
  },
  {
    q: 'Is everything really free?',
    a: 'Yes! All downloads are free. If you enjoy the art, you can support the creator with a Bitcoin Lightning tip (zap). Every zap helps keep the art flowing ⚡',
  },
  {
    q: 'What is Nostr?',
    a: 'Nostr is a decentralized social protocol. BitPopArt uses Nostr to publish and store all content — meaning no central server can censor or remove the art.',
  },
  {
    q: 'How do I support BitPopArt?',
    a: 'Zap (Bitcoin Lightning tip) any art you love, follow @bitpopart on Nostr, share the art with your friends, and join the community on the /app page!',
  },
  {
    q: 'Can I use the art for my profile or social media?',
    a: "Absolutely! That's what it's made for. Feel free to use BitPopArt wallpapers, GIFs and avatars for personal use. Please credit @bitpopart when sharing.",
  },
  {
    q: 'How do I create my own meme or avatar?',
    a: 'Go to /app and tap "Create" in the bottom bar. You\'ll find the Meme Creator, Card Creator and Avatar Generator — all running directly in your browser.',
  },
  {
    q: 'How can I contact BitPopArt?',
    a: 'Use the contact form below, or reach out on Nostr by searching for @bitpopart.',
  },
  {
    q: 'Where is BitPopArt from?',
    a: 'BitPopArt is created by Johannes Oppewal, a World Traveler who has visited 88+ countries. The art is inspired by global travels and Bitcoin culture.',
  },
  {
    q: 'I found a bug or have a suggestion. How do I report it?',
    a: 'Use the contact form below! We read every message. You can also reach out directly on Nostr by searching for @bitpopart.',
  },
];

function CommunityFaqContact() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent('BitPopArt Community Contact');
    const body = encodeURIComponent(`Name: ${contactName}\nEmail: ${contactEmail}\n\n${contactMsg}`);
    window.open(`mailto:shop@bitpopart.com?subject=${subject}&body=${body}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="space-y-10 pt-4">
      {/* Section divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            FAQ &amp; Support
          </span>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 shadow-md flex-shrink-0">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Everything you need to know about BitPopArt</p>
          </div>
        </div>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="border border-border rounded-xl overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-semibold pr-4 leading-snug">{item.q}</span>
                <ArrowRight className={`h-4 w-4 text-orange-500 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 pt-0 border-t border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed pt-3">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 shadow-md flex-shrink-0">
            <ExternalLink className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Contact &amp; Support</h2>
            <p className="text-xs text-muted-foreground">Questions, suggestions, or issues? We're here to help.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Direct channels */}
          <a
            href="mailto:shop@bitpopart.com"
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white/80 dark:bg-gray-800/80 hover:border-orange-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Email</p>
              <p className="text-xs text-muted-foreground truncate">Send us a message</p>
            </div>
          </a>
          <a
            href="https://njump.me/npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-white/80 dark:bg-gray-800/80 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Nostr</p>
              <p className="text-xs text-muted-foreground truncate">@bitpopart</p>
            </div>
          </a>
        </div>

        {/* Contact form */}
        <Card className="border-2 border-orange-100 dark:border-orange-900 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-400 to-pink-500" />
          <CardContent className="pt-5 pb-6 px-6">
            <h3 className="text-base font-bold mb-4">Send a Message</h3>
            {submitted ? (
              <div className="text-center py-8 space-y-2">
                <div className="text-4xl">📬</div>
                <p className="font-bold text-green-600 dark:text-green-400">Message sent successfully!</p>
                <p className="text-sm text-muted-foreground">We'll get back to you as soon as possible.</p>
                <button
                  className="mt-4 px-4 py-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name *</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Message *</label>
                  <textarea
                    placeholder="Your question, suggestion or report…"
                    value={contactMsg}
                    onChange={e => setContactMsg(e.target.value)}
                    rows={5}
                    required
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(90deg, #f7931a, #ff6b6b)' }}
                >
                  Send Message ✉️
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Or reach out on Nostr by searching for <span className="font-semibold text-orange-600 dark:text-orange-400">@bitpopart</span>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
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
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
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
            <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
              <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <span>All-Time Top Zappers</span>
              <span className="ml-auto text-xs sm:text-sm font-normal text-muted-foreground whitespace-nowrap">Hall of Fame</span>
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

        {/* ── WEB OF TRUST NETWORK ── */}
        <WotNetwork data={data} isLoading={isLoading} />

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
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
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
              className="text-3xl sm:text-5xl font-black mb-3 tracking-tight break-words"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatMonthYear(NOSTR_SINCE_DATE)}
            </p>

          </CardContent>
        </Card>

        {/* ── Activity / Consistency Chart ── */}
        <ActivityChart
          notes={pow?.allNotes ?? []}
          isLoading={powLoading}
          isPartial={pow?.isPartial ?? true}
        />

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

        {/* ── FAQ & Contact Section ── */}
        <CommunityFaqContact />

      </div>
    </div>
  );
}
