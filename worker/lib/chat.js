/* Web routes: the website chat (general mode), the app's AI answers (notes-only mode), code checks,
 * status, note search (also used by the WhatsApp agent) and "Not right" feedback. */
import { json, clientIp, hashId, originAllowed, siteOrigin, istDay } from './util.js';
import { config } from './config.js';
import { checkCode, parseCodes, quotaChecks, limitMessage } from './access.js';
import { cleanMessages, askClaude, streamClaude, friendlyError } from './claude.js';
import { systemPrompt } from './prompts.js';
import { kb, sourcesFor } from './kb.js';
import { absoluteLinks, plainText } from '../../assistant/lib/kb-core.js';
import { findIdentifiers, identifierMessage } from '../../assistant/lib/guard.js';
import { store } from '../store.js';

const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;
const DAY = 86400;

function sseOnce(meta, text) {
  const enc = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new Response(enc('meta', meta) + enc('delta', { t: text }) + enc('done', { stop: 'end_turn' }), {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/* Notes that match the question. A follow-up such as "and on Android?" rarely names its topic, so
 * when the question alone finds nothing, the previous question is searched with it. */
function findNotes(list, mode) {
  const k = kb();
  const opts = { limit: mode === 'grounded' ? 4 : 3, minConfidence: mode === 'grounded' ? 'medium' : 'high', relative: 0.5 };
  const question = list[list.length - 1].content;
  let hits = k.search(question, opts);
  if (!hits.length) {
    const earlier = list.slice(0, -1).filter((m) => m.role === 'user').pop();
    if (earlier) hits = k.search(`${earlier.content} ${question}`, opts);
  }
  return hits;
}

export async function handleChat(request, env, ctx) {
  const C = config(env);
  if (!originAllowed(request, env)) return json({ error: 'forbidden', message: 'This chat works only on its own website.' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request', message: 'The request was not understood.' }, 400); }

  const channel = body.channel === 'pwa' ? 'pwa' : 'web';
  const mode = channel === 'pwa' ? 'grounded' : 'general';
  const msgs = cleanMessages(body.messages, { maxTurns: mode === 'grounded' ? 6 : 12 });
  if (msgs.error) return json({ error: 'bad_request', message: msgs.error }, 400);
  const question = msgs.list[msgs.list.length - 1].content;
  const found = findIdentifiers(question);
  if (found.length) return json({ error: 'identifiers', message: identifierMessage(found), found }, 422);

  let member = null;
  if (body.code) {
    member = await checkCode(env, body.code);
    if (!member) return json({ error: 'invalid_code', message: 'That access code is not valid. Check it, or ask Dr. Panda for a new one.' }, 401);
  }
  if (!member && (channel === 'pwa' || !C.websiteOpen)) {
    return json({ error: 'code_required', message: 'AI answers here are for Clinic members. Enter your access code in Settings. The notes work for everyone.' }, 401);
  }
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured', message: 'AI answers are not switched on yet. The notes still work.' }, 503);

  const device = DEVICE_RE.test(body.device || '') ? body.device : '';
  const ipKey = await hashId(env, 'ip', clientIp(request));
  const userKey = member
    ? await hashId(env, 'member', `${member.codeHash}|${device || ipKey}`)
    : await hashId(env, 'device', device || ipKey);
  const checks = quotaChecks(env, { pool: member ? 'member' : 'open', userKey, ipKey, channel });
  const st = store(env);
  const quota = await st.consume(checks);
  if (!quota.ok) return json({ error: 'limit', message: limitMessage(quota.blocked, env), remaining: 0 }, 429);
  const countedKeys = checks.filter((c) => c.name !== 'stats').map((c) => c.key);
  const refund = () => st.refund(countedKeys);

  const hits = findNotes(msgs.list, mode);
  const sources = sourcesFor(hits);

  // Notes-only mode with no matching note: answer at once, without the AI and without using the quota.
  if (mode === 'grounded' && !hits.length) {
    ctx.waitUntil(refund());
    if (C.logUnanswered) ctx.waitUntil(st.logEvent('unanswered', channel, { q: question.slice(0, 500) }, C.keepDays));
    const reply = `I don't have a checked note on that yet. You can ask in the Clinic group or email ${C.contactEmail}.`;
    const meta = { sources: [], remaining: quota.remaining + 1, mode, member: !!member, answered: false };
    return body.stream ? sseOnce(meta, reply) : json({ ...meta, reply });
  }

  const origin = siteOrigin(request, env);
  const args = {
    model: mode === 'grounded' ? C.modelGrounded : C.modelGeneral,
    system: systemPrompt({ mode, channel, hits, origin, member: !!member }),
    messages: msgs.list,
    maxTokens: mode === 'grounded' ? C.maxTokensGrounded : C.maxTokensGeneral,
  };
  const day = istDay();
  const recordUsage = (u = {}) => Promise.all([
    st.add(`s:${day}:tok_in`, (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0), 100 * DAY),
    st.add(`s:${day}:tok_out`, u.output_tokens || 0, 100 * DAY),
  ]);
  const meta = { sources, remaining: quota.remaining, mode, member: !!member, answered: true };

  if (body.stream) {
    const { readable, pump } = streamClaude(env, args, {
      meta,
      onDone: ({ usage }) => recordUsage(usage),
      onError: (err, { partial }) => {
        console.error('chat stream failed', err.status || '', err.detail || err.message);
        return partial ? null : refund();
      },
    });
    ctx.waitUntil(pump);
    return new Response(readable, {
      headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' },
    });
  }
  try {
    const out = await askClaude(env, args);
    ctx.waitUntil(recordUsage(out.usage));
    return json({ ...meta, reply: out.text });
  } catch (err) {
    console.error('chat failed', err.status || '', err.detail || err.message);
    ctx.waitUntil(refund());
    return json({ error: 'upstream', message: friendlyError(err) }, 502);
  }
}

export async function handleVerify(request, env) {
  const C = config(env);
  if (!originAllowed(request, env)) return json({ error: 'forbidden' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const ipKey = await hashId(env, 'ip', clientIp(request));
  const gate = await store(env).consume([{ name: 'attempts', key: `v:${istDay()}:${ipKey}`, limit: C.codeAttemptsPerDay, ttl: 2 * DAY }]);
  if (!gate.ok) return json({ ok: false, message: 'Too many attempts today. Please try again tomorrow.' }, 429);
  const member = await checkCode(env, body.code);
  if (!member) return json({ ok: false, message: 'That access code is not valid. Check it, or ask Dr. Panda for a new one.' }, 401);
  return json({ ok: true, limit: C.memberPerUser });
}

export async function handleStatus(request, env) {
  const C = config(env);
  const k = kb();
  return json({
    ok: true,
    ai: Boolean(env.ANTHROPIC_API_KEY),
    websiteOpen: C.websiteOpen,
    membersEnabled: parseCodes(env).size > 0,
    telegram: Boolean(env.TELEGRAM_BOT_TOKEN),
    notes: { count: k.kb.entries.length, updated: k.kb.meta.updated || '' },
    limits: { openPerDevice: C.openPerDevice, memberPerUser: C.memberPerUser },
  });
}

/* Note search without AI. Used by the WhatsApp (AiSensy) agent as a "Custom API Action", and handy for checks. */
export async function handleSearch(request, env) {
  const C = config(env);
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || url.searchParams.get('query') || '').slice(0, 500);
  const limit = Math.min(5, Math.max(1, parseInt(url.searchParams.get('limit') || '3', 10) || 3));
  if (!q.trim()) return json({ error: 'bad_request', message: 'Add ?q= with the question.' }, 400);
  const ipKey = await hashId(env, 'ip', clientIp(request));
  const gate = await store(env).consume([{ name: 'search', key: `sr:${Math.floor(Date.now() / 60000)}:${ipKey}`, limit: C.searchPerMinute, ttl: 120 }]);
  if (!gate.ok) return json({ error: 'limit', message: 'Too many searches in a minute.' }, 429);
  const origin = siteOrigin(request, env);
  const results = kb().search(q, { limit, minConfidence: 'medium', relative: 0.5 }).map((h) => ({
    title: h.title,
    url: `${origin}/assistant/notes/#${h.id}`,
    updated: h.updated,
    confidence: h.confidence,
    text: plainText(absoluteLinks(h.body, origin)).slice(0, 1500),
  }));
  return json({
    query: q,
    found: results.length,
    results,
    note: results.length ? 'Answer only from these notes.' : 'No checked note matches. Say so and offer the human handoff.',
  }, 200, { 'access-control-allow-origin': '*' });
}

export async function handleFeedback(request, env, ctx) {
  const C = config(env);
  if (!originAllowed(request, env)) return json({ error: 'forbidden' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const ipKey = await hashId(env, 'ip', clientIp(request));
  const st = store(env);
  const gate = await st.consume([{ name: 'feedback', key: `fb:${istDay()}:${ipKey}`, limit: 30, ttl: 2 * DAY }]);
  if (!gate.ok) return json({ ok: false }, 429);
  const clean = (s, n) => {
    const t = String(s || '').slice(0, n);
    return findIdentifiers(t).length ? '[removed: contained an identifier]' : t;
  };
  const record = {
    rating: body.rating === 'up' ? 'up' : 'down',
    q: clean(body.question, 500),
    a: clean(body.answer, 1500),
    note: clean(body.note, 500),
    sources: Array.isArray(body.sources) ? body.sources.slice(0, 5).map((s) => String(s).slice(0, 60)) : [],
  };
  ctx.waitUntil(st.logEvent('feedback', body.channel === 'pwa' ? 'pwa' : 'web', record, C.keepDays));
  return json({ ok: true });
}
