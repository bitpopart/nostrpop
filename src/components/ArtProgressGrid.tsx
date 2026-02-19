import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import { getFirstImage } from '@/lib/extractImages';
import type { NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';

interface ArtProgressGridProps {
  posts: NostrEvent[];
  isLoading?: boolean;
}

function ProgressThumbnail({ event }: { event: NostrEvent }) {
  // Extract first image from the note
  const firstImage = getFirstImage(event.content, event.tags);
  const createdAt = new Date(event.created_at * 1000);

  return (
    <Link to={`/feed#event-${event.id}`}>
      <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        {firstImage ? (
          <div className="aspect-square relative overflow-hidden">
            <img
              src={firstImage.url}
              alt={firstImage.alt || 'Art in progress'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                // Show placeholder if image fails to load
                const placeholder = e.currentTarget.parentElement!.querySelector('.image-placeholder');
                if (placeholder) {
                  e.currentTarget.style.display = 'none';
                  (placeholder as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Fallback placeholder (hidden by default) */}
            <div className="image-placeholder absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 hidden items-center justify-center">
              <Pencil className="h-12 w-12 text-purple-400 dark:text-purple-500" />
            </div>
            {/* Date badge */}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              {createdAt.toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 flex items-center justify-center">
            <Pencil className="h-12 w-12 text-purple-400 dark:text-purple-500" />
          </div>
        )}
      </Card>
    </Link>
  );
}

function ProgressThumbnailSkeleton() {
  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
      <div className="aspect-square">
        <Skeleton className="w-full h-full" />
      </div>
    </Card>
  );
}

export function ArtProgressGrid({ posts, isLoading }: ArtProgressGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <ProgressThumbnailSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-6 text-center">
          <Pencil className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Art in Progress</h3>
          <p className="text-sm text-muted-foreground">
            No posts tagged with #bitpopart yet. Start creating and sharing your art!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <ProgressThumbnail event={post} />
        </div>
      ))}
    </div>
  );
}
