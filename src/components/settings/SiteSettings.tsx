import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { Palette, RotateCcw, Zap, Star } from 'lucide-react';

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
}

const DEFAULT_COLORS: SiteColors = {
  comingSoonFrom: '#f97316',
  comingSoonTo: '#ec4899',
  primaryFrom: '#a855f7',
  primaryTo: '#ec4899',
  secondaryFrom: '#6366f1',
  secondaryTo: '#8b5cf6',
  accentColor: '#f97316',
  headerTextFrom: '#db2777',
  headerTextVia: '#a855f7',
  headerTextTo: '#6366f1',
};

const COLOR_PRESETS = [
  {
    name: 'Orange & Pink (BitPopArt)',
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
    }
  },
];

export function SiteSettings() {
  const [siteColors, setSiteColors] = useLocalStorage<SiteColors>('site-colors', DEFAULT_COLORS);
  const [tempColors, setTempColors] = useState<SiteColors>(siteColors);

  useEffect(() => {
    applyColorsToDOM(siteColors);
  }, [siteColors]);

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
  };

  const handleSave = () => {
    setSiteColors(tempColors);
    applyColorsToDOM(tempColors);
    // Dispatch custom event to notify components of color change
    window.dispatchEvent(new CustomEvent('theme-colors-updated', { detail: tempColors }));
    toast.success('Site colors saved! Changes applied immediately.');
  };

  const handleReset = () => {
    setTempColors(DEFAULT_COLORS);
    setSiteColors(DEFAULT_COLORS);
    applyColorsToDOM(DEFAULT_COLORS);
    toast.success('Colors reset to default!');
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setTempColors(preset.colors);
  };

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
                    className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-purple-300"
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
              </div>
            </TabsContent>
          </Tabs>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
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
                </div>

                {/* Buttons and Badges */}
                <div className="flex flex-wrap items-center gap-3 justify-center">
                  <Badge
                    className="text-sm px-4 py-1.5 border-0 shadow-md"
                    style={{ background: `linear-gradient(to right, ${tempColors.comingSoonFrom}, ${tempColors.comingSoonTo})`, color: '#ffffff' }}
                  >
                    Coming Soon
                  </Badge>
                  <Button
                    size="sm"
                    className="border-0 shadow-md text-white"
                    style={{ background: `linear-gradient(to right, ${tempColors.primaryFrom}, ${tempColors.primaryTo})` }}
                  >
                    Primary Button
                  </Button>
                  <Button
                    size="sm"
                    className="border-0 shadow-md text-white"
                    style={{ background: `linear-gradient(to right, ${tempColors.secondaryFrom}, ${tempColors.secondaryTo})` }}
                  >
                    Secondary
                  </Button>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" style={{ color: tempColors.accentColor }} />
                    <Star className="h-5 w-5" style={{ color: tempColors.accentColor }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} size="lg">
              <Palette className="h-4 w-4 mr-2" />
              Save Colors
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <p className="font-semibold">💡 How It Works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Colors are saved to your browser and persist across sessions</li>
              <li>Changes apply immediately to all buttons, badges, and headers</li>
              <li>Header text gradients control titles like "Projects", "Art Gallery", "My Story"</li>
              <li>Custom colors apply site-wide across all pages</li>
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
