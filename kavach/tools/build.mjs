#!/usr/bin/env node
/* ============================================================================
   Maa 'o' Shishu Kavach — build script (zero dependencies)
   Joins src/ modules into ONE self-contained kavach/index.html and stamps the
   service-worker cache version. Run from anywhere:  node kavach/tools/build.mjs
   ----------------------------------------------------------------------------
   Order: styles/*.css → core/*.js → data/*.js → modules/*.js → main.js
   Each JS file is wrapped in its own block { } inside one strict IIFE, so
   files never leak locals; they talk to each other only through window.K.
   ============================================================================ */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const list = (dir, ext) => existsSync(dir)
  ? readdirSync(dir).filter(f => f.endsWith(ext) && !f.startsWith('_')).sort().map(f => join(dir, f))
  : [];

const css = list(join(SRC, 'styles'), '.css').map(f => `/* ── ${f.slice(SRC.length + 1)} ── */\n` + readFileSync(f, 'utf8')).join('\n');

const jsFiles = [
  ...list(join(SRC, 'core'), '.js'),
  ...list(join(SRC, 'data'), '.js'),
  ...list(join(SRC, 'modules'), '.js'),
  join(SRC, 'main.js'),
].filter(existsSync);

const js = jsFiles.map(f => {
  const rel = f.slice(SRC.length + 1);
  return `/* ── ${rel} ── */\n{\n${readFileSync(f, 'utf8')}\n}`;
}).join('\n');

const bundleJs = `(function(){'use strict';\n${js}\n})();`;

// quick syntax check before writing (catches a broken module early)
try { new Function(bundleJs); }
catch (e) { console.error('✖ JS syntax error in bundle:', e.message); process.exit(1); }

const hash = createHash('sha256').update(css + bundleJs).digest('hex').slice(0, 10);
const builtAt = new Date().toISOString();

let html = readFileSync(join(SRC, 'index.template.html'), 'utf8');
const icons = existsSync(join(SRC, 'ui', 'icons.svg')) ? readFileSync(join(SRC, 'ui', 'icons.svg'), 'utf8') : '';
html = html
  .replace('/*{{CSS}}*/', () => css)
  .replace('<!--{{ICONS}}-->', () => icons)
  .replace('/*{{JS}}*/', () => bundleJs)
  .replaceAll('{{BUILD}}', hash)
  .replaceAll('{{BUILT_AT}}', builtAt);

writeFileSync(join(ROOT, 'index.html'), html);

// service worker: stamp version so every build busts the cache
const swTpl = join(SRC, 'sw.template.js');
if (existsSync(swTpl)) {
  writeFileSync(join(ROOT, 'sw.js'), readFileSync(swTpl, 'utf8').replaceAll('{{BUILD}}', hash));
}

const kb = n => (n / 1024).toFixed(1) + ' KB';
console.log(`✔ kavach/index.html  ${kb(Buffer.byteLength(html))}  (css ${kb(Buffer.byteLength(css))}, js ${kb(Buffer.byteLength(bundleJs))})  build ${hash}`);
console.log(`  ${jsFiles.length} JS files, ${list(join(SRC, 'styles'), '.css').length} CSS files`);
