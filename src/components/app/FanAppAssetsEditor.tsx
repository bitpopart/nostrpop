import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ImagePlus,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  useFanAppPublishingSettings,
  usePublishFanAppPublishingSettings,
  type FanAppScreenshot,
} from '@/hooks/useFanAppPublishingSettings';

/**
 * Load an image file, cover-crop it to a square and downscale to exactly
 * `size` x `size` px via canvas. Returns a PNG Blob. Throws on decode error.
 */
async function squareResize(file: File, size: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read image — is it a valid PNG/JPG?'));
      el.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    // Cover-crop: fill the square, crop overflow (standard app-icon behaviour).
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png');
    });
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Read the natural pixel size of an image file (for screenshot metadata). */
async function imageSize(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read image'));
      el.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `shot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function FanAppAssetsEditor() {
  const { data: settings } = useFanAppPublishingSettings();
  const publish = usePublishFanAppPublishingSettings();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { user } = useCurrentUser();

  const iconInputRef = useRef<HTMLInputElement>(null);
  const shotInputRef = useRef<HTMLInputElement>(null);

  const [iconUrl, setIconUrl] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [screenshots, setScreenshots] = useState<FanAppScreenshot[]>([]);
  const [uploading, setUploading] = useState(false);

  // Hydrate local state when settings arrive (or are re-fetched after save)
  useEffect(() => {
    if (!settings) return;
    setIconUrl(settings.iconUrl ?? '');
    setIconPreview(settings.iconUrl ?? '');
    setScreenshots(settings.screenshots ?? []);
  }, [settings]);

  const pickIcon = () => iconInputRef.current?.click();
  const pickScreenshot = () => shotInputRef.current?.click();

  const onIconChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!user) { toast.error('Log in as admin before uploading'); return; }

    setUploading(true);
    try {
      const resized = await squareResize(file, 512);
      const png = new File([resized], 'app-icon-512.png', { type: 'image/png' });
      const tags = await uploadFile(png);
      const url = tags.find(([n]) => n === 'url')?.[1] ?? tags[0]?.[1];
      if (!url) throw new Error('Upload returned no URL');
      setIconUrl(url);
      setIconPreview(url);
      toast.success('Icon uploaded (512×512). Click Save to publish.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Icon upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onScreenshotChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!user) { toast.error('Log in as admin before uploading'); return; }

    setUploading(true);
    try {
      const size = await imageSize(file);
      const tags = await uploadFile(file);
      const url = tags.find(([n]) => n === 'url')?.[1] ?? tags[0]?.[1];
      if (!url) throw new Error('Upload returned no URL');
      setScreenshots((prev) => [
        ...prev,
        { id: newId(), url, label: `Screenshot ${prev.length + 1}`, width: size.width, height: size.height },
      ]);
      toast.success('Screenshot added. Click Save to publish.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Screenshot upload failed');
    } finally {
      setUploading(false);
    }
  };

  const updateScreenshot = (id: string, patch: Partial<FanAppScreenshot>) => {
    setScreenshots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const moveScreenshot = (id: string, dir: -1 | 1) => {
    setScreenshots((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const save = () => {
    if (!user) { toast.error('Log in as admin to save'); return; }
    if (!iconUrl && screenshots.length === 0) {
      toast.error('Add an icon or a screenshot first');
      return;
    }
    publish.mutate(
      { iconUrl, screenshots },
      {
        onSuccess: () => toast.success('Fan app assets saved to Nostr!'),
        onError: (err) => toast.error('Save failed: ' + err.message),
      },
    );
  };

  const reset = () => {
    setIconUrl('');
    setIconPreview('');
    setScreenshots([]);
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-orange-600" />
          App Icon &amp; Store Screenshots
        </CardTitle>
        <CardDescription>
          Set the 512×512 app icon and store screenshots the way PWABuilder wants them — real square icon,
          real screenshots with labels. Uploads go to the Blossom CDN; <strong>Save</strong> publishes them to
          Nostr and the live app picks them up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── App Icon ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">App Icon (512 × 512)</h4>
            <Badge variant="outline" className="text-[10px]">auto-cropped to exact square</Badge>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-4 ring-orange-100 dark:ring-orange-900 bg-muted flex-shrink-0">
              {iconPreview ? (
                <img src={iconPreview} alt="App icon" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 min-w-[200px]">
              <input ref={iconInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onIconChosen} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="gap-2" onClick={pickIcon} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {iconPreview ? 'Change Icon' : 'Upload Icon'}
                </Button>
                {iconPreview && (
                  <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={reset}>
                    <RefreshCw className="h-3.5 w-3.5" /> Reset to site default
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {iconUrl
                  ? 'New icon uploaded — shown above. Save to publish.'
                  : 'Any PNG/JPG — it is cover-cropped to a true 512×512 square automatically.'}
              </p>
              {iconUrl && (
                <code className="block text-[10px] break-all bg-muted px-2 py-1 rounded">{iconUrl}</code>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* ── Screenshots ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Store Screenshots</h4>
            <Badge variant="outline" className="text-[10px]">shown in store listings</Badge>
          </div>

          <input ref={shotInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onScreenshotChosen} />
          <Button type="button" variant="outline" className="gap-2" onClick={pickScreenshot} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Add Screenshot
          </Button>

          {screenshots.length === 0 ? (
            <Alert className="border-dashed">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm text-muted-foreground">
                No screenshots yet. Add real app screenshots (e.g. 1080×1920 phone, or 1290×2796) so PWABuilder
                and store listings have artwork to show.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {screenshots.map((s, i) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 bg-muted/30">
                  <div className="w-16 h-28 rounded-md overflow-hidden bg-black/5 flex-shrink-0">
                    <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <Input
                      value={s.label}
                      onChange={(e) => updateScreenshot(s.id, { label: e.target.value })}
                      placeholder="Screenshot label"
                      className="h-8 text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {s.width && s.height ? `${s.width}×${s.height}px` : 'size unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => moveScreenshot(s.id, -1)} aria-label="Move up">↑</Button>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={i === screenshots.length - 1} onClick={() => moveScreenshot(s.id, 1)} aria-label="Move down">↓</Button>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => removeScreenshot(s.id)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* ── Save ── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" className="gap-2" onClick={save} disabled={publish.isPending || uploading}>
            {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {publish.isPending ? 'Saving…' : 'Save Assets'}
          </Button>
          {publish.isSuccess && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Saved to Nostr — live app updated
            </span>
          )}
          {settings?.updatedAt && (
            <span className="text-xs text-muted-foreground">Last saved: {new Date(settings.updatedAt).toLocaleString()}</span>
          )}
        </div>

        {!user && (
          <p className="text-xs text-yellow-700 dark:text-yellow-500">
            <Sparkles className="h-3.5 w-3.5 inline mr-1" />
            Log in as the BitPopArt admin to upload and save.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
