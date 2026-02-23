import { useState, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Upload, Loader2, Trash2, ExternalLink, Image as ImageIcon, Sparkles } from 'lucide-react';

interface StreetArtPost {
  id: string;
  content: string;
  images: string[];
  created_at: string;
}

export function WallManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Fetch existing street art posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['wall-management'],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query(
        [
          {
            kinds: [1],
            authors: [user.pubkey],
            '#t': ['streetart'],
            limit: 50,
          },
        ],
        { signal }
      );

      const streetArtPosts: StreetArtPost[] = events.map((event) => {
        const imageRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp)/gi;
        const matches = event.content.match(imageRegex) || [];

        return {
          id: event.id,
          content: event.content,
          images: matches,
          created_at: new Date(event.created_at * 1000).toISOString(),
        };
      });

      return streetArtPosts.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user?.pubkey,
    staleTime: 30000,
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is larger than 10MB. Skipped.`);
        continue;
      }

      try {
        const tags = await uploadFile(file);
        const imageUrl = tags[0][1];
        uploadedUrls.push(imageUrl);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploadedImages([...uploadedImages, ...uploadedUrls]);
    setIsUploading(false);
    toast.success(`${uploadedUrls.length} image(s) uploaded!`);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsPosting(true);

    // Create content with description and images
    const content = [
      description.trim(),
      ...uploadedImages,
    ]
      .filter(Boolean)
      .join('\n\n');

    createEvent(
      {
        kind: 1,
        content,
        tags: [
          ['t', 'streetart'],
          ['t', 'art'],
        ],
      },
      {
        onSuccess: () => {
          toast.success('Street art posted!');
          setDescription('');
          setUploadedImages([]);
          queryClient.invalidateQueries({ queryKey: ['wall-management'] });
          queryClient.invalidateQueries({ queryKey: ['street-art-photos'] });
          setIsPosting(false);
        },
        onError: (error) => {
          console.error('Failed to post:', error);
          toast.error('Failed to post street art');
          setIsPosting(false);
        },
      }
    );
  };

  const handleDelete = (postId: string) => {
    if (!confirm('Delete this street art post?')) return;

    createEvent(
      {
        kind: 5,
        content: 'Deleted street art post',
        tags: [['e', postId]],
      },
      {
        onSuccess: () => {
          toast.success('Street art post deleted');
          queryClient.invalidateQueries({ queryKey: ['wall-management'] });
          queryClient.invalidateQueries({ queryKey: ['street-art-photos'] });
        },
        onError: (error) => {
          console.error('Failed to delete:', error);
          toast.error('Failed to delete post');
        },
      }
    );
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please log in to manage street art photos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Post New Street Art */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            Post Street Art
          </CardTitle>
          <CardDescription>
            Share street art photos on the Wall. Images will appear with #streetart
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the street art, location, artist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Images</Label>
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {uploadedImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </>
              )}
            </Button>
          </div>

          {/* Post Button */}
          <Button
            onClick={handlePost}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            disabled={isPosting || uploadedImages.length === 0}
          >
            {isPosting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Post to Wall
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Your Street Art Posts</CardTitle>
          <CardDescription>
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} with #streetart
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-24 h-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No street art posts yet</p>
              <p className="text-sm text-muted-foreground">Upload your first photo above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {post.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <img
                        src={post.images[0]}
                        alt="Street art"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      {post.images.length > 1 && (
                        <div className="text-xs text-center text-muted-foreground mt-1">
                          +{post.images.length - 1} more
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-3 mb-2">{post.content}</p>
                    <p className="text-xs text-muted-foreground">
                      Posted {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`https://njump.me/${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Wall Button */}
      <Card className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="py-8 text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
          >
            <a href="/wall" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-5 w-5" />
              View Wall Gallery
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
