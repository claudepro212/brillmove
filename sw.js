/* BrillMove service worker.
   - Engine, pieces and libraries: cache-first (they never change for a given file name).
   - Pages, scripts and styles: network-first, falling back to the cache when offline,
     so updates show up right away.
   - Chess.com API and other sites: always straight from the network. */
const CACHE = 'brillmove-v1';
const PRECACHE = ['engine/stockfish.js', 'engine/stockfish.wasm', 'vendor/chess.min.js', 'icons/icon-192.png',
  ...['w', 'b'].flatMap(c => ['K', 'Q', 'R', 'B', 'N', 'P'].map(p => `pieces/cburnett/${c}${p}.svg`))];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const path = url.pathname;
  if (/\/(engine|pieces|vendor|icons)\//.test(path)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('./'))));
});
