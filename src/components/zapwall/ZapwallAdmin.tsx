import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Radio, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useZapwallChannels } from '@/hooks/useZapwallChannels';
import {
  ZAPWALL_CHANNELS_KIND,
  ZAPWALL_CHANNELS_D_TAG,
  DEFAULT_ZAPWALL_CHANNELS,
  type ZapwallChannel,
  type ZapwallStatus,
} from '@/lib/zapwall';

/** "BitFest Zap Wall" → "bitfest-zap-wall" (used for auto IDs). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function blankChannel(): ZapwallChannel {
  return {
    id: '',
    name: '',
    handle: 'bitpopart',
    cat: 'Event',
    lang: 'EN',
    status: 'off',
    example: false,
    url: 'https://streamroad.money/',
    ln: 'bitpopart@walletofsatoshi.com',
    schedule: '',
    about: { en: '' },
    a: '#fb923c',
    b: '#ea580c',
    g: 'rgba(251,146,60,.5)',
  };
}

/**
 * Zapwall — Stream Road channels & events.
 *
 * Add / edit / delete the entries shown on bitpopart.com/zapwall (the Zapwall
 * dashboard). Every save publishes the whole list as a Nostr kind-30078
 * settings event (d-tag com.bitpopart.zapwall-channels); the Zapwall page
 * reads it live, so changes appear without a redeploy.
 */
export function ZapwallAdmin() {
  const { user } = useCurrentUser();
  const { data: loaded } = useZapwallChannels();
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const [channels, setChannels] = useState<ZapwallChannel[]>(DEFAULT_ZAPWALL_CHANNELS);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  // Initial load + refresh after a successful save (only when not mid-edit).
  useEffect(() => {
    if (loaded && !dirtyRef.current) setChannels(loaded);
  }, [loaded]);

  const update = (i: number, patch: Partial<ZapwallChannel>) => {
    dirtyRef.current = true;
    setChannels((prev) => prev.map((ch, idx) => (idx === i ? { ...ch, ...patch } : ch)));
  };

  const move = (i: number, dir: -1 | 1) => {
    dirtyRef.current = true;
    setChannels((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const remove = (i: number) => {
    dirtyRef.current = true;
    setChannels((prev) => prev.filter((_, idx) => idx !== i));
  };

  const add = () => {
    dirtyRef.current = true;
    setChannels((prev) => [...prev, blankChannel()]);
  };

  /** Trim names, auto-fill + de-duplicate ids, return null when invalid. */
  const prepare = (list: ZapwallChannel[]): ZapwallChannel[] | null => {
    const seen = new Set<string>();
    const out: ZapwallChannel[] = [];
    for (const ch of list) {
      const name = ch.name.trim();
      if (!name) return null;
      const base = ch.id.trim() || slugify(name) || 'channel';
      let id = base;
      let n = 1;
      while (seen.has(id)) {
        n += 1;
        id = `${base}-${n}`;
      }
      seen.add(id);
      out.push({ ...ch, id, name });
    }
    return out;
  };

  const published = () => {
    dirtyRef.current = false;
    setLastSavedAt(new Date().toLocaleTimeString());
    queryClient.invalidateQueries({ queryKey: ['zapwall-channels'] });
  };

  const save = () => {
    if (!user) {
      toast.error('Please log in to save Zapwall channels');
      return;
    }
    const prepared = prepare(channels);
    if (!prepared) {
      toast.error('Every channel needs a name before saving.');
      return;
    }
    publishEvent(
      {
        kind: ZAPWALL_CHANNELS_KIND,
        content: JSON.stringify(prepared),
        tags: [['d', ZAPWALL_CHANNELS_D_TAG]],
        created_at: Math.floor(Date.now() / 1000),
      },
      {
        onSuccess: () => {
          published();
          toast.success(`Zapwall saved — ${prepared.length} channel${prepared.length === 1 ? '' : 's'} published to Nostr`);
          window.dispatchEvent(new CustomEvent('zapwall-channels-updated', { detail: { channels: prepared } }));
        },
        onError: (e) => toast.error('Failed to save Zapwall channels: ' + e.message),
      },
    );
  };

  const reset = () => {
    if (!user) {
      toast.error('Please log in to reset Zapwall channels');
      return;
    }
    publishEvent(
      {
        kind: ZAPWALL_CHANNELS_KIND,
        content: JSON.stringify(DEFAULT_ZAPWALL_CHANNELS),
        tags: [['d', ZAPWALL_CHANNELS_D_TAG]],
        created_at: Math.floor(Date.now() / 1000),
      },
      {
        onSuccess: () => {
          published();
          toast.success('Zapwall reset to the default channels');
          window.dispatchEvent(new CustomEvent('zapwall-channels-updated', { detail: { channels: DEFAULT_ZAPWALL_CHANNELS } }));
        },
        onError: (e) => toast.error('Failed to reset Zapwall channels: ' + e.message),
      },
    );
  };

  const liveCount = channels.filter((c) => c.status === 'live').length;
  const soonCount = channels.filter((c) => c.status === 'soon').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-purple-500" />
          Zapwall — Stream Road channels &amp; events
        </CardTitle>
        <CardDescription>
          These entries are shown on <code>bitpopart.com/zapwall</code> (cards + schedule list).
          Saves publish to Nostr (kind 30078) and appear on the page right away — no redeploy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={isPending || !user}>
            {isPending ? 'Saving…' : (<><Save className="mr-1 h-4 w-4" /> Save to Zapwall</>)}
          </Button>
          <Button variant="outline" onClick={reset} disabled={isPending || !user}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset to defaults
          </Button>
          <Button variant="secondary" onClick={add} disabled={!user}>
            <Plus className="mr-1 h-4 w-4" /> Add channel / event
          </Button>
          {lastSavedAt && (
            <span className="text-xs text-muted-foreground">
              Last published at {lastSavedAt}. Open <code>/zapwall</code> to see it.
            </span>
          )}
        </div>

        {!user && (
          <p className="text-sm text-muted-foreground">
            Log in with your admin account to edit the Zapwall channels.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {channels.length} channel{channels.length === 1 ? '' : 's'} · {liveCount} live · {soonCount} soon — order here is the order on the page.
        </p>

        {channels.map((ch, i) => (
          <div key={ch.id || `new-${i}`} className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {ch.name || <span className="text-muted-foreground">New channel / event</span>}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {ch.status}
                </span>
                {ch.example && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    example
                  </span>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="outline" size="sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => move(i, 1)} disabled={i === channels.length - 1} aria-label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => remove(i)} aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <LabeledInput label="Name *" value={ch.name} onChange={(v) => update(i, { name: v })} placeholder="e.g. Bitfest Zap Wall" />
              <LabeledInput label="ID (slug)" value={ch.id} onChange={(v) => update(i, { id: v })} placeholder={ch.name ? slugify(ch.name) : 'auto from name'} />
              <LabeledInput label="Handle" value={ch.handle} onChange={(v) => update(i, { handle: v })} />
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={ch.status} onValueChange={(v) => update(i, { status: v as ZapwallStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="soon">Soon</SelectItem>
                    <SelectItem value="off">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <LabeledInput label="Category" value={ch.cat} onChange={(v) => update(i, { cat: v })} />
              <LabeledInput label="Language" value={ch.lang} onChange={(v) => update(i, { lang: v })} />
              <LabeledInput label="Stream Road URL" value={ch.url} onChange={(v) => update(i, { url: v })} />
              <LabeledInput label="Lightning address" value={ch.ln} onChange={(v) => update(i, { ln: v })} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Schedule / next event</Label>
              <Input
                value={ch.schedule}
                onChange={(e) => update(i, { schedule: e.target.value })}
                placeholder="e.g. Around BitFest UK, 19-22 Nov 2026"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">About</Label>
              <Textarea rows={2} value={ch.about.en} onChange={(e) => update(i, { about: { ...ch.about, en: e.target.value } })} placeholder="Short description shown on the Zapwall card" />
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="flex h-9 items-center gap-2">
                <Switch id={`example-${i}`} checked={ch.example} onCheckedChange={(v) => update(i, { example: v })} />
                <Label htmlFor={`example-${i}`} className="text-xs cursor-pointer">
                  Example / placeholder
                </Label>
              </div>
              <LabeledInput label="Accent" className="w-28" value={ch.a ?? ''} onChange={(v) => update(i, { a: v })} />
              <LabeledInput label="Accent 2" className="w-28" value={ch.b ?? ''} onChange={(v) => update(i, { b: v })} />
              <LabeledInput label="Glow" className="w-44" value={ch.g ?? ''} onChange={(v) => update(i, { g: v })} />
            </div>
          </div>
        ))}
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
