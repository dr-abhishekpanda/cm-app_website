/* Clinic Assistant service worker: keeps a copy of the app and its notes so they open without internet.
 * Pages and the notes file come from the network first, so changes reach users as soon as they are
 * online; when the network fails, or hangs for SLOW_MS (a 2G connection that barely works), the
 * saved copy is used. AI answers (/api/) always need the network and are never cached.
 * Change VERSION when the app's code changes; the notes update by themselves.
 * Saved responses are never redirects (Safari refuses a redirected response for a page load). */
const VERSION = '1.0.0';
const CACHE = 'clinic-assistant-' + VERSION;
const ROOT = new URL('./', self.location).href;
const KB = new URL('./kb/clinic-kb.md', self.location).href;
const SLOW_MS = 4000;
const ASSETS = [
  './', './manifest.webmanifest', './assistant.css', './privacy/',
  './lib/kb-core.js', './lib/markdown.js', './lib/guard.js', './kb/clinic-kb.md',
  './fonts/fonts.css', './fonts/fraunces-latin-opsz-normal.woff2',
  './fonts/ibm-plex-sans-latin-400-normal.woff2', './fonts/ibm-plex-sans-latin-500-normal.woff2', './fonts/ibm-plex-sans-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-400-normal.woff2', './fonts/ibm-plex-mono-latin-500-normal.woff2',
  './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
  '/brand/ews.css',
];

function plain(res) {
  if (!res.redirected) return Promise.resolve(res);
  return res.blob().then((body) => new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }));
}

function save(key, res) {
  if (!res || !res.ok) return Promise.resolve();
  const copy = res.clone(); // taken at once, before the page starts reading the body
  // Skip if a newer version has already replaced this cache, rather than re-creating it.
  return caches.has(CACHE).then((has) => has && plain(copy).then((c) => caches.open(CACHE).then((cache) => cache.put(key, c))));
}

/* Network first; after SLOW_MS (or on failure) answer from the cache, while the network copy still
 * refreshes the cache in the background. */
function networkFirst(e, req, key, fallbackKey) {
  const network = fetch(req);
  e.waitUntil(network.then((res) => save(key, res)).catch(() => {}));
  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
    const saved = () => caches.open(CACHE).then((c) => c.match(key, { ignoreSearch: true })
      .then((hit) => hit || (fallbackKey ? c.match(fallbackKey) : undefined)));
    const timer = setTimeout(() => saved().then(finish), SLOW_MS);
    network.then((res) => {
      if (res.status >= 500) return saved().then((hit) => { clearTimeout(timer); finish(hit || res); });
      clearTimeout(timer);
      finish(res);
    }, () => saved().then((hit) => { clearTimeout(timer); finish(hit || Response.error()); }));
  });
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => Promise.all(ASSETS.map((a) =>
    fetch(new Request(a, { cache: 'reload' })).then((res) => {
      if (!res.ok) throw new Error('Could not save ' + a + ' (' + res.status + ')');
      return plain(res).then((copy) => cache.put(new URL(a, self.location).href, copy));
    })
  ))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  // Remove older copies of this app only; other tools on the same domain keep their caches.
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.indexOf('clinic-assistant-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    const isRoot = url.pathname === new URL(ROOT).pathname || url.pathname === new URL(ROOT).pathname + 'index.html';
    const key = isRoot ? ROOT : url.origin + url.pathname;
    e.respondWith(networkFirst(e, req, key, ROOT));
    return;
  }
  if (url.origin + url.pathname === KB) {
    e.respondWith(networkFirst(e, req, KB));
    return;
  }
  e.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true })).then((hit) => hit || fetch(req)));
});
