import { Link, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * FloatingChatButton
 *
 * A persistent floating button shown on every page (bottom-left corner).
 * Clicking it navigates to the Community page where visitors can browse
 * the FAQ or send a message via the contact form.
 *
 * Hidden on the Community page itself to avoid redundancy.
 */
export function FloatingChatButton() {
  const { pathname } = useLocation();

  // Don't show on the community page itself
  if (pathname === '/community') return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/community"
            aria-label="Get in touch — FAQ & Contact"
            className={[
              // Position: bottom-left, above any other floating buttons
              'fixed bottom-6 left-6 z-50',
              // Size & shape
              'h-14 w-14 rounded-full',
              // Gradient background matching BitPopArt brand
              'bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400',
              'hover:from-pink-600 hover:via-orange-500 hover:to-yellow-500',
              // Shadow + animation
              'shadow-lg hover:shadow-xl',
              'transition-all duration-300',
              'hover:scale-110 active:scale-95',
              // Flex center the icon
              'flex items-center justify-center',
              // Subtle pulse ring to draw attention
              'ring-2 ring-white/40 dark:ring-gray-900/40',
            ].join(' ')}
          >
            <MessageCircle className="h-6 w-6 text-white drop-shadow" />

            {/* Animated dot to signal "new / live" */}
            <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-white dark:border-gray-900 animate-pulse" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-sm font-medium">
          Community &amp; FAQ
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
