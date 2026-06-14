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
import { Download, PanelTop, ArrowLeft } from 'lucide-react';

function handleDownload(
  url: string,
  filename: string,
  tracking?: { itemId: string; title: string },
) {
  if (tracking) {
    recordDownload({ itemId: tracking.itemId, title: tracking.title, category: 'banner', imageUrl: url });
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
  return url.split('/').pop() || `banner.${ext}`;
}

export default function Banners() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();
  const { data: banners = [], isLoading } = useAppMedia('app-banner');
  const [lightbox, setLightbox] = useState<AppMedia | null>(null);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  const filtered = useMemo(() =>
    activeTag ? banners.filter(b => b.hashtags.includes(activeTag)) : banners,
    [banners, activeTag],
  );
  const tagSets = useMemo(() => banners.map(b => b.hashtags), [banners]);

  useSeoMeta({
    title: 'Header Banners - BitPopArt | Free Bitcoin Pop Art Banners',
    description: 'Free Bitcoin PopArt header banners by BitPopArt. Download and use as your Nostr or social media profile header! Beautiful pop art banner designs.',
    keywords: 'bitcoin banner, pop art banner, free header banner, nostr header, bitcoin profile banner, bitpopart banner, free bitcoin art banner, profile header download',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Header Banners - BitPopArt | Free Bitcoin Pop Art Banners',
    ogDescription: 'Free Bitcoin PopArt header banners by BitPopArt. Download and use as your Nostr or social media profile header!',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/banners',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Header Banners - BitPopArt | Free Bitcoin Pop Art Banners',
    twitterDescription: 'Free Bitcoin PopArt header banners by BitPopArt. Download and use as your Nostr profile header!',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-sky-900/20 dark:to-blue-900/20">
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
            <PanelTop className="h-10 w-10 text-sky-600" />
            <h1 className="text-4xl font-bold gradient-header-text">Header Banners</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Free Bitcoin PopArt header banners by BitPopArt — download and use as your profile header!
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

        {/* Grid — landscape banners, 2 cols on mobile, 3 on wider */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-video rounded-xl" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-4">
              <PanelTop className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-muted-foreground">No banners found. Try another relay?</p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-3">
              <PanelTop className="h-10 w-10 mx-auto text-sky-300" />
              <p className="text-muted-foreground text-sm">No banners tagged <strong>#{activeTag}</strong>.</p>
              <button onClick={() => setActiveTag(undefined)} className="text-xs text-sky-600 underline">Clear filter</button>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {activeTag
                ? `${filtered.length} of ${banners.length} banner${banners.length !== 1 ? 's' : ''} · #${activeTag}`
                : `${banners.length} banner${banners.length !== 1 ? 's' : ''} available`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden bg-black/5 dark:bg-black/20 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => setLightbox(item)}
                >
                  {/* Banner image — full natural ratio, no cropping */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-auto block"
                    loading="lazy"
                  />

                  {/* Download icon on hover (top-right) */}
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

                  {/* Title + hashtags overlay at bottom */}
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

      {/* Lightbox — wide, natural ratio, download bar below */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-background rounded-2xl shadow-2xl">
          {lightbox && (
            <>
              <DialogTitle className="sr-only">{lightbox.title}</DialogTitle>

              {/* Banner image — natural ratio, max height capped */}
              <div className="flex items-center justify-center bg-black/5 dark:bg-black/30 w-full">
                <img
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  className="max-w-full max-h-[65vh] w-auto h-auto object-contain"
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
                          className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-medium"
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
