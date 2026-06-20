/**
 * MediaGeneratorAdmin
 *
 * Admin panel for configuring the floating Media Generator buttons per page.
 *
 * Layout priority:
 *  1. Projects section — dynamic (fetched from Nostr) + built-in project pages, shown at top
 *  2. General site pages — the rest of the bitpopart pages
 *
 * For each page the admin can enable/disable up to 4 buttons (Merch, Download, Create, Zap)
 * and select which products / download items / card templates are shown in each popup.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import {
  useAllMediaGenConfigs,
  useSaveMediaGenConfig,
  DEFAULT_PAGE_CONFIG,
  type MediaGenPageConfig,
} from '@/hooks/useMediaGenerator';
import { useProjectPages } from '@/hooks/useProjectPages';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useCardTemplates } from '@/hooks/useCardTemplates';
import { useToast } from '@/hooks/useToast';
import { DownloadPicker } from './DownloadPicker';
import {
  ShoppingBag,
  Download,
  PenLine,
  Zap,
  ChevronLeft,
  Save,
  LayoutGrid,
  Loader2,
  FileText,
  FolderKanban,
  Globe,
} from 'lucide-react';

// ─── Button definitions ────────────────────────────────────────────────────────

const BUTTON_ICONS = {
  merch: <ShoppingBag className="w-4 h-4" />,
  download: <Download className="w-4 h-4" />,
  create: <PenLine className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
};

const BUTTON_LABELS = {
  merch: 'Merch 👕',
  download: 'Download ⬇️',
  create: 'Create ✍️',
  zap: 'Zap ⚡',
};

/** General site pages (non-project) */
const GENERAL_PAGES = [
  { slug: '/', label: 'Home' },
  { slug: '/art', label: 'Art Gallery' },
  { slug: '/shop', label: 'Shop' },
  { slug: '/blog', label: 'Blog / News' },
  { slug: '/popup', label: 'Pop-Up Events' },
  { slug: '/artist', label: 'Artist' },
  { slug: '/projects', label: 'Projects (overview)' },
  { slug: '/fundraising', label: 'Fundraising' },
  { slug: '/vlog', label: 'Vlog' },
  { slug: '/wall', label: 'Wall Gallery' },
  { slug: '/feed', label: 'Feed' },
  { slug: '/community', label: 'Community' },
  { slug: '/badges', label: 'Badges' },
];

// ─── Per-page config editor ───────────────────────────────────────────────────

interface PageEditorProps {
  slug: string;
  label: string;
  thumbnail?: string;
  initialConfig: MediaGenPageConfig;
  onSave: (config: MediaGenPageConfig) => void;
  isSaving: boolean;
  onBack: () => void;
}

function PageEditor({
  slug,
  label,
  thumbnail,
  initialConfig,
  onSave,
  isSaving,
  onBack,
}: PageEditorProps) {
  const [config, setConfig] = useState<MediaGenPageConfig>(initialConfig);
  const { data: products, isLoading: productsLoading } = useMarketplaceProducts();
  const { data: templates, isLoading: templatesLoading } = useCardTemplates();

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const toggleButton = (key: keyof MediaGenPageConfig) => {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  };

  const toggleProductId = (id: string) => {
    const ids = config.merch.productIds;
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setConfig((prev) => ({ ...prev, merch: { ...prev.merch, productIds: next } }));
  };

  const toggleTemplateId = (id: string) => {
    const ids = config.create.templateIds;
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setConfig((prev) => ({ ...prev, create: { ...prev.create, templateIds: next } }));
  };

  const enabledCount = (['merch', 'download', 'create', 'zap'] as const).filter(
    (k) => config[k].enabled
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 shrink-0">
          <ChevronLeft className="h-4 w-4" />
          All Pages
        </Button>
        {thumbnail && (
          <img
            src={thumbnail}
            alt={label}
            className="w-10 h-10 rounded-lg object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight">{label}</h3>
          <p className="text-xs text-muted-foreground">{slug}</p>
        </div>
        <Badge variant={enabledCount > 0 ? 'default' : 'secondary'} className="shrink-0">
          {enabledCount} button{enabledCount !== 1 ? 's' : ''} active
        </Badge>
        <Button
          size="sm"
          onClick={() => onSave(config)}
          disabled={isSaving}
          className="gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 shrink-0"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </Button>
      </div>

      <Tabs defaultValue="merch" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          {(['merch', 'download', 'create', 'zap'] as const).map((key) => (
            <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
              {BUTTON_ICONS[key]}
              <span className="hidden sm:inline">{BUTTON_LABELS[key].split(' ')[0]}</span>
              {config[key].enabled && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* MERCH */}
        <TabsContent value="merch">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-base">Merch Button 👕</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="merch-enabled" className="text-sm">
                    {config.merch.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="merch-enabled"
                    checked={config.merch.enabled}
                    onCheckedChange={() => toggleButton('merch')}
                  />
                </div>
              </div>
              <CardDescription>
                Select products from the Shop to show in the Merch popup for this page.
              </CardDescription>
            </CardHeader>
            {config.merch.enabled && (
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !products?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No products found in the Shop. Add products first.
                  </p>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pr-3">
                      {products.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={config.merch.productIds.includes(p.id)}
                            onCheckedChange={() => toggleProductId(p.id)}
                          />
                          {p.images?.[0] && (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.category}</p>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {p.type}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                {config.merch.productIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {config.merch.productIds.length} product
                    {config.merch.productIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* DOWNLOAD */}
        <TabsContent value="download">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-base">Download Button ⬇️</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dl-enabled" className="text-sm">
                    {config.download.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="dl-enabled"
                    checked={config.download.enabled}
                    onCheckedChange={() => toggleButton('download')}
                  />
                </div>
              </div>
              <CardDescription>
                Add GIFs, wallpapers, desktop backgrounds, and other downloadable files for this
                page.
              </CardDescription>
            </CardHeader>
            {config.download.enabled && (
              <CardContent>
                <DownloadPicker
                  items={config.download.items}
                  onChange={(items) =>
                    setConfig((prev) => ({ ...prev, download: { ...prev.download, items } }))
                  }
                />
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* CREATE */}
        <TabsContent value="create">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenLine className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-base">Create Button ✍️</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="create-enabled" className="text-sm">
                    {config.create.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="create-enabled"
                    checked={config.create.enabled}
                    onCheckedChange={() => toggleButton('create')}
                  />
                </div>
              </div>
              <CardDescription>
                Select card templates users can create from this page.
              </CardDescription>
            </CardHeader>
            {config.create.enabled && (
              <CardContent>
                {templatesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !templates?.length ? (
                  <div className="text-center py-4 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No card templates found. Add templates in Cards → Templates.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pr-3">
                      {templates.map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={config.create.templateIds.includes(t.id)}
                            onCheckedChange={() => toggleTemplateId(t.id)}
                          />
                          <img
                            src={t.coverImage}
                            alt={t.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t.name}</p>
                            {t.category && (
                              <p className="text-xs text-muted-foreground">{t.category}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                )}
                {config.create.templateIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {config.create.templateIds.length} template
                    {config.create.templateIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* ZAP */}
        <TabsContent value="zap">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-base">Zap Button ⚡</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="zap-enabled" className="text-sm">
                    {config.zap.enabled ? 'Enabled' : 'Disabled'}
                  </Label>
                  <Switch
                    id="zap-enabled"
                    checked={config.zap.enabled}
                    onCheckedChange={() => toggleButton('zap')}
                  />
                </div>
              </div>
              <CardDescription>
                Allow visitors to send a Lightning tip directly from this page.
              </CardDescription>
            </CardHeader>
            {config.zap.enabled && (
              <CardContent>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-800 dark:text-orange-200">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Zap button uses bitpopart@walletofsatoshi.com. Users can send any amount of sats.
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Page card (small tile in the grid) ──────────────────────────────────────

function PageCard({
  slug,
  label,
  thumbnail,
  config,
  onClick,
}: {
  slug: string;
  label: string;
  thumbnail?: string;
  config: MediaGenPageConfig;
  onClick: () => void;
}) {
  const activeButtons = (['merch', 'download', 'create', 'zap'] as const).filter(
    (k) => config[k].enabled
  );

  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-border hover:border-pink-400 hover:shadow-md transition-all group bg-background overflow-hidden"
    >
      {/* Thumbnail strip */}
      {thumbnail && (
        <div className="h-20 overflow-hidden bg-muted">
          <img
            src={thumbnail}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm group-hover:text-pink-600 transition-colors leading-tight">
              {label}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{slug}</p>
          </div>
          {activeButtons.length > 0 ? (
            <Badge
              variant="default"
              className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 shrink-0 ml-1"
            >
              {activeButtons.length} ✓
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0 ml-1">
              Off
            </Badge>
          )}
        </div>

        {/* Button pills */}
        <div className="flex flex-wrap gap-1">
          {(['merch', 'download', 'create', 'zap'] as const).map((key) => (
            <span
              key={key}
              className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${
                config[key].enabled
                  ? 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                  : 'bg-muted border-transparent text-muted-foreground opacity-50'
              }`}
            >
              {BUTTON_ICONS[key]}
              <span className="capitalize">{key}</span>
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MediaGeneratorAdmin() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const { data: allConfigs, isLoading: configsLoading } = useAllMediaGenConfigs();
  const { data: projectPages, isLoading: projectsLoading } = useProjectPages();
  const { save, isPending: isSaving } = useSaveMediaGenConfig();
  const { toast } = useToast();

  const isLoading = configsLoading || projectsLoading;

  const handleSave = (config: MediaGenPageConfig) => {
    if (!selectedSlug) return;
    save(selectedSlug, config, {
      onSuccess: () => {
        toast({ title: 'Saved!', description: `Config saved for ${selectedSlug}` });
      },
      onError: (err) => {
        toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
      },
    });
  };

  // All known pages for label/thumbnail lookup
  const allKnownPages = [
    ...(projectPages?.customPages ?? []),
    ...(projectPages?.frl ?? []),
    ...(projectPages?.collab ?? []),
    ...(projectPages?.builtin ?? []),
    ...GENERAL_PAGES.map((p) => ({ ...p, source: 'general' as const, thumbnail: undefined })),
  ];

  if (selectedSlug) {
    const knownPage = allKnownPages.find((p) => p.slug === selectedSlug);
    const pageLabel = knownPage?.label ?? selectedSlug;
    const pageThumbnail = (knownPage as { thumbnail?: string } | undefined)?.thumbnail;
    const config = allConfigs?.[selectedSlug] ?? DEFAULT_PAGE_CONFIG;

    return (
      <PageEditor
        slug={selectedSlug}
        label={pageLabel}
        thumbnail={pageThumbnail}
        initialConfig={config}
        onSave={handleSave}
        isSaving={isSaving}
        onBack={() => setSelectedSlug(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-pink-600" />
            <CardTitle>Media Generator</CardTitle>
          </div>
          <CardDescription>
            Configure floating action buttons (👕 Merch, ⬇️ Download, ✍️ Create, ⚡ Zap) for each
            page. Click a page to manage its buttons.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ─── PROJECTS (priority section) ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <FolderKanban className="w-5 h-5 text-orange-600" />
          <h2 className="font-bold text-lg">Projects</h2>
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 text-xs">
            Primary
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure buttons per project page. New projects created in Admin → Projects appear
          here automatically.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Custom Pages (kind 38175) → /:slug ───────────────── */}
            {/* These are pages like /sneek, /bitcoinfriesland, /gamestr */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-pink-500" />
                Custom Pages
                {projectPages?.customPages && (
                  <Badge variant="secondary" className="text-xs">{projectPages.customPages.length}</Badge>
                )}
                <span className="text-muted-foreground font-normal normal-case tracking-normal">
                  — /sneek, /bitcoinfriesland, /gamestr …
                </span>
              </p>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
              ) : projectPages?.customPages && projectPages.customPages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {projectPages.customPages.map((page) => (
                    <PageCard
                      key={page.slug}
                      slug={page.slug}
                      label={page.label}
                      thumbnail={page.thumbnail}
                      config={allConfigs?.[page.slug] ?? DEFAULT_PAGE_CONFIG}
                      onClick={() => setSelectedSlug(page.slug)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No custom pages found. Create them in Admin → Pages.
                </p>
              )}
            </div>

            {/* ── /projects overview page ─────────────────────────── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <FolderKanban className="w-3 h-3 text-orange-500" />
                Projects Overview Page
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <PageCard
                  slug="/projects"
                  label="Projects Page"
                  config={allConfigs?.['/projects'] ?? DEFAULT_PAGE_CONFIG}
                  onClick={() => setSelectedSlug('/projects')}
                />
              </div>
            </div>

            {/* ── Nostr Collaborative Projects (/nostr-projects/:id) ──── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-orange-500" />
                Collaborative Projects
                {projectPages?.collab && (
                  <Badge variant="secondary" className="text-xs">{projectPages.collab.length}</Badge>
                )}
              </p>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
              ) : projectPages?.collab && projectPages.collab.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {projectPages.collab.map((page) => (
                    <PageCard
                      key={page.slug}
                      slug={page.slug}
                      label={page.label}
                      thumbnail={page.thumbnail}
                      config={allConfigs?.[page.slug] ?? DEFAULT_PAGE_CONFIG}
                      onClick={() => setSelectedSlug(page.slug)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No collaborative projects yet. Create them in Admin → Projects → Nostr Projects.
                </p>
              )}
            </div>

            {/* ── FRL Projects (/frl/:id) ───────────────────────────── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-pink-500" />
                POPArt.frl Projects
                {projectPages?.frl && (
                  <Badge variant="secondary" className="text-xs">{projectPages.frl.length}</Badge>
                )}
              </p>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
              ) : projectPages?.frl && projectPages.frl.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {projectPages.frl.map((page) => (
                    <PageCard
                      key={page.slug}
                      slug={page.slug}
                      label={page.label}
                      thumbnail={page.thumbnail}
                      config={allConfigs?.[page.slug] ?? DEFAULT_PAGE_CONFIG}
                      onClick={() => setSelectedSlug(page.slug)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No FRL projects yet. Create them in Admin → Projects → POPArt.frl.
                </p>
              )}
            </div>

            {/* ── Built-in project pages ────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <FolderKanban className="w-3 h-3" />
                Built-in Project Pages
                <Badge variant="secondary" className="text-xs">{(projectPages?.builtin ?? []).length}</Badge>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {(projectPages?.builtin ?? []).map((page) => (
                  <PageCard
                    key={page.slug}
                    slug={page.slug}
                    label={page.label}
                    config={allConfigs?.[page.slug] ?? DEFAULT_PAGE_CONFIG}
                    onClick={() => setSelectedSlug(page.slug)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* ─── GENERAL SITE PAGES ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-lg">General Site Pages</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Other pages of the BitPopArt site.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {GENERAL_PAGES.map((page) => (
              <PageCard
                key={page.slug}
                slug={page.slug}
                label={page.label}
                config={allConfigs?.[page.slug] ?? DEFAULT_PAGE_CONFIG}
                onClick={() => setSelectedSlug(page.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
