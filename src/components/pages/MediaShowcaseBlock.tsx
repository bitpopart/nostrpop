import { Link } from 'react-router-dom';
import { useAppMedia, type AppMedia } from '@/hooks/useAppContent';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, Clapperboard, UserCircle2, LayoutPanelTop, ArrowRight } from 'lucide-react';

export type MediaShowcaseType = 'app-wallpaper' | 'app-gif' | 'app-avatar' | 'app-banner';

const MEDIA_META: Record<MediaShowcaseType, {
  label: string;
  plural: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = {
  'app-wallpaper': {
    label: 'Wallpaper',
    plural: 'Wallpapers',
    href: '/wallpapers',
    icon: ImageIcon,
    accent: 'teal',
  },
  'app-gif': {
    label: 'GIF',
    plural: 'Animated GIFs',
    href: '/gifs',
    icon: Clapperboard,
    accent: 'amber',
  },
  'app-avatar': {
    label: 'Avatar',
    plural: 'Avatars',
    href: '/avatars',
    icon: UserCircle2,
    accent: 'purple',
  },
  'app-banner': {
    label: 'Banner',
    plural: 'Banners',
    href: '/banners',
    icon: LayoutPanelTop,
    accent: 'rose',
  },
};

interface MediaShowcaseBlockProps {
  mediaType: MediaShowcaseType;
  /** IDs of the selected media items to display. If empty, shows all. */
  selectedIds: string[];
}

export function MediaShowcaseBlock({ mediaType, selectedIds }: MediaShowcaseBlockProps) {
  const { data: allItems = [], isLoading } = useAppMedia(mediaType);
  const meta = MEDIA_META[mediaType];
  const Icon = meta.icon;

  // If specific IDs are selected, filter to those (preserving selection order).
  // If no IDs are selected fall back to showing all (up to 8) as a preview.
  const items: AppMedia[] = selectedIds.length > 0
    ? selectedIds
        .map(id => allItems.find(item => item.id === id))
        .filter((item): item is AppMedia => !!item)
    : allItems.slice(0, 8);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-base">{meta.plural}</h3>
        </div>
        <Link
          to={meta.href}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          View all
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {items.map(item => (
          <Link
            key={item.id}
            to={meta.href}
            className="group relative rounded-xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-all duration-200 block aspect-square"
            title={item.title !== 'Untitled' ? item.title : meta.label}
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* Hover overlay with title */}
            {item.title !== 'Untitled' && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-white text-[10px] font-medium leading-tight line-clamp-2">
                  {item.title}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* "See more" link if only showing a subset */}
      {selectedIds.length === 0 && allItems.length > 8 && (
        <div className="text-center pt-1">
          <Link
            to={meta.href}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            + {allItems.length - 8} more on the {meta.plural} page
          </Link>
        </div>
      )}
    </div>
  );
}
