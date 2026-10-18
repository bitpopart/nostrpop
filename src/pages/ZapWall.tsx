import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useZapwallChannels } from '@/hooks/useZapwallChannels';
import type { ZapwallChannel } from '@/lib/zapwall';

/**
 * Zapwall — the Stream Road live channels & zap walls dashboard, shown
 * inline under the site Layout so the bitpopart.com menu and footer stay
 * visible, like every other page.
 *
 * The Zapwall page is a self-contained static site shipped at
 * /zapwall-app/index.html (see public/zapwall-app/). It runs unchanged in a
 * same-origin, auto-height iframe: the page scrolls with the site instead of
 * showing its own scrollbars.
 *
 * Live data: the owner manages the channels/events in /admin → Zapwall, which
 * publishes a Nostr kind-30078 event. This page reads it from the relays and
 * hands it to the iframe via postMessage (the iframe falls back to its static
 * seed list when opened standalone).
 */
const DATA_SOURCE = 'bitpopart-zapwall';

export default function ZapWall() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(700);

  const { data: channels, refetch } = useZapwallChannels();
  const channelsRef = useRef<ZapwallChannel[] | null>(null);

  /** Push the latest admin-published channels into the iframe dashboard. */
  const sendChannels = useCallback(() => {
    const frame = frameRef.current;
    const list = channelsRef.current;
    if (!frame || !frame.contentWindow || !list) return;
    try {
      frame.contentWindow.postMessage(
        { source: DATA_SOURCE, type: 'channels', channels: list },
        window.location.origin,
      );
    } catch {
      // iframe not ready — the load handler re-sends
    }
  }, []);

  // Keep the latest list and push it whenever it changes.
  useEffect(() => {
    channelsRef.current = channels ?? null;
    sendChannels();
  }, [channels, sendChannels]);

  // The dashboard's refresh button asks for the latest data.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { source?: string; type?: string } | null;
      if (!d || d.source !== DATA_SOURCE || d.type !== 'request') return;
      sendChannels();
      void refetch();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendChannels, refetch]);

  useSeoMeta({
    title: 'Zapwall — Stream Road live channels | BitPopArt',
    description:
      'The BitPopArt zap wall: Stream Road channels, live zaps and schedules. Zap it, watch it fill up — powered by Nostr and Lightning.',
    ogTitle: 'Zapwall — Stream Road channels',
    ogDescription:
      'Live Stream Road channels and zap walls from BitPopArt. Zap the artist, watch the wall fill up.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
  });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const doc = frame.contentDocument;
      const body = doc?.body;
      if (!body || !doc) return;
      const h = Math.max(
        body.scrollHeight,
        doc.documentElement ? doc.documentElement.scrollHeight : 0,
        600,
      );
      setHeight((prev) => (Math.abs(prev - h) > 4 ? h : prev));
    };

    const onLoad = () => {
      measure();
      sendChannels();
      const doc = frame.contentDocument;
      if (doc?.body) {
        try {
          const ro = new ResizeObserver(() => measure());
          ro.observe(doc.body);
          // keep it reachable for cleanup
          (frame as HTMLIFrameElement & { __zapwallRO?: ResizeObserver }).__zapwallRO = ro;
        } catch {
          // older browsers — the interval below still covers height changes
        }
      }
    };

    frame.addEventListener('load', onLoad);
    // Safety net: the app's language/filter tabs change the height after load.
    const interval = setInterval(measure, 2000);
    window.addEventListener('resize', measure);

    return () => {
      frame.removeEventListener('load', onLoad);
      window.removeEventListener('resize', measure);
      clearInterval(interval);
      (frame as HTMLIFrameElement & { __zapwallRO?: ResizeObserver }).__zapwallRO?.disconnect();
    };
  }, [sendChannels]);

  return (
    <div className="w-full" style={{ backgroundColor: '#0e0a17' }}>
      <iframe
        ref={frameRef}
        src="/zapwall-app/"
        title="Zapwall — Stream Road channels"
        className="w-full border-0 block"
        style={{ height }}
      />
    </div>
  );
}
