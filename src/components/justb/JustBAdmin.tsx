import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Gift, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useJustBData } from '@/hooks/useJustBData';
import {
  JUSTB_KIND,
  JUSTB_D_TAG,
  DEFAULT_JUSTB,
  type JustBData,
  type JustBDrop,
  type JustBPage,
  type JustBShop,
  type JustBLadder,
} from '@/lib/justb';

/**
 * Just B — Mystery Box config.
 *
 * Controls everything data-driven on bitpopart.com/b: the six base B's (and
 * their ledger rows), the surprise drops (add/change/delete), the where-to-buy
 * shops, the launch date, the rarity ladder and the ledger "updated" stamp.
 *
 * Every save publishes the whole config as a Nostr kind-30078 settings event
 * (d-tag com.bitpopart.justb); the /b page reads it live — no redeploy.
 */
export function JustBAdmin() {
  const { user } = useCurrentUser();
  const { data: loaded } = useJustBData();
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<JustBData>(DEFAULT_JUSTB);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (loaded && !dirtyRef.current) setConfig(loaded);
  }, [loaded]);

  const update = (patch: Partial<JustBData>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const updateBase = (i: number, patch: Partial<JustBData['base'][number]>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      base: prev.base.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));
  };

  const moveBase = (i: number, dir: -1 | 1) => {
    dirtyRef.current = true;
    setConfig((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.base.length) return prev;
      const base = [...prev.base];
      [base[i], base[j]] = [base[j], base[i]];
      return { ...prev, base };
    });
  };

  const removeBase = (i: number) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, base: prev.base.filter((_, idx) => idx !== i) }));
  };

  const addBase = () => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      base: [
        ...prev.base,
        {
          slug: `new-b-${Date.now()}`,
          no: String(prev.base.length + 1).padStart(2, '0'),
          name: 'NEW B',
          pwr: 6,
          cost: 3,
          serial: '∞',
          move: 'UNKNOWN MOVE',
          released: 0,
          first: null,
          block: null,
        },
      ],
    }));
  };

  const updateDrop = (i: number, patch: Partial<JustBDrop>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      drops: prev.drops.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    }));
  };

  const moveDrop = (i: number, dir: -1 | 1) => {
    dirtyRef.current = true;
    setConfig((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.drops.length) return prev;
      const drops = [...prev.drops];
      [drops[i], drops[j]] = [drops[j], drops[i]];
      return { ...prev, drops };
    });
  };

  const removeDrop = (i: number) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, drops: prev.drops.filter((_, idx) => idx !== i) }));
  };

  const addDrop = () => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      drops: [
        ...prev.drops,
        {
          no: String(prev.base.length + prev.drops.length + 1).padStart(2, '0'),
          name: 'NEW MYSTERY B',
          rarity: 'Mystery Rare',
          supply: 21,
          released: 0,
          status: 'soon',
          first: null,
          block: null,
        },
      ],
    }));
  };

  const updateShop = (i: number, patch: Partial<JustBShop>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      shops: prev.shops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  };

  const removeShop = (i: number) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, shops: prev.shops.filter((_, idx) => idx !== i) }));
  };

  const addShop = () => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      shops: [...prev.shops, { name: 'New shop', where: 'Online', ships: 'Ships worldwide', url: '' }],
    }));
  };

  const updatePage = (key: 'online' | 'ledger', patch: Partial<JustBPage>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const updateLadder = (i: number, patch: Partial<JustBLadder>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      ladder: prev.ladder.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    }));
  };

  const removeLadder = (i: number) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, ladder: prev.ladder.filter((_, idx) => idx !== i) }));
  };

  const addLadder = () => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      ladder: [...prev.ladder, { name: 'NEW RUNG', run: 'numbered of 1', deck: '1 per deck', c: '#000000' }],
    }));
  };

  const published = () => {
    dirtyRef.current = false;
    setLastSavedAt(new Date().toLocaleTimeString());
    queryClient.invalidateQueries({ queryKey: ['justb-data'] });
  };

  /** Trim names, coerce numbers/dates, drop empty shops/ladder rows. */
  const prepare = (cfg: JustBData): JustBData | null => {
    const base = cfg.base.map((b) => ({ ...b, slug: b.slug.trim(), name: b.name.trim() }));
    if (base.length === 0) return null;
    const drops = cfg.drops.filter((d) => d.name.trim());
    const shops = cfg.shops.filter((s) => s.name.trim());
    const ladder = cfg.ladder.filter((l) => l.name.trim());
    if (shops.length === 0 || ladder.length === 0) return null;
    return {
      ...cfg,
      updated: cfg.updated.trim(),
      launch: cfg.launch.trim(),
      base,
      drops,
      shops,
      ladder,
    };
  };

  const save = () => {
    if (!user) {
      toast.error('Please log in to save the Just B config');
      return;
    }
    const prepared = prepare(config);
    if (!prepared) {
      toast.error('Keep at least one base B, one shop and one ladder rung before saving.');
      return;
    }
    publishEvent(
      {
        kind: JUSTB_KIND,
        content: JSON.stringify(prepared),
        tags: [['d', JUSTB_D_TAG]],
        created_at: Math.floor(Date.now() / 1000),
      },
      {
        onSuccess: () => {
          published();
          toast.success('Just B saved — published to Nostr, /b updates live');
          window.dispatchEvent(new CustomEvent('justb-data-updated', { detail: { data: prepared } }));
        },
        onError: (e) => toast.error('Failed to save Just B config: ' + e.message),
      },
    );
  };

  const reset = () => {
    if (!user) {
      toast.error('Please log in to reset the Just B config');
      return;
    }
    publishEvent(
      {
        kind: JUSTB_KIND,
        content: JSON.stringify(DEFAULT_JUSTB),
        tags: [['d', JUSTB_D_TAG]],
        created_at: Math.floor(Date.now() / 1000),
      },
      {
        onSuccess: () => {
          published();
          setConfig(DEFAULT_JUSTB);
          toast.success('Just B reset to the default config');
          window.dispatchEvent(new CustomEvent('justb-data-updated', { detail: { data: DEFAULT_JUSTB } }));
        },
        onError: (e) => toast.error('Failed to reset Just B config: ' + e.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-orange-500" />
          Just B — Mystery Box config
        </CardTitle>
        <CardDescription>
          Everything data-driven on <code>bitpopart.com/b</code> lives here: the six base B's, the
          surprise drops, shops, launch date, rarity ladder and the ledger stamp. Saves publish to
          Nostr (kind 30078) and the page updates right away — no redeploy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={isPending || !user}>
            {isPending ? 'Saving…' : (<><Save className="mr-1 h-4 w-4" /> Save to Just B</>)}
          </Button>
          <Button variant="outline" onClick={reset} disabled={isPending || !user}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset to defaults
          </Button>
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">
              Last published at {lastSavedAt}. Open <code>/b</code> to see it.
            </span>
          )}
        </div>

        {!user && (
          <p className="text-sm text-muted-foreground">
            Log in with your admin account to edit the Just B config.
          </p>
        )}

        {/* General */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">General</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LabeledInput label="Ledger updated (YYYY-MM-DD)" value={config.updated} onChange={(v) => update({ updated: v })} placeholder="2026-10-18" />
            <LabeledInput label="Launch date (YYYY-MM-DD)" value={config.launch} onChange={(v) => update({ launch: v })} placeholder="2026-11-21" />
            <div className="flex items-end">
              <span className="text-xs text-muted-foreground">
                {config.base.length} base B's · {config.drops.length} drops · {config.shops.length} shop(s) · {config.ladder.length} ladder rung(s)
              </span>
            </div>
          </div>
        </div>

        {/* Base B's */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">The six base B's</h3>
            <Button variant="secondary" size="sm" onClick={addBase} disabled={!user}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add B
            </Button>
          </div>
          {config.base.map((b, i) => (
            <div key={b.slug || `new-${i}`} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="text-muted-foreground">#{b.no}</span>
                  {b.name || <span className="text-muted-foreground">New B</span>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="outline" size="sm" onClick={() => moveBase(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => moveBase(i, 1)} disabled={i === config.base.length - 1} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => removeBase(i)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <LabeledInput label="Slug" value={b.slug} onChange={(v) => updateBase(i, { slug: v })} />
                <LabeledInput label="No" value={b.no} onChange={(v) => updateBase(i, { no: v })} />
                <LabeledInput label="Name" value={b.name} onChange={(v) => updateBase(i, { name: v })} />
                <LabeledInput label="Power" value={String(b.pwr)} onChange={(v) => updateBase(i, { pwr: Number(v) || 0 })} />
                <LabeledInput label="Cost (Sats)" value={String(b.cost)} onChange={(v) => updateBase(i, { cost: Number(v) || 0 })} />
                <LabeledInput label="Serial" value={b.serial} onChange={(v) => updateBase(i, { serial: v })} />
                <LabeledInput label="Move" value={b.move} onChange={(v) => updateBase(i, { move: v })} />
                <LabeledInput label="Released" value={String(b.released)} onChange={(v) => updateBase(i, { released: Number(v) || 0 })} />
                <LabeledInput label="First release" value={b.first ?? ''} onChange={(v) => updateBase(i, { first: v || null })} placeholder="YYYY-MM-DD" />
                <LabeledInput label="Block height" value={b.block == null ? '' : String(b.block)} onChange={(v) => updateBase(i, { block: v === '' ? null : Number(v) || null })} placeholder="e.g. 900000" />
              </div>
            </div>
          ))}
        </div>

        {/* Drops */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Surprise drops (fixed supply)</h3>
            <Button variant="secondary" size="sm" onClick={addDrop} disabled={!user}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add drop
            </Button>
          </div>
          {config.drops.map((d, i) => (
            <div key={`drop-${i}`} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="text-muted-foreground">#{d.no}</span>
                  {d.name || <span className="text-muted-foreground">New drop</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${d.status === 'live' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                    {d.status}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="outline" size="sm" onClick={() => moveDrop(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => moveDrop(i, 1)} disabled={i === config.drops.length - 1} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => removeDrop(i)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <LabeledInput label="No" value={d.no} onChange={(v) => updateDrop(i, { no: v })} />
                <LabeledInput label="Name" value={d.name} onChange={(v) => updateDrop(i, { name: v })} />
                <LabeledInput label="Rarity" value={d.rarity} onChange={(v) => updateDrop(i, { rarity: v })} />
                <LabeledInput label="Supply" value={String(d.supply)} onChange={(v) => updateDrop(i, { supply: Number(v) || 0 })} />
                <LabeledInput label="Released" value={String(d.released)} onChange={(v) => updateDrop(i, { released: Number(v) || 0 })} />
                <LabeledInput label="First release" value={d.first ?? ''} onChange={(v) => updateDrop(i, { first: v || null })} placeholder="YYYY-MM-DD" />
                <LabeledInput label="Block height" value={d.block == null ? '' : String(d.block)} onChange={(v) => updateDrop(i, { block: v === '' ? null : Number(v) || null })} placeholder="e.g. 900000" />
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={d.status} onValueChange={(v) => updateDrop(i, { status: v as 'live' | 'soon' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="soon">Coming soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shops */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Where to buy</h3>
            <Button variant="secondary" size="sm" onClick={addShop} disabled={!user}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add shop
            </Button>
          </div>
          {config.shops.map((s, i) => (
            <div key={`shop-${i}`} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold">{s.name || 'New shop'}</div>
                <Button variant="destructive" size="sm" onClick={() => removeShop(i)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <LabeledInput label="Name" value={s.name} onChange={(v) => updateShop(i, { name: v })} />
                <LabeledInput label="Region" value={s.where} onChange={(v) => updateShop(i, { where: v })} />
                <LabeledInput label="Ships" value={s.ships} onChange={(v) => updateShop(i, { ships: v })} />
                <LabeledInput label="URL (empty = no web store)" value={s.url} onChange={(v) => updateShop(i, { url: v })} />
              </div>
            </div>
          ))}
        </div>

        {/* In-page pages */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold">Play online &amp; full ledger</h3>
          <p className="text-xs text-muted-foreground">
            The two buttons on <code>/b</code> now open their pages <em>inside</em> the page
            (no new tab). Edit the button label and the page URL here.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg border p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PLAY JUST B ONLINE</h4>
              <LabeledInput label="Button label" value={config.online.label} onChange={(v) => updatePage('online', { label: v })} placeholder="PLAY JUST B ONLINE" />
              <LabeledInput label="Page URL" value={config.online.url} onChange={(v) => updatePage('online', { url: v })} placeholder="/justb-app/online.html" />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">OPEN THE FULL LEDGER</h4>
              <LabeledInput label="Button label" value={config.ledger.label} onChange={(v) => updatePage('ledger', { label: v })} placeholder="OPEN THE FULL LEDGER" />
              <LabeledInput label="Page URL" value={config.ledger.url} onChange={(v) => updatePage('ledger', { url: v })} placeholder="/justb-app/ledger.html" />
            </div>
          </div>
        </div>

        {/* Ladder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Rarity ladder</h3>
            <Button variant="secondary" size="sm" onClick={addLadder} disabled={!user}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add rung
            </Button>
          </div>
          {config.ladder.map((l, i) => (
            <div key={`ladder-${i}`} className="space-y-3 rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: l.c }} />
                  {l.name || 'New rung'}
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeLadder(i)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <LabeledInput label="Name" value={l.name} onChange={(v) => updateLadder(i, { name: v })} />
                <LabeledInput label="Run" value={l.run} onChange={(v) => updateLadder(i, { run: v })} />
                <LabeledInput label="Deck" value={l.deck} onChange={(v) => updateLadder(i, { deck: v })} />
                <LabeledInput label="Color" value={l.c} onChange={(v) => updateLadder(i, { c: v })} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
