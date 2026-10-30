/* Correlation: Pearson r with Fisher-z CI, Spearman rho with the Bonett-Wright CI, and
 * Kendall tau-b (exact p for small samples without ties, otherwise the tie-corrected normal
 * approximation). Checked against SciPy in tests/engine/correlate.test.mjs.
 */
import { studentT, normal } from './dist.js';
import { rank, mean } from './describe.js';

function rCore(x, y) {
  const mx = mean(x), my = mean(y);
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
  }
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
}

function zInterval(r, se, conf) {
  const z = Math.atanh(r), h = normal.isf((1 - conf) / 2) * se;
  return [Math.tanh(z - h), Math.tanh(z + h)];
}

export function pearson(x, y, conf = 0.95) {
  const n = x.length, r = rCore(x, y), df = n - 2;
  const t = r * Math.sqrt(df / (1 - r * r));
  return {
    test: 'Pearson', n, r, r2: r * r, t, df, p: Math.abs(r) === 1 ? 0 : studentT.twoSided(t, df),
    ci: n > 3 ? zInterval(r, 1 / Math.sqrt(n - 3), conf) : [NaN, NaN], conf,
  };
}

export function spearman(x, y, conf = 0.95) {
  const n = x.length;
  const rho = rCore(rank(x).ranks, rank(y).ranks), df = n - 2;
  const t = rho * Math.sqrt(df / (1 - rho * rho));
  // Bonett and Wright (2000): SE of atanh(rho) = sqrt((1 + rho^2 / 2) / (n - 3)).
  return {
    test: 'Spearman', n, rho, t, df, p: Math.abs(rho) === 1 ? 0 : studentT.twoSided(t, df),
    ci: n > 3 ? zInterval(rho, Math.sqrt((1 + (rho * rho) / 2) / (n - 3)), conf) : [NaN, NaN], conf,
    method: 't approximation',
  };
}

// Distribution of the number of discordant pairs (inversions) among n distinct values.
function inversionDistribution(n) {
  let dist = [1];
  for (let k = 2; k <= n; k++) {
    const next = new Float64Array(dist.length + k - 1);
    let window = 0;
    for (let i = 0; i < next.length; i++) {
      if (i < dist.length) window += dist[i];
      if (i - k >= 0 && i - k < dist.length) window -= dist[i - k];
      next[i] = window;
    }
    dist = next;
  }
  let total = 0;
  for (const v of dist) total += v;
  return Array.from(dist, (v) => v / total);
}

export function kendall(x, y, { method = 'auto' } = {}) {
  const n = x.length;
  let con = 0, dis = 0, tx = 0, ty = 0, txy = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = Math.sign(x[i] - x[j]), b = Math.sign(y[i] - y[j]);
    if (a === 0 && b === 0) txy++;
    else if (a === 0) tx++;
    else if (b === 0) ty++;
    else if (a === b) con++;
    else dis++;
  }
  const tot = (n * (n - 1)) / 2;
  const xtie = tx + txy, ytie = ty + txy;
  const tau = (con - dis) / Math.sqrt((tot - xtie) * (tot - ytie));
  const groupStats = (v) => {
    const cnt = new Map();
    for (const q of v) cnt.set(q, (cnt.get(q) || 0) + 1);
    let t0 = 0, t1 = 0, t2 = 0;
    for (const c of cnt.values()) if (c > 1) { t0 += (c * (c - 1)) / 2; t1 += c * (c - 1) * (c - 2); t2 += c * (c - 1) * (2 * c + 5); }
    return [t0, t1, t2];
  };
  const hasTies = xtie > 0 || ytie > 0;
  const exact = method === 'exact' || (method === 'auto' && !hasTies && n <= 50);
  let p, z;
  if (exact) {
    const d = inversionDistribution(n);
    const k = Math.min(dis, tot - dis);
    let s = 0;
    for (let i = 0; i <= k; i++) s += d[i];
    p = Math.min(1, 2 * s);
  } else {
    const [, x0, x1] = groupStats(x), [, y0, y1] = groupStats(y);
    const m = n * (n - 1);
    const v = (m * (2 * n + 5) - x1 - y1) / 18 + (2 * xtie * ytie) / m + (x0 * y0) / (9 * m * (n - 2));
    z = (con - dis) / Math.sqrt(v);
    p = 2 * normal.sf(Math.abs(z));
  }
  return { test: 'Kendall tau-b', n, tau, concordant: con, discordant: dis, z, p, method: exact ? 'exact' : 'normal approximation, tie corrected' };
}
