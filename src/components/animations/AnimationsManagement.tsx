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
  Sparkles,
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
  thumbGenerating: boolean;
  error: boolean;
}

/** Load a video element fully before returning it */
function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.preload = 'auto';
    vid.muted = true;

    const onReady = () => {
      vid.removeEventListener('canplay', onReady);
      vid.removeEventListener('error', onError);
      resolve(vid);
    };
    const onError = () => {
      vid.removeEventListener('canplay', onReady);
      vid.removeEventListener('error', onError);
      reject(new Error('Video failed to load'));
    };

    vid.addEventListener('canplay', onReady);
    vid.addEventListener('error', onError);
    vid.src = src;
    vid.load();
  });
}

/** Seek a loaded video to a timestamp and wait for the seek to settle */
function seekVideo(vid: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(vid.currentTime - time) < 0.05) { resolve(); return; }
    const onSeeked = () => { vid.removeEventListener('seeked', onSeeked); resolve(); };
    vid.addEventListener('seeked', onSeeked);
    vid.currentTime = time;
  });
}

/** Capture a JPEG blob from a loaded + seeked video element */
function captureFrame(vid: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const w = vid.videoWidth || 640;
    const h = vid.videoHeight || 360;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('No canvas context')); return; }
    ctx.drawImage(vid, 0, 0, w, h);
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/jpeg',
      0.88,
    );
  });
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

  // ── Upload video files ──────────────────────────────────
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
      thumbGenerating: false,
      error: false,
    }));

    setPending(prev => [...prev, ...newItems]);

    // For each file: extract duration, generate thumbnail, upload video — all in parallel
    await Promise.all(newItems.map(async (item) => {
      try {
        // 1. Load video to get metadata
        const vid = await loadVideo(item.previewUrl);
        const duration = isNaN(vid.duration) ? 0 : vid.duration;

        // 2. Auto-generate thumbnail right away (seek to 10% into the clip)
        const seekTime = duration > 0 ? Math.min(duration * 0.1, duration - 0.05) : 0;
        await seekVideo(vid, seekTime);
        const thumbBlob = await captureFrame(vid);
        const thumbPreview = URL.createObjectURL(thumbBlob);
        const thumbFile = new File([thumbBlob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });

        // Set preview immediately so user sees it
        setPending(prev => prev.map(p =>
          p.id === item.id ? { ...p, duration, thumbFile, thumbPreview, thumbGenerating: true } : p
        ));

        // 3. Upload video + thumbnail in parallel
        const [videoTags, thumbTags] = await Promise.all([
          uploadFile(item.file),
          uploadFile(thumbFile),
        ]);

        const videoUrl = videoTags[0][1];
        const thumbUrl = thumbTags[0][1];

        setPending(prev => prev.map(p =>
          p.id === item.id
            ? { ...p, videoUrl, thumbUrl, uploading: false, thumbGenerating: false }
            : p
        ));
      } catch {
        setPending(prev => prev.map(p =>
          p.id === item.id ? { ...p, uploading: false, thumbGenerating: false, error: true } : p
        ));
      }
    }));
  };

  // ── Manual thumbnail upload ─────────────────────────────
  const handleThumbFile = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous thumb preview
    const prev = pending.find(p => p.id === itemId);
    if (prev?.thumbPreview) URL.revokeObjectURL(prev.thumbPreview);

    const previewUrl = URL.createObjectURL(file);
    setPending(p => p.map(x => x.id === itemId ? { ...x, thumbFile: file, thumbPreview: previewUrl, thumbUrl: null } : x));

    try {
      const tags = await uploadFile(file);
      const thumbUrl = tags[0][1];
      setPending(p => p.map(x => x.id === itemId ? { ...x, thumbUrl } : x));
    } catch {
      // Preview still shows, just no remote URL yet
    }
  };

  // ── Field updates ───────────────────────────────────────
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

  // ── Publish ─────────────────────────────────────────────
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
        }, { onSuccess: () => resolve(), onError: () => resolve() });
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

  const readyCount = pending.filter(p => p.videoUrl && !p.uploading && !p.error).length;

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
            <CardDescription>
              Upload video files — thumbnails are generated automatically. You can replace any thumbnail after upload.
            </CardDescription>
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
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                              <span className="text-white text-[10px]">Uploading…</span>
                            </div>
                          )}
                          {item.error && (
                            <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                              <span className="text-white text-xs font-medium px-1 text-center">Upload failed</span>
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

                      {/* Thumbnail row */}
                      <div className="flex items-center gap-3 pt-1 border-t">
                        {/* Thumb preview */}
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden border flex-shrink-0 bg-muted">
                          {item.thumbPreview ? (
                            <>
                              <img src={item.thumbPreview} alt="thumbnail" className="w-full h-full object-cover" />
                              {item.thumbGenerating && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                                </div>
                              )}
                              {item.thumbUrl && !item.thumbGenerating && (
                                <div className="absolute top-0.5 left-0.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 drop-shadow" />
                                </div>
                              )}
                            </>
                          ) : item.uploading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {item.thumbUrl ? '✅ Thumbnail ready' : item.thumbGenerating ? '⏳ Generating…' : item.uploading ? '⏳ Processing…' : '📷 No thumbnail'}
                          </p>
                          {/* Replace thumbnail */}
                          <Label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md hover:bg-muted transition-colors">
                            <Upload className="h-3 w-3" />
                            Replace thumbnail
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
                  disabled={isSubmitting || isPublishing || readyCount === 0}
                  className="w-full gap-2 text-white border-0"
                  style={getGradientStyle('primary')}
                >
                  {isSubmitting || isPublishing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>
                  ) : (
                    <><Plus className="h-4 w-4" />Publish {readyCount} Animation{readyCount !== 1 ? 's' : ''}</>
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
            <div className="text-center py-10 space-y-2">
              <Sparkles className="h-10 w-10 mx-auto text-amber-300" />
              <p className="text-sm text-muted-foreground">No animations yet. Upload your first one above!</p>
            </div>
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
