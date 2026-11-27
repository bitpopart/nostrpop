import { useEffect, useRef, useState } from 'react';
import { useSeoMeta } from '@unhead/react';

/**
 * TriBe — the black and white TriBe brand page with a USB device flasher,
 * shown inline under the site Layout so the bitpopart.com menu and footer
 * stay visible, like /zapper.
 *
 * The page is a self-contained static file shipped at /tribe-app/index.html
 * (see public/tribe-app/; esptool-js is bundled inline). It runs in a
 * same-origin, auto-height iframe. allow="serial" lets the Web Serial API
 * work inside the iframe so "Connect" can flash a device over USB
 * (Chrome/Edge on a computer).
 */
export default function Tribe() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(700);

  useSeoMeta({
    title: 'TriBe | BitPopArt',
    description:
      'TriBe is a black and white pop art brand about tribes and signs. Meet the signs, see the devices and connect yours over USB.',
    ogTitle: 'TriBe | BitPopArt',
    ogDescription:
      'Signs for every tribe. Black and white pop art, and a USB flasher for TriBe devices.',
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
          (frame as HTMLIFrameElement & { __tribeRO?: ResizeObserver }).__tribeRO = ro;
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
      (frame as HTMLIFrameElement & { __tribeRO?: ResizeObserver }).__tribeRO?.disconnect();
    };
  }, []);

  // A fresh query string per visit skips the CDN's cached copy, so new firmware shows up at once.
  const [frameSrc] = useState(() => `/tribe-app/?t=${Date.now()}`);

  return (
    <div className="w-full" style={{ backgroundColor: '#efeeea' }}>
      <h1 className="sr-only">TriBe: signs for every tribe</h1>
      <iframe
        ref={frameRef}
        src={frameSrc}
        title="TriBe — signs for every tribe"
        allow="serial"
        className="w-full border-0 block"
        style={{ height }}
      />
    </div>
  );
}
