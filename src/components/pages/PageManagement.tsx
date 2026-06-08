import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePages, loadPagesFromStorage, savePagesToStorage } from '@/hooks/usePages';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Upload, FileText, Edit, Image as ImageIcon, ExternalLink, Trash2, Loader2, Globe, Zap, Coffee } from 'lucide-react';
import { generateSlug } from '@/lib/pageTypes';
import type { PageData } from '@/lib/pageTypes';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// All static route slugs — prevent custom pages from shadowing them
const RESERVED_SLUGS = new Set([
  'cards','card','share','art','21k-art','canvas','shop','admin','feed',
  'blog','popup','artist','projects','nostr-projects','badges','fundraising',
  'vlog','wall','categories','order-confirmation','free','games','animations',
  'wallpapers','gifs','avatars','banners','frl','app',
]);

export function PageManagement() {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { data: pages, isLoading } = usePages();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingPage, setEditingPage] = useState<PageData | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [headerImage, setHeaderImage] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [showInFooter, setShowInFooter] = useState(false);
  const [order, setOrder] = useState('');
  const [brandSiteUrl, setBrandSiteUrl] = useState('');
  const [brandSiteHtml, setBrandSiteHtml] = useState('');
  const [brandSiteInline, setBrandSiteInline] = useState(false);
  const [showZapButton, setShowZapButton] = useState(false);
  const [buyMeCoffeeUrl, setBuyMeCoffeeUrl] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const headerImageRef = useRef<HTMLInputElement>(null);
  const htmlFileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCreating) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [isCreating]);

  function resetForm() {
    setTitle('');
    setContent('');
    setHeaderImage('');
    setExternalUrl('');
    setShowInFooter(false);
    setOrder('');
    setBrandSiteUrl('');
    setBrandSiteHtml('');
    setBrandSiteInline(false);
    setShowZapButton(false);
    setBuyMeCoffeeUrl('');
    setEditingPage(null);
    setIsCreating(false);
  }

  function openCreate() {
    resetForm();
    setIsCreating(true);
  }

  function openEdit(page: PageData) {
    setTitle(page.title);
    setContent((() => {
      try {
        const p = JSON.parse(page.description);
        return p.blocks?.[0]?.content ?? page.description;
      } catch { return page.description; }
    })());
    setHeaderImage(page.header_image ?? '');
    setExternalUrl(page.external_url ?? '');
    setShowInFooter(page.show_in_footer);
    setOrder(page.order?.toString() ?? '');
    setBrandSiteInline(page.brand_site_inline ?? false);
    setShowZapButton(page.show_zap_button ?? false);
    setBuyMeCoffeeUrl(page.buy_me_coffee_url ?? '');
    if (page.brand_site_is_srcdoc && page.brand_site) {
      setBrandSiteHtml(page.brand_site);
      setBrandSiteUrl('');
    } else {
      setBrandSiteUrl(page.brand_site ?? '');
      setBrandSiteHtml('');
    }
    setEditingPage(page);
    setIsCreating(true);
  }

  function handleDelete(page: PageData) {
    if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    savePagesToStorage(loadPagesFromStorage().filter(p => p.id !== page.id));
    queryClient.invalidateQueries({ queryKey: ['pages'] });
    queryClient.invalidateQueries({ queryKey: ['footer-pages'] });
    queryClient.removeQueries({ queryKey: ['page', page.id] });
    toast.success('Page deleted');
  }

  const handleHeaderImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      setHeaderImage(tags[0][1]);
    } catch { toast.error('Failed to upload image'); }
    finally { setIsUploading(false); }
  }, [uploadFile]);

  const handleHtmlFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const html = await file.text();
      setBrandSiteHtml(html);
      setBrandSiteUrl('');
      toast.success('HTML file loaded');
    } catch { toast.error('Failed to read file'); }
    finally {
      if (htmlFileRef.current) htmlFileRef.current.value = '';
    }
  }, []);

  function handleSave() {
    if (!title.trim()) {
      toast.error('Please enter a page title');
      return;
    }

    const slug = editingPage?.id ?? generateSlug(title);

    if (!editingPage) {
      if (RESERVED_SLUGS.has(slug)) {
        toast.error(`"/${slug}" is a reserved route. Use a different title.`);
        return;
      }
      if (pages?.some(p => p.id === slug)) {
        toast.error(`A page at "/${slug}" already exists.`);
        return;
      }
    }

    const isHtml = !!brandSiteHtml.trim();

    const pageData: PageData = {
      id: slug,
      title: title.trim(),
      description: JSON.stringify({ blocks: [{ id: '1', type: 'markdown', content, images: [] }] }),
      header_image: headerImage || undefined,
      gallery_images: [],
      external_url: externalUrl || undefined,
      brand_site: isHtml ? brandSiteHtml.trim() : (brandSiteUrl.trim() || undefined),
      brand_site_inline: brandSiteInline,
      brand_site_is_srcdoc: isHtml,
      author_pubkey: '',
      created_at: editingPage?.created_at ?? new Date().toISOString(),
      show_in_footer: showInFooter,
      order: order ? parseInt(order) : undefined,
      show_zap_button: showZapButton,
      buy_me_coffee_url: buyMeCoffeeUrl.trim() || undefined,
    };

    const existing = loadPagesFromStorage();
    savePagesToStorage(
      editingPage
        ? existing.map(p => p.id === slug ? pageData : p)
        : [...existing, pageData]
    );

    queryClient.invalidateQueries({ queryKey: ['pages'] });
    queryClient.invalidateQueries({ queryKey: ['footer-pages'] });
    queryClient.invalidateQueries({ queryKey: ['page', slug] });
    toast.success(editingPage ? 'Page updated!' : 'Page created!');
    resetForm();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Management</CardTitle>
              <CardDescription>Create custom pages for your website</CardDescription>
            </div>
            <Button onClick={isCreating ? resetForm : openCreate} variant={isCreating ? 'outline' : 'default'}>
              {isCreating ? <><X className="h-4 w-4 mr-2" />Cancel</> : <><Plus className="h-4 w-4 mr-2" />Create Page</>}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      {isCreating && (
        <Card ref={formRef}>
          <CardHeader>
            <CardTitle>{editingPage ? 'Edit' : 'Create New'} Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Title */}
            <div className="space-y-2">
              <Label>Page Title *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="About Us, Contact, Nostr..."
              />
              {title && (
                <p className="text-xs text-muted-foreground">URL: /{editingPage?.id ?? generateSlug(title)}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Content (Markdown, optional)</Label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your page content here..."
                rows={6}
              />
            </div>

            {/* Header Image */}
            <div className="space-y-2">
              <Label>Header Image (optional)</Label>
              {headerImage ? (
                <div className="space-y-2">
                  <img src={headerImage} className="w-full h-40 object-cover rounded" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setHeaderImage('')}>
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input ref={headerImageRef} type="file" accept="image/*" className="hidden" onChange={handleHeaderImageUpload} />
                  <Button type="button" variant="outline" className="w-full" onClick={() => headerImageRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload Header Image</>}
                  </Button>
                  <Input type="url" placeholder="Or paste image URL" value={headerImage} onChange={e => setHeaderImage(e.target.value)} />
                </div>
              )}
            </div>

            {/* Page Website */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label className="font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" /> Page Website (optional)
              </Label>

              {/* URL input */}
              {!brandSiteHtml && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Website URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={brandSiteUrl}
                    onChange={e => setBrandSiteUrl(e.target.value)}
                  />
                </div>
              )}

              {/* HTML file upload */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Or upload an HTML file</Label>
                <input ref={htmlFileRef} type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlFileUpload} />
                {brandSiteHtml ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      ✓ HTML file loaded
                    </Badge>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setBrandSiteHtml('')}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => htmlFileRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" /> Upload HTML file
                  </Button>
                )}
              </div>

              {/* Inline toggle */}
              {(brandSiteUrl.trim() || brandSiteHtml.trim()) && (
                <div className="flex items-start gap-3 pt-2 border-t">
                  <Checkbox
                    id="brand-inline"
                    checked={brandSiteInline}
                    onCheckedChange={v => setBrandSiteInline(v as boolean)}
                  />
                  <div>
                    <Label htmlFor="brand-inline" className="cursor-pointer">Show as full page (inline)</Label>
                    <p className="text-xs text-muted-foreground">Embed directly on the page. When unchecked, shows a button link.</p>
                  </div>
                </div>
              )}
            </div>

            {/* External URL */}
            <div className="space-y-2">
              <Label>External URL (optional)</Label>
              <Input type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://example.com" />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2">
              <Checkbox id="footer" checked={showInFooter} onCheckedChange={v => setShowInFooter(v as boolean)} />
              <Label htmlFor="footer">Show in footer</Label>
            </div>

            {showInFooter && (
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="1" min="1" />
              </div>
            )}

            {/* Zap button */}
            <div className="flex items-center gap-2">
              <Checkbox id="zap" checked={showZapButton} onCheckedChange={v => setShowZapButton(v as boolean)} />
              <Label htmlFor="zap" className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-orange-500" /> Show Zap button</Label>
            </div>

            {/* Buy Me a Coffee */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Coffee className="h-3.5 w-3.5" /> Buy Me a Coffee URL (optional)</Label>
              <Input type="url" value={buyMeCoffeeUrl} onChange={e => setBuyMeCoffeeUrl(e.target.value)} placeholder="https://buymeacoffee.com/..." />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}>
                {editingPage ? 'Update Page' : 'Create Page'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !pages?.length ? (
            <p className="text-center py-8 text-muted-foreground">No pages yet. Create your first custom page!</p>
          ) : (
            <div className="space-y-3">
              {pages.map(page => (
                <div key={page.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50">
                  {page.header_image ? (
                    <img src={page.header_image} className="w-24 h-16 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{page.title}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <Badge variant="outline" className="text-xs">/{page.id}</Badge>
                      {page.show_in_footer && <Badge variant="secondary" className="text-xs">Footer</Badge>}
                      {page.brand_site && <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />Site</Badge>}
                      {page.external_url && <Badge variant="outline" className="text-xs"><ExternalLink className="h-3 w-3 mr-1" />External</Badge>}
                      {page.show_zap_button && <Badge variant="outline" className="text-xs text-orange-600"><Zap className="h-3 w-3 mr-1" />Zap</Badge>}
                      {page.buy_me_coffee_url && <Badge variant="outline" className="text-xs"><Coffee className="h-3 w-3 mr-1" />BMAC</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(page)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleDelete(page)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
