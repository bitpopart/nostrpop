import { useState, useRef, useEffect, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Canvas as FabricCanvas, FabricImage, FabricText, Rect, Circle, Textbox } from 'fabric';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudioLibraries } from '@/hooks/useStudioLibraries';
import { CANVAS_FORMATS, type CanvasFormat } from '@/lib/studioTypes';
import {
  Type,
  Trash2,
  Download,
  FilePlus2,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  ChevronDown,
  Copy,
  Palette,
  Image as ImageIcon,
  Sticker,
  FileText,
  Monitor,
  SquareUser,
  Loader2,
  LayoutTemplate,
} from 'lucide-react';

// ─── Pop Art Color Palette ─────────────────────────────────────────────────
const POP_COLORS = [
  '#FF0080', '#FF4500', '#FFD700', '#00FF41', '#00BFFF', '#FF69B4',
  '#FF1493', '#FF6600', '#FFFF00', '#39FF14', '#00FFFF', '#BF00FF',
  '#FF0000', '#FF8C00', '#FFF01F', '#7FFF00', '#0080FF', '#FF00FF',
  '#FFFFFF', '#000000', '#C0C0C0', '#808080', '#4B0082', '#800000',
];

// ─── Format Icon ────────────────────────────────────────────────────────────
function FormatIcon({ id }: { id: string }) {
  if (id === 'sticker') return <Sticker className="h-4 w-4" />;
  if (id.includes('flyer')) return <FileText className="h-4 w-4" />;
  if (id === 'banner') return <Monitor className="h-4 w-4" />;
  if (id === 'avatar') return <SquareUser className="h-4 w-4" />;
  return <LayoutTemplate className="h-4 w-4" />;
}

// ─── Canvas scale for display ────────────────────────────────────────────────
function getDisplayScale(format: CanvasFormat, containerWidth: number, containerHeight: number): number {
  const maxW = containerWidth - 32;
  const maxH = containerHeight - 32;
  const scaleW = maxW / format.width;
  const scaleH = maxH / format.height;
  return Math.min(scaleW, scaleH, 1);
}

export default function Studio() {
  useSeoMeta({
    title: 'Pop Art Studio — Create Your Design',
    description: 'Create pop art designs: stickers, flyers, banners and avatars with our free online studio.',
  });

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeFormat, setActiveFormat] = useState<CanvasFormat>(CANVAS_FORMATS[0]);
  const [zoom, setZoom] = useState(1);
  const [activeColor, setActiveColor] = useState('#FF0080');
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [selectedFont, setSelectedFont] = useState('Impact');
  const [canvasScale, setCanvasScale] = useState(0.3);
  const [hasSelection, setHasSelection] = useState(false);

  const { data: libraries, isLoading: librariesLoading } = useStudioLibraries();

  // Filter out deleted libraries
  const activeLibraries = (libraries ?? []).filter((lib) => lib.name !== '__deleted__' && lib.images.length > 0);

  // ─── Initialize Fabric Canvas ──────────────────────────────────────────
  useEffect(() => {
    if (!canvasElRef.current) return;

    // Compute display scale
    const container = containerRef.current;
    const containerW = container?.clientWidth ?? 700;
    const containerH = container?.clientHeight ?? 600;
    const scale = getDisplayScale(activeFormat, containerW, containerH);
    setCanvasScale(scale);

    const fc = new FabricCanvas(canvasElRef.current, {
      width: activeFormat.width * scale,
      height: activeFormat.height * scale,
      backgroundColor: '#ffffff',
      selection: true,
    });

    // Set scale transform so 1px on canvas = scale px on screen
    fc.setZoom(scale);
    fc.setWidth(activeFormat.width * scale);
    fc.setHeight(activeFormat.height * scale);

    fc.on('selection:created', () => setHasSelection(true));
    fc.on('selection:updated', () => setHasSelection(true));
    fc.on('selection:cleared', () => setHasSelection(false));

    fabricRef.current = fc;

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFormat.id]);

  // ─── Add text ──────────────────────────────────────────────────────────
  const handleAddText = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const text = new Textbox(textInput || 'Your Text Here', {
      left: activeFormat.width / 2 - 150,
      top: activeFormat.height / 2 - 30,
      fontSize,
      fontFamily: selectedFont,
      fill: activeColor,
      fontWeight: selectedFont === 'Impact' ? 'bold' : 'normal',
      textAlign: 'center',
      width: 300,
    });

    fc.add(text);
    fc.setActiveObject(text);
    fc.renderAll();
  }, [textInput, fontSize, selectedFont, activeColor, activeFormat]);

  // ─── Add image from library ────────────────────────────────────────────
  const handleAddImage = useCallback(async (url: string) => {
    const fc = fabricRef.current;
    if (!fc) return;

    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const maxSize = Math.min(activeFormat.width, activeFormat.height) * 0.4;
      const scale = Math.min(maxSize / (img.width ?? 1), maxSize / (img.height ?? 1));
      img.scale(scale);
      img.set({
        left: (activeFormat.width - (img.width ?? 0) * scale) / 2,
        top: (activeFormat.height - (img.height ?? 0) * scale) / 2,
      });
      fc.add(img);
      fc.setActiveObject(img);
      fc.renderAll();
    } catch {
      console.error('Failed to load image:', url);
    }
  }, [activeFormat]);

  // ─── Delete selected ──────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObjects();
    active.forEach((obj) => fc.remove(obj));
    fc.discardActiveObject();
    fc.renderAll();
  }, []);

  // ─── Clear canvas ─────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.backgroundColor = '#ffffff';
    fc.renderAll();
  }, []);

  // ─── Duplicate selected ───────────────────────────────────────────────
  const handleDuplicate = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active) return;
    const clone = await active.clone();
    clone.set({ left: (clone.left ?? 0) + 20, top: (clone.top ?? 0) + 20 });
    fc.add(clone);
    fc.setActiveObject(clone);
    fc.renderAll();
  }, []);

  // ─── Bring/send layer ─────────────────────────────────────────────────
  const handleBringForward = useCallback(() => {
    const fc = fabricRef.current;
    const active = fc?.getActiveObject();
    if (!fc || !active) return;
    fc.bringObjectForward(active);
    fc.renderAll();
  }, []);

  const handleSendBackward = useCallback(() => {
    const fc = fabricRef.current;
    const active = fc?.getActiveObject();
    if (!fc || !active) return;
    fc.sendObjectBackwards(active);
    fc.renderAll();
  }, []);

  // ─── Change active color ──────────────────────────────────────────────
  const handleColorChange = useCallback((color: string) => {
    setActiveColor(color);
    const fc = fabricRef.current;
    const active = fc?.getActiveObject();
    if (!fc || !active) return;
    if (active.type === 'textbox' || active.type === 'i-text' || active.type === 'text') {
      (active as FabricText).set('fill', color);
    } else {
      active.set('fill', color);
    }
    fc.renderAll();
  }, []);

  // ─── Download as PNG ──────────────────────────────────────────────────
  const handleDownloadPNG = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    // Temporarily set zoom to 1 for full-res export
    const currentZoom = fc.getZoom();
    fc.setZoom(1);
    fc.setWidth(activeFormat.width);
    fc.setHeight(activeFormat.height);
    fc.renderAll();

    const dataUrl = fc.toDataURL({ format: 'png', multiplier: 1 });
    const link = document.createElement('a');
    link.download = `popart-${activeFormat.id}.png`;
    link.href = dataUrl;
    link.click();

    // Restore zoom
    fc.setZoom(currentZoom);
    fc.setWidth(activeFormat.width * currentZoom);
    fc.setHeight(activeFormat.height * currentZoom);
    fc.renderAll();
  }, [activeFormat]);

  // ─── Download as PDF ──────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const currentZoom = fc.getZoom();
    fc.setZoom(1);
    fc.setWidth(activeFormat.width);
    fc.setHeight(activeFormat.height);
    fc.renderAll();

    const dataUrl = fc.toDataURL({ format: 'png', multiplier: 1 });

    // Convert pixels to mm (300 DPI assumed for print formats)
    const dpi = activeFormat.dpi ?? 96;
    const widthMm = (activeFormat.width / dpi) * 25.4;
    const heightMm = (activeFormat.height / dpi) * 25.4;

    const pdf = new jsPDF({
      orientation: activeFormat.width > activeFormat.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm],
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm);
    pdf.save(`popart-${activeFormat.id}.pdf`);

    // Restore zoom
    fc.setZoom(currentZoom);
    fc.setWidth(activeFormat.width * currentZoom);
    fc.setHeight(activeFormat.height * currentZoom);
    fc.renderAll();
  }, [activeFormat]);

  const isPrintFormat = activeFormat.category === 'print';

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-gray-950 dark:via-orange-950/20 dark:to-pink-950/20">
        {/* ── Hero Banner ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 text-white py-6 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase" style={{ fontFamily: 'Impact, Arial Black, sans-serif', textShadow: '3px 3px 0 rgba(0,0,0,0.3)' }}>
                🎨 Pop Art Studio
              </h1>
              <p className="text-white/90 text-sm mt-1 font-medium">
                PopArt is for everyone. Create your own pop art designs — free!
              </p>
            </div>
            <div className="hidden md:flex gap-3">
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/40 border"
                onClick={handleDownloadPNG}
              >
                <Download className="h-4 w-4 mr-2" />
                PNG
              </Button>
              {isPrintFormat && (
                <Button
                  className="bg-black/30 hover:bg-black/40 text-white border-white/40 border"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF (Print)
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 py-4">
          {/* ── Format Picker ──────────────────────────────────────────── */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-xs font-semibold text-muted-foreground self-center mr-1 uppercase tracking-wider">Format:</span>
            {CANVAS_FORMATS.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setActiveFormat(fmt)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                  activeFormat.id === fmt.id
                    ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
                }`}
              >
                <FormatIcon id={fmt.id} />
                {fmt.name}
                {fmt.category === 'print' && (
                  <span className={`text-[10px] opacity-70 ${activeFormat.id === fmt.id ? 'text-white' : 'text-orange-500'}`}>PRINT</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Main Editor Layout ─────────────────────────────────────── */}
          <div className="flex gap-3 items-start">
            {/* ── Left Toolbar ──────────────────────────────────────── */}
            <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-lg border w-[220px] shrink-0">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Design Tools
              </p>

              {/* Text Tool */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" /> Add Text
                </p>
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type something..."
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                />
                <div className="flex gap-1">
                  <Select value={selectedFont} onValueChange={setSelectedFont}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Impact', 'Arial Black', 'Comic Sans MS', 'Georgia', 'Verdana', 'Courier New', 'Trebuchet MS'].map((f) => (
                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="h-8 w-16 text-xs"
                    min={8}
                    max={400}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs"
                  onClick={handleAddText}
                >
                  <Type className="h-3.5 w-3.5 mr-1.5" />
                  Add Text
                </Button>
              </div>

              <Separator />

              {/* Color Palette */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" /> Pop Colors
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {POP_COLORS.map((c) => (
                    <button
                      key={c}
                      title={c}
                      onClick={() => handleColorChange(c)}
                      className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                        activeColor === c ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Custom:</label>
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                  />
                  <span className="text-xs font-mono text-muted-foreground">{activeColor}</span>
                </div>
              </div>

              <Separator />

              {/* Object Actions */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Object
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleDuplicate} disabled={!hasSelection}>
                        <Copy className="h-3 w-3 mr-1" />Copy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate selected</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={handleDeleteSelected} disabled={!hasSelection}>
                        <Trash2 className="h-3 w-3 mr-1" />Delete
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete selected</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBringForward} disabled={!hasSelection}>
                        <ChevronUp className="h-3 w-3 mr-1" />Forward
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Bring forward</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSendBackward} disabled={!hasSelection}>
                        <ChevronDown className="h-3 w-3 mr-1" />Backward
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send backward</TooltipContent>
                  </Tooltip>
                </div>
                <Button size="sm" variant="ghost" className="w-full h-7 text-xs text-muted-foreground" onClick={handleClear}>
                  <RotateCcw className="h-3 w-3 mr-1" />Clear Canvas
                </Button>
              </div>

              <Separator />

              {/* Export */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Export
                </p>
                <Button
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs"
                  onClick={handleDownloadPNG}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download PNG
                </Button>
                {isPrintFormat && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download PDF
                  </Button>
                )}
                {isPrintFormat && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    PDF ready for professional printing at {activeFormat.dpi} DPI
                  </p>
                )}
              </div>
            </div>

            {/* ── Canvas Area ───────────────────────────────────────── */}
            <div
              ref={containerRef}
              className="flex-1 flex flex-col items-center gap-3 min-h-[500px]"
            >
              {/* Canvas label */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                  {activeFormat.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {activeFormat.width} × {activeFormat.height}px
                </Badge>
              </div>

              {/* Fabric Canvas */}
              <div
                className="relative shadow-2xl rounded-sm overflow-hidden"
                style={{
                  background: 'repeating-conic-gradient(#e0e0e0 0% 25%, white 0% 50%) 0 0 / 16px 16px',
                }}
              >
                <canvas ref={canvasElRef} />
              </div>

              <p className="text-xs text-muted-foreground">
                Click elements on canvas to select • Drag to move • Scroll to zoom
              </p>
            </div>
          </div>

          {/* ── Library Panel (below canvas) ───────────────────────────── */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/30">
              <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Pop Art Element Libraries
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any element to add it to your canvas. Use tabs to switch between libraries.
              </p>
            </div>

            {librariesLoading ? (
              <div className="p-4">
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              </div>
            ) : activeLibraries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No element libraries yet</p>
                <p className="text-xs mt-1">The admin will add pop art element libraries here.</p>
              </div>
            ) : (
              <Tabs defaultValue={activeLibraries[0]?.id}>
                <div className="px-4 pt-3 overflow-x-auto">
                  <TabsList className="inline-flex h-9 gap-1 bg-transparent p-0">
                    {activeLibraries.map((lib) => (
                      <TabsTrigger
                        key={lib.id}
                        value={lib.id}
                        className="rounded-full px-4 py-1.5 text-xs font-semibold border data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500 border-gray-200 hover:border-orange-300 transition-all"
                      >
                        {lib.name}
                        <span className="ml-1.5 opacity-60 text-[10px]">({lib.images.length})</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {activeLibraries.map((lib) => (
                  <TabsContent key={lib.id} value={lib.id} className="p-4 mt-0">
                    <ScrollArea className="h-48">
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 pr-2">
                        {lib.images.map((img, i) => (
                          <button
                            key={i}
                            title={img.name}
                            onClick={() => handleAddImage(img.url)}
                            className="group aspect-square rounded-xl border-2 border-transparent hover:border-orange-400 bg-gray-50 dark:bg-gray-800 overflow-hidden transition-all hover:shadow-lg hover:scale-110 active:scale-95"
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                    {lib.description && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{lib.description}</p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          {/* ── Tips footer ──────────────────────────────────────────── */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🖱️', tip: 'Click an element in the library to add it to your canvas' },
              { icon: '✍️', tip: 'Type your text and click "Add Text" to place it' },
              { icon: '🎨', tip: 'Select an object, then click a color to change it' },
              { icon: '💾', tip: 'Download as PNG for digital use, or PDF for printing' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 bg-white dark:bg-gray-900 rounded-xl p-3 border text-xs text-muted-foreground">
                <span className="text-base shrink-0">{t.icon}</span>
                <p>{t.tip}</p>
              </div>
            ))}
          </div>

          {/* Shakespeare credit */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">
              Vibed with Shakespeare
            </a>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
