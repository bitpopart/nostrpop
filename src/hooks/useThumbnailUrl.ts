import { useCallback } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { getThumbnailUrl } from '@/utils/thumbnailUrl';

/**
 * Returns a function that wraps an image URL through the configured
 * image proxy (if enabled). When the proxy is off (empty string),
 * it returns the original URL unchanged.
 *
 * Usage:
 *   const thumbnail = useThumbnailUrl();
 *   <img src={thumbnail(imageUrl, 160)} />
 *   // force animation preservation for extension-less GIFs:
 *   <img src={thumbnail(gifUrl, 160, { animated: true })} />
 */
export function useThumbnailUrl() {
  const { config } = useAppContext();
  const proxyBaseUrl = config.imageProxy;

  return useCallback(
    (src: string, width: number, opts?: { animated?: boolean }) =>
      getThumbnailUrl(src, width, proxyBaseUrl, opts),
    [proxyBaseUrl],
  );
}
