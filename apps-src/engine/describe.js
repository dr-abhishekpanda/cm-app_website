/* Descriptive statistics: summaries, quantiles, ranks, confidence intervals for a mean and a
 * median, skewness and kurtosis, and the Shapiro-Wilk test. Pure functions on number arrays.
 * Checked against SciPy and NumPy in tests/engine/describe.test.mjs.
 */
import { normal, studentT, binomial } from './dist.js';

/* -------------------------------------------------------------- basics --- */

export const sortNum = (x) => Float64Array.from(x).sort();

/** Neumaier-compensated sum: stays exact to the last digit for long columns of measurements. */
export function sum(x) {
  let s = 0, c = 0;
  for (const v of x) {
    const t = s + v;
    c += Math.abs(s) >= Math.abs(v) ? (s - t) + v : (v - t) + s;
    s = t;
  }
  return s + c;
}

export const mean = (x) => sum(x) / x.length;

/** Sample variance (n - 1), two-pass with correction. */
export function variance(x, m = mean(x)) {
  const n = x.length;
  if (n < 2) return NaN;
  let ss = 0, comp = 0;
  for (const v of x) { const d = v - m; ss += d * d; comp += d; }
  return (ss - (comp * comp) / n) / (n - 1);
}

export const sd = (x, m) => Math.sqrt(variance(x, m));

/**
 * Quantile of sorted data. type 7 (R default, NumPy, Excel QUARTILE.INC);
 * type 6 (SPSS, Minitab, Excel QUARTILE.EXC). Hyndman and Fan (1996).
 */
export function quantile(s, p, type = 7) {
  const n = s.length;
  if (n === 0) return NaN;
  if (n === 1) return s[0];
  let h;
  if (type === 6) h = (n + 1) * p;
  else h = (n - 1) * p + 1;
  if (h <= 1) return s[0];
  if (h >= n) return s[n - 1];
  const lo = Math.floor(h);
  return s[lo - 1] + (h - lo) * (s[lo] - s[lo - 1]);
}

export const QUANTILE_METHODS = {
  6: 'SPSS and Minitab (Hyndman-Fan type 6, Excel QUARTILE.EXC)',
  7: 'R, NumPy and Excel QUARTILE.INC (Hyndman-Fan type 7)',
};

/* --------------------------------------------------------------- ranks --- */

/** Average ranks (ties share the mean rank), with the tie groups for corrections. */
export function rank(x) {
  const n = x.length;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => x[a] - x[b]);
  const r = new Float64Array(n);
  const ties = [];
  for (let i = 0; i < n;) {
    let j = i;
    while (j + 1 < n && x[idx[j + 1]] === x[idx[i]]) j++;
    const avg = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) r[idx[k]] = avg;
    if (j > i) ties.push(j - i + 1);
    i = j + 1;
  }
  return { ranks: r, ties };
}

/** Sum over tie groups of (t^3 - t): the usual correction term for rank tests. */
export const tieSum = (ties) => ties.reduce((s, t) => s + t * t * t - t, 0);

/* -------------------------------------------------- moments and shape --- */

/** Skewness and excess kurtosis as SPSS and SAS report them (bias-adjusted G1 and G2), with standard errors. */
export function shape(x) {
  const n = x.length;
  const m = mean(x);
  let m2 = 0, m3 = 0, m4 = 0;
  for (const v of x) { const d = v - m; const d2 = d * d; m2 += d2; m3 += d2 * d; m4 += d2 * d2; }
  m2 /= n; m3 /= n; m4 /= n;
  const g1 = m3 / Math.pow(m2, 1.5);
  const g2 = m4 / (m2 * m2) - 3;
  const skew = n > 2 ? (Math.sqrt(n * (n - 1)) / (n - 2)) * g1 : NaN;
  const kurt = n > 3 ? ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * g2 + 6) : NaN;
  const seSkew = n > 2 ? Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3))) : NaN;
  const seKurt = n > 3 ? 2 * seSkew * Math.sqrt((n * n - 1) / ((n - 3) * (n + 5))) : NaN;
  return { skew, kurt, seSkew, seKurt, zSkew: skew / seSkew, zKurt: kurt / seKurt, g1, g2 };
}

/* ------------------------------------------------- confidence intervals --- */

export function ciMean(n, m, s, conf = 0.95) {
  if (n < 2) return [NaN, NaN];
  const h = studentT.isf((1 - conf) / 2, n - 1) * (s / Math.sqrt(n));
  return [m - h, m + h];
}

/**
 * Distribution-free confidence interval for the median from order statistics (binomial,
 * p = 0.5). Coverage is at least `conf`; the achieved coverage is returned. Needs n >= 6 for 95%.
 */
export function ciMedian(sorted, conf = 0.95) {
  const n = sorted.length;
  const a = (1 - conf) / 2;
  // largest l with P(B <= l - 1) <= a, B ~ Bin(n, 1/2)
  let l = 0;
  while (l + 1 <= n && binomial.cdf(l, n, 0.5) <= a) l++;
  if (l < 1) return { lo: NaN, hi: NaN, coverage: NaN, ranks: null };
  const u = n - l + 1;
  return { lo: sorted[l - 1], hi: sorted[u - 1], coverage: 1 - 2 * binomial.cdf(l - 1, n, 0.5), ranks: [l, u] };
}

/* ------------------------------------------------------------- summary --- */

/**
 * Everything a results table needs for one numeric variable.
 * qtype: quantile definition (6 = SPSS, 7 = R and Excel QUARTILE.INC).
 */
export function summarise(x, { conf = 0.95, qtype = 6 } = {}) {
  const n = x.length;
  if (n === 0) return { n: 0 };
  const s = sortNum(x);
  const m = mean(x);
  const v = variance(x, m);
  const sdv = Math.sqrt(v);
  const q1 = quantile(s, 0.25, qtype), med = quantile(s, 0.5, qtype), q3 = quantile(s, 0.75, qtype);
  const out = {
    n, mean: m, sd: sdv, variance: v, se: sdv / Math.sqrt(n), ciMean: ciMean(n, m, sdv, conf),
    median: med, q1, q3, iqr: q3 - q1, min: s[0], max: s[n - 1], range: s[n - 1] - s[0],
    cv: m !== 0 ? sdv / Math.abs(m) : NaN, ciMedian: ciMedian(s, conf), qtype, conf,
  };
  if (n >= 4) Object.assign(out, shape(x));
  if (s[0] > 0) {
    const logs = x.map(Math.log);
    const lm = mean(logs), ls = sd(logs, lm);
    const ci = ciMean(n, lm, ls, conf);
    out.gmean = Math.exp(lm);
    out.ciGmean = [Math.exp(ci[0]), Math.exp(ci[1])];
  }
  const fenceLo = q1 - 1.5 * out.iqr, fenceHi = q3 + 1.5 * out.iqr;
  out.outliers = x.filter((v2) => v2 < fenceLo || v2 > fenceHi);
  out.fences = [fenceLo, fenceHi];
  return out;
}

/* -------------------------------------------------------- Shapiro-Wilk --- */

function polyAS(c, x) {
  // AS 181.2: c[0] + c[1] x + ... + c[k-1] x^(k-1)
  let p = 0;
  for (let i = c.length - 1; i >= 1; i--) p = (p + c[i]) * x;
  return c[0] + p;
}

const SW = {
  g: [-2.273, 0.459],
  c1: [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056],
  c2: [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633],
  c3: [0.544, -0.39978, 0.025054, -6.714e-4],
  c4: [1.3822, -0.77857, 0.062767, -0.0020322],
  c5: [-1.5861, -0.31082, -0.083751, 0.0038915],
  c6: [-0.4803, -0.082676, 0.0030302],
};

/**
 * Shapiro-Wilk W and its p-value, Royston (1995) algorithm AS R94 (as in R and SciPy).
 * Valid for 3 <= n <= 5000.
 */
export function shapiroWilk(values) {
  const n = values.length;
  if (n < 3) return { n, W: NaN, p: NaN, error: 'Needs at least 3 values' };
  if (n > 5000) return { n, W: NaN, p: NaN, error: 'Shapiro-Wilk is defined for up to 5,000 values' };
  const s = sortNum(values);
  const shift = s[Math.floor(n / 2)];
  const x = s.map((v) => v - shift);
  const nn2 = Math.floor(n / 2);
  const a = new Float64Array(nn2 + 1); // 1-based
  const an = n;
  if (n === 3) a[1] = Math.SQRT1_2;
  else {
    const an25 = an + 0.25;
    let summ2 = 0;
    for (let i = 1; i <= nn2; i++) { a[i] = normal.ppf((i - 0.375) / an25); summ2 += a[i] * a[i]; }
    summ2 *= 2;
    const ssumm2 = Math.sqrt(summ2);
    const rsn = 1 / Math.sqrt(an);
    const a1 = polyAS(SW.c1, rsn) - a[1] / ssumm2;
    let i1, fac;
    if (n > 5) {
      i1 = 3;
      const a2 = -a[2] / ssumm2 + polyAS(SW.c2, rsn);
      fac = Math.sqrt((summ2 - 2 * (a[1] * a[1]) - 2 * (a[2] * a[2])) / (1 - 2 * (a1 * a1) - 2 * (a2 * a2)));
      a[2] = a2;
    } else {
      i1 = 2;
      fac = Math.sqrt((summ2 - 2 * (a[1] * a[1])) / (1 - 2 * (a1 * a1)));
    }
    a[1] = a1;
    for (let i = i1; i <= nn2; i++) a[i] /= -fac;
  }
  const range = x[n - 1] - x[0];
  if (range < 1e-19) return { n, W: NaN, p: NaN, error: 'All values are identical' };
  let xx = x[0] / range, sx = xx, sa = -a[1];
  for (let i = 1, j = n - 1; i < n; j--) {
    const xi = x[i] / range;
    sx += xi;
    i++;
    if (i !== j) sa += Math.sign(i - j) * a[Math.min(i, j)];
    xx = xi;
  }
  sa /= n; sx /= n;
  let ssa = 0, ssx = 0, sax = 0;
  for (let i = 0, j = n - 1; i < n; i++, j--) {
    const asa = i !== j ? Math.sign(i - j) * a[1 + Math.min(i, j)] - sa : -sa;
    const xsx = x[i] / range - sx;
    ssa += asa * asa; ssx += xsx * xsx; sax += asa * xsx;
  }
  const ssassx = Math.sqrt(ssa * ssx);
  const w1 = ((ssassx - sax) * (ssassx + sax)) / (ssa * ssx);
  const W = 1 - w1;
  let p;
  if (n === 3) {
    p = Math.max(0, 1.90985931710274 * (Math.asin(Math.sqrt(W)) - 1.04719755119660));
  } else {
    let y = Math.log(w1);
    const lxx = Math.log(an);
    let m, sdev;
    if (n <= 11) {
      const gamma = polyAS(SW.g, an);
      if (y >= gamma) return { n, W, p: 1e-99 };
      y = -Math.log(gamma - y);
      m = polyAS(SW.c3, an);
      sdev = Math.exp(polyAS(SW.c4, an));
    } else {
      m = polyAS(SW.c5, lxx);
      sdev = Math.exp(polyAS(SW.c6, lxx));
    }
    p = normal.sf((y - m) / sdev);
  }
  return { n, W, p };
}

/* ----------------------------------------------------------- frequencies --- */

/** Wilson score interval for a proportion (Wilson 1927; Newcombe 1998 method 3). */
export function wilson(x, n, conf = 0.95) {
  if (n === 0) return [NaN, NaN];
  const z = normal.isf((1 - conf) / 2), p = x / n, z2 = z * z;
  const centre = (p + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

/** Counts, percentages and Wilson 95% CIs for a categorical column (blank values excluded). */
export function frequencies(labels, { order } = {}) {
  const counts = new Map();
  for (const l of labels) counts.set(l, (counts.get(l) || 0) + 1);
  const keys = order ? order.filter((k) => counts.has(k)) : [...counts.keys()];
  const n = labels.length;
  let cum = 0;
  return keys.map((k) => {
    const c = counts.get(k);
    cum += c;
    return { value: k, count: c, pct: (100 * c) / n, cumPct: (100 * cum) / n, ci: wilson(c, n).map((v) => 100 * v) };
  });
}
