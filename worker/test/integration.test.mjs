/* End-to-end tests of the Clinic Assistant Worker, run locally with `wrangler dev` against stand-in
 * Anthropic and Telegram APIs (no keys, no cost). From the repository root:
 *   node --test worker/test/integration.test.mjs
 * Set WRANGLER to a wrangler binary if `npx wrangler` should not be used. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startDevServer, TEST } from './dev-server.mjs';

const ADMIN = TEST.admin;
const SECRET = TEST.secret;
let BASE;
let mock;
let server;

before(async () => {
  server = await startDevServer({ port: 8790, mockPort: 8788 });
  BASE = server.base;
  mock = server.mock;
});

after(() => { if (server) server.stop(); });

const post = (path, body, headers = {}) => fetch(BASE + path, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
});
const ask = (body, headers) => post('/api/assistant/chat', body, headers);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tgPost = (update, secret = SECRET) => fetch(`${BASE}/api/assistant/telegram`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'X-Telegram-Bot-Api-Secret-Token': secret }, body: JSON.stringify(update),
});
let updateId = 1;
const tgMsg = (text, { chat = 501, user = 77, type = 'private', reply = null } = {}) => ({
  update_id: updateId++,
  message: { message_id: updateId, date: 0, text, chat: { id: chat, type }, from: { id: user, is_bot: false, first_name: 'T' },
    ...(reply ? { reply_to_message: reply } : {}) },
});
const sent = () => mock.calls.telegram.filter((c) => c.method === 'sendMessage');

async function readSse(res) {
  const raw = await res.text();
  return raw.trim().split('\n\n').map((block) => {
    const ev = (block.match(/^event: (.+)$/m) || [])[1];
    const data = JSON.parse((block.match(/^data: (.+)$/m) || [])[1] || 'null');
    return { ev, data };
  });
}

test('status reports what is switched on', async () => {
  const s = await (await fetch(`${BASE}/api/assistant/status`)).json();
  assert.equal(s.ai, true);
  assert.equal(s.membersEnabled, true);
  assert.equal(s.telegram, true);
  assert.ok(s.notes.count >= 20);
  assert.equal(s.limits.openPerDevice, 3);
});

test('static site still served; unknown paths still 404', async () => {
  const home = await fetch(`${BASE}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Dr\. Abhishek/);
  assert.equal((await fetch(`${BASE}/no-such-page-xyz`)).status, 404);
  assert.equal((await fetch(`${BASE}/worker/index.js`)).status, 404, 'server code is not public');
  assert.equal((await fetch(`${BASE}/wrangler.jsonc`)).status, 404, 'config is not public');
  const kbFile = await fetch(`${BASE}/assistant/kb/clinic-kb.md`);
  assert.equal(kbFile.status, 200);
});

test('website chat: open to visitors, general mode, counts down the daily limit', async () => {
  const r = await ask({ channel: 'web', device: 'device-aaaa-0001', messages: [{ role: 'user', content: 'Explain p values simply' }] });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.match(j.reply, /MOCK\[model=claude-haiku-5-5;notes=false;grounded=false;turns=1\]/);
  assert.equal(j.mode, 'general');
  assert.equal(j.remaining, 2);
  const call = mock.calls.claude.at(-1);
  assert.equal(call.headers['anthropic-version'], '2023-06-01');
  assert.equal(call.body.system[0].cache_control.type, 'ephemeral');
  assert.match(call.body.system[0].text, /Clinic Assistant: custom instructions for the open chats/);
});

test('website chat: Clinic questions bring in matching notes; streaming works', async () => {
  const r = await ask({ channel: 'web', device: 'device-aaaa-0002', stream: true,
    messages: [{ role: 'user', content: 'How do I set up ChatGPT safely?' }] });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/event-stream/);
  const events = await readSse(r);
  assert.equal(events[0].ev, 'meta');
  assert.equal(events[0].data.sources[0].id, 'chatgpt-setup');
  const text = events.filter((e) => e.ev === 'delta').map((e) => e.data.t).join('');
  assert.match(text, /notes=true;grounded=false/);
  assert.equal(events.at(-1).ev, 'done');
});

test('website chat: daily limit per device', async () => {
  const body = { channel: 'web', device: 'device-limit-0001', messages: [{ role: 'user', content: 'hello there' }] };
  for (let i = 0; i < 3; i++) assert.equal((await ask(body)).status, 200);
  const r = await ask(body);
  assert.equal(r.status, 429);
  assert.match((await r.json()).message, /3 free messages/);
  const member = await ask({ ...body, code: 'clinic-2026' });
  assert.equal(member.status, 200, 'a member code lifts the visitor limit');
});

test('app (PWA): AI answers need a valid code', async () => {
  const q = { channel: 'pwa', device: 'device-pwa-0001', messages: [{ role: 'user', content: 'How do I disclose AI use in a manuscript?' }] };
  const none = await ask(q);
  assert.equal(none.status, 401);
  assert.equal((await none.json()).error, 'code_required');
  const bad = await ask({ ...q, code: 'WRONG-0000' });
  assert.equal(bad.status, 401);
  assert.equal((await bad.json()).error, 'invalid_code');
  const ok = await ask({ ...q, code: 'FAC-7788' });
  assert.equal(ok.status, 200);
  const j = await ok.json();
  assert.equal(j.mode, 'grounded');
  assert.equal(j.member, true);
  assert.equal(j.sources[0].id, 'ai-disclosure');
  assert.match(j.reply, /notes=true;grounded=true/);
  assert.equal(j.remaining, 39);
});

test('app (PWA): no matching note means no AI call and no quota used', async () => {
  const before = mock.calls.claude.length;
  const r = await ask({ channel: 'pwa', code: 'FAC-7788', device: 'device-pwa-0002',
    messages: [{ role: 'user', content: 'What is the capital of France?' }] });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.answered, false);
  assert.match(j.reply, /I don't have a checked note on that yet/);
  assert.equal(j.remaining, 40);
  assert.equal(mock.calls.claude.length, before);
});

test('identifiers are refused before anything is sent to the AI', async () => {
  const before = mock.calls.claude.length;
  const r = await ask({ channel: 'web', device: 'device-aaaa-0003', messages: [{ role: 'user', content: 'Patient UHID: GMCH/2026/45678 has fever' }] });
  assert.equal(r.status, 422);
  assert.match((await r.json()).message, /hospital record number/);
  assert.equal(mock.calls.claude.length, before);
});

test('other websites cannot use the chat; bad requests are refused', async () => {
  const r = await ask({ channel: 'web', messages: [{ role: 'user', content: 'hi' }] }, { Origin: 'https://example.org' });
  assert.equal(r.status, 403);
  const empty = await ask({ channel: 'web', messages: [] });
  assert.equal(empty.status, 400);
  const long = await ask({ channel: 'web', messages: [{ role: 'user', content: 'x'.repeat(4001) }] });
  assert.equal(long.status, 400);
});

test('AI errors are explained and the message is given back', async () => {
  const body = { channel: 'pwa', code: 'CLINIC-2026', device: 'device-err-0001', messages: [{ role: 'user', content: 'Setting up ChatGPT safely FORCE_ERROR' }] };
  const r = await ask(body);
  assert.equal(r.status, 502);
  assert.match((await r.json()).message, /busy/);
  const again = await ask({ ...body, messages: [{ role: 'user', content: 'how do I set up chatgpt' }] });
  assert.equal((await again.json()).remaining, 39, 'the failed message was not counted');
});

test('code check, note search and feedback', async () => {
  assert.equal((await post('/api/assistant/verify', { code: ' clinic-2026 ' })).status, 200);
  assert.equal((await post('/api/assistant/verify', { code: 'nope-1234' })).status, 401);
  const s = await (await fetch(`${BASE}/api/assistant/search?q=notebooklm%20sharing`)).json();
  assert.equal(s.results[0].title.startsWith('NotebookLM'), true);
  assert.match(s.results[0].url, /^http:\/\/127\.0\.0\.1:\d+\/assistant\/notes\/#notebooklm$/);
  const none = await (await fetch(`${BASE}/api/assistant/search?q=capital%20of%20france`)).json();
  assert.equal(none.found, 0);
  const fb = await post('/api/assistant/feedback', { rating: 'down', question: 'q1', answer: 'a1', note: 'call 98765 43210', channel: 'pwa' });
  assert.equal(fb.status, 200);
});

test('notes page, plain-text export, placeholders hidden', async () => {
  const r = await fetch(`${BASE}/assistant/notes/`);
  assert.equal(r.status, 200);
  const page = await r.text();
  assert.match(page, /Setting up ChatGPT safely/);
  assert.match(page, /id="access-codes"/);
  assert.ok(!page.includes('[INSERT:'), 'placeholders never shown');
  assert.ok(!page.includes('HOW TO EDIT'), 'editor comment never shown');
  const redirect = await fetch(`${BASE}/assistant/notes`, { redirect: 'manual' });
  assert.equal(redirect.status, 301);
  const txt = await (await fetch(`${BASE}/api/assistant/kb.txt`)).text();
  assert.match(txt, /Disclosing AI use in papers/);
  assert.ok(!txt.includes('[INSERT:'));
});

test('admin pages need the admin key', async () => {
  assert.equal((await fetch(`${BASE}/api/assistant/admin/stats`)).status, 404);
  assert.equal((await fetch(`${BASE}/api/assistant/admin/stats?key=wrong`)).status, 404);
  const stats = await fetch(`${BASE}/api/assistant/admin/stats?key=${ADMIN}`);
  assert.equal(stats.status, 200);
  assert.match(await stats.text(), /Input tokens/);
  const rec = await (await fetch(`${BASE}/api/assistant/admin/records?kind=feedback&key=${ADMIN}`)).text();
  assert.match(rec, /removed: contained an identifier/);
  const un = await (await fetch(`${BASE}/api/assistant/admin/records?kind=unanswered&key=${ADMIN}`)).text();
  assert.match(un, /capital of France/);
});

test('Telegram: set-up registers the webhook with its secret', async () => {
  const r = await (await fetch(`${BASE}/api/assistant/admin/telegram-setup?key=${ADMIN}`)).json();
  assert.equal(r.ok, true);
  assert.equal(r.bot, 'https://t.me/clinic_test_bot');
  const hook = mock.calls.telegram.find((c) => c.method === 'setWebhook');
  assert.equal(hook.body.secret_token, SECRET);
  assert.match(hook.body.url, /\/api\/assistant\/telegram$/);
  assert.ok(mock.calls.telegram.some((c) => c.method === 'setMyCommands'));
});

test('Telegram: refuses calls without the secret', async () => {
  assert.equal((await tgPost(tgMsg('/start'), 'wrong')).status, 403);
});

test('Telegram: members unlock with a code, then chat with memory', async () => {
  let n = sent().length;
  await tgPost(tgMsg('/start'));
  await wait(400);
  assert.match(sent().at(-1).body.text, /\/code ABCD-1234/);

  await tgPost(tgMsg('How do I write a prompt?'));
  await wait(400);
  assert.match(sent().at(-1).body.text, /for Clinic members/);

  await tgPost(tgMsg('/code clinic-2026'));
  await wait(400);
  assert.match(sent().at(-1).body.text, /Code accepted/);

  n = mock.calls.claude.length;
  await tgPost(tgMsg('How do I write a good prompt?'));
  await wait(600);
  assert.equal(mock.calls.claude.length, n + 1);
  const reply = sent().at(-1).body;
  assert.equal(reply.parse_mode, 'HTML');
  assert.match(reply.text, /<b>Answer<\/b>/);
  assert.match(reply.text, /• point one/);
  assert.match(reply.text, /href="http:\/\/127\.0\.0\.1:\d+\/assistant\/notes\/"/);
  assert.ok(mock.calls.telegram.some((c) => c.method === 'sendChatAction'));

  await tgPost(tgMsg('and for MCQs?'));
  await wait(600);
  assert.match(mock.calls.claude.at(-1).body.messages.length.toString(), /^3$/, 'follow-up carries the earlier turn');

  await tgPost(tgMsg('/new'));
  await wait(400);
  await tgPost(tgMsg('Fresh question about NotebookLM'));
  await wait(600);
  assert.equal(mock.calls.claude.at(-1).body.messages.length, 1);
});

test('Telegram: groups answer /ask and replies only; codes never in groups', async () => {
  const before = sent().length;
  await tgPost(tgMsg('just chatting in the group', { chat: -900, type: 'group' }));
  await wait(300);
  assert.equal(sent().length, before, 'ordinary group messages are ignored');
  await tgPost(tgMsg('/code CLINIC-2026', { chat: -900, type: 'group' }));
  await wait(300);
  assert.match(sent().at(-1).body.text, /private chat/);
  await tgPost(tgMsg('/ask@clinic_test_bot what is RAG?', { chat: -900, type: 'group' }));
  await wait(600);
  assert.match(sent().at(-1).body.text, /Answer/);
});

test('Telegram: identifiers refused, feedback recorded', async () => {
  await tgPost(tgMsg('my patient mobile is 9876543210, what to do'));
  await wait(400);
  assert.match(sent().at(-1).body.text, /mobile number/);
  await tgPost(tgMsg('/feedback the NotebookLM answer was outdated'));
  await wait(400);
  assert.match(sent().at(-1).body.text, /Thank you/);
});
