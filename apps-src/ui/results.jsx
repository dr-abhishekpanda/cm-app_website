/* Result building blocks: tables that copy cleanly into Word or Excel, report sentences,
 * and the method note every result carries. */
import { useState } from 'preact/hooks';
import { Icon, CopyButton } from './core.jsx';

/** A results table with a "Copy table" button that puts tab-separated text on the clipboard. */
export function DataTable({ columns, rows, caption, note, numeric = [] }) {
  const tsv = [columns.join('\t'), ...rows.map((r) => r.map((c) => (typeof c === 'object' && c?.text !== undefined ? c.text : c)).join('\t'))].join('\n');
  return (
    <div class="restable">
      <div class="tablewrap">
        <table class="table compact">
          {caption ? <caption>{caption}</caption> : null}
          <thead><tr>{columns.map((c, i) => <th scope="col" class={numeric.includes(i) ? 'num' : undefined}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => <tr>{r.map((c, i) => {
              const v = typeof c === 'object' && c?.text !== undefined ? c : { text: c };
              return i === 0 ? <th scope="row" class={v.cls}>{v.text}</th> : <td class={[numeric.includes(i) ? 'num' : '', v.cls || ''].join(' ').trim() || undefined}>{v.text}</td>;
            })}</tr>)}
          </tbody>
        </table>
      </div>
      <div class="copyrow">
        {note ? <p class="small" style="margin:0;flex:1">{note}</p> : <span style="flex:1" />}
        <CopyButton text={tsv} label="Copy table" />
      </div>
    </div>
  );
}

/** The sentence to paste into a results section. */
export function Report({ text, label = 'For your results section' }) {
  if (!text) return null;
  return (
    <div class="report">
      <p class="label">{label}</p>
      <p class="say">{text}</p>
      <div class="copyrow"><CopyButton text={text} /></div>
    </div>
  );
}

/** Small key-value grid for a test result. */
export function Stats({ items }) {
  return (
    <dl class="stats">
      {items.filter(Boolean).map(([k, v]) => <div><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  );
}

/** A collapsible note: method, assumptions, references. */
export function Disclose({ title, children, open: start = false }) {
  const [open, setOpen] = useState(start);
  return (
    <div class={`disclose${open ? ' open' : ''}`}>
      <button type="button" class="dhead" aria-expanded={open ? 'true' : 'false'} onClick={() => setOpen(!open)}>
        <span>{title}</span><Icon name="arrow" />
      </button>
      {open ? <div class="dbody prose">{children}</div> : null}
    </div>
  );
}

/** A reference list from the checked registry in modules/refs.js. */
export function Refs({ ids, refs }) {
  return (
    <ul class="refs">
      {ids.map((id) => {
        const r = refs[id];
        if (!r) return null;
        return <li>{r.text}{r.doi ? <> doi:<a href={`https://doi.org/${r.doi}`} rel="noopener" target="_blank">{r.doi}</a></> : null}</li>;
      })}
    </ul>
  );
}
