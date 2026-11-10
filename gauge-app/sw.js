// สมาร์ทเกจ ZAR Racing — offline support. Network first (so updates arrive right away),
// falls back to the cached copy when there is no internet. Bump VER to drop old caches.
const VER = 'zar-gauge-v34';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './lib/manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));   // best-effort: one missing file must not abort install
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;   // fonts etc. go straight to the network
  // Library files (lib/) + the page: cache-first so the tuning library works with a weak or no connection once visited.
  const isLib = new URL(r.url).pathname.includes('/lib/');
  if (isLib) {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => m || fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put(r, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VER).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
