/**
 * Client Portal — all state lives in localStorage (no server needed).
 *
 * Data model:
 *  - ClientPage   : a named page with a slug, title, description, and list of
 *                   allowed content sections (e.g. "brand-guide").
 *  - AccessCode   : a short random code that unlocks one or more ClientPage slugs.
 *  - NpubEntry    : a whitelisted Nostr npub that can access one or more pages.
 *
 * Session:
 *  - After a successful code or npub login the session is stored in sessionStorage
 *    so it is cleared when the browser tab closes.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClientPage {
  id: string;           // uuid
  slug: string;         // URL slug, e.g. "johndoe-brand"
  title: string;        // Display title shown to the client
  description: string;  // Short description
  sections: string[];   // Content sections unlocked, e.g. ["brand-guide"]
  createdAt: number;    // Unix ms
  active: boolean;
}

export interface AccessCode {
  id: string;           // uuid
  code: string;         // e.g. "BPX-7K3M"
  label: string;        // Admin note, e.g. "For John Doe"
  pageIds: string[];    // Which ClientPage ids this code unlocks
  usedCount: number;
  maxUses: number;      // 0 = unlimited
  expiresAt: number | null; // Unix ms, null = no expiry
  createdAt: number;
  active: boolean;
}

export interface NpubEntry {
  id: string;
  npub: string;
  label: string;        // Admin note
  pageIds: string[];
  createdAt: number;
  active: boolean;
}

export type PortalSession =
  | { type: 'code'; codeId: string; pageIds: string[] }
  | { type: 'npub'; npub: string; pageIds: string[] };

// ─── Storage keys ─────────────────────────────────────────────────────────────

const PAGES_KEY   = 'cp_pages';
const CODES_KEY   = 'cp_codes';
const NPUBS_KEY   = 'cp_npubs';
const SESSION_KEY = 'cp_session';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) result += '-';
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result; // e.g. "BPX7-K3MN"
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export function getPages(): ClientPage[] {
  return load<ClientPage>(PAGES_KEY);
}

export function savePage(page: ClientPage): void {
  const pages = getPages().filter(p => p.id !== page.id);
  save(PAGES_KEY, [...pages, page]);
}

export function deletePage(id: string): void {
  save(PAGES_KEY, getPages().filter(p => p.id !== id));
}

export function createPage(data: Omit<ClientPage, 'id' | 'createdAt'>): ClientPage {
  const page: ClientPage = { ...data, id: uuid(), createdAt: Date.now() };
  savePage(page);
  return page;
}

export function getPageBySlug(slug: string): ClientPage | undefined {
  return getPages().find(p => p.slug === slug && p.active);
}

// ─── Access Codes ─────────────────────────────────────────────────────────────

export function getCodes(): AccessCode[] {
  return load<AccessCode>(CODES_KEY);
}

export function saveCode(code: AccessCode): void {
  const codes = getCodes().filter(c => c.id !== code.id);
  save(CODES_KEY, [...codes, code]);
}

export function deleteCode(id: string): void {
  save(CODES_KEY, getCodes().filter(c => c.id !== id));
}

export function createCode(label: string, pageIds: string[], maxUses = 0, expiresAt: number | null = null): AccessCode {
  const code: AccessCode = {
    id: uuid(),
    code: generateCode(),
    label,
    pageIds,
    usedCount: 0,
    maxUses,
    expiresAt,
    createdAt: Date.now(),
    active: true,
  };
  saveCode(code);
  return code;
}

/**
 * Try to redeem a code. Returns the matching AccessCode or null.
 * Increments usedCount on success.
 */
export function redeemCode(inputCode: string): AccessCode | null {
  const normalized = inputCode.trim().toUpperCase().replace(/\s/g, '');
  const codes = getCodes();
  const match = codes.find(c =>
    c.active &&
    c.code.replace('-', '') === normalized.replace('-', '') &&
    (c.maxUses === 0 || c.usedCount < c.maxUses) &&
    (c.expiresAt === null || c.expiresAt > Date.now())
  );
  if (!match) return null;
  // Increment usage
  saveCode({ ...match, usedCount: match.usedCount + 1 });
  return match;
}

// ─── Npub whitelist ───────────────────────────────────────────────────────────

export function getNpubs(): NpubEntry[] {
  return load<NpubEntry>(NPUBS_KEY);
}

export function saveNpub(entry: NpubEntry): void {
  const list = getNpubs().filter(n => n.id !== entry.id);
  save(NPUBS_KEY, [...list, entry]);
}

export function deleteNpub(id: string): void {
  save(NPUBS_KEY, getNpubs().filter(n => n.id !== id));
}

export function createNpub(npub: string, label: string, pageIds: string[]): NpubEntry {
  const entry: NpubEntry = { id: uuid(), npub: npub.trim(), label, pageIds, createdAt: Date.now(), active: true };
  saveNpub(entry);
  return entry;
}

export function lookupNpub(npub: string): NpubEntry | null {
  return getNpubs().find(n => n.active && n.npub === npub.trim()) ?? null;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function setSession(session: PortalSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): PortalSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PortalSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Returns the list of ClientPage ids the current session has access to.
 */
export function getSessionPageIds(): string[] {
  const s = getSession();
  return s?.pageIds ?? [];
}

/**
 * Returns true if the current session has access to the given page.
 */
export function sessionCanAccessPage(pageId: string): boolean {
  return getSessionPageIds().includes(pageId);
}
