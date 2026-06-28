import { useState, useRef, useCallback, useEffect } from 'react';
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
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const GIF_SIZE = 480; // exported GIF resolution
const DISPLAY_MAX = 280; // max display width

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

interface GifFrame {
  id: string;
  bgColor: string;
  backgroundImageUrl: string;   // base image (template/pop/icon)
  text: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  textPosition: 'top' | 'center' | 'bottom';
  delay: number; // ms per frame
}

function makeFrame(overrides?: Partial<GifFrame>): GifFrame {
  return {
    id: `frame-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    bgColor: '#FFFFFF',
    backgroundImageUrl: '',
    text: '',
    textColor: '#FF0080',
    fontSize: 48,
    fontFamily: 'Impact',
    textPosition: 'bottom',
    delay: 500,
    ...overrides,
  };
}

// Render a single frame onto a canvas
function renderFrame(
  canvas: HTMLCanvasElement,
  frame: GifFrame,
  imgCache: Map<string, HTMLImageElement>,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = frame.bgColor;
  ctx.fillRect(0, 0, W, H);

  const img = frame.backgroundImageUrl ? imgCache.get(frame.backgroundImageUrl) : undefined;
  if (img?.complete && img.naturalWidth > 0) {
    // Fit image keeping aspect ratio, centered
    const ratio = img.naturalWidth / img.naturalHeight;
    let dw = W, dh = W / ratio;
    if (dh > H) { dh = H; dw = H * ratio; }
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  if (frame.text) {
    const fs = frame.fontSize;
    ctx.font = `bold ${fs}px "${frame.fontFamily}"`;
    ctx.fillStyle = frame.textColor;
    ctx.strokeStyle = frame.textColor === '#FFFFFF' ? '#000000' : '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';

    let y = H / 2;
    if (frame.textPosition === 'top') y = fs + 10;
    else if (frame.textPosition === 'bottom') y = H - 20;

    ctx.strokeText(frame.text, W / 2, y);
    ctx.fillText(frame.text, W / 2, y);
  }
}

// Async load an image with CORS proxy fallback
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const tryLoad = (src: string, tried: boolean) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (!tried) {
          tryLoad(`https://proxy.shakespeare.diy/?url=${encodeURIComponent(url)}`, true);
        } else {
          reject(new Error(`Failed to load image: ${url}`));
        }
      };
      img.src = src;
    };
    tryLoad(url, false);
  });
}

type PickerTab = 'templates' | 'pops' | 'icons' | 'emojis';

interface GifMemeCreatorProps {
  onSave: (dataUrl: string, title: string) => void;
}

export function GifMemeCreator({ onSave }: GifMemeCreatorProps) {
  const [frames, setFrames] = useState<GifFrame[]>([makeFrame()]);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [pickerTab, setPickerTab] = useState<PickerTab>('templates');
  const [isExporting, setIsExporting] = useState(false);
  const [previewGif, setPreviewGif] = useState<string | null>(null);
  const [previewFrameIdx, setPreviewFrameIdx] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgCache = useRef(new Map<string, HTMLImageElement>());
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeFrame = frames[activeFrameIdx] ?? frames[0];

  // Media data
  const { data: memeTemplates = [], isLoading: templatesLoading } = useAppMedia('app-meme-template');
  const { data: pops = [], isLoading: popsLoading } = useAppMedia('app-pop');
  const { data: icons = [], isLoading: iconsLoading } = useAppMedia('app-meme-icon');
  const { data: emojiPacks = [], isLoading: emojisLoading } = useEmojiPacks();
  const emojiItems = emojiPacks.flatMap(p =>
    p.emojis.map(e => ({ id: `${p.id}:${e.shortcode}`, image_url: e.url, title: e.shortcode }))
  );

  // Preload images when frame background changes
  useEffect(() => {
    const urls = frames.map(f => f.backgroundImageUrl).filter(Boolean);
    urls.forEach(url => {
      if (!imgCache.current.has(url)) {
        loadImage(url)
          .then(img => {
            imgCache.current.set(url, img);
            redrawActive();
          })
          .catch(() => {});
      }
    });
  }, [frames]);

  // Redraw active frame on canvas
  const redrawActive = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderFrame(canvas, frames[activeFrameIdx] ?? frames[0], imgCache.current);
  }, [frames, activeFrameIdx]);

  useEffect(() => { redrawActive(); }, [redrawActive]);

  // Animate preview across frames
  useEffect(() => {
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    if (frames.length <= 1) { setPreviewFrameIdx(0); return; }
    previewTimerRef.current = setInterval(() => {
      setPreviewFrameIdx(i => (i + 1) % frames.length);
    }, activeFrame.delay);
    return () => { if (previewTimerRef.current) clearInterval(previewTimerRef.current); };
  }, [frames.length, activeFrame.delay]);

  // Live preview renders each frame in sequence
  const previewFrame = frames[previewFrameIdx] ?? frames[0];

  const updateActiveFrame = (patch: Partial<GifFrame>) => {
    setFrames(prev => prev.map((f, i) => i === activeFrameIdx ? { ...f, ...patch } : f));
  };

  const addFrame = () => {
    const newFrame = makeFrame({ ...activeFrame, id: `frame-${Date.now()}` });
    setFrames(prev => [...prev, newFrame]);
    setActiveFrameIdx(frames.length);
  };

  const duplicateFrame = (idx: number) => {
    const clone = { ...frames[idx], id: `frame-${Date.now()}` };
    const next = [...frames.slice(0, idx + 1), clone, ...frames.slice(idx + 1)];
    setFrames(next);
    setActiveFrameIdx(idx + 1);
  };

  const removeFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const next = frames.filter((_, i) => i !== idx);
    setFrames(next);
    setActiveFrameIdx(Math.min(activeFrameIdx, next.length - 1));
  };

  const moveFrame = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= frames.length) return;
    const next = [...frames];
    [next[idx], next[to]] = [next[to], next[idx]];
    setFrames(next);
    setActiveFrameIdx(to);
  };

  const setBackground = (url: string) => {
    updateActiveFrame({ backgroundImageUrl: url });
  };

  // Export GIF
  const handleExport = async () => {
    setIsExporting(true);
    setPreviewGif(null);
    try {
      // Preload all images
      const uniqueUrls = [...new Set(frames.map(f => f.backgroundImageUrl).filter(Boolean))];
      await Promise.all(
        uniqueUrls.map(url =>
          !imgCache.current.has(url)
            ? loadImage(url).then(img => { imgCache.current.set(url, img); }).catch(() => {})
            : Promise.resolve()
        )
      );

      const encoder = new GifEncoder(GIF_SIZE, GIF_SIZE);
      const offscreen = document.createElement('canvas');
      offscreen.width = GIF_SIZE;
      offscreen.height = GIF_SIZE;

      for (const frame of frames) {
        renderFrame(offscreen, frame, imgCache.current);
        const ctx = offscreen.getContext('2d');
        if (!ctx) continue;
        const imageData = ctx.getImageData(0, 0, GIF_SIZE, GIF_SIZE);
        encoder.addFrame(imageData.data, frame.delay);
      }

      const blob = encoder.finish();
      const url = URL.createObjectURL(blob);
      setPreviewGif(url);

      // Pass to parent as data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onSave(dataUrl, 'My BitPopArt GIF Meme');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('GIF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadGif = () => {
    if (!previewGif) return;
    const a = document.createElement('a');
    a.href = previewGif;
    a.download = 'bitpopart-gif-meme.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <Play className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold">GIF Meme Creator</p>
          <p className="text-[10px] text-white/80">Add frames · customize each · export as animated GIF</p>
        </div>
        <Badge className="text-[10px] bg-white/20 text-white border-0 shrink-0">{frames.length} frame{frames.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Preview canvas */}
      <div className="flex justify-center">
        <div className="relative w-full" style={{ maxWidth: DISPLAY_MAX }}>
          {/* Live preview: shows frames cycling */}
          {frames.length > 1 ? (
            <div className="relative rounded-xl border-2 border-purple-300 overflow-hidden bg-gray-100" style={{ aspectRatio: '1 / 1' }}>
              {frames.map((f, i) => {
                const img = f.backgroundImageUrl ? imgCache.current.get(f.backgroundImageUrl) : null;
                return (
                  <div key={f.id} className={`absolute inset-0 transition-opacity duration-100 ${i === previewFrameIdx ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: f.bgColor }}>
                    {img && <img src={f.backgroundImageUrl} alt="" className="w-full h-full object-contain" />}
                    {f.text && (
                      <div
                        className="absolute left-0 right-0 text-center px-2 font-bold"
                        style={{
                          fontFamily: f.fontFamily,
                          fontSize: `${Math.round(f.fontSize * DISPLAY_MAX / GIF_SIZE)}px`,
                          color: f.textColor,
                          WebkitTextStroke: `1px ${f.textColor === '#FFFFFF' ? '#000' : '#fff'}`,
                          ...(f.textPosition === 'top' ? { top: 8 } : f.textPosition === 'bottom' ? { bottom: 8 } : { top: '50%', transform: 'translateY(-50%)' }),
                        }}
                      >
                        {f.text}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Frame indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {frames.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === previewFrameIdx ? 'w-3 bg-purple-500' : 'w-1 bg-white/60'}`} />
                ))}
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={GIF_SIZE}
              height={GIF_SIZE}
              className="rounded-xl border-2 border-purple-300 w-full block"
            />
          )}
          {/* Single frame canvas (hidden when multiple frames) — used for render */}
          {frames.length > 1 && (
            <canvas ref={canvasRef} width={GIF_SIZE} height={GIF_SIZE} className="hidden" />
          )}
        </div>
      </div>

      {/* Frame strip */}
      <div className="rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
        <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between border-b border-purple-200 dark:border-purple-700">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Frames</p>
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold transition-colors"
            onClick={addFrame}
          >
            <Plus className="h-3 w-3" /> Add Frame
          </button>
        </div>
        <div className="flex gap-2 p-2 overflow-x-auto">
          {frames.map((frame, idx) => {
            const img = frame.backgroundImageUrl ? imgCache.current.get(frame.backgroundImageUrl) : null;
            const isActive = idx === activeFrameIdx;
            return (
              <div
                key={frame.id}
                className={`shrink-0 w-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${isActive ? 'border-purple-500 shadow-md scale-105' : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'}`}
                onClick={() => setActiveFrameIdx(idx)}
              >
                <div className="aspect-square relative flex items-center justify-center text-lg" style={{ background: frame.bgColor }}>
                  {img ? (
                    <img src={frame.backgroundImageUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  )}
                  {frame.text && (
                    <div className="absolute bottom-0.5 left-0 right-0 text-center text-[7px] font-bold truncate px-0.5" style={{ color: frame.textColor }}>
                      {frame.text}
                    </div>
                  )}
                </div>
                {/* Frame controls */}
                <div className="flex bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  <button className="flex-1 flex items-center justify-center py-0.5 hover:text-purple-600 text-gray-400 transition-colors" onClick={e => { e.stopPropagation(); moveFrame(idx, -1); }} disabled={idx === 0}>
                    <ChevronUp className="h-3 w-3 rotate-[-90deg]" />
                  </button>
                  <button className="flex-1 flex items-center justify-center py-0.5 hover:text-blue-500 text-gray-400 transition-colors" onClick={e => { e.stopPropagation(); duplicateFrame(idx); }}>
                    <Copy className="h-3 w-3" />
                  </button>
                  <button className="flex-1 flex items-center justify-center py-0.5 hover:text-red-500 text-gray-400 transition-colors" onClick={e => { e.stopPropagation(); removeFrame(idx); }} disabled={frames.length <= 1}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button className="flex-1 flex items-center justify-center py-0.5 hover:text-purple-600 text-gray-400 transition-colors" onClick={e => { e.stopPropagation(); moveFrame(idx, 1); }} disabled={idx === frames.length - 1}>
                    <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active frame editor */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Frame {activeFrameIdx + 1} Settings
          </p>
        </div>
        <div className="p-3 space-y-3">
          {/* Frame delay */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">Speed</span>
            <Select
              value={String(activeFrame.delay)}
              onValueChange={v => updateActiveFrame({ delay: Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">Very Fast (0.1s)</SelectItem>
                <SelectItem value="200">Fast (0.2s)</SelectItem>
                <SelectItem value="300">Medium Fast (0.3s)</SelectItem>
                <SelectItem value="500">Medium (0.5s)</SelectItem>
                <SelectItem value="700">Medium Slow (0.7s)</SelectItem>
                <SelectItem value="1000">Slow (1s)</SelectItem>
                <SelectItem value="1500">Very Slow (1.5s)</SelectItem>
                <SelectItem value="2000">Pause (2s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Text */}
          <div className="flex items-center gap-2">
            <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              value={activeFrame.text}
              onChange={e => updateActiveFrame({ text: e.target.value })}
              placeholder="Add text to this frame…"
              className="h-8 text-xs flex-1"
              style={{ fontSize: 16 }}
            />
          </div>

          {/* Font + position */}
          <div className="flex gap-2">
            <Select value={activeFrame.fontFamily} onValueChange={v => updateActiveFrame({ fontFamily: v })}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEME_FONTS.map(f => (
                  <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFrame.textPosition} onValueChange={v => updateActiveFrame({ textPosition: v as 'top' | 'center' | 'bottom' })}>
              <SelectTrigger className="h-8 text-xs w-24">
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">Text color</span>
            <div className="flex flex-wrap gap-1">
              {POP_COLORS.map(c => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${activeFrame.textColor === c ? 'border-purple-500 scale-110' : 'border-transparent'}`}
                  style={{ background: c, boxShadow: (c === '#FFFFFF' || c === '#000000') ? 'inset 0 0 0 1px #aaa' : undefined }}
                  onClick={() => updateActiveFrame({ textColor: c })}
                />
              ))}
            </div>
          </div>

          {/* BG color */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 shrink-0">Background</span>
            <div className="flex flex-wrap gap-1">
              {POP_COLORS.map(c => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${activeFrame.bgColor === c ? 'border-purple-500 scale-110' : 'border-transparent'}`}
                  style={{ background: c, boxShadow: (c === '#FFFFFF' || c === '#000000') ? 'inset 0 0 0 1px #aaa' : undefined }}
                  onClick={() => updateActiveFrame({ bgColor: c })}
                />
              ))}
            </div>
          </div>

          {/* Clear background button */}
          {activeFrame.backgroundImageUrl && (
            <button
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              onClick={() => updateActiveFrame({ backgroundImageUrl: '' })}
            >
              <X className="h-3 w-3" /> Clear image from frame
            </button>
          )}
        </div>
      </div>

      {/* Image picker */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Set frame background image</p>
        </div>
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {[
            { id: 'templates' as PickerTab, label: 'Templates', icon: <LayoutTemplate className="h-3 w-3" />, loading: templatesLoading, count: memeTemplates.length },
            { id: 'pops' as PickerTab, label: 'Pops', icon: <UserCircle2 className="h-3 w-3" />, loading: popsLoading, count: pops.length },
            { id: 'icons' as PickerTab, label: 'Icons', icon: <Sticker className="h-3 w-3" />, loading: iconsLoading, count: icons.length },
            { id: 'emojis' as PickerTab, label: 'Emojis', icon: <span className="text-[10px]">😄</span>, loading: emojisLoading, count: emojiItems.length },
          ].map(tab => (
            <button
              key={tab.id}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${pickerTab === tab.id ? 'bg-white dark:bg-gray-800 text-purple-600 border-b-2 border-purple-500' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setPickerTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && <span className="text-purple-500">({tab.count})</span>}
            </button>
          ))}
        </div>
        <div className="p-3 bg-white dark:bg-gray-800">
          {(['templates', 'pops', 'icons', 'emojis'] as PickerTab[]).map(tab => {
            if (pickerTab !== tab) return null;
            const items = tab === 'templates' ? memeTemplates : tab === 'pops' ? pops : tab === 'icons' ? icons : emojiItems;
            const loading = tab === 'templates' ? templatesLoading : tab === 'pops' ? popsLoading : tab === 'icons' ? iconsLoading : emojisLoading;
            const borderColor = tab === 'emojis' ? 'hover:border-yellow-400' : 'hover:border-purple-400';
            if (loading) {
              return (
                <div key={tab} className="flex gap-2 pb-1">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="shrink-0 w-14 h-14 rounded-lg" />)}
                </div>
              );
            }
            if (items.length === 0) {
              return <p key={tab} className="text-xs text-muted-foreground text-center py-3">Nothing here yet</p>;
            }
            return (
              <div key={tab} className="flex gap-1.5 flex-wrap max-h-36 overflow-y-auto pb-1">
                {items.map(item => {
                  const url = 'image_url' in item ? item.image_url : '';
                  const isSelected = activeFrame.backgroundImageUrl === url;
                  return (
                    <button
                      key={'id' in item ? item.id : url}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-purple-500 scale-105 shadow-md' : `border-gray-200 ${borderColor}`}`}
                      onClick={() => setBackground(url)}
                      title={'title' in item ? item.title : ''}
                    >
                      <img src={url} alt={('title' in item ? item.title : '') as string} className="w-full h-full object-contain p-0.5" loading="lazy" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export button */}
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

      {/* GIF preview + download */}
      {previewGif && (
        <div className="rounded-xl border-2 border-purple-400 overflow-hidden bg-gray-50 dark:bg-gray-800 space-y-3 p-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500 text-white border-0 text-xs">✓ GIF Ready!</Badge>
            <span className="text-xs text-muted-foreground">Tap Download to save it</span>
          </div>
          <img src={previewGif} alt="GIF preview" className="w-full rounded-xl border" />
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            onClick={handleDownloadGif}
          >
            <Download className="h-4 w-4" /> Download GIF
          </button>
        </div>
      )}
    </div>
  );
}
