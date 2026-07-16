/**
 * BrandGuideContent — the full brand guide UI.
 * Used both on the public /brand-guide page AND inside the client portal.
 */
import { useState } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Download, Loader2, Palette, Type, Layers, Shapes,
  Image as ImageIcon, FileText, ArrowDownToLine, Lock,
} from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// ─── File manifest ─────────────────────────────────────────────────────────────

interface BrandFile {
  relPath: string;   // relative to BASE_URL, e.g. "brand-guide/logos/foo.svg"
  zipPath: string;
  label: string;
  category: string;
  ext: string;
}

// BASE_URL is injected by Vite — '/' in production, may differ in preview
const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // strip trailing slash

function assetUrl(rel: string): string {
  return `${BASE}/${rel}`;
}

const RAW_FILES: Omit<BrandFile, 'relPath'>[] = [
  // README
  { zipPath: 'BitPopArt-Brand-Guide/README.txt', label: 'README.txt', category: 'readme', ext: 'TXT' },
  // Logos
  { zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-logo.svg', label: 'bitpopart-logo', category: 'logos', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-logo.png', label: 'bitpopart-logo', category: 'logos', ext: 'PNG' },
  { zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-text-logo.svg', label: 'bitpopart-text-logo', category: 'logos', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/logos/block-text-logo.svg', label: 'block-text-logo', category: 'logos', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/logos/app-icon.svg', label: 'app-icon', category: 'logos', ext: 'SVG' },
  // Icons
  { zipPath: 'BitPopArt-Brand-Guide/icons/B-Funny_avatar_orange.svg', label: 'B-Funny Avatar', category: 'icons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/icons/App_icon.svg', label: 'App Icon (heart)', category: 'icons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/icons/spray_paint_icon.svg', label: 'Spray Paint Icon', category: 'icons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/icons/fan-app-icon.png', label: 'Fan App Icon', category: 'icons', ext: 'PNG' },
  // Buttons
  { zipPath: 'BitPopArt-Brand-Guide/buttons/Art_button.svg', label: 'Art Button', category: 'buttons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/buttons/News_button.svg', label: 'News Button', category: 'buttons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/buttons/PopUP_button.svg', label: 'PopUP Button', category: 'buttons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/buttons/Shop_button.svg', label: 'Shop Button', category: 'buttons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/buttons/artist_button.svg', label: 'Artist Button', category: 'buttons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/buttons/fundraising_button.svg', label: 'Fundraising Button', category: 'buttons', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/buttons/projects_button.svg', label: 'Projects Button', category: 'buttons', ext: 'SVG' },
  // Gradients
  { zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-bitcoin-orange.svg', label: 'Bitcoin Orange Gradient', category: 'gradients', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-orange-to-pink.svg', label: 'Orange → Pink (Nostr CTA)', category: 'gradients', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-orange-to-yellow.svg', label: 'Orange → Yellow (Hero)', category: 'gradients', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-page-background-light.svg', label: 'Page Background Light', category: 'gradients', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-dark-bitcoin.svg', label: 'Dark Bitcoin Canvas', category: 'gradients', ext: 'SVG' },
  // Colors
  { zipPath: 'BitPopArt-Brand-Guide/colors/color-palette.svg', label: 'Color Palette Sheet', category: 'colors', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/colors/colors.txt', label: 'Color Codes Reference', category: 'colors', ext: 'TXT' },
  // Typography
  { zipPath: 'BitPopArt-Brand-Guide/fonts/typography-specimen.svg', label: 'Typography Specimen', category: 'fonts', ext: 'SVG' },
  // UI components
  { zipPath: 'BitPopArt-Brand-Guide/ui-components/ui-buttons.svg', label: 'UI Buttons & Badges', category: 'ui', ext: 'SVG' },
  { zipPath: 'BitPopArt-Brand-Guide/ui-components/border-radius-spacing.svg', label: 'Border Radius & Spacing', category: 'ui', ext: 'SVG' },
  // HTML guide
  { zipPath: 'BitPopArt-Brand-Guide/index.html', label: 'Interactive HTML Guide', category: 'html', ext: 'HTML' },
];

// Build full file list with resolved URLs at runtime (respects BASE_URL)
export const BRAND_FILES: BrandFile[] = RAW_FILES.map(f => ({
  ...f,
  // zipPath is  "BitPopArt-Brand-Guide/logos/foo.svg"
  // relPath strips the first segment to get "brand-guide/logos/foo.svg"
  relPath: f.zipPath.replace('BitPopArt-Brand-Guide/', 'brand-guide/'),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadSingleFile(file: BrandFile) {
  const url = assetUrl(file.relPath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = file.zipPath.split('/').pop() ?? file.label;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

const EXT_COLOR: Record<string, string> = {
  SVG:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  PNG:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  TXT:  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  HTML: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

// ─── Single file row — download button always visible ─────────────────────────

function FileRow({ file }: { file: BrandFile }) {
  const [busy, setBusy] = useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try { await downloadSingleFile(file); } catch { /* ignore */ } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">

      {/* Thumbnail */}
      {(file.ext === 'SVG' || file.ext === 'PNG') ? (
        <div className="w-11 h-11 rounded-lg border border-border bg-white dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          <img
            src={assetUrl(file.relPath)}
            alt={file.label}
            className="w-9 h-9 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
          />
        </div>
      ) : (
        <div className="w-11 h-11 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-muted-foreground">
          {file.ext}
        </div>
      )}

      {/* Label + filename */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{file.label}</p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">
          {file.zipPath.split('/').pop()}
        </p>
      </div>

      {/* Ext badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${EXT_COLOR[file.ext] ?? ''}`}>
        {file.ext}
      </span>

      {/* Download button — ALWAYS VISIBLE */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3 shrink-0 gap-1.5 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-400"
        onClick={handleDownload}
        disabled={busy}
        title={`Download ${file.label}`}
      >
        {busy
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <ArrowDownToLine className="h-3.5 w-3.5" />
        }
        <span className="hidden sm:inline text-xs">{busy ? 'Saving…' : 'Download'}</span>
      </Button>
    </div>
  );
}

// ─── Category block ───────────────────────────────────────────────────────────

interface CategoryProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  files: BrandFile[];
}

function CategoryBlock({ title, icon, files }: CategoryProps) {
  return (
    <Card className="border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        {icon}
        <span className="font-bold text-sm">{title}</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">{files.length} files</Badge>
      </div>
      <div className="divide-y divide-border/40 px-1">
        {files.map(f => <FileRow key={f.path} file={f} />)}
      </div>
    </Card>
  );
}

// ─── Color swatches ───────────────────────────────────────────────────────────

const SWATCHES = [
  { hex: '#fff7ed', name: '50' },
  { hex: '#ffedd5', name: '100' },
  { hex: '#fed7aa', name: '200' },
  { hex: '#fdba74', name: '300' },
  { hex: '#fb923c', name: '400' },
  { hex: '#f97316', name: '500 ★' },
  { hex: '#ea580c', name: '600' },
  { hex: '#c2410c', name: '700' },
  { hex: '#9a3412', name: '800' },
  { hex: '#7c2d12', name: '900' },
  { hex: '#431407', name: '950' },
];

const ACCENT_SWATCHES = [
  { hex: '#e99840', label: 'Theme Accent' },
  { hex: '#f7931a', label: '₿ BTC' },
  { hex: '#ff042c', label: 'Pop Red' },
  { hex: '#ec4899', label: 'Nostr Pink' },
  { hex: '#4cc1bb', label: 'Pop Teal' },
  { hex: '#fce000', label: 'Pop Yellow' },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface BrandGuideContentProps {
  /** When true (client portal), the ZIP download is also allowed. Default: false (admin-only). */
  allowZip?: boolean;
}

export default function BrandGuideContent({ allowZip = false }: BrandGuideContentProps) {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const canDownloadZip = isAdmin || allowZip;

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress]       = useState(0);

  const handleZipDownload = async () => {
    if (!canDownloadZip) return;
    setDownloading(true);
    setProgress(0);
    try {
      const zip   = new JSZip();
      const total = BRAND_FILES.length;
      for (let i = 0; i < total; i++) {
        const { relPath, zipPath } = BRAND_FILES[i];
        try {
          const res = await fetch(assetUrl(relPath));
          if (res.ok) zip.file(zipPath, await res.blob());
        } catch { /* skip */ }
        setProgress(Math.round(((i + 1) / total) * 100));
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
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
    <div className="space-y-8">

      {/* ── ZIP download card ─────────────────────────────────────────────── */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/20">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-black text-lg text-foreground">Download Everything as .zip</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {BRAND_FILES.length} files · SVGs, PNGs, color codes, typography, UI components + HTML guide
              </p>
              {downloading && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 w-full max-w-xs overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Packing… {progress}%</p>
                </div>
              )}
            </div>

            {canDownloadZip ? (
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
            ) : (
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <Button
                  size="lg"
                  disabled
                  className="gap-2 opacity-60 cursor-not-allowed"
                  variant="outline"
                >
                  <Lock className="h-4 w-4" />
                  Download .zip
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  {user ? 'Admin only' : 'Login required'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Color palette ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-base mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-orange-500" />
          Color Palette
        </h2>
        <div className="flex gap-2 flex-wrap mb-4">
          {SWATCHES.map(({ hex, name }) => (
            <div key={hex} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-lg border border-black/10 dark:border-white/10 shadow-sm cursor-default"
                style={{ background: hex }}
                title={hex}
              />
              <span className="text-[9px] font-mono text-muted-foreground">{hex}</span>
              <span className="text-[9px] text-muted-foreground/60">{name}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_SWATCHES.map(({ hex, label }) => (
            <div key={hex} className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shadow-sm shrink-0"
                style={{ background: hex }}
                title={hex}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-[10px] font-mono text-muted-foreground/60">{hex}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gradient swatches ─────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-base mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-orange-500" />
          Gradients
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Bitcoin Orange',     code: 'from-orange-500 to-orange-600', style: 'linear-gradient(to right,#f97316,#ea580c)' },
            { label: 'Nostr CTA',          code: 'from-orange-500 to-pink-500',   style: 'linear-gradient(to right,#f97316,#ec4899)' },
            { label: 'Hero Text',          code: 'from-orange-500 via-yellow-400 to-orange-500', style: 'linear-gradient(to right,#f97316,#facc15,#f97316)' },
            { label: 'Dark Canvas',        code: 'from-orange-950 to-orange-900', style: 'linear-gradient(135deg,#431407,#7c2d12)' },
          ].map(({ label, code, style }) => (
            <div key={label} className="rounded-xl overflow-hidden border border-border shadow-sm">
              <div className="h-14" style={{ background: style }} />
              <div className="px-3 py-2 bg-card">
                <p className="text-xs font-bold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground font-mono leading-tight mt-0.5">{code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Individual file downloads ─────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-base mb-1 flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-orange-500" />
          Individual Downloads
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Click <strong>Download</strong> on any file to save it individually.
        </p>

        <div className="space-y-4">
          <CategoryBlock
            id="logos" title="Logos"
            icon={<ImageIcon className="h-4 w-4 text-orange-500" />}
            files={byCategory('logos')}
          />
          <CategoryBlock
            id="icons" title="Icons"
            icon={<ImageIcon className="h-4 w-4 text-orange-400" />}
            files={byCategory('icons')}
          />
          <CategoryBlock
            id="buttons" title="Navigation Button SVGs"
            icon={<Shapes className="h-4 w-4 text-orange-500" />}
            files={byCategory('buttons')}
          />
          <CategoryBlock
            id="gradients" title="Gradient Swatches"
            icon={<Palette className="h-4 w-4 text-pink-500" />}
            files={byCategory('gradients')}
          />
          <CategoryBlock
            id="colors" title="Color Reference"
            icon={<Palette className="h-4 w-4 text-orange-500" />}
            files={byCategory('colors')}
          />
          <CategoryBlock
            id="fonts" title="Typography"
            icon={<Type className="h-4 w-4 text-orange-500" />}
            files={byCategory('fonts')}
          />
          <CategoryBlock
            id="ui" title="UI Components"
            icon={<Shapes className="h-4 w-4 text-orange-600" />}
            files={byCategory('ui')}
          />
          <CategoryBlock
            id="html" title="Interactive HTML Brand Guide"
            icon={<FileText className="h-4 w-4 text-orange-500" />}
            files={byCategory('html')}
          />
        </div>
      </div>

    </div>
  );
}
