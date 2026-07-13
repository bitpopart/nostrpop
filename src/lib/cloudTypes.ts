/**
 * Cloud private space types.
 *
 * SECURITY MODEL — AES-256-GCM, IndexedDB + localStorage:
 * ══════════════════════════════════════════════════════════
 * - A random 256-bit AES-GCM master key is generated once and stored in
 *   localStorage. It NEVER leaves the browser.
 * - The HTML is encrypted in-browser and stored as base64 ciphertext in
 *   IndexedDB (hundreds of MB quota vs the old ~5 MB localStorage limit).
 * - Tiny metadata (app list, users, session) stays in localStorage.
 * - To use apps on another browser: export a .bpcloud backup file from the
 *   Admin → Cloud tab and import it on the other browser.
 * - Sessions expire after 8 hours.
 */

export interface CloudUser {
  id: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface CloudApp {
  id: string;
  title: string;
  description?: string;
  /** Optional public thumbnail image URL (just a preview, not sensitive) */
  thumbnailUrl?: string;
  /** Optional solid background colour for the thumbnail area */
  thumbnailColor?: string;
  order?: number;
  createdAt: string;
  /** Original plaintext size in bytes (for display) */
  htmlSize?: number;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const CLOUD_USERS_KEY   = 'bitpopart:cloud:users';
const CLOUD_APPS_KEY    = 'bitpopart:cloud:apps';
const CLOUD_SESSION_KEY = 'bitpopart:cloud:session';

// ── Large binary blobs → IndexedDB ────────────────────────────────────────────
// Re-export the async IDB functions under the same names used throughout the app
// so callers only need to add `await`.

export {
  saveEncryptedAppData,
  loadEncryptedAppData,
  loadEncryptedAppDataSync,
  deleteEncryptedAppData,
  cacheCloudAppHtml,
  loadCachedCloudAppHtml,
  deleteCachedCloudAppHtml,
  clearAllCloudAppCaches,
  getCloudIDBUsageBytes,
  migrateCloudDataToIDB,
} from './cloudIDB';

// ── Cloud apps helpers (localStorage — tiny metadata only) ────────────────────

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
  const session: CloudSession = { userId, name, expiresAt: Date.now() + SESSION_TTL_MS };
  localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearCloudSession(): void {
  localStorage.removeItem(CLOUD_SESSION_KEY);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
