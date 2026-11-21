/* Inputs for the diagnostic-accuracy references: 2 x 2 tables, ROC data sets (from the app's example
 * data and from seeded simulations) and pairs of curves to compare. Writes tests/ref/diag_input.json,
 * which tools/refgen/diag_ref.R and diag_ref.py read.   Run from apps-src/: node tools/refgen/diag_input.mjs
 */
import { writeFileSync } from 'node:fs';
import { mulberry32 } from '../../engine/random.js';
import { exampleAgreementCsv } from '../../engine/examples.js';
import { readDataset } from '../../engine/data.js';

const r = mulberry32(2025);
const norm = () => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

// Test against reference: [tp, fp, fn, tn].
const tables = [
  [670, 202, 74, 640], [45, 8, 5, 92], [20, 0, 3, 47], [9, 3, 1, 27], [30, 10, 0, 60], [18, 95, 2, 1885], [4, 6, 6, 4], [0, 5, 10, 25],
];

// ROC sets. direction as in pROC: '<' when cases have higher values, '>' when lower.
const rocSets = [];
{
  // Hanley and McNeil (1982): ratings 1 (definitely normal) to 5 (definitely abnormal) of 109 CT images.
  const nor = [33, 6, 6, 11, 2], abn = [3, 2, 2, 11, 33];
  const x = [], y = [];
  nor.forEach((k, i) => { for (let j = 0; j < k; j++) { x.push(i + 1); y.push(0); } });
  abn.forEach((k, i) => { for (let j = 0; j < k; j++) { x.push(i + 1); y.push(1); } });
  rocSets.push({ name: 'Hanley-McNeil ratings', y, x, direction: '<' });
}
const ds = readDataset(exampleAgreementCsv());
const col = (n) => ds.columns.find((c) => c.name === n);
const lab = col('Hb_lab').numbers, poc = col('Hb_HemoCue').numbers, pal = col('Pallor_MO1').raw;
const PAL = { 'No pallor': 1, 'Some pallor': 2, 'Severe pallor': 3 };
const anaemia = lab.map((v) => (v < 11 ? 1 : 0));
rocSets.push({ name: 'HemoCue against laboratory anaemia', y: anaemia, x: poc, direction: '>' });
rocSets.push({ name: 'Pallor (MO1) against laboratory anaemia', y: anaemia, x: pal.map((v) => PAL[v]), direction: '<' });
{
  const y = [], x = [];
  for (let i = 0; i < 100; i++) { const d = r() < 0.4 ? 1 : 0; y.push(d); x.push(round(d + norm())); }
  rocSets.push({ name: 'Normal markers, rounded', y, x, direction: '<' });
}
{
  const y = [], x = [];
  for (let i = 0; i < 30; i++) { const d = i % 3 === 0 ? 1 : 0; y.push(d); x.push(Math.max(0, Math.min(9, Math.round(4 + 2 * d + 2 * norm())))); }
  rocSets.push({ name: 'Small integer scores', y, x, direction: '<' });
}
rocSets.push({ name: 'Perfect separation', y: [0, 0, 0, 0, 1, 1, 1], x: [1, 2, 2, 3, 4, 5, 5], direction: '<' });
rocSets.push({ name: 'Direction against the data', y: [0, 0, 0, 0, 0, 1, 1, 1, 1], x: [5, 6, 7, 7, 9, 2, 3, 6, 4], direction: '<' });

// Paired: two markers on the same people.
const paired = [{ name: 'HemoCue and pallor', y: anaemia, a: poc, b: pal.map((v) => PAL[v]), dirA: '>', dirB: '<' }];
{
  const y = [], a = [], b = [];
  for (let i = 0; i < 80; i++) { const d = r() < 0.45 ? 1 : 0; const u = d * 1.1 + norm(); y.push(d); a.push(round(u, 2)); b.push(round(u + norm(), 2)); }
  paired.push({ name: 'Correlated normal markers', y, a, b, dirA: '<', dirB: '<' });
}
// Unpaired: one marker in two independent groups.
const unpaired = [];
{
  const g = () => { const y = [], x = []; for (let i = 0; i < 60; i++) { const d = r() < 0.5 ? 1 : 0; y.push(d); x.push(round(d * 1.3 + norm())); } return { y, x }; };
  const h = () => { const y = [], x = []; for (let i = 0; i < 45; i++) { const d = r() < 0.4 ? 1 : 0; y.push(d); x.push(round(d * 0.6 + norm())); } return { y, x }; };
  const A = g(), B = h();
  unpaired.push({ name: 'Two groups', y1: A.y, x1: A.x, y2: B.y, x2: B.x, direction: '<' });
}

writeFileSync('tests/ref/diag_input.json', JSON.stringify({ tables, rocSets, paired, unpaired }));
console.log('wrote tests/ref/diag_input.json:', tables.length, 'tables,', rocSets.length, 'ROC sets,', paired.length, 'paired,', unpaired.length, 'unpaired');
