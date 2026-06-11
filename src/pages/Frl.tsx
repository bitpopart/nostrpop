import { useSeoMeta } from '@unhead/react';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import { Globe, Sparkles } from 'lucide-react';

export default function Frl() {
  useSeoMeta({
    title: 'POPArt.frl - BitPopArt | Pop Art for the Real World',
    description: 'POPArt.frl collection by BitPopArt — pop art for the real world. Discover Bitcoin-inspired pop art with a .frl domain twist by Johannes Oppewal.',
    keywords: 'popart frl, pop art real world, bitpopart frl, bitcoin pop art frl, nostr art frl, real world pop art',
    author: 'Johannes Oppewal (BitPopArt)',
    ogType: 'website',
    ogTitle: 'POPArt.frl - BitPopArt | Pop Art for the Real World',
    ogDescription: 'POPArt.frl collection by BitPopArt — pop art for the real world.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/frl',
    twitterCard: 'summary_large_image',
    twitterTitle: 'POPArt.frl - BitPopArt | Pop Art for the Real World',
    twitterDescription: 'POPArt.frl collection by BitPopArt — pop art for the real world.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow',
  });

  return (
    <CategoryProjectsPage
      category="frl"
      title="POPArt.frl"
      subtitle="POPArt.frl collection — pop art for the real world"
      icon={<Globe className="h-12 w-12 text-pink-600" />}
      gradient="from-pink-50 via-rose-50 to-red-50 dark:from-gray-900 dark:via-pink-900/20 dark:to-rose-900/20"
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
