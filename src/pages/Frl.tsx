import { Navigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta } from '@unhead/react';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import { Globe, Sparkles } from 'lucide-react';
import { nip19 } from 'nostr-tools';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

export default function Frl() {
  const { nostr } = useNostr();

  useSeoMeta({
    title: 'POPArt.frl - BitPopArt | Creative Pop Art Projects',
    description: 'Explore creative pop art projects on POPArt.frl by BitPopArt.',
    ogTitle: 'POPArt.frl - BitPopArt | Creative Pop Art Projects',
    ogDescription: 'Explore creative pop art projects on POPArt.frl by BitPopArt.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/frl',
    twitterCard: 'summary_large_image',
    twitterTitle: 'POPArt.frl - BitPopArt | Creative Pop Art Projects',
    twitterDescription: 'Explore creative pop art projects on POPArt.frl by BitPopArt.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow',
  });

  // Fetch all frl-category projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['frl-projects-page'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const [events, deletionEvents] = await Promise.all([
        nostr.query(
          [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['bitpopart-project'], limit: 50 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [ADMIN_PUBKEY], limit: 200 }],
          { signal }
        ),
      ]);
      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(e => {
        e.tags.forEach(tag => {
          if (tag[0] === 'a') deletedAddresses.add(tag[1]);
          if (tag[0] === 'e') deletedAddresses.add(tag[1]);
        });
      });
      return events.filter(event => {
        const dTag = event.tags.find(t => t[0] === 'd')?.[1];
        const address = `36171:${event.pubkey}:${dTag}`;
        const category = event.tags.find(t => t[0] === 'category')?.[1];
        return (
          category === 'frl' &&
          !deletedAddresses.has(address) &&
          !deletedAddresses.has(event.id)
        );
      });
    },
  });

  // Find the single inline HTML project
  const inlineProject = projects.find(e =>
    e.tags.find(t => t[0] === 'brand-site-inline')?.[1] === 'true' ||
    e.tags.find(t => t[0] === 'frl-inline')?.[1] === 'true'
  );
  const inlineProjectId = inlineProject?.tags.find(t => t[0] === 'd')?.[1];

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-pink-900/20 dark:to-orange-900/20">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-[70vh] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Single inline HTML project → redirect to /frl/:id which renders it
  //    fullscreen using LayoutIframe (no footer, no double scrollbar) ───
  if (inlineProject && inlineProjectId) {
    return <Navigate to={`/frl/${inlineProjectId}`} replace />;
  }

  // ── Multiple projects or no inline project → show listing ─
  return (
    <CategoryProjectsPage
      category="frl"
      title="POPArt.frl"
      subtitle="Creative pop art projects on POPArt.frl"
      icon={<Globe className="h-12 w-12 text-pink-600" />}
      gradient="from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-pink-900/20 dark:to-orange-900/20"
      emptyIcon={
        <div className="relative inline-flex">
          <Globe className="h-20 w-20 text-pink-400" />
          <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
      }
      emptyText="POPArt.frl projects are coming soon! Stay tuned."
    />
  );
}
