import { useState, useRef, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  usePrintPosters,
  useCreatePrintPoster,
  useDeletePrintPoster,
  DEFAULT_FORMAT_PRICES,
  DEFAULT_ART_FORMAT_PRICES,
  POSTER_CATEGORIES,
  getPosterCategories,
  useBtcEurRate,
  eurToLiveSats,
} from '@/hooks/usePrintPosters';
import type { PrintPoster, PosterFormat, PosterFormatPrice } from '@/hooks/usePrintPosters';
import { useArtworks } from '@/hooks/useArtworks';
import type { ArtworkData } from '@/lib/artTypes';
import { useLNURL } from '@/hooks/useLNURL';
import { useEnhancedPaymentDetection } from '@/hooks/usePaymentDetection';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { RelaySelector } from '@/components/RelaySelector';
import {
  Printer,
  Upload,
  Plus,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  Zap,
  Copy,
  QrCode,
  FileImage,
  ChevronDown,
  ChevronUp,
  Settings,
  Tag,
  LayoutGrid,
  Palette,
  Sparkles,
  Image,
} from 'lucide-react';
import QRCode from 'qrcode';

// ─── Paper format dimensions (mm) ───────────────────────────────────────────
const FORMAT_DIMENSIONS: Record<PosterFormat, { width: number; height: number; label: string; description: string }> = {
  A3: { width: 297, height: 420, label: 'A3 Poster', description: '297 × 420 mm — large wall poster' },
  A4: { width: 210, height: 297, label: 'A4 Poster', description: '210 × 297 mm — standard print' },
  A5: { width: 148, height: 210, label: 'A5 Poster', description: '148 × 210 mm — half-sheet' },
  A6: { width: 105, height: 148, label: 'A6 Postcard', description: '105 × 148 mm — postcard size' },
  '50x70': { width: 500, height: 700, label: '50×70 cm Art Print', description: '500 × 700 mm — gallery art print' },
};

// ─── Category accent colors ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Art:          'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
  Bitcoin:      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  'Pop Art':    'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
  Travel:       'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300',
  Photography:  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  Abstract:     'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  Typography:   'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  Nature:       'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  City:         'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  Music:        'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300',
  Sport:        'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300',
  Motivational: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  Humor:        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  Holiday:      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  Animals:      'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
};

function categoryColorClass(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
}

// ─── Lightning address ───────────────────────────────────────────────────────
const LIGHTNING_ADDRESS = 'bitpopart@walletofsatoshi.com';

// ─── Print/download helper — opens a print-ready page in a new window ────────
// Uses the browser's native Print → Save as PDF, zero dependencies.
async function openPrintWindow(svgUrl: string, format: PosterFormat, title: string): Promise<void> {
  const { width, height } = FORMAT_DIMENSIONS[format];
  // For mm-based formats: portrait if width < height; 50x70 is always portrait
  const orientation = width < height ? 'portrait' : 'landscape';
  // For 50x70, use cm units
  const isArtFormat = format === '50x70';
  const unitW = isArtFormat ? '50cm' : `${width}mm`;
  const unitH = isArtFormat ? '70cm' : `${height}mm`;

  // Fetch SVG and embed inline so it renders correctly cross-origin
  let svgContent = '';
  try {
    const res = await fetch(svgUrl);
    svgContent = await res.text();
  } catch {
    // Fallback: use as <img> src
    svgContent = `<img src="${svgUrl}" style="width:100%;height:100%;object-fit:contain;" />`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${title} — ${format}</title>
  <style>
    @page {
      size: ${unitW} ${unitH} ${orientation};
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${unitW};
      height: ${unitH};
      overflow: hidden;
      background: white;
    }
    .poster {
      width: ${unitW};
      height: ${unitH};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .poster svg, .poster img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="poster">${svgContent}</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('afterprint', () => {
      URL.revokeObjectURL(url);
    });
  } else {
    // Popup blocked — offer direct link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${format}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

// ─── PosterCard ───────────────────────────────────────────────────────────────
interface PosterCardProps {
  poster: PrintPoster;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onBuy: (poster: PrintPoster, format: PosterFormat) => void;
  btcRate?: ReturnType<typeof useBtcEurRate>['data'];
}

function PosterCard({ poster, isAdmin, onDelete, onBuy, btcRate }: PosterCardProps) {
  const [selectedFormat, setSelectedFormat] = useState<PosterFormat>('A4');
  const selectedPrice = poster.formats.find(f => f.format === selectedFormat)!;
  const liveSats = btcRate ? eurToLiveSats(selectedPrice.priceEur, btcRate) : selectedPrice.priceSats;

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* Preview */}
      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img
          src={poster.previewUrl}
          alt={poster.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Category badge — top left */}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryColorClass(poster.category)}`}>
            {poster.category}
          </span>
        </div>
        {/* Admin delete — top right */}
        {isAdmin && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={() => onDelete(poster.id)}
            title="Delete poster"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <CardContent className="p-4 space-y-3 flex flex-col flex-1">
        <div>
          <h3 className="font-bold text-base leading-tight">{poster.title}</h3>
          {poster.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{poster.description}</p>
          )}
        </div>

        {/* Format selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Choose Format
          </Label>
          <div className={`grid gap-1.5 ${poster.formats.length >= 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {poster.formats.map((fp) => (
              <button
                key={fp.format}
                onClick={() => setSelectedFormat(fp.format)}
                className={`rounded-md border text-xs font-semibold py-2 transition-colors ${
                  selectedFormat === fp.format
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                }`}
              >
                {fp.format}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{FORMAT_DIMENSIONS[selectedFormat]?.description ?? selectedFormat}</p>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between mt-auto pt-1">
          <div>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              €{selectedPrice.priceEur.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground ml-1.5">
              / ${selectedPrice.priceUsd.toFixed(2)}
            </span>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              {liveSats.toLocaleString()} sats
              {btcRate && liveSats !== selectedPrice.priceSats && (
                <span className="text-[10px] opacity-60">(live)</span>
              )}
            </div>
          </div>
        </div>

        {/* Buy button */}
        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0 font-semibold gap-2"
          onClick={() => onBuy(poster, selectedFormat)}
        >
          <Zap className="h-4 w-4" />
          Pay &amp; Download PDF
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Payment Dialog ───────────────────────────────────────────────────────────
interface PrintPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poster: PrintPoster | null;
  format: PosterFormat | null;
}

function PrintPaymentDialog({ open, onOpenChange, poster, format }: PrintPaymentDialogProps) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<{ pr: string; amountSats: number; expiresAt: number } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { getZapInvoice, lnurlData, isLoading: lnurlLoading } = useLNURL(LIGHTNING_ADDRESS);
  const { isDetecting, startDetection, stopDetection, payWithWebLN, openLightningWallet } = useEnhancedPaymentDetection();
  const { data: btcRate } = useBtcEurRate();

  const selectedPrice = poster && format ? poster.formats.find(f => f.format === format) : null;
  // Use live sats if available, fall back to stored value
  const liveSatsAmount = selectedPrice && btcRate
    ? eurToLiveSats(selectedPrice.priceEur, btcRate)
    : selectedPrice?.priceSats ?? 0;

  const handleConfirmPayment = useCallback(async () => {
    stopDetection();
    setPaymentDone(true);
  }, [stopDetection]);

  const handleCreateInvoice = async () => {
    if (!selectedPrice) return;
    setIsCreatingInvoice(true);
    try {
      const pr = await getZapInvoice(liveSatsAmount);
      if (!pr) return;
      const invoiceData = { pr, amountSats: liveSatsAmount, expiresAt: Date.now() + 15 * 60 * 1000 };
      setInvoice(invoiceData);
      const qr = await QRCode.toDataURL(pr, { width: 256, margin: 2 });
      setQrDataUrl(qr);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleStartDetection = () => {
    if (!invoice) return;
    startDetection({
      paymentHash: invoice.pr.slice(-32),
      expiresAt: invoice.expiresAt,
      onPaymentDetected: handleConfirmPayment,
      pollInterval: 1500,
    });
  };

  const handleDownload = async () => {
    if (!poster || !format) return;
    setIsDownloading(true);
    try {
      await openPrintWindow(poster.svgUrl, format, poster.title);
      toast({ title: 'Print window opened!', description: `Use "Save as PDF" in the print dialog to save your ${format} poster.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to open print window', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    setInvoice(null);
    setQrDataUrl('');
    setPaymentDone(false);
    setIsCreatingInvoice(false);
    stopDetection();
    onOpenChange(false);
  };

  if (!poster || !format || !selectedPrice) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg rounded-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Printer className="h-5 w-5 text-orange-500 shrink-0" />
            {paymentDone ? 'Print Your Poster' : `Purchase ${FORMAT_DIMENSIONS[format]?.label ?? format}`}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {paymentDone
              ? `Payment confirmed! Open the print dialog to save "${poster.title}" as PDF.`
              : 'Pay with Bitcoin Lightning to unlock the print-ready file.'}
          </DialogDescription>
        </DialogHeader>

          {paymentDone ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center py-3">
              <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="font-semibold">{poster.title}</p>
                <p className="text-muted-foreground text-xs">{FORMAT_DIMENSIONS[format]?.label ?? format} — {FORMAT_DIMENSIONS[format]?.description ?? format}</p>
                <p className="text-muted-foreground text-xs">Paid: {selectedPrice.priceSats.toLocaleString()} sats</p>
              </CardContent>
            </Card>
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0 font-bold gap-2 h-11 text-sm sm:text-base"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</>
                : <><Printer className="h-5 w-5" /> Open Print Dialog — {FORMAT_DIMENSIONS[format]?.label ?? format}</>}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              A print window opens — choose "Save as PDF" or print directly. Sized for {FORMAT_DIMENSIONS[format]?.description ?? format}.
            </p>
            <Button variant="outline" className="w-full" onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Poster</span>
                  <span className="font-medium text-right truncate">{poster.title}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Format</span>
                  <span className="font-medium">{FORMAT_DIMENSIONS[format]?.label ?? format}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    <p className="font-bold text-lg text-orange-600">€{selectedPrice.priceEur.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      {liveSatsAmount.toLocaleString()} sats
                      {btcRate && <span className="opacity-60">(live)</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {invoice ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="bg-white rounded-xl p-3 inline-block shadow">
                    {qrDataUrl
                      ? <img src={qrDataUrl} alt="Lightning QR" className="w-40 h-40 sm:w-48 sm:h-48" />
                      : <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center bg-gray-100 rounded"><QrCode className="h-12 w-12 text-gray-400" /></div>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Scan with your Lightning wallet</p>
                </div>
                {/* Invoice string — truncated on mobile, copyable */}
                <div className="flex gap-2 items-center">
                  <Input value={invoice.pr} readOnly className="font-mono text-[10px] sm:text-xs min-w-0" />
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => { navigator.clipboard.writeText(invoice.pr); toast({ title: 'Copied!' }); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 gap-2"
                  onClick={() => payWithWebLN(invoice.pr, handleConfirmPayment, () => { openLightningWallet(invoice.pr); handleStartDetection(); })}
                  disabled={isDetecting}
                >
                  <Zap className="h-4 w-4" />
                  {typeof window !== 'undefined' && window.webln ? 'Pay with WebLN' : 'Open Lightning Wallet'}
                </Button>
                {isDetecting ? (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <Loader2 className="h-4 w-4 animate-spin" /> Waiting for payment…
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleConfirmPayment}>Payment sent? Click here</Button>
                      <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={stopDetection}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground">Paid via QR? Click below to confirm and unlock your download.</p>
                    <Button variant="outline" size="sm" className="text-xs" onClick={handleStartDetection}>Start Payment Detection</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    <Zap className="h-4 w-4 shrink-0" /> Lightning Payment
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs break-all">
                    Pay to: <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">{LIGHTNING_ADDRESS}</code>
                  </p>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 gap-2"
                  onClick={handleCreateInvoice}
                  disabled={isCreatingInvoice || lnurlLoading || !lnurlData}
                >
                  {isCreatingInvoice || lnurlLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Invoice…</>
                    : <><Zap className="h-4 w-4" /> Generate Lightning Invoice</>}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Admin Upload Form (inline on the Print page) ─────────────────────────────
interface AdminUploadFormProps {
  onClose: () => void;
}

function AdminUploadForm({ onClose }: AdminUploadFormProps) {
  const { getGradientStyle } = useThemeColors();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: createPoster, isPending: isPublishing } = useCreatePrintPoster();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgPreview, setSvgPreview] = useState('');
  const [svgUrl, setSvgUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formats, setFormats] = useState<PosterFormatPrice[]>(DEFAULT_FORMAT_PRICES.map(f => ({ ...f })));
  const [showPricing, setShowPricing] = useState(false);

  // When Art category is selected, auto-load art-specific prices including 50x70
  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setCustomCategory('');
    if (cat === 'Art') {
      setFormats(DEFAULT_ART_FORMAT_PRICES.map(f => ({ ...f })));
    } else if (category === 'Art') {
      // Switching away from Art — reset to standard prices
      setFormats(DEFAULT_FORMAT_PRICES.map(f => ({ ...f })));
    }
  };

  const resolvedCategory = category === '__custom__' ? customCategory : category;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSvgFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSvgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      setSvgUrl(tags[0][1]);
      toast({ title: 'File uploaded', description: 'Poster uploaded successfully.' });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload the file.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const updateFormatPrice = (format: PosterFormat, field: keyof PosterFormatPrice, value: string) => {
    setFormats(prev => prev.map(f =>
      f.format === format ? { ...f, [field]: field === 'format' ? value : parseFloat(value) || 0 } : f
    ));
  };

  const handlePublish = () => {
    if (!svgUrl) { toast({ title: 'No file', description: 'Please upload a poster file first.', variant: 'destructive' }); return; }
    if (!title.trim()) { toast({ title: 'No title', description: 'Please enter a title.', variant: 'destructive' }); return; }
    if (!resolvedCategory.trim()) { toast({ title: 'No category', description: 'Please select or enter a category.', variant: 'destructive' }); return; }
    createPoster(
      { title: title.trim(), description: description.trim(), svgUrl, previewUrl: svgUrl, formats, category: resolvedCategory.trim() },
      { onSuccess: onClose }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Print Poster
          </span>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* File drop zone */}
        <div className="space-y-2">
          <Label>SVG / Image File *</Label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-orange-300 dark:border-orange-700 overflow-hidden relative">
            {svgPreview
              ? <img src={svgPreview} alt="preview" className="absolute inset-0 w-full h-full object-contain" />
              : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileImage className="h-8 w-8 text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Click to select file</span>
                  <span className="text-xs">SVG recommended — PNG, JPG also supported</span>
                </div>
              )}
            {isUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-8 w-8 text-white animate-spin" /></div>}
            {svgUrl && !isUploading && <div className="absolute top-2 left-2"><CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow" /></div>}
            <input ref={fileRef} type="file" accept="image/svg+xml,image/*" className="hidden" onChange={handleFileChange} />
          </label>
          {svgFile && <p className="text-xs text-muted-foreground">{svgFile.name}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input placeholder="e.g. Bitcoin Orange Poster" value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Input placeholder="Short description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Category *</Label>
          <div className="flex flex-wrap gap-2">
            {POSTER_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                  category === cat
                    ? cat === 'Art' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                {cat}{cat === 'Art' ? ' 🎨' : ''}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCategory('__custom__')}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                category === '__custom__'
                  ? 'bg-purple-500 border-purple-500 text-white'
                  : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400'
              }`}
            >
              + Custom
            </button>
          </div>
          {category === '__custom__' && (
            <Input
              placeholder="Type your category name…"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              className="mt-2"
              autoFocus
            />
          )}
          {resolvedCategory && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryColorClass(resolvedCategory)}`}>{resolvedCategory}</span>
            </p>
          )}
        </div>

        {/* Pricing per format */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPricing(v => !v)}
            >
              <Settings className="h-4 w-4" />
              Set Prices per Format
              {showPricing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {category === 'Art' && (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                🎨 Art — includes 50×70 cm format
              </span>
            )}
          </div>
          {showPricing && (
            <div className="space-y-3 pt-1">
              {formats.map(fp => (
                <div key={fp.format} className={`rounded-lg border p-3 space-y-2 ${fp.format === '50x70' ? 'border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-900/10' : ''}`}>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {FORMAT_DIMENSIONS[fp.format]?.label ?? fp.format}
                    {fp.format === '50x70' && <span className="text-xs text-rose-600 dark:text-rose-400 font-normal">Gallery Art Print</span>}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">USD ($)</Label>
                      <Input type="number" min="0" step="0.01" value={fp.priceUsd} onChange={e => updateFormatPrice(fp.format, 'priceUsd', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">EUR (€)</Label>
                      <Input type="number" min="0" step="0.01" value={fp.priceEur} onChange={e => updateFormatPrice(fp.format, 'priceEur', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sats ⚡</Label>
                      <Input type="number" min="0" step="100" value={fp.priceSats} onChange={e => updateFormatPrice(fp.format, 'priceSats', e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handlePublish}
          disabled={isPublishing || isUploading || !svgUrl}
          className="w-full text-white border-0"
          style={getGradientStyle('primary')}
        >
          {isPublishing
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing…</>
            : <><Plus className="h-4 w-4 mr-2" />Publish Poster</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Convert an ArtworkData (kind 39239) with print_available into a PrintPoster ──
function artworkToPrintPoster(artwork: ArtworkData): PrintPoster {
  const imageUrl = artwork.images?.[0] ?? '';
  return {
    id: `artwork-${artwork.id}`,
    event: artwork.event!,
    title: artwork.title,
    description: artwork.description || '',
    svgUrl: imageUrl,
    previewUrl: imageUrl,
    formats: DEFAULT_ART_FORMAT_PRICES.map(f => ({ ...f })),
    category: 'Art',
    tags: artwork.tags ?? [],
    created_at: artwork.created_at,
  };
}

// ─── Admin: pick from existing artworks to add as print poster ────────────────
interface ArtworkPickerProps {
  onPick: (artwork: ArtworkData) => void;
  onClose: () => void;
}

function ArtworkPicker({ onPick, onClose }: ArtworkPickerProps) {
  const { data: artworks = [], isLoading } = useArtworks('all');
  const { mutate: createPoster, isPending: isPublishing } = useCreatePrintPoster();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const printableArtworks = artworks.filter(a => a.images?.length > 0);

  const handlePublish = () => {
    const artwork = printableArtworks.find(a => a.id === selectedId);
    if (!artwork) {
      toast({ title: 'No artwork selected', description: 'Please select an artwork first.', variant: 'destructive' });
      return;
    }
    const imageUrl = artwork.images[0];
    setPublishing(true);
    createPoster(
      {
        title: artwork.title,
        description: artwork.description || '',
        svgUrl: imageUrl,
        previewUrl: imageUrl,
        formats: DEFAULT_ART_FORMAT_PRICES.map(f => ({ ...f })),
        category: 'Art',
        extraTags: artwork.tags ?? [],
      },
      {
        onSuccess: () => {
          setPublishing(false);
          onPick(artwork);
        },
        onError: () => setPublishing(false),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Add Artwork as Print Poster
          </span>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select an existing artwork to publish as a print poster (Art category, gallery prices).
        </p>

        {isLoading && (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && printableArtworks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No artworks with images found.</p>
        )}

        {!isLoading && printableArtworks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {printableArtworks.map(artwork => (
              <button
                key={artwork.id}
                type="button"
                onClick={() => setSelectedId(artwork.id)}
                className={`relative rounded-xl border-2 overflow-hidden aspect-square text-left transition-all ${
                  selectedId === artwork.id
                    ? 'border-orange-500 ring-2 ring-orange-300'
                    : 'border-transparent hover:border-orange-300'
                }`}
              >
                <img
                  src={artwork.images[0]}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-semibold truncate">{artwork.title}</p>
                </div>
                {selectedId === artwork.id && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handlePublish}
          disabled={!selectedId || isPublishing || publishing}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0"
        >
          {isPublishing || publishing
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing…</>
            : <><Plus className="h-4 w-4 mr-2" />Publish as Print Poster</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Print page ──────────────────────────────────────────────────────────
export default function Print() {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();
  const { data: posters = [], isLoading: postersLoading } = usePrintPosters();
  const { data: allArtworks = [], isLoading: artworksLoading } = useArtworks('print');
  const { mutate: deletePoster } = useDeletePrintPoster();
  const { data: btcRate } = useBtcEurRate();

  const isLoading = postersLoading || artworksLoading;

  // Convert print_available artworks into PrintPoster shape.
  // Exclude any artwork whose id already has a matching print poster (to avoid duplicates).
  const artworkPosters: PrintPoster[] = allArtworks
    .filter(a => a.images?.length > 0)
    .map(artworkToPrintPoster)
    .filter(ap => !posters.some(p => p.svgUrl === ap.svgUrl || p.title === ap.title));

  // Merged list: explicit print-posters first, then artwork-derived ones
  const allPosters: PrintPoster[] = [...posters, ...artworkPosters];

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showArtworkPicker, setShowArtworkPicker] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<PrintPoster | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<PosterFormat>('A4');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useSeoMeta({
    title: 'Print Posters — BitPopArt Print Shop',
    description: 'Download high-quality print-ready PDF posters by BitPopArt. Choose A3, A4, A5 or A6 (postcard) format. Pay with Bitcoin Lightning and download instantly.',
    keywords: 'print posters, bitcoin art print, pop art poster, pdf download, print shop, bitpopart poster, a3 poster, a4 poster',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Print Posters — BitPopArt Print Shop',
    ogDescription: 'Download high-quality print-ready PDF posters. Pay with Bitcoin Lightning, choose your format, and print at home or at your local print shop.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/print',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Print Posters — BitPopArt Print Shop',
    twitterDescription: 'Bitcoin-powered print shop. Choose format, pay with Lightning, download PDF.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  const handleBuy = (poster: PrintPoster, format: PosterFormat) => {
    setSelectedPoster(poster);
    setSelectedFormat(format);
    setPayDialogOpen(true);
  };

  // Artwork-derived posters use id prefix "artwork-" — can't be deleted as print posters
  const handleDeletePoster = (id: string) => {
    if (id.startsWith('artwork-')) return; // artwork-derived items can't be deleted here
    deletePoster(id);
  };

  // Derive available categories from actual poster data
  const availableCategories = getPosterCategories(allPosters);

  // Filter posters by active category
  const filteredPosters = activeCategory === 'All'
    ? allPosters
    : allPosters.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 gap-3">
            <Printer className="h-12 w-12 text-orange-500" />
            <h1 className="text-4xl font-bold leading-tight gradient-header-text">
              Print Shop
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-2">
            Choose your favourite poster design, pick a format, pay with Bitcoin Lightning &amp; download a print-ready PDF
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Print at home or bring the file to any print shop. No login required.
          </p>

          {/* Format info badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {(['A6', 'A5', 'A4', 'A3'] as PosterFormat[]).map((f) => (
              <Badge key={f} variant="outline" className="text-xs px-3 py-1 font-medium">
                <span className="sm:hidden">{f}</span>
                <span className="hidden sm:inline">{f} — {FORMAT_DIMENSIONS[f].description}</span>
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs px-3 py-1 font-medium border-rose-300 text-rose-700 dark:text-rose-300 dark:border-rose-700">
              <span className="sm:hidden">50×70</span>
              <span className="hidden sm:inline">50×70 cm — gallery art print (Art only)</span>
            </Badge>
          </div>

          {/* Lightning address notice */}
          <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Payments to: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">{LIGHTNING_ADDRESS}</code></span>
          </div>

          {isAdmin && (
            <Badge className="mt-4 text-white border-0" style={getGradientStyle('primary')}>
              Admin Mode — Print Shop
            </Badge>
          )}
        </div>

        {/* ── Admin upload ── */}
        {user && isAdmin && (
          <div className="max-w-2xl mx-auto mb-10 space-y-3">
            {!showUploadForm && !showArtworkPicker && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowUploadForm(true)}
                  className="flex-1 text-white border-0 gap-2"
                  style={getGradientStyle('primary')}
                >
                  <Upload className="h-4 w-4" />
                  Upload New Print Poster
                </Button>
                <Button
                  onClick={() => setShowArtworkPicker(true)}
                  variant="outline"
                  className="flex-1 gap-2 border-rose-300 text-rose-700 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <Image className="h-4 w-4" />
                  Add from Artwork Gallery
                </Button>
              </div>
            )}
            {showUploadForm && (
              <AdminUploadForm onClose={() => setShowUploadForm(false)} />
            )}
            {showArtworkPicker && (
              <ArtworkPicker
                onPick={() => setShowArtworkPicker(false)}
                onClose={() => setShowArtworkPicker(false)}
              />
            )}
          </div>
        )}

        {/* ── Art Prints Section ── */}
        {!isLoading && allPosters.filter(p => p.category === 'Art').length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Palette className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Art Prints
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
                    A6 · A5 · A4 · A3 · 50×70 cm
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">Gallery-quality fine art prints — available in larger 50×70 cm format</p>
              </div>
              <Sparkles className="h-5 w-5 text-rose-400 ml-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPosters.filter(p => p.category === 'Art').map(poster => (
                <PosterCard
                  key={poster.id}
                  poster={poster}
                  isAdmin={isAdmin && !poster.id.startsWith('artwork-')}
                  onDelete={handleDeletePoster}
                  onBuy={handleBuy}
                  btcRate={btcRate}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Divider if both Art and other posters exist ── */}
        {!isLoading && allPosters.filter(p => p.category === 'Art').length > 0 && allPosters.filter(p => p.category !== 'Art').length > 0 && (
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Printer className="h-4 w-4" /> All Posters
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        {/* ── Category filter bar ── */}
        {!isLoading && availableCategories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Browse by Category</span>
            </div>
            {/* Horizontal scroll on mobile, wrap on desktop */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 scrollbar-none">
              {/* All button */}
              <button
                onClick={() => setActiveCategory('All')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  activeCategory === 'All'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                }`}
              >
                All
                <span className="ml-1.5 text-xs opacity-70">({allPosters.length})</span>
              </button>
              {/* Per-category buttons */}
              {availableCategories.map(cat => {
                const count = allPosters.filter(p => p.category === cat).length;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      isActive
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                        : `${categoryColorClass(cat)} hover:opacity-90`
                    }`}
                  >
                    {cat}
                    <span className="ml-1.5 text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && allPosters.length === 0 && (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <Printer className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="font-semibold mb-1">No posters yet</p>
                  <p className="text-sm text-muted-foreground">Check back soon or try a different relay.</p>
                </div>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── No results in this category ── */}
        {!isLoading && allPosters.length > 0 && filteredPosters.length === 0 && (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground text-sm">No posters in "{activeCategory}" yet.</p>
              <Button variant="link" className="mt-2 text-orange-500" onClick={() => setActiveCategory('All')}>
                Show all posters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Poster grid ── */}
        {!isLoading && filteredPosters.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {filteredPosters.length} poster{filteredPosters.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && <> in <span className={`inline-block mx-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryColorClass(activeCategory)}`}>{activeCategory}</span></>}
              {artworkPosters.length > 0 && activeCategory === 'All' && (
                <span className="ml-2 text-xs text-rose-600 dark:text-rose-400">
                  (includes {artworkPosters.length} from art gallery)
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosters.map(poster => (
                <PosterCard
                  key={poster.id}
                  poster={poster}
                  isAdmin={isAdmin && !poster.id.startsWith('artwork-')}
                  onDelete={handleDeletePoster}
                  onBuy={handleBuy}
                  btcRate={btcRate}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr &amp; BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* ── Payment Dialog ── */}
      <PrintPaymentDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        poster={selectedPoster}
        format={selectedFormat}
      />
    </div>
  );
}
