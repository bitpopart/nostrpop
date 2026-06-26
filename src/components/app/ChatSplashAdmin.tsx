/**
 * ChatSplashAdmin — admin UI for animated chat splash scenes + reusable characters.
 *
 * Tabs:
 *   "Scenes"     — list / create / edit / delete chat scenes
 *   "Characters" — manage reusable messenger accounts (name + avatar)
 *
 * Inside the scene editor each message row has a "Pick character" dropdown
 * that instantly fills in the name + avatar from the saved roster.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Eye,
  ChevronUp,
  ChevronDown,
  Upload,
  RefreshCw,
  Shuffle,
  UserCircle2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Users,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  useChatSplashScenes,
  usePublishChatScene,
  useDeleteChatScene,
  useChatCharacters,
  usePublishChatCharacter,
  useDeleteChatCharacter,
  type ChatMessage,
  type ChatScene,
  type ChatCharacter,
} from '@/hooks/useChatSplash';
import { AnimatedChatSplash } from './AnimatedChatSplash';

// ════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMessage(side: 'left' | 'right' = 'left', index = 0): ChatMessage {
  return {
    id: `msg-${generateId()}`,
    avatar: '',
    name: '',
    text: '',
    imageUrl: undefined,
    linkUrl: undefined,
    linkLabel: undefined,
    side,
    delay: index * 800,
  };
}

// ════════════════════════════════════════════════════════════
// Shared upload helpers
// ════════════════════════════════════════════════════════════

function AvatarUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const { mutateAsync: uploadFile, isPending } = useUploadFile();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const [[, url]] = await uploadFile(file); onChange(url); } catch { /**/ }
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {value
          ? <img src={value} alt="avatar" className="w-full h-full object-cover" />
          : <UserCircle2 className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 flex gap-1.5">
        <Input placeholder="Avatar URL…" value={value} onChange={e => onChange(e.target.value)} className="text-xs h-8" />
        <label className="cursor-pointer">
          <Button size="sm" variant="outline" className="h-8 px-2 pointer-events-none" asChild>
            <span>{isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}</span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

function ImageUpload({ value, onChange, placeholder = 'Image URL…' }: { value: string; onChange: (url: string) => void; placeholder?: string }) {
  const { mutateAsync: uploadFile, isPending } = useUploadFile();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const [[, url]] = await uploadFile(file); onChange(url); } catch { /**/ }
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {value
          ? <img src={value} alt="" className="w-full h-full object-cover" />
          : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 flex gap-1.5">
        <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="text-xs h-8" />
        <label className="cursor-pointer">
          <Button size="sm" variant="outline" className="h-8 px-2 pointer-events-none" asChild>
            <span>{isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}</span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Characters panel
// ════════════════════════════════════════════════════════════

interface CharacterFormState {
  dTag: string;
  name: string;
  avatar: string;
}

function CharacterRow({
  char,
  onEdit,
  onDelete,
}: {
  char: ChatCharacter;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
      {char.avatar
        ? <img src={char.avatar} alt={char.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0" />
        : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {char.name.charAt(0).toUpperCase()}
          </div>
      }
      <span className="flex-1 font-semibold text-sm">{char.name}</span>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} title="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onDelete} title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CharacterForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: CharacterFormState;
  onSave: (c: CharacterFormState) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [avatar, setAvatar] = useState(initial.avatar);

  return (
    <div className="rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50/60 dark:bg-orange-900/10 p-3 space-y-2">
      <Input
        placeholder="Character name…"
        value={name}
        onChange={e => setName(e.target.value)}
        className="h-8 text-sm font-semibold"
        autoFocus
      />
      <AvatarUpload value={avatar} onChange={setAvatar} />
      <div className="flex gap-2 justify-end pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1.5 h-8">
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => { if (name.trim()) onSave({ dTag: initial.dTag, name: name.trim(), avatar }); }}
          disabled={!name.trim()}
          className="gap-1.5 h-8"
        >
          <Check className="h-3.5 w-3.5" /> Save
        </Button>
      </div>
    </div>
  );
}

function CharactersPanel() {
  const { data: characters = [], isLoading } = useChatCharacters();
  const { mutate: publish, isPending: saving } = usePublishChatCharacter();
  const { mutate: deleteChar } = useDeleteChatCharacter();

  // null = none open; 'new' = new form; string = dTag being edited
  const [formState, setFormState] = useState<CharacterFormState | null>(null);

  const handleSave = (fs: CharacterFormState) => {
    publish({ dTag: fs.dTag, name: fs.name, avatar: fs.avatar }, {
      onSuccess: () => setFormState(null),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-violet-600" />
          Chat Characters
        </CardTitle>
        <CardDescription>
          Create reusable messengers — give each one a name and avatar. In the scene
          editor you can pick any character to instantly fill in a message's name and avatar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {characters.map(char => (
              formState?.dTag === char.id
                ? <CharacterForm
                    key={char.id}
                    initial={formState}
                    onSave={handleSave}
                    onCancel={() => setFormState(null)}
                  />
                : <CharacterRow
                    key={char.id}
                    char={char}
                    onEdit={() => setFormState({ dTag: char.id, name: char.name, avatar: char.avatar })}
                    onDelete={() => deleteChar({ dTag: char.id })}
                  />
            ))}

            {/* New character form */}
            {formState?.dTag === '__new__'
              ? <CharacterForm
                  initial={formState}
                  onSave={handleSave}
                  onCancel={() => setFormState(null)}
                />
              : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-dashed"
                  onClick={() => setFormState({ dTag: `char-${generateId()}`, name: '', avatar: '' })}
                  disabled={saving}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add character
                </Button>
              )
            }

            {characters.length === 0 && !formState && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No characters yet — add your first one above.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════
// Character picker — used inside each message row
// ════════════════════════════════════════════════════════════

function CharacterPicker({
  currentName,
  currentAvatar,
  onPick,
}: {
  currentName: string;
  currentAvatar: string;
  onPick: (name: string, avatar: string) => void;
}) {
  const { data: characters = [] } = useChatCharacters();
  const [open, setOpen] = useState(false);

  // Find if current name+avatar matches a saved character
  const matched = characters.find(c => c.name === currentName && c.avatar === currentAvatar);

  if (characters.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40"
      >
        <Users className="h-3 w-3" />
        {matched ? matched.name : 'Pick character'}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-xl border bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
              {characters.map(char => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => { onPick(char.name, char.avatar); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/20 ${
                    matched?.id === char.id ? 'bg-orange-50 dark:bg-orange-900/20 font-semibold' : ''
                  }`}
                >
                  {char.avatar
                    ? <img src={char.avatar} alt={char.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {char.name.charAt(0).toUpperCase()}
                      </div>
                  }
                  <span className="truncate">{char.name}</span>
                  {matched?.id === char.id && <Check className="h-3.5 w-3.5 ml-auto text-orange-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Message editor row
// ════════════════════════════════════════════════════════════

function MessageRow({
  msg, index, total, onUpdate, onDelete, onMoveUp, onMoveDown,
}: {
  msg: ChatMessage;
  index: number;
  total: number;
  onUpdate: (updated: ChatMessage) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const isRight = msg.side === 'right';

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${
      isRight
        ? 'bg-orange-50/60 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      {/* ── Header row: order buttons + number + side toggle + delete ── */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onMoveUp} disabled={index === 0}>
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onMoveDown} disabled={index === total - 1}>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground w-5 text-center font-bold">{index + 1}</span>

        {/* Side toggle */}
        <button
          type="button"
          onClick={() => onUpdate({ ...msg, side: isRight ? 'left' : 'right' })}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition-colors ${
            isRight
              ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300'
          }`}
        >
          {isRight ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
          {isRight ? 'Right →' : '← Left'}
        </button>

        {/* Character picker — lives here so it's always visible */}
        <CharacterPicker
          currentName={msg.name}
          currentAvatar={msg.avatar}
          onPick={(name, avatar) => onUpdate({ ...msg, name, avatar })}
        />

        <div className="flex-1" />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Speaker name ── */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">Speaker name</Label>
        <Input
          placeholder="Name…"
          value={msg.name}
          onChange={e => onUpdate({ ...msg, name: e.target.value })}
          className="text-xs h-8"
        />
      </div>

      {/* ── Avatar ── */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">Avatar</Label>
        <AvatarUpload value={msg.avatar} onChange={url => onUpdate({ ...msg, avatar: url })} />
      </div>

      {/* ── Message text ── */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">Message text (URLs auto-link)</Label>
        <Textarea
          placeholder="What does this person say?"
          value={msg.text}
          onChange={e => onUpdate({ ...msg, text: e.target.value })}
          rows={2}
          className="text-xs resize-none"
        />
      </div>

      {/* ── Image in bubble ── */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
          <ImageIcon className="h-3 w-3" /> Image in bubble (optional)
        </Label>
        <ImageUpload
          value={msg.imageUrl || ''}
          onChange={url => onUpdate({ ...msg, imageUrl: url || undefined })}
          placeholder="Image URL or upload…"
        />
      </div>

      {/* ── CTA link ── */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
            <LinkIcon className="h-3 w-3" /> Link URL (optional)
          </Label>
          <Input
            placeholder="https://… or /app/wallpapers"
            value={msg.linkUrl || ''}
            onChange={e => onUpdate({ ...msg, linkUrl: e.target.value || undefined })}
            className="text-xs h-8"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">Link button label</Label>
          <Input
            placeholder="e.g. Get wallpapers"
            value={msg.linkLabel || ''}
            onChange={e => onUpdate({ ...msg, linkLabel: e.target.value || undefined })}
            className="text-xs h-8"
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Scene editor
// ════════════════════════════════════════════════════════════

function SceneEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<ChatScene> | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initial?.messages || [emptyMessage('left', 0), emptyMessage('right', 1)]
  );
  const [previewKey, setPreviewKey] = useState(0);
  const { mutate: publish, isPending } = usePublishChatScene();
  const dTag = initial?.id || `chat-scene-${generateId()}`;

  const addMessage = () => {
    const lastSide = messages[messages.length - 1]?.side || 'left';
    setMessages(prev => [...prev, emptyMessage(lastSide === 'left' ? 'right' : 'left', prev.length)]);
  };

  const updateMessage = useCallback((index: number, updated: ChatMessage) => {
    setMessages(prev => prev.map((m, i) => i === index ? updated : m));
  }, []);

  const deleteMessage = useCallback((index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setMessages(prev => { const n = [...prev]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n; });
  }, []);

  const moveDown = useCallback((index: number) => {
    setMessages(prev => {
      if (index >= prev.length - 1) return prev;
      const n = [...prev]; [n[index], n[index + 1]] = [n[index + 1], n[index]]; return n;
    });
  }, []);

  const handleSave = () => {
    publish({ dTag, title: title || 'Untitled Scene', enabled, messages }, { onSuccess: onSave });
  };

  const previewScene: ChatScene = {
    id: dTag,
    title: title || 'Preview',
    enabled: true,
    messages,
    event: {} as never,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h2 className="text-lg font-bold flex-1">{initial?.id ? 'Edit Scene' : 'New Scene'}</h2>
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {isPending ? 'Saving…' : 'Save Scene'}
        </Button>
      </div>

      {/* Scene meta */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Scene title (admin only)</Label>
              <Input
                placeholder="e.g. Welcome intro, Bitcoin promo…"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Label className="text-xs text-muted-foreground">Active</Label>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Message list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Messages ({messages.length})</h3>
            <Button size="sm" variant="outline" onClick={addMessage} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add message
            </Button>
          </div>

          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
              No messages yet — add the first one above.
            </div>
          )}

          <div className="space-y-2">
            {messages.map((msg, i) => (
              <MessageRow
                key={msg.id}
                msg={msg}
                index={i}
                total={messages.length}
                onUpdate={updated => updateMessage(i, updated)}
                onDelete={() => deleteMessage(i)}
                onMoveUp={() => moveUp(i)}
                onMoveDown={() => moveDown(i)}
              />
            ))}
          </div>

          {messages.length > 0 && (
            <Button size="sm" variant="outline" onClick={addMessage} className="w-full gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add message
            </Button>
          )}
        </div>

        {/* Live preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-500" /> Live Preview
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setPreviewKey(k => k + 1)} className="gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Replay
            </Button>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-yellow-900/10 p-4 min-h-[200px]">
            {messages.length === 0
              ? <p className="text-xs text-muted-foreground text-center pt-8">Add some messages to preview.</p>
              : <AnimatedChatSplash key={previewKey} replayKey={previewKey} _overrideScene={previewScene} />
            }
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Press Replay to restart the animation.
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Scene list item
// ════════════════════════════════════════════════════════════

function SceneListItem({
  scene, onEdit, onDelete, onToggle,
}: {
  scene: ChatScene;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <Card className={`overflow-hidden transition-all ${!scene.enabled ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Switch checked={scene.enabled} onCheckedChange={onToggle} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{scene.title}</span>
              <Badge variant={scene.enabled ? 'default' : 'secondary'} className="text-[10px]">
                {scene.enabled ? 'Active' : 'Disabled'}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {scene.messages.length} msg{scene.messages.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            {/* Speaker avatars preview */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {Array.from(new Map(scene.messages.map(m => [m.name, m])).values())
                .slice(0, 6)
                .map(m => (
                  <div key={m.name} className="flex items-center gap-1" title={m.name}>
                    {m.avatar
                      ? <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover border border-gray-200" />
                      : <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="text-[10px] text-muted-foreground">{m.name}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={onEdit} className="text-xs h-8">Edit</Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════
// Main admin component (with Scenes / Characters tabs)
// ════════════════════════════════════════════════════════════

interface ChatSplashAdminProps {
  onBack: () => void;
}

export function ChatSplashAdmin({ onBack }: ChatSplashAdminProps) {
  const { data: scenes = [], isLoading } = useChatSplashScenes();
  const { mutate: deleteScene } = useDeleteChatScene();
  const { mutate: publish } = usePublishChatScene();

  const [activeSection, setActiveSection] = useState<'scenes' | 'characters'>('scenes');
  const [editing, setEditing] = useState<ChatScene | 'new' | null>(null);

  const handleToggle = (scene: ChatScene) => {
    publish({ dTag: scene.id, title: scene.title, enabled: !scene.enabled, messages: scene.messages });
  };

  // ── Scene editor ─────────────────────────────────────────
  if (editing !== null) {
    return (
      <SceneEditor
        initial={editing === 'new' ? null : editing}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  // ── Main view ─────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Fan App Overview
      </Button>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveSection('scenes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeSection === 'scenes'
              ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-orange-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Scenes
          {scenes.length > 0 && (
            <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded-full font-bold">
              {scenes.filter(s => s.enabled).length}/{scenes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('characters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeSection === 'characters'
              ? 'bg-white dark:bg-gray-700 shadow text-violet-600 dark:text-violet-400'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Characters
        </button>
      </div>

      {/* ── Scenes list ──────────────────────────────────── */}
      {activeSection === 'scenes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Chat Splash Scenes
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
                <Shuffle className="h-3 w-3" /> Random pick
              </span>
            </CardTitle>
            <CardDescription>
              One enabled scene is chosen <strong>at random</strong> per page load on{' '}
              <a href="/app" className="underline text-orange-600">/app</a>.
              Use the <strong>Characters</strong> tab to manage reusable messengers, then pick
              them quickly in the scene editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {scenes.length === 0
                  ? 'No scenes yet.'
                  : `${scenes.filter(s => s.enabled).length} active of ${scenes.length} total`}
              </p>
              <Button onClick={() => setEditing('new')} className="gap-2">
                <Plus className="h-4 w-4" /> New Scene
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : scenes.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl space-y-3">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No chat scenes yet.</p>
                <Button variant="outline" onClick={() => setEditing('new')} className="gap-2">
                  <Plus className="h-4 w-4" /> Create your first scene
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {scenes.map(scene => (
                  <SceneListItem
                    key={scene.id}
                    scene={scene}
                    onEdit={() => setEditing(scene)}
                    onDelete={() => deleteScene({ dTag: scene.id })}
                    onToggle={() => handleToggle(scene)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Characters panel ────────────────────────────── */}
      {activeSection === 'characters' && <CharactersPanel />}
    </div>
  );
}
