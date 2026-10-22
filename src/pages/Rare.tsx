import { useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';

/**
 * RARE — the Just B Rarity Ledger at bitpopart.com/rare, shown inline under
 * the site Layout so the bitpopart.com menu and footer stay visible, exactly
 * like /b and /zapwall.
 *
 * The page is a self-contained static document shipped at
 * /justb-app/ledger.html (the same file the "OPEN THE FULL LEDGER" button on
 * /b opens in its in-page viewer). It runs unchanged in a same-origin,
 * auto-height iframe: the page scrolls with the site instead of showing its
 * own scrollbars. The ledger is fully static data embedded in the file — no
 * relay config needed — so this page just renders it full-width.
 */
export default function Rare() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(700);

  useSeoMeta({
    title: 'Just B Rarity Ledger — RARE | BitPopArt',
    description:
      'The full Just B rarity ledger: every B collectible and card, its print run, batches, and block heights — plus the collector trading market. Just Bitcoin. Just pop art. Just B.',
    ogTitle: 'Just B Rarity Ledger | BitPopArt',
    ogDescription:
      'The full Just B rarity ledger: every B collectible and card, its print run, batches, block heights — and the collector trading market.',
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
      const doc = frame.contentDocument;
      if (doc?.body) {
        try {
          const ro = new ResizeObserver(() => measure());
          ro.observe(doc.body);
          (frame as HTMLIFrameElement & { __rareRO?: ResizeObserver }).__rareRO = ro;
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
      (frame as HTMLIFrameElement & { __rareRO?: ResizeObserver }).__rareRO?.disconnect();
    };
  }, []);

  return (
    <div className="w-full" style={{ backgroundColor: '#eef0f1' }}>
      <iframe
        ref={frameRef}
        src="/justb-app/ledger.html"
        title="Just B Rarity Ledger"
        className="w-full border-0 block"
        style={{ height }}
      />
    </div>
  );
}
