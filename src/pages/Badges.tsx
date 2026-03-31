import { useState, useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNIP58BadgeDefinitions, useNIP58BadgeAwards } from '@/hooks/useNIP58Badges';
import { useAuthor } from '@/hooks/useAuthor';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Award, ExternalLink, Users, Sparkles, Copy, Check,
  Send, Edit, Trash2, Plus, Loader2, AlertTriangle, X
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { genUserName } from '@/lib/genUserName';
import { RelaySelector } from '@/components/RelaySelector';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { NIP58BadgeDefinition } from '@/hooks/useNIP58Badges';

// ─── helpers ──────────────────────────────────────────────────────────────────

function toPubkeyHex(value: string): string | null {
  const t = value.trim();
  if (/^[0-9a-f]{64}$/i.test(t)) return t.toLowerCase();
  try {
    const decoded = nip19.decode(t);
    if (decoded.type === 'npub') return decoded.data as string;
    if (decoded.type === 'nprofile') return (decoded.data as { pubkey: string }).pubkey;
  } catch { /* ignore */ }
  return null;
}

// ─── Awardee row ─────────────────────────────────────────────────────────────

function AwardeeRow({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors">
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={metadata?.picture} alt={displayName} />
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{displayName}</p>
        {metadata?.nip05 && (
          <p className="text-xs text-muted-foreground truncate">{metadata.nip05}</p>
        )}
      </div>
      <a
        href={`https://njump.me/${npub}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

// ─── Copy naddr ───────────────────────────────────────────────────────────────

function NAddrCopy({ naddr }: { naddr: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(`nostr:${naddr}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy naddr'}
    </Button>
  );
}

// ─── Award Dialog (admin only) ────────────────────────────────────────────────

function AwardDialog({
  badge,
  open,
  onClose,
}: {
  badge: NIP58BadgeDefinition | null;
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
          ['a', `30009:${badge.pubkey}:${badge.id}`],
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
            Issue <strong>{badge?.name}</strong> (kind:8) to Nostr users.
          </DialogDescription>
        </DialogHeader>

        {badge && (badge.image ?? badge.thumbs[0]?.url) && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <img
              src={badge.thumbs.find(t => t.size === '64x64')?.url ?? badge.image}
              alt={badge.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <p className="font-semibold text-sm">{badge.name}</p>
              {badge.description && <p className="text-xs text-muted-foreground line-clamp-1">{badge.description}</p>}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Recipient npub or hex pubkey</Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => { setInput(e.target.value); setInputError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              placeholder="npub1… or 64-char hex"
              className={inputError ? 'border-red-400' : ''}
            />
            <Button variant="outline" onClick={addRecipient} disabled={!input.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {inputError && <p className="text-xs text-red-500">{inputError}</p>}
        </div>

        {recipients.length > 0 && (
          <div className="border rounded-lg divide-y overflow-hidden max-h-48 overflow-y-auto">
            {recipients.map(pk => (
              <div key={pk} className="flex items-center gap-2 px-3 py-2">
                <p className="flex-1 text-xs font-mono truncate text-muted-foreground">
                  {nip19.npubEncode(pk).slice(0, 24)}…
                </p>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6 text-red-500"
                  onClick={() => setRecipients(p => p.filter(r => r !== pk))}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
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

// ─── Delete Dialog (admin only) ───────────────────────────────────────────────

function DeleteDialog({
  badge,
  open,
  onClose,
}: {
  badge: NIP58BadgeDefinition | null;
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
        content: 'Deleting NIP-58 badge definition',
        tags: [
          ['e', badge.event.id],
          ['a', `30009:${badge.pubkey}:${badge.id}`],
          ['k', '30009'],
        ],
      },
      {
        onSuccess: () => {
          toast.success(`Badge "${badge.name}" deleted.`);
          queryClient.invalidateQueries({ queryKey: ['nip58-badge-definitions'] });
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
            Publish a NIP-09 deletion request for <strong>{badge?.name}</strong>.
            Supporting relays will remove the event.
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

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function BadgeDetailDialog({
  badge,
  awards,
  open,
  onClose,
  isAdmin,
  onAward,
  onEdit,
  onDelete,
}: {
  badge: NIP58BadgeDefinition | null;
  awards: { badgeAddr: string; awardees: string[] }[];
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onAward: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!badge) return null;

  const highRes = badge.image ?? badge.thumbs.find(t => t.size === '512x512')?.url ?? badge.thumbs[0]?.url;
  const badgeCoord = `30009:${badge.pubkey}:${badge.id}`;
  const relevantAwards = awards.filter(a => a.badgeAddr === badgeCoord);
  const allAwardees = Array.from(new Set(relevantAwards.flatMap(a => a.awardees)));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{badge.name}</DialogTitle>
        </DialogHeader>

        {/* Hero */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0 w-full sm:w-40">
            {highRes ? (
              <img src={highRes} alt={badge.name} className="w-full sm:w-40 sm:h-40 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="w-full sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <Award className="h-16 w-16 text-purple-400" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-bold">{badge.name}</h2>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{badge.id}</p>
              {badge.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{badge.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                NIP-58
              </Badge>
              {allAwardees.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {allAwardees.length} {allAwardees.length === 1 ? 'holder' : 'holders'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <NAddrCopy naddr={badge.naddr} />
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <a href={`https://badges.page/a/${badge.naddr}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  badges.page
                </a>
              </Button>
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Button size="sm" className="gap-1.5 h-8 bg-purple-600 hover:bg-purple-700" onClick={() => { onClose(); onAward(); }}>
                  <Send className="h-3.5 w-3.5" />
                  Award
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => { onClose(); onEdit(); }}>
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-red-500 hover:text-red-600" onClick={() => { onClose(); onDelete(); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Awardees */}
        {allAwardees.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Badge Holders ({allAwardees.length})
            </h3>
            <div className="divide-y divide-border rounded-lg border overflow-hidden max-h-72 overflow-y-auto">
              {allAwardees.map(pk => <AwardeeRow key={pk} pubkey={pk} />)}
            </div>
          </div>
        )}

        {allAwardees.length === 0 && (
          <div className="mt-4 text-center py-6 text-muted-foreground text-sm">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No holders yet
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

function BadgeCard({
  definition,
  awardeeCount,
  onClick,
  isAdmin,
  onAward,
  onEdit,
  onDelete,
}: {
  definition: NIP58BadgeDefinition;
  awardeeCount: number;
  onClick: () => void;
  isAdmin: boolean;
  onAward: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const thumb =
    definition.thumbs.find(t => t.size === '256x256')?.url ??
    definition.thumbs[0]?.url ??
    definition.image;

  return (
    <Card className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20" onClick={onClick}>
        {thumb ? (
          <img src={thumb} alt={definition.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Award className="h-16 w-16 text-purple-300 dark:text-purple-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white text-sm font-semibold px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
            View Details
          </span>
        </div>

        {/* Admin quick actions overlay */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              className="h-7 w-7 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
              onClick={(e) => { e.stopPropagation(); onAward(); }}
              title="Award badge"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 shadow-lg"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Edit badge"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7 shadow-lg"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete badge"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <CardContent className="px-3 py-3" onClick={onClick}>
        <h3 className="font-semibold text-sm truncate mb-1 group-hover:text-purple-600 transition-colors">
          {definition.name}
        </h3>
        {awardeeCount > 0 ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{awardeeCount} {awardeeCount === 1 ? 'holder' : 'holders'}</span>
          </div>
        ) : definition.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2">{definition.description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function BadgesSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Edit Dialog (wraps BadgeManagement form inline) ─────────────────────────

function EditBadgeDialog({
  badge,
  open,
  onClose,
}: {
  badge: NIP58BadgeDefinition | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const queryClient = useQueryClient();

  const [name, setName] = useState(badge?.name ?? '');
  const [description, setDescription] = useState(badge?.description ?? '');
  const [imageUrl, setImageUrl] = useState(badge?.image ?? '');

  // Sync state when badge changes
  const [lastBadgeId, setLastBadgeId] = useState<string | null>(null);
  if (badge && badge.id !== lastBadgeId) {
    setName(badge.name);
    setDescription(badge.description ?? '');
    setImageUrl(badge.image ?? '');
    setLastBadgeId(badge.id);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const tags = await uploadFile(file);
      setImageUrl(tags[0][1]);
    } catch { toast.error('Image upload failed'); }
  };

  const handleSave = () => {
    if (!badge || !name.trim()) return;
    const tags: string[][] = [
      ['d', badge.id],
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
          toast.success('Badge updated!');
          queryClient.invalidateQueries({ queryKey: ['nip58-badge-definitions'] });
          onClose();
        },
        onError: (err) => toast.error('Failed: ' + (err as Error).message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-purple-600" />
            Edit Badge
          </DialogTitle>
          <DialogDescription>
            Update <strong>{badge?.id}</strong> (kind:30009 addressable event)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Badge Name *</Label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Badge name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this badge represent?"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Badge Image</Label>
            {imageUrl ? (
              <div className="flex items-center gap-3">
                <img src={imageUrl} alt="badge" className="w-16 h-16 rounded-xl object-cover border-2 border-purple-200" />
                <Button variant="outline" size="sm" onClick={() => setImageUrl('')}>
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed rounded-xl cursor-pointer hover:border-purple-400 transition-colors bg-muted/30">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-center">
                    <Award className="h-5 w-5 mx-auto text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={!name.trim() || isPending || isUploading}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Badges() {
  useSeoMeta({
    title: 'Badges - BitPopArt',
    description: 'Collect exclusive NIP-58 badges by BitPopArt. Issued on the Nostr protocol.',
  });

  const isAdmin = useIsAdmin();
  const { data: definitions = [], isLoading } = useNIP58BadgeDefinitions();

  const badgeAddrs = useMemo(
    () => definitions.map(d => `30009:${d.pubkey}:${d.id}`),
    [definitions]
  );
  const { data: awards = [] } = useNIP58BadgeAwards(badgeAddrs);

  const enriched = useMemo(() => {
    return definitions.map(def => {
      const coord = `30009:${def.pubkey}:${def.id}`;
      const relevant = awards.filter(a => a.badgeAddr === coord);
      const count = new Set(relevant.flatMap(a => a.awardees)).size;
      return { definition: def, awardeeCount: count };
    });
  }, [definitions, awards]);

  // Dialog state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [awardingId, setAwardingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedDef = definitions.find(d => d.id === selectedId) ?? null;
  const awardingDef = definitions.find(d => d.id === awardingId) ?? null;
  const editingDef = definitions.find(d => d.id === editingId) ?? null;
  const deletingDef = definitions.find(d => d.id === deletingId) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-3 gap-3">
            <Award className="h-9 w-9 text-purple-600" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Badges
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Exclusive NIP-58 Nostr badges by BitPopArt — collect &amp; display them on your profile.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3 w-3" />
              NIP-58 Standard
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              Kind 30009 · Kind 8
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs">
              Profile Badges: kind 10008
            </Badge>
            {isAdmin && (
              <Badge className="gap-1.5 bg-purple-600 text-white">
                <Edit className="h-3 w-3" />
                Admin Mode
              </Badge>
            )}
          </div>
        </div>

        {/* ── Badge Grid ── */}
        {isLoading ? (
          <BadgesSkeleton />
        ) : enriched.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {enriched.map(({ definition, awardeeCount }) => (
              <BadgeCard
                key={definition.id}
                definition={definition}
                awardeeCount={awardeeCount}
                onClick={() => setSelectedId(definition.id)}
                isAdmin={isAdmin}
                onAward={() => setAwardingId(definition.id)}
                onEdit={() => setEditingId(definition.id)}
                onDelete={() => setDeletingId(definition.id)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-4">
                <Award className="h-14 w-14 mx-auto text-muted-foreground opacity-40" />
                <p className="font-semibold">No badges published yet</p>
                <p className="text-sm text-muted-foreground">
                  Try switching to a different relay to find badges.
                </p>
                <RelaySelector className="w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── About NIP-58 ── */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card className="bg-white/60 dark:bg-gray-800/40 border-purple-100 dark:border-purple-900/30">
            <CardContent className="py-6 px-6 space-y-3">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                About Nostr Badges (NIP-58)
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Badges follow <strong>NIP-58</strong>. Each badge is a{' '}
                <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:30009</code> Badge Definition.
                Awards are issued as <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:8</code> events
                referencing the definition and listing recipients.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Profile badges use <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:10008</code> per{' '}
                <a href="https://github.com/nostr-protocol/nips/issues/2275" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600">
                  NIP proposal #2275
                </a>
                , replacing the older <code className="bg-muted rounded px-1 py-0.5 text-xs">kind:30008</code>.
              </p>
              <div className="flex gap-2 pt-1 flex-wrap">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/nostr-protocol/nips/blob/master/58.md" target="_blank" rel="noopener noreferrer" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    NIP-58 Spec
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://badges.page" target="_blank" rel="noopener noreferrer" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    badges.page
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Footer ── */}
        <div className="text-center mt-12 text-xs text-muted-foreground">
          <p>
            Powered by{' '}
            <a href="https://github.com/nostr-protocol/nips/blob/master/58.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600">
              NIP-58
            </a>{' '}
            &amp; Nostr ⚡
          </p>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <BadgeDetailDialog
        badge={selectedDef}
        awards={awards}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isAdmin={isAdmin}
        onAward={() => setAwardingId(selectedId)}
        onEdit={() => setEditingId(selectedId)}
        onDelete={() => setDeletingId(selectedId)}
      />
      <AwardDialog
        badge={awardingDef}
        open={!!awardingId}
        onClose={() => setAwardingId(null)}
      />
      <EditBadgeDialog
        badge={editingDef}
        open={!!editingId}
        onClose={() => setEditingId(null)}
      />
      <DeleteDialog
        badge={deletingDef}
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}
