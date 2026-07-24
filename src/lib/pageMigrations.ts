/**
 * One-time page data migrations.
 *
 * Each migration is keyed by a unique ID stored in localStorage so it
 * only runs once per browser. Add new migrations at the end of the array.
 */

const MIGRATIONS_KEY = 'bitpopart:page-migrations-applied';
const PAGES_KEY = 'bitpopart:pages';
const PAGE_BODY_PREFIX = 'bitpopart:page-body:';

function getApplied(): Set<string> {
  try {
    const raw = localStorage.getItem(MIGRATIONS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markApplied(id: string): void {
  const applied = getApplied();
  applied.add(id);
  localStorage.setItem(MIGRATIONS_KEY, JSON.stringify([...applied]));
}

function getPages(): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setPages(pages: Record<string, unknown>[]): void {
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
}

// ─── Migrations ───────────────────────────────────────────────────────────────

/** Update the Sneek page to use keychain photos instead of T-shirt design */
function migrateSneekPageToKeychains(): void {
  const id = 'sneek-page-keychains-2026-07';
  const applied = getApplied();
  if (applied.has(id)) return;

  const pages = getPages();
  const idx = pages.findIndex((p) => p.id === 'sneek');
  if (idx === -1) {
    // Page not in localStorage — nothing to update locally.
    // The Nostr relay has the old version; after the admin publishes the
    // updated event the relay will serve the new one.
    markApplied(id);
    return;
  }

  // Update the brand_site URL to the new Blossom HTML with keychain content
  pages[idx] = {
    ...pages[idx],
    brand_site: 'https://blossom.primal.net/65466cc4fd75b6e91ef6de6367b2edfaff5f07c721ca4d6bef0d5074faa9984a.html',
    brand_site_inline: true,
    brand_site_is_srcdoc: false,
  };
  setPages(pages);

  // Also clear any cached body so the admin form re-reads from the updated index
  const bodyKey = `${PAGE_BODY_PREFIX}sneek`;
  const existingBody = localStorage.getItem(bodyKey);
  if (existingBody) {
    // Preserve existing blocks (just empty markdown) — no change needed
  }

  markApplied(id);
}

// ─── Run all migrations ───────────────────────────────────────────────────────

export function runPageMigrations(): void {
  try {
    migrateSneekPageToKeychains();
  } catch (e) {
    // Never crash the app because of a migration
    console.warn('[pageMigrations] Error running migrations:', e);
  }
}
