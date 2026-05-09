import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, ExternalLink, FileText, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

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

function isHtmlUrl(url: string) {
  return /^https?:\/\//i.test(url) && /\.html?(?:[?#].*)?$/i.test(url);
}

function decodeHtmlDataUrl(dataUrl: string) {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return '';

  const metadata = dataUrl.slice(0, commaIndex);
  const payload = dataUrl.slice(commaIndex + 1);

  if (metadata.includes(';base64')) {
    try {
      return atob(payload);
    } catch {
      return '';
    }
  }

  try {
    return decodeURIComponent(payload);
  } catch {
    return payload;
  }
}

function addBaseTag(html: string, sourceUrl: string) {
  if (!sourceUrl || sourceUrl.startsWith('data:') || /<base\s/i.test(html)) return html;

  const baseTag = `<base href="${sourceUrl}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }

  return `${baseTag}${html}`;
}

async function fetchHtmlDocument(url: string, signal: AbortSignal) {
  const directResponse = await fetch(url, { signal }).catch(() => null);

  if (directResponse?.ok) {
    return directResponse.text();
  }

  const proxyResponse = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, { signal });
  if (!proxyResponse.ok) {
    throw new Error(`Unable to load HTML page (${proxyResponse.status})`);
  }

  return proxyResponse.text();
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
  const isDataHtml = frameUrl.startsWith('data:text/html');
  const shouldFetchHtml = isHtmlUrl(frameUrl);

  const { data: fetchedHtml, isLoading: isHtmlLoading, error: htmlError } = useQuery({
    queryKey: ['popup-event-site-html', frameUrl],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      return fetchHtmlDocument(frameUrl, signal);
    },
    enabled: shouldFetchHtml,
    retry: false,
  });

  const iframeHtml = useMemo(() => {
    if (isDataHtml) return decodeHtmlDataUrl(frameUrl);
    if (fetchedHtml) return addBaseTag(fetchedHtml, frameUrl);
    return undefined;
  }, [fetchedHtml, frameUrl, isDataHtml]);

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
        {isHtmlLoading ? (
          <div className="container mx-auto px-4 py-6">
            <Skeleton className="h-full min-h-[70vh] w-full" />
          </div>
        ) : htmlError ? (
          <div className="container mx-auto px-4 py-12">
            <Card className="max-w-xl mx-auto">
              <CardContent className="py-10 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Could not load HTML page</h2>
                <p className="text-muted-foreground mb-6">
                  The uploaded HTML file could not be loaded into the BitPopArt frame. You can still open it directly.
                </p>
                <Button asChild>
                  <a href={frameUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open directly
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <iframe
            key={iframeKey}
            title={`${eventData.title} project site`}
            src={iframeHtml ? undefined : frameUrl}
            srcDoc={iframeHtml}
            className="h-full w-full border-0"
            sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts"
          />
        )}
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
