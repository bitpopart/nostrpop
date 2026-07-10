/**
 * Cloud private space types.
 *
 * SECURITY MODEL (Option 1 — AES-256-GCM + Blossom):
 * ════════════════════════════════════════════════════
 * - A random 256-bit AES-GCM master key is generated once and stored in
 *   localStorage. It NEVER leaves the browser.
 * - Before upload, the HTML is encrypted with this key. The resulting
 *   binary blob is what gets stored on Blossom/CDN.
 * - The CDN file is pure ciphertext — completely unreadable without the key.
 * - On load, the ciphertext is fetched, decrypted in memory, and injected
 *   via `srcdoc`. The plaintext HTML is never stored or transmitted publicly.
 * - The master key can be exported (base64) and imported on another browser
 *   to access the same encrypted apps from any device.
 *
 * localStorage is also used as a plaintext cache to make apps available
 * offline / when the CDN is unreachable.
 */

export interface CloudUser {
  /** Unique ID (used as login username) */
  id: string;
  /** Display name shown after login */
  name: string;
  /** Password (stored locally) */
  password: string;
  /** ISO timestamp */
  createdAt: string;
}

export interface CloudApp {
  /** Unique ID (slug) */
  id: string;
  /** Display title shown on the thumbnail card */
  title: string;
  /** Optional short description */
  description?: string;
  /** Blossom URL pointing to the AES-256-GCM encrypted binary blob */
  encryptedUrl?: string;
  /** Optional thumbnail image URL (public — just a preview, not sensitive) */
  thumbnailUrl?: string;
  /** Display order (lower = first) */
  order?: number;
  /** ISO timestamp */
  createdAt: string;
  /** Original plaintext size (bytes) for display */
  htmlSize?: number;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const CLOUD_USERS_KEY   = 'bitpopart:cloud:users';
const CLOUD_APPS_KEY    = 'bitpopart:cloud:apps';
const CLOUD_SESSION_KEY = 'bitpopart:cloud:session';

/** Plaintext HTML cache — used as offline fallback */
function htmlCacheKey(appId: string) {
  return `bitpopart:cloud:html:${appId}`;
}

// ── Plaintext HTML cache (offline fallback) ───────────────────────────────────

/**
 * Cache decrypted HTML locally so the app loads instantly without a CDN fetch.
 * Returns false if quota is exceeded (non-fatal — encrypted URL is the source of truth).
 */
export function cacheCloudAppHtml(appId: string, html: string): boolean {
  try {
    localStorage.setItem(htmlCacheKey(appId), html);
    return true;
  } catch { return false; }
}

/** Load cached plaintext HTML. Returns null if not cached. */
export function loadCachedCloudAppHtml(appId: string): string | null {
  return localStorage.getItem(htmlCacheKey(appId));
}

/** Remove cached HTML (called on app delete). */
export function deleteCachedCloudAppHtml(appId: string): void {
  localStorage.removeItem(htmlCacheKey(appId));
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

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

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

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
