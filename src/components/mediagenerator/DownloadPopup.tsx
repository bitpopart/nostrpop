/**
 * DownloadPopup
 * Shows downloadable media items (GIFs, wallpapers, etc.) configured per page.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Image as ImageIcon, ExternalLink } from 'lucide-react';
import type { DownloadItem } from '@/hooks/useMediaGenerator';

interface DownloadPopupProps {
  open: boolean;
  onClose: () => void;
  items: DownloadItem[];
}

const TYPE_LABELS: Record<string, string> = {
  gif: '🎞️ GIF',
  wallpaper: '🖼️ Wallpaper',
  desktop: '🖥️ Desktop',
  coloring: '🎨 Coloring',
  banner: '📐 Banner',
  other: '📁 File',
};

const TYPE_COLORS: Record<string, string> = {
  gif: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  wallpaper: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  desktop: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
  coloring: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400',
  banner: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  other: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400',
};

function DownloadCard({ item }: { item: DownloadItem }) {
  const handleDownload = async () => {
    try {
      // Try fetch + blob download first for same-origin or permissive CORS
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.label;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(item.url, '_blank');
    }
  };

  const typeLabel = TYPE_LABELS[item.type] ?? TYPE_LABELS.other;
  const typeColor = TYPE_COLORS[item.type] ?? TYPE_COLORS.other;

  return (
    <div className="flex gap-3 p-3 rounded-xl border border-border hover:border-blue-300 hover:shadow-sm transition-all bg-background group">
      {/* Thumbnail */}
      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
        {item.thumb ? (
          <img
            src={item.thumb}
            alt={item.label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-semibold text-sm line-clamp-2">{item.label}</p>
          <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full border mt-1 ${typeColor}`}>
            {typeLabel}
          </span>
        </div>

        <div className="flex gap-1.5 mt-2">
          <Button
            size="sm"
            className="text-xs h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white flex-1"
            onClick={handleDownload}
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={() => window.open(item.url, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DownloadPopup({ open, onClose, items }: DownloadPopupProps) {
  // Group items by type
  const grouped = items.reduce<Record<string, DownloadItem[]>>((acc, item) => {
    const type = item.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const typeOrder = ['gif', 'wallpaper', 'desktop', 'coloring', 'banner', 'other'];
  const sortedTypes = typeOrder.filter((t) => grouped[t]?.length > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <span className="text-2xl">⬇️</span>
            Free Downloads
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length === 0
              ? 'No downloads available for this page'
              : `${items.length} free item${items.length !== 1 ? 's' : ''} available`}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Download className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No downloads available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back soon for free downloads!
              </p>
            </div>
          ) : sortedTypes.length > 1 ? (
            // Show grouped by type if multiple types
            <div className="space-y-5">
              {sortedTypes.map((type) => (
                <div key={type}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {TYPE_LABELS[type] ?? type}
                  </h4>
                  <div className="space-y-2">
                    {grouped[type].map((item) => (
                      <DownloadCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single type — just list
            <div className="space-y-2">
              {items.map((item) => (
                <DownloadCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
