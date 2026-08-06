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

export interface DesignItem {
  id: string;
  pageId: string;        // which ClientPage it belongs to
  title: string;
  description: string;
  imageUrl: string;      // Blossom CDN URL (never base64)
  imageType: string;     // MIME type, e.g. 'image/png'
  version: string;       // e.g. "v1", "v2" — free text
  createdAt: number;
  updatedAt: number;
}

export interface DesignComment {
  id: string;
  designId: string;
  pageId: string;
  author: 'admin' | 'client';
  authorLabel: string;   // display name
  text: string;
  createdAt: number;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const PAGES_KEY    = 'cp_pages';
const CODES_KEY    = 'cp_codes';
const NPUBS_KEY    = 'cp_npubs';
const SESSION_KEY  = 'cp_session';
const DESIGNS_KEY  = 'cp_designs';
const COMMENTS_KEY = 'cp_comments';

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

// ─── Designs ──────────────────────────────────────────────────────────────────

/**
 * One-time migration: drop any legacy designs whose imageUrl is a data-URL
 * (base64). Those were stored before the Blossom upload rewrite and will blow
 * the localStorage quota. Run this on app start — it's a no-op after the first
 * clean run.
 */
export function migrateDesigns(): void {
  const all = load<DesignItem>(DESIGNS_KEY);
  const clean = all.filter(d => !d.imageUrl.startsWith('data:'));
  if (clean.length !== all.length) {
    save(DESIGNS_KEY, clean);
  }
}

export function getDesigns(pageId?: string): DesignItem[] {
  const all = load<DesignItem>(DESIGNS_KEY);
  return pageId ? all.filter(d => d.pageId === pageId) : all;
}

export function saveDesign(design: DesignItem): void {
  const all = load<DesignItem>(DESIGNS_KEY).filter(d => d.id !== design.id);
  save(DESIGNS_KEY, [...all, design]);
}

export function deleteDesign(id: string): void {
  save(DESIGNS_KEY, load<DesignItem>(DESIGNS_KEY).filter(d => d.id !== id));
  // also wipe its comments
  save(COMMENTS_KEY, load<DesignComment>(COMMENTS_KEY).filter(c => c.designId !== id));
}

export function createDesign(data: Omit<DesignItem, 'id' | 'createdAt' | 'updatedAt'>): DesignItem {
  const now = Date.now();
  const design: DesignItem = { ...data, id: uuid(), createdAt: now, updatedAt: now };
  saveDesign(design);
  return design;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function getComments(designId: string): DesignComment[] {
  return load<DesignComment>(COMMENTS_KEY)
    .filter(c => c.designId === designId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function addComment(data: Omit<DesignComment, 'id' | 'createdAt'>): DesignComment {
  const comment: DesignComment = { ...data, id: uuid(), createdAt: Date.now() };
  const all = load<DesignComment>(COMMENTS_KEY);
  save(COMMENTS_KEY, [...all, comment]);
  return comment;
}

export function deleteComment(id: string): void {
  save(COMMENTS_KEY, load<DesignComment>(COMMENTS_KEY).filter(c => c.id !== id));
}

export function getUnreadCommentCount(pageId: string, since: number): number {
  return load<DesignComment>(COMMENTS_KEY)
    .filter(c => c.pageId === pageId && c.author === 'client' && c.createdAt > since)
    .length;
}

// ─── Nostr sync ───────────────────────────────────────────────────────────────
//
// The admin publishes portal config (pages + codes + npubs) as an encrypted
// NIP-44 addressable event (kind 31989) with d-tag "bitpopart-client-portal".
// Any browser that has the admin's pubkey hardcoded can fetch and decrypt it
// to bootstrap the portal data — solving the cross-device localStorage problem.
//
// Encryption: we encrypt the JSON to the *admin's own pubkey* (self-encrypt),
// so only someone with the admin's private key can decrypt it.  On the client
// login page we call signer.nip44.decrypt(adminPubkey, ciphertext) which only
// works if the logged-in user IS the admin.  That's fine — the login page reads
// the ciphertext as the *admin pubkey*, decrypts it, and merges into localStorage
// **before** trying to redeem any code or check npubs.
//
// Simpler alternative (no encryption): publish as plaintext so *any* browser
// can fetch the config without needing the admin signer.  Since codes are
// short-lived and the site is a personal portfolio, this is acceptable.
// We choose PLAINTEXT for maximum compatibility.

/**
 * The Nostr event kind used to store portal config.
 * Kind 31989 is addressable (30000-39999 range).
 * d-tag: "bitpopart-client-portal"
 */
export const PORTAL_CONFIG_KIND = 31989;
export const PORTAL_CONFIG_D_TAG = 'bitpopart-client-portal';

/** Serialise the current localStorage portal config into a JSON string. */
export function exportPortalConfig(): string {
  return JSON.stringify({
    pages: getPages(),
    codes: getCodes(),
    npubs: getNpubs(),
  });
}

/**
 * Import a portal config JSON string into localStorage.
 * Merges by id — existing records are updated, new ones are added.
 * Records absent from the import are left untouched (non-destructive).
 */
export function importPortalConfig(json: string): void {
  try {
    const data = JSON.parse(json) as {
      pages?: ClientPage[];
      codes?: AccessCode[];
      npubs?: NpubEntry[];
    };

    if (Array.isArray(data.pages)) {
      const existing = getPages();
      const map = new Map(existing.map(p => [p.id, p]));
      for (const p of data.pages) map.set(p.id, p);
      save(PAGES_KEY, Array.from(map.values()));
    }

    if (Array.isArray(data.codes)) {
      const existing = getCodes();
      const map = new Map(existing.map(c => [c.id, c]));
      for (const c of data.codes) map.set(c.id, c);
      save(CODES_KEY, Array.from(map.values()));
    }

    if (Array.isArray(data.npubs)) {
      const existing = getNpubs();
      const map = new Map(existing.map(n => [n.id, n]));
      for (const n of data.npubs) map.set(n.id, n);
      save(NPUBS_KEY, Array.from(map.values()));
    }
  } catch {
    // silently ignore malformed data
  }
}

// ─── PR Proposals ─────────────────────────────────────────────────────────────

/**
 * A PR Proposal is tied to a ClientPage (same slug).
 * The content is stored as raw HTML or a public PDF URL.
 * The public-facing URL is /proposal/:slug — no login required.
 */
export interface ProposalContent {
  id: string;
  pageId: string;    // matches a ClientPage.id
  slug: string;      // mirrors ClientPage.slug for the public URL
  title: string;     // proposal title shown on the public page
  type: 'html' | 'pdf-url' | 'iframe-url';
  content: string;   // raw HTML string, PDF URL, or iframe src URL
  updatedAt: number;
}

const PROPOSALS_KEY = 'cp_proposals';

export function getProposals(): ProposalContent[] {
  return load<ProposalContent>(PROPOSALS_KEY);
}

export function getProposalByPageId(pageId: string): ProposalContent | undefined {
  return getProposals().find(p => p.pageId === pageId);
}

export function getProposalBySlug(slug: string): ProposalContent | undefined {
  return getProposals().find(p => p.slug === slug);
}

export function saveProposal(proposal: ProposalContent): void {
  const all = getProposals().filter(p => p.id !== proposal.id);
  save(PROPOSALS_KEY, [...all, proposal]);
}

export function deleteProposal(id: string): void {
  save(PROPOSALS_KEY, getProposals().filter(p => p.id !== id));
}

export function upsertProposal(
  pageId: string,
  slug: string,
  title: string,
  type: ProposalContent['type'],
  content: string,
): ProposalContent {
  const existing = getProposalByPageId(pageId);
  const proposal: ProposalContent = {
    id: existing?.id ?? uuid(),
    pageId,
    slug,
    title,
    type,
    content,
    updatedAt: Date.now(),
  };
  saveProposal(proposal);
  return proposal;
}
