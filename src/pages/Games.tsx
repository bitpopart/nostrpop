import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import type { BuiltinProjectCard } from '@/components/projects/CategoryProjectsPage';
import { Gamepad2, Sparkles } from 'lucide-react';
import { nip19 } from 'nostr-tools';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

// Static fallback — shown immediately while Nostr loads, or if no events found yet
const STATIC_BUILTIN_GAMES: BuiltinProjectCard[] = [
  {
    id: 'moneyprinter',
    name: 'Money Printer Mayhem',
    description: 'CLOWNWORLD EDITION. The printer goes BRRR — catch fiat & shitcoins, dodge Bitcoin. Play free or deposit sats to win the Lightning jackpot!',
    thumbnailGradient: 'from-violet-600 via-fuchsia-500 to-pink-500',
    thumbnailEmoji: '💵',
    url: '/games/moneyprinter',
    order: 1,
  },
  {
    id: 'quiz21',
    name: '21 Quiz',
    description: '21 questions. Bitcoin & Nostr. No googling, no excuses 🤘 Play free or deposit sats — highest score wins the Lightning jackpot!',
    thumbnailGradient: 'from-orange-500 via-amber-400 to-yellow-400',
    thumbnailEmoji: '⚡',
    url: '/games/quiz21',
    order: 2,
  },
];

/** Hook: fetch built-in games from Nostr (published by admin, tagged builtin-game) */
function useBuiltinGames() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['builtin-games'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(4000)]);

      const [events, deletions] = await Promise.all([
        nostr.query(
          [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['builtin-game'], limit: 50 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [ADMIN_PUBKEY], limit: 200 }],
          { signal }
        ),
      ]);

      const deletedSet = new Set<string>();
      deletions.forEach(e => {
        e.tags.forEach(t => {
          if (t[0] === 'a') deletedSet.add(t[1]);
          if (t[0] === 'e') deletedSet.add(t[1]);
        });
      });

      const live = events.filter(e => {
        const d = e.tags.find(t => t[0] === 'd')?.[1];
        return !deletedSet.has(`36171:${e.pubkey}:${d}`) && !deletedSet.has(e.id);
      });

      if (live.length === 0) return null; // signal: use static fallback

      return live
        .map((event): BuiltinProjectCard => {
          let content: Record<string, string> = {};
          try { content = JSON.parse(event.content); } catch { /* ignore */ }

          const id = event.tags.find(t => t[0] === 'd')?.[1] || event.id;
          const name = event.tags.find(t => t[0] === 'name')?.[1] || content.name || 'Game';
          const description = content.description || '';
          const thumbnail = event.tags.find(t => t[0] === 'image')?.[1] || content.thumbnail || '';
          const emoji = event.tags.find(t => t[0] === 'emoji')?.[1] || '🎮';
          const gradient = event.tags.find(t => t[0] === 'gradient')?.[1] || 'from-violet-600 via-fuchsia-500 to-pink-500';
          const path = event.tags.find(t => t[0] === 'r')?.[1] || '/games';
          const order = event.tags.find(t => t[0] === 'order')?.[1];

          return {
            id,
            name,
            description,
            thumbnail: thumbnail || undefined,
            thumbnailEmoji: emoji,
            thumbnailGradient: gradient,
            url: path,
            order: order ? parseInt(order) : undefined,
          };
        })
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
    staleTime: 5 * 60 * 1000,
  });
}

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

  // Use Nostr-managed list if available, otherwise fall back to static list
  const { data: nostrGames } = useBuiltinGames();
  const builtinGames = nostrGames ?? STATIC_BUILTIN_GAMES;

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
      emptyText="More games are coming soon! Stay tuned."
      builtinProjects={builtinGames}
    />
  );
}
