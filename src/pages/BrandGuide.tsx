import { useState } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Loader2, Palette, Type, Layers, Shapes, Image as ImageIcon, FileText } from 'lucide-react';

// All brand-guide files served from /brand-guide/ in public/
const BRAND_FILES: { path: string; zipPath: string }[] = [
  // README
  { path: '/brand-guide/README.txt', zipPath: 'BitPopArt-Brand-Guide/README.txt' },
  // Logos
  { path: '/brand-guide/logos/bitpopart-logo.svg', zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-logo.svg' },
  { path: '/brand-guide/logos/bitpopart-logo.png', zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-logo.png' },
  { path: '/brand-guide/logos/bitpopart-text-logo.svg', zipPath: 'BitPopArt-Brand-Guide/logos/bitpopart-text-logo.svg' },
  { path: '/brand-guide/logos/block-text-logo.svg', zipPath: 'BitPopArt-Brand-Guide/logos/block-text-logo.svg' },
  { path: '/brand-guide/logos/app-icon.svg', zipPath: 'BitPopArt-Brand-Guide/logos/app-icon.svg' },
  // Icons
  { path: '/brand-guide/icons/B-Funny_avatar_orange.svg', zipPath: 'BitPopArt-Brand-Guide/icons/B-Funny_avatar_orange.svg' },
  { path: '/brand-guide/icons/App_icon.svg', zipPath: 'BitPopArt-Brand-Guide/icons/App_icon.svg' },
  { path: '/brand-guide/icons/spray_paint_icon.svg', zipPath: 'BitPopArt-Brand-Guide/icons/spray_paint_icon.svg' },
  { path: '/brand-guide/icons/fan-app-icon.png', zipPath: 'BitPopArt-Brand-Guide/icons/fan-app-icon.png' },
  // Buttons
  { path: '/brand-guide/buttons/Art_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/Art_button.svg' },
  { path: '/brand-guide/buttons/News_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/News_button.svg' },
  { path: '/brand-guide/buttons/PopUP_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/PopUP_button.svg' },
  { path: '/brand-guide/buttons/Shop_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/Shop_button.svg' },
  { path: '/brand-guide/buttons/artist_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/artist_button.svg' },
  { path: '/brand-guide/buttons/fundraising_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/fundraising_button.svg' },
  { path: '/brand-guide/buttons/projects_button.svg', zipPath: 'BitPopArt-Brand-Guide/buttons/projects_button.svg' },
  // Gradients
  { path: '/brand-guide/gradients/gradient-bitcoin-orange.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-bitcoin-orange.svg' },
  { path: '/brand-guide/gradients/gradient-orange-to-pink.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-orange-to-pink.svg' },
  { path: '/brand-guide/gradients/gradient-orange-to-yellow.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-orange-to-yellow.svg' },
  { path: '/brand-guide/gradients/gradient-page-background-light.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-page-background-light.svg' },
  { path: '/brand-guide/gradients/gradient-dark-bitcoin.svg', zipPath: 'BitPopArt-Brand-Guide/gradients/gradient-dark-bitcoin.svg' },
  // Colors
  { path: '/brand-guide/colors/color-palette.svg', zipPath: 'BitPopArt-Brand-Guide/colors/color-palette.svg' },
  { path: '/brand-guide/colors/colors.txt', zipPath: 'BitPopArt-Brand-Guide/colors/colors.txt' },
  // Typography
  { path: '/brand-guide/fonts/typography-specimen.svg', zipPath: 'BitPopArt-Brand-Guide/fonts/typography-specimen.svg' },
  // UI components
  { path: '/brand-guide/ui-components/ui-buttons.svg', zipPath: 'BitPopArt-Brand-Guide/ui-components/ui-buttons.svg' },
  { path: '/brand-guide/ui-components/border-radius-spacing.svg', zipPath: 'BitPopArt-Brand-Guide/ui-components/border-radius-spacing.svg' },
  // Interactive HTML guide
  { path: '/brand-guide/index.html', zipPath: 'BitPopArt-Brand-Guide/index.html' },
];

const SECTIONS = [
  {
    icon: <ImageIcon className="h-5 w-5 text-orange-500" />,
    label: 'Logos & Icons',
    desc: 'SVG logo mark, wordmark, block sub-brand, mascot, app icon — all layers editable in Illustrator / Inkscape',
    count: 9,
    tag: 'SVG · PNG',
  },
  {
    icon: <Layers className="h-5 w-5 text-orange-500" />,
    label: 'Navigation Button SVGs',
    desc: 'Art, News, PopUP, Shop, Artist, Fundraising, Projects — pop-art tile illustrations',
    count: 7,
    tag: 'SVG',
  },
  {
    icon: <Palette className="h-5 w-5 text-orange-500" />,
    label: 'Color Palette',
    desc: 'Full orange scale (50–950), theme accents, pop-art accent colors, neutrals, dark mode — with hex codes',
    count: 2,
    tag: 'SVG · TXT',
  },
  {
    icon: <Palette className="h-5 w-5 text-pink-500" />,
    label: 'Gradient Swatches',
    desc: '5 production gradients: Bitcoin Orange, Nostr CTA (orange→pink), Hero Text (orange→yellow), Page BG, Dark Canvas',
    count: 5,
    tag: 'SVG',
  },
  {
    icon: <Type className="h-5 w-5 text-orange-500" />,
    label: 'Typography Specimen',
    desc: 'All type styles — Display (44px/900), H1 gradient, H2, body, metadata, monospace, badge micro-label',
    count: 1,
    tag: 'SVG',
  },
  {
    icon: <Shapes className="h-5 w-5 text-orange-500" />,
    label: 'UI Components',
    desc: 'Buttons (CTA, outline, ghost, disabled), badges, card states (default, hover, feature, dashed) + radius/spacing',
    count: 2,
    tag: 'SVG',
  },
  {
    icon: <FileText className="h-5 w-5 text-orange-500" />,
    label: 'Interactive Brand Guide',
    desc: 'HTML file — open locally in any browser. Full visual guide with all colors, typography, components and CSS reference',
    count: 1,
    tag: 'HTML',
  },
];

// Color swatches preview
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

export default function BrandGuidePage() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    setDownloading(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const total = BRAND_FILES.length;

      for (let i = 0; i < total; i++) {
        const { path, zipPath } = BRAND_FILES[i];
        try {
          const res = await fetch(path);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(zipPath, blob);
          }
        } catch {
          // skip missing files silently
        }
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
      console.error('Download failed', err);
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5">
      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
          <img
            src="/bitpopart-logo.svg"
            alt="BitPopArt"
            className="h-16 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight">Brand Guide</h1>
            <p className="text-muted-foreground text-sm mt-1">
              BitPopArt · Bitcoin Pop Art · Complete UI/UX &amp; Visual Identity Kit
            </p>
          </div>
        </div>

        {/* Download CTA */}
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/20 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-black text-xl text-foreground">Download Brand Kit</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {BRAND_FILES.length} files · Logos, icons, button SVGs, gradient swatches, color palette, typography, UI components + interactive HTML guide
                </p>
                {downloading && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 overflow-hidden w-full max-w-xs">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Packing… {progress}%</p>
                  </div>
                )}
              </div>
              <Button
                size="lg"
                onClick={handleDownload}
                disabled={downloading}
                className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-bold hover:from-orange-600 hover:to-yellow-500 shrink-0 gap-2"
              >
                {downloading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Packing…</>
                  : <><Download className="h-4 w-4" />Download .zip</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color preview */}
        <div className="mb-8">
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-orange-500" />
            Color Palette Preview
          </h2>
          <div className="flex gap-1 flex-wrap mb-2">
            {SWATCHES.map((hex) => (
              <div key={hex} className="group relative">
                <div
                  className="w-10 h-10 rounded-md border border-white/10 cursor-default"
                  style={{ background: hex }}
                  title={hex}
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                  {hex}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            {ACCENT_SWATCHES.map(({ hex, label }) => (
              <div key={hex} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" style={{ background: hex }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Gradient preview */}
        <div className="mb-8">
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-500" />
            Gradient Swatches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Bitcoin Orange', style: 'linear-gradient(to right,#f97316,#ea580c)', desc: 'from-orange-500 to-orange-600' },
              { label: 'Nostr Publish CTA', style: 'linear-gradient(to right,#f97316,#ec4899)', desc: 'from-orange-500 to-pink-500' },
              { label: 'Hero Text Gradient', style: 'linear-gradient(to right,#f97316,#facc15,#f97316)', desc: 'from-orange-500 via-yellow-400 to-orange-500' },
              { label: 'Block Art Canvas', style: 'linear-gradient(to bottom right,#431407,#7c2d12)', desc: 'from-orange-950 to-orange-900' },
            ].map(({ label, style, desc }) => (
              <div key={label} className="rounded-xl overflow-hidden border border-border">
                <div className="h-14" style={{ background: style }} />
                <div className="px-3 py-2 bg-card">
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contents list */}
        <div className="mb-8">
          <h2 className="font-bold text-base mb-3">What's inside the ZIP</h2>
          <div className="space-y-3">
            {SECTIONS.map(({ icon, label, desc, count, tag }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{label}</span>
                    <Badge variant="secondary" className="text-xs">{count} files</Badge>
                    <Badge variant="outline" className="text-xs font-mono text-orange-600 border-orange-200 dark:border-orange-800">{tag}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick preview buttons */}
        <div className="mb-8">
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <Shapes className="h-4 w-4 text-orange-500" />
            Navigation Button SVGs Preview
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {[
              '/brand-guide/buttons/Art_button.svg',
              '/brand-guide/buttons/News_button.svg',
              '/brand-guide/buttons/PopUP_button.svg',
              '/brand-guide/buttons/Shop_button.svg',
              '/brand-guide/buttons/artist_button.svg',
              '/brand-guide/buttons/fundraising_button.svg',
              '/brand-guide/buttons/projects_button.svg',
            ].map((src) => (
              <div key={src} className="aspect-square bg-card border border-border rounded-xl p-2 flex items-center justify-center overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom download button */}
        <div className="flex justify-center mt-10">
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={downloading}
            className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white font-black text-base hover:from-orange-600 hover:to-yellow-500 gap-2 px-10 py-6"
          >
            {downloading
              ? <><Loader2 className="h-5 w-5 animate-spin" />Packing {progress}%…</>
              : <><Download className="h-5 w-5" />Download BitPopArt Brand Kit (.zip)</>
            }
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          {BRAND_FILES.length} files · SVG layers · color codes · HTML guide · All free to use for BitPopArt branding
        </p>

      </div>
    </div>
  );
}
