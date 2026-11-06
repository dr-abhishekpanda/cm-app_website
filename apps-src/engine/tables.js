/* Contingency tables: Pearson and likelihood-ratio chi-square (with Yates' correction for 2 x 2),
 * expected counts, adjusted residuals, Cramer's V; Fisher's exact test for 2 x 2 (with the
 * conditional maximum-likelihood odds ratio and its exact CI, as in R's fisher.test) and for
 * larger tables (exact enumeration, or Monte Carlo when the table is too large to enumerate);
 * McNemar's test; the linear-by-linear (trend) test; Cochran's Q.
 * Checked against SciPy and statsmodels in tests/engine/tables.test.mjs.
 */
import { chiSquare, normal, binomial } from './dist.js';
import { lnFactorial, brent } from './special.js';

const sumArr = (a) => a.reduce((s, v) => s + v, 0);

export function margins(t) {
  const rows = t.map(sumArr);
  const cols = t[0].map((_, j) => sumArr(t.map((r) => r[j])));
  return { rows, cols, N: sumArr(rows) };
}

/* --------------------------------------------------------------- chi-square - */

export function chiSquareTest(t, { yates = 'auto' } = {}) {
  const { rows, cols, N } = margins(t);
  const R = rows.length, C = cols.length;
  const E = rows.map((r) => cols.map((c) => (r * c) / N));
  const is2x2 = R === 2 && C === 2;
  const useYates = yates === true || (yates === 'auto' && is2x2);
  let X2 = 0, X2c = 0, G2 = 0;
  const adjRes = [];
  for (let i = 0; i < R; i++) {
    adjRes.push([]);
    for (let j = 0; j < C; j++) {
      const o = t[i][j], e = E[i][j];
      const dev = o - e;
      X2 += (dev * dev) / e;
      const yc = Math.min(0.5, Math.abs(dev));
      X2c += (Math.abs(dev) - yc) ** 2 / e;
      if (o > 0) G2 += 2 * o * Math.log(o / e);
      adjRes[i].push(dev / Math.sqrt(e * (1 - rows[i] / N) * (1 - cols[j] / N)));
    }
  }
  const df = (R - 1) * (C - 1);
  const flat = E.flat();
  const low = flat.filter((e) => e < 5).length;
  const out = {
    test: 'chi-square', R, C, N, df, chi2: X2, p: chiSquare.sf(X2, df), G2, pG2: chiSquare.sf(G2, df),
    expected: E, adjResiduals: adjRes, minExpected: Math.min(...flat), cellsBelow5: low, pctBelow5: (100 * low) / flat.length,
    cramerV: Math.sqrt(X2 / (N * (Math.min(R, C) - 1))),
  };
  if (is2x2) {
    const [[a, b], [c, d]] = t;
    out.phi = (a * d - b * c) / Math.sqrt(rows[0] * rows[1] * cols[0] * cols[1]);
  }
  if (useYates) { out.chi2Yates = X2c; out.pYates = chiSquare.sf(X2c, df); }
  // Cochran's rule: no expected count below 1 and no more than 20% below 5.
  out.cochranOk = out.minExpected >= 1 && out.pctBelow5 <= 20;
  return out;
}

/* ------------------------------------------------- Fisher's exact (2 x 2) - */

export function fisher2x2([[a, b], [c, d]], conf = 0.95) {
  const m = a + c, n = b + d, k = a + b, x = a;
  const lo = Math.max(0, k - n), hi = Math.min(k, m);
  const support = [];
  for (let i = lo; i <= hi; i++) support.push(i);
  const logdc = support.map((i) => lnChoose(m, i) + lnChoose(n, k - i) - lnChoose(m + n, k));
  const dnhyper = (ncp) => {
    const d = logdc.map((l, i) => l + Math.log(ncp) * support[i]);
    const mx = Math.max(...d);
    const e = d.map((v) => Math.exp(v - mx));
    const s = sumArr(e);
    return e.map((v) => v / s);
  };
  const mnhyper = (ncp) => (ncp === 0 ? lo : ncp === Infinity ? hi : sumArr(dnhyper(ncp).map((p, i) => p * support[i])));
  const pnhyper = (q, ncp, upper) => {
    const d = dnhyper(ncp);
    let s = 0;
    support.forEach((v, i) => { if (upper ? v >= q : v <= q) s += d[i]; });
    return s;
  };
  // Two-sided p: sum of table probabilities no larger than the observed one.
  const d1 = dnhyper(1);
  const dObs = d1[x - lo] * (1 + 1e-7);
  const p = Math.min(1, sumArr(d1.filter((v) => v <= dObs)));
  const pLess = pnhyper(x, 1, false), pGreater = pnhyper(x, 1, true);
  // Conditional MLE of the odds ratio and exact CI, solved on the log scale.
  const solve = (f) => Math.exp(brent((L) => f(Math.exp(L)), -60, 60, 1e-13));
  let mle;
  if (x === lo) mle = 0;
  else if (x === hi) mle = Infinity;
  else mle = solve((t) => mnhyper(t) - x);
  const alpha = (1 - conf) / 2;
  const L = x === lo ? 0 : solve((t) => pnhyper(x, t, true) - alpha);
  const U = x === hi ? Infinity : solve((t) => pnhyper(x, t, false) - alpha);
  return {
    test: "Fisher's exact", p, pLess, pGreater, orMLE: mle, ci: [L, U], conf,
    orSample: b * c === 0 ? (a * d === 0 ? NaN : Infinity) : (a * d) / (b * c),
  };
}

function lnChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  return lnFactorial(n) - lnFactorial(k) - lnFactorial(n - k);
}

/* ----------------------------------------------- Fisher's exact (R x C) --- */

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Freeman-Halton exact test for an R x C table. Enumerates every table with the observed
 * margins when there are at most `limit` of them; otherwise estimates p by Monte Carlo
 * (fixed seed, so the same table always gives the same answer), as R's simulate.p.value does.
 */
export function fisherRxC(t, { limit = 2e6, sims = 100000, seed = 20240531 } = {}) {
  const { rows, cols, N } = margins(t);
  const R = rows.length, C = cols.length;
  const lf = new Float64Array(N + 1);
  for (let i = 2; i <= N; i++) lf[i] = lf[i - 1] + Math.log(i);
  const constant = rows.reduce((s, r) => s + lf[r], 0) + cols.reduce((s, c) => s + lf[c], 0) - lf[N];
  const lnP = (cells) => constant - cells.reduce((s, v) => s + lf[v], 0);
  const obs = lnP(t.flat());
  const thresh = obs + Math.log1p(1e-7);
  let total = 0, count = 0, aborted = false;
  // Fill row by row, cell by cell, keeping the remaining column totals.
  const colLeft = cols.slice();
  const rec = (i, j, rowLeft, acc) => {
    if (aborted) return;
    if (i === R - 1) {
      // Last row is forced by the column totals.
      let s = acc;
      for (let jj = 0; jj < C; jj++) s += lf[colLeft[jj]];
      const lp = constant - s;
      if (lp <= thresh) total += Math.exp(lp);
      if (++count > limit) aborted = true;
      return;
    }
    if (j === C - 1) {
      const v = rowLeft;
      if (v > colLeft[j]) return;
      colLeft[j] -= v;
      rec(i + 1, 0, rows[i + 1], acc + lf[v]);
      colLeft[j] += v;
      return;
    }
    // Remaining capacity in later columns bounds the smallest value here.
    let later = 0;
    for (let jj = j + 1; jj < C; jj++) later += colLeft[jj];
    const minV = Math.max(0, rowLeft - later), maxV = Math.min(rowLeft, colLeft[j]);
    for (let v = minV; v <= maxV; v++) {
      colLeft[j] -= v;
      rec(i, j + 1, rowLeft - v, acc + lf[v]);
      colLeft[j] += v;
      if (aborted) return;
    }
  };
  rec(0, 0, rows[0], 0);
  if (!aborted) return { test: 'Fisher-Freeman-Halton', method: 'exact', p: Math.min(1, total), tables: count };
  // Monte Carlo: shuffle column labels across the fixed row labels.
  const rand = mulberry32(seed);
  const colLab = [];
  cols.forEach((c, j) => { for (let q = 0; q < c; q++) colLab.push(j); });
  const rowLab = [];
  rows.forEach((r, i) => { for (let q = 0; q < r; q++) rowLab.push(i); });
  let hits = 0;
  const cells = new Int32Array(R * C);
  for (let s = 0; s < sims; s++) {
    for (let q = N - 1; q > 0; q--) { const r = Math.floor(rand() * (q + 1)); const tmp = colLab[q]; colLab[q] = colLab[r]; colLab[r] = tmp; }
    cells.fill(0);
    for (let q = 0; q < N; q++) cells[rowLab[q] * C + colLab[q]]++;
    if (lnP(Array.from(cells)) <= thresh) hits++;
  }
  const p = (hits + 1) / (sims + 1);
  return { test: 'Fisher-Freeman-Halton', method: `Monte Carlo, ${sims.toLocaleString('en-IN')} tables`, p, se: Math.sqrt((p * (1 - p)) / sims), sims, seed };
}

/* ------------------------------------------------------------ McNemar --- */

/** McNemar's test from the discordant counts b and c of a paired 2 x 2 table. */
export function mcnemar(b, c) {
  const n = b + c;
  const exactP = n === 0 ? 1 : Math.min(1, 2 * binomial.cdf(Math.min(b, c), n, 0.5));
  const chi2 = n === 0 ? 0 : (Math.abs(b - c) - 1) ** 2 / n;
  const chi2Raw = n === 0 ? 0 : (b - c) ** 2 / n;
  return {
    test: 'McNemar', b, c, n, pExact: exactP,
    // Edwards' continuity correction, as in R's mcnemar.test and statsmodels.
    chi2, p: n === 0 ? 1 : chiSquare.sf(chi2, 1),
    chi2Uncorrected: chi2Raw, pUncorrected: chiSquare.sf(chi2Raw, 1),
  };
}

/* -------------------------------------------------------- trend and Q --- */

/** Linear-by-linear association (Mantel 1963): M^2 = (N - 1) r^2 with the given scores, 1 df. */
export function linearByLinear(t, rowScores, colScores) {
  const { rows, cols, N } = margins(t);
  const u = rowScores || rows.map((_, i) => i + 1);
  const v = colScores || cols.map((_, j) => j + 1);
  let su = 0, sv = 0;
  rows.forEach((r, i) => { su += r * u[i]; });
  cols.forEach((c, j) => { sv += c * v[j]; });
  const mu = su / N, mv = sv / N;
  let suu = 0, svv = 0, suv = 0;
  rows.forEach((r, i) => { suu += r * (u[i] - mu) ** 2; });
  cols.forEach((c, j) => { svv += c * (v[j] - mv) ** 2; });
  t.forEach((row, i) => row.forEach((o, j) => { suv += o * (u[i] - mu) * (v[j] - mv); }));
  const r = suv / Math.sqrt(suu * svv);
  const M2 = (N - 1) * r * r;
  return { test: 'linear-by-linear association', r, M2, df: 1, p: chiSquare.sf(M2, 1), z: r * Math.sqrt(N - 1), N };
}

/** Cochran's Q for k related binary outcomes; data: n subjects x k columns of 0/1. */
export function cochranQ(data) {
  const k = data[0].length;
  const colT = Array.from({ length: k }, (_, j) => data.reduce((s, r) => s + r[j], 0));
  const rowT = data.map(sumArr);
  const T = sumArr(colT);
  const num = (k - 1) * (k * colT.reduce((s, c) => s + c * c, 0) - T * T);
  const den = k * T - rowT.reduce((s, r) => s + r * r, 0);
  const Q = den === 0 ? 0 : num / den;
  return { test: "Cochran's Q", Q, df: k - 1, p: den === 0 ? 1 : chiSquare.sf(Q, k - 1), colTotals: colT, n: data.length };
}

export const zFromP = (p) => normal.isf(p / 2);
