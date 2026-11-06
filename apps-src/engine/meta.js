/* Meta-analysis: effect sizes from study data (2 x 2 counts, means and SDs, single proportions,
 * or reported estimates with CIs), inverse-variance fixed-effect and random-effects pooling
 * (tau-squared by REML, Paule-Mandel or DerSimonian-Laird, with the Q-profile interval), the
 * Hartung-Knapp-Sidik-Jonkman adjustment, heterogeneity (Q, I-squared with the Higgins-Thompson
 * interval), the prediction interval, subgroup analysis, leave-one-out analysis and Egger's test.
 * Checked against statsmodels and SciPy in tests/engine/agreement.test.mjs.
 */
import { normal, studentT, chiSquare } from './dist.js';
import { brent } from './special.js';
import { ols } from './regression.js';

/* -------------------------------------------------------- effect sizes --- */

/**
 * log OR, log RR or risk difference from events/total in two arms. For OR and RR, 0.5 is added to
 * every cell when one is 0; a study with no events in either arm (or events in everyone in both)
 * carries no information on a ratio and is left out. For RD, 0.5 is added only when the variance
 * would otherwise be 0.
 */
export function binaryEffect(e1, n1, e2, n2, measure = 'OR') {
  let a = e1, b = n1 - e1, c = e2, d = n2 - e2;
  if (measure === 'RD') {
    let p1 = a / n1, p2 = c / n2;
    let v = (p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2;
    if (v > 0) return { y: p1 - p2, v, corrected: false };
    a += 0.5; b += 0.5; c += 0.5; d += 0.5;
    p1 = a / (a + b); p2 = c / (c + d);
    v = (p1 * (1 - p1)) / (a + b) + (p2 * (1 - p2)) / (c + d);
    return { y: p1 - p2, v, corrected: true };
  }
  if ((a === 0 && c === 0) || (b === 0 && d === 0)) return { y: NaN, v: NaN, excluded: a === 0 ? 'no events in either group' : 'every participant had the event in both groups' };
  const zero = [a, b, c, d].some((x) => x === 0);
  if (zero) { a += 0.5; b += 0.5; c += 0.5; d += 0.5; }
  if (measure === 'RR') return { y: Math.log((a / (a + b)) / (c / (c + d))), v: 1 / a - 1 / (a + b) + 1 / c - 1 / (c + d), corrected: zero };
  return { y: Math.log((a * d) / (b * c)), v: 1 / a + 1 / b + 1 / c + 1 / d, corrected: zero };
}

/**
 * Mean difference, or Hedges' adjusted g with the formulas RevMan and the Cochrane Handbook use:
 * g = (1 - 3 / (4N - 9)) d, SE = sqrt(N / (n1 n2) + g^2 / (2 (N - 3.94))).
 */
export function continuousEffect(m1, s1, n1, m2, s2, n2, measure = 'MD') {
  if (measure === 'MD') return { y: m1 - m2, v: (s1 * s1) / n1 + (s2 * s2) / n2 };
  const N = n1 + n2;
  const sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (N - 2));
  const g = (1 - 3 / (4 * N - 9)) * ((m1 - m2) / sp);
  return { y: g, v: N / (n1 * n2) + (g * g) / (2 * (N - 3.94)) };
}

/** Logit of a single proportion (prevalence meta-analysis); 0.5 added when x is 0 or n. */
export function proportionEffect(x, n) {
  let xx = x, nn = n;
  const corrected = x === 0 || x === n;
  if (corrected) { xx += 0.5; nn += 1; }
  const p = xx / nn;
  return { y: Math.log(p / (1 - p)), v: 1 / xx + 1 / (nn - xx), corrected };
}

/** A reported estimate with its CI; ratio measures are analysed on the log scale. */
export function reportedEffect(est, lo, hi, { ratio = true, conf = 0.95 } = {}) {
  const z = normal.isf((1 - conf) / 2);
  if (ratio) return { y: Math.log(est), v: ((Math.log(hi) - Math.log(lo)) / (2 * z)) ** 2 };
  return { y: est, v: ((hi - lo) / (2 * z)) ** 2 };
}

/* ------------------------------------------------------------- pooling --- */

function tauDL(y, v) {
  const w = v.map((x) => 1 / x);
  const W = w.reduce((a, b) => a + b, 0);
  const mu = y.reduce((s, yi, i) => s + w[i] * yi, 0) / W;
  const Q = y.reduce((s, yi, i) => s + w[i] * (yi - mu) ** 2, 0);
  const c = W - w.reduce((s, x) => s + x * x, 0) / W;
  return Math.max(0, (Q - (y.length - 1)) / c);
}

function tauPM(y, v) {
  const k = y.length;
  const gen = (t2) => {
    const w = v.map((x) => 1 / (x + t2));
    const W = w.reduce((a, b) => a + b, 0);
    const mu = y.reduce((s, yi, i) => s + w[i] * yi, 0) / W;
    return y.reduce((s, yi, i) => s + w[i] * (yi - mu) ** 2, 0) - (k - 1);
  };
  if (gen(0) <= 0) return 0;
  let hi = Math.max(1e-4, tauDL(y, v) * 2 + 1e-4);
  while (gen(hi) > 0) hi *= 2;
  return brent(gen, 0, hi, 1e-14);
}

/* REML: the root of the derivative of the restricted log-likelihood,
 * sum w^2 (y - mu)^2 = sum w - sum w^2 / sum w (w = 1 / (v + tau^2)), truncated at 0. */
function tauREML(y, v) {
  const score = (t2) => {
    const w = v.map((x) => 1 / (x + t2));
    const W = w.reduce((a, b) => a + b, 0);
    const mu = y.reduce((s, yi, i) => s + w[i] * yi, 0) / W;
    let s2 = 0, ww = 0;
    for (let i = 0; i < y.length; i++) { s2 += w[i] * w[i] * (y[i] - mu) ** 2; ww += w[i] * w[i]; }
    return s2 - W + ww / W;
  };
  if (score(0) <= 0) return 0;
  let hi = Math.max(1e-4, tauDL(y, v) * 2 + 1e-4);
  while (score(hi) > 0) hi *= 2;
  return brent(score, 0, hi, 1e-14);
}

/** Generalised Q at tau^2: sum of w (y - mu)^2 with w = 1 / (v + tau^2). */
function qGen(y, v, t2) {
  const w = v.map((x) => 1 / (x + t2));
  const W = w.reduce((a, b) => a + b, 0);
  const mu = y.reduce((s, yi, i) => s + w[i] * yi, 0) / W;
  return y.reduce((s, yi, i) => s + w[i] * (yi - mu) ** 2, 0);
}

/** Q-profile confidence interval for tau-squared (Viechtbauer 2007). */
export function tau2Interval(y, v, conf = 0.95) {
  const df = y.length - 1;
  if (df < 1) return [NaN, NaN];
  const a = (1 - conf) / 2;
  const solve = (target) => {
    if (qGen(y, v, 0) <= target) return 0;
    let hi = 1;
    while (qGen(y, v, hi) > target) hi *= 2;
    return brent((t) => qGen(y, v, t) - target, 0, hi, 1e-13);
  };
  return [solve(chiSquare.isf(a, df)), solve(chiSquare.ppf(a, df))];
}

/**
 * Pool effects y with variances v. method: 'REML', 'PM' or 'DL' for tau-squared; hksj:
 * Hartung-Knapp-Sidik-Jonkman interval for the random-effects mean (t with k - 1 df).
 */
export function pool(y, v, { method = 'PM', hksj = false, conf = 0.95 } = {}) {
  const k = y.length;
  const z = normal.isf((1 - conf) / 2);
  const w = v.map((x) => 1 / x);
  const W = w.reduce((a, b) => a + b, 0);
  const fe = y.reduce((s, yi, i) => s + w[i] * yi, 0) / W;
  const seFE = Math.sqrt(1 / W);
  const Q = y.reduce((s, yi, i) => s + w[i] * (yi - fe) ** 2, 0);
  const df = k - 1;
  const tau2 = k > 1 ? (method === 'PM' ? tauPM(y, v) : method === 'DL' ? tauDL(y, v) : tauREML(y, v)) : 0;
  const wr = v.map((x) => 1 / (x + tau2));
  const Wr = wr.reduce((a, b) => a + b, 0);
  const re = y.reduce((s, yi, i) => s + wr[i] * yi, 0) / Wr;
  let seRE = Math.sqrt(1 / Wr);
  let ciRE = [re - z * seRE, re + z * seRE];
  let pRE = 2 * normal.sf(Math.abs(re / seRE));
  if (hksj && k > 1) {
    const q = y.reduce((s, yi, i) => s + wr[i] * (yi - re) ** 2, 0) / df;
    seRE = Math.sqrt(q / Wr);
    const t = studentT.isf((1 - conf) / 2, df);
    ciRE = [re - t * seRE, re + t * seRE];
    pRE = studentT.twoSided(re / seRE, df);
  }
  const I2 = Q > df ? (Q - df) / Q : 0;
  // Higgins and Thompson (2002) interval for H, then I-squared.
  let I2ci = [NaN, NaN];
  if (k > 2) {
    const seLnH = Q > k ? 0.5 * (Math.log(Q) - Math.log(df)) / (Math.sqrt(2 * Q) - Math.sqrt(2 * k - 3)) : Math.sqrt((1 / (2 * (k - 2))) * (1 - 1 / (3 * (k - 2) ** 2)));
    const H = Math.sqrt(Math.max(1, Q / df));
    const toI2 = (h) => Math.max(0, (h * h - 1) / (h * h));
    I2ci = [toI2(Math.max(1, Math.exp(Math.log(H) - z * seLnH))), toI2(Math.max(1, Math.exp(Math.log(H) + z * seLnH)))];
  }
  // Prediction interval (Higgins, Thompson and Spiegelhalter 2009), t with k - 2 df.
  const pi = k > 2 ? (() => { const t = studentT.isf((1 - conf) / 2, k - 2); const s = Math.sqrt(tau2 + (1 / Wr)); return [re - t * s, re + t * s]; })() : [NaN, NaN];
  return {
    k, fe, seFE, ciFE: [fe - z * seFE, fe + z * seFE], pFE: 2 * normal.sf(Math.abs(fe / seFE)),
    re, seRE, ciRE, pRE, tau2, tau: Math.sqrt(tau2), tau2ci: tau2Interval(y, v, conf), Q, df, pQ: df > 0 ? chiSquare.sf(Q, df) : NaN, I2, I2ci, pi,
    weightsFE: w.map((x) => x / W), weightsRE: wr.map((x) => x / Wr), method, hksj, conf,
  };
}

/**
 * Subgroup analysis: pool within each subgroup (its own tau-squared), then test whether the subgroup
 * estimates differ (Q between subgroups on G - 1 df), as RevMan does. random: use the random-effects
 * estimates (otherwise the fixed-effect ones).
 */
export function subgroups(y, v, groups, { random = true, ...opts } = {}) {
  const labels = [...new Set(groups)];
  const fits = labels.map((g) => {
    const idx = groups.map((x, i) => (x === g ? i : -1)).filter((i) => i >= 0);
    return { label: g, idx, fit: pool(idx.map((i) => y[i]), idx.map((i) => v[i]), opts) };
  });
  const est = fits.map((f) => (random ? f.fit.re : f.fit.fe));
  const se = fits.map((f) => (random ? f.fit.seRE : f.fit.seFE));
  const w = se.map((s) => 1 / (s * s));
  const W = w.reduce((a, b) => a + b, 0);
  const mu = est.reduce((s, e, i) => s + w[i] * e, 0) / W;
  const Q = est.reduce((s, e, i) => s + w[i] * (e - mu) ** 2, 0);
  const df = labels.length - 1;
  return { fits, Q, df, p: df > 0 ? chiSquare.sf(Q, df) : NaN, I2: Q > df ? (Q - df) / Q : 0 };
}

/** Pool again with each study left out in turn. */
export function leaveOneOut(y, v, opts = {}) {
  return y.map((_, i) => pool(y.filter((_, j) => j !== i), v.filter((_, j) => j !== i), opts));
}

/** Egger's regression test for funnel-plot asymmetry: standardised effect on precision. */
export function egger(y, v) {
  const se = v.map(Math.sqrt);
  const fit = ols(se.map((s) => [1, 1 / s]), y.map((yi, i) => yi / se[i]));
  if (fit.error) return null;
  return { intercept: fit.coef[0].b, se: fit.coef[0].se, t: fit.coef[0].t, df: fit.df, p: fit.coef[0].p, ci: fit.coef[0].ci };
}
