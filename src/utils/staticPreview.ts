/**
 * Static first-frame preview for animated GIF tile uploads.
 *
 * Homepage grid tiles are small squares; storing a multi-megabyte animated
 * GIF as the tile image makes the thumb unrenderable (the image proxy has to
 * download + decode the whole source, and the direct fallback pushes ~11 MB
 * to every visitor — the recurring "homepage thumbs don't appear" bug). So
 * when an admin uploads a GIF as a tile image, we convert it client-side to a
 * small static WebP of its first frame and upload THAT as the tile image.
 * The animation is preserved on the page the tile links to.
 */

const PREVIEW_MAX_DIM = 640;

/** True when the file is (or looks like) an animated-capable GIF. */
export function isGifFile(file: File): boolean {
  return file.type === 'image/gif' || /\.gif$/i.test(file.name);
}

/**
 * Render the first frame of a GIF file as a small static WebP File.
 * Returns null when the file is not a GIF or cannot be decoded (callers
 * then upload the original file unchanged).
 */
export async function gifFileToStaticPreview(file: File): Promise<File | null> {
  if (!isGifFile(file)) return null;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not decode image'));
      image.src = objectUrl;
    });

    const scale = Math.min(
      1,
      PREVIEW_MAX_DIM / img.naturalWidth,
      PREVIEW_MAX_DIM / img.naturalHeight,
    );
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // drawImage on an animated GIF paints the current (first) frame.
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85),
    );
    if (!blob) return null;

    return new File([blob], file.name.replace(/\.gif$/i, '.webp'), {
      type: 'image/webp',
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
