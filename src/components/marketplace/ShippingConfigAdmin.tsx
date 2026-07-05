import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useShippingConfig, useSaveShippingConfig, DEFAULT_SHIPPING_CONFIG } from '@/hooks/useShippingConfig';
import type { ShippingConfig, ShippingZone, ShippingCountry } from '@/hooks/useShippingConfig';
import { useToast } from '@/hooks/useToast';
import {
  Truck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Globe,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
  DollarSign,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────────────────────

function newZone(): ShippingZone {
  return {
    id: `zone-${Date.now()}`,
    name: '',
    fee: 0,
    currency: 'USD',
    countries: [],
  };
}

// Common country list for quick-add suggestions
const COMMON_COUNTRIES: ShippingCountry[] = [
  { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'BR', name: 'Brazil' }, { code: 'CA', name: 'Canada' }, { code: 'CN', name: 'China' },
  { code: 'HR', name: 'Croatia' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' }, { code: 'EE', name: 'Estonia' }, { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' }, { code: 'IN', name: 'India' }, { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' },
  { code: 'LV', name: 'Latvia' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' }, { code: 'MX', name: 'Mexico' }, { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'NO', name: 'Norway' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' }, { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
  { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'TR', name: 'Turkey' }, { code: 'UA', name: 'Ukraine' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'AU', name: 'Australia' },
];

// ─── ZoneRow ──────────────────────────────────────────────────────────────────

function ZoneRow({
  zone,
  index,
  onUpdate,
  onDelete,
  currency,
}: {
  zone: ShippingZone;
  index: number;
  onUpdate: (z: ShippingZone) => void;
  onDelete: () => void;
  currency: string;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [countrySearch, setCountrySearch] = useState('');

  const isCatchAll = zone.countries.length === 0;

  const addCountry = (c: ShippingCountry) => {
    if (zone.countries.some(x => x.code === c.code)) return;
    onUpdate({ ...zone, countries: [...zone.countries, c] });
  };

  const removeCountry = (code: string) => {
    onUpdate({ ...zone, countries: zone.countries.filter(c => c.code !== code) });
  };

  const addCustomCountry = () => {
    const parts = countrySearch.trim().split(/[\s,]+/);
    if (parts.length >= 1) {
      const name = parts.slice(1).join(' ') || parts[0];
      const code = parts[0].toUpperCase().substring(0, 2);
      addCountry({ code, name });
    }
    setCountrySearch('');
  };

  const filteredSuggestions = countrySearch.trim()
    ? COMMON_COUNTRIES.filter(c =>
        !zone.countries.some(x => x.code === c.code) &&
        (c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
         c.code.toLowerCase().includes(countrySearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  return (
    <div className={`border rounded-xl overflow-hidden ${isCatchAll ? 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10' : 'border-border bg-white dark:bg-gray-900'}`}>
      {/* Zone header row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Zone name */}
        <Input
          value={zone.name}
          onChange={e => onUpdate({ ...zone, name: e.target.value })}
          placeholder={isCatchAll ? 'Catch-all (rest of world)' : 'Zone name, e.g. Europe'}
          className="h-8 text-sm font-medium flex-1 min-w-0"
        />

        {/* Fee */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{currency}</span>
          <Input
            type="number"
            min="0"
            step="0.50"
            value={zone.fee === 0 ? '' : zone.fee}
            onChange={e => onUpdate({ ...zone, fee: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="h-8 text-sm w-20 text-right"
          />
          {zone.fee === 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
              Free
            </Badge>
          )}
        </div>

        {/* Country count */}
        <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:inline-flex">
          {isCatchAll ? 'catch-all' : `${zone.countries.length} countries`}
        </Badge>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          title="Delete zone"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded countries section */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t bg-gray-50/50 dark:bg-gray-900/50">
          {isCatchAll ? (
            <p className="text-xs text-muted-foreground pt-3 italic">
              This zone has no country list — it matches any country not covered by other zones. It works as a "rest of world" fallback.
            </p>
          ) : (
            <>
              {/* Current countries */}
              {zone.countries.length > 0 && (
                <div className="pt-3 flex flex-wrap gap-1.5">
                  {zone.countries.map(c => (
                    <span
                      key={c.code}
                      className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border rounded-full px-2 py-0.5 text-xs"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">{c.code}</span>
                      {c.name}
                      <button type="button" onClick={() => removeCountry(c.code)} className="text-muted-foreground hover:text-destructive ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add country */}
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCountry(); } }}
                    placeholder="Search or type country name / ISO code…"
                    className="h-8 text-sm flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomCountry} className="h-8">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {/* Suggestions dropdown */}
                {filteredSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 border rounded-lg shadow-lg divide-y overflow-hidden">
                    {filteredSuggestions.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { addCountry(c); setCountrySearch(''); }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground w-6">{c.code}</span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShippingConfigAdmin() {
  const { data: savedConfig, isLoading } = useShippingConfig();
  const { mutateAsync: saveConfig, isPending: isSaving } = useSaveShippingConfig();
  const { toast } = useToast();

  const [config, setConfig] = useState<ShippingConfig | null>(null);
  // Use loaded config as initial state when it arrives
  const working = config ?? savedConfig ?? DEFAULT_SHIPPING_CONFIG;

  const setZones = (zones: ShippingZone[]) =>
    setConfig({ ...working, zones });

  const updateZone = (i: number, z: ShippingZone) =>
    setZones(working.zones.map((zone, idx) => idx === i ? z : zone));

  const deleteZone = (i: number) =>
    setZones(working.zones.filter((_, idx) => idx !== i));

  const addZone = () =>
    setZones([...working.zones, newZone()]);

  const addCatchAll = () => {
    const hasCatchAll = working.zones.some(z => z.countries.length === 0);
    if (hasCatchAll) {
      toast({ title: 'Catch-all exists', description: 'There is already a catch-all (rest of world) zone.', variant: 'destructive' });
      return;
    }
    setZones([...working.zones, { id: `zone-catchall-${Date.now()}`, name: 'Rest of World', fee: 25, currency: working.currency, countries: [] }]);
  };

  const handleSave = async () => {
    try {
      await saveConfig(working);
      toast({ title: 'Shipping saved ✓', description: 'Shipping configuration published to Nostr.' });
      setConfig(null); // reset local edits — now canonical
    } catch {
      toast({ title: 'Save failed', description: 'Could not publish to relay. Try again.', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_SHIPPING_CONFIG });
    toast({ title: 'Reset to default', description: 'Changes not yet saved.' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading shipping configuration…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Truck className="w-5 h-5" />
            Global Shipping Zones
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Define shipping zones with countries and fees once here.
            The cart will automatically apply the correct fee when a customer enters their country.
            Changes apply to all products immediately — no per-product shipping setup needed.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Currency */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium flex items-center gap-1.5 w-32 flex-shrink-0">
          <DollarSign className="w-4 h-4" /> Currency
        </Label>
        <Input
          value={working.currency}
          onChange={e => setConfig({ ...working, currency: e.target.value.toUpperCase() })}
          placeholder="USD"
          className="h-8 w-24 text-sm font-mono"
          maxLength={3}
        />
        <span className="text-xs text-muted-foreground">All zone fees are in this currency</span>
      </div>

      <Separator />

      {/* Zones list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-blue-500" />
            Shipping Zones ({working.zones.length})
          </h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addCatchAll} className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20 gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              + Rest of World
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addZone} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Zone
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Zones are checked top to bottom — the <strong>first match</strong> wins.
          Put more specific zones (like Netherlands) above broader ones (like Europe).
          Add a <strong>Rest of World</strong> catch-all at the bottom for all other countries.
        </p>

        {working.zones.length === 0 && (
          <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground text-sm">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-20" />
            No shipping zones yet. Click "Add Zone" to get started.
          </div>
        )}

        <div className="space-y-2">
          {working.zones.map((zone, i) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              index={i}
              currency={working.currency}
              onUpdate={z => updateZone(i, z)}
              onDelete={() => deleteZone(i)}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
          ) : (
            <><Save className="w-4 h-4" />Save to Nostr</>
          )}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isSaving} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Shipping configuration is published as a Nostr event (kind 30078) and cached in the browser.
        Changes take effect immediately for all visitors.
      </p>
    </div>
  );
}
