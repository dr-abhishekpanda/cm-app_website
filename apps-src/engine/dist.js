/* Probability distributions for the shared engine.
 * cdf = P(X <= x); sf = P(X > x) computed directly (no 1 - cdf in the tail);
 * ppf = inverse cdf; isf = inverse survival function (upper-tail quantile).
 * Checked against scipy.stats in tests/engine/dist.test.mjs.
 */
import { lnGamma, lnBeta, lnChoose, gammaP, gammaQ, erfc, betaInc, invertTail } from './special.js';

const SQRT2 = Math.SQRT2;
const LN_SQRT_2PI = 0.5 * Math.log(2 * Math.PI);

/* ---------------------------------------------------------------- normal --- */

// Wichura (1988) AS 241, PPND16: relative accuracy about 1e-16.
const A = [3.3871328727963666080e0, 1.3314166789178437745e2, 1.9715909503065514427e3, 1.3731693765509461125e4,
  4.5921953931549871457e4, 6.7265770927008700853e4, 3.3430575583588128105e4, 2.5090809287301226727e3];
const B = [1, 4.2313330701600911252e1, 6.8718700749205790830e2, 5.3941960214247511077e3, 2.1213794301586595867e4,
  3.9307895800092710610e4, 2.8729085735721942674e4, 5.2264952788528545610e3];
const C = [1.42343711074968357734e0, 4.63033784615654529590e0, 5.76949722146069140550e0, 3.64784832476320460504e0,
  1.27045825245236838258e0, 2.41780725177450611770e-1, 2.27238449892691845833e-2, 7.74545014278341407640e-4];
const D = [1, 2.05319162663775882187e0, 1.67638483018380384940e0, 6.89767334985100004550e-1, 1.48103976427480074590e-1,
  1.51986665636164571966e-2, 5.47593808499534494600e-4, 1.05075007164441684324e-9];
const E = [6.65790464350110377720e0, 5.46378491116411436990e0, 1.78482653991729133580e0, 2.96560571828504891230e-1,
  2.65321895265761230930e-2, 1.24266094738807843860e-3, 2.71155556874348757815e-5, 2.01033439929228813265e-7];
const F = [1, 5.99832206555887937690e-1, 1.36929880922735805310e-1, 1.48753612908506148525e-2, 7.86869131145613259100e-4,
  1.84631831751005468180e-5, 1.42151175831644588870e-7, 2.04426310338993978564e-15];

function poly(c, x) {
  let s = 0;
  for (let i = c.length - 1; i >= 0; i--) s = s * x + c[i];
  return s;
}

function ppnd16(p) {
  const q = p - 0.5;
  if (Math.abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    return (q * poly(A, r)) / poly(B, r);
  }
  let r = q < 0 ? p : 1 - p;
  r = Math.sqrt(-Math.log(r));
  let v;
  if (r <= 5) { r -= 1.6; v = poly(C, r) / poly(D, r); }
  else { r -= 5; v = poly(E, r) / poly(F, r); }
  return q < 0 ? -v : v;
}

export const normal = {
  pdf: (z) => Math.exp(-0.5 * z * z - LN_SQRT_2PI),
  cdf: (z) => 0.5 * erfc(-z / SQRT2),
  sf: (z) => 0.5 * erfc(z / SQRT2),
  twoSided: (z) => erfc(Math.abs(z) / SQRT2),
  ppf(p) {
    if (p <= 0) return p === 0 ? -Infinity : NaN;
    if (p >= 1) return p === 1 ? Infinity : NaN;
    return ppnd16(p);
  },
  // Upper-tail quantile: the z with P(Z > z) = pu. Uses symmetry, so small pu keeps full precision.
  isf(pu) {
    if (pu <= 0) return pu === 0 ? Infinity : NaN;
    if (pu >= 1) return pu === 1 ? -Infinity : NaN;
    return -ppnd16(pu);
  },
};

/* --------------------------------------------------------------- Student t - */

export const studentT = {
  pdf(x, df) {
    if (df === Infinity) return normal.pdf(x);
    return Math.exp(lnGamma((df + 1) / 2) - lnGamma(df / 2) - 0.5 * Math.log(df * Math.PI)
      - ((df + 1) / 2) * Math.log1p((x * x) / df));
  },
  // One tail beyond |x|: P(T > |x|).
  tail(x, df) {
    if (df === Infinity) return normal.sf(Math.abs(x));
    const x2 = x * x;
    return 0.5 * betaInc(df / (df + x2), df / 2, 0.5, x2 / (df + x2));
  },
  cdf(x, df) {
    if (Number.isNaN(x)) return NaN;
    const t = studentT.tail(x, df);
    return x > 0 ? 1 - t : t;
  },
  sf(x, df) {
    if (Number.isNaN(x)) return NaN;
    const t = studentT.tail(x, df);
    return x < 0 ? 1 - t : t;
  },
  twoSided(x, df) {
    if (df === Infinity) return normal.twoSided(x);
    const x2 = x * x;
    return Math.min(1, betaInc(df / (df + x2), df / 2, 0.5, x2 / (df + x2)));
  },
  isf(pu, df) {
    if (df === Infinity) return normal.isf(pu);
    if (!(pu > 0 && pu < 1)) return pu === 0 ? Infinity : pu === 1 ? -Infinity : NaN;
    if (pu === 0.5) return 0;
    if (pu > 0.5) return -studentT.isf(1 - pu, df);
    return invertTail((x) => studentT.tail(x, df), pu, { start: Math.max(1, normal.isf(pu)) });
  },
  ppf(p, df) {
    if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
    if (p === 0.5) return 0;
    return p < 0.5 ? -studentT.isf(p, df) : studentT.isf(1 - p, df);
  },
};

/* -------------------------------------------------------------- chi-square - */

export const chiSquare = {
  pdf(x, k) {
    if (x < 0) return 0;
    if (x === 0) return k === 2 ? 0.5 : k < 2 ? Infinity : 0;
    return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lnGamma(k / 2));
  },
  cdf: (x, k) => (x <= 0 ? 0 : gammaP(k / 2, x / 2)),
  sf: (x, k) => (x <= 0 ? 1 : gammaQ(k / 2, x / 2)),
  isf(pu, k) {
    if (!(pu > 0 && pu < 1)) return pu === 0 ? Infinity : pu === 1 ? 0 : NaN;
    if (pu > 0.5) return chiSquare.ppf(1 - pu, k);
    return invertTail((x) => chiSquare.sf(x, k), pu, { start: Math.max(1, k) });
  },
  ppf(p, k) {
    if (!(p > 0 && p < 1)) return p === 0 ? 0 : p === 1 ? Infinity : NaN;
    if (p > 0.5) return chiSquare.isf(1 - p, k);
    return invertTail((x) => chiSquare.cdf(x, k), p, { increasing: true, start: Math.max(1, k) });
  },
};

/* --------------------------------------------------------------------- F --- */

export const fDist = {
  pdf(x, d1, d2) {
    if (x < 0) return 0;
    if (x === 0) return d1 === 2 ? 1 : d1 < 2 ? Infinity : 0;
    return Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2))
      - Math.log(x) - lnBeta(d1 / 2, d2 / 2));
  },
  cdf(x, d1, d2) {
    if (x <= 0) return 0;
    const s = d1 * x + d2;
    return betaInc((d1 * x) / s, d1 / 2, d2 / 2, d2 / s);
  },
  sf(x, d1, d2) {
    if (x <= 0) return 1;
    const s = d1 * x + d2;
    return betaInc(d2 / s, d2 / 2, d1 / 2, (d1 * x) / s);
  },
  isf(pu, d1, d2) {
    if (!(pu > 0 && pu < 1)) return pu === 0 ? Infinity : pu === 1 ? 0 : NaN;
    if (pu > 0.5) return fDist.ppf(1 - pu, d1, d2);
    return invertTail((x) => fDist.sf(x, d1, d2), pu, { start: 1 });
  },
  ppf(p, d1, d2) {
    if (!(p > 0 && p < 1)) return p === 0 ? 0 : p === 1 ? Infinity : NaN;
    if (p > 0.5) return fDist.isf(1 - p, d1, d2);
    return invertTail((x) => fDist.cdf(x, d1, d2), p, { increasing: true, start: 1 });
  },
};

/* -------------------------------------------------------------- binomial --- */

export const binomial = {
  pmf(k, n, p) {
    if (!Number.isInteger(k) || k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    return Math.exp(lnChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
  },
  // P(X <= k)
  cdf(k, n, p) {
    k = Math.floor(k);
    if (k < 0) return 0;
    if (k >= n) return 1;
    if (p === 0) return 1;
    if (p === 1) return 0;
    return betaInc(1 - p, n - k, k + 1, p);
  },
  // P(X > k)
  sf(k, n, p) {
    k = Math.floor(k);
    if (k < 0) return 1;
    if (k >= n) return 0;
    if (p === 0) return 0;
    if (p === 1) return 1;
    return betaInc(p, k + 1, n - k, 1 - p);
  },
};

/* --------------------------------------------------------------- Poisson --- */

export const poisson = {
  pmf(k, mu) {
    if (!Number.isInteger(k) || k < 0) return 0;
    if (mu === 0) return k === 0 ? 1 : 0;
    return Math.exp(k * Math.log(mu) - mu - lnGamma(k + 1));
  },
  cdf(k, mu) {
    k = Math.floor(k);
    if (k < 0) return 0;
    if (mu === 0) return 1;
    return gammaQ(k + 1, mu);
  },
  sf(k, mu) {
    k = Math.floor(k);
    if (k < 0) return 1;
    if (mu === 0) return 0;
    return gammaP(k + 1, mu);
  },
};

/* --------------------------------------------------------- hypergeometric - */

// Population N with K successes, n draws: P(X = k).
export const hypergeometric = {
  lnPmf: (k, N, K, n) => lnChoose(K, k) + lnChoose(N - K, n - k) - lnChoose(N, n),
  pmf: (k, N, K, n) => {
    if (k < Math.max(0, n - (N - K)) || k > Math.min(n, K)) return 0;
    return Math.exp(hypergeometric.lnPmf(k, N, K, n));
  },
};
