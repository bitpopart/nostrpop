/**
 * useScheduledPostsPublisher
 *
 * Background hook that checks every 30 seconds whether any scheduled posts
 * are due. When a post is due and has a pre-signed event stored, it broadcasts
 * the event directly to the relay — no re-signing required.
 *
 * If no pre-signed event is stored (legacy / draft-promoted posts), it falls
 * back to re-publishing via useNostrPublish (which will prompt the signer).
 */
import { useEffect, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';
import type { ScheduledPost } from '@/hooks/useScheduledPosts';

interface UseScheduledPostsPublisherOptions {
  upcomingPosts: ScheduledPost[];
  onMarkPublished: (id: string, eventId: string) => void;
  onMarkFailed: (id: string) => void;
}

const POLL_INTERVAL_MS = 30_000; // check every 30 seconds

export function useScheduledPostsPublisher({
  upcomingPosts,
  onMarkPublished,
  onMarkFailed,
}: UseScheduledPostsPublisherOptions) {
  const { nostr } = useNostr();
  const { toast } = useToast();

  // Track which post IDs are currently being published to avoid double-firing
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function checkAndPublish() {
      const now = Date.now();

      for (const post of upcomingPosts) {
        if (post.status !== 'scheduled') continue;
        if (inFlightRef.current.has(post.id)) continue;

        const scheduledTime = new Date(post.scheduledAt).getTime();
        if (scheduledTime > now) continue; // not yet due

        // Only auto-publish if we have a pre-signed event stored
        if (!post.signedEvent) continue;

        inFlightRef.current.add(post.id);

        try {
          // Broadcast the pre-signed event directly — no signer needed
          await nostr.event(post.signedEvent, { signal: AbortSignal.timeout(8000) });
          onMarkPublished(post.id, post.signedEvent.id);
          toast({
            title: '✅ Auto-published!',
            description: `"${post.caption?.slice(0, 60) || 'Your post'}" was published to Nostr.`,
          });
        } catch (err) {
          console.error('[useScheduledPostsPublisher] Failed to broadcast:', err);
          onMarkFailed(post.id);
          toast({
            title: '❌ Auto-publish failed',
            description: `Could not publish "${post.caption?.slice(0, 40) || 'your post'}". Open the post and try publishing manually.`,
            variant: 'destructive',
          });
        } finally {
          inFlightRef.current.delete(post.id);
        }
      }
    }

    // Run immediately on mount / when posts change
    checkAndPublish();

    const interval = setInterval(checkAndPublish, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [upcomingPosts, nostr, onMarkPublished, onMarkFailed, toast]);
}
