/* Build every app (or the ones named) into a single offline HTML file plus service worker,
 * manifest and icons, written to the site folder (e.g. ../research-app/).
 *
 *   node tools/build.mjs                 build all apps listed in APPS
 *   node tools/build.mjs research-app    build one
 *
 * Nothing here runs on the host: the output is committed and Cloudflare serves it as plain files.
 */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import temml from 'temml';
import { fontCss } from './fonts.mjs';
import { renderIcons } from './icons.mjs';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(SRC, '..');
const APPS = ['research-app'];

/* --------------------------------------------- tex`...` -> MathML at build */
const texPlugin = {
  name: 'tex-to-mathml',
  setup(b) {
    b.onLoad({ filter: /\.(jsx|js)$/ }, async (args) => {
      if (args.path.includes('node_modules')) return undefined;
      const loader = args.path.endsWith('.jsx') ? 'jsx' : 'js';
      let src = await readFile(args.path, 'utf8');
      if (!/\btexd?`/.test(src)) return { contents: src, loader };
      let count = 0;
      src = src.replace(/\b(texd?)`((?:[^`\\]|\\[\s\S])*)`/g, (_, tag, body) => {
        count++;
        try {
          return JSON.stringify(temml.renderToString(body, { displayMode: tag === 'texd', throwOnError: true }));
        } catch (e) {
          throw new Error(`TeX error in ${args.path}: ${e.message}\n  ${body}`);
        }
      });
      return { contents: src, loader, watchFiles: [args.path], pluginData: { count } };
    });
  },
};

function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
}

async function mathCss() {
  // Temml's companion stylesheet without its script font (only \mathscr needs it).
  const css = await readFile(join(SRC, 'node_modules/temml/dist/Temml-Local.css'), 'utf8');
  return css.replace(/@font-face\s*{[^}]*}/g, '');
}

function swSource({ prefix, id, assets }) {
  return `/* ${prefix} service worker (build ${id}). Pages come from the network first, so updates reach
 * users as soon as they are online; when the network fails or hangs for SLOW_MS, the saved copy opens.
 * Saved responses are never redirects (Safari refuses a redirected response for a page load). */
const CACHE = '${prefix}-${id}';
const ROOT = new URL('./', self.location).href;
const ASSETS = ${JSON.stringify(assets)};
const SLOW_MS = 4000;
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
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.indexOf('${prefix}-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    const network = fetch(req);
    e.waitUntil(network.then((res) => {
      if (res.ok && isAppPage(url) && /text\\/html/.test(res.headers.get('content-type') || '')) {
        const copy = res.clone();
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
`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function buildApp(name) {
  const dir = join(SRC, 'apps', name);
  const config = (await import(pathToFileURL(join(dir, 'app.config.js')).href)).default;
  const out = join(SITE, config.path);
  await mkdir(out, { recursive: true });

  const res = await build({
    entryPoints: [join(dir, 'main.jsx')],
    bundle: true, minify: true, format: 'iife', target: ['es2020', 'chrome87', 'firefox78', 'safari15'],
    jsx: 'automatic', jsxImportSource: 'preact', charset: 'utf8',
    write: false, legalComments: 'none', plugins: [texPlugin], logLevel: 'warning',
  });
  const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

  const css = minifyCss([
    await readFile(join(SITE, 'brand/ews.css'), 'utf8'),
    await fontCss(SRC),
    await mathCss(),
    await readFile(join(SRC, 'ui/css/app.css'), 'utf8'),
  ].join('\n'));

  const id = createHash('sha256').update(js).update(css).digest('hex').slice(0, 10);
  const date = new Date().toISOString().slice(0, 10);
  const themeBoot = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(`${config.id}:settings`)})||'{}');if(s.theme&&s.theme!=='system')document.documentElement.setAttribute('data-theme',s.theme)}catch(e){}`;
  const html = `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(config.name)} · ${esc(config.title)}</title>
<meta name="description" content="${esc(config.description)}">
<meta name="author" content="Dr Abhishek Panda">
<meta name="theme-color" content="#0C5E4E">
<meta name="color-scheme" content="light dark">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<script>${themeBoot}</script>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:24px;font-family:sans-serif">${esc(config.name)} needs JavaScript to run. Please turn it on, or open this page in Chrome, Edge, Firefox or Safari.</p></noscript>
<script>window.__BUILD__=${JSON.stringify({ id, date, app: config.path, version: config.version })};</script>
<script>${js}</script>
</body>
</html>
`;
  await writeFile(join(out, 'index.html'), html);

  const icons = await renderIcons(join(dir, 'icon.svg'), out);
  const manifest = {
    name: `${config.name} · ${config.title}`,
    short_name: config.shortName,
    description: config.description,
    lang: 'en-IN', start_url: './', scope: './', display: 'standalone',
    background_color: '#F4F5F1', theme_color: '#0C5E4E',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  await writeFile(join(out, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
  const assets = ['./', './manifest.webmanifest', './icon.svg', ...icons.map((f) => `./${f}`)];
  await writeFile(join(out, 'sw.js'), swSource({ prefix: config.path, id, assets }));

  await ensureHeaders(config.path);
  const size = (await stat(join(out, 'index.html'))).size;
  console.log(`${config.path}: index.html ${(size / 1024).toFixed(0)} KB (js ${(js.length / 1024).toFixed(0)} KB, css ${(css.length / 1024).toFixed(0)} KB), build ${id}`);
  return { id, size };
}

async function ensureHeaders(path) {
  // Browsers re-check the app files on every visit, so an update reaches users on their next online visit.
  const file = join(SITE, '_headers');
  let text = await readFile(file, 'utf8');
  if (text.includes(`/${path}/*`)) return;
  text = text.replace(/\s*$/, '\n') + `/${path}/*\n  Cache-Control: no-cache\n`;
  await writeFile(file, text);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : APPS;
for (const n of names) await buildApp(n);
