/* Rank tests: Mann-Whitney U (Wilcoxon rank-sum), Wilcoxon signed-rank, Kruskal-Wallis with
 * Dunn's comparisons, Friedman, and Hodges-Lehmann estimates with confidence intervals.
 * Exact p-values are used for small samples without ties, as in R's wilcox.test; otherwise the
 * normal approximation with tie and continuity corrections.
 * Checked against SciPy and scikit-posthocs in tests/engine/nonparam.test.mjs.
 */
import { normal, chiSquare } from './dist.js';
import { rank, tieSum, sortNum } from './describe.js';
import { adjust } from './multiplicity.js';

const medianSorted = (s) => { const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

/* ----------------------------------------------------- exact null laws --- */

/** Counts of the rank sum of m items drawn from 1..N (as Float64, normalised to probabilities). */
function rankSumDistribution(m, N) {
  const maxS = (m * (2 * N - m + 1)) / 2;
  const dp = Array.from({ length: m + 1 }, () => new Float64Array(maxS + 1));
  dp[0][0] = 1;
  for (let r = 1; r <= N; r++) {
    for (let j = Math.min(r, m); j >= 1; j--) {
      const prev = dp[j - 1], cur = dp[j];
      for (let s = maxS; s >= r; s--) if (prev[s - r]) cur[s] += prev[s - r];
    }
  }
  const base = (m * (m + 1)) / 2;
  const counts = dp[m].slice(base);
  const total = counts.reduce((a, b) => a + b, 0);
  return counts.map((c) => c / total); // index = U
}

/** Probabilities of the signed-rank sum V = 0..n(n+1)/2 under the null. */
function signedRankDistribution(n) {
  const maxS = (n * (n + 1)) / 2;
  const dp = new Float64Array(maxS + 1);
  dp[0] = 1;
  for (let r = 1; r <= n; r++) for (let s = maxS; s >= r; s--) dp[s] += dp[s - r];
  const total = Math.pow(2, n);
  return dp.map((c) => c / total);
}

const cumLE = (pmf, k) => { let s = 0; for (let i = 0; i <= Math.min(k, pmf.length - 1); i++) s += pmf[i]; return s; };
const cumGE = (pmf, k) => { let s = 0; for (let i = Math.max(0, k); i < pmf.length; i++) s += pmf[i]; return s; };

// Smallest q with P(X <= q) >= a, with R's fuzz (qwilcox, qsignrank).
function quantileDisc(pmf, a) {
  let s = 0;
  const target = a - 10 * Number.EPSILON;
  for (let i = 0; i < pmf.length; i++) { s += pmf[i]; if (s >= target) return i; }
  return pmf.length - 1;
}

/* -------------------------------------------------------- Mann-Whitney --- */

/**
 * Mann-Whitney U / Wilcoxon rank-sum test. U is reported for the first group:
 * the number of pairs in which the first group's value is larger (ties count half).
 */
export function mannWhitney(x, y, { conf = 0.95, method = 'auto', correct = true } = {}) {
  const n1 = x.length, n2 = y.length, N = n1 + n2;
  const { ranks, ties } = rank([...x, ...y]);
  let R1 = 0;
  for (let i = 0; i < n1; i++) R1 += ranks[i];
  const U1 = R1 - (n1 * (n1 + 1)) / 2, U2 = n1 * n2 - U1;
  const hasTies = ties.length > 0;
  const exact = method === 'exact' || (method === 'auto' && !hasTies && n1 < 50 && n2 < 50);
  const mu = (n1 * n2) / 2;
  const sigma = Math.sqrt(((n1 * n2) / 12) * (N + 1 - tieSum(ties) / (N * (N - 1))));
  const zRaw = (U1 - mu) / sigma;
  let p, z = zRaw, pmf = null;
  if (exact) {
    pmf = rankSumDistribution(n1, N);
    const half = U1 > mu ? cumGE(pmf, Math.round(U1)) : cumLE(pmf, Math.round(U1));
    p = Math.min(1, 2 * half);
  } else {
    const cc = correct ? Math.sign(U1 - mu) * 0.5 : 0;
    z = (U1 - mu - cc) / sigma;
    p = Math.min(1, 2 * normal.sf(Math.abs(z)));
  }
  // Hodges-Lehmann shift (median of pairwise differences) with its interval.
  let hl = null;
  if (n1 * n2 <= 2e6) {
    const diffs = new Float64Array(n1 * n2);
    let k = 0;
    for (const a of x) for (const b of y) diffs[k++] = a - b;
    diffs.sort();
    const a = 1 - conf;
    let lo, hi, method2;
    if (exact) {
      let qu = quantileDisc(pmf, a / 2);
      if (qu === 0) qu = 1;
      const ql = n1 * n2 - qu;
      lo = diffs[qu - 1]; hi = diffs[ql]; method2 = 'exact';
    } else {
      const zc = normal.isf(a / 2);
      let K = Math.round(mu - zc * sigma);
      K = Math.max(1, K);
      lo = diffs[K - 1]; hi = diffs[n1 * n2 - K]; method2 = 'normal approximation';
    }
    hl = { estimate: medianSorted(diffs), ci: [lo, hi], method: method2 };
  }
  return {
    test: 'Mann-Whitney U', n1, n2, U: U1, U1, U2, Umin: Math.min(U1, U2), R1, R2: (N * (N + 1)) / 2 - R1,
    z, p, method: exact ? 'exact' : `normal approximation${correct ? ', continuity corrected' : ''}${hasTies ? ', tie corrected' : ''}`,
    r: Math.abs(zRaw) / Math.sqrt(N), rankBiserial: (U1 - U2) / (n1 * n2), probSuperiority: U1 / (n1 * n2),
    hl, ties: hasTies, conf,
    medians: [medianSorted(sortNum(x)), medianSorted(sortNum(y))],
  };
}

/* ------------------------------------------------- Wilcoxon signed-rank --- */

/** Wilcoxon signed-rank test on paired x, y (or one sample x against mu). Zero differences are dropped (Wilcoxon's method). */
export function wilcoxonSignedRank(x, y = null, { mu = 0, conf = 0.95, method = 'auto', correct = true } = {}) {
  const d0 = y ? x.map((v, i) => v - y[i] - mu) : x.map((v) => v - mu);
  const zeros = d0.filter((v) => v === 0).length;
  const d = d0.filter((v) => v !== 0);
  const n = d.length;
  if (n === 0) return { test: 'Wilcoxon signed-rank', n: 0, zeros, p: 1, error: 'Every difference is zero' };
  const { ranks, ties } = rank(d.map(Math.abs));
  let V = 0;
  for (let i = 0; i < n; i++) if (d[i] > 0) V += ranks[i];
  const total = (n * (n + 1)) / 2;
  const hasTies = ties.length > 0;
  const exact = method === 'exact' || (method === 'auto' && !hasTies && zeros === 0 && n < 50);
  const muV = total / 2;
  const sigma = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - tieSum(ties) / 48);
  const zRaw = (V - muV) / sigma;
  let p, z = zRaw, pmf = null;
  if (exact) {
    pmf = signedRankDistribution(n);
    const half = V > muV ? cumGE(pmf, Math.round(V)) : cumLE(pmf, Math.round(V));
    p = Math.min(1, 2 * half);
  } else {
    const cc = correct ? Math.sign(V - muV) * 0.5 : 0;
    z = (V - muV - cc) / sigma;
    p = Math.min(1, 2 * normal.sf(Math.abs(z)));
  }
  // Hodges-Lehmann pseudo-median: median of Walsh averages.
  let hl = null;
  const base = d.map((v) => v + mu);
  if (n <= 2000) {
    const w = new Float64Array((n * (n + 1)) / 2);
    let k = 0;
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) w[k++] = (base[i] + base[j]) / 2;
    w.sort();
    const a = 1 - conf;
    let lo, hi, m2;
    if (exact) {
      let qu = quantileDisc(pmf, a / 2);
      if (qu === 0) qu = 1;
      const ql = total - qu;
      lo = w[qu - 1]; hi = w[ql]; m2 = 'exact';
    } else {
      const K = Math.max(1, Math.round(muV - normal.isf(a / 2) * sigma));
      lo = w[K - 1]; hi = w[total - K]; m2 = 'normal approximation';
    }
    hl = { estimate: medianSorted(w), ci: [lo, hi], method: m2 };
  }
  return {
    test: 'Wilcoxon signed-rank', n, zeros, V, Vminus: total - V, Vmin: Math.min(V, total - V), z, p,
    method: exact ? 'exact' : `normal approximation${correct ? ', continuity corrected' : ''}${hasTies ? ', tie corrected' : ''}`,
    r: Math.abs(zRaw) / Math.sqrt(n), rankBiserial: (V - (total - V)) / total, hl, ties: hasTies, conf,
  };
}

/* -------------------------------------------------------- Kruskal-Wallis --- */

export function kruskalWallis(groups, { posthoc = 'holm' } = {}) {
  const k = groups.length;
  const all = groups.flat();
  const N = all.length;
  const { ranks, ties } = rank(all);
  const sums = [], means = [];
  let off = 0;
  for (const g of groups) {
    let s = 0;
    for (let i = 0; i < g.length; i++) s += ranks[off + i];
    sums.push(s); means.push(s / g.length); off += g.length;
  }
  const C = 1 - tieSum(ties) / (N * N * N - N);
  const H0 = (12 / (N * (N + 1))) * groups.reduce((s, g, i) => s + (sums[i] * sums[i]) / g.length, 0) - 3 * (N + 1);
  const H = H0 / C;
  const df = k - 1;
  // Dunn (1964) comparisons on mean ranks, tie-corrected variance.
  const s2 = (N * (N + 1)) / 12 - tieSum(ties) / (12 * (N - 1));
  const pairs = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const z = (means[i] - means[j]) / Math.sqrt(s2 * (1 / groups[i].length + 1 / groups[j].length));
    pairs.push({ i, j, z, p: 2 * normal.sf(Math.abs(z)) });
  }
  const adj = adjust(pairs.map((q) => q.p), posthoc);
  pairs.forEach((q, i) => { q.pAdj = adj[i]; });
  return {
    test: 'Kruskal-Wallis', k, N, H, df, p: chiSquare.sf(H, df), meanRanks: means, rankSums: sums,
    epsilon2: H / (N - 1), eta2H: Math.max(0, (H - k + 1) / (N - k)),
    dunn: { adjust: posthoc, pairs },
  };
}

/* --------------------------------------------------------------- Friedman --- */

/** Friedman test; data: n subjects x k conditions (complete rows). */
export function friedman(data, { posthoc = 'holm' } = {}) {
  const n = data.length, k = data[0].length;
  const R = new Float64Array(k);
  let tieTerm = 0;
  for (const row of data) {
    const { ranks, ties } = rank(row);
    for (let j = 0; j < k; j++) R[j] += ranks[j];
    tieTerm += tieSum(ties);
  }
  const SR = R.reduce((s, v) => s + v * v, 0);
  const chi0 = (12 / (n * k * (k + 1))) * SR - 3 * n * (k + 1);
  const chi = chi0 / (1 - tieTerm / (n * k * (k * k - 1)));
  const df = k - 1;
  const pairs = [];
  for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) {
    const w = wilcoxonSignedRank(data.map((r) => r[a]), data.map((r) => r[b]));
    pairs.push({ i: a, j: b, V: w.V, p: w.p, method: w.method });
  }
  const adj = adjust(pairs.map((q) => q.p), posthoc);
  pairs.forEach((q, i) => { q.pAdj = adj[i]; });
  return {
    test: 'Friedman', n, k, chi2: chi, df, p: chiSquare.sf(chi, df), rankSums: Array.from(R),
    meanRanks: Array.from(R, (v) => v / n), kendallW: chi / (n * (k - 1)),
    pairwise: { method: 'Wilcoxon signed-rank', adjust: posthoc, pairs },
  };
}
