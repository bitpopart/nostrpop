import { useState, useRef, useEffect, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudioLibraries } from '@/hooks/useStudioLibraries';
import { CANVAS_FORMATS, type CanvasFormat } from '@/lib/studioTypes';
import {
  Type, Trash2, Download, Layers, RotateCcw, Copy,
  Palette, ImageIcon, Sticker, FileText, Monitor, SquareUser,
  LayoutTemplate, ChevronUp, ChevronDown,
} from 'lucide-react';

// ─── Pop Art Colors ─────────────────────────────────────────────────────────
const POP_COLORS = [
  '#FF0080','#FF4500','#FFD700','#00FF41','#00BFFF','#FF69B4',
  '#FF1493','#FF6600','#FFFF00','#39FF14','#00FFFF','#BF00FF',
  '#FF0000','#FF8C00','#FFF01F','#7FFF00','#0080FF','#FF00FF',
  '#FFFFFF','#000000','#C0C0C0','#808080','#4B0082','#800000',
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
];

// ─── Element Types ───────────────────────────────────────────────────────────
type ElementKind = 'image' | 'text';

interface CanvasElement {
  id: string;
  kind: ElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  // image
  src?: string;
  // text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

// ─── Resize state ────────────────────────────────────────────────────────────
type Corner = 'nw' | 'ne' | 'sw' | 'se';

interface ResizeState {
  id: string;
  corner: Corner;
  startX: number;   // canvas-space pointer X at drag start
  startY: number;   // canvas-space pointer Y at drag start
  origX: number;    // element x at drag start
  origY: number;    // element y at drag start
  origW: number;    // element width at drag start
  origH: number;    // element height at drag start
}

// ─── Format Icon ─────────────────────────────────────────────────────────────
function FormatIcon({ id }: { id: string }) {
  if (id === 'sticker') return <Sticker className="h-4 w-4" />;
  if (id.includes('flyer')) return <FileText className="h-4 w-4" />;
  if (id === 'banner') return <Monitor className="h-4 w-4" />;
  if (id === 'avatar') return <SquareUser className="h-4 w-4" />;
  return <LayoutTemplate className="h-4 w-4" />;
}

// ─── Scale canvas to fit container ───────────────────────────────────────────
function computeScale(fw: number, fh: number, maxW: number, maxH: number) {
  return Math.min(maxW / fw, maxH / fh, 1);
}

// ─── Main Studio ─────────────────────────────────────────────────────────────
export default function Studio() {
  useSeoMeta({
    title: 'Pop Art Studio — Create Your Design',
    description: 'Create pop art designs online: stickers, flyers, banners and avatars.',
  });

  const [format, setFormat] = useState<CanvasFormat>(CANVAS_FORMATS[0]);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [activeColor, setActiveColor] = useState('#FF0080');
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(60);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [scale, setScale] = useState(0.4);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const { data: libraries, isLoading: librariesLoading } = useStudioLibraries();
  const activeLibraries = (libraries ?? []).filter(l => l.name !== '__deleted__' && l.images.length > 0);

  const newId = () => `el-${++idCounter.current}`;

  const selected = elements.find(e => e.id === selectedId) ?? null;

  // ─── Compute display scale ─────────────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setScale(computeScale(format.width, format.height, clientWidth - 32, clientHeight - 32));
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [format]);

  // ─── Add image element ────────────────────────────────────────────────
  const handleAddImage = useCallback((src: string) => {
    const size = Math.min(format.width, format.height) * 0.35;
    setElements(prev => [...prev, {
      id: newId(),
      kind: 'image',
      src,
      x: format.width / 2 - size / 2,
      y: format.height / 2 - size / 2,
      width: size,
      height: size,
    }]);
  }, [format]);

  // ─── Add text element ─────────────────────────────────────────────────
  const handleAddText = useCallback(() => {
    const w = format.width * 0.7;
    setElements(prev => [...prev, {
      id: newId(),
      kind: 'text',
      text: textInput || 'Your Text Here',
      x: format.width / 2 - w / 2,
      y: format.height / 2 - (fontSize * 1.2) / 2,
      width: w,
      height: fontSize * 1.5,
      fontSize,
      fontFamily,
      color: activeColor,
      bold: fontFamily === 'Impact',
      italic: false,
      align: 'center',
    }]);
  }, [textInput, fontSize, fontFamily, activeColor, format]);

  // ─── Delete selected ─────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setElements(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // ─── Clear all ───────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  // ─── Duplicate selected ──────────────────────────────────────────────
  const handleDuplicate = useCallback(() => {
    if (!selected) return;
    const clone: CanvasElement = { ...selected, id: newId(), x: selected.x + 30, y: selected.y + 30 };
    setElements(prev => [...prev, clone]);
    setSelectedId(clone.id);
  }, [selected]);

  // ─── Layer ordering ──────────────────────────────────────────────────
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

  // ─── Update selected element props ───────────────────────────────────
  const updateSelected = useCallback((patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, ...patch } : e));
  }, [selectedId]);

  // ─── Pointer helpers ─────────────────────────────────────────────────
  const getCanvasPos = (e: React.PointerEvent) => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  // ─── Canvas pointer down — detect resize handle or start drag ────────
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Check if we clicked a resize handle (data-corner attribute)
    const target = e.target as HTMLElement;
    const corner = target.getAttribute('data-corner') as Corner | null;
    if (corner && selectedId) {
      const el = elements.find(el => el.id === selectedId);
      if (!el) return;
      const { x, y } = getCanvasPos(e);
      setResizing({
        id: selectedId,
        corner,
        startX: x,
        startY: y,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
      });
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
    // Handle resize
    if (resizing) {
      const { x, y } = getCanvasPos(e);
      const dx = x - resizing.startX;
      const dy = y - resizing.startY;
      const MIN_SIZE = 20;

      setElements(prev => prev.map(el => {
        if (el.id !== resizing.id) return el;

        let newX = resizing.origX;
        let newY = resizing.origY;
        let newW = resizing.origW;
        let newH = resizing.origH;

        const corner = resizing.corner;

        if (corner === 'se') {
          // Bottom-right: grow/shrink from top-left anchor
          const rawW = resizing.origW + dx;
          const rawH = resizing.origH + dy;
          // Keep aspect ratio using the larger delta
          const ratio = resizing.origH / resizing.origW;
          const newWfromW = Math.max(MIN_SIZE, rawW);
          const newHfromW = newWfromW * ratio;
          newW = newWfromW;
          newH = newHfromW;
        } else if (corner === 'sw') {
          // Bottom-left: anchor is top-right
          const rawW = resizing.origW - dx;
          const ratio = resizing.origH / resizing.origW;
          newW = Math.max(MIN_SIZE, rawW);
          newH = newW * ratio;
          newX = resizing.origX + resizing.origW - newW;
        } else if (corner === 'ne') {
          // Top-right: anchor is bottom-left
          const rawW = resizing.origW + dx;
          const ratio = resizing.origH / resizing.origW;
          newW = Math.max(MIN_SIZE, rawW);
          newH = newW * ratio;
          newY = resizing.origY + resizing.origH - newH;
        } else if (corner === 'nw') {
          // Top-left: anchor is bottom-right
          const rawW = resizing.origW - dx;
          const ratio = resizing.origH / resizing.origW;
          newW = Math.max(MIN_SIZE, rawW);
          newH = newW * ratio;
          newX = resizing.origX + resizing.origW - newW;
          newY = resizing.origY + resizing.origH - newH;
        }

        return { ...el, x: newX, y: newY, width: newW, height: newH };
      }));
      return;
    }

    // Handle drag
    if (!dragging) return;
    const { x, y } = getCanvasPos(e);
    setElements(prev => prev.map(el =>
      el.id === dragging.id
        ? { ...el, x: x - dragging.ox, y: y - dragging.oy }
        : el
    ));
  };

  const handleCanvasPointerUp = () => {
    setDragging(null);
    setResizing(null);
  };

  // ─── Fetch any URL as a blob-URL so canvas.drawImage never taints ────
  // SVGs and external images often block crossOrigin canvas access.
  // Fetching through the CORS proxy and converting to a blob URL
  // makes the image same-origin, so drawImage always works.
  const fetchAsBlobUrl = async (src: string): Promise<string> => {
    const proxyUrl = `https://proxy.shakespeare.diy/?url=${encodeURIComponent(src)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${src}`);
    const blob = await res.blob();

    // For SVG blobs we need to ensure the MIME type is correct so the
    // browser can render the image element properly.
    const mime = blob.type || (src.toLowerCase().includes('.svg') ? 'image/svg+xml' : 'image/png');
    const typedBlob = blob.type ? blob : new Blob([blob], { type: mime });
    return URL.createObjectURL(typedBlob);
  };

  const loadBlobImage = (blobUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = blobUrl;
    });

  // ─── Download PNG — full design (background + all elements) ──────────
  const handleDownloadPNG = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = format.width;
    canvas.height = format.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Collect unique image srcs
    const imageElements = elements.filter(e => e.kind === 'image' && e.src);
    const blobUrls: Record<string, string> = {};

    // Fetch every image as a same-origin blob URL (works for SVGs too)
    await Promise.all(
      imageElements.map(async el => {
        if (!el.src || blobUrls[el.src]) return;
        try {
          blobUrls[el.src] = await fetchAsBlobUrl(el.src);
        } catch {
          // image will simply be skipped when drawing
        }
      })
    );

    // Load all blob URLs into HTMLImageElements
    const loadedImages: Record<string, HTMLImageElement> = {};
    await Promise.all(
      Object.entries(blobUrls).map(async ([src, blobUrl]) => {
        try {
          loadedImages[src] = await loadBlobImage(blobUrl);
        } catch {
          // skip
        }
      })
    );

    // Revoke blob URLs now that images are loaded
    for (const url of Object.values(blobUrls)) URL.revokeObjectURL(url);

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, format.width, format.height);

    // Draw all elements in order
    for (const el of elements) {
      ctx.save();
      if (el.kind === 'image' && el.src) {
        const img = loadedImages[el.src];
        if (img) ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } else if (el.kind === 'text' && el.text) {
        ctx.fillStyle = el.color ?? '#000000';
        ctx.font = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${el.fontSize ?? 60}px ${el.fontFamily ?? 'Impact'}`;
        ctx.textBaseline = 'top';
        ctx.textAlign = (el.align as CanvasTextAlign) ?? 'left';
        const x = el.align === 'center' ? el.x + el.width / 2 : el.align === 'right' ? el.x + el.width : el.x;
        ctx.fillText(el.text, x, el.y, el.width);
      }
      ctx.restore();
    }

    const link = document.createElement('a');
    link.download = `popart-${format.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [elements, format, bgColor]);

  // ─── Color change on selected ────────────────────────────────────────
  const handleColorClick = (color: string) => {
    setActiveColor(color);
    if (selected?.kind === 'text') {
      updateSelected({ color });
    }
  };

  const displayW = Math.round(format.width * scale);
  const displayH = Math.round(format.height * scale);

  // Cursor style while resizing or dragging
  const canvasCursor = resizing
    ? (resizing.corner === 'nw' || resizing.corner === 'se' ? 'nwse-resize' : 'nesw-resize')
    : dragging
      ? 'grabbing'
      : 'crosshair';

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-gray-950 dark:via-orange-950/20 dark:to-pink-950/20">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 text-white py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-white text-sm font-medium">
              PopArt is for everyone — create your own designs, be free!
            </p>
            <a
              href="https://www.bitpopart.com/free"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 hover:bg-white/30 text-white border border-white/40 transition-colors whitespace-nowrap"
            >
              Free Downloads
            </a>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/40 border" onClick={handleDownloadPNG}>
              <Download className="h-4 w-4 mr-1.5" /> Download Design
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
        {/* ── Format picker ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Format:</span>
          {CANVAS_FORMATS.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => { setFormat(fmt); setElements([]); setSelectedId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                format.id === fmt.id
                  ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
              }`}
            >
              <FormatIcon id={fmt.id} />
              {fmt.name}
              {fmt.category === 'print' && (
                <span className={`text-[10px] ${format.id === fmt.id ? 'text-white/70' : 'text-orange-500'}`}>PRINT</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Editor row ─────────────────────────────────────────────── */}
        <div className="flex gap-3 items-start">

          {/* ── Left toolbar ─────────────────────────────────────────── */}
          <div className="w-52 shrink-0 bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-lg border space-y-3">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" /> Tools
            </p>

            {/* Text tool */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Type className="h-3.5 w-3.5" /> Add Text
              </p>
              <Input
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Type something..."
                className="h-8 text-xs"
                onKeyDown={e => e.key === 'Enter' && handleAddText()}
              />
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
                  type="number" value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="h-8 w-14 text-xs" min={8} max={400}
                />
              </div>
              <Button size="sm" className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white" onClick={handleAddText}>
                <Type className="h-3.5 w-3.5 mr-1" /> Add Text
              </Button>
            </div>

            <Separator />

            {/* Selected image size controls */}
            {selected?.kind === 'image' && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Edit Image
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground shrink-0">Size</span>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 w-7 p-0 text-base font-bold"
                      onClick={() => {
                        const step = Math.round(selected.width * 0.1);
                        const newW = Math.max(20, selected.width - step);
                        const newH = Math.max(20, selected.height - step);
                        updateSelected({ width: newW, height: newH });
                      }}
                    >−</Button>
                    <span className="h-7 flex-1 flex items-center justify-center text-xs font-mono bg-muted rounded border text-muted-foreground">
                      {Math.round(selected.width)}
                    </span>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 w-7 p-0 text-base font-bold"
                      onClick={() => {
                        const step = Math.round(selected.width * 0.1);
                        updateSelected({ width: selected.width + step, height: selected.height + step });
                      }}
                    >+</Button>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Selected text props */}
            {selected?.kind === 'text' && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Edit Text</p>
                  <Input
                    value={selected.text ?? ''}
                    onChange={e => updateSelected({ text: e.target.value })}
                    className="h-8 text-xs"
                  />
                  {/* Font size stepper */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground shrink-0">Size</span>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 w-7 p-0 text-base font-bold"
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
                      className="h-7 w-7 p-0 text-base font-bold"
                      onClick={() => updateSelected({ fontSize: Math.min(400, (selected.fontSize ?? 60) + 10) })}
                    >+</Button>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant={selected.bold ? 'default' : 'outline'} className="h-7 flex-1 text-xs font-bold" onClick={() => updateSelected({ bold: !selected.bold })}>B</Button>
                    <Button size="sm" variant={selected.italic ? 'default' : 'outline'} className="h-7 flex-1 text-xs italic" onClick={() => updateSelected({ italic: !selected.italic })}>I</Button>
                    <Button size="sm" variant={selected.align === 'left' ? 'default' : 'outline'} className="h-7 flex-1 text-xs" onClick={() => updateSelected({ align: 'left' })}>←</Button>
                    <Button size="sm" variant={selected.align === 'center' ? 'default' : 'outline'} className="h-7 flex-1 text-xs" onClick={() => updateSelected({ align: 'center' })}>↔</Button>
                    <Button size="sm" variant={selected.align === 'right' ? 'default' : 'outline'} className="h-7 flex-1 text-xs" onClick={() => updateSelected({ align: 'right' })}>→</Button>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* BG color */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Background</p>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border" />
                <span className="text-xs font-mono text-muted-foreground">{bgColor}</span>
              </div>
            </div>

            <Separator />

            {/* Pop color palette */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Palette className="h-3.5 w-3.5" /> Pop Colors
              </p>
              <div className="grid grid-cols-6 gap-1">
                {POP_COLORS.map(c => (
                  <button
                    key={c} title={c}
                    onClick={() => handleColorClick(c)}
                    className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${activeColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="color" value={activeColor} onChange={e => handleColorClick(e.target.value)} className="w-8 h-8 rounded cursor-pointer border" />
                <span className="text-xs font-mono text-muted-foreground">{activeColor}</span>
              </div>
            </div>

            <Separator />

            {/* Object controls */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> Object
              </p>
              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDuplicate} disabled={!selectedId}><Copy className="h-3 w-3 mr-1" />Copy</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={handleDelete} disabled={!selectedId}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBringForward} disabled={!selectedId}><ChevronUp className="h-3 w-3 mr-1" />Fwd</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSendBackward} disabled={!selectedId}><ChevronDown className="h-3 w-3 mr-1" />Back</Button>
              </div>
              <Button size="sm" variant="ghost" className="w-full h-7 text-xs text-muted-foreground" onClick={handleClear}>
                <RotateCcw className="h-3 w-3 mr-1" /> Clear All
              </Button>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Button size="sm" className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white" onClick={handleDownloadPNG}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download Design
              </Button>
              {format.category === 'print' && (
                <p className="text-[10px] text-center text-muted-foreground">PNG at {format.dpi} DPI — ready for print</p>
              )}
            </div>
          </div>

          {/* ── Canvas area ──────────────────────────────────────────── */}
          <div ref={containerRef} className="flex-1 flex flex-col items-center gap-2 min-h-[520px]">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">{format.label}</Badge>
              <Badge variant="secondary" className="text-xs">{format.width} × {format.height}px</Badge>
              {selectedId && <Badge className="text-xs bg-orange-500 text-white">1 selected</Badge>}
            </div>

            {/*
              DOM-based canvas: background div + absolutely-positioned img/text elements.
              This avoids all canvas image-loading race conditions — the browser handles
              <img> loading natively and they appear as soon as pixels arrive.
              A real <canvas> is only created on-demand for PNG export.
            */}
            <div
              ref={canvasWrapRef}
              className="relative shadow-2xl overflow-hidden select-none"
              style={{
                width: displayW,
                height: displayH,
                background: bgColor,
                touchAction: 'none',
                cursor: canvasCursor,
              }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
            >
              {/* Render each element as a DOM node */}
              {elements.map(el => {
                const isSelected = el.id === selectedId;
                const style: React.CSSProperties = {
                  position: 'absolute',
                  left: el.x * scale,
                  top: el.y * scale,
                  width: el.width * scale,
                  height: el.height * scale,
                  outline: isSelected ? '2px solid #f97316' : 'none',
                  outlineOffset: '1px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                };

                if (el.kind === 'image' && el.src) {
                  return (
                    <div key={el.id} style={style}>
                      <img
                        src={el.src}
                        alt=""
                        draggable={false}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                      {isSelected && (
                        <SelectionHandles
                          w={el.width * scale}
                          h={el.height * scale}
                        />
                      )}
                    </div>
                  );
                }

                if (el.kind === 'text' && el.text) {
                  const scaledFontSize = (el.fontSize ?? 60) * scale;
                  return (
                    <div
                      key={el.id}
                      style={{
                        ...style,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent:
                          el.align === 'center' ? 'center' :
                          el.align === 'right' ? 'flex-end' : 'flex-start',
                        overflow: 'visible',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: scaledFontSize,
                          fontFamily: el.fontFamily ?? 'Impact',
                          color: el.color ?? '#000000',
                          fontWeight: el.bold ? 'bold' : 'normal',
                          fontStyle: el.italic ? 'italic' : 'normal',
                          lineHeight: 1.2,
                          pointerEvents: 'none',
                        }}
                      >
                        {el.text}
                      </span>
                      {isSelected && (
                        <SelectionHandles
                          w={el.width * scale}
                          h={el.height * scale}
                        />
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>

            <p className="text-xs text-muted-foreground">Click to select · Drag to move · Drag corners to resize</p>
          </div>
        </div>

        {/* ── Library panel ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30">
            <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Pop Art Element Libraries
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click any element to add it to your canvas. Use tabs to switch libraries.</p>
          </div>

          {librariesLoading ? (
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
              </div>
              <div className="grid grid-cols-8 gap-2">
                {Array.from({length:16}).map((_,i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
              </div>
            </div>
          ) : activeLibraries.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No element libraries yet</p>
              <p className="text-xs mt-1">The admin will upload pop art elements here — check back soon!</p>
            </div>
          ) : (
            <Tabs defaultValue={activeLibraries[0]?.id}>
              <div className="px-4 pt-3 pb-1 overflow-x-auto">
                <TabsList className="inline-flex h-9 gap-1 bg-transparent p-0 flex-wrap">
                  {activeLibraries.map(lib => (
                    <TabsTrigger
                      key={lib.id} value={lib.id}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold border data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500 border-gray-200 hover:border-orange-300 transition-all"
                    >
                      {lib.name}
                      <span className="ml-1 opacity-60 text-[10px]">({lib.images.length})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {activeLibraries.map(lib => (
                <TabsContent key={lib.id} value={lib.id} className="p-4 mt-0">
                  <ScrollArea className="h-48">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 gap-2 pr-2">
                      {lib.images.map((img, i) => (
                        <button
                          key={i} title={img.name}
                          onClick={() => handleAddImage(img.url)}
                          className="group aspect-square rounded-xl border-2 border-transparent hover:border-orange-400 bg-gray-50 dark:bg-gray-800 overflow-hidden transition-all hover:shadow-lg hover:scale-110 active:scale-95"
                        >
                          <img src={img.url} alt={img.name} className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  {lib.description && <p className="text-xs text-muted-foreground mt-2 italic">{lib.description}</p>}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        {/* ── Tips ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '🖱️', tip: 'Click an element in the library to add it to your canvas' },
            { icon: '↔️', tip: 'Drag the corner handles to resize a selected element' },
            { icon: '🎨', tip: 'Select a text object then click a color to change it' },
            { icon: '💾', tip: 'Click "Download Design" to save your full design as a PNG' },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2 bg-white dark:bg-gray-900 rounded-xl p-3 border text-xs text-muted-foreground">
              <span className="text-base shrink-0">{t.icon}</span>
              <p>{t.tip}</p>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground pb-4">
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Vibed with Shakespeare</a>
        </div>
      </div>
    </div>
  );
}

// ─── Selection corner handles (interactive resize) ───────────────────────────
function SelectionHandles({ w, h }: { w: number; h: number }) {
  const corners: { corner: Corner; lx: number; ly: number; cursor: string }[] = [
    { corner: 'nw', lx: -6, ly: -6, cursor: 'nwse-resize' },
    { corner: 'ne', lx: w - 6, ly: -6, cursor: 'nesw-resize' },
    { corner: 'sw', lx: -6, ly: h - 6, cursor: 'nesw-resize' },
    { corner: 'se', lx: w - 6, ly: h - 6, cursor: 'nwse-resize' },
  ];
  return (
    <>
      {corners.map(({ corner, lx, ly, cursor }) => (
        <div
          key={corner}
          data-corner={corner}
          className="absolute w-4 h-4 bg-orange-500 border-2 border-white rounded-sm shadow-md hover:bg-orange-600 hover:scale-125 transition-transform"
          style={{
            left: lx,
            top: ly,
            pointerEvents: 'auto',
            cursor,
            zIndex: 10,
            touchAction: 'none',
          }}
        />
      ))}
    </>
  );
}
