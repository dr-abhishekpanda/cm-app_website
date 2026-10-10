/* IMNCI Case Assistant service worker: keeps a copy of the app so it opens without internet.
 * Pages come from the network first, so an update reaches users as soon as they are online. When the
 * network fails, or hangs for more than SLOW_MS (a 2G connection that barely works), the saved copy
 * is shown and the update finishes in the background.
 * Saved responses are never redirects: Cloudflare Pages answers /imnci/index.html with a 308 to
 * /imnci/, and Safari refuses a redirected response for a page load. */
const CACHE = 'imnci-ca-1.1';
const ROOT = new URL('./', self.location).href;
const ASSETS = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const SLOW_MS = 4000;

// A copy of the response without the redirect flag, so it can answer any request.
function plain(res) {
  if (!res.redirected) return Promise.resolve(res);
  return res.blob().then((body) => new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers }));
}
function isAppPage(url) {
  const root = new URL(ROOT).pathname;
  return url.pathname === root || url.pathname === root + 'index.html';
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
    .then((keys) => Promise.all(keys.filter((k) => k.indexOf('imnci-ca-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    const network = fetch(req);
    // Keep the newest copy of the app page (registered first, so the copy is taken before the page reads it).
    e.waitUntil(network.then((res) => {
      if (res.ok && isAppPage(url) && /text\/html/.test(res.headers.get('content-type') || '')) {
        const copy = res.clone();
        // Skip if a newer version has already replaced this cache, rather than re-creating it.
        return caches.has(CACHE).then((has) => has && plain(copy).then((c) => caches.open(CACHE).then((cache) => cache.put(ROOT, c))));
      }
    }).catch(() => {}));
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
      const saved = () => caches.open(CACHE).then((c) => c.match(ROOT));
      const timer = setTimeout(() => saved().then(finish), SLOW_MS);
      network.then((res) => {
        if (res.status >= 500) return saved().then((hit) => { clearTimeout(timer); finish(hit || res); });
        clearTimeout(timer);
        finish(res);
      }, () => saved().then((hit) => { clearTimeout(timer); finish(hit || Response.error()); }));
    }));
    return;
  }

  e.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true })).then((hit) => hit || fetch(req)));
});
