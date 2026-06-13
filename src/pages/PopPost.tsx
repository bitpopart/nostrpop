import { useState, useCallback } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import type { ScheduledPost } from '@/hooks/useScheduledPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoginArea } from '@/components/auth/LoginArea';
import {
  Shield,
  Calendar,
  Clock,
  Send,
  BarChart3,
  Plus,
  Zap,
  Heart,
  Repeat2,
  MessageCircle,
  Image as ImageIcon,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { PostComposer } from '@/components/poppost/PostComposer';
import { ScheduleAgenda } from '@/components/poppost/ScheduleAgenda';
import { EngagementDashboard } from '@/components/poppost/EngagementDashboard';
import { useScheduledPostsPublisher } from '@/hooks/useScheduledPostsPublisher';

const PopPost = () => {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedule');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  const {
    posts,
    upcomingPosts,
    pastPosts,
    draftPosts,
    createPost,
    updatePost,
    deletePost,
    markPublished,
    markFailed,
  } = useScheduledPosts();

  // Background auto-publisher: fires off pre-signed events when their scheduled time arrives
  useScheduledPostsPublisher({
    upcomingPosts,
    onMarkPublished: markPublished,
    onMarkFailed: markFailed,
  });

  useSeoMeta({
    title: 'PopPost — Nostr Content Scheduler',
    description: 'Schedule and manage your Nostr content posts for BitPopArt community.',
    robots: 'noindex, nofollow',
  });

  const handleOpenComposer = useCallback((post?: ScheduledPost) => {
    setEditingPost(post ?? null);
    setComposerOpen(true);
  }, []);

  const handleCloseComposer = useCallback(() => {
    setEditingPost(null);
    setComposerOpen(false);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <CardTitle className="text-2xl">PopPost Admin</CardTitle>
            <CardDescription>
              Please log in with your admin account to access the scheduler.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginArea className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">Access Denied</CardTitle>
            <CardDescription>
              Only the BitPopArt admin can access PopPost.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full" variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                PopPost
              </h1>
              <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 text-xs">
                Nostr Scheduler
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground ml-14">
              Schedule and manage your BitPopArt content for Nostr
            </p>
          </div>
          <Button
            onClick={() => handleOpenComposer()}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg gap-2"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingPosts.length}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pastPosts.filter(p => p.status === 'published').length}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Pencil className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftPosts.length}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <Send className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Engagement
            </TabsTrigger>
          </TabsList>

          {/* Schedule / Agenda Tab */}
          <TabsContent value="schedule">
            <ScheduleAgenda
              upcomingPosts={upcomingPosts}
              onEdit={handleOpenComposer}
              onDelete={deletePost}
              onPublish={(post) => {
                // Trigger publish from agenda
                handleOpenComposer(post);
              }}
            />
          </TabsContent>

          {/* All Posts Tab */}
          <TabsContent value="posts">
            <div className="space-y-4">
              {/* Drafts */}
              {draftPosts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Pencil className="h-4 w-4" /> Drafts ({draftPosts.length})
                  </h3>
                  <div className="space-y-3">
                    {draftPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={() => handleOpenComposer(post)}
                        onDelete={() => deletePost(post.id)}
                        onMarkPublished={markPublished}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcomingPosts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Upcoming ({upcomingPosts.length})
                  </h3>
                  <div className="space-y-3">
                    {upcomingPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={() => handleOpenComposer(post)}
                        onDelete={() => deletePost(post.id)}
                        onMarkPublished={markPublished}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past / Published */}
              {pastPosts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> History ({pastPosts.length})
                  </h3>
                  <div className="space-y-3">
                    {pastPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={() => handleOpenComposer(post)}
                        onDelete={() => deletePost(post.id)}
                        onMarkPublished={markPublished}
                      />
                    ))}
                  </div>
                </div>
              )}

              {posts.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg font-medium mb-2">No posts yet</p>
                    <p className="text-muted-foreground text-sm mb-6">
                      Create your first scheduled post to start building your Nostr community.
                    </p>
                    <Button
                      onClick={() => handleOpenComposer()}
                      className="bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <EngagementDashboard publishedPosts={pastPosts.filter(p => p.status === 'published')} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Composer Modal */}
      {composerOpen && (
        <PostComposer
          editingPost={editingPost}
          onClose={handleCloseComposer}
          onCreate={createPost}
          onUpdate={updatePost}
          onMarkPublished={markPublished}
          onMarkFailed={markFailed}
        />
      )}
    </div>
  );
};

// ── PostCard Component ──────────────────────────────────────────────────────────

interface PostCardProps {
  post: ScheduledPost;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPublished: (id: string, eventId: string) => void;
}

function PostCard({ post, onEdit, onDelete, onMarkPublished }: PostCardProps) {
  const scheduledDate = new Date(post.scheduledAt);
  const isOverdue = post.status === 'scheduled' && scheduledDate < new Date();
  const isPast = post.status === 'published' || post.status === 'failed';

  const statusConfig = {
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
    published: { label: 'Published', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle },
    draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Pencil },
  };

  const config = statusConfig[post.status];
  const StatusIcon = config.icon;

  return (
    <Card className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md transition-all hover:shadow-lg ${isOverdue ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Media preview */}
          {post.media.length > 0 && (
            <div className="flex-shrink-0 flex gap-1">
              {post.media.slice(0, 2).map((m, i) => (
                <div key={i} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                  <img
                    src={m.url}
                    alt={m.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {post.media.length > 2 && i === 1 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">+{post.media.length - 2}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm line-clamp-2 text-foreground">
                {post.caption || <span className="text-muted-foreground italic">No caption</span>}
              </p>
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${config.color}`}>
                <StatusIcon className="h-3 w-3" />
                {isOverdue && post.status === 'scheduled' ? 'Overdue' : config.label}
              </span>
            </div>

            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.hashtags.slice(0, 5).map(tag => (
                  <span key={tag} className="text-xs text-orange-600 dark:text-orange-400">#{tag}</span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.status === 'draft'
                  ? `Created ${new Date(post.createdAt).toLocaleDateString()}`
                  : scheduledDate.toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                }
              </span>

              {!isPast && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onEdit}>
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {post.status === 'published' && post.publishedEventId && (
                <span className="text-xs text-muted-foreground">
                  ID: {post.publishedEventId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PopPost;
