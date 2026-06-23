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
import { Download, Image as ImageIcon, ArrowLeft, Smartphone, Monitor } from 'lucide-react';
import { ZapButton } from '@/components/ZapButton';
import { ShareToNostrMediaDialog } from '@/components/ShareToNostrMediaDialog';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const ADMIN_PUBKEY = getAdminPubkeyHex();

type WallpaperTab = 'mobile' | 'desktop';

function handleDownload(
  url: string,
  filename: string,
  tracking?: { itemId: string; title: string; category: string },
) {
  if (tracking) {
    recordDownload({ itemId: tracking.itemId, title: tracking.title, category: tracking.category, imageUrl: url });
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

function deriveFilename(url: string, title: string, prefix = 'wallpaper'): string {
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `${prefix}.${ext}`;
}

interface WallpaperGridProps {
  items: AppMedia[];
  isLoading: boolean;
  activeTag: string | undefined;
  onTagChange: (tag: string | undefined) => void;
  onSelect: (item: AppMedia) => void;
  accentColor: string;
  type: WallpaperTab;
}

function WallpaperGrid({ items, isLoading, activeTag, onTagChange, onSelect, accentColor, type }: WallpaperGridProps) {
  const { getGradientStyle } = useThemeColors();

  const filtered = useMemo(() =>
    activeTag ? items.filter(w => w.hashtags.includes(activeTag)) : items,
    [items, activeTag],
  );
  const tagSets = useMemo(() => items.map(w => w.hashtags), [items]);

  const emptyIcon = type === 'mobile'
    ? <Smartphone className="h-12 w-12 mx-auto text-gray-300" />
    : <Monitor className="h-12 w-12 mx-auto text-gray-300" />;

  const isDesktop = type === 'desktop';
  const gridClass = isDesktop
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
  const aspectClass = isDesktop ? 'aspect-video' : 'aspect-square';
  const skeletonCount = isDesktop ? 6 : 8;

  return (
    <>
      <HashtagCloud
        tagSets={tagSets}
        activeTag={activeTag}
        onTagChange={onTagChange}
        isLoading={isLoading}
        accent={accentColor as 'teal' | 'indigo'}
      />

      {isLoading ? (
        <div className={gridClass}>
          {[...Array(skeletonCount)].map((_, i) => (
            <Skeleton key={i} className={`${aspectClass} rounded-xl`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed max-w-md mx-auto">
          <CardContent className="py-12 text-center space-y-4">
            {emptyIcon}
            <p className="text-muted-foreground">
              No {type === 'mobile' ? 'mobile wallpapers' : 'desktop wallpapers'} found. Try another relay?
            </p>
            <RelaySelector className="w-full" />
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed max-w-md mx-auto">
          <CardContent className="py-12 text-center space-y-3">
            {emptyIcon}
            <p className="text-muted-foreground text-sm">
              No wallpapers tagged <strong>#{activeTag}</strong>.
            </p>
            <button
              onClick={() => onTagChange(undefined)}
              className={`text-xs underline ${type === 'mobile' ? 'text-teal-600' : 'text-indigo-600'}`}
            >
              Clear filter
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {activeTag
              ? `${filtered.length} of ${items.length} wallpaper${items.length !== 1 ? 's' : ''} · #${activeTag}`
              : `${items.length} wallpaper${items.length !== 1 ? 's' : ''} available`}
          </p>
          <div className={gridClass}>
            {filtered.map(item => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => onSelect(item)}
              >
                <div className={aspectClass}>
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <Button
                  size="icon"
                  className="absolute top-2 right-2 h-9 w-9 rounded-full shadow-lg text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={getGradientStyle('primary')}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(
                      item.image_url,
                      deriveFilename(item.image_url, item.title, type === 'desktop' ? 'desktop-wallpaper' : 'wallpaper'),
                      { itemId: item.id, title: item.title, category: type === 'desktop' ? 'desktop-wallpaper' : 'wallpaper' }
                    );
                  }}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
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
    </>
  );
}

export default function Wallpapers() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();
  const { data: mobileWallpapers = [], isLoading: mobileLoading } = useAppMedia('app-wallpaper');
  const { data: desktopWallpapers = [], isLoading: desktopLoading } = useAppMedia('app-desktop-wallpaper');

  const [activeTab, setActiveTab] = useState<WallpaperTab>('mobile');
  const [lightbox, setLightbox] = useState<AppMedia | null>(null);
  const [mobileTag, setMobileTag] = useState<string | undefined>(undefined);
  const [desktopTag, setDesktopTag] = useState<string | undefined>(undefined);

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

  const isMobile = activeTab === 'mobile';

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-indigo-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-indigo-900/20">
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
            <div className="relative">
              <ImageIcon className="h-10 w-10 text-teal-600" />
            </div>
            <h1 className="text-4xl font-bold gradient-header-text">Wallpapers</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Bitcoin PopArt wallpapers by BitPopArt — free to download for mobile &amp; desktop!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6 max-w-xs mx-auto">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'mobile'
                ? 'bg-white dark:bg-gray-700 shadow text-teal-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('mobile')}
          >
            <Smartphone className="h-4 w-4" />
            Mobile
            {!mobileLoading && mobileWallpapers.length > 0 && (
              <span className="ml-1 text-[11px] font-bold opacity-70">({mobileWallpapers.length})</span>
            )}
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-gray-700 shadow text-indigo-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('desktop')}
          >
            <Monitor className="h-4 w-4" />
            Desktop
            {!desktopLoading && desktopWallpapers.length > 0 && (
              <span className="ml-1 text-[11px] font-bold opacity-70">({desktopWallpapers.length})</span>
            )}
          </button>
        </div>

        {/* Grid content — keyed by tab so tags reset properly */}
        {activeTab === 'mobile' ? (
          <WallpaperGrid
            key="mobile"
            items={mobileWallpapers}
            isLoading={mobileLoading}
            activeTag={mobileTag}
            onTagChange={setMobileTag}
            onSelect={setLightbox}
            accentColor="teal"
            type="mobile"
          />
        ) : (
          <WallpaperGrid
            key="desktop"
            items={desktopWallpapers}
            isLoading={desktopLoading}
            activeTag={desktopTag}
            onTagChange={setDesktopTag}
            onSelect={setLightbox}
            accentColor="indigo"
            type="desktop"
          />
        )}

        <div className="text-center mt-16 text-xs text-muted-foreground">
          <p>BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className={`${isMobile ? 'max-w-3xl' : 'max-w-4xl'} w-full p-0 overflow-hidden bg-background rounded-2xl shadow-2xl`}>
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
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            isMobile
                              ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                              : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          }`}
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
                    hashtags={[...lightbox.hashtags, 'wallpaper', ...(isMobile ? [] : ['desktop'])]}
                  />
                  <Button
                    className="gap-2 text-white border-0 font-semibold shadow"
                    style={getGradientStyle('primary')}
                    onClick={() => handleDownload(
                      lightbox.image_url,
                      deriveFilename(lightbox.image_url, lightbox.title, isMobile ? 'wallpaper' : 'desktop-wallpaper'),
                      { itemId: lightbox.id, title: lightbox.title, category: isMobile ? 'wallpaper' : 'desktop-wallpaper' }
                    )}
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
