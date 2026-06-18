import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppMedia, type AppMedia } from '@/hooks/useAppContent';
import { useThemeColors } from '@/hooks/useThemeColors';
import { recordDownload } from '@/hooks/useDownloadTracking';
import { HashtagCloud } from '@/components/HashtagCloud';
import { RelaySelector } from '@/components/RelaySelector';
import { Download, Palette, ArrowLeft } from 'lucide-react';
import { ZapButton } from '@/components/ZapButton';
import { ShareToNostrMediaDialog } from '@/components/ShareToNostrMediaDialog';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const ADMIN_PUBKEY = getAdminPubkeyHex();

function handleDownload(
  url: string,
  filename: string,
  tracking?: { itemId: string; title: string },
) {
  if (tracking) {
    recordDownload({ itemId: tracking.itemId, title: tracking.title, category: 'coloring-page', imageUrl: url });
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
  return url.split('/').pop() || `coloring-page.${ext}`;
}

export default function ColoringPages() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();
  const { data: items = [], isLoading } = useAppMedia('app-coloring-page');
  const [lightbox, setLightbox] = useState<AppMedia | null>(null);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  const filtered = useMemo(() =>
    activeTag ? items.filter(w => w.hashtags.includes(activeTag)) : items,
    [items, activeTag],
  );
  const tagSets = useMemo(() => items.map(w => w.hashtags), [items]);

  useSeoMeta({
    title: 'Coloring Pages - BitPopArt | Free Bitcoin Pop Art Coloring Pages',
    description: 'Download free Bitcoin PopArt coloring pages by BitPopArt. Fun and creative printable coloring pages for all ages. Spread love, freedom, and joy with Bitcoin art.',
    keywords: 'bitcoin coloring page, pop art coloring, free coloring page download, bitcoin art coloring, printable coloring page, bitpopart coloring, free bitcoin art coloring',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Coloring Pages - BitPopArt | Free Bitcoin Pop Art Coloring Pages',
    ogDescription: 'Download free Bitcoin PopArt coloring pages by BitPopArt. Fun printable coloring pages for all ages!',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/coloring-pages',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Coloring Pages - BitPopArt | Free Bitcoin Pop Art Coloring Pages',
    twitterDescription: 'Download free Bitcoin PopArt coloring pages by BitPopArt. Fun printable coloring pages for all ages!',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-rose-900/20 dark:to-orange-900/20">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/free')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Free Downloads
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Palette className="h-10 w-10 text-rose-500" />
            <h1 className="text-4xl font-bold gradient-header-text">Coloring Pages</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Free Bitcoin PopArt coloring pages by BitPopArt — print them out and color away!
          </p>
        </div>

        {/* Hashtag cloud */}
        <HashtagCloud
          tagSets={tagSets}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          isLoading={isLoading}
          accent="rose"
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-4">
              <Palette className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-muted-foreground">No coloring pages found. Try another relay?</p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-3">
              <Palette className="h-10 w-10 mx-auto text-rose-300" />
              <p className="text-muted-foreground text-sm">No coloring pages tagged <strong>#{activeTag}</strong>.</p>
              <button onClick={() => setActiveTag(undefined)} className="text-xs text-rose-600 underline">Clear filter</button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {activeTag
                ? `${filtered.length} of ${items.length} coloring page${items.length !== 1 ? 's' : ''} · #${activeTag}`
                : `${items.length} coloring page${items.length !== 1 ? 's' : ''} available`}
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

              <div className="flex items-center justify-center bg-black/5 dark:bg-black/30 w-full">
                <img
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
                  style={{ display: 'block' }}
                />
              </div>

              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  {lightbox.title !== 'Untitled' && (
                    <p className="font-semibold text-sm truncate">{lightbox.title}</p>
                  )}
                  {lightbox.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lightbox.hashtags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ZapButton
                    authorPubkey={ADMIN_PUBKEY}
                    lightningAddress="traveltelly@primal.net"
                    event={lightbox.event}
                    eventTitle={lightbox.title}
                    size="default"
                    variant="outline"
                    showLabel={true}
                    alwaysShow={true}
                  />
                  <ShareToNostrMediaDialog
                    title={lightbox.title}
                    imageUrl={lightbox.image_url}
                    hashtags={[...lightbox.hashtags, 'coloringpage', 'art']}
                  />
                  <Button
                    className="gap-2 text-white border-0 font-semibold shadow"
                    style={getGradientStyle('primary')}
                    onClick={() => handleDownload(lightbox.image_url, deriveFilename(lightbox.image_url, lightbox.title), { itemId: lightbox.id, title: lightbox.title })}
                  >
                    <Download className="h-4 w-4" />
                    Download Free
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
