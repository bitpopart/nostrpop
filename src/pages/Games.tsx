import { useSeoMeta } from '@unhead/react';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import { Gamepad2, Sparkles } from 'lucide-react';

export default function Games() {
  useSeoMeta({
    title: 'Games - BitPopArt | Bitcoin Pop Art Games',
    description: 'Play Bitcoin and pop art inspired games by BitPopArt. Fun, creative games celebrating the Bitcoin culture and pop art aesthetic. Play for free on Nostr.',
    keywords: 'bitcoin games, pop art games, bitcoin fun, nostr games, bitpopart games, bitcoin culture games, creative bitcoin games, fun bitcoin activities',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'Games - BitPopArt | Bitcoin Pop Art Games',
    ogDescription: 'Play Bitcoin and pop art inspired games by BitPopArt. Fun, creative games celebrating Bitcoin culture.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/games',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Games - BitPopArt | Bitcoin Pop Art Games',
    twitterDescription: 'Play Bitcoin and pop art inspired games by BitPopArt. Fun, creative games celebrating Bitcoin culture.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow',
  });

  return (
    <CategoryProjectsPage
      category="games"
      title="Games"
      subtitle="Bitcoin and pop art inspired games by BitPopArt"
      icon={<Gamepad2 className="h-12 w-12 text-violet-600" />}
      gradient="from-violet-50 via-fuchsia-50 to-pink-50 dark:from-gray-900 dark:via-violet-900/20 dark:to-fuchsia-900/20"
      builtinProjects={[
        {
          id: 'moneyprinter',
          name: 'Money Printer Mayhem',
          description: 'Catch fiat & shitcoins, dodge the Bitcoin — 3 lives, trust us. Deposit 21 sats to join the jackpot: 21% feeds the pot, 2100 sats triggers a 21h battle, top score wins it all.',
          url: '/games/moneyprinter',
          thumbnailEmoji: '💵',
          thumbnailGradient: 'from-pink-500 via-red-500 to-yellow-500',
          order: 1,
        },
        {
          id: 'quiz21',
          name: '21 Quiz',
          description: '21 questions on Bitcoin & Nostr. Timed rounds, no googling, no excuses 🤘 Deposit sats to hit the scoreboard and play for the Lightning jackpot.',
          url: '/games/quiz21',
          thumbnailEmoji: '⚡',
          thumbnailGradient: 'from-orange-500 via-amber-500 to-red-500',
          order: 2,
        },
        {
          id: '100m-canvas',
          name: '100M Canvas',
          description: 'A collaborative 100 million pixel canvas. 1 sat = 1 pixel, zapped over Lightning and stamped with the Bitcoin block height. Sacred pixels — forever.',
          url: '/games/100m-canvas',
          thumbnailEmoji: '🖌️',
          thumbnailGradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
          order: 3,
        },
      ]}
      emptyIcon={
        <div className="relative inline-flex">
          <Gamepad2 className="h-20 w-20 text-violet-400" />
          <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
      }
      emptyText="More games are coming soon! Stay tuned."
    />
  );
}
