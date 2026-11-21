/* Vaccine effectiveness against tests/ref/vaccine.json (R: epiR epi.2by2, poisson.test, binom.test,
 * glm); two tests on the same people against Newcombe (1998, Table III); combined tests and screening
 * yield by direct counting. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { vaccineEffectiveness, screeningMethod, fromPublished } from '../../engine/vaccine.js';
import { pairedDifference, compareBinaryTests, combineTests, covarianceRange, screeningYield, testAccuracy, classifyValue, countTable } from '../../engine/diag.js';
import { exampleAgreementCsv } from '../../engine/examples.js';
import { readDataset, isMissing } from '../../engine/data.js';

const R = loadRef('vaccine.json');
const v = (x) => (x >= 1e308 ? Infinity : x <= -1e308 ? -Infinity : x);
function checker(label) {
  const bad = [];
  let n = 0;
  return {
    eq(name, got, want, rel = 1e-9, abs = 1e-12) {
      if (Array.isArray(want)) { want.forEach((w, i) => this.eq(`${name}[${i}]`, got?.[i], w, rel, abs)); return; }
      n++;
      const w = v(want);
      if (!(Number.isFinite(w) ? close(got, w, rel, abs) : got === w)) bad.push(`${label} ${name}: got ${got}, want ${w}`);
    },
    ok(name, cond) { n++; if (!cond) bad.push(`${label} ${name}`); },
    done(min) {
      assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 30).join('\n')}`);
      assert.ok(n >= min, `${label}: only ${n} comparisons ran, expected at least ${min}`);
    },
  };
}
const tab = ([a, b, c, d]) => [[a, b], [c, d]];

test('VE = 1 - ratio: cohort (Katz), case-control and test-negative (Woolf), person-time (exact), matched pairs (exact) match R', () => {
  const c = checker('VE');
  for (const r of R.cohort) {
    const o = vaccineEffectiveness({ table: tab(r.t) }, { design: 'cohort' });
    c.eq(`cohort ${r.t} VE`, o.ve.est, r.ve[0], 1e-12);
    c.eq(`cohort ${r.t} VE Katz`, o.ve.intervals.wald, r.ve.slice(1), 1e-9);
    c.ok(`cohort ${r.t} reported interval`, o.ve.auto === (Math.min(...r.t) < 5 ? 'score' : 'wald'));
  }
  for (const r of R.cc) for (const design of ['case-control', 'tnd']) {
    const o = vaccineEffectiveness({ table: tab(r.t) }, { design });
    c.eq(`${design} ${r.t} VE`, o.ve.est, r.ve[0], 1e-12);
    c.eq(`${design} ${r.t} VE Woolf`, o.ve.intervals.wald, r.ve.slice(1), 1e-9);
  }
  for (const r of R.pt) {
    const [a, t1, cc, t0] = r.v, o = vaccineEffectiveness({ a, t1, c: cc, t0 }, { design: 'pt' });
    c.eq(`person-time ${r.v} VE`, o.ve.est, r.ve[0], 1e-12);
    c.eq(`person-time ${r.v} VE exact`, o.ve.intervals.exact, r.ve.slice(1), 1e-8);
  }
  for (const r of R.matched) {
    const [e, f, g, h] = r.v, o = vaccineEffectiveness({ e, f, g, h }, { design: 'matched' });
    c.eq(`matched ${r.v} VE`, o.ve.est, r.ve[0], 1e-12);
    c.eq(`matched ${r.v} VE exact`, o.ve.intervals.exact, r.ve.slice(1), 1e-8);
  }
  // A published adjusted odds ratio of 0.25 (0.12 to 0.52) is VE 75% (48% to 88%).
  const p = fromPublished(0.25, 0.12, 0.52);
  c.eq('published', [p.est, ...p.ci], [0.75, 0.48, 0.88], 1e-12);
  c.done(55);
});

test("screening method: Farrington's logistic model (glm with an offset) and the exact interval match R", () => {
  const c = checker('screening');
  for (const r of R.screen) {
    const [x, n, cov] = r.v, o = screeningMethod(x, n, cov);
    c.eq(`${r.v} VE`, o.est, r.est, 1e-10);
    c.eq(`${r.v} logit`, o.logit, r.logit, 1e-8);
    c.eq(`${r.v} exact`, o.exact, r.exact, 1e-8);
    c.ok(`${r.v} reported interval`, o.auto === (Math.min(x, n - x) < 5 ? 'exact' : 'logit'));
  }
  // Orenstein and colleagues' formula: half the cases vaccinated where 90% of children are gives VE 1 - 1 x 1/9.
  c.eq('formula', screeningMethod(50, 100, 0.9).est, 1 - 1 / 9, 1e-14);
  c.done(20);
});

test("two tests on the same people: Newcombe's method 10 reproduces Table III of Newcombe (1998)", () => {
  // (e, f, g, h) and the published 95% limits for method 10, to four decimals. Row (1, 97, 1, 1) prints
  // 0.8736 for method 10 and 0.8737 for method 8, which coincide there (eh < fg, so no correction): the
  // engine's 0.87367 is held to one unit in the fourth decimal like every row.
  const T = [[36, 12, 2, 0, 0.0569, 0.3404], [20, 12, 2, 16, 0.0562, 0.3292], [18, 12, 2, 18, 0.0562, 0.3290], [36, 14, 0, 0, 0.1528, 0.4167],
    [35, 14, 0, 1, 0.1461, 0.4175], [18, 14, 0, 18, 0.1441, 0.3963], [2, 97, 1, 0, 0.8721, 0.9854], [1, 97, 1, 1, 0.8736, 0.9850],
    [0, 29, 1, 0, 0.6666, 0.9882], [2, 98, 0, 0, 0.9178, 0.9945], [1, 98, 0, 1, 0.9171, 0.9916], [0, 30, 0, 0, 0.8395, 1.0],
    [54, 0, 0, 0, -0.0664, 0.0664], [53, 0, 0, 1, -0.0729, 0.0729], [30, 0, 0, 24, -0.0358, 0.0358], [29, 0, 0, 25, -0.0354, 0.0354],
    [28, 0, 0, 26, -0.0352, 0.0352], [27, 0, 0, 27, -0.0351, 0.0351]];
  for (const [e, f, g, h, lo, hi] of T) {
    const r = pairedDifference(e, f, g, h);
    assert.ok(Math.abs(r.ci[0] - lo) <= 1e-4 && Math.abs(r.ci[1] - hi) <= 1e-4, `(${e}, ${f}, ${g}, ${h}): ${r.ci} against ${lo}, ${hi}`);
    assert.ok(Math.abs(r.diff - (f - g) / (e + f + g + h)) < 1e-15);
  }
  // McNemar on the discordant pairs: exact below 25, Edwards-corrected chi-square from 25.
  assert.equal(pairedDifference(36, 12, 2, 0).exact, true);
  assert.equal(pairedDifference(2, 97, 1, 0).exact, false);
});

test('two tests on the same people, from data: each test as the accuracy tool reads it; series and parallel counted directly equal the formulas with the conditional covariances', () => {
  const ds = readDataset(exampleAgreementCsv());
  const col = (n) => ds.columns.find((c) => c.name === n);
  const read = (name, rule) => { const c = col(name); return c.raw.map((raw, i) => (isMissing(raw) ? null : classifyValue(raw, c.numbers?.[i] ?? null, rule))); };
  const d = read('Hb_lab', { kind: 'cut', op: '<', value: 11 }), a = read('Pallor_MO1', { kind: 'levels', positive: ['Some pallor', 'Severe pallor'] }), b = read('Hb_HemoCue', { kind: 'cut', op: '<', value: 11 });
  const pos = [0, 0, 0, 0], neg = [0, 0, 0, 0];
  d.forEach((dd, i) => { const k = a[i] && b[i] ? 0 : a[i] ? 1 : b[i] ? 2 : 3; (dd ? pos : neg)[k]++; });
  const o = compareBinaryTests(pos, neg);
  const A = testAccuracy(countTable(a, d)), B = testAccuracy(countTable(b, d));
  for (const [x, y] of [[o.seA.est, A.se.est], [o.spA.est, A.sp.est], [o.seB.est, B.se.est], [o.spB.est, B.sp.est], [o.se.diff, A.se.est - B.se.est], [o.sp.diff, A.sp.est - B.sp.est]]) assert.ok(Math.abs(x - y) < 1e-15, `${x} against ${y}`);
  const f = combineTests({ se1: o.seA.est, sp1: o.spA.est, se2: o.seB.est, sp2: o.spB.est, covSe: o.covSe, covSp: o.covSp });
  for (const [x, y] of [[f.serial.se, o.serialSe.est], [f.serial.sp, o.serialSp.est], [f.parallel.se, o.parallelSe.est], [f.parallel.sp, o.parallelSp.est]]) assert.ok(Math.abs(x - y) < 1e-14, `${x} against ${y}`);
  const [lo, hi] = covarianceRange(o.seA.est, o.seB.est);
  assert.ok(o.covSe >= lo - 1e-15 && o.covSe <= hi + 1e-15);
});

test('screening programme: combined tests under independence and the yield of a programme, worked by hand', () => {
  // Tests with Se 80%, Sp 60% and Se 90%, Sp 90%: in parallel Se 98%, Sp 54%; in series Se 72%, Sp 96%.
  const c = combineTests({ se1: 0.8, sp1: 0.6, se2: 0.9, sp2: 0.9 });
  for (const [x, y] of [[c.parallel.se, 0.98], [c.parallel.sp, 0.54], [c.serial.se, 0.72], [c.serial.sp, 0.96]]) assert.ok(Math.abs(x - y) < 1e-12, `${x} against ${y}`);
  // 10 000 people, prevalence 2%, a test with Se 90% and Sp 95%: 180 true positives, 490 false positives.
  const y = screeningYield({ N: 10000, prev: 0.02, se1: 0.9, sp1: 0.95, cost1: 50 });
  for (const [x, w] of [[y.tp, 180], [y.fp, 490], [y.fn, 20], [y.tn, 9310], [y.ppv, 180 / 670], [y.screenedPerCase, 10000 / 180], [y.costPerCase, 500000 / 180]]) assert.ok(Math.abs(x - w) < 1e-9, `${x} against ${w}`);
  // In series, the second test (cost 400) goes only to the 670 who test positive on the first.
  const s = screeningYield({ N: 10000, prev: 0.02, se1: 0.9, sp1: 0.95, se2: 0.95, sp2: 0.98, strategy: 'serial', cost1: 50, cost2: 400 });
  assert.ok(Math.abs(s.tests[1] - 670) < 1e-9 && Math.abs(s.tp - 200 * 0.9 * 0.95) < 1e-9 && Math.abs(s.fp - 9800 * 0.05 * 0.02) < 1e-9 && Math.abs(s.cost - (500000 + 670 * 400)) < 1e-6);
});
