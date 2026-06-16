import { useSeoMeta } from '@unhead/react';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import { Globe, Sparkles } from 'lucide-react';

export default function Frl() {
  useSeoMeta({
    title: 'POPArt.frl - BitPopArt | Creative Pop Art Projects',
    description: 'Explore creative pop art projects on POPArt.frl by BitPopArt. Custom HTML projects, interactive experiences and more.',
    keywords: 'popart frl, bitpopart projects, pop art frl, creative projects, bitcoin pop art, nostr projects',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
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
