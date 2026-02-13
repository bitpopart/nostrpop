import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZapButton } from '@/components/ZapButton';
import { LoginArea } from '@/components/auth/LoginArea';
import { BlogPostManagement } from '@/components/blog/BlogPostManagement';
import { Calendar, Tag, ArrowRight, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';

export default function Blog() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
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
    title: 'News - BitPopArt',
    description: 'Read latest news and insights from BitPopArt on Bitcoin, art, and creativity',
  });

  // Fetch all blog posts (kind 30023)
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query(
        [{ kinds: [30023], '#t': ['blog'], limit: 50 }],
        { signal }
      );

      // Filter out artist-page and artwork events
      const filteredEvents = events.filter(e => {
        const dTag = e.tags.find(t => t[0] === 'd')?.[1];
        const hasArtworkTag = e.tags.some(t => t[0] === 't' && t[1] === 'artwork');
        return dTag !== 'artist-page' && !hasArtworkTag;
      });
      
      return filteredEvents.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 30000,
  });

  const getArticleTitle = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled';
  };

  const getArticleSummary = (event: NostrEvent): string => {
    return event.tags.find(t => t[0] === 'summary')?.[1] || event.content.slice(0, 200) + '...';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            News
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Latest news on Bitcoin, art, and creativity
          </p>
          {user && isAdmin && (
            <Badge className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              Admin Access • Blog Management
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          {isAdmin ? (
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
              <TabsTrigger value="blog">Blog Posts</TabsTrigger>
              <TabsTrigger value="admin">Manage Posts</TabsTrigger>
            </TabsList>
          ) : (
            <div className="mb-8" />
          )}

          <TabsContent value="blog">
            {/* Login Prompt for Non-Logged-In Users */}
            {!user && (
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        Join the Community
                      </h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
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
                    <Link key={post.id} to={`/blog/${articleId}`}>
                      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden">
                        {image && (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={image}
                              alt={postTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Zap button overlay */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div onClick={(e) => e.stopPropagation()}>
                                <ZapButton
                                  authorPubkey={post.pubkey}
                                  event={post}
                                  eventTitle={postTitle}
                                  size="sm"
                                  variant="default"
                                  className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg"
                                  showLabel={false}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <CardHeader className="space-y-3">
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
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
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
