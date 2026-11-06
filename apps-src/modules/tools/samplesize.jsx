/* Tool: sample size and power. Seventeen designs, each with the formula and its source, the
 * working, adjustments for clustering and non-response, a power curve, and a protocol sentence
 * that marks where the user must cite the source of each assumption. */
import { useState } from 'preact/hooks';
import * as S from '../../engine/samplesize.js';
import { parseNumber, fixed, count, sig } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, NumberField, SelectField, MathView, useId } from '../../ui/core.jsx';
import { Report, Stats, Refs } from '../../ui/results.jsx';
import { LinePlot } from '../../ui/plot.jsx';
import { tex, texd } from '../../ui/tex.js';
import { REFS } from '../refs.js';

const num = (s) => parseNumber(s);
const pc = (s) => parseNumber(s) / 100;
const up = (x) => Math.ceil(x - 1e-9);
const pctTxt = (p) => `${sig(100 * p, 3)}%`;
/** "151 in group 1", "187 cases", "201 on the new treatment". */
const nIn = (n, label) => {
  const l = label.toLowerCase();
  if (l.startsWith('group')) return `${count(n)} in ${l}`;
  if (l === 'new treatment' || l === 'control') return `${count(n)} on the ${l}`;
  return `${count(n)} ${l}`;
};

/* ------------------------------------------------------------- designs --- */

const COMMON_TEST = ['alpha', 'sides', 'power'];

export const DESIGNS = [
  { id: 'prop', group: 'Estimate a value (survey, cross-sectional study)', name: 'A prevalence or proportion', estimate: true,
    fields: [['p', 'Expected prevalence (%)', '30', 'From a previous study or pilot; 50% if unknown gives the largest n'], ['d', 'Precision, ± (percentage points)', '5', 'Half the width of the 95% CI you want'], ['rel', null]],
    formula: [texd`n_0 = \frac{z_{1-\alpha/2}^{2}\, p\,(1-p)}{d^{2}}`, texd`n = \frac{n_0}{1 + (n_0 - 1)/N}`] },
  { id: 'mean', group: 'Estimate a value (survey, cross-sectional study)', name: 'A mean', estimate: true,
    fields: [['sd', 'Expected SD', '1.3', 'From a previous study or pilot'], ['d', 'Precision, ± (same units)', '0.2', 'Half the width of the 95% CI you want']],
    formula: texd`n_0 = \frac{z_{1-\alpha/2}^{2}\, \sigma^{2}}{d^{2}}` },
  { id: 'diag', group: 'Estimate a value (survey, cross-sectional study)', name: 'Sensitivity and specificity of a test', estimate: true,
    fields: [['se', 'Expected sensitivity (%)', '90', ''], ['sp', 'Expected specificity (%)', '85', ''], ['prev', 'Prevalence of the condition in the study population (%)', '20', ''], ['d', 'Precision, ± (percentage points)', '5', '']],
    formula: [texd`n_{Se} = \frac{z^{2}\, Se\,(1-Se)}{d^{2}\, P}`, texd`n_{Sp} = \frac{z^{2}\, Sp\,(1-Sp)}{d^{2}\,(1-P)}`] },
  { id: 'two-props', group: 'Compare two independent groups', name: 'Two proportions (trial, or cohort risks)', power: true, ratio: true, cc: true, common: COMMON_TEST,
    fields: [['p1', 'Proportion in group 1 (%)', '35', 'For example, the intervention group'], ['p2', 'Proportion in group 2 (%)', '20', 'For example, the control group']],
    formula: [texd`n_1 = \frac{\left[z_{1-\alpha/2}\sqrt{(r+1)\,\bar p\,\bar q} + z_{1-\beta}\sqrt{r\,p_1 q_1 + p_2 q_2}\right]^{2}}{r\,(p_1 - p_2)^{2}}`, texd`n_1' = \frac{n_1}{4}\left(1 + \sqrt{1 + \frac{2(r+1)}{n_1\, r\,\lvert p_1 - p_2\rvert}}\right)^{2}`] },
  { id: 'cc', group: 'Compare two independent groups', name: 'Case-control study (odds ratio)', power: true, ratio: true, cc: true, common: COMMON_TEST, ratioLabel: 'Controls per case',
    fields: [['p0', 'Exposure among controls (%)', '20', 'Prevalence of the exposure in the source population'], ['or', 'Odds ratio to detect', '2', 'The smallest odds ratio that would matter']],
    formula: texd`p_1 = \frac{OR\; p_0}{1 + p_0\,(OR - 1)} \quad\text{then the two-proportion formula}` },
  { id: 'cohort', group: 'Compare two independent groups', name: 'Cohort study (risk ratio)', power: true, ratio: true, cc: true, common: COMMON_TEST, ratioLabel: 'Unexposed per exposed',
    fields: [['p0', 'Risk in the unexposed (%)', '10', 'Incidence over the follow-up period'], ['rr', 'Risk ratio to detect', '2', '']],
    formula: texd`p_1 = RR \times p_0 \quad\text{then the two-proportion formula}` },
  { id: 'two-means', group: 'Compare two independent groups', name: 'Two means', power: true, ratio: true, common: COMMON_TEST,
    fields: [['diff', 'Difference to detect', '0.5', 'The smallest difference that matters clinically'], ['sd', 'SD in each group', '1.2', 'From a previous study or pilot']],
    formula: texd`n_1 = \frac{(1 + 1/r)\,\sigma^{2}\,(z_{1-\alpha/2} + z_{1-\beta})^{2}}{\Delta^{2}}` },
  { id: 'paired-means', group: 'Paired or one-group designs', name: 'Paired means (before and after)', power: true, common: COMMON_TEST,
    fields: [['diff', 'Mean change to detect', '0.5', ''], ['sd', 'SD of the changes', '1.0', 'Not the SD of either measurement; often smaller']],
    formula: texd`n = \frac{\sigma_d^{2}\,(z_{1-\alpha/2} + z_{1-\beta})^{2}}{\Delta^{2}}` },
  { id: 'paired-props', group: 'Paired or one-group designs', name: 'Paired proportions (McNemar)', common: COMMON_TEST,
    fields: [['p10', 'Pairs changing yes to no (%)', '20', 'Discordant proportion one way'], ['p01', 'Pairs changing no to yes (%)', '10', 'Discordant proportion the other way']],
    formula: [texd`n = \frac{\left(z_{1-\alpha/2}\sqrt{\psi} + z_{1-\beta}\sqrt{\psi - \delta^{2}}\right)^{2}}{\delta^{2}}`, texd`\psi = p_{10} + p_{01}, \quad \delta = p_{10} - p_{01}`] },
  { id: 'one-mean', group: 'Paired or one-group designs', name: 'One mean against a known value', power: true, common: COMMON_TEST,
    fields: [['diff', 'Difference from the known value', '0.5', ''], ['sd', 'Expected SD', '1.3', '']],
    formula: texd`n = \frac{\sigma^{2}\,(z_{1-\alpha/2} + z_{1-\beta})^{2}}{\Delta^{2}}` },
  { id: 'one-prop', group: 'Paired or one-group designs', name: 'One proportion against a known value', power: true, common: COMMON_TEST,
    fields: [['p0', 'Known or expected proportion (%)', '50', ''], ['p1', 'Proportion you expect to find (%)', '62', '']],
    formula: texd`n = \frac{\left[z_{1-\alpha/2}\sqrt{p_0 q_0} + z_{1-\beta}\sqrt{p_1 q_1}\right]^{2}}{(p_1 - p_0)^{2}}` },
  { id: 'corr', group: 'Relationships and several groups', name: 'Correlation', power: true, common: COMMON_TEST,
    fields: [['r', 'Correlation to detect', '0.3', '0.1 small, 0.3 medium, 0.5 large (Cohen)']],
    formula: texd`n = \left(\frac{z_{1-\alpha/2} + z_{1-\beta}}{\tfrac{1}{2}\ln\frac{1+r}{1-r}}\right)^{2} + 3` },
  { id: 'anova', group: 'Relationships and several groups', name: 'Three or more means (one-way ANOVA)', power: true, common: ['alpha', 'power'],
    fields: [['k', 'Number of groups', '3', ''], ['f', "Effect size (Cohen's f)", '0.25', '0.10 small, 0.25 medium, 0.40 large; f = SD of the group means / SD within groups']],
    formula: [texd`\lambda = f^{2} N`, texd`1 - \beta = P\!\left(F_{k-1,\,N-k,\,\lambda} > F_{1-\alpha;\,k-1,\,N-k}\right)`] },
  { id: 'regression', group: 'Relationships and several groups', name: 'Multiple linear regression (R²)', common: ['alpha', 'power'],
    fields: [['predictors', 'Number of predictors', '4', ''], ['r2', 'Expected R² (%)', '10', 'Share of variance the predictors explain']],
    formula: [texd`f^{2} = \frac{R^{2}}{1 - R^{2}}`, texd`\lambda = f^{2} N, \quad F_{p,\,N-p-1}`] },
  { id: 'survival', group: 'Clinical trials', name: 'Survival: log-rank test (hazard ratio)', ratio: true, common: COMMON_TEST,
    fields: [['hr', 'Hazard ratio to detect', '0.7', ''], ['pe', 'Probability of the event during follow-up (%)', '40', 'Across both groups; turns events into participants']],
    formula: [texd`D = \frac{(z_{1-\alpha/2} + z_{1-\beta})^{2}}{a\,(1-a)\,(\ln HR)^{2}}`, texd`N = \frac{D}{P(\text{event})}`] },
  { id: 'ni-props', group: 'Clinical trials', name: 'Non-inferiority: proportions', ratio: true, common: ['alpha1', 'power'], ratioLabel: 'New treatment per control',
    fields: [['pC', 'Success with the control (%)', '85', ''], ['pT', 'Success with the new treatment (%)', '85', 'Usually assumed equal to the control'], ['m', 'Non-inferiority margin (percentage points)', '10', 'The largest loss of success you would accept']],
    formula: texd`n_C = \frac{(z_{1-\alpha} + z_{1-\beta})^{2}\,\left[p_T q_T / r + p_C q_C\right]}{(p_T - p_C + \delta)^{2}}` },
  { id: 'ni-means', group: 'Clinical trials', name: 'Non-inferiority: means', ratio: true, common: ['alpha1', 'power'], ratioLabel: 'New treatment per control',
    fields: [['sd', 'SD', '10', ''], ['diff', 'True difference, new minus control', '0', 'Usually 0; higher is better'], ['m', 'Non-inferiority margin', '4', 'Same units as the outcome']],
    formula: texd`n_C = \frac{(1 + 1/r)\,\sigma^{2}\,(z_{1-\alpha} + z_{1-\beta})^{2}}{(\Delta + \delta)^{2}}` },
];
const byId = Object.fromEntries(DESIGNS.map((d) => [d.id, d]));

/* ------------------------------------------------------------- compute ---- */

function compute(design, v, c) {
  const err = (m) => ({ error: m });
  const alpha = c.alpha, sides = c.sides, power = c.power, ratio = c.ratio;
  const adj = (n) => S.adjustN(n, { designEffect: c.de, nonResponse: c.nr });
  const ok01 = (x) => x > 0 && x < 1;
  const twoGroupOut = (n1raw, n2raw, label1, label2, extra = {}) => {
    const n1 = up(adj(n1raw)), n2 = up(adj(n2raw));
    return { n1raw, n2raw, n1, n2, total: n1 + n2, label1, label2, ...extra };
  };
  switch (design.id) {
    case 'prop': {
      const p = pc(v.p), d = v.rel ? num(v.d) / 100 : pc(v.d);
      if (!ok01(p)) return err('Enter the expected prevalence between 0 and 100%.');
      if (!(d > 0) || (!v.rel && d >= Math.min(p, 1 - p) * 2)) return err('Enter a precision above 0 and well below the prevalence.');
      const r = S.estimateProportion({ p, d, relative: !!v.rel, conf: c.conf, N: c.N });
      return { single: up(adj(r.n)), raw: r.n, n0: r.n0, steps: [['z', fixed(r.z, 3)], ['p', fixed(p, 3)], ['d', fixed(r.abs, 4)], ['n₀', fixed(r.n0, 1)], Number.isFinite(c.N) ? ['After population correction', fixed(r.n, 1)] : null],
        sentence: `Assuming a prevalence of ${pctTxt(p)} [INSERT: source of this estimate], a sample of ${count(up(r.n))} gives a ${Math.round(c.conf * 100)}% confidence interval of ±${v.rel ? `${sig(100 * d, 3)}% of the prevalence (±${sig(100 * r.abs, 3)} percentage points)` : `${sig(100 * d, 3)} percentage points`}${Number.isFinite(c.N) ? ` in a population of ${count(c.N)}` : ''}.`, refs: ['lwanga', 'charan'] };
    }
    case 'mean': {
      const sd = num(v.sd), d = num(v.d);
      if (!(sd > 0 && d > 0)) return err('Enter an SD and a precision above 0.');
      const r = S.estimateMean({ sd, d, conf: c.conf, N: c.N });
      return { single: up(adj(r.n)), raw: r.n, steps: [['z', fixed(r.z, 3)], ['n₀', fixed(r.n0, 1)], Number.isFinite(c.N) ? ['After population correction', fixed(r.n, 1)] : null],
        sentence: `Assuming an SD of ${sig(sd, 4)} [INSERT: source], a sample of ${count(up(r.n))} estimates the mean within ±${sig(d, 4)} with ${Math.round(c.conf * 100)}% confidence.`, refs: ['lwanga', 'charan'] };
    }
    case 'diag': {
      const se = pc(v.se), sp = pc(v.sp), prev = pc(v.prev), d = pc(v.d);
      if (![se, sp, prev].every(ok01) || !(d > 0 && d < 0.5)) return err('Enter sensitivity, specificity and prevalence between 0 and 100%, and a precision above 0.');
      const r = S.sensSpec({ se, sp, prev, d, conf: c.conf });
      return { single: up(adj(r.n)), raw: r.n, steps: [['n for sensitivity', fixed(r.nSe, 1)], ['n for specificity', fixed(r.nSp, 1)], ['People with the condition needed', fixed(r.cases, 1)]],
        sentence: `To estimate a sensitivity of ${pctTxt(se)} and a specificity of ${pctTxt(sp)} [INSERT: source] each within ±${sig(100 * d, 3)} percentage points (${Math.round(c.conf * 100)}% confidence), with a prevalence of ${pctTxt(prev)} in the study population, ${count(up(r.n))} participants are needed (Buderer's method).`, refs: ['buderer'] };
    }
    case 'two-props': case 'cc': case 'cohort': {
      let r, p1, p2, what;
      if (design.id === 'two-props') {
        p1 = pc(v.p1); p2 = pc(v.p2);
        if (!ok01(p1) || !ok01(p2) || p1 === p2) return err('Enter two different proportions between 0 and 100%.');
        r = S.twoProportions({ p1, p2, alpha, power, sides, ratio });
        what = `a difference between ${pctTxt(p1)} and ${pctTxt(p2)} [INSERT: source]`;
      } else if (design.id === 'cc') {
        const p0 = pc(v.p0), or = num(v.or);
        if (!ok01(p0) || !(or > 0) || or === 1) return err('Enter the exposure among controls (0 to 100%) and an odds ratio other than 1.');
        r = S.caseControl({ p0, or, alpha, power, sides, ratio }); p1 = r.p1; p2 = p0;
        what = `an odds ratio of ${sig(or, 3)}, with ${pctTxt(p0)} of controls exposed [INSERT: source] (${pctTxt(p1)} expected among cases)`;
      } else {
        const p0 = pc(v.p0), rr = num(v.rr);
        if (!ok01(p0) || !(rr > 0) || rr === 1 || rr * p0 >= 1) return err('Enter the risk in the unexposed (0 to 100%) and a risk ratio other than 1 that keeps the risk below 100%.');
        r = S.cohortRR({ p0, rr, alpha, power, sides, ratio }); p1 = r.p1; p2 = p0;
        what = `a risk ratio of ${sig(rr, 3)} with a risk of ${pctTxt(p0)} in the unexposed [INSERT: source]`;
      }
      const n1raw = c.cc ? r.n1cc : r.n1;
      const lab = design.id === 'cc' ? ['Cases', 'Controls'] : design.id === 'cohort' ? ['Exposed', 'Unexposed'] : ['Group 1', 'Group 2'];
      const out = twoGroupOut(n1raw, ratio * n1raw, lab[0], lab[1]);
      return { ...out, steps: [['z for α', fixed(r.za, 3)], ['z for power', fixed(r.zb, 3)], ['p₁', fixed(p1, 4)], ['p₂', fixed(p2, 4)], ['p̄', fixed(r.pbar, 4)], ['n₁ without correction', fixed(r.n1, 1)], ['n₁ with continuity correction', fixed(r.n1cc, 1)]],
        powerFn: (n1) => S.twoProportionsPower({ p1, p2, n1, n2: ratio * n1, alpha, sides, cc: c.cc }), base: n1raw,
        sentence: `To detect ${what} with ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level, ${nIn(up(n1raw), lab[0])} and ${nIn(up(ratio * n1raw), lab[1])} are needed (Fleiss's formula${c.cc ? ' with continuity correction' : ''}).`,
        refs: ['fleiss', 'charan'] };
    }
    case 'two-means': {
      const diff = num(v.diff), sd = num(v.sd);
      if (!(sd > 0) || !diff) return err('Enter a difference other than 0 and an SD above 0.');
      const r = S.twoMeans({ sd, diff, alpha, power, sides, ratio });
      const out = twoGroupOut(r.n1t, r.n2t, 'Group 1', 'Group 2');
      return { ...out, steps: [['z for α', fixed(r.za, 3)], ['z for power', fixed(r.zb, 3)], ["Cohen's d", fixed(Math.abs(diff) / sd, 3)], ['n₁, normal formula', fixed(r.n1, 1)], ['n₁, exact t-test', fixed(r.n1t, 1)]],
        powerFn: (n1) => S.twoMeansPower({ sd, diff, n1, n2: ratio * n1, alpha, sides }), base: r.n1t,
        sentence: `To detect a difference of ${sig(Math.abs(diff), 4)} in means, assuming an SD of ${sig(sd, 4)} [INSERT: source] (Cohen's d = ${fixed(Math.abs(diff) / sd, 2)}), with ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level, ${count(up(r.n1t))} participants are needed in group 1 and ${count(up(r.n2t))} in group 2 (t-test).`,
        refs: ['julious', 'charan'] };
    }
    case 'paired-means': case 'one-mean': {
      const diff = num(v.diff), sd = num(v.sd);
      if (!(sd > 0) || !diff) return err('Enter a difference other than 0 and an SD above 0.');
      const r = S.oneMean({ sd, diff, alpha, power, sides });
      const n = up(adj(r.nt));
      const paired = design.id === 'paired-means';
      return { single: n, raw: r.nt, unit: paired ? 'pairs' : 'participants', steps: [['z for α', fixed(r.za, 3)], ['z for power', fixed(r.zb, 3)], ['n, normal formula', fixed(r.n, 1)], ['n, exact t-test', fixed(r.nt, 1)]],
        powerFn: (n1) => S.oneMeanPower({ sd, diff, n: n1, alpha, sides }), base: r.nt,
        sentence: paired
          ? `To detect a mean change of ${sig(Math.abs(diff), 4)}, assuming an SD of the changes of ${sig(sd, 4)} [INSERT: source], with ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level, ${count(up(r.nt))} pairs are needed (paired t-test).`
          : `To detect a difference of ${sig(Math.abs(diff), 4)} from the reference value, assuming an SD of ${sig(sd, 4)} [INSERT: source], with ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level, ${count(up(r.nt))} participants are needed (one-sample t-test).`,
        refs: ['julious'] };
    }
    case 'paired-props': {
      const p10 = pc(v.p10), p01 = pc(v.p01);
      if (!(p10 >= 0 && p01 >= 0 && p10 + p01 > 0 && p10 + p01 <= 1) || p10 === p01) return err('Enter two different discordant percentages that add up to 100% or less.');
      const r = S.pairedProportions({ p10, p01, alpha, power, sides });
      return { single: up(adj(r.n)), raw: r.n, unit: 'pairs', steps: [['ψ (discordant)', fixed(r.psi, 3)], ['δ', fixed(r.delta, 3)], ['n', fixed(r.n, 1)]],
        sentence: `Assuming ${pctTxt(p10)} and ${pctTxt(p01)} of pairs discordant in each direction [INSERT: source], ${count(up(r.n))} pairs give ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level for McNemar's test (Connor's method).`, refs: ['connor'] };
    }
    case 'one-prop': {
      const p0 = pc(v.p0), p1 = pc(v.p1);
      if (!ok01(p0) || !ok01(p1) || p0 === p1) return err('Enter two different proportions between 0 and 100%.');
      const r = S.oneProportion({ p0, p1, alpha, power, sides });
      return { single: up(adj(r.n)), raw: r.n, steps: [['z for α', fixed(r.za, 3)], ['z for power', fixed(r.zb, 3)], ['n', fixed(r.n, 1)]],
        powerFn: (n) => S.oneProportionPower({ p0, p1, n, alpha, sides }), base: r.n,
        sentence: `To detect a proportion of ${pctTxt(p1)} against an expected ${pctTxt(p0)} [INSERT: source] with ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level, ${count(up(r.n))} participants are needed.`, refs: ['lwanga'] };
    }
    case 'corr': {
      const rr = num(v.r);
      if (!(Math.abs(rr) > 0 && Math.abs(rr) < 1)) return err('Enter a correlation between −1 and 1, not 0.');
      const r = S.correlation({ r: rr, alpha, power, sides });
      return { single: up(adj(r.n)), raw: r.n, steps: [['Fisher z of r', fixed(r.C, 4)], ['n', fixed(r.n, 1)]],
        powerFn: (n) => S.correlationPower({ r: rr, n, alpha, sides }), base: r.n,
        sentence: `To detect a correlation of ${sig(rr, 3)} [INSERT: source or rationale] with ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level, ${count(up(r.n))} participants are needed.`, refs: ['bonettWright'] };
    }
    case 'anova': {
      const k = num(v.k), f = num(v.f);
      if (!(Number.isInteger(k) && k >= 2 && k <= 20) || !(f > 0)) return err('Enter 2 to 20 groups and an effect size above 0.');
      const r = S.anovaN({ f, k, alpha, power });
      const per = up(adj(r.n));
      return { single: per * k, perGroup: per, raw: r.total, k, steps: [['n per group (continuous)', fixed(r.n, 2)], ['Total', fixed(r.total, 1)]],
        powerFn: (n) => S.anovaPower({ f, k, n, alpha }), base: r.n, perGroupCurve: true,
        sentence: `For a one-way ANOVA of ${k} groups with an effect size f = ${sig(f, 3)} [INSERT: source or rationale], ${count(up(r.n))} participants per group (${count(up(r.n) * k)} in total) give ${Math.round(power * 100)}% power at a ${sig(100 * alpha, 2)}% significance level.`, refs: ['cohen'] };
    }
    case 'regression': {
      const p = num(v.predictors), r2 = pc(v.r2);
      if (!(Number.isInteger(p) && p >= 1 && p <= 50) || !ok01(r2)) return err('Enter 1 to 50 predictors and an R² between 0 and 100%.');
      const r = S.regressionN({ r2, predictors: p, alpha, power });
      return { single: up(adj(r.N)), raw: r.N, steps: [['f²', fixed(r.f2, 4)], ['N', fixed(r.N, 1)]],
        sentence: `For a linear regression with ${p} predictor${p === 1 ? '' : 's'} explaining ${pctTxt(r2)} of the variance (f² = ${fixed(r.f2, 3)}) [INSERT: source or rationale], ${count(up(r.N))} participants give ${Math.round(power * 100)}% power at a ${sig(100 * alpha, 2)}% significance level for the overall F test.`, refs: ['cohen'] };
    }
    case 'survival': {
      const hr = num(v.hr), pe = pc(v.pe);
      if (!(hr > 0) || hr === 1 || !ok01(pe)) return err('Enter a hazard ratio other than 1 and an event probability between 0 and 100%.');
      const r = S.survivalEvents({ hr, alpha, power, sides, ratio, pEvent: pe });
      const N = up(adj(r.total));
      const n1 = up(N / (1 + ratio));
      return { n1, n2: up(N - n1), total: N, label1: 'Group 1', label2: 'Group 2', events: up(r.events), raw: r.total,
        steps: [['Events needed', fixed(r.events, 1)], ['Participants (events ÷ event probability)', fixed(r.total, 1)]],
        sentence: `To detect a hazard ratio of ${sig(hr, 3)} [INSERT: source] with ${Math.round(power * 100)}% power at a ${sides === 2 ? 'two' : 'one'}-sided ${sig(100 * alpha, 2)}% significance level, ${count(up(r.events))} events are needed (Schoenfeld's method); with an event probability of ${pctTxt(pe)} during follow-up, ${count(up(r.total))} participants are needed.`, refs: ['schoenfeld'] };
    }
    case 'ni-props': {
      const pC = pc(v.pC), pT = pc(v.pT), m = pc(v.m);
      if (!ok01(pC) || !ok01(pT) || !(m > 0) || pT - pC + m <= 0) return err('Enter success rates between 0 and 100% and a margin above 0 that the expected difference does not exceed.');
      const r = S.nonInferiorityProportions({ pT, pC, margin: m, alpha: c.alpha1, power, ratio });
      const out = twoGroupOut(r.nT, r.nC, 'New treatment', 'Control');
      return { ...out, steps: [['z for one-sided α', fixed(r.za, 3)], ['z for power', fixed(r.zb, 3)], ['Control group n', fixed(r.nC, 1)]],
        sentence: `Assuming a success rate of ${pctTxt(pC)} with the control and ${pctTxt(pT)} with the new treatment [INSERT: source], ${nIn(up(r.nT), 'New treatment')} and ${nIn(up(r.nC), 'Control')} give ${Math.round(power * 100)}% power to show non-inferiority with a margin of ${sig(100 * m, 3)} percentage points at a one-sided ${sig(100 * c.alpha1, 2)}% significance level.`, refs: ['julious', 'chow'] };
    }
    case 'ni-means': {
      const sd = num(v.sd), diff = num(v.diff), m = num(v.m);
      if (!(sd > 0) || !(m > 0) || !Number.isFinite(diff) || diff + m <= 0) return err('Enter an SD and a margin above 0; the true difference plus the margin must be above 0.');
      const r = S.nonInferiorityMeans({ sd, diff, margin: m, alpha: c.alpha1, power, ratio });
      const out = twoGroupOut(r.nT, r.nC, 'New treatment', 'Control');
      return { ...out, steps: [['z for one-sided α', fixed(r.za, 3)], ['z for power', fixed(r.zb, 3)], ['Control group n', fixed(r.nC, 1)]],
        sentence: `Assuming an SD of ${sig(sd, 4)} [INSERT: source] and a true difference of ${sig(diff, 4)}, ${nIn(up(r.nT), 'New treatment')} and ${nIn(up(r.nC), 'Control')} give ${Math.round(power * 100)}% power to show non-inferiority with a margin of ${sig(m, 4)} at a one-sided ${sig(100 * c.alpha1, 2)}% significance level.`, refs: ['julious'] };
    }
    default: return err('Unknown design');
  }
}

/* --------------------------------------------------------------- page ----- */

function Field({ spec, value, onInput }) {
  const [key, label, , hint] = spec;
  if (!label) return null;
  return <NumberField label={label} value={value} onInput={(v) => onInput(key, v)} hint={hint || undefined} />;
}

export default function SampleSizeTool() {
  const [id, setId] = useState('prop');
  const design = byId[id];
  const [vals, setVals] = useState(() => Object.fromEntries(DESIGNS.map((d) => [d.id, Object.fromEntries(d.fields.map((f) => [f[0], f[2] ?? '']))])));
  const [conf, setConf] = useState('95');
  const [alphaS, setAlpha] = useState('5');
  const [alpha1S, setAlpha1] = useState('2.5');
  const [sides, setSides] = useState(2);
  const [powerS, setPower] = useState('80');
  const [ratioS, setRatio] = useState('1');
  const [ccOn, setCc] = useState(true);
  const [nrS, setNr] = useState('10');
  const [cluster, setCluster] = useState('none');
  const [deS, setDe] = useState('2');
  const [mS, setM] = useState('20');
  const [iccS, setIcc] = useState('0.05');
  const [popS, setPop] = useState('');
  const [rel, setRel] = useState(false);
  const pickId = useId('design');

  const v = { ...vals[id], rel };
  const setV = (key, value) => setVals({ ...vals, [id]: { ...vals[id], [key]: value } });
  const de = cluster === 'de' ? num(deS) : cluster === 'icc' ? S.designEffect(num(mS), num(iccS)) : 1;
  const c = {
    conf: num(conf) / 100, alpha: num(alphaS) / 100, alpha1: num(alpha1S) / 100, sides, power: num(powerS) / 100,
    ratio: design.ratio ? num(ratioS) : 1, cc: ccOn, nr: Math.max(0, num(nrS) / 100 || 0), de: Number.isFinite(de) && de >= 1 ? de : NaN,
    N: num(popS) > 0 ? num(popS) : Infinity,
  };
  let res;
  if (!(c.de >= 1)) res = { error: 'The design effect must be 1 or more: check the cluster size and ICC.' };
  else if (!(c.nr >= 0 && c.nr < 0.9)) res = { error: 'Enter expected non-response or loss from 0 to 89%.' };
  else if (design.estimate ? !(c.conf > 0.5 && c.conf < 1) : !(c.alpha > 0 && c.alpha < 0.5 && c.power > 0.5 && c.power < 1)) res = { error: 'Check the confidence level, significance level and power.' };
  else if (design.ratio && !(c.ratio > 0 && c.ratio <= 10)) res = { error: 'Enter an allocation ratio between 0.1 and 10.' };
  else res = compute(design, v, c);

  const groups = [...new Set(DESIGNS.map((d) => d.group))];
  const adjText = [c.de > 1 ? `a design effect of ${sig(c.de, 3)}` : '', c.nr > 0 ? `${sig(100 * c.nr, 3)}% ${design.estimate ? 'non-response' : 'loss to follow-up or non-response'}` : ''].filter(Boolean).join(' and ');
  const finalTxt = res && !res.error ? (res.single !== undefined
    ? `${count(res.single)} ${res.unit || 'participants'}${res.perGroup ? ` (${count(res.perGroup)} per group)` : ''}`
    : `${nIn(res.n1, res.label1)} and ${nIn(res.n2, res.label2)} (${count(res.total)} in total)`) : '';
  const sentence = res && !res.error ? `${res.sentence}${adjText ? ` Allowing for ${adjText}, ${finalTxt} will be ${design.estimate ? 'sampled' : 'recruited'}.` : ''}` : '';

  // Power curve around the answer.
  let curve = null;
  if (res && !res.error && res.powerFn && res.base) {
    const lo = Math.max(design.id === 'anova' ? 2.2 : 3, res.base * 0.3), hi = res.base * 2.2;
    const xs = Array.from({ length: 60 }, (_, i) => lo + ((hi - lo) * i) / 59);
    curve = { xs, ys: xs.map((x) => res.powerFn(x)), mark: { x: res.base, y: c.power, label: `${Math.round(c.power * 100)}% at ${count(up(res.base))}` } };
  }

  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Design' }]}
        title="Sample Size and Power"
        lede="Seventeen designs, each with its formula and source, adjustments for clustering and non-response, a power curve and a sentence for your protocol." />
      <div class="split">
        <section class="panel stack" aria-labelledby="ss-in">
          <h2 id="ss-in">Study design</h2>
          <div class="field">
            <label for={pickId}>What will the study do?</label>
            <select id={pickId} value={id} onChange={(e) => setId(e.currentTarget.value)}>
              {groups.map((g) => <optgroup label={g}>{DESIGNS.filter((d) => d.group === g).map((d) => <option value={d.id}>{d.name}</option>)}</optgroup>)}
            </select>
          </div>
          <div class="fields">{design.fields.map((f) => <Field spec={f} value={v[f[0]]} onInput={setV} />)}</div>
          {id === 'prop' ? <Seg label="Precision is" value={rel ? 'rel' : 'abs'} onChange={(x) => { setRel(x === 'rel'); setV('d', x === 'rel' ? '20' : '5'); }} options={[{ value: 'abs', label: 'Absolute (± points)' }, { value: 'rel', label: 'Relative (± % of p)' }]} /> : null}
          {id === 'prop' && rel ? <p class="small">Relative precision: 20% of a prevalence of 30% is ±6 percentage points.</p> : null}
          <div class="fields">
            {design.estimate ? <SelectField label="Confidence level" value={conf} onChange={setConf} options={['90', '95', '99'].map((x) => ({ value: x, label: `${x}%` }))} /> : null}
            {design.common?.includes('alpha') ? <SelectField label="Significance level (α)" value={alphaS} onChange={setAlpha} options={['10', '5', '1'].map((x) => ({ value: x, label: `${x}%` }))} /> : null}
            {design.common?.includes('alpha1') ? <SelectField label="One-sided α" value={alpha1S} onChange={setAlpha1} options={['5', '2.5', '1'].map((x) => ({ value: x, label: `${x}%` }))} /> : null}
            {design.common?.includes('power') ? <SelectField label="Power (1 − β)" value={powerS} onChange={setPower} options={['80', '85', '90', '95'].map((x) => ({ value: x, label: `${x}%` }))} /> : null}
            {design.ratio ? <NumberField label={design.ratioLabel || 'Group 2 per group 1'} value={ratioS} onInput={setRatio} hint="1 for equal groups" /> : null}
          </div>
          {design.common?.includes('sides') ? <Seg label="Test" value={sides} onChange={setSides} options={[{ value: 2, label: 'Two-sided' }, { value: 1, label: 'One-sided' }]} /> : null}
          {design.cc ? <Seg label="Continuity correction" value={ccOn ? 'y' : 'n'} onChange={(x) => setCc(x === 'y')} options={[{ value: 'y', label: 'Fleiss, with correction' }, { value: 'n', label: 'Without' }]} /> : null}
          <h3 style="margin-top:6px">Adjustments</h3>
          <div class="fields">
            <NumberField label="Non-response or loss (%)" value={nrS} onInput={setNr} hint="n ÷ (1 − loss)" />
            {design.estimate ? <NumberField label="Population size (optional)" value={popS} onInput={setPop} hint="Only for a small, finite population" inputMode="numeric" /> : null}
          </div>
          <Seg label="Cluster sampling or randomisation" value={cluster} onChange={setCluster} options={[{ value: 'none', label: 'No' }, { value: 'icc', label: 'Cluster size and ICC' }, { value: 'de', label: 'Design effect' }]} />
          {cluster === 'icc' ? <div class="fields"><NumberField label="People per cluster (m)" value={mS} onInput={setM} /><NumberField label="ICC (ρ)" value={iccS} onInput={setIcc} hint="Often 0.01 to 0.1" /></div> : null}
          {cluster === 'de' ? <div class="fields"><NumberField label="Design effect" value={deS} onInput={setDe} hint="2 is a common assumption in cluster surveys" /></div> : null}
        </section>

        <section class="panel stack" aria-labelledby="ss-out" aria-live="polite">
          <h2 id="ss-out">Sample size</h2>
          {res?.error ? <Callout kind="warn" mark="Check"><p>{res.error}</p></Callout> : res ? (
            <>
              <div class="result">
                <div class="big">{res.single !== undefined ? count(res.single) : count(res.total)}</div>
                <div class="sub">{res.single !== undefined ? `${res.unit || 'participants'}${res.perGroup ? `, ${count(res.perGroup)} in each of ${res.k} groups` : ''}` : `${nIn(res.n1, res.label1)} + ${nIn(res.n2, res.label2)}`}{c.de > 1 || c.nr > 0 ? ' · after adjustments' : ''}</div>
                {res.events ? <p class="small" style="margin:8px 0 0">{count(res.events)} events needed.</p> : null}
              </div>
              <Stats items={[...(res.steps || []).filter(Boolean), c.de > 1 ? ['Design effect', fixed(c.de, 2)] : null, c.nr > 0 ? ['Non-response allowance', `${sig(100 * c.nr, 3)}%`] : null]} />
              {curve ? <figure style="margin:0"><LinePlot xs={curve.xs} ys={curve.ys} target={c.power} mark={curve.mark} xLabel={res.perGroupCurve ? 'Participants per group' : res.n1 !== undefined ? (/^group/i.test(res.label1) ? `Participants in ${res.label1.toLowerCase()}` : `Number of ${res.label1.toLowerCase()}`) : res.unit === 'pairs' ? 'Pairs' : 'Participants'} label="Power against sample size" /><figcaption class="figcap">Power against sample size before adjustments; the dashed line is your target.</figcaption></figure> : null}
              <Report text={sentence} label="For your protocol" />
              <Callout mark="Cite">
                <p>Replace each [INSERT] with the study or pilot your assumptions come from. Reviewers and ethics committees look for it.</p>
              </Callout>
            </>
          ) : null}
        </section>
      </div>
      <section class="panel prose" style="margin-top:18px" aria-labelledby="ss-how">
        <h2 id="ss-how">Formula</h2>
        <div class="mathrow">{[].concat(design.formula).map((f) => <MathView block html={f} />)}</div>
        <AtLevel min="intermediate">
          <p>Adjustments come last: <MathView html={tex`n_{\text{final}} = n \times DE \,/\, (1 - \text{loss})`} />, with <MathView html={tex`DE = 1 + (m - 1)\rho`} /> for clusters of size m and intracluster correlation ρ (Killip and colleagues). Each group is rounded up to a whole number at the end.</p>
          {['two-means', 'paired-means', 'one-mean'].includes(id) ? <p>The normal formula slightly underestimates n for small samples; the answer shown comes from the exact t-test power (noncentral t), as G*Power computes it.</p> : null}
          {design.cc ? <p>Fleiss's continuity correction gives a more conservative n and matches OpenEpi's "Fleiss with CC" output.</p> : null}
        </AtLevel>
        <h3>References</h3>
        <Refs refs={REFS} ids={[...new Set([...(res && !res.error ? res.refs : []), ...(cluster !== 'none' ? ['killip'] : []), 'charan'])]} />
      </section>
    </div>
  );
}
