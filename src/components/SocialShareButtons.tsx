import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShareToNostrButton } from '@/components/ShareToNostrButton';
import { ClawstrShare } from '@/components/ClawstrShare';
import { Share2 } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

interface SocialShareButtonsProps {
  event?: NostrEvent;
  url: string;
  title: string;
  description?: string;
  image?: string;
  contentType?: 'product' | 'popup' | 'card' | 'artwork' | 'project' | 'badge';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
}

export function SocialShareButtons({
  event,
  url,
  title,
  description,
  image,
  contentType = 'product',
  className = '',
  size = 'sm',
  variant = 'outline',
}: SocialShareButtonsProps) {
  const fullUrl = url.startsWith('http') ? url : `https://www.bitpopart.com${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  // Social media share URLs
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;

  const handleSocialShare = (platform: string, shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Share to Nostr */}
      <ShareToNostrButton
        url={fullUrl}
        title={title}
        description={description}
        image={image}
        variant={variant}
        size={size}
        className="flex-1"
      />

      {/* Combined Social Share Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Clawstr */}
          {event && (
            <ClawstrShare
              event={event}
              contentType={contentType}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Clawstr
                </DropdownMenuItem>
              }
            />
          )}
          
          {/* Facebook */}
          <DropdownMenuItem onClick={() => handleSocialShare('Facebook', facebookUrl)}>
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </DropdownMenuItem>

          {/* Twitter/X */}
          <DropdownMenuItem onClick={() => handleSocialShare('Twitter', twitterUrl)}>
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X (Twitter)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
