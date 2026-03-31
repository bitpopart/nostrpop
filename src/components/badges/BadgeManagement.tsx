import { useState } from 'react';
import { useNostr } from '@nostrify/react';
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
  Users, ExternalLink, AlertTriangle, Check, RefreshCw
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { toast } from 'sonner';
import { genUserName } from '@/lib/genUserName';
import { useAuthor } from '@/hooks/useAuthor';
import type { NostrEvent } from '@nostrify/nostrify';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NIP58Badge {
  /** d tag — unique slug e.g. "bravery" */
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

// ─── Small helpers ─────────────────────────────────────────────────────────────

function naddrFor(pubkey: string, id: string) {
  return `30009:${pubkey}:${id}`;
}

/** Decode an npub or hex pubkey to hex. Returns null on error. */
function toPubkeyHex(value: string): string | null {
  const trimmed = value.trim();
  if (/^[0-9a-f]{64}$/i.test(trimmed)) return trimmed.toLowerCase();
  try {
    const decoded = nip19.decode(trimmed);
    if (decoded.type === 'npub') return decoded.data as string;
    if (decoded.type === 'nprofile') return (decoded.data as { pubkey: string }).pubkey;
  } catch {
    // fall through
  }
  return null;
}

// ─── Awardee row (mini profile) ───────────────────────────────────────────────

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
      <a
        href={`https://njump.me/${npub}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground"
      >
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
    if (!hex) {
      setInputError('Invalid npub or hex pubkey');
      return;
    }
    if (recipients.includes(hex)) {
      setInputError('Already added');
      return;
    }
    setRecipients(prev => [...prev, hex]);
    setInput('');
    setInputError('');
  };

  const removeRecipient = (pk: string) => {
    setRecipients(prev => prev.filter(p => p !== pk));
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
        onError: (err) => {
          toast.error('Failed to award badge: ' + (err as Error).message);
        },
      }
    );
  };

  const handleClose = () => {
    setRecipients([]);
    setInput('');
    setInputError('');
    onClose();
  };

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
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="font-semibold text-sm">{badge.name}</p>
              {badge.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{badge.description}</p>
              )}
            </div>
          </div>
        )}

        {/* npub input */}
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

        {/* Recipient list */}
        {recipients.length > 0 && (
          <div className="border rounded-lg overflow-hidden divide-y divide-border max-h-52 overflow-y-auto">
            {recipients.map(pk => (
              <AwardeeRow key={pk} pubkey={pk} onRemove={() => removeRecipient(pk)} />
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

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────

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
    // NIP-09: delete event (kind 5) referencing the badge definition event
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
          onClose();
        },
        onError: (err) => {
          toast.error('Failed to delete: ' + (err as Error).message);
        },
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
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={isPending}
          >
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

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image ?? '');
  // Custom slug — only editable when creating (addressable events use d-tag as identifier)
  const [slug, setSlug] = useState(initial?.id ?? '');
  const queryClient = useQueryClient();

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

    // Build NIP-58 kind 30009 event
    const tags: string[][] = [
      ['d', slug.trim()],
      ['name', name.trim()],
      ['alt', `NIP-58 Badge: ${name.trim()}`],
    ];
    if (description.trim()) tags.push(['description', description.trim()]);
    if (imageUrl) {
      tags.push(['image', imageUrl, '1024x1024']);
      // Also publish a thumb at standard sizes (same URL — relays keep originals)
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
          onSave();
        },
        onError: (err) => {
          toast.error('Failed: ' + (err as Error).message);
        },
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
        {/* Slug (d-tag) */}
        <div className="space-y-1.5">
          <Label htmlFor="slug">Badge ID (slug) *</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="e.g. early-supporter"
            disabled={!!initial} // d-tag can't change on edit (it's the addressable key)
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier — used as the <code>d</code> tag. Cannot be changed after creation.
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="badge-name">Badge Name *</Label>
          <Input
            id="badge-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Early Supporter"
          />
        </div>

        {/* Description */}
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

        {/* Image */}
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
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </div>
              )}
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

// ─── Badge Row Card ────────────────────────────────────────────────────────────

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
  const relevant = awards.filter(a => a.badgeAddr === coord);
  const allAwardees = Array.from(new Set(relevant.flatMap(a => a.awardees)));
  const thumb = badge.thumbs.find(t => t.size === '64x64')?.url ?? badge.image;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border bg-white dark:bg-gray-800/80 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt={badge.name} className="w-full h-full object-cover" />
        ) : (
          <Award className="h-8 w-8 text-purple-400" />
        )}
      </div>

      {/* Info */}
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
          <span className="text-border">·</span>
          <span>kind:30009</span>
        </div>
      </div>

      {/* Actions */}
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

  // ── Fetch all kind 30009 events from the logged-in user ──
  const { data: badges = [], isLoading: isLoadingBadges, refetch } = useQuery({
    queryKey: ['nip58-admin-badges', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      const events = await nostr.query(
        [{ kinds: [30009], authors: [user.pubkey], limit: 200 }],
        { signal }
      );

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
    },
    enabled: !!user?.pubkey,
  });

  // ── Fetch kind 8 awards ──
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
            Create <code className="bg-muted rounded px-1 text-xs">kind:30009</code> Badge Definitions,
            award them via <code className="bg-muted rounded px-1 text-xs">kind:8</code> to any Nostr npub.
          </p>
        </div>
        <div className="flex gap-2">
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
            onClick={() => { setEditingBadge(null); setShowForm(!showForm); }}
            variant={showForm ? 'outline' : 'default'}
            className="gap-2"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'New Badge'}
          </Button>
        </div>
      </div>

      {/* ── Create / Edit form ── */}
      {(showForm || editingBadge) && (
        <BadgeForm
          initial={editingBadge ?? undefined}
          onSave={() => { setShowForm(false); setEditingBadge(null); }}
          onCancel={() => { setShowForm(false); setEditingBadge(null); }}
        />
      )}

      <Separator />

      {/* ── Badge list ── */}
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
            No NIP-58 badges found on your account.{' '}
            <button className="underline hover:text-foreground" onClick={() => setShowForm(true)}>
              Create your first badge.
            </button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{badges.length} badge{badges.length !== 1 ? 's' : ''}</p>
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
        onClose={() => { setDeletingBadge(null); }}
      />
    </div>
  );
}
