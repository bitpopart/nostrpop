import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';

// ── Shared upload helper ──────────────────────────────────
function MediaUploader({
  type,
  label,
}: {
  type: 'app-wallpaper' | 'app-gif';
  label: string;
}) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publish, isPending } = usePublishAppMedia();
  const { getGradientStyle } = useThemeColors();

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      setImageUrl(tags[0][1]);
    } catch {
      // handled by hook
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = () => {
    if (!imageUrl) return;
    publish(
      { type, title: title || label, imageUrl },
      {
        onSuccess: () => {
          setTitle('');
          setImageUrl('');
          setOpen(false);
        },
      },
    );
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
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">New {label}</Label>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
        {imageUrl ? (
          <div className="relative">
            <img src={imageUrl} alt="Preview" className="w-full max-h-48 object-contain rounded-lg border" />
            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => setImageUrl('')}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Click to upload</span>
              </>
            )}
            <input type="file" accept={type === 'app-gif' ? 'image/gif,image/webp' : 'image/*'} className="hidden" onChange={handleFile} disabled={isUploading} />
          </label>
        )}
        <Button onClick={handlePublish} disabled={!imageUrl || isPending} className="w-full text-white border-0" style={getGradientStyle('primary')} size="sm">
          {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Publish
        </Button>
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
