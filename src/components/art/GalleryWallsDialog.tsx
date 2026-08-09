import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2, Paintbrush, RotateCcw, Wallpaper } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { optimizeImage } from '@/components/art/GalleryUploadDialog';
import {
  DEFAULT_WALLS,
  useGalleryWalls,
  useSaveGalleryWalls,
  type WallKey,
} from '@/hooks/useGalleryWalls';
import { useUploadFile } from '@/hooks/useUploadFile';

interface GalleryWallsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WALL_LABELS: Record<WallKey, string> = {
  n: 'North wall',
  s: 'South wall',
  w: 'West wall',
  e: 'East wall',
};

const WALL_KEYS: WallKey[] = ['n', 's', 'w', 'e'];

/** A wall draft value: hex color, image URL, or a freshly picked File. */
type WallDraft = string | File;

function isImageValue(value: string): boolean {
  return /^(data:|https?:\/\/)/i.test(value);
}

/**
 * Admin-only dialog for redesigning the POP WORLD walls. Each of the four
 * walls can be painted a color or covered with an uploaded image. Saved as a
 * kind 30078 event on Nostr so every visitor sees the same walls.
 */
export function GalleryWallsDialog({ open, onOpenChange }: GalleryWallsDialogProps) {
  const { data: savedWalls } = useGalleryWalls();
  const { mutateAsync: saveWalls, isPending: isSaving } = useSaveGalleryWalls();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

  const [draft, setDraft] = useState<Record<WallKey, WallDraft>>({ ...DEFAULT_WALLS });
  const [error, setError] = useState<string | null>(null);
  const [pickingWall, setPickingWall] = useState<WallKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = isSaving || isUploading;

  // Initialize the draft each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setDraft({ ...DEFAULT_WALLS, ...(savedWalls ?? {}) });
    setError(null);
    setPickingWall(null);
  }, [open, savedWalls]);

  const handlePickImage = (wall: WallKey) => {
    setPickingWall(wall);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file || !pickingWall) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setError(null);
    setDraft((old) => ({ ...old, [pickingWall]: file }));
  };

  const handleSave = async () => {
    setError(null);
    try {
      const finalWalls = { ...DEFAULT_WALLS };
      for (const key of WALL_KEYS) {
        const value = draft[key];
        if (value instanceof File) {
          const optimized = await optimizeImage(value);
          const tags = await uploadFile(optimized);
          const url = tags?.[0]?.[1];
          if (!url) {
            throw new Error('Image upload failed — no URL returned.');
          }
          finalWalls[key] = url;
        } else if (typeof value === 'string' && value.length > 0) {
          finalWalls[key] = value;
        }
      }
      await saveWalls(finalWalls);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to update gallery walls:', e);
      setError(e instanceof Error ? e.message : 'Failed to update walls. Please try again.');
    }
  };

  const renderPreview = (key: WallKey, value: WallDraft) => {
    if (value instanceof File) {
      return (
        <img
          src={URL.createObjectURL(value)}
          alt={`${WALL_LABELS[key]} preview`}
          className="h-12 w-20 rounded-md border object-cover"
        />
      );
    }
    if (isImageValue(value)) {
      return (
        <img
          src={value}
          alt={`${WALL_LABELS[key]} current`}
          className="h-12 w-20 rounded-md border object-cover"
        />
      );
    }
    return (
      <span
        className="inline-block h-12 w-20 rounded-md border"
        style={{ backgroundColor: value }}
        title={value}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-orange-500" />
            Design the Walls
          </DialogTitle>
          <DialogDescription>
            Paint each wall a color or cover it with an image. Saved to Nostr —
            every visitor sees your design. Wall images tile across the surface.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />

        <div className="space-y-3 py-2">
          {WALL_KEYS.map((key) => {
            const value = draft[key];
            const isImage = value instanceof File || (typeof value === 'string' && isImageValue(value));
            const colorValue = typeof value === 'string' && !isImageValue(value) ? value : '#f97316';
            return (
              <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                <div className="w-24 shrink-0 text-sm font-semibold">{WALL_LABELS[key]}</div>
                {renderPreview(key, value)}
                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                  {/* Color picker */}
                  <label
                    className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-muted"
                    title="Paint with a color"
                  >
                    <input
                      type="color"
                      value={colorValue}
                      className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                      onChange={(e) =>
                        setDraft((old) => ({ ...old, [key]: e.target.value }))
                      }
                    />
                    Color
                  </label>
                  {/* Image upload */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handlePickImage(key)}
                  >
                    {isImage ? <ImageIcon className="h-3.5 w-3.5" /> : <Wallpaper className="h-3.5 w-3.5" />}
                    {isImage ? 'Change image' : 'Add image'}
                  </Button>
                  {/* Reset */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground"
                    title="Reset to default"
                    onClick={() =>
                      setDraft((old) => ({ ...old, [key]: DEFAULT_WALLS[key] }))
                    }
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={busy}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading…' : 'Saving…'}
              </>
            ) : (
              <>
                <Paintbrush className="h-4 w-4" />
                Save Walls
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
