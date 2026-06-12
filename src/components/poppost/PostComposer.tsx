import { useState, useEffect, useCallback } from 'react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import type { ScheduledPost, ScheduledMedia, MediaCategory } from '@/hooks/useScheduledPosts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';

interface PostComposerProps {
  editingPost: ScheduledPost | null;
  onClose: () => void;
  onCreate: (draft: Omit<ScheduledPost, 'id' | 'createdAt' | 'updatedAt'>) => ScheduledPost;
  onUpdate: (id: string, updates: Partial<ScheduledPost>) => void;
  onMarkPublished: (id: string, eventId: string) => void;
  onMarkFailed: (id: string) => void;
}

// Minimum schedule time: 5 minutes from now
function getMinScheduleTime(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

function getDefaultScheduleTime(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
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
  const [activeTab, setActiveTab] = useState<'compose' | 'media'>('compose');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = caption.length + selectedMedia.map(m => m.url).join('\n\n').length +
    hashtags.map(h => `#${h}`).join(' ').length;

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

  // Build the Nostr post content
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

    // Add hashtag tags
    for (const tag of hashtags) {
      tags.push(['t', tag]);
    }

    // Add image tags (imeta)
    for (const media of selectedMedia) {
      tags.push(['imeta', `url ${media.url}`]);
    }

    return tags;
  }, [hashtags, selectedMedia]);

  const handlePublishNow = useCallback(async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const content = buildContent();
      const tags = buildTags();

      const event = await publishEvent({
        kind: 1,
        content,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      if (editingPost) {
        onUpdate(editingPost.id, { status: 'published', publishedEventId: event.id });
        onMarkPublished(editingPost.id, event.id);
      } else {
        const post = onCreate({
          caption,
          media: selectedMedia,
          hashtags,
          scheduledAt: new Date().toISOString(),
          status: 'published',
          publishedEventId: event.id,
        });
        onMarkPublished(post.id, event.id);
      }

      toast({
        title: 'Published to Nostr!',
        description: 'Your post has been sent to the Nostr network.',
      });
      onClose();
    } catch (err) {
      console.error('Publish error:', err);
      toast({
        title: 'Failed to publish',
        description: 'Could not publish to Nostr. Please try again.',
        variant: 'destructive',
      });
      if (editingPost) onMarkFailed(editingPost.id);
    } finally {
      setIsSubmitting(false);
    }
  }, [user, buildContent, buildTags, publishEvent, editingPost, onCreate, onUpdate, onMarkPublished, onMarkFailed, caption, selectedMedia, hashtags, toast, onClose]);

  const handleSave = useCallback(() => {
    if (mode === 'now') {
      handlePublishNow();
      return;
    }

    const scheduledAtISO = mode === 'draft' ? new Date().toISOString() : new Date(scheduledAt).toISOString();
    const status = mode === 'draft' ? 'draft' : 'scheduled';

    if (editingPost) {
      onUpdate(editingPost.id, {
        caption,
        media: selectedMedia,
        hashtags,
        scheduledAt: scheduledAtISO,
        status,
      });
      toast({ title: 'Post updated' });
    } else {
      onCreate({
        caption,
        media: selectedMedia,
        hashtags,
        scheduledAt: scheduledAtISO,
        status,
      });
      toast({
        title: mode === 'draft' ? 'Saved as draft' : 'Post scheduled!',
        description: mode === 'scheduled'
          ? `Will be published on ${new Date(scheduledAt).toLocaleString()}`
          : undefined,
      });
    }
    onClose();
  }, [mode, editingPost, caption, selectedMedia, hashtags, scheduledAt, onCreate, onUpdate, toast, onClose, handlePublishNow]);

  const isValid = caption.trim() || selectedMedia.length > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            {editingPost ? 'Edit Post' : 'Create Post'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'compose' | 'media')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="compose" className="gap-2">
              <Pencil className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Add Media
              {selectedMedia.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs py-0 px-1.5 min-w-0">{selectedMedia.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-4">
            {/* Caption */}
            <div className="space-y-1.5">
              <Label>Caption</Label>
              <Textarea
                placeholder="Write your Nostr post caption here..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={3000}
              />
              <p className="text-xs text-right text-muted-foreground">{charCount}/3000 chars</p>
            </div>

            {/* Selected Media Preview */}
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
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      addHashtag();
                    }
                  }}
                  className="flex-1 h-8 text-sm"
                />
                <Button variant="outline" size="sm" onClick={addHashtag} className="h-8">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {['bitpopart', 'popart', 'bitcoin', 'art', 'nostr', 'freeart', 'free'].map(tag => (
                  !hashtags.includes(tag) && (
                    <button
                      key={tag}
                      onClick={() => setHashtags(prev => [...prev, tag])}
                      className="text-xs text-muted-foreground hover:text-orange-600 transition-colors"
                    >
                      +#{tag}
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Post Mode */}
            <div className="space-y-2">
              <Label>When to post</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMode('schedule')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    mode === 'schedule'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-border hover:border-orange-300'
                  }`}
                >
                  <CalendarClock className={`h-5 w-5 mx-auto mb-1 ${mode === 'schedule' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <p className={`text-xs font-medium ${mode === 'schedule' ? 'text-orange-600' : 'text-muted-foreground'}`}>Schedule</p>
                </button>
                <button
                  onClick={() => setMode('draft')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    mode === 'draft'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-border hover:border-yellow-300'
                  }`}
                >
                  <Pencil className={`h-5 w-5 mx-auto mb-1 ${mode === 'draft' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <p className={`text-xs font-medium ${mode === 'draft' ? 'text-yellow-600' : 'text-muted-foreground'}`}>Save Draft</p>
                </button>
                <button
                  onClick={() => setMode('now')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    mode === 'now'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-border hover:border-green-300'
                  }`}
                >
                  <Send className={`h-5 w-5 mx-auto mb-1 ${mode === 'now' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <p className={`text-xs font-medium ${mode === 'now' ? 'text-green-600' : 'text-muted-foreground'}`}>Post Now</p>
                </button>
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
                    Post will be scheduled for {new Date(scheduledAt).toLocaleString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Preview */}
            {isValid && (
              <Card className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {caption}
                    {selectedMedia.length > 0 && (
                      <span className="text-blue-500 block mt-2">
                        {selectedMedia.map(m => m.url).join('\n')}
                      </span>
                    )}
                    {hashtags.length > 0 && (
                      <span className="text-orange-600 block mt-2">
                        {hashtags.map(h => `#${h}`).join(' ')}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
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
          </TabsContent>

          {/* Media Browser Tab */}
          <TabsContent value="media">
            <MediaBrowser
              selectedUrls={selectedMedia.map(m => m.url)}
              onSelect={handleAddMedia}
              onRemove={removeMedia}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
