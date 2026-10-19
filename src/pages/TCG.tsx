import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useJustBDataSource } from '@/hooks/useJustBData';
import { JUSTB_DATA_SOURCE, type JustBData } from '@/lib/justb';

/**
 * The Stack — the Just B trading card game page at bitpopart.com/tcg,
 * shown inline under the site Layout so the bitpopart.com menu and footer
 * stay visible, exactly like /b and /zapwall.
 *
 * The page is a self-contained static site shipped at /tcg-app/index.html
 * (the THE STACK card-game section of the Just B app). It runs unchanged in
 * a same-origin, auto-height iframe: the page scrolls with the site instead
 * of showing its own scrollbars.
 *
 * Live data: the owner manages the Just B config in /admin → Just B, which
 * publishes a Nostr kind-30078 event. This page reads it from the relays and
 * hands it to the iframe via postMessage (same contract as /b; the iframe
 * falls back to its static seed config when opened standalone).
 */
export default function TCG() {
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
  // back to the app top when an in-page viewer (Just B Online) opens.
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
        window.location.href = d.url;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sendData, refresh]);

  useSeoMeta({
    title: 'The Stack — Just B Card Game | BitPopArt',
    description:
      'The Stack: the Just B trading card game built on 21. 21-card decks, Fuel, Deploy, Attack — your cards are your life, play for what\u2019s in the Pot.',
    ogTitle: 'The Stack — Just B Card Game | BitPopArt',
    ogDescription:
      'A collectible card game built entirely around Bitcoin\u2019s 21 million. Deploy, fuel, attack. Play it online, free, in your browser.',
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
      // viewport height, so once the height grew too big (e.g. the in-page
      // viewer opening against a tall page) it could never shrink back.
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
          (frame as HTMLIFrameElement & { __tcgRO?: ResizeObserver }).__tcgRO = ro;
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
      (frame as HTMLIFrameElement & { __tcgRO?: ResizeObserver }).__tcgRO?.disconnect();
    };
  }, [sendData]);

  return (
    <div className="w-full" style={{ backgroundColor: '#0e0a17' }}>
      <iframe
        ref={frameRef}
        src="/tcg-app/"
        title="The Stack — Just B Card Game"
        className="w-full border-0 block"
        style={{ height }}
      />
    </div>
  );
}
