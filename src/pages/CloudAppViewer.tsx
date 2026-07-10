import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCloudAuth } from '@/hooks/useCloudAuth';
import {
  loadCloudApps,
  loadCachedCloudAppHtml,
  cacheCloudAppHtml,
  type CloudApp,
} from '@/lib/cloudTypes';
import { decryptBytes } from '@/lib/cloudCrypto';
import { ArrowLeft, Cloud, Maximize2, Minimize2, Loader2, AlertCircle, Lock } from 'lucide-react';

/**
 * SECURITY MODEL — AES-256-GCM + Blob URL:
 *
 * 1. Fetch the ciphertext blob from Blossom CDN (just random bytes to anyone).
 * 2. Decrypt in-memory with the AES-256-GCM master key (localStorage only).
 * 3. Create a temporary blob: URL from the plaintext → set as iframe src.
 *    - blob: URLs are random, session-scoped, and not accessible cross-origin.
 *    - The URL dies when the page is closed / the component unmounts.
 *    - No public URL ever appears in the DOM.
 * 4. Using blob: src (not srcdoc) gives the app a proper origin context so
 *    WebGL, Three.js, Web Audio, external CDN scripts, etc. all work correctly.
 *
 * Why NOT srcdoc:
 * - srcdoc iframes have no base URL → relative paths break.
 * - sandbox="allow-scripts allow-same-origin" is intentionally blocked by
 *   browsers when both flags are set together (security policy).
 * - Large HTML strings in srcdoc can cause browser freezes.
 */

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

type LoadState = 'loading' | 'ready' | 'error-not-found' | 'error-decrypt' | 'error-fetch';

export default function CloudAppViewer() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useCloudAuth();

  const [app, setApp] = useState<CloudApp | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [fullscreen, setFullscreen] = useState(false);

  // Keep track of created blob URLs so we can revoke them on unmount
  const blobUrlRef = useRef<string | null>(null);

  // Hard redirect before any data is touched
  useEffect(() => {
    if (!isLoggedIn) navigate('/cloud', { replace: true });
  }, [isLoggedIn, navigate]);

  // Revoke blob URL on unmount to free memory
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !appId) return;

    const apps = loadCloudApps();
    const found = apps.find(a => a.id === appId);
    if (!found) { setLoadState('error-not-found'); return; }
    setApp(found);

    (async () => {
      let html: string | null = null;

      // ── 1. Try local plaintext cache first (instant, no network) ──────────
      const cached = loadCachedCloudAppHtml(appId);
      if (cached) {
        html = cached;
      } else {
        // ── 2. Fetch encrypted blob from CDN ──────────────────────────────
        if (!found.encryptedUrl) {
          setLoadState('error-not-found');
          return;
        }

        try {
          let res = await fetch(found.encryptedUrl).catch(() => null);
          if (!res || !res.ok) {
            res = await fetch(CORS_PROXY + encodeURIComponent(found.encryptedUrl));
          }
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const buf = await res.arrayBuffer();

          // ── 3. Decrypt in-memory ─────────────────────────────────────────
          try {
            html = await decryptBytes(new Uint8Array(buf));
          } catch {
            setLoadState('error-decrypt');
            return;
          }

          // ── 4. Cache locally for next visit ──────────────────────────────
          cacheCloudAppHtml(appId, html);
        } catch {
          setLoadState('error-fetch');
          return;
        }
      }

      // ── 5. Create a blob: URL — works like a real page origin ─────────────
      // This gives the HTML full JS capabilities (WebGL, Three.js, Web Audio,
      // external CDN scripts, relative paths, etc.) without any sandbox issues.
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Revoke any previous blob URL
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;

      setBlobUrl(url);
      setLoadState('ready');
    })();
  }, [isLoggedIn, appId]);

  if (!isLoggedIn) return null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-slate-900">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-purple-400 animate-pulse" />
          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Decrypting &amp; loading…</p>
      </div>
    );
  }

  // ── Error states ───────────────────────────────────────────────────────────
  if (loadState !== 'ready') {
    const msgs: Record<string, { title: string; body: string }> = {
      'error-not-found': {
        title: 'App not found',
        body: 'This app doesn\'t exist or has been removed.',
      },
      'error-fetch': {
        title: 'Could not fetch encrypted file',
        body: 'The encrypted file could not be downloaded. Check your connection and try again.',
      },
      'error-decrypt': {
        title: 'Decryption failed',
        body: 'The master key in this browser does not match the one used to encrypt this app. Export the key from the original browser and import it here via Admin → Cloud → Encryption Key Management.',
      },
    };
    const { title, body } = msgs[loadState] ?? msgs['error-not-found'];
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 gap-4 text-center px-6">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-white text-xl font-bold">{title}</h2>
        <p className="text-slate-400 text-sm max-w-sm">{body}</p>
        <Button onClick={() => navigate('/cloud')} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cloud
        </Button>
      </div>
    );
  }

  // ── App viewer ─────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Toolbar */}
      {!fullscreen && (
        <div className="flex-none h-12 flex items-center justify-between px-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate('/cloud')}
              className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Cloud
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">/</span>
              <Cloud className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-sm font-medium text-slate-300 truncate max-w-48">{app?.title}</span>
              <Lock className="h-3 w-3 text-green-400" title="AES-256-GCM encrypted" />
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => setFullscreen(true)}
            className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8 px-2"
            title="Full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Fullscreen exit */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-3 right-3 z-50 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur transition-colors"
        >
          <Minimize2 className="h-3.5 w-3.5" /> Exit full screen
        </button>
      )}

      {/* iframe — blob: URL, full capabilities, no sandbox restrictions */}
      <div className="flex-1 relative overflow-hidden">
        {blobUrl && (
          <iframe
            src={blobUrl}
            title={app?.title}
            className="absolute inset-0 w-full h-full border-0"
            allow="fullscreen; clipboard-read; clipboard-write; web-share; accelerometer; gyroscope; camera; microphone"
          />
        )}
      </div>
    </div>
  );
}
