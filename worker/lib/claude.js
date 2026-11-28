/* Calls to Anthropic's Claude Messages API, with and without streaming. */
import { config } from './config.js';

/* Keep only well-formed turns, newest last, starting with the user; refuse an over-long question. */
export function cleanMessages(raw, { maxTurns = 12, maxChars = 4000, maxTotal = 24000 } = {}) {
  if (!Array.isArray(raw) || !raw.length) return { error: 'Please type a question.' };
  let list = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .filter((m) => m.content);
  const last = list[list.length - 1];
  if (!last || last.role !== 'user') return { error: 'Please type a question.' };
  if (last.content.length > maxChars) return { error: `Please keep a message under ${maxChars.toLocaleString('en-IN')} characters.` };
  list = list.slice(-maxTurns).map((m) => ({ role: m.role, content: m.content.slice(0, maxChars * 2) }));
  while (list.length && list[0].role !== 'user') list.shift();
  const merged = [];
  for (const m of list) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === m.role) prev.content += '\n\n' + m.content;
    else merged.push({ ...m });
  }
  let total = merged.reduce((a, m) => a + m.content.length, 0);
  while (merged.length > 1 && total > maxTotal) {
    total -= merged.shift().content.length;
    while (merged.length && merged[0].role !== 'user') total -= merged.shift().content.length;
  }
  return merged.length ? { list: merged } : { error: 'Please type a question.' };
}

function request(env, { model, system, messages, maxTokens, stream }) {
  const C = config(env);
  return fetch(`${C.anthropicBase}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages, stream: !!stream }),
  });
}

async function failure(res) {
  const detail = await res.text().catch(() => '');
  const err = new Error(`Claude API returned ${res.status}`);
  err.status = res.status;
  err.detail = detail.slice(0, 400);
  return err;
}

export async function askClaude(env, args) {
  const res = await request(env, { ...args, stream: false });
  if (!res.ok) throw await failure(res);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  return { text, usage: data.usage || {}, stop: data.stop_reason };
}

export function friendlyError(err) {
  const s = err && err.status;
  if (s === 429 || s === 529 || s === 503) return 'The AI service is busy right now. Please try again in a minute.';
  if (s === 401 || s === 403) return 'The assistant is not set up correctly yet (AI key). Please tell Dr. Panda.';
  if (s === 400 || s === 404) return 'The AI service could not process this message. Please rephrase it or start a new chat.';
  return 'Something went wrong while answering. Please try again.';
}

/* Streams the answer to the browser as Server-Sent Events: "meta" first (sources, messages left),
 * then "delta" pieces of text, then "done", or "error" with a message a person can act on. */
export function streamClaude(env, args, { meta, onDone, onError }) {
  const enc = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const send = (event, data) => writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  const pump = (async () => {
    let full = '';
    let usage = {};
    let stop = null;
    try {
      await send('meta', meta);
      const res = await request(env, { ...args, stream: true });
      if (!res.ok || !res.body) throw await failure(res);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let cut;
        while ((cut = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, cut);
          buf = buf.slice(cut + 2);
          const data = chunk.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
          if (!data) continue;
          let ev;
          try { ev = JSON.parse(data); } catch { continue; }
          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') {
            full += ev.delta.text;
            await send('delta', { t: ev.delta.text });
          } else if (ev.type === 'message_start' && ev.message && ev.message.usage) {
            usage = { ...usage, ...ev.message.usage };
          } else if (ev.type === 'message_delta') {
            if (ev.usage) usage = { ...usage, ...ev.usage };
            if (ev.delta && ev.delta.stop_reason) stop = ev.delta.stop_reason;
          } else if (ev.type === 'error') {
            const e = new Error((ev.error && ev.error.message) || 'stream error');
            e.status = ev.error && ev.error.type === 'overloaded_error' ? 529 : 500;
            throw e;
          }
        }
      }
      await send('done', { stop });
      if (onDone) await onDone({ text: full, usage, stop });
    } catch (err) {
      try { await send('error', { message: friendlyError(err) }); } catch { /* the browser has gone */ }
      if (onError) await onError(err, { partial: full });
    } finally {
      try { await writer.close(); } catch { /* already closed */ }
    }
  })();
  return { readable, pump };
}
