import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, ImageIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useArtworks } from '@/hooks/useArtworks';
import { useFeaturedProjects } from '@/hooks/useProjects';
import { useAppMedia } from '@/hooks/useAppContent';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import type { GridTile } from '@/hooks/useHomepageSettings';

interface PickerItem {
  imageUrl: string;
  linkUrl: string;
  alt: string;
  discount?: number;
}

interface TilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (tiles: Omit<GridTile, 'id' | 'order'>[]) => void;
}

type Tab = 'art' | 'projects' | 'free' | 'shop';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'projects', label: 'Projects', emoji: '📂' },
  { id: 'free', label: 'Free Downloads', emoji: '🎁' },
  { id: 'shop', label: 'Shop', emoji: '🛒' },
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded" />
      ))}
    </div>
  );
}

function PickerTile({
  item,
  selected,
  onToggle,
}: {
  item: PickerItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative aspect-square overflow-hidden rounded border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-300'
          : 'border-transparent hover:border-purple-300'
      }`}
    >
      <img
        src={item.imageUrl}
        alt={item.alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={e => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          const ph = e.currentTarget.parentElement?.querySelector('.placeholder') as HTMLElement | null;
          if (ph) ph.style.display = 'flex';
        }}
      />
      {/* placeholder when image fails */}
      <div className="placeholder absolute inset-0 bg-gray-100 dark:bg-gray-800 hidden items-center justify-center">
        <ImageIcon className="h-5 w-5 text-gray-300" />
      </div>
      {/* discount badge */}
      {item.discount && item.discount > 0 && (
        <div className="absolute top-1 right-1 z-10">
          <span className="text-[9px] font-bold bg-orange-500 text-white px-1 py-0.5 rounded-full shadow leading-none">
            -{item.discount}%
          </span>
        </div>
      )}
      {/* selected overlay */}
      {selected && (
        <div className="absolute inset-0 bg-purple-600/40 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shadow">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
      )}
    </button>
  );
}

export function TilePickerDialog({ open, onClose, onAdd }: TilePickerDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('art');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Data sources
  const { data: artworks = [], isLoading: artLoading } = useArtworks('all', { enabled: open });
  const { data: projects = [], isLoading: projectsLoading } = useFeaturedProjects({ enabled: open });
  const { data: wallpapers = [], isLoading: wallpapersLoading } = useAppMedia('app-wallpaper');
  const { data: gifs = [], isLoading: gifsLoading } = useAppMedia('app-gif');
  const { data: shopProducts = [], isLoading: shopLoading } = useMarketplaceProducts();

  // Build items per tab
  const artItems: PickerItem[] = artworks
    .filter(a => a.images?.[0])
    .map(a => ({ imageUrl: a.images[0], linkUrl: `/art/${a.id}`, alt: a.title }));

  const projectItems: PickerItem[] = projects
    .filter(p => p.thumbnail && !p.thumbnail.endsWith('.svg'))
    .map(p => ({ imageUrl: p.thumbnail, linkUrl: p.url || '/projects', alt: p.name }));

  const freeItems: PickerItem[] = [
    ...wallpapers.map(w => ({ imageUrl: w.image_url, linkUrl: '/free', alt: w.title })),
    ...gifs.map(g => ({ imageUrl: g.image_url, linkUrl: '/free', alt: g.title })),
  ];

  const shopItems: PickerItem[] = shopProducts
    .filter(p => p.images?.[0])
    .map(p => ({
      imageUrl: p.images[0],
      linkUrl: p.type === 'physical' ? `/shop/${p.id}` : `/shop`,
      alt: p.name,
      discount: p.discount && p.discount > 0 ? p.discount : undefined,
    }));

  const tabItems: Record<Tab, PickerItem[]> = {
    art: artItems,
    projects: projectItems,
    free: freeItems,
    shop: shopItems,
  };

  const tabLoading: Record<Tab, boolean> = {
    art: artLoading,
    projects: projectsLoading,
    free: wallpapersLoading || gifsLoading,
    shop: shopLoading,
  };

  const currentItems = tabItems[activeTab];
  const isLoading = tabLoading[activeTab];

  // Filter by search
  const filtered = search.trim()
    ? currentItems.filter(i => i.alt.toLowerCase().includes(search.toLowerCase()))
    : currentItems;

  function toggleItem(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function itemKey(item: PickerItem) {
    return `${item.imageUrl}||${item.linkUrl}`;
  }

  function handleAdd() {
    const tiles: Omit<GridTile, 'id' | 'order'>[] = [];
    // Add from all tabs in the order they were selected (iterate all tabs)
    for (const tab of TABS) {
      for (const item of tabItems[tab.id]) {
        const key = itemKey(item);
        if (selected.has(key)) {
          tiles.push({ imageUrl: item.imageUrl, linkUrl: item.linkUrl, alt: item.alt, discount: item.discount });
        }
      }
    }
    onAdd(tiles);
    setSelected(new Set());
    setSearch('');
    onClose();
  }

  function handleClose() {
    setSelected(new Set());
    setSearch('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Pick thumbnails for the Photo Grid
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-2 border-b shrink-0 flex-wrap">
          {TABS.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full"
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
            >
              {tab.emoji} {tab.label}
              {tabItems[tab.id].length > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({tabItems[tab.id].length})</span>
              )}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          {isLoading ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <ImageIcon className="h-8 w-8 opacity-20" />
              <p>{search ? 'No results for that search.' : 'No images found in this section yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
              {filtered.map(item => {
                const key = itemKey(item);
                return (
                  <PickerTile
                    key={key}
                    item={item}
                    selected={selected.has(key)}
                    onToggle={() => toggleItem(key)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selected.size > 0 ? (
              <Badge variant="secondary">{selected.size} selected</Badge>
            ) : (
              <span>Click images to select</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={selected.size === 0}>
              Add {selected.size > 0 ? `${selected.size} tile${selected.size > 1 ? 's' : ''}` : 'tiles'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
