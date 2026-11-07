/* Measures of disease frequency, association and impact.
 *
 * Frequency: a proportion (prevalence, risk, attack rate) with the Wilson or Clopper-Pearson CI; a
 * rate from events and person-time with the exact Poisson CI (Garwood 1936).
 *
 * Association, from a 2 x 2 table [[a, b], [c, d]]: rows exposed and unexposed; columns outcome
 * present and absent (cases and controls in a case-control study).
 *   Risk or prevalence ratio: Wald on the log scale (Katz 1978) or the score interval (Koopman 1984).
 *   Odds ratio: Woolf (1955); exact conditional, as in R's fisher.test; mid-p exact.
 *   Risk difference: Wald or Newcombe's (1998) hybrid score; the number needed to treat from it, with
 *   the CI through infinity when the difference may be zero (Altman 1998).
 * Person-time: the rate ratio with exact and mid-p CIs conditional on the total number of events,
 * as in R's poisson.test, and the rate difference. Matched pairs (1:1): the odds ratio from the
 * discordant pairs, with exact and mid-p CIs.
 *
 * Impact: attributable or prevented fractions among the exposed and in the population (Miettinen
 * 1974), with the variances of Jewell (2004); Levin's (1953) formula when the population's exposure
 * prevalence comes from elsewhere; the number needed to treat from a ratio and a baseline risk.
 * Fractions are reported as attributable when the exposure raises the risk and as prevented when it
 * lowers it, so a protective exposure never shows a negative attributable fraction.
 *
 * Checked against R (stats, epiR, epitools) and statsmodels in tests/engine/epi.test.mjs.
 */
import { normal, chiSquare, binomial } from './dist.js';
import { brent, lnChoose } from './special.js';
import { wilson, clopperPearson, binomialTest, twoProportions } from './proportions.js';
import { chiSquareTest, fisher2x2, mcnemar } from './tables.js';

const zOf = (conf) => normal.isf((1 - conf) / 2);
const sum = (xs) => xs.reduce((s, v) => s + v, 0);

/* ------------------------------------------------------------ helpers --- */

/** Find the root of g on the log scale, moving out from `start` (where g < 0) until g changes sign. */
function rootOut(g, start, dir) {
  let near = start, step = 1, far = start + dir * step, gf = g(far), guard = 0;
  while (!(gf > 0) && guard++ < 80) { near = far; step *= 2; far = start + dir * step; gf = g(far); }
  if (!(gf > 0)) return NaN;
  return dir > 0 ? brent(g, near, far, 1e-14) : brent(g, far, near, 1e-14);
}

/** Two-sided mid-p from the lower tail, the point probability and the upper tail. */
const midTwo = (below, at, above) => Math.min(1, 2 * Math.min(below + 0.5 * at, above + 0.5 * at));

/** Mid-p exact CI for a binomial proportion x of n. */
export function binomialMidP(x, n, conf = 0.95) {
  const al = (1 - conf) / 2;
  const lo = x === 0 ? 0 : brent((p) => binomial.sf(x, n, p) + 0.5 * binomial.pmf(x, n, p) - al, 0, 1, 1e-15);
  const hi = x === n ? 1 : brent((p) => binomial.cdf(x - 1, n, p) + 0.5 * binomial.pmf(x, n, p) - al, 0, 1, 1e-15);
  return [lo, hi];
}

/** Two-sided mid-p for x of n against p0 (twice the smaller one-sided mid-p). */
function binomialMidPTest(x, n, p0) {
  return midTwo(binomial.cdf(x - 1, n, p0), binomial.pmf(x, n, p0), binomial.sf(x, n, p0));
}

/** Interval for a ratio from its log standard error, or null when the standard error is not finite. */
function logInterval(est, se, z) {
  if (!(est > 0) || !Number.isFinite(est) || !Number.isFinite(se)) return null;
  const l = Math.log(est);
  return [Math.exp(l - z * se), Math.exp(l + z * se)];
}

/* ---------------------------------------------------------- frequency --- */

/** A proportion with its CI: Wilson (default) or Clopper-Pearson ('exact'). */
export function proportion(x, n, { conf = 0.95, method = 'wilson' } = {}) {
  return { x, n, p: x / n, ci: method === 'exact' ? clopperPearson(x, n, conf) : wilson(x, n, conf), conf, method };
}

/** A rate: x events in person-time t, with the exact Poisson CI (Garwood 1936). */
export function rate(x, t, { conf = 0.95 } = {}) {
  const al = (1 - conf) / 2;
  const lo = x === 0 ? 0 : chiSquare.ppf(al, 2 * x) / 2;
  const hi = chiSquare.isf(al, 2 * x + 2) / 2;
  return { x, t, rate: x / t, countCi: [lo, hi], ci: [lo / t, hi / t], conf, method: 'exact' };
}

/* ------------------------------------------------- odds ratio, exact --- */

/** The noncentral hypergeometric distribution of cell a given the margins of [[a, b], [c, d]]. */
function ncHyper(a, b, c, d) {
  const m = a + c, n = b + d, k = a + b;
  const lo = Math.max(0, k - n), hi = Math.min(k, m);
  const xs = [], ld = [];
  for (let i = lo; i <= hi; i++) { xs.push(i); ld.push(lnChoose(m, i) + lnChoose(n, k - i)); }
  /** [P(X < a), P(X = a), P(X > a)] at log odds ratio l. */
  const tails = (l) => {
    const e = ld.map((v, j) => v + l * xs[j]);
    const mx = Math.max(...e);
    const w = e.map((v) => Math.exp(v - mx));
    const s = sum(w);
    let below = 0, at = 0, above = 0;
    xs.forEach((x, j) => { if (x < a) below += w[j]; else if (x === a) at = w[j]; else above += w[j]; });
    return [below / s, at / s, above / s];
  };
  return { lo, hi, tails };
}

/** Mid-p exact CI for the odds ratio (conditional on the margins) and the two-sided mid-p at OR = 1. */
export function oddsRatioMidP(a, b, c, d, conf = 0.95) {
  const h = ncHyper(a, b, c, d);
  const al = (1 - conf) / 2;
  const L = a === h.lo ? 0 : Math.exp(brent((l) => { const [, at, ab] = h.tails(l); return ab + 0.5 * at - al; }, -60, 60, 1e-13));
  const U = a === h.hi ? Infinity : Math.exp(brent((l) => { const [bl, at] = h.tails(l); return bl + 0.5 * at - al; }, -60, 60, 1e-13));
  return { ci: [L, U], p: midTwo(...h.tails(0)) };
}

/* ------------------------------------------------- risk ratio, score --- */

/** Koopman's (1984) score statistic for H0: p1 / p2 = phi (Miettinen-Nurminen without the n / (n - 1) factor). */
function rrScore(x1, n1, x2, n2, phi) {
  const N = n1 + n2;
  const B = phi * (n1 + x2) + x1 + n2, C = x1 + x2;
  const disc = Math.max(0, B * B - 4 * phi * N * C);
  const p2 = C === 0 ? 0 : (2 * C) / (B + Math.sqrt(disc)); // the smaller root, written without cancellation
  const p1 = phi * p2;
  const num = x1 / n1 - (phi * x2) / n2;
  const v = (p1 * (1 - p1)) / n1 + (phi * phi * p2 * (1 - p2)) / n2;
  return v > 0 ? (num * num) / v : num === 0 ? 0 : Infinity;
}

/** Koopman's score CI for the ratio of two proportions x1/n1 over x2/n2. */
export function riskRatioScore(x1, n1, x2, n2, conf = 0.95) {
  if (x1 === 0 && x2 === 0) return [0, Infinity];
  const z2 = zOf(conf) ** 2;
  const g = (l) => rrScore(x1, n1, x2, n2, Math.exp(l)) - z2;
  // Start from a finite ratio with g < 0: the estimate, or a nearby one when a count is zero.
  const est = x1 > 0 && x2 > 0 ? Math.log((x1 / n1) / (x2 / n2)) : Math.log(((x1 + 0.5) / (n1 + 1)) / ((x2 + 0.5) / (n2 + 1)));
  let start = est, guard = 0;
  while (!(g(start) < 0) && guard++ < 60) start += x1 === 0 ? -1 : 1;
  const lo = x1 === 0 ? 0 : Math.exp(rootOut(g, start, -1));
  const hi = x2 === 0 ? Infinity : Math.exp(rootOut(g, start, 1));
  return [lo, hi];
}

/* ------------------------------------------------ number needed to treat --- */

/** Ceiling of p / q for positive safe integers, free of floating-point error. */
function ceilDiv(p, q) {
  let k = Math.floor(p / q);
  while (k * q > p) k--;
  while (k * q < p) k++;
  return k;
}

/**
 * Number needed to treat from a risk difference rd and its CI (Altman 1998). `exact` = [num, den]
 * gives rd as an exact fraction of integers, so the whole number is the true ceiling: 1/0.2 is 5, not 6.
 * sign: +1 when rd > 0, -1 when rd < 0. When the CI includes 0, the interval for the NNT runs from
 * 1/|lower| on one side through infinity to 1/upper on the other.
 */
export function numberNeeded(rd, ci, exact) {
  const sign = Math.sign(rd);
  let value = rd === 0 ? Infinity : 1 / Math.abs(rd), whole;
  if (exact && Number.isSafeInteger(exact[0]) && Number.isSafeInteger(exact[1]) && exact[0] !== 0) {
    const num = Math.abs(exact[0]), den = Math.abs(exact[1]);
    value = den / num;
    whole = ceilDiv(den, num);
  } else whole = Number.isFinite(value) ? Math.ceil(value - 1e-9 * value) : Infinity;
  let interval = null;
  if (ci && ci.every(Number.isFinite)) {
    const [lo, hi] = ci;
    if (lo > 0 || hi < 0) {
      const a = 1 / Math.abs(lo), b = 1 / Math.abs(hi);
      interval = { crosses: false, ci: [Math.min(a, b), Math.max(a, b)] };
    } else interval = { crosses: true, neg: lo === 0 ? Infinity : 1 / Math.abs(lo), pos: hi === 0 ? Infinity : 1 / hi };
  }
  return { value, whole, sign, interval };
}

/* ------------------------------------------------------------ fractions --- */

/** Attributable fraction among the exposed from a ratio (RR, OR or rate ratio) and its CI, or the
 * prevented fraction 1 - ratio when the ratio is below 1. */
export function exposedFraction(est, ci) {
  if (!Number.isFinite(est) && est !== Infinity) return null;
  const af = (r) => (r === Infinity ? 1 : (r - 1) / r);
  if (est >= 1) return { kind: 'attributable', est: af(est), ci: ci ? [af(ci[0]), af(ci[1])] : null };
  return { kind: 'prevented', est: 1 - est, ci: ci ? [1 - ci[1], 1 - ci[0]] : null };
}

/** A population fraction from L = log(1 - PAF) and its standard error: attributable when PAF >= 0,
 * otherwise the prevented fraction 1 - 1 / (1 - PAF). */
function fractionFromLog(L, se, z) {
  const ok = Number.isFinite(se);
  if (L <= 0) {
    const est = 1 - Math.exp(L);
    return { kind: 'attributable', est, ci: ok ? [1 - Math.exp(L + z * se), 1 - Math.exp(L - z * se)] : null };
  }
  const est = 1 - Math.exp(-L);
  return { kind: 'prevented', est, ci: ok ? [1 - Math.exp(-L + z * se), 1 - Math.exp(-L - z * se)] : null };
}

/** Population fraction from a cohort or survey that samples the population: Jewell's (2004) variance of
 * log(1 - PAF), (b + PAF (a + d)) / (N c). */
export function populationFractionCohort(a, b, c, d, conf = 0.95) {
  const N = a + b + c + d, m1 = a + c, n0 = c + d;
  const paf = (a * d - b * c) / (m1 * n0);
  if (c === 0) return { kind: 'attributable', est: paf, ci: null };
  const v = (b + paf * (a + d)) / (N * c);
  return fractionFromLog(Math.log(1 - paf), Math.sqrt(v), zOf(conf));
}

/** Population fraction from a case-control study (Miettinen 1974): PAF = pc (OR - 1) / OR, pc the
 * proportion of cases exposed; var log(1 - PAF) = a / (c m1) + b / (d m0) (Jewell 2004). */
export function populationFractionCaseControl(a, b, c, d, conf = 0.95) {
  const m1 = a + c, m0 = b + d;
  const paf = (a * d - b * c) / (d * m1);
  if (c === 0 || d === 0) return { kind: 'attributable', est: paf, ci: null };
  const v = a / (c * m1) + b / (d * m0);
  return fractionFromLog(Math.log(1 - paf), Math.sqrt(v), zOf(conf));
}

/**
 * Population fraction from a ratio and either the proportion of the population exposed (Levin 1953)
 * or the proportion of cases exposed (Miettinen 1974). The CI substitutes the ratio's limits, treating
 * the proportion as known.
 */
export function populationFraction({ est, ci, pe = null, pc = null }) {
  let f;
  if (pe !== null) f = (r) => (r === Infinity ? 1 : (pe * (r - 1)) / (1 + pe * (r - 1)));
  else f = (r) => (r === Infinity ? pc : (pc * (r - 1)) / r);
  const paf = f(est);
  const lims = ci ? [f(ci[0]), f(ci[1])] : null;
  if (paf >= 0) return { kind: 'attributable', est: paf, ci: lims, formula: pe !== null ? 'levin' : 'miettinen' };
  const pf = (x) => 1 - 1 / (1 - x);
  return { kind: 'prevented', est: pf(paf), ci: lims ? [pf(lims[1]), pf(lims[0])] : null, formula: pe !== null ? 'levin' : 'miettinen' };
}

/** Risk difference implied by a ratio and the risk without exposure (or in the control arm). */
export function impliedRiskDifference(measure, r, baseline) {
  if (r === Infinity) return measure === 'or' ? 1 - baseline : Infinity;
  if (measure === 'or') return (r * baseline) / (1 - baseline + r * baseline) - baseline;
  return baseline * (r - 1);
}

/* -------------------------------------------------------- the 2 x 2 table --- */

/**
 * Measures from a 2 x 2 table. design: 'cohort' (risks; also trials), 'cross' (prevalences) or
 * 'case-control'. Returns every interval; `auto` names the one a report should use: for the
 * ratios, Wald when every cell is at least 5, otherwise the score interval (risk ratio) or the exact
 * interval (odds ratio); Newcombe's interval for the difference.
 */
export function twoByTwo(t, { conf = 0.95, design = 'cohort' } = {}) {
  const [[a, b], [c, d]] = t;
  const n1 = a + b, n0 = c + d, m1 = a + c, m0 = b + d, N = n1 + n0;
  const z = zOf(conf);
  const small = Math.min(a, b, c, d) < 5;
  const out = { a, b, c, d, n1, n0, m1, m0, N, conf, design, small };

  // Tests of association (meaningful only when no margin is zero).
  if (n1 > 0 && n0 > 0 && m1 > 0 && m0 > 0) {
    const chi = chiSquareTest(t);
    const fis = fisher2x2(t, conf);
    const mid = oddsRatioMidP(a, b, c, d, conf);
    out.tests = {
      chi2: chi.chi2, p: chi.p, chi2Yates: chi.chi2Yates, pYates: chi.pYates, pFisher: fis.p, pMidp: mid.p,
      minExpected: chi.minExpected, exact: chi.minExpected < 5,
    };
    out.or = {
      est: b * c === 0 ? (a * d === 0 ? NaN : Infinity) : (a * d) / (b * c),
      wald: Math.min(a, b, c, d) > 0 ? logInterval((a * d) / (b * c), Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d), z) : null,
      exact: fis.ci, midp: mid.ci, cmle: fis.orMLE,
    };
    out.or.auto = small ? 'exact' : 'wald';
  }

  if (design === 'case-control') {
    out.pCases = m1 > 0 ? proportion(a, m1, { conf }) : null; // proportion of cases exposed
    out.pControls = m0 > 0 ? proportion(b, m0, { conf }) : null;
    if (out.or) {
      const ci = out.or[out.or.auto];
      out.afe = exposedFraction(out.or.est, ci);
      out.paf = m1 > 0 && m0 > 0 ? populationFractionCaseControl(a, b, c, d, conf) : null;
    }
    return out;
  }

  // Cohorts, trials and cross-sectional studies: risks (or prevalences) in each group.
  out.r1 = n1 > 0 ? proportion(a, n1, { conf }) : null;
  out.r0 = n0 > 0 ? proportion(c, n0, { conf }) : null;
  out.rt = N > 0 ? proportion(m1, N, { conf }) : null;
  if (n1 > 0 && n0 > 0) {
    const R1 = a / n1, R0 = c / n0;
    out.rr = {
      est: c === 0 ? (a === 0 ? NaN : Infinity) : R1 / R0,
      wald: a > 0 && c > 0 ? logInterval(R1 / R0, Math.sqrt(1 / a - 1 / n1 + 1 / c - 1 / n0), z) : null,
      score: riskRatioScore(a, n1, c, n0, conf),
    };
    out.rr.auto = small ? 'score' : 'wald';
    const se = Math.sqrt((R1 * (1 - R1)) / n1 + (R0 * (1 - R0)) / n0);
    out.rd = { est: R1 - R0, wald: [R1 - R0 - z * se, R1 - R0 + z * se], newcombe: twoProportions(a, n1, c, n0, conf).ci, auto: 'newcombe' };
    if (design === 'cohort') out.nnt = numberNeeded(R1 - R0, out.rd.newcombe, [a * n0 - c * n1, n1 * n0]);
    const ci = out.rr[out.rr.auto];
    out.afe = exposedFraction(out.rr.est, ci);
    out.paf = m1 > 0 ? populationFractionCohort(a, b, c, d, conf) : null;
  }
  return out;
}

/* ------------------------------------------------------------ person-time --- */

/** Events a in person-time t1 (exposed) and c in t0 (unexposed). */
export function personTime(a, t1, c, t0, { conf = 0.95 } = {}) {
  const z = zOf(conf), m = a + c, T = t1 + t0;
  const ir1 = a / t1, ir0 = c / t0, irt = m / T;
  const out = { a, c, t1, t0, m, T, conf, ir1: rate(a, t1, { conf }), ir0: rate(c, t0, { conf }), irt: rate(m, T, { conf }) };
  const se = Math.sqrt(a / (t1 * t1) + c / (t0 * t0));
  out.ird = { est: ir1 - ir0, wald: [ir1 - ir0 - z * se, ir1 - ir0 + z * se] };
  if (m === 0) return out;
  const toIRR = (pi) => (pi >= 1 ? Infinity : (pi / (1 - pi)) * (t0 / t1));
  const cp = clopperPearson(a, m, conf);
  out.irr = {
    est: c === 0 ? Infinity : ir1 / ir0,
    exact: cp.map(toIRR),
    midp: binomialMidP(a, m, conf).map(toIRR),
    wald: a > 0 && c > 0 ? logInterval(ir1 / ir0, Math.sqrt(1 / a + 1 / c), z) : null,
    auto: 'exact',
  };
  const p0 = t1 / T; // share of events expected among the exposed if the rates were equal
  out.tests = {
    pExact: binomialTest(a, m, p0).p,
    pMidp: binomialMidPTest(a, m, p0),
    z: (a - m * p0) / Math.sqrt(m * p0 * (1 - p0)),
  };
  out.tests.pScore = 2 * normal.sf(Math.abs(out.tests.z));
  out.afe = exposedFraction(out.irr.est, out.irr.exact);
  // 1 - PAF = IR0 / IRt = (1 - a/m) T / t0, so the exact binomial CI for a/m gives an exact CI.
  const paf = 1 - ((1 - a / m) * T) / t0;
  if (paf >= 0) out.paf = { kind: 'attributable', est: paf, ci: [1 - ((1 - cp[0]) * T) / t0, 1 - ((1 - cp[1]) * T) / t0] };
  else {
    const pf = (q) => 1 - t0 / ((1 - q) * T);
    out.paf = { kind: 'prevented', est: pf(a / m), ci: [pf(cp[1]), pf(cp[0])] };
  }
  out.paf.exactFromBinomial = true;
  return out;
}

/* ------------------------------------------------------------ matched pairs --- */

/**
 * 1:1 matched case-control pairs: e both exposed, f case exposed and control not, g control exposed and
 * case not, h neither. Odds ratio f / g with CIs conditional on the discordant pairs; McNemar's test.
 */
export function matchedPairs(e, f, g, h, { conf = 0.95 } = {}) {
  const z = zOf(conf), n = e + f + g + h, disc = f + g;
  const out = { e, f, g, h, n, disc, conf };
  out.pCases = proportion(e + f, n, { conf });
  out.pControls = proportion(e + g, n, { conf });
  if (disc === 0) return out;
  const toOR = (pi) => (pi >= 1 ? Infinity : pi / (1 - pi));
  out.or = {
    est: g === 0 ? Infinity : f / g,
    exact: clopperPearson(f, disc, conf).map(toOR),
    midp: binomialMidP(f, disc, conf).map(toOR),
    wald: f > 0 && g > 0 ? logInterval(f / g, Math.sqrt(1 / f + 1 / g), z) : null,
    auto: 'exact',
  };
  const mc = mcnemar(f, g);
  out.tests = { pExact: mc.pExact, chi2: mc.chi2, p: mc.p, pMidp: binomialMidPTest(f, disc, 0.5), exact: disc < 25 };
  out.afe = exposedFraction(out.or.est, out.or.exact);
  return out;
}
