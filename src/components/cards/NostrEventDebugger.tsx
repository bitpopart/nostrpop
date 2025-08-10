import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Code } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

interface CardData {
  title: string;
  description: string;
  category: string;
  pricing: string;
  images: string[];
  created_at: string;
}

interface NostrEventDebuggerProps {
  cardEvent: NostrEvent;
  cardData: CardData;
}

export function NostrEventDebugger({ cardEvent, cardData }: NostrEventDebuggerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate the exact same content and tags as the share function
  const generateEventData = () => {
    // Generate card URL
    const dTag = cardEvent.tags.find(([name]) => name === 'd')?.[1];
    let cardUrl = `${window.location.origin}/card/${cardEvent.id}`;

    if (dTag) {
      try {
        const naddr = nip19.naddrEncode({
          identifier: dTag,
          pubkey: cardEvent.pubkey,
          kind: cardEvent.kind,
        });
        cardUrl = `${window.location.origin}/card/${naddr}`;
      } catch (error) {
        console.error('Error generating naddr:', error);
        cardUrl = `${window.location.origin}/card/${dTag}`;
      }
    }

    // Create the share content with image link after text, before hashtags
    let shareContent = `${cardData.title}\n\n${cardUrl}`;

    // Add the blossom image link after the text content
    if (cardData.images && cardData.images.length > 0) {
      shareContent = `${cardData.title}\n\n${cardUrl}\n\n${cardData.images[0]}`;
    }

    // Add hashtags at the end
    const categoryTag = cardData.category.toLowerCase().replace(/[^a-z0-9]/g, '');
    shareContent += `\n\n#ecard #${categoryTag}`;

    // Prepare tags array
    const tags = [
      ['t', 'ecard'],
      ['t', cardData.category.toLowerCase().replace(/[^a-z0-9]/g, '')],
      ['e', cardEvent.id, '', 'mention'],
    ];

    // Add the d-tag reference if available
    if (dTag) {
      tags.push(['a', `${cardEvent.kind}:${cardEvent.pubkey}:${dTag}`, '', 'mention']);
    }

    // Add multiple approaches for maximum compatibility
    if (cardData.images && cardData.images.length > 0) {
      const imageUrl = cardData.images[0];

      // Method 1: Simple image tag (widely supported)
      tags.push(['image', imageUrl]);

      // Method 2: NIP-92 imeta tag (newer clients)
      tags.push([
        'imeta',
        `url ${imageUrl}`,
        'm image/jpeg',
        `alt Preview image for "${cardData.title}" ecard`,
        `fallback ${cardUrl}`
      ]);

      // Method 3: Add r tag for reference (some clients use this)
      tags.push(['r', imageUrl]);

      // Method 4: Add url tag (alternative approach some clients check)
      tags.push(['url', imageUrl]);
    }

    return {
      kind: 1,
      content: shareContent,
      tags,
      created_at: Math.floor(Date.now() / 1000)
    };
  };

  const eventData = generateEventData();

  const copyEventData = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(eventData, null, 2));
      setCopied(true);
      toast({
        title: "Event Data Copied! 📋",
        description: "Nostr event JSON has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy event data:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy event data to clipboard.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="h-5 w-5 text-green-500" />
          Nostr Event Debug Info
        </CardTitle>
        <CardDescription>
          This shows exactly what will be posted to Nostr for debugging purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Preview */}
        <div>
          <h4 className="font-semibold mb-2">Content:</h4>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm whitespace-pre-wrap">
            {eventData.content}
          </div>
        </div>

        {/* Tags Preview */}
        <div>
          <h4 className="font-semibold mb-2">Tags ({eventData.tags.length}):</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {eventData.tags.map((tag, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Badge variant="outline" className="shrink-0">
                  {tag[0]}
                </Badge>
                <div className="font-mono text-xs break-all">
                  {tag.slice(1).join(' | ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Detection */}
        {cardData.images && cardData.images.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Image Detection Methods:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">✓</Badge>
                <span>Image URL in content (first line)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">✓</Badge>
                <span>image tag</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">✓</Badge>
                <span>imeta tag (NIP-92)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">✓</Badge>
                <span>r tag (reference)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">✓</Badge>
                <span>url tag</span>
              </div>
            </div>
          </div>
        )}

        {/* Copy Button */}
        <Button
          variant="outline"
          onClick={copyEventData}
          className="w-full"
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Full Event JSON
        </Button>
      </CardContent>
    </Card>
  );
}