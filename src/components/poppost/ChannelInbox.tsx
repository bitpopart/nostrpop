import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { useChannelPosts, type ChannelPost } from '@/hooks/useChannelPosts';
import { Image as ImageIcon, Inbox, Calendar, Plus, Check } from 'lucide-react';

const IMPORTED_KEY = 'poppost_imported_channel_posts';

function loadImported(): Set<string> {
  try {
    const raw = localStorage.getItem(IMPORTED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

interface ChannelInboxProps {
  onAddToScheduler: (post: ChannelPost) => void;
}

export function ChannelInbox({ onAddToScheduler }: ChannelInboxProps) {
  const { data: posts, isLoading } = useChannelPosts();
  const { toast } = useToast();
  const [imported, setImported] = useState<Set<string>>(loadImported);

  const handleAdd = useCallback((post: ChannelPost) => {
    onAddToScheduler(post);
    setImported(prev => {
      const next = new Set(prev);
      next.add(post.eventId);
      try {
        localStorage.setItem(IMPORTED_KEY, JSON.stringify([...next]));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    toast({ title: '✅ Added to scheduler', description: 'Post is now a draft — set a time and publish to Nostr.' });
  }, [onAddToScheduler, toast]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium mb-2">Channel inbox is empty</p>
          <p className="text-muted-foreground text-sm">
            Post an image in the “Schedule POP posts” channel (tag @BitBot Posts), and it will appear here for scheduling.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const done = imported.has(post.eventId);
        return (
          <Card key={post.eventId} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md transition-all hover:shadow-lg">
            <CardContent className="p-4 flex gap-4 items-center">
              <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {post.images[0] ? (
                  <img
                    src={post.images[0].src}
                    alt={post.images[0].alt ?? post.caption ?? 'POP post'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">
                  {post.caption || <span className="text-muted-foreground italic">No caption</span>}
                </p>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.hashtags.slice(0, 5).map((t) => (
                      <span key={t} className="text-xs text-orange-600 dark:text-orange-400">#{t}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.createdAt * 1000).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {post.images.length > 1 && ` · ${post.images.length} images`}
                </p>
              </div>

              <Button
                variant={done ? 'outline' : 'default'}
                disabled={done}
                onClick={() => handleAdd(post)}
                className={done ? 'flex-shrink-0' : 'flex-shrink-0 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'}
              >
                {done ? <Check className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                {done ? 'Added' : 'Add to scheduler'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
