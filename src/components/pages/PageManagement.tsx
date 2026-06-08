import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePages, loadPagesFromStorage, savePagesToStorage } from '@/hooks/usePages';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, X, Upload, FileText, Edit, Image as ImageIcon,
  ExternalLink, Trash2, Loader2, Globe, Zap, Coffee,
  MoveUp, MoveDown, Type, Film, UserCircle2, LayoutPanelTop,
  GalleryHorizontal, Eye, Code2, FileCode,
} from 'lucide-react';
import { generateSlug } from '@/lib/pageTypes';
import type { PageData } from '@/lib/pageTypes';
import { MediaPicker } from './MediaPicker';
import type { MediaShowcaseType } from './MediaShowcaseBlock';
import { HtmlEditor } from './HtmlEditor';
import { PagePreviewDialog } from './PagePreviewDialog';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// All static route slugs — prevent custom pages from shadowing them
const RESERVED_SLUGS = new Set([
  'cards','card','share','art','21k-art','canvas','shop','admin','feed',
  'blog','popup','artist','projects','nostr-projects','badges','fundraising',
  'vlog','wall','categories','order-confirmation','free','games','animations',
  'wallpapers','gifs','avatars','banners','frl','app',
]);

// ─── Content Block Types ──────────────────────────────────────────────────────

type BlockType = 'markdown' | 'gallery' | 'media';

interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  images: string[];
  externalUrl?: string;
  mediaType?: MediaShowcaseType;
  selectedMediaIds?: string[];
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyBlock(type: BlockType): ContentBlock {
  return {
    id: makeId(),
    type,
    content: '',
    images: [],
    externalUrl: '',
    mediaType: type === 'media' ? 'app-wallpaper' : undefined,
    selectedMediaIds: type === 'media' ? [] : undefined,
  };
}

const MEDIA_TYPE_OPTIONS: { value: MediaShowcaseType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'app-wallpaper', label: 'Wallpapers',    icon: ImageIcon },
  { value: 'app-gif',       label: 'Animated GIFs', icon: Film },
  { value: 'app-avatar',    label: 'Avatars',        icon: UserCircle2 },
  { value: 'app-banner',    label: 'Banners',        icon: LayoutPanelTop },
];

// ─── Block Editor ─────────────────────────────────────────────────────────────

interface BlockEditorProps {
  block: ContentBlock;
  index: number;
  total: number;
  onChange: (updated: ContentBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  uploadFile: (file: File) => Promise<string[][]>;
}

function BlockEditor({ block, index, total, onChange, onRemove, onMoveUp, onMoveDown, uploadFile }: BlockEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const urls = await Promise.all(files.map(async (f) => {
        const tags = await uploadFile(f);
        return tags[0][1] as string;
      }));
      onChange({ ...block, images: [...block.images, ...urls] });
    } catch { toast.error('Failed to upload image(s)'); }
    finally {
      setIsUploading(false);
      if (galleryRef.current) galleryRef.current.value = '';
    }
  }, [block, onChange, uploadFile]);

  const removeImage = (idx: number) => {
    onChange({ ...block, images: block.images.filter((_, i) => i !== idx) });
  };

  const blockTypeLabel =
    block.type === 'markdown' ? 'Text / Markdown' :
    block.type === 'gallery'  ? 'Image Gallery' :
    'Media Showcase';

  const BlockIcon =
    block.type === 'markdown' ? Type :
    block.type === 'gallery'  ? GalleryHorizontal :
    ImageIcon;

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-background">
      {/* Block header */}
      <div className="flex items-center gap-2">
        <BlockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold flex-1">{blockTypeLabel}</span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={onMoveUp} title="Move up">
            <MoveUp className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === total - 1} onClick={onMoveDown} title="Move down">
            <MoveDown className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={onRemove} title="Remove block">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Markdown block */}
      {block.type === 'markdown' && (
        <div className="space-y-3">
          <Textarea
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            placeholder="Write your content here (Markdown supported)..."
            rows={6}
          />
          <Input
            type="url"
            value={block.externalUrl ?? ''}
            onChange={e => onChange({ ...block, externalUrl: e.target.value })}
            placeholder="Related link URL (optional)"
          />
          {/* Live preview */}
          {block.content.trim() && (
            <details className="border rounded-lg overflow-hidden">
              <summary className="px-3 py-2 text-xs font-medium cursor-pointer bg-muted/30 hover:bg-muted/60 select-none">
                Preview
              </summary>
              <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{block.content}</ReactMarkdown>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Gallery block */}
      {block.type === 'gallery' && (
        <div className="space-y-3">
          {/* Thumbnails */}
          {block.images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {block.images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border">
                  <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Upload */}
          <input ref={galleryRef} type="file" accept="image/*,image/gif" multiple className="hidden" onChange={handleGalleryUpload} />
          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => galleryRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading
                ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Uploading...</>
                : <><Upload className="h-3.5 w-3.5 mr-1" />Upload Images</>
              }
            </Button>
          </div>
          {/* Paste URL */}
          <Input
            type="url"
            placeholder="Or paste an image URL and press Enter"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const url = (e.target as HTMLInputElement).value.trim();
                if (url) {
                  onChange({ ...block, images: [...block.images, url] });
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          <Input
            type="url"
            value={block.externalUrl ?? ''}
            onChange={e => onChange({ ...block, externalUrl: e.target.value })}
            placeholder="Related link URL (optional)"
          />
        </div>
      )}

      {/* Media Showcase block */}
      {block.type === 'media' && (
        <div className="space-y-4">
          {/* Media type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Media Type</Label>
            <Select
              value={block.mediaType ?? 'app-wallpaper'}
              onValueChange={v => onChange({ ...block, mediaType: v as MediaShowcaseType, selectedMediaIds: [] })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_TYPE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Thumbnail picker */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Select items to feature (leave empty to show all)
            </Label>
            <MediaPicker
              mediaType={block.mediaType ?? 'app-wallpaper'}
              selectedIds={block.selectedMediaIds ?? []}
              onChange={ids => onChange({ ...block, selectedMediaIds: ids })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Block Picker ─────────────────────────────────────────────────────────

interface AddBlockPickerProps {
  onAdd: (type: BlockType) => void;
}

function AddBlockPicker({ onAdd }: AddBlockPickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Add block:</span>
      <Button type="button" variant="outline" size="sm" onClick={() => onAdd('markdown')}>
        <Type className="h-3.5 w-3.5 mr-1.5" /> Text
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onAdd('gallery')}>
        <GalleryHorizontal className="h-3.5 w-3.5 mr-1.5" /> Gallery
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onAdd('media')}>
        <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Media Showcase
      </Button>
    </div>
  );
}

// ─── Main PageManagement Component ───────────────────────────────────────────

export function PageManagement() {
  const { mutateAsync: uploadFile } = useUploadFile();
  const { data: pages, isLoading } = usePages();
  const queryClient = useQueryClient();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  const [isCreating, setIsCreating] = useState(false);
  const [editingPage, setEditingPage] = useState<PageData | null>(null);
  // 'static' = normal content blocks page, 'html' = full HTML upload page
  const [pageTab, setPageTab] = useState<'static' | 'html'>('static');

  // Basic fields
  const [title, setTitle] = useState('');
  const [headerImage, setHeaderImage] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [showInFooter, setShowInFooter] = useState(false);
  const [order, setOrder] = useState('');
  const [brandSiteUrl, setBrandSiteUrl] = useState('');
  const [brandSiteHtml, setBrandSiteHtml] = useState('');
  const [brandSiteInline, setBrandSiteInline] = useState(false);
  const [showZapButton, setShowZapButton] = useState(false);
  const [buyMeCoffeeUrl, setBuyMeCoffeeUrl] = useState('');

  // Content blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>([emptyBlock('markdown')]);

  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    setHeaderImage('');
    setExternalUrl('');
    setShowInFooter(false);
    setOrder('');
    setBrandSiteUrl('');
    setBrandSiteHtml('');
    setBrandSiteInline(false);
    setShowZapButton(false);
    setBuyMeCoffeeUrl('');
    setBlocks([emptyBlock('markdown')]);
    setEditingPage(null);
    setIsCreating(false);
    setShowPreview(false);
    setPageTab('static');
  }

  function openCreate() {
    resetForm();
    setIsCreating(true);
  }

  function openEdit(page: PageData) {
    setTitle(page.title);
    setHeaderImage(page.header_image ?? '');
    setExternalUrl(page.external_url ?? '');
    setShowInFooter(page.show_in_footer);
    setOrder(page.order?.toString() ?? '');
    setBrandSiteInline(page.brand_site_inline ?? false);
    setShowZapButton(page.show_zap_button ?? false);
    setBuyMeCoffeeUrl(page.buy_me_coffee_url ?? '');

    // Detect HTML page: srcdoc (legacy) OR brand_site is a URL ending in .html (new Blossom flow)
    const isHtmlPage = !!(
      page.brand_site_is_srcdoc ||
      (page.brand_site && /\.html?(\?|$)/i.test(page.brand_site))
    );

    if (isHtmlPage) {
      setBrandSiteUrl('');
      setBrandSiteInline(true);
      setPageTab('html');

      if (page.brand_site_is_srcdoc && page.brand_site) {
        // Legacy: HTML is inline in brand_site
        setBrandSiteHtml(page.brand_site);
      } else if (page.brand_site) {
        // New flow: fetch HTML from Blossom URL
        setBrandSiteHtml(''); // show loading state in editor
        fetch(page.brand_site)
          .then(r => r.text())
          .then(html => setBrandSiteHtml(html))
          .catch(() => toast.error('Could not load HTML from server for editing'));
      }
    } else {
      setBrandSiteUrl(page.brand_site ?? '');
      setBrandSiteHtml('');
      setPageTab('static');
    }

    // Parse blocks from description
    try {
      const parsed = JSON.parse(page.description);
      if (parsed.blocks && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
        setBlocks(parsed.blocks as ContentBlock[]);
      } else {
        setBlocks([emptyBlock('markdown')]);
      }
    } catch {
      // Legacy plain-text description — put it in the first markdown block
      setBlocks([{
        id: makeId(),
        type: 'markdown',
        content: page.description ?? '',
        images: page.gallery_images ?? [],
      }]);
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

    // Delete from Nostr in background
    if (user) {
      (async () => {
        try {
          const created_at = Math.floor(Date.now() / 1000);
          const event = await user.signer.signEvent({
            kind: 5,
            content: '',
            tags: [['a', `38175:${user.pubkey}:${page.id}`], ['k', '38175']],
            created_at,
          });
          await nostr.event(event, { signal: AbortSignal.timeout(5000) });
        } catch { /* silent */ }
      })();
    }
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

  // Block manipulation helpers
  const updateBlock = (idx: number, updated: ContentBlock) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? updated : b));
  };
  const removeBlock = (idx: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
  };
  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };
  const addBlock = (type: BlockType) => {
    setBlocks(prev => [...prev, emptyBlock(type)]);
    // Scroll to bottom of form shortly after
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80);
  };

  async function handleSave() {
    try {
      if (!title.trim()) {
        toast.error('Please enter a page title');
        return;
      }

      if (pageTab === 'html' && !brandSiteHtml.trim()) {
        toast.error('Please upload an HTML file');
        return;
      }

      const slug = editingPage?.id ?? generateSlug(title);

      if (!editingPage) {
        if (RESERVED_SLUGS.has(slug)) {
          toast.error(`"/${slug}" is a reserved route. Use a different title.`);
          return;
        }
        const existing = loadPagesFromStorage();
        if (existing.some(p => p.id === slug)) {
          toast.error(`A page at "/${slug}" already exists.`);
          return;
        }
      }

      const isHtml = pageTab === 'html' && !!brandSiteHtml.trim();

      const allGalleryImages = blocks
        .filter(b => b.type === 'gallery')
        .flatMap(b => b.images);

      // ── For HTML pages: upload to Blossom so ALL visitors can load it ──
      // The HTML is stored as a public file — no relay size limits, no localStorage dependency.
      let publishedHtmlUrl: string | undefined;
      if (isHtml) {
        if (!user) {
          toast.error('You must be logged in to publish an HTML page');
          return;
        }
        const uploadingToast = toast.loading('Uploading HTML file…');
        try {
          const htmlBlob = new Blob([brandSiteHtml.trim()], { type: 'text/html' });
          const htmlFile = new File([htmlBlob], `${slug}.html`, { type: 'text/html' });
          const tags = await uploadFile(htmlFile);
          publishedHtmlUrl = tags[0][1];
          toast.dismiss(uploadingToast);
        } catch {
          toast.dismiss(uploadingToast);
          toast.error('Failed to upload HTML file. Page saved locally only.');
          // Continue — save to localStorage at least
        }
      }

      const descriptionJson = JSON.stringify({ blocks });

      // For HTML pages: brand_site is always the Blossom URL.
      // Never store raw HTML in localStorage — it's too large and causes QuotaExceededError.
      // If the Blossom upload failed, abort rather than trying to save HTML locally.
      if (isHtml && !publishedHtmlUrl) {
        toast.error('Cannot save page: HTML upload to Blossom failed. Please try again.');
        return;
      }

      const pageData: PageData = {
        id: slug,
        title: title.trim(),
        description: descriptionJson,
        header_image: headerImage || undefined,
        gallery_images: allGalleryImages,
        external_url: externalUrl || undefined,
        brand_site: isHtml ? publishedHtmlUrl : (brandSiteUrl.trim() || undefined),
        brand_site_inline: brandSiteInline,
        brand_site_is_srcdoc: false, // always false — HTML lives on Blossom, not inline
        author_pubkey: '',
        created_at: editingPage?.created_at ?? new Date().toISOString(),
        show_in_footer: showInFooter,
        order: order ? parseInt(order) : undefined,
        show_zap_button: showZapButton,
        buy_me_coffee_url: buyMeCoffeeUrl.trim() || undefined,
      };

      // Save lightweight metadata to localStorage — NO HTML content, only the Blossom URL
      const allPages = loadPagesFromStorage();
      savePagesToStorage(
        editingPage
          ? allPages.map(p => p.id === slug ? pageData : p)
          : [...allPages, pageData]
      );

      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['footer-pages'] });
      queryClient.invalidateQueries({ queryKey: ['page', slug] });
      toast.success(editingPage ? 'Page updated!' : 'Page created!');
      resetForm();

      // Publish to Nostr
      if (user) {
        (async () => {
          try {
            const created_at = Math.floor(Date.now() / 1000);
            const event = await user.signer.signEvent({
              kind: 38175,
              content: descriptionJson,
              tags: [
                ['d', slug],
                ['title', title.trim()],
                ['t', 'custom-page'],
                ['published_at', String(created_at)],
                ...(headerImage ? [['header', headerImage]] : []),
                ...(externalUrl ? [['r', externalUrl]] : []),
                ...(showInFooter ? [['footer', 'true']] : []),
                ...(order ? [['order', order]] : []),
                // For HTML: store the Blossom URL directly in the tag — no size limit
                ...(isHtml && publishedHtmlUrl
                  ? [['brand-site', publishedHtmlUrl]]
                  : isHtml && !publishedHtmlUrl
                  ? [['brand-site', '__html__']]
                  : brandSiteUrl.trim()
                  ? [['brand-site', brandSiteUrl.trim()]]
                  : []),
                ...(brandSiteInline ? [['brand-site-inline', 'true']] : []),
                ...(showZapButton ? [['zap-button', 'true']] : []),
                ...(buyMeCoffeeUrl.trim() ? [['buy-me-coffee', buyMeCoffeeUrl.trim()]] : []),
                ...allGalleryImages.map(url => ['image', url]),
              ],
              created_at,
            });
            await nostr.event(event, { signal: AbortSignal.timeout(8000) });
            toast.success('Page published to Nostr ✓', { duration: 3000 });
          } catch (e) {
            toast.error(`Nostr publish failed: ${String(e).slice(0, 80)}. Page is saved locally.`);
          }
        })();
      }
    } catch (err) {
      toast.error('Error saving page: ' + String(err));
    }
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

            {/* ── Page Title — always visible ── */}
            <div className="space-y-2">
              <Label>Page Title *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="About Us, Contact, Download..."
              />
              {title && (
                <p className="text-xs text-muted-foreground">
                  URL: <span className="font-mono">/{editingPage?.id ?? generateSlug(title)}</span>
                </p>
              )}
            </div>

            {/* ── Page Type Tabs ── */}
            <Tabs value={pageTab} onValueChange={v => setPageTab(v as 'static' | 'html')}>
              <TabsList className="w-full h-auto p-1 grid grid-cols-2">
                <TabsTrigger value="static" className="flex flex-col items-center gap-1 py-3 h-auto" onClick={() => setBrandSiteInline(false)}>
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold text-sm">Static Page</span>
                  <span className="text-xs font-normal opacity-70 leading-tight text-center">Text, images &amp; content blocks</span>
                </TabsTrigger>
                <TabsTrigger value="html" className="flex flex-col items-center gap-1 py-3 h-auto" onClick={() => setBrandSiteInline(true)}>
                  <FileCode className="h-4 w-4" />
                  <span className="font-semibold text-sm">HTML Upload</span>
                  <span className="text-xs font-normal opacity-70 leading-tight text-center">Upload &amp; edit a custom HTML file</span>
                </TabsTrigger>
              </TabsList>

              {/* ════════════════════════════════
                  STATIC PAGE TAB
              ════════════════════════════════ */}
              <TabsContent value="static" className="space-y-6 mt-6">

                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 px-4 py-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>A <strong>Static Page</strong> is built with content blocks — text, galleries, and media. It uses your site's header menu and style. Perfect for About, Contact, or any regular page.</span>
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

                {/* Content Blocks */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Content Blocks</Label>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Build your page with text, image galleries, and media showcases.
                  </p>
                  {blocks.length === 0 && (
                    <div className="border border-dashed rounded-xl p-6 text-center text-sm text-muted-foreground">
                      No content blocks yet. Add one below.
                    </div>
                  )}
                  {blocks.map((block, idx) => (
                    <BlockEditor
                      key={block.id}
                      block={block}
                      index={idx}
                      total={blocks.length}
                      onChange={updated => updateBlock(idx, updated)}
                      onRemove={() => removeBlock(idx)}
                      onMoveUp={() => moveBlock(idx, -1)}
                      onMoveDown={() => moveBlock(idx, 1)}
                      uploadFile={uploadFile}
                    />
                  ))}
                  <AddBlockPicker onAdd={addBlock} />
                </div>

                {/* Page Website URL (for static pages) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Link to external website (optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={brandSiteUrl}
                    onChange={e => setBrandSiteUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Shows a "View Page Site" button on the page.</p>
                </div>

                {/* External URL */}
                <div className="space-y-2">
                  <Label>External URL (optional)</Label>
                  <Input type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://example.com" />
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2">
                  <Checkbox id="footer-static" checked={showInFooter} onCheckedChange={v => setShowInFooter(v as boolean)} />
                  <Label htmlFor="footer-static">Show in footer</Label>
                </div>
                {showInFooter && (
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="1" min="1" />
                  </div>
                )}

                {/* Zap + Coffee */}
                <div className="flex items-center gap-2">
                  <Checkbox id="zap-static" checked={showZapButton} onCheckedChange={v => setShowZapButton(v as boolean)} />
                  <Label htmlFor="zap-static" className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-orange-500" /> Show Zap button</Label>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Coffee className="h-3.5 w-3.5" /> Buy Me a Coffee URL (optional)</Label>
                  <Input type="url" value={buyMeCoffeeUrl} onChange={e => setBuyMeCoffeeUrl(e.target.value)} placeholder="https://buymeacoffee.com/..." />
                </div>

              </TabsContent>

              {/* ════════════════════════════════
                  HTML UPLOAD TAB
              ════════════════════════════════ */}
              <TabsContent value="html" className="space-y-6 mt-6">

                <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800 px-4 py-3 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                  <FileCode className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span><strong>HTML Upload</strong> shows <em>only</em> your HTML file below the header menu — no other content blocks, no page title, no footer extras. The HTML file is the entire page. Use this for fully custom designs, landing pages, or download pages.</span>
                </div>

                {/* HTML upload / editor */}
                <div className="space-y-3">
                  <input ref={htmlFileRef} type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlFileUpload} />
                  {brandSiteHtml ? (
                    <HtmlEditor
                      html={brandSiteHtml}
                      onChange={setBrandSiteHtml}
                      uploadFile={uploadFile}
                    />
                  ) : (
                    <div
                      className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
                      onClick={() => htmlFileRef.current?.click()}
                    >
                      <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Upload className="h-7 w-7 text-indigo-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Click to upload your HTML file</p>
                        <p className="text-xs text-muted-foreground mt-1">Accepts .html and .htm files</p>
                      </div>
                      <Button type="button" variant="outline">
                        <Upload className="h-4 w-4 mr-2" /> Choose HTML file
                      </Button>
                    </div>
                  )}
                </div>

                {/* HTML pages always fill the full screen below the header — no toggle needed */}

                {/* Footer */}
                <div className="flex items-center gap-2">
                  <Checkbox id="footer-html" checked={showInFooter} onCheckedChange={v => setShowInFooter(v as boolean)} />
                  <Label htmlFor="footer-html">Show in footer</Label>
                </div>
                {showInFooter && (
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="1" min="1" />
                  </div>
                )}

                {/* Zap + Coffee */}
                <div className="flex items-center gap-2">
                  <Checkbox id="zap-html" checked={showZapButton} onCheckedChange={v => setShowZapButton(v as boolean)} />
                  <Label htmlFor="zap-html" className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-orange-500" /> Show Zap button (floating)</Label>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Coffee className="h-3.5 w-3.5" /> Buy Me a Coffee URL (optional)</Label>
                  <Input type="url" value={buyMeCoffeeUrl} onChange={e => setBuyMeCoffeeUrl(e.target.value)} placeholder="https://buymeacoffee.com/..." />
                </div>

              </TabsContent>
            </Tabs>

            {/* ── Actions — always visible ── */}
            <div className="flex gap-2 pt-2 flex-wrap border-t">
              <Button type="button" onClick={handleSave} className="mt-2">
                {editingPage ? 'Update Page' : 'Create Page'}
              </Button>
              <Button type="button" variant="outline" className="mt-2" onClick={() => setShowPreview(true)} disabled={!title.trim()}>
                <Eye className="h-4 w-4 mr-2" /> Preview Page
              </Button>
              <Button type="button" variant="ghost" className="mt-2" onClick={resetForm}>
                Cancel
              </Button>
            </div>

          </CardContent>
        </Card>
      )}

      {/* ── Pages List ── */}
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
              {pages.map(page => {
                // Count blocks to show info badges
                let blockCount = 0;
                let hasMedia = false;
                let hasGallery = false;
                try {
                  const parsed = JSON.parse(page.description);
                  if (Array.isArray(parsed.blocks)) {
                    blockCount = parsed.blocks.length;
                    hasMedia = parsed.blocks.some((b: ContentBlock) => b.type === 'media');
                    hasGallery = parsed.blocks.some((b: ContentBlock) => b.type === 'gallery');
                  }
                } catch { /* legacy page */ }

                return (
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
                        {blockCount > 0 && (
                          <Badge variant="secondary" className="text-xs">{blockCount} block{blockCount !== 1 ? 's' : ''}</Badge>
                        )}
                        {hasMedia && (
                          <Badge variant="outline" className="text-xs text-teal-600 border-teal-300">
                            <ImageIcon className="h-2.5 w-2.5 mr-1" />Media
                          </Badge>
                        )}
                        {hasGallery && (
                          <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-300">
                            <GalleryHorizontal className="h-2.5 w-2.5 mr-1" />Gallery
                          </Badge>
                        )}
                        {page.show_in_footer && <Badge variant="secondary" className="text-xs">Footer</Badge>}
                        {page.brand_site_is_srcdoc && <Badge variant="outline" className="text-xs text-purple-600 border-purple-300"><FileCode className="h-3 w-3 mr-1" />HTML</Badge>}
                        {page.brand_site && !page.brand_site_is_srcdoc && <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />Site</Badge>}
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Page Preview Dialog ── */}
      {showPreview && (() => {
        const slug = editingPage?.id ?? generateSlug(title);
        const isHtml = !!brandSiteHtml.trim();
        const allGalleryImages = blocks.filter(b => b.type === 'gallery').flatMap(b => b.images);
        const previewPage = {
          id: slug,
          title: title.trim() || 'Untitled Page',
          description: JSON.stringify({ blocks }),
          header_image: headerImage || undefined,
          gallery_images: allGalleryImages,
          external_url: externalUrl || undefined,
          brand_site: isHtml ? brandSiteHtml.trim() : (brandSiteUrl.trim() || undefined),
          brand_site_inline: brandSiteInline,
          brand_site_is_srcdoc: isHtml,
          author_pubkey: '',
          created_at: new Date().toISOString(),
          show_in_footer: showInFooter,
          order: order ? parseInt(order) : undefined,
          show_zap_button: showZapButton,
          buy_me_coffee_url: buyMeCoffeeUrl.trim() || undefined,
        };
        return (
          <PagePreviewDialog
            open={showPreview}
            onClose={() => setShowPreview(false)}
            page={previewPage}
          />
        );
      })()}

    </div>
  );
}
