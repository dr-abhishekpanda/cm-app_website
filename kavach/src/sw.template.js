/* Maa 'o' Shishu Kavach — service worker (build {{BUILD}})
   App shell: cache first, refreshed in the background, so the app opens with
   no network. Google Fonts: cached on first use. Card data never passes
   through here — it lives in IndexedDB on the phone. */
const VERSION = 'kavach-{{BUILD}}';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/favicon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
const FONTS = 'kavach-fonts-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kavach-') && k !== VERSION && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (!url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;
    // navigations and the shell: answer from cache, refresh in the background
    const isNav = req.mode === 'navigate';
    e.respondWith(caches.open(VERSION).then(async cache => {
      const key = isNav ? './index.html' : req;
      const hit = await cache.match(key, { ignoreSearch: true });
      const net = fetch(req).then(res => { if (res && res.ok && (isNav || SHELL.some(s => url.pathname.endsWith(s.replace('./', '/')))) ) cache.put(key, res.clone()); return res; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return (await net) || (isNav ? cache.match('./index.html') : Response.error());
    }));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; } catch (err) { return Response.error(); }
    }));
  }
});
self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });
