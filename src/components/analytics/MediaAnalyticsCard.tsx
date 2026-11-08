import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NOSTR_BUILD_ANALYTICS = 'https://account.nostr.build/analytics';

/**
 * Shortcut to the analytics of the media stored at nostr.build (views per
 * file, top media, countries, referrers). nostr.build shows these only after
 * logging in to the account, and it has no public analytics API, so the
 * numbers cannot be pulled into this page. The card opens them in one click.
 */
export function MediaAnalyticsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-orange-500" />
          Media analytics (nostr.build)
        </CardTitle>
        <CardDescription>
          Views per file, top and trending media, countries and referrers for the images and videos hosted on your
          nostr.build account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
          <a href={NOSTR_BUILD_ANALYTICS} target="_blank" rel="noopener noreferrer">
            Open nostr.build analytics
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">
          Opens in a new tab. You need to be logged in to your nostr.build account.
        </p>
      </CardContent>
    </Card>
  );
}
