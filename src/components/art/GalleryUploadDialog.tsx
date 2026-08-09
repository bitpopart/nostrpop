import { useCallback, useRef, useState } from 'react';
import { ImageIcon, Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateArtwork } from '@/hooks/useArtworks';
import { useUploadFile } from '@/hooks/useUploadFile';

interface GalleryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Largest image dimension after optimization (plenty for a 3D wall frame). */
const MAX_DIMENSION = 1600;

/**
 * Downscale/recompress large images before uploading so the virtual gallery
 * (and the Blossom server) stay fast. GIFs and SVGs pass through untouched.
 */
async function optimizeImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    // Already small enough? Keep the original file.
    if (scale === 1 && file.size <= 1_500_000) {
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    );
    if (!blob) return file;
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'artwork';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Admin-only dialog for adding artwork to the POP WORLD virtual gallery.
 *
 * Uploads the image to a Blossom server, then publishes a kind 39239 artwork
 * event to Nostr (signed by the logged-in admin). The /gallery page
 * auto-populates from these Nostr artworks, so once published the new piece
 * appears on the wall for every visitor.
 */
export function GalleryUploadDialog({ open, onOpenChange }: GalleryUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutateAsync: createArtwork, isPending: isPublishing } = useCreateArtwork();

  const busy = isUploading || isPublishing;

  const handleFile = useCallback((selected: File | null) => {
    setError(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return selected ? URL.createObjectURL(selected) : null;
    });
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP or GIF).');
      setFile(null);
      return;
    }
    setFile(selected);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setTitle('');
    setError(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (busy) return; // Don't allow closing mid-publish.
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Choose an image first.');
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Give the artwork a title.');
      return;
    }
    setError(null);
    try {
      const optimized = await optimizeImage(file);
      const tags = await uploadFile(optimized);
      const url = tags?.[0]?.[1];
      if (!url) {
        throw new Error('Image upload failed — no URL returned.');
      }
      await createArtwork({
        title: trimmedTitle,
        description: '',
        images: [url],
        saleType: 'not_for_sale',
      });
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error('Gallery upload failed:', e);
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            Add Art to POP WORLD
          </DialogTitle>
          <DialogDescription>
            Publishes a new artwork to Nostr as the site admin. It hangs in the
            virtual gallery for every visitor to see.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image picker */}
          <div>
            <Label htmlFor="gallery-upload-file" className="mb-2 block">
              Artwork image
            </Label>
            <input
              id="gallery-upload-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative block w-full overflow-hidden rounded-xl border"
                title="Change image"
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-56 w-full object-contain bg-gray-50 dark:bg-gray-900"
                />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-sm font-semibold text-white group-hover:flex">
                  Change image
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-muted-foreground transition-colors hover:border-orange-400 hover:text-orange-500"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm font-medium">Click to choose an image</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="gallery-upload-title">Title</Label>
            <Input
              id="gallery-upload-title"
              value={title}
              maxLength={60}
              placeholder="e.g. Waterpoort Sunset"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !busy) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={busy || !file || !title.trim()}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading…' : 'Publishing…'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Publish to Gallery
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
