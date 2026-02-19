import { Button } from '@/components/ui/button';
import { Palette, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtProgressToggleProps {
  mode: 'gallery' | 'progress';
  onToggle: (mode: 'gallery' | 'progress') => void;
  className?: string;
}

export function ArtProgressToggle({ mode, onToggle, className }: ArtProgressToggleProps) {
  return (
    <div className={cn("inline-flex rounded-full border border-gray-200 dark:border-gray-700 p-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm", className)}>
      <Button
        size="lg"
        variant={mode === 'gallery' ? 'default' : 'ghost'}
        className={cn(
          "rounded-full transition-all duration-200",
          mode === 'gallery'
            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        )}
        onClick={() => onToggle('gallery')}
      >
        <Palette className="h-5 w-5 mr-2" />
        <span className="hidden sm:inline">Gallery</span>
      </Button>
      <Button
        size="lg"
        variant={mode === 'progress' ? 'default' : 'ghost'}
        className={cn(
          "rounded-full transition-all duration-200",
          mode === 'progress'
            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        )}
        onClick={() => onToggle('progress')}
      >
        <Pencil className="h-5 w-5 mr-2" />
        <span className="hidden sm:inline">Art Progress</span>
      </Button>
    </div>
  );
}
