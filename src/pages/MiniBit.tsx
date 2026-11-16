import { useEffect } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { BotSwitch } from '@/components/BotSwitch';
import html from './minibit.html?raw';
import './minibit.css';

declare global {
  interface Window {
    __minibitViewer?: () => () => void;
  }
}

const VIEWER_SRC = '/bitbot/minibit/viewer.js';

/**
 * MiniBit page — bitpopart.com/bitbot/minibit.
 *
 * Static markup (minibit.html), styles scoped to `.mbp` (minibit.css), images
 * and the live 3D viewer script in public/bitbot/minibit/.
 */
export default function MiniBit() {
  const navigate = useNavigate();

  useSeoMeta({
    title: 'MiniBit — BitBot series | BitPopArt',
    description:
      'MiniBit is the pocket-size black block with a face. A 5.2 cm bot with a 4.6 cm AMOLED screen, part of the BitBot series: similar apps as BitBot, only simpler.',
    ogTitle: 'MiniBit — BitBot series',
    ogDescription: 'A pocket-size black block with a face. Clip it to your keys or your powerbank.',
    ogImage: 'https://bitpopart.com/bitbot/minibit/render-face.webp',
  });

  // Start the live 3D viewer once the markup is in the page.
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    const start = () => {
      if (cancelled || !window.__minibitViewer) return;
      stop = window.__minibitViewer();
    };
    if (window.__minibitViewer) {
      start();
    } else {
      const s = document.createElement('script');
      s.src = VIEWER_SRC;
      s.async = true;
      s.onload = start;
      document.body.appendChild(s);
    }
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-nav]');
    if (a) {
      e.preventDefault();
      navigate(a.getAttribute('href') ?? '/bitbot');
    }
  };

  // The markup is our own static file, bundled at build time (not user input).
  return (
    <>
      <BotSwitch active="minibit" />
      <div className="mbp" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
