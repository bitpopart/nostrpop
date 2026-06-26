/**
 * ChatSplashAdmin — admin UI for creating/editing animated chat splash scenes.
 *
 * Features:
 * - List all scenes with enable/disable toggle and delete
 * - Create new scene or edit existing one
 * - Within a scene: add/reorder/delete messages
 * - Each message: avatar (image URL or upload), name, text (multi-line), side (left/right)
 * - Live preview of the animation
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
} from 'lucide-react';
import { useUploadFile } from '@/hooks/useUploadFile';
import {
  useChatSplashScenes,
  usePublishChatScene,
  useDeleteChatScene,
  type ChatMessage,
  type ChatScene,
} from '@/hooks/useChatSplash';
import { AnimatedChatSplash } from './AnimatedChatSplash';

// ── Helpers ────────────────────────────────────────────────

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyMessage(side: 'left' | 'right' = 'left', index = 0): ChatMessage {
  return {
    id: generateId(),
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

// ── Avatar upload button ───────────────────────────────────

function AvatarUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { mutateAsync: uploadFile, isPending } = useUploadFile();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const [[, url]] = await uploadFile(file);
      onChange(url);
    } catch { /* noop */ }
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Preview */}
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {value ? (
          <img src={value} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <UserCircle2 className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 flex gap-1.5">
        <Input
          placeholder="Avatar URL…"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-xs h-8"
        />
        <label className="cursor-pointer">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 gap-1 text-xs pointer-events-none"
            asChild
          >
            <span>
              {isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

// ── Image upload field ─────────────────────────────────────

function ImageUpload({
  value,
  onChange,
  placeholder = 'Image URL…',
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const { mutateAsync: uploadFile, isPending } = useUploadFile();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const [[, url]] = await uploadFile(file);
      onChange(url);
    } catch { /* noop */ }
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Preview */}
      <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 flex gap-1.5">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-xs h-8"
        />
        <label className="cursor-pointer">
          <Button size="sm" variant="outline" className="h-8 px-2 pointer-events-none" asChild>
            <span>
              {isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

// ── Message editor row ─────────────────────────────────────

function MessageRow({
  msg,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
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
    <div className={`rounded-xl border p-3 space-y-2 ${
      isRight
        ? 'bg-orange-50/60 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-2">
        {/* Move buttons */}
        <div className="flex flex-col gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <span className="text-xs text-muted-foreground w-5 text-center font-bold">{index + 1}</span>

        {/* Side toggle */}
        <button
          type="button"
          onClick={() => onUpdate({ ...msg, side: isRight ? 'left' : 'right' })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
            isRight
              ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
          title="Toggle side"
        >
          {isRight ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
          {isRight ? 'Right →' : '← Left'}
        </button>

        <div className="flex-1" />

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          title="Delete message"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Name */}
      <Input
        placeholder="Speaker name…"
        value={msg.name}
        onChange={e => onUpdate({ ...msg, name: e.target.value })}
        className="text-xs h-8"
      />

      {/* Avatar URL + upload */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">Avatar</Label>
        <AvatarUpload value={msg.avatar} onChange={url => onUpdate({ ...msg, avatar: url })} />
      </div>

      {/* Message text */}
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

      {/* Image in bubble */}
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

      {/* CTA link */}
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

// ── Scene editor ───────────────────────────────────────────

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

  const dTag = initial?.id || `chat-scene-${Date.now()}`;

  const addMessage = () => {
    // Alternate sides
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
    setMessages(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setMessages(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleSave = () => {
    publish({ dTag, title: title || 'Untitled Scene', enabled, messages }, {
      onSuccess: onSave,
    });
  };

  // Preview uses a mock scene built from current state
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
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-lg font-bold flex-1">
          {initial?.id ? 'Edit Scene' : 'New Scene'}
        </h2>
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
              <Plus className="h-3.5 w-3.5" />
              Add message
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
              <Plus className="h-3.5 w-3.5" />
              Add message
            </Button>
          )}
        </div>

        {/* Live preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-500" />
              Live Preview
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewKey(k => k + 1)}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replay
            </Button>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/10 dark:to-yellow-900/10 p-4 min-h-[200px]">
            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-8">Add some messages to preview.</p>
            ) : (
              /* Re-mount component entirely on replay to reset animation */
              <AnimatedChatSplash key={previewKey} replayKey={previewKey} _overrideScene={previewScene} />
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            The animation plays through automatically. Press Replay to restart.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Scene list item ────────────────────────────────────────

function SceneListItem({
  scene,
  onEdit,
  onDelete,
  onToggle,
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
          {/* Toggle */}
          <Switch
            checked={scene.enabled}
            onCheckedChange={onToggle}
            title={scene.enabled ? 'Disable scene' : 'Enable scene'}
          />

          {/* Info */}
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
            {/* Message preview text */}
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {scene.messages.map(m => m.name || '?').filter(Boolean).join(', ') || 'No speakers'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5 text-xs h-8">
              Edit
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              title="Delete scene"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main admin component ───────────────────────────────────

interface ChatSplashAdminProps {
  onBack: () => void;
}

export function ChatSplashAdmin({ onBack }: ChatSplashAdminProps) {
  const { data: scenes = [], isLoading } = useChatSplashScenes();
  const { mutate: deleteScene } = useDeleteChatScene();
  const { mutate: publish } = usePublishChatScene();

  // null = list view, 'new' or a scene = editor view
  const [editing, setEditing] = useState<ChatScene | 'new' | null>(null);

  const handleToggle = (scene: ChatScene) => {
    publish({
      dTag: scene.id,
      title: scene.title,
      enabled: !scene.enabled,
      messages: scene.messages,
    });
  };

  // ── Editor view ──────────────────────────────────────────
  if (editing !== null) {
    return (
      <SceneEditor
        initial={editing === 'new' ? null : editing}
        onSave={() => setEditing(null)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  // ── List view ────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Back to Fan App Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            Chat Splash Screens
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
              <Shuffle className="h-3 w-3" /> Random
            </span>
          </CardTitle>
          <CardDescription>
            Create animated group-chat conversations shown below the carousel on the{' '}
            <a href="/app" className="underline text-orange-600">/app</a> homepage.
            One enabled scene is picked <strong>at random</strong> per page load — so visitors see a fresh
            conversation every visit. Each scene has a list of speakers with avatars, names, and messages
            that animate in sequentially like a real group chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {scenes.length === 0 ? 'No scenes yet.' : `${scenes.filter(s => s.enabled).length} active of ${scenes.length} total`}
            </p>
            <Button onClick={() => setEditing('new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Scene
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
                <Plus className="h-4 w-4" />
                Create your first scene
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
    </div>
  );
}
