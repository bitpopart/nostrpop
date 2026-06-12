import { useState, useMemo } from 'react';
import type { ScheduledPost } from '@/hooks/useScheduledPosts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Send,
  Plus,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ScheduleAgendaProps {
  upcomingPosts: ScheduledPost[];
  onEdit: (post: ScheduledPost) => void;
  onDelete: (id: string) => void;
  onPublish: (post: ScheduledPost) => void;
}

type ViewMode = 'week' | 'month' | 'list';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function ScheduleAgenda({ upcomingPosts, onEdit, onDelete, onPublish }: ScheduleAgendaProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigate to previous period
  const goBack = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  // Navigate to next period
  const goForward = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // Build week days (Sun-Sat)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Build month calendar grid
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Fill leading nulls
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    // Fill days
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    // Fill trailing nulls to complete 6-week grid
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentDate]);

  // Group posts by day
  const postsByDay = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    for (const post of upcomingPosts) {
      const d = new Date(post.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(post);
    }
    return map;
  }, [upcomingPosts]);

  const getDayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const getDayPosts = (d: Date) => postsByDay[getDayKey(d)] ?? [];

  const today = new Date();

  const headerLabel = viewMode === 'week'
    ? `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* Calendar Toolbar */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goForward}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-sm ml-2">{headerLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              {(['week', 'month', 'list'] as ViewMode[]).map(v => (
                <Button
                  key={v}
                  variant={viewMode === v ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode(v)}
                  className={`text-xs capitalize ${viewMode === v ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' : ''}`}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week View */}
      {viewMode === 'week' && (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b dark:border-gray-700">
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                const posts = getDayPosts(day);
                return (
                  <div key={i} className={`border-r dark:border-gray-700 last:border-r-0 ${isToday ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                    {/* Day header */}
                    <div className={`p-2 text-center border-b dark:border-gray-700 ${isToday ? 'bg-orange-100 dark:bg-orange-900/20' : ''}`}>
                      <p className="text-xs text-muted-foreground">{DAY_NAMES[day.getDay()]}</p>
                      <p className={`text-lg font-bold ${isToday ? 'text-orange-600' : ''}`}>{day.getDate()}</p>
                    </div>
                    {/* Posts for this day */}
                    <div className="p-1 min-h-[120px] space-y-1">
                      {posts.map(post => (
                        <MiniPostChip key={post.id} post={post} onEdit={() => onEdit(post)} onDelete={() => onDelete(post.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {DAY_NAMES.map(d => (
                <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                if (!day) {
                  return <div key={i} className="border-r border-b dark:border-gray-700 last:border-r-0 bg-gray-50/50 dark:bg-gray-800/50 min-h-[80px]" />;
                }
                const isToday = isSameDay(day, today);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const posts = getDayPosts(day);
                return (
                  <div
                    key={i}
                    className={`border-r border-b dark:border-gray-700 last:border-r-0 p-1 min-h-[80px] ${
                      isToday ? 'bg-orange-50 dark:bg-orange-900/10' : !isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''
                    }`}
                  >
                    <span className={`text-xs font-semibold block text-right mb-0.5 ${
                      isToday ? 'text-orange-600' : isCurrentMonth ? '' : 'text-muted-foreground'
                    }`}>
                      {day.getDate()}
                    </span>
                    <div className="space-y-0.5">
                      {posts.slice(0, 2).map(post => (
                        <MiniPostChip key={post.id} post={post} onEdit={() => onEdit(post)} onDelete={() => onDelete(post.id)} compact />
                      ))}
                      {posts.length > 2 && (
                        <p className="text-xs text-muted-foreground text-center">+{posts.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {upcomingPosts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No scheduled posts</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new post and schedule it for a specific date and time.
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingPosts.map(post => (
              <AgendaListItem key={post.id} post={post} onEdit={() => onEdit(post)} onDelete={() => onDelete(post.id)} onPublish={() => onPublish(post)} />
            ))
          )}
        </div>
      )}

      {/* Legend */}
      {(viewMode === 'week' || viewMode === 'month') && upcomingPosts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No scheduled posts yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Click "New Post" to schedule content.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Mini chip for calendar cells ───────────────────────────────────────────────

function MiniPostChip({
  post,
  onEdit,
  onDelete,
  compact = false,
}: {
  post: ScheduledPost;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const time = new Date(post.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative rounded bg-gradient-to-r from-orange-500 to-pink-500 text-white cursor-pointer hover:from-orange-600 hover:to-pink-600 transition-colors ${compact ? 'px-1 py-0.5' : 'px-1.5 py-1'}`}
      onClick={onEdit}
    >
      <div className="flex items-center gap-1 min-w-0">
        {!compact && (
          <Clock className="h-2.5 w-2.5 flex-shrink-0 opacity-80" />
        )}
        <span className="text-[10px] truncate">
          {compact ? (post.caption?.slice(0, 12) || time) : `${time} ${post.caption?.slice(0, 20) || ''}`}
        </span>
      </div>
    </div>
  );
}

// ── Agenda list item ───────────────────────────────────────────────────────────

function AgendaListItem({
  post,
  onEdit,
  onDelete,
  onPublish,
}: {
  post: ScheduledPost;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
}) {
  const scheduledDate = new Date(post.scheduledAt);
  const isOverdue = scheduledDate < new Date();

  return (
    <Card className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md ${isOverdue ? 'border-l-4 border-l-amber-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Date column */}
          <div className="flex-shrink-0 text-center w-16">
            <p className="text-2xl font-bold text-orange-600">{scheduledDate.getDate()}</p>
            <p className="text-xs text-muted-foreground">{MONTH_NAMES[scheduledDate.getMonth()].slice(0, 3).toUpperCase()}</p>
            <p className="text-xs font-semibold mt-1">
              {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="h-auto w-px bg-orange-200 dark:bg-orange-800" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Media thumbnails */}
            {post.media.length > 0 && (
              <div className="flex gap-1.5 mb-2">
                {post.media.slice(0, 4).map((m, i) => (
                  <div key={i} className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                    {post.media.length > 4 && i === 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+{post.media.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm line-clamp-2 mb-2">
              {post.caption || <span className="text-muted-foreground italic">No caption</span>}
            </p>

            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.hashtags.slice(0, 6).map(tag => (
                  <span key={tag} className="text-xs text-orange-600 dark:text-orange-400">#{tag}</span>
                ))}
              </div>
            )}

            {isOverdue && (
              <Badge variant="outline" className="text-amber-600 border-amber-400 dark:border-amber-600 mb-2 text-xs">
                Overdue — not yet published
              </Badge>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onEdit}>
                <Edit3 className="h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                onClick={onPublish}
              >
                <Send className="h-3 w-3" />
                Publish Now
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto gap-1">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete scheduled post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this scheduled post. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
