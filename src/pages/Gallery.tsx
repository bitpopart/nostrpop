import { useSeoMeta } from '@unhead/react';

/**
 * Gallery — POP WORLD Virtual Gallery
 *
 * A full-screen Three.js walkable art gallery served from /gallery/index.html
 * (public/gallery/index.html). The iframe fills the entire viewport below the
 * navigation bar.
 */
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

  return (
    <div className="flex-1 flex flex-col w-full" style={{ minHeight: 0 }}>
      <iframe
        src="/gallery/index.html"
        title="POP WORLD Virtual Gallery"
        className="w-full flex-1 border-0"
        allow="fullscreen"
        style={{ display: 'block' }}
      />
    </div>
  );
}
