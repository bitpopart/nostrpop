import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { NRelay1 } from '@nostrify/nostrify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus, X, Upload, Award, Edit, Trash2, Send, Loader2,
  Users, ExternalLink, AlertTriangle, Check, RefreshCw,
  Download, CheckCircle2
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { toast } from 'sonner';
import { genUserName } from '@/lib/genUserName';
import { useAuthor } from '@/hooks/useAuthor';
import type { NostrEvent } from '@nostrify/nostrify';

// ─── Constants ────────────────────────────────────────────────────────────────

// BitPopArt admin pubkey (hex) — the account whose badges we import from ditto.pub
const BITPOPART_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

// Relays to query when importing — ditto.pub first, then broad fallbacks
const IMPORT_RELAYS = [
  'wss://ditto.pub/relay',
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface NIP58Badge {
  id: string;
  name: string;
  description?: string;
  image?: string;
  thumbs: { url: string; size?: string }[];
  event: NostrEvent;
  naddr: string;
}

interface NIP58Award {
  id: string;
  badgeAddr: string;
  awardees: string[];
  event: NostrEvent;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function naddrFor(pubkey: string, id: string) {
  return `30009:${pubkey}:${id}`;
}

function toPubkeyHex(value: string): string | null {
  const trimmed = value.trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase();
  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === 'npub') return decoded.data as string;
    if (decoded.type === 'nprofile') return (decoded.data as { pubkey: string }).pubkey;
  } catch { /* ignore */ }
  return null;
}

function parseNIP58Events(events: NostrEvent[]): NIP58Badge[] {
  return events
    .map((event): NIP58Badge | null => {
      try {
        const id = event.tags.find(t => t[0] === 'd')?.[1];
        const name = event.tags.find(t => t[0] === 'name')?.[1];
        if (!id || !name) return null;
        const description = event.tags.find(t => t[0] === 'description')?.[1];
        const image = event.tags.find(t => t[0] === 'image')?.[1];
        const thumbs = event.tags.filter(t => t[0] === 'thumb').map(t => ({ url: t[1], size: t[2] }));
        const naddr = nip19.naddrEncode({ kind: 30009, pubkey: event.pubkey, identifier: id });
        return { id, name, description, image, thumbs, event, naddr };
      } catch { return null; }
    })
    .filter((b): b is NIP58Badge => b !== null)
    .sort((a, b) => b.event.created_at - a.event.created_at);
}

// ─── Awardee Row ──────────────────────────────────────────────────────────────

function AwardeeRow({ pubkey, onRemove }: { pubkey: string; onRemove?: () => void }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={metadata?.picture} alt={displayName} />
        <AvatarFallback className="text-xs">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{npub.slice(0, 20)}…</p>
      </div>
      <a href={`https://njump.me/${npub}`} target="_blank" rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground">
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      {onRemove && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={onRemove}>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ─── Import Panel ─────────────────────────────────────────────────────────────

function ImportPanel({
  existingIds,
  onImported,
}: {
  existingIds: Set<string>;
  onImported: () => void;
}) {
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  // Fetch all kind:30009 badges from the BitPopArt pubkey across multiple relays.
  // We bypass the app pool and query each relay directly so we're not dependent
  // on whichever relay the user happens to have selected.
  const { data: sourceBadges = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ditto-badge-import', BITPOPART_PUBKEY],
    queryFn: async (c) => {
      const filter = [{ kinds: [30009], authors: [BITPOPART_PUBKEY], limit: 200 }];
      const seenIds = new Set<string>();
      const allEvents: NostrEvent[] = [];

      // Query all relays in parallel, collect everything that comes back
      await Promise.allSettled(
        IMPORT_RELAYS.map(async (url) => {
          const relay = new NRelay1(url);
          try {
            const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
            const events = await relay.query(filter, { signal });
            for (const ev of events) {
              if (!seenIds.has(ev.id)) {
                seenIds.add(ev.id);
                allEvents.push(ev);
              }
            }
          } finally {
            // Close the relay connection
            relay[Symbol.asyncDispose]?.().catch(() => {});
          }
        })
      );

      return parseNIP58Events(allEvents);
    },
    staleTime: 0, // always fetch fresh when panel opens
    gcTime: 0,
  });

  const toggle = (id: string) => {
    if (existingIds.has(id)) return; // already imported
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImportAll = () => {
    const toImport = sourceBadges.filter(b => !existingIds.has(b.id));
    if (toImport.length === 0) return;
    setSelected(new Set(toImport.map(b => b.id)));
  };

  const handleImport = async () => {
    const toImport = sourceBadges.filter(b => selected.has(b.id));
    if (toImport.length === 0) return;

    setImporting(true);
    let count = 0;

    for (const badge of toImport) {
      // Re-publish the exact same kind:30009 event, but signed by the current user
      const tags: string[][] = [
        ['d', badge.id],
        ['name', badge.name],
        ['alt', `NIP-58 Badge: ${badge.name}`],
      ];
      if (badge.description) tags.push(['description', badge.description]);
      if (badge.image) {
        tags.push(['image', badge.image, '1024x1024']);
        tags.push(['thumb', badge.image, '512x512']);
        tags.push(['thumb', badge.image, '256x256']);
        tags.push(['thumb', badge.image, '64x64']);
      }
      badge.thumbs.forEach(t => {
        // Only add unique thumbs not already added
        const alreadyAdded = ['512x512', '256x256', '64x64'].includes(t.size ?? '');
        if (!alreadyAdded && t.url && t.url !== badge.image) {
          tags.push(['thumb', t.url, ...(t.size ? [t.size] : [])]);
        }
      });

      await new Promise<void>((resolve) => {
        createEvent(
          { kind: 30009, content: '', tags },
          {
            onSuccess: () => { count++; resolve(); },
            onError: () => resolve(), // continue on error
          }
        );
      });
    }

    setImporting(false);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['nip58-admin-badges'] });
    queryClient.invalidateQueries({ queryKey: ['nip58-badge-definitions'] });
    toast.success(`Imported ${count} badge${count !== 1 ? 's' : ''}!`);
    onImported();
  };

  const newBadges = sourceBadges.filter(b => !existingIds.has(b.id));
  const thumb = (b: NIP58Badge) =>
    b.thumbs.find(t => t.size === '256x256')?.url ??
    b.thumbs.find(t => t.size === '512x512')?.url ??
    b.thumbs[0]?.url ??
    b.image;

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-purple-600" />
              Import from ditto.pub
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Fetching your badges from{' '}
              <a
                href="https://ditto.pub/badges"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-purple-600"
              >
                ditto.pub/badges
              </a>{' '}
              — published as kind:30009 by BitPopArt
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            {isFetching
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            {isFetching ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : sourceBadges.length === 0 ? (
          <Alert>
            <Award className="h-4 w-4" />
            <AlertDescription>
              No badges found on the current relay for BitPopArt.
              Try switching relays or refreshing.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Summary row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{sourceBadges.length}</span> badge{sourceBadges.length !== 1 ? 's' : ''} found
                {newBadges.length > 0 && (
                  <span className="ml-1 text-purple-600 font-medium">
                    · {newBadges.length} new
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                {newBadges.length > 0 && selected.size < newBadges.length && (
                  <Button variant="outline" size="sm" onClick={handleImportAll} className="gap-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Select all new
                  </Button>
                )}
                {selected.size > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setSelected(new Set())} className="text-xs">
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sourceBadges.map(badge => {
                const isImported = existingIds.has(badge.id);
                const isSelected = selected.has(badge.id);
                const img = thumb(badge);

                return (
                  <div
                    key={badge.id}
                    onClick={() => toggle(badge.id)}
                    className={[
                      'relative rounded-xl border-2 cursor-pointer transition-all duration-150 overflow-hidden',
                      isImported
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20 cursor-default opacity-70'
                        : isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md scale-[1.02]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-sm',
                    ].join(' ')}
                  >
                    {/* Status badge */}
                    {isImported && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-green-500 text-white rounded-full px-1.5 py-0.5">
                          <Check className="h-2.5 w-2.5" /> Done
                        </span>
                      </div>
                    )}
                    {isSelected && !isImported && (
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-purple-600 text-white rounded-full px-1.5 py-0.5">
                          <Check className="h-2.5 w-2.5" /> Pick
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                      {img ? (
                        <img src={img} alt={badge.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award className="h-10 w-10 text-purple-300" />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="px-2 py-2">
                      <p className="text-xs font-semibold truncate leading-tight">{badge.name}</p>
                      {badge.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{badge.description}</p>
                      )}
                      <p className="text-[10px] font-mono text-muted-foreground/70 truncate mt-0.5">{badge.id}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Import button */}
            {selected.size > 0 && (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  {selected.size} badge{selected.size !== 1 ? 's' : ''} selected
                </p>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {importing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />}
                  {importing ? 'Importing…' : `Import ${selected.size}`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Award Dialog ──────────────────────────────────────────────────────────────

function AwardDialog({
  badge,
  open,
  onClose,
}: {
  badge: NIP58Badge | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const [input, setInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [inputError, setInputError] = useState('');

  const addRecipient = () => {
    const hex = toPubkeyHex(input);
    if (!hex) { setInputError('Invalid npub or hex pubkey'); return; }
    if (recipients.includes(hex)) { setInputError('Already added'); return; }
    setRecipients(prev => [...prev, hex]);
    setInput('');
    setInputError('');
  };

  const handleAward = () => {
    if (!badge || recipients.length === 0) return;
    createEvent(
      {
        kind: 8,
        content: '',
        tags: [
          ['a', naddrFor(badge.event.pubkey, badge.id)],
          ...recipients.map(pk => ['p', pk]),
        ],
      },
      {
        onSuccess: () => {
          toast.success(`Badge awarded to ${recipients.length} recipient(s)!`);
          setRecipients([]);
          onClose();
        },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  const handleClose = () => { setRecipients([]); setInput(''); setInputError(''); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-purple-600" />
            Award Badge
          </DialogTitle>
          <DialogDescription>
            Issue <strong>{badge?.name}</strong> to one or more Nostr users.
          </DialogDescription>
        </DialogHeader>

        {badge && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {(badge.image ?? badge.thumbs[0]?.url) && (
              <img
                src={badge.thumbs.find(t => t.size === '64x64')?.url ?? badge.image}
                alt={badge.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm">{badge.name}</p>
              {badge.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{badge.description}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Add recipient (npub or hex pubkey)</Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => { setInput(e.target.value); setInputError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              placeholder="npub1… or hex"
              className={inputError ? 'border-red-400' : ''}
            />
            <Button variant="outline" onClick={addRecipient} disabled={!input.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {inputError && <p className="text-xs text-red-500">{inputError}</p>}
        </div>

        {recipients.length > 0 && (
          <div className="border rounded-lg overflow-hidden divide-y divide-border max-h-52 overflow-y-auto">
            {recipients.map(pk => (
              <AwardeeRow key={pk} pubkey={pk} onRemove={() => setRecipients(p => p.filter(r => r !== pk))} />
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 gap-2"
            onClick={handleAward}
            disabled={recipients.length === 0 || isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Award to {recipients.length || ''} {recipients.length === 1 ? 'person' : 'people'}
          </Button>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteDialog({
  badge,
  open,
  onClose,
}: {
  badge: NIP58Badge | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const handleDelete = () => {
    if (!badge) return;
    createEvent(
      {
        kind: 5,
        content: 'Deleting badge definition',
        tags: [
          ['e', badge.event.id],
          ['a', naddrFor(badge.event.pubkey, badge.id)],
          ['k', '30009'],
        ],
      },
      {
        onSuccess: () => {
          toast.success(`Badge "${badge.name}" deleted.`);
          queryClient.invalidateQueries({ queryKey: ['nip58-badge-definitions'] });
          queryClient.invalidateQueries({ queryKey: ['nip58-admin-badges'] });
          onClose();
        },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Badge
          </DialogTitle>
          <DialogDescription>
            Publish a NIP-09 deletion request for <strong>{badge?.name}</strong>. Supporting relays will remove it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Badge Form ────────────────────────────────────────────────────────────────

interface BadgeFormProps {
  initial?: NIP58Badge;
  onSave: () => void;
  onCancel: () => void;
}

function BadgeForm({ initial, onSave, onCancel }: BadgeFormProps) {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const queryClient = useQueryClient();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image ?? '');
  const [slug, setSlug] = useState(initial?.id ?? '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const tags = await uploadFile(file);
      setImageUrl(tags[0][1]);
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    }
  };

  const handleSave = () => {
    if (!name.trim() || !slug.trim()) return;
    const tags: string[][] = [
      ['d', slug.trim()],
      ['name', name.trim()],
      ['alt', `NIP-58 Badge: ${name.trim()}`],
    ];
    if (description.trim()) tags.push(['description', description.trim()]);
    if (imageUrl) {
      tags.push(['image', imageUrl, '1024x1024']);
      tags.push(['thumb', imageUrl, '512x512']);
      tags.push(['thumb', imageUrl, '256x256']);
      tags.push(['thumb', imageUrl, '64x64']);
    }
    createEvent(
      { kind: 30009, content: '', tags },
      {
        onSuccess: () => {
          toast.success(initial ? 'Badge updated!' : 'Badge created!');
          queryClient.invalidateQueries({ queryKey: ['nip58-badge-definitions'] });
          queryClient.invalidateQueries({ queryKey: ['nip58-admin-badges'] });
          onSave();
        },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? 'Edit Badge' : 'Create New Badge'}</CardTitle>
        <CardDescription>
          Publishes a <code className="text-xs bg-muted px-1 rounded">kind:30009</code> NIP-58 Badge Definition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="slug">Badge ID (slug) *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="e.g. early-supporter"
            disabled={!!initial}
          />
          <p className="text-xs text-muted-foreground">
            Unique <code>d</code> tag identifier. Cannot be changed after creation.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="badge-name">Badge Name *</Label>
          <Input
            id="badge-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Early Supporter"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="badge-desc">Description</Label>
          <Textarea
            id="badge-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does this badge represent?"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Badge Image (recommended 1024×1024)</Label>
          {imageUrl ? (
            <div className="flex items-center gap-3">
              <img src={imageUrl} alt="badge" className="w-20 h-20 rounded-xl object-cover border-2 border-purple-200" />
              <Button variant="outline" size="sm" onClick={() => setImageUrl('')}>
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-xl cursor-pointer hover:border-purple-400 transition-colors bg-muted/30">
              {isUploading
                ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                : <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </div>}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
            </label>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !slug.trim() || isPending || isUploading}
            className="gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {initial ? 'Save Changes' : 'Create Badge'}
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Badge Row ─────────────────────────────────────────────────────────────────

function BadgeRow({
  badge,
  awards,
  onEdit,
  onDelete,
  onAward,
}: {
  badge: NIP58Badge;
  awards: NIP58Award[];
  onEdit: () => void;
  onDelete: () => void;
  onAward: () => void;
}) {
  const coord = naddrFor(badge.event.pubkey, badge.id);
  const allAwardees = Array.from(new Set(
    awards.filter(a => a.badgeAddr === coord).flatMap(a => a.awardees)
  ));
  const thumb = badge.thumbs.find(t => t.size === '64x64')?.url ?? badge.image;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border bg-white dark:bg-gray-800/80 hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
        {thumb
          ? <img src={thumb} alt={badge.name} className="w-full h-full object-cover" />
          : <Award className="h-8 w-8 text-purple-400" />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold truncate">{badge.name}</h3>
          <Badge variant="outline" className="text-xs font-mono">{badge.id}</Badge>
        </div>
        {badge.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{badge.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
          <Users className="h-3 w-3" />
          <span>{allAwardees.length} holder{allAwardees.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>kind:30009</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <Button size="sm" className="gap-1.5 h-8" onClick={onAward}>
          <Send className="h-3.5 w-3.5" />
          Award
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function BadgeManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [showImport, setShowImport] = useState(false);

  // ── My badges (kind:30009 from logged-in user) ──
  const { data: badges = [], isLoading: isLoadingBadges, refetch } = useQuery({
    queryKey: ['nip58-admin-badges', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const events = await nostr.query(
        [{ kinds: [30009], authors: [user.pubkey], limit: 200 }],
        { signal }
      );
      return parseNIP58Events(events);
    },
    enabled: !!user?.pubkey,
  });

  // ── Kind:8 awards from logged-in user ──
  const badgeAddrs = badges.map(b => naddrFor(b.event.pubkey, b.id));
  const { data: awards = [] } = useQuery({
    queryKey: ['nip58-admin-awards', user?.pubkey, badgeAddrs],
    queryFn: async (c) => {
      if (!user?.pubkey || badgeAddrs.length === 0) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const events = await nostr.query(
        [{ kinds: [8], authors: [user.pubkey], '#a': badgeAddrs, limit: 1000 }],
        { signal }
      );
      return events.map((event): NIP58Award => ({
        id: event.id,
        badgeAddr: event.tags.find(t => t[0] === 'a')?.[1] ?? '',
        awardees: event.tags.filter(t => t[0] === 'p').map(t => t[1]),
        event,
      }));
    },
    enabled: !!user?.pubkey && badgeAddrs.length > 0,
  });

  // ── UI state ──
  const [showForm, setShowForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<NIP58Badge | null>(null);
  const [awardingBadge, setAwardingBadge] = useState<NIP58Badge | null>(null);
  const [deletingBadge, setDeletingBadge] = useState<NIP58Badge | null>(null);

  const existingIds = new Set(badges.map(b => b.id));

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login Required</CardTitle>
          <CardDescription>Please log in as admin to manage NIP-58 badges.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            NIP-58 Badge Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage <code className="bg-muted rounded px-1 text-xs">kind:30009</code> definitions and
            award via <code className="bg-muted rounded px-1 text-xs">kind:8</code>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(v => !v)}
            className={['gap-1.5', showImport ? 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300' : ''].join(' ')}
          >
            <Download className="h-4 w-4" />
            {showImport ? 'Hide Import' : 'Import from ditto.pub'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ['nip58-admin-awards'] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            onClick={() => { setEditingBadge(null); setShowForm(v => !v); }}
            variant={showForm ? 'outline' : 'default'}
            className="gap-2"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'New Badge'}
          </Button>
        </div>
      </div>

      {/* ── Import Panel ── */}
      {showImport && (
        <ImportPanel
          existingIds={existingIds}
          onImported={() => {
            refetch();
            setShowImport(false);
          }}
        />
      )}

      {/* ── Create / Edit Form ── */}
      {(showForm || editingBadge) && (
        <BadgeForm
          initial={editingBadge ?? undefined}
          onSave={() => { setShowForm(false); setEditingBadge(null); }}
          onCancel={() => { setShowForm(false); setEditingBadge(null); }}
        />
      )}

      <Separator />

      {/* ── My Badge List ── */}
      {isLoadingBadges ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border">
              <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : badges.length === 0 ? (
        <Alert>
          <Award className="h-4 w-4" />
          <AlertDescription>
            No NIP-58 badges on your account yet.{' '}
            <button className="underline hover:text-foreground" onClick={() => setShowForm(true)}>
              Create your first badge
            </button>{' '}or{' '}
            <button className="underline hover:text-foreground" onClick={() => setShowImport(true)}>
              import from ditto.pub
            </button>.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {badges.length} badge{badges.length !== 1 ? 's' : ''} on your account
          </p>
          {badges.map(badge => (
            <BadgeRow
              key={badge.id}
              badge={badge}
              awards={awards}
              onEdit={() => { setShowForm(false); setEditingBadge(badge); }}
              onDelete={() => setDeletingBadge(badge)}
              onAward={() => setAwardingBadge(badge)}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <AwardDialog
        badge={awardingBadge}
        open={!!awardingBadge}
        onClose={() => setAwardingBadge(null)}
      />
      <DeleteDialog
        badge={deletingBadge}
        open={!!deletingBadge}
        onClose={() => setDeletingBadge(null)}
      />
    </div>
  );
}
