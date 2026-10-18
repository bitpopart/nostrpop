import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useJustBDataSource } from '@/hooks/useJustBData';
import { JUSTB_DATA_SOURCE, type JustBData } from '@/lib/justb';

/**
 * Just B — the Mystery Box page, shown inline under the site Layout so the
 * bitpopart.com menu and footer stay visible, exactly like /zapwall.
 *
 * The Just B page is a self-contained static site shipped at
 * /justb-app/index.html (see public/justb-app/). It runs unchanged in a
 * same-origin, auto-height iframe: the page scrolls with the site instead of
 * showing its own scrollbars.
 *
 * Live data: the owner manages the whole config (base B's, drops, shops,
 * launch date, rarity ladder, ledger "updated" stamp) in /admin → Just B,
 * which publishes a Nostr kind-30078 event. This page reads it from the
 * relays and hands it to the iframe via postMessage (the iframe falls back
 * to its static seed config when opened standalone).
 */
export default function JustB() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(700);

  const { data, refresh } = useJustBDataSource();
  const dataRef = useRef<JustBData | null>(null);

  /** Push the latest admin-published config into the iframe dashboard. */
  const sendData = useCallback(() => {
    const frame = frameRef.current;
    const cfg = dataRef.current;
    if (!frame || !frame.contentWindow || !cfg) return;
    try {
      frame.contentWindow.postMessage(
        { source: JUSTB_DATA_SOURCE, type: 'data', data: cfg },
        window.location.origin,
      );
    } catch {
      // iframe not ready — the load handler re-sends
    }
  }, []);

  // Keep the latest config and push it whenever it changes.
  useEffect(() => {
    dataRef.current = data ?? null;
    sendData();
  }, [data, sendData]);

  // The dashboard may ask for the latest data, or ask the site to scroll
  // back to the app top when an in-page viewer (Just B Online / Full Ledger)
  // opens.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { source?: string; type?: string; url?: string } | null;
      if (!d || d.source !== JUSTB_DATA_SOURCE) return;
      if (d.type === 'request') {
        sendData();
        void refresh();
      } else if (d.type === 'scrolltop') {
        frameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (d.type === 'navigate' && d.url) {
        // The in-app "GET A BITBOT" button opens a full site page (/bitbot)
        // in the top window — never inside the /b iframe.
        window.location.href = d.url;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendData, refresh]);

  useSeoMeta({
    title: 'Just B — Mystery Box | BitPopArt',
    description:
      'The Just-B Pop Art Collection: six regular B collectibles, a never-ending run of rare Mystery B\u2019s, the full ledger, and The Stack trading card game — by BitPopArt.',
    ogTitle: 'Just B — Mystery Box | BitPopArt',
    ogDescription:
      'Six regular B\u2019s, an endless run of rare Mystery B\u2019s, and a card game built on 21. Just Bitcoin. Just pop art. Just B.',
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
      sendData();
      const doc = frame.contentDocument;
      if (doc?.body) {
        try {
          const ro = new ResizeObserver(() => measure());
          ro.observe(doc.body);
          (frame as HTMLIFrameElement & { __justbRO?: ResizeObserver }).__justbRO = ro;
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
      (frame as HTMLIFrameElement & { __justbRO?: ResizeObserver }).__justbRO?.disconnect();
    };
  }, [sendData]);

  return (
    <div className="w-full" style={{ backgroundColor: '#0e0a17' }}>
      <iframe
        ref={frameRef}
        src="/justb-app/"
        title="Just B — Mystery Box"
        className="w-full border-0 block"
        style={{ height }}
      />
    </div>
  );
}
