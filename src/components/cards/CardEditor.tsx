/**
 * CardEditor
 *
 * A canvas-based card editor with one fixed format (greeting card portrait 1050×1485).
 * Users can pick a background template, add text layers and sticker/image elements,
 * then export/save or publish the result as a BitPop Card on Nostr.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCardTemplates } from '@/hooks/useCardTemplates';
import { useAppMedia } from '@/hooks/useAppContent';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/useToast';
import { useCardCategories } from '@/hooks/useCardCategories';
import { LoginArea } from '@/components/auth/LoginArea';
import { nip19 } from 'nostr-tools';
import {
  Type, Trash2, Download, RotateCcw, Copy,
  ImageIcon, ChevronUp, ChevronDown,
  ZoomIn, ZoomOut, LayoutTemplate, Loader2, Sparkles,
  Upload, Share2, Layers, UserCircle2,
} from 'lucide-react';


// ─── Card Format (1200×900 — 4:3 landscape, matches all existing BitPop Cards) ──
const CARD_FORMAT = {
  id: 'greeting-card',
  name: 'BitPop Card',
  width: 1200,
  height: 900,
};

// ─── Pop Art colors ──────────────────────────────────────────────────────────
const POP_COLORS = [
  '#FF0080', '#FF4500', '#FFD700', '#00FF41', '#00BFFF', '#FF69B4',
  '#FF1493', '#FF6600', '#FFFF00', '#39FF14', '#00FFFF', '#BF00FF',
  '#FF0000', '#FF8C00', '#FFF01F', '#7FFF00', '#0080FF', '#FF00FF',
  '#FFFFFF', '#000000', '#C0C0C0', '#808080', '#4B0082', '#800000',
];

const FONTS = [
  'Impact',
  'Arial Black',
  'Bebas Neue',
  'Oswald Variable',
  'Montserrat Variable',
  'Raleway Variable',
  'Black Ops One',
  'Righteous',
  'Permanent Marker',
  'Verdana',
  'Georgia',
  'Courier New',
];

// ─── Element types ───────────────────────────────────────────────────────────
type ElementKind = 'image' | 'text';

interface CanvasElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

type Corner = 'nw' | 'ne' | 'sw' | 'se';

interface ResizeState {
  id: string;
  corner: Corner;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

// ─── Scale helper ────────────────────────────────────────────────────────────
function computeScale(fw: number, fh: number, maxW: number, maxH: number) {
  return Math.min(maxW / fw, maxH / fh, 1);
}

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

// ─── Main component ──────────────────────────────────────────────────────────
interface CardEditorProps {
  onPublished?: (cardUrl: string) => void;
}

export function CardEditor({ onPublished }: CardEditorProps) {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const { mutate: createEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { data: templates, isLoading: templatesLoading } = useCardTemplates();
  const { allCategories } = useCardCategories();
  const { data: cardPops = [], isLoading: popsLoading } = useAppMedia('app-pop');

  // Canvas state
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tool state
  const [textInput, setTextInput] = useState('Your Text Here');
  const [fontSize, setFontSize] = useState(80);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [activeColor, setActiveColor] = useState('#FF0080');

  // Drag/resize
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);

  // Scale
  const [baseScale, setBaseScale] = useState(0.35);
  const [zoomLevel, setZoomLevel] = useState(1);
  const scale = baseScale * zoomLevel;

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  // Publish form state
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [publishCategory, setPublishCategory] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [activePanel, setActivePanel] = useState<'templates' | 'text' | 'images' | 'publish'>('templates');

  const newId = () => `el-${++idCounter.current}`;
  const selected = elements.find(e => e.id === selectedId) ?? null;

  // ─── Auto-scale to container ─────────────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const { clientWidth } = containerRef.current;
      // Landscape card — allow more height so it fills the area nicely
      const maxH = 600;
      setBaseScale(computeScale(CARD_FORMAT.width, CARD_FORMAT.height, clientWidth - 32, maxH));
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { setZoomLevel(1); }, []);

  const handleZoomIn = () => setZoomLevel(z => { const n = ZOOM_STEPS.find(s => s > z); return n ?? z; });
  const handleZoomOut = () => setZoomLevel(z => { const p = [...ZOOM_STEPS].reverse().find(s => s < z); return p ?? z; });

  // ─── Add text ──────────────────────────────────────────────────────────────
  const handleAddText = useCallback(() => {
    const w = CARD_FORMAT.width * 0.8;
    setElements(prev => [...prev, {
      id: newId(),
      kind: 'text',
      text: textInput || 'Your Text Here',
      x: CARD_FORMAT.width / 2 - w / 2,
      y: CARD_FORMAT.height / 2 - (fontSize * 1.2) / 2,
      width: w,
      height: fontSize * 1.5,
      fontSize,
      fontFamily,
      color: activeColor,
      bold: fontFamily === 'Impact',
      italic: false,
      align: 'center',
    }]);
  }, [textInput, fontSize, fontFamily, activeColor]);

  // ─── Add image from URL ───────────────────────────────────────────────────
  const handleAddImage = useCallback((src: string) => {
    const size = Math.min(CARD_FORMAT.width, CARD_FORMAT.height) * 0.35;
    setElements(prev => [...prev, {
      id: newId(),
      kind: 'image',
      src,
      x: CARD_FORMAT.width / 2 - size / 2,
      y: CARD_FORMAT.height / 2 - size / 2,
      width: size,
      height: size,
    }]);
  }, []);

  // ─── Upload user image ─────────────────────────────────────────────────────
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const [[, url]] = await uploadFile(file);
      handleAddImage(url);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  // ─── Delete / clear ────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setElements(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const handleClear = () => { setElements([]); setSelectedId(null); };

  // ─── Duplicate ─────────────────────────────────────────────────────────────
  const handleDuplicate = useCallback(() => {
    if (!selected) return;
    const clone: CanvasElement = { ...selected, id: newId(), x: selected.x + 30, y: selected.y + 30 };
    setElements(prev => [...prev, clone]);
    setSelectedId(clone.id);
  }, [selected]);

  // ─── Layer ordering ────────────────────────────────────────────────────────
  const handleBringForward = useCallback(() => {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedId);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, [selectedId]);

  const handleSendBackward = useCallback(() => {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  }, [selectedId]);

  // ─── Update selected element ───────────────────────────────────────────────
  const updateSelected = useCallback((patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, ...patch } : e));
  }, [selectedId]);

  // ─── Pointer helpers ──────────────────────────────────────────────────────
  const getCanvasPos = (e: React.PointerEvent) => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const corner = target.getAttribute('data-corner') as Corner | null;
    if (corner && selectedId) {
      const el = elements.find(el => el.id === selectedId);
      if (!el) return;
      const { x, y } = getCanvasPos(e);
      setResizing({ id: selectedId, corner, startX: x, startY: y, origX: el.x, origY: el.y, origW: el.width, origH: el.height });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.stopPropagation();
      return;
    }
    const { x, y } = getCanvasPos(e);
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        setSelectedId(el.id);
        setDragging({ id: el.id, ox: x - el.x, oy: y - el.y });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }
    setSelectedId(null);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (resizing) {
      const { x, y } = getCanvasPos(e);
      const dx = x - resizing.startX;
      const dy = y - resizing.startY;
      const MIN_SIZE = 20;
      setElements(prev => prev.map(el => {
        if (el.id !== resizing.id) return el;
        let newX = resizing.origX, newY = resizing.origY, newW = resizing.origW, newH = resizing.origH;
        const ratio = resizing.origH / resizing.origW;
        const corner = resizing.corner;
        if (corner === 'se') {
          newW = Math.max(MIN_SIZE, resizing.origW + dx);
          newH = newW * ratio;
        } else if (corner === 'sw') {
          newW = Math.max(MIN_SIZE, resizing.origW - dx);
          newH = newW * ratio;
          newX = resizing.origX + resizing.origW - newW;
        } else if (corner === 'ne') {
          newW = Math.max(MIN_SIZE, resizing.origW + dx);
          newH = newW * ratio;
          newY = resizing.origY + resizing.origH - newH;
        } else if (corner === 'nw') {
          newW = Math.max(MIN_SIZE, resizing.origW - dx);
          newH = newW * ratio;
          newX = resizing.origX + resizing.origW - newW;
          newY = resizing.origY + resizing.origH - newH;
        }
        return { ...el, x: newX, y: newY, width: newW, height: newH };
      }));
      return;
    }
    if (dragging) {
      const { x, y } = getCanvasPos(e);
      setElements(prev => prev.map(el =>
        el.id === dragging.id
          ? { ...el, x: Math.max(0, Math.min(x - dragging.ox, CARD_FORMAT.width - el.width)), y: Math.max(0, Math.min(y - dragging.oy, CARD_FORMAT.height - el.height)) }
          : el
      ));
    }
  };

  const handleCanvasPointerUp = () => {
    setDragging(null);
    setResizing(null);
  };

  // ─── Load image safely for canvas (CORS-safe) ─────────────────────────────
  // Tries direct load first, falls back to CORS proxy, never rejects so export
  // always completes (skips the image instead of crashing).
  const loadImageSafe = (src: string): Promise<HTMLImageElement | null> => {
    const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

    const tryLoad = (url: string, useCrossOrigin: boolean): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        if (useCrossOrigin) img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });

    // 1. Try direct with crossOrigin
    return tryLoad(src, true)
      .catch(() => {
        // 2. Try via CORS proxy
        return tryLoad(`${CORS_PROXY}${encodeURIComponent(src)}`, true);
      })
      .catch(() => {
        // 3. Try direct without crossOrigin (canvas will be tainted but let's try toDataURL anyway)
        return tryLoad(src, false);
      })
      .catch(() => null); // Give up — skip this image
  };

  // ─── Export canvas to JPEG ────────────────────────────────────────────────
  const exportCanvas = async (): Promise<string> => {
    // Ensure all custom fonts are loaded before rendering
    try { await document.fonts.ready; } catch { /* ignore */ }

    const canvas = document.createElement('canvas');
    canvas.width = CARD_FORMAT.width;
    canvas.height = CARD_FORMAT.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');

    // Fill background colour
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background image
    if (bgImage) {
      const img = await loadImageSafe(bgImage);
      if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // Elements (in order)
    for (const el of elements) {
      if (el.kind === 'image' && el.src) {
        const img = await loadImageSafe(el.src);
        if (img) ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } else if (el.kind === 'text' && el.text) {
        ctx.save();
        const weight = el.bold ? 'bold' : 'normal';
        const style = el.italic ? 'italic' : 'normal';
        ctx.font = `${style} ${weight} ${el.fontSize ?? 80}px "${el.fontFamily ?? 'Impact'}"`;
        ctx.fillStyle = el.color ?? '#000000';
        ctx.textAlign = el.align ?? 'center';
        ctx.textBaseline = 'top';
        // Word wrap
        const maxWidth = el.width;
        const lineHeight = (el.fontSize ?? 80) * 1.3;
        const words = el.text.split(' ');
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        const startX = el.align === 'center' ? el.x + el.width / 2
          : el.align === 'right' ? el.x + el.width
          : el.x;
        lines.forEach((l, i) => ctx.fillText(l, startX, el.y + i * lineHeight));
        ctx.restore();
      }
    }

    // Try to export — if canvas is tainted (CORS), this throws
    try {
      return canvas.toDataURL('image/jpeg', 0.92);
    } catch {
      throw new Error('Could not export image — a template image blocked the download due to CORS restrictions. Try a different background colour instead.');
    }
  };

  // ─── Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await exportCanvas();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'bitpop-card.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: 'Downloaded! 📥', description: 'Your card image has been saved.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed. Please try again.';
      toast({ title: 'Download failed', description: msg, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Publish to Nostr ─────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!user) {
      toast({ title: 'Please log in first', variant: 'destructive' });
      return;
    }
    if (!publishTitle.trim()) {
      toast({ title: 'Please add a title', variant: 'destructive' });
      return;
    }

    setIsExporting(true);
    try {
      // Export to image
      const dataUrl = await exportCanvas();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'bitpop-card.jpg', { type: 'image/jpeg' });
      const [[, imageUrl]] = await uploadFile(file);

      // Create the card event (kind 30402)
      const cardId = `card-${Date.now()}`;
      const category = publishCategory || 'Others';
      const tags = [
        ['d', cardId],
        ['title', publishTitle.trim()],
        ['category', category],
        ['pricing', 'free'],
        ['t', 'ecard'],
        ['t', category.toLowerCase().replace(/[^a-z0-9]/g, '')],
        ['image', imageUrl],
      ];

      const cardContent = {
        title: publishTitle.trim(),
        description: publishDescription.trim() || publishTitle.trim(),
        category,
        pricing: 'free',
        images: [imageUrl],
        created_at: new Date().toISOString(),
      };

      createEvent(
        { kind: 30402, content: JSON.stringify(cardContent), tags },
        {
          onSuccess: (event) => {
            toast({ title: 'Card published! 🎉', description: 'Your card is now live on Nostr.' });

            // Also share as kind 1 note
            try {
              const naddr = nip19.naddrEncode({ identifier: cardId, pubkey: user.pubkey, kind: 30402 });
              const cardUrl = `${window.location.origin}/card/${naddr}`;
              createEvent({
                kind: 1,
                content: `Just created a beautiful ${category} card! 🎨\n\n"${publishTitle.trim()}"\n\n${cardUrl}\n\n${imageUrl}\n\n#ecard #bitpopart`,
                tags: [
                  ['t', 'ecard'],
                  ['t', 'bitpopart'],
                  ['image', imageUrl],
                  ['imeta', `url ${imageUrl}`, 'm image/jpeg', `alt ${publishTitle}`],
                ],
              });
              onPublished?.(cardUrl);
            } catch {
              // Share is best-effort
            }

            setIsExporting(false);
          },
          onError: () => {
            toast({ title: 'Publish failed', variant: 'destructive' });
            setIsExporting(false);
          },
        }
      );
    } catch {
      toast({ title: 'Failed to export card image', variant: 'destructive' });
      setIsExporting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[70vh]">
      {/* ── Left sidebar: tool panels ── */}
      <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
        {/* Panel tabs */}
        <div className="flex gap-1 flex-wrap">
          {[
            { key: 'templates', label: 'Templates', icon: LayoutTemplate },
            { key: 'text', label: 'Text', icon: Type },
            ...(isAdmin ? [{ key: 'images', label: 'Images', icon: ImageIcon }] : []),
            { key: 'publish', label: 'Publish', icon: Share2 },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              size="sm"
              variant={activePanel === key ? 'default' : 'outline'}
              className={activePanel === key ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0' : ''}
              onClick={() => setActivePanel(key as typeof activePanel)}
            >
              <Icon className="h-3.5 w-3.5 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Templates / Pops panel */}
        {activePanel === 'templates' && (
          <div className="space-y-3">
            <Tabs defaultValue="card-templates" className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-8 text-xs">
                <TabsTrigger value="card-templates" className="text-xs gap-1">
                  <LayoutTemplate className="h-3 w-3" /> Templates
                </TabsTrigger>
                <TabsTrigger value="card-pops" className="text-xs gap-1">
                  <UserCircle2 className="h-3 w-3" /> Pops
                </TabsTrigger>
              </TabsList>

              {/* Card templates */}
              <TabsContent value="card-templates" className="mt-2 space-y-3">
                {/* Solid background color option */}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => { setBgColor(e.target.value); setBgImage(null); }}
                    className="w-7 h-7 rounded cursor-pointer border"
                    title="Background colour"
                  />
                  <span className="text-xs text-muted-foreground">Solid colour background</span>
                </div>

                <Separator />

                {templatesLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded" />)}
                  </div>
                ) : !templates || templates.length === 0 ? (
                  <div className="text-center py-6">
                    <LayoutTemplate className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No templates yet.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-72">
                    <div className="grid grid-cols-2 gap-2 pr-2">
                      {templates.map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => setBgImage(tpl.coverImage)}
                          className={`rounded overflow-hidden border-2 transition-all hover:scale-105 ${
                            bgImage === tpl.coverImage ? 'border-pink-500 shadow-md' : 'border-transparent hover:border-pink-300'
                          }`}
                          title={tpl.name}
                        >
                          <div className="aspect-[4/3] relative">
                            <img src={tpl.coverImage} alt={tpl.name} className="w-full h-full object-cover" />
                            {bgImage === tpl.coverImage && (
                              <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                <Badge className="text-xs bg-pink-500">✓</Badge>
                              </div>
                            )}
                          </div>
                          <p className="text-xs p-1 truncate text-center bg-white dark:bg-gray-800">{tpl.name}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              {/* Pops — cartoon/pop characters to add as layers */}
              <TabsContent value="card-pops" className="mt-2">
                {popsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded" />)}
                  </div>
                ) : cardPops.length === 0 ? (
                  <div className="text-center py-6">
                    <UserCircle2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No pop characters yet.</p>
                    <p className="text-xs text-muted-foreground">The admin will upload cartoons &amp; pops here.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-80">
                    <div className="grid grid-cols-3 gap-2 pr-2">
                      {cardPops.map(pop => (
                        <button
                          key={pop.id}
                          title={pop.title}
                          onClick={() => handleAddImage(pop.image_url)}
                          className="group aspect-square rounded-lg border-2 border-transparent hover:border-pink-400 bg-gray-50 dark:bg-gray-800 overflow-hidden transition-all hover:shadow-md hover:scale-105 active:scale-95"
                        >
                          <img
                            src={pop.image_url}
                            alt={pop.title}
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Text panel */}
        {activePanel === 'text' && (
          <div className="space-y-3">

            {/* ── Edit selected text (shown at top when a text element is selected) ── */}
            {selected?.kind === 'text' && (
              <>
                <div className="space-y-2 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <p className="text-xs font-semibold text-pink-700 dark:text-pink-300 flex items-center gap-1">
                    <Type className="h-3 w-3" /> Edit Text
                  </p>

                  {/* Text content */}
                  <Input
                    value={selected.text ?? ''}
                    onChange={e => updateSelected({ text: e.target.value })}
                    className="h-8 text-xs"
                    placeholder="Your text…"
                  />

                  {/* Font size stepper — identical to Studio */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground shrink-0 w-7">Size</span>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 w-7 p-0 text-base font-bold shrink-0"
                      onClick={() => updateSelected({ fontSize: Math.max(8, (selected.fontSize ?? 60) - 10) })}
                    >−</Button>
                    <Input
                      type="number"
                      value={selected.fontSize ?? 60}
                      onChange={e => {
                        const v = Math.max(8, Math.min(400, Number(e.target.value)));
                        if (!isNaN(v)) updateSelected({ fontSize: v });
                      }}
                      className="h-7 text-xs text-center px-1 flex-1 min-w-0"
                      min={8} max={400}
                    />
                    <Button
                      size="sm" variant="outline"
                      className="h-7 w-7 p-0 text-base font-bold shrink-0"
                      onClick={() => updateSelected({ fontSize: Math.min(400, (selected.fontSize ?? 60) + 10) })}
                    >+</Button>
                  </div>

                  {/* Font family */}
                  <Select value={selected.fontFamily ?? fontFamily} onValueChange={v => updateSelected({ fontFamily: v })}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTS.map(f => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Bold / Italic / Align */}
                  <div className="flex gap-1">
                    <Button size="sm" variant={selected.bold ? 'default' : 'outline'} className="h-7 flex-1 text-xs font-bold" onClick={() => updateSelected({ bold: !selected.bold })}>B</Button>
                    <Button size="sm" variant={selected.italic ? 'default' : 'outline'} className="h-7 flex-1 text-xs italic" onClick={() => updateSelected({ italic: !selected.italic })}>I</Button>
                    <Button size="sm" variant={selected.align === 'left' ? 'default' : 'outline'} className="h-7 flex-1 text-xs" onClick={() => updateSelected({ align: 'left' })}>←</Button>
                    <Button size="sm" variant={selected.align === 'center' ? 'default' : 'outline'} className="h-7 flex-1 text-xs" onClick={() => updateSelected({ align: 'center' })}>↔</Button>
                    <Button size="sm" variant={selected.align === 'right' ? 'default' : 'outline'} className="h-7 flex-1 text-xs" onClick={() => updateSelected({ align: 'right' })}>→</Button>
                  </div>

                  {/* Colour swatches — colour also updates live on selected element */}
                  <div className="grid grid-cols-8 gap-1">
                    {POP_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => { setActiveColor(c); updateSelected({ color: c }); }}
                        style={{ background: c }}
                        className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${(selected.color ?? activeColor) === c ? 'border-pink-500 scale-110' : 'border-gray-200'}`}
                        title={c}
                      />
                    ))}
                    <input
                      type="color"
                      value={selected.color ?? activeColor}
                      onChange={e => { setActiveColor(e.target.value); updateSelected({ color: e.target.value }); }}
                      className="w-6 h-6 rounded border-2 border-gray-200 cursor-pointer"
                      title="Custom colour"
                    />
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* ── Add new text ── */}
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Type className="h-3.5 w-3.5" /> Add Text
            </p>

            <Input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Type something…"
              className="h-8 text-xs"
              onKeyDown={e => e.key === 'Enter' && handleAddText()}
            />

            {/* Font + size on same row */}
            <div className="flex gap-1">
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => (
                    <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={fontSize}
                onChange={e => setFontSize(Math.max(8, Math.min(400, Number(e.target.value))))}
                className="h-8 w-14 text-xs"
                min={8} max={400}
              />
            </div>

            {/* Colour swatches for new text */}
            <div className="grid grid-cols-8 gap-1">
              {POP_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveColor(c)}
                  style={{ background: c }}
                  className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${activeColor === c ? 'border-pink-500 scale-110' : 'border-gray-200'}`}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={activeColor}
                onChange={e => setActiveColor(e.target.value)}
                className="w-6 h-6 rounded border-2 border-gray-200 cursor-pointer"
                title="Custom colour"
              />
            </div>

            <Button
              onClick={handleAddText}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white"
              size="sm"
            >
              <Type className="h-3.5 w-3.5 mr-1" />
              Add Text
            </Button>
          </div>
        )}

        {/* Images panel — admin only */}
        {activePanel === 'images' && isAdmin && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Add images / stickers</p>
            <div className="space-y-2">
              <Label className="cursor-pointer">
                <div className="flex items-center gap-2 p-3 border-2 border-dashed border-pink-300 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 text-pink-500 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 text-pink-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-pink-600">Upload image</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP</p>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={isUploading} />
              </Label>
            </div>
          </div>
        )}

        {/* Publish panel */}
        {activePanel === 'publish' && (
          <div className="space-y-3">
            {/* Download is always available */}
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                Download your card — no login needed
              </p>
              <Button
                onClick={handleDownload}
                disabled={isExporting}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
              >
                {isExporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting…</>
                ) : (
                  <><Download className="h-4 w-4 mr-2" />Download JPG</>
                )}
              </Button>
            </div>

            <Separator />

            {/* Publish to Nostr — requires login */}
            <p className="text-sm font-medium">Publish to Nostr</p>

            {user ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    value={publishTitle}
                    onChange={e => setPublishTitle(e.target.value)}
                    placeholder="e.g. Happy Birthday!"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={publishDescription}
                    onChange={e => setPublishDescription(e.target.value)}
                    rows={3}
                    placeholder="A heartfelt message…"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <Select value={publishCategory} onValueChange={setPublishCategory}>
                    <SelectTrigger className="text-sm h-8">
                      <SelectValue placeholder="Select category…" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.icon} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handlePublish}
                  disabled={isExporting || isPublishing || !publishTitle.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white"
                >
                  {isExporting || isPublishing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing…</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Publish Card</>
                  )}
                </Button>
              </>
            ) : (
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 space-y-2">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Log in with Nostr to publish your card and share it with the world.
                </p>
                <LoginArea className="w-full" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main canvas area ── */}
      <div className="flex-1 flex flex-col gap-3" ref={containerRef}>
        {/* Canvas toolbar */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleZoomOut} className="h-8 w-8 p-0"><ZoomOut className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="outline" onClick={() => setZoomLevel(1)} className="h-8 px-2 text-xs">{Math.round(zoomLevel * 100)}%</Button>
          <Button size="sm" variant="outline" onClick={handleZoomIn} className="h-8 w-8 p-0"><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button size="sm" variant="outline" onClick={handleBringForward} disabled={!selectedId} title="Bring forward" className="h-8 w-8 p-0"><ChevronUp className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="outline" onClick={handleSendBackward} disabled={!selectedId} title="Send backward" className="h-8 w-8 p-0"><ChevronDown className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={!selectedId} title="Duplicate" className="h-8 w-8 p-0"><Copy className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={!selectedId} title="Delete selected" className="h-8 w-8 p-0 text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="outline" onClick={handleClear} title="Clear all" className="h-8 px-2 text-xs text-red-500 hover:text-red-600"><RotateCcw className="h-3.5 w-3.5 mr-1" />Clear</Button>

          {/* Layer count + quick download */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {elements.length} element{elements.length !== 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isExporting}
              className="h-8 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-3"
              title="Download card as JPG"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="ml-1.5 text-xs hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="overflow-auto rounded-lg border-2 border-pink-200 dark:border-pink-800 bg-gray-100 dark:bg-gray-900 flex items-start justify-center p-4">
          <div
            ref={canvasWrapRef}
            style={{
              width: CARD_FORMAT.width * scale,
              height: CARD_FORMAT.height * scale,
              position: 'relative',
              cursor: dragging ? 'grabbing' : 'default',
              background: bgImage ? 'transparent' : bgColor,
              flexShrink: 0,
            }}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
          >
            {/* Background image */}
            {bgImage && (
              <img
                src={bgImage}
                alt="background"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}

            {/* Elements */}
            {elements.map(el => {
              const isSelected = el.id === selectedId;
              const elStyle: React.CSSProperties = {
                position: 'absolute',
                left: el.x * scale,
                top: el.y * scale,
                width: el.width * scale,
                height: el.height * scale,
                cursor: dragging?.id === el.id ? 'grabbing' : 'grab',
                outline: isSelected ? `2px solid #ec4899` : 'none',
                outlineOffset: 1,
                userSelect: 'none',
              };

              return (
                <div key={el.id} style={elStyle}>
                  {el.kind === 'image' && el.src && (
                    <img
                      src={el.src}
                      alt=""
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                    />
                  )}
                  {el.kind === 'text' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        fontFamily: el.fontFamily ?? 'Impact',
                        fontSize: (el.fontSize ?? 80) * scale,
                        fontWeight: el.bold ? 'bold' : 'normal',
                        fontStyle: el.italic ? 'italic' : 'normal',
                        color: el.color ?? '#000',
                        textAlign: el.align ?? 'center',
                        lineHeight: 1.25,
                        wordBreak: 'break-word',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    >
                      {el.text}
                    </div>
                  )}

                  {/* Resize handles */}
                  {isSelected && (['nw', 'ne', 'sw', 'se'] as Corner[]).map(corner => {
                    const cStyle: React.CSSProperties = {
                      position: 'absolute',
                      width: 10,
                      height: 10,
                      background: '#ec4899',
                      border: '2px solid white',
                      borderRadius: 2,
                      cursor: `${corner}-resize`,
                      ...(corner.includes('n') ? { top: -5 } : { bottom: -5 }),
                      ...(corner.includes('w') ? { left: -5 } : { right: -5 }),
                    };
                    return <div key={corner} style={cStyle} data-corner={corner} />;
                  })}
                </div>
              );
            })}

            {/* Empty state hint */}
            {elements.length === 0 && !bgImage && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  color: '#9ca3af',
                }}
              >
                <LayoutTemplate style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 14, opacity: 0.6 }}>Pick a template or add a text/image</p>
              </div>
            )}
          </div>
        </div>

        {/* Format info */}
        <p className="text-xs text-center text-muted-foreground">
          BitPop Card — {CARD_FORMAT.width} × {CARD_FORMAT.height} px
        </p>
      </div>
    </div>
  );
}


