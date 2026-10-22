import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useJustBDataSource } from '@/hooks/useJustBData';
import { DEFAULT_WHATS_NEW, JUSTB_DATA_SOURCE, type JustBNewsFeed } from '@/lib/justb';

/**
 * WHAT'S NEW — the Just B feed at bitpopart.com/new, shown inline under the
 * site Layout so the bitpopart.com menu and footer stay visible, exactly
 * like /b, /rare and /zapwall.
 *
 * The page is the owner's self-contained static document shipped at
 * /justb-app/whats-new.html (image bank + seed posts embedded). It runs
 * unchanged in a same-origin, auto-height iframe: the page scrolls with the
 * site instead of showing its own scrollbars.
 *
 * Live data: the owner manages the whole feed (posts, cards, statuses, drop
 * dates) in /admin → Just B → What's New, which publishes a Nostr kind-30078
 * event (d-tag com.bitpopart.justb). This page reads the config from the
 * relays and hands the news section to the iframe via postMessage — no
 * redeploy when posts are added, edited or deleted.
 */
export default function WhatsNew() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(700);

  const { data } = useJustBDataSource();
  const feedRef = useRef<JustBNewsFeed>(DEFAULT_WHATS_NEW);

  /** Push the latest admin-published feed into the iframe. */
  const sendData = useCallback(() => {
    const frame = frameRef.current;
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(
        { source: JUSTB_DATA_SOURCE, type: 'data', data: { news: feedRef.current } },
        window.location.origin,
      );
    } catch {
      // iframe not ready — the load handler re-sends
    }
  }, []);

  // Keep the latest feed and push it whenever it changes.
  useEffect(() => {
    feedRef.current = data?.news ?? DEFAULT_WHATS_NEW;
    sendData();
  }, [data, sendData]);

  useSeoMeta({
    title: "What's New — Just B | BitPopArt",
    description:
      "What's New: every new Just B collectible and card, announced right here — Mystery B reveals, new deck cards, drop dates and print runs. Just Bitcoin. Just pop art. Just B.",
    ogTitle: "What's New — Just B | BitPopArt",
    ogDescription:
      "Every new Just B collectible and card: Mystery B reveals, new deck cards, drops and print runs.",
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
  });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const doc = frame.contentDocument;
      const body = doc?.body;
      if (!body || !doc) return;
      // Measure the BODY only. `documentElement.scrollHeight` is poisoned
      // for an auto-height iframe: it never reports below the iframe's own
      // viewport height, so once the height grew too big it could never
      // shrink back.
      const h = Math.max(body.scrollHeight, 600);
      setHeight((prev) => (Math.abs(prev - h) > 4 ? h : prev));
    };

    const onLoad = () => {
      measure();
      sendData();
      const doc = frame.contentDocument;
      if (doc?.body) {
        try {
          const ro = new ResizeObserver(() => measure());
          ro.observe(doc.body);
          (frame as HTMLIFrameElement & { __whatsNewRO?: ResizeObserver }).__whatsNewRO = ro;
        } catch {
          // older browsers — the interval below still covers height changes
        }
      }
    };

    frame.addEventListener('load', onLoad);
    // Safety net: image loads change the height after load.
    const interval = setInterval(measure, 2000);
    window.addEventListener('resize', measure);

    return () => {
      frame.removeEventListener('load', onLoad);
      window.removeEventListener('resize', measure);
      clearInterval(interval);
      (frame as HTMLIFrameElement & { __whatsNewRO?: ResizeObserver }).__whatsNewRO?.disconnect();
    };
  }, [sendData]);

  return (
    <div className="w-full" style={{ backgroundColor: '#eef0f1' }}>
      <iframe
        ref={frameRef}
        src="/justb-app/whats-new.html"
        title="What's New — Just B"
        className="w-full border-0 block"
        style={{ height }}
      />
    </div>
  );
}
