import { useState, useRef, useCallback } from 'react';
import { useAppMedia } from '@/hooks/useAppContent';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import { useUploadFile } from '@/hooks/useUploadFile';
import type { ScheduledMedia, MediaCategory } from '@/hooks/useScheduledPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

export function MediaBrowser({ selectedUrls, onSelect, onRemove }: MediaBrowserProps) {
  const [search, setSearch] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const wallpapers = useAppMedia('app-wallpaper');
  const gifs = useAppMedia('app-gif');
  const avatars = useAppMedia('app-avatar');
  const banners = useAppMedia('app-banner');
  const freeDownloads = useFreeDownloads();

  const handleCustomAdd = () => {
    if (!customUrl.trim()) return;
    onSelect({
      url: customUrl.trim(),
      title: customTitle.trim() || 'Custom media',
      category: 'custom',
    });
    setCustomUrl('');
    setCustomTitle('');
  };

  return (
    <div className="space-y-4">
      {/* Search — hidden on upload tab, shown everywhere else */}
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
          <TabsTrigger value="free" className="text-xs">Free</TabsTrigger>
          <TabsTrigger value="wallpapers" className="text-xs">Wallpapers</TabsTrigger>
          <TabsTrigger value="gifs" className="text-xs">GIFs</TabsTrigger>
          <TabsTrigger value="avatars" className="text-xs">Avatars</TabsTrigger>
          <TabsTrigger value="banners" className="text-xs">Banners</TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1 text-orange-600 dark:text-orange-400 font-semibold">
            <Upload className="h-3 w-3" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-xs">URL</TabsTrigger>
        </TabsList>

        <TabsContent value="free">
          <MediaGrid
            items={(freeDownloads.data ?? [])
              .filter(item => !search || item.title.toLowerCase().includes(search.toLowerCase()))
              .map(item => ({ url: item.image_url, title: item.title, category: 'free' as MediaCategory }))}
            isLoading={freeDownloads.isLoading}
            selectedUrls={selectedUrls}
            onSelect={onSelect}
            onRemove={onRemove}
            emptyLabel="No free downloads found"
          />
        </TabsContent>

        <TabsContent value="wallpapers">
          <MediaGrid
            items={(wallpapers.data ?? [])
              .filter(item => !search || item.title.toLowerCase().includes(search.toLowerCase()))
              .map(item => ({ url: item.image_url, title: item.title, category: 'wallpaper' as MediaCategory }))}
            isLoading={wallpapers.isLoading}
            selectedUrls={selectedUrls}
            onSelect={onSelect}
            onRemove={onRemove}
            emptyLabel="No wallpapers found"
          />
        </TabsContent>

        <TabsContent value="gifs">
          <MediaGrid
            items={(gifs.data ?? [])
              .filter(item => !search || item.title.toLowerCase().includes(search.toLowerCase()))
              .map(item => ({ url: item.image_url, title: item.title, category: 'gif' as MediaCategory }))}
            isLoading={gifs.isLoading}
            selectedUrls={selectedUrls}
            onSelect={onSelect}
            onRemove={onRemove}
            emptyLabel="No GIFs found"
          />
        </TabsContent>

        <TabsContent value="avatars">
          <MediaGrid
            items={(avatars.data ?? [])
              .filter(item => !search || item.title.toLowerCase().includes(search.toLowerCase()))
              .map(item => ({ url: item.image_url, title: item.title, category: 'avatar' as MediaCategory }))}
            isLoading={avatars.isLoading}
            selectedUrls={selectedUrls}
            onSelect={onSelect}
            onRemove={onRemove}
            emptyLabel="No avatars found"
          />
        </TabsContent>

        <TabsContent value="banners">
          <MediaGrid
            items={(banners.data ?? [])
              .filter(item => !search || item.title.toLowerCase().includes(search.toLowerCase()))
              .map(item => ({ url: item.image_url, title: item.title, category: 'banner' as MediaCategory }))}
            isLoading={banners.isLoading}
            selectedUrls={selectedUrls}
            onSelect={onSelect}
            onRemove={onRemove}
            emptyLabel="No banners found"
          />
        </TabsContent>

        {/* ── Upload Tab ── */}
        <TabsContent value="upload">
          <UploadPanel
            selectedUrls={selectedUrls}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        </TabsContent>

        {/* ── Custom URL Tab ── */}
        <TabsContent value="custom">
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Paste any public image or video URL to attach to your post.
              </p>
              <Input
                placeholder="https://example.com/image.jpg"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
              <Input
                placeholder="Title (optional)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
              <Button
                onClick={handleCustomAdd}
                disabled={!customUrl.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Post
              </Button>
              {customUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={customUrl}
                    alt="Preview"
                    className="w-full max-h-40 object-contain bg-gray-50 dark:bg-gray-800"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Upload Panel ───────────────────────────────────────────────────────────────

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
        setError(`"${file.name}" is not a supported file type. Use images or videos.`);
        continue;
      }

      // Size guard: 50 MB for video, 10 MB for image
      const maxMB = isVideo ? 50 : 10;
      if (file.size > maxMB * 1024 * 1024) {
        setError(`"${file.name}" is too large (max ${maxMB}MB for ${isVideo ? 'video' : 'image'}).`);
        continue;
      }

      try {
        setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));
        const tags = await uploadFile(file);
        const url = tags[0]?.[1];
        if (!url) throw new Error('No URL returned from upload');

        // Create local preview URL
        const preview = URL.createObjectURL(file);

        results.push({
          url,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: isVideo ? 'video' : 'image',
          preview,
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err) {
        console.error('Upload failed:', err);
        setError(`Failed to upload "${file.name}". Please try again.`);
      }
    }

    if (results.length > 0) {
      setUploads(prev => [...results, ...prev]);
      // Auto-select newly uploaded items
      for (const item of results) {
        onSelect({ url: item.url, title: item.name, category: item.type === 'video' ? 'animation' : 'custom' });
      }
    }

    setUploading(false);
    setUploadProgress(0);
  }, [uploadFile, onSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-8 text-center ${
          isDragging
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
            : uploading
            ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
            : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-orange-600">Uploading to Blossom…</p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto h-2" />
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <CloudUpload className="h-7 w-7 text-orange-500" />
              </div>
            </div>
            <p className="font-medium text-sm">Drop files here or click to browse</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                Images (JPG, PNG, GIF, WebP) — max 10MB
              </span>
              <span className="flex items-center gap-1">
                <Film className="h-3.5 w-3.5" />
                Videos (MP4, MOV, WebM) — max 50MB
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Hosted on Blossom · Multiple files supported</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto flex-shrink-0 hover:text-red-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Uploaded items this session */}
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
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square bg-gray-100 dark:bg-gray-800 ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-300 dark:ring-orange-700'
                      : 'border-transparent hover:border-orange-300'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <Film className="h-7 w-7 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate px-1 w-full text-center">{item.name}</span>
                    </div>
                  ) : (
                    <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                  )}

                  {/* Selected overlay */}
                  <div className={`absolute inset-0 transition-opacity flex items-center justify-center ${
                    isSelected ? 'bg-orange-500/20 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-black/20'
                  }`}>
                    {isSelected && <CheckCircle2 className="h-6 w-6 text-orange-500 drop-shadow" />}
                  </div>

                  {/* Video badge */}
                  {item.type === 'video' && (
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      MP4
                    </div>
                  )}

                  {/* Title on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{item.name}</p>
                  </div>
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

interface MediaGridItem {
  url: string;
  title: string;
  category: MediaCategory;
}

interface MediaGridProps {
  items: MediaGridItem[];
  isLoading: boolean;
  selectedUrls: string[];
  onSelect: (media: ScheduledMedia) => void;
  onRemove: (url: string) => void;
  emptyLabel: string;
}

function MediaGrid({ items, isLoading, selectedUrls, onSelect, onRemove, emptyLabel }: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload content in your{' '}
          <a href="/admin?tab=app" className="text-orange-600 hover:underline">
            Admin Dashboard
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
      {items.map((item) => {
        const isSelected = selectedUrls.includes(item.url);
        return (
          <button
            key={item.url}
            onClick={() => isSelected ? onRemove(item.url) : onSelect({ url: item.url, title: item.title, category: item.category })}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all aspect-square ${
              isSelected
                ? 'border-orange-500 ring-2 ring-orange-300 dark:ring-orange-700'
                : 'border-transparent hover:border-orange-300'
            }`}
          >
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className={`absolute inset-0 transition-opacity flex items-center justify-center ${
              isSelected ? 'bg-orange-500/20 opacity-100' : 'bg-black/0 group-hover:bg-black/20 opacity-0 group-hover:opacity-100'
            }`}>
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
