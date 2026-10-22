import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Bot, Gift, KeyRound, Megaphone, Plus, RotateCcw, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useJustBData } from '@/hooks/useJustBData';
import {
  JUSTB_KIND,
  JUSTB_D_TAG,
  DEFAULT_JUSTB,
  MAX_JUSTB_CODES,
  WARN_JUSTB_CODES,
  justbHashCode,
  type JustBData,
  type JustBDrop,
  type JustBPage,
  type JustBShop,
  type JustBLadder,
  type BitBotConfig,
  type JustBNewsFeed,
  type JustBNewsPost,
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
  const [codeInput, setCodeInput] = useState('');
  const [hashing, setHashing] = useState(false);

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

  const updateBitbot = (patch: Partial<BitBotConfig>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, bitbot: { ...prev.bitbot, ...patch } }));
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

  /* ---- What's New feed (bitpopart.com/new) ---- */

  const updateNews = (patch: Partial<JustBNewsFeed>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({ ...prev, news: { ...prev.news, ...patch } }));
  };

  const updateNewsPost = (i: number, patch: Partial<JustBNewsPost>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      news: {
        ...prev.news,
        posts: prev.news.posts.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
      },
    }));
  };

  const moveNewsPost = (i: number, dir: -1 | 1) => {
    dirtyRef.current = true;
    setConfig((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.news.posts.length) return prev;
      const posts = [...prev.news.posts];
      [posts[i], posts[j]] = [posts[j], posts[i]];
      return { ...prev, news: { ...prev.news, posts } };
    });
  };

  const removeNewsPost = (i: number) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      news: { ...prev.news, posts: prev.news.posts.filter((_, idx) => idx !== i) },
    }));
  };

  const addNewsPost = () => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      news: {
        ...prev.news,
        posts: [
          {
            id: 'post-' + Date.now().toString(36),
            type: 'news',
            status: 'coming',
            date: new Date().toISOString().slice(0, 10),
            title: 'New post',
            text: '',
            image: '',
            dropDate: '',
            run: '',
            link: { label: '', url: '' },
            cards: [],
          },
          ...prev.news.posts,
        ],
      },
    }));
  };

  const updateNewsCard = (pi: number, ci: number, patch: Partial<JustBNewsPost['cards'][number]>) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      news: {
        ...prev.news,
        posts: prev.news.posts.map((p, i) =>
          i === pi
            ? { ...p, cards: p.cards.map((c, j) => (j === ci ? { ...c, ...patch } : c)) }
            : p,
        ),
      },
    }));
  };

  const addNewsCard = (pi: number) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      news: {
        ...prev.news,
        posts: prev.news.posts.map((p, i) =>
          i === pi ? { ...p, cards: [...p.cards, { name: 'New card', kind: 'Rare', rarity: 'rare', image: '', note: '' }] } : p,
        ),
      },
    }));
  };

  const removeNewsCard = (pi: number, ci: number) => {
    dirtyRef.current = true;
    setConfig((prev) => ({
      ...prev,
      news: {
        ...prev.news,
        posts: prev.news.posts.map((p, i) => (i === pi ? { ...p, cards: p.cards.filter((_, j) => j !== ci) } : p)),
      },
    }));
  };

  const codes = config.codes?.hashes ?? [];

  /** Hash the typed codes in this browser, append them to the registry AND publish immediately. */
  const addCodes = async () => {
    if (!user) {
      toast.error('Please log in to add codes');
      return;
    }
    if (isPending) {
      toast.info('A save is already publishing — wait a second and try again.');
      return;
    }
    const raw = codeInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (raw.length === 0) {
      toast.error('Enter at least one code — one per line.');
      return;
    }
    setHashing(true);
    try {
      const existing = new Set(config.codes?.hashes ?? []);
      const added: string[] = [];
      for (const r of raw) {
        if (existing.size + added.length >= MAX_JUSTB_CODES) break;
        const h = await justbHashCode(r);
        if (!existing.has(h) && !added.includes(h)) added.push(h);
      }
      if (added.length === 0) {
        toast.info('All codes you entered are already stored (or the registry is at its cap).');
        setCodeInput('');
        return;
      }
      const next: JustBData = {
        ...config,
        codes: { hashes: [...(config.codes?.hashes ?? []), ...added] },
      };
      setConfig(next);
      setCodeInput('');
      publish(
        next,
        `Added ${added.length} code${added.length === 1 ? '' : 's'} and published — /b now verifies them (hashes only, the codes themselves never reach Nostr).`,
      );
    } catch (e) {
      toast.error('Could not hash the codes: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setHashing(false);
    }
  };

  /** Remove one code and publish the registry immediately (the code stops verifying). */
  const removeCode = (h: string) => {
    if (!user) return;
    const next: JustBData = {
      ...config,
      codes: { hashes: (config.codes?.hashes ?? []).filter((x) => x !== h) },
    };
    setConfig(next);
    publish(next, 'Code removed and published — it no longer verifies on /b.');
  };

  /** Empty the registry and publish immediately (nothing verifies until new codes are added). */
  const clearCodes = () => {
    if (!user) return;
    const next: JustBData = { ...config, codes: { hashes: [] } };
    setConfig(next);
    publish(next, 'Registry cleared and published — no codes verify on /b right now.');
  };

  const published = () => {
    dirtyRef.current = false;
    setLastSavedAt(new Date().toLocaleTimeString());
    queryClient.invalidateQueries({ queryKey: ['justb-data'] });
  };

  /**
   * Publish a config to Nostr (kind 30078, d com.bitpopart.justb) and update
   * the local state to the published snapshot. Used by the top-level Save
   * button AND by the claim-code actions, which publish immediately so the
   * VERIFY MY ITEM registry on /b updates the moment a code is added.
   */
  const publish = (cfg: JustBData, msg: string) => {
    if (!user) {
      toast.error('Please log in to publish the Just B config');
      return;
    }
    const prepared = prepare(cfg);
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
          setConfig(prepared);
          // Hold the published snapshot until the relay refetch confirms it,
          // so newly added codes never flash-revert from a stale read.
          dirtyRef.current = true;
          toast.success(msg);
          window.dispatchEvent(new CustomEvent('justb-data-updated', { detail: { data: prepared } }));
        },
        onError: (e) => toast.error('Failed to publish Just B config: ' + e.message),
      },
    );
  };

  /** Trim names, coerce numbers/dates, drop empty shops/ladder rows. */
  const prepare = (cfg: JustBData): JustBData | null => {
    const base = cfg.base.map((b) => ({ ...b, slug: b.slug.trim(), name: b.name.trim() }));
    if (base.length === 0) return null;
    const drops = cfg.drops.filter((d) => d.name.trim());
    const shops = cfg.shops.filter((s) => s.name.trim());
    const ladder = cfg.ladder.filter((l) => l.name.trim());
    if (shops.length === 0 || ladder.length === 0) return null;
    const features = cfg.bitbot.features.map((f) => f.trim()).filter(Boolean);
    const buyLines = cfg.bitbot.buyLines.map((l) => l.trim()).filter(Boolean);
    const posts = cfg.news.posts
      .filter((p) => p.title.trim())
      .map((p) => ({
        ...p,
        id: p.id.trim(),
        title: p.title.trim(),
        date: p.date.trim(),
        text: p.text.trim(),
        image: p.image.trim(),
        dropDate: p.dropDate.trim(),
        run: p.run.trim(),
        link: { label: p.link.label.trim(), url: p.link.url.trim() },
        cards: p.cards.filter((c) => c.name.trim()).map((c) => ({ ...c, name: c.name.trim(), kind: c.kind.trim(), image: c.image.trim(), note: c.note.trim() })),
      }));
    return {
      ...cfg,
      updated: cfg.updated.trim(),
      launch: cfg.launch.trim(),
      base,
      drops,
      shops,
      ladder,
      bitbot: {
        ...cfg.bitbot,
        features: features.length > 0 ? features : DEFAULT_JUSTB.bitbot.features,
        buyLines: buyLines.length > 0 ? buyLines : DEFAULT_JUSTB.bitbot.buyLines,
        birth: cfg.bitbot.birth.trim(),
      },
      news: {
        title: cfg.news.title.trim(),
        intro: cfg.news.intro.trim(),
        shopUrl: cfg.news.shopUrl.trim(),
        ledgerUrl: cfg.news.ledgerUrl.trim(),
        posts,
      },
    };
  };

  const save = () => {
    publish(config, 'Just B saved — published to Nostr, /b updates live');
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
          Everything data-driven on <code>bitpopart.com/b</code> and <code>/new</code> lives here: the six base
          B's, the surprise drops, shops, launch date, rarity ladder, the ledger stamp, the claim-code
          verification registry and the What&rsquo;s New feed. Saves publish to Nostr (kind 30078) and the
          pages update right away — no redeploy.
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
                {config.base.length} base B's · {config.drops.length} drops · {config.shops.length} shop(s) · {config.ladder.length} ladder rung(s) · {codes.length} code(s)
              </span>
            </div>
          </div>
        </div>

        {/* What's New — /new feed */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Megaphone className="h-4 w-4 text-orange-500" /> What's New — /new page
            </h3>
            <Button variant="secondary" size="sm" onClick={addNewsPost} disabled={!user}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add post
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Everything on <code>bitpopart.com/new</code> lives here — the feed of all new collectibles and
            cards. Add, edit, delete and reorder posts: each one is a <b>Mystery B</b> teaser, a{' '}
            <b>New cards</b> drop (with its own list of cards) or plain <b>News</b>. Save publishes to Nostr
            (kind 30078) and /new updates right away — no redeploy. The feed always shows newest date first.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LabeledInput label="Page title" value={config.news.title} onChange={(v) => updateNews({ title: v })} placeholder="WHAT'S NEW" />
            <LabeledInput label="Intro (optional)" value={config.news.intro} onChange={(v) => updateNews({ intro: v })} placeholder="All the new things" />
            <LabeledInput label="Shop link" value={config.news.shopUrl} onChange={(v) => updateNews({ shopUrl: v })} placeholder="https://bitpopart.com/shop" />
            <LabeledInput label="Ledger link" value={config.news.ledgerUrl} onChange={(v) => updateNews({ ledgerUrl: v })} placeholder="https://bitpopart.com/b" />
          </div>
          {config.news.posts.length === 0 && (
            <p className="text-xs text-muted-foreground">No posts yet — hit Add post to start the feed, or the page shows &ldquo;Nothing here yet.&rdquo;</p>
          )}
          {config.news.posts.map((p, i) => (
            <div key={p.id || `post-${i}`} className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                    {i + 1}
                  </span>
                  {p.title || <span className="text-muted-foreground">Untitled post</span>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="outline" size="sm" onClick={() => moveNewsPost(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="outline" size="sm" onClick={() => moveNewsPost(i, 1)} disabled={i === config.news.posts.length - 1} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => removeNewsPost(i)} disabled={!user} aria-label="Delete post"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={p.type} onValueChange={(v) => updateNewsPost(i, { type: v as JustBNewsPost['type'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mystery">Mystery B</SelectItem>
                      <SelectItem value="cards">New cards</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={p.status} onValueChange={(v) => updateNewsPost(i, { status: v as JustBNewsPost['status'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coming">Coming soon</SelectItem>
                      <SelectItem value="live">Out now</SelectItem>
                      <SelectItem value="soldout">Sold out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <LabeledInput label="Date posted" value={p.date} onChange={(v) => updateNewsPost(i, { date: v })} placeholder="2026-10-22" />
                <LabeledInput label="Drop date (countdown)" value={p.dropDate} onChange={(v) => updateNewsPost(i, { dropDate: v })} placeholder="2026-11-21 — optional" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input value={p.title} onChange={(e) => updateNewsPost(i, { title: e.target.value })} placeholder="A new Mystery B is coming" />
                </div>
                <LabeledInput label="Print run (optional)" value={p.run} onChange={(v) => updateNewsPost(i, { run: v })} placeholder="e.g. 21" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Text</Label>
                <Textarea rows={2} value={p.text} onChange={(e) => updateNewsPost(i, { text: e.target.value })} placeholder="What is coming…" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <LabeledInput label="Image" value={p.image} onChange={(v) => updateNewsPost(i, { image: v })} placeholder="name (mysteryb, karat…) or https://…" />
                <LabeledInput label="Button URL" value={p.link.url} onChange={(v) => updateNewsPost(i, { link: { ...p.link, url: v } })} placeholder="https://bitpopart.com/b" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <LabeledInput label="Button text" value={p.link.label} onChange={(v) => updateNewsPost(i, { link: { ...p.link, label: v } })} placeholder="SEE THE RARITY LEDGER" />
                <span className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-2 sm:flex sm:items-end sm:pb-1">
                  Image names you can use: <code className="mx-1">beautiful, bullish, coffee, cool, geeky, lightning, orange, relay, cold, margin, printer, liquid, karat, goldrush, dhands, mystery, logo, bullish3d, beautiful3d, ch_beautiful, ch_geeky, ch_cool, ch_lightning, ch_coffee, ch_bullish, ch_mysterychar, ch_superman, mysteryb</code> — or paste an https:// address.
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Cards in this post ({p.cards.length})</Label>
                  <Button variant="secondary" size="sm" onClick={() => addNewsCard(i)} disabled={!user}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add card
                  </Button>
                </div>
                {p.cards.length === 0 && (
                  <p className="text-xs text-muted-foreground">No cards yet — only used by &ldquo;New cards&rdquo; posts.</p>
                )}
                {p.cards.map((c, ci) => (
                  <div key={`${p.id}-c${ci}`} className="space-y-2 rounded-md border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">{c.name || 'Unnamed card'}</Label>
                      <Button variant="destructive" size="sm" onClick={() => removeNewsCard(i, ci)} disabled={!user} aria-label="Remove card"><X className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <LabeledInput label="Name" value={c.name} onChange={(v) => updateNewsCard(i, ci, { name: v })} placeholder="B-24 Karat" />
                      <LabeledInput label="Label" value={c.kind} onChange={(v) => updateNewsCard(i, ci, { kind: v })} placeholder="Ultra Rare" />
                      <div className="space-y-1">
                        <Label className="text-xs">Look</Label>
                        <Select value={c.rarity} onValueChange={(v) => updateNewsCard(i, ci, { rarity: v })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="street">Street</SelectItem>
                            <SelectItem value="rare">Rare</SelectItem>
                            <SelectItem value="ultra">Ultra</SelectItem>
                            <SelectItem value="mystery">Mystery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <LabeledInput label="Note" value={c.note} onChange={(v) => updateNewsCard(i, ci, { note: v })} placeholder="Numbered of 100." />
                    </div>
                    <LabeledInput label="Image" value={c.image} onChange={(v) => updateNewsCard(i, ci, { image: v })} placeholder="karat / goldrush / dhands or https://…" className="max-w-sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* BitBot */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Bot className="h-4 w-4 text-red-500" /> BitBot — /bitbot page
          </h3>
          <p className="text-xs text-muted-foreground">
            Everything on <code>bitpopart.com/bitbot</code> (and the <b>GET A BITBOT</b> button on{' '}
            <code>/b</code>) lives here. Set the birth date, the in-progress stamp, the
            &ldquo;not for sale yet&rdquo; note and the CTA — all updates show on the page right
            after saving, no redeploy. Leave the birth date empty for &ldquo;To be announced&rdquo;.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LabeledInput label="Birth date (YYYY-MM-DD)" value={config.bitbot.birth} onChange={(v) => updateBitbot({ birth: v })} placeholder="2026-11-21 — empty = To be announced" />
            <LabeledInput label="Status stamp" value={config.bitbot.status} onChange={(v) => updateBitbot({ status: v })} placeholder="IN PROGRESS" />
            <LabeledInput label="Version" value={config.bitbot.version} onChange={(v) => updateBitbot({ version: v })} placeholder="V21.001" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <LabeledInput label="CTA label (GET A BITBOT button)" value={config.bitbot.cta.label} onChange={(v) => updateBitbot({ cta: { ...config.bitbot.cta, label: v } })} placeholder="GET A BITBOT" />
            <LabeledInput label="CTA URL" value={config.bitbot.cta.url} onChange={(v) => updateBitbot({ cta: { ...config.bitbot.cta, url: v } })} placeholder="/bitbot" />
            <LabeledInput label="Tag line" value={config.bitbot.tagline} onChange={(v) => updateBitbot({ tagline: v })} placeholder="Made by hand" />
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Switch checked={config.bitbot.available} onCheckedChange={(c) => updateBitbot({ available: c })} />
                <Label className="text-xs">Available to buy</Label>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Availability note (shown while not for sale)</Label>
            <Textarea rows={2} value={config.bitbot.availability} onChange={(e) => updateBitbot({ availability: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Lead paragraph (HTML ok: &lt;b&gt;…&lt;/b&gt;)</Label>
              <Textarea rows={3} value={config.bitbot.lead} onChange={(e) => updateBitbot({ lead: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Features — one per line</Label>
              <Textarea rows={7} value={config.bitbot.features.join('\n')} onChange={(e) => updateBitbot({ features: e.target.value.split('\n') })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Buy once title" value={config.bitbot.buyTitle} onChange={(v) => updateBitbot({ buyTitle: v })} placeholder="BUY ONCE" />
              <LabeledInput label="Buy once sub" value={config.bitbot.buySub} onChange={(v) => updateBitbot({ buySub: v })} placeholder="FREE FOREVER" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Buy-once paragraphs — one per line</Label>
              <Textarea rows={3} value={config.bitbot.buyLines.join('\n')} onChange={(e) => updateBitbot({ buyLines: e.target.value.split('\n') })} />
            </div>
          </div>
          <LabeledInput label="Small print under CTA" value={config.bitbot.specNote} onChange={(v) => updateBitbot({ specNote: v })} placeholder="Spec sheet V21.001 · built to order · software updates always free" className="max-w-xl" />
        </div>

        {/* Claim codes — secure verification */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-green-600" /> Claim codes — VERIFY MY ITEM
          </h3>
          <p className="text-xs text-muted-foreground">
            These are the claim codes printed under the scratch-off stickers. Visitors enter their code on{' '}
            <code>/b</code> and see <b>VALID</b> or <b>INVALID</b>. Codes are <b>hashed (SHA-256) in your
            browser before publishing</b> — only the hashes ever go to Nostr, so nobody reading the relays
            can recover the actual codes. Hitting <b>Add code(s)</b> publishes to Nostr <b>immediately</b>{' '}
            (no extra Save needed) and <code>/b</code> verifies the new codes right away. Use long, random
            codes for each collectible.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Codes to add — one per line</Label>
            <Textarea
              rows={4}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={'JUSTB-XXXX-XXXX\nJUSTB-YYYY-YYYY'}
              disabled={!user}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={addCodes} disabled={!user || hashing || isPending}>
              {hashing ? 'Hashing…' : isPending ? 'Publishing…' : (<><KeyRound className="mr-1 h-3.5 w-3.5" /> Add code(s) — publishes now</>)}
            </Button>
            <Button variant="destructive" size="sm" onClick={clearCodes} disabled={!user || codes.length === 0 || isPending}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear all codes
            </Button>
            <span className="text-xs text-muted-foreground">
              {codes.length} stored (hashes only) · cap {MAX_JUSTB_CODES}
            </span>
          </div>
          {codes.length >= WARN_JUSTB_CODES && (
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              The registry is getting large — the saved event may soon exceed public-relay size limits.
              Consider pruning old batches or using a shared registry.
            </p>
          )}
          {codes.length > 0 && (
            <div className="max-h-44 space-y-0.5 overflow-y-auto rounded border p-2">
              {codes.map((h) => (
                <div key={h} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                  <span className="font-mono truncate">{h.slice(0, 12)}…{h.slice(-8)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 shrink-0 p-0"
                    onClick={() => removeCode(h)}
                    disabled={isPending}
                    aria-label="Delete code"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Stored entries show a short fingerprint of each hash — never the code itself. Adding, deleting or
            clearing codes <b>publishes immediately</b>: the <code>/b</code> VERIFY MY ITEM check updates the
            moment you act, no separate Save needed (the top Save button is for the other sections). Deleting a
            code instantly makes it stop verifying — use it to revoke a lost or misprinted sticker. The short
            fingerprint identifies the entry to remove.
          </p>
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
