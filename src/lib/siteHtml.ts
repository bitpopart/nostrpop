/**
 * Fast loading for the pages that show a project's HTML file in an iframe
 * (/frl/:id, /games/:id).
 *
 * Before: page JS -> wait for the relay to return the project event -> only
 * then download the HTML file -> render. Every step waited for the previous
 * one, on every visit.
 *
 * Now:
 *  - The project's file address is remembered per project, so on a repeat
 *    visit the download starts at once, in parallel with the relay lookup.
 *  - The HTML itself is kept in the browser Cache API. A repeat visit shows
 *    the saved copy immediately and refreshes it quietly in the background,
 *    so the next visit has the newest version.
 *  - Cards can call prefetchSiteHtml() on hover so the file is already
 *    downloaded when the visitor clicks.
 */

const CACHE_NAME = 'site-html-v1';
const META_KEY = 'project-meta-v1:';

const memory = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

export interface ProjectMeta {
  brandSiteUrl: string;
  name?: string;
  description?: string;
}

export function readProjectMeta(kind: string, projectId: string): ProjectMeta | undefined {
  try {
    const raw = localStorage.getItem(`${META_KEY}${kind}:${projectId}`);
    return raw ? (JSON.parse(raw) as ProjectMeta) : undefined;
  } catch {
    return undefined;
  }
}

export function writeProjectMeta(kind: string, projectId: string, meta: ProjectMeta) {
  try {
    localStorage.setItem(`${META_KEY}${kind}:${projectId}`, JSON.stringify(meta));
  } catch {
    // storage blocked or full: just skip remembering
  }
}

async function cachedCopy(url: string): Promise<string | null> {
  try {
    if (typeof caches === 'undefined') return null;
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    return hit ? await hit.text() : null;
  } catch {
    return null;
  }
}

async function saveCopy(url: string, html: string) {
  try {
    if (typeof caches === 'undefined') return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, new Response(html, { headers: { 'Content-Type': 'text/html' } }));
  } catch {
    // quota or private mode: fine, the memory copy still works
  }
}

function download(url: string): Promise<string> {
  const running = inflight.get(url);
  if (running) return running;
  const p = fetch(url, { priority: 'high' } as RequestInit)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then((html) => {
      if (html.trim().length === 0) throw new Error('Empty response');
      memory.set(url, html);
      void saveCopy(url, html);
      return html;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

/** Synchronous: a copy already in memory (instant render). */
export function getMemoryHtml(url: string): string | null {
  return memory.get(url) ?? null;
}

/**
 * Get the project HTML as fast as possible: memory, then the saved copy
 * (refreshed in the background), then the network.
 */
export async function loadSiteHtml(url: string): Promise<string> {
  const mem = memory.get(url);
  if (mem) return mem;

  const saved = await cachedCopy(url);
  if (saved) {
    memory.set(url, saved);
    download(url).catch(() => undefined); // quiet refresh for next time
    return saved;
  }
  return download(url);
}

/** Start downloading ahead of a click. Never throws. */
export function prefetchSiteHtml(url?: string | null) {
  if (!url || memory.has(url) || inflight.has(url)) return;
  void loadSiteHtml(url).catch(() => undefined);
}
