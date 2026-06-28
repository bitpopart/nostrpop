/**
 * GIF Meme Creator — video-editor style
 *
 * Architecture:
 *  - Fixed-length timeline (total frames at 24 fps)
 *  - Layers = video tracks: each layer has startFrame, endFrame, image/text, x/y/scale
 *  - Scrubber: drag the playhead to preview any frame
 *  - Play/Stop: live preview at 24 fps
 *  - Export: renders every frame of the timeline → GIF
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppMedia } from '@/hooks/useAppContent';
import { useEmojiPacks } from '@/hooks/useEmojiPacks';
import { GifEncoder } from '@/lib/gifEncoder';
import {
  Plus, Trash2, Play, Pause, Loader2,
  LayoutTemplate, UserCircle2, Sticker, Type,
  Image as ImageIcon, Download, X, Layers,
  ChevronLeft, ChevronRight, CheckCircle2,
  SkipBack, SkipForward,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const FPS        = 24;
const CANVAS_W   = 480;
const CANVAS_H   = 480;
const DISPLAY_W  = 320; // preview display width (px)
const TIMELINE_H = 28;  // px per layer track

const MEME_FONTS = [
  { label: 'Impact',     value: 'Impact' },
  { label: 'Arial Black',value: 'Arial Black' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Marker',     value: 'Permanent Marker' },
  { label: 'Oswald',     value: 'Oswald Variable' },
  { label: 'Verdana',    value: 'Verdana' },
];

const POP_COLORS = [
  '#FFFFFF','#000000','#FF0080','#FF4500','#FFD700',
  '#00FF41','#00BFFF','#FF69B4','#FF1493','#FF6600',
  '#FFFF00','#39FF14','#00FFFF','#BF00FF','#FF0000',
];

const TRACK_COLORS = [
  'bg-blue-500','bg-purple-500','bg-pink-500','bg-orange-500',
  'bg-teal-500','bg-green-500','bg-red-500','bg-yellow-500',
];

// ── Types ─────────────────────────────────────────────────────────────────────

type LayerKind = 'image' | 'text';

interface Layer {
  id: string;
  kind: LayerKind;
  // timeline span (frame indices, inclusive)
  startFrame: number;
  endFrame: number;
  // image layer
  url: string;
  isAnimatedGif: boolean;
  gifFrames: string[];    // extracted gif frames as data urls (if animated gif)
  gifFps: number;         // gif's own frame rate
  // text layer
  text: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  textPosition: 'top' | 'center' | 'bottom';
  // spatial
  x: number;   // 0..CANVAS_W
  y: number;   // 0..CANVAS_H
  scale: number; // 0..2 (1 = 100%)
  opacity: number; // 0..1
  // label (auto-generated)
  label: string;
}

interface Project {
  totalFrames: number;
  bgColor: string;
  layers: Layer[];
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

function makeImageLayer(url: string, totalFrames: number, label: string): Layer {
  return {
    id: uid(), kind: 'image',
    startFrame: 0, endFrame: totalFrames - 1,
    url, isAnimatedGif: false, gifFrames: [], gifFps: FPS,
    text: '', fontFamily: 'Impact', fontSize: 48,
    textColor: '#FF0080', textPosition: 'bottom',
    x: 0, y: 0, scale: 1, opacity: 1, label,
  };
}

function makeTextLayer(totalFrames: number): Layer {
  return {
    id: uid(), kind: 'text',
    startFrame: 0, endFrame: totalFrames - 1,
    url: '', isAnimatedGif: false, gifFrames: [], gifFps: FPS,
    text: 'Your text here', fontFamily: 'Impact', fontSize: 60,
    textColor: '#FF0080', textPosition: 'bottom',
    x: 0, y: 0, scale: 1, opacity: 1, label: 'Text',
  };
}

// ── Detect animated GIF via omggif-free approach ──────────────────────────────
// We extract frames from animated GIFs using canvas + ImageDecoder fallback

async function extractGifFrames(url: string): Promise<{ frames: string[]; fps: number }> {
  // Try ImageDecoder API (Chrome 94+, Safari 16.4+)
  if ('ImageDecoder' in window) {
    try {
      let blob: Blob;
      try {
        const res = await fetch(url);
        blob = await res.blob();
      } catch {
        const res = await fetch(`https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`);
        blob = await res.blob();
      }
      // @ts-expect-error ImageDecoder not yet in TS types
      const decoder = new ImageDecoder({ data: blob.stream(), type: 'image/gif' });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      const count = track?.frameCount ?? 1;
      if (count <= 1) return { frames: [], fps: FPS };

      const offscreen = document.createElement('canvas');
      offscreen.width = CANVAS_W; offscreen.height = CANVAS_H;
      const ctx = offscreen.getContext('2d')!;
      const frames: string[] = [];
      let totalDelay = 0;

      for (let i = 0; i < count; i++) {
        const result = await decoder.decode({ frameIndex: i });
        const bmp = result.image as ImageBitmap;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.drawImage(bmp, 0, 0, CANVAS_W, CANVAS_H);
        frames.push(offscreen.toDataURL());
        // @ts-expect-error duration in microseconds
        totalDelay += (result.image.duration ?? 100000) / 1000; // µs → ms
        bmp.close();
      }
      const avgDelay = totalDelay / count;
      const fps = Math.round(1000 / Math.max(10, avgDelay));
      return { frames, fps };
    } catch {
      // fall through
    }
  }
  return { frames: [], fps: FPS };
}

// ── Image loader with CORS proxy fallback ─────────────────────────────────────

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const try1 = (src: string, tried: boolean) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (!tried) try1(`https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`, true);
        else reject(new Error(`Cannot load ${url}`));
      };
      img.src = src;
    };
    try1(url, false);
  });
}

// ── Canvas rendering ──────────────────────────────────────────────────────────

function renderTimelineFrame(
  ctx: CanvasRenderingContext2D,
  project: Project,
  frameIdx: number,
  imgCache: Map<string, HTMLImageElement>,
  W = CANVAS_W,
  H = CANVAS_H,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = project.bgColor;
  ctx.fillRect(0, 0, W, H);

  // Render layers bottom → top
  for (const layer of project.layers) {
    if (frameIdx < layer.startFrame || frameIdx > layer.endFrame) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    if (layer.kind === 'image' && layer.url) {
      let imgSrc: HTMLImageElement | null = null;

      if (layer.isAnimatedGif && layer.gifFrames.length > 0) {
        // Map project frame to gif frame
        const localFrame = frameIdx - layer.startFrame;
        const gifFrameIdx = localFrame % layer.gifFrames.length;
        const frameUrl = layer.gifFrames[gifFrameIdx];
        imgSrc = imgCache.get(frameUrl) ?? null;
      } else {
        imgSrc = imgCache.get(layer.url) ?? null;
      }

      if (imgSrc?.complete && imgSrc.naturalWidth > 0) {
        const ratio = imgSrc.naturalWidth / imgSrc.naturalHeight;
        const base = W * layer.scale;
        let dw = base, dh = base;
        if (ratio > 1) dh = base / ratio; else dw = base * ratio;
        const dx = layer.x + (W * layer.scale - dw) / 2;
        const dy = layer.y + (W * layer.scale - dh) / 2;
        ctx.drawImage(imgSrc, dx, dy, dw, dh);
      }
    } else if (layer.kind === 'text' && layer.text) {
      const fs = Math.round(layer.fontSize * (W / CANVAS_W));
      ctx.font = `bold ${fs}px "${layer.fontFamily}"`;
      ctx.fillStyle = layer.textColor;
      ctx.strokeStyle = layer.textColor === '#FFFFFF' ? '#000' : '#FFF';
      ctx.lineWidth = Math.max(2, fs * 0.06);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      let ty = H / 2;
      if (layer.textPosition === 'top')    ty = fs + 10;
      if (layer.textPosition === 'bottom') ty = H - 16;
      ctx.strokeText(layer.text, W / 2 + layer.x, ty + layer.y);
      ctx.fillText(layer.text,   W / 2 + layer.x, ty + layer.y);
    }

    ctx.restore();
  }
}

// ── Picker tab ────────────────────────────────────────────────────────────────

type PickerTab = 'templates' | 'pops' | 'icons' | 'emojis';

// ── Main Component ────────────────────────────────────────────────────────────

interface GifMemeCreatorProps {
  onSave: (url: string, title: string) => void;
}

export function GifMemeCreator({ onSave }: GifMemeCreatorProps) {
  // ── Project state ──────────────────────────────────────────────────────────
  const [project, setProject] = useState<Project>({
    totalFrames: FPS * 3, // 3 seconds default
    bgColor: '#FFFFFF',
    layers: [],
  });

  // ── Playback ───────────────────────────────────────────────────────────────
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Selection ──────────────────────────────────────────────────────────────
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // ── Asset picker ───────────────────────────────────────────────────────────
  const [pickerTab, setPickerTab]   = useState<PickerTab>('templates');
  const [showPicker, setShowPicker] = useState(false);

  // ── Export ─────────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const exportedBlobRef = useRef<Blob | null>(null);

  // ── Canvas & images ────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgCache  = useRef(new Map<string, HTMLImageElement>());
  const [, forceRender] = useState(0);

  // ── Media data ─────────────────────────────────────────────────────────────
  const { data: templates = [], isLoading: tLoading } = useAppMedia('app-meme-template');
  const { data: pops = [],      isLoading: pLoading } = useAppMedia('app-pop');
  const { data: icons = [],     isLoading: iLoading } = useAppMedia('app-meme-icon');
  const { data: emojiPacks = [], isLoading: eLoading } = useEmojiPacks();
  const emojis = useMemo(
    () => emojiPacks.flatMap(p => p.emojis.map(e => ({ id:`${p.id}:${e.shortcode}`, image_url: e.url, title: e.shortcode }))),
    [emojiPacks],
  );

  const pickerItems = useMemo(() => {
    const src = pickerTab === 'templates' ? templates
              : pickerTab === 'pops'      ? pops
              : pickerTab === 'icons'     ? icons
              : emojis;
    return src.map(i => ({ id: i.id, url: i.image_url, label: i.title }));
  }, [pickerTab, templates, pops, icons, emojis]);

  const pickerLoading = pickerTab === 'templates' ? tLoading
                      : pickerTab === 'pops'      ? pLoading
                      : pickerTab === 'icons'     ? iLoading : eLoading;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const selectedLayer = useMemo(
    () => project.layers.find(l => l.id === selectedLayerId) ?? null,
    [project.layers, selectedLayerId],
  );

  const totalSeconds = project.totalFrames / FPS;

  function updateProject(patch: Partial<Project>) {
    setProject(p => ({ ...p, ...patch }));
  }

  function updateLayer(id: string, patch: Partial<Layer>) {
    setProject(p => ({
      ...p,
      layers: p.layers.map(l => l.id === id ? { ...l, ...patch } : l),
    }));
  }

  function deleteLayer(id: string) {
    setProject(p => ({ ...p, layers: p.layers.filter(l => l.id !== id) }));
    if (selectedLayerId === id) setSelectedLayerId(null);
  }

  function moveLayerUp(id: string) {
    setProject(p => {
      const idx = p.layers.findIndex(l => l.id === id);
      if (idx >= p.layers.length - 1) return p;
      const next = [...p.layers];
      [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
      return { ...p, layers: next };
    });
  }

  function moveLayerDown(id: string) {
    setProject(p => {
      const idx = p.layers.findIndex(l => l.id === id);
      if (idx <= 0) return p;
      const next = [...p.layers];
      [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
      return { ...p, layers: next };
    });
  }

  // ── Add image layer ────────────────────────────────────────────────────────

  const addImageLayer = useCallback(async (url: string, label: string) => {
    // Detect if it's an animated GIF
    const isGif = url.toLowerCase().includes('.gif') || url.includes('gif');
    let gifFrames: string[] = [];
    let gifFps = FPS;
    let layerFrames = project.totalFrames;

    if (isGif) {
      const result = await extractGifFrames(url);
      gifFrames = result.frames;
      gifFps = result.fps;
      if (gifFrames.length > 1) {
        // Set layer duration to match the gif's natural duration
        layerFrames = Math.round(gifFrames.length * FPS / gifFps);
        // Extend project timeline if needed
        if (layerFrames > project.totalFrames) {
          setProject(p => ({ ...p, totalFrames: layerFrames }));
        }
        // Preload gif frames
        gifFrames.forEach(src => {
          if (!imgCache.current.has(src)) {
            loadImg(src).then(img => { imgCache.current.set(src, img); forceRender(v => v+1); }).catch(() => {});
          }
        });
      }
    }

    // Preload the static image too
    if (!imgCache.current.has(url)) {
      loadImg(url).then(img => { imgCache.current.set(url, img); forceRender(v => v+1); }).catch(() => {});
    }

    const layer: Layer = {
      ...makeImageLayer(url, project.totalFrames, label),
      endFrame: Math.min(layerFrames - 1, project.totalFrames - 1),
      isAnimatedGif: gifFrames.length > 1,
      gifFrames,
      gifFps,
    };
    setProject(p => ({ ...p, layers: [...p.layers, layer] }));
    setSelectedLayerId(layer.id);
    setShowPicker(false);
  }, [project.totalFrames]);

  const addTextLayer = useCallback(() => {
    const layer = makeTextLayer(project.totalFrames);
    setProject(p => ({ ...p, layers: [...p.layers, layer] }));
    setSelectedLayerId(layer.id);
  }, [project.totalFrames]);

  // ── Preload new image URLs when project changes ────────────────────────────

  useEffect(() => {
    project.layers.forEach(layer => {
      const urls = [
        layer.url,
        ...layer.gifFrames,
      ].filter(Boolean);
      urls.forEach(url => {
        if (!imgCache.current.has(url)) {
          loadImg(url).then(img => { imgCache.current.set(url, img); forceRender(v => v+1); }).catch(() => {});
        }
      });
    });
  }, [project.layers]);

  // ── Canvas draw ────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderTimelineFrame(ctx, project, currentFrame, imgCache.current, CANVAS_W, CANVAS_H);
  }, [project, currentFrame, /* forceRender trigger handled by state */]);

  // ── Playback ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    if (!isPlaying) return;
    playTimerRef.current = setInterval(() => {
      setCurrentFrame(f => {
        const next = f + 1;
        if (next >= project.totalFrames) { setIsPlaying(false); return 0; }
        return next;
      });
    }, 1000 / FPS);
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, [isPlaying, project.totalFrames]);

  const togglePlay = () => {
    if (isPlaying) { setIsPlaying(false); return; }
    if (currentFrame >= project.totalFrames - 1) setCurrentFrame(0);
    setIsPlaying(true);
  };

  // ── Timeline scrubber ──────────────────────────────────────────────────────

  const timelineRef = useRef<HTMLDivElement>(null);

  const scrubToX = useCallback((clientX: number) => {
    const el = timelineRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    setCurrentFrame(Math.round(ratio * (project.totalFrames - 1)));
  }, [project.totalFrames]);

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportedUrl(null);

    try {
      // Preload all image assets
      const allUrls = [
        ...new Set(project.layers.flatMap(l => [l.url, ...l.gifFrames]).filter(Boolean)),
      ];
      await Promise.all(allUrls.map(url =>
        imgCache.current.has(url)
          ? Promise.resolve()
          : loadImg(url).then(img => { imgCache.current.set(url, img); }).catch(() => {}),
      ));

      const encoder = new GifEncoder(CANVAS_W, CANVAS_H);
      const off = document.createElement('canvas');
      off.width = CANVAS_W; off.height = CANVAS_H;
      const ctx = off.getContext('2d')!;

      for (let f = 0; f < project.totalFrames; f++) {
        renderTimelineFrame(ctx, project, f, imgCache.current);
        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        } catch {
          // Canvas tainted — reload via proxy
          const proxyCache = new Map<string, HTMLImageElement>();
          await Promise.all(project.layers.flatMap(l => [l.url, ...l.gifFrames].filter(Boolean)).map(url =>
            new Promise<void>(resolve => {
              const img = new window.Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => { proxyCache.set(url, img); resolve(); };
              img.onerror = () => resolve();
              img.src = `https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`;
            }),
          ));
          const merged = new Map([...imgCache.current, ...proxyCache]);
          renderTimelineFrame(ctx, project, f, merged);
          imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        }
        encoder.addFrame(imageData.data, Math.round(1000 / FPS));
        setExportProgress(Math.round(((f + 1) / project.totalFrames) * 100));
        // Yield to browser every 8 frames to avoid locking UI
        if (f % 8 === 0) await new Promise(r => setTimeout(r, 0));
      }

      const blob = encoder.finish();
      console.log('[GifMemeCreator] exported', blob.size, 'bytes,', project.totalFrames, 'frames');
      exportedBlobRef.current = blob;
      const gifUrl = URL.createObjectURL(blob);
      setExportedUrl(gifUrl);
      onSave(gifUrl, 'My BitPopArt GIF Meme');
    } catch (err) {
      console.error('[GifMemeCreator] export error', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    const blob = exportedBlobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `bitpopart-gif-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  };

  // ── Duration presets ───────────────────────────────────────────────────────

  const durationPresets = [1, 2, 3, 4, 5, 8, 10];

  // ── Render ─────────────────────────────────────────────────────────────────

  const framesPct = (f: number) => `${((f / Math.max(1, project.totalFrames - 1)) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-0 select-none">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-t-xl">
        <Play className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight">GIF Meme Creator</p>
          <p className="text-[10px] text-white/70">
            {FPS}fps · {project.totalFrames} frames · {totalSeconds.toFixed(1)}s
          </p>
        </div>
        <Badge className="text-[10px] bg-white/20 text-white border-0 shrink-0">
          {project.layers.length} layer{project.layers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* ── CANVAS PREVIEW ──────────────────────────────────────────────── */}
      <div className="relative bg-white flex items-center justify-center" style={{ minHeight: DISPLAY_W }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block"
          style={{ width: DISPLAY_W, height: DISPLAY_W }}
        />
        {/* Frame counter overlay */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          {currentFrame + 1} / {project.totalFrames}
        </div>
        {/* BG colour indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
          <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: project.bgColor }} />
          <span className="text-[9px] text-white/70">BG</span>
        </div>
      </div>

      {/* ── TRANSPORT ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border-b border-gray-800">
        {/* Skip to start */}
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => { setIsPlaying(false); setCurrentFrame(0); }}
          title="Go to start"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        {/* Play/Pause */}
        <button
          className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center transition-colors"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        {/* Skip to end */}
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => { setIsPlaying(false); setCurrentFrame(project.totalFrames - 1); }}
          title="Go to end"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        {/* Frame stepper */}
        <button
          className="text-gray-400 hover:text-white ml-1 transition-colors"
          onClick={() => setCurrentFrame(f => Math.max(0, f - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => setCurrentFrame(f => Math.min(project.totalFrames - 1, f + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Timecode */}
        <span className="text-[11px] text-gray-400 font-mono ml-auto">
          {(currentFrame / FPS).toFixed(2)}s
        </span>

        {/* Duration selector */}
        <Select
          value={String(project.totalFrames)}
          onValueChange={v => { setIsPlaying(false); updateProject({ totalFrames: Number(v) }); setCurrentFrame(0); }}
        >
          <SelectTrigger className="h-6 text-[10px] w-20 bg-gray-800 border-gray-700 text-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {durationPresets.map(s => (
              <SelectItem key={s} value={String(s * FPS)}>{s}s</SelectItem>
            ))}
            <SelectItem value={String(FPS * 15)}>15s</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── TIMELINE ────────────────────────────────────────────────────── */}
      <div className="bg-[#141414] px-2 pb-2 pt-1 border-b border-gray-800">
        {/* Time ruler */}
        <div className="flex items-center mb-0.5 pl-[72px]">
          {Array.from({ length: Math.ceil(totalSeconds) + 1 }).map((_, i) => (
            <div
              key={i}
              className="text-[8px] text-gray-600 font-mono"
              style={{ width: `${(FPS / project.totalFrames) * 100}%`, position: 'absolute',
                       left: `calc(72px + ${(i * FPS / project.totalFrames) * 100}%)` }}
            >
              {i}s
            </div>
          ))}
        </div>

        {/* Scrubber track */}
        <div className="relative pl-[72px] mb-1" style={{ height: 16 }}>
          <div
            ref={timelineRef}
            className="absolute inset-y-0 right-0 left-[72px] bg-gray-800 rounded cursor-pointer"
            style={{ marginLeft: 0 }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); scrubToX(e.clientX); setIsPlaying(false); }}
            onPointerMove={e => { if (e.buttons) scrubToX(e.clientX); }}
          >
            {/* Tick marks */}
            {Array.from({ length: project.totalFrames }).map((_, i) => (
              i % FPS === 0 ? (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-gray-600 opacity-50"
                  style={{ left: framesPct(i) }}
                />
              ) : null
            ))}
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-400 z-10"
              style={{ left: framesPct(currentFrame) }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-400 rotate-45" />
            </div>
          </div>
        </div>

        {/* Layer tracks */}
        {project.layers.length === 0 ? (
          <div className="text-[10px] text-gray-600 text-center py-2 pl-[72px]">
            Add layers below to build your animation
          </div>
        ) : (
          <div className="space-y-0.5">
            {[...project.layers].reverse().map((layer, revIdx) => {
              const realIdx = project.layers.length - 1 - revIdx;
              const color = TRACK_COLORS[realIdx % TRACK_COLORS.length];
              const isSelected = layer.id === selectedLayerId;
              const isActive = currentFrame >= layer.startFrame && currentFrame <= layer.endFrame;

              return (
                <div
                  key={layer.id}
                  className={`flex items-center gap-1 cursor-pointer rounded transition-colors ${isSelected ? 'bg-gray-700/60' : 'hover:bg-gray-800/40'}`}
                  style={{ height: TIMELINE_H }}
                  onClick={() => setSelectedLayerId(isSelected ? null : layer.id)}
                >
                  {/* Layer name */}
                  <div className="w-[68px] shrink-0 flex items-center gap-1 px-1">
                    <div className={`w-1.5 h-4 rounded-sm shrink-0 ${color} ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                    <span className="text-[9px] text-gray-300 truncate leading-tight max-w-[50px]">
                      {layer.label}
                    </span>
                  </div>

                  {/* Track bar */}
                  <div className="relative flex-1 h-full">
                    {/* Bar showing the layer's span */}
                    <div
                      className={`absolute top-1 bottom-1 rounded ${color} ${isActive ? 'opacity-80' : 'opacity-30'} ${isSelected ? 'ring-1 ring-white/50' : ''}`}
                      style={{
                        left:  framesPct(layer.startFrame),
                        width: `${((layer.endFrame - layer.startFrame + 1) / project.totalFrames) * 100}%`,
                      }}
                    >
                      {/* Drag handles */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                        onPointerDown={e => {
                          e.stopPropagation();
                          e.currentTarget.setPointerCapture(e.pointerId);
                          const tl = timelineRef.current;
                          if (!tl) return;
                          const onMove = (ev: PointerEvent) => {
                            const { left, width } = tl.getBoundingClientRect();
                            const r = Math.max(0, Math.min(1, (ev.clientX - left) / width));
                            const f = Math.round(r * (project.totalFrames - 1));
                            updateLayer(layer.id, { startFrame: Math.min(f, layer.endFrame - 1) });
                          };
                          const up = () => { e.currentTarget.removeEventListener('pointermove', onMove as EventListener); };
                          e.currentTarget.addEventListener('pointermove', onMove as EventListener);
                          e.currentTarget.addEventListener('pointerup', up, { once: true });
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                        onPointerDown={e => {
                          e.stopPropagation();
                          e.currentTarget.setPointerCapture(e.pointerId);
                          const tl = timelineRef.current;
                          if (!tl) return;
                          const onMove = (ev: PointerEvent) => {
                            const { left, width } = tl.getBoundingClientRect();
                            const r = Math.max(0, Math.min(1, (ev.clientX - left) / width));
                            const f = Math.round(r * (project.totalFrames - 1));
                            updateLayer(layer.id, { endFrame: Math.max(f, layer.startFrame + 1) });
                          };
                          const up = () => { e.currentTarget.removeEventListener('pointermove', onMove as EventListener); };
                          e.currentTarget.addEventListener('pointermove', onMove as EventListener);
                          e.currentTarget.addEventListener('pointerup', up, { once: true });
                        }}
                      />
                    </div>
                    {/* Playhead line */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-purple-400/50 pointer-events-none z-10"
                      style={{ left: framesPct(currentFrame) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ADD BUTTONS ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-3 py-2 bg-[#1a1a1a] border-b border-gray-800">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
          onClick={() => { setShowPicker(p => !p); }}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          + Image Layer
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors"
          onClick={addTextLayer}
        >
          <Type className="h-3.5 w-3.5" />
          + Text Layer
        </button>
        {/* BG color */}
        <div className="flex items-center gap-1">
          {POP_COLORS.slice(0, 6).map(c => (
            <button
              key={c}
              className={`w-5 h-5 rounded-full border-2 shrink-0 transition-transform hover:scale-110 ${project.bgColor === c ? 'border-purple-400 scale-110' : 'border-transparent'}`}
              style={{ background: c, boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #ccc' : undefined }}
              onClick={() => updateProject({ bgColor: c })}
              title={`BG: ${c}`}
            />
          ))}
        </div>
      </div>

      {/* ── IMAGE PICKER ─────────────────────────────────────────────────── */}
      {showPicker && (
        <div className="bg-[#1c1c1c] border-b border-gray-800">
          {/* Picker tabs */}
          <div className="flex border-b border-gray-800">
            {([
              { id: 'templates' as PickerTab, label: 'Templates', icon: <LayoutTemplate className="h-3 w-3" /> },
              { id: 'pops'      as PickerTab, label: 'Pops',      icon: <UserCircle2 className="h-3 w-3" /> },
              { id: 'icons'     as PickerTab, label: 'Icons',     icon: <Sticker className="h-3 w-3" /> },
              { id: 'emojis'    as PickerTab, label: 'Emojis',    icon: <span className="text-[10px]">😄</span> },
            ] as { id: PickerTab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${pickerTab === tab.id ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setPickerTab(tab.id)}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
            <button className="px-3 text-gray-500 hover:text-white" onClick={() => setShowPicker(false)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Grid */}
          <div className="p-2">
            {pickerLoading ? (
              <div className="flex gap-2">
                {[...Array(5)].map((_,i) => <Skeleton key={i} className="w-14 h-14 rounded-lg bg-gray-700" />)}
              </div>
            ) : pickerItems.length === 0 ? (
              <p className="text-[10px] text-gray-500 text-center py-3">Nothing here yet</p>
            ) : (
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto">
                {pickerItems.map(item => (
                  <button
                    key={item.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-purple-400 transition-all bg-gray-800"
                    onClick={() => addImageLayer(item.url, item.label)}
                    title={item.label}
                  >
                    <img src={item.url} alt={item.label} className="w-full h-full object-contain p-0.5" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SELECTED LAYER PROPERTIES ────────────────────────────────────── */}
      {selectedLayer ? (
        <div className="bg-[#1c1c1c] border-b border-gray-800 p-3 space-y-2.5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-bold text-gray-200 flex-1 truncate">
              {selectedLayer.label}
              {selectedLayer.isAnimatedGif && (
                <span className="ml-1.5 text-[9px] text-purple-400 font-normal">● animated GIF ({selectedLayer.gifFrames.length} frames @ {selectedLayer.gifFps}fps)</span>
              )}
            </span>
            {/* Delete */}
            <button
              className="p-1 rounded hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-colors"
              onClick={() => deleteLayer(selectedLayer.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {/* Layer order */}
            <button className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-200 transition-colors" onClick={() => moveLayerUp(selectedLayer.id)} title="Bring forward">↑</button>
            <button className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-200 transition-colors" onClick={() => moveLayerDown(selectedLayer.id)} title="Send backward">↓</button>
          </div>

          {/* Timeline span */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-wide">Start frame</label>
              <input
                type="number"
                min={0}
                max={selectedLayer.endFrame - 1}
                value={selectedLayer.startFrame}
                onChange={e => updateLayer(selectedLayer.id, { startFrame: Math.max(0, Math.min(Number(e.target.value), selectedLayer.endFrame - 1)) })}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 uppercase tracking-wide">End frame</label>
              <input
                type="number"
                min={selectedLayer.startFrame + 1}
                max={project.totalFrames - 1}
                value={selectedLayer.endFrame}
                onChange={e => updateLayer(selectedLayer.id, { endFrame: Math.max(selectedLayer.startFrame + 1, Math.min(Number(e.target.value), project.totalFrames - 1)) })}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Text layer fields */}
          {selectedLayer.kind === 'text' && (
            <div className="space-y-2">
              <Input
                value={selectedLayer.text}
                onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })}
                placeholder="Text content…"
                className="bg-gray-800 border-gray-700 text-gray-200 text-sm h-8"
                style={{ fontSize: 16 }}
              />
              <div className="flex gap-2">
                <Select value={selectedLayer.fontFamily} onValueChange={v => updateLayer(selectedLayer.id, { fontFamily: v })}>
                  <SelectTrigger className="h-7 text-[10px] flex-1 bg-gray-800 border-gray-700 text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEME_FONTS.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLayer.textPosition} onValueChange={v => updateLayer(selectedLayer.id, { textPosition: v as 'top'|'center'|'bottom' })}>
                  <SelectTrigger className="h-7 text-[10px] w-20 bg-gray-800 border-gray-700 text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Font size */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-14">Size {selectedLayer.fontSize}px</span>
                <input type="range" min={12} max={120} value={selectedLayer.fontSize} onChange={e => updateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })} className="flex-1 h-1.5 accent-purple-500" />
              </div>
              {/* Text color */}
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[9px] text-gray-500 mr-1">Color</span>
                {POP_COLORS.map(c => (
                  <button key={c} className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${selectedLayer.textColor === c ? 'border-purple-400 scale-110' : 'border-transparent'}`}
                    style={{ background: c, boxShadow: (c==='#FFFFFF'||c==='#000000') ? 'inset 0 0 0 1px #555' : undefined }}
                    onClick={() => updateLayer(selectedLayer.id, { textColor: c })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Position & scale (both kinds) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-14">X offset</span>
              <input type="range" min={-CANVAS_W/2} max={CANVAS_W/2} step={4} value={selectedLayer.x}
                onChange={e => updateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-purple-500" />
              <span className="text-[9px] text-gray-500 w-8 text-right">{selectedLayer.x}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-14">Y offset</span>
              <input type="range" min={-CANVAS_H/2} max={CANVAS_H/2} step={4} value={selectedLayer.y}
                onChange={e => updateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-purple-500" />
              <span className="text-[9px] text-gray-500 w-8 text-right">{selectedLayer.y}</span>
            </div>
            {selectedLayer.kind === 'image' && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-14">Scale {Math.round(selectedLayer.scale * 100)}%</span>
                <input type="range" min={0.1} max={3} step={0.05} value={selectedLayer.scale}
                  onChange={e => updateLayer(selectedLayer.id, { scale: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-purple-500" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-14">Opacity {Math.round(selectedLayer.opacity * 100)}%</span>
              <input type="range" min={0.05} max={1} step={0.05} value={selectedLayer.opacity}
                onChange={e => updateLayer(selectedLayer.id, { opacity: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-purple-500" />
            </div>
          </div>

          {/* Preset positions (image layers) */}
          {selectedLayer.kind === 'image' && (
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Full',     x: 0,          y: 0,          scale: 1 },
                { label: 'Top-L',   x: -CANVAS_W/4, y: -CANVAS_H/4, scale: 0.5 },
                { label: 'Top-R',   x: CANVAS_W/4,  y: -CANVAS_H/4, scale: 0.5 },
                { label: 'Bot-L',   x: -CANVAS_W/4, y: CANVAS_H/4,  scale: 0.5 },
                { label: 'Bot-R',   x: CANVAS_W/4,  y: CANVAS_H/4,  scale: 0.5 },
                { label: 'Center',  x: 0,           y: 0,           scale: 0.5 },
                { label: 'Tiny',    x: 0,           y: 0,           scale: 0.25 },
              ].map(p => (
                <button
                  key={p.label}
                  className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-[9px] font-medium transition-colors"
                  onClick={() => updateLayer(selectedLayer.id, { x: p.x, y: p.y, scale: p.scale })}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : project.layers.length > 0 ? (
        <div className="bg-[#1c1c1c] border-b border-gray-800 px-3 py-2">
          <p className="text-[10px] text-gray-500 text-center">Click a layer track to select and edit it</p>
        </div>
      ) : null}

      {/* ── EXPORT ──────────────────────────────────────────────────────── */}
      <div className="bg-[#141414] px-3 py-3 rounded-b-xl space-y-2">
        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 60%, #f97316 100%)' }}
          onClick={handleExport}
          disabled={isExporting || project.layers.length === 0}
        >
          {isExporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Encoding GIF… {exportProgress}%</>
          ) : (
            <><Play className="h-4 w-4" /> Export GIF — {project.totalFrames} frames @ {FPS}fps</>
          )}
        </button>

        {/* Progress bar */}
        {isExporting && (
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        )}

        {/* Result */}
        {exportedUrl && !isExporting && (
          <div className="rounded-xl border border-purple-500/50 overflow-hidden bg-black/40 space-y-2 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-sm font-bold text-green-400">GIF Ready!</span>
              <Badge className="bg-purple-900 text-purple-300 border-0 text-[10px] ml-auto">
                {project.totalFrames}f @ {FPS}fps
              </Badge>
            </div>
            <img
              key={exportedUrl}
              src={exportedUrl}
              alt="Exported GIF preview"
              className="w-full rounded-lg"
              style={{ display: 'block', imageRendering: 'auto' }}
              onError={() => console.error('[GifMemeCreator] preview failed')}
              onLoad={() => console.log('[GifMemeCreator] preview loaded')}
            />
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" /> Download GIF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
