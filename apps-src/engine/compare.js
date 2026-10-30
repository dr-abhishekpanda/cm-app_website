/* Comparing means: t-tests (one-sample, paired, Student, Welch), one-way ANOVA, Welch ANOVA,
 * Levene's test, Tukey-Kramer and Games-Howell comparisons, and one-way repeated-measures ANOVA
 * with sphericity checks. Effect sizes carry exact confidence intervals from the noncentral t.
 * Checked against SciPy and pingouin in tests/engine/compare.test.mjs.
 */
import { studentT, fDist, chiSquare } from './dist.js';
import { noncentralT } from './noncentral.js';
import { studentizedRange } from './range.js';
import { lnGamma } from './special.js';
import { mean, variance } from './describe.js';

const tcrit = (conf, df) => studentT.isf((1 - conf) / 2, df);

/** Exact CI for a standardised mean difference d = t * k, by inverting the noncentral t. */
export function dInterval(t, df, k, conf = 0.95) {
  const a = (1 - conf) / 2;
  return [noncentralT.ncpFor(t, df, 1 - a) * k, noncentralT.ncpFor(t, df, a) * k];
}

/** Hedges' small-sample correction J(df), exact gamma form. */
export const hedgesJ = (df) => Math.exp(lnGamma(df / 2) - 0.5 * Math.log(df / 2) - lnGamma((df - 1) / 2));

export function summary(x) {
  const m = mean(x);
  return { n: x.length, mean: m, sd: Math.sqrt(variance(x, m)) };
}

/* -------------------------------------------------------------- t-tests --- */

/** One-sample t-test from a summary { n, mean, sd } against mu0. */
export function tOneSampleSummary({ n, mean: m, sd }, mu0 = 0, conf = 0.95) {
  const df = n - 1, se = sd / Math.sqrt(n), diff = m - mu0, t = diff / se;
  const h = tcrit(conf, df) * se;
  const d = diff / sd;
  return {
    test: 'one-sample t', n, mean: m, sd, se, mu0, diff, t, df, p: studentT.twoSided(t, df),
    ci: [diff - h, diff + h], ciMean: [m - h, m + h],
    d, ciD: dInterval(t, df, 1 / Math.sqrt(n), conf), conf,
  };
}
export const tOneSample = (x, mu0 = 0, conf = 0.95) => tOneSampleSummary(summary(x), mu0, conf);

/** Paired t-test: x and y are matched arrays; pairs with a missing value should be removed first. */
export function tPaired(x, y, conf = 0.95) {
  const diffs = x.map((v, i) => v - y[i]);
  const r = tOneSampleSummary(summary(diffs), 0, conf);
  return { ...r, test: 'paired t', meanX: mean(x), meanY: mean(y), dz: r.d, ciDz: r.ciD };
}

/** Independent-samples t-test from summaries; equalVar true gives Student's test, false Welch's. */
export function tTwoSampleSummary(g1, g2, { equalVar = false, conf = 0.95 } = {}) {
  const { n: n1, mean: m1, sd: s1 } = g1, { n: n2, mean: m2, sd: s2 } = g2;
  const v1 = s1 * s1, v2 = s2 * s2, diff = m1 - m2;
  const dfP = n1 + n2 - 2;
  const sp = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / dfP);
  let se, df;
  if (equalVar) { se = sp * Math.sqrt(1 / n1 + 1 / n2); df = dfP; }
  else {
    const a = v1 / n1, b = v2 / n2;
    se = Math.sqrt(a + b);
    df = ((a + b) * (a + b)) / ((a * a) / (n1 - 1) + (b * b) / (n2 - 1));
  }
  const t = diff / se, h = tcrit(conf, df) * se;
  // Cohen's d uses the pooled SD whichever test is run; its CI comes from Student's t.
  const tPooled = diff / (sp * Math.sqrt(1 / n1 + 1 / n2));
  const d = diff / sp;
  const ciD = dInterval(tPooled, dfP, Math.sqrt(1 / n1 + 1 / n2), conf);
  const J = hedgesJ(dfP);
  return {
    test: equalVar ? "Student's t" : "Welch's t", n1, n2, mean1: m1, mean2: m2, sd1: s1, sd2: s2,
    diff, se, t, df, p: studentT.twoSided(t, df), ci: [diff - h, diff + h], sp,
    d, ciD, g: d * J, ciG: ciD.map((v) => v * J), conf,
  };
}
export const tTwoSample = (x, y, opts) => tTwoSampleSummary(summary(x), summary(y), opts);

/* ----------------------------------------------------------- ANOVA family -- */

/** One-way ANOVA from group summaries [{ n, mean, sd }]. */
export function anovaSummary(groups) {
  const k = groups.length;
  const N = groups.reduce((s, g) => s + g.n, 0);
  const grand = groups.reduce((s, g) => s + g.n * g.mean, 0) / N;
  const ssb = groups.reduce((s, g) => s + g.n * (g.mean - grand) ** 2, 0);
  const ssw = groups.reduce((s, g) => s + (g.n - 1) * g.sd * g.sd, 0);
  const df1 = k - 1, df2 = N - k;
  const msb = ssb / df1, msw = ssw / df2;
  const F = msb / msw;
  const sst = ssb + ssw;
  return {
    test: 'one-way ANOVA', k, N, ssb, ssw, sst, df1, df2, msb, msw, F, p: fDist.sf(F, df1, df2),
    eta2: ssb / sst, omega2: Math.max(0, (ssb - df1 * msw) / (sst + msw)),
  };
}
export const anova = (arrays) => anovaSummary(arrays.map(summary));

/** Welch's ANOVA (unequal variances), Welch (1951). */
export function welchAnovaSummary(groups) {
  const k = groups.length;
  const w = groups.map((g) => g.n / (g.sd * g.sd));
  const W = w.reduce((a, b) => a + b, 0);
  const mw = groups.reduce((s, g, i) => s + w[i] * g.mean, 0) / W;
  const A = groups.reduce((s, g, i) => s + w[i] * (g.mean - mw) ** 2, 0) / (k - 1);
  const tmp = groups.reduce((s, g, i) => s + (1 - w[i] / W) ** 2 / (g.n - 1), 0);
  const B = 1 + ((2 * (k - 2)) / (k * k - 1)) * tmp;
  const F = A / B, df1 = k - 1, df2 = (k * k - 1) / (3 * tmp);
  return { test: "Welch's ANOVA", F, df1, df2, p: fDist.sf(F, df1, df2) };
}
export const welchAnova = (arrays) => welchAnovaSummary(arrays.map(summary));

/** Levene's test: center 'mean' (Levene 1960, as in SPSS) or 'median' (Brown-Forsythe 1974). */
export function levene(arrays, center = 'mean') {
  const z = arrays.map((x) => {
    let c;
    if (center === 'median') { const s = Float64Array.from(x).sort(); const n = s.length; c = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
    else c = mean(x);
    return x.map((v) => Math.abs(v - c));
  });
  const a = anova(z);
  return { test: center === 'median' ? 'Brown-Forsythe' : "Levene's", center, F: a.F, df1: a.df1, df2: a.df2, p: a.p };
}

/** Tukey-Kramer comparisons of every pair of groups (summaries), with simultaneous CIs. */
export function tukeyHSD(groups, conf = 0.95, labels) {
  const a = anovaSummary(groups);
  const k = groups.length, df = a.df2;
  const qc = studentizedRange.ppf(conf, k, df);
  const out = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const diff = groups[i].mean - groups[j].mean;
    const se = Math.sqrt((a.msw / 2) * (1 / groups[i].n + 1 / groups[j].n));
    const q = Math.abs(diff) / se;
    out.push({ i, j, a: labels?.[i] ?? i, b: labels?.[j] ?? j, diff, se, q, p: studentizedRange.sf(q, k, df), ci: [diff - qc * se, diff + qc * se] });
  }
  return { method: 'Tukey-Kramer', df, qcrit: qc, conf, pairs: out };
}

/** Games-Howell comparisons (unequal variances), Games and Howell (1976). */
export function gamesHowell(groups, conf = 0.95, labels) {
  const k = groups.length;
  const out = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const gi = groups[i], gj = groups[j];
    const vi = (gi.sd * gi.sd) / gi.n, vj = (gj.sd * gj.sd) / gj.n;
    const diff = gi.mean - gj.mean;
    const df = ((vi + vj) ** 2) / ((vi * vi) / (gi.n - 1) + (vj * vj) / (gj.n - 1));
    const se = Math.sqrt((vi + vj) / 2);
    const q = Math.abs(diff) / se;
    const qc = studentizedRange.ppf(conf, k, df);
    out.push({ i, j, a: labels?.[i] ?? i, b: labels?.[j] ?? j, diff, se, q, df, p: studentizedRange.sf(q, k, df), ci: [diff - qc * se, diff + qc * se] });
  }
  return { method: 'Games-Howell', conf, pairs: out };
}

/* ----------------------------------------------------- repeated measures --- */

function det(M) {
  const n = M.length, A = M.map((r) => r.slice());
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (A[p][c] === 0) return 0;
    if (p !== c) { [A[p], A[c]] = [A[c], A[p]]; d = -d; }
    d *= A[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
    }
  }
  return d;
}

// Orthonormal Helmert contrasts: (k-1) x k.
function helmert(k) {
  const C = [];
  for (let i = 1; i < k; i++) {
    const row = new Array(k).fill(0);
    const norm = Math.sqrt(i * (i + 1));
    for (let j = 0; j < i; j++) row[j] = 1 / norm;
    row[i] = -i / norm;
    C.push(row);
  }
  return C;
}

/**
 * One-way repeated-measures ANOVA. data: n subjects x k conditions, complete rows only.
 * Returns F with uncorrected, Greenhouse-Geisser and Huynh-Feldt p-values, and Mauchly's test.
 */
export function rmAnova(data) {
  const n = data.length, k = data[0].length;
  const grand = data.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0) / (n * k);
  const colMeans = Array.from({ length: k }, (_, j) => data.reduce((s, r) => s + r[j], 0) / n);
  const rowMeans = data.map((r) => r.reduce((a, b) => a + b, 0) / k);
  let sst = 0;
  for (const r of data) for (const v of r) sst += (v - grand) ** 2;
  const ssc = n * colMeans.reduce((s, m) => s + (m - grand) ** 2, 0);
  const sss = k * rowMeans.reduce((s, m) => s + (m - grand) ** 2, 0);
  const sse = sst - ssc - sss;
  const df1 = k - 1, df2 = (k - 1) * (n - 1);
  const F = ssc / df1 / (sse / df2);
  // Covariance of conditions, projected on orthonormal contrasts.
  const S = Array.from({ length: k }, (_, a) => Array.from({ length: k }, (_, b) =>
    data.reduce((s, r) => s + (r[a] - colMeans[a]) * (r[b] - colMeans[b]), 0) / (n - 1)));
  const C = helmert(k);
  const Sc = C.map((ca) => C.map((cb) => {
    let s = 0;
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) s += ca[a] * S[a][b] * cb[b];
    return s;
  }));
  const p = k - 1;
  let tr = 0, tr2 = 0;
  for (let i = 0; i < p; i++) { tr += Sc[i][i]; for (let j = 0; j < p; j++) tr2 += Sc[i][j] * Sc[j][i]; }
  const gg = (tr * tr) / (p * tr2);
  const hf = Math.min(1, (n * p * gg - 2) / (p * (n - 1 - p * gg)));
  let mauchly = null;
  if (k > 2 && n > k - 1) {
    // Mauchly's W with the second-order correction (Anderson 2003), as in R's mauchly.test.
    const W = det(Sc) / Math.pow(tr / p, p);
    const dfr = n - 1;
    const f = 1 - (2 * p * p + p + 2) / (6 * p * dfr);
    const w2 = ((p + 2) * (p - 1) * (p - 2) * (2 * p ** 3 + 6 * p * p + 3 * k + 2)) / (288 * (dfr * p * f) ** 2);
    const chi = -dfr * f * Math.log(W);
    const dfm = (p * (p + 1)) / 2 - 1;
    const p1 = chiSquare.sf(chi, dfm), p2 = chiSquare.sf(chi, dfm + 4);
    mauchly = { W, chi2: chi, df: dfm, p: p1 + w2 * (p2 - p1) };
  }
  return {
    test: 'repeated-measures ANOVA', n, k, ssc, sss, sse, sst, df1, df2, F,
    p: fDist.sf(F, df1, df2),
    pGG: fDist.sf(F, df1 * gg, df2 * gg), pHF: fDist.sf(F, df1 * hf, df2 * hf),
    epsGG: gg, epsHF: hf, mauchly, partialEta2: ssc / (ssc + sse), colMeans,
  };
}
