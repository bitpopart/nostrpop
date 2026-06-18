import { useState, useRef, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePrintPosters, useCreatePrintPoster, useDeletePrintPoster, DEFAULT_FORMAT_PRICES } from '@/hooks/usePrintPosters';
import type { PrintPoster, PosterFormat, PosterFormatPrice } from '@/hooks/usePrintPosters';
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
  Download,
  Zap,
  Copy,
  QrCode,
  FileImage,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import QRCode from 'qrcode';

// ─── Paper format dimensions (mm) ───────────────────────────────────────────
const FORMAT_DIMENSIONS: Record<PosterFormat, { width: number; height: number; label: string; description: string }> = {
  A3: { width: 297, height: 420, label: 'A3 Poster', description: '297 × 420 mm — large wall poster' },
  A4: { width: 210, height: 297, label: 'A4 Poster', description: '210 × 297 mm — standard print' },
  A5: { width: 148, height: 210, label: 'A5 Poster', description: '148 × 210 mm — half-sheet' },
  A6: { width: 105, height: 148, label: 'A6 Postcard', description: '105 × 148 mm — postcard size' },
};

// ─── Lightning address ───────────────────────────────────────────────────────
const LIGHTNING_ADDRESS = 'bitpopart@walletofsatoshi.com';

// ─── PDF download helper ─────────────────────────────────────────────────────
async function downloadAsPdf(
  svgUrl: string,
  format: PosterFormat,
  title: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { width, height } = FORMAT_DIMENSIONS[format];

  // Fetch the SVG content
  const response = await fetch(svgUrl);
  const svgText = await response.text();

  // Convert SVG to image via canvas
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgObjectUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = svgObjectUrl;
  });

  // Render to canvas at high resolution (3x for print quality)
  const scale = 3;
  const canvas = document.createElement('canvas');
  canvas.width = img.width * scale || width * scale * 3.7795; // fallback: mm to px at 96dpi
  canvas.height = img.height * scale || height * scale * 3.7795;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(svgObjectUrl);

  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  // Create PDF
  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, width, height);

  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(`${safeTitle}_${format}.pdf`);
}

// ─── PosterCard component ─────────────────────────────────────────────────────
interface PosterCardProps {
  poster: PrintPoster;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onBuy: (poster: PrintPoster, format: PosterFormat) => void;
}

function PosterCard({ poster, isAdmin, onDelete, onBuy }: PosterCardProps) {
  const [selectedFormat, setSelectedFormat] = useState<PosterFormat>('A4');
  const selectedPrice = poster.formats.find(f => f.format === selectedFormat)!;

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-shadow duration-300">
      {/* Preview */}
      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <img
          src={poster.previewUrl}
          alt={poster.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {isAdmin && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={() => onDelete(poster.id)}
            title="Delete poster"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base leading-tight">{poster.title}</h3>
          {poster.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{poster.description}</p>
          )}
        </div>

        {/* Format selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Choose Format
          </Label>
          <div className="grid grid-cols-4 gap-1">
            {poster.formats.map((fp) => (
              <button
                key={fp.format}
                onClick={() => setSelectedFormat(fp.format)}
                className={`rounded-md border text-xs font-semibold py-1.5 transition-colors ${
                  selectedFormat === fp.format
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600'
                }`}
              >
                {fp.format}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {FORMAT_DIMENSIONS[selectedFormat].description}
          </p>
        </div>

        {/* Price display */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              €{selectedPrice.priceEur.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground ml-2">
              / ${selectedPrice.priceUsd.toFixed(2)}
            </span>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Zap className="h-3 w-3 text-yellow-500" />
              {selectedPrice.priceSats.toLocaleString()} sats
            </div>
          </div>
        </div>

        {/* Buy button */}
        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0 font-semibold gap-2"
          onClick={() => onBuy(poster, selectedFormat)}
        >
          <Zap className="h-4 w-4" />
          Pay & Download PDF
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

  const selectedPrice = poster && format ? poster.formats.find(f => f.format === format) : null;

  const handleConfirmPayment = useCallback(async () => {
    stopDetection();
    setPaymentDone(true);
  }, [stopDetection]);

  const handleCreateInvoice = async () => {
    if (!selectedPrice) return;
    setIsCreatingInvoice(true);
    try {
      const pr = await getZapInvoice(selectedPrice.priceSats);
      if (!pr) return;
      const invoiceData = {
        pr,
        amountSats: selectedPrice.priceSats,
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
      setInvoice(invoiceData);
      // Generate QR
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
      await downloadAsPdf(poster.svgUrl, format, poster.title);
      toast({ title: 'PDF Downloaded!', description: `${poster.title} — ${format} format saved.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Download Failed', description: 'Could not generate PDF. Try again.', variant: 'destructive' });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-orange-500" />
            {paymentDone ? 'Download Your Poster' : `Purchase ${FORMAT_DIMENSIONS[format].label}`}
          </DialogTitle>
          <DialogDescription>
            {paymentDone
              ? `Payment confirmed! Download "${poster.title}" as a high-quality PDF.`
              : `Pay with Bitcoin Lightning to unlock the print-ready PDF.`}
          </DialogDescription>
        </DialogHeader>

        {paymentDone ? (
          /* ── Post-payment: Download ── */
          <div className="space-y-5 py-2">
            <div className="flex items-center justify-center py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-green-600" />
              </div>
            </div>
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="font-semibold">{poster.title}</p>
                <p className="text-muted-foreground">{FORMAT_DIMENSIONS[format].label} — {FORMAT_DIMENSIONS[format].description}</p>
                <p className="text-muted-foreground">Paid: {selectedPrice.priceSats.toLocaleString()} sats</p>
              </CardContent>
            </Card>
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0 font-bold gap-2 h-12 text-base"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating PDF…</>
              ) : (
                <><Download className="h-5 w-5" /> Download PDF — {format}</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              High-resolution print-ready PDF. Bring to any print shop or print at home.
            </p>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          /* ── Payment flow ── */
          <div className="space-y-4 py-2">
            {/* Order summary */}
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poster</span>
                  <span className="font-medium">{poster.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format</span>
                  <span className="font-medium">{FORMAT_DIMENSIONS[format].label}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    <p className="font-bold text-lg text-orange-600">€{selectedPrice.priceEur.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      {selectedPrice.priceSats.toLocaleString()} sats
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {invoice ? (
              /* ── Invoice created ── */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white rounded-xl p-4 inline-block shadow">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Lightning QR" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                        <QrCode className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Scan with your Lightning wallet
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input value={invoice.pr} readOnly className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(invoice.pr);
                      toast({ title: 'Copied!', description: 'Invoice copied to clipboard.' });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 gap-2"
                  onClick={() => {
                    payWithWebLN(
                      invoice.pr,
                      handleConfirmPayment,
                      () => {
                        openLightningWallet(invoice.pr);
                        handleStartDetection();
                      }
                    );
                  }}
                  disabled={isDetecting}
                >
                  <Zap className="h-4 w-4" />
                  {typeof window !== 'undefined' && window.webln ? 'Pay with WebLN' : 'Open Lightning Wallet'}
                </Button>

                {isDetecting ? (
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Waiting for payment…
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleConfirmPayment}>
                        Payment sent? Click here
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs" onClick={stopDetection}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Paid via QR? Click below to confirm and unlock your download.
                    </p>
                    <Button variant="outline" size="sm" className="text-xs" onClick={handleStartDetection}>
                      Start Payment Detection
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Generate invoice ── */
              <div className="space-y-3">
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    <Zap className="h-4 w-4" />
                    Lightning Payment
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                    Pay to: <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">{LIGHTNING_ADDRESS}</code>
                  </p>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 gap-2"
                  onClick={handleCreateInvoice}
                  disabled={isCreatingInvoice || lnurlLoading || !lnurlData}
                >
                  {isCreatingInvoice || lnurlLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating Invoice…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Generate Lightning Invoice</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Admin: Upload Form ────────────────────────────────────────────────────────
interface UploadFormProps {
  onClose: () => void;
}

function AdminUploadForm({ onClose }: UploadFormProps) {
  const { getGradientStyle } = useThemeColors();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: createPoster, isPending: isPublishing } = useCreatePrintPoster();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgPreview, setSvgPreview] = useState('');
  const [svgUrl, setSvgUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formats, setFormats] = useState<PosterFormatPrice[]>(DEFAULT_FORMAT_PRICES.map(f => ({ ...f })));
  const [showPricing, setShowPricing] = useState(false);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSvgFile(file);
    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setSvgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload immediately
    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      setSvgUrl(tags[0][1]);
      toast({ title: 'File uploaded', description: 'SVG uploaded successfully.' });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload SVG.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const updateFormatPrice = (format: PosterFormat, field: keyof PosterFormatPrice, value: string) => {
    setFormats(prev => prev.map(f =>
      f.format === format
        ? { ...f, [field]: field === 'format' ? value : parseFloat(value) || 0 }
        : f
    ));
  };

  const handlePublish = () => {
    if (!svgUrl) {
      toast({ title: 'No SVG', description: 'Please upload an SVG file first.', variant: 'destructive' });
      return;
    }
    if (!title.trim()) {
      toast({ title: 'No title', description: 'Please enter a title.', variant: 'destructive' });
      return;
    }
    createPoster(
      { title: title.trim(), description: description.trim(), svgUrl, previewUrl: svgUrl, formats },
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* SVG Upload */}
        <div className="space-y-2">
          <Label>SVG File *</Label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-orange-300 dark:border-orange-700 overflow-hidden relative">
            {svgPreview ? (
              <img src={svgPreview} alt="preview" className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileImage className="h-8 w-8 text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Click to select SVG file</span>
                <span className="text-xs">SVG, PNG, or any image format</span>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
            {svgUrl && !isUploading && (
              <div className="absolute top-2 left-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow" />
              </div>
            )}
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

        {/* Pricing per format */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPricing(v => !v)}
          >
            <Settings className="h-4 w-4" />
            Set Prices per Format
            {showPricing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showPricing && (
            <div className="space-y-3 pt-1">
              {formats.map(fp => (
                <div key={fp.format} className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-semibold">{FORMAT_DIMENSIONS[fp.format].label}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">USD ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fp.priceUsd}
                        onChange={e => updateFormatPrice(fp.format, 'priceUsd', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">EUR (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fp.priceEur}
                        onChange={e => updateFormatPrice(fp.format, 'priceEur', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sats ⚡</Label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={fp.priceSats}
                        onChange={e => updateFormatPrice(fp.format, 'priceSats', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish button */}
        <Button
          onClick={handlePublish}
          disabled={isPublishing || isUploading || !svgUrl}
          className="w-full text-white border-0"
          style={getGradientStyle('primary')}
        >
          {isPublishing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing…</>
          ) : (
            <><Plus className="h-4 w-4 mr-2" />Publish Poster</>
          )}
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
  const { data: posters = [], isLoading } = usePrintPosters();
  const { mutate: deletePoster } = useDeletePrintPoster();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<PrintPoster | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<PosterFormat>('A4');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ── Header ── */}
        <div className="text-center mb-10">
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
            {(Object.entries(FORMAT_DIMENSIONS) as [PosterFormat, (typeof FORMAT_DIMENSIONS)[PosterFormat]][]).map(([f, d]) => (
              <Badge key={f} variant="outline" className="text-xs px-3 py-1 font-medium">
                {f} — {d.description}
              </Badge>
            ))}
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
          <div className="max-w-2xl mx-auto mb-10">
            {!showUploadForm ? (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="w-full text-white border-0 gap-2"
                style={getGradientStyle('primary')}
              >
                <Plus className="h-4 w-4" />
                Upload New Print Poster
              </Button>
            ) : (
              <AdminUploadForm onClose={() => setShowUploadForm(false)} />
            )}
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
        {!isLoading && posters.length === 0 && (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <Printer className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="font-semibold mb-1">No posters yet</p>
                  <p className="text-sm text-muted-foreground">
                    Check back soon or try a different relay.
                  </p>
                </div>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Poster grid ── */}
        {!isLoading && posters.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {posters.length} poster design{posters.length !== 1 ? 's' : ''} available
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posters.map(poster => (
                <PosterCard
                  key={poster.id}
                  poster={poster}
                  isAdmin={isAdmin}
                  onDelete={deletePoster}
                  onBuy={handleBuy}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray:400">
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
