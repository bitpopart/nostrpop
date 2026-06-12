import { useMemo } from 'react';
import type { ScheduledPost } from '@/hooks/useScheduledPosts';
import { useAdminRecentPosts, usePostEngagement } from '@/hooks/usePostEngagement';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Zap,
  Repeat2,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Image as ImageIcon,
  Award,
} from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

interface EngagementDashboardProps {
  publishedPosts: ScheduledPost[];
}

export function EngagementDashboard({ publishedPosts }: EngagementDashboardProps) {
  const { data: recentNostrPosts, isLoading: isLoadingPosts } = useAdminRecentPosts(50);

  // Use event IDs from published posts (if we have them) + recent Nostr posts
  const nostrEventIds = useMemo(() => {
    const ids: string[] = [];
    // Add event IDs from scheduled posts that were published
    for (const p of publishedPosts) {
      if (p.publishedEventId) ids.push(p.publishedEventId);
    }
    // Add recent Nostr posts
    if (recentNostrPosts) {
      for (const e of recentNostrPosts) {
        if (!ids.includes(e.id)) ids.push(e.id);
      }
    }
    return ids.slice(0, 50);
  }, [publishedPosts, recentNostrPosts]);

  const { data: engagement, isLoading: isLoadingEngagement } = usePostEngagement(nostrEventIds);

  const isLoading = isLoadingPosts || isLoadingEngagement;

  // Build combined post list with engagement data
  const postsWithEngagement = useMemo(() => {
    if (!recentNostrPosts || !engagement) return [];

    return recentNostrPosts.map(event => {
      const eng = engagement[event.id] ?? { eventId: event.id, likes: 0, zaps: 0, zapAmount: 0, reposts: 0, replies: 0 };
      const totalScore = eng.likes + eng.zaps * 3 + eng.reposts * 2 + eng.replies;
      return { event, engagement: eng, score: totalScore };
    }).sort((a, b) => b.score - a.score);
  }, [recentNostrPosts, engagement]);

  // Overall stats
  const totals = useMemo(() => {
    if (!engagement) return { likes: 0, zaps: 0, zapAmount: 0, reposts: 0, replies: 0 };
    return Object.values(engagement).reduce(
      (acc, e) => ({
        likes: acc.likes + e.likes,
        zaps: acc.zaps + e.zaps,
        zapAmount: acc.zapAmount + e.zapAmount,
        reposts: acc.reposts + e.reposts,
        replies: acc.replies + e.replies,
      }),
      { likes: 0, zaps: 0, zapAmount: 0, reposts: 0, replies: 0 }
    );
  }, [engagement]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-600" />
          Community Engagement
        </h2>
        <p className="text-sm text-muted-foreground">
          Track reactions, zaps, and engagement on your Nostr posts to understand your community.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Heart}
          label="Total Likes"
          value={isLoading ? null : totals.likes}
          color="text-red-500"
          bg="bg-red-100 dark:bg-red-900/30"
        />
        <StatCard
          icon={Zap}
          label="Total Zaps"
          value={isLoading ? null : totals.zaps}
          subValue={isLoading ? null : `${totals.zapAmount.toLocaleString()} sats`}
          color="text-yellow-500"
          bg="bg-yellow-100 dark:bg-yellow-900/30"
        />
        <StatCard
          icon={Repeat2}
          label="Reposts"
          value={isLoading ? null : totals.reposts}
          color="text-green-500"
          bg="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          icon={MessageCircle}
          label="Replies"
          value={isLoading ? null : totals.replies}
          color="text-blue-500"
          bg="bg-blue-100 dark:bg-blue-900/30"
        />
      </div>

      {/* Top performing posts */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-orange-600" />
            Top Posts
          </CardTitle>
          <CardDescription>
            Your most engaging Nostr posts, ranked by total community interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-16 h-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && postsWithEngagement.length === 0 && (
            <div className="text-center py-10">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No post data yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start publishing posts to see your engagement analytics.
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-3">
              {postsWithEngagement.slice(0, 20).map(({ event, engagement: eng, score }, index) => (
                <PostEngagementRow
                  key={event.id}
                  rank={index + 1}
                  event={event}
                  likes={eng.likes}
                  zaps={eng.zaps}
                  zapAmount={eng.zapAmount}
                  reposts={eng.reposts}
                  replies={eng.replies}
                  score={score}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  subValue?: string | null;
  color: string;
  bg: string;
}) {
  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          {value === null ? (
            <Skeleton className="h-6 w-10 mb-1" />
          ) : (
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
          {subValue !== undefined && (
            value === null ? (
              <Skeleton className="h-3 w-16 mt-0.5" />
            ) : (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── PostEngagementRow ──────────────────────────────────────────────────────────

function extractImageFromEvent(event: NostrEvent): string | null {
  // Check imeta tags
  const imetaTag = event.tags.find(([name]) => name === 'imeta');
  if (imetaTag) {
    const urlEntry = imetaTag.slice(1).find((v) => v.startsWith('url '));
    if (urlEntry) return urlEntry.replace('url ', '');
  }

  // Check image URLs in content
  const urlMatch = event.content.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|svg)(\?\S*)?/i);
  if (urlMatch) return urlMatch[0];

  return null;
}

function PostEngagementRow({
  rank,
  event,
  likes,
  zaps,
  zapAmount,
  reposts,
  replies,
  score,
}: {
  rank: number;
  event: NostrEvent;
  likes: number;
  zaps: number;
  zapAmount: number;
  reposts: number;
  replies: number;
  score: number;
}) {
  const imageUrl = extractImageFromEvent(event);
  const preview = event.content.replace(/https?:\/\/\S+/g, '').replace(/#\w+/g, '').trim();
  const hashtags = event.content.match(/#(\w+)/g)?.slice(0, 4) ?? [];

  const topBadgeColor = rank === 1 ? 'bg-yellow-400 text-yellow-900' : rank === 2 ? 'bg-gray-300 text-gray-800' : rank === 3 ? 'bg-amber-600 text-amber-50' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

  return (
    <div className="flex gap-3 p-3 rounded-xl hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors">
      {/* Rank */}
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${topBadgeColor}`}>
        {rank}
      </div>

      {/* Image */}
      {imageUrl ? (
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm line-clamp-2 mb-1">
          {preview || <span className="text-muted-foreground italic">Image post</span>}
        </p>
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {hashtags.map(tag => (
              <span key={tag} className="text-xs text-orange-600 dark:text-orange-400">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3 text-red-400" />
            {likes}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-400" />
            {zaps}{zapAmount > 0 && ` (${zapAmount.toLocaleString()}s)`}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="h-3 w-3 text-green-400" />
            {reposts}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3 text-blue-400" />
            {replies}
          </span>
        </div>
      </div>

      {/* Score badge */}
      <div className="flex-shrink-0 flex items-center">
        {score > 0 && (
          <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 text-xs">
            {score}
          </Badge>
        )}
      </div>
    </div>
  );
}
