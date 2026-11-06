/* Regression models: design matrices with dummy coding, ordinary least squares, and logistic
 * regression by iteratively reweighted least squares, with the checks a paper needs
 * (R-squared, F and likelihood-ratio tests, VIF, Hosmer-Lemeshow, ROC area, events per variable).
 * Checked against statsmodels and scikit-learn in tests/engine/regression.test.mjs.
 */
import { studentT, fDist, chiSquare, normal } from './dist.js';
import { lstsq, invFromR, crossprod, solveSPD, invSPD } from './linalg.js';
import { rank } from './describe.js';

/* --------------------------------------------------------- design matrix -- */

/**
 * predictors: [{ name, type: 'numeric' | 'categorical', values: (number|string|null)[], ref?: level, levels?: string[] }]
 * interaction: optional [i, j] indices into predictors.
 * Rows with any missing value (outcome or predictor) are dropped.
 */
export function buildDesign({ y, predictors, interaction = null }) {
  const n0 = y.length;
  const keep = [];
  for (let i = 0; i < n0; i++) {
    if (y[i] === null || y[i] === undefined || Number.isNaN(y[i])) continue;
    if (predictors.some((p) => p.values[i] === null || p.values[i] === undefined || p.values[i] === '' || (p.type === 'numeric' && !Number.isFinite(p.values[i])))) continue;
    keep.push(i);
  }
  const cols = [{ name: '(Intercept)', get: () => 1 }];
  const terms = [];
  const blocks = predictors.map((p) => {
    if (p.type === 'numeric') return [{ name: p.name, get: (i) => p.values[i] }];
    const present = [...new Set(keep.map((i) => String(p.values[i])))];
    const order = (p.levels || present).filter((l) => present.includes(l));
    const ref = p.ref && order.includes(p.ref) ? p.ref : order[0];
    return order.filter((l) => l !== ref).map((l) => ({ name: `${p.name} (${l} vs ${ref})`, level: l, dummy: true, get: (i) => (String(p.values[i]) === l ? 1 : 0) }));
  });
  blocks.forEach((b, t) => {
    terms.push({ name: predictors[t].name, cols: b.map((_, k) => cols.length + k), type: predictors[t].type });
    cols.push(...b);
  });
  if (interaction) {
    const [a, b] = interaction;
    const prod = [];
    for (const ca of blocks[a]) for (const cb of blocks[b]) prod.push({ name: `${ca.name} × ${cb.name}`, get: (i) => ca.get(i) * cb.get(i) });
    terms.push({ name: `${predictors[a].name} × ${predictors[b].name}`, cols: prod.map((_, k) => cols.length + k), type: 'interaction' });
    cols.push(...prod);
  }
  const X = keep.map((i) => cols.map((c) => c.get(i)));
  return { X, y: keep.map((i) => y[i]), names: cols.map((c) => c.name), dummy: cols.map((c) => !!c.dummy), terms, rows: keep, dropped: n0 - keep.length };
}

const dropCols = (X, idx) => X.map((r) => r.filter((_, j) => !idx.includes(j)));

/* ------------------------------------------------------------ linear model */

export function ols(X, y, { conf = 0.95 } = {}) {
  const n = X.length, p = X[0].length;
  const fit = lstsq(X, y);
  if (!fit || !fit.beta) return { error: 'Some predictors are exact combinations of others (perfect collinearity), or a category has no data. Remove or merge them.' };
  const { beta, R } = fit;
  const XtXi = invFromR(R);
  const fitted = X.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0));
  const resid = y.map((v, i) => v - fitted[i]);
  const sse = resid.reduce((s, e) => s + e * e, 0);
  const df = n - p;
  if (df <= 0) return { error: 'More coefficients than observations: add data or remove predictors.' };
  const s2 = sse / df;
  const ybar = y.reduce((a, b) => a + b, 0) / n;
  const sst = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  const se = beta.map((_, j) => Math.sqrt(s2 * XtXi[j][j]));
  const tc = studentT.isf((1 - conf) / 2, df);
  const coef = beta.map((b, j) => {
    const t = b / se[j];
    return { b, se: se[j], t, p: studentT.twoSided(t, df), ci: [b - tc * se[j], b + tc * se[j]] };
  });
  const r2 = 1 - sse / sst;
  const df1 = p - 1;
  const F = df1 > 0 ? ((sst - sse) / df1) / s2 : NaN;
  const lev = X.map((r) => {
    let h = 0;
    for (let a = 0; a < p; a++) { let s = 0; for (let b = 0; b < p; b++) s += XtXi[a][b] * r[b]; h += r[a] * s; }
    return h;
  });
  const cooks = resid.map((e, i) => (e * e * lev[i]) / (p * s2 * (1 - lev[i]) ** 2));
  return {
    n, p, df, beta, coef, cov: XtXi.map((r) => r.map((v) => v * s2)), fitted, resid, sse, sst, s: Math.sqrt(s2),
    r2, adjR2: 1 - (1 - r2) * ((n - 1) / df), F, df1, pF: df1 > 0 ? fDist.sf(F, df1, df) : NaN, leverage: lev, cooks,
  };
}

/** F test for dropping a term (its columns) from a fitted linear model. */
export function dropTermF(X, y, cols, full) {
  const red = lstsq(dropCols(X, cols), y);
  if (!red || !red.beta) return null;
  const Xr = dropCols(X, cols);
  const sseR = Xr.reduce((s, r, i) => { const f = r.reduce((a, v, j) => a + v * red.beta[j], 0); return s + (y[i] - f) ** 2; }, 0);
  const q = cols.length;
  const F = ((sseR - full.sse) / q) / (full.sse / full.df);
  return { F, df1: q, df2: full.df, p: fDist.sf(F, q, full.df) };
}

/** Variance inflation factor of each non-intercept column. */
export function vif(X) {
  const p = X[0].length;
  const out = [];
  for (let j = 1; j < p; j++) {
    const yj = X.map((r) => r[j]);
    const Xo = X.map((r) => r.filter((_, k) => k !== j));
    const f = ols(Xo, yj);
    out.push(f.error ? Infinity : 1 / (1 - f.r2));
  }
  return out;
}

/* ---------------------------------------------------------- logistic model */

const expit = (x) => (x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)));

function logLik(y, mu) {
  let ll = 0;
  for (let i = 0; i < y.length; i++) ll += y[i] ? Math.log(Math.max(mu[i], 1e-300)) : Math.log(Math.max(1 - mu[i], 1e-300));
  return ll;
}

/** Logistic regression by IRLS with step-halving. y must be 0/1. */
export function logistic(X, y, { conf = 0.95, maxit = 60 } = {}) {
  const n = X.length, p = X[0].length;
  let beta = new Array(p).fill(0);
  const ybar = y.reduce((a, b) => a + b, 0) / n;
  if (ybar === 0 || ybar === 1) return { error: 'Every participant has the same outcome, so there is nothing to model.' };
  beta[0] = Math.log(ybar / (1 - ybar));
  let eta = X.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0));
  let mu = eta.map(expit);
  let ll = logLik(y, mu);
  let converged = false, it = 0;
  for (; it < maxit; it++) {
    const w = mu.map((m) => Math.max(m * (1 - m), 1e-12));
    const XtWX = crossprod(X, w);
    const grad = new Array(p).fill(0);
    for (let i = 0; i < n; i++) { const r = y[i] - mu[i]; for (let j = 0; j < p; j++) grad[j] += X[i][j] * r; }
    const step = solveSPD(XtWX, grad);
    if (!step) return { error: 'The model cannot be fitted: predictors are collinear or a category has no events.' };
    let t = 1, nb, nll, neta, nmu;
    for (let h = 0; h < 30; h++) {
      nb = beta.map((b, j) => b + t * step[j]);
      neta = X.map((r) => r.reduce((s, v, j) => s + v * nb[j], 0));
      nmu = neta.map(expit);
      nll = logLik(y, nmu);
      if (nll >= ll - 1e-12) break;
      t /= 2;
    }
    const change = Math.abs(nll - ll);
    beta = nb; eta = neta; mu = nmu;
    const prev = ll;
    ll = nll;
    if (change < 1e-10 * (Math.abs(prev) + 1e-10)) { converged = true; break; }
  }
  const w = mu.map((m) => Math.max(m * (1 - m), 1e-300));
  const cov = invSPD(crossprod(X, w));
  if (!cov) return { error: 'The model cannot be fitted: the information matrix is singular (collinearity or separation).' };
  const z = normal.isf((1 - conf) / 2);
  const coef = beta.map((b, j) => {
    const se = Math.sqrt(cov[j][j]);
    const zz = b / se;
    return { b, se, z: zz, p: 2 * normal.sf(Math.abs(zz)), or: Math.exp(b), ci: [Math.exp(b - z * se), Math.exp(b + z * se)] };
  });
  const ll0 = n * (ybar * Math.log(ybar) + (1 - ybar) * Math.log(1 - ybar));
  const lr = 2 * (ll - ll0);
  const separation = mu.filter((m) => m < 1e-8 || m > 1 - 1e-8).length > 0 && beta.some((b) => Math.abs(b) > 12);
  const events = y.reduce((a, b) => a + b, 0);
  const cs = 1 - Math.exp((2 * (ll0 - ll)) / n);
  return {
    n, p, beta, coef, cov, fitted: mu, ll, ll0, lr, dfLR: p - 1, pLR: chiSquare.sf(lr, p - 1), converged, iterations: it + 1,
    mcfadden: 1 - ll / ll0, coxSnell: cs, nagelkerke: cs / (1 - Math.exp((2 * ll0) / n)),
    events, nonEvents: n - events, epv: Math.min(events, n - events) / Math.max(1, p - 1), separation,
  };
}

/** Likelihood-ratio test for dropping a term from a fitted logistic model. */
export function dropTermLR(X, y, cols, full) {
  const red = logistic(dropCols(X, cols), y);
  if (red.error) return null;
  const chi = 2 * (full.ll - red.ll);
  return { chi2: chi, df: cols.length, p: chiSquare.sf(chi, cols.length) };
}

/** Hosmer-Lemeshow test with g groups cut at quantiles of the fitted risk (as R's hoslem.test). */
export function hosmerLemeshow(y, mu, g = 10) {
  const s = Float64Array.from(mu).sort();
  const q = (p) => { const h = (s.length - 1) * p, lo = Math.floor(h); return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]); };
  const breaks = [...new Set(Array.from({ length: g + 1 }, (_, i) => q(i / g)))];
  const G = breaks.length - 1;
  const obs1 = new Array(G).fill(0), exp1 = new Array(G).fill(0), cnt = new Array(G).fill(0);
  for (let i = 0; i < y.length; i++) {
    let k = 0;
    while (k < G - 1 && mu[i] > breaks[k + 1]) k++;
    obs1[k] += y[i]; exp1[k] += mu[i]; cnt[k]++;
  }
  let chi = 0;
  for (let k = 0; k < G; k++) {
    const o0 = cnt[k] - obs1[k], e0 = cnt[k] - exp1[k];
    if (exp1[k] > 0) chi += (obs1[k] - exp1[k]) ** 2 / exp1[k];
    if (e0 > 0) chi += (o0 - e0) ** 2 / e0;
  }
  const df = G - 2;
  return { chi2: chi, df, p: df > 0 ? chiSquare.sf(chi, df) : NaN, groups: G, table: breaks.slice(1).map((_, k) => ({ n: cnt[k], observed: obs1[k], expected: exp1[k] })) };
}

/** Area under the ROC curve with DeLong's standard error (fast midrank form, Sun and Xu 2014). */
export function rocAuc(y, score, conf = 0.95) {
  const pos = [], neg = [];
  y.forEach((v, i) => (v ? pos : neg).push(score[i]));
  const m = pos.length, n = neg.length;
  if (!m || !n) return { auc: NaN };
  const all = rank([...pos, ...neg]).ranks;
  const rp = rank(pos).ranks, rn = rank(neg).ranks;
  let sumP = 0;
  for (let i = 0; i < m; i++) sumP += all[i];
  const auc = (sumP - (m * (m + 1)) / 2) / (m * n);
  const v10 = pos.map((_, i) => (all[i] - rp[i]) / n);
  const v01 = neg.map((_, j) => 1 - (all[m + j] - rn[j]) / m);
  const variance = (a) => { const mm = a.reduce((s, v) => s + v, 0) / a.length; return a.reduce((s, v) => s + (v - mm) ** 2, 0) / (a.length - 1); };
  const se = Math.sqrt(variance(v10) / m + variance(v01) / n);
  const z = normal.isf((1 - conf) / 2);
  return { auc, se, ci: [Math.max(0, auc - z * se), Math.min(1, auc + z * se)], m, n };
}

/** Classification at a cut-off: sensitivity, specificity, overall per cent correct. */
export function classify(y, mu, cut = 0.5) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  y.forEach((v, i) => { const pr = mu[i] >= cut; if (v && pr) tp++; else if (v) fn++; else if (pr) fp++; else tn++; });
  return { tp, tn, fp, fn, sens: tp / (tp + fn), spec: tn / (tn + fp), correct: (tp + tn) / y.length };
}
