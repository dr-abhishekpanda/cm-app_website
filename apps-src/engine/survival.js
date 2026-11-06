/* Survival analysis: Kaplan-Meier estimates with Greenwood variance and log-log confidence
 * limits, median survival with its interval, the log-rank test for k groups, and the Cox
 * proportional-hazards model with Efron's handling of tied times.
 * Checked against lifelines in tests/engine/survival.test.mjs.
 */
import { normal, chiSquare } from './dist.js';
import { invSPD, solveSPD } from './linalg.js';

/** Kaplan-Meier: time[] and event[] (1 = event, 0 = censored). */
export function kaplanMeier(time, event, { conf = 0.95 } = {}) {
  const z = normal.isf((1 - conf) / 2);
  const idx = time.map((_, i) => i).sort((a, b) => time[a] - time[b]);
  const n = time.length;
  let atRisk = n, S = 1, gw = 0;
  const steps = [{ t: 0, nRisk: n, events: 0, censored: 0, S: 1, lo: 1, hi: 1, se: 0 }];
  for (let k = 0; k < n;) {
    const t = time[idx[k]];
    let d = 0, c = 0;
    while (k < n && time[idx[k]] === t) { if (event[idx[k]]) d++; else c++; k++; }
    if (d > 0) {
      S *= 1 - d / atRisk;
      if (atRisk > d) gw += d / (atRisk * (atRisk - d));
      else gw = Infinity;
      let lo = 0, hi = 1;
      if (S > 0 && S < 1 && Number.isFinite(gw)) {
        const cl = Math.log(-Math.log(S));
        const s = Math.sqrt(gw) / Math.abs(Math.log(S));
        lo = Math.exp(-Math.exp(cl + z * s));
        hi = Math.exp(-Math.exp(cl - z * s));
      } else if (S === 1) { lo = 1; hi = 1; } else if (S === 0) { lo = 0; hi = 0; }
      steps.push({ t, nRisk: atRisk, events: d, censored: c, S, se: S * Math.sqrt(gw), lo, hi });
    } else if (steps.length) {
      steps[steps.length - 1].censoredAfter = (steps[steps.length - 1].censoredAfter || 0) + c;
    }
    atRisk -= d + c;
  }
  const firstAtOrBelow = (key) => { const s = steps.find((x) => x[key] <= 0.5); return s ? s.t : Infinity; };
  return {
    n, events: event.reduce((a, b) => a + (b ? 1 : 0), 0), steps,
    median: firstAtOrBelow('S'), medianCI: [firstAtOrBelow('lo'), firstAtOrBelow('hi')],
    at(t) { let s = steps[0]; for (const x of steps) { if (x.t <= t) s = x; else break; } return s; },
  };
}

/** Log-rank (Mantel-Cox) test for k groups; group[] holds labels. */
export function logRank(time, event, group) {
  const labels = [...new Set(group)];
  const k = labels.length;
  const gi = group.map((g) => labels.indexOf(g));
  const times = [...new Set(time.filter((_, i) => event[i]))].sort((a, b) => a - b);
  const O = new Array(k).fill(0), E = new Array(k).fill(0);
  const V = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const t of times) {
    const nAt = new Array(k).fill(0), dAt = new Array(k).fill(0);
    for (let i = 0; i < time.length; i++) {
      if (time[i] >= t) nAt[gi[i]]++;
      if (time[i] === t && event[i]) dAt[gi[i]]++;
    }
    const N = nAt.reduce((a, b) => a + b, 0), D = dAt.reduce((a, b) => a + b, 0);
    for (let g = 0; g < k; g++) { O[g] += dAt[g]; E[g] += (nAt[g] * D) / N; }
    if (N > 1) {
      const f = (D * (N - D)) / (N * N * (N - 1));
      for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) V[a][b] += f * nAt[a] * ((a === b ? N : 0) - nAt[b]);
    }
  }
  // Chi-square on the first k - 1 groups.
  const m = k - 1;
  const diff = O.slice(0, m).map((o, g) => o - E[g]);
  const Vm = V.slice(0, m).map((r) => r.slice(0, m));
  const sol = solveSPD(Vm, diff);
  const chi2 = sol ? diff.reduce((s, d, i) => s + d * sol[i], 0) : NaN;
  return { labels, observed: O, expected: E, chi2, df: m, p: chiSquare.sf(chi2, m) };
}

/* -------------------------------------------------------------------- Cox -- */

/**
 * Cox proportional hazards by Newton-Raphson on the Efron partial likelihood.
 * X: n x p covariates (no intercept), time[], event[].
 */
export function cox(X, time, event, { conf = 0.95, maxit = 50 } = {}) {
  const n = X.length, p = X[0].length;
  const order = time.map((_, i) => i).sort((a, b) => time[b] - time[a]); // descending
  // Centre covariates for numerical stability (does not change beta).
  const means = Array.from({ length: p }, (_, j) => X.reduce((s, r) => s + r[j], 0) / n);
  const Xc = X.map((r) => r.map((v, j) => v - means[j]));

  function evaluate(beta) {
    const w = Xc.map((r) => Math.exp(r.reduce((s, v, j) => s + v * beta[j], 0)));
    let ll = 0;
    const grad = new Array(p).fill(0);
    const H = Array.from({ length: p }, () => new Array(p).fill(0));
    let S0 = 0;
    const S1 = new Array(p).fill(0);
    const S2 = Array.from({ length: p }, () => new Array(p).fill(0));
    for (let k = 0; k < n;) {
      const t = time[order[k]];
      const tied = [];
      while (k < n && time[order[k]] === t) { tied.push(order[k]); k++; }
      for (const i of tied) {
        S0 += w[i];
        for (let a = 0; a < p; a++) { S1[a] += w[i] * Xc[i][a]; for (let b = 0; b < p; b++) S2[a][b] += w[i] * Xc[i][a] * Xc[i][b]; }
      }
      const deaths = tied.filter((i) => event[i]);
      const d = deaths.length;
      if (!d) continue;
      let D0 = 0;
      const D1 = new Array(p).fill(0);
      const D2 = Array.from({ length: p }, () => new Array(p).fill(0));
      for (const i of deaths) {
        D0 += w[i];
        for (let a = 0; a < p; a++) { D1[a] += w[i] * Xc[i][a]; for (let b = 0; b < p; b++) D2[a][b] += w[i] * Xc[i][a] * Xc[i][b]; }
        ll += Xc[i].reduce((s, v, j) => s + v * beta[j], 0);
        for (let a = 0; a < p; a++) grad[a] += Xc[i][a];
      }
      for (let l = 0; l < d; l++) {
        const f = l / d;
        const s0 = S0 - f * D0;
        const s1 = S1.map((v, a) => v - f * D1[a]);
        ll -= Math.log(s0);
        for (let a = 0; a < p; a++) {
          grad[a] -= s1[a] / s0;
          for (let b = 0; b < p; b++) H[a][b] += (S2[a][b] - f * D2[a][b]) / s0 - (s1[a] * s1[b]) / (s0 * s0);
        }
      }
    }
    return { ll, grad, info: H };
  }

  let beta = new Array(p).fill(0);
  let cur = evaluate(beta);
  const ll0 = cur.ll;
  let converged = false, it = 0;
  for (; it < maxit; it++) {
    const step = solveSPD(cur.info, cur.grad);
    if (!step) return { error: 'The model cannot be fitted: covariates are collinear or a group has no events.' };
    let t = 1, nb, next;
    for (let h = 0; h < 30; h++) {
      nb = beta.map((b, j) => b + t * step[j]);
      next = evaluate(nb);
      if (next.ll >= cur.ll - 1e-12) break;
      t /= 2;
    }
    const change = Math.abs(next.ll - cur.ll);
    beta = nb; cur = next;
    if (change < 1e-11 * (Math.abs(cur.ll) + 1e-10)) { converged = true; break; }
  }
  const cov = invSPD(cur.info);
  if (!cov) return { error: 'The information matrix is singular: check for a covariate with no variation or with no events in a category.' };
  const z = normal.isf((1 - conf) / 2);
  const coef = beta.map((b, j) => {
    const se = Math.sqrt(cov[j][j]), zz = b / se;
    return { b, se, z: zz, p: 2 * normal.sf(Math.abs(zz)), hr: Math.exp(b), ci: [Math.exp(b - z * se), Math.exp(b + z * se)] };
  });
  const lr = 2 * (cur.ll - ll0);
  // Harrell's concordance: among usable pairs, does the higher risk score fail first?
  const risk = Xc.map((r) => r.reduce((s, v, j) => s + v * beta[j], 0));
  let conc = 0, usable = 0;
  for (let i = 0; i < n; i++) {
    if (!event[i]) continue;
    for (let j = 0; j < n; j++) {
      if (time[j] > time[i] || (time[j] === time[i] && !event[j])) {
        usable++;
        if (risk[i] > risk[j]) conc++; else if (risk[i] === risk[j]) conc += 0.5;
      }
    }
  }
  return {
    n, p, events: event.reduce((a, b) => a + (b ? 1 : 0), 0), beta, coef, cov, ll: cur.ll, ll0, lr, dfLR: p, pLR: chiSquare.sf(lr, p),
    concordance: usable ? conc / usable : NaN, converged, iterations: it + 1,
  };
}
