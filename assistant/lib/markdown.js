/* Clinic Assistant: a small, safe Markdown renderer.
 * Used for AI answers and notes in the app and the website chat (flavour "html"), for the notes
 * page the Worker serves, and for Telegram replies (flavour "telegram", Telegram's HTML subset).
 * Everything is escaped first; only http(s), mailto, tel, site-relative and #anchor links survive,
 * so text from the AI can never inject markup or scripts. */

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeUrl(raw, opts) {
  const u = String(raw || '').trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^\/(?!\/)/.test(u)) return opts.baseUrl ? opts.baseUrl.replace(/\/+$/, '') + u : (opts.flavour === 'telegram' ? null : u);
  if (/^#[\w-]*$/.test(u)) return opts.flavour === 'telegram' ? null : u;
  return null;
}

const TAGS = {
  html: { b: 'strong', i: 'em', s: 'del' },
  telegram: { b: 'b', i: 'i', s: 's' },
};

/* Bold, italic and strikethrough, on text that is already escaped. */
function emphasis(h, flavour) {
  const t = TAGS[flavour];
  return h
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, `<${t.b}>$1</${t.b}>`)
    .replace(/__(?=\S)([\s\S]*?\S)__/g, `<${t.b}>$1</${t.b}>`)
    .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?!\w)/g, `$1<${t.i}>$2</${t.i}>`)
    .replace(/(^|[^_\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, `$1<${t.i}>$2</${t.i}>`)
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, `<${t.s}>$1</${t.s}>`);
}

function link(url, inner, opts) {
  const external = /^https?:/i.test(url) && !(opts.siteOrigin && url.startsWith(opts.siteOrigin));
  if (opts.flavour === 'telegram') return `<a href="${escapeHtml(url)}">${inner}</a>`;
  return `<a href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${inner}</a>`;
}

const LINK_RE = /\[([^\]\n]{1,300})\]\(([^)\s]{1,600})(?:\s+"[^"]*")?\)|(https?:\/\/[^\s<>()"']+[^\s<>()"'.,;:!?])/g;

function inlineNoCode(s, opts) {
  let out = '';
  let last = 0;
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(s))) {
    out += emphasis(escapeHtml(s.slice(last, m.index)), opts.flavour);
    if (m[1] !== undefined) {
      const url = safeUrl(m[2], opts);
      out += url ? link(url, emphasis(escapeHtml(m[1]), opts.flavour), opts) : emphasis(escapeHtml(m[1]), opts.flavour);
    } else {
      out += link(m[3], escapeHtml(m[3]), opts);
    }
    last = LINK_RE.lastIndex;
  }
  return out + emphasis(escapeHtml(s.slice(last)), opts.flavour);
}

export function renderInline(text, opts = {}) {
  const o = { flavour: 'html', ...opts };
  return String(text).split(/(`[^`\n]+`)/g).map((p) =>
    /^`[^`\n]+`$/.test(p) ? `<code>${escapeHtml(p.slice(1, -1))}</code>` : inlineNoCode(p, o)
  ).join('');
}

/* ---------------------------------------------------------------- blocks --------------- */

const LIST_RE = /^(\s*)([-*+•]|\d{1,3}[.)])\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function isBlockStart(line, next) {
  return /^\s*(```|~~~)/.test(line) || /^#{1,6}\s/.test(line) || /^\s*>/.test(line) ||
    LIST_RE.test(line) || /^\s*([-*_])(\s*\1){2,}\s*$/.test(line) ||
    (line.includes('|') && next !== undefined && TABLE_SEP.test(next));
}

function cells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function parseList(lines, start, opts, depth) {
  const first = lines[start].match(LIST_RE);
  const indent = first[1].replace(/\t/g, '    ').length;
  const ordered = /\d/.test(first[2]);
  const items = [];
  let i = start;
  while (i < lines.length) {
    const m = lines[i].match(LIST_RE);
    if (!m) {
      const line = lines[i];
      if (!line.trim()) {
        const nxt = lines[i + 1];
        const nm = nxt && nxt.match(LIST_RE);
        if (nm && nm[1].replace(/\t/g, '    ').length >= indent) { i++; continue; }
        break;
      }
      if (items.length && /^\s+/.test(line) && !isBlockStart(line.trim(), lines[i + 1])) {
        items[items.length - 1].text.push(line.trim());
        i++;
        continue;
      }
      break;
    }
    const ind = m[1].replace(/\t/g, '    ').length;
    if (ind < indent) break;
    if (ind > indent + 1) {
      if (!items.length) break;
      const sub = parseList(lines, i, opts, depth + 1);
      items[items.length - 1].sub.push(sub.out);
      i = sub.next;
      continue;
    }
    items.push({ text: [m[3]], sub: [], num: parseInt(m[2], 10) });
    i++;
  }
  let out;
  if (opts.flavour === 'telegram') {
    const pad = '   '.repeat(depth);
    out = items.map((it, k) => {
      const mark = ordered ? `${Number.isFinite(it.num) ? it.num : k + 1}.` : (depth ? '◦' : '•');
      return pad + mark + ' ' + it.text.map((t) => renderInline(t, opts)).join('\n' + pad + '  ') +
        (it.sub.length ? '\n' + it.sub.join('\n') : '');
    }).join('\n');
  } else {
    const tag = ordered ? 'ol' : 'ul';
    const startAttr = ordered && items[0] && items[0].num > 1 ? ` start="${items[0].num}"` : '';
    out = `<${tag}${startAttr}>` + items.map((it) =>
      '<li>' + it.text.map((t) => renderInline(t, opts)).join('<br>') + it.sub.join('') + '</li>'
    ).join('') + `</${tag}>`;
  }
  return { out, next: i };
}

export function renderMarkdown(src, options = {}) {
  const opts = { flavour: 'html', headingOffset: 0, ...options };
  const tg = opts.flavour === 'telegram';
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^\s*(```|~~~)\s*([\w+-]*)\s*$/);
    if (fence) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) { buf.push(lines[i]); i++; }
      i++;
      const code = escapeHtml(buf.join('\n'));
      out.push(tg ? `<pre>${code}</pre>` : `<pre><code>${code}</code></pre>`);
      continue;
    }
    if (!line.trim()) { i++; continue; }

    let m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) {
      if (tg) out.push(`<b>${renderInline(m[2], opts)}</b>`);
      else {
        const lvl = Math.min(6, m[1].length + opts.headingOffset);
        out.push(`<h${lvl}>${renderInline(m[2], opts)}</h${lvl}>`);
      }
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push(tg ? '———' : '<hr>'); i++; continue; }

    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      out.push(`<blockquote>${renderMarkdown(buf.join('\n'), opts)}</blockquote>`);
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const rows = [line];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(lines[i]); i++; }
      if (tg) {
        out.push(`<pre>${escapeHtml(rows.map((r) => cells(r).join(' | ')).join('\n'))}</pre>`);
      } else {
        const head = cells(rows[0]).map((c) => `<th>${renderInline(c, opts)}</th>`).join('');
        const body = rows.slice(1).map((r) => '<tr>' + cells(r).map((c) => `<td>${renderInline(c, opts)}</td>`).join('') + '</tr>').join('');
        out.push(`<div class="md-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
      }
      continue;
    }

    if (LIST_RE.test(line)) {
      const res = parseList(lines, i, opts, 0);
      out.push(res.out);
      i = res.next;
      continue;
    }

    const buf = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i], lines[i + 1])) { buf.push(lines[i].trim()); i++; }
    const joined = buf.map((l) => renderInline(l, opts)).join(tg ? '\n' : '<br>');
    out.push(tg ? joined : `<p>${joined}</p>`);
  }
  return out.join(tg ? '\n\n' : '\n');
}

/* Telegram allows 4,096 characters a message. Split the Markdown at paragraph breaks first, then
 * render each piece, so no tag is ever cut in half. */
export function splitForTelegram(md, max = 3500) {
  const parts = [];
  let cur = '';
  for (const para of String(md || '').split(/\n{2,}/)) {
    if ((cur + '\n\n' + para).length > max && cur) { parts.push(cur); cur = ''; }
    if (para.length > max) {
      for (let k = 0; k < para.length; k += max) parts.push(para.slice(k, k + max));
      continue;
    }
    cur = cur ? cur + '\n\n' + para : para;
  }
  if (cur) parts.push(cur);
  return parts;
}
