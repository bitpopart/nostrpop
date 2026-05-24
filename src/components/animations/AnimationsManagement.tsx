import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAnimations, usePublishAnimation, useDeleteAnimation } from '@/hooks/useAnimations';
import {
  Upload,
  Plus,
  Trash2,
  Loader2,
  X,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Play,
} from 'lucide-react';

interface PendingVideo {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  description: string;
  thumbFile: File | null;
  thumbPreview: string | null;
  thumbUrl: string | null;
  videoUrl: string | null;
  duration: number;
  mimeType: string;
  fileSize: number;
  uploading: boolean;
  error: boolean;
}

export function AnimationsManagement() {
  const { getGradientStyle } = useThemeColors();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publish, isPending: isPublishing } = usePublishAnimation();
  const { mutate: deleteAnim } = useDeleteAnimation();
  const { data: animations = [], isLoading } = useAnimations();

  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState<PendingVideo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (videoInputRef.current) videoInputRef.current.value = '';

    const newItems: PendingVideo[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      description: '',
      thumbFile: null,
      thumbPreview: null,
      thumbUrl: null,
      videoUrl: null,
      duration: 0,
      mimeType: file.type || 'video/mp4',
      fileSize: file.size,
      uploading: true,
      error: false,
    }));

    setPending(prev => [...prev, ...newItems]);

    // Load video metadata + upload in parallel
    await Promise.all(newItems.map(async (item) => {
      try {
        // Extract duration
        const duration = await new Promise<number>((resolve) => {
          const vid = document.createElement('video');
          vid.preload = 'metadata';
          vid.onloadedmetadata = () => resolve(isNaN(vid.duration) ? 0 : vid.duration);
          vid.onerror = () => resolve(0);
          vid.src = item.previewUrl;
        });

        // Upload video
        const tags = await uploadFile(item.file);
        const videoUrl = tags[0][1];

        setPending(prev => prev.map(p =>
          p.id === item.id
            ? { ...p, videoUrl, duration, uploading: false }
            : p
        ));
      } catch {
        setPending(prev => prev.map(p =>
          p.id === item.id ? { ...p, uploading: false, error: true } : p
        ));
      }
    }));
  };

  const handleThumbFile = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPending(prev => prev.map(p =>
      p.id === itemId ? { ...p, thumbFile: file, thumbPreview: previewUrl, thumbUrl: null } : p
    ));

    try {
      const tags = await uploadFile(file);
      const thumbUrl = tags[0][1];
      setPending(prev => prev.map(p =>
        p.id === itemId ? { ...p, thumbUrl } : p
      ));
    } catch {
      // keep thumbFile, just no uploaded URL
    }
  };

  const generateThumb = async (itemId: string) => {
    const item = pending.find(p => p.id === itemId);
    if (!item) return;

    const vid = document.createElement('video');
    vid.src = item.previewUrl;
    vid.currentTime = Math.min(1, item.duration / 2);
    await new Promise<void>(resolve => { vid.onseeked = () => resolve(); vid.load(); });

    const canvas = document.createElement('canvas');
    canvas.width = vid.videoWidth || 640;
    canvas.height = vid.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      setPending(prev => prev.map(p =>
        p.id === itemId ? { ...p, thumbFile: file, thumbPreview: previewUrl } : p
      ));
      try {
        const tags = await uploadFile(file);
        const thumbUrl = tags[0][1];
        setPending(prev => prev.map(p => p.id === itemId ? { ...p, thumbUrl } : p));
      } catch { /* no thumb uploaded, still usable */ }
    }, 'image/jpeg', 0.85);
  };

  const updateField = (id: string, field: 'title' | 'description', value: string) =>
    setPending(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const removePending = (id: string) => {
    setPending(prev => {
      const item = prev.find(p => p.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.thumbPreview) URL.revokeObjectURL(item.thumbPreview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handlePublishAll = async () => {
    const ready = pending.filter(p => p.videoUrl && !p.uploading && !p.error);
    if (ready.length === 0) return;
    setIsSubmitting(true);

    for (const item of ready) {
      await new Promise<void>((resolve) => {
        publish({
          title: item.title.trim() || 'BitPopArt Animation',
          description: item.description.trim(),
          videoUrl: item.videoUrl!,
          thumbUrl: item.thumbUrl || '',
          duration: item.duration,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
        }, {
          onSuccess: () => resolve(),
          onError: () => resolve(),
        });
      });
    }

    pending.forEach(p => {
      URL.revokeObjectURL(p.previewUrl);
      if (p.thumbPreview) URL.revokeObjectURL(p.thumbPreview);
    });
    setPending([]);
    setIsSubmitting(false);
    setShowForm(false);
  };

  const handleClose = () => {
    pending.forEach(p => {
      URL.revokeObjectURL(p.previewUrl);
      if (p.thumbPreview) URL.revokeObjectURL(p.thumbPreview);
    });
    setPending([]);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">

      {/* Upload Form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} size="lg" className="gap-2 text-white border-0" style={getGradientStyle('primary')}>
          <Plus className="h-5 w-5" />
          Upload New Animation
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Video className="h-5 w-5 text-amber-600" />
                Upload Animations
                {pending.length > 0 && <Badge variant="secondary">{pending.length} selected</Badge>}
              </span>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>Upload video files. They will be published as NIP-71 animation events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Video drop zone */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border-amber-300 dark:border-amber-700">
              <Video className="h-8 w-8 text-amber-500 mb-2" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Click to select video files</span>
              <span className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV — multiple files supported</span>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleVideoFiles}
              />
            </label>

            {/* Pending list */}
            {pending.length > 0 && (
              <div className="space-y-4">
                {pending.map(item => (
                  <Card key={item.id} className="overflow-hidden border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-3">
                        {/* Video preview */}
                        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                          <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                          {item.uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                            </div>
                          )}
                          {item.error && (
                            <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">Upload failed</span>
                            </div>
                          )}
                          {item.videoUrl && (
                            <div className="absolute top-1 left-1">
                              <CheckCircle2 className="h-4 w-4 text-green-400 drop-shadow" />
                            </div>
                          )}
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-5 w-5 rounded-full"
                            onClick={() => removePending(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Fields */}
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Title *"
                            value={item.title}
                            onChange={e => updateField(item.id, 'title', e.target.value)}
                            className="text-sm"
                          />
                          <Textarea
                            placeholder="Description (optional)"
                            value={item.description}
                            onChange={e => updateField(item.id, 'description', e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Thumbnail section */}
                      <div className="flex items-center gap-3">
                        {item.thumbPreview ? (
                          <div className="relative w-16 h-12 rounded overflow-hidden border flex-shrink-0">
                            <img src={item.thumbPreview} alt="thumb" className="w-full h-full object-cover" />
                            {item.thumbUrl && (
                              <div className="absolute top-0.5 left-0.5">
                                <CheckCircle2 className="h-3 w-3 text-green-400 drop-shadow" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-12 rounded border flex items-center justify-center bg-muted flex-shrink-0">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            disabled={!item.videoUrl}
                            onClick={() => generateThumb(item.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Auto thumbnail
                          </Button>
                          <Label className="cursor-pointer">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors">
                              <Upload className="h-3 w-3" />
                              Upload thumbnail
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleThumbFile(item.id, e)}
                            />
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  onClick={handlePublishAll}
                  disabled={isSubmitting || isPublishing || pending.every(p => p.uploading || p.error)}
                  className="w-full gap-2 text-white border-0"
                  style={getGradientStyle('primary')}
                >
                  {isSubmitting || isPublishing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>
                  ) : (
                    <><Plus className="h-4 w-4" />Publish {pending.filter(p => p.videoUrl).length} Animation{pending.filter(p => p.videoUrl).length !== 1 ? 's' : ''}</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing animations list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-amber-600" />
            Published Animations
            {!isLoading && animations.length > 0 && (
              <Badge variant="secondary">{animations.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
            </div>
          ) : animations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No animations yet. Upload your first one above!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {animations.map(anim => (
                <div key={anim.id} className="group relative rounded-xl overflow-hidden border bg-white dark:bg-gray-800 shadow-sm">
                  <div className="aspect-video relative bg-black">
                    {anim.thumb_url ? (
                      <img src={anim.thumb_url} alt={anim.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-amber-400" />
                      </div>
                    )}
                    {anim.duration && (
                      <span className="absolute bottom-1 left-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {anim.duration}
                      </span>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteAnim({ id: anim.id, kind: anim.event.kind })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{anim.title}</p>
                    {anim.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{anim.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
