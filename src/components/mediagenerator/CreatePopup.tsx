/**
 * CreatePopup
 * Shows card templates selected for this page and opens the card editor.
 */

import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCardTemplates } from '@/hooks/useCardTemplates';
import { PenLine, Image as ImageIcon, ArrowRight } from 'lucide-react';

interface CreatePopupProps {
  open: boolean;
  onClose: () => void;
  templateIds: string[];
}

export function CreatePopup({ open, onClose, templateIds }: CreatePopupProps) {
  const navigate = useNavigate();
  const { data: allTemplates, isLoading } = useCardTemplates();

  // Filter to selected templates (preserve admin-defined order)
  const templates =
    templateIds.length > 0
      ? templateIds
          .map((id) => allTemplates?.find((t) => t.id === id))
          .filter(Boolean)
      : allTemplates ?? [];

  const handleUseTemplate = (templateId: string) => {
    onClose();
    navigate(`/cards/editor?template=${templateId}`);
  };

  const handleCreateBlank = () => {
    onClose();
    navigate('/cards/editor');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <span className="text-2xl">✍️</span>
            Create an eCard
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a template below or start from scratch
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <PenLine className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No templates configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start with a blank canvas instead.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {templates.map(
                (t) =>
                  t && (
                    <button
                      key={t.id}
                      onClick={() => handleUseTemplate(t.id)}
                      className="group text-left rounded-xl overflow-hidden border border-border hover:border-green-400 hover:shadow-md transition-all"
                    >
                      {/* Cover image */}
                      <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                        {t.coverImage ? (
                          <img
                            src={t.coverImage}
                            alt={t.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/10 transition-colors flex items-center justify-center">
                          <ArrowRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {/* Name */}
                      <div className="p-2">
                        <p className="text-xs font-semibold line-clamp-1 group-hover:text-green-700">
                          {t.name}
                        </p>
                        {t.category && (
                          <p className="text-xs text-muted-foreground">{t.category}</p>
                        )}
                      </div>
                    </button>
                  )
              )}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t shrink-0 space-y-2">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleCreateBlank}
          >
            <PenLine className="w-4 h-4 mr-2" />
            Start with Blank Canvas
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose();
              navigate('/cards');
            }}
          >
            Browse All Cards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
