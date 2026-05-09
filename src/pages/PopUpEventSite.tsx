import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, FileText, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function resolveBrandSiteSource(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:text/html')) return trimmed;
  if (trimmed.startsWith('data:application/pdf')) return trimmed;
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<')) {
    return `data:text/html;charset=utf-8,${encodeURIComponent(trimmed)}`;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:') || trimmed.startsWith('/') || trimmed.startsWith('file:')) {
    return trimmed;
  }

  return trimmed;
}

export default function PopUpEventSite() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();

  const { data: eventData, isLoading } = useQuery({
    queryKey: ['popup-event-site', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query(
        [{ kinds: [31922], '#d': [eventId!], '#t': ['bitpopart-popup'], limit: 1 }],
        { signal }
      );

      if (events.length === 0) return null;

      const event = events[0];
      const id = event.tags.find(t => t[0] === 'd')?.[1] || event.id;
      const title = event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled';
      const brandSite = event.tags.find(t => t[0] === 'brand-site')?.[1] || event.tags.find(t => t[0] === 'website')?.[1] || '';

      return { id, title, brandSite };
    },
    enabled: !!eventId,
  });

  const frameUrl = useMemo(() => resolveBrandSiteSource(eventData?.brandSite || ''), [eventData?.brandSite]);
  const isDataUrl = frameUrl.startsWith('data:text/html');

  const [iframeKey, setIframeKey] = useState(0);

  useSeoMeta({
    title: eventData ? `${eventData.title} - Event Project Site` : 'Event Project Site',
    description: 'Extra PopUp event project information, brochure and brand downloads.',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-[75vh] w-full" />
        </div>
      </div>
    );
  }

  if (!eventData || !frameUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Globe className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Project Site Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This event does not have an Event Brand Website yet.
              </p>
              <Button onClick={() => navigate(`/popup/${eventId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Button onClick={() => navigate(`/popup/${eventData.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Event Project Site</p>
            <h1 className="truncate font-semibold">{eventData.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIframeKey((value) => value + 1)}>
              Reload
            </Button>
            <Button asChild variant="outline">
              <a href={frameUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </a>
            </Button>
          </div>
        </div>
      </div>

      <main className="h-[calc(100vh-65px)]">
        <iframe
          key={iframeKey}
          title={`${eventData.title} project site`}
          src={frameUrl}
          className="h-full w-full border-0"
          sandbox={isDataUrl ? undefined : 'allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts'}
        />
      </main>

      <noscript>
        <div className="container mx-auto px-4 py-8 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p>This project site requires JavaScript to display in-frame.</p>
        </div>
      </noscript>
    </div>
  );
}
