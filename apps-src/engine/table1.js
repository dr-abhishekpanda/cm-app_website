/* Table 1: characteristics of the participants, overall and by group, as journals print them:
 * mean (SD), median (IQR) or n (%), a row for missing values, and optional tests of difference.
 * Pure functions over dataset columns (engine/data.js). Checked in tests/engine/report.test.mjs.
 */
import { mean, sd, quantile, sortNum, shapiroWilk } from './describe.js';
import { tTwoSample, welchAnova } from './compare.js';
import { mannWhitney, kruskalWallis } from './nonparam.js';
import { chiSquareTest, fisher2x2, fisherRxC } from './tables.js';
import { isMissing } from './data.js';
import { fixed, dpFor, pValue, count, parseNumber } from './format.js';

export const TABLE1_TESTS = {
  welch: "Welch's t-test",
  welchAnova: "Welch's one-way ANOVA",
  mw: 'Mann-Whitney U test',
  kw: 'Kruskal-Wallis test',
  chi: 'chi-square test',
  yates: "chi-square test with Yates' correction",
  fisher: "Fisher's exact test",
  ffh: 'Fisher-Freeman-Halton exact test',
};
const SUP = ['ᵃ', 'ᵇ', 'ᶜ', 'ᵈ', 'ᵉ', 'ᶠ', 'ᵍ', 'ʰ'];
const YES = /^(1|yes|y|positive|present|true|reactive|anaemic|anemic)$/i;
const pretty = (s) => String(s).replace(/_/g, ' ');

/** "21–28", or "−2 to 3" when a negative number would make the dash ambiguous. */
const range = (a, b, d) => (a < 0 || b < 0 ? `${fixed(a, d)} to ${fixed(b, d)}` : `${fixed(a, d)}–${fixed(b, d)}`);
const pct = (k, n) => (n ? `${count(k)} (${fixed((100 * k) / n, 1)})` : '—');
const pCell = (p) => (Number.isFinite(p) ? pValue(p).report.replace(/^p = /, '').replace(/^p /, '') : '—');

/** Row indices kept (group not missing) and the group of each, in the order of the group's levels. */
export function groupRows(ds, groupName, maxGroups = 8) {
  const g = groupName ? ds.columns.find((c) => c.name === groupName) : null;
  const keep = [], gi = [];
  let dropped = 0;
  const levels = g ? g.levels.slice(0, maxGroups) : [];
  for (let i = 0; i < ds.n; i++) {
    if (!g) { keep.push(i); gi.push(-1); continue; }
    const v = g.raw[i];
    const j = isMissing(v) ? -1 : levels.indexOf(v);
    if (j < 0) { dropped++; continue; }
    keep.push(i); gi.push(j);
  }
  return { levels, keep, gi, dropped };
}

/** How to summarise a column: categories when it has 6 or fewer values, median when any group fails Shapiro-Wilk. */
export function suggestSummary(col, rows) {
  if (!col.numeric || col.levels.length <= 6) return 'cat';
  const k = Math.max(0, ...rows.gi) + 1 || 1;
  const groups = Array.from({ length: Math.max(1, k) }, () => []);
  rows.keep.forEach((i, r) => { const v = col.numbers[i]; if (v !== null && Number.isFinite(v)) groups[Math.max(0, rows.gi[r])].push(v); });
  for (const x of groups) {
    if (x.length >= 3 && x.length <= 5000 && shapiroWilk(x).p < 0.05) return 'median';
  }
  return 'mean';
}

/**
 * Build Table 1. vars: [{ name, kind: 'mean' | 'median' | 'cat' }]; group: a column name or null.
 * Options: overall (column), tests (p-values), compact (yes/no variables in one row), qtype (quartiles).
 * Returns { columns, rows: [{ label, cells, p, test, level? }], footnotes, n, dropped, used }.
 */
export function table1(ds, { vars, group = null, overall = true, tests = false, compact = true, qtype = 6 } = {}) {
  const rows = groupRows(ds, group);
  const G = rows.levels.length;
  const showOverall = !group || overall;
  const sizes = rows.levels.map((_, j) => rows.gi.filter((x) => x === j).length);
  const columns = ['Characteristic', ...(showOverall ? [`${group ? 'Overall' : 'All participants'} (n = ${count(rows.keep.length)})`] : []),
    ...rows.levels.map((l, j) => `${l} (n = ${count(sizes[j])})`)];
  const doTests = tests && G >= 2;
  if (doTests) columns.push('p');
  const out = [];
  const used = [];
  const mark = (t) => { if (!used.includes(t)) used.push(t); return SUP[used.indexOf(t)]; };
  const kinds = new Set();
  for (const v of vars) {
    const col = ds.columns.find((c) => c.name === v.name);
    if (!col || col.name === group) continue;
    const per = Array.from({ length: G }, () => []);
    const all = [];
    let missAll = 0;
    const missBy = Array(G).fill(0);
    rows.keep.forEach((i, r) => {
      const j = rows.gi[r];
      const raw = col.raw[i];
      const val = v.kind === 'cat' ? (isMissing(raw) ? null : raw) : col.numbers[i];
      if (val === null || (v.kind !== 'cat' && !Number.isFinite(val))) { missAll++; if (j >= 0) missBy[j]++; return; }
      all.push(val);
      if (j >= 0) per[j].push(val);
    });
    const label = pretty(col.name);
    if (v.kind === 'mean' || v.kind === 'median') {
      kinds.add(v.kind);
      const d = dpFor(col.decimals);
      const stat = (x) => {
        if (!x.length) return { n: 0, text: '—' };
        if (v.kind === 'mean') { const m = mean(x), s = x.length > 1 ? sd(x, m) : NaN; return { n: x.length, mean: m, sd: s, text: `${fixed(m, d)} (${Number.isFinite(s) ? fixed(s, d) : '—'})` }; }
        const st = sortNum(x);
        const md = quantile(st, 0.5, qtype), q1 = quantile(st, 0.25, qtype), q3 = quantile(st, 0.75, qtype);
        return { n: x.length, median: md, q1, q3, text: `${fixed(md, d)} (${range(q1, q3, d)})` };
      };
      const stats = [...(showOverall ? [stat(all)] : []), ...per.map(stat)];
      let p = NaN, test = null;
      const ok = per.filter((x) => x.length >= 2);
      if (doTests && ok.length >= 2) {
        if (v.kind === 'mean') { test = ok.length === 2 ? 'welch' : 'welchAnova'; p = ok.length === 2 ? tTwoSample(ok[0], ok[1], { equalVar: false }).p : welchAnova(ok).p; }
        else { test = ok.length === 2 ? 'mw' : 'kw'; p = ok.length === 2 ? mannWhitney(ok[0], ok[1]).p : kruskalWallis(ok).p; }
      }
      out.push({ label: `${label}, ${v.kind === 'mean' ? 'mean (SD)' : 'median (IQR)'}`, kind: v.kind, cells: stats.map((s) => s.text), stats, p, test,
        pText: doTests ? (test ? `${pCell(p)}${mark(test)}` : '—') : undefined });
    } else {
      kinds.add('cat');
      const levels = col.numeric ? [...col.levels].sort((a, b) => parseNumber(a) - parseNumber(b)) : col.levels;
      const countIn = (x, l) => x.filter((y) => y === l).length;
      const groupsN = per.map((x) => x.length);
      // Test on the groups x levels table, dropping empty rows and columns.
      let p = NaN, test = null;
      if (doTests) {
        const gKeep = per.map((x, j) => j).filter((j) => per[j].length > 0);
        const lKeep = levels.filter((l) => per.some((x) => countIn(x, l) > 0));
        if (gKeep.length >= 2 && lKeep.length >= 2) {
          const t = gKeep.map((j) => lKeep.map((l) => countIn(per[j], l)));
          const c = chiSquareTest(t);
          const is2 = t.length === 2 && t[0].length === 2;
          const exact = !c.cochranOk || (is2 && c.minExpected < 5);
          if (is2) { test = exact ? 'fisher' : 'yates'; p = exact ? fisher2x2(t).p : c.pYates; }
          else { test = exact ? 'ffh' : 'chi'; p = exact ? fisherRxC(t).p : c.p; }
        }
      }
      const pText = doTests ? (test ? `${pCell(p)}${mark(test)}` : '—') : undefined;
      const cellsFor = (l) => [...(showOverall ? [pct(countIn(all, l), all.length)] : []), ...per.map((x, j) => pct(countIn(x, l), groupsN[j]))];
      const countsFor = (l) => [...(showOverall ? [{ k: countIn(all, l), n: all.length }] : []), ...per.map((x, j) => ({ k: countIn(x, l), n: groupsN[j] }))];
      const yes = levels.length === 2 ? levels.find((l) => YES.test(String(l).trim())) : undefined;
      if (compact && yes !== undefined) {
        out.push({ label: `${label}, ${String(yes).toLowerCase() === '1' ? 'yes' : yes}`, kind: 'cat', cells: cellsFor(yes), counts: countsFor(yes), p, test, pText, level: yes });
      } else {
        out.push({ label, kind: 'head', cells: columns.slice(1, doTests ? -1 : undefined).map(() => ''), p, test, pText });
        for (const l of levels) out.push({ label: ` ${l}`, kind: 'cat', cells: cellsFor(l), counts: countsFor(l), level: l, pText: doTests ? '' : undefined });
      }
    }
    if (missAll) out.push({ label: ' Missing, n', kind: 'missing', cells: [...(showOverall ? [count(missAll)] : []), ...missBy.map(count)], pText: doTests ? '' : undefined });
  }
  const parts = [];
  if (kinds.has('cat')) parts.push('n (%)');
  if (kinds.has('mean')) parts.push('mean (SD)');
  if (kinds.has('median')) parts.push(`median (IQR, quartiles as in ${qtype === 6 ? 'SPSS' : 'R and Excel'})`);
  const footnotes = [];
  if (parts.length) footnotes.push(`Values are ${parts.length < 3 ? parts.join(' or ') : `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`}.${kinds.has('cat') ? ' Percentages are of participants with data for that characteristic.' : ''}`);
  if (doTests && used.length) footnotes.push(used.map((t, i) => `${SUP[i]} ${TABLE1_TESTS[t]}`).join('; ') + '.');
  if (rows.dropped) footnotes.push(`${count(rows.dropped)} participant${rows.dropped === 1 ? '' : 's'} with no value for ${pretty(group)} left out.`);
  return { columns, rows: out.map((r) => ({ ...r, all: [r.label, ...r.cells, ...(doTests ? [r.pText ?? ''] : [])] })), footnotes, n: rows.keep.length, groups: rows.levels, sizes, dropped: rows.dropped, used };
}
