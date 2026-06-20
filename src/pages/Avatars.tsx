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
import { Download, UserCircle2, ArrowLeft, Wand2 } from 'lucide-react';
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
    recordDownload({ itemId: tracking.itemId, title: tracking.title, category: 'avatar', imageUrl: url });
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
  const ext = url.split('.').pop()?.split('?')[0] || 'png';
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `avatar.${ext}`;
}

export default function Avatars() {
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();
  const { data: avatars = [], isLoading } = useAppMedia('app-avatar');
  const [lightbox, setLightbox] = useState<AppMedia | null>(null);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  const filtered = useMemo(() =>
    activeTag ? avatars.filter(a => a.hashtags.includes(activeTag)) : avatars,
    [avatars, activeTag],
  );
  const tagSets = useMemo(() => avatars.map(a => a.hashtags), [avatars]);

  useSeoMeta({
    title: 'Avatars - BitPopArt | Free Bitcoin Pop Art Profile Pictures',
    description: 'Free Bitcoin PopArt avatars by BitPopArt. Download and use as your Nostr or social media profile picture! Unique Bitcoin pop art profile images.',
    keywords: 'bitcoin avatar, pop art avatar, free profile picture, nostr avatar, bitcoin pfp, bitpopart avatar, free bitcoin profile picture, bitcoin art profile photo',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Avatars - BitPopArt | Free Bitcoin Pop Art Profile Pictures',
    ogDescription: 'Free Bitcoin PopArt avatars by BitPopArt. Download and use as your Nostr or social media profile picture!',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/avatars',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Avatars - BitPopArt | Free Bitcoin Pop Art Profile Pictures',
    twitterDescription: 'Free Bitcoin PopArt avatars by BitPopArt. Download and use as your Nostr profile picture!',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-violet-900/20 dark:to-pink-900/20">
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
            <UserCircle2 className="h-10 w-10 text-violet-600" />
            <h1 className="text-4xl font-bold gradient-header-text">Avatars</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Free Bitcoin PopArt avatars by BitPopArt — download and use as your profile picture!
          </p>
        </div>

        {/* Hashtag cloud */}
        <HashtagCloud
          tagSets={tagSets}
          activeTag={activeTag}
          onTagChange={setActiveTag}
          isLoading={isLoading}
          accent="amber"
        />

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-full" />
            ))}
          </div>
        ) : avatars.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-4">
              <UserCircle2 className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-muted-foreground">No avatars found. Try another relay?</p>
              <RelaySelector className="w-full" />
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed max-w-md mx-auto">
            <CardContent className="py-12 text-center space-y-3">
              <UserCircle2 className="h-10 w-10 mx-auto text-violet-300" />
              <p className="text-muted-foreground text-sm">No avatars tagged <strong>#{activeTag}</strong>.</p>
              <button onClick={() => setActiveTag(undefined)} className="text-xs text-violet-600 underline">Clear filter</button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Generate your own avatar CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <p className="text-sm text-muted-foreground">
                {activeTag
                  ? `${filtered.length} of ${avatars.length} avatar${avatars.length !== 1 ? 's' : ''} · #${activeTag}`
                  : `${avatars.length} avatar${avatars.length !== 1 ? 's' : ''} available`}
              </p>
              <Button
                onClick={() => navigate('/studio?mode=avatar-generator')}
                className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                size="sm"
              >
                <Wand2 className="h-4 w-4" />
                Generate your own avatar
              </Button>
            </div>

            {/* Circular avatar grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="group flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => setLightbox(item)}
                >
                  {/* Circle avatar */}
                  <div className="relative w-full aspect-square rounded-full overflow-hidden ring-2 ring-violet-100 dark:ring-violet-900 group-hover:ring-violet-400 dark:group-hover:ring-violet-500 shadow-md group-hover:shadow-xl transition-all duration-300">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Download icon on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors rounded-full">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Download className="h-4 w-4 text-violet-700" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  {item.title !== 'Untitled' && (
                    <p className="text-xs text-center text-muted-foreground font-medium leading-tight line-clamp-2 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                      {item.title}
                    </p>
                  )}
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
        <DialogContent className="max-w-sm w-full p-0 overflow-hidden bg-background rounded-2xl shadow-2xl">
          {lightbox && (
            <>
              <DialogTitle className="sr-only">{lightbox.title}</DialogTitle>

              {/* Avatar image — shown as circle, natural size capped */}
              <div className="flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950 dark:to-purple-900 p-8">
                <div className="w-48 h-48 rounded-full overflow-hidden ring-4 ring-violet-300 dark:ring-violet-600 shadow-2xl">
                  <img
                    src={lightbox.image_url}
                    alt={lightbox.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Info + download bar */}
              <div className="px-5 py-4 flex flex-col gap-3">
                {/* Title + hashtags */}
                <div className="text-center">
                  {lightbox.title !== 'Untitled' && (
                    <p className="font-semibold text-sm">{lightbox.title}</p>
                  )}
                  {lightbox.hashtags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                      {lightbox.hashtags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zap + Share + Download buttons */}
                <div className="flex items-center gap-2">
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
                    hashtags={[...lightbox.hashtags, 'avatar', 'pfp', 'nostr']}
                  />
                  <Button
                    className="flex-1 gap-2 text-white border-0 font-semibold shadow"
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
