import { useState, useRef, useEffect, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAppMedia } from '@/hooks/useAppContent';
import { useCardTemplates } from '@/hooks/useCardTemplates';
import { useLatestCards } from '@/hooks/useLatestCards';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import { useAnimations } from '@/hooks/useAnimations';

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
  Library,
  LayoutTemplate,
  Sticker,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  ArrowDown,
  ArrowUp,
  Move,
  Share2,
  Laugh,
  CreditCard,
  Play,
} from 'lucide-react';
import { ShareToNostrMediaDialog } from '@/components/ShareToNostrMediaDialog';
import { AnimatedChatSplash } from '@/components/app/AnimatedChatSplash';

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

  const currentItem = items[index];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden group">
      {/* Invisible spacer image keeps the container sized to the active image's natural dimensions */}
      <img
        key={currentItem.id + '-spacer'}
        src={currentItem.image_url}
        alt=""
        aria-hidden="true"
        className="w-full h-auto block opacity-0 pointer-events-none"
      />
      {items.map((it, i) => (
        <img
          key={it.id}
          src={it.image_url}
          alt={it.title}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
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

// Same font library as the desktop Studio
const MEME_FONTS = [
  { label: 'Impact', value: 'Impact' },
  { label: 'Arial Black', value: 'Arial Black' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Oswald', value: 'Oswald Variable' },
  { label: 'Montserrat', value: 'Montserrat Variable' },
  { label: 'Raleway', value: 'Raleway Variable' },
  { label: 'Black Ops One', value: 'Black Ops One' },
  { label: 'Righteous', value: 'Righteous' },
  { label: 'Marker', value: 'Permanent Marker' },
  { label: 'Verdana', value: 'Verdana' },
];

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
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
};

// Interaction state: what the pointer is doing
type PointerMode =
  | { kind: 'idle' }
  | { kind: 'drag';   id: string; startX: number; startY: number; origX: number; origY: number }
  | { kind: 'resize'; id: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number };

const CANVAS_SIZE = 320;           // meme: square
const CARD_CANVAS_W = 320;          // card: 4:3 landscape
const CARD_CANVAS_H = 240;
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
  canvasW = CANVAS_SIZE,
  canvasH = CANVAS_SIZE,
) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

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
      const weight = el.bold !== false ? 'bold' : 'normal';
      ctx.font = `${weight} ${fs}px "${el.fontFamily || 'Impact'}"`;
      ctx.fillStyle = el.color || '#FF0080';
      const align = el.align || 'left';
      ctx.textAlign = align as CanvasTextAlign;
      ctx.textBaseline = 'top';
      const x = align === 'center' ? el.x + el.width / 2
               : align === 'right'  ? el.x + el.width
               : el.x;
      ctx.fillText(el.text, x, el.y, el.width);
    }

    // Selection frame + handles
    if (selected === el.id) {
      ctx.save();
      ctx.strokeStyle = '#FF0080';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(el.x - 1, el.y - 1, el.width + 2, el.height + 2);
      ctx.setLineDash([]);

      // Regular corner dots (all except bottom-right)
      const dotCorners = [
        { cx: el.x,            cy: el.y             }, // top-left
        { cx: el.x + el.width, cy: el.y             }, // top-right
        { cx: el.x,            cy: el.y + el.height }, // bottom-left
      ];
      dotCorners.forEach(({ cx, cy }) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF0080';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Bottom-right: resize grip icon — diagonal lines hint
      const gx = el.x + el.width;
      const gy = el.y + el.height;
      const gr = 9; // grip radius
      ctx.fillStyle = '#FF0080';
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      // Three diagonal tick marks inside the circle
      for (let i = 1; i <= 3; i++) {
        const off = i * 3 - 5;
        ctx.beginPath();
        ctx.moveTo(gx - gr + 3 + off, gy + gr - 3);
        ctx.lineTo(gx + gr - 3,       gy - gr + 3 + off);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

type MemePickerTab = 'templates' | 'pops' | 'icons';

function MiniCanvas({ onSave, onViewLibraryItem, mode = 'meme' }: {
  onSave: (dataUrl: string, title: string) => void;
  onViewLibraryItem?: (item: { id: string; image_url: string; title: string }) => void;
  mode?: 'meme' | 'card';
}) {
  const isCard = mode === 'card';
  const CW = isCard ? CARD_CANVAS_W : CANVAS_SIZE;
  const CH = isCard ? CARD_CANVAS_H : CANVAS_SIZE;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const [elements, setElements] = useState<CanvasEl[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [saved, setSaved] = useState(false);
  const [pickerTab, setPickerTab] = useState<MemePickerTab>('templates');

  // Text input state — replaces prompt()
  const [textInput, setTextInput] = useState('');
  const [fontFamily, setFontFamily] = useState('Impact');
  const [showTextInput, setShowTextInput] = useState(false);

  // Track canvas display width so overlay buttons can be positioned accurately
  const [canvasDisplayW, setCanvasDisplayW] = useState(CW);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w) setCanvasDisplayW(w);
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

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

  // Meme library data
  const { data: memes = [], isLoading: memesLoading } = useAppMedia('app-meme');
  const { data: memeTemplates = [], isLoading: memeTemplatesLoading } = useAppMedia('app-meme-template');
  const { data: memeIcons = [], isLoading: iconsLoading } = useAppMedia('app-meme-icon');
  const { data: memePops = [], isLoading: popsLoading } = useAppMedia('app-pop');

  // Card library data
  const { data: cardTemplatesRaw = [], isLoading: cardTemplatesLoading } = useCardTemplates();
  const { data: cardLibraryRaw = [], isLoading: cardLibraryLoading } = useLatestCards(100);

  // Normalise card library to the same shape used by the picker thumbnails
  interface PickerItem { id: string; image_url: string; title: string; }
  const cardLibrary: PickerItem[] = cardLibraryRaw
    .map(c => ({ id: c.id, image_url: (c as unknown as { images?: string[] }).images?.[0] ?? '', title: c.title }))
    .filter(c => !!c.image_url);
  const cardTemplates: PickerItem[] = cardTemplatesRaw
    .map(t => ({ id: t.id, image_url: t.coverImage, title: t.name }));

  // Pick library/template sources based on mode
  const libraryItems   = isCard ? cardLibrary        : memes;
  const templateItems  = isCard ? cardTemplates      : memeTemplates.map(m => ({ id: m.id, image_url: m.image_url, title: m.title }));
  const iconItems      = memeIcons.map(m => ({ id: m.id, image_url: m.image_url, title: m.title }));
  const popItems       = memePops.map(m => ({ id: m.id, image_url: m.image_url, title: m.title }));
  const libraryLoading = isCard ? cardLibraryLoading  : memesLoading;
  const templateLoading= isCard ? cardTemplatesLoading: memeTemplatesLoading;

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
        CW, CH,
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
      x: (e.clientX - rect.left) * (CW / rect.width),
      y: (e.clientY - rect.top)  * (CH / rect.height),
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
    const text = textInput.trim();
    if (!text) return;
    const id = `txt-${Date.now()}`;
    const el: CanvasEl = {
      id, kind: 'text',
      x: 20, y: Math.round(CH * 0.35),
      width: CW - 40, height: 50,
      text, fontSize: isCard ? 24 : 32, color: '#FF0080', fontFamily,
      bold: true, align: 'left',
    };
    setElements(prev => [...prev, el]);
    setSelected(id);
    selRef.current = id;
    setTextInput('');
    setShowTextInput(false);
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
        const w = Math.min(160, CW * 0.5);
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

  const removeById = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selRef.current === id) {
      setSelected(null);
      selRef.current = null;
    }
    setSaved(false);
  };

  const removeSelected = () => {
    if (!selRef.current) return;
    removeById(selRef.current);
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

  // Change font family for selected text
  const changeTextFont = (font: string) => {
    if (!selRef.current) return;
    setElements(prev => prev.map(el =>
      el.id === selRef.current && el.kind === 'text' ? { ...el, fontFamily: font } : el
    ));
    setSaved(false);
  };

  // Toggle bold for selected text
  const toggleBold = () => {
    if (!selRef.current) return;
    setElements(prev => prev.map(el =>
      el.id === selRef.current && el.kind === 'text' ? { ...el, bold: !(el.bold !== false) } : el
    ));
    setSaved(false);
  };

  // Change text alignment for selected text
  const changeAlign = (align: 'left' | 'center' | 'right') => {
    if (!selRef.current) return;
    setElements(prev => prev.map(el =>
      el.id === selRef.current && el.kind === 'text' ? { ...el, align } : el
    ));
    setSaved(false);
  };

  // Duplicate selected element
  const duplicateSelected = () => {
    if (!selRef.current) return;
    const el = elRef.current.find(e => e.id === selRef.current);
    if (!el) return;
    const newId = `dup-${Date.now()}`;
    const clone: CanvasEl = { ...el, id: newId, x: Math.min(el.x + 20, CANVAS_SIZE - el.width), y: Math.min(el.y + 20, CANVAS_SIZE - el.height) };
    setElements(prev => [...prev, clone]);
    setSelected(newId);
    selRef.current = newId;
    setSaved(false);
  };

  // Send selected element one step backward (lower in the draw order = behind others)
  const sendBackward = () => {
    if (!selRef.current) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selRef.current);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    setSaved(false);
  };

  // Bring selected element one step forward (higher in the draw order = in front)
  const bringForward = () => {
    if (!selRef.current) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selRef.current);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    setSaved(false);
  };

  const exportCanvas = useCallback(() => {
    // Render a clean frame (no selection handles) for export
    const offscreen = document.createElement('canvas');
    offscreen.width = CW;
    offscreen.height = CH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    drawFrame(ctx, elRef.current, null, bgRef.current, imgCache.current, CW, CH);
    const dataUrl = offscreen.toDataURL('image/png');
    onSave(dataUrl, isCard ? 'My BitPop Card' : 'My BitPopArt Meme');
    setSaved(true);
  }, [onSave, CW, CH, isCard]);

  const selectedEl = elements.find(e => e.id === selected) ?? null;
  const selectedIdx = selected ? elements.findIndex(e => e.id === selected) : -1;

  return (
    <div className="space-y-3">
      {/* Canvas */}
      <div className="flex justify-center touch-none">
        <div className="relative w-full" style={{ maxWidth: CANVAS_SIZE }}>
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            className="rounded-xl border-2 border-orange-200 dark:border-orange-700 shadow-md w-full block"
            style={{ touchAction: 'none', cursor: 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          {/* Overlay X button on the selected element — visible shortcut to delete */}
          {selectedEl && (() => {
            const scale = canvasDisplayW / CW;
            const left = selectedEl.x * scale;
            const top  = selectedEl.y * scale;
            return (
              <button
                className="absolute flex items-center justify-center w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white transition-colors z-10"
                style={{ left: left - 10, top: top - 10, touchAction: 'none' }}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); removeById(selectedEl.id); }}
                title="Delete"
              >
                <X className="h-3 w-3 stroke-[2.5]" />
              </button>
            );
          })()}

          {/* Text toolbar — sits just below the dashed selection box, solid white, compact */}
          {selectedEl?.kind === 'text' && (() => {
            const scale  = canvasDisplayW / CW;
            const left   = selectedEl.x * scale;
            // Position below the element's bottom edge, +4px gap
            const top    = (selectedEl.y + selectedEl.height) * scale + 4;
            const width  = selectedEl.width * scale;
            return (
              <div
                className="absolute z-20 flex items-center gap-0 rounded-xl border-2 border-orange-400 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
                style={{ left, top, width: Math.max(width, 120), touchAction: 'none' }}
                onPointerDown={e => e.stopPropagation()}
              >
                {/* Move hint — non-interactive, leftmost */}
                <div className="flex items-center justify-center w-7 h-8 shrink-0 text-orange-400 pointer-events-none select-none border-r border-orange-200 dark:border-orange-700">
                  <Move className="h-3.5 w-3.5" />
                </div>

                {/* Text input — font-size 16px prevents iOS auto-zoom on focus */}
                <input
                  key={selectedEl.id}
                  defaultValue={selectedEl.text ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setElements(prev => prev.map(el =>
                      el.id === selectedEl.id ? { ...el, text: val } : el
                    ));
                    setSaved(false);
                  }}
                  placeholder="Type…"
                  className="flex-1 min-w-0 h-8 px-1.5 font-semibold outline-none bg-transparent"
                  style={{
                    fontSize: 16,
                    fontFamily: selectedEl.fontFamily ?? 'Impact',
                    color: selectedEl.color ?? '#FF0080',
                  }}
                />

                {/* Font size − */}
                <button
                  className="flex items-center justify-center w-7 h-8 shrink-0 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 border-l border-orange-200 dark:border-orange-700 transition-colors"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); changeFontSize(-2); }}
                  title="Smaller"
                >−</button>

                {/* Font size + */}
                <button
                  className="flex items-center justify-center w-7 h-8 shrink-0 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 border-l border-orange-200 dark:border-orange-700 transition-colors"
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); changeFontSize(2); }}
                  title="Bigger"
                >+</button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Selection controls (shown only when something is selected) ── */}
      {selectedEl && (
        <div className="rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wider truncate">
              {selectedEl.kind === 'text' ? '✏️ Edit Text' : '🖼 Image'}
              <span className="ml-1.5 text-pink-400 dark:text-pink-500 font-normal normal-case tracking-normal">
                layer {selectedIdx + 1}/{elements.length}
              </span>
            </p>
            <div className="flex gap-1 shrink-0">
              {/* Layer down — move behind other elements */}
              <button
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 text-gray-500 transition-colors"
                onClick={sendBackward}
                title="Send backward (layer down)"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              {/* Layer up — move in front of other elements */}
              <button
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 text-gray-500 transition-colors"
                onClick={bringForward}
                title="Bring forward (layer up)"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              {/* Duplicate */}
              <button
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-blue-200 bg-white dark:bg-gray-800 hover:bg-blue-50 text-blue-500 transition-colors"
                onClick={duplicateSelected}
                title="Duplicate"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              {/* Delete / X — uses explicit id to avoid stale selRef */}
              <button
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-500 transition-colors"
                onClick={() => removeById(selectedEl.id)}
                title="Delete"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Scale controls */}
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
                <span className="text-xs text-muted-foreground ml-1 shrink-0">Sz</span>
                <div className="flex items-center gap-1">
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 transition-colors font-bold text-sm"
                    onClick={() => changeFontSize(-2)}
                    title="Smaller font"
                  >−</button>
                  <span className="text-xs w-7 text-center font-mono text-muted-foreground">{selectedEl.fontSize}</span>
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50 transition-colors font-bold text-sm"
                    onClick={() => changeFontSize(2)}
                    title="Larger font"
                  >+</button>
                </div>
              </>
            )}
          </div>

          {/* Text-specific controls */}
          {selectedEl.kind === 'text' && (
            <>
              {/* Font picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">Font</span>
                <Select
                  value={selectedEl.fontFamily ?? 'Impact'}
                  onValueChange={changeTextFont}
                >
                  <SelectTrigger className="h-8 text-xs flex-1 min-w-0 bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEME_FONTS.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Bold toggle */}
                <button
                  className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors font-bold text-sm shrink-0 ${
                    selectedEl.bold !== false
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50'
                  }`}
                  onClick={toggleBold}
                  title="Toggle bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">Align</span>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button
                      key={a}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                        (selectedEl.align ?? 'left') === a
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-pink-300 bg-white dark:bg-gray-800 hover:bg-pink-50'
                      }`}
                      onClick={() => changeAlign(a)}
                      title={a}
                    >
                      {a === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
                      {a === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
                      {a === 'right' && <AlignRight className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text color picker */}
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0 mt-1">Color</span>
                <div className="flex flex-wrap gap-1">
                  {['#FFFFFF', '#000000', ...POP_COLORS.filter(c => c !== '#FFFFFF' && c !== '#000000').slice(0, 14)].map(c => (
                    <button
                      key={c}
                      className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selectedEl.color === c ? 'border-orange-500 scale-110' : 'border-transparent'}`}
                      style={{ background: c, boxShadow: (c === '#FFFFFF' || c === '#000000') ? 'inset 0 0 0 1px #aaa' : undefined }}
                      onClick={() => changeTextColor(c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Save & Get This — always visible directly below canvas ── */}
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white shadow-lg active:scale-[0.98] transition-transform"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #a855f7 100%)' }}
        onClick={exportCanvas}
      >
        <Printer className="h-4 w-4 stroke-[2]" />
        {saved ? '✓ Saved — tap to get it again' : 'Save & Get This'}
      </button>

      {/* ── Add Text panel ── */}
      {showTextInput ? (
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 p-3 space-y-2">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <Type className="h-3.5 w-3.5" /> Add Text
          </p>
          <Input
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Type your text..."
            className="h-9"
            style={{ fontSize: 16 }}
            onKeyDown={e => { if (e.key === 'Enter') addText(); if (e.key === 'Escape') setShowTextInput(false); }}
          />
          <div className="flex items-center gap-2">
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEME_FONTS.map(f => (
                  <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
              onClick={addText}
            >
              <Type className="h-4 w-4" /> Add to Meme
            </button>
            <button
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 text-sm transition-colors"
              onClick={() => { setShowTextInput(false); setTextInput(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-400 hover:bg-orange-100 transition-colors text-sm font-semibold text-orange-700 dark:text-orange-300"
            onClick={() => setShowTextInput(true)}
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
      )}

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

      {/* ── BOX 1: Creator tools — Templates / Pops / Icons ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Add to canvas</p>
        </div>
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${pickerTab === 'templates' ? 'bg-white dark:bg-gray-800 text-purple-600 border-b-2 border-purple-500' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setPickerTab('templates')}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
            {templateItems.length > 0 && <span className="ml-0.5 text-purple-500 font-bold">({templateItems.length})</span>}
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${pickerTab === 'pops' ? 'bg-white dark:bg-gray-800 text-violet-600 border-b-2 border-violet-500' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setPickerTab('pops')}
          >
            <UserCircle2 className="h-3.5 w-3.5" />
            Pops
            {popItems.length > 0 && <span className="ml-0.5 text-violet-500 font-bold">({popItems.length})</span>}
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-colors ${pickerTab === 'icons' ? 'bg-white dark:bg-gray-800 text-pink-600 border-b-2 border-pink-500' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setPickerTab('icons')}
          >
            <Sticker className="h-3.5 w-3.5" />
            Icons
            {iconItems.length > 0 && <span className="ml-0.5 text-pink-500 font-bold">({iconItems.length})</span>}
          </button>
        </div>

        {/* Tab content */}
        <div className="p-3 bg-white dark:bg-gray-800">
          {/* Templates */}
          {pickerTab === 'templates' && (
            <>
              {templateLoading ? (
                <div className="flex gap-2 pb-1">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="shrink-0 w-16 h-16 rounded-lg" />)}
                </div>
              ) : templateItems.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {templateItems.map(tpl => (
                    <button
                      key={tpl.id}
                      className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors bg-gray-100"
                      onClick={() => addImage(tpl.image_url)}
                      title={tpl.title}
                    >
                      <img src={tpl.image_url} alt={tpl.title} className="w-full h-full object-cover" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">
                  {isCard ? 'No card templates yet' : 'No templates yet'}
                </p>
              )}
            </>
          )}

          {/* Pops — cartoon/pop characters */}
          {pickerTab === 'pops' && (
            <>
              {popsLoading ? (
                <div className="flex gap-2 pb-1">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="shrink-0 w-16 h-16 rounded-lg" />)}
                </div>
              ) : popItems.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {popItems.map(pop => (
                    <button
                      key={pop.id}
                      className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-violet-400 transition-colors bg-gray-50"
                      onClick={() => addImage(pop.image_url)}
                      title={pop.title}
                    >
                      <img src={pop.image_url} alt={pop.title} className="w-full h-full object-contain p-1" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">No pops yet — cartoon characters coming soon</p>
              )}
            </>
          )}

          {/* Icons */}
          {pickerTab === 'icons' && (
            <>
              {iconsLoading ? (
                <div className="flex gap-2 pb-1">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="shrink-0 w-16 h-16 rounded-lg" />)}
                </div>
              ) : iconItems.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {iconItems.map(icon => (
                    <button
                      key={icon.id}
                      className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-pink-400 transition-colors bg-gray-100"
                      onClick={() => addImage(icon.image_url)}
                      title={icon.title}
                    >
                      <img src={icon.image_url} alt={icon.title} className="w-full h-full object-cover" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">No icons yet</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── BOX 2: Library — ready-made designs (view-only) ── */}
      <div className="rounded-xl border-2 border-orange-200 dark:border-orange-800 overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 flex items-center gap-2">
          <Library className="h-4 w-4 text-white shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">
              {isCard ? 'Library Cards' : 'Library Memes'}
            </p>
            <p className="text-[10px] text-white/80 leading-tight">Ready-made · tap to print or download · cannot be edited</p>
          </div>
          {libraryItems.length > 0 && (
            <span className="text-xs font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full shrink-0">
              {libraryItems.length}
            </span>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-gray-800">
          {libraryLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : libraryItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {libraryItems.map(item => (
                <button
                  key={item.id}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-orange-400 active:scale-95 transition-all bg-gray-100 group"
                  onClick={() => onViewLibraryItem?.(item)}
                  title={item.title}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  {/* Download hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5">
                      <Download className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Library className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">{isCard ? 'No library cards yet' : 'No library memes yet'}</p>
            </div>
          )}
        </div>
      </div>

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
  const [sharing, setSharing] = useState(false);

  // Is this a real URL (not a canvas data: URL)?
  const isExternalUrl = !imageDataUrl.startsWith('data:');

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

  // Native social share (Web Share API — works great on mobile)
  const handleNativeShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        const shareData: ShareData = {
          title: title || 'BitPopArt',
          text: `${title || 'Check out this BitPopArt!'} 🎨 #bitpopart #bitcoin`,
        };
        // For external URLs, add the URL so apps can show a preview
        if (isExternalUrl) {
          shareData.url = imageDataUrl;
        } else {
          // data: URL — share as a file
          try {
            const { blob, ext } = await getBlob();
            const safeName = (title || 'bitpopart').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
            const file = new File([blob], `${safeName}.${ext}`, { type: blob.type });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ title: title || 'BitPopArt', files: [file] });
              setSharing(false);
              return;
            }
          } catch {
            // fall through to text share
          }
        }
        await navigator.share(shareData);
      } else {
        // Fallback: open Twitter/X share
        const text = encodeURIComponent(`${title || 'BitPopArt'} 🎨 #bitpopart #bitcoin`);
        const url = isExternalUrl ? encodeURIComponent(imageDataUrl) : '';
        window.open(`https://twitter.com/intent/tweet?text=${text}${url ? `&url=${url}` : ''}`, '_blank', 'width=600,height=400');
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        // User didn't cancel — try Twitter fallback
        const text = encodeURIComponent(`${title || 'BitPopArt'} 🎨 #bitpopart #bitcoin`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
      }
    } finally {
      setSharing(false);
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

      {/* ── Primary actions: Download + Print ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={downloading}
          onClick={handleDownloadItem}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-teal-600 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 hover:shadow-sm transition-all font-semibold disabled:opacity-60"
        >
          <Download className="h-4 w-4 stroke-[1.5]" />
          {downloading ? 'Saving…' : 'Download'}
        </button>
        <button
          disabled={printing}
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-rose-600 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 hover:shadow-sm transition-all font-semibold disabled:opacity-60"
        >
          <Printer className="h-4 w-4 stroke-[1.5]" />
          {printing ? 'Opening…' : 'Print'}
        </button>
      </div>

      {/* ── Share row ── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share this
        </p>
        <div className="grid grid-cols-2 gap-3">

          {/* Share to Nostr — only for external URLs (canvas data: URLs aren't shareable as Nostr images) */}
          {isExternalUrl ? (
            <ShareToNostrMediaDialog
              title={title}
              imageUrl={imageDataUrl}
              hashtags={['bitpopart', 'bitcoin', 'art', 'popart']}
              pageUrl="https://www.bitpopart.com/app"
            >
              <button className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:shadow-sm transition-all font-semibold text-sm w-full">
                {/* Nostr "N" logo */}
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" />
                </svg>
                Nostr
              </button>
            </ShareToNostrMediaDialog>
          ) : (
            /* Canvas creation — upload hint instead */
            <button
              disabled
              title="Download first, then share from your gallery"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-400 dark:text-purple-600 bg-purple-50/50 dark:bg-purple-900/10 font-semibold text-sm w-full opacity-50 cursor-not-allowed"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" />
              </svg>
              Nostr
            </button>
          )}

          {/* Share to social / native share sheet */}
          <button
            disabled={sharing}
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:shadow-sm transition-all font-semibold text-sm disabled:opacity-60"
          >
            <Share2 className="h-4 w-4 stroke-[1.5]" />
            {sharing ? 'Sharing…' : 'Share'}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          {isExternalUrl
            ? 'Nostr posts with image · Share opens your apps'
            : 'Download first to share on Nostr · Share sends to your apps'}
        </p>
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
type CreateSubTab = 'meme' | 'card' | 'avatar';

// ── Main App page ─────────────────────────────────────────

export default function AppPage() {
  const navigate = useNavigate();
  const { user, metadata } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();

  // Active tab
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [createSubTab, setCreateSubTab] = useState<CreateSubTab>('meme');
  const [activeMediaTab, setActiveMediaTab] = useState<MediaTab>('wallpaper');

  // Print item
  const [printItem, setPrintItem] = useState<{ dataUrl: string; title: string } | null>(null);

  // Library item view (ready-made meme or card — view only, no edit)
  const [libraryItem, setLibraryItem] = useState<{ id: string; image_url: string; title: string } | null>(null);

  // Data
  const { data: wallpapers = [], isLoading: wpLoading } = useAppMedia('app-wallpaper');
  const { data: gifs = [], isLoading: gifLoading } = useAppMedia('app-gif');
  const { data: avatars = [], isLoading: avatarLoading } = useAppMedia('app-avatar');
  const { data: banners = [], isLoading: bannerLoading } = useAppMedia('app-banner');
  const { data: coloringPages = [], isLoading: coloringLoading } = useAppMedia('app-coloring-page');
  const { data: desktopWalls = [], isLoading: desktopLoading } = useAppMedia('app-desktop-wallpaper');
  const { data: freeDownloads = [], isLoading: freeLoading } = useFreeDownloads();
  const { data: animations = [], isLoading: animLoading } = useAnimations();
  const { data: memes = [], isLoading: memesLoading } = useAppMedia('app-meme');
  const { data: latestCards = [], isLoading: cardsLoading } = useLatestCards(5);
  // Dedicated carousel images (managed from admin → App → Carousel)
  const { data: carouselImages = [], isLoading: carouselLoading } = useAppMedia('app-carousel');

  // Use dedicated carousel images when available, otherwise fall back to a mix
  const allMediaItems: CarouselItem[] = carouselImages.length > 0
    ? carouselImages.map(m => ({ id: `carousel-${m.id}`, image_url: m.image_url, title: m.title })).slice(0, 20)
    : [
        ...wallpapers.map(m => ({ id: `wp-${m.id}`, image_url: m.image_url, title: m.title })),
        ...gifs.map(m => ({ id: `gif-${m.id}`, image_url: m.image_url, title: m.title })),
        ...avatars.map(m => ({ id: `av-${m.id}`, image_url: m.image_url, title: m.title })),
        ...freeDownloads.map(m => ({ id: `fr-${m.id}`, image_url: m.image_url, title: m.title })),
      ].slice(0, 20);

  const allMediaLoading = carouselLoading || (wpLoading && gifLoading && avatarLoading && freeLoading);

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
    <div className="pb-24">
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

            {/* Header logo + Carousel + Category bar — compact block */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <img
                  src={`${import.meta.env.BASE_URL || '/'}B-Funny_avatar_orange.svg`}
                  alt="BitPopArt"
                  className="h-8 w-8"
                />
                <div>
                  <h1 className="text-lg font-extrabold gradient-header-text leading-tight">BitPopArt App</h1>
                  <p className="text-xs text-muted-foreground">Free art for the people ⚡</p>
                </div>
              </div>

              {/* ── Image Carousel ── */}
              <ImageCarousel items={allMediaItems} isLoading={allMediaLoading} />

              {/* ── Category quick-links — 5-col grid, wraps to 2 rows ── */}
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { label: 'Images',     icon: <Gift className="h-4 w-4" />,         color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',   count: freeDownloads.length, loading: freeLoading,                          href: '/free/images' },
                  { label: 'Wallpapers', icon: <Smartphone className="h-4 w-4" />,   color: 'text-teal-700 dark:text-teal-400',    bg: 'bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 border-teal-200 dark:border-teal-800',       count: wallpapers.length + desktopWalls.length, loading: wpLoading || desktopLoading, href: '/wallpapers' },
                  { label: 'Memes',      icon: <Laugh className="h-4 w-4" />,        color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800', count: memes.length, loading: memesLoading,                            onCreate: 'meme' as const },
                  { label: 'Avatars',    icon: <UserCircle2 className="h-4 w-4" />,  color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 border-violet-200 dark:border-violet-800', count: avatars.length, loading: avatarLoading,                         onCreate: 'avatar' as const },
                  { label: 'GIFs',       icon: <Clapperboard className="h-4 w-4" />, color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',   count: gifs.length, loading: gifLoading,                                href: '/gifs' },
                  { label: 'Animations', icon: <Play className="h-4 w-4" />,         color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800', count: animations.length, loading: animLoading,                        href: '/animations' },
                  { label: 'Banners',    icon: <PanelTop className="h-4 w-4" />,     color: 'text-sky-700 dark:text-sky-400',      bg: 'bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 border-sky-200 dark:border-sky-800',             count: banners.length, loading: bannerLoading,                          href: '/banners' },
                  { label: 'Coloring',   icon: <Palette className="h-4 w-4" />,      color: 'text-rose-700 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border-rose-200 dark:border-rose-800',       count: coloringPages.length, loading: coloringLoading,                   href: '/coloring-pages' },
                  { label: 'Cards',      icon: <CreditCard className="h-4 w-4" />,   color: 'text-pink-700 dark:text-pink-400',    bg: 'bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 border-pink-200 dark:border-pink-800',       count: latestCards.length, loading: cardsLoading,                       onCreate: 'card' as const },
                ] as Array<{ label: string; icon: React.ReactNode; color: string; bg: string; count: number; loading: boolean; href?: string; onCreate?: 'meme' | 'card' | 'avatar' }>).map((cat) => {
                  const inner = (
                    <div className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border text-center transition-all duration-200 cursor-pointer w-full ${cat.bg} ${cat.color}`}>
                      {cat.icon}
                      <span className="font-semibold text-[10px] leading-tight whitespace-nowrap">{cat.label}</span>
                      <span className="text-[9px] font-bold opacity-70">
                        {cat.loading ? '…' : `(${cat.count})`}
                      </span>
                    </div>
                  );
                  return cat.onCreate ? (
                    <button
                      key={cat.label}
                      className="contents"
                      onClick={() => { setCreateSubTab(cat.onCreate!); setActiveTab('create'); }}
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link key={cat.label} to={cat.href!}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── Animated Chat Splash ── */}
            <AnimatedChatSplash />

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
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${createSubTab === 'meme' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-muted-foreground'}`}
                onClick={() => setCreateSubTab('meme')}
              >
                <PenLine className="h-3.5 w-3.5 stroke-[1.5]" />
                Meme
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${createSubTab === 'card' ? 'bg-white dark:bg-gray-700 shadow text-pink-600' : 'text-muted-foreground'}`}
                onClick={() => setCreateSubTab('card')}
              >
                <ImageIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                Card
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${createSubTab === 'avatar' ? 'bg-white dark:bg-gray-700 shadow text-violet-600' : 'text-muted-foreground'}`}
                onClick={() => setCreateSubTab('avatar')}
              >
                <UserCircle2 className="h-3.5 w-3.5 stroke-[1.5]" />
                Avatar
              </button>
            </div>

            {createSubTab === 'meme' && (
              <MiniCanvas onSave={handleCanvasSave} onViewLibraryItem={setLibraryItem} mode="meme" />
            )}

            {createSubTab === 'card' && (
              <MiniCanvas onSave={handleCanvasSave} onViewLibraryItem={setLibraryItem} mode="card" />
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

      {/* ══ LIBRARY ITEM FULL-VIEW DIALOG (view-only: print/download/share) ══ */}
      <Dialog open={!!libraryItem} onOpenChange={open => { if (!open) setLibraryItem(null); }}>
        <DialogContent className="p-0 gap-0 max-w-lg w-full overflow-hidden bg-black border-0 rounded-2xl flex flex-col max-h-[92dvh]">
          {libraryItem && (
            <>
              <DialogTitle className="sr-only">{libraryItem.title}</DialogTitle>

              {/* Title bar */}
              <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <p className="text-white/70 text-xs font-medium truncate">{libraryItem.title}</p>
              </div>

              {/* Image — tap to close */}
              <div
                className="flex-1 flex items-center justify-center overflow-hidden px-4 cursor-pointer min-h-0"
                onClick={() => setLibraryItem(null)}
              >
                <img
                  src={libraryItem.image_url}
                  alt={libraryItem.title}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
                />
              </div>

              {/* Bottom action bar */}
              <div className="bg-white dark:bg-gray-900 px-4 pt-4 pb-5 space-y-3 rounded-t-2xl mt-3 shrink-0">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Library className="h-3 w-3" /> Ready-made · cannot be edited
                </p>

                {/* Print + Download */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 active:bg-gray-200 transition-colors text-sm font-semibold"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" /> Print
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-0 text-white text-sm font-semibold shadow-md"
                    style={getGradientStyle('primary') as React.CSSProperties}
                    onClick={() => handleDownload(libraryItem.image_url, deriveFilename(libraryItem.image_url, libraryItem.title))}
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                </div>

                {/* Share row */}
                <div className="grid grid-cols-2 gap-2">
                  <ShareToNostrMediaDialog
                    title={libraryItem.title}
                    imageUrl={libraryItem.image_url}
                    hashtags={['bitpopart', 'bitcoin', 'art', 'popart']}
                    pageUrl="https://www.bitpopart.com/app"
                  >
                    <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 active:bg-purple-100 transition-colors text-sm font-semibold w-full">
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" />
                      </svg>
                      Nostr
                    </button>
                  </ShareToNostrMediaDialog>

                  <button
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 active:bg-sky-100 transition-colors text-sm font-semibold"
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: libraryItem.title || 'BitPopArt',
                            text: `${libraryItem.title || 'Check this out!'} 🎨 #bitpopart #bitcoin`,
                            url: libraryItem.image_url,
                          });
                        } catch { /* cancelled */ }
                      } else {
                        const text = encodeURIComponent(`${libraryItem.title || 'BitPopArt'} 🎨 #bitpopart #bitcoin`);
                        const url = encodeURIComponent(libraryItem.image_url);
                        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
