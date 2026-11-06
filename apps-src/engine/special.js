/* Special functions for the shared engine. Pure functions: no DOM, no state.
 *
 * Every function here is checked against SciPy reference values in tests/ref/special.json
 * (tests/engine/special.test.mjs). Target: relative error <= 1e-12 in the ranges tested,
 * absolute error <= 1e-15 where the true value is near zero.
 *
 * Tails are computed directly rather than as 1 - (the other tail), so very small p-values
 * keep their precision (a p of 3e-12 is reported as 3e-12, not as 0).
 */

const FPMIN = 1e-300;
const EPS = 1e-16;
const MAXIT = 20000;

/* ---------------------------------------------------------------- gamma --- */

// Lanczos approximation, g = 7, n = 9 (relative error about 1e-15 for x > 0.5).
const LG = 7;
const LC = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];
const HALF_LN_2PI = 0.5 * Math.log(2 * Math.PI);

export function lnGamma(x) {
  if (!(x > 0)) {
    if (x === 0 || (x < 0 && Number.isInteger(x))) return Infinity;
    if (Number.isNaN(x)) return NaN;
  }
  if (x < 0.5) {
    // Reflection: Gamma(x) Gamma(1 - x) = pi / sin(pi x)
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
  }
  const z = x - 1;
  let a = LC[0];
  const t = z + LG + 0.5;
  for (let i = 1; i < 9; i++) a += LC[i] / (z + i);
  return HALF_LN_2PI + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

export function gamma(x) {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  return Math.exp(lnGamma(x));
}

export function lnBeta(a, b) {
  return lnGamma(a) + lnGamma(b) - lnGamma(a + b);
}

// ln(n!) with a cache; exact summation would accumulate rounding, lnGamma does not.
const lnFactCache = [0, 0];
export function lnFactorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n < lnFactCache.length) return lnFactCache[n];
  if (n > 100000) return lnGamma(n + 1);
  for (let i = lnFactCache.length; i <= n; i++) lnFactCache[i] = lnGamma(i + 1);
  return lnFactCache[n];
}

export function lnChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  return lnFactorial(n) - lnFactorial(k) - lnFactorial(n - k);
}

/* --------------------------------------------- regularised incomplete gamma - */

function gammaPrefactor(a, x) {
  return Math.exp(-x + a * Math.log(x) - lnGamma(a));
}

function gammaSeries(a, x) {
  let ap = a, sum = 1 / a, del = sum;
  for (let n = 1; n < MAXIT; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * gammaPrefactor(a, x);
}

function gammaContinuedFraction(a, x) {
  // Modified Lentz evaluation of the continued fraction for Q(a, x).
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i < MAXIT; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return gammaPrefactor(a, x) * h;
}

/** Regularised lower incomplete gamma P(a, x). */
export function gammaP(a, x) {
  if (!(a > 0) || !(x >= 0)) return NaN;
  if (x === 0) return 0;
  if (x === Infinity) return 1;
  if (x < a + 1) return gammaSeries(a, x);
  return 1 - gammaContinuedFraction(a, x);
}

/** Regularised upper incomplete gamma Q(a, x) = 1 - P(a, x), computed directly in the tail. */
export function gammaQ(a, x) {
  if (!(a > 0) || !(x >= 0)) return NaN;
  if (x === 0) return 1;
  if (x === Infinity) return 0;
  if (x < a + 1) return 1 - gammaSeries(a, x);
  return gammaContinuedFraction(a, x);
}

/* ------------------------------------------------------------ erf / erfc --- */

export function erf(x) {
  if (Number.isNaN(x)) return NaN;
  if (x === 0) return 0;
  const p = gammaP(0.5, x * x);
  return x > 0 ? p : -p;
}

export function erfc(x) {
  if (Number.isNaN(x)) return NaN;
  if (x >= 0) return gammaQ(0.5, x * x);
  return 1 + gammaP(0.5, x * x);
}

/* ---------------------------------------------- regularised incomplete beta - */

function betaContinuedFraction(x, a, b) {
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m < MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/**
 * Regularised incomplete beta I_x(a, b).
 * Pass y = 1 - x when the caller can compute it without cancellation
 * (for example y = d2 / (d2 + d1 F) for the F distribution).
 */
export function betaInc(x, a, b, y = 1 - x) {
  if (!(a > 0) || !(b > 0)) return NaN;
  if (x <= 0) return 0;
  if (y <= 0) return 1;
  const lnFront = a * Math.log(x) + b * Math.log(y) - lnBeta(a, b);
  if (x < (a + 1) / (a + b + 2)) {
    return (Math.exp(lnFront) * betaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (Math.exp(lnFront) * betaContinuedFraction(y, b, a)) / b;
}

/** Upper tail 1 - I_x(a, b) = I_y(b, a), computed without subtraction where possible. */
export function betaIncUpper(x, a, b, y = 1 - x) {
  return betaInc(y, b, a, x);
}

/* --------------------------------------------------------- root finding --- */

/**
 * Brent's method on f over [lo, hi]; f(lo) and f(hi) must differ in sign.
 * Returns x with |f(x)| ~ 0 to the tolerance tol (absolute in x, scaled).
 */
export function brent(f, lo, hi, tol = 1e-15, maxit = 300) {
  let a = lo, b = hi, fa = f(a), fb = f(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) return NaN;
  let c = a, fc = fa, d = b - a, e = d;
  for (let i = 0; i < maxit; i++) {
    if (fb * fc > 0) { c = a; fc = fa; d = b - a; e = d; }
    if (Math.abs(fc) < Math.abs(fb)) { a = b; b = c; c = a; fa = fb; fb = fc; fc = fa; }
    // Relative tolerance, so roots far below 1 (a chi-square quantile of 1e-20) keep their digits.
    const tol1 = 2 * Number.EPSILON * Math.abs(b) + 0.5 * tol * Math.abs(b) + 1e-305;
    const xm = 0.5 * (c - b);
    if (Math.abs(xm) <= tol1 || fb === 0) return b;
    if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
      const s = fb / fa;
      let p, q;
      if (a === c) { p = 2 * xm * s; q = 1 - s; }
      else {
        const qq = fa / fc, r = fb / fc;
        p = s * (2 * xm * qq * (qq - r) - (b - a) * (r - 1));
        q = (qq - 1) * (r - 1) * (s - 1);
      }
      if (p > 0) q = -q; else p = -p;
      if (2 * p < Math.min(3 * xm * q - Math.abs(tol1 * q), Math.abs(e * q))) { e = d; d = p / q; }
      else { d = xm; e = d; }
    } else { d = xm; e = d; }
    a = b; fa = fb;
    b += Math.abs(d) > tol1 ? d : (xm > 0 ? tol1 : -tol1);
    fb = f(b);
  }
  return b;
}

/**
 * Solve tail(x) = p for a decreasing tail function on [0, inf) (survival function)
 * or an increasing one (cdf), working on the log scale for small p.
 */
export function invertTail(tail, p, { increasing = false, lo = 0, start = 1 } = {}) {
  if (!(p > 0 && p < 1)) return NaN;
  const g = p < 1e-3
    ? (x) => Math.log(Math.max(tail(x), 1e-320)) - Math.log(p)
    : (x) => tail(x) - p;
  let a = lo, b = Math.max(start, lo + 1e-8);
  // Expand the bracket until the sign changes.
  let gb = g(b);
  const wantSign = increasing ? 1 : -1; // past the root, g has this sign
  let guard = 0;
  while (Math.sign(gb) !== wantSign && gb !== 0 && guard++ < 200) {
    a = b;
    b *= 2;
    gb = g(b);
  }
  return brent(g, a, b, 1e-14);
}
