import { useState, useRef, useCallback } from 'react';
import { useAppMedia, usePublishAppMedia } from '@/hooks/useAppContent';
import { useFreeDownloads, useCreateFreeDownload } from '@/hooks/useFreeDownloads';
import { useUploadFile } from '@/hooks/useUploadFile';
import type { ScheduledMedia, MediaCategory } from '@/hooks/useScheduledPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Search,
  Image as ImageIcon,
  Loader2,
  Plus,
  Upload,
  Film,
  X,
  CloudUpload,
} from 'lucide-react';

interface MediaBrowserProps {
  selectedUrls: string[];
  onSelect: (media: ScheduledMedia) => void;
  onRemove: (url: string) => void;
}

// Maps each tab to its Nostr type / label
const LIBRARY_TABS = [
  { value: 'free',       label: 'Free',       type: 'free-download' as const,  nostrType: null,              category: 'free'      as MediaCategory },
  { value: 'wallpapers', label: 'Wallpapers',  type: 'app-wallpaper' as const,   nostrType: 'app-wallpaper' as const, category: 'wallpaper' as MediaCategory },
  { value: 'gifs',       label: 'GIFs',        type: 'app-gif'       as const,   nostrType: 'app-gif'       as const, category: 'gif'       as MediaCategory },
  { value: 'avatars',    label: 'Avatars',     type: 'app-avatar'    as const,   nostrType: 'app-avatar'    as const, category: 'avatar'    as MediaCategory },
  { value: 'banners',    label: 'Banners',     type: 'app-banner'    as const,   nostrType: 'app-banner'    as const, category: 'banner'    as MediaCategory },
] as const;

export function MediaBrowser({ selectedUrls, onSelect, onRemove }: MediaBrowserProps) {
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const wallpapers    = useAppMedia('app-wallpaper');
  const gifs          = useAppMedia('app-gif');
  const avatars       = useAppMedia('app-avatar');
  const banners       = useAppMedia('app-banner');
  const freeDownloads = useFreeDownloads();

  const handleCustomAdd = () => {
    if (!customUrl.trim()) return;
    onSelect({ url: customUrl.trim(), title: customTitle.trim() || 'Custom media', category: 'custom' });
    setCustomUrl('');
    setCustomTitle('');
  };

  const dataFor = (tab: typeof LIBRARY_TABS[number]) => {
    switch (tab.value) {
      case 'free':       return { items: freeDownloads.data  ?? [], isLoading: freeDownloads.isLoading  };
      case 'wallpapers': return { items: wallpapers.data     ?? [], isLoading: wallpapers.isLoading     };
      case 'gifs':       return { items: gifs.data           ?? [], isLoading: gifs.isLoading           };
      case 'avatars':    return { items: avatars.data        ?? [], isLoading: avatars.isLoading        };
      case 'banners':    return { items: banners.data        ?? [], isLoading: banners.isLoading        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search media by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="free">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start">
          {LIBRARY_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">{tab.label}</TabsTrigger>
          ))}
          <TabsTrigger value="upload" className="text-xs gap-1 text-orange-600 dark:text-orange-400 font-semibold">
            <Upload className="h-3 w-3" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs">URL</TabsTrigger>
        </TabsList>

        {/* Library tabs — each gets a quick-upload button in its header */}
        {LIBRARY_TABS.map(tab => {
          const { items, isLoading } = dataFor(tab);
          const filtered = items
            .filter(item => !search || ('title' in item ? item.title : '').toLowerCase().includes(search.toLowerCase()))
            .map(item => ({
              url:      'image_url' in item ? item.image_url : '',
              title:    'title' in item ? item.title : 'Untitled',
              category: tab.category,
            }));

          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-3">
              {/* Quick-upload bar for this library */}
              <QuickUploadBar
                label={tab.label}
                nostrType={tab.nostrType}
                onUploaded={(url, title) => {
                  onSelect({ url, title, category: tab.category });
                }}
              />
              <MediaGrid
                items={filtered}
                isLoading={isLoading}
                selectedUrls={selectedUrls}
                onSelect={onSelect}
                onRemove={onRemove}
                emptyLabel={`No ${tab.label.toLowerCase()} found`}
              />
            </TabsContent>
          );
        })}

        {/* Dedicated Upload tab (post-only, no library publish) */}
        <TabsContent value="upload">
          <UploadPanel selectedUrls={selectedUrls} onSelect={onSelect} onRemove={onRemove} />
        </TabsContent>

        {/* Custom URL tab */}
        <TabsContent value="custom">
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Paste any public image or video URL to attach to your post.
              </p>
              <Input placeholder="https://example.com/image.jpg" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} />
              <Input placeholder="Title (optional)" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
              <Button onClick={handleCustomAdd} disabled={!customUrl.trim()} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add to Post
              </Button>
              {customUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img src={customUrl} alt="Preview" className="w-full max-h-40 object-contain bg-gray-50 dark:bg-gray-800"
                    onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── QuickUploadBar ─────────────────────────────────────────────────────────────
// Small bar at the top of each library tab — upload a file, publish it to that
// library AND auto-select it for the post. No forms, no dialogs.

type AppMediaType = 'app-wallpaper' | 'app-gif' | 'app-avatar' | 'app-banner';

interface QuickUploadBarProps {
  label: string;
  nostrType: AppMediaType | null;  // null = free downloads
  onUploaded: (url: string, title: string) => void;
}

function QuickUploadBar({ label, nostrType, onUploaded }: QuickUploadBarProps) {
  const { mutateAsync: uploadFile }        = useUploadFile();
  const { mutate: publishAppMedia }        = usePublishAppMedia();
  const { mutate: createFreeDownload }     = useCreateFreeDownload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;

    setUploading(true);
    try {
      const tags = await uploadFile(file);
      const url  = tags[0]?.[1];
      if (!url) throw new Error('No URL');

      const title = file.name.replace(/\.[^/.]+$/, '');

      // Publish to the correct Nostr library
      if (nostrType) {
        publishAppMedia({ type: nostrType, title, imageUrl: url });
      } else {
        createFreeDownload({ title, imageUrl: url });
      }

      // Auto-select for the post
      onUploaded(url, title);
    } catch (err) {
      console.error('Quick upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadFile, publishAppMedia, createFreeDownload, nostrType, onUploaded]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between py-1.5 px-0.5">
        <span className="text-xs text-muted-foreground">
          Select from your {label} library below, or upload a new one:
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex-shrink-0"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Plus className="h-3.5 w-3.5" />
              }
              {uploading ? 'Uploading…' : `New ${label}`}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[200px] text-xs">
            Upload a new file — it will be added to your {label} library and attached to this post automatically.
          </TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </TooltipProvider>
  );
}

// ── UploadPanel ────────────────────────────────────────────────────────────────
// Post-only upload (no library publish). Unchanged from before.

interface UploadedItem {
  url: string;
  name: string;
  type: 'image' | 'video';
  preview: string;
}

interface UploadPanelProps {
  selectedUrls: string[];
  onSelect: (media: ScheduledMedia) => void;
  onRemove: (url: string) => void;
}

function UploadPanel({ selectedUrls, onSelect, onRemove }: UploadPanelProps) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const results: UploadedItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        setError(`"${file.name}" is not a supported file type.`);
        continue;
      }
      const maxMB = isVideo ? 50 : 10;
      if (file.size > maxMB * 1024 * 1024) {
        setError(`"${file.name}" is too large (max ${maxMB}MB).`);
        continue;
      }

      try {
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));
        const tags = await uploadFile(file);
        const url  = tags[0]?.[1];
        if (!url) throw new Error('No URL');
        const preview = URL.createObjectURL(file);
        results.push({ url, name: file.name.replace(/\.[^/.]+$/, ''), type: isVideo ? 'video' : 'image', preview });
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch {
        setError(`Failed to upload "${file.name}".`);
      }
    }

    if (results.length > 0) {
      setUploads(prev => [...results, ...prev]);
      for (const item of results) {
        onSelect({ url: item.url, title: item.name, category: item.type === 'video' ? 'animation' : 'custom' });
      }
    }

    setUploading(false);
    setUploadProgress(0);
  }, [uploadFile, onSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-8 text-center ${
          isDragging  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
          uploading   ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed' :
                        'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'
        }`}
      >
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
          onChange={handleFileChange} disabled={uploading} />
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-orange-600">Uploading to Blossom…</p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto h-2" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 inline-flex">
              <CloudUpload className="h-7 w-7 text-orange-500" />
            </div>
            <p className="font-medium text-sm">Drop files here or click to browse</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> Images — max 10MB</span>
              <span className="flex items-center gap-1"><Film className="h-3.5 w-3.5" /> Videos — max 50MB</span>
            </div>
            <p className="text-xs text-muted-foreground">Post only · not added to any library</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Uploaded this session ({uploads.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {uploads.map((item) => {
              const isSelected = selectedUrls.includes(item.url);
              return (
                <button
                  key={item.url}
                  onClick={() => isSelected ? onRemove(item.url) : onSelect({ url: item.url, title: item.name, category: item.type === 'video' ? 'animation' : 'custom' })}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square bg-gray-100 dark:bg-gray-800 ${isSelected ? 'border-orange-500 ring-2 ring-orange-300 dark:ring-orange-700' : 'border-transparent hover:border-orange-300'}`}
                >
                  {item.type === 'video'
                    ? <div className="w-full h-full flex flex-col items-center justify-center gap-1"><Film className="h-7 w-7 text-muted-foreground" /><span className="text-xs text-muted-foreground px-1 truncate w-full text-center">{item.name}</span></div>
                    : <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                  }
                  <div className={`absolute inset-0 transition-opacity flex items-center justify-center ${isSelected ? 'bg-orange-500/20 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-black/20'}`}>
                    {isSelected && <CheckCircle2 className="h-6 w-6 text-orange-500 drop-shadow" />}
                  </div>
                  {item.type === 'video' && <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">MP4</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MediaGrid ──────────────────────────────────────────────────────────────────

interface MediaGridItem { url: string; title: string; category: MediaCategory; }

interface MediaGridProps {
  items: MediaGridItem[];
  isLoading: boolean;
  selectedUrls: string[];
  onSelect: (media: ScheduledMedia) => void;
  onRemove: (url: string) => void;
  emptyLabel: string;
}

function MediaGrid({ items, isLoading, selectedUrls, onSelect, onRemove, emptyLabel }: MediaGridProps) {
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;

  if (items.length === 0) return (
    <div className="text-center py-10">
      <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      <p className="text-xs text-muted-foreground mt-1">Use the "New …" button above to add your first item.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
      {items.map((item) => {
        const isSelected = selectedUrls.includes(item.url);
        return (
          <button
            key={item.url}
            onClick={() => isSelected ? onRemove(item.url) : onSelect({ url: item.url, title: item.title, category: item.category })}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square ${isSelected ? 'border-orange-500 ring-2 ring-orange-300 dark:ring-orange-700' : 'border-transparent hover:border-orange-300'}`}
          >
            <img src={item.url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            <div className={`absolute inset-0 transition-opacity flex items-center justify-center ${isSelected ? 'bg-orange-500/20 opacity-100' : 'bg-black/0 group-hover:bg-black/20 opacity-0 group-hover:opacity-100'}`}>
              {isSelected && <CheckCircle2 className="h-6 w-6 text-orange-500 drop-shadow" />}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate">{item.title}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
