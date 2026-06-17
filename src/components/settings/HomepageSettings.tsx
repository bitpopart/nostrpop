import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import type { HomepageSection, HomepageButton, HomepageSettings, SiteBanner, BannerStyle, GridTile, HomepageView } from '@/hooks/useHomepageSettings';
import {
  Home,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Palette,
  CreditCard,
  Rss,
  FolderKanban,
  Users,
  FileText,
  Download,
  Plus,
  Trash2,
  MousePointerClick,
  ChevronUp,
  ChevronDown,
  Megaphone,
  Sparkles,
  Gift,
  MapPin,
  Star,
  Zap,
  Heart,
  Music,
  Camera,
  ShoppingCart,
  Globe,
  Brush,
  Pencil,
  Wand2,
  Play,
  Clapperboard,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  Ban,
  LayoutGrid,
  Link as LinkIcon,
} from 'lucide-react';

const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: 'nostr-projects',
    title: 'Nostr Projects',
    subtitle: 'Join collaborative art - Select an image & pay in sats',
    icon: 'Users',
    enabled: false,
    order: 0,
  },
  {
    id: 'art',
    title: 'Art',
    subtitle: 'Browse artwork gallery',
    icon: 'Palette',
    enabled: true,
    order: 1,
  },
  {
    id: 'projects',
    title: 'Projects',
    subtitle: 'By BitPopArt',
    icon: 'FolderKanban',
    enabled: true,
    order: 2,
  },
  {
    id: 'cards',
    title: 'Cards',
    subtitle: 'Send a positive vibe to someone',
    icon: 'CreditCard',
    enabled: true,
    order: 3,
  },
  {
    id: 'free-downloads',
    title: 'Free Downloads',
    subtitle: 'Wallpapers, GIFs & Animations — all free',
    icon: 'Download',
    enabled: true,
    order: 4,
  },
  {
    id: 'news',
    title: 'Nostr News',
    subtitle: 'Latest updates and articles',
    icon: 'Rss',
    enabled: true,
    order: 5,
  },
  {
    id: 'pages',
    title: 'Pages',
    subtitle: 'Explore custom content',
    icon: 'FileText',
    enabled: false,
    order: 6,
  },
];

const DEFAULT_BUTTONS: HomepageButton[] = [
  {
    id: 'btn-start-painting',
    label: 'Start Painting',
    url: '/canvas',
    variant: 'primary',
    isHero: true,
    afterSectionId: null,
    order: 0,
  },
  {
    id: 'btn-visit-shop',
    label: 'Visit Shop',
    url: '/shop',
    variant: 'outline',
    isHero: true,
    afterSectionId: null,
    order: 1,
  },
  {
    id: 'btn-pop-tour',
    label: 'Pop Tour',
    url: '/popup',
    variant: 'accent',
    isHero: true,
    afterSectionId: null,
    order: 2,
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  FolderKanban,
  Palette,
  CreditCard,
  Rss,
  FileText,
  Download,
};

const VARIANT_LABEL: Record<HomepageButton['variant'], string> = {
  primary: 'Primary (filled)',
  outline: 'Outline',
  accent: 'Accent (orange)',
};

const ICON_NONE = '__none__';

/** All icons available to pick for a button */
const BUTTON_ICON_OPTIONS: { value: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: ICON_NONE, label: 'Auto (based on style)', Icon: Ban },
  { value: 'Sparkles', label: 'Sparkles ✨', Icon: Sparkles },
  { value: 'Wand2', label: 'Magic Wand 🪄', Icon: Wand2 },
  { value: 'Brush', label: 'Brush 🖌️', Icon: Brush },
  { value: 'Pencil', label: 'Pencil ✏️', Icon: Pencil },
  { value: 'Palette', label: 'Palette 🎨', Icon: Palette },
  { value: 'Image', label: 'Image 🖼️', Icon: ImageIcon },
  { value: 'Camera', label: 'Camera 📷', Icon: Camera },
  { value: 'Clapperboard', label: 'Studio 🎬', Icon: Clapperboard },
  { value: 'Play', label: 'Play ▶️', Icon: Play },
  { value: 'Music', label: 'Music 🎵', Icon: Music },
  { value: 'ShoppingCart', label: 'Shop 🛒', Icon: ShoppingCart },
  { value: 'Gift', label: 'Gift 🎁', Icon: Gift },
  { value: 'Star', label: 'Star ⭐', Icon: Star },
  { value: 'Heart', label: 'Heart ❤️', Icon: Heart },
  { value: 'Zap', label: 'Zap ⚡', Icon: Zap },
  { value: 'Globe', label: 'Globe 🌍', Icon: Globe },
  { value: 'MapPin', label: 'Map Pin 📍', Icon: MapPin },
  { value: 'Users', label: 'Community 👥', Icon: Users },
  { value: 'Download', label: 'Download ⬇️', Icon: Download },
  { value: 'Rss', label: 'News / RSS 📡', Icon: Rss },
  { value: 'FolderKanban', label: 'Projects 📂', Icon: FolderKanban },
  { value: 'FileText', label: 'Page 📄', Icon: FileText },
  { value: 'CreditCard', label: 'Cards 💳', Icon: CreditCard },
  { value: 'ArrowRight', label: 'Arrow →', Icon: ArrowRight },
  { value: 'ExternalLink', label: 'External Link 🔗', Icon: ExternalLink },
];

/** Resolve an icon component by name */
const BUTTON_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = Object.fromEntries(
  BUTTON_ICON_OPTIONS.filter(o => o.value !== ICON_NONE).map(o => [o.value, o.Icon])
);

const BANNER_STYLE_LABEL: Record<BannerStyle, string> = {
  orange: 'Orange (default)',
  blue:   'Blue',
  green:  'Green',
  red:    'Red',
  purple: 'Purple',
  dark:   'Dark',
};

const BANNER_STYLE_PREVIEW: Record<BannerStyle, string> = {
  orange: 'bg-gradient-to-r from-orange-500 to-yellow-400',
  blue:   'bg-gradient-to-r from-blue-600 to-cyan-400',
  green:  'bg-gradient-to-r from-emerald-600 to-teal-400',
  red:    'bg-gradient-to-r from-red-600 to-pink-500',
  purple: 'bg-gradient-to-r from-purple-700 to-indigo-500',
  dark:   'bg-gradient-to-r from-gray-900 to-gray-700',
};

const PRESET_BANNERS: Omit<SiteBanner, 'id' | 'enabled'>[] = [
  {
    label: 'Art Page Banner',
    text: '🎨 Explore original Pop Art — browse the full gallery',
    url: '/art',
    urlLabel: 'View Art',
    style: 'orange',
  },
  {
    label: 'Free Downloads Banner',
    text: '🎁 Free wallpapers, GIFs & animations — download now, no signup needed!',
    url: '/free',
    urlLabel: 'Free Downloads',
    style: 'green',
  },
  {
    label: 'Shop Banner',
    text: '🛍️ New items in the shop — get your Pop Art prints & merchandise',
    url: '/shop',
    urlLabel: 'Visit Shop',
    style: 'purple',
  },
  {
    label: 'Studio Banner',
    text: '✏️ PopArt is for everyone — create your own designs, be free!',
    url: '/studio',
    urlLabel: 'Open Studio',
    style: 'blue',
  },
  {
    label: 'Community Banner',
    text: '🌍 Join the PopFans community — share your art, connect with creators',
    url: '/community',
    urlLabel: 'Join Now',
    style: 'dark',
  },
];

function generateId() {
  return `btn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateBannerId() {
  return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── ButtonEditor is a TOP-LEVEL component so React never remounts it on parent re-renders ───
interface ButtonEditorProps {
  btn: HomepageButton;
  onUpdate: (id: string, changes: Partial<HomepageButton>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
}

function ButtonEditor({ btn, onUpdate, onDelete, onMove }: ButtonEditorProps) {
  const selectedIconEntry = BUTTON_ICON_OPTIONS.find(o => o.value === (btn.icon ?? ICON_NONE));
  const PreviewIcon = selectedIconEntry?.Icon ?? Ban;

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-xs shrink-0">
          {btn.isHero ? 'Hero' : 'Between sections'}
        </Badge>
        <div className="flex gap-1 ml-auto">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMove(btn.id, 'up')}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onMove(btn.id, 'down')}>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(btn.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Button Label</Label>
          <Input
            value={btn.label}
            onChange={e => onUpdate(btn.id, { label: e.target.value })}
            placeholder="e.g. Start Painting"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">URL / Link</Label>
          <Input
            value={btn.url}
            onChange={e => onUpdate(btn.id, { url: e.target.value })}
            placeholder="e.g. /nostr or https://..."
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">Style</Label>
          <Select
            value={btn.variant}
            onValueChange={v => onUpdate(btn.id, { variant: v as HomepageButton['variant'] })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VARIANT_LABEL) as HomepageButton['variant'][]).map(v => (
                <SelectItem key={v} value={v}>{VARIANT_LABEL[v]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Icon</Label>
          <Select
            value={btn.icon ?? ICON_NONE}
            onValueChange={v => onUpdate(btn.id, { icon: v === ICON_NONE ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue>
                <span className="flex items-center gap-1.5">
                  {btn.icon
                    ? <PreviewIcon className="h-3.5 w-3.5 shrink-0" />
                    : null}
                  {selectedIconEntry?.label ?? 'Auto (based on style)'}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {BUTTON_ICON_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <opt.Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HomepageSettings() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();
  const adminPubkey = getAdminPubkeyHex();
  const queryClient = useQueryClient();

  const { data: nostrSettings, refetch } = useQuery({
    queryKey: ['homepage-settings', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query([{
        kinds: [30078],
        authors: [adminPubkey],
        '#d': ['com.bitpopart.homepage-settings'],
        limit: 1,
      }], { signal });

      if (events.length > 0 && events[0].content) {
        try {
          const parsed = JSON.parse(events[0].content);
          if (Array.isArray(parsed)) {
            return { sections: parsed as HomepageSection[], buttons: DEFAULT_BUTTONS };
          } else if (parsed && 'sections' in parsed) {
            return parsed as HomepageSettings;
          }
        } catch (e) {
          console.error('Failed to parse homepage settings from Nostr:', e);
        }
      }
      return { sections: DEFAULT_SECTIONS, buttons: DEFAULT_BUTTONS };
    },
    enabled: !!adminPubkey,
    staleTime: 30000, // Don't refetch within 30 s to avoid overwriting local edits
  });

  const [sections, setSections] = useState<HomepageSection[]>(nostrSettings?.sections || DEFAULT_SECTIONS);
  const [buttons, setButtons] = useState<HomepageButton[]>(nostrSettings?.buttons || DEFAULT_BUTTONS);
  const [banners, setBanners] = useState<SiteBanner[]>(nostrSettings?.banners || []);
  const [gridTiles, setGridTiles] = useState<GridTile[]>(nostrSettings?.gridTiles || []);
  const [defaultView, setDefaultView] = useState<HomepageView>(nostrSettings?.defaultView || 'gallery');
  const [activeTab, setActiveTab] = useState<'sections' | 'buttons' | 'banners' | 'grid'>('sections');

  // Track whether the user has made unsaved local changes.
  // While dirty, we must NOT let a background query refetch overwrite local state.
  const isDirty = useRef(false);

  useEffect(() => {
    // Only sync from the server when there are no unsaved local edits.
    if (!nostrSettings || isDirty.current) return;

    // Merge: ensure any DEFAULT_SECTIONS not yet in saved settings are added
    const savedSections = nostrSettings.sections || DEFAULT_SECTIONS;
    const savedIds = new Set(savedSections.map(s => s.id));
    const merged = [...savedSections];

    for (const def of DEFAULT_SECTIONS) {
      if (savedIds.has(def.id)) continue;
      // Insert at the position matching the default order
      const defaultOrder = DEFAULT_SECTIONS.map(s => s.id);
      const defPos = defaultOrder.indexOf(def.id);
      const followingIds = defaultOrder.slice(defPos + 1);
      const insertBeforeIdx = merged.findIndex(s => followingIds.includes(s.id));
      if (insertBeforeIdx !== -1) {
        merged.splice(insertBeforeIdx, 0, { ...def });
      } else {
        merged.push({ ...def });
      }
    }

    setSections(merged.map((s, i) => ({ ...s, order: i })));
    setButtons(nostrSettings.buttons || DEFAULT_BUTTONS);
    setBanners(nostrSettings.banners || []);
    setGridTiles((nostrSettings.gridTiles || []).sort((a, b) => a.order - b.order));
    setDefaultView(nostrSettings.defaultView || 'gallery');
  }, [nostrSettings]);

  // ─── Section handlers ────────────────────────────────────────────────────
  const handleToggle = (id: string) => {
    isDirty.current = true;
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSectionField = (id: string, field: 'title' | 'subtitle', value: string) => {
    isDirty.current = true;
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    isDirty.current = true;
    setSections(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    isDirty.current = true;
    setSections(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  // ─── Button handlers ─────────────────────────────────────────────────────
  const addHeroButton = () => {
    isDirty.current = true;
    const newBtn: HomepageButton = {
      id: generateId(),
      label: 'New Button',
      url: '/',
      variant: 'outline',
      isHero: true,
      afterSectionId: null,
      order: buttons.filter(b => b.isHero).length,
    };
    setButtons(prev => [...prev, newBtn]);
  };

  const addInterButton = (afterSectionId: string) => {
    isDirty.current = true;
    const newBtn: HomepageButton = {
      id: generateId(),
      label: 'New Button',
      url: '/',
      variant: 'outline',
      isHero: false,
      afterSectionId,
      order: buttons.filter(b => b.afterSectionId === afterSectionId).length,
    };
    setButtons(prev => [...prev, newBtn]);
  };

  const updateButton = (id: string, changes: Partial<HomepageButton>) => {
    isDirty.current = true;
    setButtons(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
  };

  const deleteButton = (id: string) => {
    isDirty.current = true;
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const moveButton = (id: string, dir: 'up' | 'down') => {
    isDirty.current = true;
    setButtons(prev => {
      const btn = prev.find(b => b.id === id);
      if (!btn) return prev;

      const isSameGroup = (b: HomepageButton) =>
        b.isHero === btn.isHero && b.afterSectionId === btn.afterSectionId;

      const group = prev.filter(isSameGroup).sort((a, b) => a.order - b.order);
      const idx = group.findIndex(b => b.id === id);

      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === group.length - 1) return prev;

      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      [group[idx], group[swapIdx]] = [group[swapIdx], group[idx]];

      const updatedGroup = group.map((b, i) => ({ ...b, order: i }));
      const others = prev.filter(b => !isSameGroup(b));
      return [...others, ...updatedGroup];
    });
  };

  // ─── Grid tile handlers ───────────────────────────────────────────────────
  const addGridTile = () => {
    isDirty.current = true;
    const newTile: GridTile = {
      id: `tile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      imageUrl: '',
      linkUrl: '/',
      alt: '',
      order: gridTiles.length,
    };
    setGridTiles(prev => [...prev, newTile]);
  };

  const updateGridTile = (id: string, changes: Partial<GridTile>) => {
    isDirty.current = true;
    setGridTiles(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  };

  const deleteGridTile = (id: string) => {
    isDirty.current = true;
    setGridTiles(prev => prev.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i })));
  };

  const moveGridTile = (id: string, dir: 'up' | 'down') => {
    isDirty.current = true;
    setGridTiles(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(t => t.id === id);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === sorted.length - 1) return prev;
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      return sorted.map((t, i) => ({ ...t, order: i }));
    });
  };

  // ─── Banner handlers ──────────────────────────────────────────────────────
  const addPresetBanner = (preset: Omit<SiteBanner, 'id' | 'enabled'>) => {
    isDirty.current = true;
    setBanners(prev => [...prev, { ...preset, id: generateBannerId(), enabled: false }]);
  };

  const addCustomBanner = () => {
    isDirty.current = true;
    setBanners(prev => [...prev, {
      id: generateBannerId(),
      label: 'Custom Banner',
      text: 'Your message here',
      url: '',
      urlLabel: '',
      style: 'orange',
      enabled: false,
    }]);
  };

  const updateBanner = (id: string, changes: Partial<SiteBanner>) => {
    isDirty.current = true;
    // If activating this banner, deactivate all others first
    if (changes.enabled === true) {
      setBanners(prev => prev.map(b => b.id === id ? { ...b, ...changes } : { ...b, enabled: false }));
    } else {
      setBanners(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
    }
  };

  const deleteBanner = (id: string) => {
    isDirty.current = true;
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  // ─── Save / Reset ─────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!user) { toast.error('Please log in to save homepage settings'); return; }

    const payload: HomepageSettings = {
      sections: sections.map((s, i) => ({ ...s, order: i })),
      buttons,
      banners,
      defaultView,
      gridTiles: gridTiles.map((t, i) => ({ ...t, order: i })),
    };

    publishEvent({
      kind: 30078,
      content: JSON.stringify(payload),
      tags: [['d', 'com.bitpopart.homepage-settings']],
    }, {
      onSuccess: () => {
        isDirty.current = false; // clear dirty flag — safe to sync from server again
        toast.success('Homepage settings saved to Nostr!');
        queryClient.invalidateQueries({ queryKey: ['homepage-settings', adminPubkey] });
        queryClient.invalidateQueries({ queryKey: ['homepage-settings-public', adminPubkey] });
        queryClient.invalidateQueries({ queryKey: ['site-banner', adminPubkey] });
        window.dispatchEvent(new CustomEvent('homepage-settings-updated', { detail: payload }));
        refetch();
      },
      onError: (error) => toast.error('Failed to save settings: ' + error.message),
    });
  };

  const handleReset = () => {
    if (!user) { toast.error('Please log in to reset homepage settings'); return; }
    setSections(DEFAULT_SECTIONS);
    setButtons(DEFAULT_BUTTONS);
    setBanners([]);
    setGridTiles([]);
    setDefaultView('gallery');
    const payload: HomepageSettings = { sections: DEFAULT_SECTIONS, buttons: DEFAULT_BUTTONS, banners: [], gridTiles: [], defaultView: 'gallery' };
    publishEvent({
      kind: 30078,
      content: JSON.stringify(payload),
      tags: [['d', 'com.bitpopart.homepage-settings']],
    }, {
      onSuccess: () => {
        isDirty.current = false; // clear dirty flag — safe to sync from server again
        toast.success('Homepage settings reset to default!');
        queryClient.invalidateQueries({ queryKey: ['homepage-settings', adminPubkey] });
        queryClient.invalidateQueries({ queryKey: ['homepage-settings-public', adminPubkey] });
        queryClient.invalidateQueries({ queryKey: ['site-banner', adminPubkey] });
        refetch();
      },
      onError: (error) => toast.error('Failed to reset settings: ' + error.message),
    });
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homepage Settings</CardTitle>
          <CardDescription>Please log in to manage homepage settings</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const heroButtons = buttons.filter(b => b.isHero).sort((a, b) => a.order - b.order);
  const interButtons = (sectionId: string) =>
    buttons.filter(b => !b.isHero && b.afterSectionId === sectionId).sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Homepage Settings
        </CardTitle>
        <CardDescription>
          Customize sections, order, and buttons on your homepage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Tab switcher */}
        <div className="flex gap-2 border-b pb-3 flex-wrap">
          <Button
            variant={activeTab === 'sections' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('sections')}
          >
            <Home className="h-4 w-4 mr-2" />
            Sections
          </Button>
          <Button
            variant={activeTab === 'buttons' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('buttons')}
          >
            <MousePointerClick className="h-4 w-4 mr-2" />
            Buttons
          </Button>
          <Button
            variant={activeTab === 'banners' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('banners')}
            className="relative"
          >
            <Megaphone className="h-4 w-4 mr-2" />
            Banners
            {banners.some(b => b.enabled) && (
              <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-green-500" title="A banner is active" />
            )}
          </Button>
          <Button
            variant={activeTab === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('grid')}
            className="relative"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Photo Grid
            {gridTiles.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-500 text-white text-[10px]">{gridTiles.length}</span>
            )}
          </Button>
        </div>

        {/* ===== SECTIONS TAB ===== */}
        {activeTab === 'sections' && (
          <div className="space-y-4">
            {sections.map((section, index) => {
              const Icon = ICON_MAP[section.icon];
              return (
                <Card key={section.id} className={!section.enabled ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        {Icon && <Icon className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={section.enabled}
                              onCheckedChange={() => handleToggle(section.id)}
                            />
                            <div className="flex items-center gap-2">
                              {section.enabled
                                ? <Eye className="h-4 w-4 text-green-600" />
                                : <EyeOff className="h-4 w-4 text-gray-400" />}
                              <span className="text-sm font-medium">
                                {section.enabled ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => moveSectionUp(index)} disabled={index === 0}>↑</Button>
                            <Button variant="outline" size="sm" onClick={() => moveSectionDown(index)} disabled={index === sections.length - 1}>↓</Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Section Title</Label>
                            <Input
                              value={section.title}
                              onChange={e => handleSectionField(section.id, 'title', e.target.value)}
                              placeholder="Section title"
                              disabled={!section.enabled}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Section Subtitle</Label>
                            <Input
                              value={section.subtitle}
                              onChange={e => handleSectionField(section.id, 'subtitle', e.target.value)}
                              placeholder="Section subtitle"
                              disabled={!section.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ===== BUTTONS TAB ===== */}
        {activeTab === 'buttons' && (
          <div className="space-y-6">

            {/* Hero buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Top Hero Buttons</h3>
                  <p className="text-xs text-muted-foreground">
                    Shown at the very top of the homepage (e.g. Start Painting, Visit Shop)
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addHeroButton}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {heroButtons.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No hero buttons yet. Add one above.</p>
              )}

              {heroButtons.map(btn => (
                <ButtonEditor
                  key={btn.id}
                  btn={btn}
                  onUpdate={updateButton}
                  onDelete={deleteButton}
                  onMove={moveButton}
                />
              ))}
            </div>

            <Separator />

            {/* Inter-section buttons */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Between-Section Buttons</h3>
                <p className="text-xs text-muted-foreground">
                  Add buttons that appear between homepage section boxes (e.g. after Art, before Cards)
                </p>
              </div>

              {sections.map(section => {
                const sectionInterButtons = interButtons(section.id);
                const Icon = ICON_MAP[section.icon];
                return (
                  <div key={section.id} className="border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-purple-500" />}
                        <span className="text-sm font-medium">After "{section.title}"</span>
                        {!section.enabled && (
                          <Badge variant="secondary" className="text-xs">Hidden</Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addInterButton(section.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add button here
                      </Button>
                    </div>

                    {sectionInterButtons.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {sectionInterButtons.map(btn => (
                          <ButtonEditor
                            key={btn.id}
                            btn={btn}
                            onUpdate={updateButton}
                            onDelete={deleteButton}
                            onMove={moveButton}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No buttons after this section.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== BANNERS TAB ===== */}
        {activeTab === 'banners' && (
          <div className="space-y-6">

            {/* Info */}
            <div className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Megaphone className="h-4 w-4" /> Site Banner
              </p>
              <p className="text-muted-foreground text-xs">
                The active banner shows under the navigation bar on every page. Only one banner can be active at a time.
                When a live auction is running, the auction banner automatically takes over.
              </p>
            </div>

            {/* Preset banners */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Preset Banners</h3>
                  <p className="text-xs text-muted-foreground">Ready-made banners — click to add to your list</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_BANNERS.map(preset => (
                  <div key={preset.label} className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${BANNER_STYLE_PREVIEW[preset.style]}`} />
                      <span className="text-sm font-medium truncate">{preset.label}</span>
                      <span className="text-xs text-muted-foreground truncate hidden sm:block">{preset.text.slice(0, 50)}…</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-7 text-xs"
                      onClick={() => addPresetBanner(preset)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* My banners */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">My Banners</h3>
                  <p className="text-xs text-muted-foreground">Enable one to show it site-wide under the menu</p>
                </div>
                <Button size="sm" variant="outline" onClick={addCustomBanner}>
                  <Plus className="h-3 w-3 mr-1" /> Custom Banner
                </Button>
              </div>

              {banners.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No banners yet. Add a preset or create a custom banner above.
                </p>
              )}

              {banners.map(banner => (
                <div
                  key={banner.id}
                  className={`border-2 rounded-lg p-4 space-y-3 transition-all ${
                    banner.enabled
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                      : 'border-border bg-white dark:bg-gray-900'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.enabled}
                        onCheckedChange={checked => updateBanner(banner.id, { enabled: checked })}
                      />
                      {banner.enabled ? (
                        <Badge className="text-xs bg-green-500 text-white border-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteBanner(banner.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Preview strip */}
                  <div className={`rounded px-3 py-1.5 text-white text-xs font-medium flex items-center gap-2 flex-wrap ${BANNER_STYLE_PREVIEW[banner.style]}`}>
                    <span>{banner.text || 'Preview...'}</span>
                    {banner.urlLabel && (
                      <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/40 text-xs">
                        {banner.urlLabel}
                      </span>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Admin Label</Label>
                      <Input
                        value={banner.label}
                        onChange={e => updateBanner(banner.id, { label: e.target.value })}
                        placeholder="e.g. Art Page Banner"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Style</Label>
                      <Select
                        value={banner.style}
                        onValueChange={v => updateBanner(banner.id, { style: v as BannerStyle })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(BANNER_STYLE_LABEL) as BannerStyle[]).map(s => (
                            <SelectItem key={s} value={s}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${BANNER_STYLE_PREVIEW[s]}`} />
                                {BANNER_STYLE_LABEL[s]}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Banner Text</Label>
                    <Textarea
                      value={banner.text}
                      onChange={e => updateBanner(banner.id, { text: e.target.value })}
                      placeholder="Your message to visitors..."
                      className="text-sm min-h-[60px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Button URL (optional)</Label>
                      <Input
                        value={banner.url ?? ''}
                        onChange={e => updateBanner(banner.id, { url: e.target.value })}
                        placeholder="e.g. /art or https://..."
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Button Label (optional)</Label>
                      <Input
                        value={banner.urlLabel ?? ''}
                        onChange={e => updateBanner(banner.id, { urlLabel: e.target.value })}
                        placeholder="e.g. View Art"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== GRID TAB ===== */}
        {activeTab === 'grid' && (
          <div className="space-y-6">

            {/* Default view picker */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3">
              <div>
                <p className="font-semibold text-sm text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4" /> Default Homepage View
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which view visitors see first when they open the homepage.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'gallery', label: '📋 Gallery (sections)', desc: 'Default rich sections with cards' },
                  { value: 'grid', label: '🖼️ Photo Grid', desc: 'Pure image grid — no text' },
                  { value: 'progress', label: '✏️ Art Progress', desc: '#bitpopart posts feed' },
                ] as { value: HomepageView; label: string; desc: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { isDirty.current = true; setDefaultView(opt.value); }}
                    className={`flex flex-col items-start px-3 py-2 rounded-lg border-2 text-left transition-all text-sm ${
                      defaultView === opt.value
                        ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
                        : 'border-border bg-white dark:bg-gray-900 text-muted-foreground hover:border-purple-300'
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tile list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Photo Grid Tiles</h3>
                  <p className="text-xs text-muted-foreground">
                    Each tile is an image that links somewhere. Paste a direct image URL and a destination link.
                    <br />On mobile 3 columns · desktop 6 columns.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addGridTile}>
                  <Plus className="h-3 w-3 mr-1" /> Add Tile
                </Button>
              </div>

              {/* Live mini-preview */}
              {gridTiles.length > 0 && (
                <div className="rounded-lg overflow-hidden border">
                  <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs text-muted-foreground">Preview</div>
                  <div className="grid grid-cols-6 gap-0.5 bg-gray-200 dark:bg-gray-700 p-0.5">
                    {gridTiles.slice(0, 12).map(tile => (
                      <div key={tile.id} className="aspect-square bg-gray-300 dark:bg-gray-600 overflow-hidden">
                        {tile.imageUrl ? (
                          <img src={tile.imageUrl} alt={tile.alt || ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-3 w-3 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {gridTiles.length > 12 && (
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-muted-foreground col-span-1">
                        +{gridTiles.length - 12}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {gridTiles.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
                  <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No tiles yet. Click "Add Tile" to build your photo grid.
                </div>
              )}

              <div className="space-y-2">
                {[...gridTiles].sort((a, b) => a.order - b.order).map((tile, idx) => (
                  <div key={tile.id} className="border rounded-lg p-3 space-y-2 bg-white dark:bg-gray-900">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Tile {idx + 1}</span>
                      <div className="flex gap-1 ml-auto">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveGridTile(tile.id, 'up')}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveGridTile(tile.id, 'down')}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteGridTile(tile.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Image URL + preview */}
                    <div className="flex gap-2 items-start">
                      <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden border bg-gray-100 dark:bg-gray-800">
                        {tile.imageUrl ? (
                          <img src={tile.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Image URL</Label>
                          <Input
                            value={tile.imageUrl}
                            onChange={e => updateGridTile(tile.id, { imageUrl: e.target.value })}
                            placeholder="https://... (direct image link)"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> Destination URL
                          </Label>
                          <Input
                            value={tile.linkUrl}
                            onChange={e => updateGridTile(tile.id, { linkUrl: e.target.value })}
                            placeholder="e.g. /art or /shop or https://..."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alt text */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Alt text (optional)</Label>
                      <Input
                        value={tile.alt ?? ''}
                        onChange={e => updateGridTile(tile.id, { alt: e.target.value })}
                        placeholder="Describe the image for accessibility"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isPublishing}>
            {isPublishing ? (
              <><Save className="h-4 w-4 mr-2 animate-pulse" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save to Nostr</>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isPublishing}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>

        <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <p className="font-semibold">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Use <strong>Sections</strong> tab to show/hide and reorder homepage sections</li>
            <li>Use <strong>Buttons</strong> tab to manage hero buttons (top of page) and buttons between sections</li>
            <li>Use <strong>Banners</strong> tab to show a banner under the navigation bar on every page — only one can be active at a time</li>
            <li>Use <strong>Photo Grid</strong> tab to build a pure image grid and choose which view loads by default</li>
            <li>When a live auction is running, the auction banner automatically overrides the site banner</li>
            <li>Changes are saved to Nostr and visible to all visitors</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}
