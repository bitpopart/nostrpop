import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { usePage } from '@/hooks/usePages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  useSeoMeta({
    title: page ? `${page.title} - BitPopArt` : 'Page',
    description: page?.description || '',
  });

  const getContentBlocks = (): ContentBlock[] => {
    if (!page) return [];

    try {
      const parsed = JSON.parse(page.description);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        return parsed.blocks;
      }
    } catch {
      // If not JSON or doesn't have blocks, treat as legacy single content block
      return [{
        id: '1',
        type: 'markdown',
        content: page.description,
        images: page.gallery_images || []
      }];
    }

    // Fallback
    return [{
      id: '1',
      type: 'markdown',
      content: page.description,
      images: page.gallery_images || []
    }];
  };

  if (isLoading) {
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
              <p className="text-muted-foreground mb-6">
                This page doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const contentBlocks = getContentBlocks();

  // Floating corner buttons — shared between both render modes
  const floatingButtons = (page.show_zap_button || page.buy_me_coffee_url) ? (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Buy Me a Coffee button */}
      {page.buy_me_coffee_url && (
        <a
          href={page.buy_me_coffee_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          title="Buy Me a Coffee"
        >
          <Coffee className="h-4 w-4 flex-shrink-0" />
          <span>Buy Me a Coffee</span>
        </a>
      )}

      {/* Zap Button */}
      {page.show_zap_button && (
        <ZapButton
          authorPubkey={ADMIN_PUBKEY}
          eventTitle={page.title}
          variant="default"
          size="default"
          showLabel={true}
          alwaysShow={true}
          className="rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 px-5"
        />
      )}
    </div>
  ) : null;

  // Render the brand_site iframe — srcdoc for inline HTML, src for external URLs
  const renderBrandSiteIframe = (className = 'flex-1 w-full border-0') =>
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

  // Full-screen inline iframe mode — render iframe + floating buttons
  if (page.brand_site && page.brand_site_inline) {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ zIndex: 10 }}>
        {/* Thin top bar with back button */}
        <div className="flex items-center gap-3 px-4 py-2 bg-background/90 backdrop-blur border-b shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span className="text-sm font-medium text-muted-foreground truncate">{page.title}</span>
          {/* Floating action buttons moved into the top bar for inline mode */}
          <div className="ml-auto flex items-center gap-2">
            {page.buy_me_coffee_url && (
              <a
                href={page.buy_me_coffee_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-semibold text-sm shadow transition-all duration-200 whitespace-nowrap"
                title="Buy Me a Coffee"
              >
                <Coffee className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Buy Me a Coffee</span>
              </a>
            )}
            {page.show_zap_button && (
              <ZapButton
                authorPubkey={ADMIN_PUBKEY}
                eventTitle={page.title}
                variant="default"
                size="sm"
                showLabel={false}
                alwaysShow={true}
                className="rounded-full"
              />
            )}
            {/* Only show "Open" link for real URLs, not inline HTML */}
            {!page.brand_site_is_srcdoc && (
              <a
                href={page.brand_site}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open
                </Button>
              </a>
            )}
          </div>
        </div>
        {renderBrandSiteIframe()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Image */}
          {page.header_image && (
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={page.header_image}
                alt={page.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {page.title}
                </h1>
              </div>
            </div>
          )}

          {/* Title (if no header image) */}
          {!page.header_image && (
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold gradient-header-text mb-4">
                {page.title}
              </h1>
              <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
                {page.brand_site && !page.brand_site_is_srcdoc && !page.brand_site_inline && (
                  <Button size="sm" asChild>
                    <a href={page.brand_site} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      View Page Site
                    </a>
                  </Button>
                )}
                {page.external_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={page.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit External Site
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Embedded brand site (non-fullscreen mode) — show below the title */}
          {page.brand_site && page.brand_site_is_srcdoc && !page.brand_site_inline && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {renderBrandSiteIframe('w-full border-0 min-h-[600px]')}
              </CardContent>
            </Card>
          )}

          {/* Content Blocks */}
            {contentBlocks.map((block) => (
              <div key={block.id}>
                {/* Markdown Content Block */}
                {block.type === 'markdown' && block.content.trim() && (
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="prose prose-lg dark:prose-invert max-w-none">
                        <ReactMarkdown>{block.content}</ReactMarkdown>
                      </div>
                      {block.externalUrl && (
                        <div className="flex justify-center pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Related Link
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Media Showcase Block */}
              {block.type === 'media' && block.mediaType && (
                <Card>
                  <CardContent className="pt-6">
                    <MediaShowcaseBlock
                      mediaType={block.mediaType}
                      selectedIds={block.selectedMediaIds ?? []}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Gallery Block */}
              {block.type === 'gallery' && block.images.length > 0 && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Single image: full width */}
                    {block.images.length === 1 ? (
                      <div
                        className="relative w-full overflow-hidden rounded-lg cursor-pointer group"
                        onClick={() => setSelectedImage(block.images[0])}
                      >
                        <img
                          src={block.images[0]}
                          alt="Image"
                          className="w-full h-auto object-contain group-hover:opacity-90 transition-opacity duration-300"
                        />
                      </div>
                    ) : (
                      /* Multiple images: grid layout */
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {block.images.map((imgUrl, index) => (
                          <div
                            key={index}
                            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                            onClick={() => setSelectedImage(imgUrl)}
                          >
                            <img
                              src={imgUrl}
                              alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {block.externalUrl && (
                      <div className="flex justify-center pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Related Link
                          </a>
                        </Button>
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
                {renderBrandSiteIframe('w-full border-0 min-h-[600px]')}
              </CardContent>
            </Card>
          )}

          {/* Page Site / External URL Buttons (when there's a header image) */}
          {page.header_image && (page.external_url || (page.brand_site && !page.brand_site_is_srcdoc)) && (
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="py-6 flex items-center justify-center gap-3 flex-wrap">
                {page.brand_site && !page.brand_site_is_srcdoc && (
                  <Button
                    size="lg"
                    onClick={() => window.open(page.brand_site, '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    View Page Site
                  </Button>
                )}
                {page.external_url && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open(page.external_url, '_blank')}
                  >
                    Visit External Link
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Page Buttons (bottom-right corner) */}
      {floatingButtons}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Gallery"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
