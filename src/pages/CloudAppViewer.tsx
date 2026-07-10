import { useEffect, useState } from 'react';
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
 * SECURITY MODEL — AES-256-GCM + Blossom:
 *
 * 1. The `encryptedUrl` on the CDN contains only AES-256-GCM ciphertext.
 *    Fetching it without the master key gives you random bytes — useless.
 * 2. The master key lives only in localStorage on the admin's browser.
 *    It is never transmitted to the CDN, Nostr, or any other server.
 * 3. Decryption happens entirely in-memory using the Web Crypto API.
 * 4. The plaintext HTML is injected via `srcdoc` — no plain URL in the DOM.
 * 5. A local plaintext cache (also in localStorage) is used first for instant
 *    load; the encrypted remote copy is the cross-browser source of truth.
 *
 * Attack vectors defeated:
 *  - Knowing the CDN URL → useless without the key (just ciphertext)
 *  - Inspecting the DOM → `srcdoc` is set in JS, no public URL ever written
 *  - Unauthenticated visit → redirect to /cloud login before any data loaded
 */

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

type LoadState = 'loading' | 'ready' | 'error-not-found' | 'error-decrypt' | 'error-fetch';

export default function CloudAppViewer() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useCloudAuth();

  const [app, setApp] = useState<CloudApp | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [fullscreen, setFullscreen] = useState(false);

  // Hard redirect before any data is touched
  useEffect(() => {
    if (!isLoggedIn) navigate('/cloud', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !appId) return;

    const apps = loadCloudApps();
    const found = apps.find(a => a.id === appId);
    if (!found) { setLoadState('error-not-found'); return; }
    setApp(found);

    (async () => {
      // ── 1. Try local cache first (instant, no network) ──────────────────
      const cached = loadCachedCloudAppHtml(appId);
      if (cached) {
        setHtmlContent(cached);
        setLoadState('ready');
        return;
      }

      // ── 2. Fetch encrypted blob from CDN ─────────────────────────────────
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

        // ── 3. Decrypt in-memory ───────────────────────────────────────────
        let plaintext: string;
        try {
          plaintext = await decryptBytes(new Uint8Array(buf));
        } catch {
          setLoadState('error-decrypt');
          return;
        }

        // ── 4. Cache locally for next time ────────────────────────────────
        cacheCloudAppHtml(appId, plaintext);

        setHtmlContent(plaintext);
        setLoadState('ready');
      } catch {
        setLoadState('error-fetch');
      }
    })();
  }, [isLoggedIn, appId]);

  if (!isLoggedIn) return null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-slate-900">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-purple-400 animate-pulse" />
          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Fetching &amp; decrypting…</p>
      </div>
    );
  }

  // ── Error states ─────────────────────────────────────────────────────────────
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
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 gap-4 text-center px-6 max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-white text-xl font-bold">{title}</h2>
        <p className="text-slate-400 text-sm">{body}</p>
        <Button onClick={() => navigate('/cloud')} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cloud
        </Button>
      </div>
    );
  }

  // ── App viewer ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Toolbar */}
      {!fullscreen && (
        <div className="flex-none h-12 flex items-center justify-between px-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/cloud')} className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8 px-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Cloud
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">/</span>
              <Cloud className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-sm font-medium text-slate-300 truncate max-w-48">{app?.title}</span>
              <Lock className="h-3 w-3 text-green-400" title="AES-256-GCM encrypted" />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFullscreen(true)} className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8 px-2" title="Full screen">
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

      {/* iframe — srcdoc only, no public URL ever in the DOM */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          srcdoc={htmlContent!}
          title={app?.title}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock"
          allow="fullscreen; clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
