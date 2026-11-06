/* Sample size and power for the common designs in medical and public health research.
 * Every function returns the unrounded n (per group where relevant); callers round up after
 * adjustments. Formulas and sources:
 *   estimation of a proportion or mean      Lwanga and Lemeshow (WHO, 1991)
 *   sensitivity and specificity              Buderer (1996)
 *   two proportions, with continuity corr.   Fleiss, Levin and Paik (2003), as used by OpenEpi
 *   two means, paired and one-sample means   normal formula, and the exact noncentral-t search (as G*Power)
 *   paired proportions                       Connor (1987)
 *   correlation                              Fisher's z
 *   ANOVA and multiple regression            noncentral F with lambda = f^2 N (Cohen 1988; as G*Power)
 *   survival (log-rank)                      Schoenfeld (1983)
 *   non-inferiority                          Julious (2004); Chow, Shao and Wang (2008)
 * Checked against statsmodels and independent re-implementations in tests/engine/samplesize.test.mjs.
 */
import { normal, studentT, fDist } from './dist.js';
import { noncentralT, noncentralF } from './noncentral.js';

export const zAlpha = (alpha, sides = 2) => normal.isf(alpha / sides);
export const zBeta = (power) => normal.ppf(power);

/* -------------------------------------------------------------- estimation */

/** Population size correction (Cochran): n0 / (1 + (n0 - 1) / N). */
export const fpc = (n0, N) => (Number.isFinite(N) && N > 0 ? n0 / (1 + (n0 - 1) / N) : n0);

/** Estimate a proportion p within +/- d (absolute) or +/- d * p (relative precision). */
export function estimateProportion({ p, d, relative = false, conf = 0.95, N = Infinity }) {
  const z = normal.isf((1 - conf) / 2);
  const abs = relative ? d * p : d;
  const n0 = (z * z * p * (1 - p)) / (abs * abs);
  return { n0, n: fpc(n0, N), z, abs };
}

/** Estimate a mean within +/- d, given the SD. */
export function estimateMean({ sd, d, conf = 0.95, N = Infinity }) {
  const z = normal.isf((1 - conf) / 2);
  const n0 = (z * z * sd * sd) / (d * d);
  return { n0, n: fpc(n0, N), z };
}

/** Buderer (1996): participants needed so sensitivity and specificity are each estimated within +/- d. */
export function sensSpec({ se, sp, prev, d, conf = 0.95 }) {
  const z = normal.isf((1 - conf) / 2);
  const nSe = (z * z * se * (1 - se)) / (d * d * prev);
  const nSp = (z * z * sp * (1 - sp)) / (d * d * (1 - prev));
  return { nSe, nSp, n: Math.max(nSe, nSp), cases: (z * z * se * (1 - se)) / (d * d), z };
}

/* ------------------------------------------------------------ two groups -- */

/**
 * Two independent proportions, Fleiss, Levin and Paik (2003). ratio = n2 / n1.
 * Returns n1 (and n2 = ratio * n1), with and without the continuity correction.
 */
export function twoProportions({ p1, p2, alpha = 0.05, power = 0.8, sides = 2, ratio = 1 }) {
  const za = zAlpha(alpha, sides), zb = zBeta(power), r = ratio;
  const pbar = (p1 + r * p2) / (1 + r), qbar = 1 - pbar, d = Math.abs(p1 - p2);
  const num = za * Math.sqrt((r + 1) * pbar * qbar) + zb * Math.sqrt(r * p1 * (1 - p1) + p2 * (1 - p2));
  const n1 = (num * num) / (r * d * d);
  const n1cc = (n1 / 4) * (1 + Math.sqrt(1 + (2 * (r + 1)) / (n1 * r * d))) ** 2;
  return { n1, n2: r * n1, n1cc, n2cc: r * n1cc, pbar, za, zb };
}

/** Power for two proportions with n1 and n2 (inverse of the Fleiss formula without correction). */
export function twoProportionsPower({ p1, p2, n1, n2, alpha = 0.05, sides = 2, cc = true }) {
  const za = zAlpha(alpha, sides), r = n2 / n1, d = Math.abs(p1 - p2);
  // With the correction, find the uncorrected n that maps to n1, then invert.
  let m = n1;
  if (cc) {
    // n1 = m/4 (1 + sqrt(1 + 2(r+1)/(m r d)))^2 has the exact inverse m = (n1 - c)^2 / n1, c = (r+1)/(2 r d).
    const c = (r + 1) / (2 * r * d);
    if (n1 <= c) return 0;
    m = (n1 - c) ** 2 / n1;
  }
  const pbar = (p1 + r * p2) / (1 + r);
  const zb = (Math.sqrt(m * r * d * d) - za * Math.sqrt((r + 1) * pbar * (1 - pbar))) / Math.sqrt(r * p1 * (1 - p1) + p2 * (1 - p2));
  return normal.cdf(zb);
}

/** Case-control: proportion exposed among controls p0 and the odds ratio to detect. ratio = controls per case. */
export function caseControl({ p0, or, alpha, power, sides, ratio = 1 }) {
  const p1 = (or * p0) / (1 + p0 * (or - 1));
  return { ...twoProportions({ p1, p2: p0, alpha, power, sides, ratio }), p1, p0 };
}

/** Cohort or trial: risk in the unexposed p0 and the risk ratio to detect. ratio = unexposed per exposed. */
export function cohortRR({ p0, rr, alpha, power, sides, ratio = 1 }) {
  const p1 = rr * p0;
  return { ...twoProportions({ p1, p2: p0, alpha, power, sides, ratio }), p1, p0 };
}

/** Two independent means: normal formula and the exact noncentral-t search. ratio = n2 / n1. */
export function twoMeans({ sd, diff, alpha = 0.05, power = 0.8, sides = 2, ratio = 1 }) {
  const za = zAlpha(alpha, sides), zb = zBeta(power), d = Math.abs(diff);
  const nNormal = ((1 + 1 / ratio) * sd * sd * (za + zb) ** 2) / (d * d);
  // Smallest n1 (continuous, as G*Power reports before rounding) with t-test power >= target.
  const pw = (n1) => twoMeansPower({ sd, diff, n1, n2: ratio * n1, alpha, sides });
  const nT = solveN(pw, power, Math.max(2, nNormal * 0.8));
  return { n1: nNormal, n2: ratio * nNormal, n1t: nT, n2t: ratio * nT, za, zb };
}

export function twoMeansPower({ sd, diff, n1, n2, alpha = 0.05, sides = 2 }) {
  const df = n1 + n2 - 2;
  if (df <= 0) return 0;
  const ncp = Math.abs(diff) / (sd * Math.sqrt(1 / n1 + 1 / n2));
  const tc = studentT.isf(alpha / sides, df);
  return sides === 2 ? noncentralT.sf(tc, df, ncp) + noncentralT.cdf(-tc, df, ncp) : noncentralT.sf(tc, df, ncp);
}

/** Paired means or one mean against a value: SD of the differences (or of the data), difference to detect. */
export function oneMean({ sd, diff, alpha = 0.05, power = 0.8, sides = 2 }) {
  const za = zAlpha(alpha, sides), zb = zBeta(power);
  const nNormal = (sd * sd * (za + zb) ** 2) / (diff * diff);
  const nT = solveN((n) => oneMeanPower({ sd, diff, n, alpha, sides }), power, Math.max(2, nNormal * 0.8));
  return { n: nNormal, nt: nT, za, zb };
}

export function oneMeanPower({ sd, diff, n, alpha = 0.05, sides = 2 }) {
  const df = n - 1;
  if (df <= 0) return 0;
  const ncp = (Math.abs(diff) * Math.sqrt(n)) / sd;
  const tc = studentT.isf(alpha / sides, df);
  return sides === 2 ? noncentralT.sf(tc, df, ncp) + noncentralT.cdf(-tc, df, ncp) : noncentralT.sf(tc, df, ncp);
}

/** One proportion against an expected p0, to detect p1. */
export function oneProportion({ p0, p1, alpha = 0.05, power = 0.8, sides = 2 }) {
  const za = zAlpha(alpha, sides), zb = zBeta(power);
  const num = za * Math.sqrt(p0 * (1 - p0)) + zb * Math.sqrt(p1 * (1 - p1));
  return { n: (num * num) / ((p1 - p0) ** 2), za, zb };
}

export function oneProportionPower({ p0, p1, n, alpha = 0.05, sides = 2 }) {
  const za = zAlpha(alpha, sides);
  const zb = (Math.abs(p1 - p0) * Math.sqrt(n) - za * Math.sqrt(p0 * (1 - p0))) / Math.sqrt(p1 * (1 - p1));
  return normal.cdf(zb);
}

/** Paired proportions (McNemar), Connor (1987): p10 and p01 are the two discordant probabilities. */
export function pairedProportions({ p10, p01, alpha = 0.05, power = 0.8, sides = 2 }) {
  const za = zAlpha(alpha, sides), zb = zBeta(power);
  const psi = p10 + p01, delta = p10 - p01;
  const n = (za * Math.sqrt(psi) + zb * Math.sqrt(psi - delta * delta)) ** 2 / (delta * delta);
  return { n, psi, delta, za, zb };
}

/** Correlation coefficient different from zero, via Fisher's z. */
export function correlation({ r, alpha = 0.05, power = 0.8, sides = 2 }) {
  const za = zAlpha(alpha, sides), zb = zBeta(power), C = Math.atanh(Math.abs(r));
  return { n: ((za + zb) / C) ** 2 + 3, C, za, zb };
}

export function correlationPower({ r, n, alpha = 0.05, sides = 2 }) {
  return normal.cdf(Math.atanh(Math.abs(r)) * Math.sqrt(n - 3) - zAlpha(alpha, sides));
}

/* ----------------------------------------------------- noncentral F designs */

/** One-way ANOVA with k groups, effect size Cohen's f. Returns n per group (continuous) and total. */
export function anovaN({ f, k, alpha = 0.05, power = 0.8 }) {
  const pw = (n) => anovaPower({ f, k, n, alpha });
  const n = solveN(pw, power, 2.5);
  return { n, total: n * k };
}

export function anovaPower({ f, k, n, alpha = 0.05 }) {
  const N = n * k, df1 = k - 1, df2 = N - k;
  if (df2 <= 0) return 0;
  const fc = fDist.isf(alpha, df1, df2);
  return noncentralF.sf(fc, df1, df2, f * f * N);
}

/** Multiple regression: test that R-squared (from p predictors) differs from zero. */
export function regressionN({ r2, predictors, alpha = 0.05, power = 0.8 }) {
  const f2 = r2 / (1 - r2);
  const pw = (N) => regressionPower({ f2, predictors, N, alpha });
  const N = solveN(pw, power, predictors + 3);
  return { N, f2 };
}

export function regressionPower({ f2, predictors, N, alpha = 0.05 }) {
  const df1 = predictors, df2 = N - predictors - 1;
  if (df2 <= 0) return 0;
  return noncentralF.sf(fDist.isf(alpha, df1, df2), df1, df2, f2 * N);
}

/* ---------------------------------------------------------------- survival */

/** Schoenfeld (1983): events needed to detect hazard ratio hr; fraction allocated to group 1 = a. */
export function survivalEvents({ hr, alpha = 0.05, power = 0.8, sides = 2, ratio = 1, pEvent = null }) {
  const za = zAlpha(alpha, sides), zb = zBeta(power);
  const a = 1 / (1 + ratio), b = 1 - a;
  const events = (za + zb) ** 2 / (a * b * Math.log(hr) ** 2);
  return { events, total: pEvent ? events / pEvent : null, za, zb };
}

/* ----------------------------------------------------------- non-inferiority */

/** Non-inferiority for proportions: pT (new) and pC (control) success rates, margin > 0, one-sided alpha. ratio = nT / nC. */
export function nonInferiorityProportions({ pT, pC, margin, alpha = 0.025, power = 0.8, ratio = 1 }) {
  const za = normal.isf(alpha), zb = zBeta(power);
  const nC = ((za + zb) ** 2 * ((pT * (1 - pT)) / ratio + pC * (1 - pC))) / ((pT - pC + margin) ** 2);
  return { nC, nT: ratio * nC, za, zb };
}

/** Non-inferiority for means: true difference (new - control, usually 0), margin > 0, one-sided alpha. */
export function nonInferiorityMeans({ sd, diff = 0, margin, alpha = 0.025, power = 0.8, ratio = 1 }) {
  const za = normal.isf(alpha), zb = zBeta(power);
  const nC = ((1 + 1 / ratio) * sd * sd * (za + zb) ** 2) / ((diff + margin) ** 2);
  return { nC, nT: ratio * nC, za, zb };
}

/* ------------------------------------------------------------- adjustments */

/** Inflate for clustering (design effect) and expected non-response or loss to follow-up. */
export function adjustN(n, { designEffect = 1, nonResponse = 0 } = {}) {
  return (n * designEffect) / (1 - nonResponse);
}
export const designEffect = (clusterSize, icc) => 1 + (clusterSize - 1) * icc;

/* ---------------------------------------------------------------- helpers */

/** Smallest continuous n with power(n) >= target, by bracketing and bisection. */
function solveN(power, target, start) {
  let lo = Math.max(1.0001, start / 4), hi = Math.max(start, lo * 2);
  while (power(lo) >= target && lo > 1.0001) lo = Math.max(1.0001, lo / 2);
  let guard = 0;
  while (power(hi) < target && guard++ < 60) hi *= 2;
  for (let i = 0; i < 200 && hi - lo > 1e-7 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (power(mid) >= target) hi = mid; else lo = mid;
  }
  return hi;
}
