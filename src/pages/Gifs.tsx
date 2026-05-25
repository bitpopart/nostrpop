import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppMedia, type AppMedia } from '@/hooks/useAppContent';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Download, Clapperboard, ArrowLeft } from 'lucide-react';
import { RelaySelector } from '@/components/RelaySelector';
import { HashtagCloud } from '@/components/HashtagCloud';

function handleDownload(url: string, filename: string) {
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
  const ext = url.split('.').pop()?.split('?')[0] || 'gif';
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `bitpopart.${ext}`;
}

export default function Gifs() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();
  const { data: gifs = [], isLoading } = useAppMedia('app-gif');
  const [lightbox, setLightbox] = useState<AppMedia | null>(null);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  const filtered = useMemo(() =>
    activeTag ? gifs.filter(g => g.hashtags.includes(activeTag)) : gifs,
    [gifs, activeTag],
  );
  const tagSets = useMemo(() => gifs.map(g => g.hashtags), [gifs]);

  useSeoMeta({
    title: 'Animated GIFs - BitPopArt',
    description: 'Download free animated Bitcoin PopArt GIFs by BitPopArt',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-rose-900/20">
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
            <Clapperboard className="h-10 w-10 text-amber-600" />
            <h1 className="text-4xl font-bold gradient-header-text">Animated GIFs</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Animated Bitcoin PopArt GIFs by BitPopArt — free to share and download!
          </p>
        </div>

        {/* Hashtag cloud */}
        <HashtagCloud
          tagSets={tagSets}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          isLoading={isLoading}
          accent="orange"
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : gifs.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-4">
              <Clapperboard className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-muted-foreground">No GIFs found. Try another relay?</p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-3">
              <Clapperboard className="h-10 w-10 mx-auto text-amber-300" />
              <p className="text-muted-foreground text-sm">No GIFs tagged <strong>#{activeTag}</strong>.</p>
              <button onClick={() => setActiveTag(undefined)} className="text-xs text-amber-600 underline">Clear filter</button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {activeTag
                ? `${filtered.length} of ${gifs.length} GIF${gifs.length !== 1 ? 's' : ''} · #${activeTag}`
                : `${gifs.length} animated GIF${gifs.length !== 1 ? 's' : ''} available`}
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
                      handleDownload(item.image_url, deriveFilename(item.image_url, item.title));
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
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden bg-background rounded-2xl shadow-2xl">
          {lightbox && (
            <>
              <DialogTitle className="sr-only">{lightbox.title}</DialogTitle>

              {/* GIF — natural ratio, max height capped so it never overflows the viewport */}
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
                          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium"
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
                  onClick={() => handleDownload(lightbox.image_url, deriveFilename(lightbox.image_url, lightbox.title))}
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
