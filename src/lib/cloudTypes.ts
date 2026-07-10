/**
 * Cloud private space types.
 *
 * All data is stored in localStorage — never exposed publicly.
 * Access is protected by a username + password login (credentials managed by admin).
 */

export interface CloudUser {
  /** Unique ID (used as login username) */
  id: string;
  /** Display name shown after login */
  name: string;
  /** Plain password (stored locally — this is a private local space, not a public app) */
  password: string;
  /** ISO timestamp when this account was created */
  createdAt: string;
}

export interface CloudApp {
  /** Unique ID (nanoid-style slug) */
  id: string;
  /** Display title shown on the thumbnail card */
  title: string;
  /** Optional short description */
  description?: string;
  /** Blossom URL of the uploaded HTML file */
  htmlUrl: string;
  /** Optional thumbnail/preview image URL */
  thumbnailUrl?: string;
  /** Background colour used on the thumbnail card (CSS colour string) */
  thumbnailColor?: string;
  /** Display order (lower = first) */
  order?: number;
  /** ISO timestamp */
  createdAt: string;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const CLOUD_USERS_KEY = 'bitpopart:cloud:users';
const CLOUD_APPS_KEY  = 'bitpopart:cloud:apps';
const CLOUD_SESSION_KEY = 'bitpopart:cloud:session';

// ── Cloud users helpers ───────────────────────────────────────────────────────

export function loadCloudUsers(): CloudUser[] {
  try {
    const raw = localStorage.getItem(CLOUD_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveCloudUsers(users: CloudUser[]): void {
  localStorage.setItem(CLOUD_USERS_KEY, JSON.stringify(users));
}

export function createCloudUser(name: string, password: string): CloudUser {
  return {
    id: slugify(name) + '-' + Math.random().toString(36).slice(2, 6),
    name,
    password,
    createdAt: new Date().toISOString(),
  };
}

// ── Cloud apps helpers ────────────────────────────────────────────────────────

export function loadCloudApps(): CloudApp[] {
  try {
    const raw = localStorage.getItem(CLOUD_APPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? [...parsed].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      : [];
  } catch { return []; }
}

export function saveCloudApps(apps: CloudApp[]): void {
  localStorage.setItem(CLOUD_APPS_KEY, JSON.stringify(apps));
}

export function makeCloudAppId(title: string): string {
  return slugify(title) + '-' + Math.random().toString(36).slice(2, 6);
}

// ── Session helpers ───────────────────────────────────────────────────────────

export interface CloudSession {
  userId: string;
  name: string;
  /** unix ms timestamp — session expires after 8 hours of inactivity */
  expiresAt: number;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function loadCloudSession(): CloudSession | null {
  try {
    const raw = localStorage.getItem(CLOUD_SESSION_KEY);
    if (!raw) return null;
    const session: CloudSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(CLOUD_SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

export function saveCloudSession(userId: string, name: string): CloudSession {
  const session: CloudSession = {
    userId,
    name,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearCloudSession(): void {
  localStorage.removeItem(CLOUD_SESSION_KEY);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 30);
}
