import { useSeoMeta } from '@unhead/react';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import { Clapperboard, Sparkles } from 'lucide-react';

export default function Animations() {
  useSeoMeta({
    title: 'Animations - BitPopArt',
    description: 'Animated pop art and Bitcoin-inspired motion graphics by BitPopArt',
  });

  return (
    <CategoryProjectsPage
      category="animations"
      title="Animations"
      subtitle="Animated pop art and motion graphics by BitPopArt"
      icon={<Clapperboard className="h-12 w-12 text-amber-600" />}
      gradient="from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-amber-900/20 dark:to-rose-900/20"
      emptyIcon={
        <div className="relative inline-flex">
          <Clapperboard className="h-20 w-20 text-amber-400" />
          <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
      }
      emptyText="Animated art is coming soon! Stay tuned."
    />
  );
}
