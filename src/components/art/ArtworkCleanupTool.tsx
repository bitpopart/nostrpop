import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDeleteArtwork } from '@/hooks/useArtworks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import type { ArtworkData } from '@/lib/artTypes';

interface DuplicateGroup {
  imageUrl: string;
  artworks: ArtworkData[];
}

export function ArtworkCleanupTool() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutate: deleteArtwork } = useDeleteArtwork();
  const [isClearing, setIsClearing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Query all artworks including deleted ones
  const { data: allArtworks, isLoading, refetch } = useQuery({
    queryKey: ['artwork-cleanup-scan'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Query for ALL artwork events (both kinds, don't filter by deletion)
      const artworkEvents = await nostr.query([
        {
          kinds: [39239, 30023],
          '#t': ['artwork'],
          limit: 200, // Increase limit to catch all artworks
        }
      ], { signal });

      console.log(`[Cleanup Tool] Found ${artworkEvents.length} total artwork events`);

      // Parse all events into artwork data
      const artworks = artworkEvents
        .map(event => {
          try {
            const content = JSON.parse(event.content);
            const dTag = event.tags.find(([name]) => name === 'd')?.[1];
            const titleTag = event.tags.find(([name]) => name === 'title')?.[1];

            if (!dTag || !titleTag || !content.images?.length) {
              return null;
            }

            return {
              id: dTag,
              event,
              title: content.title,
              description: content.description || '',
              images: content.images || [],
              artist_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              sale_type: 'not_for_sale' as const,
            } as ArtworkData;
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean) as ArtworkData[];

      console.log(`[Cleanup Tool] Parsed ${artworks.length} valid artworks`);
      return artworks;
    },
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
  });

  // Find duplicates by image URL
  const findDuplicates = (): DuplicateGroup[] => {
    if (!allArtworks) return [];

    const imageMap = new Map<string, ArtworkData[]>();

    // Group artworks by their first image URL
    allArtworks.forEach(artwork => {
      if (artwork.images && artwork.images.length > 0) {
        const firstImage = artwork.images[0];
        const existing = imageMap.get(firstImage) || [];
        existing.push(artwork);
        imageMap.set(firstImage, existing);
      }
    });

    // Filter to only groups with duplicates
    const duplicates: DuplicateGroup[] = [];
    imageMap.forEach((artworks, imageUrl) => {
      if (artworks.length > 1) {
        duplicates.push({ imageUrl, artworks });
      }
    });

    return duplicates.sort((a, b) => b.artworks.length - a.artworks.length);
  };

  const duplicateGroups = findDuplicates();

  const handleClearLocalCache = () => {
    if (!confirm('This will clear the local deletion cache. Deleted artworks may temporarily reappear until the page is refreshed. Continue?')) {
      return;
    }

    setIsClearing(true);
    try {
      localStorage.removeItem('nostrpop_deleted_artworks');
      toast.success('Local deletion cache cleared');
      
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['artwork-cleanup-scan'] });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteArtwork = (artwork: ArtworkData) => {
    if (!confirm(`Delete "${artwork.title}"? This action cannot be undone.`)) {
      return;
    }

    const artworkKey = `${artwork.artist_pubkey}:${artwork.id}`;
    setDeletingIds(prev => new Set(prev).add(artworkKey));

    deleteArtwork(
      { artworkId: artwork.id, artistPubkey: artwork.artist_pubkey },
      {
        onSuccess: () => {
          toast.success(`Deleted: ${artwork.title}`);
          setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(artworkKey);
            return newSet;
          });
          // Refetch to update the duplicate list
          refetch();
        },
        onError: () => {
          setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(artworkKey);
            return newSet;
          });
        }
      }
    );
  };

  const handleDeleteOlderDuplicates = (group: DuplicateGroup) => {
    // Keep the newest artwork, delete all others
    const sorted = [...group.artworks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const toDelete = sorted.slice(1); // All except the first (newest)

    if (!confirm(`This will delete ${toDelete.length} older duplicate(s) of this artwork. The newest version will be kept. Continue?`)) {
      return;
    }

    toDelete.forEach(artwork => {
      const artworkKey = `${artwork.artist_pubkey}:${artwork.id}`;
      setDeletingIds(prev => new Set(prev).add(artworkKey));

      deleteArtwork(
        { artworkId: artwork.id, artistPubkey: artwork.artist_pubkey },
        {
          onSuccess: () => {
            setDeletingIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(artworkKey);
              return newSet;
            });
          },
          onError: () => {
            setDeletingIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(artworkKey);
              return newSet;
            });
          }
        }
      );
    });

    // Refetch after a delay to see results
    setTimeout(() => {
      refetch();
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
          Artwork Cleanup Tool
        </CardTitle>
        <CardDescription>
          Find and remove duplicate artworks, or clear the local deletion cache
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => refetch()}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan for Duplicates
              </>
            )}
          </Button>
          <Button
            onClick={handleClearLocalCache}
            variant="outline"
            disabled={isClearing}
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Local Cache
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        {allArtworks && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{allArtworks.length}</div>
              <div className="text-sm text-muted-foreground">Total Artworks</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{duplicateGroups.length}</div>
              <div className="text-sm text-muted-foreground">Duplicate Sets</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {duplicateGroups.reduce((sum, group) => sum + group.artworks.length - 1, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Extra Copies</div>
            </div>
          </div>
        )}

        {/* Duplicate Groups */}
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Scanning artworks...</p>
          </div>
        ) : duplicateGroups.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="font-medium">No duplicates found!</p>
            <p className="text-sm text-muted-foreground">Your artwork gallery is clean.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Duplicate Artworks</h3>
              <Badge variant="destructive">{duplicateGroups.length} groups</Badge>
            </div>

            {duplicateGroups.map((group, index) => (
              <Card key={index} className="border-2 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {group.artworks[0].title}
                      </CardTitle>
                      <CardDescription>
                        {group.artworks.length} duplicate{group.artworks.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <img
                      src={group.imageUrl}
                      alt="Artwork preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.artworks
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((artwork, artworkIndex) => {
                      const artworkKey = `${artwork.artist_pubkey}:${artwork.id}`;
                      const isDeleting = deletingIds.has(artworkKey);
                      const isNewest = artworkIndex === 0;

                      return (
                        <div
                          key={artwork.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            isNewest
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground truncate">
                                {artwork.id.slice(0, 20)}...
                              </span>
                              {isNewest && (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                  Newest
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created: {new Date(artwork.created_at).toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteArtwork(artwork)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}

                  {group.artworks.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleDeleteOlderDuplicates(group)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {group.artworks.length - 1} Older Duplicate{group.artworks.length > 2 ? 's' : ''}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
