import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useAppWelcome, useAppMedia } from '@/hooks/useAppContent';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import { useAnimations } from '@/hooks/useAnimations';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { LoginArea } from '@/components/auth/LoginArea';
import {
  Download,
  Gamepad2,
  ShoppingBag,
  Image as ImageIcon,
  Clapperboard,
  ArrowRight,
  Settings,
  Gift,
  Send,
  ExternalLink,
} from 'lucide-react';

// 3 columns × 3 rows = 9 items max shown in preview
const PREVIEW_COLS = 3;
const PREVIEW_ROWS = 3;
const PREVIEW_LIMIT = PREVIEW_COLS * PREVIEW_ROWS;

// ── Helpers ───────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

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
  const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `download.${ext}`;
}

// ── Preview gallery — exactly 3 rows of 3 ─────────────────

function PreviewGallery({
  items,
  isLoading,
  emptyText,
  onMoreClick,
  moreLabel,
}: {
  items: { id: string; title: string; image_url: string }[];
  isLoading: boolean;
  emptyText: string;
  onMoreClick: () => void;
  moreLabel: string;
}) {
  const { getGradientStyle } = useThemeColors();
  const preview = items.slice(0, PREVIEW_LIMIT);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-6 text-sm">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {preview.map(item => (
          <div key={item.id} className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-square">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <Button
              size="icon"
              className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full shadow text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={getGradientStyle('primary')}
              onClick={() => handleDownload(item.image_url, deriveFilename(item.image_url, item.title))}
              title="Download"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* "More" button */}
      <Button
        variant="outline"
        className="w-full gap-2 font-semibold"
        onClick={onMoreClick}
      >
        {moreLabel}
        {items.length > PREVIEW_LIMIT && (
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        )}
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </div>
  );
}

// ── Animations preview (from real animation events) ───────

function AnimationsPreview({ onMoreClick }: { onMoreClick: () => void }) {
  const { getGradientStyle } = useThemeColors();
  const { data: animations = [], isLoading } = useAnimations();
  const preview = animations.slice(0, PREVIEW_LIMIT);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (animations.length === 0) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <Clapperboard className="h-8 w-8 text-amber-300" />
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full gap-2 font-semibold" onClick={onMoreClick}>
          More Animations <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {preview.map(anim => (
          <div
            key={anim.id}
            className="group relative rounded-xl overflow-hidden bg-black shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={onMoreClick}
          >
            <div className="aspect-video">
              {anim.thumb_url ? (
                <img
                  src={anim.thumb_url}
                  alt={anim.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-900 to-orange-900 flex items-center justify-center">
                  <Clapperboard className="h-8 w-8 text-amber-400 opacity-50" />
                </div>
              )}
            </div>
            {/* Play overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
                <Clapperboard className="w-4 h-4 text-gray-900" />
              </div>
            </div>
            {/* Title on hover */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-[10px] font-medium truncate">{anim.title}</p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full gap-2 font-semibold" onClick={onMoreClick}>
        More Animations
        {animations.length > PREVIEW_LIMIT && (
          <Badge variant="secondary" className="text-xs">{animations.length}</Badge>
        )}
        <ArrowRight className="h-4 w-4 ml-auto" />
      </Button>
    </div>
  );
}

// ── Main App page ─────────────────────────────────────────

export default function AppPage() {
  const navigate = useNavigate();
  const { user, metadata } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();

  // Data
  const { data: welcome, isLoading: welcomeLoading } = useAppWelcome();
  const { data: wallpapers = [], isLoading: wpLoading } = useAppMedia('app-wallpaper');
  const { data: gifs = [], isLoading: gifLoading } = useAppMedia('app-gif');
  const { data: products = [], isLoading: productsLoading } = useMarketplaceProducts();
  const { data: freeDownloads = [], isLoading: freeLoading } = useFreeDownloads();

  const displayName = metadata?.display_name || metadata?.name || (user ? 'friend' : undefined);
  const greeting = getGreeting();

  useSeoMeta({
    title: 'BitPopArt App',
    description: 'The BitPopArt fan app — wallpapers, GIFs, animations, games, merch and more!',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">

        {/* ── Admin shortcut ────────────────────────────── */}
        {isAdmin && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin?tab=app')}>
              <Settings className="h-4 w-4 mr-1" /> Manage App Content
            </Button>
          </div>
        )}

        {/* ── Welcome ───────────────────────────────────── */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="h-1.5" style={getGradientStyle('primary')} />
          <CardContent className="pt-6 pb-8 text-center space-y-4">
            <img
              src={`${import.meta.env.BASE_URL || '/'}B-Funny_avatar_orange.svg`}
              alt="BitPopArt"
              className="h-20 w-20 mx-auto"
            />
            <div>
              <h1 className="text-3xl font-bold gradient-header-text mb-1">
                {greeting}{displayName ? `, ${displayName}` : ''}!
              </h1>
              {welcomeLoading ? (
                <Skeleton className="h-5 w-2/3 mx-auto mt-2" />
              ) : welcome?.message ? (
                <p className="text-muted-foreground mt-2 whitespace-pre-line">{welcome.message}</p>
              ) : (
                <p className="text-muted-foreground mt-2">
                  Welcome to the BitPopArt fan app! Explore wallpapers, GIFs, animations, games and merch.
                </p>
              )}
            </div>
            {!user && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">Log in for a personalised experience</p>
                <LoginArea className="mx-auto max-w-48" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Social Links ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://primal.net/p/npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              variant="outline"
              className="w-full gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20 font-semibold"
              size="lg"
            >
              <img src="https://primal.net/favicon.ico" alt="" className="h-4 w-4 rounded" onError={(e) => { e.currentTarget.style.display='none'; }} />
              BitPopArt on Nostr
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
          </a>
          <a
            href="https://t.me/bitpopart"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              variant="outline"
              className="w-full gap-2 border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/20 font-semibold"
              size="lg"
            >
              <Send className="h-4 w-4 text-sky-500" />
              BitPopArt Telegram
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
          </a>
        </div>

        {/* ── Wallpapers ────────────────────────────────── */}
        <section>
          <CardHeader className="px-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageIcon className="h-5 w-5 text-teal-600" />
              Wallpapers
              {!wpLoading && wallpapers.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">· Latest {Math.min(wallpapers.length, PREVIEW_LIMIT)} of {wallpapers.length}</span>
              )}
            </CardTitle>
          </CardHeader>
          <PreviewGallery
            items={wallpapers}
            isLoading={wpLoading}
            emptyText="No wallpapers yet — check back soon!"
            onMoreClick={() => navigate('/wallpapers')}
            moreLabel="More Wallpapers"
          />
        </section>

        {/* ── Animated GIFs ─────────────────────────────── */}
        <section>
          <CardHeader className="px-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clapperboard className="h-5 w-5 text-amber-600" />
              Animated GIFs
              {!gifLoading && gifs.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">· Latest {Math.min(gifs.length, PREVIEW_LIMIT)} of {gifs.length}</span>
              )}
            </CardTitle>
          </CardHeader>
          <PreviewGallery
            items={gifs}
            isLoading={gifLoading}
            emptyText="No GIFs yet — check back soon!"
            onMoreClick={() => navigate('/gifs')}
            moreLabel="More Animated GIFs"
          />
        </section>

        {/* ── Animations ────────────────────────────────── */}
        <section>
          <CardHeader className="px-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-rose-500" />
              Animations
            </CardTitle>
          </CardHeader>
          <AnimationsPreview onMoreClick={() => navigate('/animations')} />
        </section>

        {/* ── Games ─────────────────────────────────────── */}
        <section>
          <CardHeader className="px-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Gamepad2 className="h-5 w-5 text-violet-600" />
              Games
            </CardTitle>
          </CardHeader>
          <Card className="border-dashed">
            <CardContent className="py-8 text-center space-y-3">
              <Gamepad2 className="h-12 w-12 mx-auto text-violet-300" />
              <Badge className="text-white border-0" style={getGradientStyle('coming-soon')}>Coming Soon</Badge>
              <p className="text-muted-foreground text-sm">Fun Bitcoin & pop art games are on the way!</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/games')}>
                View Games Page <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* ── Merch ─────────────────────────────────────── */}
        <section>
          <CardHeader className="px-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Merch
            </CardTitle>
          </CardHeader>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardContent className="space-y-2 pt-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.slice(0, 6).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {products.length > 6 && (
                <Button variant="outline" className="w-full gap-2 font-semibold" onClick={() => navigate('/shop')}>
                  More Merch
                  <Badge variant="secondary" className="text-xs">{products.length}</Badge>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              )}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <ShoppingBag className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-muted-foreground text-sm">No merch available yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/shop')}>
                  Go to Shop <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── Free Images ───────────────────────────────── */}
        <section>
          <CardHeader className="px-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Gift className="h-5 w-5 text-teal-600" />
              Free Images
              {!freeLoading && freeDownloads.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">· Latest {Math.min(freeDownloads.length, PREVIEW_LIMIT)} of {freeDownloads.length}</span>
              )}
            </CardTitle>
          </CardHeader>

          {freeLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
              </div>
            </div>
          ) : freeDownloads.length > 0 ? (
            <div className="space-y-3">
              <div
                className="grid grid-cols-3 gap-3 cursor-pointer"
                onClick={() => navigate('/free')}
              >
                {freeDownloads.slice(0, PREVIEW_LIMIT).map(dl => (
                  <div
                    key={dl.id}
                    className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square">
                      <img
                        src={dl.image_url}
                        alt={dl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="w-full gap-2 font-semibold text-white border-0 shadow"
                style={getGradientStyle('primary')}
                onClick={() => navigate('/free')}
              >
                <Download className="h-4 w-4" />
                More Free Downloads
                {freeDownloads.length > PREVIEW_LIMIT && (
                  <Badge className="bg-white/20 text-white text-xs ml-1">{freeDownloads.length}</Badge>
                )}
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                    <Gift className="h-8 w-8 text-teal-300" />
                  </div>
                ))}
              </div>
              <Button
                className="w-full gap-2 font-semibold text-white border-0"
                style={getGradientStyle('primary')}
                onClick={() => navigate('/free')}
              >
                <Download className="h-4 w-4" />
                Browse Free Downloads
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          )}
        </section>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="text-center pt-8 pb-4 text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-medium">BitPopArt App</p>
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
