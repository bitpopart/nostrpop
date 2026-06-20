/**
 * MediaGeneratorAdmin
 *
 * Admin panel for configuring the floating Media Generator buttons per page.
 * For each page the admin can enable/disable up to 4 buttons (Merch, Download, Create, Zap)
 * and select which products / download items / card templates are shown in each popup.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAllMediaGenConfigs,
  useSaveMediaGenConfig,
  ALL_PAGES,
  DEFAULT_PAGE_CONFIG,
  type MediaGenPageConfig,
  type DownloadItem,
} from '@/hooks/useMediaGenerator';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useCardTemplates } from '@/hooks/useCardTemplates';
import { useToast } from '@/hooks/useToast';
import {
  ShoppingBag,
  Download,
  PenLine,
  Zap,
  ChevronLeft,
  Save,
  LayoutGrid,
  Plus,
  Trash2,
  Loader2,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

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

const DOWNLOAD_TYPES = [
  { value: 'gif', label: 'GIF' },
  { value: 'wallpaper', label: 'Wallpaper' },
  { value: 'desktop', label: 'Desktop Wallpaper' },
  { value: 'coloring', label: 'Coloring Page' },
  { value: 'banner', label: 'Banner' },
  { value: 'other', label: 'Other' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function DownloadItemEditor({
  items,
  onChange,
}: {
  items: DownloadItem[];
  onChange: (items: DownloadItem[]) => void;
}) {
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newThumb, setNewThumb] = useState('');
  const [newType, setNewType] = useState('other');

  const addItem = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;
    const item: DownloadItem = {
      id: `dl-${Date.now()}`,
      label: newLabel.trim(),
      url: newUrl.trim(),
      thumb: newThumb.trim() || undefined,
      type: newType,
    };
    onChange([...items, item]);
    setNewLabel('');
    setNewUrl('');
    setNewThumb('');
    setNewType('other');
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Add downloadable files for this page. Users can download them directly from the popup.
      </p>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
            >
              {item.thumb ? (
                <img
                  src={item.thumb}
                  alt={item.label}
                  className="w-8 h-8 object-cover rounded"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <ImageIcon className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.url}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {item.type}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-red-500 hover:text-red-700 shrink-0"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      <div className="border rounded-lg p-3 space-y-2 bg-background">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Add New Download
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Label (e.g. Travel Wallpaper)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="col-span-2 text-sm"
          />
          <Input
            placeholder="File URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="col-span-2 text-sm"
          />
          <Input
            placeholder="Thumbnail URL (optional)"
            value={newThumb}
            onChange={(e) => setNewThumb(e.target.value)}
            className="text-sm"
          />
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOWNLOAD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1"
          onClick={addItem}
          disabled={!newLabel.trim() || !newUrl.trim()}
        >
          <Plus className="w-3 h-3" />
          Add Download Item
        </Button>
      </div>
    </div>
  );
}

// ─── Page Config Editor ───────────────────────────────────────────────────────

interface PageEditorProps {
  slug: string;
  label: string;
  initialConfig: MediaGenPageConfig;
  onSave: (config: MediaGenPageConfig) => void;
  isSaving: boolean;
  onBack: () => void;
}

function PageEditor({ slug, label, initialConfig, onSave, isSaving, onBack }: PageEditorProps) {
  const [config, setConfig] = useState<MediaGenPageConfig>(initialConfig);
  const { data: products, isLoading: productsLoading } = useMarketplaceProducts();
  const { data: templates, isLoading: templatesLoading } = useCardTemplates();

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const toggleButton = (key: keyof MediaGenPageConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          All Pages
        </Button>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{label}</h3>
          <p className="text-xs text-muted-foreground">{slug}</p>
        </div>
        <Badge variant={enabledCount > 0 ? 'default' : 'secondary'}>
          {enabledCount} button{enabledCount !== 1 ? 's' : ''} active
        </Badge>
        <Button
          size="sm"
          onClick={() => onSave(config)}
          disabled={isSaving}
          className="gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          Save
        </Button>
      </div>

      <Tabs defaultValue="merch" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          {(['merch', 'download', 'create', 'zap'] as const).map((key) => (
            <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
              {BUTTON_ICONS[key]}
              <span className="hidden sm:inline">{BUTTON_LABELS[key].split(' ')[0]}</span>
              {config[key].enabled && (
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              )}
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
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
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
                <DownloadItemEditor
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
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !templates?.length ? (
                  <div className="text-center py-4 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No card templates found. Add templates in the Cards → Templates section.
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
                Uses the admin's Lightning address automatically.
              </CardDescription>
            </CardHeader>
            {config.zap.enabled && (
              <CardContent>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-orange-800 dark:text-orange-200">
                  <Zap className="w-4 h-4 inline mr-1" />
                  The Zap button will use the admin's Lightning address (traveltelly@primal.net).
                  Users can send any amount of sats directly.
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MediaGeneratorAdmin() {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const { data: allConfigs, isLoading } = useAllMediaGenConfigs();
  const { save, isPending: isSaving } = useSaveMediaGenConfig();
  const { toast } = useToast();

  const handleSave = (config: MediaGenPageConfig) => {
    if (!selectedPage) return;
    save(selectedPage, config, {
      onSuccess: () => {
        toast({ title: 'Saved!', description: `Media Generator config saved for ${selectedPage}` });
      },
      onError: (err) => {
        toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
      },
    });
  };

  if (selectedPage) {
    const pageInfo = ALL_PAGES.find((p) => p.slug === selectedPage)!;
    const config = allConfigs?.[selectedPage] ?? DEFAULT_PAGE_CONFIG;
    return (
      <PageEditor
        slug={selectedPage}
        label={pageInfo.label}
        initialConfig={config}
        onSave={handleSave}
        isSaving={isSaving}
        onBack={() => setSelectedPage(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-pink-600" />
            <CardTitle>Media Generator</CardTitle>
          </div>
          <CardDescription>
            Configure floating action buttons (Merch, Download, Create, Zap) for each page.
            Click a page to manage its buttons.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_PAGES.map((page) => {
                const cfg = allConfigs?.[page.slug] ?? DEFAULT_PAGE_CONFIG;
                const activeButtons = (['merch', 'download', 'create', 'zap'] as const).filter(
                  (k) => cfg[k].enabled
                );

                return (
                  <button
                    key={page.slug}
                    onClick={() => setSelectedPage(page.slug)}
                    className="text-left p-3 rounded-xl border border-border hover:border-pink-400 hover:shadow-md transition-all group bg-background"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm group-hover:text-pink-600 transition-colors">
                          {page.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{page.slug}</p>
                      </div>
                      {activeButtons.length > 0 ? (
                        <Badge
                          variant="default"
                          className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {activeButtons.length} active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
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
                            cfg[key].enabled
                              ? 'bg-pink-100 border-pink-300 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                              : 'bg-muted border-transparent text-muted-foreground'
                          }`}
                        >
                          {BUTTON_ICONS[key]}
                          <span className="capitalize">{key}</span>
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
