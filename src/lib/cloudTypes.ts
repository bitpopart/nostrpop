/**
 * Cloud private space types.
 *
 * SECURITY MODEL:
 * - HTML app content is stored ONLY in localStorage — never uploaded to any
 *   public server or CDN.
 * - There is no public URL for any app. Content only exists on the admin's
 *   own browser.
 * - Access is gated by a username + password stored in localStorage.
 * - Sessions expire after 8 hours.
 *
 * localStorage size limit is typically 5–10 MB per origin.
 * Large HTML apps (with embedded assets) may hit that limit.
 */

export interface CloudUser {
  /** Unique ID (used as login username) */
  id: string;
  /** Display name shown after login */
  name: string;
  /** Password (stored locally — this is a private local-only space) */
  password: string;
  /** ISO timestamp when this account was created */
  createdAt: string;
}

export interface CloudApp {
  /** Unique ID (slug) */
  id: string;
  /** Display title shown on the thumbnail card */
  title: string;
  /** Optional short description */
  description?: string;
  /** Optional thumbnail image URL (public image is fine — it's just a preview) */
  thumbnailUrl?: string;
  /** Display order (lower = first) */
  order?: number;
  /** ISO timestamp */
  createdAt: string;
  /** Size hint (bytes) — stored alongside metadata so the list can show it */
  htmlSize?: number;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const CLOUD_USERS_KEY   = 'bitpopart:cloud:users';
const CLOUD_APPS_KEY    = 'bitpopart:cloud:apps';
const CLOUD_SESSION_KEY = 'bitpopart:cloud:session';

/** Per-app HTML content lives under this key prefix */
function htmlKey(appId: string) {
  return `bitpopart:cloud:html:${appId}`;
}

// ── Cloud HTML content ────────────────────────────────────────────────────────

/**
 * Save the raw HTML for an app to localStorage.
 * Returns false if the quota is exceeded.
 */
export function saveCloudAppHtml(appId: string, html: string): boolean {
  try {
    localStorage.setItem(htmlKey(appId), html);
    return true;
  } catch {
    return false; // QuotaExceededError
  }
}

/** Load the raw HTML for an app from localStorage. Returns null if not found. */
export function loadCloudAppHtml(appId: string): string | null {
  return localStorage.getItem(htmlKey(appId));
}

/** Remove the HTML content for an app (called on delete). */
export function deleteCloudAppHtml(appId: string): void {
  localStorage.removeItem(htmlKey(appId));
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

// ── Session helpers ───────────────────────────────────────────────────────────

export interface CloudSession {
  userId: string;
  name: string;
  /** unix ms — session expires after 8 hours */
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

/** Human-readable file size */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
