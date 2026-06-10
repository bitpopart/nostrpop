import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useFreeDownloads } from '@/hooks/useFreeDownloads';
import { useAppMedia, type AppMedia } from '@/hooks/useAppContent';
import { useAnimations, type AnimationItem } from '@/hooks/useAnimations';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  Gift,
  Image as ImageIcon,
  UserCircle2,
  Clapperboard,
  PanelTop,
  Play,
  Download,
  ChevronRight,
  Heart,
  Sparkles,
} from 'lucide-react';
import { ZapButton } from '@/components/ZapButton';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const ADMIN_PUBKEY = getAdminPubkeyHex();
const LIMIT = 5;

// ── Download helper ────────────────────────────────────────────────────────────
function triggerDownload(url: string, filename: string) {
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

function deriveFilename(url: string, title: string, fallbackExt = 'jpg'): string {
  const ext = url.split('.').pop()?.split('?')[0] || fallbackExt;
  if (title && title !== 'Untitled') {
    return `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
  }
  return url.split('/').pop() || `bitpopart.${ext}`;
}

// ── Section header ─────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  href: string;
  accentColor: string;
}

function SectionHeader({ icon, title, count, href, accentColor }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${accentColor}`}>
          {icon}
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        {count > 0 && (
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        )}
      </div>
      <Link to={href}>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground text-xs font-medium">
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

// ── Image thumbnail card ───────────────────────────────────────────────────────
interface ImageCardProps {
  imageUrl: string;
  title: string;
  href?: string;
  onDownload?: () => void;
  shape?: 'square' | 'circle' | 'banner';
  isGif?: boolean;
  isAnimation?: boolean;
  thumbUrl?: string;
  duration?: string;
}

function ImageCard({ imageUrl, title, onDownload, shape = 'square', isGif, isAnimation, thumbUrl, duration }: ImageCardProps) {
  const { getGradientStyle } = useThemeColors();

  const aspectClass = shape === 'banner' ? 'aspect-video' : 'aspect-square';
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div className={`group relative overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 ${roundedClass}`}>
      <div className={`${aspectClass} overflow-hidden ${roundedClass}`}>
        <img
          src={thumbUrl || imageUrl}
          alt={title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${roundedClass}`}
          loading="lazy"
        />
        {/* GIF badge */}
        {isGif && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            GIF
          </div>
        )}
        {/* Play overlay for animations */}
        {isAnimation && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors rounded-xl">
            <div className="w-10 h-10 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
              <Play className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        {/* Duration badge for animations */}
        {duration && (
          <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {duration}
          </span>
        )}
      </div>
      {/* Download button on hover */}
      {onDownload && (
        <Button
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={getGradientStyle('primary')}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDownload(); }}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
      {/* Title overlay */}
      {title !== 'Untitled' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-[11px] font-medium truncate">{title}</p>
        </div>
      )}
    </div>
  );
}

// ── Skeleton row ───────────────────────────────────────────────────────────────
function SkeletonRow({ count = 5, shape = 'square' }: { count?: number; shape?: 'square' | 'circle' }) {
  return (
    <div className={`grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={`${shape === 'circle' ? 'rounded-full aspect-square' : 'aspect-square rounded-xl'} w-full`}
        />
      ))}
    </div>
  );
}

// ── Empty section ──────────────────────────────────────────────────────────────
function EmptySection({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-24 rounded-xl border border-dashed text-sm text-muted-foreground">
      No {label} yet — check back soon!
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function FreeGallery() {
  const { data: freeImages = [], isLoading: loadingFree } = useFreeDownloads();
  const { data: wallpapers = [], isLoading: loadingWallpapers } = useAppMedia('app-wallpaper');
  const { data: avatars = [], isLoading: loadingAvatars } = useAppMedia('app-avatar');
  const { data: gifs = [], isLoading: loadingGifs } = useAppMedia('app-gif');
  const { data: banners = [], isLoading: loadingBanners } = useAppMedia('app-banner');
  const { data: animations = [], isLoading: loadingAnimations } = useAnimations();

  useSeoMeta({
    title: 'Free Downloads - BitPopArt',
    description: 'All free Bitcoin PopArt downloads in one place: images, wallpapers, avatars, GIFs, animations and banners!',
  });

  const latestFree = freeImages.slice(0, LIMIT);
  const latestWallpapers = wallpapers.slice(0, LIMIT);
  const latestAvatars = avatars.slice(0, LIMIT);
  const latestGifs = gifs.slice(0, LIMIT);
  const latestBanners = banners.slice(0, LIMIT);
  const latestAnimations = animations.slice(0, LIMIT);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-orange-900/20">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* ── Hero header ── */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Gift className="h-11 w-11 text-pink-500" />
            <h1 className="text-5xl font-bold gradient-header-text">Free Downloads</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
            Everything is free — art is meant to be shared!
          </p>
          {/* Zap slogan + big zap button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <p className="text-base font-semibold text-orange-600 dark:text-orange-400 italic">
              Digital art is free — feel free to zap ⚡
            </p>
            <ZapButton
              authorPubkey={ADMIN_PUBKEY}
              lightningAddress="traveltelly@primal.net"
              eventTitle="BitPopArt Free Downloads"
              alwaysShow={true}
              size="lg"
              variant="default"
              showLabel={true}
              className="h-14 px-10 text-lg font-extrabold gap-2 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400 hover:from-orange-500 hover:via-amber-600 hover:to-yellow-500 text-white border-0 shadow-xl shadow-orange-300/50 dark:shadow-orange-900/50 rounded-full animate-pulse hover:animate-none transition-all duration-300 scale-100 hover:scale-105"
            />
          </div>

          {/* Community CTA */}
          <div className="flex items-center justify-center">
            <Link to="/app">
              <Button
                size="lg"
                className="h-12 px-7 text-base font-bold gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600 text-white border-0 shadow-md"
              >
                <Heart className="h-5 w-5 fill-white" />
                Join the POP Community
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Category quick-links ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-10">
          {[
            { label: 'Images', href: '/free/images', icon: <Gift className="h-4 w-4" />, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800' },
            { label: 'Wallpapers', href: '/wallpapers', icon: <ImageIcon className="h-4 w-4" />, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 border-teal-200 dark:border-teal-800' },
            { label: 'Avatars', href: '/avatars', icon: <UserCircle2 className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 border-violet-200 dark:border-violet-800' },
            { label: 'GIFs', href: '/gifs', icon: <Clapperboard className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
            { label: 'Animations', href: '/animations', icon: <Play className="h-4 w-4" />, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800' },
            { label: 'Banners', href: '/banners', icon: <PanelTop className="h-4 w-4" />, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 border-sky-200 dark:border-sky-800' },
          ].map(({ label, href, icon, color, bg }) => (
            <Link key={label} to={href}>
              <button className={`w-full flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-200 ${bg} ${color} font-medium text-xs`}>
                {icon}
                {label}
              </button>
            </Link>
          ))}
        </div>

        {/* ── Free Images section ── */}
        <section className="mb-10">
          <SectionHeader
            icon={<Gift className="h-4 w-4 text-green-600" />}
            title="Free Images"
            count={freeImages.length}
            href="/free/images"
            accentColor="bg-green-100 dark:bg-green-900/30"
          />
          {loadingFree ? (
            <SkeletonRow count={LIMIT} />
          ) : latestFree.length === 0 ? (
            <EmptySection label="free images" />
          ) : (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {latestFree.map((item) => (
                <ImageCard
                  key={item.id}
                  imageUrl={item.image_url}
                  title={item.title}
                  onDownload={() => triggerDownload(item.image_url, deriveFilename(item.image_url, item.title))}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Wallpapers section ── */}
        <section className="mb-10">
          <SectionHeader
            icon={<ImageIcon className="h-4 w-4 text-teal-600" />}
            title="Wallpapers"
            count={wallpapers.length}
            href="/wallpapers"
            accentColor="bg-teal-100 dark:bg-teal-900/30"
          />
          {loadingWallpapers ? (
            <SkeletonRow count={LIMIT} />
          ) : latestWallpapers.length === 0 ? (
            <EmptySection label="wallpapers" />
          ) : (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {latestWallpapers.map((item: AppMedia) => (
                <ImageCard
                  key={item.id}
                  imageUrl={item.image_url}
                  title={item.title}
                  onDownload={() => triggerDownload(item.image_url, deriveFilename(item.image_url, item.title))}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Avatars section ── */}
        <section className="mb-10">
          <SectionHeader
            icon={<UserCircle2 className="h-4 w-4 text-violet-600" />}
            title="Avatars"
            count={avatars.length}
            href="/avatars"
            accentColor="bg-violet-100 dark:bg-violet-900/30"
          />
          {loadingAvatars ? (
            <SkeletonRow count={LIMIT} shape="circle" />
          ) : latestAvatars.length === 0 ? (
            <EmptySection label="avatars" />
          ) : (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {latestAvatars.map((item: AppMedia) => (
                <ImageCard
                  key={item.id}
                  imageUrl={item.image_url}
                  title={item.title}
                  shape="circle"
                  onDownload={() => triggerDownload(item.image_url, deriveFilename(item.image_url, item.title, 'png'))}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── GIFs section ── */}
        <section className="mb-10">
          <SectionHeader
            icon={<Clapperboard className="h-4 w-4 text-amber-600" />}
            title="Animated GIFs"
            count={gifs.length}
            href="/gifs"
            accentColor="bg-amber-100 dark:bg-amber-900/30"
          />
          {loadingGifs ? (
            <SkeletonRow count={LIMIT} />
          ) : latestGifs.length === 0 ? (
            <EmptySection label="GIFs" />
          ) : (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {latestGifs.map((item: AppMedia) => (
                <ImageCard
                  key={item.id}
                  imageUrl={item.image_url}
                  title={item.title}
                  isGif={true}
                  onDownload={() => triggerDownload(item.image_url, deriveFilename(item.image_url, item.title, 'gif'))}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Animations section ── */}
        <section className="mb-10">
          <SectionHeader
            icon={<Play className="h-4 w-4 text-orange-600" />}
            title="Animations"
            count={animations.length}
            href="/animations"
            accentColor="bg-orange-100 dark:bg-orange-900/30"
          />
          {loadingAnimations ? (
            <SkeletonRow count={LIMIT} />
          ) : latestAnimations.length === 0 ? (
            <EmptySection label="animations" />
          ) : (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
              {latestAnimations.map((item: AnimationItem) => (
                <Link key={item.id} to="/animations">
                  <ImageCard
                    imageUrl={item.thumb_url || item.video_url}
                    title={item.title}
                    isAnimation={true}
                    thumbUrl={item.thumb_url}
                    duration={item.duration}
                    onDownload={() => triggerDownload(
                      item.video_url,
                      `${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${item.video_url.split('.').pop()?.split('?')[0] || 'mp4'}`
                    )}
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Banners section ── */}
        <section className="mb-10">
          <SectionHeader
            icon={<PanelTop className="h-4 w-4 text-sky-600" />}
            title="Header Banners"
            count={banners.length}
            href="/banners"
            accentColor="bg-sky-100 dark:bg-sky-900/30"
          />
          {loadingBanners ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="w-full aspect-video rounded-xl" />
              ))}
            </div>
          ) : latestBanners.length === 0 ? (
            <EmptySection label="banners" />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {latestBanners.map((item: AppMedia) => (
                <div
                  key={item.id}
                  className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                  <Button
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-sky-500 hover:bg-sky-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerDownload(item.image_url, deriveFilename(item.image_url, item.title));
                    }}
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {item.title !== 'Untitled' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[11px] font-medium truncate">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Footer ── */}
        <div className="text-center mt-12 pt-8 border-t text-xs text-muted-foreground space-y-1.5">
          <p className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            All content is free — a ⚡ zap is always appreciated!
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          </p>
          <p>BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
