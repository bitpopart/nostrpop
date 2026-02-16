import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Palette, RotateCcw, Zap, Star, Upload, Cloud } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

interface SiteColors {
  comingSoonFrom: string;
  comingSoonTo: string;
  primaryFrom: string;
  primaryTo: string;
  secondaryFrom: string;
  secondaryTo: string;
  accentColor: string;
  headerTextFrom: string;
  headerTextVia: string;
  headerTextTo: string;
  pageBackground: string;
  bodyText: string;
  buttonText: string;
  headingText: string;
  iconColor: string;
  linkColor: string;
  linkHoverColor: string;
  hoverColor: string;
  hoverColorDark: string;
}

const DEFAULT_COLORS: SiteColors = {
  comingSoonFrom: '#e99840',
  comingSoonTo: '#e99840',
  primaryFrom: '#e99840',
  primaryTo: '#e99840',
  secondaryFrom: '#e99840',
  secondaryTo: '#e99840',
  accentColor: '#e99840',
  headerTextFrom: '#e99840',
  headerTextVia: '#e99840',
  headerTextTo: '#e99840',
  pageBackground: '#f7f8f9',
  bodyText: '#1a1a1a',
  buttonText: '#ffffff',
  headingText: '#1a1a1a',
  iconColor: '#e99840',
  linkColor: '#e99840',
  linkHoverColor: '#c87a30',
  hoverColor: '#e99840',
  hoverColorDark: '#c87a30',
};

const COLOR_PRESETS = [
  {
    name: 'Orange Theme (BitPopArt)',
    colors: DEFAULT_COLORS,
  },
  {
    name: 'Purple Dream',
    colors: {
      comingSoonFrom: '#a855f7',
      comingSoonTo: '#ec4899',
      primaryFrom: '#8b5cf6',
      primaryTo: '#a855f7',
      secondaryFrom: '#6366f1',
      secondaryTo: '#8b5cf6',
      accentColor: '#a855f7',
      headerTextFrom: '#8b5cf6',
      headerTextVia: '#a855f7',
      headerTextTo: '#ec4899',
      pageBackground: '#faf5ff',
      bodyText: '#1a1a1a',
      buttonText: '#ffffff',
      headingText: '#1a1a1a',
      iconColor: '#a855f7',
      linkColor: '#8b5cf6',
      linkHoverColor: '#7c3aed',
      hoverColor: '#a855f7',
      hoverColorDark: '#7c3aed',
    }
  },
  {
    name: 'Ocean Blue',
    colors: {
      comingSoonFrom: '#3b82f6',
      comingSoonTo: '#8b5cf6',
      primaryFrom: '#0ea5e9',
      primaryTo: '#3b82f6',
      secondaryFrom: '#06b6d4',
      secondaryTo: '#0ea5e9',
      accentColor: '#3b82f6',
      headerTextFrom: '#0ea5e9',
      headerTextVia: '#3b82f6',
      headerTextTo: '#8b5cf6',
      pageBackground: '#f0f9ff',
      bodyText: '#1a1a1a',
      buttonText: '#ffffff',
      headingText: '#1a1a1a',
      iconColor: '#3b82f6',
      linkColor: '#0ea5e9',
      linkHoverColor: '#0284c7',
      hoverColor: '#3b82f6',
      hoverColorDark: '#0284c7',
    }
  },
  {
    name: 'Sunset Glow',
    colors: {
      comingSoonFrom: '#ef4444',
      comingSoonTo: '#f97316',
      primaryFrom: '#f97316',
      primaryTo: '#fbbf24',
      secondaryFrom: '#ef4444',
      secondaryTo: '#f97316',
      accentColor: '#f97316',
      headerTextFrom: '#ef4444',
      headerTextVia: '#f97316',
      headerTextTo: '#fbbf24',
      pageBackground: '#fff7ed',
      bodyText: '#1a1a1a',
      buttonText: '#ffffff',
      headingText: '#1a1a1a',
      iconColor: '#f97316',
      linkColor: '#f97316',
      linkHoverColor: '#ea580c',
      hoverColor: '#f97316',
      hoverColorDark: '#ea580c',
    }
  },
];

export function SiteSettings() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();
  const adminPubkey = getAdminPubkeyHex();

  // Query site colors from Nostr
  const { data: nostrColors, refetch } = useQuery({
    queryKey: ['site-colors', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query([{
        kinds: [30078],
        authors: [adminPubkey],
        '#d': ['com.bitpopart.site-colors'],
        limit: 1,
      }], { signal });

      if (events.length > 0 && events[0].content) {
        try {
          return JSON.parse(events[0].content) as SiteColors;
        } catch (e) {
          console.error('Failed to parse site colors from Nostr:', e);
        }
      }
      return DEFAULT_COLORS;
    },
    enabled: !!adminPubkey,
  });

  const [tempColors, setTempColors] = useState<SiteColors>(nostrColors || DEFAULT_COLORS);

  // Update temp colors when nostr colors change
  useEffect(() => {
    if (nostrColors) {
      setTempColors(nostrColors);
      applyColorsToDOM(nostrColors);
    }
  }, [nostrColors]);

  const applyColorsToDOM = (colors: SiteColors) => {
    const root = document.documentElement;
    root.style.setProperty('--coming-soon-from', colors.comingSoonFrom);
    root.style.setProperty('--coming-soon-to', colors.comingSoonTo);
    root.style.setProperty('--primary-gradient-from', colors.primaryFrom);
    root.style.setProperty('--primary-gradient-to', colors.primaryTo);
    root.style.setProperty('--secondary-gradient-from', colors.secondaryFrom);
    root.style.setProperty('--secondary-gradient-to', colors.secondaryTo);
    root.style.setProperty('--accent-color', colors.accentColor);
    root.style.setProperty('--header-text-from', colors.headerTextFrom);
    root.style.setProperty('--header-text-via', colors.headerTextVia);
    root.style.setProperty('--header-text-to', colors.headerTextTo);
    root.style.setProperty('--page-background', colors.pageBackground);
    root.style.setProperty('--body-text-color', colors.bodyText);
    root.style.setProperty('--button-text-color', colors.buttonText);
    root.style.setProperty('--heading-text-color', colors.headingText);
    root.style.setProperty('--icon-color', colors.iconColor);
    root.style.setProperty('--link-color', colors.linkColor);
    root.style.setProperty('--link-hover-color', colors.linkHoverColor);
    root.style.setProperty('--hover-color', colors.hoverColor);
    root.style.setProperty('--hover-color-dark', colors.hoverColorDark);
  };

  const handleSave = () => {
    if (!user) {
      toast.error('Please log in to save site settings');
      return;
    }

    // Publish to Nostr
    publishEvent({
      kind: 30078,
      content: JSON.stringify(tempColors),
      tags: [['d', 'com.bitpopart.site-colors']],
    }, {
      onSuccess: () => {
        applyColorsToDOM(tempColors);
        // Dispatch custom event to notify components of color change
        window.dispatchEvent(new CustomEvent('theme-colors-updated', { detail: tempColors }));
        toast.success('Site colors saved to Nostr! Changes are now visible to everyone.');
        refetch();
      },
      onError: (error) => {
        toast.error('Failed to save colors: ' + error.message);
      }
    });
  };

  const handleReset = () => {
    if (!user) {
      toast.error('Please log in to reset site settings');
      return;
    }

    setTempColors(DEFAULT_COLORS);
    
    // Publish default colors to Nostr
    publishEvent({
      kind: 30078,
      content: JSON.stringify(DEFAULT_COLORS),
      tags: [['d', 'com.bitpopart.site-colors']],
    }, {
      onSuccess: () => {
        applyColorsToDOM(DEFAULT_COLORS);
        toast.success('Colors reset to default on Nostr!');
        refetch();
      },
      onError: (error) => {
        toast.error('Failed to reset colors: ' + error.message);
      }
    });
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setTempColors(preset.colors);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Site Look & Feel</CardTitle>
          <CardDescription>Please log in to manage site settings</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Site Look & Feel
          </CardTitle>
          <CardDescription>
            Customize colors and branding for buttons, badges, and accents across your site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="presets" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets">Quick Presets</TabsTrigger>
              <TabsTrigger value="custom">Custom Colors</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COLOR_PRESETS.map((preset) => (
                  <Card
                    key={preset.name}
                    className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-orange-300"
                    onClick={() => applyPreset(preset)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <span className="font-semibold">{preset.name}</span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-6 rounded text-xs flex items-center justify-center text-white font-medium" style={{ background: `linear-gradient(to right, ${preset.colors.comingSoonFrom}, ${preset.colors.comingSoonTo})` }}>
                            Coming
                          </div>
                          <span className="text-xs text-muted-foreground">Coming Soon</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-6 rounded text-xs flex items-center justify-center text-white font-medium" style={{ background: `linear-gradient(to right, ${preset.colors.primaryFrom}, ${preset.colors.primaryTo})` }}>
                            Primary
                          </div>
                          <span className="text-xs text-muted-foreground">Main Buttons</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-6 rounded text-xs flex items-center justify-center text-white font-medium" style={{ background: `linear-gradient(to right, ${preset.colors.secondaryFrom}, ${preset.colors.secondaryTo})` }}>
                            Secondary
                          </div>
                          <span className="text-xs text-muted-foreground">Alt Buttons</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Coming Soon Badges</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput
                      label="Start Color"
                      value={tempColors.comingSoonFrom}
                      onChange={(v) => setTempColors(prev => ({ ...prev, comingSoonFrom: v }))}
                    />
                    <ColorInput
                      label="End Color"
                      value={tempColors.comingSoonTo}
                      onChange={(v) => setTempColors(prev => ({ ...prev, comingSoonTo: v }))}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Primary Buttons</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput
                      label="Start Color"
                      value={tempColors.primaryFrom}
                      onChange={(v) => setTempColors(prev => ({ ...prev, primaryFrom: v }))}
                    />
                    <ColorInput
                      label="End Color"
                      value={tempColors.primaryTo}
                      onChange={(v) => setTempColors(prev => ({ ...prev, primaryTo: v }))}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Secondary Buttons</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorInput
                      label="Start Color"
                      value={tempColors.secondaryFrom}
                      onChange={(v) => setTempColors(prev => ({ ...prev, secondaryFrom: v }))}
                    />
                    <ColorInput
                      label="End Color"
                      value={tempColors.secondaryTo}
                      onChange={(v) => setTempColors(prev => ({ ...prev, secondaryTo: v }))}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Accent Color</Label>
                  <ColorInput
                    label="Accent (Icons & Highlights)"
                    value={tempColors.accentColor}
                    onChange={(v) => setTempColors(prev => ({ ...prev, accentColor: v }))}
                  />
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Header Text Gradients</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <ColorInput
                      label="Start Color"
                      value={tempColors.headerTextFrom}
                      onChange={(v) => setTempColors(prev => ({ ...prev, headerTextFrom: v }))}
                    />
                    <ColorInput
                      label="Middle Color"
                      value={tempColors.headerTextVia}
                      onChange={(v) => setTempColors(prev => ({ ...prev, headerTextVia: v }))}
                    />
                    <ColorInput
                      label="End Color"
                      value={tempColors.headerTextTo}
                      onChange={(v) => setTempColors(prev => ({ ...prev, headerTextTo: v }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Controls the gradient colors for page titles like "Projects", "Art Gallery", etc.
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Background & Text Colors</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorInput
                      label="Page Background"
                      value={tempColors.pageBackground}
                      onChange={(v) => setTempColors(prev => ({ ...prev, pageBackground: v }))}
                    />
                    <ColorInput
                      label="Body Text"
                      value={tempColors.bodyText}
                      onChange={(v) => setTempColors(prev => ({ ...prev, bodyText: v }))}
                    />
                    <ColorInput
                      label="Button Text"
                      value={tempColors.buttonText}
                      onChange={(v) => setTempColors(prev => ({ ...prev, buttonText: v }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Page background color, main text color, and text color on gradient buttons
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Headings, Icons & Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorInput
                      label="Heading Text Color"
                      value={tempColors.headingText}
                      onChange={(v) => setTempColors(prev => ({ ...prev, headingText: v }))}
                    />
                    <ColorInput
                      label="Icon Color"
                      value={tempColors.iconColor}
                      onChange={(v) => setTempColors(prev => ({ ...prev, iconColor: v }))}
                    />
                    <ColorInput
                      label="Link Color"
                      value={tempColors.linkColor}
                      onChange={(v) => setTempColors(prev => ({ ...prev, linkColor: v }))}
                    />
                    <ColorInput
                      label="Link Hover Color"
                      value={tempColors.linkHoverColor}
                      onChange={(v) => setTempColors(prev => ({ ...prev, linkHoverColor: v }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Control the colors for section headings, icons throughout the admin backend, and hyperlinks
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">Card Hover Effects</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorInput
                      label="Hover Color"
                      value={tempColors.hoverColor}
                      onChange={(v) => setTempColors(prev => ({ ...prev, hoverColor: v }))}
                    />
                    <ColorInput
                      label="Hover Color (Darker)"
                      value={tempColors.hoverColorDark}
                      onChange={(v) => setTempColors(prev => ({ ...prev, hoverColorDark: v }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Controls the color when hovering over card titles, project names, and "Read More" links
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Card style={{ backgroundColor: tempColors.pageBackground }}>
            <CardHeader>
              <CardTitle className="text-base">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Header Text Preview */}
                <div className="text-center">
                  <h2 
                    className="text-3xl font-bold"
                    style={{ 
                      background: `linear-gradient(to right, ${tempColors.headerTextFrom}, ${tempColors.headerTextVia}, ${tempColors.headerTextTo})`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      paddingBottom: '0.15em',
                      lineHeight: '1.3'
                    }}
                  >
                    Page Title
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: tempColors.bodyText }}>
                    Browse artwork gallery
                  </p>
                </div>

                {/* Buttons and Badges */}
                <div className="flex flex-wrap items-center gap-3 justify-center">
                  <Badge
                    className="text-sm px-4 py-1.5 border-0 shadow-md"
                    style={{ background: `linear-gradient(to right, ${tempColors.comingSoonFrom}, ${tempColors.comingSoonTo})`, color: tempColors.buttonText }}
                  >
                    Coming Soon
                  </Badge>
                  <Button
                    size="sm"
                    className="border-0 shadow-md"
                    style={{ background: `linear-gradient(to right, ${tempColors.primaryFrom}, ${tempColors.primaryTo})`, color: tempColors.buttonText }}
                  >
                    Primary Button
                  </Button>
                  <Button
                    size="sm"
                    className="border-0 shadow-md"
                    style={{ background: `linear-gradient(to right, ${tempColors.secondaryFrom}, ${tempColors.secondaryTo})`, color: tempColors.buttonText }}
                  >
                    Secondary
                  </Button>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" style={{ color: tempColors.accentColor }} />
                    <Star className="h-5 w-5" style={{ color: tempColors.accentColor }} />
                  </div>
                </div>

                {/* Text Sample */}
                <div className="border rounded-lg p-4 space-y-3" style={{ backgroundColor: '#ffffff' }}>
                  <h3 style={{ color: tempColors.headingText, fontWeight: '600' }}>
                    Section Heading
                  </h3>
                  <p style={{ color: tempColors.bodyText }}>
                    This is how your body text will appear on white cards and backgrounds throughout the site.{' '}
                    <a href="#" style={{ color: tempColors.linkColor }} onMouseEnter={(e) => e.currentTarget.style.color = tempColors.linkHoverColor} onMouseLeave={(e) => e.currentTarget.style.color = tempColors.linkColor}>
                      Sample link
                    </a>
                  </p>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" style={{ color: tempColors.iconColor }} />
                    <span className="text-sm" style={{ color: tempColors.bodyText }}>Icon color preview</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} size="lg" disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Publishing...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
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
            <p className="font-semibold flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              How It Works:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Published to Nostr:</strong> Colors are saved as a Nostr event (kind 30078)</li>
              <li><strong>Visible to Everyone:</strong> All visitors see your custom colors, logged in or not</li>
              <li><strong>Decentralized:</strong> Settings are stored on Nostr relays, not in a database</li>
              <li><strong>Instant Updates:</strong> Changes apply immediately across the entire site</li>
              <li><strong>No Login Required:</strong> Visitors don't need to log in to see your branding</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 rounded border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-10 px-3 rounded border bg-background text-sm font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
