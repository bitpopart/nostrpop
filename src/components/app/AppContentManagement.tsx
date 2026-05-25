import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import { HashtagInput } from '@/components/HashtagInput';
import { generateHashtagsFromText } from '@/lib/hashtags';
import {
  useAppWelcome,
  useAppMedia,
  usePublishAppWelcome,
  usePublishAppMedia,
  useUpdateAppMedia,
  useDeleteAppMedia,
  type AppMedia,
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
  Edit,
  AlertCircle,
  UserCircle2,
  PanelTop,
} from 'lucide-react';

interface PendingMedia {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  hashtags: string[];
  uploadedUrl: string | null;
  uploading: boolean;
  error: boolean;
}

// ── Edit dialog ───────────────────────────────────────────

interface EditMediaDialogProps {
  item: AppMedia;
  type: 'app-wallpaper' | 'app-gif' | 'app-avatar' | 'app-banner';
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function EditMediaDialog({ item, type, open, onOpenChange }: EditMediaDialogProps) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: updateItem, isPending: isSaving } = useUpdateAppMedia();
  const { getGradientStyle } = useThemeColors();

  const [title, setTitle] = useState(item.title === 'Untitled' ? '' : item.title);
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [imagePreview, setImagePreview] = useState(item.image_url);
  const [hashtags, setHashtags] = useState<string[]>(item.hashtags);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploadError('');
    setUploading(true);
    const blobUrl = URL.createObjectURL(file);
    setImagePreview(blobUrl);

    try {
      const tags = await uploadFile(file);
      const url = tags[0][1];
      setImageUrl(url);
      // Keep the blob preview until dialog closes, then revoke
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setImagePreview(imageUrl); // revert preview
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!imageUrl) return;
    updateItem(
      {
        dTag: item.id,
        type,
        title: title.trim() || 'Untitled',
        imageUrl,
        hashtags,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const typeLabel =
    type === 'app-wallpaper' ? 'Wallpaper' :
    type === 'app-gif' ? 'GIF' :
    type === 'app-avatar' ? 'Avatar' : 'Banner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-teal-600" />
            Edit {typeLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Image preview + replace */}
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="relative aspect-square w-full max-w-xs mx-auto rounded-xl overflow-hidden border bg-muted">
              <img
                src={imagePreview}
                alt="preview"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <p className="text-white text-sm">Uploading…</p>
                </div>
              )}
              {!uploading && imageUrl !== item.image_url && (
                <div className="absolute top-2 left-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow" />
                </div>
              )}
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleNewImage}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Replace image
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-media-title">Title</Label>
            <Input
              id="edit-media-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`${typeLabel} title`}
            />
          </div>

          {/* Hashtags */}
          <HashtagInput
            tags={hashtags}
            onChange={setHashtags}
            title={title}
            description=""
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || uploading || !imageUrl}
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

// ── Shared multi-upload helper ────────────────────────────
export function MediaUploader({
  type,
  label,
}: {
  type: 'app-wallpaper' | 'app-gif' | 'app-avatar' | 'app-banner';
  label: string;
}) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publish } = usePublishAppMedia();
  const { getGradientStyle } = useThemeColors();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accept = 'image/*';

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: PendingMedia[] = files.map(file => {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        title: cleanTitle,
        hashtags: generateHashtagsFromText(cleanTitle, ''),
        uploadedUrl: null,
        uploading: true,
        error: false,
      };
    });

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

  const updateHashtags = (id: string, hashtags: string[]) =>
    setPending(prev => prev.map(p => p.id === id ? { ...p, hashtags } : p));

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
          { type, title: item.title.trim() || label, imageUrl: item.uploadedUrl!, hashtags: item.hashtags },
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
                <div className="p-1.5 space-y-1.5">
                  <Input
                    placeholder="Title (optional)"
                    value={item.title}
                    onChange={(e) => updateTitle(item.id, e.target.value)}
                    className="text-xs h-7"
                  />
                  <HashtagInput
                    tags={item.hashtags}
                    onChange={htags => updateHashtags(item.id, htags)}
                    title={item.title}
                    description=""
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

// ── Media list with edit + delete ─────────────────────────
export function MediaList({ type, aspectClass = 'aspect-square' }: { type: 'app-wallpaper' | 'app-gif' | 'app-avatar' | 'app-banner'; aspectClass?: string }) {
  const { data: items = [], isLoading } = useAppMedia(type);
  const { mutate: deleteItem } = useDeleteAppMedia();
  const [editingItem, setEditingItem] = useState<AppMedia | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items yet.</p>;
  }

  return (
    <>
      <div className={`grid gap-3 ${aspectClass === 'aspect-video' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3 md:grid-cols-4'}`}>
        {items.map(item => (
          <div key={item.id} className="group relative rounded-lg overflow-hidden border bg-white dark:bg-gray-800 shadow-sm">
            <div className={`${aspectClass} relative`}>
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Hover action buttons */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 shadow"
                  onClick={() => setEditingItem(item)}
                  title="Edit"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 shadow"
                  onClick={() => deleteItem({ id: item.id, type })}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Title + hashtag strip */}
            <div className="p-1.5">
              <p className="text-[10px] font-medium truncate text-foreground">
                {item.title !== 'Untitled' ? item.title : <span className="text-muted-foreground italic">Untitled</span>}
              </p>
              {item.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {item.hashtags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                  {item.hashtags.length > 3 && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                      +{item.hashtags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      {editingItem && (
        <EditMediaDialog
          item={editingItem}
          type={type}
          open={!!editingItem}
          onOpenChange={open => { if (!open) setEditingItem(null); }}
        />
      )}
    </>
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
          <CardDescription>
            Images shown in the Wallpapers section. Hover any item to edit or delete it.
          </CardDescription>
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
          <CardDescription>
            GIFs shown in the Animated GIFs section. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-gif" label="GIF" />
          <MediaList type="app-gif" />
        </CardContent>
      </Card>

      <Separator />

      {/* Avatars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-violet-600" />
            Avatars
          </CardTitle>
          <CardDescription>
            Free profile avatars fans can download and use. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-avatar" label="Avatar" />
          <MediaList type="app-avatar" />
        </CardContent>
      </Card>

      <Separator />

      {/* Header Banners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelTop className="h-5 w-5 text-sky-600" />
            Header Banners
          </CardTitle>
          <CardDescription>
            Wide landscape banners fans can download and use as their profile header. Hover any item to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MediaUploader type="app-banner" label="Banner" />
          <MediaList type="app-banner" aspectClass="aspect-video" />
        </CardContent>
      </Card>
    </div>
  );
}
