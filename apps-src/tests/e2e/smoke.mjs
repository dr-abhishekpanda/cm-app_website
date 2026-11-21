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
    // Phase 1f: code export.
    await page.getByRole('button', { name: 'R and Python code for this analysis' }).click();
    const rCode = await page.locator('pre.code').textContent();
    check(`${label}: R code for Welch's t`, rCode.includes('t.test(a, b, var.equal = FALSE)') && rCode.includes('read.csv("research-app-data.csv"'), rCode.slice(0, 80));
    await page.getByRole('button', { name: 'Python', exact: true }).click();
    const pyCode = await page.locator('pre.code').textContent();
    check(`${label}: Python code for Welch's t`, pyCode.includes('stats.ttest_ind(a, b, equal_var=False)'), pyCode.slice(0, 80));
    check(`${label}: no sideways scroll with code open`, await noSideScroll(page));
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
    await page.locator('.report').first().getByRole('button', { name: 'Add to my results' }).click();
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
    await page.getByRole('button', { name: 'Mantel-Haenszel', exact: true }).click();
    check(`${label}: Mantel-Haenszel pooling of the example studies`, (await text(page, '#ma-h')) === 'Pooled odds ratio 0.62' && (await text(page, '.verdict-line')) === '95% CI 0.49 to 0.79; p < 0.001; Mantel-Haenszel, fixed effect', `${await text(page, '#ma-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('button', { name: 'Peto (odds ratio)', exact: true }).click();
    check(`${label}: Peto pooling`, (await text(page, '#ma-h')) === 'Pooled odds ratio 0.63' && (await text(page, '.verdict-line')).endsWith('Peto, fixed effect'), await text(page, '.verdict-line'));
    await page.getByRole('button', { name: 'Inverse variance', exact: true }).click();
    await page.getByRole('button', { name: 'One proportion per study' }).click();
    check(`${label}: pooled proportion on the logit scale`, (await text(page, '#ma-h')) === 'Pooled proportion 43.2%', await text(page, '#ma-h'));
    check(`${label}: no sideways scroll on meta-analysis`, await noSideScroll(page));
    await page.getByRole('button', { name: 'R and Python code for this analysis' }).click();
    check(`${label}: meta-analysis R code uses metafor`, (await page.locator('pre.code').textContent()).includes('library(metafor)'));
    await shot(page, `${label}-meta`);
    await page.locator('.restable').first().getByRole('button', { name: 'Add to my results' }).click();

    // Phase 1e: Table 1 and My results.
    await page.goto(`${base}#/tool/results-text`);
    await page.getByRole('button', { name: 'Replace or view' }).click();
    await page.getByRole('button', { name: 'Load example data', exact: true }).click();
    await page.getByLabel('Columns by group (optional)').selectOption('Residence');
    for (const v of ['Age', 'Hb registration', 'Trimester', 'Anaemia registration']) await page.getByLabel(v, { exact: true }).check();
    const head = await page.locator('.restable thead').first().textContent();
    check(`${label}: Table 1 by residence`, /Rural \(n = \d+\)/.test(head) && /Urban \(n = \d+\)/.test(head), head.replace(/\s+/g, ' '));
    check(`${label}: Table 1 paragraph`, (await text(page, '.report .say')).startsWith('The analysis included 120 participants'), (await text(page, '.report .say')).slice(0, 60));
    check(`${label}: trimester summarised as categories`, (await page.locator('.restable tbody th', { hasText: 'Trimester' }).count()) === 1);
    check(`${label}: no sideways scroll on Table 1`, await noSideScroll(page));
    await shot(page, `${label}-table1`);
    await page.getByRole('button', { name: /^My results \(2\)$/ }).click();
    check(`${label}: My results gathers a sentence and a table`, (await page.locator('.nbitem').count()) === 2 && (await page.locator('.nbitem textarea').count()) === 1);
    check(`${label}: no sideways scroll on My results`, await noSideScroll(page));

    // Phase 2a: frequency, association and impact (the antenatal example is still loaded).
    await page.goto(`${base}#/tool/measures`);
    await page.getByRole('button', { name: 'A table of counts' }).click();
    check(`${label}: cohort 2 x 2 gives RR 2.00 (Wald)`, (await text(page, '#ttr-h')) === 'Risk ratio = 2.00' && (await text(page, '.verdict-line')).startsWith('95% CI 1.26 to 3.17 (Wald); χ² with Yates\' correction, p = 0.003'), `${await text(page, '#ttr-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: NNH from an exact risk difference of 0.2 is 5`, (await page.locator('.restable', { hasText: 'Measures of impact' }).textContent()).includes('5.0, round up to 5'));
    check(`${label}: no sideways scroll on the 2 x 2 result`, await noSideScroll(page));
    await shot(page, `${label}-measures-cohort`);
    await page.getByRole('button', { name: 'Case-control', exact: true }).click();
    check(`${label}: case-control gives the OR only`, (await text(page, '#ttr-h')) === 'Odds ratio = 3.27' && (await page.locator('.restable', { hasText: 'Risk ratio' }).count()) === 0, await text(page, '#ttr-h'));
    await page.getByRole('button', { name: 'Cohort or trial', exact: true }).click();
    await page.getByRole('button', { name: 'Columns from your data' }).click();
    await page.getByLabel('Exposure column').selectOption('IFA_adherence');
    await page.getByLabel('Outcome column').selectOption('Anaemia_6_months');
    check(`${label}: RR from the example data`, (await text(page, '#ttr-h')) === 'Risk ratio = 1.64' && (await text(page, '.verdict-line')).startsWith('95% CI 1.20 to 2.26 (Wald)'), `${await text(page, '#ttr-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('button', { name: 'R and Python code for this analysis' }).click();
    check(`${label}: 2 x 2 R code has Koopman's interval`, (await page.locator('pre.code').textContent()).includes('koopman <- function(l)'));
    await page.getByRole('button', { name: 'Person-time', exact: true }).click();
    await page.getByRole('button', { name: 'Events and person-time' }).click();
    check(`${label}: rate ratio, exact CI`, (await text(page, '#ptr-h')) === 'Rate ratio = 1.86' && (await text(page, '.verdict-line')).startsWith('95% CI 1.01 to 3.61 (exact'), `${await text(page, '#ptr-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: no sideways scroll on person-time`, await noSideScroll(page));
    await page.getByRole('button', { name: 'Matched pairs', exact: true }).click();
    check(`${label}: matched odds ratio from discordant pairs`, (await text(page, '#mpr-h')) === 'Matched odds ratio = 3.00' && (await text(page, '.verdict-line')).startsWith('95% CI 1.43 to 6.88'), await text(page, '.verdict-line'));
    await page.getByRole('button', { name: 'Population impact', exact: true }).click();
    check(`${label}: Levin's PAF for RR 2 with 30% exposed`, (await text(page, '#imr-h')) === 'Population attributable fraction = 23.1%', await text(page, '#imr-h'));
    check(`${label}: no sideways scroll on population impact`, await noSideScroll(page));
    await page.getByRole('button', { name: 'Proportion or rate', exact: true }).click();
    await page.getByRole('button', { name: 'Type the numbers' }).click();
    check(`${label}: prevalence with the Wilson CI`, (await text(page, '#fqr-h')) === 'Prevalence = 14.2%' && (await text(page, '.verdict-line')) === '95% CI 9.0% to 21.5% (Wilson)', `${await text(page, '#fqr-h')} | ${await text(page, '.verdict-line')}`);
    await shot(page, `${label}-measures-frequency`);

    // Phase 2b: confounding and standardisation (the antenatal example is still loaded).
    const tablesFit = () => page.evaluate(() => [...document.querySelectorAll('.result-panel .tablewrap')].every((w) => w.scrollWidth <= w.clientWidth + 1));
    await page.goto(`${base}#/tool/stratified`);
    await page.getByLabel('Exposure column').selectOption('IFA_adherence');
    await page.getByLabel('Outcome column').selectOption('Anaemia_6_months');
    await page.getByLabel('Stratify by (possible confounder)').selectOption('Parity');
    check(`${label}: MH risk ratio stratified by parity`, (await text(page, '#str-h')) === 'Mantel-Haenszel risk ratio = 1.63' && (await text(page, '.verdict-line')).startsWith('95% CI 1.18 to 2.25; crude 1.64; CMH test p = 0.005'), `${await text(page, '#str-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: forest plot draws the four parity strata`, (await page.locator('svg.forest rect.bar').count()) === 4);
    await page.getByRole('button', { name: 'R and Python code for this analysis' }).click();
    check(`${label}: stratified R code uses mantelhaen.test`, (await page.locator('pre.code').textContent()).includes('mantelhaen.test('));
    await page.getByRole('button', { name: 'A table of strata' }).click();
    await page.getByRole('button', { name: 'Case-control', exact: true }).click();
    check(`${label}: MH odds ratio from typed strata`, (await text(page, '#str-h')) === 'Mantel-Haenszel odds ratio = 2.57' && (await text(page, '.verdict-line')).startsWith('95% CI 1.58 to 4.16; crude 2.59; CMH test p < 0.001'), `${await text(page, '#str-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: no sideways scroll on the stratified result`, await noSideScroll(page));
    check(`${label}: stratified result tables fit their width`, await tablesFit());
    await shot(page, `${label}-stratified`);
    await page.getByRole('button', { name: 'Person-time', exact: true }).click();
    check(`${label}: MH rate ratio`, (await text(page, '#str-h')) === 'Mantel-Haenszel rate ratio = 1.93' && (await text(page, '.verdict-line')).startsWith('95% CI 1.37 to 2.72; crude 1.99; MH test p < 0.001'), `${await text(page, '#str-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('button', { name: 'Direct standardisation', exact: true }).click();
    check(`${label}: directly standardised rate`, (await text(page, '#dsr-h')) === 'Standardised rate = 251 per 1,00,000' && (await text(page, '.verdict-line')).startsWith('95% CI 225 to 279 (Fay-Feuer gamma); crude 197'), `${await text(page, '#dsr-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('button', { name: 'Compare two groups' }).click();
    check(`${label}: ratio of standardised rates`, (await text(page, '#dsr-h')) === 'Ratio of standardised rates = 1.01' && (await text(page, '.verdict-line')).startsWith('95% CI 0.87 to 1.17 (log scale)'), `${await text(page, '#dsr-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: no sideways scroll on direct standardisation`, await noSideScroll(page));
    check(`${label}: standardisation tables fit their width`, await tablesFit());
    await shot(page, `${label}-dsr`);
    await page.getByRole('button', { name: 'Indirect (SMR)', exact: true }).click();
    check(`${label}: SMR with the exact CI`, (await text(page, '#isr-h')) === 'SMR = 1.11 (111)' && (await text(page, '.verdict-line')).startsWith('95% CI 1.00 to 1.23 (exact Poisson); exact p = 0.049; observed 380, expected 342.9'), `${await text(page, '#isr-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: no sideways scroll on the SMR`, await noSideScroll(page));
    check(`${label}: SMR tables fit their width`, await tablesFit());
    await shot(page, `${label}-smr`);

    // Phase 2c: diagnostic accuracy and ROC, on the screening-camp example (laboratory Hb below 11 g/dL as the reference).
    await page.goto(`${base}#/tool/diagnostic`);
    await page.getByRole('button', { name: 'Replace or view' }).click();
    await page.getByRole('button', { name: 'Load example screening-camp data' }).click();
    const anaemiaRef = async () => {
      await page.getByLabel('Reference standard', { exact: true }).selectOption('Hb_lab');
      await page.getByLabel('Condition present when Hb lab is').selectOption('<');
      await page.getByLabel('Cut-off for Hb lab').fill('11');
    };
    await page.getByLabel('Test being evaluated (index test)').selectOption('Pallor_MO1');
    await anaemiaRef();
    check(`${label}: pallor against laboratory anaemia`, (await text(page, '#dg-h')) === 'Sensitivity 81.7%, specificity 96.6%' && (await text(page, '.verdict-line')) === '95% CI 71.2% to 89.0% and 82.8% to 99.4% (Wilson); LR+ 23.7, LR− 0.19', `${await text(page, '#dg-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByLabel('Prevalence where the test will be used, % (optional)').fill('40');
    const sentence = await text(page, '.report');
    check(`${label}: predictive values at a prevalence of 40%`, sentence.includes('the positive predictive value would be 94.0% (95% CI 75.9% to 98.9%) and the negative predictive value 88.8% (95% CI 83.3% to 93.0%)') && sentence.includes('[INSERT: source of the prevalence]'), sentence.slice(-220));
    check(`${label}: predictive values plotted against prevalence`, (await page.locator('svg.plot path[stroke-width="2"]').count()) === 2);
    check(`${label}: no sideways scroll on the accuracy result`, await noSideScroll(page));
    check(`${label}: accuracy tables fit their width`, await tablesFit());
    await shot(page, `${label}-diagnostic`);
    await page.getByRole('button', { name: 'R and Python code for this analysis' }).click();
    check(`${label}: accuracy R code carries Koopman's interval`, (await page.locator('pre.code').textContent()).includes('koopman_ci <- function(x1, n1, x2, n2)'));
    await page.getByRole('button', { name: 'ROC curve', exact: true }).click();
    await page.getByLabel('Marker', { exact: true }).selectOption('Hb_HemoCue');
    await anaemiaRef();
    check(`${label}: ROC of HemoCue for anaemia`, (await text(page, '#roc-h')) === 'AUC = 0.99' && (await text(page, '.verdict-line')) === '95% CI 0.97 to 1.00 (DeLong); 71 with the condition, 29 without', `${await text(page, '#roc-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: Youden's cut-off read the right way round`, (await page.locator('.restable').first().innerText()).includes('≤ 11.2'));
    check(`${label}: ROC curve drawn`, (await page.locator('svg.plot path.roc').count()) === 1);
    check(`${label}: no sideways scroll on the ROC result`, await noSideScroll(page));
    check(`${label}: ROC tables fit their width`, await tablesFit());
    await shot(page, `${label}-roc`);
    await page.getByRole('button', { name: 'Counts by category' }).click();
    check(`${label}: Hanley and McNeil ratings give AUC 0.89`, (await text(page, '#roc-h')) === 'AUC = 0.89' && (await text(page, '.verdict-line')) === '95% CI 0.83 to 0.95 (DeLong); 51 with the condition, 58 without', `${await text(page, '#roc-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('button', { name: 'Predictive values for this cut-off' }).click();
    check(`${label}: a cut-off carried to the accuracy tab`, (await text(page, '#dg-h')) === 'Sensitivity 86.3%, specificity 77.6%', await text(page, '#dg-h'));
    await page.getByRole('button', { name: 'Compare tests', exact: true }).click();
    await page.getByLabel('First test', { exact: true }).selectOption('Pallor_MO1');
    await page.getByLabel('Second test', { exact: true }).selectOption('Hb_HemoCue');
    await page.getByLabel('Second test positive when Hb HemoCue is').selectOption('<');
    await page.getByLabel('Cut-off for Hb HemoCue').fill('11');
    await anaemiaRef();
    check(`${label}: pallor and HemoCue on the same children`, (await text(page, '#tt-h')) === 'Sensitivity 81.7% and 91.5%; specificity 96.6% and 96.6%' && (await text(page, '.verdict-line')) === 'Differences −9.9 points (95% CI −20.5 to 0.5; exact p = 0.092) and 0.0 points (95% CI −14.1 to 14.1; exact p > 0.999)', `${await text(page, '#tt-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: two-test tables fit their width`, await tablesFit());
    await shot(page, `${label}-two-tests`);
    await page.getByRole('button', { name: 'Two markers, same people', exact: true }).click();
    await page.getByLabel('First marker', { exact: true }).selectOption('Hb_HemoCue');
    await page.getByLabel('Second marker', { exact: true }).selectOption('Pallor_MO1');
    await anaemiaRef();
    check(`${label}: HemoCue against pallor, paired DeLong test`, (await text(page, '#cmp-h')) === 'Difference in AUC = 0.09' && (await text(page, '.verdict-line')) === "95% CI 0.03 to 0.15; DeLong's test for paired curves, z = 3.15, p = 0.002", `${await text(page, '#cmp-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: two ROC curves drawn`, (await page.locator('svg.plot path.roc').count()) === 2);
    check(`${label}: no sideways scroll on the comparison`, await noSideScroll(page));
    check(`${label}: comparison tables fit their width`, await tablesFit());
    await shot(page, `${label}-roc-compare`);

    // Phase 2d: vaccine effectiveness and screening programmes.
    await page.goto(`${base}#/tool/vaccines`);
    await page.getByRole('button', { name: 'Replace or view' }).click();
    await page.getByRole('button', { name: 'Load example measles outbreak' }).click();
    await page.getByLabel('Vaccination column').selectOption('MR_doses');
    await page.getByLabel('Outcome column').selectOption('Measles');
    check(`${label}: VE in the measles outbreak, any dose`, (await text(page, '#ve-h')) === 'VE = 92.6%' && (await text(page, '.verdict-line')) === '95% CI 84.8% to 96.4% (from the risk ratio, Katz)', `${await text(page, '#ve-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('group', { name: 'Vaccinated values', exact: true }).getByLabel('1', { exact: true }).uncheck();
    check(`${label}: VE of two doses against none`, (await text(page, '#ve-h')) === 'VE = 97.5%' && (await text(page, '.verdict-line')) === "95% CI 90.6% to 99.3% (from the risk ratio, Koopman's score)", `${await text(page, '#ve-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: no sideways scroll on VE`, await noSideScroll(page));
    check(`${label}: VE tables fit their width`, await tablesFit());
    await shot(page, `${label}-vaccine`);
    await page.getByRole('button', { name: 'R and Python code for this analysis' }).click();
    check(`${label}: VE R code counts doses from the data`, (await page.locator('pre.code').textContent()).includes('grp <- ifelse(d[["MR_doses"]] %in% c(2), 1, ifelse(d[["MR_doses"]] %in% c(0), 0, NA))'));
    await page.getByLabel('Study design').selectOption('screening');
    await page.getByRole('button', { name: 'Counts', exact: true }).click();
    await page.getByLabel('Coverage in the population, %').fill('85');
    check(`${label}: screening method`, (await text(page, '#ve-h')) === 'VE = 92.4%' && (await text(page, '.verdict-line')) === "95% CI 86.9% to 95.6% (Farrington's logit)", `${await text(page, '#ve-h')} | ${await text(page, '.verdict-line')}`);
    await page.getByRole('button', { name: 'Screening programme', exact: true }).click();
    check(`${label}: two tests in series`, (await text(page, '#sy-h')) === 'Finds 171 of 200 cases' && (await text(page, '.verdict-line')) === 'Net sensitivity 85.5%, specificity 99.9%; positive predictive value 94.6%', `${await text(page, '#sy-h')} | ${await text(page, '.verdict-line')}`);
    check(`${label}: no sideways scroll on the programme`, await noSideScroll(page));
    check(`${label}: programme tables fit their width`, await tablesFit());
    await shot(page, `${label}-programme`);

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
