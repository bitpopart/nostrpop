import { useState } from 'react';
import { useAppMedia } from '@/hooks/useAppContent';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import type { ScheduledMedia, MediaCategory } from '@/hooks/useScheduledPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Search,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  Plus,
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search media..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="free">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start text-xs">
          <TabsTrigger value="free" className="text-xs">Free Downloads</TabsTrigger>
          <TabsTrigger value="wallpapers" className="text-xs">Wallpapers</TabsTrigger>
          <TabsTrigger value="gifs" className="text-xs">GIFs</TabsTrigger>
          <TabsTrigger value="avatars" className="text-xs">Avatars</TabsTrigger>
          <TabsTrigger value="banners" className="text-xs">Banners</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs">Custom URL</TabsTrigger>
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

        <TabsContent value="custom">
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Add a custom image URL to attach to your post.
              </p>
              <Input
                placeholder="Image URL (https://...)"
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
                Add Media
              </Button>
              {customUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={customUrl}
                    alt="Preview"
                    className="w-full max-h-40 object-contain bg-gray-50"
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
      <div className="text-center py-12">
        <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload content in your{' '}
          <a href="/admin?tab=app" className="text-orange-600 hover:underline" target="_blank">
            Admin Dashboard
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
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
              {isSelected && (
                <CheckCircle2 className="h-6 w-6 text-orange-500 drop-shadow" />
              )}
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
