import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ImageIcon, Loader2, Upload } from 'lucide-react';

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
import { useCreateArtwork, useUpdateArtwork } from '@/hooks/useArtworks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import type { ArtworkData } from '@/lib/artTypes';

/** True when a NIP-07 browser extension signer is injected on the page. */
function hasBrowserExtension(): boolean {
  return typeof window !== 'undefined' && 'nostr' in window;
}

/** Friendly message for failures caused by a missing extension signer. */
function extensionErrorMessage(): string {
  return 'Your session uses a browser-extension signer, but no NIP-07 extension is available here. Install/unlock your extension, or log out and log back in with your secret key (nsec) to upload.';
}

interface GalleryUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this artwork instead of creating a new one. */
  editArtwork?: ArtworkData | null;
}

/** Largest image dimension after optimization (plenty for a 3D wall frame). */
const MAX_DIMENSION = 1600;

/**
 * Downscale/recompress large images before uploading so the virtual gallery
 * (and the Blossom server) stay fast. GIFs and SVGs pass through untouched.
 */
export async function optimizeImage(file: File): Promise<File> {
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
export function GalleryUploadDialog({ open, onOpenChange, editArtwork }: GalleryUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editArtwork;
  const existingImage = editArtwork?.images?.[0] ?? null;

  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutateAsync: createArtwork, isPending: isCreating } = useCreateArtwork();
  const { mutateAsync: updateArtwork, isPending: isUpdating } = useUpdateArtwork();
  const { user } = useCurrentUser();

  const busy = isUploading || isCreating || isUpdating;

  // Prefill the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTitle(editArtwork?.title ?? '');
    setFile(null);
    setPreview(null);
    setError(null);
  }, [open, editArtwork]);

  // If the logged-in session relies on a browser extension that is not present,
  // signing will fail. Detect this up-front and tell the user exactly how to fix it.
  const signerUnavailable =
    user?.method === 'extension' && !hasBrowserExtension();

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
    if (signerUnavailable) {
      setError(extensionErrorMessage());
      return;
    }
    // Adding requires an image. Editing can keep the existing image.
    if (!file && !(isEdit && existingImage)) {
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
      // Upload a new image if one was chosen; otherwise reuse the current one.
      let imageUrl = existingImage ?? '';
      if (file) {
        const optimized = await optimizeImage(file);
        const tags = await uploadFile(optimized);
        const url = tags?.[0]?.[1];
        if (!url) {
          throw new Error('Image upload failed — no URL returned.');
        }
        imageUrl = url;
      }

      if (isEdit && editArtwork) {
        await updateArtwork({ existing: editArtwork, title: trimmedTitle, imageUrl });
      } else {
        await createArtwork({
          title: trimmedTitle,
          description: '',
          images: [imageUrl],
          saleType: 'not_for_sale',
        });
      }
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error('Gallery upload failed:', e);
      const msg = e instanceof Error ? e.message : 'Upload failed. Please try again.';
      // A missing extension signer surfaces as "...extension not available".
      setError(/extension/i.test(msg) ? extensionErrorMessage() : msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-500" />
            {isEdit ? 'Edit Artwork' : 'Add Art to POP WORLD'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Replace the image or title, then save. The artwork updates in place for every visitor.'
              : 'Publishes a new artwork to Nostr as the site admin. It hangs in the virtual gallery for every visitor to see.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Signer warning — extension session with no extension present */}
          {signerUnavailable && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{extensionErrorMessage()}</p>
            </div>
          )}

          {/* Image picker */}
          <div>
            <Label htmlFor="gallery-upload-file" className="mb-2 block">
              {isEdit ? 'Artwork image (choose a new one to replace it)' : 'Artwork image'}
            </Label>
            <input
              id="gallery-upload-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {(preview || existingImage) ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative block w-full overflow-hidden rounded-xl border"
                title="Change image"
              >
                <img
                  src={preview || existingImage || ''}
                  alt="Preview"
                  className="max-h-56 w-full object-contain bg-gray-50 dark:bg-gray-900"
                />
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-sm font-semibold text-white group-hover:flex">
                  {file ? 'Change image' : 'Replace image'}
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
            disabled={busy || signerUnavailable || (!file && !(isEdit && existingImage)) || !title.trim()}
            className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isUploading ? 'Uploading…' : 'Saving…'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {isEdit ? 'Save Changes' : 'Publish to Gallery'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
