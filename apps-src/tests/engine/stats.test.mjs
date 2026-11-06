/* Phase 1 statistics engine against tests/ref/stats.json (SciPy, statsmodels, pingouin,
 * scikit-posthocs, mpmath and brute-force enumeration). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, num, close } from './helpers.mjs';
import { noncentralT, noncentralChiSquare, noncentralF } from '../../engine/noncentral.js';
import { studentizedRange } from '../../engine/range.js';
import { summarise, shapiroWilk, quantile, sortNum } from '../../engine/describe.js';
import { tOneSample, tPaired, tTwoSample, anova, welchAnova, levene, tukeyHSD, gamesHowell, rmAnova, summary } from '../../engine/compare.js';
import { mannWhitney, wilcoxonSignedRank, kruskalWallis, friedman } from '../../engine/nonparam.js';
import { chiSquareTest, fisher2x2, fisherRxC, mcnemar, linearByLinear, cochranQ } from '../../engine/tables.js';
import { pearson, spearman, kendall } from '../../engine/correlate.js';
import { wilson, clopperPearson, binomialTest, twoProportions } from '../../engine/proportions.js';
import { adjust } from '../../engine/multiplicity.js';

const ref = loadRef('stats.json');
const N = (v) => (Array.isArray(v) ? v.map(num) : num(v));

/** Collects mismatches so one run reports all of them. */
function checker(label) {
  const bad = [];
  return {
    eq(name, got, want, rel = 1e-9, abs = 1e-12) {
      if (Array.isArray(want)) { want.forEach((w, i) => this.eq(`${name}[${i}]`, got[i], w, rel, abs)); return; }
      const w = num(want);
      if (!close(got, w, rel, abs)) bad.push(`${label} ${name}: got ${got}, want ${w}`);
    },
    done() { assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 20).join('\n')}`); },
  };
}

test('noncentral t, chi-square and F', () => {
  const c = checker('noncentral');
  for (const [t, df, d, want] of ref.noncentral.nct) c.eq(`nct(${t},${df},${d})`, noncentralT.cdf(t, df, d), want, 1e-10, 1e-15);
  for (const [x, k, l, cdf, sf] of ref.noncentral.ncx2) {
    c.eq(`ncx2.cdf(${x},${k},${l})`, noncentralChiSquare.cdf(x, k, l), cdf, 1e-11);
    c.eq(`ncx2.sf(${x},${k},${l})`, noncentralChiSquare.sf(x, k, l), sf, 1e-11);
  }
  for (const [x, d1, d2, l, cdf, sf] of ref.noncentral.ncf) {
    c.eq(`ncf.cdf(${x},${d1},${d2},${l})`, noncentralF.cdf(x, d1, d2, l), cdf, 1e-11);
    c.eq(`ncf.sf(${x},${d1},${d2},${l})`, noncentralF.sf(x, d1, d2, l), sf, 1e-11);
  }
  c.done();
});

test('studentized range', () => {
  const c = checker('ptukey');
  // R's quadrature is good to about 1e-7 relative; p-values are reported to three decimals.
  for (const [q, k, df, want] of ref.range.cdf) c.eq(`cdf(${q},${k},${df})`, studentizedRange.cdf(q, k, df), want, 1e-7);
  for (const [p, k, df, want] of ref.range.ppf) c.eq(`ppf(${p},${k},${df})`, studentizedRange.ppf(p, k, df), want, 1e-6);
  c.done();
});

test('descriptive statistics and Shapiro-Wilk', () => {
  const c = checker('describe');
  for (const r of ref.describe) {
    const x = N(r.x);
    const n = x.length;
    const s6 = summarise(x, { qtype: 6 }), s7 = summarise(x, { qtype: 7 });
    c.eq(`n=${n} mean`, s6.mean, r.mean, 1e-13);
    c.eq(`n=${n} sd`, s6.sd, r.sd, 1e-12);
    c.eq(`n=${n} median`, s6.median, r.median, 1e-13);
    c.eq(`n=${n} q1 type 6`, s6.q1, r.q1_6, 1e-13);
    c.eq(`n=${n} q3 type 6`, s6.q3, r.q3_6, 1e-13);
    c.eq(`n=${n} q1 type 7`, s7.q1, r.q1_7, 1e-13);
    c.eq(`n=${n} q3 type 7`, s7.q3, r.q3_7, 1e-13);
    if (r.skew !== undefined) { c.eq(`n=${n} skew`, s6.skew, r.skew, 1e-10); c.eq(`n=${n} kurt`, s6.kurt, r.kurt, 1e-10); }
    const sw = shapiroWilk(x);
    // SciPy runs the same algorithm in single-precision Fortran; agreement to about 1e-6 is expected.
    c.eq(`n=${n} SW W`, sw.W, r.swW, 1e-6);
    c.eq(`n=${n} SW p`, sw.p, r.swP, 2e-4, 1e-6);
    if (r.ciMedian) c.eq(`n=${n} median CI`, [s6.ciMedian.lo, s6.ciMedian.hi], r.ciMedian, 1e-13);
    if (r.gmean !== undefined) c.eq(`n=${n} geometric mean`, s6.gmean, r.gmean, 1e-12);
  }
  c.done();
});

test('t-tests and Cohen d intervals', () => {
  const c = checker('t');
  for (const r of ref.compare.one) {
    const o = tOneSample(N(r.x), r.mu0);
    c.eq('one t', o.t, r.t, 1e-11); c.eq('one p', o.p, r.p, 1e-9); c.eq('one ci', o.ci, r.ci, 1e-10);
    c.eq('one d', o.d, r.d, 1e-11); c.eq('one ciD', o.ciD, r.ciD, 1e-8);
  }
  for (const r of ref.compare.paired) {
    const o = tPaired(N(r.x), N(r.y));
    c.eq('paired t', o.t, r.t, 1e-11); c.eq('paired p', o.p, r.p, 1e-9); c.eq('paired ci', o.ci, r.ci, 1e-10); c.eq('paired ciDz', o.ciDz, r.ciD, 1e-8);
  }
  for (const r of ref.compare.two) {
    const x = N(r.x), y = N(r.y);
    for (const [key, eq] of [['student', true], ['welch', false]]) {
      const o = tTwoSample(x, y, { equalVar: eq });
      c.eq(`${key} t`, o.t, r[key].t, 1e-11); c.eq(`${key} df`, o.df, r[key].df, 1e-11);
      c.eq(`${key} p`, o.p, r[key].p, 1e-9); c.eq(`${key} ci`, o.ci, r[key].ci, 1e-10);
    }
    const o = tTwoSample(x, y, { equalVar: true });
    c.eq('d', o.d, r.d, 1e-11); c.eq('ciD', o.ciD, r.ciD, 1e-8); c.eq('g', o.g, r.g, 1e-11);
  }
  c.done();
});

test('ANOVA, Welch, Levene, Tukey and Games-Howell', () => {
  const c = checker('anova');
  for (const r of ref.compare.anova) {
    const g = r.groups.map(N);
    const a = anova(g), w = welchAnova(g), l = levene(g, 'mean'), b = levene(g, 'median');
    c.eq('F', a.F, r.F, 1e-11); c.eq('p', a.p, r.p, 1e-9);
    c.eq('welch F', w.F, r.welchF, 1e-10); c.eq('welch df2', w.df2, r.welchDf2, 1e-10); c.eq('welch p', w.p, r.welchP, 1e-8);
    c.eq('levene F', l.F, r.leveneF, 1e-10); c.eq('levene p', l.p, r.leveneP, 1e-8);
    c.eq('BF F', b.F, r.bfF, 1e-10); c.eq('BF p', b.p, r.bfP, 1e-8);
  }
  for (const r of ref.compare.tukey) {
    const t = tukeyHSD(r.groups.map((x) => summary(N(x))));
    r.pairs.forEach(([i, j, diff, p, lo, hi]) => {
      const q = t.pairs.find((x) => x.i === i && x.j === j);
      c.eq(`tukey ${i}-${j} diff`, q.diff, diff, 1e-11);
      c.eq(`tukey ${i}-${j} p`, q.p, p, 1e-5, 1e-7);
      c.eq(`tukey ${i}-${j} ci`, q.ci, [lo, hi], 1e-6);
    });
  }
  for (const r of ref.compare.gh) {
    const t = gamesHowell(r.groups.map((x) => summary(N(x))));
    r.pairs.forEach(([i, j, diff, df, p]) => {
      const q = t.pairs.find((x) => x.i === i && x.j === j);
      c.eq(`GH ${i}-${j} diff`, q.diff, diff, 1e-11);
      c.eq(`GH ${i}-${j} df`, q.df, df, 1e-10);
      c.eq(`GH ${i}-${j} p`, q.p, p, 1e-5, 1e-7);
    });
  }
  c.done();
});

test('repeated-measures ANOVA with sphericity corrections', () => {
  const c = checker('rm');
  for (const r of ref.compare.rm) {
    const o = rmAnova(r.data.map(N));
    c.eq('F', o.F, r.F, 1e-10); c.eq('p', o.p, r.p, 1e-8); c.eq('epsGG', o.epsGG, r.epsGG, 1e-10);
    c.eq('pGG', o.pGG, r.pGG, 1e-8); c.eq('Mauchly W', o.mauchly.W, r.mauchlyW, 1e-9); c.eq('Mauchly p', o.mauchly.p, r.mauchlyP, 1e-8);
  }
  c.done();
});

test('rank tests and Hodges-Lehmann intervals', () => {
  const c = checker('nonparam');
  for (const r of ref.nonparam.mw) {
    const o = mannWhitney(N(r.x), N(r.y));
    c.eq(`MW U (${r.method})`, o.U, r.U, 1e-12);
    c.eq(`MW p (${r.method})`, o.p, r.p, 1e-10, 1e-14);
    assert.equal(o.method.startsWith('exact'), r.method === 'exact', `MW method: ${o.method}`);
    c.eq('MW HL', o.hl.estimate, r.hl, 1e-12);
    if (r.hlCi) c.eq('MW HL CI', o.hl.ci, r.hlCi, 1e-12);
  }
  for (const r of ref.nonparam.wx) {
    const o = wilcoxonSignedRank(N(r.x), N(r.y));
    c.eq(`WX Vmin (${r.method})`, o.Vmin, r.Vmin, 1e-12);
    c.eq(`WX p (${r.method})`, o.p, r.p, 1e-10, 1e-14);
    c.eq('WX HL', o.hl.estimate, r.hl, 1e-12);
    if (r.hlCi) c.eq('WX HL CI', o.hl.ci, r.hlCi, 1e-12);
  }
  for (const r of ref.nonparam.kw) {
    const o = kruskalWallis(r.groups.map(N));
    c.eq('KW H', o.H, r.H, 1e-11); c.eq('KW p', o.p, r.p, 1e-9);
    r.dunnHolm.forEach(([i, j, p]) => c.eq(`Dunn ${i}-${j}`, o.dunn.pairs.find((q) => q.i === i && q.j === j).pAdj, p, 1e-9));
  }
  for (const r of ref.nonparam.fr) {
    const o = friedman(r.data.map(N));
    c.eq('Friedman chi2', o.chi2, r.chi2, 1e-11); c.eq('Friedman p', o.p, r.p, 1e-9);
  }
  c.done();
});

test('contingency tables', () => {
  const c = checker('tables');
  for (const r of ref.tables.chi) {
    const o = chiSquareTest(r.t);
    c.eq('chi2', o.chi2, r.chi2, 1e-11); c.eq('p', o.p, r.p, 1e-9); c.eq('expected', o.expected.flat(), r.expected, 1e-12);
    c.eq('Cramer V', o.cramerV, r.cramerV, 1e-11); c.eq('G2', o.G2, r.G2, 1e-11); c.eq('adj residuals', o.adjResiduals.flat(), r.adjRes, 1e-10);
    if (r.chi2Yates !== undefined) { c.eq('Yates', o.chi2Yates, r.chi2Yates, 1e-11); c.eq('p Yates', o.pYates, r.pYates, 1e-9); }
  }
  for (const r of ref.tables.fisher2) {
    const o = fisher2x2(r.t);
    c.eq(`Fisher p ${JSON.stringify(r.t)}`, o.p, r.p, 1e-10, 1e-14);
    c.eq(`Fisher OR ${JSON.stringify(r.t)}`, o.orMLE, r.or, 1e-7);
    c.eq(`Fisher CI ${JSON.stringify(r.t)}`, o.ci, r.ci, 1e-6);
  }
  for (const r of ref.tables.fisherRxC) {
    const o = fisherRxC(r.t);
    assert.equal(o.method, 'exact');
    c.eq(`FFH ${JSON.stringify(r.t)}`, o.p, r.p, 1e-10);
  }
  for (const r of ref.tables.mcnemar) {
    const o = mcnemar(r.b, r.c);
    c.eq('McNemar exact', o.pExact, r.pExact, 1e-11); c.eq('McNemar chi2', o.chi2, r.chi2, 1e-12); c.eq('McNemar p', o.p, r.p, 1e-10);
  }
  for (const r of ref.tables.trend) {
    const o = linearByLinear(r.t);
    c.eq('trend |z|', Math.abs(o.z), Math.abs(num(r.z)), 1e-10); c.eq('trend p', o.p, r.p, 1e-9);
  }
  for (const r of ref.tables.cochranQ) {
    const o = cochranQ(r.data);
    c.eq('Q', o.Q, r.Q, 1e-11); c.eq('Q p', o.p, r.p, 1e-9);
  }
  c.done();
});

test('correlation', () => {
  const c = checker('correlate');
  for (const r of ref.correlate) {
    const x = N(r.x), y = N(r.y);
    const p = pearson(x, y), s = spearman(x, y), k = kendall(x, y);
    c.eq('r', p.r, r.r, 1e-12); c.eq('p r', p.p, r.pR, 1e-9); c.eq('ci r', p.ci, r.ciR, 1e-10);
    c.eq('rho', s.rho, r.rho, 1e-12); c.eq('p rho', s.p, r.pRho, 1e-9);
    c.eq('tau', k.tau, r.tau, 1e-12); c.eq(`p tau (${r.tauMethod})`, k.p, r.pTau, 1e-9);
  }
  c.done();
});

test('proportions', () => {
  const c = checker('proportions');
  for (const r of ref.proportions.one) {
    c.eq(`Wilson ${r.x}/${r.n}`, wilson(r.x, r.n), r.wilson, 1e-12);
    c.eq(`Clopper-Pearson ${r.x}/${r.n}`, clopperPearson(r.x, r.n), r.cp, 1e-10);
    c.eq(`binomial test ${r.x}/${r.n} vs ${r.p0}`, binomialTest(r.x, r.n, r.p0).p, r.pBinom, 1e-10);
  }
  for (const r of ref.proportions.two) {
    const o = twoProportions(r.x1, r.n1, r.x2, r.n2);
    c.eq('Newcombe CI', o.ci, r.ci, 1e-11); c.eq('z', o.z, r.z, 1e-11); c.eq('p', o.p, r.p, 1e-10);
  }
  c.done();
});

test('multiple-comparison adjustments', () => {
  const c = checker('adjust');
  for (const r of ref.multiplicity) for (const m of ['bonferroni', 'holm', 'hochberg', 'bh', 'by']) c.eq(m, adjust(r.p, m), r[m], 1e-12);
  c.done();
});

test('quantile edge cases', () => {
  const s = sortNum([3, 1, 2]);
  assert.equal(quantile(s, 0, 7), 1);
  assert.equal(quantile(s, 1, 6), 3);
  assert.equal(quantile(sortNum([5]), 0.25, 6), 5);
});
