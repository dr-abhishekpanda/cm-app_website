/* Stratified analysis and standardisation.
 *
 * Mantel-Haenszel (1959) summary measures over K strata of 2 x 2 tables [[a, b], [c, d]] (rows exposed
 * and unexposed; columns outcome present and absent, or cases and controls):
 *   odds ratio with the Robins-Breslow-Greenland (1986) variance;
 *   risk ratio with the Greenland-Robins (1985) variance;
 *   risk difference with the Sato-Greenland-Robins (1989) variance (Greenland-Robins 1985 also given);
 *   the Cochran-Mantel-Haenszel test, as R's mantelhaen.test;
 *   homogeneity: Breslow-Day with Tarone's (1985) correction for the odds ratio, and inverse-variance
 *   (Woolf) tests for the risk ratio and risk difference.
 * Person-time strata (events and person-time in exposed and unexposed): the Mantel-Haenszel rate ratio and
 * rate difference (Greenland and Robins 1985), the Mantel-Haenszel test for person-time, and the
 * inverse-variance test of homogeneity of the rate ratio.
 * Direct standardisation with Fay and Feuer's (1997) gamma interval; indirect standardisation (SMR) with
 * the exact Poisson interval (Ulm 1990) and R's exact Poisson test.
 *
 * Checked against R (mantelhaen.test, poisson.test, epiR, epitools, metafor) and statsmodels in
 * tests/engine/strat.test.mjs.
 */
import { normal, chiSquare, poisson } from './dist.js';
import { twoByTwo, personTime } from './epi.js';

const zOf = (conf) => normal.isf((1 - conf) / 2);
const sum = (xs) => xs.reduce((s, v) => s + v, 0);
const logCI = (est, se, z) => (est > 0 && Number.isFinite(est) && Number.isFinite(se) ? [Math.exp(Math.log(est) - z * se), Math.exp(Math.log(est) + z * se)] : null);

/** Inverse-variance test of homogeneity: Q = sum w (y - ybar)^2 over the strata where y and v are finite. */
function homogeneity(ys, vs) {
  const keep = ys.map((y, i) => Number.isFinite(y) && Number.isFinite(vs[i]) && vs[i] > 0);
  const y = ys.filter((_, i) => keep[i]), v = vs.filter((_, i) => keep[i]);
  const k = y.length;
  if (k < 2) return { q: NaN, df: k - 1, p: NaN, k, excluded: ys.length - k };
  const w = v.map((x) => 1 / x);
  const ybar = sum(w.map((wi, i) => wi * y[i])) / sum(w);
  const q = sum(w.map((wi, i) => wi * (y[i] - ybar) ** 2));
  return { q, df: k - 1, p: chiSquare.sf(q, k - 1), k, excluded: ys.length - k };
}

/* ------------------------------------------------- 2 x 2 x K tables --- */

/** A 2 x 2 table [[a, b], [c, d]] with its margins. */
export const cellsOf = ([[a, b], [c, d]]) => ({ a, b, c, d, n1: a + b, n0: c + d, m1: a + c, m0: b + d, n: a + b + c + d });

/**
 * The Mantel-Haenszel summary of tables (from cellsOf) for 'OR', 'RR' or 'RD': the estimate, y on the
 * analysis scale (log for the ratios), its standard error, and each table's Mantel-Haenszel weight
 * (b c / n, c n1 / n, n1 n0 / n). Tables with no one in them must be dropped first.
 */
export function mhCore(cells, measure = 'OR') {
  if (measure === 'OR') {
    const R = cells.map(({ a, d, n }) => (a * d) / n), S = cells.map(({ b, c, n }) => (b * c) / n);
    const P = cells.map(({ a, d, n }) => (a + d) / n), Q = cells.map(({ b, c, n }) => (b + c) / n);
    const sR = sum(R), sS = sum(S);
    const est = sS === 0 ? (sR === 0 ? NaN : Infinity) : sR / sS;
    const v = sum(P.map((p, i) => p * R[i])) / (2 * sR * sR) + sum(P.map((p, i) => p * S[i] + Q[i] * R[i])) / (2 * sR * sS) + sum(Q.map((q, i) => q * S[i])) / (2 * sS * sS);
    return { est, y: Math.log(est), se: Math.sqrt(v), weights: S };
  }
  if (measure === 'RR') {
    const rn = cells.map(({ a, n0, n }) => (a * n0) / n), rd = cells.map(({ c, n1, n }) => (c * n1) / n);
    const sRn = sum(rn), sRd = sum(rd);
    const est = sRd === 0 ? (sRn === 0 ? NaN : Infinity) : sRn / sRd;
    const v = sum(cells.map(({ a, c, n1, n0, m1, n }) => (m1 * n1 * n0 - a * c * n) / (n * n))) / (sRn * sRd);
    return { est, y: Math.log(est), se: Math.sqrt(v), weights: rd };
  }
  // Risk difference: Mantel-Haenszel weights n1 n0 / n; the Sato-Greenland-Robins variance.
  const w = cells.map(({ n1, n0, n }) => (n1 * n0) / n), W = sum(w);
  const est = sum(cells.map(({ a, c, n1, n0, n }) => (a * n0 - c * n1) / n)) / W;
  const Ps = sum(cells.map(({ a, c, n1, n0, n }) => (n1 * n1 * c - n0 * n0 * a + 0.5 * n1 * n0 * (n0 - n1)) / (n * n)));
  const Qs = sum(cells.map(({ a, c, n1, n0, n }) => (a * (n0 - c) + c * (n1 - a)) / (2 * n)));
  return { est, y: est, se: Math.sqrt((est * Ps + Qs) / (W * W)), weights: w };
}

/**
 * Mantel-Haenszel analysis of strata [{ label, t: [[a, b], [c, d]] }]. design: 'cohort', 'cross' or
 * 'case-control' (case-control gives the odds ratio only). Strata with no one in them are dropped.
 */
export function mhTables(strata, { conf = 0.95, design = 'cohort' } = {}) {
  const z = zOf(conf);
  const S = strata.filter((s) => sum(s.t.flat()) > 0);
  const cells = S.map((s) => cellsOf(s.t));
  const out = { k: S.length, conf, design, dropped: strata.length - S.length };
  // Each stratum on its own, and the crude (collapsed) table.
  const total = [[0, 0], [0, 0]];
  cells.forEach(({ a, b, c, d }) => { total[0][0] += a; total[0][1] += b; total[1][0] += c; total[1][1] += d; });
  out.crude = twoByTwo(total, { conf, design });
  out.strata = S.map((s, i) => {
    const x = cells[i];
    // Uninformative: a zero margin means the stratum says nothing about the association.
    const informative = x.n1 > 0 && x.n0 > 0 && x.m1 > 0 && x.m0 > 0;
    return { label: s.label, t: s.t, n: x.n, informative, res: informative ? twoByTwo(s.t, { conf, design }) : null };
  });
  out.informative = out.strata.filter((s) => s.informative).length;

  // Odds ratio: Mantel-Haenszel with the Robins-Breslow-Greenland variance.
  const mo = mhCore(cells, 'OR');
  const orEst = mo.est;
  out.or = { est: orEst, se: mo.se, ci: logCI(orEst, mo.se, z) };

  // Cochran-Mantel-Haenszel test, as R's mantelhaen.test (strata of fewer than 2 people add nothing).
  const use = cells.filter((x) => x.n > 1);
  const delta = sum(use.map(({ a, n1, m1, n }) => a - (n1 * m1) / n));
  const vCMH = sum(use.map(({ n1, n0, m1, m0, n }) => (n1 * n0 * m1 * m0) / (n * n * (n - 1))));
  const yates = Math.abs(delta) >= 0.5 ? 0.5 : 0;
  out.cmh = {
    chi2: (Math.abs(delta) - yates) ** 2 / vCMH, chi2Uncorrected: delta * delta / vCMH,
    observed: sum(use.map((x) => x.a)), expected: sum(use.map(({ n1, m1, n }) => (n1 * m1) / n)), variance: vCMH,
  };
  out.cmh.p = chiSquare.sf(out.cmh.chi2, 1);
  out.cmh.pUncorrected = chiSquare.sf(out.cmh.chi2Uncorrected, 1);

  // Breslow-Day test of a common odds ratio, with Tarone's correction (strata with a zero margin dropped).
  out.bd = breslowDay(cells.filter((x) => x.n1 > 0 && x.n0 > 0 && x.m1 > 0 && x.m0 > 0), orEst);

  if (design === 'case-control') return out;

  // Risk (or prevalence) ratio: Mantel-Haenszel with the Greenland-Robins variance.
  const mr = mhCore(cells, 'RR');
  out.rr = { est: mr.est, se: mr.se, ci: logCI(mr.est, mr.se, z) };

  // Risk difference: Sato-Greenland-Robins variance, and the Greenland-Robins one alongside.
  const md = mhCore(cells, 'RD'), rdEst = md.est;
  const W = sum(md.weights);
  const vGR = sum(cells.map(({ a, b, c, d, n1, n0, n }) => (n1 > 0 && n0 > 0 ? (a * b * n0 ** 3 + c * d * n1 ** 3) / (n1 * n0 * n * n) : 0))) / (W * W);
  out.rd = {
    est: rdEst, se: md.se, ci: [rdEst - z * md.se, rdEst + z * md.se],
    seGR: Math.sqrt(vGR), ciGR: [rdEst - z * Math.sqrt(vGR), rdEst + z * Math.sqrt(vGR)],
  };

  // Homogeneity of the risk ratio and of the risk difference (inverse-variance, Woolf's form).
  const lrr = cells.map(({ a, c, n1, n0 }) => (n1 > 0 && n0 > 0 && a > 0 && c > 0 ? Math.log((a / n1) / (c / n0)) : NaN));
  const vlrr = cells.map(({ a, c, n1, n0 }) => 1 / a - 1 / n1 + 1 / c - 1 / n0);
  out.homogRR = homogeneity(lrr, vlrr);
  const rds = cells.map(({ a, c, n1, n0 }) => (n1 > 0 && n0 > 0 ? a / n1 - c / n0 : NaN));
  const vrd = cells.map(({ a, c, n1, n0 }) => (a / n1) * (1 - a / n1) / n1 + (c / n0) * (1 - c / n0) / n0);
  out.homogRD = homogeneity(rds, vrd);
  return out;
}

/**
 * Breslow-Day statistic for a common odds ratio psi, and Tarone's correction. For each stratum the
 * expected a solves a (n - n1 - m1 + a) = psi (n1 - a)(m1 - a) within the margins.
 */
function breslowDay(cells, psi) {
  if (cells.length < 2 || !(psi > 0) || !Number.isFinite(psi)) return { chi2: NaN, df: cells.length - 1, p: NaN, chi2Tarone: NaN, pTarone: NaN, k: cells.length };
  let bd = 0, dev = 0, vsum = 0, k = 0;
  for (const { a, n1, m1, n } of cells) {
    const lo = Math.max(0, n1 + m1 - n), hi = Math.min(n1, m1);
    let A;
    if (Math.abs(psi - 1) < 1e-12) A = (n1 * m1) / n;
    else {
      const qa = 1 - psi, qb = n - n1 - m1 + psi * (n1 + m1), qc = -psi * n1 * m1;
      const disc = Math.sqrt(Math.max(0, qb * qb - 4 * qa * qc));
      const r1 = (-qb + disc) / (2 * qa), r2 = (-qb - disc) / (2 * qa);
      A = r1 >= lo - 1e-9 && r1 <= hi + 1e-9 ? r1 : r2;
    }
    const B = n1 - A, C = m1 - A, D = n - n1 - m1 + A;
    const v = 1 / (1 / A + 1 / B + 1 / C + 1 / D);
    if (!(v > 0) || !Number.isFinite(v)) continue;
    bd += (a - A) ** 2 / v; dev += a - A; vsum += v; k++;
  }
  const df = k - 1;
  const tarone = bd - (dev * dev) / vsum;
  return { chi2: bd, df, p: chiSquare.sf(bd, df), chi2Tarone: tarone, pTarone: chiSquare.sf(tarone, df), k };
}

/* -------------------------------------------------- person-time strata --- */

/** Strata [{ label, a, t1, c, t0 }]: events and person-time among the exposed (a, t1) and unexposed (c, t0). */
export function mhPersonTime(strata, { conf = 0.95, correct = true } = {}) {
  const z = zOf(conf);
  const S = strata.filter((s) => s.t1 + s.t0 > 0);
  const out = { k: S.length, conf, dropped: strata.length - S.length };
  const tot = S.reduce((o, s) => ({ a: o.a + s.a, t1: o.t1 + s.t1, c: o.c + s.c, t0: o.t0 + s.t0 }), { a: 0, t1: 0, c: 0, t0: 0 });
  out.crude = tot.t1 > 0 && tot.t0 > 0 ? personTime(tot.a, tot.t1, tot.c, tot.t0, { conf }) : null;
  out.strata = S.map((s) => {
    const informative = s.t1 > 0 && s.t0 > 0 && s.a + s.c > 0;
    return { ...s, informative, res: informative ? personTime(s.a, s.t1, s.c, s.t0, { conf }) : null };
  });
  out.informative = out.strata.filter((s) => s.informative).length;
  const T = S.map((s) => s.t1 + s.t0);
  const num = sum(S.map((s, i) => (s.a * s.t0) / T[i])), den = sum(S.map((s, i) => (s.c * s.t1) / T[i]));
  const est = den === 0 ? (num === 0 ? NaN : Infinity) : num / den;
  const v = sum(S.map((s, i) => ((s.a + s.c) * s.t1 * s.t0) / (T[i] * T[i]))) / (num * den);
  out.irr = { est, se: Math.sqrt(v), ci: logCI(est, Math.sqrt(v), z) };
  // Rate difference with Mantel-Haenszel weights t1 t0 / T and the Greenland-Robins variance.
  const w = S.map((s, i) => (s.t1 * s.t0) / T[i]), W = sum(w);
  const ird = sum(S.map((s, i) => w[i] * (s.a / s.t1 - s.c / s.t0))) / W;
  const vd = sum(S.map((s, i) => w[i] * w[i] * (s.a / (s.t1 * s.t1) + s.c / (s.t0 * s.t0)))) / (W * W);
  out.ird = { est: ird, se: Math.sqrt(vd), ci: [ird - z * Math.sqrt(vd), ird + z * Math.sqrt(vd)] };
  // Mantel-Haenszel test for person-time (with a continuity correction unless correct = false).
  const delta = sum(S.map((s, i) => s.a - ((s.a + s.c) * s.t1) / T[i]));
  const vt = sum(S.map((s, i) => ((s.a + s.c) * s.t1 * s.t0) / (T[i] * T[i])));
  const cc = correct && Math.abs(delta) >= 0.5 ? 0.5 : 0;
  out.test = { chi2: (Math.abs(delta) - cc) ** 2 / vt, chi2Uncorrected: delta * delta / vt };
  out.test.p = chiSquare.sf(out.test.chi2, 1);
  out.test.pUncorrected = chiSquare.sf(out.test.chi2Uncorrected, 1);
  // Homogeneity of the rate ratio (inverse-variance on the log scale).
  out.homogIRR = homogeneity(S.map((s) => (s.a > 0 && s.c > 0 && s.t1 > 0 && s.t0 > 0 ? Math.log((s.a / s.t1) / (s.c / s.t0)) : NaN)), S.map((s) => 1 / s.a + 1 / s.c));
  return out;
}

/** Crude against adjusted: the ratio crude/adjusted and the change in per cent of the adjusted estimate. */
export function confoundingChange(crude, adjusted) {
  return { ratio: crude / adjusted, change: (100 * (crude - adjusted)) / adjusted };
}

/* ------------------------------------------------------- standardisation --- */

/**
 * Direct standardisation. strata: [{ label, x, n, std }]: events, population (or person-time) of the
 * study group and the standard population in each stratum. The gamma interval of Fay and Feuer (1997),
 * as epitools' ageadjust.direct.
 */
export function directStandard(strata, { conf = 0.95 } = {}) {
  const al = 1 - conf;
  const sStd = sum(strata.map((s) => s.std));
  const w = strata.map((s) => s.std / sStd);
  const rates = strata.map((s) => s.x / s.n);
  const dsr = sum(w.map((wi, i) => wi * rates[i]));
  const v = sum(w.map((wi, i) => (wi * wi * strata[i].x) / (strata[i].n * strata[i].n)));
  const wm = Math.max(...w.map((wi, i) => wi / strata[i].n));
  const qgamma = (p, shape, scale) => (scale * chiSquare.ppf(p, 2 * shape)) / 2;
  const lo = dsr === 0 ? 0 : qgamma(al / 2, (dsr * dsr) / v, v / dsr);
  const hi = qgamma(1 - al / 2, (dsr + wm) ** 2 / (v + wm * wm), (v + wm * wm) / (dsr + wm));
  return {
    crude: sum(strata.map((s) => s.x)) / sum(strata.map((s) => s.n)), dsr, variance: v, ci: [lo, hi], conf,
    strata: strata.map((s, i) => ({ ...s, rate: rates[i], weight: w[i] })),
  };
}

/** Ratio of two directly standardised rates (same standard), with the delta-method CI on the log scale. */
export function dsrRatio(d1, d2, { conf = 0.95 } = {}) {
  const r = d1.dsr / d2.dsr;
  const se = Math.sqrt(d1.variance / (d1.dsr * d1.dsr) + d2.variance / (d2.dsr * d2.dsr));
  return { est: r, se, ci: logCI(r, se, zOf(conf)), difference: d1.dsr - d2.dsr };
}

/** R's poisson.test(x, T = mu): the two-sided exact test of an observed count against an expected one. */
export function poissonExactP(x, mu) {
  if (mu === 0) return x === 0 ? 1 : 0;
  if (x === mu) return 1;
  const relErr = 1 + 1e-7, d = poisson.pmf(x, mu);
  if (x < mu) {
    let N = Math.ceil(2 * mu - x);
    while (poisson.pmf(N, mu) > d) N *= 2;
    let y = 0;
    for (let i = Math.ceil(mu); i <= N; i++) if (poisson.pmf(i, mu) <= d * relErr) y++;
    return Math.min(1, poisson.cdf(x, mu) + poisson.sf(N - y, mu));
  }
  let y = 0;
  for (let i = 0; i <= Math.floor(mu); i++) if (poisson.pmf(i, mu) <= d * relErr) y++;
  return Math.min(1, poisson.cdf(y - 1, mu) + poisson.sf(x - 1, mu));
}

/**
 * Indirect standardisation. strata: [{ label, n, rate }]: the study group's population (or person-time)
 * and the standard's rate per person in each stratum; observed: the study group's events. SMR = O / E,
 * with the exact Poisson CI (Ulm 1990) and the exact test of O against E.
 */
export function indirectStandard(strata, observed, { conf = 0.95 } = {}) {
  const al = (1 - conf) / 2;
  const expected = sum(strata.map((s) => s.n * s.rate));
  const lo = observed === 0 ? 0 : chiSquare.ppf(al, 2 * observed) / 2;
  const hi = chiSquare.isf(al, 2 * observed + 2) / 2;
  return {
    observed, expected, smr: observed / expected, ci: [lo / expected, hi / expected], conf, p: poissonExactP(observed, expected),
    strata: strata.map((s) => ({ ...s, expected: s.n * s.rate })),
  };
}
