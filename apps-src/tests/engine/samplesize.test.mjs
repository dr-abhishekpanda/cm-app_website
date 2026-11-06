/* Sample size and power against tests/ref/samplesize.json (statsmodels, SciPy and the published formulas). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import * as S from '../../engine/samplesize.js';

const ref = loadRef('samplesize.json');

function checker(label) {
  const bad = [];
  return {
    eq(name, got, want, rel = 1e-9) { if (!close(got, want, rel, 1e-12)) bad.push(`${label} ${name}: got ${got}, want ${want}`); },
    done() { assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.join('\n')}`); },
  };
}

test('estimation of a proportion, a mean, sensitivity and specificity', () => {
  const c = checker('estimate');
  for (const r of ref.estProp) {
    const o = S.estimateProportion({ p: r.p, d: r.d, relative: r.relative, conf: r.conf, N: r.N ?? Infinity });
    c.eq(`prop n0 ${r.p}`, o.n0, r.n0, 1e-12); c.eq(`prop n ${r.p}`, o.n, r.n, 1e-12);
  }
  for (const r of ref.estMean) c.eq(`mean ${r.sd}`, S.estimateMean({ sd: r.sd, d: r.d, conf: r.conf }).n, r.n, 1e-12);
  for (const r of ref.sensSpec) {
    const o = S.sensSpec(r);
    c.eq('nSe', o.nSe, r.nSe, 1e-12); c.eq('nSp', o.nSp, r.nSp, 1e-12);
  }
  // Worked example in Lwanga and Lemeshow's form: p = 0.3, d = 0.05, 95% gives 322.7, so 323.
  assert.equal(Math.ceil(S.estimateProportion({ p: 0.3, d: 0.05 }).n), 323);
  c.done();
});

test('two proportions (Fleiss), case-control and power round trip', () => {
  const c = checker('fleiss');
  for (const r of ref.twoProps) {
    const o = S.twoProportions({ p1: r.p1, p2: r.p2, alpha: r.alpha, power: r.power, sides: r.sides, ratio: r.ratio });
    c.eq(`n1 ${r.p1}/${r.p2}`, o.n1, r.n1, 1e-12); c.eq(`n1cc ${r.p1}/${r.p2}`, o.n1cc, r.n1cc, 1e-12);
    // Power at the computed n recovers the target, with and without the correction.
    c.eq('power round trip', S.twoProportionsPower({ p1: r.p1, p2: r.p2, n1: o.n1, n2: o.n2, alpha: r.alpha, sides: r.sides, cc: false }), r.power, 1e-10);
    c.eq('power round trip cc', S.twoProportionsPower({ p1: r.p1, p2: r.p2, n1: o.n1cc, n2: o.n2cc, alpha: r.alpha, sides: r.sides, cc: true }), r.power, 1e-10);
  }
  for (const r of ref.caseControl) {
    const o = S.caseControl({ p0: r.p0, or: r.or, alpha: 0.05, power: 0.8, sides: 2, ratio: r.ratio });
    c.eq('p1', o.p1, r.p1, 1e-14); c.eq(`n cases OR ${r.or}`, o.n1, r.n1, 1e-12);
  }
  c.done();
});

test('t-test sample sizes and power match statsmodels', () => {
  const c = checker('t');
  for (const r of ref.twoMeansT) {
    const o = S.twoMeans({ sd: 1, diff: r.es, alpha: r.alpha, power: r.power, sides: r.sides, ratio: r.ratio });
    c.eq(`n1 d=${r.es}`, o.n1t, r.n1, 1e-6);
    c.eq(`power n1=30 d=${r.es}`, S.twoMeansPower({ sd: 1, diff: r.es, n1: 30, n2: 30 * r.ratio, alpha: r.alpha, sides: r.sides }), r.power30, 1e-9);
  }
  for (const r of ref.oneMeanT) {
    const o = S.oneMean({ sd: 1, diff: r.es, alpha: r.alpha, power: r.power, sides: r.sides });
    c.eq(`n d=${r.es}`, o.nt, r.n, 1e-6);
    c.eq(`power n=20 d=${r.es}`, S.oneMeanPower({ sd: 1, diff: r.es, n: 20, alpha: r.alpha, sides: r.sides }), r.power20, 1e-9);
  }
  c.done();
});

test('ANOVA and regression power (noncentral F)', () => {
  const c = checker('F');
  for (const r of ref.anova) {
    c.eq(`total f=${r.f} k=${r.k}`, S.anovaN({ f: r.f, k: r.k, alpha: r.alpha, power: r.power }).total, r.total, 1e-6);
    c.eq(`power N=60 f=${r.f}`, S.anovaPower({ f: r.f, k: r.k, n: 60 / r.k, alpha: r.alpha }), r.power60, 1e-9);
  }
  for (const r of ref.regression) c.eq(`N R2=${r.r2}`, S.regressionN({ r2: r.r2, predictors: r.predictors, alpha: r.alpha, power: r.power }).N, r.N, 1e-6);
  c.done();
});

test('paired proportions, correlation, survival, non-inferiority', () => {
  const c = checker('other');
  for (const r of ref.paired) c.eq(`Connor ${r.p10}/${r.p01}`, S.pairedProportions({ p10: r.p10, p01: r.p01 }).n, r.n, 1e-12);
  for (const r of ref.corr) {
    c.eq(`corr n r=${r.r}`, S.correlation({ r: r.r }).n, r.n, 1e-12);
    c.eq(`corr power r=${r.r}`, S.correlationPower({ r: r.r, n: 50 }), r.power50, 1e-12);
  }
  for (const r of ref.survival) c.eq(`events HR ${r.hr}`, S.survivalEvents({ hr: r.hr, ratio: r.ratio }).events, r.events, 1e-12);
  for (const r of ref.niProps) c.eq('NI proportions', S.nonInferiorityProportions({ pT: r.pT, pC: r.pC, margin: r.margin }).nC, r.nC, 1e-12);
  for (const r of ref.niMeans) c.eq('NI means', S.nonInferiorityMeans({ sd: r.sd, diff: r.diff, margin: r.margin }).nC, r.nC, 1e-12);
  c.done();
});
