import { useState, useCallback } from 'react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';
import type { ScheduledPost, ScheduledMedia } from '@/hooks/useScheduledPosts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MediaBrowser } from './MediaBrowser';
import {
  Send,
  Clock,
  X,
  Plus,
  Image as ImageIcon,
  Hash,
  Loader2,
  CalendarClock,
  Pencil,
  Sparkles,
  Eye,
  Heart,
  Zap,
  Repeat2,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

interface PostComposerProps {
  editingPost: ScheduledPost | null;
  onClose: () => void;
  onCreate: (draft: Omit<ScheduledPost, 'id' | 'createdAt' | 'updatedAt'>) => ScheduledPost;
  onUpdate: (id: string, updates: Partial<ScheduledPost>) => void;
  onMarkPublished: (id: string, eventId: string) => void;
  onMarkFailed: (id: string) => void;
}

function getMinScheduleTime(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

function getDefaultScheduleTime(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function PostComposer({
  editingPost,
  onClose,
  onCreate,
  onUpdate,
  onMarkPublished,
  onMarkFailed,
}: PostComposerProps) {
  const { mutateAsync: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey ?? '');
  const { toast } = useToast();

  const [caption, setCaption] = useState(editingPost?.caption ?? '');
  const [selectedMedia, setSelectedMedia] = useState<ScheduledMedia[]>(editingPost?.media ?? []);
  const [hashtags, setHashtags] = useState<string[]>(editingPost?.hashtags ?? ['bitcoin', 'art', 'nostr']);
  const [hashtagInput, setHashtagInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState(
    editingPost?.scheduledAt
      ? new Date(editingPost.scheduledAt).toISOString().slice(0, 16)
      : getDefaultScheduleTime()
  );
  const [mode, setMode] = useState<'schedule' | 'draft' | 'now'>('schedule');
  const [activeTab, setActiveTab] = useState<'compose' | 'media' | 'preview'>('compose');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : 'You');
  const avatarUrl = metadata?.picture;
  const nip05 = metadata?.nip05;

  const charCount = caption.length +
    (selectedMedia.length > 0 ? selectedMedia.map(m => m.url).join('\n\n').length + 2 : 0) +
    (hashtags.length > 0 ? hashtags.map(h => `#${h}`).join(' ').length + 2 : 0);

  const addHashtag = useCallback(() => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
    }
    setHashtagInput('');
  }, [hashtagInput, hashtags]);

  const removeHashtag = useCallback((tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  }, []);

  const removeMedia = useCallback((url: string) => {
    setSelectedMedia(prev => prev.filter(m => m.url !== url));
  }, []);

  const handleAddMedia = useCallback((media: ScheduledMedia) => {
    setSelectedMedia(prev => {
      if (prev.find(m => m.url === media.url)) return prev;
      return [...prev, media];
    });
    setActiveTab('compose');
  }, []);

  const buildContent = useCallback(() => {
    let content = caption;
    if (selectedMedia.length > 0) {
      if (content) content += '\n\n';
      content += selectedMedia.map(m => m.url).join('\n\n');
    }
    if (hashtags.length > 0) {
      if (content) content += '\n\n';
      content += hashtags.map(h => `#${h}`).join(' ');
    }
    return content;
  }, [caption, selectedMedia, hashtags]);

  const buildTags = useCallback(() => {
    const tags: string[][] = [];
    for (const tag of hashtags) tags.push(['t', tag]);
    for (const media of selectedMedia) tags.push(['imeta', `url ${media.url}`]);
    return tags;
  }, [hashtags, selectedMedia]);

  const handlePublishNow = useCallback(async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const event = await publishEvent({
        kind: 1,
        content: buildContent(),
        tags: buildTags(),
        created_at: Math.floor(Date.now() / 1000),
      });
      if (editingPost) {
        onUpdate(editingPost.id, { status: 'published', publishedEventId: event.id });
        onMarkPublished(editingPost.id, event.id);
      } else {
        const post = onCreate({ caption, media: selectedMedia, hashtags, scheduledAt: new Date().toISOString(), status: 'published', publishedEventId: event.id });
        onMarkPublished(post.id, event.id);
      }
      toast({ title: 'Published to Nostr!', description: 'Your post has been sent to the Nostr network.' });
      onClose();
    } catch (err) {
      console.error('Publish error:', err);
      toast({ title: 'Failed to publish', description: 'Could not publish to Nostr. Please try again.', variant: 'destructive' });
      if (editingPost) onMarkFailed(editingPost.id);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, buildContent, buildTags, publishEvent, editingPost, onCreate, onUpdate, onMarkPublished, onMarkFailed, caption, selectedMedia, hashtags, toast, onClose]);

  const handleSave = useCallback(() => {
    if (mode === 'now') { handlePublishNow(); return; }
    const scheduledAtISO = mode === 'draft' ? new Date().toISOString() : new Date(scheduledAt).toISOString();
    const status = mode === 'draft' ? 'draft' : 'scheduled';
    if (editingPost) {
      onUpdate(editingPost.id, { caption, media: selectedMedia, hashtags, scheduledAt: scheduledAtISO, status });
      toast({ title: 'Post updated' });
    } else {
      onCreate({ caption, media: selectedMedia, hashtags, scheduledAt: scheduledAtISO, status });
      toast({
        title: mode === 'draft' ? 'Saved as draft' : 'Post scheduled!',
        description: mode === 'schedule' ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : undefined,
      });
    }
    onClose();
  }, [mode, editingPost, caption, selectedMedia, hashtags, scheduledAt, onCreate, onUpdate, toast, onClose, handlePublishNow]);

  const isValid = !!(caption.trim() || selectedMedia.length > 0);

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full overflow-hidden"
      >
        {/* Fixed header */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            {editingPost ? 'Edit Post' : 'Create Post'}
          </SheetTitle>
        </SheetHeader>

        {/* Tabs nav */}
        <div className="px-6 pt-4 flex-shrink-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'compose' | 'media' | 'preview')}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="compose" className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5 text-xs">
                <ImageIcon className="h-3.5 w-3.5" />
                Media
                {selectedMedia.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs py-0 px-1.5 h-4">{selectedMedia.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Scrollable content area */}
            <div className="mt-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>

              {/* ── Compose Tab ── */}
              <TabsContent value="compose" className="space-y-5 pb-4 mt-0">
                {/* Caption */}
                <div className="space-y-1.5">
                  <Label>Caption</Label>
                  <Textarea
                    placeholder="Write your Nostr post caption here..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-[120px] resize-none"
                    maxLength={3000}
                  />
                  <p className="text-xs text-right text-muted-foreground">{charCount} / 3000</p>
                </div>

                {/* Attached media thumbnails */}
                {selectedMedia.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Attached Media ({selectedMedia.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMedia.map((m) => (
                        <div key={m.url} className="relative group">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={() => removeMedia(m.url)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs text-center text-muted-foreground mt-0.5 truncate max-w-[5rem]">{m.title}</p>
                        </div>
                      ))}
                      <button
                        onClick={() => setActiveTab('media')}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-orange-300 hover:border-orange-500 flex flex-col items-center justify-center gap-1 text-orange-500 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-xs">Add</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    Hashtags
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {hashtags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 gap-1"
                        onClick={() => removeHashtag(tag)}
                      >
                        #{tag}
                        <X className="h-2.5 w-2.5" />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add hashtag..."
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addHashtag(); }
                      }}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={addHashtag} className="h-8">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                    {['bitpopart', 'popart', 'bitcoin', 'art', 'nostr', 'freeart', 'free', 'wallpaper', 'digitalart'].filter(t => !hashtags.includes(t)).map(tag => (
                      <button
                        key={tag}
                        onClick={() => setHashtags(prev => [...prev, tag])}
                        className="text-xs text-muted-foreground hover:text-orange-600 transition-colors"
                      >
                        +#{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Post mode */}
                <div className="space-y-2">
                  <Label>When to post</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'schedule', label: 'Schedule', icon: CalendarClock, activeColor: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-600', iconColor: 'text-orange-500' },
                      { key: 'draft', label: 'Save Draft', icon: Pencil, activeColor: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20', textColor: 'text-yellow-600', iconColor: 'text-yellow-500' },
                      { key: 'now', label: 'Post Now', icon: Send, activeColor: 'border-green-500 bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600', iconColor: 'text-green-500' },
                    ] as const).map(({ key, label, icon: Icon, activeColor, textColor, iconColor }) => (
                      <button
                        key={key}
                        onClick={() => setMode(key)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${mode === key ? activeColor : 'border-border hover:border-gray-300'}`}
                      >
                        <Icon className={`h-5 w-5 mx-auto mb-1 ${mode === key ? iconColor : 'text-muted-foreground'}`} />
                        <p className={`text-xs font-medium ${mode === key ? textColor : 'text-muted-foreground'}`}>{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {mode === 'schedule' && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Scheduled Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      min={getMinScheduleTime()}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full"
                    />
                    {scheduledAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(scheduledAt).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* ── Media Tab ── */}
              <TabsContent value="media" className="pb-4 mt-0">
                <MediaBrowser
                  selectedUrls={selectedMedia.map(m => m.url)}
                  onSelect={handleAddMedia}
                  onRemove={removeMedia}
                />
              </TabsContent>

              {/* ── Preview Tab ── */}
              <TabsContent value="preview" className="pb-4 mt-0">
                <NostrPostPreview
                  caption={caption}
                  media={selectedMedia}
                  hashtags={hashtags}
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                  nip05={nip05}
                  scheduledAt={mode === 'schedule' ? scheduledAt : undefined}
                  mode={mode}
                />
              </TabsContent>

            </div>
          </Tabs>
        </div>

        {/* Fixed footer action bar */}
        <div className="flex-shrink-0 border-t px-6 py-4 flex items-center justify-between gap-3 bg-background">
          <Button variant="outline" onClick={onClose} className="flex-shrink-0">
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {activeTab !== 'preview' && isValid && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setActiveTab('preview')}>
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!isValid || isSubmitting || isPublishing}
              className={
                mode === 'now'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                  : mode === 'schedule'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
              }
            >
              {(isSubmitting || isPublishing) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'now' ? 'Publish Now' : mode === 'draft' ? 'Save Draft' : 'Schedule Post'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Nostr Post Preview ─────────────────────────────────────────────────────────

interface NostrPostPreviewProps {
  caption: string;
  media: ScheduledMedia[];
  hashtags: string[];
  displayName: string;
  avatarUrl?: string;
  nip05?: string;
  scheduledAt?: string;
  mode: 'schedule' | 'draft' | 'now';
}

function NostrPostPreview({ caption, media, hashtags, displayName, avatarUrl, nip05, scheduledAt, mode }: NostrPostPreviewProps) {
  const hasContent = caption.trim() || media.length > 0;
  const postTime = mode === 'schedule' && scheduledAt
    ? new Date(scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';
  const postDate = mode === 'schedule' && scheduledAt
    ? new Date(scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (!hasContent) {
    return (
      <div className="text-center py-12">
        <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Nothing to preview yet</p>
        <p className="text-sm text-muted-foreground mt-1">Add a caption or media to see a preview.</p>
      </div>
    );
  }

  // Render caption text with highlighted hashtags and URLs
  function renderCaption(text: string) {
    const parts = text.split(/(\s|^)(#\w+|https?:\/\/\S+)/g);
    return parts.map((part, i) => {
      if (/^#\w+$/.test(part)) {
        return <span key={i} className="text-orange-500 hover:underline cursor-pointer">{part}</span>;
      }
      if (/^https?:\/\//.test(part)) {
        return <span key={i} className="text-blue-500 hover:underline cursor-pointer break-all">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Eye className="h-4 w-4 text-orange-500" />
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nostr Post Preview</p>
      </div>

      {/* Simulated Nostr post card */}
      <div className="rounded-2xl border bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
        {/* Post header */}
        <div className="p-4 flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-orange-200 dark:ring-orange-800">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white text-sm font-bold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm truncate">{displayName}</span>
              {nip05 && (
                <span className="text-xs text-muted-foreground truncate">@{nip05}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{postDate} · {postTime}</p>
          </div>
          {mode === 'schedule' && (
            <Badge variant="outline" className="text-xs border-orange-300 text-orange-600 flex-shrink-0">
              <CalendarClock className="h-3 w-3 mr-1" />
              Scheduled
            </Badge>
          )}
        </div>

        {/* Caption */}
        {caption.trim() && (
          <div className="px-4 pb-3">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {renderCaption(caption)}
            </p>
          </div>
        )}

        {/* Hashtags line (as they'd appear if in caption) */}
        {hashtags.length > 0 && !caption.includes('#') && (
          <div className="px-4 pb-3">
            <p className="text-sm">
              {hashtags.map((h, i) => (
                <span key={h}>
                  <span className="text-orange-500 hover:underline cursor-pointer">#{h}</span>
                  {i < hashtags.length - 1 && ' '}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Media grid */}
        {media.length > 0 && (
          <div className={`mx-0 ${media.length === 1 ? '' : 'px-4 pb-3'}`}>
            {media.length === 1 ? (
              <div className="w-full max-h-80 overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={media[0].url}
                  alt={media[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : media.length === 2 ? (
              <div className="grid grid-cols-2 gap-1">
                {media.map((m) => (
                  <div key={m.url} className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : media.length === 3 ? (
              <div className="grid grid-cols-3 gap-1">
                {media.map((m) => (
                  <div key={m.url} className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {media.slice(0, 4).map((m, i) => (
                  <div key={m.url} className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg relative">
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                    {i === 3 && media.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                        <span className="text-white text-xl font-bold">+{media.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="px-4 py-3 flex items-center justify-between border-t dark:border-gray-800">
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-500 transition-colors text-xs">
            <MessageCircle className="h-4 w-4" />
            <span>Reply</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors text-xs">
            <Repeat2 className="h-4 w-4" />
            <span>Repost</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors text-xs">
            <Heart className="h-4 w-4" />
            <span>Like</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-yellow-500 transition-colors text-xs">
            <Zap className="h-4 w-4" />
            <span>Zap</span>
          </button>
        </div>
      </div>

      {/* Info callout */}
      <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
        <CardContent className="p-3 text-xs text-orange-700 dark:text-orange-300 space-y-1">
          <p className="font-semibold">What will be posted to Nostr:</p>
          <p className="font-mono text-xs break-all text-muted-foreground whitespace-pre-wrap">
            {caption}
            {media.length > 0 ? '\n\n' + media.map(m => m.url).join('\n\n') : ''}
            {hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
