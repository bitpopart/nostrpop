import { useState } from 'react';
import { useAppMedia } from '@/hooks/useAppContent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { MediaShowcaseType } from './MediaShowcaseBlock';

interface MediaPickerProps {
  mediaType: MediaShowcaseType;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function MediaPicker({ mediaType, selectedIds, onChange }: MediaPickerProps) {
  const { data: items = [], isLoading } = useAppMedia(mediaType);
  const [expanded, setExpanded] = useState(false);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(s => s !== id)
        : [...selectedIds, id]
    );
  };

  const selectAll = () => onChange(items.map(i => i.id));
  const clearAll = () => onChange([]);

  const visible = expanded ? items : items.slice(0, 12);
  const hasMore = items.length > 12;

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">
        No items uploaded yet for this type.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selection summary + bulk actions */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {selectedIds.length === 0
            ? 'None selected — all will show'
            : `${selectedIds.length} of ${items.length} selected`}
        </span>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={selectAll}>
            All
          </Button>
          {selectedIds.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearAll}>
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Grid of thumbnails */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {visible.map(item => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                isSelected
                  ? 'border-purple-500 ring-2 ring-purple-400/40'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              title={item.title !== 'Untitled' ? item.title : ''}
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Checkmark overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                  <div className="bg-purple-600 rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Show more / less toggle */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Show fewer</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> Show {items.length - 12} more</>
          )}
        </button>
      )}

      {/* Selected badges */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectedIds.map(id => {
            const item = items.find(i => i.id === id);
            if (!item) return null;
            return (
              <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
                <span className="truncate max-w-[80px]">{item.title !== 'Untitled' ? item.title : id.slice(0, 8)}</span>
                <button type="button" onClick={() => toggle(id)} className="hover:text-red-500 ml-0.5">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
