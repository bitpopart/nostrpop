/**
 * /app/hashtag/:tag — shows all media items tagged with a specific hashtag.
 * Also accessible via the /app Search tab.
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAppMedia } from '@/hooks/useAppContent';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Hash, ArrowLeft, Download, Search } from 'lucide-react';

function handleDownload(url: string, title: string) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    })
    .catch(() => window.open(url, '_blank'));
}

export default function AppHashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const { getGradientStyle } = useThemeColors();

  const { data: wallpapers = [], isLoading: wpLoading } = useAppMedia('app-wallpaper');
  const { data: gifs = [], isLoading: gifLoading } = useAppMedia('app-gif');
  const { data: avatars = [], isLoading: avatarLoading } = useAppMedia('app-avatar');
  const { data: banners = [], isLoading: bannerLoading } = useAppMedia('app-banner');
  const { data: coloringPages = [], isLoading: coloringLoading } = useAppMedia('app-coloring-page');
  const { data: desktopWalls = [], isLoading: desktopLoading } = useAppMedia('app-desktop-wallpaper');
  const { data: memes = [], isLoading: memesLoading } = useAppMedia('app-meme');
  const { data: freeDownloads = [], isLoading: freeLoading } = useFreeDownloads();

  const isLoading = wpLoading || gifLoading || avatarLoading || bannerLoading ||
    coloringLoading || desktopLoading || memesLoading || freeLoading;

  const allMedia = useMemo(() => [
    ...wallpapers, ...gifs, ...avatars, ...banners,
    ...coloringPages, ...desktopWalls, ...memes,
    ...freeDownloads.map(m => ({ ...m, hashtags: m.hashtags ?? [] })),
  ], [wallpapers, gifs, avatars, banners, coloringPages, desktopWalls, memes, freeDownloads]);

  const results = useMemo(() => {
    if (!tag) return [];
    const t = tag.toLowerCase();
    return allMedia.filter(m => m.hashtags?.map(h => h.toLowerCase()).includes(t));
  }, [allMedia, tag]);

  useSeoMeta({
    title: `#${tag} — BitPopArt App`,
    description: `Browse all BitPopArt media tagged #${tag}. Free Bitcoin pop art downloads.`,
    robots: 'index, follow',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-pink-50 dark:from-gray-950 dark:via-background dark:to-gray-900 pb-12">
      <div className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Back button */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/app">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to App
            </Button>
          </Link>
        </div>

        {/* Heading */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f7931a, #ff6b6b)' }}>
            <Hash className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">#{tag}</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading…' : `${results.length} item${results.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && results.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <Search className="h-12 w-12 mx-auto text-gray-300" />
            <p className="text-muted-foreground">No media found for <span className="font-bold">#{tag}</span></p>
            <Link to="/app">
              <Button variant="outline">Browse all media</Button>
            </Link>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-6">
            {results.map(item => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                <div className="aspect-square">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <button
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDownload(item.image_url, item.title)}
                >
                  <span
                    className="text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1"
                    style={getGradientStyle('primary') as React.CSSProperties}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
