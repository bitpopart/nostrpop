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
  ChevronLeft,
  ChevronRight,
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
  Zap,
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

// Interaction state: what the pointer is doing
type PointerMode =
  | { kind: 'idle' }
  | { kind: 'drag';   id: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: 'resize'; id: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number };

const CANVAS_SIZE = 320;
const HANDLE = 12; // corner-handle hit-area radius in canvas-space pixels

const POP_COLORS = [
  '#FF0080','#FF4500','#FFD700','#00FF41','#00BFFF','#FF69B4',
  '#FF1493','#FF6600','#FFFF00','#39FF14','#00FFFF','#BF00FF',
  '#FF0000','#FF8C00','#FFF01F','#7FFF00','#0080FF','#FF00FF',
  '#FFFFFF','#000000','#C0C0C0','#808080',
];

// Draw a single frame — imgCache maps element id → loaded HTMLImageElement
function drawFrame(
  ctx: CanvasRenderingContext2D,
  elements: CanvasEl[],
  selected: string | null,
  bgColor: string,
  imgCache: Map<string, HTMLImageElement>,
) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  for (const el of elements) {
    if (el.kind === 'image') {
      const img = imgCache.get(el.id);
      if (img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } else {
        // Placeholder while loading
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading…', el.x + el.width / 2, el.y + el.height / 2);
      }
    } else if (el.kind === 'text' && el.text) {
      const fs = el.fontSize || 28;
      ctx.font = `bold ${fs}px ${el.fontFamily || 'Impact'}`;
      ctx.fillStyle = el.color || '#FF0080';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(el.text, el.x, el.y, el.width);
    }

    // Selection frame + handles
    if (selected === el.id) {
      ctx.save();
      ctx.strokeStyle = '#FF0080';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(el.x - 1, el.y - 1, el.width + 2, el.height + 2);
      ctx.setLineDash([]);

      const corners = [
        { cx: el.x + el.width, cy: el.y + el.height },
        { cx: el.x,            cy: el.y + el.height },
        { cx: el.x + el.width, cy: el.y             },
        { cx: el.x,            cy: el.y             },
      ];
      corners.forEach(({ cx, cy }) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF0080';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ctx.restore();
    }
  }
}

function MiniCanvas({ onSave }: { onSave: (dataUrl: string, title: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [elements, setElements] = useState<CanvasEl[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [saved, setSaved] = useState(false);

  // Stable refs so event handlers always see latest values without stale closures
  const elRef  = useRef<CanvasEl[]>(elements);
  const selRef = useRef<string | null>(selected);
  const bgRef  = useRef(bgColor);
  useEffect(() => { elRef.current  = elements; }, [elements]);
  useEffect(() => { selRef.current = selected; }, [selected]);
  useEffect(() => { bgRef.current  = bgColor;  }, [bgColor]);

  // Image cache: id → loaded HTMLImageElement (lives outside React state)
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const ptrRef = useRef<PointerMode>({ kind: 'idle' });

  const { data: libraries = [] } = useStudioLibraries();
  // Show ALL images from ALL libraries (no per-library cap)
  const allLibImages = libraries.flatMap(lib =>
    lib.images.map((img, i) => ({ id: `${lib.id}-${i}`, url: img.url, name: img.name }))
  );

  // ── Redraw ───────────────────────────────────────────────
  const redraw = useCallback((els?: CanvasEl[], sel?: string | null, bg?: string) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      drawFrame(
        ctx,
        els  ?? elRef.current,
        sel  !== undefined ? sel  : selRef.current,
        bg   ?? bgRef.current,
        imgCache.current,
      );
    });
  }, []);

  useEffect(() => { redraw(elements, selected, bgColor); },
    [elements, selected, bgColor, redraw]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Helpers ──────────────────────────────────────────────

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (e.clientY - rect.top)  * (CANVAS_SIZE / rect.height),
    };
  };

  const hitCorner = (el: CanvasEl, px: number, py: number): boolean => {
    const corners = [
      { cx: el.x + el.width, cy: el.y + el.height },
      { cx: el.x,            cy: el.y + el.height },
      { cx: el.x + el.width, cy: el.y             },
      { cx: el.x,            cy: el.y             },
    ];
    return corners.some(({ cx, cy }) =>
      Math.abs(px - cx) <= HANDLE && Math.abs(py - cy) <= HANDLE
    );
  };

  // ── Pointer events ───────────────────────────────────────

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getPos(e);
    const els = elRef.current;

    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i];
      if (selRef.current === el.id && hitCorner(el, x, y)) {
        ptrRef.current = { kind: 'resize', id: el.id, startX: x, startY: y, origX: el.x, origY: el.y, origW: el.width, origH: el.height };
        return;
      }
      if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        setSelected(el.id);
        selRef.current = el.id;
        ptrRef.current = { kind: 'drag', id: el.id, startX: x, startY: y, origX: el.x, origY: el.y };
        return;
      }
    }
    setSelected(null);
    selRef.current = null;
    ptrRef.current = { kind: 'idle' };
    redraw(undefined, null);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ptr = ptrRef.current;
    if (ptr.kind === 'idle') return;
    const { x, y } = getPos(e);

    if (ptr.kind === 'drag') {
      const dx = x - ptr.startX;
      const dy = y - ptr.startY;
      setElements(prev => prev.map(el =>
        el.id === ptr.id ? { ...el, x: ptr.origX + dx, y: ptr.origY + dy } : el
      ));
    } else if (ptr.kind === 'resize') {
      const dx = x - ptr.startX;
      const dy = y - ptr.startY;
      setElements(prev => prev.map(el => {
        if (el.id !== ptr.id) return el;
        const newW = Math.max(20, ptr.origW + dx);
        if (el.kind === 'image') {
          const ratio = ptr.origW / Math.max(1, ptr.origH);
          return { ...el, width: Math.round(newW), height: Math.round(newW / ratio) };
        }
        return { ...el, width: Math.round(newW), height: Math.max(12, Math.round(ptr.origH + dy)) };
      }));
    }
  };

  const onPointerUp = () => { ptrRef.current = { kind: 'idle' }; };

  // ── Element actions ──────────────────────────────────────

  const addText = () => {
    const text = prompt('Enter text:');
    if (!text) return;
    const id = `txt-${Date.now()}`;
    const el: CanvasEl = {
      id, kind: 'text',
      x: 20, y: 120,
      width: CANVAS_SIZE - 40, height: 40,
      text, fontSize: 32, color: '#FF0080', fontFamily: 'Impact',
    };
    setElements(prev => [...prev, el]);
    setSelected(id);
    selRef.current = id;
    setSaved(false);
  };

  const addImage = useCallback((src: string) => {
    const id = `img-${Date.now()}`;

    // Show a placeholder element immediately so user sees something
    const placeholder: CanvasEl = {
      id, kind: 'image',
      x: 20, y: 20, width: 120, height: 120, src,
    };
    setElements(prev => [...prev, placeholder]);
    setSelected(id);
    selRef.current = id;
    setSaved(false);

    // Load image — use a CORS proxy if direct load fails
    const tryLoad = (url: string, usedProxy: boolean) => {
      const imgEl = new window.Image();
      // Only set crossOrigin for non-proxied urls to avoid CORS preflight issues
      if (!usedProxy) imgEl.crossOrigin = 'anonymous';

      imgEl.onload = () => {
        imgCache.current.set(id, imgEl);
        const ratio = imgEl.naturalWidth / Math.max(1, imgEl.naturalHeight);
        const w = Math.min(160, CANVAS_SIZE * 0.5);
        const h = w / ratio;
        // Update the placeholder with real dimensions
        setElements(prev => prev.map(el =>
          el.id === id ? { ...el, width: Math.round(w), height: Math.round(h) } : el
        ));
        // Force redraw now the image is ready
        redraw();
      };

      imgEl.onerror = () => {
        if (!usedProxy) {
          // Retry via CORS proxy
          tryLoad(`https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`, true);
        } else {
          // Give up — remove placeholder
          setElements(prev => prev.filter(el => el.id !== id));
        }
      };

      imgEl.src = url;
    };

    tryLoad(src, false);
  }, [redraw]);

  const removeSelected = () => {
    if (!selRef.current) return;
    setElements(prev => prev.filter(e => e.id !== selRef.current));
    setSelected(null);
    selRef.current = null;
    setSaved(false);
  };

  const clear = () => {
    setElements([]);
    setSelected(null);
    selRef.current = null;
    setSaved(false);
  };

  // Scale selected element
  const scaleSelected = (factor: number) => {
    if (!selRef.current) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selRef.current) return el;
      if (el.kind === 'image') {
        return { ...el, width: Math.round(el.width * factor), height: Math.round(el.height * factor) };
      }
      // text: adjust fontSize
      return { ...el, fontSize: Math.max(8, Math.round((el.fontSize || 28) * factor)) };
    }));
    setSaved(false);
  };

  // Font size step for text
  const changeFontSize = (delta: number) => {
    if (!selRef.current) return;
    setElements(prev => prev.map(el => {
      if (el.id !== selRef.current || el.kind !== 'text') return el;
      return { ...el, fontSize: Math.max(8, Math.min(120, (el.fontSize || 28) + delta)) };
    }));
    setSaved(false);
  };

  // Color picker for selected text
  const changeTextColor = (color: string) => {
    if (!selRef.current) return;
    setElements(prev => prev.map(el =>
      el.id === selRef.current && el.kind === 'text' ? { ...el, color } : el
    ));
    setSaved(false);
  };

  const exportCanvas = useCallback(() => {
    // Render a clean frame (no selection handles) for export
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_SIZE;
    offscreen.height = CANVAS_SIZE;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    drawFrame(ctx, elRef.current, null, bgRef.current, imgCache.current);
    const dataUrl = offscreen.toDataURL('image/png');
    onSave(dataUrl, 'My BitPopArt Creation');
    setSaved(true);
  }, [onSave]);

  const selectedEl = elements.find(e => e.id === selected) ?? null;

  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div className="flex justify-center touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="rounded-xl border-2 border-orange-200 dark:border-orange-700 shadow-md w-full"
          style={{ maxWidth: CANVAS_SIZE, touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>

      {/* ── Selection controls (shown only when something is selected) ── */}
      {selectedEl && (
        <div className="rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wider">
            Selected: {selectedEl.kind === 'text' ? `"${selectedEl.text}"` : 'Image'}
          </p>

          {/* Scale controls — same for both image and text */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 shrink-0">Size</span>
            <div className="flex gap-1.5">
              <button
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 transition-colors font-bold text-sm"
                onClick={() => scaleSelected(0.85)}
                title="Scale down"
              >－</button>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 transition-colors font-bold text-sm"
                onClick={() => scaleSelected(1.18)}
                title="Scale up"
              >＋</button>
            </div>

            {/* Font size stepper for text */}
            {selectedEl.kind === 'text' && (
              <>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">Font</span>
                <div className="flex items-center gap-1">
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 transition-colors font-bold text-sm"
                    onClick={() => changeFontSize(-2)}
                    title="Smaller font"
                  >A−</button>
                  <span className="text-xs w-7 text-center font-mono text-muted-foreground">{selectedEl.fontSize}</span>
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 transition-colors font-bold text-sm"
                    onClick={() => changeFontSize(2)}
                    title="Larger font"
                  >A+</button>
                </div>
              </>
            )}

            {/* Delete */}
            <button
              className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-500 transition-colors"
              onClick={removeSelected}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Text color picker — always includes white + black */}
          {selectedEl.kind === 'text' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 shrink-0">Color</span>
              <div className="flex flex-wrap gap-1">
                {/* White + Black first, then pop colors */}
                {['#FFFFFF', '#000000', ...POP_COLORS.filter(c => c !== '#FFFFFF' && c !== '#000000').slice(0, 14)].map(c => (
                  <button
                    key={c}
                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selectedEl.color === c ? 'border-orange-500 scale-110' : 'border-transparent'}`}
                    style={{ background: c, boxShadow: (c === '#FFFFFF' || c === '#000000') ? 'inset 0 0 0 1px #aaa' : undefined }}
                    onClick={() => changeTextColor(c)}
                    title={c === '#FFFFFF' ? 'White' : c === '#000000' ? 'Black' : c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── General tools ── */}
      <div className="flex gap-2 flex-wrap">
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-400 transition-colors text-sm font-semibold"
          onClick={addText}
        >
          <Type className="h-4 w-4 stroke-[1.5]" /> Add Text
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-red-400 hover:text-red-500 transition-colors text-sm font-semibold ml-auto"
          onClick={clear}
        >
          <RotateCcw className="h-4 w-4 stroke-[1.5]" /> Clear
        </button>
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
      {allLibImages.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">
            Add from Library
            <span className="ml-1 text-orange-500 font-bold">({allLibImages.length})</span>
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allLibImages.map(asset => (
              <button
                key={asset.id}
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-colors bg-gray-100"
                onClick={() => addImage(asset.url)}
                title={asset.name}
              >
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {libraries.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-1">
          No library images yet — add images in Admin → Studio Libraries
        </p>
      )}

      {/* Save button */}
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 hover:shadow-sm transition-all font-semibold"
        onClick={exportCanvas}
      >
        <Printer className="h-4 w-4 stroke-[1.5]" />
        {saved ? 'Saved — Get This' : 'Save & Get This'}
      </button>
    </div>
  );
}

// ── Avatar Generator mini wrapper ─────────────────────────

function AvatarGenMini({ onGetThis }: { onGetThis: (dataUrl: string, title: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">Mix & match layers to create your unique avatar, then tap "Get This"!</p>
      <AvatarGeneratorCanvas />
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 hover:shadow-sm transition-all font-semibold"
        onClick={() => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
          if (canvas) {
            try {
              const dataUrl = canvas.toDataURL('image/png');
              onGetThis(dataUrl, 'My Avatar');
            } catch {
              const img = document.querySelector('.avatar-preview-img') as HTMLImageElement | null;
              if (img?.src) onGetThis(img.src, 'My Avatar');
            }
          }
        }}
      >
        <Printer className="h-4 w-4 stroke-[1.5]" />
        Get This Avatar
      </button>
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
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const isDataUrl = imageDataUrl.startsWith('data:');

  // Resolve a Blob URL from either a data: URL or an external URL
  const getBlob = async (): Promise<{ blob: Blob; ext: string }> => {
    if (isDataUrl) {
      // data:[mime];base64,...
      const mime = imageDataUrl.split(';')[0].split(':')[1] || 'image/png';
      const ext = mime === 'image/jpeg' ? 'jpg' : 'png';
      const byteString = atob(imageDataUrl.split(',')[1]);
      const arr = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
      return { blob: new Blob([arr], { type: mime }), ext };
    }
    // External URL — fetch via CORS proxy if needed
    const tryFetch = async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    };
    let res: Response;
    try {
      res = await tryFetch(imageDataUrl);
    } catch {
      res = await tryFetch(`https://proxy.shakespeare.diy/?url=${encodeURIComponent(imageDataUrl)}`);
    }
    const blob = await res.blob();
    const ext = blob.type === 'image/jpeg' ? 'jpg' : 'png';
    return { blob, ext };
  };

  const handleDownloadItem = async () => {
    setDownloading(true);
    try {
      const { blob, ext } = await getBlob();
      const safeName = (title || 'bitpopart').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // Last resort: open in new tab
      window.open(imageDataUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      // Try Web Share API first (works on mobile — shares the image)
      if (navigator.share && navigator.canShare) {
        try {
          const { blob, ext } = await getBlob();
          const safeName = (title || 'bitpopart').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
          const file = new File([blob], `${safeName}.${ext}`, { type: blob.type });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: title || 'BitPopArt',
              files: [file],
            });
            setPrinting(false);
            return;
          }
        } catch (shareErr) {
          // User cancelled or share failed — fall through to print
          if ((shareErr as Error)?.name === 'AbortError') { setPrinting(false); return; }
        }
      }

      // Desktop: inject a hidden iframe and call print() on it
      // This avoids popup blockers entirely
      const src = isDataUrl
        ? imageDataUrl
        : imageDataUrl; // external URLs also work in iframe src

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
      iframe.srcdoc = `<!DOCTYPE html><html><head><style>
        @page{margin:0}
        *{margin:0;padding:0;box-sizing:border-box}
        html,body{width:100%;height:100%;background:#fff;display:flex;align-items:center;justify-content:center}
        img{max-width:100%;max-height:100%;object-fit:contain}
      </style></head><body><img src="${src}" /></body></html>`;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Fallback for external images blocked in iframe
          window.print();
        }
        setTimeout(() => document.body.removeChild(iframe), 3000);
      };
    } finally {
      setPrinting(false);
    }
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
        <button
          disabled={downloading}
          onClick={handleDownloadItem}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-teal-600 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 hover:shadow-sm transition-all font-semibold disabled:opacity-60"
        >
          <Download className="h-4 w-4 stroke-[1.5]" />
          {downloading ? 'Saving…' : 'Download PNG'}
        </button>
        <button
          disabled={printing}
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 hover:shadow-sm transition-all font-semibold disabled:opacity-60"
        >
          <Printer className="h-4 w-4 stroke-[1.5]" />
          {printing ? 'Opening…' : 'Print / Share'}
        </button>
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

        {/* ── Admin shortcut — only visible to admin ── */}
        {isAdmin && (
          <div className="flex justify-end mb-3">
            <Link to="/admin?tab=app">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" /> Manage App Content
              </Button>
            </Link>
          </div>
        )}

        {/* ══ HOME TAB ══════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="space-y-6">

            {/* ── Store download buttons ── */}
            <div className="flex gap-2 justify-center">
              {/* Zapstore */}
              <a
                href="#"
                aria-disabled="true"
                onClick={e => e.preventDefault()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-orange-200 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-900/10 opacity-50 cursor-not-allowed select-none"
                title="Coming soon on Zapstore"
              >
                <Zap className="h-4 w-4 text-orange-500 stroke-[1.5]" />
                <div className="text-left">
                  <p className="text-[9px] text-muted-foreground leading-none">Coming soon</p>
                  <p className="text-xs font-bold leading-tight text-orange-700 dark:text-orange-300">Zapstore</p>
                </div>
              </a>

              {/* Google Play */}
              <a
                href="#"
                aria-disabled="true"
                onClick={e => e.preventDefault()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 opacity-50 cursor-not-allowed select-none"
                title="Coming soon on Google Play"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3.18 23.76c.37.21.8.22 1.2.03l12.1-6.93-2.59-2.6-10.71 9.5zm-1.43-19.9c-.11.27-.17.57-.17.9v18.48c0 .33.06.63.17.9l.08.08 10.35-10.35v-.24L1.83 3.78l-.08.08zM20.48 10.6l-2.84-1.63-2.9 2.9 2.9 2.9 2.85-1.63c.81-.47.81-1.57-.01-2.04zM4.38.21c-.4-.2-.83-.19-1.2.03l10.73 9.51 2.59-2.6L4.38.21z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[9px] text-muted-foreground leading-none">Coming soon</p>
                  <p className="text-xs font-bold leading-tight">Google Play</p>
                </div>
              </a>

              {/* App Store */}
              <a
                href="#"
                aria-disabled="true"
                onClick={e => e.preventDefault()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 opacity-50 cursor-not-allowed select-none"
                title="Coming soon on App Store"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[9px] text-muted-foreground leading-none">Coming soon</p>
                  <p className="text-xs font-bold leading-tight">App Store</p>
                </div>
              </a>
            </div>

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

            {/* Tab heading — icon-pill style */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-orange-600 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800">
                <PenLine className="h-5 w-5 stroke-[1.5]" />
                <span className="text-sm font-bold">Create</span>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${createSubTab === 'canvas' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-muted-foreground'}`}
                onClick={() => setCreateSubTab('canvas')}
              >
                <PenLine className="h-4 w-4 stroke-[1.5]" />
                Meme Creator
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${createSubTab === 'avatar' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-muted-foreground'}`}
                onClick={() => setCreateSubTab('avatar')}
              >
                <UserCircle2 className="h-4 w-4 stroke-[1.5]" />
                Avatar Generator
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

            {/* Tab heading — icon-pill style */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-teal-600 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800">
                <Download className="h-5 w-5 stroke-[1.5]" />
                <span className="text-sm font-bold">Download</span>
              </div>
            </div>

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

            {/* Tab heading — icon-pill style */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800">
                <Printer className="h-5 w-5 stroke-[1.5]" />
                <span className="text-sm font-bold">Get This</span>
              </div>
            </div>

            {printItem ? (
              <PrintItemCard
                imageDataUrl={printItem.dataUrl}
                title={printItem.title}
                onClose={() => { setPrintItem(null); setActiveTab('home'); }}
              />
            ) : (
              <div className="text-center py-16 space-y-5">
                <Printer className="h-14 w-14 mx-auto text-gray-300" />
                <p className="text-muted-foreground text-sm">
                  No item selected yet.
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Create something on the canvas, generate an avatar, or tap <strong>"Get This"</strong> on any download item — it'll appear here ready to print or download!
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-orange-600 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 hover:shadow-sm transition-all"
                  >
                    <PenLine className="h-4 w-4 stroke-[1.5]" />
                    <span className="text-sm font-semibold">Go Create</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('download')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-teal-600 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 hover:shadow-sm transition-all"
                  >
                    <Download className="h-4 w-4 stroke-[1.5]" />
                    <span className="text-sm font-semibold">Browse Downloads</span>
                  </button>
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
