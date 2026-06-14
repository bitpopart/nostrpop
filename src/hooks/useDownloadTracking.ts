/**
 * useDownloadTracking
 *
 * Tracks every download made on the /app page (wallpapers, GIFs, avatars, banners,
 * free downloads, animations) by persisting events to localStorage.
 *
 * Data schema stored under DOWNLOAD_LOG_KEY:
 *   DownloadEvent[]
 *
 * Each event captures:
 *   - id        : unique UUID
 *   - itemId    : the Nostr d-tag (content identifier)
 *   - title     : human-readable title
 *   - category  : 'wallpaper' | 'gif' | 'avatar' | 'banner' | 'animation' | 'free'
 *   - imageUrl  : thumbnail / preview URL
 *   - timestamp : ISO string
 *   - dateKey   : "YYYY-MM-DD" for daily grouping
 */

export type DownloadCategory = 'wallpaper' | 'gif' | 'avatar' | 'banner' | 'animation' | 'free';

export interface DownloadEvent {
  id: string;
  itemId: string;
  title: string;
  category: DownloadCategory;
  imageUrl: string;
  timestamp: string;
  dateKey: string; // "YYYY-MM-DD"
}

const DOWNLOAD_LOG_KEY = 'nostrpop_app_downloads';
const MAX_LOG_SIZE = 10_000; // keep at most 10k events

// ── Storage helpers ───────────────────────────────────────────────────────────

export function getDownloadLog(): DownloadEvent[] {
  try {
    const raw = localStorage.getItem(DOWNLOAD_LOG_KEY);
    return raw ? (JSON.parse(raw) as DownloadEvent[]) : [];
  } catch {
    return [];
  }
}

function saveDownloadLog(events: DownloadEvent[]) {
  // Trim to max size (keep newest)
  const trimmed = events.length > MAX_LOG_SIZE ? events.slice(-MAX_LOG_SIZE) : events;
  localStorage.setItem(DOWNLOAD_LOG_KEY, JSON.stringify(trimmed));
}

/** Record a single download. Called imperatively from download handlers. */
export function recordDownload(params: {
  itemId: string;
  title: string;
  category: DownloadCategory;
  imageUrl: string;
}) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const event: DownloadEvent = {
    id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: params.itemId,
    title: params.title,
    category: params.category,
    imageUrl: params.imageUrl,
    timestamp: now.toISOString(),
    dateKey,
  };

  const log = getDownloadLog();
  log.push(event);
  saveDownloadLog(log);
}

/** Clear all download history (admin action). */
export function clearDownloadLog() {
  localStorage.removeItem(DOWNLOAD_LOG_KEY);
}

// ── Derived analytics helpers (pure functions, no React) ─────────────────────

export interface DailyCount {
  date: string;  // "YYYY-MM-DD"
  label: string; // "Jun 14"
  total: number;
  wallpaper: number;
  gif: number;
  avatar: number;
  banner: number;
  animation: number;
  free: number;
}

export interface TopItem {
  itemId: string;
  title: string;
  category: DownloadCategory;
  imageUrl: string;
  count: number;
}

export interface CategoryStat {
  category: DownloadCategory;
  label: string;
  count: number;
  pct: number;
  color: string;
}

const CATEGORY_META: Record<DownloadCategory, { label: string; color: string }> = {
  wallpaper: { label: 'Wallpapers',  color: '#14b8a6' },
  gif:       { label: 'Animated GIFs', color: '#f59e0b' },
  avatar:    { label: 'Avatars',     color: '#8b5cf6' },
  banner:    { label: 'Banners',     color: '#0ea5e9' },
  animation: { label: 'Animations',  color: '#f43f5e' },
  free:      { label: 'Free Images', color: '#22c55e' },
};

const CATEGORIES: DownloadCategory[] = ['wallpaper', 'gif', 'avatar', 'banner', 'animation', 'free'];

function formatLabel(dateKey: string): string {
  const [, m, d] = dateKey.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}`;
}

/** Build last N days of daily download counts. */
export function buildDailyStats(log: DownloadEvent[], days = 30): DailyCount[] {
  // Generate date keys for the last N days
  const result: DailyCount[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const pad = (n: number) => String(n).padStart(2, '0');
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    result.push({
      date: key,
      label: formatLabel(key),
      total: 0,
      wallpaper: 0,
      gif: 0,
      avatar: 0,
      banner: 0,
      animation: 0,
      free: 0,
    });
  }

  const byDate = new Map(result.map(r => [r.date, r]));

  for (const ev of log) {
    const bucket = byDate.get(ev.dateKey);
    if (!bucket) continue;
    bucket.total++;
    if (ev.category in bucket) {
      (bucket as Record<string, number>)[ev.category]++;
    }
  }

  return result;
}

/** Top N most-downloaded items. */
export function buildTopItems(log: DownloadEvent[], topN = 20): TopItem[] {
  const map = new Map<string, TopItem>();

  for (const ev of log) {
    const existing = map.get(ev.itemId);
    if (existing) {
      existing.count++;
    } else {
      map.set(ev.itemId, {
        itemId: ev.itemId,
        title: ev.title,
        category: ev.category,
        imageUrl: ev.imageUrl,
        count: 1,
      });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** Per-category totals. */
export function buildCategoryStats(log: DownloadEvent[]): CategoryStat[] {
  const counts: Record<DownloadCategory, number> = {
    wallpaper: 0, gif: 0, avatar: 0, banner: 0, animation: 0, free: 0,
  };

  for (const ev of log) {
    if (ev.category in counts) counts[ev.category]++;
  }

  const total = log.length || 1;

  return CATEGORIES.map(cat => ({
    category: cat,
    label: CATEGORY_META[cat].label,
    count: counts[cat],
    pct: Math.round((counts[cat] / total) * 100),
    color: CATEGORY_META[cat].color,
  })).sort((a, b) => b.count - a.count);
}

export { CATEGORY_META, CATEGORIES };
