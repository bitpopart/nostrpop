import { useEffect } from 'react';
import { Box } from 'lucide-react';

/**
 * Gallery — POP WORLD Virtual Gallery
 *
 * The gallery is a fully self-contained Three.js HTML app. Rather than
 * embedding it in an iframe (which has sizing and CSP complications), we
 * do a hard redirect to the static file so it runs at full power in its
 * own browsing context — then the browser back-button returns to the site.
 */

const BASE = import.meta.env.BASE_URL ?? '/';
const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
const GALLERY_URL = `${base}/gallery/index.html`;

export default function Gallery() {
  useEffect(() => {
    // Replace the current history entry so Back goes to wherever the user
    // came from (e.g. /art), not back to this redirect page.
    window.location.replace(GALLERY_URL);
  }, []);

  // Show a branded splash while the redirect happens
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0040 0%, #0f172a 100%)',
      gap: 20,
    }}>
      <style>{`
        @keyframes gallery-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>

      <div style={{
        padding: 20,
        borderRadius: 20,
        background: 'rgba(249,115,22,0.15)',
        border: '1px solid rgba(249,115,22,0.3)',
      }}>
        <Box style={{ width: 48, height: 48, color: '#f97316' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'Bangers, Impact, sans-serif',
          fontSize: '2.5rem',
          letterSpacing: 6,
          color: '#f97316',
          lineHeight: 1,
        }}>
          POP WORLD
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginTop: 6 }}>
          Entering virtual gallery…
        </div>
      </div>

      <div style={{
        width: 180,
        height: 4,
        borderRadius: 9999,
        background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          width: '45%',
          borderRadius: 9999,
          background: 'linear-gradient(90deg, #f97316, #ec4899)',
          animation: 'gallery-shimmer 1.4s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
}
