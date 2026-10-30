/* Regression and survival models against tests/ref/models.json (statsmodels, scikit-learn, lifelines). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { ols, logistic, hosmerLemeshow, rocAuc } from '../../engine/regression.js';
import { kaplanMeier, logRank, cox } from '../../engine/survival.js';

const ref = loadRef('models.json');
function checker(label) {
  const bad = [];
  return {
    eq(name, got, want, rel = 1e-9, abs = 1e-12) {
      if (Array.isArray(want)) { want.forEach((w, i) => this.eq(`${name}[${i}]`, got[i], w, rel, abs)); return; }
      if (!close(got, want, rel, abs)) bad.push(`${label} ${name}: got ${got}, want ${want}`);
    },
    done() { assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 25).join('\n')}`); },
  };
}

test('ordinary least squares matches statsmodels', () => {
  const c = checker('ols');
  for (const r of ref.ols) {
    const f = ols(r.X, r.y);
    c.eq('beta', f.coef.map((q) => q.b), r.beta, 1e-10); c.eq('se', f.coef.map((q) => q.se), r.se, 1e-10);
    c.eq('p', f.coef.map((q) => q.p), r.p, 1e-8, 1e-15); c.eq('ci lo', f.coef.map((q) => q.ci[0]), r.lo, 1e-10); c.eq('ci hi', f.coef.map((q) => q.ci[1]), r.hi, 1e-10);
    c.eq('r2', f.r2, r.r2, 1e-11); c.eq('adjR2', f.adjR2, r.adjR2, 1e-11); c.eq('F', f.F, r.F, 1e-10); c.eq('pF', f.pF, r.pF, 1e-8, 1e-15);
    c.eq('cooks', f.cooks.slice(0, 5), r.cooks, 1e-9); c.eq('leverage', f.leverage.slice(0, 5), r.lev, 1e-10);
  }
  c.done();
});

test('logistic regression, Hosmer-Lemeshow and ROC area', () => {
  const c = checker('logit');
  for (const r of ref.logit) {
    const f = logistic(r.X, r.y);
    c.eq('beta', f.coef.map((q) => q.b), r.beta, 1e-7); c.eq('se', f.coef.map((q) => q.se), r.se, 1e-7);
    c.eq('p', f.coef.map((q) => q.p), r.p, 1e-6, 1e-14); c.eq('OR lo', f.coef.map((q) => q.ci[0]), r.orLo, 1e-7); c.eq('OR hi', f.coef.map((q) => q.ci[1]), r.orHi, 1e-7);
    // statsmodels fits the null model iteratively; ours is the closed form, so ll0 agrees to about 1e-10.
    c.eq('ll', f.ll, r.ll, 1e-11); c.eq('ll0', f.ll0, r.ll0, 1e-9); c.eq('LR', f.lr, r.lr, 1e-8); c.eq('pLR', f.pLR, r.pLR, 1e-6, 1e-14);
    c.eq('McFadden', f.mcfadden, r.mcfadden, 1e-9);
    const hl = hosmerLemeshow(r.y, f.fitted);
    c.eq('HL chi2', hl.chi2, r.hl, 1e-6); assert.equal(hl.df, r.hlDf); c.eq('HL p', hl.p, r.hlP, 1e-6);
    const roc = rocAuc(r.y, f.fitted);
    c.eq('AUC', roc.auc, r.auc, 1e-9); c.eq('DeLong SE', roc.se, r.aucSE, 1e-7);
  }
  c.done();
});

test('Kaplan-Meier, median survival and log-rank match lifelines', () => {
  const c = checker('km');
  for (const r of ref.km) {
    const k = kaplanMeier(r.time, r.event);
    const ev = k.steps.slice(1);
    c.eq('times', ev.map((s) => s.t), r.t, 0); c.eq('S', ev.map((s) => s.S), r.S, 1e-12);
    c.eq('lo', ev.map((s) => s.lo), r.lo, 1e-9); c.eq('hi', ev.map((s) => s.hi), r.hi, 1e-9);
    c.eq('median', k.median, r.median, 0); c.eq('median lo', k.medianCI[0], r.medianLo, 0); c.eq('median hi', k.medianCI[1], r.medianHi, 0);
  }
  for (const r of ref.logrank) {
    const l = logRank(r.time, r.event, r.group);
    c.eq('log-rank chi2', l.chi2, r.chi2, 1e-10); c.eq('log-rank p', l.p, r.p, 1e-9);
  }
  c.done();
});

test('Cox proportional hazards (Efron ties) matches lifelines', () => {
  const c = checker('cox');
  for (const r of ref.cox) {
    const f = cox(r.X, r.time, r.event);
    c.eq('beta', f.coef.map((q) => q.b), r.beta, 1e-6); c.eq('se', f.coef.map((q) => q.se), r.se, 1e-6);
    c.eq('p', f.coef.map((q) => q.p), r.p, 1e-5, 1e-12); c.eq('ll', f.ll, r.ll, 1e-9); c.eq('concordance', f.concordance, r.c, 1e-9);
  }
  c.done();
});
