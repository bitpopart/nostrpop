/**
 * AppContentDashboard — the main "Fan App" admin view.
 *
 * Shows:
 * 1. Quick-upload buttons for every content type (each opens its inline uploader)
 * 2. Latest 3 rows (9 items) per section as a live preview grid
 * 3. A "Manage →" button per section that switches to the full sub-tab
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import { generateHashtagsFromText } from '@/lib/hashtags';
import {
  useAppMedia,
  usePublishAppMedia,
  useDeleteAppMedia,
  type AppMedia,
  type AppMediaType,
} from '@/hooks/useAppContent';
import {
  Image as ImageIcon,
  Clapperboard,
  UserCircle2,
  PanelTop,
  Upload,
  Plus,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Palette,
  Monitor,
  Laugh,
} from 'lucide-react';

// ── Preview rows constant ─────────────────────────────────
const PREVIEW_COLS = 3;
const PREVIEW_ROWS = 3;
const PREVIEW_LIMIT = PREVIEW_COLS * PREVIEW_ROWS; // 9

// ── Section definition ─────────────────────────────────────

interface SectionDef {
  type: AppMediaType;
  label: string;
  labelPlural: string;
  icon: React.ElementType;
  color: string;          // tailwind gradient classes
  tabValue: string;       // admin tab to navigate to
  accept: string;
  aspectClass: string;    // for thumbnails
  isRound?: boolean;      // avatars use circle style
  badge?: string;         // optional badge text (e.g. "Mobile")
}

const SECTIONS: SectionDef[] = [
  {
    type: 'app-wallpaper',
    label: 'Wallpaper',
    labelPlural: 'Wallpapers',
    icon: ImageIcon,
    color: 'from-teal-500 to-cyan-500',
    tabValue: 'app-wallpapers',
    accept: 'image/*',
    aspectClass: 'aspect-square',
    badge: 'Mobile',
  },
  {
    type: 'app-desktop-wallpaper',
    label: 'Desktop Wallpaper',
    labelPlural: 'Desktop Wallpapers',
    icon: Monitor,
    color: 'from-indigo-500 to-violet-500',
    tabValue: 'app-desktop-wallpapers',
    accept: 'image/*',
    aspectClass: 'aspect-video',
  },
  {
    type: 'app-gif',
    label: 'GIF',
    labelPlural: 'Animated GIFs',
    icon: Clapperboard,
    color: 'from-amber-500 to-orange-500',
    tabValue: 'app-gifs',
    accept: 'image/*',
    aspectClass: 'aspect-square',
  },
  {
    type: 'app-avatar',
    label: 'Avatar',
    labelPlural: 'Avatars',
    icon: UserCircle2,
    color: 'from-violet-500 to-purple-500',
    tabValue: 'app-avatars',
    accept: 'image/*',
    aspectClass: 'aspect-square',
    isRound: true,
  },
  {
    type: 'app-banner',
    label: 'Banner',
    labelPlural: 'Header Banners',
    icon: PanelTop,
    color: 'from-sky-500 to-blue-500',
    tabValue: 'app-banners',
    accept: 'image/*',
    aspectClass: 'aspect-video',
  },
  {
    type: 'app-coloring-page',
    label: 'Coloring Page',
    labelPlural: 'Coloring Pages',
    icon: Palette,
    color: 'from-rose-500 to-pink-500',
    tabValue: 'app-coloring-pages',
    accept: 'image/*',
    aspectClass: 'aspect-square',
  },
  {
    type: 'app-meme',
    label: 'Meme',
    labelPlural: 'Memes',
    icon: Laugh,
    color: 'from-yellow-500 to-orange-500',
    tabValue: 'app-memes',
    accept: 'image/*',
    aspectClass: 'aspect-square',
  },
];

// ── Quick upload button (inline drop zone, no card needed) ─

interface QuickUploadProps {
  section: SectionDef;
}

function QuickUploadButton({ section }: QuickUploadProps) {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publish } = usePublishAppMedia();
  const { getGradientStyle } = useThemeColors();

  const [uploading, setUploading] = useState(false);
  const [count, setCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setUploading(true);
    setCount(files.length);

    await Promise.all(files.map(async (file) => {
      try {
        const tags = await uploadFile(file);
        const url = tags[0][1];
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        publish({
          type: section.type,
          title: cleanTitle || section.label,
          imageUrl: url,
          hashtags: generateHashtagsFromText(cleanTitle, ''),
        });
      } catch { /* silently skip failed files */ }
    }));

    setUploading(false);
    setCount(0);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={section.accept}
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <Button
        size="sm"
        className="gap-1.5 text-white border-0 shadow"
        style={getGradientStyle('primary')}
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Uploading {count}…</>
          : <><Upload className="h-3.5 w-3.5" />Upload {section.label}</>
        }
      </Button>
    </>
  );
}

// ── Section preview strip ──────────────────────────────────

interface SectionPreviewProps {
  section: SectionDef;
  onManage: () => void;
}

function SectionPreview({ section, onManage }: SectionPreviewProps) {
  const { data: items = [], isLoading } = useAppMedia(section.type);
  const { mutate: deleteItem } = useDeleteAppMedia();
  const { getGradientStyle } = useThemeColors();

  const preview = items.slice(0, PREVIEW_LIMIT);
  const Icon = section.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r ${section.color} text-white`}>
              <Icon className="h-4 w-4" />
            </div>
            {section.labelPlural}
            {section.badge && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                <Smartphone className="h-2.5 w-2.5" />{section.badge}
              </span>
            )}
            {!isLoading && items.length > 0 && (
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <QuickUploadButton section={section} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onManage}
            >
              Manage
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className={`grid gap-2 ${section.aspectClass === 'aspect-video' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-3 md:grid-cols-6 lg:grid-cols-9'}`}>
            {[...Array(section.aspectClass === 'aspect-video' ? 3 : 6)].map((_, i) => (
              <Skeleton key={i} className={`${section.aspectClass} rounded-lg ${section.isRound ? 'rounded-full' : ''}`} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <Icon className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No {section.labelPlural.toLowerCase()} yet — upload your first one above!</p>
          </div>
        ) : (
          <>
            <div className={`grid gap-2 ${
              section.aspectClass === 'aspect-video'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-3 sm:grid-cols-6 lg:grid-cols-9'
            }`}>
              {preview.map(item => (
                <MediaThumb
                  key={item.id}
                  item={item}
                  section={section}
                  onDelete={() => deleteItem({ id: item.id, type: section.type })}
                />
              ))}
            </div>
            {items.length > PREVIEW_LIMIT && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                +{items.length - PREVIEW_LIMIT} more — <button className="underline text-primary" onClick={onManage}>manage all</button>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Single thumbnail ───────────────────────────────────────

function MediaThumb({
  item,
  section,
  onDelete,
}: {
  item: AppMedia;
  section: SectionDef;
  onDelete: () => void;
}) {
  return (
    <div className={`group relative overflow-hidden bg-muted ${section.isRound ? 'rounded-full' : 'rounded-lg'} border`}>
      <div className={section.aspectClass === 'aspect-video' ? '' : section.aspectClass}>
        <img
          src={item.image_url}
          alt={item.title}
          className={`${section.aspectClass === 'aspect-video' ? 'w-full h-auto block' : 'w-full h-full object-cover'} transition-transform duration-300 group-hover:scale-105`}
          loading="lazy"
        />
      </div>
      {/* Delete on hover */}
      <Button
        size="icon"
        variant="destructive"
        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
        title="Delete"
      >
        <X className="h-3 w-3" />
      </Button>
      {/* Title tooltip */}
      {item.title !== 'Untitled' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-[9px] truncate">{item.title}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard component ───────────────────────────────

interface AppContentDashboardProps {
  /** Called when the user clicks "Manage" on a section; parent switches the admin tab */
  onNavigate: (tab: string) => void;
}

export function AppContentDashboard({ onNavigate }: AppContentDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Top quick-upload strip */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-orange-600" />
            Quick Upload
          </CardTitle>
          <CardDescription>
            Instantly upload new content to any section — files are published immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {SECTIONS.map(section => (
              <QuickUploadButton key={section.type} section={section} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-section preview strips */}
      {SECTIONS.map(section => (
        <SectionPreview
          key={section.type}
          section={section}
          onManage={() => onNavigate(section.tabValue)}
        />
      ))}
    </div>
  );
}
