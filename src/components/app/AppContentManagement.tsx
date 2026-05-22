import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  useAppWelcome,
  useAppMedia,
  usePublishAppWelcome,
  usePublishAppMedia,
  useDeleteAppMedia,
} from '@/hooks/useAppContent';
import {
  MessageSquare,
  Image as ImageIcon,
  Clapperboard,
  Upload,
  Plus,
  Trash2,
  Loader2,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface PendingMedia {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  uploadedUrl: string | null;
  uploading: boolean;
  error: boolean;
}

// ── Shared multi-upload helper ────────────────────────────
function MediaUploader({
  type,
  label,
}: {
  type: 'app-wallpaper' | 'app-gif';
  label: string;
}) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publish } = usePublishAppMedia();
  const { getGradientStyle } = useThemeColors();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = type === 'app-gif' ? 'image/gif,image/webp,image/*' : 'image/*';

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: PendingMedia[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      title: '',
      uploadedUrl: null,
      uploading: true,
      error: false,
    }));

    setPending(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    await Promise.all(newItems.map(async (item) => {
      try {
        const tags = await uploadFile(item.file);
        const url = tags[0][1];
        setPending(prev => prev.map(p => p.id === item.id ? { ...p, uploadedUrl: url, uploading: false } : p));
      } catch {
        setPending(prev => prev.map(p => p.id === item.id ? { ...p, uploading: false, error: true } : p));
      }
    }));
  };

  const updateTitle = (id: string, title: string) =>
    setPending(prev => prev.map(p => p.id === id ? { ...p, title } : p));

  const removePending = (id: string) => {
    setPending(prev => {
      const item = prev.find(p => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const handlePublishAll = async () => {
    const ready = pending.filter(p => p.uploadedUrl && !p.uploading && !p.error);
    if (ready.length === 0) return;
    setIsSubmitting(true);

    for (const item of ready) {
      await new Promise<void>((resolve) => {
        publish(
          { type, title: item.title.trim() || label, imageUrl: item.uploadedUrl! },
          { onSuccess: () => resolve(), onError: () => resolve() }
        );
      });
    }

    pending.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPending([]);
    setIsSubmitting(false);
    setOpen(false);
  };

  const handleClose = () => {
    pending.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPending([]);
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> Add {label}
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Label className="font-semibold flex items-center gap-2">
            Add {label}s
            {pending.length > 0 && <Badge variant="secondary">{pending.length} selected</Badge>}
          </Label>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drop zone */}
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
          <span className="text-xs font-medium text-muted-foreground">Click to select files</span>
          <span className="text-xs text-muted-foreground mt-0.5">Multiple files supported</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </label>

        {/* Pending grid */}
        {pending.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pending.map(item => (
              <div key={item.id} className="relative rounded-lg overflow-hidden border bg-white dark:bg-gray-800 shadow-sm">
                <div className="aspect-square relative">
                  <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  {item.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  {item.error && (
                    <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-1 text-center">Failed</span>
                    </div>
                  )}
                  {item.uploadedUrl && (
                    <div className="absolute top-1 left-1">
                      <CheckCircle2 className="h-4 w-4 text-green-400 drop-shadow" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => removePending(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-1.5">
                  <Input
                    placeholder="Title (optional)"
                    value={item.title}
                    onChange={(e) => updateTitle(item.id, e.target.value)}
                    className="text-xs h-7"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Publish button */}
        {pending.length > 0 && (
          <Button
            onClick={handlePublishAll}
            disabled={isSubmitting || pending.every(p => p.uploading || p.error)}
            className="w-full text-white border-0"
            style={getGradientStyle('primary')}
            size="sm"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Publishing…</>
            ) : (
              <><Plus className="h-4 w-4 mr-1" />Publish {pending.filter(p => p.uploadedUrl).length} {label}{pending.filter(p => p.uploadedUrl).length !== 1 ? 's' : ''}</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Media list with delete ────────────────────────────────
function MediaList({ type }: { type: 'app-wallpaper' | 'app-gif' }) {
  const { data: items = [], isLoading } = useAppMedia(type);
  const { mutate: deleteItem } = useDeleteAppMedia();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No items yet.</p>;

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.id} className="group relative rounded-lg overflow-hidden border">
          <img src={item.image_url} alt={item.title} className="w-full aspect-square object-cover" loading="lazy" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => deleteItem({ id: item.id, type })}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {item.title !== 'Untitled' && (
            <p className="text-[10px] truncate px-1 py-0.5 bg-black/50 text-white absolute bottom-0 left-0 right-0">{item.title}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main management component ─────────────────────────────
export function AppContentManagement() {
  const { data: welcome } = useAppWelcome();
  const { mutate: saveWelcome, isPending: isSaving } = usePublishAppWelcome();
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const { getGradientStyle } = useThemeColors();

  // Pre-fill when loaded
  const msgValue = welcomeMsg || welcome?.message || '';

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Welcome Message
          </CardTitle>
          <CardDescription>
            This message is shown at the top of the App page for fans. The greeting (Good Morning / Afternoon / Evening) is added automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Write a message to the community…"
            value={msgValue}
            onChange={e => setWelcomeMsg(e.target.value)}
            rows={4}
          />
          <Button
            onClick={() => saveWelcome(msgValue)}
            disabled={isSaving || !msgValue.trim()}
            className="text-white border-0"
            style={getGradientStyle('primary')}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Welcome Message
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Wallpapers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Wallpapers
          </CardTitle>
          <CardDescription>Images shown in the Wallpapers section of the App page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-wallpaper" label="Wallpaper" />
          <MediaList type="app-wallpaper" />
        </CardContent>
      </Card>

      <Separator />

      {/* Animated GIFs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5" />
            Animated GIFs
          </CardTitle>
          <CardDescription>GIFs shown in the Animated GIFs section of the App page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-gif" label="GIF" />
          <MediaList type="app-gif" />
        </CardContent>
      </Card>
    </div>
  );
}
