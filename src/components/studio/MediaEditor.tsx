/**
 * MediaEditor — video-editor style GIF creator for the Studio page.
 *
 * Based on GifMemeCreator but extended with:
 *  - Animation video files from Nostr as layers (via useAnimations hook)
 *  - Canvas size presets (square, landscape, portrait, banner)
 *  - White light UI matching the Studio design
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppMedia } from '@/hooks/useAppContent';
import { useEmojiPacks } from '@/hooks/useEmojiPacks';
import { useAnimations } from '@/hooks/useAnimations';
import { GifEncoder } from '@/lib/gifEncoder';
import {
  Play, Pause, Loader2,
  LayoutTemplate, UserCircle2, Sticker, Type,
  Image as ImageIcon, Download, X, Layers,
  ChevronLeft, ChevronRight, CheckCircle2,
  SkipBack, SkipForward, Film, Trash2,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const FPS = 24;
const TIMELINE_H = 28;

const CANVAS_PRESETS = [
  { id: 'square',    label: '1:1 Square',    w: 480, h: 480 },
  { id: 'landscape', label: '16:9 Wide',     w: 640, h: 360 },
  { id: 'portrait',  label: '9:16 Portrait', w: 360, h: 640 },
  { id: 'banner',    label: '3:1 Banner',    w: 720, h: 240 },
];

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

type LayerKind = 'image' | 'text' | 'video';

interface Layer {
  id: string;
  kind: LayerKind;
  startFrame: number;
  endFrame: number;
  url: string;
  isAnimatedGif: boolean;
  gifFrames: string[];
  gifFps: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  textPosition: 'top' | 'center' | 'bottom';
  x: number;
  y: number;
  scale: number;
  opacity: number;
  label: string;
}

interface Project {
  totalFrames: number;
  bgColor: string;
  canvasPreset: string;
  layers: Layer[];
}

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

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

function makeVideoLayer(url: string, totalFrames: number, label: string): Layer {
  return {
    id: uid(), kind: 'video',
    startFrame: 0, endFrame: totalFrames - 1,
    url, isAnimatedGif: false, gifFrames: [], gifFps: FPS,
    text: '', fontFamily: 'Impact', fontSize: 48,
    textColor: '#FF0080', textPosition: 'bottom',
    x: 0, y: 0, scale: 1, opacity: 1, label,
  };
}

// ── Detect animated GIF ───────────────────────────────────────────────────────

async function extractGifFrames(url: string, canvasW: number, canvasH: number): Promise<{ frames: string[]; fps: number }> {
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
      offscreen.width = canvasW; offscreen.height = canvasH;
      const ctx = offscreen.getContext('2d')!;
      const frames: string[] = [];
      let totalDelay = 0;

      for (let i = 0; i < count; i++) {
        const result = await decoder.decode({ frameIndex: i });
        const bmp = result.image as ImageBitmap;
        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.drawImage(bmp, 0, 0, canvasW, canvasH);
        frames.push(offscreen.toDataURL());
        // @ts-expect-error duration in microseconds
        totalDelay += (result.image.duration ?? 100000) / 1000;
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

// ── Image loader ──────────────────────────────────────────────────────────────

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
  videoCache: Map<string, HTMLVideoElement>,
  W: number,
  H: number,
) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = project.bgColor;
  ctx.fillRect(0, 0, W, H);

  for (const layer of project.layers) {
    if (frameIdx < layer.startFrame || frameIdx > layer.endFrame) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    if (layer.kind === 'video') {
      const vid = videoCache.get(layer.url);
      if (vid && vid.readyState >= 2) {
        const relFrame = frameIdx - layer.startFrame;
        const targetTime = relFrame / FPS;
        const clampedTime = Math.min(targetTime, vid.duration || targetTime);
        if (Math.abs(vid.currentTime - clampedTime) > 0.05) {
          vid.currentTime = clampedTime;
        }
        const sw = layer.scale * W;
        const sh = layer.scale * H;
        const ox = (W - sw) / 2 + layer.x;
        const oy = (H - sh) / 2 + layer.y;
        try { ctx.drawImage(vid, ox, oy, sw, sh); } catch { /* not ready */ }
      }
    } else if (layer.kind === 'image') {
      let img: HTMLImageElement | undefined;
      if (layer.isAnimatedGif && layer.gifFrames.length > 0) {
        const relFrame = frameIdx - layer.startFrame;
        const gifIdx = Math.floor((relFrame / FPS) * layer.gifFps) % layer.gifFrames.length;
        img = imgCache.get(layer.gifFrames[gifIdx]);
      } else {
        img = imgCache.get(layer.url);
      }
      if (img) {
        const sw = layer.scale * W;
        const sh = layer.scale * H;
        const ox = (W - sw) / 2 + layer.x;
        const oy = (H - sh) / 2 + layer.y;
        ctx.drawImage(img, ox, oy, sw, sh);
      }
    } else if (layer.kind === 'text' && layer.text) {
      const fs = layer.fontSize * (W / 480);
      ctx.font = `bold ${fs}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.textColor;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = fs * 0.08;
      let ty: number;
      if (layer.textPosition === 'top') ty = fs * 1.2 + layer.y;
      else if (layer.textPosition === 'center') ty = H / 2 + layer.y;
      else ty = H - fs * 0.5 + layer.y;
      const tx = W / 2 + layer.x;
      ctx.strokeText(layer.text, tx, ty);
      ctx.fillText(layer.text, tx, ty);
    }

    ctx.restore();
  }
}

// ── Picker tab type ───────────────────────────────────────────────────────────

type PickerTab = 'templates' | 'pops' | 'icons' | 'emojis' | 'videos';

// ── Main Component ────────────────────────────────────────────────────────────

export function MediaEditor() {
  const [project, setProject] = useState<Project>({
    totalFrames: FPS * 3,
    bgColor: '#FFFFFF',
    canvasPreset: 'square',
    layers: [],
  });

  const preset = CANVAS_PRESETS.find(p => p.id === project.canvasPreset) ?? CANVAS_PRESETS[0];
  const CANVAS_W = preset.w;
  const CANVAS_H = preset.h;
  const DISPLAY_W = (project.canvasPreset === 'landscape' || project.canvasPreset === 'banner') ? 480 : 320;
  const DISPLAY_H = Math.round(DISPLAY_W * (CANVAS_H / CANVAS_W));

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [pickerTab, setPickerTab] = useState<PickerTab>('templates');
  const [showPicker, setShowPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const exportedBlobRef = useRef<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgCache = useRef(new Map<string, HTMLImageElement>());
  const videoCache = useRef(new Map<string, HTMLVideoElement>());
  const [, forceRender] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const { data: templates = [], isLoading: tLoading } = useAppMedia('app-meme-template');
  const { data: pops = [],      isLoading: pLoading } = useAppMedia('app-pop');
  const { data: icons = [],     isLoading: iLoading } = useAppMedia('app-meme-icon');
  const { data: emojiPacks = [], isLoading: eLoading } = useEmojiPacks();
  const { data: animations = [], isLoading: vLoading } = useAnimations();

  const emojis = useMemo(
    () => emojiPacks.flatMap(p => p.emojis.map(e => ({ id: `${p.id}:${e.shortcode}`, image_url: e.url, title: e.shortcode }))),
    [emojiPacks],
  );

  const pickerItems = useMemo(() => {
    if (pickerTab === 'videos') return [];
    const src = pickerTab === 'templates' ? templates
              : pickerTab === 'pops'      ? pops
              : pickerTab === 'icons'     ? icons : emojis;
    return src.map(i => ({ id: i.id, url: i.image_url, label: i.title }));
  }, [pickerTab, templates, pops, icons, emojis]);

  const pickerLoading = pickerTab === 'templates' ? tLoading
                      : pickerTab === 'pops'      ? pLoading
                      : pickerTab === 'icons'     ? iLoading
                      : pickerTab === 'videos'    ? vLoading : eLoading;

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
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return { ...p, layers: next };
    });
  }

  function moveLayerDown(id: string) {
    setProject(p => {
      const idx = p.layers.findIndex(l => l.id === id);
      if (idx <= 0) return p;
      const next = [...p.layers];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return { ...p, layers: next };
    });
  }

  const addImageLayer = useCallback(async (url: string, label: string) => {
    const isGif = url.toLowerCase().includes('.gif') || url.includes('gif');
    let gifFrames: string[] = [];
    let gifFps = FPS;
    let layerFrames = project.totalFrames;

    if (isGif) {
      const result = await extractGifFrames(url, CANVAS_W, CANVAS_H);
      gifFrames = result.frames;
      gifFps = result.fps;
      if (gifFrames.length > 1) {
        layerFrames = Math.round(gifFrames.length * FPS / gifFps);
        if (layerFrames > project.totalFrames) {
          setProject(p => ({ ...p, totalFrames: layerFrames }));
        }
        gifFrames.forEach(src => {
          if (!imgCache.current.has(src)) {
            loadImg(src).then(img => { imgCache.current.set(src, img); forceRender(v => v + 1); }).catch(() => {});
          }
        });
      }
    }
    if (!imgCache.current.has(url)) {
      loadImg(url).then(img => { imgCache.current.set(url, img); forceRender(v => v + 1); }).catch(() => {});
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
  }, [project.totalFrames, CANVAS_W, CANVAS_H]);

  const addVideoLayer = useCallback(async (url: string, label: string) => {
    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.preload = 'metadata';
    vid.muted = true;
    vid.src = url;

    const duration = await new Promise<number>((resolve) => {
      vid.onloadedmetadata = () => resolve(vid.duration || 3);
      vid.onerror = () => resolve(3);
      setTimeout(() => resolve(3), 5000);
    });

    const layerFrames = Math.min(Math.round(duration * FPS), FPS * 30);
    if (layerFrames > project.totalFrames) {
      setProject(p => ({ ...p, totalFrames: layerFrames }));
    }
    videoCache.current.set(url, vid);
    forceRender(v => v + 1);

    const layer = makeVideoLayer(url, Math.max(project.totalFrames, layerFrames), label);
    layer.endFrame = layerFrames - 1;
    setProject(p => ({ ...p, layers: [...p.layers, layer] }));
    setSelectedLayerId(layer.id);
    setShowPicker(false);
  }, [project.totalFrames]);

  const addTextLayer = useCallback(() => {
    const layer = makeTextLayer(project.totalFrames);
    setProject(p => ({ ...p, layers: [...p.layers, layer] }));
    setSelectedLayerId(layer.id);
  }, [project.totalFrames]);

  useEffect(() => {
    project.layers.forEach(layer => {
      if (layer.kind === 'image') {
        const urls = [layer.url, ...layer.gifFrames].filter(Boolean);
        urls.forEach(url => {
          if (!imgCache.current.has(url)) {
            loadImg(url).then(img => { imgCache.current.set(url, img); forceRender(v => v + 1); }).catch(() => {});
          }
        });
      }
    });
  }, [project.layers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderTimelineFrame(ctx, project, currentFrame, imgCache.current, videoCache.current, CANVAS_W, CANVAS_H);
  });

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

  const scrubToX = useCallback((clientX: number) => {
    const el = timelineRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    setCurrentFrame(Math.round(ratio * (project.totalFrames - 1)));
  }, [project.totalFrames]);

  const handlePresetChange = (presetId: string) => {
    setProject(p => ({ ...p, canvasPreset: presetId }));
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportedUrl(null);
    try {
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
        renderTimelineFrame(ctx, project, f, imgCache.current, videoCache.current, CANVAS_W, CANVAS_H);
        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        } catch {
          const proxyCache = new Map<string, HTMLImageElement>();
          await Promise.all(
            project.layers.flatMap(l => [l.url, ...l.gifFrames].filter(Boolean)).map(url =>
              new Promise<void>(resolve => {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => { proxyCache.set(url, img); resolve(); };
                img.onerror = () => resolve();
                img.src = `https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`;
              }),
            ),
          );
          const merged = new Map([...imgCache.current, ...proxyCache]);
          renderTimelineFrame(ctx, project, f, merged, videoCache.current, CANVAS_W, CANVAS_H);
          imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
        }
        encoder.addFrame(imageData.data, Math.round(1000 / FPS));
        setExportProgress(Math.round(((f + 1) / project.totalFrames) * 100));
        if (f % 8 === 0) await new Promise(r => setTimeout(r, 0));
      }

      const blob = encoder.finish();
      exportedBlobRef.current = blob;
      setExportedUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('[MediaEditor] export error', err);
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
    a.download = `bitpopart-media-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  };

  const durationPresets = [1, 2, 3, 4, 5, 8, 10, 15];
  const framesPct = (f: number) => `${((f / Math.max(1, project.totalFrames - 1)) * 100).toFixed(1)}%`;

  return (
    <div className="space-y-0 select-none">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white rounded-t-xl">
        <Film className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight">Media Editor</p>
          <p className="text-[10px] text-white/70">
            {FPS}fps · {project.totalFrames} frames · {totalSeconds.toFixed(1)}s · {CANVAS_W}x{CANVAS_H}px
          </p>
        </div>
        <Badge className="text-[10px] bg-white/20 text-white border-0 shrink-0">
          {project.layers.length} layer{project.layers.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* ── CANVAS SIZE PRESETS ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mr-1">Canvas:</span>
        {CANVAS_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => handlePresetChange(p.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              project.canvasPreset === p.id
                ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── CANVAS PREVIEW ──────────────────────────────────────────────── */}
      <div
        className="relative bg-gray-100 flex items-center justify-center border-b border-gray-200"
        style={{ minHeight: DISPLAY_H + 16 }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block shadow-sm"
          style={{ width: DISPLAY_W, height: DISPLAY_H }}
        />
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          {currentFrame + 1} / {project.totalFrames}
        </div>
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5">
          <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: project.bgColor }} />
          <span className="text-[9px] text-white/80">BG</span>
        </div>
      </div>

      {/* ── TRANSPORT ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
        <button className="text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => { setIsPlaying(false); setCurrentFrame(0); }}>
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center transition-colors"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <button className="text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => { setIsPlaying(false); setCurrentFrame(project.totalFrames - 1); }}>
          <SkipForward className="h-4 w-4" />
        </button>
        <button className="text-gray-500 hover:text-gray-800 ml-1 transition-colors"
          onClick={() => setCurrentFrame(f => Math.max(0, f - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => setCurrentFrame(f => Math.min(project.totalFrames - 1, f + 1))}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="text-[11px] text-gray-500 font-mono ml-auto">
          {(currentFrame / FPS).toFixed(2)}s
        </span>
        <Select
          value={String(project.totalFrames)}
          onValueChange={v => { setIsPlaying(false); updateProject({ totalFrames: Number(v) }); setCurrentFrame(0); }}
        >
          <SelectTrigger className="h-6 text-[10px] w-20 bg-gray-100 border-gray-300 text-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {durationPresets.map(s => (
              <SelectItem key={s} value={String(s * FPS)}>{s}s</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── TIMELINE ────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 px-2 pb-2 pt-1 border-b border-gray-200">
        <div className="flex items-center mb-0.5 pl-[72px]">
          {Array.from({ length: Math.ceil(totalSeconds) + 1 }).map((_, i) => (
            <div
              key={i}
              className="text-[8px] text-gray-400 font-mono"
              style={{ width: `${(FPS / project.totalFrames) * 100}%`, position: 'absolute',
                       left: `calc(72px + ${(i * FPS / project.totalFrames) * 100}%)` }}
            >
              {i}s
            </div>
          ))}
        </div>

        <div className="relative pl-[72px] mb-1" style={{ height: 16 }}>
          <div
            ref={timelineRef}
            className="absolute inset-y-0 right-0 left-[72px] bg-gray-200 rounded cursor-pointer"
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); scrubToX(e.clientX); setIsPlaying(false); }}
            onPointerMove={e => { if (e.buttons) scrubToX(e.clientX); }}
          >
            {Array.from({ length: project.totalFrames }).map((_, i) => (
              i % FPS === 0 ? (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-50"
                  style={{ left: framesPct(i) }} />
              ) : null
            ))}
            <div className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10" style={{ left: framesPct(currentFrame) }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
            </div>
          </div>
        </div>

        {project.layers.length === 0 ? (
          <div className="text-[10px] text-gray-400 text-center py-2 pl-[72px]">
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
                  className={`flex items-center gap-1 cursor-pointer rounded transition-colors ${isSelected ? 'bg-orange-100' : 'hover:bg-gray-100'}`}
                  style={{ height: TIMELINE_H }}
                  onClick={() => setSelectedLayerId(isSelected ? null : layer.id)}
                >
                  <div className="w-[68px] shrink-0 flex items-center gap-1 px-1">
                    <div className={`w-1.5 h-4 rounded-sm shrink-0 ${color} ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                    <span className="text-[9px] text-gray-600 truncate leading-tight max-w-[50px]">
                      {layer.label}
                    </span>
                  </div>
                  <div className="relative flex-1 h-full">
                    <div
                      className={`absolute top-1 bottom-1 rounded ${color} ${isActive ? 'opacity-80' : 'opacity-30'} ${isSelected ? 'ring-1 ring-orange-400' : ''}`}
                      style={{
                        left: framesPct(layer.startFrame),
                        width: `${((layer.endFrame - layer.startFrame + 1) / project.totalFrames) * 100}%`,
                      }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
                        onPointerDown={e => {
                          e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
                          const tl = timelineRef.current; if (!tl) return;
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
                      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize"
                        onPointerDown={e => {
                          e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
                          const tl = timelineRef.current; if (!tl) return;
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
                    <div className="absolute top-0 bottom-0 w-px bg-orange-500/50 pointer-events-none z-10"
                      style={{ left: framesPct(currentFrame) }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ADD BUTTONS ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-3 py-2 bg-white border-b border-gray-200">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold transition-colors"
          onClick={() => { setShowPicker(p => !p); }}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          + Image Layer
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-400 text-white text-xs font-semibold transition-colors"
          onClick={addTextLayer}
        >
          <Type className="h-3.5 w-3.5" />
          + Text
        </button>
        {/* BG color swatches */}
        <div className="flex items-center gap-1">
          {POP_COLORS.slice(0, 5).map(c => (
            <button
              key={c}
              className={`w-5 h-5 rounded-full border-2 shrink-0 transition-transform hover:scale-110 ${project.bgColor === c ? 'border-orange-400 scale-110' : 'border-transparent'}`}
              style={{ background: c, boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #ccc' : undefined }}
              onClick={() => updateProject({ bgColor: c })}
              title={`BG: ${c}`}
            />
          ))}
        </div>
      </div>

      {/* ── IMAGE / VIDEO PICKER ─────────────────────────────────────────── */}
      {showPicker && (
        <div className="bg-white border-b border-gray-200">
          <div className="flex border-b border-gray-200">
            {([
              { id: 'templates' as PickerTab, label: 'Templates', icon: <LayoutTemplate className="h-3 w-3" /> },
              { id: 'pops'      as PickerTab, label: 'Pops',      icon: <UserCircle2 className="h-3 w-3" /> },
              { id: 'icons'     as PickerTab, label: 'Icons',     icon: <Sticker className="h-3 w-3" /> },
              { id: 'emojis'    as PickerTab, label: 'Emoji',     icon: <span className="text-[10px]">😄</span> },
              { id: 'videos'    as PickerTab, label: 'Videos',    icon: <Film className="h-3 w-3" /> },
            ] as { id: PickerTab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${pickerTab === tab.id ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setPickerTab(tab.id)}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
            <button className="px-3 text-gray-400 hover:text-gray-700" onClick={() => setShowPicker(false)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-2">
            {pickerLoading ? (
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="w-14 h-14 rounded-lg bg-gray-100" />)}
              </div>
            ) : pickerTab === 'videos' ? (
              animations.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-3">No animation videos found on this relay</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                  {animations.map(anim => (
                    <button
                      key={anim.id}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-all bg-gray-50"
                      onClick={() => addVideoLayer(anim.video_url, anim.title)}
                      title={anim.title}
                    >
                      {anim.thumb_url ? (
                        <img src={anim.thumb_url} alt={anim.title} className="w-full aspect-video object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                          <Film className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                      <p className="text-[9px] text-gray-600 truncate px-1 py-0.5 bg-white/90">{anim.title}</p>
                    </button>
                  ))}
                </div>
              )
            ) : pickerItems.length === 0 ? (
              <p className="text-[10px] text-gray-400 text-center py-3">Nothing here yet</p>
            ) : (
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto">
                {pickerItems.map(item => (
                  <button
                    key={item.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-all bg-gray-50"
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
        <div className="bg-white border-b border-gray-200 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 flex-1 truncate">
              {selectedLayer.label}
              {selectedLayer.kind === 'video' && (
                <span className="ml-1.5 text-[9px] text-blue-500 font-normal">● video</span>
              )}
              {selectedLayer.isAnimatedGif && (
                <span className="ml-1.5 text-[9px] text-purple-500 font-normal">● animated GIF</span>
              )}
            </span>
            <button className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
              onClick={() => deleteLayer(selectedLayer.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => moveLayerUp(selectedLayer.id)} title="Bring forward">↑</button>
            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => moveLayerDown(selectedLayer.id)} title="Send backward">↓</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 uppercase tracking-wide">Start frame</label>
              <input type="number" min={0} max={selectedLayer.endFrame - 1} value={selectedLayer.startFrame}
                onChange={e => updateLayer(selectedLayer.id, { startFrame: Math.max(0, Math.min(Number(e.target.value), selectedLayer.endFrame - 1)) })}
                className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-xs rounded px-2 py-1" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 uppercase tracking-wide">End frame</label>
              <input type="number" min={selectedLayer.startFrame + 1} max={project.totalFrames - 1} value={selectedLayer.endFrame}
                onChange={e => updateLayer(selectedLayer.id, { endFrame: Math.max(selectedLayer.startFrame + 1, Math.min(Number(e.target.value), project.totalFrames - 1)) })}
                className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-xs rounded px-2 py-1" />
            </div>
          </div>

          {selectedLayer.kind === 'text' && (
            <div className="space-y-2">
              <Input value={selectedLayer.text}
                onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })}
                placeholder="Text content…"
                className="bg-gray-50 border-gray-300 text-gray-700 text-sm h-8"
                style={{ fontSize: 16 }} />
              <div className="flex gap-2">
                <Select value={selectedLayer.fontFamily} onValueChange={v => updateLayer(selectedLayer.id, { fontFamily: v })}>
                  <SelectTrigger className="h-7 text-[10px] flex-1 bg-gray-50 border-gray-300 text-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEME_FONTS.map(f => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedLayer.textPosition} onValueChange={v => updateLayer(selectedLayer.id, { textPosition: v as 'top' | 'center' | 'bottom' })}>
                  <SelectTrigger className="h-7 text-[10px] w-20 bg-gray-50 border-gray-300 text-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-14">Size {selectedLayer.fontSize}px</span>
                <input type="range" min={12} max={120} value={selectedLayer.fontSize}
                  onChange={e => updateLayer(selectedLayer.id, { fontSize: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-orange-500" />
              </div>
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[9px] text-gray-500 mr-1">Color</span>
                {POP_COLORS.map(c => (
                  <button key={c}
                    className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${selectedLayer.textColor === c ? 'border-orange-400 scale-110' : 'border-transparent'}`}
                    style={{ background: c, boxShadow: (c === '#FFFFFF' || c === '#000000') ? 'inset 0 0 0 1px #ccc' : undefined }}
                    onClick={() => updateLayer(selectedLayer.id, { textColor: c })}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-14">X offset</span>
              <input type="range" min={-CANVAS_W / 2} max={CANVAS_W / 2} step={4} value={selectedLayer.x}
                onChange={e => updateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-orange-500" />
              <span className="text-[9px] text-gray-500 w-8 text-right">{selectedLayer.x}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-14">Y offset</span>
              <input type="range" min={-CANVAS_H / 2} max={CANVAS_H / 2} step={4} value={selectedLayer.y}
                onChange={e => updateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-orange-500" />
              <span className="text-[9px] text-gray-500 w-8 text-right">{selectedLayer.y}</span>
            </div>
            {selectedLayer.kind !== 'text' && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-14">Scale {Math.round(selectedLayer.scale * 100)}%</span>
                <input type="range" min={0.1} max={3} step={0.05} value={selectedLayer.scale}
                  onChange={e => updateLayer(selectedLayer.id, { scale: Number(e.target.value) })}
                  className="flex-1 h-1.5 accent-orange-500" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 w-14">Opacity {Math.round(selectedLayer.opacity * 100)}%</span>
              <input type="range" min={0.05} max={1} step={0.05} value={selectedLayer.opacity}
                onChange={e => updateLayer(selectedLayer.id, { opacity: Number(e.target.value) })}
                className="flex-1 h-1.5 accent-orange-500" />
            </div>
          </div>

          {selectedLayer.kind !== 'text' && (
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Full',    x: 0,            y: 0,            scale: 1 },
                { label: 'Top-L',  x: -CANVAS_W / 4, y: -CANVAS_H / 4, scale: 0.5 },
                { label: 'Top-R',  x: CANVAS_W / 4,  y: -CANVAS_H / 4, scale: 0.5 },
                { label: 'Bot-L',  x: -CANVAS_W / 4, y: CANVAS_H / 4,  scale: 0.5 },
                { label: 'Bot-R',  x: CANVAS_W / 4,  y: CANVAS_H / 4,  scale: 0.5 },
                { label: 'Center', x: 0,             y: 0,             scale: 0.5 },
                { label: 'Tiny',   x: 0,             y: 0,             scale: 0.25 },
              ].map(p => (
                <button key={p.label}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-[9px] font-medium transition-colors"
                  onClick={() => updateLayer(selectedLayer.id, { x: p.x, y: p.y, scale: p.scale })}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : project.layers.length > 0 ? (
        <div className="bg-white border-b border-gray-200 px-3 py-2">
          <p className="text-[10px] text-gray-400 text-center">Click a layer track to select and edit it</p>
        </div>
      ) : null}

      {/* ── EXPORT ──────────────────────────────────────────────────────── */}
      <div className="bg-white px-3 py-3 rounded-b-xl space-y-2 border-t border-gray-200">
        <button
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #ec4899 60%, #8b5cf6 100%)' }}
          onClick={handleExport}
          disabled={isExporting || project.layers.length === 0}
        >
          {isExporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Encoding GIF… {exportProgress}%</>
          ) : (
            <><Film className="h-4 w-4" /> Export GIF — {project.totalFrames} frames @ {FPS}fps</>
          )}
        </button>

        {isExporting && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
              style={{ width: `${exportProgress}%` }} />
          </div>
        )}

        {exportedUrl && !isExporting && (
          <div className="rounded-xl border border-orange-300 overflow-hidden bg-orange-50 space-y-2 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-sm font-bold text-green-600">GIF Ready!</span>
              <Badge className="bg-orange-100 text-orange-600 border-0 text-[10px] ml-auto">
                {project.totalFrames}f @ {FPS}fps
              </Badge>
            </div>
            <img
              key={exportedUrl}
              src={exportedUrl}
              alt="Exported GIF preview"
              className="w-full rounded-lg"
              style={{ display: 'block', imageRendering: 'auto' }}
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
