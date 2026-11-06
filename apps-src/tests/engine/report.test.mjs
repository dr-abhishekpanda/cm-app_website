/* Table 1 against tests/ref/report.json (NumPy summaries; SciPy and pingouin tests). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { readDataset } from '../../engine/data.js';
import { table1, suggestSummary, groupRows } from '../../engine/table1.js';

const ref = loadRef('report.json');
const ds = readDataset(ref.csv);

function checker(label) {
  const bad = [];
  return {
    eq(name, got, want, rel = 1e-10, abs = 1e-12) {
      if (Array.isArray(want)) { want.forEach((w, i) => this.eq(`${name}[${i}]`, got[i], w, rel, abs)); return; }
      if (typeof want === 'string' || typeof want === 'boolean') { if (got !== want) bad.push(`${label} ${name}: got ${got}, want ${want}`); return; }
      if (!close(got, want, rel, abs)) bad.push(`${label} ${name}: got ${got}, want ${want}`);
    },
    done() { assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 25).join('\n')}`); },
  };
}

test('Table 1 by a three-level group: summaries, counts, missing rows and tests', () => {
  const c = checker('table1');
  const vars = [{ name: 'Age', kind: 'mean' }, { name: 'CRP', kind: 'median' }, { name: 'Education', kind: 'cat' }, { name: 'Anaemia', kind: 'cat' }];
  const t = table1(ds, { vars, group: 'Group', overall: true, tests: true, qtype: 6 });
  c.eq('groups', t.groups.join(','), ref.levels.join(','));
  c.eq('n', t.n, ref.n); c.eq('dropped', t.dropped, ref.dropped);
  const age = t.rows.find((r) => r.label.startsWith('Age'));
  ref.age.forEach((s, i) => { c.eq(`age n ${i}`, age.stats[i].n, s.n); c.eq(`age mean ${i}`, age.stats[i].mean, s.mean); c.eq(`age sd ${i}`, age.stats[i].sd, s.sd); });
  c.eq('age Welch ANOVA p', age.p, ref.ageWelchAnova, 1e-8); c.eq('age test', age.test, 'welchAnova');
  const crp = t.rows.find((r) => r.label.startsWith('CRP'));
  ref.crp6.forEach((s, i) => { c.eq(`crp median ${i}`, crp.stats[i].median, s.median); c.eq(`crp q1 ${i}`, crp.stats[i].q1, s.q1); c.eq(`crp q3 ${i}`, crp.stats[i].q3, s.q3); });
  c.eq('crp Kruskal-Wallis p', crp.p, ref.crpKW, 1e-9); c.eq('crp test', crp.test, 'kw');
  const edu = t.rows.filter((r) => r.kind === 'cat' && ['Primary', 'Secondary', 'Graduate'].includes(r.level));
  ['Primary', 'Secondary', 'Graduate'].forEach((l, j) => {
    const r = edu.find((x) => x.level === l);
    ref.levels.forEach((g, i) => c.eq(`edu ${g} ${l}`, r.counts[i + 1].k, ref.edu[i][j]));
  });
  const head = t.rows.find((r) => r.kind === 'head' && r.label === 'Education');
  c.eq('education chi-square p', head.p, ref.eduChi, 1e-9); c.eq('education test', head.test, 'chi');
  const an = t.rows.find((r) => r.label === 'Anaemia, Yes');
  c.eq('anaemia counts', an.counts.flatMap((x) => [x.k, x.n]), ref.anaemiaYes);
  c.eq('anaemia chi-square (3 groups)', an.p, ref.anaemiaChi3, 1e-9);
  const miss = t.rows[t.rows.indexOf(an) + 1];
  c.eq('missing row', miss.kind, 'missing'); c.eq('missing counts', miss.cells.map(Number), ref.anaemiaMissing);
  c.eq('footnote', t.footnotes[0].startsWith('Values are n (%), mean (SD) or median (IQR'), true);
  // Quartiles as in R and Excel.
  const t7 = table1(ds, { vars: [{ name: 'CRP', kind: 'median' }], group: 'Group', qtype: 7 });
  ref.crp7.forEach((s, i) => { c.eq(`crp7 q1 ${i}`, t7.rows[0].stats[i].q1, s.q1); c.eq(`crp7 q3 ${i}`, t7.rows[0].stats[i].q3, s.q3); });
  c.done();
});

test('Table 1 with two groups uses Welch, Mann-Whitney and Yates; suggestions', () => {
  const c = checker('table1-two');
  // Keep only the first two levels by blanking the third group.
  const csv = ref.csv.split('\n').map((line, i) => (i && line.startsWith(`${ref.levels[2]},`) ? line.replace(/^[^,]*/, '') : line)).join('\n');
  const ds2 = readDataset(csv);
  const t = table1(ds2, { vars: [{ name: 'Age', kind: 'mean' }, { name: 'CRP', kind: 'median' }, { name: 'Anaemia', kind: 'cat' }], group: 'Group', tests: true });
  c.eq('two groups', t.groups.length, 2);
  c.eq('Welch t p', t.rows[0].p, ref.ageWelchT, 1e-9); c.eq('Welch test', t.rows[0].test, 'welch');
  c.eq('Mann-Whitney p', t.rows[1].p, ref.crpMW, 1e-9); c.eq('MW test', t.rows[1].test, 'mw');
  const an = t.rows.find((r) => r.label === 'Anaemia, Yes');
  c.eq('Yates p', an.p, ref.anaemiaYates, 1e-9); c.eq('Yates test', an.test, 'yates');
  const rows = groupRows(ds, 'Group');
  c.eq('suggest education', suggestSummary(ds.columns.find((x) => x.name === 'Education'), rows), 'cat');
  c.eq('suggest CRP', suggestSummary(ds.columns.find((x) => x.name === 'CRP'), rows), 'median');
  c.done();
});
