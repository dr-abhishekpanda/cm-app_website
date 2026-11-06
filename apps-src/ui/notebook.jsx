/* "My results": sentences and tables collected from any tool, kept on this device (browser storage,
 * under the app's own key) so a write-up can be assembled across analyses and sessions.
 * Nothing leaves the device. If storage is blocked, the list still works for this session. */
import { useState, useEffect } from 'preact/hooks';
import { store, useSettings, Icon } from './core.jsx';

const MAX_ITEMS = 200;
let state = { key: null, items: [], saved: true };
const subs = new Set();

function load(appId) {
  const key = `${appId}:results`;
  if (state.key === key) return;
  const items = store.get(key, []);
  state = { key, items: Array.isArray(items) ? items : [], saved: true };
}
function commit(items) {
  state = { ...state, items, saved: store.set(state.key, items) };
  subs.forEach((f) => f(state));
}

/** The collected results and the actions on them. */
export function useNotebook() {
  const { appId } = useSettings();
  load(appId);
  const [s, setS] = useState(state);
  useEffect(() => { subs.add(setS); setS(state); return () => subs.delete(setS); }, []);
  return {
    items: s.items,
    saved: s.saved,
    add(item) {
      const it = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), ...item };
      commit([...state.items, it].slice(-MAX_ITEMS));
      return it.id;
    },
    update(id, patch) { commit(state.items.map((x) => (x.id === id ? { ...x, ...patch } : x))); },
    remove(id) { commit(state.items.filter((x) => x.id !== id)); },
    move(id, d) {
      const a = [...state.items];
      const i = a.findIndex((x) => x.id === id), j = i + d;
      if (i < 0 || j < 0 || j >= a.length) return;
      [a[i], a[j]] = [a[j], a[i]];
      commit(a);
    },
    clear() { commit([]); },
  };
}

/** The title of the page the result came from (its h1), for labelling. */
const pageTitle = () => (typeof document !== 'undefined' ? (document.querySelector('main h1')?.textContent || '').trim() : '');

/** A button that adds a sentence or a table to My results. item: { kind: 'text', text } or { kind: 'table', title, columns, rows, note }. */
export function AddToResults({ item, label = 'Add to my results' }) {
  const nb = useNotebook();
  const [done, setDone] = useState(false);
  const add = () => {
    const it = typeof item === 'function' ? item() : item;
    nb.add({ source: pageTitle(), ...it });
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  };
  return (
    <button type="button" class="btn ghost small" onClick={add}>
      <Icon name={done ? 'check' : 'plus'} /> {done ? 'Added to my results' : label}
    </button>
  );
}

/* ----------------------------------------------------------- exporting --- */

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Plain text of the whole list: sentences as paragraphs, tables tab-separated. */
export function notebookText(items) {
  return items.map((it) => (it.kind === 'table'
    ? [it.title, it.columns.join('\t'), ...it.rows.map((r) => r.join('\t')), ...(it.note ? [it.note] : [])].filter(Boolean).join('\n')
    : it.text)).join('\n\n');
}

/** HTML for Word: paragraphs and real tables with a caption and footnote. */
export function notebookHtml(items) {
  const td = 'border:1px solid #999;padding:3px 6px;font-family:Calibri,Arial,sans-serif;font-size:10pt';
  return items.map((it) => (it.kind === 'table'
    ? `<p style="font-family:Calibri,Arial,sans-serif;font-size:11pt"><b>${esc(it.title)}</b></p><table style="border-collapse:collapse"><thead><tr>${it.columns.map((c) => `<th style="${td};text-align:left">${esc(c)}</th>`).join('')}</tr></thead><tbody>${it.rows.map((r) => `<tr>${r.map((c, i) => `<td style="${td}${i ? ';text-align:right' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>${it.note ? `<p style="font-family:Calibri,Arial,sans-serif;font-size:9pt">${esc(it.note)}</p>` : ''}`
    : `<p style="font-family:Calibri,Arial,sans-serif;font-size:11pt">${esc(it.text)}</p>`)).join('\n');
}
