/**
 * Extract image URLs from text content
 * Supports various image URL formats including:
 * - Direct image URLs (jpg, jpeg, png, gif, webp, svg)
 * - Nostr image tags (imeta tags)
 * - Markdown image syntax ![alt](url)
 */

export interface ExtractedImage {
  url: string;
  alt?: string;
  source: 'url' | 'markdown' | 'imeta';
}

export function extractImagesFromContent(content: string, tags?: string[][]): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const seenUrls = new Set<string>();

  // 1. Extract from imeta tags (NIP-92)
  if (tags) {
    tags.forEach(tag => {
      if (tag[0] === 'imeta') {
        // imeta tag format: ["imeta", "url https://example.com/image.jpg", "alt Description", ...]
        const urlParam = tag.find(param => param.startsWith('url '));
        const altParam = tag.find(param => param.startsWith('alt '));

        if (urlParam) {
          const url = urlParam.substring(4); // Remove 'url ' prefix
          const alt = altParam ? altParam.substring(4) : undefined; // Remove 'alt ' prefix

          if (isImageUrl(url) && !seenUrls.has(url)) {
            images.push({ url, alt, source: 'imeta' });
            seenUrls.add(url);
          }
        }
      }
    });
  }

  // 2. Extract markdown images ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let markdownMatch;

  while ((markdownMatch = markdownImageRegex.exec(content)) !== null) {
    const alt = markdownMatch[1];
    const url = markdownMatch[2];

    if (isImageUrl(url) && !seenUrls.has(url)) {
      images.push({ url, alt: alt || undefined, source: 'markdown' });
      seenUrls.add(url);
    }
  }

  // 3. Extract direct image URLs
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  let urlMatch;

  while ((urlMatch = urlRegex.exec(content)) !== null) {
    const url = urlMatch[0];

    if (isImageUrl(url) && !seenUrls.has(url)) {
      images.push({ url, source: 'url' });
      seenUrls.add(url);
    }
  }

  return images;
}

/**
 * Check if a URL points to an image
 */
function isImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    // Check file extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));

    if (hasImageExtension) {
      return true;
    }

    // Check for common image hosting domains that don't always have extensions
    const imageHosts = [
      'imgur.com',
      'i.imgur.com',
      'cdn.nostr.build',
      'nostr.build',
      'image.nostr.build',
      'primal.net',
      'void.cat',
      'blossom.primal.net',
      'nostrage.com'
    ];

    return imageHosts.some(host => urlObj.hostname.includes(host));
  } catch {
    return false;
  }
}

/**
 * Get the first image from content, prioritizing imeta tags
 */
export function getFirstImage(content: string, tags?: string[][]): ExtractedImage | null {
  const images = extractImagesFromContent(content, tags);

  // Prioritize imeta tags, then markdown, then direct URLs
  const imetaImage = images.find(img => img.source === 'imeta');
  if (imetaImage) return imetaImage;

  const markdownImage = images.find(img => img.source === 'markdown');
  if (markdownImage) return markdownImage;

  return images[0] || null;
}

/**
 * Remove image URLs and markdown from text content for clean text preview
 */
export function stripImagesFromContent(content: string): string {
  // Remove markdown images
  let cleanContent = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');

  // Remove standalone image URLs
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  cleanContent = cleanContent.replace(urlRegex, (url) => {
    return isImageUrl(url) ? '' : url;
  });

  // Clean up extra whitespace
  cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

  return cleanContent;
}