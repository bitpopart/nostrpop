import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
import {
  Upload,
  Video,
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export function CreateVlogForm() {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a video
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select a video file',
        variant: 'destructive'
      });
      return;
    }

    // Create preview and check duration
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setVideoFile(file);

    // Check video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const duration = video.duration;
      setVideoDuration(duration);

      if (duration > 6) {
        toast({
          title: 'Video Too Long',
          description: `Video is ${duration.toFixed(1)}s. Please select a video 6 seconds or shorter for divine.video compatibility.`,
          variant: 'destructive'
        });
      }
    };
    video.src = url;
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
    setThumbnailFile(file);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to create a vlog',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title for your vlog',
        variant: 'destructive'
      });
      return;
    }

    if (!videoFile) {
      toast({
        title: 'Video Required',
        description: 'Please select a video file',
        variant: 'destructive'
      });
      return;
    }

    if (videoDuration > 6) {
      toast({
        title: 'Video Too Long',
        description: 'Video must be 6 seconds or shorter for divine.video',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadProgress(10);

      // Upload video
      const videoTags = await uploadFile(videoFile);
      const videoUrl = videoTags[0][1]; // First tag contains the URL

      setUploadProgress(50);

      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnailFile) {
        const thumbTags = await uploadFile(thumbnailFile);
        thumbnailUrl = thumbTags[0][1];
      }

      setUploadProgress(70);

      // Create NIP-71 video event (kind 34235 for landscape)
      // Use portrait (34236) if video is taller than wide
      const video = videoRef.current;
      const isPortrait = video && video.videoHeight > video.videoWidth;
      const kind = isPortrait ? 34236 : 34235;

      const eventTags: string[][] = [
        ['d', `vlog-${Date.now()}-${Math.random().toString(36).substring(7)}`],
        ['title', title.trim()],
        ['t', 'earth-journey'],
        ['t', 'vlog'],
        ...tags.map(tag => ['t', tag]),
      ];

      if (description.trim()) {
        eventTags.push(['summary', description.trim()]);
      }

      // Add imeta tag for NIP-71 compatibility
      const imetaParts = [
        `url ${videoUrl}`,
        `m ${videoFile.type}`,
        `size ${videoFile.size}`,
        `duration ${videoDuration.toFixed(2)}`,
      ];

      if (thumbnailUrl) {
        imetaParts.push(`image ${thumbnailUrl}`);
      }

      eventTags.push(['imeta', ...imetaParts]);

      setUploadProgress(90);

      createEvent({
        kind,
        content: '',
        tags: eventTags,
      }, {
        onSuccess: () => {
          toast({
            title: 'Vlog Created! 🎉',
            description: 'Your vlog has been published successfully',
          });

          // Reset form
          setTitle('');
          setDescription('');
          setTags([]);
          setVideoFile(null);
          setThumbnailFile(null);
          setVideoPreview(null);
          setThumbnailPreview(null);
          setUploadProgress(0);
          setVideoDuration(0);
        },
        onError: (error) => {
          console.error('Failed to publish vlog:', error);
          toast({
            title: 'Publish Failed',
            description: 'Failed to publish your vlog. Please try again.',
            variant: 'destructive'
          });
          setUploadProgress(0);
        }
      });

    } catch (error) {
      console.error('Error creating vlog:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload video. Please try again.',
        variant: 'destructive'
      });
      setUploadProgress(0);
    }
  };

  const isSubmitting = isUploading || isPublishing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-orange-500" />
          Create New Vlog
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload */}
          <div className="space-y-2">
            <Label>Video (Max 6 seconds for divine.video) *</Label>
            <div className="space-y-4">
              {videoPreview ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg max-h-96"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                      setVideoDuration(0);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {videoDuration > 0 && (
                    <div className={`mt-2 flex items-center gap-2 ${videoDuration > 6 ? 'text-red-600' : 'text-green-600'}`}>
                      {videoDuration > 6 ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        Duration: {videoDuration.toFixed(1)}s {videoDuration > 6 && '(Too long for divine.video)'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload video
                    </span>
                  </div>
                </Button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail (Optional)</Label>
            <div className="space-y-4">
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full rounded-lg max-h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Upload thumbnail
                    </span>
                  </div>
                </Button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter vlog title"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tags (e.g., nature, travel)"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Videos longer than 6 seconds won't be compatible with divine.video sharing.
              Your video will still be published on Nostr.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            disabled={isSubmitting || !videoFile || !title.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading...' : 'Publishing...'}
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Publish Vlog
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
