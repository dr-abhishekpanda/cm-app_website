/* Smoke test for #EPI-APP, run by smoke.mjs:   npm run e2e -- epi-app [--shots <dir>]
 * At phone (360 px) and desktop (1280 px) widths: the home page, the outbreak tools on the example
 * wedding-lunch outbreak and on typed counts, a shared tool and the design chooser, no sideways
 * scroll, tables that fit, the dark theme, and the app reopening offline. */
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const shotsAt = args.indexOf('--shots');
const SHOTS = shotsAt >= 0 ? resolve(args[shotsAt + 1]) : null;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = join(SITE, path);
    if (!file.startsWith(SITE)) throw new Error('outside');
    if ((await stat(file)).isDirectory()) { res.writeHead(301, { Location: path + '/' }); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://localhost:${server.address().port}/epi-app/`;
if (SHOTS) await mkdir(SHOTS, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => { results.push({ pass: !!pass }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`); };
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `epi-${name}.png`), fullPage: true }); };
const text = (page, sel) => page.locator(sel).first().innerText();
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const tablesFit = (page) => page.evaluate(() => [...document.querySelectorAll('.result-panel .tablewrap')].every((w) => w.scrollWidth <= w.clientWidth + 1));

try {
  for (const [label, width, height] of [['phone', 360, 780], ['desktop', 1280, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(base);
    await page.waitForSelector('h1');
    check(`${label}: home renders`, (await text(page, 'h1')).includes('public health action'));
    check(`${label}: the outbreak tool is listed`, (await page.getByRole('link', { name: /Outbreak Investigation/ }).count()) === 1);
    check(`${label}: no sideways scroll on home`, await noSideScroll(page));
    await shot(page, `${label}-home`);

    await page.goto(`${base}#/tool/outbreak`);
    await page.waitForSelector('#ec-h');
    check(`${label}: typed counts by date give a daily curve`, (await text(page, '#ec-h')) === '44 cases over 9.0 days' && (await text(page, '.verdict-line')) === 'Peak 9 Aug (11 cases); 1-day intervals', `${await text(page, '#ec-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('button', { name: 'Load example outbreak (wedding lunch)' }).click();
    await page.waitForFunction(() => document.querySelector('#ec-h')?.textContent === '74 cases over 18 hours');
    check(`${label}: the wedding lunch gives a 3-hour curve`, (await text(page, '.verdict-line')) === 'Peak 14 Mar 21:00 to 00:00 (23 cases); 3-hour intervals', await text(page, '.verdict-line'));
    check(`${label}: the curve is drawn`, (await page.locator('svg.epicurve rect.bar.epi').count()) === 7);
    await page.getByRole('button', { name: 'Incubation period of the suspected agent' }).click();
    await page.getByLabel('Minimum, hours').fill('4');
    await page.getByLabel('Average, hours').fill('11');
    await page.getByLabel('Maximum, hours').fill('23');
    await page.waitForSelector('svg.epicurve rect.band');
    check(`${label}: probable period of exposure`, (await page.locator('.result-panel .stats').first().innerText()).includes('14 Mar 11:30 to 14 Mar 13:45'));
    check(`${label}: no sideways scroll on the curve`, await noSideScroll(page));
    check(`${label}: curve tables fit their width`, await tablesFit(page));
    await shot(page, `${label}-curve`);
    await page.getByRole('button', { name: 'R and Python code for this analysis' }).click();
    check(`${label}: curve R code reads day-first dates`, (await page.locator('pre.code').textContent()).includes('format = "%d/%m/%Y"'));

    await page.getByRole('button', { name: 'Attack rates', exact: true }).click();
    await page.getByLabel('Attack rate by').selectOption('Age_group');
    check(`${label}: attack rate by age group`, (await text(page, '#arr-h')) === 'Attack rate 40.9%' && (await text(page, '.verdict-line')) === '95% CI 34.1% to 48.0% (Wilson); 76 of 186', `${await text(page, '#arr-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: attack-rate tables fit their width`, await tablesFit(page));
    await shot(page, `${label}-attack`);

    await page.getByRole('button', { name: 'Food-specific', exact: true }).click();
    check(`${label}: mutton curry stands out`, (await text(page, '#fr-h')) === 'Highest risk ratio: Mutton curry' && (await text(page, '.verdict-line')) === 'RR 6.12 (95% CI 2.81 to 13.3, Katz); eaten by 92% of cases', `${await text(page, '#fr-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: no sideways scroll on the food table`, await noSideScroll(page));
    check(`${label}: food tables fit their width`, await tablesFit(page));
    await shot(page, `${label}-food`);

    await page.getByRole('button', { name: 'Incubation period', exact: true }).click();
    check(`${label}: incubation period from the lunch`, (await text(page, '#inc-h')) === 'Median incubation 10.6 hours' && (await text(page, '.verdict-line')) === 'IQR 8.6 to 14.5; range 4.8 to 22.8 hours (n = 74)', `${await text(page, '#inc-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: incubation tables fit their width`, await tablesFit(page));
    await shot(page, `${label}-incubation`);

    await page.goto(`${base}#/tool/design-chooser?tab=plan&goal=vaccine&vdata=tested`);
    await page.waitForSelector('#dc-h');
    check(`${label}: the design chooser opens from a link`, (await text(page, '#dc-h')) === 'Test-negative design');
    await page.goto(`${base}#/tool/measures?tab=two&design=cross`);
    await page.waitForSelector('h1');
    check(`${label}: a shared tool opens with its preset`, (await page.getByRole('button', { name: 'Cross-sectional', exact: true }).getAttribute('aria-pressed')) === 'true');

    await page.goto(`${base}#/`);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.reload();
    await page.waitForSelector('h1');
    check(`${label}: dark theme persists`, (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark');
    check(`${label}: no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await context.newPage();
  await page.goto(base);
  await page.waitForSelector('h1');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('h1', { timeout: 10000 });
  check('offline: app reopens from its saved copy', (await text(page, 'h1')).includes('public health action'));
  await page.goto(`${base}#/tool/outbreak`);
  await page.waitForSelector('#ec-h');
  check('offline: tools still compute', (await text(page, '#ec-h')) === '44 cases over 9.0 days');
  await context.close();
} finally {
  await browser.close();
  server.close();
}
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
