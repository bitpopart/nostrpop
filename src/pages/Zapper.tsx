import { useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';

/**
 * Zapper — the ZAPPER zap-lamp updates & control page (from
 * JaccoElektro/zapper-updates), shown inline under the site Layout so the
 * bitpopart.com menu and footer stay visible, like every other page.
 *
 * The Zapper app is a self-contained static site shipped at
 * /zapper-app/index.html (see public/zapper-app/). It runs unchanged in a
 * same-origin, auto-height iframe: the app keeps all its own functionality
 * (signed update list, downloads, My Zappers, language switch) while the
 * page scrolls with the site instead of showing its own scrollbars.
 */
export default function Zapper() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(700);

  useSeoMeta({
    title: 'Zapper control — ZAPPER zap lamps | BitPopArt',
    description:
      'Open one ZAPPER in your browser and manage them all: signed firmware updates, celebrations and tunes, settings and Wi-Fi. Nothing to install, from bitpopart.com.',
    ogTitle: 'Zapper control — ZAPPER zap lamps',
    ogDescription:
      'All your Zappers in one place. Signed updates, celebrations and tunes, on your phone and computer.',
    ogImage: 'https://bitpopart.com/zapper-app/beeld/icon-512.png',
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
          (frame as HTMLIFrameElement & { __zapperRO?: ResizeObserver }).__zapperRO = ro;
        } catch {
          // older browsers — the interval below still covers height changes
        }
      }
    };

    frame.addEventListener('load', onLoad);
    // Safety net: the app's language/device tabs change the height after load.
    const interval = setInterval(measure, 2000);
    window.addEventListener('resize', measure);

    return () => {
      frame.removeEventListener('load', onLoad);
      window.removeEventListener('resize', measure);
      clearInterval(interval);
      (frame as HTMLIFrameElement & { __zapperRO?: ResizeObserver }).__zapperRO?.disconnect();
    };
  }, []);

  return (
    <div className="w-full" style={{ backgroundColor: '#0b0517' }}>
      <iframe
        ref={frameRef}
        src="/zapper-app/"
        title="Zapper control — ZAPPER zap lamps"
        className="w-full border-0 block"
        style={{ height }}
      />
    </div>
  );
}
