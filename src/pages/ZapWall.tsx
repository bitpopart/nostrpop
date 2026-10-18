import { useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';

/**
 * Zapwall — the Stream Road live channels & zap walls dashboard, shown
 * inline under the site Layout so the bitpopart.com menu and footer stay
 * visible, like every other page.
 *
 * The Zapwall page is a self-contained static site shipped at
 * /zapwall-app/index.html (see public/zapwall-app/). It runs unchanged in a
 * same-origin, auto-height iframe: the page scrolls with the site instead of
 * showing its own scrollbars.
 */
export default function ZapWall() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(700);

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
  }, []);

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
