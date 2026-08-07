import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Box } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/**
 * Gallery — POP WORLD Virtual Gallery
 *
 * Fetches the gallery HTML then renders it via iframe srcdoc so it always
 * stays embedded under the site navigation bar. Using srcdoc avoids any
 * GitHub Pages MIME-type / SPA-redirect issues with the static file URL.
 *
 * The ADMIN button is hidden from the public HTML and only injected
 * back in when the logged-in user is the BitPopArt admin.
 */

const BASE = import.meta.env.BASE_URL ?? '/';
const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
// Use /gallery-src/ (not /gallery/) to avoid GitHub Pages serving the static
// file directly when someone navigates to /gallery — that would bypass React
// and show the raw Three.js app without the site nav bar.
const GALLERY_SRC = `${base}/gallery-src/index.html`;

export default function Gallery() {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const isAdmin = useIsAdmin();

  useSeoMeta({
    title: 'POP WORLD Virtual Gallery — BitPopArt',
    description: 'Walk through the POP WORLD virtual gallery. Explore 21 frames of Bitcoin pop art on the walls and 15 tiles on the floor.',
    ogTitle: 'POP WORLD Virtual Gallery — BitPopArt',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogUrl: 'https://bitpopart.com/gallery',
    twitterCard: 'summary_large_image',
    robots: 'index, follow',
  });

  useEffect(() => {
    fetch(GALLERY_SRC)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(setHtml)
      .catch(() => setError(true));
  }, []);

  /**
   * When the admin is logged in, show the ADMIN button inside the gallery
   * by injecting a small inline script that fully restores #adminBtn.
   * The button is hidden with multiple CSS properties, so we clear them all.
   */
  const galleryHtml = html
    ? isAdmin
      ? html.replace(
          '</body>',
          `<script>
(function(){
  var btn = document.getElementById('adminBtn');
  if(btn){
    btn.style.display = 'inline-block';
    btn.style.visibility = 'visible';
    btn.style.pointerEvents = 'auto';
    btn.style.position = 'static';
    btn.style.left = 'auto';
  }
})();
</script>
</body>`
        )
      : html
    : null;

  // Loading splash
  if (!galleryHtml && !error) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a0040 0%, #0f172a 100%)',
        gap: 20,
      }}>
        <style>{`
          @keyframes gshimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        `}</style>
        <div style={{ padding: 20, borderRadius: 20, background: 'rgba(249,115,22,.15)', border: '1px solid rgba(249,115,22,.3)' }}>
          <Box style={{ width: 48, height: 48, color: '#f97316' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Bangers,Impact,sans-serif', fontSize: '2.5rem', letterSpacing: 6, color: '#f97316', lineHeight: 1 }}>
            POP WORLD
          </div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', marginTop: 6 }}>
            Loading virtual gallery…
          </div>
        </div>
        <div style={{ width: 180, height: 4, borderRadius: 9999, background: 'rgba(255,255,255,.1)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '45%', borderRadius: 9999, background: 'linear-gradient(90deg,#f97316,#ec4899)', animation: 'gshimmer 1.4s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  // Error fallback
  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', color: '#f97316' }}>
          <Box style={{ width: 40, height: 40, margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'Bangers,Impact,sans-serif', fontSize: '1.5rem', letterSpacing: 3 }}>POP WORLD</p>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.85rem', marginTop: 6 }}>Could not load gallery.</p>
          <button
            onClick={() => { setError(false); fetch(GALLERY_SRC).then(r => r.text()).then(setHtml).catch(() => setError(true)); }}
            style={{ marginTop: 16, padding: '8px 20px', borderRadius: 9999, background: '#f97316', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={galleryHtml!}
      title="POP WORLD Virtual Gallery"
      style={{ flex: 1, width: '100%', height: '100%', border: 'none', display: 'block', minHeight: 0 }}
      sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen"
    />
  );
}
