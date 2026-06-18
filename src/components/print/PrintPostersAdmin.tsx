import { useState, useRef } from 'react';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  usePrintPosters,
  useCreatePrintPoster,
  useDeletePrintPoster,
  DEFAULT_FORMAT_PRICES,
  POSTER_CATEGORIES,
  getPosterCategories,
} from '@/hooks/usePrintPosters';
import type { PosterFormat, PosterFormatPrice } from '@/hooks/usePrintPosters';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Printer,
  Upload,
  Plus,
  Trash2,
  Loader2,
  X,
  CheckCircle2,
  FileImage,
  ChevronDown,
  ChevronUp,
  Settings,
  Zap,
  ExternalLink,
  Tag,
  LayoutGrid,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FORMAT_LABELS: Record<PosterFormat, string> = {
  A3: 'A3 — 297×420 mm',
  A4: 'A4 — 210×297 mm',
  A5: 'A5 — 148×210 mm',
  A6: 'A6 Postcard — 105×148 mm',
};

// Category color helper (same palette as Print page)
const CATEGORY_COLORS: Record<string, string> = {
  Bitcoin:      'bg-orange-100 text-orange-700 border-orange-200',
  'Pop Art':    'bg-pink-100 text-pink-700 border-pink-200',
  Travel:       'bg-cyan-100 text-cyan-700 border-cyan-200',
  Photography:  'bg-blue-100 text-blue-700 border-blue-200',
  Abstract:     'bg-purple-100 text-purple-700 border-purple-200',
  Typography:   'bg-gray-100 text-gray-700 border-gray-200',
  Nature:       'bg-green-100 text-green-700 border-green-200',
  City:         'bg-slate-100 text-slate-700 border-slate-200',
  Music:        'bg-violet-100 text-violet-700 border-violet-200',
  Sport:        'bg-lime-100 text-lime-700 border-lime-200',
  Motivational: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Humor:        'bg-amber-100 text-amber-700 border-amber-200',
  Holiday:      'bg-red-100 text-red-700 border-red-200',
  Animals:      'bg-teal-100 text-teal-700 border-teal-200',
};
function catColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

// ─── Upload Form ──────────────────────────────────────────────────────────────
function UploadForm({ onClose }: { onClose: () => void }) {
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
  const [formats, setFormats] = useState<PosterFormatPrice[]>(
    DEFAULT_FORMAT_PRICES.map(f => ({ ...f }))
  );
  const [showPricing, setShowPricing] = useState(false);

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
      toast({ title: 'File uploaded', description: 'Poster file uploaded successfully.' });
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload the file.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const updateFormatPrice = (format: PosterFormat, field: keyof PosterFormatPrice, value: string) => {
    setFormats(prev =>
      prev.map(f =>
        f.format === format
          ? { ...f, [field]: field === 'format' ? value : parseFloat(value) || 0 }
          : f
      )
    );
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
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload New Print Poster
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File drop zone */}
        <div className="space-y-1">
          <Label className="text-sm">Poster File (SVG / PNG / JPG) *</Label>
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-orange-300 dark:border-orange-700 overflow-hidden relative">
            {svgPreview
              ? <img src={svgPreview} alt="preview" className="absolute inset-0 w-full h-full object-contain" />
              : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileImage className="h-7 w-7 text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Click to select file</span>
                  <span className="text-xs">SVG recommended for best print quality</span>
                </div>
              )}
            {isUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-8 w-8 text-white animate-spin" /></div>}
            {svgUrl && !isUploading && <div className="absolute top-2 left-2"><CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow" /></div>}
            <input ref={fileRef} type="file" accept="image/svg+xml,image/*" className="hidden" onChange={handleFileChange} />
          </label>
          {svgFile && <p className="text-xs text-muted-foreground">{svgFile.name}</p>}
        </div>

        {/* Title & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm">Title *</Label>
            <Input placeholder="e.g. Bitcoin Orange Poster" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Description</Label>
            <Input placeholder="Short description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Category *</Label>
          <div className="flex flex-wrap gap-1.5">
            {POSTER_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setCustomCategory(''); }}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  category === cat
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCategory('__custom__')}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
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
              className="mt-1 h-8 text-sm"
              autoFocus
            />
          )}
          {resolvedCategory && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catColor(resolvedCategory)}`}>{resolvedCategory}</span>
            </p>
          )}
        </div>

        {/* Pricing toggle */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPricing(v => !v)}
          >
            <Settings className="h-4 w-4" />
            Customize Prices per Format
            {showPricing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showPricing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formats.map(fp => (
                <div key={fp.format} className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-semibold">{FORMAT_LABELS[fp.format]}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">USD ($)</Label>
                      <Input type="number" min="0" step="0.01" value={fp.priceUsd} onChange={e => updateFormatPrice(fp.format, 'priceUsd', e.target.value)} className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">EUR (€)</Label>
                      <Input type="number" min="0" step="0.01" value={fp.priceEur} onChange={e => updateFormatPrice(fp.format, 'priceEur', e.target.value)} className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sats ⚡</Label>
                      <Input type="number" min="0" step="100" value={fp.priceSats} onChange={e => updateFormatPrice(fp.format, 'priceSats', e.target.value)} className="h-7 text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish */}
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

// ─── Main Admin Component ─────────────────────────────────────────────────────
export function PrintPostersAdmin() {
  const navigate = useNavigate();
  const { data: posters = [], isLoading } = usePrintPosters();
  const { mutate: deletePoster } = useDeletePrintPoster();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  const availableCategories = getPosterCategories(posters);
  const filteredPosters = filterCategory === 'All' ? posters : posters.filter(p => p.category === filterCategory);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="h-6 w-6 text-orange-500" />
              <div>
                <CardTitle>Print Shop Management</CardTitle>
                <CardDescription>
                  Upload SVG posters for sale. Visitors pay via Lightning and download a print-ready PDF.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/print')}
              className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Print Shop
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload toggle */}
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0"
            >
              <Plus className="h-4 w-4" />
              Upload New Print Poster
            </Button>
          ) : (
            <UploadForm onClose={() => setShowForm(false)} />
          )}

          {/* Default price reference */}
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 p-3">
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">Default prices per format:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEFAULT_FORMAT_PRICES.map(fp => (
                <div key={fp.format} className="text-xs text-center">
                  <span className="font-bold">{fp.format}</span>
                  <div className="text-muted-foreground">€{fp.priceEur} / ${fp.priceUsd}</div>
                  <div className="flex items-center justify-center gap-0.5 text-yellow-600">
                    <Zap className="h-2.5 w-2.5" />{fp.priceSats.toLocaleString()} sats
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Published Posters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Published Posters ({isLoading ? '…' : posters.length})
          </h3>
        </div>

        {/* Category filter */}
        {!isLoading && availableCategories.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
              Filter by category:
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterCategory('All')}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  filterCategory === 'All'
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                All ({posters.length})
              </button>
              {availableCategories.map(cat => {
                const count = posters.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      filterCategory === cat
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : `${catColor(cat)} hover:opacity-90`
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && posters.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No posters published yet. Upload your first poster above.
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredPosters.length === 0 && posters.length > 0 && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No posters in "{filterCategory}".
              <Button variant="link" size="sm" onClick={() => setFilterCategory('All')} className="text-orange-500 pl-1">Show all</Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredPosters.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredPosters.map(poster => (
              <div key={poster.id} className="group relative rounded-xl overflow-hidden border bg-white dark:bg-gray-800 shadow-sm">
                {/* Preview */}
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-700">
                  <img src={poster.previewUrl} alt={poster.title} className="w-full h-full object-contain" loading="lazy" />
                </div>
                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${catColor(poster.category)}`}>
                    {poster.category}
                  </span>
                </div>
                {/* Delete button */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deletePoster(poster.id)}
                  title="Delete poster"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {/* Info */}
                <div className="p-2 space-y-1">
                  <p className="text-xs font-semibold truncate">{poster.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {poster.formats.map(fp => (
                      <Badge key={fp.format} variant="outline" className="text-[10px] px-1 py-0">
                        {fp.format} €{fp.priceEur}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
