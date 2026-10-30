/* Proportions: confidence intervals (Wilson, Clopper-Pearson), the exact binomial test, and
 * the difference between two independent proportions with Newcombe's hybrid score interval.
 * Checked against SciPy and statsmodels in tests/engine/proportions.test.mjs.
 */
import { binomial, normal, chiSquare } from './dist.js';
import { betaInc, brent } from './special.js';
import { wilson } from './describe.js';

export { wilson };

function betaQuantile(p, a, b) {
  return brent((x) => betaInc(x, a, b, 1 - x) - p, 0, 1, 1e-15);
}

/** Clopper-Pearson "exact" interval: coverage at least conf for every true proportion. */
export function clopperPearson(x, n, conf = 0.95) {
  const a = (1 - conf) / 2;
  const lo = x === 0 ? 0 : betaQuantile(a, x, n - x + 1);
  const hi = x === n ? 1 : betaQuantile(1 - a, x + 1, n - x);
  return [lo, hi];
}

/** Exact binomial test, two-sided p as in R's binom.test (sum of outcomes no more likely than observed). */
export function binomialTest(x, n, p0 = 0.5, conf = 0.95) {
  const d = binomial.pmf(x, n, p0) * (1 + 1e-7);
  const m = n * p0;
  let p;
  if (x === m) p = 1;
  else if (x < m) {
    let y = 0;
    for (let i = Math.ceil(m); i <= n; i++) if (binomial.pmf(i, n, p0) <= d) y++;
    p = binomial.cdf(x, n, p0) + binomial.sf(n - y, n, p0);
  } else {
    let y = 0;
    for (let i = 0; i <= Math.floor(m); i++) if (binomial.pmf(i, n, p0) <= d) y++;
    p = binomial.cdf(y - 1, n, p0) + binomial.sf(x - 1, n, p0);
  }
  return { test: 'exact binomial', x, n, p0, estimate: x / n, p: Math.min(1, p), ci: clopperPearson(x, n, conf), ciWilson: wilson(x, n, conf), conf };
}

/** One-sample z test for a proportion (score test, no continuity correction). */
export function proportionZ(x, n, p0) {
  const z = (x / n - p0) / Math.sqrt((p0 * (1 - p0)) / n);
  return { test: 'one-sample z for a proportion', z, p: 2 * normal.sf(Math.abs(z)) };
}

/**
 * Difference between two independent proportions p1 - p2 with Newcombe's (1998) hybrid score
 * interval (method 10), and the pooled z test (equal to Pearson's chi-square without correction).
 */
export function twoProportions(x1, n1, x2, n2, conf = 0.95) {
  const p1 = x1 / n1, p2 = x2 / n2, d = p1 - p2;
  const [l1, u1] = wilson(x1, n1, conf), [l2, u2] = wilson(x2, n2, conf);
  const lo = d - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2);
  const hi = d + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2);
  const pp = (x1 + x2) / (n1 + n2);
  const z = d / Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2));
  return {
    test: 'difference in proportions', p1, p2, diff: d, ci: [lo, hi], z, p: 2 * normal.sf(Math.abs(z)),
    chi2: z * z, pChi2: chiSquare.sf(z * z, 1), conf,
  };
}
