/* Clinic Assistant: website chat.
 * Add one line before </body> on any page of dr-abhishekpanda-cm.app:
 *   <script type="module" src="/assistant/widget.js"></script>
 * A button appears at the bottom right; it opens a general-purpose AI chat with the Clinic's custom
 * instructions and checked notes. Visitors get a small daily allowance; Clinic members can enter their
 * access code (shared with the Clinic Assistant app) for more. Everything is drawn inside a shadow root,
 * so the page's own styles are not touched. Optional attributes on the script tag:
 *   data-label="Ask the Clinic Assistant"   text on the button
 *   data-open="true"                         open the chat when the page loads */
import { renderMarkdown, escapeHtml } from './lib/markdown.js';
import { findIdentifiers, identifierMessage } from './lib/guard.js';

(() => {
  if (window.__clinicAssistantWidget) return;
  window.__clinicAssistantWidget = true;

  const API = '/api/assistant/';
  const script = document.currentScript || document.querySelector('script[src*="/assistant/widget.js"]');
  const LABEL = (script && script.dataset.label) || 'Ask the Clinic Assistant';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('cma:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('cma:' + k, JSON.stringify(v)); } catch { /* blocked */ } },
    del(k) { try { localStorage.removeItem('cma:' + k); } catch { /* blocked */ } },
  };
  const session = {
    get() { try { return JSON.parse(sessionStorage.getItem('cma:webchat') || '[]'); } catch { return []; } },
    set(v) { try { sessionStorage.setItem('cma:webchat', JSON.stringify(v.slice(-30))); } catch { /* blocked */ } },
  };
  let device = store.get('device', '');
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(device)) {
    device = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/[^A-Za-z0-9-]/g, '');
    store.set('device', device);
  }
  let messages = session.get().map((m) => (m.status === 'loading' ? { ...m, status: 'error', content: m.content || '', error: 'Interrupted. Please ask again.' } : m));
  let remaining = null;
  let busy = false;

  const CSS = `
  :host{all:initial}
  *{box-sizing:border-box}
  .root{--paper:#F4F5F1;--paper-2:#ECEEE7;--card:#FAFBF7;--ink:#15201B;--ink-soft:#4B5A52;--ink-faint:#7B877E;--line:#D7DCD1;--line-soft:#E4E7DD;
    --primary:#0C5E4E;--primary-deep:#08493C;--accent:#BE651F;--danger:#A23B2B;
    --body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--display:"Fraunces",Georgia,serif;--mono:"IBM Plex Mono",ui-monospace,monospace;
    font-family:var(--body);color:var(--ink);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
  button{font:inherit;color:inherit;cursor:pointer}
  .launch{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:2147483000;
    display:inline-flex;align-items:center;gap:10px;border:0;border-radius:100px;background:var(--primary);color:var(--paper);
    padding:10px 18px 10px 10px;font-weight:600;font-size:.95rem;box-shadow:0 1px 2px rgba(21,32,27,.08),0 12px 30px -12px rgba(21,32,27,.5);
    transition:transform .12s ease,background .15s}
  .launch:hover{background:var(--primary-deep)}
  .launch:active{transform:translateY(1px)}
  .launch:focus-visible,.panel :focus-visible{outline:2.5px solid var(--primary);outline-offset:2px}
  .launch:focus-visible{outline-color:var(--accent)}
  .mk{position:relative;width:32px;height:32px;border-radius:9px;background:var(--paper);color:var(--primary);display:grid;place-items:center;
    font-family:var(--display);font-weight:600;font-size:19px;flex:none}
  .mk::after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:var(--accent);top:4px;right:4px}
  .launch[aria-expanded="true"]{display:none}
  .panel{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:2147483001;
    width:min(410px,calc(100vw - 32px));height:min(660px,calc(100vh - 32px));display:flex;flex-direction:column;background:var(--paper);
    border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 1px 2px rgba(21,32,27,.06),0 24px 60px -20px rgba(21,32,27,.45)}
  .panel[hidden]{display:none}
  .hd{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 14px;border-bottom:1px solid var(--line-soft);background:var(--card)}
  .hd .mk{background:var(--primary);color:var(--paper);width:30px;height:30px;font-size:18px}
  .hd .tt{flex:1;min-width:0}
  .hd h2{margin:0;font-family:var(--display);font-weight:500;font-size:1.12rem;letter-spacing:-.01em;line-height:1.15}
  .hd p{margin:2px 0 0;font-size:.78rem;color:var(--ink-soft)}
  .ib{width:36px;height:36px;border-radius:9px;border:1px solid var(--line);background:var(--paper);display:grid;place-items:center;flex:none}
  .ib:hover{border-color:var(--primary);color:var(--primary)}
  .ib svg{width:18px;height:18px}
  .log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;
    background-image:linear-gradient(to right,rgba(215,220,209,.35) 1px,transparent 1px),linear-gradient(to bottom,rgba(215,220,209,.35) 1px,transparent 1px);
    background-size:34px 34px}
  .hello{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
  .hello p{margin:0 0 8px}
  .hello .fine{font-size:.82rem;color:var(--ink-soft);margin:8px 0 0}
  .chips{display:flex;flex-direction:column;gap:6px}
  .chip{border:1px solid var(--line);background:var(--paper);border-radius:10px;padding:8px 10px;text-align:left;font-size:.88rem;color:var(--ink-soft)}
  .chip:hover{border-color:var(--primary);color:var(--primary)}
  .msg{max-width:92%;border-radius:12px;padding:10px 12px;overflow-wrap:anywhere}
  .u{align-self:flex-end;background:rgba(12,94,78,.1);border:1px solid rgba(12,94,78,.18);white-space:pre-wrap}
  .a{align-self:flex-start;background:var(--card);border:1px solid var(--line)}
  .a.err{border-left:3px solid var(--danger)}
  .meta{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--line-soft);font-size:.8rem;color:var(--ink-soft)}
  .meta a{color:var(--primary)}
  .fb{display:inline-flex;gap:6px}
  .fb button{border:1px solid var(--line);background:var(--paper);border-radius:100px;padding:3px 10px;font-size:.78rem;color:var(--ink-soft)}
  .fb button[aria-pressed="true"]{border-color:var(--primary);color:var(--primary);background:rgba(12,94,78,.08)}
  .md p{margin:0 0 8px}.md p:last-child{margin:0}
  .md ul,.md ol{margin:0 0 8px;padding-left:1.25em}.md li{margin:2px 0}
  .md a{color:var(--primary)}
  .md code{font-family:var(--mono);font-size:.85em;background:var(--paper-2);padding:1px 4px;border-radius:4px}
  .md pre{background:var(--paper-2);border:1px solid var(--line-soft);border-radius:8px;padding:8px 10px;overflow-x:auto;white-space:pre-wrap;font-size:.84rem;margin:0 0 8px}
  .md pre code{background:none;padding:0}
  .md h1,.md h2,.md h3,.md h4{font-family:var(--display);font-weight:500;font-size:1.02rem;margin:10px 0 4px}
  .md blockquote{margin:0 0 8px;padding:2px 10px;border-left:3px solid var(--line);color:var(--ink-soft)}
  .md-table{overflow-x:auto;margin:0 0 8px;border:1px solid var(--line);border-radius:8px}
  .md-table table{border-collapse:collapse;width:100%;font-size:.84rem}
  .md-table th{text-align:left;background:var(--paper-2);padding:6px 8px;font-weight:600}
  .md-table td{padding:6px 8px;border-top:1px solid var(--line-soft);vertical-align:top}
  .wait::after{content:"";display:inline-block;width:1.2em;animation:d 1.2s steps(4,end) infinite}
  @keyframes d{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}
  .ft{border-top:1px solid var(--line-soft);background:var(--card);padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px))}
  .row{display:flex;gap:8px;align-items:flex-end}
  textarea{flex:1;resize:none;border:1.5px solid var(--line);border-radius:10px;background:var(--paper);color:var(--ink);font:inherit;
    padding:9px 11px;min-height:42px;max-height:120px;line-height:1.4;outline:none}
  textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(12,94,78,.12)}
  .send{width:42px;height:42px;border-radius:10px;border:0;background:var(--primary);color:var(--paper);display:grid;place-items:center;flex:none}
  .send:hover{background:var(--primary-deep)}
  .send[disabled]{opacity:.5;cursor:not-allowed}
  .send svg{width:18px;height:18px}
  .warn{color:var(--danger);font-size:.84rem;margin:6px 0 0}
  .fine{font-size:.76rem;color:var(--ink-faint);margin:6px 0 0;display:flex;flex-wrap:wrap;gap:4px 10px}
  .fine a,.lk{color:var(--ink-soft);text-decoration:underline;background:none;border:0;padding:0;font-size:inherit}
  .code{display:flex;gap:6px;margin-top:8px}
  .code input{flex:1;min-width:0;border:1.5px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink);padding:7px 9px;
    font-family:var(--mono);font-size:.86rem;outline:none}
  .code input:focus{border-color:var(--primary)}
  .code button{border:0;border-radius:8px;background:var(--primary);color:var(--paper);padding:7px 12px;font-weight:600;font-size:.84rem}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  [hidden]{display:none!important}
  @media (max-width:560px){
    .panel{inset:0;width:100%;height:100%;border-radius:0;border:0}
    .launch .tx{display:none}
    .launch{padding:10px}
  }
  @media (prefers-reduced-motion:reduce){.wait::after{animation:none;content:"..."}.launch{transition:none}}
  `;

  const host = document.createElement('div');
  host.id = 'clinic-assistant-chat';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${CSS}</style>
  <div class="root">
    <button class="launch" type="button" aria-expanded="false" aria-controls="cma-panel" aria-label="${escapeHtml(LABEL)}">
      <span class="mk" aria-hidden="true">C</span><span class="tx">${escapeHtml(LABEL)}</span>
    </button>
    <section class="panel" id="cma-panel" role="dialog" aria-modal="false" aria-labelledby="cma-title" hidden>
      <header class="hd">
        <span class="mk" aria-hidden="true">C</span>
        <div class="tt"><h2 id="cma-title">Clinic Assistant</h2><p>AI help for healthcare professionals</p></div>
        <button class="ib" type="button" data-act="new" aria-label="Start a new chat" title="New chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
        <button class="ib" type="button" data-act="close" aria-label="Close the chat" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </header>
      <div class="log" role="log" aria-label="Conversation"></div>
      <footer class="ft">
        <form class="row" novalidate>
          <label class="sr" for="cma-q">Your message</label>
          <textarea id="cma-q" rows="1" maxlength="4000" enterkeyhint="send" placeholder="Type your question"></textarea>
          <button class="send" type="submit" aria-label="Send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button>
        </form>
        <p class="warn" role="alert" hidden></p>
        <div class="code" hidden>
          <label class="sr" for="cma-code">Clinic access code</label>
          <input id="cma-code" type="password" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Clinic access code" maxlength="64">
          <button type="button" data-act="save-code">Save</button>
        </div>
        <p class="fine"><span>AI can make mistakes. Never type patient details.</span>
          <a href="/assistant/privacy/">Privacy</a>
          <button class="lk" type="button" data-act="code">Member code</button>
          <span class="left"></span></p>
      </footer>
      <p class="sr" aria-live="polite"></p>
    </section>
  </div>`;
  document.body.appendChild(host);

  const $ = (sel) => root.querySelector(sel);
  const launch = $('.launch');
  const panel = $('.panel');
  const log = $('.log');
  const input = $('textarea');
  const warn = $('.warn');
  const live = $('.sr[aria-live]');
  const left = $('.left');

  const HELLO = `<div class="hello">
    <p>I am the <strong>Clinic Assistant</strong> of the Digital &amp; AI Fluency Clinic for Healthcare Professionals. Ask me how to use AI and digital tools in your work, or any other question.</p>
    <div class="chips">
      <button class="chip" type="button" data-q="Write a prompt that makes 5 MCQs on the cold chain for MBBS students.">Write a prompt for MCQs on the cold chain</button>
      <button class="chip" type="button" data-q="How do I set up ChatGPT safely?">How do I set up ChatGPT safely?</button>
      <button class="chip" type="button" data-q="What is the Digital & AI Fluency Clinic?">What is the Digital &amp; AI Fluency Clinic?</button>
    </div>
    <p class="fine">Visitors get a few free messages a day. Clinic members can enter their access code for more.</p>
  </div>`;

  function bubble(m) {
    if (m.role === 'user') return `<div class="msg u">${escapeHtml(m.content)}</div>`;
    if (m.status === 'loading' && !m.content) return '<div class="msg a"><span class="wait">Writing</span></div>';
    if (m.status === 'error') return `<div class="msg a err">${escapeHtml(m.error || 'Something went wrong.')}</div>`;
    const src = (m.sources || []).length
      ? `<span>Clinic notes: ${m.sources.map((s) => `<a href="/assistant/notes/#${encodeURIComponent(s.id)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a>`).join('; ')}</span>` : '';
    const fb = m.status === 'done'
      ? `<span class="fb" role="group" aria-label="Was this answer right?"><button type="button" data-act="fb" data-r="up" data-id="${m.id}" aria-pressed="${m.fb === 'up'}">Helpful</button><button type="button" data-act="fb" data-r="down" data-id="${m.id}" aria-pressed="${m.fb === 'down'}">Not right</button></span>` : '';
    return `<div class="msg a" data-id="${m.id}"><div class="md">${renderMarkdown(m.content)}</div>${src || fb ? `<div class="meta">${src}${fb}</div>` : ''}</div>`;
  }

  function render() {
    log.innerHTML = HELLO + messages.map(bubble).join('');
    log.scrollTop = log.scrollHeight;
  }

  let frame = 0;
  function renderLast() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const last = messages[messages.length - 1];
      const nodes = log.querySelectorAll('.msg');
      const node = nodes[nodes.length - 1];
      const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
      if (node && last) node.outerHTML = bubble(last);
      if (nearBottom) log.scrollTop = log.scrollHeight;
    });
  }

  function showLeft() {
    left.textContent = remaining === null ? '' : `${remaining} left today`;
  }

  function open() {
    panel.hidden = false;
    launch.setAttribute('aria-expanded', 'true');
    render();
    showLeft();
    input.focus();
  }
  function close() {
    panel.hidden = true;
    launch.setAttribute('aria-expanded', 'false');
    launch.focus();
  }

  async function readStream(res, onEvent) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let cut;
      while ((cut = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, cut);
        buf = buf.slice(cut + 2);
        const ev = (block.match(/^event: (.+)$/m) || [])[1];
        const data = (block.match(/^data: (.+)$/m) || [])[1];
        if (ev && data) { try { onEvent(ev, JSON.parse(data)); } catch { /* skip */ } }
      }
    }
  }

  async function send(text) {
    const q = String(text || '').trim();
    if (!q || busy) return;
    const found = findIdentifiers(q);
    if (found.length) { warn.textContent = identifierMessage(found); warn.hidden = false; return; }
    warn.hidden = true;
    busy = true;
    $('.send').disabled = true;
    const user = { id: 'm' + Date.now().toString(36), role: 'user', content: q };
    const reply = { id: 'm' + Date.now().toString(36) + 'r', role: 'assistant', content: '', status: 'loading', sources: [] };
    const history = messages.filter((m) => m.status !== 'error' && m.content).map((m) => ({ role: m.role, content: m.content }));
    messages.push(user, reply);
    input.value = '';
    autosize();
    render();
    const code = store.get('code', '');
    try {
      const res = await fetch(API + 'chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel: 'web', stream: true, device, code: code || undefined, messages: [...history, { role: 'user', content: q }].slice(-12) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        reply.status = 'error';
        reply.error = j.message || 'Something went wrong. Please try again.';
        if (j.error === 'invalid_code') { store.del('code'); reply.error += ' The saved code was removed; tap "Member code" to enter it again.'; }
        if (j.error === 'limit') remaining = 0;
        if (j.error === 'identifiers') { messages.splice(-2, 2); warn.textContent = j.message; warn.hidden = false; }
      } else {
        await readStream(res, (ev, data) => {
          if (ev === 'meta') {
            reply.sources = data.sources || [];
            if (typeof data.remaining === 'number') remaining = data.remaining;
          } else if (ev === 'delta') {
            reply.content += data.t;
            renderLast();
          } else if (ev === 'error') {
            reply.status = 'error';
            reply.error = data.message;
          } else if (ev === 'done' && reply.status === 'loading') {
            reply.status = 'done';
          }
        });
        if (reply.status === 'loading') {
          reply.status = reply.content ? 'done' : 'error';
          if (!reply.content) reply.error = 'The answer was cut off. Please try again.';
        }
      }
    } catch {
      reply.status = 'error';
      reply.error = navigator.onLine ? 'Could not reach the assistant. Please try again.' : 'You are offline. Connect to the internet and try again.';
    }
    busy = false;
    $('.send').disabled = false;
    session.set(messages);
    render();
    showLeft();
    live.textContent = reply.status === 'done' ? 'Answer ready.' : (reply.error || '');
  }

  async function saveCode() {
    const field = $('#cma-code');
    const code = field.value.trim().toUpperCase().replace(/\s+/g, '');
    if (code.length < 4) { warn.textContent = 'Type the access code you were given.'; warn.hidden = false; return; }
    try {
      const res = await fetch(API + 'verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { warn.textContent = j.message || 'That code could not be checked.'; warn.hidden = false; return; }
      store.set('code', code);
      field.value = '';
      $('.code').hidden = true;
      warn.hidden = true;
      remaining = null;
      showLeft();
      live.textContent = 'Code saved. You now have the members\' daily limit.';
      left.textContent = 'Member code saved';
    } catch {
      warn.textContent = 'Could not reach the server. Please try again.';
      warn.hidden = false;
    }
  }

  async function feedback(id, rating) {
    const i = messages.findIndex((m) => m.id === id);
    if (i < 0) return;
    const m = messages[i];
    m.fb = rating;
    session.set(messages);
    render();
    const q = (messages.slice(0, i).reverse().find((x) => x.role === 'user') || {}).content || '';
    try {
      await fetch(API + 'feedback', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rating, question: q, answer: m.content, sources: (m.sources || []).map((s) => s.id), channel: 'web' }),
      });
    } catch { /* offline */ }
    live.textContent = 'Thank you for the feedback.';
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  launch.addEventListener('click', open);
  $('form').addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  input.addEventListener('input', () => { autosize(); warn.hidden = true; });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) close(); });
  root.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) { send(chip.dataset.q); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'close') close();
    else if (act === 'new') { messages = []; session.set(messages); render(); input.focus(); }
    else if (act === 'code') { const c = $('.code'); c.hidden = !c.hidden; if (!c.hidden) $('#cma-code').focus(); }
    else if (act === 'save-code') saveCode();
    else if (act === 'fb') feedback(b.dataset.id, b.dataset.r);
  });
  $('#cma-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveCode(); } });

  if ((script && script.dataset.open === 'true') || location.hash === '#ask') open();
})();
