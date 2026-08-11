import { useState } from 'react';
import JSZip from 'jszip';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Package, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IconInfo {
  /** File name in /public/homepage-icons */
  file: string;
  /** Label shown on the homepage icon box */
  label: string;
  /** Original lucide icon name */
  lucide: string;
  /** Color baked into the SVG */
  color: string;
}

const ICONS: IconInfo[] = [
  { file: 'gallery.svg',      label: 'Gallery',      lucide: 'palette',       color: '#f97316' },
  { file: 'photo-grid.svg',   label: 'Photo Grid',   lucide: 'layout-grid',   color: '#a855f7' },
  { file: 'art-progress.svg', label: 'Art Progress', lucide: 'pencil',        color: '#6366f1' },
  { file: 'art.svg',          label: 'Art',          lucide: 'palette',       color: '#d946ef' },
  { file: 'shop.svg',         label: 'Shop',         lucide: 'shopping-cart', color: '#f43f5e' },
  { file: 'images.svg',       label: 'Images',       lucide: 'image',         color: '#ec4899' },
  { file: 'wallpapers.svg',   label: 'Wallpapers',   lucide: 'layout-grid',   color: '#8b5cf6' },
  { file: 'memes.svg',        label: 'Memes',        lucide: 'wand-sparkles', color: '#eab308' },
  { file: 'avatars.svg',      label: 'Avatars',      lucide: 'users',         color: '#3b82f6' },
  { file: 'gifs.svg',         label: 'GIFs',         lucide: 'play',          color: '#22c55e' },
  { file: 'animations.svg',   label: 'Animations',   lucide: 'clapperboard',  color: '#f97316' },
  { file: 'banners.svg',      label: 'Banners',      lucide: 'frame',         color: '#0ea5e9' },
  { file: 'coloring.svg',     label: 'Coloring',     lucide: 'paintbrush',    color: '#14b8a6' },
  { file: 'cards.svg',        label: 'Cards',        lucide: 'credit-card',   color: '#6366f1' },
  { file: 'games.svg',        label: 'Games',        lucide: 'gamepad-2',     color: '#7c3aed' },
  { file: 'magazine.svg',     label: 'Magazine',     lucide: 'newspaper',     color: '#f43f5e' },
  { file: 'nostr.svg',        label: 'Nostr',        lucide: 'rss',           color: '#8b5cf6' },
  { file: 'studio.svg',       label: 'Studio',       lucide: 'wand-sparkles', color: '#a855f7' },
  { file: 'print.svg',        label: 'Print',        lucide: 'printer',       color: '#4b5563' },
];

const iconUrl = (file: string) => `${import.meta.env.BASE_URL}homepage-icons/${file}`;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function IconDownloads() {
  const [zipping, setZipping] = useState(false);

  const downloadAll = async () => {
    try {
      setZipping(true);
      const zip = new JSZip();
      const folder = zip.folder('homepage-icons');
      for (const icon of ICONS) {
        const res = await fetch(iconUrl(icon.file));
        if (!res.ok) throw new Error(`Failed to fetch ${icon.file}`);
        folder?.file(icon.file, await res.text());
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'bitpopart-homepage-icons.zip');
    } catch (e) {
      console.error('Failed to create ZIP:', e);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Home
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Homepage Icon Downloads
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            The SVG icons used in the icon boxes on the BitPopArt homepage —
            colored exactly as they appear on the site. Lucide icons (ISC license), stroke-based and infinitely scalable.
          </p>
          <Button
            size="lg"
            onClick={downloadAll}
            disabled={zipping}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            {zipping ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating ZIP…</>
            ) : (
              <><Package className="h-5 w-5 mr-2" /> Download All ({ICONS.length} icons) as ZIP</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {ICONS.map((icon) => (
            <Card key={icon.file} className="overflow-hidden">
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center">
                  <img src={iconUrl(icon.file)} alt={`${icon.label} icon`} className="w-8 h-8" />
                </div>
                <div className="font-semibold text-sm mb-0.5">{icon.label}</div>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-[10px] font-mono">{icon.lucide}</Badge>
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: icon.color }}
                    title={icon.color}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    fetch(iconUrl(icon.file))
                      .then((r) => r.blob())
                      .then((blob) => downloadBlob(blob, icon.file));
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> {icon.file}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Files are also available directly under <code className="font-mono">/homepage-icons/</code>
        </p>
      </div>
    </div>
  );
}
