import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useUploadVideo } from '@/hooks/useUploadVideo';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAnimations, usePublishAnimation, useUpdateAnimation, useDeleteAnimation } from '@/hooks/useAnimations';
import type { AnimationItem } from '@/hooks/useAnimations';
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
  Edit,
  AlertCircle,
} from 'lucide-react';

// ── Shared video-load helpers ──────────────────────────────

/** Load video, wait until dimensions are known and a frame is decodable. */
function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.preload = 'auto';
    vid.muted = true;
    vid.playsInline = true;

    const cleanup = () => {
      vid.removeEventListener('loadeddata', onData);
      vid.removeEventListener('error', onError);
    };

    const onData = () => {
      cleanup();
      // loadeddata fires when the first frame is available
      // Give the browser a tick to decode it before we draw
      setTimeout(() => resolve(vid), 80);
    };
    const onError = () => { cleanup(); reject(new Error('Video failed to load')); };

    vid.addEventListener('loadeddata', onData);
    vid.addEventListener('error', onError);
    vid.src = src;
    vid.load();
  });
}

/** Seek to a timestamp and wait for the frame to be ready. */
function seekVideo(vid: HTMLVideoElement, time: number): Promise<void> {
  return new Promise(resolve => {
    const target = Math.max(0, time);
    if (Math.abs(vid.currentTime - target) < 0.05) {
      // Already there — small delay so the frame is rendered
      setTimeout(resolve, 80);
      return;
    }
    const onSeeked = () => {
      vid.removeEventListener('seeked', onSeeked);
      // Extra tick after seek so the decoder paints the frame
      setTimeout(resolve, 80);
    };
    vid.addEventListener('seeked', onSeeked);
    vid.currentTime = target;
  });
}

/** Draw the current video frame to a canvas and return a JPEG blob. */
function captureFrame(vid: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const w = vid.videoWidth;
    const h = vid.videoHeight;
    if (!w || !h) { reject(new Error(`Bad dimensions: ${w}×${h}`)); return; }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('No 2d context')); return; }
    ctx.drawImage(vid, 0, 0, w, h);
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.88);
  });
}

// ── Types ──────────────────────────────────────────────────

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
  status: 'uploading' | 'ready' | 'error';
  statusMsg: string;
  thumbStatus: 'none' | 'generating' | 'uploading' | 'ready' | 'error';
}

// ── Edit dialog ────────────────────────────────────────────

interface EditDialogProps {
  anim: AnimationItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function EditDialog({ anim, open, onOpenChange }: EditDialogProps) {
  const { mutateAsync: uploadImage } = useUploadFile();
  const { mutateAsync: uploadVideo } = useUploadVideo();
  const { mutate: updateAnim, isPending: isSaving } = useUpdateAnimation();
  const { getGradientStyle } = useThemeColors();

  const [title, setTitle] = useState(anim.title);
  const [description, setDescription] = useState(anim.description);
  const [videoUrl, setVideoUrl] = useState(anim.video_url);
  const [thumbUrl, setThumbUrl] = useState(anim.thumb_url);
  const [thumbPreview, setThumbPreview] = useState(anim.thumb_url);
  const [duration, setDuration] = useState(
    // convert "m:ss" back to seconds
    (() => {
      const parts = anim.duration.split(':');
      return parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 0;
    })()
  );
  const [mimeType, setMimeType] = useState('video/mp4');
  const [fileSize, setFileSize] = useState(0);
  const [videoUploading, setVideoUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleNewVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoInputRef.current) videoInputRef.current.value = '';

    setVideoError('');
    setVideoUploading(true);
    const previewUrl = URL.createObjectURL(file);

    try {
      // Get duration from the new file
      const vid = await loadVideo(previewUrl);
      const dur = isNaN(vid.duration) ? 0 : vid.duration;
      setDuration(dur);
      setMimeType(file.type || 'video/mp4');
      setFileSize(file.size);

      const url = await uploadVideo(file);
      setVideoUrl(url);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      URL.revokeObjectURL(previewUrl);
      setVideoUploading(false);
    }
  };

  const handleNewThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setThumbPreview(preview);
    setThumbUploading(true);
    try {
      const tags = await uploadImage(file);
      setThumbUrl(tags[0][1]);
    } catch { /* preview still shown */ }
    setThumbUploading(false);
  };

  const handleSave = () => {
    if (!title.trim() || !videoUrl) return;
    updateAnim({
      dTag: anim.id,
      kind: anim.event.kind,
      title: title.trim(),
      description: description.trim(),
      videoUrl,
      thumbUrl: thumbUrl || '',
      duration,
      mimeType,
      fileSize,
    }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-amber-600" />
            Edit Animation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current video preview */}
          <div className="space-y-2">
            <Label>Video</Label>
            <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
              <video src={videoUrl} className="w-full h-full object-contain" controls muted />
              {videoUploading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <p className="text-white text-sm">Uploading new video…</p>
                </div>
              )}
            </div>
            {videoError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-all">{videoError}</span>
              </div>
            )}
            <div>
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleNewVideo} />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={videoUploading}
                onClick={() => videoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Replace video file
              </Button>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-3">
              <div className="relative w-24 h-16 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                {thumbPreview ? (
                  <>
                    <img src={thumbPreview} alt="thumb" className="w-full h-full object-cover" />
                    {thumbUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                    )}
                    {thumbUrl && !thumbUploading && (
                      <div className="absolute top-0.5 left-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 drop-shadow" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewThumb} />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={thumbUploading}
                  onClick={() => thumbInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Replace thumbnail
                </Button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Animation title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || videoUploading || !title.trim() || !videoUrl}
              className="flex-1 text-white border-0"
              style={getGradientStyle('primary')}
            >
              {isSaving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                : <><CheckCircle2 className="h-4 w-4 mr-2" />Save Changes</>
              }
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main management component ──────────────────────────────

export function AnimationsManagement() {
  const { getGradientStyle } = useThemeColors();
  const { mutateAsync: uploadImage } = useUploadFile();
  const { mutateAsync: uploadVideo } = useUploadVideo();
  const { mutate: publish, isPending: isPublishing } = usePublishAnimation();
  const { mutate: deleteAnim } = useDeleteAnimation();
  const { data: animations = [], isLoading } = useAnimations();

  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState<PendingVideo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAnim, setEditingAnim] = useState<AnimationItem | null>(null);

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
      status: 'uploading',
      statusMsg: 'Uploading video…',
      thumbStatus: 'none',
    }));

    setPending(prev => [...prev, ...newItems]);

    await Promise.all(newItems.map(async (item) => {
      try {
        // ── Step 1: Load video metadata + capture thumbnail frame ──
        // Do this FIRST while the blob URL is freshly created and
        // the browser has the file in memory — before the upload starts.
        let duration = 0;
        let thumbBlob: Blob | null = null;

        try {
          const vid = await loadVideo(item.previewUrl);
          duration = isNaN(vid.duration) ? 0 : vid.duration;

          // Seek to 10% of the clip (or 1 second, whichever is smaller)
          const seekTime = duration > 1 ? Math.min(duration * 0.1, 5) : 0;
          await seekVideo(vid, seekTime);
          thumbBlob = await captureFrame(vid);

          // Show the thumbnail preview immediately
          const thumbPreview = URL.createObjectURL(thumbBlob);
          setPending(prev => prev.map(p =>
            p.id === item.id
              ? { ...p, duration, thumbPreview, thumbStatus: 'generating' }
              : p
          ));
        } catch (thumbErr) {
          console.warn('Thumbnail capture failed:', thumbErr);
          // Not fatal — continue without thumbnail
        }

        // ── Step 2: Upload video + thumbnail in parallel ──
        setPending(prev => prev.map(p =>
          p.id === item.id ? { ...p, statusMsg: 'Uploading…' } : p
        ));

        const uploadPromises: [Promise<string>, Promise<string | null>] = [
          uploadVideo(item.file),
          thumbBlob
            ? uploadImage(
                new File([thumbBlob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' })
              ).then(tags => tags[0][1])
            : Promise.resolve(null),
        ];

        const [videoUrl, thumbUrl] = await Promise.all(uploadPromises);

        setPending(prev => prev.map(p =>
          p.id === item.id
            ? {
                ...p,
                videoUrl,
                duration,
                status: 'ready',
                statusMsg: 'Ready ✓',
                thumbUrl: thumbUrl ?? p.thumbUrl,
                thumbStatus: thumbUrl ? 'ready' : (thumbBlob ? 'error' : 'none'),
              }
            : p
        ));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setPending(prev => prev.map(p =>
          p.id === item.id ? { ...p, status: 'error', statusMsg: msg } : p
        ));
      }
    }));
  };

  // ── Manual thumbnail upload ─────────────────────────────
  const handleThumbFile = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const prev = pending.find(p => p.id === itemId);
    if (prev?.thumbPreview && prev.thumbPreview.startsWith('blob:')) {
      URL.revokeObjectURL(prev.thumbPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setPending(p => p.map(x => x.id === itemId
      ? { ...x, thumbFile: file, thumbPreview: previewUrl, thumbUrl: null, thumbStatus: 'uploading' }
      : x
    ));

    try {
      const tags = await uploadImage(file);
      const thumbUrl = tags[0][1];
      setPending(p => p.map(x => x.id === itemId ? { ...x, thumbUrl, thumbStatus: 'ready' } : x));
    } catch {
      setPending(p => p.map(x => x.id === itemId ? { ...x, thumbStatus: 'error' } : x));
    }
  };

  const updateField = (id: string, field: 'title' | 'description', value: string) =>
    setPending(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const removePending = (id: string) => {
    setPending(prev => {
      const item = prev.find(p => p.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.thumbPreview?.startsWith('blob:')) URL.revokeObjectURL(item.thumbPreview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handlePublishAll = async () => {
    const ready = pending.filter(p => p.videoUrl && p.status === 'ready');
    if (ready.length === 0) return;
    setIsSubmitting(true);

    for (const item of ready) {
      await new Promise<void>(resolve => {
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
      if (p.thumbPreview?.startsWith('blob:')) URL.revokeObjectURL(p.thumbPreview);
    });
    setPending([]);
    setIsSubmitting(false);
    setShowForm(false);
  };

  const handleClose = () => {
    pending.forEach(p => {
      URL.revokeObjectURL(p.previewUrl);
      if (p.thumbPreview?.startsWith('blob:')) URL.revokeObjectURL(p.thumbPreview);
    });
    setPending([]);
    setShowForm(false);
  };

  const readyCount = pending.filter(p => p.status === 'ready').length;

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
              Select video files — thumbnails are auto-generated. You can replace any thumbnail manually.
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
                  <Card key={item.id} className={`overflow-hidden ${item.status === 'error' ? 'border-red-300 dark:border-red-800' : 'border-amber-200 dark:border-amber-800'}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-3">
                        {/* Video preview */}
                        <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black">
                          <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                          {item.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1">
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                              <span className="text-white text-[10px] text-center px-1">{item.statusMsg}</span>
                            </div>
                          )}
                          {item.status === 'error' && (
                            <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center gap-1 p-1">
                              <AlertCircle className="h-5 w-5 text-white" />
                              <span className="text-white text-[9px] text-center leading-tight">{item.statusMsg}</span>
                            </div>
                          )}
                          {item.status === 'ready' && (
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
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden border flex-shrink-0 bg-muted">
                          {item.thumbPreview ? (
                            <>
                              <img src={item.thumbPreview} alt="thumbnail" className="w-full h-full object-cover" />
                              {(item.thumbStatus === 'generating' || item.thumbStatus === 'uploading') && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                                </div>
                              )}
                              {item.thumbStatus === 'ready' && (
                                <div className="absolute top-0.5 left-0.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 drop-shadow" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item.status === 'uploading'
                                ? <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                : <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              }
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {item.thumbStatus === 'ready' ? '✅ Thumbnail ready'
                              : item.thumbStatus === 'generating' ? '⏳ Capturing frame…'
                              : item.thumbStatus === 'uploading' ? '⏳ Uploading thumbnail…'
                              : item.thumbStatus === 'error' ? '⚠️ Thumbnail failed'
                              : item.status === 'uploading' ? '⏳ Waiting for video…'
                              : '📷 No thumbnail'}
                          </p>
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
                  {isSubmitting || isPublishing
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>
                    : <><Plus className="h-4 w-4" />Publish {readyCount} Animation{readyCount !== 1 ? 's' : ''}</>
                  }
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Published animations grid */}
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
                    {/* Hover controls */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingAnim(anim)}
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteAnim({ id: anim.id, kind: anim.event.kind })}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

      {/* Edit dialog */}
      {editingAnim && (
        <EditDialog
          anim={editingAnim}
          open={!!editingAnim}
          onOpenChange={open => { if (!open) setEditingAnim(null); }}
        />
      )}
    </div>
  );
}
