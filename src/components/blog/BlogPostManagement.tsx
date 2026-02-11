import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { importWordPressArticle, generateArticleId, type WordPressArticle } from '@/lib/wordpressImport';
import {
  FileText,
  Link as LinkIcon,
  Download,
  Plus,
  Calendar,
  Tag,
  Loader2,
  Trash2,
  Eye,
  Edit,
  Share2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import type { NostrEvent } from '@nostrify/nostrify';

export function BlogPostManagement() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedArticle, setImportedArticle] = useState<WordPressArticle | null>(null);
  
  // Edit state
  const [editingPost, setEditingPost] = useState<NostrEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editTags, setEditTags] = useState('');
  
  // Confirmation dialogs
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<NostrEvent | null>(null);
  const [pendingPublishData, setPendingPublishData] = useState<{
    kind: number;
    content: string;
    tags: string[][];
  } | null>(null);

  // Fetch user's blog posts (kind 30023)
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['blog-posts', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [30023], authors: [user.pubkey], limit: 50 }],
        { signal }
      );
      // Filter out artist-page events (now using kind 30024, but filter just in case)
      const filteredEvents = events.filter(e => {
        const dTag = e.tags.find(t => t[0] === 'd')?.[1];
        return dTag !== 'artist-page';
      });
      return filteredEvents.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user?.pubkey,
  });

  // Import from WordPress
  const handleImport = async () => {
    if (!importUrl.trim()) {
      toast.error('Please enter a WordPress article URL');
      return;
    }

    setIsImporting(true);
    try {
      const article = await importWordPressArticle(importUrl);
      setImportedArticle(article);
      toast.success('Article imported successfully!');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import article. Please check the URL and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  // Prepare to publish imported article
  const handlePublish = () => {
    if (!importedArticle) return;

    const articleId = generateArticleId(importedArticle.sourceUrl);
    const tags: string[][] = [
      ['d', articleId],
      ['title', importedArticle.title],
      ['summary', importedArticle.summary],
      ['published_at', importedArticle.publishedAt.toString()],
      ...importedArticle.tags.map(tag => ['t', tag.toLowerCase()]),
    ];

    if (importedArticle.image) {
      tags.push(['image', importedArticle.image]);
    }

    // Add source URL as reference
    tags.push(['r', importedArticle.sourceUrl]);

    setPendingPublishData({
      kind: 30023,
      content: importedArticle.content,
      tags,
    });
    setShowShareDialog(true);
  };

  // Confirm and publish to Nostr
  const confirmPublish = () => {
    if (!pendingPublishData) return;

    createEvent(
      pendingPublishData,
      {
        onSuccess: () => {
          toast.success('Blog post shared to Nostr!');
          setImportedArticle(null);
          setImportUrl('');
          setPendingPublishData(null);
          setShowShareDialog(false);
          queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
        },
        onError: (error) => {
          console.error('Publish error:', error);
          toast.error('Failed to share blog post to Nostr');
          setShowShareDialog(false);
        },
      }
    );
  };

  // Start editing a post
  const handleEdit = (post: NostrEvent) => {
    setEditingPost(post);
    setEditTitle(getArticleTitle(post));
    setEditSummary(getArticleSummary(post));
    setEditContent(post.content);
    setEditImage(getArticleImage(post) || '');
    setEditTags(getArticleTags(post).join(', '));
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPost(null);
    setEditTitle('');
    setEditSummary('');
    setEditContent('');
    setEditImage('');
    setEditTags('');
  };

  // Save edited post
  const saveEdit = () => {
    if (!editingPost || !editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    const dTag = getArticleId(editingPost);
    const tags: string[][] = [
      ['d', dTag],
      ['title', editTitle.trim()],
      ['published_at', Math.floor(Date.now() / 1000).toString()],
    ];

    if (editSummary.trim()) {
      tags.push(['summary', editSummary.trim()]);
    }

    if (editImage.trim()) {
      tags.push(['image', editImage.trim()]);
    }

    // Add tags
    const tagArray = editTags.split(',').map(t => t.trim()).filter(t => t);
    tagArray.forEach(tag => {
      tags.push(['t', tag.toLowerCase()]);
    });

    setPendingPublishData({
      kind: 30023,
      content: editContent,
      tags,
    });
    setShowShareDialog(true);
  };

  // Confirm save after dialog
  const confirmSaveEdit = () => {
    if (!pendingPublishData) return;

    createEvent(
      pendingPublishData,
      {
        onSuccess: () => {
          toast.success('Blog post updated and shared to Nostr!');
          cancelEdit();
          setPendingPublishData(null);
          setShowShareDialog(false);
          queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
        },
        onError: (error) => {
          console.error('Update error:', error);
          toast.error('Failed to update blog post');
          setShowShareDialog(false);
        },
      }
    );
  };

  // Prepare to delete blog post
  const handleDeleteClick = (post: NostrEvent) => {
    setPostToDelete(post);
    setShowDeleteDialog(true);
  };

  // Confirm and delete blog post
  const confirmDelete = () => {
    if (!postToDelete) return;

    createEvent(
      {
        kind: 5,
        content: 'Deleted blog post',
        tags: [['a', `30023:${postToDelete.pubkey}:${postToDelete.tags.find(t => t[0] === 'd')?.[1]}`]],
      },
      {
        onSuccess: () => {
          toast.success('Blog post deleted');
          setPostToDelete(null);
          setShowDeleteDialog(false);
          queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
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
    return event.tags.filter(t => t[0] === 't').map(t => t[1]);
  };

  const getArticleId = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'd')?.[1] || '';
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Import from WordPress
          </CardTitle>
          <CardDescription>
            Import articles from your existing WordPress blog by entering the article URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="https://bitpopart.com/2026/01/19/bitcoin-is-money/"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              />
            </div>
            <Button onClick={handleImport} disabled={isImporting || !importUrl.trim()}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>

          {importedArticle && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-4 mt-2">
                  <div>
                    <h4 className="font-semibold text-lg">{importedArticle.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{importedArticle.summary}</p>
                  </div>

                  {importedArticle.image && (
                    <img
                      src={importedArticle.image}
                      alt={importedArticle.title}
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(importedArticle.publishedAt * 1000), 'MMM d, yyyy')}
                    </Badge>
                    {importedArticle.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handlePublish} className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share to Nostr
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setImportedArticle(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Edit Form */}
      {editingPost && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Edit Blog Post
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Article title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Input
                id="edit-summary"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="Brief summary of the article"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Header Image URL</Label>
              <Input
                id="edit-image"
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="bitcoin, art, creativity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Article content (Markdown supported)"
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveEdit} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Save & Share to Nostr
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
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
            Manage your published articles on Nostr
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
              <p className="text-muted-foreground">No blog posts yet. Import your first article above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blogPosts.map((post) => {
                const title = getArticleTitle(post);
                const summary = getArticleSummary(post);
                const image = getArticleImage(post);
                const tags = getArticleTags(post);
                const articleId = getArticleId(post);

                return (
                  <Card key={post.id} className="overflow-hidden">
                    <div className="flex gap-4">
                      {image && (
                        <div className="w-48 h-32 flex-shrink-0">
                          <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{title}</h3>
                            {summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {summary}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(post.created_at * 1000), 'MMM d, yyyy')}
                              </Badge>
                              {tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{tags.length - 3} more
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

      {/* Share to Nostr Confirmation Dialog */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share to Nostr?</AlertDialogTitle>
            <AlertDialogDescription>
              {editingPost 
                ? 'This will update your blog post on the Nostr network. Your followers will be able to see the changes.'
                : 'This will publish your blog post to the Nostr network. Your followers will be able to see it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowShareDialog(false);
              setPendingPublishData(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={editingPost ? confirmSaveEdit : confirmPublish}>
              Share to Nostr
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
