/* Measures of frequency, association and impact against tests/ref/epi.json (R stats, epiR, epitools)
 * and tests/ref/epi_py.json (statsmodels), plus worked definitions. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import {
  proportion, rate, binomialMidP, twoByTwo, personTime, matchedPairs, riskRatioScore, oddsRatioMidP,
  numberNeeded, exposedFraction, populationFractionCohort, populationFractionCaseControl, populationFraction, impliedRiskDifference,
} from '../../engine/epi.js';

const R = loadRef('epi.json');
const PY = loadRef('epi_py.json');

// R writes infinity as 1e308 and undefined values as "NaN"; Python writes "inf".
const v = (x) => (x === 'NaN' || x === null ? NaN : x === 'inf' || x >= 1e308 ? Infinity : x === '-inf' || x <= -1e308 ? -Infinity : x);

function checker(label) {
  const bad = [];
  return {
    eq(name, got, want, rel = 1e-9, abs = 1e-12) {
      if (Array.isArray(want)) {
        if (!Array.isArray(got)) { bad.push(`${label} ${name}: got ${got}, want [${want}]`); return; }
        want.forEach((w, i) => this.eq(`${name}[${i}]`, got[i], w, rel, abs)); return;
      }
      const w = v(want);
      if (!close(got, w, rel, abs)) bad.push(`${label} ${name}: got ${got}, want ${w}`);
    },
    ok(name, cond) { if (!cond) bad.push(`${label} ${name}`); },
    done() { assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 30).join('\n')}`); },
  };
}

test('proportions (Wilson, Clopper-Pearson, mid-p) and Poisson rates match R', () => {
  const c = checker('frequency');
  for (const r of R.props) {
    c.eq(`wilson ${r.x}/${r.n}`, proportion(r.x, r.n).ci, r.wilson, 1e-10, 1e-14);
    c.eq(`exact ${r.x}/${r.n}`, proportion(r.x, r.n, { method: 'exact' }).ci, r.exact, 1e-10, 1e-14);
    c.eq(`midp ${r.x}/${r.n}`, binomialMidP(r.x, r.n), r.midp, 1e-9, 1e-14);
  }
  for (const r of R.rates) c.eq(`rate ${r.x}/${r.t}`, rate(r.x, r.t).ci, r.exact, 1e-10, 1e-14);
  c.done();
});

test('2 x 2 tables: odds ratios, tests, risk ratios, differences and fractions match R (epiR, epitools, stats)', () => {
  const c = checker('2x2');
  for (const r of R.two) {
    const t = r.t, tag = JSON.stringify(t);
    const o = twoByTwo(t, { design: r.design });
    // Odds ratio and its intervals.
    if (Number.isFinite(v(r.or.wald[0]))) { c.eq(`${tag} OR`, o.or.est, r.or.wald[0]); c.eq(`${tag} OR Woolf`, o.or.wald, r.or.wald.slice(1)); }
    else c.ok(`${tag} Woolf should be null with a zero cell`, o.or.wald === null);
    // fisher.test solves for its limits with uniroot's default tolerance: hold it to 2e-3 (SciPy, below, to 1e-8).
    c.eq(`${tag} OR exact (fisher.test)`, o.or.exact, r.or.exact, 2e-3, 1e-12);
    c.eq(`${tag} OR cmle (fisher.test)`, o.or.cmle, r.or.cmle, 2e-3);
    c.eq(`${tag} OR mid-p`, o.or.midp, r.or.midp, 1e-9, 1e-12);
    if (r.or.midpEpitools) c.eq(`${tag} OR mid-p (epitools, tolerance 1e-4)`, o.or.midp, r.or.midpEpitools, 2e-3);
    // Tests.
    c.eq(`${tag} chi2`, o.tests.chi2, r.tests.chi2, 1e-11); c.eq(`${tag} p`, o.tests.p, r.tests.p, 1e-9, 1e-15);
    c.eq(`${tag} Yates`, o.tests.chi2Yates, r.tests.chi2Yates, 1e-11); c.eq(`${tag} p Yates`, o.tests.pYates, r.tests.pYates, 1e-9, 1e-15);
    c.eq(`${tag} p Fisher`, o.tests.pFisher, r.tests.pFisher, 1e-9, 1e-15); c.eq(`${tag} p mid-p`, o.tests.pMidp, r.tests.pMidp, 1e-9, 1e-15);
    if (r.design === 'case-control') {
      // epiR's AFest uses fisher.test's conditional MLE and exact limits (so the same 2e-3 tolerance).
      const af = exposedFraction(o.or.cmle, o.or.exact);
      if (af.kind === 'attributable') { c.eq(`${tag} AFe`, af.est, r.afe[0], 2e-3); c.eq(`${tag} AFe ci`, af.ci, r.afe.slice(1), 2e-3, 2e-3); }
      else { c.eq(`${tag} PFe`, af.est, 1 - r.or.cmle, 2e-3); c.eq(`${tag} PFe ci`, af.ci, [1 - r.or.exact[1], 1 - r.or.exact[0]], 2e-3, 2e-3); }
      const paf = populationFractionCaseControl(...t.flat());
      if (paf.kind === 'attributable') { c.eq(`${tag} PAF`, paf.est, r.paf[0]); c.eq(`${tag} PAF ci`, paf.ci, r.paf.slice(1)); }
      else {
        const pf = (x) => 1 - 1 / (1 - x);
        c.eq(`${tag} PF`, paf.est, pf(r.paf[0])); c.eq(`${tag} PF ci`, paf.ci, [pf(r.paf[2]), pf(r.paf[1])]);
      }
      continue;
    }
    // Cohort and cross-sectional: risk ratio, risk difference, fractions.
    if (Number.isFinite(v(r.rr.wald[1]))) { c.eq(`${tag} RR`, o.rr.est, r.rr.wald[0]); c.eq(`${tag} RR Katz`, o.rr.wald, r.rr.wald.slice(1)); }
    else c.ok(`${tag} Katz should be null with a zero count`, o.rr.wald === null);
    c.eq(`${tag} RD`, o.rd.est, r.rd.wald[0], 1e-12, 1e-15); c.eq(`${tag} RD Wald`, o.rd.wald, r.rd.wald.slice(1), 1e-10, 1e-14);
    c.eq(`${tag} risk Wilson`, o.r1.ci, r.r1.wilson, 1e-10, 1e-14);
    if (o.rr.wald) {
      const af = exposedFraction(o.rr.est, o.rr.wald);
      if (af.kind === 'attributable') { c.eq(`${tag} AFe`, af.est, r.afe[0]); c.eq(`${tag} AFe ci`, af.ci, r.afe.slice(1)); }
      else { c.eq(`${tag} PFe`, af.est, 1 - r.rr.wald[0]); c.eq(`${tag} PFe ci`, af.ci, [1 - r.rr.wald[2], 1 - r.rr.wald[1]]); }
    }
    const paf = populationFractionCohort(...t.flat());
    if (Number.isFinite(v(r.paf[1]))) {
      if (paf.kind === 'attributable') { c.eq(`${tag} PAF`, paf.est, r.paf[0]); c.eq(`${tag} PAF ci`, paf.ci, r.paf.slice(1)); }
      else {
        const pf = (x) => 1 - 1 / (1 - x);
        c.eq(`${tag} PF`, paf.est, pf(r.paf[0])); c.eq(`${tag} PF ci`, paf.ci, [pf(r.paf[2]), pf(r.paf[1])]);
      }
      // Jewell's closed-form variance equals the multinomial delta-method variance.
      const [a, b, cc, d] = t.flat(), N = a + b + cc + d;
      const p = (a * d - b * cc) / ((a + cc) * (cc + d));
      c.eq(`${tag} Jewell variance = delta method`, (b + p * (a + d)) / (N * cc), r.pafVarDelta, 1e-6);
    } else c.ok(`${tag} PAF CI should be null when no unexposed person has the outcome`, paf.ci === null);
  }
  c.done();
});

test("Koopman's score CI, Newcombe's CI and the exact odds ratio match statsmodels and SciPy", () => {
  const c = checker('score');
  for (const r of PY.two) {
    const [[a, b], [cc, d]] = r.t, tag = JSON.stringify(r.t);
    c.eq(`${tag} RR score`, riskRatioScore(a, a + b, cc, cc + d), r.rrScore, 1e-9, 1e-12);
    const o = twoByTwo(r.t);
    c.eq(`${tag} RD Newcombe`, o.rd.newcombe, r.rdNewcombe, 1e-10, 1e-14);
    c.eq(`${tag} RD Wald`, o.rd.wald, r.rdWald, 1e-10, 1e-14);
    if (r.orExact) { c.eq(`${tag} OR exact (SciPy)`, o.or.exact, r.orExact, 1e-8, 1e-12); c.eq(`${tag} OR cmle (SciPy)`, o.or.cmle, r.orCmle, 1e-8); }
  }
  c.done();
});

test('number needed to treat: exact whole numbers and the CI through infinity (Altman 1998)', () => {
  // 30 of 100 against 10 of 100: RD is exactly 0.2, so the NNT is exactly 5. In floating point
  // 0.3 - 0.1 = 0.19999999999999998 and 1 / that rounds up to 6, the defect in the earlier build.
  assert.equal(0.3 - 0.1 === 0.2, false);
  const o = twoByTwo([[30, 70], [10, 90]]);
  assert.equal(o.nnt.whole, 5);
  assert.equal(o.nnt.value, 5);
  assert.equal(o.nnt.interval.crosses, false);
  assert.ok(close(o.nnt.interval.ci[0], 1 / o.rd.newcombe[1], 1e-12) && close(o.nnt.interval.ci[1], 1 / o.rd.newcombe[0], 1e-12));
  // 7 of 30 against 1 of 30: RD = 0.2 again, and 1/RD = 5.000000000000001 in floating point.
  assert.equal(twoByTwo([[7, 23], [1, 29]]).nnt.whole, 5);
  // Not a whole number: 1 / (12/50 - 6/50) = 8.33, rounded up to 9.
  const w = twoByTwo([[12, 38], [6, 44]]);
  assert.ok(close(w.nnt.value, 50 / 6, 1e-14));
  assert.equal(w.nnt.whole, 9);
  // Its Newcombe CI (-0.0328 to 0.2685) includes zero, so the NNT CI runs through infinity.
  assert.equal(w.nnt.interval.crosses, true);
  assert.ok(close(w.nnt.interval.neg, 1 / Math.abs(w.rd.newcombe[0]), 1e-12) && close(w.nnt.interval.pos, 1 / w.rd.newcombe[1], 1e-12));
  // No difference: infinite NNT.
  assert.equal(numberNeeded(0, [-0.1, 0.1], [0, 100]).value, Infinity);
  // Protective direction: the sign is reported, the CI is still on |RD|.
  const p = twoByTwo([[10, 90], [30, 70]]);
  assert.equal(p.nnt.sign, -1); assert.equal(p.nnt.whole, 5);
});

test('person-time: rate ratio (exact, mid-p, Wald), tests and the exact population fraction match R', () => {
  const c = checker('person-time');
  for (const r of R.pt) {
    const o = personTime(r.a, r.t1, r.c, r.t0), tag = `${r.a}/${r.t1} vs ${r.c}/${r.t0}`;
    c.eq(`${tag} IRR`, o.irr.est, r.est, 1e-12);
    c.eq(`${tag} exact`, o.irr.exact, r.exact, 1e-9, 1e-14);
    c.eq(`${tag} p exact`, o.tests.pExact, r.pExact, 1e-8, 1e-300);
    const toIRR = (q) => (q >= 1 ? Infinity : (q / (1 - q)) * (r.t0 / r.t1));
    c.eq(`${tag} mid-p`, o.irr.midp, r.midpBinom.map(toIRR), 1e-9, 1e-14);
    if (r.midpEpitools) {
      c.eq(`${tag} mid-p (epitools, tolerance 1e-4)`, o.irr.midp, r.midpEpitools, 2e-3);
      c.eq(`${tag} p mid-p`, o.tests.pMidp, r.pMidpEpitools, 1e-8, 1e-300);
      c.eq(`${tag} Wald`, o.irr.wald, r.wald, 1e-10);
    }
    const f = o.paf;
    if (f.kind === 'attributable') { c.eq(`${tag} PAF`, f.est, r.pafExact[0]); c.eq(`${tag} PAF ci`, f.ci, r.pafExact.slice(1), 1e-9, 1e-14); }
    else {
      const pf = (x) => 1 - 1 / (1 - x);
      c.eq(`${tag} PF`, f.est, pf(r.pafExact[0])); c.eq(`${tag} PF ci`, f.ci, [pf(r.pafExact[2]), pf(r.pafExact[1])], 1e-9, 1e-14);
    }
  }
  c.done();
});

test('matched pairs: odds ratio CIs and McNemar match R', () => {
  const c = checker('matched');
  for (const r of R.matched) {
    const o = matchedPairs(r.e, r.f, r.g, r.h), tag = `${r.f}:${r.g}`;
    c.eq(`${tag} exact`, o.or.exact, r.exact, 1e-9, 1e-14);
    c.eq(`${tag} mid-p`, o.or.midp, r.midp, 1e-9, 1e-14);
    c.eq(`${tag} p exact`, o.tests.pExact, r.pExact, 1e-10); c.eq(`${tag} chi2`, o.tests.chi2, r.chi2, 1e-12); c.eq(`${tag} p`, o.tests.p, r.p, 1e-10);
  }
  c.done();
});

test("population fractions: Levin's and Miettinen's formulas, prevented fractions, implied risk differences", () => {
  const c = checker('impact');
  // Levin: Pe = 0.3, RR = 2: 0.3 / 1.3. Miettinen: pc = 0.6, RR = 3: 0.6 x 2/3 = 0.4.
  c.eq('Levin', populationFraction({ est: 2, ci: [1.5, 2.8], pe: 0.3 }).est, 0.3 / 1.3, 1e-15);
  c.eq('Levin ci', populationFraction({ est: 2, ci: [1.5, 2.8], pe: 0.3 }).ci, [0.15 / 1.15, 0.54 / 1.54], 1e-14);
  c.eq('Miettinen', populationFraction({ est: 3, ci: null, pc: 0.6 }).est, 0.4, 1e-15);
  // Prevented: Pe = 0.5, RR = 0.4: Pe (1 - RR) = 0.3. The same through the proportion of cases exposed.
  const lev = populationFraction({ est: 0.4, ci: [0.3, 0.6], pe: 0.5 });
  c.ok('prevented kind', lev.kind === 'prevented');
  c.eq('prevented (Levin)', lev.est, 0.3, 1e-15); c.eq('prevented ci', lev.ci, [0.5 * 0.4, 0.5 * 0.7], 1e-14);
  const pc = (0.5 * 0.4) / (0.5 * 0.4 + 0.5);
  c.eq('prevented (Miettinen) agrees', populationFraction({ est: 0.4, ci: null, pc }).est, 0.3, 1e-14);
  // A ratio of 1.5 with exposure in the cases and the population consistent: both formulas agree.
  const pe = 0.25, rr = 1.5, pc2 = (pe * rr) / (pe * rr + 1 - pe);
  c.eq('Levin = Miettinen without confounding', populationFraction({ est: rr, pe }).est, populationFraction({ est: rr, pc: pc2 }).est, 1e-14);
  // Odds ratio 2 at a baseline risk of 10%: risk 0.2 / 1.1, difference 0.0818.
  c.eq('implied RD from OR', impliedRiskDifference('or', 2, 0.1), 0.2 / 1.1 - 0.1, 1e-15);
  c.eq('implied RD from RR', impliedRiskDifference('rr', 0.75, 0.2), -0.05, 1e-15);
  // Exposed fractions: RR 4 -> 0.75; RR 0.25 -> prevented 0.75.
  c.eq('AFe', exposedFraction(4, [2, 8]).est, 0.75, 1e-15); c.eq('AFe ci', exposedFraction(4, [2, 8]).ci, [0.5, 0.875], 1e-15);
  c.ok('PFe kind', exposedFraction(0.25, [0.1, 0.5]).kind === 'prevented');
  c.eq('PFe ci', exposedFraction(0.25, [0.1, 0.5]).ci, [0.5, 0.9], 1e-15);
  c.done();
});

test('small and zero cells choose exact or score intervals, and say so', () => {
  const big = twoByTwo([[40, 60], [20, 80]]);
  assert.equal(big.rr.auto, 'wald'); assert.equal(big.or.auto, 'wald'); assert.equal(big.tests.exact, false);
  const small = twoByTwo([[3, 7], [1, 9]]);
  assert.equal(small.rr.auto, 'score'); assert.equal(small.or.auto, 'exact'); assert.equal(small.tests.exact, true);
  const zero = twoByTwo([[0, 10], [5, 15]]);
  assert.equal(zero.rr.wald, null); assert.equal(zero.rr.score[0], 0); assert.ok(Number.isFinite(zero.rr.score[1]));
  assert.equal(zero.afe.kind, 'prevented'); assert.equal(zero.afe.est, 1);
  const allExposed = twoByTwo([[6, 4], [0, 10]]);
  assert.equal(allExposed.rr.est, Infinity); assert.equal(allExposed.rr.score[1], Infinity);
  assert.equal(oddsRatioMidP(6, 4, 0, 10).ci[1], Infinity);
});
