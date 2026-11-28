/* Clinic Assistant: knowledge-base parser and search.
 * One file, shared by the installable app (runs in the browser, offline) and the Worker (server), so a
 * question finds the same notes everywhere. Pure functions only: no DOM, no network, no dependencies.
 *
 * The knowledge base is one Markdown file (assistant/kb/clinic-kb.md):
 *   ## Note title
 *   id: short-id                (optional; made from the title if missing)
 *   tags: words, people, may type
 *   updated: 2026-11-26
 *   source: where the facts come from
 *   status: draft               (optional; hides the note)
 *
 *   The note itself, in Markdown.
 * Search is BM25 over title, tags and text, with prefix and one-letter-typo matching, so short or
 * misspelt questions still find the right note. Each result says how well it matched. */

const META_KEYS = new Set(['id', 'tags', 'updated', 'source', 'status', 'audience']);
const HIDDEN_STATUS = new Set(['draft', 'hidden', 'retired']);
const ZERO_WIDTH = /[​-‍⁠﻿­]/g;
const STOP = new Set((
  'a about above after again all also am an and any are as at be because been before being below between both but by ' +
  'can could did do does doing done down during each either else ever every few for from further get gets got had has ' +
  'have having he her here hers him his how however i if in into is it its itself just know let like me more most much ' +
  'must my need no nor not now of off on once only or other our ours out over own please put same set shall she should so ' +
  'some such tell than that the their theirs them then there these they this those through to too under until up upon ' +
  'us very via vs want was we were what when where which while who whom why will with would yes yet you your yours'
).split(' '));

const W_TITLE = 3;
const W_TAGS = 2.5;
const W_BODY = 1;
const K1 = 1.2;
const B = 0.75;

/* ---------------------------------------------------------------- text helpers ---------- */

export function slugify(text) {
  return String(text || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'note';
}

function dedouble(w) {
  return /([b-df-hj-km-np-tv-z])\1$/.test(w) && !/(ll|ss|zz)$/.test(w) ? w.slice(0, -1) : w;
}

/* Light English stemming: enough to match "prompting" with "prompt" and "settings" with "setting". */
export function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 5 && w.endsWith('ing')) return dedouble(w.slice(0, -3));
  if (w.length > 4 && w.endsWith('ed') && !w.endsWith('eed')) return dedouble(w.slice(0, -2));
  if (w.length > 4 && /(ches|shes|xes|sses|zes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

/* Words for search. Works for English and for Indian scripts (letters plus their vowel signs). */
export function tokenize(text) {
  const out = [];
  const norm = String(text || '').normalize('NFKC').toLowerCase().replace(ZERO_WIDTH, '');
  for (const raw of norm.split(/[^\p{L}\p{M}\p{N}]+/u)) {
    if (!raw) continue;
    if (/^[a-z]+$/.test(raw)) {
      if (raw.length < 2 || STOP.has(raw)) continue;
      out.push(stem(raw));
    } else if (/^[a-z0-9]+$/.test(raw)) {
      if (raw.length < 2) continue;      // keeps 108, 2026, gpt4, h1n1
      out.push(raw);
    } else {
      if ([...raw].length < 2) continue;  // Odia, Hindi and other scripts, kept as typed
      out.push(raw);
    }
  }
  return out;
}

/* Markdown to plain text, for snippets, the plain-text export and the AI prompt. */
export function plainText(md) {
  return String(md || '')
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?!\w)/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* Relative links in notes ("/research-app/") become full links for Telegram, WhatsApp and exports. */
export function absoluteLinks(md, origin) {
  if (!origin) return md;
  const base = String(origin).replace(/\/+$/, '');
  return String(md || '').replace(/\]\((\/(?!\/)[^)\s]*)\)/g, (m, path) => '](' + base + path + ')');
}

/* ---------------------------------------------------------------- parsing --------------- */

export function parseKB(text) {
  let src = String(text || '').replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const meta = { title: 'Clinic Assistant Notes', updated: '', intro: '' };

  const fm = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^\s*([A-Za-z_]+)\s*:\s*(.*?)\s*$/);
      if (m) meta[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, '');
    }
    src = src.slice(fm[0].length);
  }

  const parts = src.split(/^##[ \t]+/m);
  const head = parts.shift() || '';
  const h1 = head.match(/^#[ \t]+(.+?)\s*$/m);
  if (h1) meta.title = h1[1].trim();
  meta.intro = head.replace(/^#[ \t]+.+$/m, '').trim();

  const entries = [];
  const seen = new Set();
  for (const part of parts) {
    const lines = part.split('\n');
    const title = (lines.shift() || '').replace(/\s+#+\s*$/, '').trim();
    if (!title) continue;
    const info = {};
    while (lines.length) {
      const line = lines[0];
      if (!line.trim()) { if (Object.keys(info).length) break; lines.shift(); continue; }
      const m = line.match(/^\s*([A-Za-z]+)\s*:\s*(.*?)\s*$/);
      if (!m || !META_KEYS.has(m[1].toLowerCase())) break;
      info[m[1].toLowerCase()] = m[2];
      lines.shift();
    }
    if (HIDDEN_STATUS.has(String(info.status || '').toLowerCase())) continue;
    let id = slugify(info.id || title);
    while (seen.has(id)) id += '-2';
    seen.add(id);
    // Lines that still hold an [INSERT: ...] placeholder stay hidden until the owner fills them in.
    const body = lines.filter((l) => !l.includes('[INSERT:')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    entries.push({
      id,
      title,
      tags: (info.tags || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean),
      updated: info.updated || meta.updated || '',
      source: info.source || '',
      body,
      text: plainText(body),
    });
  }
  return { meta, entries };
}

/* ---------------------------------------------------------------- index ----------------- */

function counts(tokens) {
  const m = new Map();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

export function buildIndex(kb) {
  const docs = kb.entries.map((e) => {
    const title = counts(tokenize(e.title));
    const tags = counts(tokenize(e.tags.join(' ')));
    const body = counts(tokenize(e.text));
    const terms = new Set([...title.keys(), ...tags.keys(), ...body.keys()]);
    const len = W_TITLE * sum(title) + W_TAGS * sum(tags) + W_BODY * sum(body);
    return { entry: e, title, tags, body, terms, len };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.terms) df.set(t, (df.get(t) || 0) + 1);
  const avgLen = docs.length ? docs.reduce((a, d) => a + d.len, 0) / docs.length : 1;
  return { meta: kb.meta, docs, df, vocab: [...df.keys()], avgLen, n: docs.length };
}

function sum(map) { let s = 0; for (const v of map.values()) s += v; return s; }

/* Edit distance with swapped neighbours counted as one edit ("chatgtp" is one slip from "chatgpt"). */
function editDistanceAtMost(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev2 = null;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return false;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length] <= max;
}

/* Index words that stand for one query word: the word itself, words it begins (or that begin it),
 * then near-misspellings. Weights say how much each kind of match counts. */
function expand(index, q) {
  if (index.df.has(q)) return [[q, 1]];
  const out = [];
  if ([...q].length >= 3) {
    for (const v of index.vocab) {
      if ((v.startsWith(q)) || (q.startsWith(v) && [...v].length >= 5)) out.push([v, 0.7]);
      if (out.length >= 8) break;
    }
  }
  if (!out.length && [...q].length >= 5) {
    const max = [...q].length >= 9 ? 2 : 1;
    for (const v of index.vocab) {
      if (editDistanceAtMost(q, v, max)) out.push([v, 0.5]);
      if (out.length >= 4) break;
    }
  }
  return out;
}

function idf(index, t) {
  const df = index.df.get(t) || 0;
  return Math.log(1 + (index.n - df + 0.5) / (df + 0.5));
}

function bestSnippet(entry, terms) {
  const sentences = entry.text.replace(/\n+/g, ' ').split(/(?<=[.!?;:])\s+/).filter((s) => s.length > 20);
  if (!sentences.length) return entry.text.slice(0, 200);
  let best = sentences[0];
  let bestHits = -1;
  for (const s of sentences) {
    const toks = new Set(tokenize(s));
    let hits = 0;
    for (const t of terms) if (toks.has(t)) hits++;
    if (hits > bestHits) { best = s; bestHits = hits; }
  }
  return best.length > 220 ? best.slice(0, 217).replace(/\s+\S*$/, '') + '...' : best;
}

/* Returns notes in order of fit. confidence: "high" (answers the question), "medium" (related),
 * "low" (shares a word or two). Callers decide what to show for each level. relative (0 to 1) drops
 * notes that score below that share of the best note, so a weak second match does not ride along. */
export function search(index, query, { limit = 3, minConfidence = 'low', relative = 0 } = {}) {
  const qTerms = [...new Set(tokenize(query))];
  if (!qTerms.length || !index.n) return [];
  const expanded = qTerms.map((q) => expand(index, q));
  const scored = [];
  for (const d of index.docs) {
    let score = 0;
    let matched = 0;
    const hitTerms = [];
    expanded.forEach((alts) => {
      let best = 0;
      let bestTerm = null;
      for (const [t, w] of alts) {
        if (!d.terms.has(t)) continue;
        const wtf = W_TITLE * (d.title.get(t) || 0) + W_TAGS * (d.tags.get(t) || 0) + W_BODY * (d.body.get(t) || 0);
        const s = w * idf(index, t) * (wtf * (K1 + 1)) / (wtf + K1 * (1 - B + B * d.len / index.avgLen));
        if (s > best) { best = s; bestTerm = t; }
      }
      if (best > 0) { score += best; matched++; hitTerms.push(bestTerm); }
    });
    if (!matched) continue;
    const coverage = matched / qTerms.length;
    const titleTerms = tokenize(d.entry.title);
    const titleHits = hitTerms.filter((t) => titleTerms.includes(t)).length;
    if (titleHits && titleHits === titleTerms.length) score += 1.5;   // whole title asked for
    scored.push({ d, score, coverage, hitTerms });
  }
  scored.sort((a, b) => b.score - a.score);
  const rank = { low: 0, medium: 1, high: 2 };
  const out = [];
  const floor = scored.length ? scored[0].score * relative : 0;
  for (const s of scored) {
    if (s.score < floor) break;
    let confidence = 'low';
    if (s.coverage >= 0.6 && s.score >= 3) confidence = 'high';
    else if (s.coverage >= 0.34 && s.score >= 1.5) confidence = 'medium';
    if (rank[confidence] < rank[minConfidence]) continue;
    const e = s.d.entry;
    out.push({
      id: e.id, title: e.title, tags: e.tags, updated: e.updated, source: e.source, body: e.body, text: e.text,
      score: Math.round(s.score * 100) / 100, coverage: Math.round(s.coverage * 100) / 100, confidence,
      snippet: bestSnippet(e, s.hitTerms),
    });
    if (out.length >= limit) break;
  }
  return out;
}

/* Convenience for callers that keep one parsed copy. */
export function loadKB(text) {
  const kb = parseKB(text);
  const index = buildIndex(kb);
  return { kb, index, search: (q, opts) => search(index, q, opts) };
}
