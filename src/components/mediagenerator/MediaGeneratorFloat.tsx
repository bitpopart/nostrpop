/**
 * MediaGeneratorFloat
 *
 * Floating action buttons shown on every page (when configured).
 * Buttons: Merch 👕 | Download ⬇️ | Create ✍️ | Zap ⚡
 *
 * Reads the current route and shows only the enabled buttons.
 * Each button opens its own popup/dialog.
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaGenConfig } from '@/hooks/useMediaGenerator';
import { MerchPopup } from './MerchPopup';
import { DownloadPopup } from './DownloadPopup';
import { CreatePopup } from './CreatePopup';
import { ZapPopup } from './ZapPopup';

type PopupType = 'merch' | 'download' | 'create' | 'zap' | null;

// Button definitions
const BUTTONS = [
  {
    key: 'merch' as const,
    emoji: '👕',
    label: 'Merch',
    title: 'Shop Merch',
    colorClass:
      'bg-purple-600 hover:bg-purple-700 shadow-purple-300 dark:shadow-purple-900',
  },
  {
    key: 'download' as const,
    emoji: '⬇️',
    label: 'Download',
    title: 'Free Downloads',
    colorClass:
      'bg-blue-600 hover:bg-blue-700 shadow-blue-300 dark:shadow-blue-900',
  },
  {
    key: 'create' as const,
    emoji: '✍️',
    label: 'Create',
    title: 'Create eCard',
    colorClass:
      'bg-green-600 hover:bg-green-700 shadow-green-300 dark:shadow-green-900',
  },
  {
    key: 'zap' as const,
    emoji: '⚡',
    label: 'Zap',
    title: 'Send a Tip',
    colorClass:
      'bg-orange-500 hover:bg-orange-600 shadow-orange-300 dark:shadow-orange-900',
  },
] as const;

export function MediaGeneratorFloat() {
  const location = useLocation();
  const pageSlug = location.pathname;
  const { config } = useMediaGenConfig(pageSlug);
  const [openPopup, setOpenPopup] = useState<PopupType>(null);

  // Determine which buttons to show
  const visibleButtons = BUTTONS.filter((b) => config[b.key].enabled);

  if (visibleButtons.length === 0) return null;

  return (
    <>
      {/* Floating button bar — fixed bottom-right */}
      <div
        className="fixed bottom-6 right-5 z-50 flex flex-col gap-2.5 items-center"
        style={{ pointerEvents: 'none' }}
      >
        {visibleButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setOpenPopup(btn.key)}
            title={btn.title}
            style={{ pointerEvents: 'auto' }}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center
              text-white text-xl
              shadow-lg
              transition-all duration-200
              hover:scale-110 active:scale-95
              ${btn.colorClass}
              border-2 border-white/20
            `}
            aria-label={btn.title}
          >
            <span role="img" aria-label={btn.label}>
              {btn.emoji}
            </span>
          </button>
        ))}
      </div>

      {/* Popups */}
      <MerchPopup
        open={openPopup === 'merch'}
        onClose={() => setOpenPopup(null)}
        productIds={config.merch.productIds}
      />
      <DownloadPopup
        open={openPopup === 'download'}
        onClose={() => setOpenPopup(null)}
        items={config.download.items}
      />
      <CreatePopup
        open={openPopup === 'create'}
        onClose={() => setOpenPopup(null)}
        templateIds={config.create.templateIds}
      />
      <ZapPopup open={openPopup === 'zap'} onClose={() => setOpenPopup(null)} />
    </>
  );
}
