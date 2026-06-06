import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import type { HomepageSection, HomepageButton, HomepageSettings } from '@/hooks/useHomepageSettings';
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
} from 'lucide-react';

const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: 'nostr-projects',
    title: 'Nostr Projects',
    subtitle: 'Join collaborative art - Select an image & pay in sats',
    icon: 'Users',
    enabled: true,
    order: 0,
  },
  {
    id: 'projects',
    title: 'Projects',
    subtitle: 'By BitPopArt',
    icon: 'FolderKanban',
    enabled: true,
    order: 1,
  },
  {
    id: 'art',
    title: 'Art',
    subtitle: 'Browse artwork gallery',
    icon: 'Palette',
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
    id: 'news',
    title: 'Nostr News',
    subtitle: 'Latest updates and articles',
    icon: 'Rss',
    enabled: true,
    order: 4,
  },
  {
    id: 'pages',
    title: 'Pages',
    subtitle: 'Explore custom content',
    icon: 'FileText',
    enabled: false,
    order: 5,
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

function generateId() {
  return `btn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── ButtonEditor is a TOP-LEVEL component so React never remounts it on parent re-renders ───
interface ButtonEditorProps {
  btn: HomepageButton;
  onUpdate: (id: string, changes: Partial<HomepageButton>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
}

function ButtonEditor({ btn, onUpdate, onDelete, onMove }: ButtonEditorProps) {
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
  });

  const [sections, setSections] = useState<HomepageSection[]>(nostrSettings?.sections || DEFAULT_SECTIONS);
  const [buttons, setButtons] = useState<HomepageButton[]>(nostrSettings?.buttons || DEFAULT_BUTTONS);
  const [activeTab, setActiveTab] = useState<'sections' | 'buttons'>('sections');

  useEffect(() => {
    if (nostrSettings) {
      setSections(nostrSettings.sections || DEFAULT_SECTIONS);
      setButtons(nostrSettings.buttons || DEFAULT_BUTTONS);
    }
  }, [nostrSettings]);

  // ─── Section handlers ────────────────────────────────────────────────────
  const handleToggle = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleSectionField = (id: string, field: 'title' | 'subtitle', value: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    setSections(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    setSections(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  // ─── Button handlers ─────────────────────────────────────────────────────
  const addHeroButton = () => {
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
    setButtons(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
  };

  const deleteButton = (id: string) => {
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const moveButton = (id: string, dir: 'up' | 'down') => {
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

  // ─── Save / Reset ─────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!user) { toast.error('Please log in to save homepage settings'); return; }

    const payload: HomepageSettings = {
      sections: sections.map((s, i) => ({ ...s, order: i })),
      buttons,
    };

    publishEvent({
      kind: 30078,
      content: JSON.stringify(payload),
      tags: [['d', 'com.bitpopart.homepage-settings']],
    }, {
      onSuccess: () => {
        toast.success('Homepage settings saved to Nostr!');
        queryClient.invalidateQueries({ queryKey: ['homepage-settings', adminPubkey] });
        queryClient.invalidateQueries({ queryKey: ['homepage-settings-public', adminPubkey] });
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
    const payload: HomepageSettings = { sections: DEFAULT_SECTIONS, buttons: DEFAULT_BUTTONS };
    publishEvent({
      kind: 30078,
      content: JSON.stringify(payload),
      tags: [['d', 'com.bitpopart.homepage-settings']],
    }, {
      onSuccess: () => {
        toast.success('Homepage settings reset to default!');
        queryClient.invalidateQueries({ queryKey: ['homepage-settings', adminPubkey] });
        queryClient.invalidateQueries({ queryKey: ['homepage-settings-public', adminPubkey] });
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
        <div className="flex gap-2 border-b pb-3">
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
            <li>Button URLs can be internal paths like <code>/nostr</code> or full URLs like <code>https://bitpopart.com/nostr</code></li>
            <li>Changes are saved to Nostr and visible to all visitors</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}
