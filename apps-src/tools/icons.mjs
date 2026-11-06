/* Render an app's icon.svg to the PNGs a manifest and iOS need, with the browser Playwright ships.
 *   icon-192.png, icon-512.png   the tile as drawn (rounded corners, transparent outside)
 *   icon-maskable-512.png        full-bleed tile, artwork scaled into the central safe zone
 *   apple-touch-icon.png (180)   full-bleed tile; iOS rounds the corners itself
 * The SVG must be self-contained (text already outlined, see outline_icon.py). */
import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// Playwright is not a dependency of this folder (it brings its own browser); use the copy installed
// on the machine. Without it the build keeps the PNGs already in the output folder.
function loadChromium() {
  try { return createRequire(import.meta.url)('playwright').chromium; } catch { return null; }
}

function variants(svg) {
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const bg = inner.match(/<rect[^>]*\/>/);
  if (!bg) throw new Error('icon.svg needs a <rect> background as its first shape');
  const fill = (bg[0].match(/fill="([^"]+)"/) || [])[1] || '#0C5E4E';
  const art = inner.replace(bg[0], '');
  const bleed = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${fill}"/>`
    + `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${art}</g></svg>`;
  return [
    ['icon-192.png', 192, svg],
    ['icon-512.png', 512, svg],
    ['icon-maskable-512.png', 512, bleed(0.8)],
    ['apple-touch-icon.png', 180, bleed(0.92)],
  ];
}

export async function renderIcons(svgPath, outDir) {
  const svg = await readFile(svgPath, 'utf8');
  if (/<text[\s>]/.test(svg)) throw new Error(`${svgPath} still has <text>; outline it with tools/outline_icon.py`);
  await writeFile(join(outDir, 'icon.svg'), svg);
  const list = variants(svg);
  const chromium = loadChromium();
  if (!chromium) {
    for (const [name] of list) await access(join(outDir, name));
    console.warn('Playwright not found: kept the existing PNG icons.');
    return list.map(([name]) => name);
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    const files = [];
    for (const [name, size, source] of list) {
      await page.setViewportSize({ width: size, height: size });
      const sized = source.replace('<svg ', `<svg width="${size}" height="${size}" `);
      await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${sized}</body></html>`);
      await page.screenshot({ path: join(outDir, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
      files.push(name);
    }
    return files;
  } finally {
    await browser.close();
  }
}
