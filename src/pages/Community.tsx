import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePopFans, type ZapperEntry, type ReactorEntry, type LikeEntry } from '@/hooks/usePopFans';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { nip19 } from 'nostr-tools';
import { Zap, Heart, Star, Trophy, Clock, Users } from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Community() {
  useSeoMeta({
    title: 'PopFans Community – BitPopArt',
    description: 'Meet the top supporters of BitPopArt on Nostr. See who zapped and reacted the most to bitpopart\'s posts.',
    ogTitle: 'PopFans Community – BitPopArt',
    ogDescription: 'Top zappers and fans of BitPopArt on Nostr',
  });

  const { data, isLoading, error } = usePopFans();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-pink-50 dark:from-gray-950 dark:via-background dark:to-gray-900">
      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f7931a, #ff6b6b)' }}>
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span style={{
              background: 'linear-gradient(90deg, #f7931a, #ff6b6b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              PopFans
            </span>
          </h1>
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
