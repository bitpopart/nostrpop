import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePopFans, type ZapperEntry, type ReactorEntry, type LikeEntry } from '@/hooks/usePopFans';
import { useAuthor } from '@/hooks/useAuthor';
import { useProofOfWork } from '@/hooks/useProofOfWork';
import { useLatestAdminNotes } from '@/hooks/useAdminNotes';
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
            {powLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-12 w-72 mx-auto" />
                <Skeleton className="h-5 w-40 mx-auto" />
              </div>
            ) : pow?.nostrSinceDate ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">
                  🟣 On Nostr Since
                </p>
                <p
                  className="text-4xl sm:text-5xl font-black mb-2 tracking-tight"
                  style={{
                    background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {formatFullDate(pow.nostrSinceDate)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {pow.totalCount.toLocaleString()} original notes published on the protocol
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Loading Nostr history…</p>
            )}
          </CardContent>
        </Card>

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
