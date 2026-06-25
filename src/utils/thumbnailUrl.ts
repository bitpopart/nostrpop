/**
 * Generate a proxied thumbnail URL for an image.
 *
 * When `proxyBaseUrl` is empty, returns the original URL unchanged.
 * When set (e.g. 'https://wsrv.nl'), returns a URL that serves a resized,
 * WebP-compressed thumbnail via the proxy.
 *
 * The proxy must support the wsrv.nl / weserv images API:
 *   https://github.com/weserv/images
 *
 * @param src           Original image URL
 * @param width         Desired thumbnail width in pixels
 * @param proxyBaseUrl  Base URL of the image proxy (empty = disabled)
 * @param opts.animated Force animation-preserving output even when the URL has
 *                      no recognizable extension (e.g. extension-less Blossom
 *                      GIFs). When omitted, animation is auto-detected from a
 *                      `.gif` extension.
 */
export function getThumbnailUrl(
  src: string,
  width: number,
  proxyBaseUrl: string,
  opts?: { animated?: boolean },
): string {
  if (!proxyBaseUrl || !src) return src;

  // Don't proxy data: URIs, SVGs, or already-proxied URLs
  if (src.startsWith('data:') || src.endsWith('.svg')) return src;
  if (src.includes('wsrv.nl') || src.includes(proxyBaseUrl)) return src;

  // Normalize: strip trailing slash
  const base = proxyBaseUrl.replace(/\/+$/, '');

  // Animated images (GIFs) must keep all frames and stay in an animated
  // format. Forcing output=webp on the proxy flattens them to a single static
  // frame. For these we request the GIF output with n=-1 (all frames) so the
  // thumbnail is still resized but keeps its animation.
  const isAnimated = opts?.animated ?? /\.gif(\?|$)/i.test(src);

  const params = new URLSearchParams({
    url: src,
    w: String(width),
    ...(isAnimated
      ? { output: 'gif', n: '-1' }
      : { output: 'webp', q: '75' }),
    default: src,
  });

  return `${base}/?${params.toString()}`;
}
