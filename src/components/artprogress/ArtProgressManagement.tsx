import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useBitPopArtPosts } from '@/hooks/useBitPopArtPosts';
import { useQueryClient } from '@tanstack/react-query';
import { getFirstImage } from '@/lib/extractImages';
import { Pencil, Check, X } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

export function ArtProgressManagement() {
  const { data: allPosts, isLoading } = useBitPopArtPosts();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Load selected posts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('featured-bitpopart-posts');
    if (stored) {
      try {
        const ids: string[] = JSON.parse(stored);
        setSelectedIds(ids);
      } catch {
        setSelectedIds([]);
      }
    }
  }, []);

  const handleTogglePost = (postId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(postId)) {
        return prev.filter(id => id !== postId);
      } else {
        return [...prev, postId];
      }
    });
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('featured-bitpopart-posts', JSON.stringify(selectedIds));
    
    // Invalidate the featured posts query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['featured-bitpopart-posts'] });
    
    alert(`Successfully saved ${selectedIds.length} featured posts!`);
  };

  const handleSelectAll = () => {
    if (allPosts) {
      setSelectedIds(allPosts.map(post => post.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Pencil className="h-6 w-6 mr-2" />
            Art Progress Management
          </CardTitle>
          <CardDescription>
            Loading posts...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Pencil className="h-6 w-6 mr-2" />
          Art Progress Management
        </CardTitle>
        <CardDescription>
          All posts with #bitpopart automatically appear on the homepage. Select specific posts here to feature only those (optional). If nothing is selected, all posts are shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-medium">Total Posts</div>
              <div className="text-2xl font-bold">{allPosts?.length || 0}</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-sm font-medium">Featured</div>
              <div className="text-2xl font-bold text-purple-600">{selectedIds.length}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <Check className="h-4 w-4 mr-1" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              <X className="h-4 w-4 mr-1" />
              Deselect All
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Posts List */}
        {!allPosts || allPosts.length === 0 ? (
          <div className="text-center py-12">
            <Pencil className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Posts Found</h3>
            <p className="text-sm text-muted-foreground">
              No posts with #bitpopart tag found. Posts will appear here once created.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {allPosts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                isSelected={selectedIds.includes(post.id)}
                onToggle={() => handleTogglePost(post.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PostItemProps {
  post: NostrEvent;
  isSelected: boolean;
  onToggle: () => void;
}

function PostItem({ post, isSelected, onToggle }: PostItemProps) {
  const firstImage = getFirstImage(post.content, post.tags);
  const createdAt = new Date(post.created_at * 1000);
  const previewText = post.content.substring(0, 100).replace(/https?:\/\/[^\s]+/g, '');

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-muted/50 ${
        isSelected
          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
          : 'border-transparent bg-muted/20'
      }`}
      onClick={onToggle}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      
      {firstImage && (
        <div className="flex-shrink-0">
          <img
            src={firstImage.url}
            alt="Post preview"
            className="w-20 h-20 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
            {isSelected ? 'Featured' : 'Not Featured'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm line-clamp-2">
          {previewText || 'No text content'}
        </p>
        {firstImage && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Pencil className="h-3 w-3" />
            <span>Has image</span>
          </div>
        )}
      </div>
    </div>
  );
}
