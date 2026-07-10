import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCloudAuth } from '@/hooks/useCloudAuth';
import { loadCloudApps, loadCloudAppHtml, type CloudApp } from '@/lib/cloudTypes';
import { ArrowLeft, Cloud, Maximize2, Minimize2, Loader2, AlertCircle } from 'lucide-react';

/**
 * SECURITY MODEL:
 * HTML content is loaded exclusively from localStorage — there is no public
 * URL to guess or share. An unauthenticated visitor has no way to access the
 * content because:
 *  1. The session check redirects them to /cloud login immediately.
 *  2. Even if they bypassed the React router, the HTML lives only in
 *     localStorage which is inaccessible to other origins.
 *  3. The iframe uses `srcdoc` — no `src` URL ever appears in the DOM.
 */

export default function CloudAppViewer() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useCloudAuth();

  const [app, setApp] = useState<CloudApp | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Hard redirect if not authenticated — runs before any data is touched
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/cloud', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Load app + HTML from localStorage (only when authenticated)
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!appId) { setNotFound(true); return; }

    const apps = loadCloudApps();
    const found = apps.find(a => a.id === appId);
    if (!found) { setNotFound(true); return; }

    const html = loadCloudAppHtml(appId);
    if (!html) { setNotFound(true); return; }

    setApp(found);
    setHtmlContent(html);
  }, [isLoggedIn, appId]);

  // Render nothing while React still reconciles auth state
  if (!isLoggedIn) return null;

  if (notFound || (!app && htmlContent === null)) {
    // Only show "not found" once we've confirmed auth and attempted the load
    if (app === null && htmlContent === null && !notFound) {
      // Still loading
      return (
        <div className="h-screen flex items-center justify-center bg-slate-900">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        </div>
      );
    }
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h2 className="text-white text-xl font-bold">App not found</h2>
        <p className="text-slate-400 text-sm">
          This app doesn't exist or its HTML was cleared from browser storage.
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

  if (!app || !htmlContent) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
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

      {/* iframe — content via srcdoc only, no public URL ever in the DOM */}
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
