import { Link } from 'react-router-dom';
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
          <span className="text-sm font-medium text-center">
            {activeBanner.text}
          </span>
          {activeBanner.url && activeBanner.urlLabel && (
            isExternal ? (
              <a
                href={activeBanner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 border border-white/40 transition-colors whitespace-nowrap"
              >
                {activeBanner.urlLabel}
              </a>
            ) : (
              <Link
                to={activeBanner.url}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 border border-white/40 transition-colors whitespace-nowrap"
              >
                {activeBanner.urlLabel}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
