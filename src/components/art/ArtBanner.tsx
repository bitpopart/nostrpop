import { Megaphone, X } from 'lucide-react';
import { useState } from 'react';
import { useArtBanner } from '@/hooks/useArtBanner';

export function ArtBanner() {
  const { data: banner } = useArtBanner();
  const [dismissed, setDismissed] = useState(false);

  if (!banner?.enabled || dismissed) return null;
  if (!banner.message && !banner.subtext) return null;

  return (
    <div className="rounded-xl border border-orange-300 dark:border-orange-700 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-900/25 dark:via-amber-900/20 dark:to-orange-900/25 px-4 py-3 flex items-start gap-3 shadow-sm">
      <Megaphone className="h-5 w-5 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        {banner.message && (
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 leading-snug">
            {banner.message}
          </p>
        )}
        {banner.subtext && (
          <p className="text-xs text-orange-600 dark:text-orange-300 mt-0.5">
            {banner.subtext}
          </p>
        )}
      </div>

      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="text-orange-400 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-300 flex-shrink-0 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
