import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppMedia } from '@/hooks/useAppContent';
import { useEmojiPacks } from '@/hooks/useEmojiPacks';
import { GifEncoder } from '@/lib/gifEncoder';
import {
  Plus,
  Trash2,
  Play,
  Loader2,
  LayoutTemplate,
  UserCircle2,
  Sticker,
  Type,
  Image as ImageIcon,
  Download,
  X,
  Copy,
  ArrowLeft,
  ArrowRight,
  Layers,
  MoveUp,
  MoveDown,
  CheckCircle2,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const GIF_SIZE = 480;
const DISPLAY_SIZE = 280; // on-screen px

const MEME_FONTS = [
  { label: 'Impact', value: 'Impact' },
  { label: 'Arial Black', value: 'Arial Black' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Marker', value: 'Permanent Marker' },
  { label: 'Oswald', value: 'Oswald Variable' },
  { label: 'Verdana', value: 'Verdana' },
];

const POP_COLORS = [
  '#FFFFFF', '#000000', '#FF0080', '#FF4500', '#FFD700',
  '#00FF41', '#00BFFF', '#FF69B4', '#FF1493', '#FF6600',
  '#FFFF00', '#39FF14', '#00FFFF', '#BF00FF', '#FF0000',
];

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single image layer placed inside a frame */
interface ImageLayer {
  id: string;
  url: string;
  /** Position & size in GIF_SIZE space */
  x: number;
  y: number;
  size: number; // width = height = size (square fit)
}

/** One frame = background color + stacked image layers + optional text */
interface GifFrame {
  id: string;
  bgColor: string;
  layers: ImageLayer[];
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  textPosition: 'top' | 'center' | 'bottom';
  delay: number; // ms
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeFrame(overrides?: Partial<GifFrame>): GifFrame {
  return {
    id: uid(),
    bgColor: '#FFFFFF',
    layers: [],
    text: '',
    textColor: '#FF0080',
    fontSize: 48,
    fontFamily: 'Impact',
    textPosition: 'bottom',
    delay: 500,
    ...overrides,
  };
}

function makeLayer(url: string): ImageLayer {
  return {
    id: uid(),
    url,
    x: 0,
    y: 0,
    size: GIF_SIZE, // full frame by default — user can resize
  };
}

// ── Canvas rendering ──────────────────────────────────────────────────────────

function renderFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: GifFrame,
  imgCache: Map<string, HTMLImageElement>,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = frame.bgColor;
  ctx.fillRect(0, 0, W, H);

  // Draw layers bottom → top
  for (const layer of frame.layers) {
    const img = imgCache.get(layer.url);
    if (!img?.complete || !img.naturalWidth) continue;
    const scale = W / GIF_SIZE;
    const x = layer.x * scale;
    const y = layer.y * scale;
    const s = layer.size * scale;
    // Keep aspect ratio
    const ratio = img.naturalWidth / img.naturalHeight;
    let dw = s, dh = s;
    if (ratio > 1) dh = s / ratio;
    else dw = s * ratio;
    ctx.drawImage(img, x + (s - dw) / 2, y + (s - dh) / 2, dw, dh);
  }

  // Text on top
  if (frame.text) {
    const fs = Math.round(frame.fontSize * W / GIF_SIZE);
    ctx.font = `bold ${fs}px "${frame.fontFamily}"`;
    ctx.fillStyle = frame.textColor;
    ctx.strokeStyle = frame.textColor === '#FFFFFF' ? '#000000' : '#FFFFFF';
    ctx.lineWidth = Math.max(2, Math.round(3 * W / GIF_SIZE));
    ctx.textAlign = 'center';
    let y = H / 2;
    if (frame.textPosition === 'top') y = fs + Math.round(10 * W / GIF_SIZE);
    else if (frame.textPosition === 'bottom') y = H - Math.round(20 * W / GIF_SIZE);
    ctx.strokeText(frame.text, W / 2, y);
    ctx.fillText(frame.text, W / 2, y);
  }
}

// ── Image preloader ───────────────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const tryLoad = (src: string, tried: boolean) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (!tried) tryLoad(`https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`, true);
        else reject(new Error(`Cannot load: ${url}`));
      };
      img.src = src;
    };
    tryLoad(url, false);
  });
}

// ── Picker tab types ──────────────────────────────────────────────────────────

type PickerTab = 'templates' | 'pops' | 'icons' | 'emojis';

// ── Inline frame preview (HTML, not canvas) ───────────────────────────────────

function FramePreview({
  frame,
  size,
  isActive,
  imgCache,
}: {
  frame: GifFrame;
  size: number;
  isActive: boolean;
  imgCache: Map<string, HTMLImageElement>;
}) {
  const scale = size / GIF_SIZE;
  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 transition-all ${isActive ? 'border-purple-500 shadow-md' : 'border-gray-200 dark:border-gray-600'}`}
      style={{ width: size, height: size, background: frame.bgColor, flexShrink: 0 }}
    >
      {frame.layers.map(layer => {
        const img = imgCache.get(layer.url);
        const s = layer.size * scale;
        const x = layer.x * scale;
        const y = layer.y * scale;
        return (
          <div
            key={layer.id}
            className="absolute"
            style={{ left: x, top: y, width: s, height: s }}
          >
            {img ? (
              <img src={layer.url} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <ImageIcon className="h-3 w-3 text-gray-400" />
              </div>
            )}
          </div>
        );
      })}
      {frame.layers.length === 0 && !frame.text && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-gray-400 opacity-40" />
        </div>
      )}
      {frame.text && (
        <div
          className="absolute left-0 right-0 text-center px-0.5 font-bold leading-tight"
          style={{
            fontFamily: frame.fontFamily,
            fontSize: Math.round(frame.fontSize * scale),
            color: frame.textColor,
            WebkitTextStroke: `${Math.round(scale)}px ${frame.textColor === '#FFFFFF' ? '#000' : '#fff'}`,
            ...(frame.textPosition === 'top'
              ? { top: 2 }
              : frame.textPosition === 'bottom'
              ? { bottom: 2 }
              : { top: '50%', transform: 'translateY(-50%)' }),
          }}
        >
          {frame.text}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface GifMemeCreatorProps {
  onSave: (dataUrl: string, title: string) => void;
}

export function GifMemeCreator({ onSave }: GifMemeCreatorProps) {
  const [frames, setFrames] = useState<GifFrame[]>([makeFrame()]);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [activeLayerIdx, setActiveLayerIdx] = useState<number | null>(null);
  const [pickerTab, setPickerTab] = useState<PickerTab>('templates');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedGifUrl, setExportedGifUrl] = useState<string | null>(null);

  // Live preview cycling
  const [previewFrameIdx, setPreviewFrameIdx] = useState(0);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hidden canvas for export
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgCache = useRef(new Map<string, HTMLImageElement>());
  const [cacheVersion, setCacheVersion] = useState(0); // bump to force re-render after loads

  const activeFrame = frames[activeFrameIdx] ?? frames[0];
  const activeLayers = activeFrame.layers;

  // ── Media data ───────────────────────────────────────────────────────────────

  const { data: memeTemplates = [], isLoading: templatesLoading } = useAppMedia('app-meme-template');
  const { data: pops = [], isLoading: popsLoading } = useAppMedia('app-pop');
  const { data: icons = [], isLoading: iconsLoading } = useAppMedia('app-meme-icon');
  const { data: emojiPacks = [], isLoading: emojisLoading } = useEmojiPacks();
  const emojiItems = useMemo(
    () => emojiPacks.flatMap(p => p.emojis.map(e => ({ id: `${p.id}:${e.shortcode}`, image_url: e.url, title: e.shortcode }))),
    [emojiPacks],
  );

  // ── Preload images ────────────────────────────────────────────────────────────

  useEffect(() => {
    const allUrls = frames.flatMap(f => f.layers.map(l => l.url)).filter(Boolean);
    const missing = allUrls.filter(u => !imgCache.current.has(u));
    if (missing.length === 0) return;
    missing.forEach(url => {
      loadImage(url)
        .then(img => { imgCache.current.set(url, img); setCacheVersion(v => v + 1); })
        .catch(() => {});
    });
  }, [frames]);

  // ── Live cycling preview ──────────────────────────────────────────────────────

  useEffect(() => {
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    if (frames.length <= 1) { setPreviewFrameIdx(0); return; }
    const timer = setInterval(() => {
      setPreviewFrameIdx(i => (i + 1) % frames.length);
    }, frames[previewFrameIdx]?.delay ?? 500);
    previewTimerRef.current = timer;
    return () => clearInterval(timer);
  }, [frames, previewFrameIdx]);

  // ── Frame helpers ─────────────────────────────────────────────────────────────

  const updateActiveFrame = (patch: Partial<GifFrame>) => {
    setFrames(prev => prev.map((f, i) => i === activeFrameIdx ? { ...f, ...patch } : f));
  };

  const addFrame = () => {
    const clone = makeFrame({ ...activeFrame, id: uid(), layers: activeFrame.layers.map(l => ({ ...l, id: uid() })) });
    setFrames(prev => [...prev.slice(0, activeFrameIdx + 1), clone, ...prev.slice(activeFrameIdx + 1)]);
    setActiveFrameIdx(activeFrameIdx + 1);
    setActiveLayerIdx(null);
  };

  const addBlankFrame = () => {
    const blank = makeFrame();
    setFrames(prev => [...prev, blank]);
    setActiveFrameIdx(frames.length);
    setActiveLayerIdx(null);
  };

  const duplicateFrame = (idx: number) => {
    const clone = makeFrame({ ...frames[idx], id: uid(), layers: frames[idx].layers.map(l => ({ ...l, id: uid() })) });
    setFrames(prev => [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)]);
    setActiveFrameIdx(idx + 1);
  };

  const removeFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const next = frames.filter((_, i) => i !== idx);
    setFrames(next);
    setActiveFrameIdx(Math.min(activeFrameIdx, next.length - 1));
    setActiveLayerIdx(null);
  };

  const moveFrame = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= frames.length) return;
    const next = [...frames];
    [next[idx], next[to]] = [next[to], next[idx]];
    setFrames(next);
    setActiveFrameIdx(to);
  };

  // ── Layer helpers ─────────────────────────────────────────────────────────────

  const addLayer = (url: string) => {
    const layer = makeLayer(url);
    const newLayers = [...activeLayers, layer];
    updateActiveFrame({ layers: newLayers });
    setActiveLayerIdx(newLayers.length - 1);
  };

  const updateLayer = (layerId: string, patch: Partial<ImageLayer>) => {
    updateActiveFrame({
      layers: activeLayers.map(l => l.id === layerId ? { ...l, ...patch } : l),
    });
  };

  const removeLayer = (layerId: string) => {
    updateActiveFrame({ layers: activeLayers.filter(l => l.id !== layerId) });
    setActiveLayerIdx(null);
  };

  const moveLayerUp = (idx: number) => {
    if (idx >= activeLayers.length - 1) return;
    const next = [...activeLayers];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    updateActiveFrame({ layers: next });
    setActiveLayerIdx(idx + 1);
  };

  const moveLayerDown = (idx: number) => {
    if (idx <= 0) return;
    const next = [...activeLayers];
    [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
    updateActiveFrame({ layers: next });
    setActiveLayerIdx(idx - 1);
  };

  const activeLayer = activeLayerIdx !== null ? activeLayers[activeLayerIdx] ?? null : null;

  // ── Export GIF ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setIsExporting(true);
    setExportedGifUrl(null);
    try {
      // Preload all images
      const allUrls = [...new Set(frames.flatMap(f => f.layers.map(l => l.url)).filter(Boolean))];
      await Promise.all(
        allUrls.map(url =>
          imgCache.current.has(url)
            ? Promise.resolve()
            : loadImage(url).then(img => { imgCache.current.set(url, img); }).catch(() => {}),
        ),
      );

      const encoder = new GifEncoder(GIF_SIZE, GIF_SIZE);
      const offscreen = document.createElement('canvas');
      offscreen.width = GIF_SIZE;
      offscreen.height = GIF_SIZE;

      for (const frame of frames) {
        renderFrameToCanvas(offscreen, frame, imgCache.current);
        const ctx = offscreen.getContext('2d');
        if (!ctx) continue;
        const imageData = ctx.getImageData(0, 0, GIF_SIZE, GIF_SIZE);
        encoder.addFrame(imageData.data, frame.delay);
      }

      const blob = encoder.finish();
      const gifUrl = URL.createObjectURL(blob);
      setExportedGifUrl(gifUrl);

      // Notify parent using blob URL directly (works in img src, no FileReader needed)
      onSave(gifUrl, 'My BitPopArt GIF Meme');
    } catch (err) {
      console.error('GIF export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDirectDownload = () => {
    if (!exportedGifUrl) return;
    const a = document.createElement('a');
    a.href = exportedGifUrl;
    a.download = `bitpopart-gif-meme-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Picker items ──────────────────────────────────────────────────────────────

  const pickerData = {
    templates: { items: memeTemplates, loading: templatesLoading },
    pops: { items: pops, loading: popsLoading },
    icons: { items: icons, loading: iconsLoading },
    emojis: { items: emojiItems.map(e => ({ id: e.id, image_url: e.image_url, title: e.title })), loading: emojisLoading },
  };

  const currentPicker = pickerData[pickerTab];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Hidden export canvas */}
      <canvas ref={exportCanvasRef} width={GIF_SIZE} height={GIF_SIZE} className="hidden" />

      {/* Header */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <Play className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold">GIF Meme Creator</p>
          <p className="text-[10px] text-white/80">Multi-layer frames · animated export</p>
        </div>
        <Badge className="text-[10px] bg-white/20 text-white border-0 shrink-0">
          {frames.length} frame{frames.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* ── LIVE PREVIEW ─────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}>
          {/* Cycling preview across all frames */}
          {frames.map((frame, i) => (
            <div
              key={frame.id}
              className={`absolute inset-0 rounded-xl border-2 border-purple-300 overflow-hidden transition-opacity duration-100 ${i === previewFrameIdx ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: frame.bgColor }}
            >
              {frame.layers.map(layer => {
                const img = imgCache.current.get(layer.url);
                const scale = DISPLAY_SIZE / GIF_SIZE;
                const s = layer.size * scale;
                const x = layer.x * scale;
                const y = layer.y * scale;
                const ratio = img ? img.naturalWidth / img.naturalHeight : 1;
                let dw = s, dh = s;
                if (ratio > 1) dh = s / ratio; else dw = s * ratio;
                return (
                  <div key={layer.id} className="absolute" style={{ left: x, top: y, width: s, height: s }}>
                    {img
                      ? <img src={layer.url} alt="" className="absolute top-1/2 left-1/2 object-contain" style={{ width: dw, height: dh, transform: 'translate(-50%,-50%)' }} />
                      : <div className="w-full h-full bg-gray-200/50 rounded" />
                    }
                  </div>
                );
              })}
              {frame.text && (
                <div
                  className="absolute left-0 right-0 text-center px-1 font-bold leading-none"
                  style={{
                    fontFamily: frame.fontFamily,
                    fontSize: Math.round(frame.fontSize * DISPLAY_SIZE / GIF_SIZE),
                    color: frame.textColor,
                    WebkitTextStroke: `1px ${frame.textColor === '#FFFFFF' ? '#000' : '#fff'}`,
                    ...(frame.textPosition === 'top'
                      ? { top: 6 }
                      : frame.textPosition === 'bottom'
                      ? { bottom: 6 }
                      : { top: '50%', transform: 'translateY(-50%)' }),
                  }}
                >
                  {frame.text}
                </div>
              )}
            </div>
          ))}
          {/* Frame dots */}
          {frames.length > 1 && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {frames.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === previewFrameIdx ? 'w-4 h-1.5 bg-purple-500' : 'w-1.5 h-1.5 bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FRAME STRIP ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
        <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between border-b border-purple-100 dark:border-purple-800">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Frames</p>
          <div className="flex gap-1.5">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 text-purple-700 dark:text-purple-200 text-[10px] font-semibold transition-colors"
              onClick={addFrame}
              title="Duplicate current frame"
            >
              <Copy className="h-3 w-3" /> Clone
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-semibold transition-colors"
              onClick={addBlankFrame}
              title="Add blank frame"
            >
              <Plus className="h-3 w-3" /> Blank
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-2 overflow-x-auto">
          {frames.map((frame, idx) => {
            const isActive = idx === activeFrameIdx;
            return (
              <div key={frame.id} className="shrink-0 flex flex-col gap-1">
                {/* Thumbnail */}
                <div
                  className={`relative cursor-pointer rounded-lg border-2 transition-all ${isActive ? 'border-purple-500 shadow-md scale-105' : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}
                  style={{ width: 56, height: 56 }}
                  onClick={() => { setActiveFrameIdx(idx); setActiveLayerIdx(null); }}
                >
                  <FramePreview frame={frame} size={56} isActive={isActive} imgCache={imgCache.current} />
                  {/* Layer count badge */}
                  {frame.layers.length > 0 && (
                    <div className="absolute top-0.5 right-0.5 bg-purple-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {frame.layers.length}
                    </div>
                  )}
                  {/* Frame number */}
                  <div className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[8px] rounded px-0.5">
                    {idx + 1}
                  </div>
                </div>
                {/* Mini controls */}
                <div className="flex gap-0.5">
                  <button
                    className="flex-1 flex items-center justify-center h-5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 disabled:opacity-30 transition-colors"
                    onClick={() => moveFrame(idx, -1)}
                    disabled={idx === 0}
                    title="Move left"
                  >
                    <ArrowLeft className="h-2.5 w-2.5" />
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center h-5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 disabled:opacity-30 transition-colors"
                    onClick={() => moveFrame(idx, 1)}
                    disabled={idx === frames.length - 1}
                    title="Move right"
                  >
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center h-5 rounded bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-400 disabled:opacity-30 transition-colors"
                    onClick={() => removeFrame(idx)}
                    disabled={frames.length <= 1}
                    title="Delete frame"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE FRAME LAYERS ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-purple-500" />
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex-1">
            Frame {activeFrameIdx + 1} — Layers
          </p>
          <span className="text-[10px] text-muted-foreground">{activeLayers.length} image{activeLayers.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="p-3 space-y-2">
          {/* Layer list */}
          {activeLayers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No layers yet — pick an image below to add one
            </p>
          ) : (
            <div className="space-y-1.5">
              {[...activeLayers].reverse().map((layer, revIdx) => {
                const realIdx = activeLayers.length - 1 - revIdx;
                const img = imgCache.current.get(layer.url);
                const isActiveLayer = activeLayerIdx === realIdx;
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${isActiveLayer ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 bg-white dark:bg-gray-800'}`}
                    onClick={() => setActiveLayerIdx(isActiveLayer ? null : realIdx)}
                  >
                    {/* Thumbnail */}
                    <div className="w-8 h-8 rounded-md overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                      {img
                        ? <img src={layer.url} alt="" className="w-full h-full object-contain" />
                        : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><ImageIcon className="h-3 w-3 text-gray-400" /></div>
                      }
                    </div>
                    {/* Label */}
                    <span className="flex-1 text-[10px] text-muted-foreground truncate">
                      Layer {realIdx + 1}
                      {isActiveLayer && <span className="ml-1 text-purple-500 font-semibold">● editing</span>}
                    </span>
                    {/* Up/Down/Delete */}
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-purple-100 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-30"
                        onClick={e => { e.stopPropagation(); moveLayerUp(realIdx); }}
                        disabled={realIdx >= activeLayers.length - 1}
                        title="Move up (forward)"
                      >
                        <MoveUp className="h-3 w-3" />
                      </button>
                      <button
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-purple-100 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-30"
                        onClick={e => { e.stopPropagation(); moveLayerDown(realIdx); }}
                        disabled={realIdx <= 0}
                        title="Move down (behind)"
                      >
                        <MoveDown className="h-3 w-3" />
                      </button>
                      <button
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={e => { e.stopPropagation(); removeLayer(layer.id); }}
                        title="Remove layer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active layer controls */}
          {activeLayer && (
            <div className="rounded-lg border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10 p-2.5 space-y-2">
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">
                Layer {activeLayerIdx! + 1} Position &amp; Size
              </p>

              {/* Size slider */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">Size</span>
                <input
                  type="range"
                  min={50}
                  max={GIF_SIZE}
                  step={10}
                  value={activeLayer.size}
                  onChange={e => updateLayer(activeLayer.id, { size: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-purple-500"
                />
                <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round((activeLayer.size / GIF_SIZE) * 100)}%</span>
              </div>

              {/* X position */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">Left</span>
                <input
                  type="range"
                  min={-GIF_SIZE / 2}
                  max={GIF_SIZE / 2}
                  step={10}
                  value={activeLayer.x}
                  onChange={e => updateLayer(activeLayer.id, { x: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-purple-500"
                />
                <span className="text-[10px] text-muted-foreground w-8 text-right">{activeLayer.x}</span>
              </div>

              {/* Y position */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">Top</span>
                <input
                  type="range"
                  min={-GIF_SIZE / 2}
                  max={GIF_SIZE / 2}
                  step={10}
                  value={activeLayer.y}
                  onChange={e => updateLayer(activeLayer.id, { y: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-purple-500"
                />
                <span className="text-[10px] text-muted-foreground w-8 text-right">{activeLayer.y}</span>
              </div>

              {/* Preset positions */}
              <div className="flex flex-wrap gap-1">
                {[
                  { label: 'Full', x: 0, y: 0, size: GIF_SIZE },
                  { label: 'Top-L', x: 0, y: 0, size: GIF_SIZE / 2 },
                  { label: 'Top-R', x: GIF_SIZE / 2, y: 0, size: GIF_SIZE / 2 },
                  { label: 'Bot-L', x: 0, y: GIF_SIZE / 2, size: GIF_SIZE / 2 },
                  { label: 'Bot-R', x: GIF_SIZE / 2, y: GIF_SIZE / 2, size: GIF_SIZE / 2 },
                  { label: 'Center', x: GIF_SIZE / 4, y: GIF_SIZE / 4, size: GIF_SIZE / 2 },
                ].map(p => (
                  <button
                    key={p.label}
                    className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-800 hover:bg-purple-200 text-purple-700 dark:text-purple-200 text-[10px] font-semibold transition-colors"
                    onClick={() => updateLayer(activeLayer.id, { x: p.x, y: p.y, size: p.size })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FRAME SETTINGS (text + timing) ───────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Frame {activeFrameIdx + 1} — Text &amp; Timing
          </p>
        </div>
        <div className="p-3 space-y-2.5">
          {/* Delay */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-12 shrink-0">Duration</span>
            <Select value={String(activeFrame.delay)} onValueChange={v => updateActiveFrame({ delay: Number(v) })}>
              <SelectTrigger className="h-7 text-[10px] flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">0.1s</SelectItem>
                <SelectItem value="200">0.2s</SelectItem>
                <SelectItem value="300">0.3s</SelectItem>
                <SelectItem value="500">0.5s</SelectItem>
                <SelectItem value="700">0.7s</SelectItem>
                <SelectItem value="1000">1s</SelectItem>
                <SelectItem value="1500">1.5s</SelectItem>
                <SelectItem value="2000">2s</SelectItem>
                <SelectItem value="3000">3s</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text input */}
          <div className="flex items-center gap-2">
            <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              value={activeFrame.text}
              onChange={e => updateActiveFrame({ text: e.target.value })}
              placeholder="Text on this frame…"
              className="h-7 text-xs flex-1"
              style={{ fontSize: 16 }}
            />
          </div>

          {activeFrame.text && (
            <>
              {/* Font + position */}
              <div className="flex gap-2">
                <Select value={activeFrame.fontFamily} onValueChange={v => updateActiveFrame({ fontFamily: v })}>
                  <SelectTrigger className="h-7 text-[10px] flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEME_FONTS.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={activeFrame.textPosition} onValueChange={v => updateActiveFrame({ textPosition: v as 'top' | 'center' | 'bottom' })}>
                  <SelectTrigger className="h-7 text-[10px] w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text color */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground w-8 shrink-0">Color</span>
                {POP_COLORS.map(c => (
                  <button
                    key={c}
                    className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${activeFrame.textColor === c ? 'border-purple-500 scale-110' : 'border-transparent'}`}
                    style={{ background: c, boxShadow: (c === '#FFFFFF' || c === '#000000') ? 'inset 0 0 0 1px #aaa' : undefined }}
                    onClick={() => updateActiveFrame({ textColor: c })}
                  />
                ))}
              </div>
            </>
          )}

          {/* BG color */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground w-8 shrink-0">BG</span>
            {POP_COLORS.map(c => (
              <button
                key={c}
                className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${activeFrame.bgColor === c ? 'border-purple-500 scale-110' : 'border-transparent'}`}
                style={{ background: c, boxShadow: (c === '#FFFFFF' || c === '#000000') ? 'inset 0 0 0 1px #aaa' : undefined }}
                onClick={() => updateActiveFrame({ bgColor: c })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── IMAGE PICKER (adds to active frame as a new layer) ────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">
            + Add image layer to Frame {activeFrameIdx + 1}
          </p>
        </div>
        {/* Picker tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {([ 
            { id: 'templates' as PickerTab, label: 'Templates', icon: <LayoutTemplate className="h-3 w-3" /> },
            { id: 'pops' as PickerTab, label: 'Pops', icon: <UserCircle2 className="h-3 w-3" /> },
            { id: 'icons' as PickerTab, label: 'Icons', icon: <Sticker className="h-3 w-3" /> },
            { id: 'emojis' as PickerTab, label: 'Emojis', icon: <span className="text-[10px]">😄</span> },
          ]).map(tab => (
            <button
              key={tab.id}
              className={`flex-1 flex items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${pickerTab === tab.id ? 'bg-white dark:bg-gray-800 text-purple-600 border-b-2 border-purple-500' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setPickerTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-2.5 bg-white dark:bg-gray-800">
          {currentPicker.loading ? (
            <div className="flex gap-1.5 pb-1">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="shrink-0 w-12 h-12 rounded-lg" />)}
            </div>
          ) : currentPicker.items.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-3">Nothing here yet</p>
          ) : (
            <div className="flex gap-1.5 flex-wrap max-h-32 overflow-y-auto">
              {currentPicker.items.map(item => {
                // Check if this URL is already used in any layer of the active frame
                const alreadyAdded = activeLayers.some(l => l.url === item.image_url);
                return (
                  <button
                    key={item.id}
                    className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${alreadyAdded ? 'border-green-400' : 'border-gray-200 hover:border-purple-400'}`}
                    onClick={() => addLayer(item.image_url)}
                    title={`Add ${item.title} as a new layer`}
                  >
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-contain p-0.5" loading="lazy" />
                    {alreadyAdded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── EXPORT ───────────────────────────────────────────────────────── */}
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)' }}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Building GIF…</>
        ) : (
          <><Play className="h-4 w-4" /> Export Animated GIF ({frames.length} frame{frames.length !== 1 ? 's' : ''})</>
        )}
      </button>

      {/* ── DOWNLOAD RESULT (inline — always visible after export) ────────── */}
      {exportedGifUrl && (
        <div className="rounded-xl border-2 border-purple-400 dark:border-purple-600 overflow-hidden bg-white dark:bg-gray-800 space-y-3 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">GIF Ready!</span>
            <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] ml-auto">
              {frames.length} frame{frames.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Preview */}
          <div className="flex justify-center rounded-xl overflow-hidden border border-gray-200">
            <img
              src={exportedGifUrl}
              alt="Animated GIF preview"
              className="max-w-full rounded-xl"
              style={{ maxHeight: 280 }}
            />
          </div>

          {/* Download button */}
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white shadow-md active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            onClick={handleDirectDownload}
          >
            <Download className="h-4 w-4" /> Download GIF
          </button>

          <p className="text-[10px] text-center text-muted-foreground">
            Tap Download to save · or tap Export again to rebuild with changes
          </p>
        </div>
      )}
    </div>
  );
}
