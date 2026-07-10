/**
 * Cloud private space types.
 *
 * SECURITY MODEL — AES-256-GCM, localStorage only:
 * ══════════════════════════════════════════════════
 * - A random 256-bit AES-GCM master key is generated once and stored in
 *   localStorage. It NEVER leaves the browser.
 * - The HTML is encrypted in-browser and stored as base64 ciphertext in
 *   localStorage. Nothing is ever uploaded to a public server.
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
  order?: number;
  createdAt: string;
  /** Original plaintext size in bytes (for display) */
  htmlSize?: number;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const CLOUD_USERS_KEY   = 'bitpopart:cloud:users';
const CLOUD_APPS_KEY    = 'bitpopart:cloud:apps';
const CLOUD_SESSION_KEY = 'bitpopart:cloud:session';

/** Encrypted (AES-256-GCM) ciphertext stored as base64 */
function encKey(appId: string) { return `bitpopart:cloud:enc:${appId}`; }
/** Plaintext HTML cache for instant load (derived from enc on first open) */
function htmlKey(appId: string) { return `bitpopart:cloud:html:${appId}`; }

// ── Encrypted storage ─────────────────────────────────────────────────────────

/** Save base64 ciphertext. Returns false on quota exceeded. */
export function saveEncryptedAppData(appId: string, b64: string): boolean {
  try { localStorage.setItem(encKey(appId), b64); return true; }
  catch { return false; }
}

/** Load base64 ciphertext. Returns null if not found. */
export function loadEncryptedAppData(appId: string): string | null {
  return localStorage.getItem(encKey(appId));
}

/** Remove encrypted data (on app delete). */
export function deleteEncryptedAppData(appId: string): void {
  localStorage.removeItem(encKey(appId));
}

// ── Plaintext HTML cache ───────────────────────────────────────────────────────

/** Cache plaintext for instant load. Returns false on quota exceeded (non-fatal). */
export function cacheCloudAppHtml(appId: string, html: string): boolean {
  try { localStorage.setItem(htmlKey(appId), html); return true; }
  catch { return false; }
}

export function loadCachedCloudAppHtml(appId: string): string | null {
  return localStorage.getItem(htmlKey(appId));
}

export function deleteCachedCloudAppHtml(appId: string): void {
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
