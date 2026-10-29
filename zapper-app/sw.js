// The ZAPPER site: opens offline too. The page and its pictures come from the
// cache at once and are refreshed in the background; the update list always
// tries the network first, so the version shown is the newest one.
const CACHE = 'zapper-app-v9';
const KERN = ['./', 'index.html', 'manifest.webmanifest', 'beeld/logo.svg', 'beeld/lamp-aan.svg', 'beeld/lamp-uit.svg',
  'beeld/icon-192.png', 'beeld/icon-512.png', 'beeld/apple-touch-icon.png', 'beeld/pubkey.txt'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(KERN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(namen => Promise.all(namen.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // USB tooling must be current before it opens a physical device.
  if (url.pathname.includes('/flash/')) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}));
    return;
  }
  // firmware: never from the cache
  if (url.pathname.includes('/firmware/')) return;
  // A corrected manual must be shown immediately, including to returning visitors.
  if (url.pathname.endsWith('.pdf')) {
    e.respondWith(fetch(e.request, {cache: 'no-store'}).then(r => {
      if (r.status === 200 && !e.request.headers.has('Range')) {
        const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k));
      }
      return r;
    }).catch(() => caches.match(e.request)));
    return;
  }
  if (url.pathname.endsWith('manifest.json') || url.pathname.endsWith('manifest.sig')) {
    e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(bewaard => {
    const vers = fetch(e.request).then(r => { if (r.ok) { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)); } return r; })
      .catch(() => bewaard);
    return bewaard || vers;
  }));
});
