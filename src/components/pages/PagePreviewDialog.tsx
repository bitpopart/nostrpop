import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ZapButton } from '@/components/ZapButton';
import { MediaShowcaseBlock } from '@/components/pages/MediaShowcaseBlock';
import type { MediaShowcaseType } from '@/components/pages/MediaShowcaseBlock';
import type { PageData } from '@/lib/pageTypes';
import { ArrowLeft, ExternalLink, Globe, Image as ImageIcon, Coffee, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

interface ContentBlock {
  id: string;
  type: 'markdown' | 'gallery' | 'media';
  content: string;
  images: string[];
  externalUrl?: string;
  mediaType?: MediaShowcaseType;
  selectedMediaIds?: string[];
}

interface PagePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  page: PageData;
}

function getContentBlocks(page: PageData): ContentBlock[] {
  try {
    const parsed = JSON.parse(page.description);
    if (parsed.blocks && Array.isArray(parsed.blocks)) return parsed.blocks;
  } catch { /* legacy */ }
  return [{ id: '1', type: 'markdown', content: page.description, images: page.gallery_images || [] }];
}

export function PagePreviewDialog({ open, onClose, page }: PagePreviewDialogProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const contentBlocks = getContentBlocks(page);
  const pageUrl = `${window.location.origin}/${page.id}`;

  const renderBrandSiteIframe = (className = 'w-full border-0 min-h-[500px]') =>
    page.brand_site_is_srcdoc ? (
      <iframe
        srcDoc={page.brand_site}
        title={page.title}
        className={className}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    ) : (
      <iframe
        src={page.brand_site}
        title={page.title}
        className={className}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    );

  return (
    <>
      {/* Main preview dialog */}
      <Dialog open={open && !selectedImage} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden" style={{ maxHeight: '92vh' }}>

          {/* ── Header bar ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="outline" className="text-xs font-mono shrink-0">Preview</Badge>
              <span className="text-sm text-muted-foreground truncate">{pageUrl}</span>
            </div>
            <a
              href={`/${page.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 shrink-0"
              title="Open in new tab (only works after saving)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open page</span>
            </a>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* ── Scrollable page content ── */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 57px)' }}>

            {/* Inline full-page mode preview */}
            {page.brand_site && page.brand_site_inline ? (
              <div className="flex flex-col" style={{ minHeight: '600px' }}>
                <div className="flex items-center gap-3 px-4 py-2 bg-background/90 border-b shrink-0">
                  <Button variant="ghost" size="sm" disabled>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground truncate">{page.title}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {page.buy_me_coffee_url && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-400 text-yellow-900 font-semibold text-sm">
                        <Coffee className="h-4 w-4" />
                        <span className="hidden sm:inline">Buy Me a Coffee</span>
                      </span>
                    )}
                  </div>
                </div>
                {renderBrandSiteIframe('w-full border-0 flex-1')}
              </div>
            ) : (
              /* Normal page layout preview */
              <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 min-h-full">
                <div className="container mx-auto px-4 py-8">

                  {/* Back button (disabled in preview) */}
                  <Button variant="ghost" className="mb-6" disabled>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>

                  <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header image */}
                    {page.header_image && (
                      <div className="relative h-64 rounded-2xl overflow-hidden shadow-2xl">
                        <img src={page.header_image} alt={page.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                          <h1 className="text-4xl font-bold text-white">{page.title}</h1>
                        </div>
                      </div>
                    )}

                    {/* Title (no header image) */}
                    {!page.header_image && (
                      <div className="text-center">
                        <h1 className="text-4xl font-bold gradient-header-text mb-4">{page.title}</h1>
                        <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
                          {page.brand_site && !page.brand_site_is_srcdoc && !page.brand_site_inline && (
                            <Button size="sm" disabled>
                              <Globe className="h-4 w-4 mr-2" /> View Page Site
                            </Button>
                          )}
                          {page.external_url && (
                            <Button variant="outline" size="sm" disabled>
                              <ExternalLink className="h-4 w-4 mr-2" /> Visit External Site
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Embedded brand site (non-fullscreen, no header image) */}
                    {page.brand_site && page.brand_site_is_srcdoc && !page.brand_site_inline && !page.header_image && (
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          {renderBrandSiteIframe()}
                        </CardContent>
                      </Card>
                    )}

                    {/* Content blocks */}
                    {contentBlocks.map(block => (
                      <div key={block.id}>
                        {block.type === 'markdown' && block.content.trim() && (
                          <Card>
                            <CardContent className="pt-6 space-y-4">
                              <div className="prose prose-lg dark:prose-invert max-w-none">
                                <ReactMarkdown>{block.content}</ReactMarkdown>
                              </div>
                              {block.externalUrl && (
                                <div className="flex justify-center pt-4 border-t">
                                  <Button variant="outline" size="sm" disabled>
                                    <ExternalLink className="h-4 w-4 mr-2" /> Related Link
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
                                <div
                                  className="relative w-full overflow-hidden rounded-lg cursor-pointer group"
                                  onClick={() => setSelectedImage(block.images[0])}
                                >
                                  <img src={block.images[0]} alt="Image" className="w-full h-auto object-contain group-hover:opacity-90 transition-opacity" />
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {block.images.map((url, i) => (
                                    <div
                                      key={i}
                                      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                                      onClick={() => setSelectedImage(url)}
                                    >
                                      <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ))}

                    {/* Embedded brand site (non-fullscreen, with header image) */}
                    {page.header_image && page.brand_site && page.brand_site_is_srcdoc && !page.brand_site_inline && (
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          {renderBrandSiteIframe()}
                        </CardContent>
                      </Card>
                    )}

                    {/* Page site / external URL buttons (with header image) */}
                    {page.header_image && (page.external_url || (page.brand_site && !page.brand_site_is_srcdoc)) && (
                      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                        <CardContent className="py-6 flex items-center justify-center gap-3 flex-wrap">
                          {page.brand_site && !page.brand_site_is_srcdoc && (
                            <Button size="lg" disabled>
                              <Globe className="h-4 w-4 mr-2" /> View Page Site
                            </Button>
                          )}
                          {page.external_url && (
                            <Button size="lg" variant="outline" disabled>
                              Visit External Link <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Floating buttons preview (shown inline since we're in a dialog) */}
                    {(page.show_zap_button || page.buy_me_coffee_url) && (
                      <div className="flex items-center justify-end gap-3 flex-wrap pt-2 border-t border-dashed">
                        <span className="text-xs text-muted-foreground mr-auto">Floating buttons (shown bottom-right on live page):</span>
                        {page.buy_me_coffee_url && (
                          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 font-semibold text-sm">
                            <Coffee className="h-4 w-4" /> Buy Me a Coffee
                          </span>
                        )}
                        {page.show_zap_button && (
                          <ZapButton
                            authorPubkey={ADMIN_PUBKEY}
                            eventTitle={page.title}
                            variant="default"
                            size="default"
                            showLabel={true}
                            alwaysShow={true}
                            className="rounded-full"
                          />
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && <img src={selectedImage} alt="Gallery" className="w-full h-auto" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
