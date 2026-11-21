/* Diagnostic accuracy: a binary test against a reference standard (the 2 x 2 table read as a test),
 * predictive values and post-test probabilities at any prevalence, ROC curves with DeLong's variance,
 * cut-offs, and comparisons of two curves (DeLong's tests, paired and unpaired).
 *
 * Methods: Wilson (default) and Clopper-Pearson CIs for proportions; likelihood ratios with Simel's
 * log interval when every cell is 5 or more, otherwise Koopman's score interval (each likelihood ratio
 * is a ratio of two independent proportions); the diagnostic odds ratio as in the association tool;
 * Youden's J with a Wald CI. Predictive values at a chosen prevalence come from the likelihood ratios
 * through Bayes' theorem, carrying the likelihood ratio's interval with them: with the log interval this
 * is the logit interval of Mercaldo, Lau and Zhou (2007). ROC: empirical curve, AUC as the Mann-Whitney
 * probability, DeLong, DeLong and Clarke-Pearson (1988) variance from the structural components, CI on
 * the AUC scale cut at 0 and 1 (as R's pROC).
 */
import { normal, studentT } from './dist.js';
import { rank } from './describe.js';
import { wilson, clopperPearson } from './proportions.js';
import { riskRatioScore, twoByTwo } from './epi.js';
import { mcnemar } from './tables.js';

const zOf = (conf) => normal.isf((1 - conf) / 2);
const sum = (a) => a.reduce((s, v) => s + v, 0);
const mean = (a) => sum(a) / a.length;
const cov = (a, b) => { const ma = mean(a), mb = mean(b); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1); };

/* ------------------------------------------------- test against reference --- */

/** A proportion x of n with its Wilson and Clopper-Pearson intervals, or null when n is 0. */
function prop(x, n, conf) {
  return n > 0 ? { x, n, est: x / n, wilson: wilson(x, n, conf), exact: clopperPearson(x, n, conf) } : null;
}

/**
 * A ratio of two independent proportions (x1 of m1) / (x2 of m2), as a likelihood ratio:
 * Simel's log interval and Koopman's score interval; auto picks the log interval when every cell of
 * the table is 5 or more and the log interval exists.
 */
function likelihoodRatio(x1, m1, x2, m2, z, conf, small) {
  const est = x2 === 0 ? (x1 === 0 ? NaN : Infinity) : (x1 / m1) / (x2 / m2);
  const seLog = x1 > 0 && x2 > 0 ? Math.sqrt(1 / x1 - 1 / m1 + 1 / x2 - 1 / m2) : NaN;
  const log = Number.isFinite(seLog) && est > 0 && Number.isFinite(est) ? [est * Math.exp(-z * seLog), est * Math.exp(z * seLog)] : null;
  const score = riskRatioScore(x1, m1, x2, m2, conf);
  return { est, seLog, log, score, auto: small || !log ? 'score' : 'log' };
}

/**
 * A binary test against a reference standard: tp, fp, fn, tn (test positive or negative by disease
 * present or absent). design 'cross' (one sample, consecutive or random) also gives the prevalence,
 * predictive values and accuracy in the sample; 'case-control' (people with and without the disease
 * recruited separately) does not, as the sample prevalence is set by the design.
 */
export function testAccuracy({ tp, fp, fn, tn }, { conf = 0.95, design = 'cross' } = {}) {
  const z = zOf(conf);
  const n1 = tp + fn, n0 = fp + tn, N = n1 + n0;
  const small = Math.min(tp, fp, fn, tn) < 5;
  const out = { tp, fp, fn, tn, n1, n0, N, conf, design, small };
  out.se = prop(tp, n1, conf);
  out.sp = prop(tn, n0, conf);
  out.lrPos = n1 > 0 && n0 > 0 ? likelihoodRatio(tp, n1, fp, n0, z, conf, small) : null;
  out.lrNeg = n1 > 0 && n0 > 0 ? likelihoodRatio(fn, n1, tn, n0, z, conf, small) : null;
  // Diagnostic odds ratio: the odds ratio of the table (Woolf when every cell is 5 or more, else exact).
  if (n1 > 0 && n0 > 0 && tp + fp > 0 && fn + tn > 0) {
    const o = twoByTwo([[tp, fp], [fn, tn]], { conf, design: 'case-control' }).or;
    out.dor = { est: o.est, woolf: o.wald, exact: o.exact, auto: o.auto };
  } else out.dor = null;
  // Youden's J = Se + Sp - 1, Wald interval.
  if (out.se && out.sp) {
    const j = out.se.est + out.sp.est - 1;
    const sej = Math.sqrt((out.se.est * (1 - out.se.est)) / n1 + (out.sp.est * (1 - out.sp.est)) / n0);
    out.youden = { est: j, se: sej, ci: [Math.max(-1, j - z * sej), Math.min(1, j + z * sej)] };
  } else out.youden = null;
  if (design !== 'case-control') {
    out.prev = prop(n1, N, conf);
    out.ppv = prop(tp, tp + fp, conf);
    out.npv = prop(tn, fn + tn, conf);
    out.acc = prop(tp + tn, N, conf);
  }
  return out;
}

/** Post-test probability from a pre-test probability p and a likelihood ratio (Bayes' theorem in odds form). */
export function postTest(p, lr) {
  if (!(p >= 0 && p <= 1) || Number.isNaN(lr)) return NaN;
  if (p === 0) return 0;
  if (p === 1) return 1;
  if (lr === Infinity) return 1;
  const o = (p / (1 - p)) * lr;
  return o / (1 + o);
}

/**
 * Predictive values at a prevalence (or pre-test probability) p, from the likelihood ratios of a
 * testAccuracy result; each interval carries the likelihood ratio's reported interval through Bayes'
 * theorem. postNeg is the probability of disease after a negative test (1 - NPV).
 */
export function atPrevalence(acc, p) {
  const tr = (r) => (r ? { est: postTest(p, r.est), ci: r[r.auto] ? r[r.auto].map((v) => postTest(p, v)) : null, method: r.auto } : null);
  const ppv = tr(acc.lrPos), postNeg = tr(acc.lrNeg);
  const npv = postNeg ? { est: 1 - postNeg.est, ci: postNeg.ci ? [1 - postNeg.ci[1], 1 - postNeg.ci[0]] : null, method: postNeg.method } : null;
  return { p, ppv, npv, postPos: ppv, postNeg };
}

/* ----------------------------------------------- columns to a binary test --- */

/**
 * Reads a value as test-positive (true), negative (false) or missing (null) by a rule:
 * { kind: 'levels', positive: [values] } for a categorical column, or
 * { kind: 'cut', op: '<' | '<=' | '>=' | '>', value } for a numeric one.
 */
export function classifyValue(raw, num, rule) {
  if (rule.kind === 'levels') return raw === null || raw === undefined || raw === '' ? null : rule.positive.includes(raw);
  if (num === null || num === undefined || !Number.isFinite(num)) return null;
  const c = rule.value;
  return rule.op === '<' ? num < c : rule.op === '<=' ? num <= c : rule.op === '>' ? num > c : num >= c;
}

/** Counts tp, fp, fn, tn from paired arrays of test results and disease status (null skipped). */
export function countTable(test, disease) {
  let tp = 0, fp = 0, fn = 0, tn = 0, skipped = 0;
  for (let i = 0; i < test.length; i++) {
    const t = test[i], d = disease[i];
    if (t === null || d === null) { skipped++; continue; }
    if (t && d) tp++; else if (t) fp++; else if (d) fn++; else tn++;
  }
  return { tp, fp, fn, tn, skipped };
}

/* -------------------------------------------------------------- ROC curves --- */

/**
 * DeLong's structural components for cases (scores s1) against controls (s0), scores oriented so that
 * higher means disease: v10[i] = share of controls below case i (ties count a half), v01[j] = share of
 * cases above control j. The AUC is their mean (Sun and Xu's midrank form).
 */
function components(s1, s0) {
  const m = s1.length, n = s0.length;
  const all = rank([...s1, ...s0]).ranks, r1 = rank(s1).ranks, r0 = rank(s0).ranks;
  const v10 = s1.map((_, i) => (all[i] - r1[i]) / n);
  const v01 = s0.map((_, j) => 1 - (all[m + j] - r0[j]) / m);
  return { v10, v01, auc: mean(v10) };
}

/**
 * Empirical ROC analysis of a marker x against disease status y (booleans), complete pairs only.
 * higher: higher marker values point to disease, so a person is positive at or above a cut-off;
 * otherwise at or below. Cut-offs are the observed values.
 */
export function rocAnalysis(y, x, { higher = true, conf = 0.95 } = {}) {
  const s1 = [], s0 = [], x1 = [], x0 = [];
  for (let i = 0; i < y.length; i++) {
    if (y[i] === null || y[i] === undefined || x[i] === null || x[i] === undefined || !Number.isFinite(x[i])) continue;
    const s = higher ? x[i] : -x[i];
    if (y[i]) { s1.push(s); x1.push(x[i]); } else { s0.push(s); x0.push(x[i]); }
  }
  const m = s1.length, n = s0.length;
  const out = { m, n, higher, conf };
  if (!m || !n) return { ...out, auc: NaN };
  const c = components(s1, s0);
  const variance = m > 1 && n > 1 ? cov(c.v10, c.v10) / m + cov(c.v01, c.v01) / n : NaN;
  const se = Math.sqrt(variance), z = zOf(conf);
  out.auc = c.auc; out.variance = variance; out.se = se;
  out.ci = Number.isFinite(se) ? [Math.max(0, c.auc - z * se), Math.min(1, c.auc + z * se)] : [NaN, NaN];
  out.v10 = c.v10; out.v01 = c.v01;
  // Operating points at each observed value (oriented score >= cut): sensitivity and specificity.
  const vals = [...new Set([...s1, ...s0])].sort((a, b) => b - a);
  const a1 = [...s1].sort((a, b) => b - a), a0 = [...s0].sort((a, b) => b - a);
  let i1 = 0, i0 = 0;
  const pts = [];
  for (const v of vals) {
    while (i1 < m && a1[i1] >= v) i1++;
    while (i0 < n && a0[i0] >= v) i0++;
    pts.push({ cut: higher ? v : -v, tp: i1, fp: i0, se: i1 / m, sp: 1 - i0 / n });
  }
  // Ascending cut-off in the marker's own units.
  out.points = higher ? pts.reverse() : pts;
  out.points.forEach((p) => { p.j = p.se + p.sp - 1; p.fn = m - p.tp; p.tn = n - p.fp; });
  // Plot path from (0, 0) to (1, 1) by rising false-positive rate.
  const path = [[0, 0], ...[...out.points].sort((a, b) => (1 - a.sp) - (1 - b.sp) || a.se - b.se).map((p) => [1 - p.sp, p.se])];
  if (path[path.length - 1][0] !== 1 || path[path.length - 1][1] !== 1) path.push([1, 1]);
  out.path = path;
  return out;
}

/**
 * Cut-offs on an ROC analysis: Youden's J (largest Se + Sp - 1, ties all kept), the point closest to the
 * top-left corner, and the best specificity with sensitivity at least targetSe (and the reverse).
 * Null where no cut-off does better than chance.
 */
export function rocCutoffs(r, { targetSe = 0.9, targetSp = 0.9 } = {}) {
  const pts = r.points || [];
  const eps = 1e-12;
  const maxJ = Math.max(...pts.map((p) => p.j));
  const youden = maxJ > eps ? pts.filter((p) => p.j >= maxJ - eps) : [];
  const dist = (p) => (1 - p.se) ** 2 + (1 - p.sp) ** 2;
  const dmin = Math.min(...pts.map(dist));
  const topleft = maxJ > eps ? pts.filter((p) => dist(p) <= dmin + eps) : [];
  const best = (cands, key, other) => {
    if (!cands.length) return null;
    const top = Math.max(...cands.map((p) => p[key]));
    const tied = cands.filter((p) => p[key] >= top - eps);
    return tied.reduce((a, b) => (b[other] > a[other] ? b : a));
  };
  return {
    maxJ, youden, topleft,
    forSe: best(pts.filter((p) => p.se >= targetSe - eps), 'sp', 'se'), targetSe,
    forSp: best(pts.filter((p) => p.sp >= targetSp - eps), 'se', 'sp'), targetSp,
  };
}

/** Two-sided normal p-value. */
const p2 = (zv) => 2 * normal.sf(Math.abs(zv));

/**
 * Two markers on the same people (complete cases for both): DeLong's test of AUC_A = AUC_B with the
 * covariance from the paired structural components, and a CI for the difference.
 */
export function rocPaired(y, xa, xb, { higherA = true, higherB = true, conf = 0.95 } = {}) {
  const ok = y.map((v, i) => v !== null && v !== undefined && Number.isFinite(xa[i]) && Number.isFinite(xb[i]) && xa[i] !== null && xb[i] !== null);
  const yy = y.filter((_, i) => ok[i]), aa = xa.filter((_, i) => ok[i]), bb = xb.filter((_, i) => ok[i]);
  const A = rocAnalysis(yy, aa, { higher: higherA, conf }), B = rocAnalysis(yy, bb, { higher: higherB, conf });
  const m = A.m, n = A.n, z = zOf(conf);
  const out = { A, B, m, n, used: yy.length, dropped: y.length - yy.length, conf };
  if (!(m > 1 && n > 1)) return { ...out, diff: NaN };
  const covAB = cov(A.v10, B.v10) / m + cov(A.v01, B.v01) / n;
  const v = A.variance + B.variance - 2 * covAB;
  const diff = A.auc - B.auc, se = Math.sqrt(Math.max(0, v));
  out.cov = covAB; out.r = covAB / Math.sqrt(A.variance * B.variance);
  out.diff = diff; out.se = se;
  out.z = se > 0 ? diff / se : diff === 0 ? 0 : (diff > 0 ? Infinity : -Infinity);
  out.p = se > 0 ? p2(out.z) : diff === 0 ? 1 : 0;
  out.ci = [diff - z * se, diff + z * se];
  return out;
}

/**
 * Two ROC analyses from independent samples: the difference over the root of the summed DeLong
 * variances, referred to Student's t with Satterthwaite-type degrees of freedom, as R's pROC does.
 */
export function rocUnpaired(A, B, { conf = 0.95 } = {}) {
  const diff = A.auc - B.auc, v = A.variance + B.variance, se = Math.sqrt(v);
  const df = (v * v) / ((A.variance * A.variance) / (A.m + A.n - 1) + (B.variance * B.variance) / (B.m + B.n - 1));
  const t = se > 0 ? diff / se : NaN;
  const q = Number.isFinite(df) ? studentT.isf((1 - conf) / 2, df) : NaN;
  return { A, B, diff, se, df, t, p: se > 0 ? 2 * studentT.sf(Math.abs(t), df) : NaN, ci: [diff - q * se, diff + q * se], conf };
}

/**
 * Two AUCs reported by separate studies, each with its CI (assumed symmetric, as DeLong's): standard
 * errors from the CI widths, and a z test assuming the samples are independent.
 */
export function compareAucSummary(a1, ci1, a2, ci2, { conf = 0.95 } = {}) {
  const z = zOf(conf);
  const se1 = (ci1[1] - ci1[0]) / (2 * z), se2 = (ci2[1] - ci2[0]) / (2 * z);
  const diff = a1 - a2, se = Math.sqrt(se1 * se1 + se2 * se2);
  const zv = diff / se;
  return { diff, se, se1, se2, z: zv, p: p2(zv), ci: [diff - z * se, diff + z * se], conf };
}

/**
 * The direction R's pROC picks when none is given: higher values mean disease unless the median of
 * those without it is above the median of those with it.
 */
export function autoDirection(y, x) {
  const s1 = [], s0 = [];
  y.forEach((d, i) => { if (d === null || d === undefined || !Number.isFinite(x[i])) return; (d ? s1 : s0).push(x[i]); });
  const med = (a) => { const b = [...a].sort((p, q) => p - q), h = b.length / 2; return b.length % 2 ? b[Math.floor(h)] : (b[h - 1] + b[h]) / 2; };
  return s1.length && s0.length && med(s0) > med(s1) ? 'lower' : 'higher';
}

/** Grouped counts by ordered category (lowest first): arrays of disease status and category number. */
export function expandGrouped(rows) {
  const y = [], x = [];
  rows.forEach(({ cases, controls }, k) => {
    for (let i = 0; i < cases; i++) { y.push(true); x.push(k + 1); }
    for (let i = 0; i < controls; i++) { y.push(false); x.push(k + 1); }
  });
  return { y, x };
}

/* ------------------------------------------------- two tests, same people --- */

/**
 * Two proportions from the same people: e positive on both, f on the first only, g on the second only,
 * h on neither; p1 = (e + f)/n, p2 = (e + g)/n. The difference p1 - p2 with Newcombe's (1998) method 10
 * (Wilson limits for each proportion combined with the correlation, continuity-corrected), and
 * McNemar's test on the discordant pairs: exact when they number fewer than 25.
 */
export function pairedDifference(e, f, g, h, { conf = 0.95 } = {}) {
  const n = e + f + g + h;
  const p1 = (e + f) / n, p2 = (e + g) / n, diff = (f - g) / n;
  const [l2, u2] = wilson(e + f, n, conf), [l3, u3] = wilson(e + g, n, conf);
  const dl2 = p1 - l2, du2 = u2 - p1, dl3 = p2 - l3, du3 = u3 - p2;
  const den = Math.sqrt((e + f) * (g + h) * (e + g) * (f + h));
  let num = e * h - f * g;
  if (num > 0) num = Math.max(num - n / 2, 0);
  const phi = den > 0 ? num / den : 0;
  const ci = [diff - Math.sqrt(dl2 * dl2 - 2 * phi * dl2 * du3 + du3 * du3), diff + Math.sqrt(du2 * du2 - 2 * phi * du2 * dl3 + dl3 * dl3)];
  const mc = mcnemar(f, g);
  const exact = f + g < 25;
  return { e, f, g, h, n, p1, p2, diff, ci, phi, conf, mcnemar: mc, exact, p: exact ? mc.pExact : mc.p };
}

/**
 * Two binary tests on the same people against one reference standard. pos: [both positive, first only,
 * second only, neither] among people with the condition; neg: the same among people without it.
 * Sensitivities and specificities of each test (Wilson), their paired differences (Newcombe's method 10;
 * McNemar), the two tests combined in series (positive only if both are) and in parallel (positive if
 * either is), counted directly, and the conditional covariances of Gardner and colleagues (2000).
 */
export function compareBinaryTests(pos, neg, { conf = 0.95 } = {}) {
  const [e1, f1, g1, h1] = pos, [e0, f0, g0, h0] = neg;
  const n1 = e1 + f1 + g1 + h1, n0 = e0 + f0 + g0 + h0;
  const prop = (x, n) => ({ est: x / n, x, n, wilson: wilson(x, n, conf) });
  const out = { n1, n0, conf, pos, neg };
  if (n1 > 0) {
    out.se = pairedDifference(e1, f1, g1, h1, { conf });
    out.seA = prop(e1 + f1, n1); out.seB = prop(e1 + g1, n1);
    out.serialSe = prop(e1, n1); out.parallelSe = prop(e1 + f1 + g1, n1);
    out.covSe = e1 / n1 - out.seA.est * out.seB.est;
  }
  if (n0 > 0) {
    // Specificity is the proportion testing negative: count "negative" as the outcome.
    out.sp = pairedDifference(h0, g0, f0, e0, { conf });
    out.spA = prop(g0 + h0, n0); out.spB = prop(f0 + h0, n0);
    out.serialSp = prop(n0 - e0, n0); out.parallelSp = prop(h0, n0);
    out.covSp = h0 / n0 - out.spA.est * out.spB.est;
  }
  return out;
}

/* ------------------------------------------------------ screening programmes --- */

/** The range a conditional covariance between two tests with accuracies a and b can take. */
export const covarianceRange = (a, b) => [Math.max(0, a + b - 1) - a * b, Math.min(a, b) - a * b];

/**
 * Two tests combined, from their sensitivities and specificities and, if known, the conditional
 * covariances between them (0 when the tests err independently; Gardner and colleagues 2000).
 * Serial: positive only if both are positive. Parallel: positive if either is.
 */
export function combineTests({ se1, sp1, se2, sp2, covSe = 0, covSp = 0 }) {
  return {
    serial: { se: se1 * se2 + covSe, sp: 1 - (1 - sp1) * (1 - sp2) - covSp },
    parallel: { se: 1 - (1 - se1) * (1 - se2) - covSe, sp: sp1 * sp2 + covSp },
  };
}

/**
 * What a screening programme finds in a population of N with prevalence prev: expected true and false
 * positives and negatives, predictive values, people screened and positives per case found, tests done
 * and their cost. strategy 'single' (test 1 only), 'serial' (test 2 only for those positive on test 1)
 * or 'parallel' (both tests for everyone).
 */
export function screeningYield({ N, prev, se1, sp1, se2 = null, sp2 = null, covSe = 0, covSp = 0, strategy = 'single', cost1 = 0, cost2 = 0 }) {
  const net = strategy === 'single' ? { se: se1, sp: sp1 } : combineTests({ se1, sp1, se2, sp2, covSe, covSp })[strategy];
  const D = N * prev, H = N - D;
  const tp = D * net.se, fn = D - tp, fp = H * (1 - net.sp), tn = H - fp;
  const positives = tp + fp;
  const second = strategy === 'serial' ? D * se1 + H * (1 - sp1) : strategy === 'parallel' ? N : 0;
  const cost = N * cost1 + second * cost2;
  return {
    N, prev, strategy, net, D, H, tp, fp, fn, tn, positives,
    ppv: positives > 0 ? tp / positives : NaN, npv: tn + fn > 0 ? tn / (tn + fn) : NaN,
    screenedPerCase: tp > 0 ? N / tp : Infinity, positivesPerCase: tp > 0 ? positives / tp : Infinity,
    tests: [N, second], cost, costPerCase: tp > 0 ? cost / tp : Infinity,
  };
}
