import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePages } from '@/hooks/usePages';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Upload, FileText, Edit, Image as ImageIcon, ExternalLink, GripVertical, Trash2, Loader2, Globe, Code2, FileDown, Zap, Coffee, LayoutGrid } from 'lucide-react';
import { generateSlug } from '@/lib/pageTypes';
import type { PageData } from '@/lib/pageTypes';

// All static route slugs in AppRouter.tsx — prevent custom pages from shadowing them
const RESERVED_SLUGS = new Set([
  'cards',
  'card',
  'share',
  'art',
  '21k-art',
  'canvas',
  'shop',
  'admin',
  'feed',
  'blog',
  'popup',
  'artist',
  'projects',
  'nostr-projects',
  'badges',
  'fundraising',
  'vlog',
  'wall',
  'categories',
  'order-confirmation',
  'free',
  'games',
  'animations',
  'wallpapers',
  'gifs',
  'avatars',
  'banners',
  'frl',
  'app',
]);
import { MediaPicker } from './MediaPicker';
import type { MediaShowcaseType } from './MediaShowcaseBlock';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// Content block types
interface ContentBlock {
  id: string;
  type: 'markdown' | 'gallery' | 'media';
  content: string;
  images: string[];
  externalUrl?: string;
  // media showcase fields
  mediaType?: MediaShowcaseType;
  selectedMediaIds?: string[];
}

export function PageManagement() {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { data: pages, isLoading } = usePages();
  const queryClient = useQueryClient();
  const headerImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingPage, setEditingPage] = useState<PageData | null>(null);
  const brandSiteFileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [headerImage, setHeaderImage] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [showInFooter, setShowInFooter] = useState(false);
  const [order, setOrder] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'markdown', content: '', images: [] }
  ]);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  // Project Website (brand_site)
  const [brandSite, setBrandSite] = useState('');
  const [brandSiteMode, setBrandSiteMode] = useState<'url' | 'html' | 'pdf'>('url');
  const [brandSiteHtml, setBrandSiteHtml] = useState('');
  const [brandSiteInline, setBrandSiteInline] = useState(false);

  // Page Buttons
  const [showZapButton, setShowZapButton] = useState(false);
  const [buyMeCoffeeUrl, setBuyMeCoffeeUrl] = useState('');
  
  // Scroll to the form whenever it opens
  useEffect(() => {
    if (isCreating && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [isCreating]);

  const resetForm = (keepOpen = false) => {
    setTitle('');
    setHeaderImage('');
    setExternalUrl('');
    setShowInFooter(false);
    setOrder('');
    setContentBlocks([{ id: '1', type: 'markdown', content: '', images: [] }]);
    setBrandSite('');
    setBrandSiteMode('url');
    setBrandSiteHtml('');
    setBrandSiteInline(false);
    setShowZapButton(false);
    setBuyMeCoffeeUrl('');
    setEditingPage(null);
    if (!keepOpen) setIsCreating(false);
  };

  const handleEdit = (page: PageData) => {
    setEditingPage(page);
    setTitle(page.title);
    setHeaderImage(page.header_image || '');
    setExternalUrl(page.external_url || '');
    setShowInFooter(page.show_in_footer);
    setOrder(page.order?.toString() || '');
    const storedBrandSite = page.event?.tags.find(t => t[0] === 'brand-site')?.[1] || '';
    setBrandSite(storedBrandSite);
    setBrandSiteInline(page.event?.tags.find(t => t[0] === 'brand-site-inline')?.[1] === 'true');

    // Restore inline HTML from content if it was stored there
    if (storedBrandSite === '__html__') {
      try {
        const parsed = JSON.parse(page.description);
        const html = parsed.brand_site_html || '';
        setBrandSiteHtml(html);
        setBrandSiteMode('html');
      } catch {
        setBrandSiteHtml('');
        setBrandSiteMode('html');
      }
    } else {
      setBrandSiteMode('url');
      setBrandSiteHtml('');
    }
    setShowZapButton(page.event?.tags.find(t => t[0] === 'zap-button')?.[1] === 'true');
    setBuyMeCoffeeUrl(page.event?.tags.find(t => t[0] === 'buy-me-coffee')?.[1] || '');
    
    // Parse content blocks from description
    try {
      const parsed = JSON.parse(page.description);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        setContentBlocks(parsed.blocks);
      } else {
        // Legacy: single description field
        setContentBlocks([{ 
          id: '1', 
          type: 'markdown', 
          content: page.description,
          images: page.gallery_images || []
        }]);
      }
    } catch {
      // Not JSON, treat as plain text
      setContentBlocks([{ 
        id: '1', 
        type: 'markdown', 
        content: page.description,
        images: page.gallery_images || []
      }]);
    }
    
    setIsCreating(true);
    // scrollIntoView handled by the useEffect on isCreating
  };

  const addContentBlock = (type: 'markdown' | 'gallery' | 'media', mediaType?: MediaShowcaseType) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      images: [],
      externalUrl: '',
      ...(type === 'media' ? { mediaType: mediaType ?? 'app-wallpaper', selectedMediaIds: [] } : {}),
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlockMediaType = (id: string, mediaType: MediaShowcaseType) => {
    setContentBlocks(contentBlocks.map(block =>
      block.id === id ? { ...block, mediaType, selectedMediaIds: [] } : block
    ));
  };

  const updateBlockSelectedMediaIds = (id: string, selectedMediaIds: string[]) => {
    setContentBlocks(contentBlocks.map(block =>
      block.id === id ? { ...block, selectedMediaIds } : block
    ));
  };

  const updateBlockContent = (id: string, content: string) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const updateBlockExternalUrl = (id: string, externalUrl: string) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, externalUrl } : block
    ));
  };

  const removeBlock = (id: string) => {
    if (contentBlocks.length <= 1) {
      return;
    }
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setContentBlocks(newBlocks);
  };

  const moveBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      const url = tags[0][1];
      setHeaderImage(url);
    } catch (error) {
      console.error('Failed to upload header image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingBlockId(blockId);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const tags = await uploadFile(file);
        const imageUrl = tags[0][1];
        uploadedUrls.push(imageUrl);
      } catch (error) {
        console.error('Failed to upload gallery image:', error);
      }
    }

    setContentBlocks(contentBlocks.map(block =>
      block.id === blockId ? { ...block, images: [...block.images, ...uploadedUrls] } : block
    ));
    setUploadingBlockId(null);
  };

  const removeGalleryImage = (blockId: string, imageIndex: number) => {
    setContentBlocks(contentBlocks.map(block =>
      block.id === blockId 
        ? { ...block, images: block.images.filter((_, i) => i !== imageIndex) }
        : block
    ));
  };

  const handleDelete = (page: PageData) => {
    if (!page.event) return;
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;

    createEvent(
      {
        kind: 5,
        content: 'Deleted page',
        tags: [
          ['e', page.event.id],
          ['a', `38175:${page.event.pubkey}:${page.id}`],
          ['k', '38175'],
        ],
      },
      {
        onSuccess: () => {
          toast.success('Page deleted');
          // Immediately remove from cache so UI updates without waiting for relay
          queryClient.setQueryData(['pages'], (old: PageData[] | undefined) =>
            old ? old.filter(p => p.id !== page.id) : []
          );
          queryClient.invalidateQueries({ queryKey: ['pages'] });
          queryClient.invalidateQueries({ queryKey: ['footer-pages'] });
          queryClient.removeQueries({ queryKey: ['page', page.id] });
        },
        onError: () => {
          toast.error('Failed to delete page');
        },
      }
    );
  };

  const handleBrandSiteFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isHtml = file.type === 'text/html' || /\.(html?|xhtml)$/i.test(file.name);
    if (!isPdf && !isHtml) { toast.error('Please upload a PDF or HTML file.'); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error('File too large (max 15MB).'); return; }
    setIsUploading(true);
    try {
      if (isHtml) {
        // Read the HTML text and store it directly — rendered via srcdoc, no data: URI needed
        const html = await file.text();
        setBrandSiteHtml(html);
        // Use a special sentinel so the tag stays small but reader knows it's inline HTML
        setBrandSite('__html__');
        setBrandSiteMode('html');
        toast.success('HTML file loaded. Save the page to publish it.');
        return;
      }
      // PDF: upload to Blossom and get a real URL
      const tags = await uploadFile(file);
      const url = tags[0]?.[1];
      if (url) { setBrandSite(url); setBrandSiteMode('url'); toast.success('PDF uploaded and linked.'); }
    } catch { toast.error('Failed to process file.'); }
    finally {
      setIsUploading(false);
      if (brandSiteFileRef.current) brandSiteFileRef.current.value = '';
    }
  }, [uploadFile]);

  const applyBrandSiteHtml = useCallback(() => {
    if (!brandSiteHtml.trim()) { toast.error('Paste HTML first.'); return; }
    // Store the sentinel marker; the actual HTML is kept in brandSiteHtml state
    setBrandSite('__html__');
    toast.success('HTML ready. Save the page to publish it.');
  }, [brandSiteHtml]);

  const handleSubmit = () => {
    if (!user || !title.trim()) return;

    const hasContent =
      !!brandSite ||
      contentBlocks.some(block =>
        (block.type === 'markdown' && block.content.trim()) ||
        (block.type === 'gallery' && block.images.length > 0) ||
        block.type === 'media'
      );

    if (!hasContent) {
      toast.error('Please add some content, a media block, or a page website before saving.');
      return;
    }

    const pageSlug = editingPage?.id || generateSlug(title);

    // Only validate slug uniqueness when creating a new page (not editing)
    if (!editingPage) {
      if (RESERVED_SLUGS.has(pageSlug)) {
        toast.error(`"/${pageSlug}" is a reserved route. Please use a different page title.`);
        return;
      }
      const slugExists = pages?.some(p => p.id === pageSlug);
      if (slugExists) {
        toast.error(`A page at "/${pageSlug}" already exists. Please use a different title.`);
        return;
      }
    }

    // Collect all gallery images from blocks
    const allGalleryImages: string[] = [];
    contentBlocks.forEach(block => {
      if (block.type === 'gallery') {
        allGalleryImages.push(...block.images);
      }
    });

    // If brand site is inline HTML, store the HTML in content (not the tag — tags have size limits)
    const isInlineHtml = brandSite === '__html__' && brandSiteHtml.trim();

    createEvent({
      kind: 38175,
      content: JSON.stringify({
        blocks: contentBlocks,
        ...(isInlineHtml ? { brand_site_html: brandSiteHtml.trim() } : {}),
      }),
      tags: [
        ['d', pageSlug],
        ['title', title.trim()],
        ['t', 'custom-page'],
        ...(headerImage ? [['header', headerImage]] : []),
        ...(externalUrl ? [['r', externalUrl]] : []),
        ...(showInFooter ? [['footer', 'true']] : []),
        ...(order ? [['order', order]] : []),
        // For inline HTML pages use sentinel; for regular URLs store the URL
        ...(brandSite && !isInlineHtml ? [['brand-site', brandSite]] : []),
        ...(isInlineHtml ? [['brand-site', '__html__']] : []),
        ...(brandSite && brandSiteInline ? [['brand-site-inline', 'true']] : []),
        ...(showZapButton ? [['zap-button', 'true']] : []),
        ...(buyMeCoffeeUrl.trim() ? [['buy-me-coffee', buyMeCoffeeUrl.trim()]] : []),
        ...allGalleryImages.map((img) => ['image', img]),
      ],
    }, {
      onSuccess: () => {
        toast.success(editingPage ? 'Page updated!' : 'Page created!');
        // Refresh all page queries so the list and individual page show updated data
        queryClient.invalidateQueries({ queryKey: ['pages'] });
        queryClient.invalidateQueries({ queryKey: ['footer-pages'] });
        queryClient.invalidateQueries({ queryKey: ['page', pageSlug] });
      },
      onError: () => {
        toast.error('Failed to save page. Please try again.');
      },
    });

    resetForm();
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to manage pages</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Management</CardTitle>
              <CardDescription>Create custom pages with multiple content blocks, galleries and external links</CardDescription>
            </div>
            <Button
              onClick={() => {
                if (isCreating) {
                  resetForm(); // closes form
                } else {
                  resetForm(true); // clear stale state but keep open=false first, then set true
                  setIsCreating(true);
                }
              }}
              variant={isCreating ? "outline" : "default"}
            >
              {isCreating ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Page
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card ref={formRef}>
          <CardHeader>
            <CardTitle>{editingPage ? 'Edit' : 'Create New'} Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Page Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="About Us, Contact, Privacy Policy..."
              />
              {(() => {
                const slug = editingPage?.id || generateSlug(title) || 'page-slug';
                const isReserved = !editingPage && RESERVED_SLUGS.has(slug);
                const isDuplicate = !editingPage && !!pages?.some(p => p.id === slug);
                const hasConflict = isReserved || isDuplicate;
                return (
                  <p className={`text-sm ${hasConflict ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    URL will be: /{slug}
                    {isReserved && ' — ⚠ this path is reserved by the app'}
                    {isDuplicate && ' — ⚠ a page with this URL already exists'}
                  </p>
                );
              })()}
            </div>

            {/* Header Image */}
            <div className="space-y-2">
              <Label>Header Image (optional)</Label>
              {headerImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <img
                      src={headerImage}
                      alt="Header"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setHeaderImage('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    type="url"
                    placeholder="Or paste image URL"
                    value={headerImage}
                    onChange={(e) => setHeaderImage(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={headerImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeaderImageUpload}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => headerImageInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Header Image
                      </>
                    )}
                  </Button>
                  <Input
                    type="url"
                    placeholder="Or paste image URL"
                    value={headerImage}
                    onChange={(e) => setHeaderImage(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* External URL */}
            <div className="space-y-2">
              <Label htmlFor="url">External URL (optional)</Label>
              <Input
                id="url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-sm text-muted-foreground">
                Link to external website or resource
              </p>
            </div>

            {/* Project Website */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Page Website (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Add a URL, upload a PDF, or paste HTML. A &quot;View Page Site&quot; button will appear on the page.
              </p>

              {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setBrandSiteMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${brandSiteMode === 'url' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setBrandSiteMode('html')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${brandSiteMode === 'html' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => setBrandSiteMode('pdf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${brandSiteMode === 'pdf' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  PDF
                </button>
              </div>

              {brandSiteMode === 'url' && (
                <div className="space-y-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={brandSite === '__html__' ? '' : brandSite}
                    onChange={(e) => setBrandSite(e.target.value)}
                  />
                  {brandSite && brandSite !== '__html__' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs truncate max-w-xs">
                        {brandSite}
                      </Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setBrandSite('')}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {brandSiteMode === 'html' && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your HTML here..."
                    value={brandSiteHtml}
                    onChange={(e) => setBrandSiteHtml(e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={applyBrandSiteHtml} disabled={!brandSiteHtml.trim()}>
                    <Code2 className="h-4 w-4 mr-2" />
                    Ready to Save
                  </Button>
                  {brandSite === '__html__' && brandSiteHtml.trim() && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        ✓ HTML ready — will be saved with the page
                      </Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setBrandSite(''); setBrandSiteHtml(''); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {brandSiteMode === 'pdf' && (
                <div className="space-y-2">
                  <input
                    ref={brandSiteFileRef}
                    type="file"
                    accept=".pdf,.html,.htm"
                    className="hidden"
                    onChange={handleBrandSiteFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => brandSiteFileRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />Upload PDF or HTML file</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PDF files are uploaded to Blossom. HTML files are stored inline with the page.
                  </p>
                  {brandSite && brandSite !== '__html__' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs truncate max-w-xs">
                        {brandSite}
                      </Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setBrandSite('')}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {brandSite === '__html__' && brandSiteHtml.trim() && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        ✓ HTML file loaded — will be saved with the page
                      </Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setBrandSite(''); setBrandSiteHtml(''); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Inline / button toggle */}
              <div className="flex items-start gap-3 pt-2 border-t mt-2">
                <Checkbox
                  id="brand-site-inline"
                  checked={brandSiteInline}
                  onCheckedChange={(v) => setBrandSiteInline(v as boolean)}
                  disabled={!brandSite}
                />
                <div>
                  <Label htmlFor="brand-site-inline" className={`text-sm font-medium cursor-pointer ${!brandSite ? 'text-muted-foreground' : ''}`}>
                    Show as full page (inline)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When checked, the site is embedded directly on the page as a full iframe — no button, visitors see it immediately.
                    When unchecked, a &quot;View Page Site&quot; button opens it in a new tab.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Blocks */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Content Blocks</Label>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4">
                  {contentBlocks.map((block, index) => (
                    <div key={block.id} className="space-y-3">
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                              <span className="text-sm font-medium">
                                {block.type === 'markdown' ? 'Text Block'
                                  : block.type === 'gallery' ? 'Photo Gallery'
                                  : 'Media Showcase'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveBlockUp(index)}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveBlockDown(index)}
                                disabled={index === contentBlocks.length - 1}
                              >
                                ↓
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBlock(block.id)}
                                disabled={contentBlocks.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {block.type === 'markdown' ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Write your content using Markdown..."
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                rows={10}
                                className="font-mono text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                Supports Markdown: **bold**, *italic*, ## headings, [links](url), etc.
                              </p>
                            </div>
                          ) : block.type === 'media' ? (
                            <div className="space-y-3">
                              {/* Media type selector */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                                <div className="flex flex-wrap gap-2">
                                  {([
                                    { value: 'app-wallpaper', label: '🖼 Wallpapers' },
                                    { value: 'app-gif',       label: '🎞 GIFs' },
                                    { value: 'app-avatar',   label: '👤 Avatars' },
                                    { value: 'app-banner',   label: '🏞 Banners' },
                                  ] as { value: MediaShowcaseType; label: string }[]).map(opt => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => updateBlockMediaType(block.id, opt.value)}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        block.mediaType === opt.value
                                          ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400 text-purple-800 dark:text-purple-200'
                                          : 'bg-background border-border text-muted-foreground hover:border-gray-400'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Media picker */}
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Select items to showcase (click to toggle, leave all unselected to show all)
                                </Label>
                                {block.mediaType && (
                                  <MediaPicker
                                    mediaType={block.mediaType}
                                    selectedIds={block.selectedMediaIds ?? []}
                                    onChange={(ids) => updateBlockSelectedMediaIds(block.id, ids)}
                                  />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {block.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  {block.images.map((imgUrl, imgIndex) => (
                                    <div key={imgIndex} className="relative group rounded-lg overflow-hidden border-2">
                                      <img
                                        src={imgUrl}
                                        alt={`Gallery ${imgIndex + 1}`}
                                        className="w-full h-32 object-cover"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeGalleryImage(block.id, imgIndex)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <input
                                ref={(el) => galleryInputRefs.current[block.id] = el}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleGalleryUpload(block.id, e)}
                                disabled={uploadingBlockId === block.id}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => galleryInputRefs.current[block.id]?.click()}
                                disabled={uploadingBlockId === block.id}
                              >
                                {uploadingBlockId === block.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Add Images to Gallery
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                {block.images.length > 0 
                                  ? `${block.images.length} image(s) in this gallery`
                                  : 'Upload images to create a photo gallery'}
                              </p>
                            </div>
                          )}
                          
                          {/* External URL for this block */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label htmlFor={`external-url-${block.id}`} className="text-sm">External URL (Optional)</Label>
                            <Input
                              id={`external-url-${block.id}`}
                              type="url"
                              placeholder="https://example.com"
                              value={block.externalUrl || ''}
                              onChange={(e) => updateBlockExternalUrl(block.id, e.target.value)}
                              className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Add a link related to this content block
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Add Block Buttons - appear after each block */}
                      <div className="flex justify-center flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addContentBlock('markdown')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Text
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addContentBlock('gallery')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Gallery
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addContentBlock('media', 'app-wallpaper')}
                        >
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Add Media Showcase
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="space-y-8">
                    {headerImage && (
                      <div className="w-full h-64 rounded-lg overflow-hidden">
                        <img
                          src={headerImage}
                          alt="Header"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-3xl">{title || 'Page Title'}</CardTitle>
                        {externalUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="mt-2 w-fit"
                          >
                            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit External Site
                            </a>
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-8">
                        {contentBlocks.map((block) => (
                          <div key={block.id} className="space-y-4">
                            {block.type === 'markdown' && block.content.trim() && (
                              <>
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                  <ReactMarkdown>{block.content}</ReactMarkdown>
                                </div>
                                {block.externalUrl && (
                                  <div className="flex justify-center pt-4 border-t">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Related Link
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                            {block.type === 'gallery' && block.images.length > 0 && (
                              <>
                                {block.images.length === 1 ? (
                                  <div className="w-full">
                                    <img
                                      src={block.images[0]}
                                      alt="Image"
                                      className="w-full h-auto object-contain rounded-lg"
                                    />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {block.images.map((imgUrl, index) => (
                                      <div
                                        key={index}
                                        className="relative aspect-square overflow-hidden rounded-lg"
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Image ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {block.externalUrl && (
                                  <div className="flex justify-center pt-4 border-t">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Related Link
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                            {block.type === 'media' && block.mediaType && (
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed text-muted-foreground text-sm">
                                <LayoutGrid className="h-4 w-4 flex-shrink-0" />
                                <span>
                                  Media Showcase — <strong>{block.mediaType.replace('app-', '')}</strong>
                                  {block.selectedMediaIds && block.selectedMediaIds.length > 0
                                    ? ` · ${block.selectedMediaIds.length} item${block.selectedMediaIds.length !== 1 ? 's' : ''} selected`
                                    : ' · all items'}
                                  {' '}(visible on the published page)
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Page Buttons */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                Page Buttons (floating corner)
              </Label>
              <p className="text-xs text-muted-foreground -mt-2">
                Add a floating ⚡ Zap button and/or a ☕ Buy Me a Coffee button that appears in the bottom-right corner of the page.
              </p>

              {/* Zap Button toggle */}
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-orange-50/60 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
                <Checkbox
                  id="show-zap-button"
                  checked={showZapButton}
                  onCheckedChange={(v) => setShowZapButton(v as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="show-zap-button" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                    ⚡ Zap Button
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Show a floating Lightning Zap button so visitors can tip you directly via Nostr. Requires your Nostr Lightning address to be set in your profile.
                  </p>
                </div>
              </div>

              {/* Buy Me a Coffee */}
              <div className="space-y-2 p-3 border rounded-lg bg-yellow-50/60 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-400" />
                  ☕ Buy Me a Coffee Button
                </Label>
                <Input
                  type="url"
                  placeholder="https://buymeacoffee.com/your-username"
                  value={buyMeCoffeeUrl}
                  onChange={(e) => setBuyMeCoffeeUrl(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Paste your Buy Me a Coffee (or Ko-fi, Patreon, etc.) URL. Leave empty to hide this button.
                </p>
              </div>
            </div>

            {/* Footer Display */}
            <div className="flex items-center space-x-2 border-t pt-4">
              <Checkbox
                id="footer"
                checked={showInFooter}
                onCheckedChange={(checked) => setShowInFooter(checked as boolean)}
              />
              <Label htmlFor="footer" className="text-sm font-medium">
                Show link in footer
              </Label>
            </div>

            {/* Order */}
            {showInFooter && (
              <div className="space-y-2">
                <Label htmlFor="order">Display Order (optional)</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  placeholder="1"
                  min="1"
                />
                <p className="text-sm text-muted-foreground">
                  Lower numbers appear first in footer
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!title.trim()}
              >
                {editingPage ? 'Update' : 'Create'} Page
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pages List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Pages</CardTitle>
          <CardDescription>All custom pages</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-20 w-32 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : pages && pages.length > 0 ? (
            <div className="space-y-4">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {page.header_image || page.gallery_images.length > 0 ? (
                    <img
                      src={page.header_image || page.gallery_images[0]}
                      alt=""
                      className="w-32 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-32 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold">{page.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {(() => {
                        try {
                          const parsed = JSON.parse(page.description);
                          if (parsed.blocks && Array.isArray(parsed.blocks)) {
                            const firstMarkdown = parsed.blocks.find((b: ContentBlock) => b.type === 'markdown' && b.content);
                            return firstMarkdown?.content.slice(0, 100) || 'Custom page';
                          }
                          return page.description.slice(0, 100);
                        } catch {
                          return page.description.slice(0, 100);
                        }
                      })()}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        /{page.id}
                      </Badge>
                      {page.show_in_footer && (
                        <Badge variant="secondary" className="text-xs">
                          In Footer
                        </Badge>
                      )}
                      {page.gallery_images.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {page.gallery_images.length} images
                        </Badge>
                      )}
                      {page.external_url && (
                        <Badge variant="outline" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          External
                        </Badge>
                      )}
                      {page.event?.tags.find(t => t[0] === 'brand-site') && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Page Site
                        </Badge>
                      )}
                      {page.event?.tags.find(t => t[0] === 'zap-button')?.[1] === 'true' && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                          <Zap className="h-3 w-3 mr-1 fill-orange-500" />
                          Zap
                        </Badge>
                      )}
                      {page.event?.tags.find(t => t[0] === 'buy-me-coffee')?.[1] && (
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
                          <Coffee className="h-3 w-3 mr-1" />
                          BMAC
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(page)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                      onClick={() => handleDelete(page)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pages yet. Create your first custom page!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
