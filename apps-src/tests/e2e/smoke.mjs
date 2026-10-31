/* Smoke test for a built app, in the Chromium that Playwright ships.
 *
 *   node tests/e2e/smoke.mjs [app-path] [--shots <dir>]
 *
 * Serves the site folder over http://localhost (service workers need a secure origin), then checks,
 * at phone (360 px) and desktop (1280 px) widths: the app renders with no console errors, the page
 * never scrolls sideways, the fonts load, a worked example gives the published answer, formulas
 * render as MathML, settings persist, and the app reopens offline from its saved copy. */
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const APP = args.find((a) => !a.startsWith('--')) || 'research-app';
const shotsAt = args.indexOf('--shots');
const SHOTS = shotsAt >= 0 ? resolve(args[shotsAt + 1]) : null;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
function serve() {
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
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
}

const { chromium } = createRequire(import.meta.url)('playwright');
const server = await serve();
const base = `http://localhost:${server.address().port}/${APP}/`;
if (SHOTS) await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch();

async function shot(page, name) { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true }); }
const text = (page, sel) => page.locator(sel).first().innerText();
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

try {
  for (const [label, width, height] of [['phone', 360, 780], ['desktop', 1280, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(base);
    await page.waitForSelector('h1');
    check(`${label}: home renders`, (await text(page, 'h1')).includes('published paper'));
    check(`${label}: no sideways scroll on home`, await noSideScroll(page));
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return ['16px "IBM Plex Sans"', '16px "IBM Plex Mono"', '500 32px "Fraunces"', 'italic 500 32px "Fraunces"'].every((f) => document.fonts.check(f));
    });
    check(`${label}: embedded fonts load`, fonts);
    await shot(page, `${label}-home`);

    await page.goto(`${base}#/tool/p-values`);
    await page.waitForSelector('.result .big');
    const big = await text(page, '.result .big');
    check(`${label}: t = 2.10, 18 df gives p = 0.050`, big === 'p = 0.050', big);
    const exact = await text(page, '.result .sub');
    check(`${label}: exact p shown`, /0\.05009/.test(exact), exact);
    check(`${label}: formulas render as MathML`, (await page.locator('math').count()) > 0);
    check(`${label}: no sideways scroll on tool`, await noSideScroll(page));
    await shot(page, `${label}-tool`);

    await page.getByRole('button', { name: 'Critical value', exact: true }).click();
    const crit = await text(page, '.result .big');
    check(`${label}: critical t (18 df, alpha 0.05) is 2.101`, crit.replace('−', '-') === '±2.101', crit);

    await page.getByRole('button', { name: 'Exact counts', exact: true }).click();
    const exactCount = await text(page, '.result .big');
    check(`${label}: binomial P(X >= 4 | n 50, p 0.03) is 0.06276`, exactCount === '0.06276', exactCount);

    await page.goto(`${base}#/learn/p-values`);
    await page.waitForSelector('h1');
    check(`${label}: lesson renders`, (await page.locator('main .prose, main article').count()) > 0);
    check(`${label}: no sideways scroll on lesson`, await noSideScroll(page));

    await page.goto(`${base}#/practice/p-values`);
    await page.waitForSelector('.q .stem');
    await page.getByRole('button', { name: 'Show the answer' }).click();
    check(`${label}: practice shows a worked answer`, (await page.locator('.feedback').count()) === 1);
    check(`${label}: no sideways scroll on practice`, await noSideScroll(page));
    for (const r of ['#/learn', '#/practice', '#/about']) {
      await page.goto(`${base}${r}`);
      await page.waitForSelector('h1');
      check(`${label}: no sideways scroll on ${r}`, await noSideScroll(page));
    }
    await page.goto(`${base}#/practice/p-values`);
    await page.waitForSelector('.q .stem');
    await shot(page, `${label}-practice`);

    // Phase 1: describe the example data, then choose and run a test on it.
    await page.goto(`${base}#/tool/describe`);
    await page.getByRole('button', { name: 'Load example data' }).click();
    await page.waitForSelector('text=Numeric variables');
    check(`${label}: describe summarises the example data`, (await page.locator('.restable table').count()) >= 2);
    check(`${label}: no sideways scroll on describe`, await noSideScroll(page));
    await shot(page, `${label}-describe`);
    await page.goto(`${base}#/tool/tests`);
    await page.waitForSelector('h1');
    for (const name of ['Compare groups or measurements', 'Numeric (a measurement or score)', 'Two', 'Independent groups', 'Yes']) {
      await page.getByRole('button', { name, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Run this test' }).click();
    await page.getByLabel('Outcome (numeric)').selectOption('Hb_registration');
    await page.getByLabel('Groups', { exact: true }).selectOption('Residence');
    const tline = await text(page, '.verdict-line');
    check(`${label}: chooser leads to Welch's t on the example data`, tline.startsWith('t = \u22123.74, df = 56.9'), tline);
    check(`${label}: no sideways scroll on a test result`, await noSideScroll(page));
    await shot(page, `${label}-ttest`);
    await page.getByLabel('Choose a test').selectOption('chi');
    await page.getByRole('button', { name: 'Summary figures' }).click();
    const chiTitle = await text(page, '#res-h');
    check(`${label}: chi-square from typed counts`, chiTitle.startsWith('Chi-square test'), chiTitle);

    // Phase 1b: sample size. 30% prevalence, +/- 5 points, 95%: 323 before the 10% non-response allowance.
    await page.goto(`${base}#/tool/sample-size`);
    await page.waitForSelector('.result .big');
    const ss = await text(page, '.report .say');
    check(`${label}: prevalence sample size is 323 (Lwanga and Lemeshow)`, ss.includes('a sample of 323'), ss.slice(0, 80));
    await page.getByLabel('What will the study do?').selectOption('two-props');
    const ss2 = await text(page, '.report .say');
    check(`${label}: Fleiss with correction gives 151 per group for 35% vs 20%`, ss2.includes('151 in group 1 and 151 in group 2'), ss2.slice(0, 120));
    check(`${label}: no sideways scroll on sample size`, await noSideScroll(page));
    await shot(page, `${label}-samplesize`);

    // Phase 1c: regression and survival on the example data.
    await page.goto(`${base}#/tool/regression`);
    await page.getByLabel('Outcome', { exact: true }).selectOption('Hb_registration');
    await page.getByLabel('Residence', { exact: true }).check();
    const lin = await text(page, '.verdict-line');
    check(`${label}: linear regression runs`, /^R² = 0\.\d{3}, F\(1, 118\)/.test(lin), lin);
    await page.goto(`${base}#/tool/survival`);
    await page.getByRole('button', { name: 'Replace or view' }).click();
    await page.getByRole('button', { name: 'Load example TB cohort' }).click();
    await page.getByLabel('Follow-up time').selectOption('Months');
    await page.getByLabel('Event', { exact: true }).selectOption('Unfavourable_outcome');
    await page.getByLabel('Compare groups (optional)').selectOption('HIV');
    const km = await text(page, '.verdict-line');
    check(`${label}: log-rank test on the TB example`, km.startsWith('Log-rank χ² = 5.93'), km);
    check(`${label}: no sideways scroll on survival`, await noSideScroll(page));
    await shot(page, `${label}-survival`);

    // Phase 1d: agreement and meta-analysis.
    await page.goto(`${base}#/tool/agreement`);
    await page.getByRole('button', { name: 'Replace or view' }).click();
    await page.getByRole('button', { name: 'Load example screening-camp data' }).click();
    await page.getByLabel('First rater').selectOption('Pallor_MO1');
    await page.getByLabel('Second rater').selectOption('Pallor_MO2');
    check(`${label}: Cohen's kappa on the pallor example`, (await text(page, '#kr-h')) === "Cohen's kappa = 0.54", await text(page, '#kr-h'));
    await page.getByRole('button', { name: 'Quadratic', exact: true }).click();
    check(`${label}: quadratic-weighted kappa`, (await text(page, '#kr-h')) === 'Quadratic-weighted kappa = 0.63', await text(page, '#kr-h'));
    await page.getByRole('button', { name: 'Three or more raters' }).click();
    for (const r of ['Pallor MO1', 'Pallor MO2', 'Pallor MO3']) await page.getByLabel(r, { exact: true }).check();
    const fk = await text(page, '#fr-h');
    check(`${label}: Fleiss' kappa with bootstrap CI`, fk === "Fleiss' kappa = 0.49" && /bootstrap CI 0\.\d\d to 0\.\d\d/.test(await text(page, '.verdict-line')), fk);
    await page.getByRole('button', { name: 'ICC', exact: true }).click();
    for (const r of ['MUAC AWW1', 'MUAC AWW2', 'MUAC AWW3']) await page.getByLabel(r, { exact: true }).check();
    check(`${label}: ICC(A,1) for MUAC`, (await text(page, '#icr-h')) === 'ICC(A,1) = 0.88', await text(page, '#icr-h'));
    await page.getByRole('button', { name: 'Bland-Altman', exact: true }).click();
    await page.getByLabel('New method (A)').selectOption('Hb_HemoCue');
    await page.getByLabel('Reference method (B)').selectOption('Hb_lab');
    check(`${label}: Bland-Altman bias for HemoCue`, (await text(page, '#bar-h')) === 'Bias 0.30', await text(page, '#bar-h'));
    check(`${label}: Bland-Altman plot draws`, (await page.locator('svg.plot circle.pt').count()) === 100);
    await page.getByRole('button', { name: "Cronbach's alpha", exact: true }).click();
    for (let j = 1; j <= 6; j++) await page.getByLabel(`Item${j}`, { exact: true }).check();
    check(`${label}: Cronbach's alpha with weak item flagged`, (await text(page, '#car-h')) === "Cronbach's alpha = 0.78" && (await page.locator('.checks li.no').count()) >= 1, await text(page, '#car-h'));
    check(`${label}: no sideways scroll on agreement`, await noSideScroll(page));
    await shot(page, `${label}-agreement`);

    await page.goto(`${base}#/tool/meta-analysis`);
    const ma = await text(page, '#ma-h');
    check(`${label}: random-effects OR on the example studies`, ma === 'Pooled odds ratio 0.63' && (await text(page, '.verdict-line')).startsWith('95% CI 0.47 to 0.84; p = 0.008'), `${ma} | ${await text(page, '.verdict-line')}`);
    check(`${label}: forest plot draws seven studies`, (await page.locator('svg.forest rect.bar').count()) === 7);
    await page.getByRole('button', { name: 'Add subgroups' }).click();
    check(`${label}: subgroup test appears`, (await page.locator('caption', { hasText: 'test for subgroup differences' }).count()) === 1);
    await page.getByRole('button', { name: 'One proportion per study' }).click();
    check(`${label}: pooled proportion on the logit scale`, (await text(page, '#ma-h')) === 'Pooled proportion 43.2%', await text(page, '#ma-h'));
    check(`${label}: no sideways scroll on meta-analysis`, await noSideScroll(page));
    await shot(page, `${label}-meta`);

    await page.goto(`${base}#/`);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    const dark = await page.waitForFunction(() => document.documentElement.getAttribute('data-theme'), null, { timeout: 3000 })
      .then((h) => h.jsonValue()).catch(() => null);
    await page.reload();
    await page.waitForSelector('h1');
    const kept = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    check(`${label}: dark theme applies and persists`, dark === 'dark' && kept === 'dark');
    await shot(page, `${label}-dark`);

    await page.goto(`${base}#/no-such-page`);
    check(`${label}: unknown route shows not found`, (await text(page, 'h1')).includes('not found'));

    check(`${label}: no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await context.close();
  }

  // Offline: open once online so the service worker saves the app, then reopen with no network.
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
  check('offline: app reopens from its saved copy', (await text(page, 'h1')).includes('published paper'));
  await page.goto(`${base}#/tool/p-values`);
  await page.waitForSelector('.result .big');
  check('offline: tools still compute', (await text(page, '.result .big')) === 'p = 0.050');
  await context.close();
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
