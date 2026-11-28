/* Pages the Worker draws from the notes: the public notes page (for people, and for the WhatsApp
 * agent to read), a plain-text export, and two admin pages (usage, and records for improving notes). */
import { html, text, escapeHtml, siteOrigin, istDay } from './util.js';
import { config } from './config.js';
import { kb } from './kb.js';
import { absoluteLinks, plainText } from '../../assistant/lib/kb-core.js';
import { renderMarkdown } from '../../assistant/lib/markdown.js';
import { store } from '../store.js';

const CREDIT = `<footer class="foot"><div class="in">
  <div class="credit">
    <p>&copy; Dr Abhishek Panda, Asst. Professor in Community Medicine</p>
    <p>Govt. Medical College &amp; Hospital, Sundaragada, Odisha</p>
    <p><span class="nw">Email: <a href="mailto:support@dr-abhishekpanda-cm.app">support@dr-abhishekpanda-cm.app</a>;</span>
       <span class="nw">WhatsApp: <a href="https://wa.me/917008909595" rel="noopener" target="_blank">(+91) 700-890-9595</a></span></p>
  </div>
</div></footer>`;

function shell({ title, description, body, robots = 'index,follow' }) {
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#0C5E4E">
<link rel="icon" href="/assistant/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assistant/fonts/fonts.css">
<link rel="stylesheet" href="/brand/ews.css">
<link rel="stylesheet" href="/assistant/assistant.css">
</head>
<body>
<div class="app">
<a class="skip" href="#main">Skip to content</a>
<div class="grid-bg" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
<header class="top"><div class="in">
  <a class="brand" href="/assistant/" aria-label="Clinic Assistant home"><span class="mark" aria-hidden="true">C</span><span class="nm">CLINIC ASSISTANT</span></a>
  <span class="sp"></span>
  <a class="btn ghost small" href="/assistant/">Open the app</a>
</div></header>
<main class="page" id="main" tabindex="-1">
${body}
</main>
${CREDIT}
</div>
</body>
</html>`;
}

export function notesPage(request, env) {
  const { kb: data } = kb();
  const origin = siteOrigin(request, env);
  const list = data.entries.map((e) => `<li><a href="#${e.id}">${escapeHtml(e.title)}</a></li>`).join('');
  const notes = data.entries.map((e) => `
<article class="note" id="${e.id}" data-text="${escapeHtml((e.title + ' ' + e.tags.join(' ') + ' ' + e.text).toLowerCase())}">
  <h2>${escapeHtml(e.title)}</h2>
  <p class="note-meta">${e.updated ? `Updated <time datetime="${escapeHtml(e.updated)}">${escapeHtml(e.updated)}</time>` : ''}${e.source ? ` · Source: ${escapeHtml(e.source)}` : ''}</p>
  <div class="md">${renderMarkdown(absoluteLinks(e.body, origin), { headingOffset: 2, siteOrigin: origin })}</div>
  <p class="note-link"><a href="#top">Back to the list</a></p>
</article>`).join('');
  const body = `
<h1 class="pg-title" id="top">Clinic Assistant <em>notes</em></h1>
<p class="lede">Checked notes for members of the Digital &amp; AI Fluency Clinic for Healthcare Professionals, written by Dr. Abhishek Panda. ${data.entries.length} notes${data.meta.updated ? `, last updated ${escapeHtml(data.meta.updated)}` : ''}.</p>
<p class="small">The <a href="/assistant/">Clinic Assistant app</a> answers from these notes and keeps them on your phone for offline use.</p>
<div class="field notes-filter"><label for="filter">Find a note</label><input id="filter" type="search" placeholder="For example: disclosure, NotebookLM, access code" autocomplete="off"></div>
<nav aria-label="Notes" class="toc"><ol>${list}</ol></nav>
<div class="notes">${notes}</div>
<script>
(function(){var f=document.getElementById('filter');if(!f)return;var n=[].slice.call(document.querySelectorAll('.note'));
f.addEventListener('input',function(){var q=f.value.trim().toLowerCase();n.forEach(function(a){a.hidden=q&&a.getAttribute('data-text').indexOf(q)<0;});});})();
</script>`;
  return html(shell({
    title: 'Clinic Assistant notes · Digital & AI Fluency Clinic',
    description: 'Checked notes on using AI and digital tools safely, for healthcare professionals in the Digital & AI Fluency Clinic.',
    body,
  }), 200, { 'cache-control': 'public, max-age=300' });
}

export function kbPlainText(request, env) {
  const { kb: data } = kb();
  const origin = siteOrigin(request, env);
  const parts = [
    `${data.meta.title}`,
    `Digital & AI Fluency Clinic for Healthcare Professionals. Written by Dr. Abhishek Panda. Updated ${data.meta.updated}.`,
    `Online: ${origin}/assistant/notes/`,
  ];
  for (const e of data.entries) {
    parts.push(['='.repeat(60), e.title, e.updated ? `Updated: ${e.updated}` : '', `Link: ${origin}/assistant/notes/#${e.id}`, '',
      plainText(absoluteLinks(e.body, origin))].filter((l) => l !== null).join('\n'));
  }
  return text(parts.join('\n\n') + '\n', 200, { 'cache-control': 'public, max-age=300' });
}

function adminShell(title, body) {
  return shell({ title, description: title, body, robots: 'noindex,nofollow' });
}

export async function adminStats(request, env) {
  const C = config(env);
  const rows = await store(env).countersWithPrefix('s:');
  const byDay = new Map();
  for (const r of rows) {
    const [, day, ...rest] = r.k.split(':');
    const key = rest.join(':');
    if (!byDay.has(day)) byDay.set(day, {});
    byDay.get(day)[key] = r.n;
  }
  const days = [...byDay.keys()].sort().reverse().slice(0, 30);
  const tr = days.map((d) => {
    const v = byDay.get(d);
    return `<tr><td class="mono">${d}</td><td>${v['msg:web'] || 0}</td><td>${v['msg:pwa'] || 0}</td><td>${v['msg:telegram'] || 0}</td>` +
      `<td class="mono">${(v.tok_in || 0).toLocaleString('en-IN')}</td><td class="mono">${(v.tok_out || 0).toLocaleString('en-IN')}</td></tr>`;
  }).join('') || '<tr><td colspan="6">No messages yet.</td></tr>';
  const body = `<h1 class="pg-title">Usage</h1>
<p class="lede">Messages answered by the AI each day (IST), and the tokens they used. Today is ${istDay()}.</p>
<p class="small">Limits now: website ${C.openPerDevice} per device and ${C.openTotal} in total a day; members ${C.memberPerUser} each and ${C.memberTotal} in total a day.
Models: ${escapeHtml(C.modelGeneral)} (website, Telegram), ${escapeHtml(C.modelGrounded)} (app). Multiply tokens by the model's price per million on Anthropic's pricing page for the cost.</p>
<div class="table"><table><thead><tr><th>Day</th><th>Website</th><th>App</th><th>Telegram</th><th>Input tokens</th><th>Output tokens</th></tr></thead><tbody>${tr}</tbody></table></div>`;
  return html(adminShell('Clinic Assistant usage', body), 200, { 'cache-control': 'no-store' });
}

export async function adminRecords(request, env) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') === 'feedback' ? 'feedback' : 'unanswered';
  const events = await store(env).listEvents(kind, 300);
  const key = encodeURIComponent(url.searchParams.get('key') || '');
  const rows = events.map((e) => {
    const b = e.body || {};
    const when = new Date(e.ts + 5.5 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16);
    return kind === 'feedback'
      ? `<tr><td class="mono">${when}</td><td>${escapeHtml(e.channel)}</td><td>${escapeHtml(b.rating || '')}</td><td>${escapeHtml(b.q || '')}</td><td>${escapeHtml((b.a || '').slice(0, 400))}</td><td>${escapeHtml(b.note || '')}</td></tr>`
      : `<tr><td class="mono">${when}</td><td>${escapeHtml(e.channel)}</td><td>${escapeHtml(b.q || '')}</td></tr>`;
  }).join('') || `<tr><td colspan="${kind === 'feedback' ? 6 : 3}">Nothing recorded yet.</td></tr>`;
  const head = kind === 'feedback'
    ? '<tr><th>When (IST)</th><th>Where</th><th>Rating</th><th>Question</th><th>Answer</th><th>Comment</th></tr>'
    : '<tr><th>When (IST)</th><th>Where</th><th>Question with no matching note</th></tr>';
  const body = `<h1 class="pg-title">${kind === 'feedback' ? 'Feedback on answers' : 'Questions the notes could not answer'}</h1>
<p class="lede">Use these to add or correct notes in <span class="mono">assistant/kb/clinic-kb.md</span>. Records are deleted automatically after ${config(env).keepDays} days.</p>
<p class="small"><a href="?kind=unanswered&amp;key=${key}">Unanswered questions</a> · <a href="?kind=feedback&amp;key=${key}">Feedback</a></p>
<div class="table"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
  return html(adminShell('Clinic Assistant records', body), 200, { 'cache-control': 'no-store' });
}
