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
      emptyIcon={
        <div className="relative inline-flex">
          <Gamepad2 className="h-20 w-20 text-violet-400" />
          <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
      }
      emptyText="Games are coming soon! Stay tuned."
    />
  );
}
