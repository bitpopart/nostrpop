import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { Palette, RotateCcw } from 'lucide-react';

interface SiteColors {
  comingSoonGradientFrom: string;
  comingSoonGradientTo: string;
  comingSoonTextColor: string;
}

const DEFAULT_COLORS: SiteColors = {
  comingSoonGradientFrom: '#f97316', // orange-500
  comingSoonGradientTo: '#ec4899', // pink-500
  comingSoonTextColor: '#ffffff',
};

const COLOR_PRESETS = [
  {
    name: 'Orange & Pink (Default)',
    colors: {
      comingSoonGradientFrom: '#f97316',
      comingSoonGradientTo: '#ec4899',
      comingSoonTextColor: '#ffffff',
    }
  },
  {
    name: 'Purple & Pink',
    colors: {
      comingSoonGradientFrom: '#a855f7',
      comingSoonGradientTo: '#ec4899',
      comingSoonTextColor: '#ffffff',
    }
  },
  {
    name: 'Blue & Purple',
    colors: {
      comingSoonGradientFrom: '#3b82f6',
      comingSoonGradientTo: '#8b5cf6',
      comingSoonTextColor: '#ffffff',
    }
  },
  {
    name: 'Green & Teal',
    colors: {
      comingSoonGradientFrom: '#10b981',
      comingSoonGradientTo: '#14b8a6',
      comingSoonTextColor: '#ffffff',
    }
  },
  {
    name: 'Red & Orange',
    colors: {
      comingSoonGradientFrom: '#ef4444',
      comingSoonGradientTo: '#f97316',
      comingSoonTextColor: '#ffffff',
    }
  },
];

export function SiteSettings() {
  const [siteColors, setSiteColors] = useLocalStorage<SiteColors>('site-colors', DEFAULT_COLORS);
  const [tempColors, setTempColors] = useState<SiteColors>(siteColors);

  const handleSave = () => {
    setSiteColors(tempColors);
    
    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--coming-soon-from', tempColors.comingSoonGradientFrom);
    document.documentElement.style.setProperty('--coming-soon-to', tempColors.comingSoonGradientTo);
    document.documentElement.style.setProperty('--coming-soon-text', tempColors.comingSoonTextColor);
    
    toast.success('Site colors updated! Changes will apply after page refresh.');
  };

  const handleReset = () => {
    setTempColors(DEFAULT_COLORS);
    setSiteColors(DEFAULT_COLORS);
    
    document.documentElement.style.setProperty('--coming-soon-from', DEFAULT_COLORS.comingSoonGradientFrom);
    document.documentElement.style.setProperty('--coming-soon-to', DEFAULT_COLORS.comingSoonGradientTo);
    document.documentElement.style.setProperty('--coming-soon-text', DEFAULT_COLORS.comingSoonTextColor);
    
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
            Customize the appearance of your site's branding elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Presets */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Color Presets</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <Card
                  key={preset.name}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => applyPreset(preset)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <div
                        className="h-8 w-20 rounded-md"
                        style={{
                          background: `linear-gradient(to right, ${preset.colors.comingSoonGradientFrom}, ${preset.colors.comingSoonGradientTo})`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Current Preview */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Current Preview</Label>
            <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <Badge
                className="text-lg px-6 py-2 border-0 shadow-lg"
                style={{
                  background: `linear-gradient(to right, ${tempColors.comingSoonGradientFrom}, ${tempColors.comingSoonGradientTo})`,
                  color: tempColors.comingSoonTextColor,
                }}
              >
                Coming Soon
              </Badge>
            </div>
          </div>

          {/* Custom Color Inputs */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Custom Colors</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color-from">Gradient Start Color</Label>
                <div className="flex gap-2">
                  <input
                    id="color-from"
                    type="color"
                    value={tempColors.comingSoonGradientFrom}
                    onChange={(e) => setTempColors(prev => ({ ...prev, comingSoonGradientFrom: e.target.value }))}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.comingSoonGradientFrom}
                    onChange={(e) => setTempColors(prev => ({ ...prev, comingSoonGradientFrom: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded border bg-background"
                    placeholder="#f97316"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-to">Gradient End Color</Label>
                <div className="flex gap-2">
                  <input
                    id="color-to"
                    type="color"
                    value={tempColors.comingSoonGradientTo}
                    onChange={(e) => setTempColors(prev => ({ ...prev, comingSoonGradientTo: e.target.value }))}
                    className="h-10 w-20 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tempColors.comingSoonGradientTo}
                    onChange={(e) => setTempColors(prev => ({ ...prev, comingSoonGradientTo: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded border bg-background"
                    placeholder="#ec4899"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Palette className="h-4 w-4 mr-2" />
              Save Colors
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="font-semibold mb-1">Note:</p>
            <p>Color changes will be applied to all "Coming Soon" badges across the site. For full effect, refresh the page after saving.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
