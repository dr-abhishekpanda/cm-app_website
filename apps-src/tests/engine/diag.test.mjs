/* Diagnostic accuracy and ROC against tests/ref/diag.json (R: prop.test, binom.test, epiR epi.tests,
 * pROC) and tests/ref/diag_py.json (statsmodels score statistic, SciPy exact odds ratio, scikit-learn AUC).
 * Inputs in tests/ref/diag_input.json. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { normal } from '../../engine/dist.js';
import { testAccuracy, atPrevalence, postTest, classifyValue, countTable, rocAnalysis, rocCutoffs, rocPaired, rocUnpaired, compareAucSummary, expandGrouped, autoDirection } from '../../engine/diag.js';

const IN = loadRef('diag_input.json');
const R = loadRef('diag.json');
const PY = loadRef('diag_py.json');
const v = (x) => (x === 'NaN' || x === 'nan' || x === null || x === undefined ? NaN : x === 'inf' || x >= 1e308 ? Infinity : x === '-inf' || x <= -1e308 ? -Infinity : x);

function checker(label) {
  const bad = [];
  let n = 0;
  return {
    eq(name, got, want, rel = 1e-9, abs = 1e-12) {
      if (Array.isArray(want)) { want.forEach((w, i) => this.eq(`${name}[${i}]`, got?.[i], w, rel, abs)); return; }
      const w = v(want);
      if (Number.isNaN(w)) return; // no reference value here
      n++;
      if (!close(got, w, rel, abs)) bad.push(`${label} ${name}: got ${got}, want ${w}`);
    },
    ok(name, cond) { n++; if (!cond) bad.push(`${label} ${name}`); },
    done(min) {
      assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 30).join('\n')}`);
      assert.ok(n >= min, `${label}: only ${n} comparisons ran, expected at least ${min}`);
    },
  };
}

const tableOf = ([tp, fp, fn, tn]) => ({ tp, fp, fn, tn });

test('test against a reference: proportions match prop.test and binom.test; likelihood ratios match epiR (log) and statsmodels (score); DOR matches epiR (Woolf) and SciPy (exact)', () => {
  const c = checker('2x2');
  R.tables.forEach((r, i) => {
    const o = testAccuracy(tableOf(r.t)), tag = `table ${r.t.join('/')}`;
    for (const k of ['se', 'sp', 'ppv', 'npv', 'prev', 'acc']) {
      if (!r[k]) { c.ok(`${tag} ${k} absent`, o[k] === null); continue; }
      c.eq(`${tag} ${k}`, o[k].est, r[k].est, 1e-14);
      c.eq(`${tag} ${k} Wilson`, o[k].wilson, r[k].wilson, 1e-9, 1e-14);
      c.eq(`${tag} ${k} exact`, o[k].exact, r[k].exact, 1e-8, 1e-14);
    }
    if (r.epiR) {
      const fin = (a) => a.every((x) => Number.isFinite(v(x)) && v(x) > 0);
      if (fin(r.epiR.lrPos)) { c.eq(`${tag} LR+`, o.lrPos.est, r.epiR.lrPos[0], 1e-12); c.eq(`${tag} LR+ log ci`, o.lrPos.log, r.epiR.lrPos.slice(1), 1e-9); }
      if (fin(r.epiR.lrNeg)) { c.eq(`${tag} LR-`, o.lrNeg.est, r.epiR.lrNeg[0], 1e-12); c.eq(`${tag} LR- log ci`, o.lrNeg.log, r.epiR.lrNeg.slice(1), 1e-9); }
      if (fin(r.epiR.dor)) { c.eq(`${tag} DOR`, o.dor.est, r.epiR.dor[0], 1e-12); c.eq(`${tag} DOR Woolf`, o.dor.woolf, r.epiR.dor.slice(1), 1e-9); }
      c.eq(`${tag} Youden`, o.youden.est, r.epiR.youden[0], 1e-12);
    }
    const p = PY.tables[i];
    if (p.dorExact) c.eq(`${tag} DOR exact (SciPy)`, o.dor.exact, p.dorExact, 1e-7, 1e-12);
    c.eq(`${tag} LR+ score`, o.lrPos.score, p.lrPosScore, 1e-8, 1e-12);
    c.eq(`${tag} LR- score`, o.lrNeg.score, p.lrNegScore, 1e-8, 1e-12);
    // The reported interval: log when every cell is 5 or more, score otherwise.
    c.ok(`${tag} LR method`, o.lrPos.auto === (Math.min(...r.t) >= 5 ? 'log' : 'score'));
    // Youden's J: Wald interval from the two binomial variances.
    const se = r.t[0] / (r.t[0] + r.t[2]), sp = r.t[3] / (r.t[1] + r.t[3]);
    const sj = Math.sqrt(se * (1 - se) / (r.t[0] + r.t[2]) + sp * (1 - sp) / (r.t[1] + r.t[3])), z = normal.isf(0.025);
    c.eq(`${tag} J ci`, o.youden.ci, [Math.max(-1, se + sp - 1 - z * sj), Math.min(1, se + sp - 1 + z * sj)], 1e-12, 1e-14);
  });
  c.done(250);
});

test('predictive values at any prevalence: Bayes from the likelihood ratios; the log interval is the logit interval of Mercaldo, Lau and Zhou (2007)', () => {
  const c = checker('PV');
  const z = normal.isf(0.025), expit = (t) => 1 / (1 + Math.exp(-t)), logit = (p) => Math.log(p / (1 - p));
  for (const t of IN.tables) {
    const o = testAccuracy(tableOf(t)), tag = `table ${t.join('/')}`;
    const [tp, fp, fn, tn] = t, n1 = tp + fn, n0 = fp + tn, se = tp / n1, sp = tn / n0;
    // At the sample prevalence the point estimates are the sample predictive values.
    const ps = atPrevalence(o, n1 / (n1 + n0));
    if (tp + fp > 0) c.eq(`${tag} PPV at sample prevalence`, ps.ppv.est, tp / (tp + fp), 1e-12);
    if (tn + fn > 0) c.eq(`${tag} NPV at sample prevalence`, ps.npv.est, tn / (tn + fn), 1e-12);
    for (const p of [0.01, 0.1, 0.3, 0.67]) {
      const a = atPrevalence(o, p);
      if (Math.min(...t) >= 5) {
        // Mercaldo et al.: logit(PPV) = logit(p) + log(Se / (1 - Sp)), var = (1 - Se)/(Se n1) + Sp/((1 - Sp) n0); NPV likewise.
        const lp = logit(p) + Math.log(se / (1 - sp)), vp = (1 - se) / (se * n1) + sp / ((1 - sp) * n0);
        const ln = -logit(p) + Math.log(sp / (1 - se)), vn = se / ((1 - se) * n1) + (1 - sp) / (sp * n0);
        c.eq(`${tag} PPV at ${p}`, a.ppv.est, expit(lp), 1e-12);
        c.eq(`${tag} PPV ci at ${p}`, a.ppv.ci, [expit(lp - z * Math.sqrt(vp)), expit(lp + z * Math.sqrt(vp))], 1e-10);
        c.eq(`${tag} NPV ci at ${p}`, a.npv.ci, [expit(ln - z * Math.sqrt(vn)), expit(ln + z * Math.sqrt(vn))], 1e-10);
        c.ok(`${tag} log method`, a.ppv.method === 'log');
      } else {
        c.ok(`${tag} score method`, a.ppv.method === 'score');
        c.eq(`${tag} PPV ci from score LR at ${p}`, a.ppv.ci, o.lrPos.score.map((l) => postTest(p, l)), 1e-12);
      }
      c.ok(`${tag} intervals contain estimates at ${p}`, !(a.ppv.ci[0] > a.ppv.est + 1e-12 || a.ppv.ci[1] < a.ppv.est - 1e-12) && !(a.npv.ci[0] > a.npv.est + 1e-12 || a.npv.ci[1] < a.npv.est - 1e-12));
    }
  }
  c.eq('post-test, LR 1', postTest(0.3, 1), 0.3, 1e-15);
  c.eq('post-test, infinite LR', postTest(0.3, Infinity), 1);
  c.eq('post-test, LR 10 at 20%', postTest(0.2, 10), 2.5 / 3.5, 1e-15);
  c.done(150);
});

test('ROC: AUC, DeLong variance and CI, operating points, Youden and top-left cut-offs match pROC; AUC matches scikit-learn', () => {
  const c = checker('ROC');
  const trivial = (se, sp) => (se === 1 && sp === 0) || (se === 0 && sp === 1);
  R.rocs.forEach((r, i) => {
    const s = IN.rocSets[i], higher = s.direction === '<', tag = r.name;
    const o = rocAnalysis(s.y.map(Boolean), s.x, { higher });
    c.eq(`${tag} AUC`, o.auc, r.auc, 1e-12);
    c.eq(`${tag} AUC (scikit-learn)`, o.auc, PY.rocs[i].auc, 1e-12);
    c.eq(`${tag} variance`, o.variance, r.var, 1e-9, 1e-15);
    c.eq(`${tag} CI`, o.ci, r.ci, 1e-9, 1e-12);
    c.ok(`${tag} automatic direction as pROC (${r.auto})`, autoDirection(s.y.map(Boolean), s.x) === (r.auto === '<' ? 'higher' : 'lower'));
    // Operating points: the same (Se, Sp) pairs apart from the two corners.
    const key = (se, sp) => `${se.toFixed(12)}/${sp.toFixed(12)}`;
    const mine = o.points.filter((p) => !trivial(p.se, p.sp)).map((p) => key(p.se, p.sp)).sort();
    const theirs = r.se.map((se, k) => [v(se), v(r.sp[k])]).filter(([se, sp]) => !trivial(se, sp)).map(([se, sp]) => key(se, sp)).sort();
    c.ok(`${tag} operating points (${mine.length} against ${theirs.length})`, mine.length === theirs.length && mine.every((x, k) => x === theirs[k]));
    // Cut-offs: Youden and closest to the top-left corner.
    const cut = rocCutoffs(o);
    for (const [name, ref, got] of [['Youden', r.youden, cut.youden], ['top-left', r.topleft, cut.topleft]]) {
      const ses = [].concat(ref.se).map(v), sps = [].concat(ref.sp).map(v), ths = [].concat(ref.threshold).map(v);
      if (ses.every((se, k) => trivial(se, sps[k]))) { c.ok(`${tag} ${name}: none better than chance`, got.length === 0); continue; }
      c.ok(`${tag} ${name}: ${got.length} cut-offs against ${ses.length}`, got.length === ses.length);
      got.forEach((p, k) => {
        c.eq(`${tag} ${name} Se`, p.se, ses[k], 1e-12); c.eq(`${tag} ${name} Sp`, p.sp, sps[k], 1e-12);
        // pROC's threshold lies between two observed values; ours is the observed value on the positive side of it.
        const obs = o.points.map((q) => q.cut);
        const want = higher ? Math.min(...obs.filter((x) => x >= ths[k])) : Math.max(...obs.filter((x) => x <= ths[k]));
        c.eq(`${tag} ${name} cut-off`, p.cut, want, 1e-12);
      });
    }
  });
  c.done(60);
});

test("comparing ROC curves: DeLong's paired and unpaired tests match pROC's roc.test", () => {
  const c = checker('compare');
  R.paired.forEach((r, i) => {
    const s = IN.paired[i];
    const o = rocPaired(s.y.map(Boolean), s.a, s.b, { higherA: s.dirA === '<', higherB: s.dirB === '<' });
    c.eq(`${r.name} AUC A`, o.A.auc, r.aucA, 1e-12); c.eq(`${r.name} AUC B`, o.B.auc, r.aucB, 1e-12);
    c.eq(`${r.name} var A`, o.A.variance, r.varA, 1e-9); c.eq(`${r.name} var B`, o.B.variance, r.varB, 1e-9);
    c.eq(`${r.name} covariance`, o.cov, r.cov, 1e-9);
    c.eq(`${r.name} z`, o.z, r.z, 1e-9); c.eq(`${r.name} p`, o.p, r.p, 1e-8, 1e-15); c.eq(`${r.name} CI of the difference`, o.ci, r.ci, 1e-9);
  });
  R.unpaired.forEach((r, i) => {
    const s = IN.unpaired[i], higher = s.direction === '<';
    const A = rocAnalysis(s.y1.map(Boolean), s.x1, { higher }), B = rocAnalysis(s.y2.map(Boolean), s.x2, { higher });
    const o = rocUnpaired(A, B);
    c.eq(`${r.name} AUC 1`, A.auc, r.auc1, 1e-12); c.eq(`${r.name} AUC 2`, B.auc, r.auc2, 1e-12);
    c.eq(`${r.name} var 1`, A.variance, r.var1, 1e-9); c.eq(`${r.name} var 2`, B.variance, r.var2, 1e-9);
    c.eq(`${r.name} D`, o.t, r.z, 1e-9); c.eq(`${r.name} p (t, Satterthwaite df)`, o.p, r.p, 1e-8);
  });
  c.done(20);
});

test('worked checks: Hanley and McNeil ratings, grouped counts, reading columns as a test, summary AUCs', () => {
  // Hanley and McNeil (1982): 109 CT images rated 1 to 5; the empirical area is 0.893.
  const g = expandGrouped([[33, 3], [6, 2], [6, 2], [11, 11], [2, 33]].map(([controls, cases]) => ({ cases, controls })));
  const r = rocAnalysis(g.y, g.x, { higher: true });
  assert.equal(r.m, 51); assert.equal(r.n, 58);
  assert.ok(Math.abs(r.auc - 0.893) < 5e-4, `AUC ${r.auc}`);
  assert.equal(r.path[0][0], 0); assert.deepEqual(r.path[r.path.length - 1], [1, 1]);
  // Columns read as a test and a reference standard.
  assert.equal(classifyValue('Some pallor', null, { kind: 'levels', positive: ['Some pallor', 'Severe pallor'] }), true);
  assert.equal(classifyValue('No pallor', null, { kind: 'levels', positive: ['Some pallor', 'Severe pallor'] }), false);
  assert.equal(classifyValue('', null, { kind: 'levels', positive: ['Yes'] }), null);
  assert.equal(classifyValue('10.9', 10.9, { kind: 'cut', op: '<', value: 11 }), true);
  assert.equal(classifyValue('11', 11, { kind: 'cut', op: '<', value: 11 }), false);
  assert.equal(classifyValue('11', 11, { kind: 'cut', op: '<=', value: 11 }), true);
  assert.equal(classifyValue('', null, { kind: 'cut', op: '>=', value: 1 }), null);
  assert.deepEqual(countTable([true, true, false, false, null, true], [true, false, true, false, true, null]), { tp: 1, fp: 1, fn: 1, tn: 1, skipped: 2 });
  // A cut-off from the ROC analysis gives the same counts as the 2 x 2 table built from it.
  const p = r.points.find((q) => q.cut === 4);
  const acc = testAccuracy({ tp: p.tp, fp: p.fp, fn: p.fn, tn: p.tn });
  assert.ok(Math.abs(acc.se.est - p.se) < 1e-15 && Math.abs(acc.sp.est - p.sp) < 1e-15);
  // Two AUCs from separate studies: standard errors from symmetric 95% CIs.
  const s = compareAucSummary(0.85, [0.80, 0.90], 0.75, [0.68, 0.82]);
  const z = normal.isf(0.025), se = Math.hypot(0.1 / (2 * z), 0.14 / (2 * z));
  assert.ok(Math.abs(s.diff - 0.1) < 1e-12 && Math.abs(s.se - se) < 1e-12 && Math.abs(s.p - 2 * normal.sf(0.1 / se)) < 1e-12);
  // Cut-offs for a target sensitivity or specificity.
  const cut = rocCutoffs(r, { targetSe: 0.9, targetSp: 0.9 });
  assert.ok(cut.forSe.se >= 0.9 && cut.forSp.sp >= 0.9);
  assert.equal(cut.forSe.cut, 3); assert.equal(cut.forSp.cut, 5);
});
