/* Formatting and small components shared by the epidemiology tools (measures; stratified analysis and
 * standardisation; diagnostic accuracy; vaccines and screening), so the same numbers read the same way
 * on every page. */
import { useState } from 'preact/hooks';
import { isMissing, parseDelimited } from '../../engine/data.js';
import { fixed, pValue, count, sig, sci, ratio, parseNumber } from '../../engine/format.js';
import { Callout, SelectField, NumberField } from '../../ui/core.jsx';
import { classifyValue } from '../../engine/diag.js';
import { ColumnSelect, col } from '../../ui/data.jsx';
import { Disclose } from '../../ui/results.jsx';

export const pretty = (s) => String(s).replace(/_/g, ' ');
export const P = (p) => pValue(p).report;
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const isInt = (v) => Number.isInteger(v) && v >= 0;

/** A percentage with one decimal, two below 1%. */
export const pd = (p) => (Math.abs(p) < 0.01 && p !== 0 ? 2 : 1);
export const pc = (p, d = pd(p)) => (Number.isFinite(p) ? `${fixed(100 * p, d)}%` : '—');
export const pcCI = (ci, d) => (ci ? `${pc(ci[0], d ?? pd(Math.min(...ci.map(Math.abs))))} to ${pc(ci[1], d ?? pd(Math.min(...ci.map(Math.abs))))}` : '—');
export const pp = (v, d) => fixed(100 * v, d);
export const rCI = (ci) => (ci ? `${ratio(ci[0])} to ${ratio(ci[1])}` : '—');
export const nn = (v) => (Number.isFinite(v) ? fixed(v, 1) : '∞');
export const ptx = (t) => (Number.isInteger(t) ? count(t) : sig(t, 6));
/** Three significant figures, keeping trailing zeros so the limits of an interval line up (1.30, not 1.3). */
export const s3 = (x) => (!Number.isFinite(x) ? (Number.isNaN(x) ? '—' : '∞') : Math.abs(x) >= 1000 ? count(x) : x !== 0 && Math.abs(x) < 1e-6 ? sci(x, 3) : x.toPrecision(3).replace(/^-/, '−'));
/** A row of a two-column table that fits a phone: the measure with its method, and the estimate with its CI. */
export const mrow = (name, method, est, ci, on = false) => [{ text: method ? `${name} (${method})` : name, cls: on ? 'hl' : '' }, { text: ci ? `${est} (${ci})` : est, cls: on ? 'hl' : '' }];
export const MCOLS = ['Measure (method)', 'Estimate (95% CI)'];

export const POSITIVE = ['yes', 'y', '1', 'true', 'positive', 'pos', 'present', 'case', 'cases', 'exposed', 'dead', 'died', 'death', 'event', 'reactive', 'abnormal', 'poor'];
export const guessLevel = (levels) => levels.find((l) => POSITIVE.includes(String(l).trim().toLowerCase())) ?? levels[levels.length - 1];
export const other = (levels, l) => levels.find((x) => x !== l);

export const needData = <Callout mark="Data">Load or paste your data at the top of the page, or try one of the example datasets.</Callout>;

export function Checks({ items }) {
  const xs = items.filter(Boolean);
  if (!xs.length) return null;
  return (
    <div>
      <h3 class="sub">Checks</h3>
      <ul class="checks">{xs.map((c) => <li class={c.ok === true ? 'ok' : c.ok === false ? 'no' : 'info'}><span class="mk">{c.ok === true ? 'OK' : c.ok === false ? 'Check' : 'Note'}</span><span>{c.text}</span></li>)}</ul>
    </div>
  );
}

/** A two-level column and the level that counts (exposed, outcome present). */
export function LevelPick({ ds, label, value, onChange, level, onLevel, exclude = [], levelLabel }) {
  const c = col(ds, value);
  return (
    <>
      <ColumnSelect ds={ds} label={label} value={value} onChange={(v) => { onChange(v); onLevel(null); }} kind="group" maxLevels={2} exclude={exclude}
        hint="A column with two values; recode others first." />
      {c ? <SelectField label={levelLabel} value={level ?? guessLevel(c.levels)} onChange={onLevel} options={c.levels.map((l) => ({ value: l, label: l }))} /> : null}
    </>
  );
}

/** Rows a and c count the exposed and unexposed with the outcome. */
export function countTable(ds, e, eLevel, o, oLevel) {
  const ce = col(ds, e), co = col(ds, o);
  let a = 0, b = 0, c = 0, d = 0, dropped = 0;
  for (let i = 0; i < ds.n; i++) {
    const x = ce.raw[i], y = co.raw[i];
    if (isMissing(x) || isMissing(y)) { dropped++; continue; }
    const ex = x === eLevel, ou = y === oLevel;
    if (ex && ou) a++; else if (ex) b++; else if (ou) c++; else d++;
  }
  return { t: [[a, b], [c, d]], dropped };
}

export const PER = [{ value: '100', label: 'per 100 (%)' }, { value: '1000', label: 'per 1,000' }, { value: '10000', label: 'per 10,000' }, { value: '100000', label: 'per 1,00,000' }];
export const PER_RATE = [{ value: '1', label: 'per 1' }, { value: '100', label: 'per 100' }, { value: '1000', label: 'per 1,000' }, { value: '10000', label: 'per 10,000' }, { value: '100000', label: 'per 1,00,000' }];
export const UNITS = [{ value: 'person-years', label: 'Person-years' }, { value: 'person-months', label: 'Person-months' }, { value: 'person-weeks', label: 'Person-weeks' }, { value: 'person-days', label: 'Person-days' }];
export const perText = (m) => (m === 100 ? '%' : ` per ${count(m)}`);

/**
 * Rows pasted from Excel or Google Sheets: a label, then `ncols` numbers. A header row (or any row whose
 * numbers do not read) is skipped. onRows receives [{ label, vals }].
 */
export function readPasted(text, ncols, parseDelimited, parseNumber) {
  const { rows } = parseDelimited(text);
  return rows.map((r) => ({ label: (r[0] || '').trim(), vals: r.slice(1, 1 + ncols).map((v) => String(v).trim()) }))
    .filter((r) => r.vals.length === ncols && r.vals.every((v) => Number.isFinite(parseNumber(v))));
}

let rowId = 0;
export const newRowId = () => ++rowId;
export const mkRows = (rows) => rows.map(([label, ...vals]) => ({ id: ++rowId, label, vals: vals.map(String) }));
export const blank = (n) => ({ id: ++rowId, label: '', vals: Array(n).fill('') });

/* -------------------------------------------- a table of typed strata --- */

/** Typed rows: a label and numbers in fixed columns, with add, remove, paste and clear. */
export function RowsTable({ cols, rows, setRows, what = 'stratum', numeric = 'decimal' }) {
  const [paste, setPaste] = useState(''), [msg, setMsg] = useState('');
  const set = (id, patch) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const use = () => {
    const got = readPasted(paste, cols.length, parseDelimited, parseNumber);
    if (!got.length) { setMsg(`No rows read. Each row needs the ${what} name and then ${cols.length} numbers, in the order of the table.`); return; }
    setMsg(''); setRows(got.map((g) => ({ id: ++rowId, ...g }))); setPaste('');
  };
  return (
    <>
      <div class="tablewrap">
        <table class="table compact entry">
          <thead><tr><th scope="col">{cap(what)}</th>{cols.map((c) => <th scope="col">{c}</th>)}<th scope="col"><span class="vh">Remove</span></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr>
              <td><input class="name" aria-label={`${cap(what)} ${i + 1} name`} value={r.label} onInput={(e) => set(r.id, { label: e.currentTarget.value })} /></td>
              {cols.map((c, j) => <td><input inputMode={numeric} aria-label={`${r.label || `${cap(what)} ${i + 1}`}: ${c}`} value={r.vals[j]} onInput={(e) => set(r.id, { vals: r.vals.map((v, q) => (q === j ? e.currentTarget.value : v)) })} /></td>)}
              <td class="rm"><button type="button" class="btn ghost small" aria-label={`Remove ${r.label || `${what} ${i + 1}`}`} onClick={() => setRows(rows.length > 1 ? rows.filter((x) => x.id !== r.id) : [blank(cols.length)])}>{'×'}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div class="btn-row">
        <button type="button" class="btn ghost small" onClick={() => setRows([...rows, blank(cols.length)])}>Add {/^[aeiou]/i.test(what) ? 'an' : 'a'} {what}</button>
        <button type="button" class="btn ghost small" onClick={() => setRows([blank(cols.length), blank(cols.length)])}>Clear</button>
      </div>
      <Disclose title="Paste rows from Excel or Google Sheets">
        <p class="small">One {what} per row: its name, then the {cols.length} numbers in the order of the table. A header row is skipped.</p>
        <textarea class="paste" rows={4} value={paste} onInput={(e) => setPaste(e.currentTarget.value)} aria-label={`Paste ${what} rows`} spellcheck={false} />
        {msg ? <p class="err" role="alert">{msg}</p> : null}
        <div class="btn-row"><button type="button" class="btn primary small" disabled={!paste.trim()} onClick={use}>Use these rows</button></div>
      </Disclose>
    </>
  );
}

/** The filled rows as numbers, or an error naming the first row that does not read. */
export function readRows(rows, { integer = [], positive = [] } = {}) {
  const out = [];
  for (const [i, r] of rows.entries()) {
    if (!r.label.trim() && r.vals.every((v) => !String(v).trim())) continue;
    const name = r.label.trim() || `Row ${i + 1}`;
    const x = r.vals.map((v) => parseNumber(v));
    if (x.some((v) => !Number.isFinite(v) || v < 0)) return { error: `${name}: fill in every number (0 or more).` };
    if (integer.some((j) => !Number.isInteger(x[j]))) return { error: `${name}: counts must be whole numbers.` };
    if (positive.some((j) => !(x[j] > 0))) return { error: `${name}: population and person-time must be above zero.` };
    out.push({ label: name, x });
  }
  return { rows: out };
}

/* ------------------------------------------------ reading columns as tests --- */

export const OPS = [{ value: '<', label: 'Below' }, { value: '<=', label: 'At or below' }, { value: '>=', label: 'At or above' }, { value: '>', label: 'Above' }];
export const SYM = { '<': '<', '<=': '≤', '>=': '≥', '>': '>' };
export const NEGATIVE = /^(no|none|nil|normal|negative|neg|absent|never|non[- ]?reactive|0|false)\b/i;
export const num = (v) => (Number.isInteger(v) ? count(v) : sig(v, 6));

/** Numeric columns with more than two values are read with a cut-off; others by their values. */
export const usesCut = (c) => c.numeric && c.levels.length > 2;
export function defaultRule(c) {
  if (usesCut(c)) {
    const xs = c.numbers.filter((v) => v !== null && Number.isFinite(v)).sort((a, b) => a - b);
    return { kind: 'cut', op: '>=', text: xs.length ? String(xs[Math.floor(xs.length / 2)]) : '' };
  }
  if (c.levels.length === 2) return { kind: 'levels', positive: [guessLevel(c.levels)] };
  const pos = c.levels.filter((l) => !NEGATIVE.test(String(l).trim()));
  return { kind: 'levels', positive: pos.length && pos.length < c.levels.length ? pos : [c.levels[c.levels.length - 1]] };
}
/** The rule with its number read, or an error. */
export function readRule(r) {
  if (r.kind === 'levels') return r.positive.length ? { rule: r } : { error: 'Tick at least one value that counts as positive.' };
  const v = parseNumber(r.text);
  return Number.isFinite(v) ? { rule: { kind: 'cut', op: r.op, value: v, text: r.text } } : { error: 'Enter the cut-off as a number.' };
}
export const ruleText = (r) => (r.kind === 'cut' ? `${SYM[r.op]} ${r.text}` : r.positive.join(' or '));
export const readBinary = (c, rule) => c.raw.map((raw, i) => (isMissing(raw) ? null : classifyValue(raw, c.numbers?.[i] ?? null, rule)));

/** A column read as positive or negative: tick the values that count, or give a cut-off for numbers. */
export function BinaryFrom({ ds, label, value, onChange, rule, onRule, exclude = [], what }) {
  const c = col(ds, value);
  const r = c ? rule ?? defaultRule(c) : null;
  const toggle = (l) => onRule({ ...r, positive: r.positive.includes(l) ? r.positive.filter((x) => x !== l) : [...r.positive, l] });
  return (
    <div class="stack" style="gap:10px">
      <ColumnSelect ds={ds} label={label} value={value} onChange={(v) => { onChange(v); onRule(null); }} kind="any" exclude={exclude} />
      {c && r.kind === 'cut' ? (
        <div class="fields">
          <SelectField label={`${what} when ${pretty(value)} is`} value={r.op} onChange={(op) => onRule({ ...r, op })} options={OPS} />
          <NumberField label={`Cut-off for ${pretty(value)}`} value={r.text} onInput={(text) => onRule({ ...r, text })} />
        </div>
      ) : c ? (
        <div>
          <span class="label">{`${what}: the values that count`}</span>
          <div class="varpick" role="group" aria-label={`${what}: values of ${pretty(value)}`}>{c.levels.map((l) => <label><input type="checkbox" checked={r.positive.includes(l)} onChange={() => toggle(l)} />{l}</label>)}</div>
        </div>
      ) : null}
    </div>
  );
}
