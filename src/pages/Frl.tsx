import { useSeoMeta } from '@unhead/react';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import { Globe, Sparkles } from 'lucide-react';

export default function Frl() {
  useSeoMeta({
    title: 'POPArt.frl - BitPopArt',
    description: 'POPArt.frl collection by BitPopArt — pop art for the real world',
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
