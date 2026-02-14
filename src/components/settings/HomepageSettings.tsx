import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
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
  Users
} from 'lucide-react';

interface HomepageSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  enabled: boolean;
  order: number;
}

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
];

const ICON_MAP: Record<string, any> = {
  Users,
  FolderKanban,
  Palette,
  CreditCard,
  Rss,
};

export function HomepageSettings() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();
  const adminPubkey = getAdminPubkeyHex();

  // Query homepage settings from Nostr
  const { data: nostrSections, refetch } = useQuery({
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
          return JSON.parse(events[0].content) as HomepageSection[];
        } catch (e) {
          console.error('Failed to parse homepage settings from Nostr:', e);
        }
      }
      return DEFAULT_SECTIONS;
    },
    enabled: !!adminPubkey,
  });

  const [sections, setSections] = useState<HomepageSection[]>(nostrSections || DEFAULT_SECTIONS);

  // Update sections when nostr data changes
  useEffect(() => {
    if (nostrSections) {
      setSections(nostrSections);
    }
  }, [nostrSections]);

  const handleToggle = (id: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, enabled: !section.enabled } : section
      )
    );
  };

  const handleTitleChange = (id: string, title: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, title } : section
      )
    );
  };

  const handleSubtitleChange = (id: string, subtitle: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, subtitle } : section
      )
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSections(prev => {
      const newSections = [...prev];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      return newSections.map((section, i) => ({ ...section, order: i }));
    });
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    setSections(prev => {
      const newSections = [...prev];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      return newSections.map((section, i) => ({ ...section, order: i }));
    });
  };

  const handleSave = () => {
    if (!user) {
      toast.error('Please log in to save homepage settings');
      return;
    }

    // Publish to Nostr
    publishEvent({
      kind: 30078,
      content: JSON.stringify(sections),
      tags: [['d', 'com.bitpopart.homepage-settings']],
    }, {
      onSuccess: () => {
        toast.success('Homepage settings saved to Nostr! Changes are now visible to everyone.');
        refetch();
      },
      onError: (error) => {
        toast.error('Failed to save settings: ' + error.message);
      }
    });
  };

  const handleReset = () => {
    if (!user) {
      toast.error('Please log in to reset homepage settings');
      return;
    }

    setSections(DEFAULT_SECTIONS);
    
    // Publish default settings to Nostr
    publishEvent({
      kind: 30078,
      content: JSON.stringify(DEFAULT_SECTIONS),
      tags: [['d', 'com.bitpopart.homepage-settings']],
    }, {
      onSuccess: () => {
        toast.success('Homepage settings reset to default!');
        refetch();
      },
      onError: (error) => {
        toast.error('Failed to reset settings: ' + error.message);
      }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Homepage Sections
        </CardTitle>
        <CardDescription>
          Customize which sections appear on your homepage and in what order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {sections.map((section, index) => {
            const Icon = ICON_MAP[section.icon];
            
            return (
              <Card key={section.id} className={!section.enabled ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Drag Handle & Icon */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      {Icon && <Icon className="h-5 w-5 text-purple-600" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={section.enabled}
                            onCheckedChange={() => handleToggle(section.id)}
                          />
                          <div className="flex items-center gap-2">
                            {section.enabled ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium">
                              {section.enabled ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveDown(index)}
                            disabled={index === sections.length - 1}
                          >
                            ↓
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Section Title</Label>
                          <Input
                            value={section.title}
                            onChange={(e) => handleTitleChange(section.id, e.target.value)}
                            placeholder="Section title"
                            disabled={!section.enabled}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Section Subtitle</Label>
                          <Input
                            value={section.subtitle}
                            onChange={(e) => handleSubtitleChange(section.id, e.target.value)}
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

        <Separator />

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isPublishing}>
            {isPublishing ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save to Nostr
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isPublishing}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
        </div>

        <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <p className="font-semibold">💡 How It Works:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Toggle sections on/off to show/hide them on the homepage</li>
            <li>Use ↑↓ buttons to change the order of sections</li>
            <li>Customize the title and subtitle for each section</li>
            <li>Settings are saved to Nostr and visible to all visitors</li>
            <li>Hidden sections won't appear on the homepage for anyone</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
