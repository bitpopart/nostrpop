/**
 * HashtagCloud — displays the top N most-used hashtags across a collection.
 *
 * - Tags are sized by relative frequency (bigger = more uses)
 * - Clicking a tag toggles a filter; "All" resets it
 * - Skeleton shown while data is loading
 */

import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash } from 'lucide-react';

interface HashtagCloudProps {
  /** All hashtag arrays from the collection (one per item) */
  tagSets: string[][];
  /** Currently active filter tag (undefined = show all) */
  activeTag: string | undefined;
  /** Called when user clicks a tag or "All" */
  onTagChange: (tag: string | undefined) => void;
  /** Max number of tags to show (default 10) */
  maxTags?: number;
  /** Whether data is still loading */
  isLoading?: boolean;
  /** Accent colour theme: amber | teal | orange */
  accent?: 'amber' | 'teal' | 'orange';
}

/** Map accent name → Tailwind classes */
const ACCENT_CLASSES: Record<
  'amber' | 'teal' | 'orange',
  { active: string; inactive: string; dot: string; all: string }
> = {
  amber: {
    active:
      'bg-amber-500 text-white border-amber-500 shadow-amber-200 dark:shadow-amber-900/40 shadow-md scale-105',
    inactive:
      'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-400',
    dot: 'bg-amber-400',
    all: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/40',
  },
  teal: {
    active:
      'bg-teal-500 text-white border-teal-500 shadow-teal-200 dark:shadow-teal-900/40 shadow-md scale-105',
    inactive:
      'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-400',
    dot: 'bg-teal-400',
    all: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-700 hover:bg-teal-200 dark:hover:bg-teal-800/40',
  },
  orange: {
    active:
      'bg-orange-500 text-white border-orange-500 shadow-orange-200 dark:shadow-orange-900/40 shadow-md scale-105',
    inactive:
      'bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400',
    dot: 'bg-orange-400',
    all: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800/40',
  },
};

export function HashtagCloud({
  tagSets,
  activeTag,
  onTagChange,
  maxTags = 10,
  isLoading = false,
  accent = 'amber',
}: HashtagCloudProps) {
  const colors = ACCENT_CLASSES[accent];

  // Count frequency of each tag across all items
  const topTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const tags of tagSets) {
      for (const tag of tags) {
        if (tag) freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags);
  }, [tagSets, maxTags]);

  // Don't render if there are no tags at all (and not loading)
  if (!isLoading && topTags.length === 0) return null;

  const maxCount = topTags[0]?.[1] ?? 1;

  /** Map count → font size class (3 tiers) */
  const sizeClass = (count: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.7) return 'text-sm font-semibold';
    if (ratio >= 0.35) return 'text-xs font-medium';
    return 'text-[11px] font-normal';
  };

  return (
    <div className="mb-8">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Browse by hashtag
        </span>
      </div>

      {isLoading ? (
        /* Skeleton */
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-7 rounded-full" style={{ width: `${60 + i * 12}px` }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {/* "All" reset button */}
          <button
            onClick={() => onTagChange(undefined)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium
              transition-all duration-200
              ${activeTag === undefined
                ? colors.active
                : colors.all
              }
            `}
          >
            All
            <span className="opacity-60 text-[10px]">
              ({tagSets.length})
            </span>
          </button>

          {topTags.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => onTagChange(activeTag === tag ? undefined : tag)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border
                transition-all duration-200 ${sizeClass(count)}
                ${activeTag === tag ? colors.active : colors.inactive}
              `}
            >
              {/* Coloured dot */}
              {activeTag !== tag && (
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
              )}
              #{tag}
              <span className={`text-[10px] opacity-60 ${activeTag === tag ? 'text-white/80' : ''}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
