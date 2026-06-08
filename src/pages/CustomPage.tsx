import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { usePage } from '@/hooks/usePages';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ZapButton } from '@/components/ZapButton';
import { MediaShowcaseBlock } from '@/components/pages/MediaShowcaseBlock';
import type { MediaShowcaseType } from '@/components/pages/MediaShowcaseBlock';
import { ArrowLeft, ExternalLink, Globe, Image as ImageIcon, Coffee } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Admin pubkey (page author for Zap recipient)
const ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

// Module-level HTML cache — persists across re-renders and same-session navigation
const htmlCache = new Map<string, string>();

const FILE_RE = /\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mp3|png|jpe?g|gif|svg|webp|exe|dmg|apk)(\?|$)/i;

// Rewrites all download/file links in raw HTML before rendering as srcDoc.
// Replaces the real href with "#" and stores the URL in data-dl so the browser
// never navigates away. A small inline script handles the click via postMessage.
function injectDownloadScript(html: string): string {
  // Step 1 — rewrite <a href="...file" ...> or <a ... download ...> so href="#"
  // and stash the real URL in data-dl="..."
  const rewritten = html.replace(
    /<a\s([^>]*)>/gi,
    (match, attrs: string) => {
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) return match;
      const href = hrefMatch[1];
      const hasDownload = /\bdownload\b/i.test(attrs);
      if (!hasDownload && !FILE_RE.test(href)) return match;
      // Replace href with "#", add data-dl with real URL
      const newAttrs = attrs
        .replace(/href=["'][^"']*["']/i, `href="#"`)
        .replace(/\btarget=["'][^"']*["']/i, ''); // remove any target
      return `<a ${newAttrs} data-dl="${href}">`;
    }
  );

  // Step 2 — inject a tiny script that listens for clicks on [data-dl] and
  // posts the URL to the parent, which fetches it as a blob
  const script = `<script>
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('[data-dl]'):null;
  if(!a)return;
  e.preventDefault();e.stopImmediatePropagation();
  window.parent.postMessage({type:'__download__',url:a.getAttribute('data-dl'),filename:a.getAttribute('download')||a.getAttribute('data-dl').split('/').pop()||'download'},'*');
},true);
</script>`;

  if (rewritten.includes('</head>')) return rewritten.replace('</head>', script + '</head>');
  if (rewritten.includes('<body')) return rewritten.replace('<body', script + '<body');
  return script + rewritten;
}

// Content block types
interface ContentBlock {
  id: string;
  type: 'markdown' | 'gallery' | 'media';
  content: string;
  images: string[];
  externalUrl?: string;
  mediaType?: MediaShowcaseType;
  selectedMediaIds?: string[];
}

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading } = usePage(slug || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Detect remote HTML page (Blossom URL)
  const isRemoteHtml = !!(
    page?.brand_site &&
    !page.brand_site_is_srcdoc &&
    /\.html?(\?|$)/i.test(page.brand_site)
  );

  // HTML fetch state — initialise from cache immediately for instant repeat visits
  const [fetchedHtml, setFetchedHtml] = useState<string | null>(
    () => (page?.brand_site ? htmlCache.get(page.brand_site) ?? null : null)
  );
  const [fetchingHtml, setFetchingHtml] = useState(false);
  const fetchingUrlRef = useRef<string | null>(null);

  // Fetch HTML from Blossom URL when needed
  useEffect(() => {
    if (!isRemoteHtml || !page?.brand_site) return;
    const url = page.brand_site;
    if (htmlCache.has(url)) { setFetchedHtml(htmlCache.get(url)!); return; }
    if (fetchingUrlRef.current === url) return;
    fetchingUrlRef.current = url;
    setFetchingHtml(true);
    fetch(url)
      .then(r => r.text())
      .then(html => { htmlCache.set(url, html); setFetchedHtml(html); setFetchingHtml(false); })
      .catch(() => setFetchingHtml(false));
  }, [page?.brand_site, isRemoteHtml]);

  // Listen for download requests posted from inside the iframe.
  // The iframe posts { type: '__download__', url, filename } — we fetch it
  // as a blob and trigger a real download without any page navigation.
  useEffect(() => {
    const handler = async (e: MessageEvent) => {
      if (!e.data || e.data.type !== '__download__') return;
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
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useSeoMeta({
    title: page ? `${page.title} - BitPopArt` : 'Page',
    description: page?.description || '',
  });

  // ── All hooks above this line ──────────────────────────────────────────────

  const getContentBlocks = (): ContentBlock[] => {
    if (!page) return [];
    try {
      const parsed = JSON.parse(page.description);
      if (parsed.blocks && Array.isArray(parsed.blocks)) return parsed.blocks;
    } catch { /* fall through */ }
    return [{ id: '1', type: 'markdown', content: page.description, images: page.gallery_images || [] }];
  };

  if (isLoading || (isRemoteHtml && fetchingHtml && !fetchedHtml)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
              <p className="text-muted-foreground mb-6">This page doesn't exist or has been removed.</p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const contentBlocks = getContentBlocks();

  // Floating corner buttons
  const floatingButtons = (page.show_zap_button || page.buy_me_coffee_url) ? (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {page.buy_me_coffee_url && (
        <a href={page.buy_me_coffee_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
        >
          <Coffee className="h-4 w-4 flex-shrink-0" /><span>Buy Me a Coffee</span>
        </a>
      )}
      {page.show_zap_button && (
        <ZapButton authorPubkey={ADMIN_PUBKEY} eventTitle={page.title}
          variant="default" size="default" showLabel={true} alwaysShow={true}
          className="rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 px-5"
        />
      )}
    </div>
  ) : null;

  // Build the srcDoc string for HTML pages (legacy inline or fetched from Blossom)
  const htmlSrcDoc: string | undefined =
    page.brand_site_is_srcdoc ? (page.brand_site ?? undefined) :
    isRemoteHtml ? (fetchedHtml ?? undefined) :
    undefined;

  // Render iframe — always uses srcDoc (with injected download bridge) for HTML pages
  const renderBrandSiteIframe = (className = 'flex-1 w-full border-0') => {
    if (htmlSrcDoc) {
      return (
        <iframe
          srcDoc={injectDownloadScript(htmlSrcDoc)}
          title={page.title}
          className={className}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        />
      );
    }
    // Plain external website URL (not an HTML file)
    return (
      <iframe
        src={page.brand_site}
        title={page.title}
        className={className}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
      />
    );
  };

  // Full-screen inline mode — HTML fills everything below the header menu
  if (page.brand_site && page.brand_site_inline) {
    return (
      <div style={{ height: 'calc(100vh - 64px)' }}>
        {renderBrandSiteIframe('w-full h-full border-0')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Image */}
          {page.header_image && (
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img src={page.header_image} alt={page.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{page.title}</h1>
              </div>
            </div>
          )}

          {/* Title (no header image) */}
          {!page.header_image && (
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold gradient-header-text mb-4">{page.title}</h1>
              <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
                {page.brand_site && !page.brand_site_is_srcdoc && !page.brand_site_inline && (
                  <Button size="sm" asChild>
                    <a href={page.brand_site} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" /> View Page Site
                    </a>
                  </Button>
                )}
                {page.external_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={page.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Visit External Site
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Embedded brand site (non-fullscreen) */}
          {page.brand_site && !page.brand_site_inline && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {renderBrandSiteIframe('w-full border-0 min-h-[600px]')}
              </CardContent>
            </Card>
          )}

          {/* Content Blocks */}
          {contentBlocks.map((block) => (
            <div key={block.id}>
              {block.type === 'markdown' && block.content.trim() && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <ReactMarkdown>{block.content}</ReactMarkdown>
                    </div>
                    {block.externalUrl && (
                      <div className="flex justify-center pt-4 border-t">
                        <Button variant="outline" size="sm" asChild>
                          <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" /> Related Link
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {block.type === 'media' && block.mediaType && (
                <Card>
                  <CardContent className="pt-6">
                    <MediaShowcaseBlock mediaType={block.mediaType} selectedIds={block.selectedMediaIds ?? []} />
                  </CardContent>
                </Card>
              )}

              {block.type === 'gallery' && block.images.length > 0 && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {block.images.length === 1 ? (
                      <div className="relative w-full overflow-hidden rounded-lg cursor-pointer group"
                        onClick={() => setSelectedImage(block.images[0])}>
                        <img src={block.images[0]} alt="Image"
                          className="w-full h-auto object-contain group-hover:opacity-90 transition-opacity duration-300" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {block.images.map((imgUrl, index) => (
                          <div key={index}
                            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                            onClick={() => setSelectedImage(imgUrl)}>
                            <img src={imgUrl} alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {block.externalUrl && (
                      <div className="flex justify-center pt-4 border-t">
                        <Button variant="outline" size="sm" asChild>
                          <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" /> Related Link
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ))}

          {/* Page Site / External URL Buttons (when there's a header image) */}
          {page.header_image && (page.external_url || (page.brand_site && !page.brand_site_is_srcdoc)) && (
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="py-6 flex items-center justify-center gap-3 flex-wrap">
                {page.brand_site && !page.brand_site_is_srcdoc && (
                  <Button size="lg" onClick={() => window.open(page.brand_site, '_blank')}>
                    <Globe className="h-4 w-4 mr-2" /> View Page Site
                  </Button>
                )}
                {page.external_url && (
                  <Button size="lg" variant="outline" onClick={() => window.open(page.external_url, '_blank')}>
                    Visit External Link <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {floatingButtons}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && <img src={selectedImage} alt="Gallery" className="w-full h-auto" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
