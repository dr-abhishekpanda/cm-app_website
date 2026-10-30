/* Noncentral t, chi-square and F distributions: power, sample size and confidence intervals
 * for effect sizes. Checked against scipy.stats.nct, ncx2 and ncf in tests/engine/noncentral.test.mjs.
 *
 * Noncentral t follows Lenth (1989) AS 243 with the refinements in R's pnt.c; chi-square and F
 * are Poisson mixtures of central distributions, summed outward from the largest weight.
 */
import { lnGamma, betaInc, gammaP, gammaQ, brent } from './special.js';
import { normal, studentT, chiSquare, fDist } from './dist.js';

const LN_SQRT_PI = 0.5 * Math.log(Math.PI);
const SQRT_2_PI = Math.sqrt(2 / Math.PI);

/* ------------------------------------------------------------ noncentral t - */

function nctLower(t, df, ncp) {
  if (ncp === 0) return studentT.cdf(t, df);
  if (!Number.isFinite(t)) return t < 0 ? 0 : 1;
  let negdel, tt, del;
  if (t >= 0) { negdel = false; tt = t; del = ncp; }
  else {
    if (ncp > 40) return 0;
    negdel = true; tt = -t; del = -ncp;
  }
  if (df > 4e5 || del * del > 2 * Math.LN2 * 1021) {
    // Abramowitz and Stegun 26.7.10.
    const s = 1 / (4 * df);
    const z = (tt * (1 - s) - del) / Math.sqrt(1 + tt * tt * 2 * s);
    return negdel ? normal.sf(z) : normal.cdf(z);
  }
  const t2 = t * t;
  let rxb = df / (t2 + df);
  const x = t2 / (t2 + df);
  let tnc = 0;
  if (x > 0) {
    const lambda = del * del;
    let p = 0.5 * Math.exp(-0.5 * lambda);
    if (p === 0) return negdel ? 1 : 0;
    let q = SQRT_2_PI * p * del;
    let s = 0.5 - p;
    if (s < 1e-7) s = -0.5 * Math.expm1(-0.5 * lambda);
    let a = 0.5;
    const b = 0.5 * df;
    rxb = Math.pow(rxb, b);
    const albeta = LN_SQRT_PI + lnGamma(b) - lnGamma(0.5 + b);
    let xodd = betaInc(x, a, b, df / (t2 + df));
    let godd = 2 * rxb * Math.exp(a * Math.log(x) - albeta);
    tnc = b * x;
    let xeven = tnc < Number.EPSILON ? tnc : 1 - rxb;
    let geven = tnc * rxb;
    tnc = p * xodd + q * xeven;
    for (let it = 1; it <= 2000; it++) {
      a += 1;
      xodd -= godd;
      xeven -= geven;
      godd *= (x * (a + b - 1)) / a;
      geven *= (x * (a + b - 0.5)) / (a + 0.5);
      p *= lambda / (2 * it);
      q *= lambda / (2 * it + 1);
      tnc += p * xodd + q * xeven;
      s -= p;
      if (s < -1e-10) break;
      if (s <= 0 && it > 1) break;
      if (Math.abs(2 * s * (xodd - godd)) < 1e-14) break;
    }
  }
  tnc += normal.cdf(-del);
  const v = Math.min(tnc, 1);
  return negdel ? 1 - v : v;
}

export const noncentralT = {
  cdf: (t, df, ncp) => Math.max(0, Math.min(1, nctLower(t, df, ncp))),
  sf: (t, df, ncp) => Math.max(0, Math.min(1, 1 - nctLower(t, df, ncp))),
  /**
   * The noncentrality whose distribution puts probability `p` below the observed t:
   * cdf(t, df, ncp) = p. Used to invert a t statistic into a confidence interval for ncp.
   */
  ncpFor(t, df, p) {
    const f = (d) => nctLower(t, df, d) - p;
    let lo = t - 10, hi = t + 10;
    for (let i = 0; i < 60 && f(lo) < 0; i++) lo -= 10 + Math.abs(lo);
    for (let i = 0; i < 60 && f(hi) > 0; i++) hi += 10 + Math.abs(hi);
    return brent(f, lo, hi, 1e-13);
  },
};

/* ----------------------------------------------------- Poisson mixtures ---- */

// Sum w_j * term(j) over j >= 0 with Poisson(mu) weights, starting at the mode and moving out.
function poissonMixture(mu, term) {
  if (mu === 0) return term(0);
  const mode = Math.floor(mu);
  const lnw = (j) => -mu + j * Math.log(mu) - lnGamma(j + 1);
  let total = 0;
  for (let j = mode; j >= 0; j--) {
    const w = Math.exp(lnw(j));
    total += w * term(j);
    if (w < 1e-18 && j < mode) break;
  }
  for (let j = mode + 1; j < mode + 100000; j++) {
    const w = Math.exp(lnw(j));
    total += w * term(j);
    if (w < 1e-18) break;
  }
  return total;
}

/* --------------------------------------------------- noncentral chi-square - */

export const noncentralChiSquare = {
  cdf(x, k, ncp) {
    if (ncp === 0) return chiSquare.cdf(x, k);
    if (x <= 0) return 0;
    return Math.min(1, poissonMixture(ncp / 2, (j) => gammaP(k / 2 + j, x / 2)));
  },
  sf(x, k, ncp) {
    if (ncp === 0) return chiSquare.sf(x, k);
    if (x <= 0) return 1;
    return Math.min(1, poissonMixture(ncp / 2, (j) => gammaQ(k / 2 + j, x / 2)));
  },
};

/* ------------------------------------------------------------ noncentral F - */

export const noncentralF = {
  cdf(x, d1, d2, ncp) {
    if (ncp === 0) return fDist.cdf(x, d1, d2);
    if (x <= 0) return 0;
    const s = d1 * x + d2, y = (d1 * x) / s, y1 = d2 / s;
    return Math.min(1, poissonMixture(ncp / 2, (j) => betaInc(y, d1 / 2 + j, d2 / 2, y1)));
  },
  sf(x, d1, d2, ncp) {
    if (ncp === 0) return fDist.sf(x, d1, d2);
    if (x <= 0) return 1;
    const s = d1 * x + d2, y = (d1 * x) / s, y1 = d2 / s;
    return Math.min(1, poissonMixture(ncp / 2, (j) => betaInc(y1, d2 / 2, d1 / 2 + j, y)));
  },
};
