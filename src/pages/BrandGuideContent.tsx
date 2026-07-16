/**
 * BrandGuideContent — the full brand guide UI.
 * Used both on the public /brand-guide page AND inside the client portal.
 */
import { useState } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Loader2, Palette, Type, Layers, Shapes, Image as ImageIcon, FileText, ArrowDownToLine } from 'lucide-react';

// ─── File manifest ─────────────────────────────────────────────────────────────

interface BrandFile {
  path: string;
  zipPath: string;
  label: string;
  category: string;
  ext: string;
}

export const BRAND_FILES: BrandFile[] = [
  // README
  { path: '/brand-guide/README.txt', zipPath: 'BitPopArt-Brand-Guide/README.txt', label: 'README.txt', category: 'readme', ext: 'TXT' },
  // Logos
  { path: '/brand-guide/logos/bitpopart-logo.svg', zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-logo.svg', label: 'bitpopart-logo', category: 'logos', ext: 'SVG' },
  { path: '/brand-guide/logos/bitpopart-logo.png', zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-logo.png', label: 'bitpopart-logo', category: 'logos', ext: 'PNG' },
  { path: '/brand-guide/logos/bitpopart-text-logo.svg', zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-text-logo.svg', label: 'bitpopart-text-logo', category: 'logos', ext: 'SVG' },
  { path: '/brand-guide/logos/block-text-logo.svg', zipPath: 'BitPopArt-Brand-Guide/logos/block-text-logo.svg', label: 'block-text-logo', category: 'logos', ext: 'SVG' },
  { path: '/brand-guide/logos/app-icon.svg', zipPath: 'BitPopArt-Brand-Guide/logos/app-icon.svg', label: 'app-icon', category: 'logos', ext: 'SVG' },
  // Icons
  { path: '/brand-guide/icons/B-Funny_avatar_orange.svg', zipPath: 'BitPopArt-Brand-Guide/icons/B-Funny_avatar_orange.svg', label: 'B-Funny Avatar', category: 'icons', ext: 'SVG' },
  { path: '/brand-guide/icons/App_icon.svg', zipPath: 'BitPopArt-Brand-Guide/icons/App_icon.svg', label: 'App Icon (heart)', category: 'icons', ext: 'SVG' },
  { path: '/brand-guide/icons/spray_paint_icon.svg', zipPath: 'BitPopArt-Brand-Guide/icons/spray_paint_icon.svg', label: 'Spray Paint Icon', category: 'icons', ext: 'SVG' },
  { path: '/brand-guide/icons/fan-app-icon.png', zipPath: 'BitPopArt-Brand-Guide/icons/fan-app-icon.png', label: 'Fan App Icon', category: 'icons', ext: 'PNG' },
  // Buttons
  { path: '/brand-guide/buttons/Art_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/Art_button.svg', label: 'Art Button', category: 'buttons', ext: 'SVG' },
  { path: '/brand-guide/buttons/News_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/News_button.svg', label: 'News Button', category: 'buttons', ext: 'SVG' },
  { path: '/brand-guide/buttons/PopUP_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/PopUP_button.svg', label: 'PopUP Button', category: 'buttons', ext: 'SVG' },
  { path: '/brand-guide/buttons/Shop_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/Shop_button.svg', label: 'Shop Button', category: 'buttons', ext: 'SVG' },
  { path: '/brand-guide/buttons/artist_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/artist_button.svg', label: 'Artist Button', category: 'buttons', ext: 'SVG' },
  { path: '/brand-guide/buttons/fundraising_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/fundraising_button.svg', label: 'Fundraising Button', category: 'buttons', ext: 'SVG' },
  { path: '/brand-guide/buttons/projects_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/projects_button.svg', label: 'Projects Button', category: 'buttons', ext: 'SVG' },
  // Gradients
  { path: '/brand-guide/gradients/gradient-bitcoin-orange.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-bitcoin-orange.svg', label: 'Bitcoin Orange Gradient', category: 'gradients', ext: 'SVG' },
  { path: '/brand-guide/gradients/gradient-orange-to-pink.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-orange-to-pink.svg', label: 'Orange → Pink (Nostr CTA)', category: 'gradients', ext: 'SVG' },
  { path: '/brand-guide/gradients/gradient-orange-to-yellow.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-orange-to-yellow.svg', label: 'Orange → Yellow (Hero)', category: 'gradients', ext: 'SVG' },
  { path: '/brand-guide/gradients/gradient-page-background-light.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-page-background-light.svg', label: 'Page Background Light', category: 'gradients', ext: 'SVG' },
  { path: '/brand-guide/gradients/gradient-dark-bitcoin.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-dark-bitcoin.svg', label: 'Dark Bitcoin Canvas', category: 'gradients', ext: 'SVG' },
  // Colors
  { path: '/brand-guide/colors/color-palette.svg', zipPath: 'BitPopArt-Brand-Guide/colors/color-palette.svg', label: 'Color Palette Sheet', category: 'colors', ext: 'SVG' },
  { path: '/brand-guide/colors/colors.txt', zipPath: 'BitPopArt-Brand-Guide/colors/colors.txt', label: 'Color Codes Reference', category: 'colors', ext: 'TXT' },
  // Typography
  { path: '/brand-guide/fonts/typography-specimen.svg', zipPath: 'BitPopArt-Brand-Guide/fonts/typography-specimen.svg', label: 'Typography Specimen', category: 'fonts', ext: 'SVG' },
  // UI components
  { path: '/brand-guide/ui-components/ui-buttons.svg', zipPath: 'BitPopArt-Brand-Guide/ui-components/ui-buttons.svg', label: 'UI Buttons & Badges', category: 'ui', ext: 'SVG' },
  { path: '/brand-guide/ui-components/border-radius-spacing.svg', zipPath: 'BitPopArt-Brand-Guide/ui-components/border-radius-spacing.svg', label: 'Border Radius & Spacing', category: 'ui', ext: 'SVG' },
  // HTML guide
  { path: '/brand-guide/index.html', zipPath: 'BitPopArt-Brand-Guide/index.html', label: 'Interactive HTML Guide', category: 'html', ext: 'HTML' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function downloadSingleFile(file: BrandFile) {
  const res = await fetch(file.path);
  if (!res.ok) throw new Error('Fetch failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.zipPath.split('/').pop() ?? file.label;
  a.click();
  URL.revokeObjectURL(url);
}

const EXT_COLOR: Record<string, string> = {
  SVG: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  PNG: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  TXT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  HTML: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

// ─── Single file row ───────────────────────────────────────────────────────────

function FileRow({ file }: { file: BrandFile }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try { await downloadSingleFile(file); } catch { /* ignore */ } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/40 transition group">
      {/* Thumbnail for SVG / PNG */}
      {(file.ext === 'SVG' || file.ext === 'PNG') && (
        <div className="w-10 h-10 rounded-md border border-border bg-card flex items-center justify-center overflow-hidden shrink-0">
          <img src={file.path} alt={file.label} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
        </div>
      )}
      {file.ext !== 'SVG' && file.ext !== 'PNG' && (
        <div className="w-10 h-10 rounded-md border border-border bg-muted flex items-center justify-center shrink-0 text-[10px] font-mono text-muted-foreground">
          {file.ext}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{file.label}</p>
        <p className="text-[10px] text-muted-foreground font-mono truncate">{file.zipPath.split('/').pop()}</p>
      </div>

      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${EXT_COLOR[file.ext] ?? ''}`}>{file.ext}</span>

      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDownload}
        disabled={busy}
        title={`Download ${file.label}`}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

// ─── Category block ────────────────────────────────────────────────────────────

interface CategoryProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  files: BrandFile[];
}

function CategoryBlock({ title, icon, files }: CategoryProps) {
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="font-bold text-sm">{title}</span>
          <Badge variant="secondary" className="text-[10px]">{files.length}</Badge>
        </div>
        <div className="divide-y divide-border/50">
          {files.map(f => <FileRow key={f.path} file={f} />)}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Color swatches ────────────────────────────────────────────────────────────

const SWATCHES = [
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c',
  '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#431407',
];

const ACCENT_SWATCHES = [
  { hex: '#e99840', label: 'Theme Accent' },
  { hex: '#f7931a', label: '₿ BTC Official' },
  { hex: '#ff042c', label: 'Pop Red' },
  { hex: '#ec4899', label: 'Nostr Pink' },
  { hex: '#4cc1bb', label: 'Pop Teal' },
  { hex: '#fce000', label: 'Pop Yellow' },
];

// ─── Main component ────────────────────────────────────────────────────────────

export default function BrandGuideContent() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleZipDownload = async () => {
    setDownloading(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      const total = BRAND_FILES.length;
      for (let i = 0; i < total; i++) {
        const { path, zipPath } = BRAND_FILES[i];
        try {
          const res = await fetch(path);
          if (res.ok) zip.file(zipPath, await res.blob());
        } catch { /* skip */ }
        setProgress(Math.round(((i + 1) / total) * 100));
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BitPopArt-Brand-Guide.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP download failed', err);
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  const byCategory = (cat: string) => BRAND_FILES.filter(f => f.category === cat);

  return (
    <div className="space-y-6">

      {/* Download all ZIP */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/20">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-black text-lg text-foreground">Download Everything</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {BRAND_FILES.length} files · SVGs, PNGs, color codes, typography, UI components + HTML guide
              </p>
              {downloading && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 w-full max-w-xs overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Packing… {progress}%</p>
                </div>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleZipDownload}
              disabled={downloading}
              className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold hover:from-orange-600 hover:to-yellow-500 shrink-0 gap-2"
            >
              {downloading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Packing…</>
                : <><Download className="h-4 w-4" />Download .zip</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Color swatches */}
      <div>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-orange-500" />
          Color Palette
        </h2>
        <div className="flex gap-1 flex-wrap mb-3">
          {SWATCHES.map(hex => (
            <div key={hex} className="group relative">
              <div className="w-9 h-9 rounded-lg border border-white/10 cursor-default" style={{ background: hex }} title={hex} />
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">{hex}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_SWATCHES.map(({ hex, label }) => (
            <div key={hex} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" style={{ background: hex }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Gradients preview */}
      <div>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-orange-500" />
          Gradients
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Bitcoin Orange', style: 'linear-gradient(to right,#f97316,#ea580c)' },
            { label: 'Nostr CTA', style: 'linear-gradient(to right,#f97316,#ec4899)' },
            { label: 'Hero Text', style: 'linear-gradient(to right,#f97316,#facc15,#f97316)' },
            { label: 'Dark Canvas', style: 'linear-gradient(135deg,#431407,#7c2d12)' },
          ].map(({ label, style }) => (
            <div key={label} className="rounded-xl overflow-hidden border border-border">
              <div className="h-12" style={{ background: style }} />
              <div className="px-2 py-1.5 bg-card">
                <p className="text-[10px] font-bold text-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File categories with individual downloads */}
      <div>
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-orange-500" />
          Individual Downloads
          <span className="text-xs text-muted-foreground font-normal">— hover a file to download it</span>
        </h2>

        <div className="space-y-4">
          <CategoryBlock id="logos" title="Logos" icon={<ImageIcon className="h-4 w-4 text-orange-500" />} files={byCategory('logos')} />
          <CategoryBlock id="icons" title="Icons" icon={<ImageIcon className="h-4 w-4 text-orange-500" />} files={byCategory('icons')} />
          <CategoryBlock id="buttons" title="Navigation Button SVGs" icon={<Shapes className="h-4 w-4 text-orange-500" />} files={byCategory('buttons')} />
          <CategoryBlock id="gradients" title="Gradient Swatches" icon={<Palette className="h-4 w-4 text-pink-500" />} files={byCategory('gradients')} />
          <CategoryBlock id="colors" title="Color Reference" icon={<Palette className="h-4 w-4 text-orange-500" />} files={byCategory('colors')} />
          <CategoryBlock id="fonts" title="Typography" icon={<Type className="h-4 w-4 text-orange-500" />} files={byCategory('fonts')} />
          <CategoryBlock id="ui" title="UI Components" icon={<Shapes className="h-4 w-4 text-orange-500" />} files={byCategory('ui')} />
          <CategoryBlock id="html" title="Interactive HTML Guide" icon={<FileText className="h-4 w-4 text-orange-500" />} files={byCategory('html')} />
        </div>
      </div>

    </div>
  );
}
