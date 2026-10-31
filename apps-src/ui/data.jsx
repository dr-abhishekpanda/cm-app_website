/* The working dataset: one per app session, shared by Describe, Run a test and later modules.
 * It lives only in this page's memory; nothing is uploaded or stored. */
import { useState, useEffect } from 'preact/hooks';
import { readDataset } from '../engine/data.js';
import { count } from '../engine/format.js';
import { Callout, useId } from './core.jsx';

let current = null;
const subs = new Set();
export function setDataset(ds) { current = ds; subs.forEach((f) => f(ds)); }
export function useDataset() {
  const [ds, set] = useState(current);
  useEffect(() => { subs.add(set); set(current); return () => subs.delete(set); }, []);
  return ds;
}

/* --------------------------------------------------------- example data --- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A simulated antenatal anaemia follow-up of 120 women, so every test can be tried. Not real patients. */
export function exampleCsv() {
  const r = mulberry32(2026);
  const norm = () => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const rows = [['ID', 'Age', 'Residence', 'Trimester', 'Parity', 'IFA_adherence', 'BMI', 'Hb_registration', 'Hb_3_months', 'Hb_6_months', 'Anaemia_registration', 'Anaemia_3_months', 'Anaemia_6_months']];
  for (let i = 1; i <= 120; i++) {
    const rural = r() < 0.65;
    const age = Math.round(Math.min(40, Math.max(18, 23.5 + 4 * norm())));
    const tri = r() < 0.45 ? 1 : r() < 0.6 ? 2 : 3;
    const parity = Math.min(3, Math.floor(-Math.log(1 - r()) * 1.1));
    const good = r() < (rural ? 0.55 : 0.7);
    const bmi = Math.round((20.6 + (rural ? -0.6 : 0.5) + 2.6 * norm()) * 10) / 10;
    const hb0 = Math.round((10.3 + (rural ? -0.35 : 0.25) - 0.12 * parity + 0.06 * (bmi - 20.6) + 1.15 * norm()) * 10) / 10;
    const hb3 = Math.round((hb0 + (good ? 0.75 : 0.2) + 0.55 * norm()) * 10) / 10;
    const hb6 = Math.round((hb3 + (good ? 0.45 : 0.05) + 0.55 * norm()) * 10) / 10;
    const miss = r() < 0.03;
    rows.push([`W${String(i).padStart(3, '0')}`, age, rural ? 'Rural' : 'Urban', tri, parity === 3 ? '3+' : parity, good ? 'Good' : 'Poor', bmi,
      hb0, miss ? '' : hb3, miss ? '' : hb6, hb0 < 11 ? 'Yes' : 'No', miss ? '' : hb3 < 11 ? 'Yes' : 'No', miss ? '' : hb6 < 11 ? 'Yes' : 'No']);
  }
  return rows.map((row) => row.join(',')).join('\n');
}

/** A simulated cohort of 160 adults treated for drug-sensitive TB, followed for 6 months:
 * months to an unfavourable outcome (death or loss to follow-up). Not real patients. */
export function exampleTbCsv() {
  const r = mulberry32(2024);
  const norm = () => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const rows = [['ID', 'Age', 'Sex', 'HIV', 'Diabetes', 'Months', 'Unfavourable_outcome']];
  for (let i = 1; i <= 160; i++) {
    const age = Math.round(Math.min(75, Math.max(18, 38 + 13 * norm())));
    const male = r() < 0.65, hiv = r() < 0.15, dm = r() < 0.2;
    const rate = 0.028 * Math.exp(1.0 * hiv + 0.55 * dm + 0.02 * (age - 38) + 0.2 * male);
    const tEvent = -Math.log(1 - r()) / rate;
    const tOut = r() < 0.08 ? 0.5 + 5 * r() : 6;
    const t = Math.min(tEvent, tOut);
    rows.push([`TB${String(i).padStart(3, '0')}`, age, male ? 'Male' : 'Female', hiv ? 'Positive' : 'Negative', dm ? 'Yes' : 'No',
      Math.max(0.1, Math.round(t * 10) / 10), tEvent <= tOut ? 1 : 0]);
  }
  return rows.map((row) => row.join(',')).join('\n');
}

/** A simulated validation exercise at an Anganwadi screening camp, 100 children aged 6 to 59 months:
 * three medical officers grade palmar pallor; haemoglobin by a venous laboratory analyser and by
 * HemoCue on capillary blood; MUAC measured by three Anganwadi workers; mothers answer a six-item
 * feeding-practice scale (1 to 5; item 6 is deliberately weak). Not real children. */
export function exampleAgreementCsv() {
  const r = mulberry32(1031);
  const norm = () => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const grade = (hb, shift) => (hb + shift < 7.5 ? 'Severe pallor' : hb + shift < 10.5 ? 'Some pallor' : 'No pallor');
  const rows = [['ID', 'Pallor_MO1', 'Pallor_MO2', 'Pallor_MO3', 'Hb_lab', 'Hb_HemoCue', 'MUAC_AWW1', 'MUAC_AWW2', 'MUAC_AWW3', 'Item1', 'Item2', 'Item3', 'Item4', 'Item5', 'Item6']];
  const first = [12.1, 9.4, 6.2];
  for (let i = 1; i <= 100; i++) {
    const hb = i <= 3 ? first[i - 1] : Math.min(14.5, Math.max(5, 10.3 + 1.6 * norm()));
    const seen = [0, 1, 2].map((m) => (i <= 3 ? grade(hb, 0) : grade(hb + 0.85 * norm(), [0, 0.15, 0.55][m])));
    const lab = Math.round(hb * 10) / 10;
    const poc = Math.round((hb + 0.3 + 0.03 * (hb - 10.3) + 0.5 * norm()) * 10) / 10;
    const muac = 13.6 + 1.05 * norm();
    const aww = [0, 0.2, -0.15].map((b) => Math.round((muac + b + 0.32 * norm()) * 10) / 10);
    const att = norm();
    const items = [0.95, 0.85, 0.9, 0.75, 0.8, 0.12].map((ld) => Math.min(5, Math.max(1, Math.round(3.1 + ld * att + 0.75 * norm()))));
    rows.push([`C${String(i).padStart(3, '0')}`, ...seen, lab, poc, ...aww, ...items]);
  }
  return rows.map((row) => row.join(',')).join('\n');
}

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
