/* Agreement and reliability: Cohen's kappa (unweighted, linear and quadratic weights) with the
 * Fleiss-Cohen-Everitt standard errors, Fleiss' kappa for several raters, intraclass correlation
 * (Shrout and Fleiss forms, McGraw and Wong intervals), Bland-Altman limits of agreement (raw,
 * percentage or ratio differences), and Cronbach's alpha with Feldt's interval and item statistics.
 * Checked against statsmodels and pingouin in tests/engine/agreement.test.mjs.
 */
import { normal, fDist, studentT } from './dist.js';
import { mean, variance, quantile } from './describe.js';
import { ols } from './regression.js';
import { mulberry32 } from './random.js';

/** Landis and Koch (1977) labels for kappa, used everywhere in the apps for consistency. */
export function kappaLabel(k) {
  if (!Number.isFinite(k)) return '';
  if (k < 0) return 'poor (less than chance)';
  if (k <= 0.2) return 'slight';
  if (k <= 0.4) return 'fair';
  if (k <= 0.6) return 'moderate';
  if (k <= 0.8) return 'substantial';
  return 'almost perfect';
}

/** Koo and Li (2016) labels for the ICC. */
export function iccLabel(v) {
  if (!Number.isFinite(v)) return '';
  if (v < 0.5) return 'poor';
  if (v < 0.75) return 'moderate';
  if (v < 0.9) return 'good';
  return 'excellent';
}

/** Cohen's kappa from a square table (rater A rows, rater B columns). weights: 'none' | 'linear' | 'quadratic'. */
export function cohenKappa(table, { weights = 'none', conf = 0.95 } = {}) {
  const k = table.length;
  const n = table.flat().reduce((a, b) => a + b, 0);
  const p = table.map((r) => r.map((v) => v / n));
  const row = p.map((r) => r.reduce((a, b) => a + b, 0));
  const colm = p[0].map((_, j) => p.reduce((s, r) => s + r[j], 0));
  const w = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => {
    if (weights === 'linear') return 1 - Math.abs(i - j) / (k - 1);
    if (weights === 'quadratic') return 1 - ((i - j) / (k - 1)) ** 2;
    return i === j ? 1 : 0;
  }));
  let po = 0, pe = 0;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) { po += w[i][j] * p[i][j]; pe += w[i][j] * row[i] * colm[j]; }
  const kappa = (po - pe) / (1 - pe);
  const wi = row.map((_, i) => colm.reduce((s, c, j) => s + c * w[i][j], 0));
  const wj = colm.map((_, j) => row.reduce((s, r, i) => s + r * w[i][j], 0));
  let a = 0, a0 = 0;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    a += p[i][j] * (w[i][j] - (wi[i] + wj[j]) * (1 - kappa)) ** 2;
    a0 += row[i] * colm[j] * (w[i][j] - (wi[i] + wj[j])) ** 2;
  }
  const varK = (a - (kappa - pe * (1 - kappa)) ** 2) / (n * (1 - pe) ** 2);
  const var0 = (a0 - pe * pe) / (n * (1 - pe) ** 2);
  const se = Math.sqrt(varK), se0 = Math.sqrt(var0);
  const z = normal.isf((1 - conf) / 2);
  const zz = kappa / se0;
  return { kappa, se, ci: [kappa - z * se, kappa + z * se], se0, z: zz, p: 2 * normal.sf(Math.abs(zz)), po, pe, n, weights, label: kappaLabel(kappa) };
}

function fleissCore(counts, n) {
  const N = counts.length, k = counts[0].length;
  const pj = Array.from({ length: k }, (_, j) => counts.reduce((s, r) => s + r[j], 0) / (N * n));
  let Pbar = 0;
  for (const r of counts) Pbar += (r.reduce((s, v) => s + v * v, 0) - n) / (n * (n - 1));
  Pbar /= N;
  const Pe = pj.reduce((s, v) => s + v * v, 0);
  return { kappa: (Pbar - Pe) / (1 - Pe), Pbar, Pe, pj };
}

/**
 * Fleiss' kappa: counts[subject][category] = raters choosing that category (the same number of
 * raters for every subject). Adds the z test of no agreement beyond chance with the Fleiss, Nee
 * and Landis (1979) standard error, the kappa for each category (Fleiss 1971), and a percentile
 * bootstrap CI that resamples subjects (B resamples, fixed seed).
 */
export function fleissKappa(counts, { conf = 0.95, B = 2000, seed = 20261031 } = {}) {
  const N = counts.length;
  const n = counts[0].reduce((a, b) => a + b, 0);
  const k = counts[0].length;
  const { kappa, Pbar, Pe, pj } = fleissCore(counts, n);
  if (!(Pe < 1)) return { error: 'Every rating fell in one category, so kappa is not defined.', subjects: N, raters: n };
  const qj = pj.map((p) => 1 - p);
  const sPQ = pj.reduce((s, p, j) => s + p * qj[j], 0);
  const var0 = (2 / (sPQ * sPQ * N * n * (n - 1))) * (sPQ * sPQ - pj.reduce((s, p, j) => s + p * qj[j] * (qj[j] - pj[j]), 0));
  const se0 = Math.sqrt(var0);
  const z = kappa / se0;
  const categories = pj.map((p, j) => ({
    p, kappa: p > 0 && p < 1 ? 1 - counts.reduce((s, r) => s + r[j] * (n - r[j]), 0) / (N * n * (n - 1) * p * (1 - p)) : NaN,
  }));
  const rand = mulberry32(seed);
  const boot = [];
  const sample = new Array(N);
  for (let b = 0; b < B; b++) {
    for (let i = 0; i < N; i++) sample[i] = counts[Math.floor(rand() * N)];
    const kb = fleissCore(sample, n).kappa;
    if (Number.isFinite(kb)) boot.push(kb);
  }
  boot.sort((a, b) => a - b);
  const a = (1 - conf) / 2;
  const ci = boot.length > 0.9 * B ? [quantile(boot, a), quantile(boot, 1 - a)] : [NaN, NaN];
  return { kappa, Pbar, Pe, subjects: N, raters: n, k, se0, z, p: 2 * normal.sf(Math.abs(z)), categories, ci, B: boot.length, seed, label: kappaLabel(kappa) };
}

/** Intraclass correlations from n subjects x k raters (complete rows), as pingouin and SPSS report them. */
export function icc(data, conf = 0.95) {
  const n = data.length, k = data[0].length;
  const grand = mean(data.flat());
  const rowM = data.map((r) => mean(r));
  const colM = Array.from({ length: k }, (_, j) => mean(data.map((r) => r[j])));
  let ssT = 0;
  for (const r of data) for (const v of r) ssT += (v - grand) ** 2;
  const ssR = k * rowM.reduce((s, m) => s + (m - grand) ** 2, 0);
  const ssC = n * colM.reduce((s, m) => s + (m - grand) ** 2, 0);
  const ssE = ssT - ssR - ssC;
  const ssW = ssT - ssR;
  const df1 = n - 1, df1kd = n * (k - 1), df2kd = (n - 1) * (k - 1);
  const msb = ssR / df1, msw = ssW / df1kd, msj = ssC / (k - 1), mse = ssE / df2kd;
  const a = 1 - conf;
  const Fq = (p, d1, d2) => fDist.ppf(p, d1, d2);
  const icc1 = (msb - msw) / (msb + (k - 1) * msw);
  const icc2 = (msb - mse) / (msb + (k - 1) * mse + (k * (msj - mse)) / n);
  const icc3 = (msb - mse) / (msb + (k - 1) * mse);
  const icc1k = (msb - msw) / msb;
  const icc2k = (msb - mse) / (msb + (msj - mse) / n);
  const icc3k = (msb - mse) / msb;
  const f1 = msb / msw, f3 = msb / mse;
  const f1l = f1 / Fq(1 - a / 2, df1, df1kd), f1u = f1 * Fq(1 - a / 2, df1kd, df1);
  const f3l = f3 / Fq(1 - a / 2, df1, df2kd), f3u = f3 * Fq(1 - a / 2, df2kd, df1);
  const fj = msj / mse;
  const vn = df2kd * (k * icc2 * fj + n * (1 + (k - 1) * icc2) - k * icc2) ** 2;
  const vd = df1 * k * k * icc2 * icc2 * fj * fj + (n * (1 + (k - 1) * icc2) - k * icc2) ** 2;
  const v = vn / vd;
  const f2u = Fq(1 - a / 2, n - 1, v), f2l = Fq(1 - a / 2, v, n - 1);
  const l2 = (n * (msb - f2u * mse)) / (f2u * (k * msj + (k * n - k - n) * mse) + n * msb);
  const u2 = (n * (f2l * msb - mse)) / (k * msj + (k * n - k - n) * mse + n * f2l * msb);
  const forms = [
    { id: 'ICC1', name: 'One-way random, single rater', icc: icc1, F: f1, df1, df2: df1kd, ci: [(f1l - 1) / (f1l + k - 1), (f1u - 1) / (f1u + k - 1)] },
    { id: 'ICC2', name: 'Two-way random, absolute agreement, single rater', icc: icc2, F: f3, df1, df2: df2kd, ci: [l2, u2] },
    { id: 'ICC3', name: 'Two-way mixed, consistency, single rater', icc: icc3, F: f3, df1, df2: df2kd, ci: [(f3l - 1) / (f3l + k - 1), (f3u - 1) / (f3u + k - 1)] },
    { id: 'ICC1k', name: 'One-way random, mean of raters', icc: icc1k, F: f1, df1, df2: df1kd, ci: [1 - 1 / f1l, 1 - 1 / f1u] },
    { id: 'ICC2k', name: 'Two-way random, absolute agreement, mean of raters', icc: icc2k, F: f3, df1, df2: df2kd, ci: [(k * l2) / (1 + (k - 1) * l2), (k * u2) / (1 + (k - 1) * u2)] },
    { id: 'ICC3k', name: 'Two-way mixed, consistency, mean of raters', icc: icc3k, F: f3, df1, df2: df2kd, ci: [1 - 1 / f3l, 1 - 1 / f3u] },
  ].map((f) => ({ ...f, p: fDist.sf(f.F, f.df1, f.df2), label: iccLabel(f.icc) }));
  return { n, k, forms, ms: { msb, msw, msj, mse } };
}

/**
 * Bland-Altman: bias, limits of agreement with approximate 95% CIs (Bland and Altman 1999), and the
 * slope of the differences on the means (proportional bias). scale: 'raw' (a - b), 'percent'
 * (100 (a - b) / mean of the pair) or 'ratio' (log a - log b; report exp of the results as a / b).
 */
export function blandAltman(a, b, { conf = 0.95, scale = 'raw' } = {}) {
  const n = a.length;
  const avg = a.map((v, i) => (v + b[i]) / 2);
  const diff = a.map((v, i) => (scale === 'percent' ? (100 * (v - b[i])) / avg[i] : scale === 'ratio' ? Math.log(v) - Math.log(b[i]) : v - b[i]));
  const bias = mean(diff), sd = Math.sqrt(variance(diff, bias));
  const z = normal.isf((1 - conf) / 2);
  const t = studentT.isf((1 - conf) / 2, n - 1);
  const seBias = sd / Math.sqrt(n), seLoA = Math.sqrt((3 * sd * sd) / n);
  const lo = bias - z * sd, hi = bias + z * sd;
  const fit = ols(avg.map((m) => [1, m]), diff);
  return {
    n, scale, bias, sd, ciBias: [bias - t * seBias, bias + t * seBias], loa: [lo, hi],
    ciLo: [lo - t * seLoA, lo + t * seLoA], ciHi: [hi - t * seLoA, hi + t * seLoA],
    slope: fit.error ? NaN : fit.coef[1].b, pSlope: fit.error ? NaN : fit.coef[1].p, diff, avg,
  };
}

/** Cronbach's alpha with Feldt's (1965) F-based interval; items[j] = scores on item j (complete cases). */
export function cronbach(data, conf = 0.95) {
  const n = data.length, k = data[0].length;
  const itemVar = Array.from({ length: k }, (_, j) => variance(data.map((r) => r[j])));
  const totals = data.map((r) => r.reduce((s, v) => s + v, 0));
  const totVar = variance(totals);
  const alpha = (k / (k - 1)) * (1 - itemVar.reduce((s, v) => s + v, 0) / totVar);
  const df1 = n - 1, df2 = (n - 1) * (k - 1), a = 1 - conf;
  const ci = [1 - (1 - alpha) * fDist.ppf(1 - a / 2, df1, df2), 1 - (1 - alpha) * fDist.ppf(a / 2, df1, df2)];
  const corr = (x, y) => {
    const mx = mean(x), my = mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
    return sxy / Math.sqrt(sxx * syy);
  };
  const items = Array.from({ length: k }, (_, j) => {
    const rest = data.map((r, i) => totals[i] - r[j]);
    const others = data.map((r) => r.filter((_, q) => q !== j));
    const vOthers = others[0].map((_, q) => variance(others.map((r) => r[q])));
    const restVar = variance(rest);
    const alphaDel = k > 2 ? ((k - 1) / (k - 2)) * (1 - vOthers.reduce((s, v) => s + v, 0) / restVar) : NaN;
    return { j, mean: mean(data.map((r) => r[j])), sd: Math.sqrt(itemVar[j]), itemRest: corr(data.map((r) => r[j]), rest), alphaIfDeleted: alphaDel };
  });
  return { alpha, ci, n, k, items };
}
