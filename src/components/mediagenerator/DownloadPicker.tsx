/**
 * DownloadPicker
 *
 * Replaces the manual URL input with a browser of all existing Nostr media:
 * Free Downloads (kind 34019, t:free-download)
 * App Wallpapers  (kind 34019, t:app-wallpaper)
 * App GIFs        (kind 34019, t:app-gif)
 * App Avatars     (kind 34019, t:app-avatar)
 * App Banners     (kind 34019, t:app-banner)
 * App Coloring    (kind 34019, t:app-coloring-page)
 * App Desktop WP  (kind 34019, t:app-desktop-wallpaper)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppMedia } from '@/hooks/useAppContent';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import { Trash2, Search, Plus } from 'lucide-react';
import type { DownloadItem } from '@/hooks/useMediaGenerator';

// Map from internal type key → DownloadItem type label
const MEDIA_TABS: { key: string; label: string; appType?: Parameters<typeof useAppMedia>[0]; isFree?: boolean; dlType: string }[] = [
  { key: 'free',      label: '🎁 Free Downloads',    isFree: true,                              dlType: 'other' },
  { key: 'wallpaper', label: '🖼️ Wallpapers',         appType: 'app-wallpaper',                  dlType: 'wallpaper' },
  { key: 'gif',       label: '🎞️ GIFs',               appType: 'app-gif',                        dlType: 'gif' },
  { key: 'avatar',    label: '🧑 Avatars',             appType: 'app-avatar',                     dlType: 'other' },
  { key: 'banner',    label: '📐 Banners',             appType: 'app-banner',                     dlType: 'banner' },
  { key: 'coloring',  label: '🎨 Coloring Pages',      appType: 'app-coloring-page',              dlType: 'coloring' },
  { key: 'desktop',   label: '🖥️ Desktop Wallpapers',  appType: 'app-desktop-wallpaper',          dlType: 'desktop' },
];

// Inner tab: renders one category of media
function MediaTabContent({
  dlType,
  appType,
  isFree,
  selectedIds,
  onToggle,
}: {
  dlType: string;
  appType?: Parameters<typeof useAppMedia>[0];
  isFree?: boolean;
  selectedIds: Set<string>;
  onToggle: (item: { id: string; url: string; thumb: string; label: string; type: string }) => void;
}) {
  const [search, setSearch] = useState('');

  const appMedia = useAppMedia(appType ?? 'app-wallpaper');
  const freeMedia = useFreeDownloads();

  const rawItems = isFree
    ? (freeMedia.data ?? []).map((d) => ({ id: d.id, label: d.title, url: d.image_url, thumb: d.image_url, type: dlType }))
    : (appMedia.data ?? []).map((d) => ({ id: d.id, label: d.title, url: d.image_url, thumb: d.image_url, type: dlType }));

  const isLoading = isFree ? freeMedia.isLoading : (appType ? appMedia.isLoading : false);

  const items = search.trim()
    ? rawItems.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
    : rawItems;

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 pt-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
      </div>
    );
  }

  if (rawItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6 italic">
        No items found. Upload some in Admin → Fan App first.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rawItems.length > 6 && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const checked = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item)}
              className={`relative rounded-lg overflow-hidden aspect-square group border-2 transition-all ${
                checked
                  ? 'border-blue-500 shadow-md shadow-blue-200 dark:shadow-blue-900'
                  : 'border-transparent hover:border-blue-300'
              }`}
            >
              <img
                src={item.thumb}
                alt={item.label}
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover / selected */}
              <div className={`absolute inset-0 flex items-end p-1 transition-opacity ${
                checked ? 'bg-blue-600/30' : 'bg-black/0 group-hover:bg-black/20'
              }`}>
                {checked && (
                  <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center ml-auto mb-auto mt-1 mr-1 shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <span className="text-white text-xs leading-tight line-clamp-2 drop-shadow font-medium">
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {items.length === 0 && search && (
        <p className="text-sm text-muted-foreground text-center py-4">No results for "{search}"</p>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface DownloadPickerProps {
  items: DownloadItem[];
  onChange: (items: DownloadItem[]) => void;
}

export function DownloadPicker({ items, onChange }: DownloadPickerProps) {
  // Track which media IDs are already selected (by url, since ids differ between types)
  const selectedUrls = new Set(items.map((i) => i.url));
  // Track by composite key "type:id" to handle same URL in multiple types
  const selectedKeys = new Set(items.map((i) => `${i.type}:${i.id}`));

  const handleToggle = (item: { id: string; url: string; thumb: string; label: string; type: string }) => {
    const key = `${item.type}:${item.id}`;
    if (selectedKeys.has(key) || selectedUrls.has(item.url)) {
      // Deselect — remove by url
      onChange(items.filter((i) => i.url !== item.url));
    } else {
      // Select
      const newItem: DownloadItem = {
        id: `${item.type}-${item.id}`,
        label: item.label,
        url: item.url,
        thumb: item.thumb,
        type: item.type,
      };
      onChange([...items, newItem]);
    }
  };

  const removeItem = (dlItemId: string) => {
    onChange(items.filter((i) => i.id !== dlItemId));
  };

  return (
    <div className="space-y-4">
      {/* Selected items */}
      {items.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Selected ({items.length})
          </p>
          <ScrollArea className="max-h-32">
            <div className="space-y-1 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-1.5 bg-muted rounded-lg text-xs">
                  {item.thumb && (
                    <img src={item.thumb} alt={item.label} className="w-7 h-7 object-cover rounded shrink-0" />
                  )}
                  <span className="flex-1 truncate font-medium">{item.label}</span>
                  <Badge variant="outline" className="text-xs shrink-0 py-0">{item.type}</Badge>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Browser */}
      <div className="border rounded-xl overflow-hidden">
        <div className="px-3 pt-3 pb-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Pick from existing media
          </p>
        </div>
        <Tabs defaultValue="free" className="w-full">
          <div className="px-3">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex h-8 gap-1 bg-transparent p-0 mb-2">
                {MEDIA_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="text-xs px-2 h-7 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-400 whitespace-nowrap"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          {MEDIA_TABS.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="px-3 pb-3 mt-0">
              <ScrollArea className="max-h-52">
                <MediaTabContent
                  dlType={tab.dlType}
                  appType={tab.appType}
                  isFree={tab.isFree}
                  selectedIds={selectedUrls}
                  onToggle={handleToggle}
                />
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
