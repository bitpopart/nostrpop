import { useState, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Gamepad2,
  Plus,
  Loader2,
  Trash2,
  Edit,
  X,
  Upload,
  ExternalLink,
  Save,
  AlertCircle,
} from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

// Built-in games use category=games + builtin=true in kind 36171
// The `r` tag holds the internal /games/xxx path
// The `builtin-id` tag holds the slug (e.g. "moneyprinter")

interface BuiltinGameForm {
  name: string;
  description: string;
  thumbnail: string;
  thumbnailEmoji: string;
  thumbnailGradient: string;
  internalPath: string; // e.g. /games/moneyprinter
  order: string;
}

const EMPTY_FORM: BuiltinGameForm = {
  name: '',
  description: '',
  thumbnail: '',
  thumbnailEmoji: '🎮',
  thumbnailGradient: 'from-violet-600 via-fuchsia-500 to-pink-500',
  internalPath: '',
  order: '',
};

const GRADIENT_OPTIONS = [
  { label: 'Violet → Pink', value: 'from-violet-600 via-fuchsia-500 to-pink-500' },
  { label: 'Orange → Yellow', value: 'from-orange-500 via-amber-400 to-yellow-400' },
  { label: 'Blue → Cyan', value: 'from-blue-600 via-cyan-500 to-teal-400' },
  { label: 'Green → Emerald', value: 'from-green-600 via-emerald-500 to-teal-400' },
  { label: 'Red → Orange', value: 'from-red-600 via-orange-500 to-amber-400' },
  { label: 'Purple → Blue', value: 'from-purple-600 via-blue-500 to-cyan-400' },
  { label: 'Bitcoin Orange', value: 'from-orange-600 via-orange-400 to-yellow-300' },
];

export function BuiltinGamesManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<NostrEvent | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<BuiltinGameForm>(EMPTY_FORM);

  // Fetch built-in games from Nostr (published by admin, category=games, builtin=true)
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['builtin-games-admin', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(4000)]);

      const [events, deletions] = await Promise.all([
        nostr.query(
          [{ kinds: [36171], authors: [user.pubkey], '#t': ['bitpopart-project'], '#t': ['builtin-game'], limit: 50 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [user.pubkey], limit: 200 }],
          { signal }
        ),
      ]);

      const deletedSet = new Set<string>();
      deletions.forEach(e => {
        e.tags.forEach(t => {
          if (t[0] === 'a') deletedSet.add(t[1]);
          if (t[0] === 'e') deletedSet.add(t[1]);
        });
      });

      return events
        .filter(e => {
          const d = e.tags.find(t => t[0] === 'd')?.[1];
          return !deletedSet.has(`36171:${e.pubkey}:${d}`) && !deletedSet.has(e.id);
        })
        .sort((a, b) => {
          const aO = parseInt(a.tags.find(t => t[0] === 'order')?.[1] || '999');
          const bO = parseInt(b.tags.find(t => t[0] === 'order')?.[1] || '999');
          return aO - bO;
        });
    },
    enabled: !!user?.pubkey,
  });

  const handleField = (k: keyof BuiltinGameForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return; }
    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      handleField('thumbnail', tags[0][1]);
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setIsUploading(false); }
  };

  const handleEdit = (event: NostrEvent) => {
    let content: Record<string, string> = {};
    try { content = JSON.parse(event.content); } catch { /* ignore */ }

    setForm({
      name: event.tags.find(t => t[0] === 'name')?.[1] || content.name || '',
      description: content.description || '',
      thumbnail: event.tags.find(t => t[0] === 'image')?.[1] || content.thumbnail || '',
      thumbnailEmoji: event.tags.find(t => t[0] === 'emoji')?.[1] || '🎮',
      thumbnailGradient: event.tags.find(t => t[0] === 'gradient')?.[1] || GRADIENT_OPTIONS[0].value,
      internalPath: event.tags.find(t => t[0] === 'r')?.[1] || '',
      order: event.tags.find(t => t[0] === 'order')?.[1] || '',
    });
    setEditingEvent(event);
    setIsCreating(true);
  };

  const handleDelete = (event: NostrEvent) => {
    const d = event.tags.find(t => t[0] === 'd')?.[1];
    if (!d) return;
    if (!confirm('Delete this built-in game?')) return;

    createEvent(
      { kind: 5, content: 'Deleted builtin game', tags: [['a', `36171:${event.pubkey}:${d}`]] },
      {
        onSuccess: () => {
          toast.success('Game deleted');
          queryClient.invalidateQueries({ queryKey: ['builtin-games-admin'] });
          queryClient.invalidateQueries({ queryKey: ['builtin-games'] });
        },
      }
    );
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingEvent(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.internalPath.trim()) { toast.error('Internal path is required (e.g. /games/moneyprinter)'); return; }

    const d = editingEvent?.tags.find(t => t[0] === 'd')?.[1]
      || `builtin-${form.internalPath.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase()}-${Date.now()}`;

    const tags: string[][] = [
      ['d', d],
      ['name', form.name.trim()],
      ['t', 'bitpopart-project'],
      ['t', 'builtin-game'],
      ['category', 'games'],
      ['builtin', 'true'],
      ['r', form.internalPath.trim()],
      ['emoji', form.thumbnailEmoji],
      ['gradient', form.thumbnailGradient],
    ];
    if (form.thumbnail) tags.push(['image', form.thumbnail]);
    if (form.order) tags.push(['order', form.order]);

    const content = JSON.stringify({
      name: form.name.trim(),
      description: form.description.trim(),
      thumbnail: form.thumbnail,
    });

    createEvent(
      { kind: 36171, content, tags },
      {
        onSuccess: () => {
          toast.success(editingEvent ? 'Game updated!' : 'Game added!');
          queryClient.invalidateQueries({ queryKey: ['builtin-games-admin'] });
          queryClient.invalidateQueries({ queryKey: ['builtin-games'] });
          handleCancel();
        },
        onError: () => toast.error('Failed to save game'),
      }
    );
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <AlertCircle className="h-4 w-4" />
        <span>Log in to manage built-in games.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Built-in games always appear on <a href="/games" className="underline text-orange-600">/games</a>.
          They route to internal pages like <code className="text-xs bg-muted px-1 rounded">/games/moneyprinter</code>.
        </p>
        {!isCreating && (
          <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            Add Game
          </Button>
        )}
      </div>

      {/* Create / Edit form */}
      {isCreating && (
        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-violet-600" />
                {editingEvent ? 'Edit Built-in Game' : 'Add Built-in Game'}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="bg-name">Game Name *</Label>
                <Input
                  id="bg-name"
                  placeholder="Money Printer Mayhem"
                  value={form.name}
                  onChange={e => handleField('name', e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="bg-desc">Description</Label>
                <Textarea
                  id="bg-desc"
                  placeholder="Short description shown on the games page card…"
                  value={form.description}
                  onChange={e => handleField('description', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Internal path */}
              <div className="space-y-1.5">
                <Label htmlFor="bg-path">Internal Path *</Label>
                <Input
                  id="bg-path"
                  placeholder="/games/moneyprinter"
                  value={form.internalPath}
                  onChange={e => handleField('internalPath', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">The React Router path for this game, e.g. <code>/games/quiz21</code></p>
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <Label>Thumbnail Image (optional)</Label>
                {form.thumbnail ? (
                  <div className="relative rounded-lg overflow-hidden border h-36">
                    <img src={form.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleField('thumbnail', '')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      Upload image
                    </Button>
                    <span className="text-xs text-muted-foreground">or use emoji + gradient below</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Emoji fallback */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bg-emoji">Emoji (fallback)</Label>
                  <Input
                    id="bg-emoji"
                    placeholder="🎮"
                    value={form.thumbnailEmoji}
                    onChange={e => handleField('thumbnailEmoji', e.target.value)}
                    className="text-2xl"
                    maxLength={4}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bg-order">Display Order</Label>
                  <Input
                    id="bg-order"
                    type="number"
                    placeholder="1"
                    value={form.order}
                    onChange={e => handleField('order', e.target.value)}
                  />
                </div>
              </div>

              {/* Gradient picker */}
              <div className="space-y-1.5">
                <Label>Gradient (fallback background)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GRADIENT_OPTIONS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      className={`rounded-lg h-10 bg-gradient-to-br ${g.value} border-2 transition-all text-white text-xs font-bold shadow-sm ${form.thumbnailGradient === g.value ? 'border-black ring-2 ring-offset-1 ring-violet-500 scale-105' : 'border-transparent hover:scale-102'}`}
                      onClick={() => handleField('thumbnailGradient', g.value)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-1.5">
                <Label>Preview</Label>
                <div className={`relative h-24 rounded-xl overflow-hidden bg-gradient-to-br ${form.thumbnailGradient} flex items-center justify-center border`}>
                  {form.thumbnail ? (
                    <img src={form.thumbnail} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">{form.thumbnailEmoji || '🎮'}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 gap-1.5">
                  <Save className="h-4 w-4" />
                  {editingEvent ? 'Update Game' : 'Add Game'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Games list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading games…
        </div>
      ) : games.length === 0 && !isCreating ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Gamepad2 className="h-10 w-10 mx-auto text-violet-300" />
            <p className="text-muted-foreground text-sm">No built-in games yet.</p>
            <Button size="sm" variant="outline" onClick={() => setIsCreating(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add your first game
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {games.map(event => {
            let content: Record<string, string> = {};
            try { content = JSON.parse(event.content); } catch { /* ignore */ }

            const name = event.tags.find(t => t[0] === 'name')?.[1] || content.name || 'Unnamed';
            const description = content.description || '';
            const thumbnail = event.tags.find(t => t[0] === 'image')?.[1] || content.thumbnail || '';
            const emoji = event.tags.find(t => t[0] === 'emoji')?.[1] || '🎮';
            const gradient = event.tags.find(t => t[0] === 'gradient')?.[1] || 'from-violet-600 via-fuchsia-500 to-pink-500';
            const path = event.tags.find(t => t[0] === 'r')?.[1] || '';
            const order = event.tags.find(t => t[0] === 'order')?.[1];

            return (
              <div
                key={event.id}
                className="rounded-xl border-2 border-violet-200 dark:border-violet-800 overflow-hidden"
              >
                {/* Thumbnail strip */}
                <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                  {thumbnail ? (
                    <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">{emoji}</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-3 flex items-center gap-2">
                    <span className="text-white font-bold text-sm drop-shadow">{name}</span>
                    {order && <Badge variant="secondary" className="text-xs"># {order}</Badge>}
                  </div>
                </div>

                {/* Info + actions */}
                <div className="flex items-start justify-between gap-3 bg-violet-50 dark:bg-violet-900/20 px-4 py-3">
                  <div className="min-w-0">
                    {description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
                    )}
                    {path && (
                      <code className="text-xs text-violet-700 dark:text-violet-300 mt-1 block">{path}</code>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-violet-400 text-violet-700 hover:bg-violet-100 dark:border-violet-600 dark:text-violet-300"
                      onClick={() => window.open(path, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Play
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-violet-400 text-violet-700 hover:bg-violet-100 dark:border-violet-600 dark:text-violet-300"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                      onClick={() => handleDelete(event)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
