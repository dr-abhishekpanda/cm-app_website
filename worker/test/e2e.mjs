/* Browser test of the Clinic Assistant app (/assistant/) and the website chat, against `wrangler dev`
 * and stand-in APIs. Uses the Playwright installed on the machine (deliberately not a dependency of
 * this repository, as in apps-src) and Chrome or Chromium.
 *   node worker/test/e2e.mjs [--shots <folder>]
 * PLAYWRIGHT: path to the playwright package if `require('playwright')` cannot find it.
 * CHROME: path to the browser if Playwright's own browsers are not installed. */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startDevServer } from './dev-server.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const argShots = process.argv.indexOf('--shots');
const SHOTS = argShots > 0 ? process.argv[argShots + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const check = (cond, label) => { console.log(`${cond ? 'ok  ' : 'FAIL'}  ${label}`); if (!cond) failures++; };
const shot = async (page, name, full = true) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: full }); };
const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

const server = await startDevServer({ port: 8791, mockPort: 8789 });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const errors = [];
const watch = (page) => {
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_REFUSED/.test(m.text())) errors.push(`${page.url()}: ${m.text()}`); });
};
const aiText = (page) => page.evaluate(() => { const el = document.querySelector('.qa .ai .md'); return el ? el.textContent : ''; });

try {
  /* ------------------------------------------------------------ the app ------------- */
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, serviceWorkers: 'allow' });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(`${server.base}/assistant/`);
  await page.waitForFunction(() => /notes, updated/.test(document.getElementById('foot-notes').textContent));
  check(true, 'app: notes downloaded and indexed');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  check(true, 'app: service worker installed and in control');
  check(await noSideScroll(page), 'app: no sideways scroll at 360 px');
  check(/Online/.test(await page.textContent('#net')), 'app: shows Online');
  await shot(page, 'app-start-360', false);

  await page.fill('#q', 'How do I set up ChatGPT safely?');
  await page.click('#ask-form button[type=submit]');
  await page.waitForSelector('.qa .notice');
  check(/access code/.test(await page.textContent('.qa .notice')), 'app: without a code it says AI answers need one');
  check(/Setting up ChatGPT safely/.test(await page.textContent('.qa .hits')), 'app: shows the matching checked note');
  check(await page.isVisible('.qa .hit[open] .md'), 'app: the best note is open');
  await shot(page, 'app-nocode-360');

  await page.fill('#q', 'my patient mobile is 9876543210');
  await page.click('#ask-form button[type=submit]');
  check(/mobile number/.test(await page.textContent('#form-error')), 'app: refuses identifiers before sending anything');
  await page.fill('#q', '');

  await page.click('#open-settings');
  await page.fill('#code', 'clinic-2026');
  await page.click('#code-form button[type=submit]');
  await page.waitForFunction(() => /Code saved/.test(document.getElementById('code-msg').textContent));
  check(true, 'app: code checked with the server and saved');
  await shot(page, 'app-settings-360', false);
  await page.click('#close-settings');
  await page.waitForFunction(() => { const el = document.querySelector('.qa .ai .md'); return el && /MOCK\[/.test(el.textContent); }, null, { timeout: 15000 });
  check(/grounded=true/.test(await aiText(page)), 'app: the earlier question gets its AI answer once the code is saved');

  await page.fill('#q', 'How do I disclose AI use in a manuscript?');
  await page.press('#q', 'Enter');
  await page.waitForFunction(() => { const m = document.querySelector('.qa .ai-meta'); return m && /Disclosing AI use/.test(m.textContent); }, null, { timeout: 15000 });
  check(true, 'app: streamed answer names the notes it used');
  check(/left today/.test(await page.textContent('#ask-hint')), 'app: shows AI answers left today');
  await page.click('.qa .fb button[data-r="down"]');
  check(await page.getAttribute('.qa .fb button[data-r="down"]', 'aria-pressed') === 'true', 'app: "Not right" is recorded');
  await shot(page, 'app-answer-360');

  await page.click('.qa .ai-meta .sources button');
  check(await page.isVisible('#view-notes'), 'app: a source button opens the Notes view');
  check(await page.isVisible('#notes-list details[open]'), 'app: ...with that note open');
  await page.fill('#filter', 'notebooklm');
  check(/NotebookLM/.test(await page.textContent('#notes-list')), 'app: the note filter works');
  await page.fill('#filter', '');
  await shot(page, 'app-notes-360', false);
  await page.click('#tab-ask');

  await ctx.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  check(/Offline/.test(await page.textContent('#net')), 'app: shows Offline');
  await page.fill('#q', 'What is NotebookLM?');
  await page.click('#ask-form button[type=submit]');
  await page.waitForSelector('.qa .notice');
  check(/offline/i.test(await page.textContent('.qa .notice')), 'app: an offline question is saved for later');
  check(/NotebookLM/.test(await page.textContent('.qa .hits')), 'app: offline search still finds the note');
  await shot(page, 'app-offline-360');
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => { const el = document.querySelector('.qa .ai .md'); return el && /NotebookLM/.test(el.textContent); }, null, { timeout: 15000 });
  check(true, 'app: the saved question is answered when back online');

  await page.setViewportSize({ width: 320, height: 700 });
  check(await noSideScroll(page), 'app: no sideways scroll at 320 px');
  await page.setViewportSize({ width: 1280, height: 860 });
  check(await noSideScroll(page), 'app: no sideways scroll at 1280 px');
  await shot(page, 'app-desktop-1280', false);
  await page.emulateMedia({ colorScheme: 'dark' });
  await shot(page, 'app-dark-1280', false);
  await page.emulateMedia({ colorScheme: 'light' });

  /* ------------------------------------------------------------ website chat -------- */
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const site = await ctx2.newPage();
  watch(site);
  await site.goto(`${server.base}/`);
  await site.waitForSelector('#clinic-assistant-chat', { state: 'attached' });
  const w = (sel) => site.locator(`#clinic-assistant-chat ${sel}`);
  check(await w('button.launch').isVisible(), 'website: the chat button shows on the home page');
  check(/Clinic Assistant/.test(await site.textContent('#apps')), 'website: the Clinic Assistant card is in the tools list');
  await w('button.launch').click();
  check(await w('.panel').isVisible(), 'website: the chat opens');
  await w('.chip').nth(1).click();
  await site.waitForFunction(() => {
    const r = document.getElementById('clinic-assistant-chat').shadowRoot;
    const a = [...r.querySelectorAll('.msg.a')].pop();
    return a && /MOCK\[/.test(a.textContent) && /Helpful/.test(a.textContent);
  }, null, { timeout: 15000 });
  const last = await w('.msg.a').last().textContent();
  check(/grounded=false/.test(last) && /notes=true/.test(last), 'website: general mode, with the matching Clinic note');
  check(/Setting up ChatGPT safely/.test(last), 'website: links the Clinic note it used');
  check(/2 left today/.test(await w('.left').textContent()), 'website: shows free messages left today');
  await shot(site, 'website-chat-1280', false);

  await w('textarea').fill('Patient Aadhaar 2345 6789 0123, what next?');
  await w('textarea').press('Enter');
  check(/Aadhaar number/.test(await w('.warn').textContent()), 'website: refuses identifiers');

  await w('textarea').fill('Second question');
  await w('textarea').press('Enter');
  await site.waitForFunction(() => /1 left today|0 left today/.test(document.getElementById('clinic-assistant-chat').shadowRoot.querySelector('.left').textContent), null, { timeout: 15000 });
  await w('textarea').fill('Third question');
  await w('textarea').press('Enter');
  await site.waitForFunction(() => /0 left today/.test(document.getElementById('clinic-assistant-chat').shadowRoot.querySelector('.left').textContent), null, { timeout: 15000 });
  await w('textarea').fill('Fourth question');
  await w('textarea').press('Enter');
  await site.waitForFunction(() => /free messages/.test([...document.getElementById('clinic-assistant-chat').shadowRoot.querySelectorAll('.msg.a')].pop().textContent), null, { timeout: 15000 });
  check(true, 'website: the daily limit for visitors is enforced and explained');

  await w('[data-act="code"]').click();
  await w('#cma-code').fill('fac-7788');
  await w('[data-act="save-code"]').click();
  await site.waitForFunction(() => /Member code saved/.test(document.getElementById('clinic-assistant-chat').shadowRoot.querySelector('.left').textContent), null, { timeout: 10000 });
  await w('textarea').fill('Now as a member');
  await w('textarea').press('Enter');
  await site.waitForFunction(() => /39 left today/.test(document.getElementById('clinic-assistant-chat').shadowRoot.querySelector('.left').textContent), null, { timeout: 15000 });
  check(true, 'website: a member code lifts the limit');

  await site.reload();
  await w('button.launch').click();
  check((await w('.msg').count()) >= 8, 'website: the conversation survives a page reload in the same tab');
  await w('[data-act="new"]').click();
  check((await w('.msg').count()) === 0, 'website: "New chat" clears it');
  await site.keyboard.press('Escape');
  check(!(await w('.panel').isVisible()), 'website: Escape closes the chat');

  await site.setViewportSize({ width: 360, height: 780 });
  check(await noSideScroll(site), 'website: no sideways scroll at 360 px');
  await w('button.launch').click();
  await shot(site, 'website-chat-360', false);
  await ctx2.close();

  /* ------------------------------------------------------------ notes and privacy ---- */
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p3 = await ctx3.newPage();
  watch(p3);
  await p3.goto(`${server.base}/assistant/notes/`);
  check(await noSideScroll(p3), 'notes page: no sideways scroll at 390 px');
  await p3.fill('#filter', 'telegram');
  const visible = await p3.locator('.note:visible').count();
  check(visible > 0 && visible < 10, 'notes page: the filter narrows the list');
  await shot(p3, 'notes-page-390', false);
  await p3.goto(`${server.base}/assistant/privacy/`);
  check(await noSideScroll(p3), 'privacy page: no sideways scroll at 390 px');
  await shot(p3, 'privacy-390', false);
  await ctx3.close();

  /* ------------------------------------------------------------ truly offline -------- */
  server.stop();
  await new Promise((r) => setTimeout(r, 1500));
  const page2 = await ctx.newPage();
  watch(page2);
  await page2.goto(`${server.base}/assistant/`, { timeout: 20000 });
  await page2.waitForFunction(() => /notes, updated/.test(document.getElementById('foot-notes').textContent), null, { timeout: 20000 });
  check(true, 'app: with the server gone, the app still opens from its saved copy with all notes');
  await page2.click('#tab-notes');
  await page2.fill('#filter', 'emergency');
  check(/108/.test(await page2.textContent('#notes-list')), 'app: notes searchable with no server at all');
  await ctx.close();
} catch (err) {
  failures++;
  console.log('FAIL  ' + (err && err.stack || err));
} finally {
  await browser.close();
  try { server.stop(); } catch { /* already stopped */ }
}

check(errors.length === 0, 'no script errors in any page' + (errors.length ? ':\n  ' + errors.join('\n  ') : ''));
console.log(failures ? `\n${failures} check(s) failed` : '\nAll browser checks passed');
process.exit(failures ? 1 : 0);
