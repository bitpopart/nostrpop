import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppMedia, type AppMedia } from '@/hooks/useAppContent';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { recordDownload } from '@/hooks/useDownloadTracking';
import { HashtagCloud } from '@/components/HashtagCloud';
import { RelaySelector } from '@/components/RelaySelector';
import { Download, Image as ImageIcon, ArrowLeft } from 'lucide-react';

function handleDownload(
  url: string,
  filename: string,
  tracking?: { itemId: string; title: string },
) {
  if (tracking) {
    recordDownload({ itemId: tracking.itemId, title: tracking.title, category: 'wallpaper', imageUrl: url });
  }
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
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

function deriveFilename(url: string, title: string): string {
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `wallpaper.${ext}`;
}

export default function Wallpapers() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();
  const { data: wallpapers = [], isLoading } = useAppMedia('app-wallpaper');
  const [lightbox, setLightbox] = useState<AppMedia | null>(null);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  const filtered = useMemo(() =>
    activeTag ? wallpapers.filter(w => w.hashtags.includes(activeTag)) : wallpapers,
    [wallpapers, activeTag],
  );
  const tagSets = useMemo(() => wallpapers.map(w => w.hashtags), [wallpapers]);

  useSeoMeta({
    title: 'Wallpapers - BitPopArt | Free Bitcoin Pop Art Wallpapers',
    description: 'Download free Bitcoin PopArt wallpapers by BitPopArt. Beautiful pop art designs for your desktop and mobile. Spread love, freedom, and joy with Bitcoin art.',
    keywords: 'bitcoin wallpaper, pop art wallpaper, free wallpaper download, bitcoin desktop wallpaper, bitcoin mobile wallpaper, bitpopart wallpaper, free bitcoin art wallpaper',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Wallpapers - BitPopArt | Free Bitcoin Pop Art Wallpapers',
    ogDescription: 'Download free Bitcoin PopArt wallpapers by BitPopArt. Beautiful pop art designs for your desktop and mobile.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/wallpapers',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Wallpapers - BitPopArt | Free Bitcoin Pop Art Wallpapers',
    twitterDescription: 'Download free Bitcoin PopArt wallpapers by BitPopArt.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/app')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ImageIcon className="h-10 w-10 text-teal-600" />
            <h1 className="text-4xl font-bold gradient-header-text">Wallpapers</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Bitcoin PopArt wallpapers by BitPopArt — free to download and use!
          </p>
        </div>

        {/* Hashtag cloud */}
        <HashtagCloud
          tagSets={tagSets}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          isLoading={isLoading}
          accent="teal"
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : wallpapers.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-4">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-muted-foreground">No wallpapers found. Try another relay?</p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-3">
              <ImageIcon className="h-10 w-10 mx-auto text-teal-300" />
              <p className="text-muted-foreground text-sm">No wallpapers tagged <strong>#{activeTag}</strong>.</p>
              <button onClick={() => setActiveTag(undefined)} className="text-xs text-teal-600 underline">Clear filter</button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {activeTag
                ? `${filtered.length} of ${wallpapers.length} wallpaper${wallpapers.length !== 1 ? 's' : ''} · #${activeTag}`
                : `${wallpapers.length} wallpaper${wallpapers.length !== 1 ? 's' : ''} available`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setLightbox(item)}
                >
                  <div className="aspect-square">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  {/* Download button */}
                  <Button
                    size="icon"
                    className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-lg text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={getGradientStyle('primary')}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item.image_url, deriveFilename(item.image_url, item.title), { itemId: item.id, title: item.title });
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {/* Title + hashtags overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.title !== 'Untitled' && (
                      <p className="text-white text-xs font-medium truncate">{item.title}</p>
                    )}
                    {item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.hashtags.slice(0, 4).map(tag => (
                          <span key={tag} className="text-[10px] text-white/90 bg-white/20 px-1.5 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-center mt-16 text-xs text-muted-foreground">
          <p>BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-background rounded-2xl shadow-2xl">
          {lightbox && (
            <>
              <DialogTitle className="sr-only">{lightbox.title}</DialogTitle>

              {/* Image — natural ratio, max height capped so it never overflows the viewport */}
              <div className="flex items-center justify-center bg-black/5 dark:bg-black/30 w-full">
                <img
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
                  style={{ display: 'block' }}
                />
              </div>

              {/* Info + download bar */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Title + hashtags */}
                <div className="flex-1 min-w-0">
                  {lightbox.title !== 'Untitled' && (
                    <p className="font-semibold text-sm truncate">{lightbox.title}</p>
                  )}
                  {lightbox.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lightbox.hashtags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download button */}
                <Button
                  className="shrink-0 gap-2 text-white border-0 font-semibold shadow"
                  style={getGradientStyle('primary')}
                  onClick={() => handleDownload(lightbox.image_url, deriveFilename(lightbox.image_url, lightbox.title), { itemId: lightbox.id, title: lightbox.title })}
                >
                  <Download className="h-4 w-4" />
                  Download Free
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
