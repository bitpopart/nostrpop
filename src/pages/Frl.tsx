import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta } from '@unhead/react';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryProjectsPage } from '@/components/projects/CategoryProjectsPage';
import { Globe, Sparkles } from 'lucide-react';
import { nip19 } from 'nostr-tools';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

const htmlCache = new Map<string, string>();

const FILE_RE = /\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|gif|svg|webp|exe|dmg|apk)(\?|$)/i;

/**
 * Injects a script into the HTML that intercepts ALL anchor clicks:
 * - Download links  → postMessage __download__ (parent fetches as blob)
 * - Internal links  → postMessage __navigate__  (parent uses React Router)
 * - External links  → open in new tab (no parent involvement)
 * This way the iframe never navigates the top-level window itself,
 * so the site header only appears once.
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
    // Download link or file extension → blob download via parent
    if (hasDownload || FILE_RE.test(href)) {
      e.preventDefault(); e.stopImmediatePropagation();
      window.parent.postMessage({
        type: '__download__',
        url: href,
        filename: a.getAttribute('download') || href.split('/').pop() || 'download'
      }, '*');
      return;
    }
    // External link → open in new tab, let default behaviour run (parent unaffected)
    if (/^https?:\\/\\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      return;
    }
    // Internal / relative link → navigate parent via React Router (no full reload, no double header)
    e.preventDefault(); e.stopImmediatePropagation();
    window.parent.postMessage({ type: '__navigate__', path: href }, '*');
  }, true);
})();
</script>`;

  if (html.includes('</head>')) return html.replace('</head>', script + '</head>');
  if (html.includes('<body')) return html.replace('<body', script + '<body');
  return script + html;
}

export default function Frl() {
  const { nostr } = useNostr();
  const navigate = useNavigate();

  useSeoMeta({
    title: 'POPArt.frl - BitPopArt | Creative Pop Art Projects',
    description: 'Explore creative pop art projects on POPArt.frl by BitPopArt.',
    ogTitle: 'POPArt.frl - BitPopArt | Creative Pop Art Projects',
    ogDescription: 'Explore creative pop art projects on POPArt.frl by BitPopArt.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    ogSiteName: 'BitPopArt',
    ogUrl: 'https://bitpopart.com/frl',
    twitterCard: 'summary_large_image',
    twitterTitle: 'POPArt.frl - BitPopArt | Creative Pop Art Projects',
    twitterDescription: 'Explore creative pop art projects on POPArt.frl by BitPopArt.',
    twitterImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow',
  });

  // Fetch all frl-category projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['frl-projects-page'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const [events, deletionEvents] = await Promise.all([
        nostr.query(
          [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['bitpopart-project'], limit: 50 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [ADMIN_PUBKEY], limit: 200 }],
          { signal }
        ),
      ]);
      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(e => {
        e.tags.forEach(tag => {
          if (tag[0] === 'a') deletedAddresses.add(tag[1]);
          if (tag[0] === 'e') deletedAddresses.add(tag[1]);
        });
      });
      return events.filter(event => {
        const dTag = event.tags.find(t => t[0] === 'd')?.[1];
        const address = `36171:${event.pubkey}:${dTag}`;
        const category = event.tags.find(t => t[0] === 'category')?.[1];
        return (
          category === 'frl' &&
          !deletedAddresses.has(address) &&
          !deletedAddresses.has(event.id)
        );
      });
    },
  });

  // Find the single inline HTML project
  const inlineProject = projects.find(e =>
    e.tags.find(t => t[0] === 'brand-site-inline')?.[1] === 'true' ||
    e.tags.find(t => t[0] === 'frl-inline')?.[1] === 'true'
  );
  const brandSiteUrl = inlineProject?.tags.find(t => t[0] === 'brand-site')?.[1];
  const projectName = inlineProject?.tags.find(t => t[0] === 'name')?.[1] ?? 'POPArt.frl';

  // HTML fetch
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

  // Message bridge: handle __download__ and __navigate__ from the iframe
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (!e.data) return;

      // Internal navigation — use React Router, no page reload, no double header
      if (e.data.type === '__navigate__') {
        const path = e.data.path as string;
        if (path) navigate(path);
        return;
      }

      // File download
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

  // ── Loading ──────────────────────────────────────────────
  if (isLoading || (brandSiteUrl && fetchingHtml && !fetchedHtml)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-pink-900/20 dark:to-orange-900/20">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-[70vh] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Single inline HTML project → render fullscreen ───────
  if (inlineProject && brandSiteUrl) {
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

  // ── Multiple projects or no inline project → show listing ─
  return (
    <CategoryProjectsPage
      category="frl"
      title="POPArt.frl"
      subtitle="Creative pop art projects on POPArt.frl"
      icon={<Globe className="h-12 w-12 text-pink-600" />}
      gradient="from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-pink-900/20 dark:to-orange-900/20"
      emptyIcon={
        <div className="relative inline-flex">
          <Globe className="h-20 w-20 text-pink-400" />
          <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
      }
      emptyText="POPArt.frl projects are coming soon! Stay tuned."
    />
  );
}
