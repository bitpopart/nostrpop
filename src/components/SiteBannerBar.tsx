import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { useSiteBanner } from '@/hooks/useSiteBanner';
import { useArtworks } from '@/hooks/useArtworks';
import { isAuctionActive } from '@/lib/artTypes';
import type { BannerStyle } from '@/hooks/useHomepageSettings';

const STYLE_CLASSES: Record<BannerStyle, string> = {
  orange: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-white',
  blue:   'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white',
  green:  'bg-gradient-to-r from-emerald-600 via-green-500 to-teal-400 text-white',
  red:    'bg-gradient-to-r from-red-600 via-rose-500 to-pink-500 text-white',
  purple: 'bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-500 text-white',
  dark:   'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 text-white',
};

/**
 * SiteBannerBar — shown under the nav, above page content.
 * - When a live auction exists the AuctionBanner takes over (this hides).
 * - Otherwise shows the first enabled site banner from Homepage Settings.
 */
export function SiteBannerBar() {
  const { data: activeBanner } = useSiteBanner();
  const { data: artworks } = useArtworks('auction');

  // Auction banner takes priority — don't show site banner when auction is live
  const hasLiveAuction = (artworks ?? []).some(a => isAuctionActive(a));
  if (hasLiveAuction) return null;

  if (!activeBanner) return null;

  const styleClass = STYLE_CLASSES[activeBanner.style] ?? STYLE_CLASSES.orange;
  const isExternal = activeBanner.url?.startsWith('http');

  return (
    <div className={`w-full ${styleClass} shadow-md z-40`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 py-2 flex-wrap">
          {/* Mobile: white "Love PopArt" text */}
          <span className="sm:hidden text-sm font-bold text-white whitespace-nowrap">
            Love PopArt
          </span>
          {/* Desktop: fixed short label before the buttons */}
          <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">
            🎁 Free wallpapers, GIFs &amp; animations
          </span>
            {activeBanner.url && activeBanner.urlLabel && (
              isExternal ? (
                <a
                  href={activeBanner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 border border-white/40 transition-colors whitespace-nowrap"
                >
                  {activeBanner.urlLabel}
                </a>
              ) : (
                <Link
                  to={activeBanner.url}
                  className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 border border-white/40 transition-colors whitespace-nowrap"
                >
                  {activeBanner.urlLabel}
                </Link>
              )
            )}
            {/* Desktop: original App button */}
            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:via-rose-600 hover:to-orange-600 text-white border-0 shadow transition-all whitespace-nowrap"
            >
              <Smartphone className="h-3.5 w-3.5" />
              App
            </Link>
            {/* Mobile: red "Open App →" button */}
            <Link
              to="/app"
              className="sm:hidden inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white border-0 shadow transition-all whitespace-nowrap"
            >
              Open App →
            </Link>
        </div>
      </div>
    </div>
  );
}
