import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { nip19 } from 'nostr-tools';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

const htmlCache = new Map<string, string>();

const FILE_RE = /\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|gif|svg|webp|exe|dmg|apk)(\?|$)/i;

/**
 * Intercepts ALL anchor clicks in the iframe:
 * - Download links  → postMessage __download__
 * - Internal links  → postMessage __navigate__ (React Router, no double header)
 * - External links  → open in new tab
 */
function injectLinkBridge(html: string): string {
  const script = `<script id="__frl_bridge__">
(function(){
  var FILE_RE = /\\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|gif|svg|webp|exe|dmg|apk)(\\?|$)/i;
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href === '#') return;
    var hasDownload = a.hasAttribute('download');
    if (hasDownload || FILE_RE.test(href)) {
      e.preventDefault(); e.stopImmediatePropagation();
      window.parent.postMessage({
        type: '__download__',
        url: href,
        filename: a.getAttribute('download') || href.split('/').pop() || 'download'
      }, '*');
      return;
    }
    if (/^https?:\\/\\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    window.parent.postMessage({ type: '__navigate__', path: href }, '*');
  }, true);
})();
</script>`;

  if (html.includes('</head>')) return html.replace('</head>', script + '</head>');
  if (html.includes('<body')) return html.replace('<body', script + '<body');
  return script + html;
}

export default function FrlProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();

  const { data: project, isLoading } = useQuery({
    queryKey: ['frl-project', projectId],
    queryFn: async (c) => {
      if (!projectId) return null;
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{
          kinds: [36171],
          authors: [ADMIN_PUBKEY],
          '#d': [projectId],
          '#t': ['bitpopart-project'],
          limit: 1,
        }],
        { signal }
      );
      return events[0] ?? null;
    },
    enabled: !!projectId,
  });

  const brandSiteUrl = project?.tags.find(t => t[0] === 'brand-site')?.[1];
  const projectName = project?.tags.find(t => t[0] === 'name')?.[1] ?? 'Project';

  const [fetchedHtml, setFetchedHtml] = useState<string | null>(
    () => (brandSiteUrl ? htmlCache.get(brandSiteUrl) ?? null : null)
  );
  const [fetchingHtml, setFetchingHtml] = useState(false);
  const fetchingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!brandSiteUrl) return;
    if (htmlCache.has(brandSiteUrl)) { setFetchedHtml(htmlCache.get(brandSiteUrl)!); return; }
    if (fetchingUrlRef.current === brandSiteUrl) return;
    fetchingUrlRef.current = brandSiteUrl;
    setFetchingHtml(true);
    fetch(brandSiteUrl)
      .then(r => r.text())
      .then(html => { htmlCache.set(brandSiteUrl, html); setFetchedHtml(html); setFetchingHtml(false); })
      .catch(() => setFetchingHtml(false));
  }, [brandSiteUrl]);

  // Message bridge
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (!e.data) return;

      if (e.data.type === '__navigate__') {
        const path = e.data.path as string;
        if (path) navigate(path);
        return;
      }

      if (e.data.type === '__download__') {
        const { url, filename } = e.data as { type: string; url: string; filename: string };
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename || url.split('/').pop() || 'download';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        } catch {
          window.open(url, '_blank');
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigate]);

  useSeoMeta({
    title: project ? `${projectName} - POPArt.frl` : 'POPArt.frl Project',
    description: project ? (() => { try { return JSON.parse(project.content).description || ''; } catch { return ''; } })() : '',
  });

  if (isLoading || (fetchingHtml && !fetchedHtml)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-[60vh] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project || !brandSiteUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Project not found.</p>
          <Button variant="outline" onClick={() => navigate('/frl')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to POPArt.frl
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {fetchedHtml ? (
        <iframe
          srcDoc={injectLinkBridge(fetchedHtml)}
          title={projectName}
          className="w-full flex-1 border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        />
      ) : (
        <iframe
          src={brandSiteUrl}
          title={projectName}
          className="w-full flex-1 border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        />
      )}
    </div>
  );
}
