/**
 * AppAnalyticsDashboard
 *
 * Admin-only analytics view for /app downloads.
 * Shows:
 *  1. Hero stats bar (total, today, this week, most-loved category)
 *  2. Daily download area chart (last 30 days, stacked by category)
 *  3. Category breakdown bar + donut-style stat cards
 *  4. Top 20 most-downloaded items with thumbnails
 *  5. Recent activity feed (last 50 downloads)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Download,
  TrendingUp,
  Calendar,
  Star,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Clapperboard,
  UserCircle2,
  PanelTop,
  Gift,
  Sparkles,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  getDownloadLog,
  clearDownloadLog,
  buildDailyStats,
  buildTopItems,
  buildCategoryStats,
  CATEGORY_META,
  type DownloadCategory,
  type DailyCount,
} from '@/hooks/useDownloadTracking';

// ── Category icon map ──────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<DownloadCategory, React.ElementType> = {
  wallpaper:  ImageIcon,
  gif:        Clapperboard,
  avatar:     UserCircle2,
  banner:     PanelTop,
  animation:  Sparkles,
  free:       Gift,
};

// ── Hero stat card ─────────────────────────────────────────────────────────────

function HeroStat({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-1" style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-extrabold mt-1" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center opacity-15" style={{ background: color }}>
            <Icon className="h-7 w-7" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom tooltip for area chart ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 text-xs min-w-[140px]">
      <p className="font-bold text-sm mb-2">{label}</p>
      <p className="text-muted-foreground mb-1.5">Total: <strong className="text-foreground">{total}</strong></p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            <span className="capitalize">{p.name}</span>
          </span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Daily chart ────────────────────────────────────────────────────────────────

function DailyChart({ data }: { data: DailyCount[] }) {
  const categories: DownloadCategory[] = ['wallpaper', 'gif', 'avatar', 'banner', 'animation', 'free'];

  // Only show last N days based on viewport
  const displayData = data.slice(-30);

  const hasAnyData = displayData.some(d => d.total > 0);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-orange-500" />
          Daily Downloads — Last 30 Days
        </CardTitle>
        <CardDescription>
          {hasAnyData ? 'Stacked by content type' : 'Start downloading on the /app page to see data here'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAnyData ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <BarChart3 className="h-12 w-12 opacity-20" />
            <p className="text-sm">No downloads recorded yet</p>
            <p className="text-xs">Downloads are tracked when users click the ⬇ button on /app</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={displayData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                {categories.map(cat => (
                  <linearGradient key={cat} id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CATEGORY_META[cat].color} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={CATEGORY_META[cat].color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                wrapperStyle={{ paddingTop: 8 }}
              />
              {categories.map(cat => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={cat}
                  stackId="1"
                  stroke={CATEGORY_META[cat].color}
                  fill={`url(#grad-${cat})`}
                  strokeWidth={1.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Category breakdown ─────────────────────────────────────────────────────────

function CategoryBreakdown({ log }: { log: ReturnType<typeof getDownloadLog> }) {
  const stats = buildCategoryStats(log);
  const hasData = log.length > 0;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
        ) : (
          <>
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats} margin={{ top: 0, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, 'Downloads']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.map((s) => (
                    <Cell key={s.category} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Category cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {stats.map(stat => {
                const Icon = CATEGORY_ICONS[stat.category];
                return (
                  <div
                    key={stat.category}
                    className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/30"
                  >
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: stat.color + '22' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: stat.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                      <p className="font-bold text-base leading-tight">{stat.count}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Top items ──────────────────────────────────────────────────────────────────

function TopItems({ log }: { log: ReturnType<typeof getDownloadLog> }) {
  const [limit, setLimit] = useState(10);
  const items = buildTopItems(log, 20);
  const displayed = items.slice(0, limit);
  const hasData = items.length > 0;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-yellow-500" />
            Most Downloaded
          </CardTitle>
          {hasData && (
            <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-6">No downloads yet</p>
        ) : (
          <div className="space-y-2">
            {displayed.map((item, idx) => {
              const Icon = CATEGORY_ICONS[item.category];
              const meta = CATEGORY_META[item.category];
              return (
                <div
                  key={item.itemId}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  {/* Rank */}
                  <span
                    className="text-xs font-bold w-6 text-center flex-shrink-0"
                    style={{ color: idx < 3 ? '#f59e0b' : undefined }}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>

                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-11 w-11 rounded-lg object-cover flex-shrink-0 border"
                    />
                  ) : (
                    <div
                      className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 border"
                      style={{ background: meta.color + '22' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: meta.color }} />
                    </div>
                  )}

                  {/* Title + category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 mt-0.5"
                      style={{ borderColor: meta.color, color: meta.color }}
                    >
                      <Icon className="h-2.5 w-2.5 mr-0.5" />
                      {meta.label}
                    </Badge>
                  </div>

                  {/* Count */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-extrabold" style={{ color: meta.color }}>{item.count}</p>
                    <p className="text-[10px] text-muted-foreground">downloads</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent feed ────────────────────────────────────────────────────────────────

function RecentFeed({ log }: { log: ReturnType<typeof getDownloadLog> }) {
  const recent = [...log].reverse().slice(0, 50);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-green-500" />
          Recent Downloads
          {log.length > 0 && (
            <Badge variant="secondary" className="text-xs">{log.length} total</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {recent.map(ev => {
              const Icon = CATEGORY_ICONS[ev.category];
              const meta = CATEGORY_META[ev.category];
              const time = new Date(ev.timestamp);
              const timeStr = time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
              const dateStr = time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              return (
                <div key={ev.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors">
                  {ev.imageUrl ? (
                    <img src={ev.imageUrl} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0 border" />
                  ) : (
                    <div
                      className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.color + '22' }}
                    >
                      <Icon className="h-4 w-4" style={{ color: meta.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground" style={{ color: meta.color }}>{meta.label}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">{timeStr}</p>
                    <p className="text-[10px] text-muted-foreground">{dateStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Weekly bar chart (last 7 days) ─────────────────────────────────────────────

function WeeklyChart({ data }: { data: DailyCount[] }) {
  const week = data.slice(-7);
  const hasData = week.some(d => d.total > 0);
  const categories: DownloadCategory[] = ['wallpaper', 'gif', 'avatar', 'banner', 'animation', 'free'];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-blue-500" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">
            No data this week
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={week} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              {categories.map(cat => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  name={cat}
                  stackId="week"
                  fill={CATEGORY_META[cat].color}
                  radius={cat === 'free' ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export function AppAnalyticsDashboard() {
  const [log, setLog] = useState(getDownloadLog);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reload from localStorage on mount and on manual refresh
  const reload = useCallback(() => {
    setLog(getDownloadLog());
    setRefreshKey(k => k + 1);
  }, []);

  // Auto-refresh every 30s so chart stays live
  useEffect(() => {
    reload();
    const id = setInterval(reload, 30_000);
    return () => clearInterval(id);
  }, [reload]);

  const dailyStats = buildDailyStats(log, 30);

  // Hero numbers
  const totalDownloads = log.length;

  const todayKey = (() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  })();

  const todayCount = log.filter(e => e.dateKey === todayKey).length;
  const weekCount = dailyStats.slice(-7).reduce((s, d) => s + d.total, 0);

  const catStats = buildCategoryStats(log);
  const topCat = catStats[0];

  const handleClear = () => {
    clearDownloadLog();
    reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <Download className="h-6 w-6 text-orange-500" />
            App Download Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live stats for every download on /app — updated automatically every 30 s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Download History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {totalDownloads} recorded download events from this browser. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleClear}>
                  Clear All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Hero stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroStat
          label="Total Downloads"
          value={totalDownloads.toLocaleString()}
          sub="all time"
          icon={Download}
          color="#f97316"
        />
        <HeroStat
          label="Today"
          value={todayCount}
          sub="downloads so far"
          icon={TrendingUp}
          color="#22c55e"
        />
        <HeroStat
          label="This Week"
          value={weekCount}
          sub="last 7 days"
          icon={Calendar}
          color="#3b82f6"
        />
        <HeroStat
          label="Most Loved"
          value={topCat ? topCat.count : '—'}
          sub={topCat ? topCat.label : 'no data yet'}
          icon={topCat ? CATEGORY_ICONS[topCat.category] : Star}
          color={topCat ? topCat.color : '#a3a3a3'}
        />
      </div>

      {/* Daily chart — full width */}
      <DailyChart data={dailyStats} key={`daily-${refreshKey}`} />

      {/* Weekly + Category in 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyChart data={dailyStats} />
        <CategoryBreakdown log={log} />
      </div>

      {/* Top items + Recent feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopItems log={log} />
        <RecentFeed log={log} />
      </div>

      {/* Info note */}
      <Card className="border border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Activity className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-800 dark:text-orange-300 space-y-1">
            <p className="font-semibold">How tracking works</p>
            <p>
              Downloads are recorded locally in this browser when a visitor clicks the ⬇ download button on the <strong>/app</strong> page.
              Data is stored in <code className="bg-orange-100 dark:bg-orange-900/50 px-1 rounded text-xs">localStorage</code> — it persists across sessions but is browser-specific.
              The chart auto-refreshes every 30 seconds so you can watch downloads come in live.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
