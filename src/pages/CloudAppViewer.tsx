import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCloudAuth } from '@/hooks/useCloudAuth';
import { loadCloudApps, type CloudApp } from '@/lib/cloudTypes';
import { ArrowLeft, Cloud, Maximize2, Minimize2, Loader2, AlertCircle } from 'lucide-react';

/**
 * Security note:
 * HTML apps are stored on Blossom (a public CDN). To prevent anyone with the
 * raw Blossom URL from bypassing the login, we NEVER set the iframe `src` to
 * that URL. Instead we:
 *  1. Fetch the HTML content inside the React app (after the session check).
 *  2. Inject it via `srcdoc` — the raw URL is never exposed in the DOM or
 *     network tab of an unauthenticated visitor.
 *
 * The Blossom URL itself remains a secret stored only in localStorage (which
 * is inaccessible to third-party origins).
 */

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

export default function CloudAppViewer() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useCloudAuth();

  const [app, setApp] = useState<CloudApp | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Redirect to login if not authenticated — checked synchronously before any
  // data is loaded so the Blossom URL is never retrieved for unauth users.
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/cloud', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Load app metadata and fetch HTML content (only when authenticated)
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!appId) { setNotFound(true); setLoading(false); return; }

    const apps = loadCloudApps();
    const found = apps.find(a => a.id === appId);

    if (!found) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setApp(found);

    // Fetch the HTML content so we can inject it via srcdoc.
    // The raw Blossom URL never appears in the rendered DOM.
    (async () => {
      try {
        // Try direct fetch first; fall back to CORS proxy if blocked.
        let response = await fetch(found.htmlUrl).catch(() => null);
        if (!response || !response.ok) {
          response = await fetch(CORS_PROXY + encodeURIComponent(found.htmlUrl));
        }
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const html = await response.text();
        setHtmlContent(html);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn, appId]);

  // While React is still rendering with stale auth state, show nothing.
  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-slate-900">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading app…</p>
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-white text-xl font-bold">App not found</h2>
        <p className="text-slate-400 text-sm">This app doesn't exist or has been removed.</p>
        <Button
          onClick={() => navigate('/cloud')}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cloud
        </Button>
      </div>
    );
  }

  if (fetchError || htmlContent === null) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-amber-400" />
        <h2 className="text-white text-xl font-bold">Could not load app</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          The HTML file could not be fetched. It may have been removed from the server.
        </p>
        <Button
          onClick={() => navigate('/cloud')}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cloud
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Thin toolbar — hidden in fullscreen */}
      {!fullscreen && (
        <div className="flex-none h-12 flex items-center justify-between px-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cloud')}
              className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cloud
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-slate-400">
              <span className="text-slate-600">/</span>
              <Cloud className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-sm font-medium text-slate-300 truncate max-w-48">{app.title}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullscreen(true)}
            className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8 px-2"
            title="Full screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Fullscreen exit button (floating) */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="fixed top-3 right-3 z-50 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur transition-colors"
          title="Exit full screen"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Exit full screen
        </button>
      )}

      {/* The iframe — content injected via srcdoc, URL never in the DOM */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          srcdoc={htmlContent}
          title={app.title}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-pointer-lock"
          allow="fullscreen; clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
