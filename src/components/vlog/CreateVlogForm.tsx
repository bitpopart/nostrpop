import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  Loader2,
  Image as ImageIcon,
  Play,
  VolumeX,
  Volume2,
  Scissors
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
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // New trim and processing states
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(6);
  const [showTrimEditor, setShowTrimEditor] = useState<boolean>(false);
  const [muteAudio, setMuteAudio] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [videoPreview, thumbnailPreview]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select a video file',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Video must be less than 100MB',
        variant: 'destructive'
      });
      return;
    }

    if (videoPreview) URL.revokeObjectURL(videoPreview);

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    // Load video metadata
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      setVideoDuration(duration);
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight,
      });

      // Set trim range
      setTrimStart(0);
      setTrimEnd(Math.min(duration, 6));

      // Show trim editor if video is longer than 6 seconds
      if (duration > 6) {
        setShowTrimEditor(true);
        toast({
          title: 'Video Needs Trimming',
          description: 'Videos must be 6 seconds or less. Please trim your video.',
        });
      } else {
        setShowTrimEditor(false);
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

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);

    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
    setThumbnailFile(file);
  };

  const generateThumbnailFromVideo = async () => {
    if (!videoPreview || !videoRef.current) {
      toast({
        title: 'No Video Loaded',
        description: 'Please upload a video first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const video = videoRef.current;
      
      if (!video.duration || video.duration === 0 || isNaN(video.duration)) {
        toast({
          title: 'Video Still Loading',
          description: 'Please wait for the video to fully load',
          variant: 'destructive',
        });
        return;
      }

      if (!video.videoWidth || !video.videoHeight) {
        toast({
          title: 'Invalid Video',
          description: 'Cannot determine video dimensions',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Generating Thumbnail...',
        description: 'Capturing frame from your video',
      });

      // Use the middle of the trimmed section
      const trimDuration = trimEnd - trimStart;
      const seekTime = trimStart + (trimDuration / 2);
      
      // Wait for seek to complete
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Seek timeout')), 5000);
        video.onseeked = () => {
          clearTimeout(timeout);
          resolve();
        };
        video.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Video error during seek'));
        };
        video.currentTime = seekTime;
      });

      // Small delay to ensure frame is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create canvas to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/jpeg',
          0.85
        );
      });

      // Create file from blob
      const file = new File([blob], `thumbnail-${Date.now()}.jpg`, { type: 'image/jpeg' });

      setThumbnailFile(file);
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);

      toast({
        title: 'Thumbnail Generated!',
        description: `Captured frame from ${seekTime.toFixed(1)}s`,
      });

      video.currentTime = trimStart;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      toast({
        title: 'Failed to Generate Thumbnail',
        description: error instanceof Error ? error.message : 'Please try uploading a custom thumbnail',
        variant: 'destructive',
      });
    }
  };

  const processVideo = async (): Promise<File> => {
    if (!videoFile || !videoPreview || !videoRef.current) {
      throw new Error('No video to process');
    }

    const trimmedDuration = trimEnd - trimStart;
    
    if (trimmedDuration > 6) {
      throw new Error('Trimmed video must be 6 seconds or less');
    }

    // Check if we need to process the video (trim OR mute)
    const needsTrimming = trimStart > 0.1 || trimEnd < videoDuration - 0.1;
    const needsMuting = muteAudio;

    // If no processing needed
    if (!needsTrimming && !needsMuting) {
      return videoFile;
    }

    // Process video
    toast({
      title: 'Processing Video...',
      description: needsMuting && needsTrimming 
        ? 'Trimming and removing audio...' 
        : needsMuting 
        ? 'Removing audio...' 
        : 'Trimming video...',
    });

    try {
      const video = videoRef.current;
      
      // Create canvas to capture video frames
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Create MediaStream from canvas (video only, no audio)
      const stream = canvas.captureStream(30); // 30 fps
      
      // Set up MediaRecorder
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // Start recording
      mediaRecorder.start();

      // Set video to trim start
      video.currentTime = trimStart;
      
      // Wait for seek
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      // Start playing (muted)
      video.muted = true;
      await video.play();

      // Draw frames to canvas
      const drawFrame = () => {
        if (video.currentTime >= trimEnd || video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Wait for video to reach trim end
      await new Promise<void>((resolve) => {
        const checkTime = setInterval(() => {
          if (video.currentTime >= trimEnd - 0.05 || video.ended) {
            clearInterval(checkTime);
            resolve();
          }
        }, 100);
      });

      // Stop recording
      video.pause();
      mediaRecorder.stop();

      // Wait for final data
      const blob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          if (blob.size === 0) {
            reject(new Error('Processed video is empty'));
          } else {
            resolve(blob);
          }
        };
        setTimeout(() => reject(new Error('Recording timeout')), 10000);
      });

      // Create file from blob
      const processedFile = new File(
        [blob],
        `processed-${videoFile.name.replace(/\.[^/.]+$/, '')}.webm`,
        { type: 'video/webm' }
      );

      toast({
        title: 'Video Processed!',
        description: `Created ${trimmedDuration.toFixed(1)}s clip${muteAudio ? ' (muted)' : ''}`,
      });

      return processedFile;
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
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

    const trimmedDuration = trimEnd - trimStart;
    if (trimmedDuration > 6) {
      toast({
        title: 'Video Too Long',
        description: 'Trimmed video must be 6 seconds or shorter',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress(5);

      // Process video if needed (trim/mute)
      const finalVideo = await processVideo();
      
      setUploadProgress(20);

      // Upload video
      const videoTags = await uploadFile(finalVideo);
      const videoUrl = videoTags[0][1];

      setUploadProgress(60);

      // Upload thumbnail if provided
      let thumbnailUrl = '';
      if (thumbnailFile) {
        const thumbTags = await uploadFile(thumbnailFile);
        thumbnailUrl = thumbTags[0][1];
      }

      setUploadProgress(80);

      // Create NIP-71 video event
      const isPortrait = videoDimensions && videoDimensions.height > videoDimensions.width;
      const kind = isPortrait ? 34236 : 34235;

      const eventTags: string[][] = [
        ['d', `vlog-${Date.now()}-${Math.random().toString(36).substring(7)}`],
        ['title', title.trim()],
        ['t', 'bitpopart'],
        ['t', 'vlog'],
        ...tags.map(tag => ['t', tag]),
      ];

      if (description.trim()) {
        eventTags.push(['summary', description.trim()]);
      }

      // Add imeta tag for NIP-71
      const imetaParts = [
        `url ${videoUrl}`,
        `m ${finalVideo.type}`,
        `size ${finalVideo.size}`,
        `duration ${trimmedDuration.toFixed(2)}`,
      ];

      if (thumbnailUrl) {
        imetaParts.push(`image ${thumbnailUrl}`);
        eventTags.push(['thumb', thumbnailUrl]);
      }

      eventTags.push(['imeta', ...imetaParts]);

      setUploadProgress(95);

      createEvent({
        kind,
        content: '',
        tags: eventTags,
      }, {
        onSuccess: () => {
          toast({
            title: 'Vlog Published! 🎉',
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
          setTrimStart(0);
          setTrimEnd(6);
          setShowTrimEditor(false);
          setMuteAudio(false);
          setIsProcessing(false);
        },
        onError: (error) => {
          console.error('Failed to publish vlog:', error);
          toast({
            title: 'Publish Failed',
            description: 'Failed to publish your vlog. Please try again.',
            variant: 'destructive'
          });
          setUploadProgress(0);
          setIsProcessing(false);
        }
      });

    } catch (error) {
      console.error('Error creating vlog:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process video',
        variant: 'destructive'
      });
      setUploadProgress(0);
      setIsProcessing(false);
    }
  };

  const isSubmitting = isUploading || isPublishing || isProcessing;
  const trimmedDuration = trimEnd - trimStart;

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
            <Label>Video (Max 6 seconds) *</Label>
            <div className="space-y-4">
              {videoPreview ? (
                <div className="space-y-4">
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
                        setShowTrimEditor(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Video Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className={`flex items-center gap-2 ${trimmedDuration > 6 ? 'text-red-600' : 'text-green-600'}`}>
                      {trimmedDuration > 6 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      <span>Duration: {trimmedDuration.toFixed(1)}s</span>
                    </div>
                    {videoDimensions && (
                      <span className="text-muted-foreground">
                        {videoDimensions.width}x{videoDimensions.height}
                      </span>
                    )}
                  </div>

                  {/* Trim Editor */}
                  {showTrimEditor && (
                    <div className="p-4 bg-muted rounded-lg space-y-4">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        <Label>Trim Video (required)</Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Start: {trimStart.toFixed(1)}s</span>
                          <span>End: {trimEnd.toFixed(1)}s</span>
                        </div>
                        <div className="space-y-2">
                          <Slider
                            min={0}
                            max={videoDuration}
                            step={0.1}
                            value={[trimStart, trimEnd]}
                            onValueChange={([start, end]) => {
                              setTrimStart(start);
                              setTrimEnd(end);
                              if (videoRef.current) {
                                videoRef.current.currentTime = start;
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mute Audio Option */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      {muteAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      <Label htmlFor="mute-audio" className="cursor-pointer">
                        Remove Audio
                      </Label>
                    </div>
                    <Switch
                      id="mute-audio"
                      checked={muteAudio}
                      onCheckedChange={setMuteAudio}
                    />
                  </div>
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

          {/* Thumbnail Section */}
          {videoPreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Thumbnail</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateThumbnailFromVideo}
                  disabled={!videoPreview}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Generate from Video
                </Button>
              </div>
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
                        Upload custom thumbnail
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
          )}

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
                placeholder="Add tags (e.g., art, creative)"
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
                <span>{isProcessing ? 'Processing...' : 'Uploading...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Videos must be 6 seconds or less. Use the trim tool if your video is longer.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            disabled={isSubmitting || !videoFile || !title.trim() || trimmedDuration > 6}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isProcessing ? 'Processing...' : isUploading ? 'Uploading...' : 'Publishing...'}
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
