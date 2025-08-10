import { useMemo } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs and hashtags are linkified, and images are displayed inline. */
export function NoteContent({
  event,
  className,
}: NoteContentProps) {
  // Helper function to check if URL is an image
  const isImageUrl = (url: string): boolean => {
    // Check for common image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico|avif)(\?.*)?$/i;
    if (imageExtensions.test(url)) return true;

    // Check for common image hosting domains that might not have extensions
    const imageHosts = /^https?:\/\/(.*\.)?(imgur\.com|i\.redd\.it|pbs\.twimg\.com|media\.giphy\.com|i\.imgur\.com|cdn\.discordapp\.com|images\.unsplash\.com|picsum\.photos)/i;
    if (imageHosts.test(url)) return true;

    return false;
  };

  // Process the content to render mentions, links, images, etc.
  const content = useMemo(() => {
    const text = event.content;

    // Regex to find URLs, Nostr references, and hashtags
    const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;

    const parts: React.ReactNode[] = [];
    const images: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, url, nostrPrefix, nostrData, hashtag] = match;
      const index = match.index;

      // Add text before this match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }

      if (url) {
        // Check if URL is an image
        if (isImageUrl(url)) {
          images.push(url);
          // Don't add the URL as text, we'll render images separately
        } else {
          // Handle non-image URLs
          parts.push(
            <a
              key={`url-${keyCounter++}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {url}
            </a>
          );
        }
      } else if (nostrPrefix && nostrData) {
        // Handle Nostr references
        try {
          const nostrId = `${nostrPrefix}${nostrData}`;
          const decoded = nip19.decode(nostrId);

          if (decoded.type === 'npub') {
            const pubkey = decoded.data;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else {
            // For other types, just show as a link
            parts.push(
              <Link
                key={`nostr-${keyCounter++}`}
                to={`/${nostrId}`}
                className="text-blue-500 hover:underline"
              >
                {fullMatch}
              </Link>
            );
          }
        } catch {
          // If decoding fails, just render as text
          parts.push(fullMatch);
        }
      } else if (hashtag) {
        // Handle hashtags
        const tag = hashtag.slice(1); // Remove the #
        parts.push(
          <Link
            key={`hashtag-${keyCounter++}`}
            to={`/t/${tag}`}
            className="text-blue-500 hover:underline"
          >
            {hashtag}
          </Link>
        );
      }

      lastIndex = index + fullMatch.length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // If no special content was found, just use the plain text
    if (parts.length === 0) {
      parts.push(text);
    }

    return { textContent: parts, images };
  }, [event]);

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {/* Text content */}
      <div>
        {content.textContent.length > 0 ? content.textContent : event.content}
      </div>

      {/* Images */}
      {content.images.length > 0 && (
        <div className="mt-4 space-y-3">
          {content.images.map((imageUrl, index) => (
            <div key={`image-${index}`} className="rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={`Image ${index + 1}`}
                className="w-full max-w-lg rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                onClick={() => window.open(imageUrl, '_blank')}
                onError={(e) => {
                  // If image fails to load, show as a link instead
                  const target = e.target as HTMLImageElement;
                  const container = target.parentElement;
                  if (container) {
                    container.innerHTML = `
                      <a href="${imageUrl}" target="_blank" rel="noopener noreferrer"
                         class="text-blue-500 hover:underline inline-flex items-center space-x-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span>🖼️</span>
                        <span class="truncate">${imageUrl}</span>
                      </a>
                    `;
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName
          ? "text-blue-500"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      @{displayName}
    </Link>
  );
}