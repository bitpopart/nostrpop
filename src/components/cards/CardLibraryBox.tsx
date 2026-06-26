/**
 * CardLibraryBox
 *
 * Displays the ready-made card library below the editor.
 * Cards are view-only: users can print or download, but not edit.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLatestCards } from '@/hooks/useLatestCards';
import { useThemeColors } from '@/hooks/useThemeColors';
import { recordDownload } from '@/hooks/useDownloadTracking';
import { ZapButton } from '@/components/ZapButton';
import { ShareToNostrMediaDialog } from '@/components/ShareToNostrMediaDialog';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { Download, Library, Printer } from 'lucide-react';

const ADMIN_PUBKEY = getAdminPubkeyHex();

interface LibraryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
}

export function CardLibraryBox() {
  const { data: cards = [], isLoading } = useLatestCards(50);
  const { getGradientStyle } = useThemeColors();
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  // Build library items from card events
  const libraryItems: LibraryItem[] = cards
    .map(card => {
      const imageUrl = card.images?.[0] || card.event.tags.find(([n]) => n === 'image')?.[1];
      if (!imageUrl) return null;
      return {
        id: card.id,
        title: card.title || 'Untitled',
        imageUrl,
        category: card.category || '',
      };
    })
    .filter((c): c is LibraryItem => c !== null);

  const handleDownload = (url: string, title: string, id: string) => {
    recordDownload({ itemId: id, title, category: 'card', imageUrl: url });
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
        a.href = URL.createObjectURL(blob);
        a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      })
      .catch(() => window.open(url, '_blank'));
  };

  return (
    <>
      {/* ── Ready Cards Library ──────────────────────────────────────── */}
      <div className="rounded-2xl border shadow-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
          <h2 className="text-lg font-bold text-pink-600 flex items-center gap-2">
            <Library className="h-5 w-5" /> Card Library
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ready-made cards — select one to print or download. These designs cannot be edited.
          </p>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-xl" />)}
            </div>
          ) : libraryItems.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Library className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No cards in the library yet.</p>
              <p className="text-xs mt-1">Cards published by the community will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {libraryItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-400 shadow hover:shadow-xl transition-all"
                >
                  <div className="aspect-[4/3]">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Badge className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 text-xs">
                      View &amp; Download
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] font-medium truncate">{item.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Library Card Full-Canvas Dialog (view-only) ──────────────── */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-background rounded-2xl shadow-2xl">
          {selected && (
            <>
              <DialogTitle className="sr-only">{selected.title}</DialogTitle>

              {/* Full canvas */}
              <div className="flex items-center justify-center bg-black w-full">
                <img
                  src={selected.imageUrl}
                  alt={selected.title}
                  className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
                  style={{ display: 'block' }}
                />
              </div>

              {/* Actions */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{selected.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Library className="h-3 w-3" /> Ready-made · cannot be edited
                  </p>
                  {selected.category && (
                    <Badge variant="secondary" className="mt-1 text-xs">{selected.category}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <ZapButton
                    authorPubkey={ADMIN_PUBKEY}
                    lightningAddress="traveltelly@primal.net"
                    eventTitle={selected.title}
                    size="default"
                    variant="outline"
                    showLabel={true}
                    alwaysShow={true}
                  />
                  <ShareToNostrMediaDialog
                    title={selected.title}
                    imageUrl={selected.imageUrl}
                    hashtags={selected.category ? [selected.category, 'ecard', 'bitpopart'] : ['ecard', 'bitpopart']}
                    pageUrl="https://www.bitpopart.com/cards"
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    className="gap-2 text-white border-0 font-semibold"
                    style={getGradientStyle('primary')}
                    onClick={() => handleDownload(selected.imageUrl, selected.title, selected.id)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
