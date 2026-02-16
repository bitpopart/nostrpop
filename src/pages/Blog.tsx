import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZapButton } from '@/components/ZapButton';
import { LoginArea } from '@/components/auth/LoginArea';
import { BlogPostManagement } from '@/components/blog/BlogPostManagement';
import { ShareDialog } from '@/components/share/ShareDialog';
import { Calendar, Tag, ArrowRight, FileText, Plus, Share2, Archive } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';

export default function Blog() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();
  const [searchParams] = useSearchParams();

  // Get initial tab from URL params
  const initialTab = searchParams.get('tab') === 'admin' && isAdmin ? 'admin' : 'blog';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update tab when URL params change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'admin' && isAdmin) {
      setActiveTab('admin');
    } else {
      setActiveTab('blog');
    }
  }, [searchParams, isAdmin]);

  useSeoMeta({
    title: 'Blog - BitPopArt',
    description: 'Latest news from BitPopArt',
  });

  // BitPopArt admin pubkey
  const ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

  // Fetch all blog posts (kind 30023)
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query(
        [{ kinds: [30023], authors: [ADMIN_PUBKEY], '#t': ['blog'], limit: 50 }],
        { signal }
      );

      // Filter out artist-page events (but keep blog posts even if they have artwork tag)
      const filteredEvents = events.filter(e => {
        const dTag = e.tags.find(t => t[0] === 'd')?.[1];
        return dTag !== 'artist-page';
      });
      
      // Sort by published_at tag if it exists, otherwise by created_at (newest first)
      return filteredEvents.sort((a, b) => {
        const aPublished = a.tags.find(t => t[0] === 'published_at')?.[1];
        const bPublished = b.tags.find(t => t[0] === 'published_at')?.[1];
        
        const aDate = aPublished ? parseInt(aPublished) : a.created_at;
        const bDate = bPublished ? parseInt(bPublished) : b.created_at;
        
        return bDate - aDate; // Newest first (descending order)
      });
    },
    staleTime: 0,
  });

  const getArticleTitle = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled';
  };

  const getArticleSummary = (event: NostrEvent): string => {
    const summaryTag = event.tags.find(t => t[0] === 'summary')?.[1];
    if (summaryTag) return summaryTag;

    // Try to parse JSON content and extract first markdown block
    try {
      const parsed = JSON.parse(event.content);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        const firstMarkdownBlock = parsed.blocks.find((b: { type: string; content: string }) => 
          b.type === 'markdown' && b.content?.trim()
        );
        if (firstMarkdownBlock?.content) {
          return firstMarkdownBlock.content.slice(0, 200) + (firstMarkdownBlock.content.length > 200 ? '...' : '');
        }
      }
    } catch {
      // Not JSON, use raw content
    }
    
    return event.content.slice(0, 200) + (event.content.length > 200 ? '...' : '');
  };

  const getArticleImage = (event: NostrEvent): string | undefined => {
    return event.tags.find(t => t[0] === 'image')?.[1];
  };

  const getArticleTags = (event: NostrEvent): string[] => {
    return event.tags.filter(t => t[0] === 't' && t[1] !== 'blog').map(t => t[1]);
  };

  const getArticleId = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'd')?.[1] || event.id;
  };

  const getPublishedDate = (event: NostrEvent): Date => {
    const publishedAt = event.tags.find(t => t[0] === 'published_at')?.[1];
    return publishedAt ? new Date(parseInt(publishedAt) * 1000) : new Date(event.created_at * 1000);
  };

  // Group posts by month for archives
  const postsByMonth = blogPosts.reduce((acc, post) => {
    const date = getPublishedDate(post);
    const monthKey = format(startOfMonth(date), 'yyyy-MM');
    const monthLabel = format(date, 'MMMM yyyy');
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        label: monthLabel,
        posts: []
      };
    }
    acc[monthKey].posts.push(post);
    return acc;
  }, {} as Record<string, { label: string; posts: NostrEvent[] }>);

  const archiveMonths = Object.entries(postsByMonth)
    .sort(([a], [b]) => b.localeCompare(a)) // Newest month first
    .map(([key, value]) => ({ 
      key, 
      ...value,
      posts: value.posts.sort((a, b) => {
        // Within each month, sort posts newest first
        const aDate = getPublishedDate(a).getTime();
        const bDate = getPublishedDate(b).getTime();
        return bDate - aDate;
      })
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 gap-3">
            <img 
              src={`${import.meta.env.BASE_URL || '/'}News_button_1.svg`} 
              alt="News" 
              className="h-12 w-12 flex-shrink-0" 
            />
            <h1 className="text-5xl font-bold leading-tight gradient-header-text">
              Blog
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Latest news from BitPopArt
          </p>
          {user && isAdmin && (
            <Badge 
              className="mt-4 text-white border-0"
              style={getGradientStyle('primary')}
            >
              Admin Access • Blog Management
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          {isAdmin ? (
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-8">
              <TabsTrigger value="blog">Blog Posts</TabsTrigger>
              <TabsTrigger value="archives">Archives</TabsTrigger>
              <TabsTrigger value="admin">Manage Posts</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="blog">Blog Posts</TabsTrigger>
              <TabsTrigger value="archives">Archives</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="blog">
            {/* Login Prompt for Non-Logged-In Users */}
            {!user && (
              <Card className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 border-orange-200 dark:border-orange-800 mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-1">
                        Join the Community
                      </h3>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Log in with Nostr to interact with posts and support creators
                      </p>
                    </div>
                    <LoginArea className="max-w-48" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blog Posts Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <CardHeader className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : blogPosts.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Check back soon for new content!
                  </p>
                  {user && isAdmin && (
                    <Button onClick={() => setActiveTab('admin')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogPosts.map((post) => {
                  const postTitle = getArticleTitle(post);
                  const summary = getArticleSummary(post);
                  const image = getArticleImage(post);
                  const postTags = getArticleTags(post);
                  const articleId = getArticleId(post);
                  const publishedDate = getPublishedDate(post);

                  return (
                    <Card key={post.id} className="h-full hover:shadow-xl transition-all duration-300 group overflow-hidden">
                      <Link to={`/blog/${articleId}`}>
                        {image && (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={image}
                              alt={postTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Action buttons overlay */}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div onClick={(e) => e.stopPropagation()}>
                                <ShareDialog
                                  title={postTitle}
                                  description={summary}
                                  url={`${window.location.origin}/blog/${articleId}`}
                                  imageUrl={image}
                                  category={postTags[0]}
                                  contentType="blog"
                                  eventRef={{
                                    id: post.id,
                                    kind: post.kind,
                                    pubkey: post.pubkey,
                                    dTag: articleId
                                  }}
                                >
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg h-8 w-8 p-0"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </ShareDialog>
                              </div>
                              <div onClick={(e) => e.stopPropagation()}>
                                <ZapButton
                                  authorPubkey={post.pubkey}
                                  event={post}
                                  eventTitle={postTitle}
                                  size="sm"
                                  variant="default"
                                  className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg h-8 w-8 p-0"
                                  showLabel={false}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Link>
                      <CardHeader className="space-y-3">
                        <Link to={`/blog/${articleId}`}>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <time>{format(publishedDate, 'MMMM d, yyyy')}</time>
                          </div>
                          <h2 className="text-2xl font-bold group-hover:text-purple-600 transition-colors line-clamp-2">
                            {postTitle}
                          </h2>
                          <p className="text-muted-foreground line-clamp-3">
                            {summary}
                          </p>
                          {postTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {postTags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {postTags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{postTags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors pt-2">
                            <span className="text-sm font-medium">Read more</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                        {/* Share Button at bottom of card */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <ShareDialog
                            title={postTitle}
                            description={summary}
                            url={`${window.location.origin}/blog/${articleId}`}
                            imageUrl={image}
                            category={postTags[0]}
                            contentType="blog"
                            eventRef={{
                              id: post.id,
                              kind: post.kind,
                              pubkey: post.pubkey,
                              dTag: articleId
                            }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share Article
                            </Button>
                          </ShareDialog>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archives">
            {/* Archives by Month */}
            {isLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : archiveMonths.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Archive className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Archives Yet</h3>
                  <p className="text-muted-foreground">
                    Blog posts will be organized by month here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {archiveMonths.map((month) => (
                  <Card key={month.key}>
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <Archive className="h-5 w-5 mr-2 text-purple-600" />
                        {month.label}
                        <Badge variant="secondary" className="ml-auto">
                          {month.posts.length} {month.posts.length === 1 ? 'post' : 'posts'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {month.posts.map((post) => {
                          const postTitle = getArticleTitle(post);
                          const articleId = getArticleId(post);
                          const publishedDate = getPublishedDate(post);
                          const image = getArticleImage(post);
                          const postTags = getArticleTags(post);

                          return (
                            <div key={post.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                              <Link to={`/blog/${articleId}`} className="flex-1 flex items-start gap-4">
                                {image && (
                                  <img
                                    src={image}
                                    alt={postTitle}
                                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <Calendar className="h-3 w-3" />
                                    <time>{format(publishedDate, 'MMM d')}</time>
                                  </div>
                                  <h3 className="font-semibold hover:text-purple-600 transition-colors line-clamp-2">
                                    {postTitle}
                                  </h3>
                                  {postTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {postTags.slice(0, 2).map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </Link>
                              <div onClick={(e) => e.stopPropagation()}>
                                <ShareDialog
                                  title={postTitle}
                                  description={getArticleSummary(post)}
                                  url={`${window.location.origin}/blog/${articleId}`}
                                  imageUrl={image}
                                  category={postTags[0]}
                                  contentType="blog"
                                  eventRef={{
                                    id: post.id,
                                    kind: post.kind,
                                    pubkey: post.pubkey,
                                    dTag: articleId
                                  }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </ShareDialog>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {user && isAdmin && (
            <TabsContent value="admin">
              <BlogPostManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
