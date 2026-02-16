import { useState, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Calendar,
  Tag,
  Loader2,
  Trash2,
  Eye,
  Edit,
  X,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Save,
  ExternalLink,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';
import ReactMarkdown from 'react-markdown';
import { nip19 } from 'nostr-tools';

// Content block types
interface ContentBlock {
  id: string;
  type: 'markdown' | 'gallery';
  content: string;
  images: string[];
  externalUrl?: string;
}

export function BlogPostManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const queryClient = useQueryClient();
  const headerImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Create/Edit state
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<NostrEvent | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [headerImage, setHeaderImage] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [tags, setTags] = useState('');
  const [publishDate, setPublishDate] = useState<Date>(new Date());
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'markdown', content: '', images: [] }
  ]);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shareToNostr, setShareToNostr] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  
  // Confirmation dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<NostrEvent | null>(null);

  // Fetch user's blog posts (kind 30023)
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['blog-posts', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{ kinds: [30023], authors: [user.pubkey], limit: 50 }],
        { signal }
      );
      // Filter out artist-page events
      const filteredEvents = events.filter(e => {
        const dTag = e.tags.find(t => t[0] === 'd')?.[1];
        const hasArtworkTag = e.tags.some(t => t[0] === 't' && t[1] === 'artwork');
        return dTag !== 'artist-page' && !hasArtworkTag;
      });
      return filteredEvents.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user?.pubkey,
    staleTime: 0,
  });

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setHeaderImage('');
    setExternalUrl('');
    setTags('');
    setPublishDate(new Date());
    setContentBlocks([{ id: '1', type: 'markdown', content: '', images: [] }]);
    setEditingPost(null);
    setActiveTab('edit');
    setShareToNostr(false);
    setShareMessage('');
  };

  const addContentBlock = (type: 'markdown' | 'gallery') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      images: [],
      externalUrl: ''
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlockContent = (id: string, content: string) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, content } : block
    ));
  };

  const updateBlockExternalUrl = (id: string, externalUrl: string) => {
    setContentBlocks(contentBlocks.map(block => 
      block.id === id ? { ...block, externalUrl } : block
    ));
  };

  const removeBlock = (id: string) => {
    if (contentBlocks.length <= 1) return;
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setContentBlocks(newBlocks);
  };

  const moveBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileTags = await uploadFile(file);
      const url = fileTags[0][1];
      setHeaderImage(url);
      toast.success('Header image uploaded!');
    } catch (error) {
      console.error('Failed to upload header image:', error);
      toast.error('Failed to upload header image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingBlockId(blockId);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const fileTags = await uploadFile(file);
        const imageUrl = fileTags[0][1];
        uploadedUrls.push(imageUrl);
      } catch (error) {
        console.error('Failed to upload gallery image:', error);
      }
    }

    setContentBlocks(contentBlocks.map(block =>
      block.id === blockId ? { ...block, images: [...block.images, ...uploadedUrls] } : block
    ));
    setUploadingBlockId(null);
    if (uploadedUrls.length > 0) {
      toast.success(`${uploadedUrls.length} image(s) uploaded!`);
    }
  };

  const removeGalleryImage = (blockId: string, imageIndex: number) => {
    setContentBlocks(contentBlocks.map(block =>
      block.id === blockId 
        ? { ...block, images: block.images.filter((_, i) => i !== imageIndex) }
        : block
    ));
  };

  // Start editing a post
  const handleEdit = (post: NostrEvent) => {
    setEditingPost(post);
    setTitle(post.tags.find(t => t[0] === 'title')?.[1] || '');
    setSummary(post.tags.find(t => t[0] === 'summary')?.[1] || '');
    setHeaderImage(post.tags.find(t => t[0] === 'image')?.[1] || '');
    setExternalUrl(post.tags.find(t => t[0] === 'r')?.[1] || '');
    setTags(post.tags.filter(t => t[0] === 't').map(t => t[1]).join(', '));
    
    // CRITICAL: Ensure sharing is disabled when editing existing posts
    setShareToNostr(false);
    setShareMessage('');
    
    // Load publish date
    const publishedAt = post.tags.find(t => t[0] === 'published_at')?.[1];
    setPublishDate(publishedAt ? new Date(parseInt(publishedAt) * 1000) : new Date(post.created_at * 1000));

    // Parse content blocks
    try {
      const parsed = JSON.parse(post.content);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        setContentBlocks(parsed.blocks);
      } else {
        // Legacy: single content field
        const galleryImages = post.tags.filter(t => t[0] === 'gallery').map(t => t[1]);
        setContentBlocks([{ 
          id: '1', 
          type: 'markdown', 
          content: post.content,
          images: []
        }]);
        if (galleryImages.length > 0) {
          setContentBlocks(prev => [...prev, {
            id: Date.now().toString(),
            type: 'gallery',
            content: '',
            images: galleryImages
          }]);
        }
      }
    } catch {
      // Not JSON, treat as plain markdown
      const galleryImages = post.tags.filter(t => t[0] === 'gallery').map(t => t[1]);
      setContentBlocks([{ 
        id: '1', 
        type: 'markdown', 
        content: post.content,
        images: []
      }]);
      if (galleryImages.length > 0) {
        setContentBlocks(prev => [...prev, {
          id: Date.now().toString(),
          type: 'gallery',
          content: '',
          images: galleryImages
        }]);
      }
    }

    setIsCreating(true);
  };

  const shareBlogToNostr = (
    blogEvent: NostrEvent,
    blogTitle: string,
    blogHeaderImage: string,
    blogTags: string,
    customShareMessage: string
  ) => {
    console.log('🚀 shareBlogToNostr called with:', { 
      blogEvent, 
      blogTitle,
      blogHeaderImage,
      blogTags,
      customShareMessage
    });

    if (!user) {
      console.log('❌ No user found for sharing');
      return;
    }

    setIsSharing(true);

    try {
      // Get the d-tag from the blog event
      const dTag = blogEvent.tags.find(([name]: [string, string]) => name === 'd')?.[1];
      if (!dTag) {
        throw new Error('No d-tag found in blog event');
      }

      // Generate naddr for the blog post
      const naddr = nip19.naddrEncode({
        identifier: dTag,
        pubkey: user.pubkey,
        kind: 30023, // Blog uses kind 30023
      });

      // Create the blog URL
      const blogUrl = `${window.location.origin}/blog/${naddr}`;

      // Create share message with image link after text, before hashtags
      const customMessage = customShareMessage?.trim();
      let shareContent = customMessage
        ? `${customMessage}\n\n📝 "${blogTitle}"\n${blogUrl}`
        : `Just published a new blog post! 📝\n\n"${blogTitle}"\n\n${blogUrl}`;

      // Add the header image link after the text content, before hashtags
      if (blogHeaderImage) {
        shareContent += `\n\n${blogHeaderImage}`;
      }

      // Add hashtags at the end
      shareContent += `\n\n#blog #nostr`;

      // Prepare tags array
      const shareTags: string[][] = [
        ['t', 'blog'],
        ['t', 'nostr'],
        ['e', blogEvent.id, '', 'mention'], // Reference the blog event
        ['a', `30023:${user.pubkey}:${dTag}`, '', 'mention'], // Reference the addressable event
      ];

      // Add user tags from the blog post
      const tagArray = blogTags.split(',').map(t => t.trim()).filter(t => t);
      tagArray.forEach(tag => {
        shareTags.push(['t', tag.toLowerCase()]);
      });

      // Add image-related tags for maximum compatibility
      if (blogHeaderImage) {
        // Method 1: Simple image tag (widely supported)
        shareTags.push(['image', blogHeaderImage]);

        // Method 2: NIP-92 imeta tag (newer clients)
        shareTags.push([
          'imeta',
          `url ${blogHeaderImage}`,
          'm image/jpeg',
          `alt Preview image for "${blogTitle}" blog post`,
          `fallback ${blogUrl}`
        ]);

        // Method 3: Add r tag for reference (some clients use this)
        shareTags.push(['r', blogHeaderImage]);

        // Method 4: Add url tag (alternative approach some clients check)
        shareTags.push(['url', blogHeaderImage]);
      }

      // Create kind 1 note to share the blog
      createEvent({
        kind: 1,
        content: shareContent,
        tags: shareTags
      }, {
        onSuccess: () => {
          console.log('✅ Successfully shared to Nostr');
          toast.success('Shared to Nostr! 📝');
          setIsSharing(false);
        },
        onError: (error) => {
          console.error('Share to Nostr error:', error);
          toast.error('Blog was created but sharing to Nostr failed. You can share it manually later.');
          setIsSharing(false);
        }
      });
    } catch (error) {
      console.error('Error generating share content:', error);
      toast.error('Failed to generate share content. You can share the blog manually later.');
      setIsSharing(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const hasContent = contentBlocks.some(block => 
      (block.type === 'markdown' && block.content.trim()) ||
      (block.type === 'gallery' && block.images.length > 0)
    );

    if (!hasContent) {
      toast.error('Please add at least one content block with content');
      return;
    }

    setIsSaving(true);

    // Generate article ID
    const articleId = editingPost 
      ? editingPost.tags.find(t => t[0] === 'd')?.[1] || `blog-${Date.now()}`
      : `blog-${Date.now()}`;

    // Prepare content as JSON with blocks
    const contentData = {
      blocks: contentBlocks
    };

    const blogTags: string[][] = [
      ['d', articleId],
      ['title', title.trim()],
      ['published_at', Math.floor(publishDate.getTime() / 1000).toString()],
      ['t', 'blog'],
    ];

    if (summary.trim()) {
      blogTags.push(['summary', summary.trim()]);
    }

    if (headerImage) {
      blogTags.push(['image', headerImage]);
    }

    if (externalUrl) {
      blogTags.push(['r', externalUrl]);
    }

    // Add gallery images as separate tags
    contentBlocks.forEach(block => {
      if (block.type === 'gallery') {
        block.images.forEach(imgUrl => {
          blogTags.push(['gallery', imgUrl]);
        });
      }
    });

    // Add user tags
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
    tagArray.forEach(tag => {
      blogTags.push(['t', tag.toLowerCase()]);
    });

    console.log('[BlogPostManagement] Publishing blog post...', {
      title,
      blocks: contentBlocks.length,
      headerImage: !!headerImage,
      externalUrl,
      isEdit: !!editingPost
    });

    createEvent(
      {
        kind: 30023,
        content: JSON.stringify(contentData),
        tags: blogTags,
      },
      {
        onSuccess: async (result) => {
          console.log('[BlogPostManagement] ✅ Blog post published!');
          
          // Give relay time to process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Invalidate and refetch
          await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
          await queryClient.invalidateQueries({ queryKey: ['blog-posts-public'] });
          await queryClient.refetchQueries({ queryKey: ['blog-posts'] });
          
          const action = editingPost ? 'updated' : 'created';
          toast.success(`Blog post ${action} successfully!`);
          
          // Share to Nostr ONLY if explicitly requested (checkbox checked) AND creating new post (not editing)
          // CRITICAL: Never share without explicit user consent via checkbox
          if (shareToNostr === true && !editingPost) {
            console.log('📢 User explicitly requested sharing to Nostr', { 
              shareToNostr, 
              shareMessage, 
              isEdit: !!editingPost,
              title,
              headerImage,
              tags
            });
            shareBlogToNostr(result.event, title, headerImage, tags, shareMessage);
          } else {
            console.log('❌ NOT sharing to Nostr', { 
              shareToNostr, 
              isEdit: !!editingPost,
              reason: editingPost ? 'Editing existing post' : 'Share checkbox not checked'
            });
          }
          
          resetForm();
          setIsSaving(false);
        },
        onError: (error) => {
          console.error('[BlogPostManagement] ❌ Publish error:', error);
          toast.error('Failed to save blog post');
          setIsSaving(false);
        },
      }
    );
  };

  // Delete blog post
  const handleDeleteClick = (post: NostrEvent) => {
    setPostToDelete(post);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!postToDelete) return;

    const dTag = postToDelete.tags.find(t => t[0] === 'd')?.[1];
    const artworkAddress = `30023:${postToDelete.pubkey}:${dTag}`;

    createEvent(
      {
        kind: 5,
        content: 'Deleted blog post',
        tags: [['a', artworkAddress]],
      },
      {
        onSuccess: () => {
          toast.success('Blog post deleted');
          setPostToDelete(null);
          setShowDeleteDialog(false);
          queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
          queryClient.invalidateQueries({ queryKey: ['blog-posts-public'] });
        },
        onError: (error) => {
          console.error('Delete error:', error);
          toast.error('Failed to delete blog post');
          setShowDeleteDialog(false);
        },
      }
    );
  };

  const getArticleTitle = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled';
  };

  const getArticleSummary = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'summary')?.[1] || '';
  };

  const getArticleImage = (event: NostrEvent): string | undefined => {
    return event.tags.find(t => t[0] === 'image')?.[1];
  };

  const getArticleTags = (event: NostrEvent): string[] => {
    return event.tags.filter(t => t[0] === 't' && t[1] !== 'blog').map(t => t[1]);
  };

  const getArticleId = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'd')?.[1] || '';
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>Please log in to manage blog posts</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blog Post Management</CardTitle>
              <CardDescription>Create and manage your blog posts with rich content blocks</CardDescription>
            </div>
            <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
              {isCreating ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Blog Post
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPost ? 'Edit' : 'Create New'} Blog Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Post Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter blog post title..."
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary for preview cards..."
              />
            </div>

            {/* Publish Date */}
            <div className="space-y-2">
              <Label htmlFor="publish-date">Publish Date</Label>
              <div className="flex gap-2">
                <Input
                  id="publish-date"
                  type="date"
                  value={publishDate ? format(publishDate, "yyyy-MM-dd") : ''}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    if (!isNaN(newDate.getTime())) {
                      setPublishDate(newDate);
                    }
                  }}
                  className="flex-1"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={publishDate}
                      onSelect={(date) => date && setPublishDate(date)}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={2000}
                      toYear={new Date().getFullYear() + 1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-muted-foreground">
                Set the publish date for this blog post (useful for adding older posts)
              </p>
            </div>

            {/* Header Image */}
            <div className="space-y-2">
              <Label>Header Image</Label>
              {headerImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <img
                      src={headerImage}
                      alt="Header"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setHeaderImage('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    type="url"
                    placeholder="Or paste image URL"
                    value={headerImage}
                    onChange={(e) => setHeaderImage(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={headerImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeaderImageUpload}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => headerImageInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Header Image
                      </>
                    )}
                  </Button>
                  <Input
                    type="url"
                    placeholder="Or paste image URL"
                    value={headerImage}
                    onChange={(e) => setHeaderImage(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* External URL */}
            <div className="space-y-2">
              <Label htmlFor="external-url">External URL (Optional)</Label>
              <Input
                id="external-url"
                type="url"
                placeholder="https://example.com"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Link to original article or external resource
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="bitcoin, art, creativity"
              />
            </div>

            {/* Content Blocks */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Content Blocks</Label>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4">
                  {contentBlocks.map((block, index) => (
                    <div key={block.id} className="space-y-3">
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                              <span className="text-sm font-medium">
                                {block.type === 'markdown' ? 'Text Block' : 'Photo Gallery'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveBlockUp(index)}
                                disabled={index === 0}
                              >
                                ↑
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => moveBlockDown(index)}
                                disabled={index === contentBlocks.length - 1}
                              >
                                ↓
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBlock(block.id)}
                                disabled={contentBlocks.length <= 1}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {block.type === 'markdown' ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Write your content using Markdown..."
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                rows={10}
                                className="font-mono text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                Supports Markdown: **bold**, *italic*, ## headings, [links](url), etc.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {block.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  {block.images.map((imgUrl, imgIndex) => (
                                    <div key={imgIndex} className="relative group rounded-lg overflow-hidden border-2">
                                      <img
                                        src={imgUrl}
                                        alt={`Gallery ${imgIndex + 1}`}
                                        className="w-full h-32 object-cover"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeGalleryImage(block.id, imgIndex)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <input
                                ref={(el) => galleryInputRefs.current[block.id] = el}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleGalleryUpload(block.id, e)}
                                disabled={uploadingBlockId === block.id}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => galleryInputRefs.current[block.id]?.click()}
                                disabled={uploadingBlockId === block.id}
                              >
                                {uploadingBlockId === block.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Add Images to Gallery
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                {block.images.length > 0 
                                  ? `${block.images.length} image(s) in this gallery`
                                  : 'Upload images to create a photo gallery'}
                              </p>
                            </div>
                          )}
                          
                          {/* External URL for this block */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label htmlFor={`external-url-${block.id}`} className="text-sm">External URL (Optional)</Label>
                            <Input
                              id={`external-url-${block.id}`}
                              type="url"
                              placeholder="https://example.com"
                              value={block.externalUrl || ''}
                              onChange={(e) => updateBlockExternalUrl(block.id, e.target.value)}
                              className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Add a link related to this content block
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Add Block Buttons - appear after each block */}
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addContentBlock('markdown')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Text
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addContentBlock('gallery')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Gallery
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="space-y-8">
                    {headerImage && (
                      <div className="w-full h-64 rounded-lg overflow-hidden">
                        <img
                          src={headerImage}
                          alt="Header"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-3xl">{title || 'Blog Post Title'}</CardTitle>
                        {summary && (
                          <CardDescription className="text-base">{summary}</CardDescription>
                        )}
                        {externalUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="mt-2 w-fit"
                          >
                            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Original
                            </a>
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-8">
                        {contentBlocks.map((block) => (
                          <div key={block.id} className="space-y-4">
                            {block.type === 'markdown' && block.content.trim() && (
                              <>
                                <div className="prose prose-lg dark:prose-invert max-w-none">
                                  <ReactMarkdown>{block.content}</ReactMarkdown>
                                </div>
                                {block.externalUrl && (
                                  <div className="flex justify-center pt-4 border-t">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Related Link
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                            {block.type === 'gallery' && block.images.length > 0 && (
                              <>
                                {block.images.length === 1 ? (
                                  <div className="w-full">
                                    <img
                                      src={block.images[0]}
                                      alt="Image"
                                      className="w-full h-auto object-contain rounded-lg"
                                    />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {block.images.map((imgUrl, index) => (
                                      <div
                                        key={index}
                                        className="relative aspect-square overflow-hidden rounded-lg"
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Image ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {block.externalUrl && (
                                  <div className="flex justify-center pt-4 border-t">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={block.externalUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Related Link
                                      </a>
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Share to Nostr Option */}
            {!editingPost && (
              <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareToNostr"
                    checked={shareToNostr}
                    onCheckedChange={(checked) => {
                      console.log('Share to Nostr checkbox changed:', checked);
                      setShareToNostr(!!checked);
                    }}
                  />
                  <Label htmlFor="shareToNostr" className="text-base font-medium flex items-center gap-2 cursor-pointer">
                    <Share2 className="h-4 w-4" />
                    Share to Nostr Community
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>⚠️ Optional:</strong> Check this box to automatically share your new blog post with the Nostr community. Leave unchecked to publish without sharing.
                </p>

                {shareToNostr && (
                  <div className="space-y-2">
                    <Label htmlFor="shareMessage" className="text-sm font-medium">
                      Custom Share Message (optional)
                    </Label>
                    <Textarea
                      id="shareMessage"
                      placeholder="Add a personal message when sharing your blog post... (leave empty for default message)"
                      rows={3}
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                      className="text-sm resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      If left empty, we'll create a nice default message for you.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1" disabled={isSaving || isSharing}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sharing to Nostr...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPost ? 'Update' : 'Publish'} Blog Post
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isSaving || isSharing}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Published Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Your Blog Posts
          </CardTitle>
          <CardDescription>
            Manage your published blog articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No blog posts yet. Create your first post above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post) => {
                const postTitle = getArticleTitle(post);
                const postSummary = getArticleSummary(post);
                const image = getArticleImage(post);
                const postTags = getArticleTags(post);
                const articleId = getArticleId(post);

                return (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="flex gap-4">
                      {image && (
                        <div className="w-48 h-32 flex-shrink-0">
                          <img
                            src={image}
                            alt={postTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{postTitle}</h3>
                            {postSummary && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {postSummary}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(post.created_at * 1000), 'MMM d, yyyy')}
                              </Badge>
                              {postTags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {postTags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{postTags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/blog/${articleId}`, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(post)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(post)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a deletion request to Nostr relays. The post may still be visible on some relays that don't honor deletion requests.
              {postToDelete && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-medium">{getArticleTitle(postToDelete)}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setPostToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
