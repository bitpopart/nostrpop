import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppMedia, type AppMedia } from '@/hooks/useAppContent';
import { useThemeColors } from '@/hooks/useThemeColors';
import { recordDownload } from '@/hooks/useDownloadTracking';
import { HashtagCloud } from '@/components/HashtagCloud';
import { RelaySelector } from '@/components/RelaySelector';
import {
  Download, ArrowLeft, Laugh, LayoutTemplate, UserCircle2,
  Shapes, Share2, Printer, Library, Wand2,
} from 'lucide-react';
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
    recordDownload({ itemId: tracking.itemId, title: tracking.title, category: 'meme', imageUrl: url });
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
  return url.split('/').pop() || `meme.${ext}`;
}

// ── Small asset grid tile (for creator toolbox) ────────────────────────────
function AssetTile({ item, onClick, variant = 'cover' }: {
  item: AppMedia;
  onClick: () => void;
  variant?: 'cover' | 'contain';
}) {
  return (
    <button
      title={item.title !== 'Untitled' ? item.title : undefined}
      onClick={onClick}
      className="group aspect-square rounded-xl border-2 border-transparent hover:border-orange-400 bg-gray-50 dark:bg-gray-800 overflow-hidden transition-all hover:shadow-lg hover:scale-105 active:scale-95 relative"
    >
      <img
        src={item.image_url}
        alt={item.title}
        className={`w-full h-full ${variant === 'contain' ? 'object-contain p-1' : 'object-cover'} group-hover:scale-105 transition-transform`}
        loading="lazy"
      />
      {item.title !== 'Untitled' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-[9px] truncate text-center">{item.title}</p>
        </div>
      )}
    </button>
  );
}

export default function Memes() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();

  // Library data (ready memes for download)
  const { data: memes = [], isLoading } = useAppMedia('app-meme');
  const [lightbox, setLightbox] = useState<AppMedia | null>(null);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  // Creator toolbox assets
  const { data: memeTemplates = [], isLoading: templatesLoading } = useAppMedia('app-meme-template');
  const { data: memePops = [], isLoading: popsLoading } = useAppMedia('app-pop');
  const { data: memeIcons = [], isLoading: iconsLoading } = useAppMedia('app-meme-icon');

  // Library view state — when a ready meme is selected, show full-canvas view
  const [selectedLibraryMeme, setSelectedLibraryMeme] = useState<AppMedia | null>(null);

  const filtered = useMemo(() =>
    activeTag ? memes.filter(m => m.hashtags.includes(activeTag)) : memes,
    [memes, activeTag],
  );
  const tagSets = useMemo(() => memes.map(m => m.hashtags), [memes]);

  useSeoMeta({
    title: 'Memes - BitPopArt | Free Bitcoin Pop Art Memes',
    description: 'Download free Bitcoin PopArt memes by BitPopArt. Funny and shareable pop art memes about Bitcoin. Spread love, freedom, and joy with Bitcoin meme art.',
    keywords: 'bitcoin memes, pop art memes, free bitcoin meme download, bitcoin funny memes, bitpopart memes, free bitcoin art memes, crypto memes',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Memes - BitPopArt | Free Bitcoin Pop Art Memes',
    ogDescription: 'Download free Bitcoin PopArt memes by BitPopArt. Funny and shareable pop art memes about Bitcoin.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/memes',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Memes - BitPopArt | Free Bitcoin Pop Art Memes',
    twitterDescription: 'Download free Bitcoin PopArt memes by BitPopArt.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 dark:from-gray-900 dark:via-yellow-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/free')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Free Downloads
        </Button>

        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Laugh className="h-10 w-10 text-yellow-600" />
            <h1 className="text-4xl font-bold gradient-header-text">Memes</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Bitcoin PopArt <strong>memes</strong> by BitPopArt — free to download and share everywhere!
          </p>
        </div>

        {/* ── BOX 1: Creator Toolbox ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                <Wand2 className="h-5 w-5" /> Create Your Own Meme
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use these assets in the Studio to create your own meme.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 gap-2 shrink-0"
            >
              <Link to="/studio">
                <Wand2 className="h-3.5 w-3.5" />
                Open Studio
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="templates">
            <div className="px-4 pt-3 pb-1 overflow-x-auto border-b">
              <TabsList className="inline-flex h-9 gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="templates"
                  className="rounded-full px-4 py-1.5 text-xs font-semibold border data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:border-orange-500 border-gray-200 hover:border-orange-300 transition-all flex items-center gap-1"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Templates
                  {memeTemplates.length > 0 && <span className="ml-1 opacity-60 text-[10px]">({memeTemplates.length})</span>}
                </TabsTrigger>
                <TabsTrigger
                  value="pops"
                  className="rounded-full px-4 py-1.5 text-xs font-semibold border data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 border-gray-200 hover:border-pink-300 transition-all flex items-center gap-1"
                >
                  <UserCircle2 className="h-3.5 w-3.5" />
                  Pops
                  {memePops.length > 0 && <span className="ml-1 opacity-60 text-[10px]">({memePops.length})</span>}
                </TabsTrigger>
                <TabsTrigger
                  value="icons"
                  className="rounded-full px-4 py-1.5 text-xs font-semibold border data-[state=active]:bg-violet-500 data-[state=active]:text-white data-[state=active]:border-violet-500 border-gray-200 hover:border-violet-300 transition-all flex items-center gap-1"
                >
                  <Shapes className="h-3.5 w-3.5" />
                  Icons
                  {memeIcons.length > 0 && <span className="ml-1 opacity-60 text-[10px]">({memeIcons.length})</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Templates */}
            <TabsContent value="templates" className="mt-0 p-4">
              {templatesLoading ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                </div>
              ) : memeTemplates.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <LayoutTemplate className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No templates yet — coming soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {memeTemplates.map(item => (
                    <AssetTile key={item.id} item={item} variant="cover" onClick={() => {}} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pops */}
            <TabsContent value="pops" className="mt-0 p-4">
              {popsLoading ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                </div>
              ) : memePops.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <UserCircle2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No pop characters yet — coming soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {memePops.map(item => (
                    <AssetTile key={item.id} item={item} variant="contain" onClick={() => {}} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Icons */}
            <TabsContent value="icons" className="mt-0 p-4">
              {iconsLoading ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                </div>
              ) : memeIcons.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Shapes className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No icons yet — coming soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {memeIcons.map(item => (
                    <AssetTile key={item.id} item={item} variant="contain" onClick={() => {}} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── BOX 2: Ready-Made Meme Library ────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30">
            <h2 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <Library className="h-5 w-5" /> Meme Library
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ready-made memes — select one to print or download. These designs cannot be edited.
            </p>
          </div>

          <div className="p-4">
            {/* Hashtag cloud */}
            <HashtagCloud
              tagSets={tagSets}
              activeTag={activeTag}
              onTagChange={setActiveTag}
              isLoading={isLoading}
              accent="teal"
            />

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
              </div>
            ) : memes.length === 0 ? (
              <Card className="border-dashed max-w-md mx-auto">
                <CardContent className="py-12 text-center space-y-4">
                  <Laugh className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="text-muted-foreground">No memes found. Try another relay?</p>
                  <RelaySelector className="w-full" />
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="border-dashed max-w-md mx-auto">
                <CardContent className="py-12 text-center space-y-3">
                  <Laugh className="h-10 w-10 mx-auto text-yellow-300" />
                  <p className="text-muted-foreground text-sm">No memes tagged <strong>#{activeTag}</strong>.</p>
                  <button onClick={() => setActiveTag(undefined)} className="text-xs text-yellow-600 underline">Clear filter</button>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  {activeTag
                    ? `${filtered.length} of ${memes.length} meme${memes.length !== 1 ? 's' : ''} · #${activeTag}`
                    : `${memes.length} meme${memes.length !== 1 ? 's' : ''} available`}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map(item => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedLibraryMeme(item)}
                    >
                      <div className="aspect-square">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      {/* View button */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Badge className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 text-xs">
                          View &amp; Download
                        </Badge>
                      </div>
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
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground pb-4">
          <p>BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* ── Library Meme Full-Canvas View (view-only: print/download/share only) ── */}
      <Dialog open={!!selectedLibraryMeme} onOpenChange={() => setSelectedLibraryMeme(null)}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-background rounded-2xl shadow-2xl">
          {selectedLibraryMeme && (
            <>
              <DialogTitle className="sr-only">{selectedLibraryMeme.title}</DialogTitle>

              {/* Full canvas image */}
              <div className="flex items-center justify-center bg-black dark:bg-black w-full">
                <img
                  src={selectedLibraryMeme.image_url}
                  alt={selectedLibraryMeme.title}
                  className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
                  style={{ display: 'block' }}
                />
              </div>

              {/* Info + actions */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  {selectedLibraryMeme.title !== 'Untitled' && (
                    <p className="font-semibold text-sm truncate">{selectedLibraryMeme.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Library className="h-3 w-3" /> Ready-made · cannot be edited
                  </p>
                  {selectedLibraryMeme.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedLibraryMeme.hashtags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <ZapButton
                    authorPubkey={ADMIN_PUBKEY}
                    lightningAddress="traveltelly@primal.net"
                    event={selectedLibraryMeme.event}
                    eventTitle={selectedLibraryMeme.title}
                    size="default"
                    variant="outline"
                    showLabel={true}
                    alwaysShow={true}
                  />
                  <ShareToNostrMediaDialog
                    title={selectedLibraryMeme.title}
                    imageUrl={selectedLibraryMeme.image_url}
                    hashtags={[...selectedLibraryMeme.hashtags, 'meme', 'bitcoin']}
                    pageUrl="https://www.bitpopart.com/memes"
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    className="gap-2 text-white border-0 font-semibold shadow"
                    style={getGradientStyle('primary')}
                    onClick={() => handleDownload(
                      selectedLibraryMeme.image_url,
                      deriveFilename(selectedLibraryMeme.image_url, selectedLibraryMeme.title),
                      { itemId: selectedLibraryMeme.id, title: selectedLibraryMeme.title },
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

      {/* Legacy lightbox (unused now but kept for compatibility) */}
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
                </div>
                <div className="flex items-center gap-2 shrink-0">
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
