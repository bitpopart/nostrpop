import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Box } from 'lucide-react';

/**
 * Gallery — POP WORLD Virtual Gallery
 *
 * A full-screen Three.js walkable art gallery served from /gallery/index.html
 * (public/gallery/index.html). The iframe fills the entire space below the
 * navigation bar supplied by LayoutIframe.
 *
 * Uses BASE_URL so it works both on bitpopart.com (base = "/") and in the
 * Shakespeare preview environment.
 */

const BASE = import.meta.env.BASE_URL ?? '/';
const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
const GALLERY_SRC = `${base}/gallery/index.html`;

export default function Gallery() {
  const [loaded, setLoaded] = useState(false);

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
    <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
      {/* Loading screen — shown until the iframe fires onLoad */}
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a0040 0%, #0f172a 100%)',
            zIndex: 10,
            gap: '20px',
          }}
        >
          <div
            style={{
              padding: '20px',
              borderRadius: '20px',
              background: 'rgba(249,115,22,0.15)',
              border: '1px solid rgba(249,115,22,0.3)',
            }}
          >
            <Box style={{ width: 48, height: 48, color: '#f97316' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'Bangers, Impact, sans-serif',
                fontSize: '2.5rem',
                letterSpacing: '6px',
                color: '#f97316',
                lineHeight: 1,
              }}
            >
              POP WORLD
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: '6px' }}>
              Loading virtual gallery…
            </div>
          </div>
          {/* Animated progress bar */}
          <div
            style={{
              width: '180px',
              height: '4px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #f97316, #ec4899)',
                animation: 'gallery-load 2s ease-in-out infinite',
              }}
            />
          </div>
          <style>{`
            @keyframes gallery-load {
              0%   { width: 0%;   margin-left: 0; }
              50%  { width: 70%;  margin-left: 15%; }
              100% { width: 0%;   margin-left: 100%; }
            }
          `}</style>
        </div>
      )}

      <iframe
        src={GALLERY_SRC}
        title="POP WORLD Virtual Gallery"
        onLoad={() => setLoaded(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        allow="fullscreen"
      />
    </div>
  );
}
