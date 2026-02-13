import { useState, useEffect, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { User, Save, Eye, Upload, X, Image as ImageIcon, Loader2, Plus, GripVertical, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';

// Content block types
interface ContentBlock {
  id: string;
  type: 'markdown' | 'gallery';
  content: string; // Markdown text or empty for gallery
  images: string[]; // Images for gallery blocks
  externalUrl?: string; // Optional external URL for the block
}

const DEFAULT_CONTENT_BLOCKS: ContentBlock[] = [
  {
    id: '1',
    type: 'markdown',
    content: `# My Story

I have been drawing since childhood, like many of us, and I have never stopped drawing because it is what I love to do most in my life. I mostly drew cartoon designs, and when I completed 8 years of art school (4 years in graphic/media design and 4 years in animation and film), you can still see that illustration style in my work, whether it's in graphic designs or animations.

Creating vector designs and using Adobe Illustrator is the foundation of most of my work. I have been sketching on the iPad (using Procreate) in recent years, but of course, I still use old-school pencil and paper.

Around 2020, I wanted to draw more than just cartoons and tell stories through my art. I began drawing simpler human-like figures. A friend of mine had a sticker machine to print outlines, which allowed me to bring my art to life. During this time, my art style evolved more and more toward this pop art style, and I named it **BitPopArt**.`,
    images: []
  }
];

export function ArtistContentManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();
  const queryClient = useQueryClient();
  const headerImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [title, setTitle] = useState('My Story');
  const [headerImage, setHeaderImage] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(DEFAULT_CONTENT_BLOCKS);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [shareToNostr, setShareToNostr] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch artist page content
  const { data: artistEvent } = useQuery({
    queryKey: ['artist-page-admin', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return null;
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      console.log('[ArtistContentManagement] Fetching artist page for pubkey:', user.pubkey.slice(0, 8) + '...');
      
      const events = await nostr.query(
        [{ kinds: [30024], authors: [user.pubkey], '#d': ['artist-page'], limit: 1 }],
        { signal }
      );

      if (events.length > 0) {
        console.log('[ArtistContentManagement] Loaded existing artist page:', {
          title: events[0].tags.find(t => t[0] === 'title')?.[1],
          hasImage: !!events[0].tags.find(t => t[0] === 'image'),
          externalUrl: events[0].tags.find(t => t[0] === 'r')?.[1],
          timestamp: new Date(events[0].created_at * 1000).toISOString()
        });
      } else {
        console.log('[ArtistContentManagement] No existing artist page found, will use defaults');
      }

      return events[0] || null;
    },
    enabled: !!user?.pubkey,
    staleTime: 0, // Always fetch fresh data
  });

  // Load existing content from Nostr
  useEffect(() => {
    if (artistEvent) {
      const eventTitle = artistEvent.tags.find(t => t[0] === 'title')?.[1] || 'My Story';
      const eventHeaderImage = artistEvent.tags.find(t => t[0] === 'image')?.[1] || '';
      const eventExternalUrl = artistEvent.tags.find(t => t[0] === 'r')?.[1] || '';
      
      setTitle(eventTitle);
      setHeaderImage(eventHeaderImage);
      setExternalUrl(eventExternalUrl);

      // Parse content blocks from content (JSON)
      try {
        const parsed = JSON.parse(artistEvent.content);
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          // Use the blocks from the parsed content
          setContentBlocks(parsed.blocks);
        } else {
          // Legacy: single content field - convert to blocks
          const legacyBlocks: ContentBlock[] = [{
            id: '1',
            type: 'markdown',
            content: artistEvent.content,
            images: []
          }];
          
          // Add legacy gallery images if they exist
          const eventGalleryImages = artistEvent.tags.filter(t => t[0] === 'gallery').map(t => t[1]);
          if (eventGalleryImages.length > 0) {
            legacyBlocks.push({
              id: Date.now().toString(),
              type: 'gallery',
              content: '',
              images: eventGalleryImages
            });
          }
          
          setContentBlocks(legacyBlocks);
        }
      } catch {
        // Old format: plain text content
        const legacyBlocks: ContentBlock[] = [{
          id: '1',
          type: 'markdown',
          content: artistEvent.content,
          images: []
        }];
        
        // Add legacy gallery images if they exist
        const eventGalleryImages = artistEvent.tags.filter(t => t[0] === 'gallery').map(t => t[1]);
        if (eventGalleryImages.length > 0) {
          legacyBlocks.push({
            id: Date.now().toString(),
            type: 'gallery',
            content: '',
            images: eventGalleryImages
          });
        }
        
        setContentBlocks(legacyBlocks);
      }
    }
  }, [artistEvent]);

  const addContentBlock = (type: 'markdown' | 'gallery') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'markdown' ? '' : '',
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
    if (contentBlocks.length <= 1) {
      toast.error('You must have at least one content block');
      return;
    }
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

  const handleHeaderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File is larger than 10MB. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    try {
      const tags = await uploadFile(file);
      const imageUrl = tags[0][1];
      setHeaderImage(imageUrl);
      toast.success('Header image uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload header image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingBlockId(blockId);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} is larger than 10MB. Skipped.`);
        continue;
      }

      try {
        const tags = await uploadFile(file);
        const imageUrl = tags[0][1];
        uploadedUrls.push(imageUrl);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setContentBlocks(contentBlocks.map(block =>
      block.id === blockId ? { ...block, images: [...block.images, ...uploadedUrls] } : block
    ));
    setUploadingBlockId(null);
    toast.success(`${uploadedUrls.length} image(s) uploaded!`);
  };

  const removeGalleryImage = (blockId: string, imageIndex: number) => {
    setContentBlocks(contentBlocks.map(block =>
      block.id === blockId 
        ? { ...block, images: block.images.filter((_, i) => i !== imageIndex) }
        : block
    ));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const hasContent = contentBlocks.some(block => 
      (block.type === 'markdown' && block.content.trim()) ||
      (block.type === 'gallery' && block.images.length > 0)
    );

    if (!hasContent) {
      toast.error('Please add at least one content block with content');
      return;
    }

    setIsSaving(true);

    // Prepare content as JSON with blocks
    const contentData = {
      blocks: contentBlocks
    };

    // Always publish to Nostr (kind 30024 - artist page)
    const tags: string[][] = [
      ['d', 'artist-page'],
      ['title', title],
      ['t', 'artist'],
      ['published_at', Math.floor(Date.now() / 1000).toString()],
    ];

    if (headerImage) {
      tags.push(['image', headerImage]);
    }

    if (externalUrl) {
      tags.push(['r', externalUrl]);
    }

    // Add all gallery images as separate tags (for backwards compatibility and Nostr sharing)
    contentBlocks.forEach(block => {
      if (block.type === 'gallery') {
        block.images.forEach(imgUrl => {
          tags.push(['gallery', imgUrl]);
        });
      }
    });

    console.log('[ArtistContentManagement] Publishing artist page update...', {
      title,
      blocks: contentBlocks.length,
      headerImage: !!headerImage,
      externalUrl,
      shareToNostrCommunity: shareToNostr
    });

    createEvent(
      {
        kind: 30024,
        content: JSON.stringify(contentData),
        tags,
      },
      {
        onSuccess: async () => {
          console.log('[ArtistContentManagement] ✅ Artist page published to Nostr!');
          
          // Give relay a moment to process the event
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Invalidate and refetch queries
          await queryClient.invalidateQueries({ queryKey: ['artist-page'] });
          await queryClient.invalidateQueries({ queryKey: ['artist-page-admin'] });
          
          console.log('[ArtistContentManagement] 🔄 Refetching artist page data...');
          const refetchResults = await Promise.all([
            queryClient.refetchQueries({ queryKey: ['artist-page'] }),
            queryClient.refetchQueries({ queryKey: ['artist-page-admin'] })
          ]);
          console.log('[ArtistContentManagement] ✅ Refetch completed:', refetchResults);

          // If share to Nostr community is checked, also create a kind 1 note
          if (shareToNostr) {
            // Create a summary for the community post
            const firstMarkdownBlock = contentBlocks.find(b => b.type === 'markdown' && b.content.trim());
            const firstParagraph = firstMarkdownBlock 
              ? firstMarkdownBlock.content.split('\n\n')[0].replace(/^#+ /, '').trim()
              : 'Check out my artist page!';
            
            const shareUrl = externalUrl || 'https://bitpopart.com/artist';
            const shareContent = `📢 Updated my artist page: ${title}\n\n${firstParagraph.slice(0, 200)}${firstParagraph.length > 200 ? '...' : ''}\n\n${shareUrl}`;
            
            createEvent(
              {
                kind: 1,
                content: shareContent,
                tags: [
                  ['t', 'artist'],
                  ['t', 'bitpopart'],
                  ['r', shareUrl],
                ],
              },
              {
                onSuccess: () => {
                  toast.success('Artist page saved and shared to Nostr community!');
                  setShareToNostr(false);
                  setIsSaving(false);
                },
                onError: (error) => {
                  console.error('[ArtistContentManagement] ❌ Community share error:', error);
                  toast.success('Artist page saved! (Community share failed)');
                  setIsSaving(false);
                },
              }
            );
          } else {
            toast.success('Artist page saved! Changes will appear on the frontend shortly.');
            setIsSaving(false);
          }
        },
        onError: (error) => {
          console.error('[ArtistContentManagement] ❌ Publish error:', error);
          toast.error('Failed to save artist page');
          setIsSaving(false);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-6 w-6 mr-2" />
          Artist Page Content
        </CardTitle>
        <CardDescription>
          Build your artist page with multiple content blocks - add markdown text and photo galleries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Page Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              placeholder="My Story"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
                  onClick={(e) => e.stopPropagation()}
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
                  onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-xs text-muted-foreground">
              This URL will be shared when you post to Nostr and can link to external resources
            </p>
          </div>

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
                                  <div key={imgIndex} className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
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
                        <div className="space-y-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                          <Label htmlFor={`external-url-${block.id}`} className="text-sm">External URL (Optional)</Label>
                          <Input
                            id={`external-url-${block.id}`}
                            type="url"
                            placeholder="https://example.com"
                            value={block.externalUrl || ''}
                            onChange={(e) => updateBlockExternalUrl(block.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
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
                      <CardTitle className="text-3xl">{title}</CardTitle>
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

          {/* Share to Nostr Community Checkbox */}
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="share-nostr"
              checked={shareToNostr}
              onCheckedChange={(checked) => setShareToNostr(checked as boolean)}
            />
            <div className="flex-1">
              <Label
                htmlFor="share-nostr"
                className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Share to Nostr Community
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically share your artist page with the Nostr community
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving & Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Artist Page
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open('/artist', '_blank')}
              disabled={isSaving}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
