/* BitPopArt Fan App — service worker
 * Hand-rolled (no PWA plugin) so the existing build pipeline is unchanged.
 *
 * Strategy:
 *  - Precaches the static app shell so the app opens offline after first visit.
 *  - Navigations: network-first, falling back to the cached shell when offline.
 *  - Same-origin GET assets: runtime cache-first (hashed filenames are immutable).
 *
 * Note on GitHub Pages: /app is served via 404.html (soft-404), so we never
 * precache navigation URLs (their response is NOT ok and addAll would abort).
 * We precache only static files that return HTTP 200.
 */
const VERSION = 'v1';
const CACHE = 'bitpopart-fanapp-' + VERSION;
const SHELL = [
  '/index.html',
  '/404.html',
  '/manifest.webmanifest',
  '/app-icon-192.png',
  '/app-icon-512.png',
  '/app-icon-1024.png',
  '/App_icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only own-origin requests are intercepted.
  if (url.origin !== self.location.origin) return;

  // Navigations (any route, incl. the /app PWA view): network-first.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache whatever we got for /app (200 or GitHub Pages' 404 shell) as
          // the offline fallback document.
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html').then((shell) => shell || caches.match('/404.html')))
    );
    return;
  }

  // Static assets: cache-first, network fallback + runtime fill.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok || res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
