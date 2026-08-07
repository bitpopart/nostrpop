import { useSeoMeta } from '@unhead/react';

/**
 * Gallery — POP WORLD Virtual Gallery
 *
 * A full-screen Three.js walkable art gallery served from /gallery/index.html
 * (public/gallery/index.html). The iframe fills the entire space below the
 * navigation bar supplied by LayoutIframe.
 *
 * Uses BASE_URL so it works both on bitpopart.com (base = "/") and in the
 * Shakespeare preview environment (base = "/preview/nostrpop/").
 */

const BASE = import.meta.env.BASE_URL ?? '/';

export default function Gallery() {
  useSeoMeta({
    title: 'POP WORLD Virtual Gallery — BitPopArt',
    description:
      'Walk through the POP WORLD virtual gallery. Explore 21 frames of Bitcoin pop art on the walls and 15 tiles on the floor. An immersive 3D experience by BitPopArt.',
    ogTitle: 'POP WORLD Virtual Gallery — BitPopArt',
    ogDescription:
      'Walk through the POP WORLD virtual gallery. Explore Bitcoin pop art in an immersive 3D walkable experience.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogUrl: 'https://bitpopart.com/gallery',
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
  });

  // Strip trailing slash from base, then append path
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const src = `${base}/gallery/index.html`;

  return (
    <iframe
      src={src}
      title="POP WORLD Virtual Gallery"
      style={{ flex: 1, width: '100%', height: '100%', border: 'none', display: 'block' }}
      allow="fullscreen"
    />
  );
}
