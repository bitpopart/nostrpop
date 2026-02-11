import { useState, useEffect } from 'react';
import { useArtworks } from '@/hooks/useArtworks';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { GripVertical, Save, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { ArtworkData } from '@/lib/artTypes';

export function ArtworkOrderManager() {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { data: artworks = [], isLoading } = useArtworks('all');
  
  const [orderedArtworks, setOrderedArtworks] = useState<ArtworkData[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize ordered artworks when data loads
  useEffect(() => {
    console.log('[ArtworkOrderManager] Artworks loaded:', artworks.length);
    if (artworks.length > 0) {
      setOrderedArtworks(artworks);
      console.log('[ArtworkOrderManager] Ordered artworks set:', artworks.map(a => ({ title: a.title, order: a.order })));
    }
  }, [artworks]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newArtworks = [...orderedArtworks];
    const draggedItem = newArtworks[draggedIndex];
    
    // Remove from old position
    newArtworks.splice(draggedIndex, 1);
    // Insert at new position
    newArtworks.splice(index, 0, draggedItem);
    
    setOrderedArtworks(newArtworks);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    if (!user) {
      toast.error('You must be logged in to save order');
      return;
    }

    // Update each artwork with new order
    for (let i = 0; i < orderedArtworks.length; i++) {
      const artwork = orderedArtworks[i];
      if (!artwork.event) continue;

      // Parse existing content
      const content = JSON.parse(artwork.event.content);
      
      // Get existing tags, filter out old order tag
      const existingTags = artwork.event.tags.filter(([name]) => name !== 'order');
      
      // Add new order tag
      const newTags = [
        ...existingTags,
        ['order', i.toString()]
      ];

      // Publish updated event
      createEvent({
        kind: 30023,
        content: JSON.stringify(content),
        tags: newTags,
      });
    }

    toast.success('Artwork order updated successfully!');
    setHasChanges(false);
    
    // Refetch after a delay to get updated events
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
    }, 1000);
  };

  const handleReset = () => {
    setOrderedArtworks(artworks);
    setHasChanges(false);
    toast.success('Order reset to current saved state');
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to manage artwork order</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Artwork Display Order</CardTitle>
            <CardDescription>
              Drag and drop artworks to reorder them in the gallery
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSaveOrder}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Order
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : orderedArtworks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No artworks found. Create your first artwork!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderedArtworks.map((artwork, index) => (
              <div
                key={artwork.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 border rounded-lg cursor-move transition-all ${
                  draggedIndex === index
                    ? 'opacity-50 scale-95'
                    : 'hover:shadow-md hover:border-purple-300'
                }`}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                  {artwork.images[0] ? (
                    <img
                      src={artwork.images[0]}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{artwork.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    {artwork.featured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                    <Badge
                      variant={
                        artwork.sale_type === 'fixed'
                          ? 'default'
                          : artwork.sale_type === 'auction'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {artwork.sale_type === 'fixed' && 'For Sale'}
                      {artwork.sale_type === 'auction' && 'Auction'}
                      {artwork.sale_type === 'sold' && 'Sold'}
                      {artwork.sale_type === 'not_for_sale' && 'Not For Sale'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasChanges && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              ⚠️ You have unsaved changes. Click "Save Order" to apply the new order.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
