/* Vaccine efficacy and effectiveness: VE = 1 - the ratio each design estimates (the risk ratio in a
 * cohort or trial, the rate ratio with person-time, the odds ratio in a case-control or test-negative
 * study, the matched odds ratio in matched pairs). Each interval is the one the association tool
 * reports for that ratio, carried across: the VE limits are 1 minus the ratio's upper and lower limits.
 * The screening method (Orenstein and colleagues 1985; Farrington 1993) works from the proportion of
 * cases vaccinated and the coverage in the population they came from.
 */
import { normal } from './dist.js';
import { clopperPearson } from './proportions.js';
import { twoByTwo, personTime, matchedPairs } from './epi.js';

const zOf = (conf) => normal.isf((1 - conf) / 2);
/** VE from a ratio and its interval. */
export const fromRatio = (ratio, ci) => ({ est: 1 - ratio, ci: ci ? [1 - ci[1], 1 - ci[0]] : null });

const NAMES = { wald: 'Wald', score: "Koopman's score", exact: 'exact', midp: 'mid-p' };

/**
 * VE by design. input: { table: [[vaccinated cases, vaccinated non-cases or controls],
 * [unvaccinated cases, unvaccinated non-cases or controls]] } for 'cohort', 'case-control' and 'tnd'
 * (test-negative: cases test positive, controls test negative); { a, t1, c, t0 } for 'pt';
 * { e, f, g, h } for 'matched' (e both vaccinated, f only the case, g only the control, h neither).
 * Returns the ratio with every interval, the reported one (auto), and VE with each.
 */
export function vaccineEffectiveness(input, { design = 'cohort', conf = 0.95 } = {}) {
  let ratio = null, src = null;
  if (design === 'cohort') {
    src = twoByTwo(input.table, { conf, design: 'cohort' });
    if (src.rr) ratio = { name: 'risk ratio', est: src.rr.est, intervals: { wald: src.rr.wald, score: src.rr.score }, auto: src.rr.auto };
  } else if (design === 'case-control' || design === 'tnd') {
    src = twoByTwo(input.table, { conf, design: 'case-control' });
    if (src.or) ratio = { name: 'odds ratio', est: src.or.est, intervals: { wald: src.or.wald, exact: src.or.exact }, auto: src.or.auto };
  } else if (design === 'pt') {
    src = personTime(input.a, input.t1, input.c, input.t0, { conf });
    if (src.irr) ratio = { name: 'rate ratio', est: src.irr.est, intervals: { exact: src.irr.exact, midp: src.irr.midp, wald: src.irr.wald }, auto: src.irr.auto };
  } else if (design === 'matched') {
    src = matchedPairs(input.e, input.f, input.g, input.h, { conf });
    if (src.or) ratio = { name: 'matched odds ratio', est: src.or.est, intervals: { exact: src.or.exact, midp: src.or.midp, wald: src.or.wald }, auto: src.or.auto };
  }
  if (!ratio) return { design, src, ratio: null, ve: null };
  const ve = {};
  for (const [k, ci] of Object.entries(ratio.intervals)) if (ci) ve[k] = fromRatio(ratio.est, ci).ci;
  return { design, src, ratio, ve: { est: 1 - ratio.est, ci: ve[ratio.auto] ?? null, intervals: ve, auto: ratio.auto, method: NAMES[ratio.auto] } };
}

/**
 * The screening method: x of n cases vaccinated, against coverage (the proportion vaccinated in the
 * population the cases came from, taken as known). VE = 1 - [PCV / (1 - PCV)] x [(1 - PPV) / PPV].
 * Intervals for the proportion of cases vaccinated carried across: on the logit scale (Farrington's
 * logistic model with logit(PPV) as an offset; Wald), and exact (Clopper-Pearson); the exact one is
 * reported when vaccinated or unvaccinated cases number fewer than 5.
 */
export function screeningMethod(x, n, coverage, { conf = 0.95 } = {}) {
  const z = zOf(conf), pcv = x / n, ppv = coverage;
  const toVE = (q) => (q >= 1 ? -Infinity : 1 - (q / (1 - q)) * ((1 - ppv) / ppv));
  const out = { x, n, pcv, ppv, conf, est: toVE(pcv) };
  if (x > 0 && x < n) {
    const L = Math.log(pcv / (1 - pcv)), se = Math.sqrt(1 / x + 1 / (n - x));
    const ex = (t) => 1 / (1 + Math.exp(-t));
    out.logit = [toVE(ex(L + z * se)), toVE(ex(L - z * se))];
    out.logOdds = { est: L - Math.log(ppv / (1 - ppv)), se };
  } else out.logit = null;
  const cp = clopperPearson(x, n, conf);
  out.exact = [toVE(cp[1]), toVE(cp[0])];
  out.auto = Math.min(x, n - x) < 5 || !out.logit ? 'exact' : 'logit';
  out.ci = out[out.auto];
  return out;
}

/** A published ratio (adjusted odds, risk, rate or hazard ratio) with its CI, read as VE. */
export function fromPublished(ratio, lo, hi) {
  return { ratio, ratioCI: [lo, hi], ...fromRatio(ratio, [lo, hi]) };
}
