/* The working dataset: one per app session, shared by Describe, Run a test and later modules.
 * It lives only in this page's memory; nothing is uploaded or stored. */
import { useState, useEffect } from 'preact/hooks';
import { readDataset } from '../engine/data.js';
import { count } from '../engine/format.js';
import { Callout, useId } from './core.jsx';
import { exampleCsv } from '../engine/examples.js';

let current = null;
const subs = new Set();
export function setDataset(ds) { current = ds; subs.forEach((f) => f(ds)); }
export function useDataset() {
  const [ds, set] = useState(current);
  useEffect(() => { subs.add(set); set(current); return () => subs.delete(set); }, []);
  return ds;
}

/* --------------------------------------------------------- example data --- */

export { exampleCsv, exampleTbCsv, exampleAgreementCsv } from '../engine/examples.js';

const SOURCE_LABELS = {
  example: 'example data (simulated, not real patients)',
  'example-tb': 'example TB cohort (simulated, not real patients)',
  'example-agree': 'example screening-camp data (simulated, not real children)',
};

/* ------------------------------------------------------------ the panel --- */

export function DataPanel({ compact, examples = [{ label: 'Load example data', csv: exampleCsv, source: 'example' }] }) {
  const ds = useDataset();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(!ds);
  const [err, setErr] = useState('');
  const fileId = useId('file');
  const load = (t, source) => {
    const d = readDataset(t);
    if (!d.n || !d.columns.length) { setErr('No rows found. Paste cells copied from a spreadsheet, with column names in the first row.'); return; }
    setErr('');
    setDataset({ ...d, source });
    setOpen(false);
  };
  const onFile = (e) => {
    const f = e.currentTarget.files?.[0];
    if (!f) return;
    if (f.size > 20e6) { setErr('That file is over 20 MB. Save a smaller CSV with only the columns you need.'); return; }
    const rd = new FileReader();
    rd.onload = () => load(String(rd.result), f.name);
    rd.onerror = () => setErr('The file could not be read. Save it as CSV (comma-separated) and try again.');
    rd.readAsText(f);
  };
  return (
    <section class="panel datapanel" aria-labelledby="data-h">
      <div class="dp-head">
        <h2 id="data-h">Your data</h2>
        {ds ? <p class="small">{count(ds.n)} rows {'·'} {ds.columns.length} columns {'·'} {SOURCE_LABELS[ds.source] || ds.source}</p> : null}
        {ds ? <button type="button" class="btn ghost small" onClick={() => setOpen((v) => !v)} aria-expanded={open ? 'true' : 'false'}>{open ? 'Hide' : 'Replace or view'}</button> : null}
      </div>
      {ds && !compact ? (
        <div class="colchips" aria-label="Columns">
          {ds.columns.map((c) => (
            <span class={`colchip ${c.numeric ? 'num' : 'cat'}`} title={c.numeric ? 'Numeric' : `Categorical: ${c.levels.length} values`}>
              <span class="ty">{c.numeric ? '123' : 'Abc'}</span>{c.name}{c.missing ? <span class="ms">{c.missing} missing</span> : null}
            </span>
          ))}
        </div>
      ) : null}
      {ds?.warnings?.length ? <Callout kind="warn" mark="Check">{ds.warnings.map((w) => <p>{w}</p>)}</Callout> : null}
      {open ? (
        <div class="stack">
          <p class="small">Copy the cells in Excel or Google Sheets, column names in the first row, and paste them here. Everything stays on this device.</p>
          <textarea class="paste" rows={6} value={text} onInput={(e) => setText(e.currentTarget.value)}
            placeholder={'Age\tResidence\tHb\n24\tRural\t10.2\n31\tUrban\t11.6'} aria-label="Paste data" spellcheck={false} />
          {err ? <p class="err" role="alert">{err}</p> : null}
          <div class="btn-row">
            <button type="button" class="btn primary small" onClick={() => load(text, 'pasted data')} disabled={!text.trim()}>Use pasted data</button>
            <label class="btn ghost small" for={fileId}>Open a CSV file</label>
            <input id={fileId} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" class="vh" onChange={onFile} />
            {examples.map((ex) => <button type="button" class="btn ghost small" onClick={() => load(ex.csv(), ex.source)}>{ex.label}</button>)}
            {ds ? <button type="button" class="btn ghost small" onClick={() => { setDataset(null); setText(''); }}>Clear</button> : null}
          </div>
          {ds ? <Preview ds={ds} /> : null}
        </div>
      ) : null}
    </section>
  );
}

function Preview({ ds }) {
  const rows = Math.min(8, ds.n);
  return (
    <div class="tablewrap">
      <table class="table compact">
        <caption class="vh">First {rows} rows</caption>
        <thead><tr>{ds.columns.map((c) => <th scope="col">{c.name}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => <tr>{ds.columns.map((c) => <td>{c.raw[i]}</td>)}</tr>)}
        </tbody>
      </table>
      {ds.n > rows ? <p class="small">First {rows} of {count(ds.n)} rows.</p> : null}
    </div>
  );
}

/** Pick a column. kind: 'numeric' | 'group' (2 to maxLevels distinct values) | 'any'. */
export function ColumnSelect({ ds, label, value, onChange, kind = 'numeric', maxLevels = 20, minLevels = 2, allowNone, hint, exclude = [] }) {
  const id = useId('col');
  const ok = ds.columns.filter((c) => !exclude.includes(c.name) && (kind === 'numeric' ? c.numeric
    : kind === 'group' ? c.levels.length >= minLevels && c.levels.length <= maxLevels : true));
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <select id={id} value={value || ''} onChange={(e) => onChange(e.currentTarget.value || null)}>
        {allowNone || !value ? <option value="">{allowNone ? 'None' : 'Choose a column'}</option> : null}
        {ok.map((c) => <option value={c.name}>{c.name}{kind === 'group' ? ` (${c.levels.length} groups)` : ''}</option>)}
      </select>
      {hint ? <div class="hint">{hint}</div> : null}
      {!ok.length ? <div class="hint">No suitable column: {kind === 'numeric' ? 'needs numbers only' : `needs ${minLevels} to ${maxLevels} distinct values`}.</div> : null}
    </div>
  );
}

export const col = (ds, name) => ds?.columns.find((c) => c.name === name) || null;
