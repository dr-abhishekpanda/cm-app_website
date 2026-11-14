/* Formatting and small components shared by the epidemiology tools (measures, stratified analysis and
 * standardisation), so the same numbers read the same way on every page. */
import { isMissing } from '../../engine/data.js';
import { fixed, pValue, count, sig, sci, ratio } from '../../engine/format.js';
import { Callout, SelectField } from '../../ui/core.jsx';
import { ColumnSelect, col } from '../../ui/data.jsx';

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
