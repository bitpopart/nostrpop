import { useState, useRef, useEffect, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAppMedia } from '@/hooks/useAppContent';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import { useAnimations } from '@/hooks/useAnimations';
import { useStudioLibraries } from '@/hooks/useStudioLibraries';
import { useHomepageSettings } from '@/hooks/useHomepageSettings';
import { ZapButton } from '@/components/ZapButton';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { AvatarGeneratorCanvas } from '@/components/studio/AvatarGeneratorCanvas';
import {
  Download,
  Image as ImageIcon,
  Clapperboard,
  Settings,
  Gift,
  UserCircle2,
  PanelTop,
  Sparkles,
  Printer,
  LayoutGrid,
  Smartphone,
  Monitor,
  Palette,
  X,
  RotateCcw,
  Type,
  Trash2,
  PenLine,
  Home,
} from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

// ── Helpers ───────────────────────────────────────────────

function handleDownload(url: string, filename: string) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    })
    .catch(() => window.open(url, '_blank'));
}

function deriveFilename(url: string, title: string): string {
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `download.${ext}`;
}

// ── Image Carousel ────────────────────────────────────────

interface CarouselItem {
  id: string;
  image_url: string;
  title: string;
}

function ImageCarousel({ items, isLoading }: { items: CarouselItem[]; isLoading: boolean }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex(i => (i + 1) % items.length);
      }, 3500);
    }
  }, [items.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const prev = () => { setIndex(i => (i - 1 + items.length) % items.length); resetTimer(); };
  const next = () => { setIndex(i => (i + 1) % items.length); resetTimer(); };

  if (isLoading) {
    return <Skeleton className="w-full aspect-[4/3] rounded-2xl" />;
  }

  if (items.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-orange-100 via-pink-100 to-yellow-100 dark:from-orange-900/20 dark:via-pink-900/20 dark:to-yellow-900/20 flex items-center justify-center">
        <img
          src={`${import.meta.env.BASE_URL || '/'}B-Funny_avatar_orange.svg`}
          alt="BitPopArt"
          className="h-24 w-24 opacity-60"
        />
      </div>
    );
  }

  const item = items[index];

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl group">
      {items.map((it, i) => (
        <img
          key={it.id}
          src={it.image_url}
          alt={it.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      {/* Nav buttons */}
      {items.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            onClick={prev}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            onClick={next}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
              onClick={() => { setIndex(i); resetTimer(); }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      {item.title !== 'Untitled' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white text-sm font-medium truncate">{item.title}</p>
        </div>
      )}
    </div>
  );
}

// ── Media Category Icon Bar ────────────────────────────────

type MediaTab = 'wallpaper' | 'gif' | 'avatar' | 'banner' | 'animation' | 'free' | 'coloring' | 'desktop';

const MEDIA_CATEGORIES: { id: MediaTab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'wallpaper', label: 'Walls', icon: <Smartphone className="h-5 w-5" />, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30' },
  { id: 'gif', label: 'GIFs', icon: <Clapperboard className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  { id: 'avatar', label: 'Avatars', icon: <UserCircle2 className="h-5 w-5" />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
  { id: 'banner', label: 'Banners', icon: <PanelTop className="h-5 w-5" />, color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30' },
  { id: 'animation', label: 'Anim.', icon: <Sparkles className="h-5 w-5" />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
  { id: 'free', label: 'Free', icon: <Gift className="h-5 w-5" />, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
  { id: 'coloring', label: 'Color', icon: <Palette className="h-5 w-5" />, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30' },
  { id: 'desktop', label: 'Desktop', icon: <Monitor className="h-5 w-5" />, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
];

// ── Photo Grid (same as /homepage grid view) ─────────────

interface GridTileItem {
  id: string;
  imageUrl: string;
  linkUrl: string;
  alt?: string;
  order: number;
}

function AppPhotoGrid({ tiles, isLoading }: { tiles: GridTileItem[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-sm" />
        ))}
      </div>
    );
  }

  if (tiles.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm space-y-2">
        <LayoutGrid className="h-8 w-8 mx-auto opacity-20" />
        <p>No tiles configured yet.</p>
        <p className="text-xs">Add tiles in Homepage Settings → Photo Grid.</p>
      </div>
    );
  }

  const sorted = [...tiles].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-3 gap-1">
      {sorted.map(tile => {
        const isExternal = tile.linkUrl.startsWith('http://') || tile.linkUrl.startsWith('https://');
        const inner = (
          <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800 group rounded-sm">
            <img
              src={tile.imageUrl}
              alt={tile.alt || ''}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
          </div>
        );

        return isExternal ? (
          <a key={tile.id} href={tile.linkUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-sm">
            {inner}
          </a>
        ) : (
          <Link key={tile.id} to={tile.linkUrl} className="block overflow-hidden rounded-sm">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

// ── Media Grid (for Download tab) ─────────────────────────

interface MediaItem {
  id: string;
  image_url: string;
  title: string;
}

function MediaScrollGrid({
  items,
  isLoading,
  category,
  onGetThis,
}: {
  items: MediaItem[];
  isLoading: boolean;
  category: string;
  onGetThis: (item: MediaItem) => void;
}) {
  const { getGradientStyle } = useThemeColors();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Nothing here yet!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <div key={item.id} className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          <div className="aspect-square">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          {/* Get This button */}
          <button
            className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100"
            onClick={() => onGetThis(item)}
          >
            <span
              className="text-white text-xs font-bold px-3 py-1 rounded-full shadow"
              style={getGradientStyle('primary') as React.CSSProperties}
            >
              Get This
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Mini Canvas (Create tab) ──────────────────────────────

type CanvasEl = {
  id: string;
  kind: 'image' | 'text';
  x: number; y: number;
  width: number; height: number;
  src?: string;
  text?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
};

const CANVAS_SIZE = 320; // pixels, square
const POP_COLORS = [
  '#FF0080','#FF4500','#FFD700','#00FF41','#00BFFF','#FF69B4',
  '#FF1493','#FF6600','#FFFF00','#39FF14','#00FFFF','#BF00FF',
  '#FF0000','#FF8C00','#FFF01F','#7FFF00','#0080FF','#FF00FF',
  '#FFFFFF','#000000','#C0C0C0','#808080',
];

function MiniCanvas({ onSave }: { onSave: (dataUrl: string, title: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<CanvasEl[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [tool, setTool] = useState<'select' | 'text'>('select');
  const [saved, setSaved] = useState(false);
  const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const { data: libraries = [] } = useStudioLibraries();

  const allImages = libraries.flatMap(lib =>
    lib.images.slice(0, 6).map((img, i) => ({ id: `${lib.id}-${i}`, url: img.url, name: img.name }))
  );

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (const el of elements) {
      if (el.kind === 'image' && el.src) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
          if (selected === el.id) {
            ctx.strokeStyle = '#FF0080';
            ctx.lineWidth = 2;
            ctx.strokeRect(el.x, el.y, el.width, el.height);
          }
        };
        img.src = el.src;
      } else if (el.kind === 'text' && el.text) {
        ctx.font = `${el.bold ? 'bold ' : ''}${el.fontSize || 24}px ${el.fontFamily || 'Impact'}`;
        ctx.fillStyle = el.color || '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(el.text, el.x + el.width / 2, el.y + (el.fontSize || 24));
        if (selected === el.id) {
          ctx.strokeStyle = '#FF0080';
          ctx.lineWidth = 1;
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      }
    }
  }, [elements, selected, bgColor]);

  const addText = () => {
    const text = prompt('Enter text:');
    if (!text) return;
    const el: CanvasEl = {
      id: `txt-${Date.now()}`,
      kind: 'text',
      x: 40, y: 40,
      width: 240, height: 40,
      text,
      fontSize: 28,
      color: '#FF0080',
      fontFamily: 'Impact',
    };
    setElements(prev => [...prev, el]);
    setSelected(el.id);
  };

  const addImage = (src: string) => {
    const el: CanvasEl = {
      id: `img-${Date.now()}`,
      kind: 'image',
      x: 40, y: 40,
      width: 140, height: 140,
      src,
    };
    setElements(prev => [...prev, el]);
    setSelected(el.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    setElements(prev => prev.filter(e => e.id !== selected));
    setSelected(null);
  };

  const clear = () => { setElements([]); setSelected(null); setSaved(false); };

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasPos(e);
    // Hit test in reverse order (top element first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        setSelected(el.id);
        dragging.current = { id: el.id, startX: x, startY: y, origX: el.x, origY: el.y };
        return;
      }
    }
    setSelected(null);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const { x, y } = getCanvasPos(e);
    const dx = x - dragging.current.startX;
    const dy = y - dragging.current.startY;
    setElements(prev => prev.map(el =>
      el.id === dragging.current!.id
        ? { ...el, x: dragging.current!.origX + dx, y: dragging.current!.origY + dy }
        : el
    ));
  };

  const onMouseUp = () => { dragging.current = null; };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Redraw synchronously for export
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, 'My BitPopArt Creation');
    setSaved(true);
  };

  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="rounded-xl border-2 border-orange-200 dark:border-orange-700 shadow-md cursor-crosshair"
          style={{ width: '100%', maxWidth: CANVAS_SIZE, touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
      </div>

      {/* Tools */}
      <div className="flex gap-2 flex-wrap justify-center">
        <Button size="sm" variant="outline" className="gap-1" onClick={addText}>
          <Type className="h-3.5 w-3.5" /> Add Text
        </Button>
        {selected && (
          <Button size="sm" variant="destructive" className="gap-1" onClick={removeSelected}>
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1" onClick={clear}>
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </Button>
      </div>

      {/* BG Colors */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 font-medium">Background</p>
        <div className="flex flex-wrap gap-1.5">
          {POP_COLORS.map(c => (
            <button
              key={c}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === c ? 'border-orange-500 scale-110' : 'border-transparent'}`}
              style={{ background: c, boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #ccc' : undefined }}
              onClick={() => setBgColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Library images */}
      {allImages.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">Add from Library</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map(asset => (
              <button
                key={asset.id}
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border hover:border-orange-400 transition-colors"
                onClick={() => addImage(asset.url)}
              >
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <Button
        className="w-full gap-2 text-white border-0 font-bold"
        style={{ background: 'linear-gradient(135deg, #FF0080, #FF4500)' } as React.CSSProperties}
        onClick={exportCanvas}
      >
        {saved ? '✅ Saved! Get This' : '💾 Save & Get This'}
      </Button>
    </div>
  );
}

// ── Avatar Generator mini wrapper ─────────────────────────

function AvatarGenMini({ onGetThis }: { onGetThis: (dataUrl: string, title: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">Mix & match layers to create your unique avatar, then tap "Get This"!</p>
      <AvatarGeneratorCanvas />
      <Button
        className="w-full gap-2 text-white border-0 font-bold"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' } as React.CSSProperties}
        onClick={() => {
          // Pull the canvas element from the DOM if available
          const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
          if (canvas) {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              onGetThis(dataUrl, 'My Avatar');
            } catch {
              // Cross-origin fallback
              const img = document.querySelector('.avatar-preview-img') as HTMLImageElement | null;
              if (img?.src) onGetThis(img.src, 'My Avatar');
            }
          }
        }}
      >
        🖨️ Get This Avatar
      </Button>
    </div>
  );
}

// ── Print / Get This card ─────────────────────────────────

interface PrintItemCardProps {
  imageDataUrl: string;
  title: string;
  onClose: () => void;
}

function PrintItemCard({ imageDataUrl, title, onClose }: PrintItemCardProps) {
  const { getGradientStyle } = useThemeColors();

  const handleDownloadItem = () => {
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = deriveFilename(imageDataUrl.slice(0, 40), title);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><style>
      @page{margin:0}body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
      img{max-width:100%;max-height:100vh;object-fit:contain}
    </style></head><body><img src="${imageDataUrl}" /></body>
    <script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></html>`;
    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="rounded-xl overflow-hidden border shadow-md">
        <img
          src={imageDataUrl}
          alt={title}
          className="w-full object-contain max-h-60"
          style={{ background: '#f9f9f9' }}
        />
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="font-bold text-lg">{title}</p>
        <Badge className="text-xs mt-1 bg-green-100 text-green-700 border-green-200">Free · No login required</Badge>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button className="gap-2 text-white border-0 font-semibold" style={getGradientStyle('primary') as React.CSSProperties} onClick={handleDownloadItem}>
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" className="gap-2 font-semibold" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Zap tip */}
      <div className="border rounded-xl p-3 bg-orange-50 dark:bg-orange-900/10 text-center space-y-2">
        <p className="text-sm font-medium">Enjoyed this? Leave a tip ⚡</p>
        <p className="text-xs text-muted-foreground">Everything here is free — a zap keeps the art flowing!</p>
        <ZapButton
          authorPubkey={ADMIN_PUBKEY}
          lightningAddress="traveltelly@primal.net"
          eventTitle={title}
          size="default"
          variant="outline"
          showLabel={true}
          alwaysShow={true}
          className="w-full border-orange-400 text-orange-700 hover:bg-orange-100"
        />
      </div>

      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
        <X className="h-4 w-4 mr-1" /> Close
      </Button>
    </div>
  );
}

// ── Active tab types ──────────────────────────────────────

type AppTab = 'home' | 'create' | 'download' | 'print';
type CreateSubTab = 'canvas' | 'avatar';

// ── Main App page ─────────────────────────────────────────

export default function AppPage() {
  const navigate = useNavigate();
  const { user, metadata } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();

  // Active tab
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [createSubTab, setCreateSubTab] = useState<CreateSubTab>('canvas');
  const [activeMediaTab, setActiveMediaTab] = useState<MediaTab>('wallpaper');

  // Print item
  const [printItem, setPrintItem] = useState<{ dataUrl: string; title: string } | null>(null);

  // Data
  const { data: wallpapers = [], isLoading: wpLoading } = useAppMedia('app-wallpaper');
  const { data: gifs = [], isLoading: gifLoading } = useAppMedia('app-gif');
  const { data: avatars = [], isLoading: avatarLoading } = useAppMedia('app-avatar');
  const { data: banners = [], isLoading: bannerLoading } = useAppMedia('app-banner');
  const { data: coloringPages = [], isLoading: coloringLoading } = useAppMedia('app-coloring-page');
  const { data: desktopWalls = [], isLoading: desktopLoading } = useAppMedia('app-desktop-wallpaper');
  const { data: freeDownloads = [], isLoading: freeLoading } = useFreeDownloads();
  const { data: animations = [], isLoading: animLoading } = useAnimations();

  // Homepage grid tiles
  const { data: homepageSettings, isLoading: gridLoading } = useHomepageSettings();
  const gridTiles = homepageSettings?.gridTiles || [];

  // Merge ALL media for carousel
  const allMediaItems: CarouselItem[] = [
    ...wallpapers.map(m => ({ id: `wp-${m.id}`, image_url: m.image_url, title: m.title })),
    ...gifs.map(m => ({ id: `gif-${m.id}`, image_url: m.image_url, title: m.title })),
    ...avatars.map(m => ({ id: `av-${m.id}`, image_url: m.image_url, title: m.title })),
    ...freeDownloads.map(m => ({ id: `fr-${m.id}`, image_url: m.image_url, title: m.title })),
  ].slice(0, 20);

  const allMediaLoading = wpLoading && gifLoading && avatarLoading && freeLoading;

  // Get items for the current download media tab
  const downloadItems = (() => {
    switch (activeMediaTab) {
      case 'wallpaper': return { items: wallpapers as MediaItem[], loading: wpLoading };
      case 'gif': return { items: gifs as MediaItem[], loading: gifLoading };
      case 'avatar': return { items: avatars as MediaItem[], loading: avatarLoading };
      case 'banner': return { items: banners as MediaItem[], loading: bannerLoading };
      case 'animation': return { items: animations.map(a => ({ id: a.id, image_url: a.thumb_url || '', title: a.title })).filter(a => !!a.image_url), loading: animLoading };
      case 'free': return { items: freeDownloads as MediaItem[], loading: freeLoading };
      case 'coloring': return { items: coloringPages as MediaItem[], loading: coloringLoading };
      case 'desktop': return { items: desktopWalls as MediaItem[], loading: desktopLoading };
    }
  })();

  // Handle "Get This" — put item in print view
  const handleGetThis = (item: MediaItem) => {
    setPrintItem({ dataUrl: item.image_url, title: item.title });
    setActiveTab('print');
  };

  // Handle canvas/avatar save → go to print
  const handleCanvasSave = (dataUrl: string, title: string) => {
    setPrintItem({ dataUrl, title });
    setActiveTab('print');
  };

  useSeoMeta({
    title: 'BitPopArt App | Wallpapers, GIFs, Animations & More',
    description: 'The BitPopArt fan app — free wallpapers, GIFs, animations, games, merch and more! Download free Bitcoin pop art for your devices and social media profiles.',
    keywords: 'bitpopart app, bitcoin art app, free bitcoin downloads, bitcoin pop art app, nostr app, bitcoin fan app, free art downloads, bitcoin wallpaper app',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'BitPopArt App | Wallpapers, GIFs, Animations & More',
    ogDescription: 'The BitPopArt fan app — free wallpapers, GIFs, animations, games, merch and more!',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogImageAlt: 'BitPopArt App',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/app',
    twitterCard: 'summary_large_image',
    twitterTitle: 'BitPopArt App | Wallpapers, GIFs, Animations & More',
    twitterDescription: 'The BitPopArt fan app — free wallpapers, GIFs, animations, games, merch and more!',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20 pb-24">
      <div className="container mx-auto px-4 py-5 max-w-xl">

        {/* ── Admin shortcut ── */}
        {isAdmin && (
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin?tab=app')}>
              <Settings className="h-4 w-4 mr-1" /> Manage App Content
            </Button>
          </div>
        )}

        {/* ══ HOME TAB ══════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="space-y-6">

            {/* Header logo */}
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL || '/'}B-Funny_avatar_orange.svg`}
                alt="BitPopArt"
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-xl font-extrabold gradient-header-text leading-tight">BitPopArt App</h1>
                <p className="text-xs text-muted-foreground">Free art for the people ⚡</p>
              </div>
            </div>

            {/* ── Image Carousel ── */}
            <ImageCarousel items={allMediaItems} isLoading={allMediaLoading} />

            {/* ── Category icon bar ── */}
            <div>
              <div className="overflow-x-auto pb-1 -mx-4 px-4">
                <div className="flex gap-2 w-max">
                  {MEDIA_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveMediaTab(cat.id); setActiveTab('download'); }}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${cat.color} hover:shadow-sm`}
                    >
                      {cat.icon}
                      <span className="text-[10px] font-semibold whitespace-nowrap">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Photo Grid (same grid as homepage) ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-bold">Gallery</h2>
              </div>
              <AppPhotoGrid tiles={gridTiles} isLoading={gridLoading} />
            </section>

          </div>
        )}

        {/* ══ CREATE TAB ════════════════════════════════════ */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold gradient-header-text">Create</h2>

            {/* Sub-tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${createSubTab === 'canvas' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-muted-foreground'}`}
                onClick={() => setCreateSubTab('canvas')}
              >
                ✍️ Canvas
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${createSubTab === 'avatar' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-muted-foreground'}`}
                onClick={() => setCreateSubTab('avatar')}
              >
                🎭 Avatar Generator
              </button>
            </div>

            {createSubTab === 'canvas' && (
              <MiniCanvas onSave={handleCanvasSave} />
            )}

            {createSubTab === 'avatar' && (
              <AvatarGenMini onGetThis={handleCanvasSave} />
            )}
          </div>
        )}

        {/* ══ DOWNLOAD TAB ═════════════════════════════════ */}
        {activeTab === 'download' && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold gradient-header-text">Download</h2>

            {/* Category icon bar */}
            <div className="overflow-x-auto pb-1 -mx-4 px-4">
              <div className="flex gap-2 w-max">
                {MEDIA_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveMediaTab(cat.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all ${
                      activeMediaTab === cat.id
                        ? 'ring-2 ring-orange-400 ' + cat.color + ' shadow-md'
                        : cat.color + ' opacity-70 hover:opacity-100'
                    }`}
                  >
                    {cat.icon}
                    <span className="text-[10px] font-semibold whitespace-nowrap">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active category label */}
            <div className="flex items-center gap-2">
              {MEDIA_CATEGORIES.find(c => c.id === activeMediaTab)?.icon}
              <h3 className="font-bold text-base">
                {MEDIA_CATEGORIES.find(c => c.id === activeMediaTab)?.label}
              </h3>
              {!downloadItems.loading && downloadItems.items.length > 0 && (
                <Badge variant="secondary" className="text-xs">{downloadItems.items.length}</Badge>
              )}
            </div>

            <MediaScrollGrid
              items={downloadItems.items}
              isLoading={downloadItems.loading}
              category={activeMediaTab}
              onGetThis={handleGetThis}
            />
          </div>
        )}

        {/* ══ PRINT TAB ════════════════════════════════════ */}
        {activeTab === 'print' && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold gradient-header-text">🖨️ Get This</h2>

            {printItem ? (
              <PrintItemCard
                imageDataUrl={printItem.dataUrl}
                title={printItem.title}
                onClose={() => { setPrintItem(null); setActiveTab('home'); }}
              />
            ) : (
              <div className="text-center py-16 space-y-4">
                <Printer className="h-14 w-14 mx-auto text-gray-300" />
                <p className="text-muted-foreground text-sm">
                  No item selected yet.
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create something on the canvas, generate an avatar, or tap <strong>"Get This"</strong> on any download item — it'll appear here ready to print or download!
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('create')}>
                    ✍️ Go Create
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('download')}>
                    ⬇️ Browse Downloads
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ══ BOTTOM APP BAR ═══════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="container mx-auto max-w-xl">
          <div className="flex">

            {/* Home */}
            <button
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeTab === 'home' ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('home')}
            >
              <div className={`p-1.5 rounded-lg transition-all ${activeTab === 'home' ? 'bg-orange-50 dark:bg-orange-900/30' : ''}`}>
                <Home className={`h-5 w-5 ${activeTab === 'home' ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              </div>
              <span className="text-[10px] font-semibold">Home</span>
            </button>

            {/* Create */}
            <button
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeTab === 'create' ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('create')}
            >
              <div className={`p-1.5 rounded-lg transition-all ${activeTab === 'create' ? 'bg-orange-50 dark:bg-orange-900/30' : ''}`}>
                <PenLine className={`h-5 w-5 ${activeTab === 'create' ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              </div>
              <span className="text-[10px] font-semibold">Create</span>
            </button>

            {/* Download */}
            <button
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeTab === 'download' ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('download')}
            >
              <div className={`p-1.5 rounded-lg transition-all ${activeTab === 'download' ? 'bg-orange-50 dark:bg-orange-900/30' : ''}`}>
                <Download className={`h-5 w-5 ${activeTab === 'download' ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              </div>
              <span className="text-[10px] font-semibold">Download</span>
            </button>

            {/* Print */}
            <button
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${activeTab === 'print' ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('print')}
            >
              {printItem && (
                <span className="absolute top-2 right-[calc(50%-10px)] h-2 w-2 bg-orange-500 rounded-full" />
              )}
              <div className={`p-1.5 rounded-lg transition-all ${activeTab === 'print' ? 'bg-orange-50 dark:bg-orange-900/30' : ''}`}>
                <Printer className={`h-5 w-5 ${activeTab === 'print' ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
              </div>
              <span className="text-[10px] font-semibold">Print</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
