/* Runs every generated Python script on the example data and compares its numbers with the app's
 * engine. Needs Python 3 with numpy, scipy, pandas, statsmodels, pingouin, lifelines and
 * scikit-posthocs.   npm run test:code
 * R scripts are not run here (no R in the build environment); they follow the same steps.
 */
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scriptFor, DATA_FILE, datasetCsv } from '../../engine/codegen.js';
import { exampleCsv, exampleTbCsv, exampleAgreementCsv } from '../../engine/examples.js';
import { readDataset, splitBy, completeRows, crossTab, isMissing } from '../../engine/data.js';
import { mean, quantile, sortNum, shapiroWilk } from '../../engine/describe.js';
import { tTwoSample, tTwoSampleSummary, tOneSample, tPaired, anova, welchAnova, rmAnova } from '../../engine/compare.js';
import { mannWhitney, wilcoxonSignedRank, kruskalWallis, friedman } from '../../engine/nonparam.js';
import { chiSquareTest, mcnemar, cochranQ } from '../../engine/tables.js';
import { binomialTest, twoProportions } from '../../engine/proportions.js';
import { pearson, spearman, kendall } from '../../engine/correlate.js';
import { adjust } from '../../engine/multiplicity.js';
import { buildDesign, ols, logistic } from '../../engine/regression.js';
import { logRank, cox } from '../../engine/survival.js';
import { cohenKappa, fleissKappa, icc, blandAltman, cronbach } from '../../engine/agreement.js';
import { binaryEffect, continuousEffect, proportionEffect, reportedEffect, pool, subgroups } from '../../engine/meta.js';

const here = dirname(fileURLToPath(import.meta.url));
const DS = { A: readDataset(exampleCsv()), T: readDataset(exampleTbCsv()), G: readDataset(exampleAgreementCsv()) };
const col = (k, n) => DS[k].columns.find((c) => c.name === n);
const nums = (k, n) => col(k, n).numbers.filter((v) => v !== null && Number.isFinite(v));
const by = (k, y, g, lv) => { const sp = splitBy(col(k, y), col(k, g)); return sp.groups[sp.labels.indexOf(lv)]; };
const cases = [];
const add = (name, data, spec, checks) => cases.push({ name, data, spec, checks });

/* ------------------------------------------------------------- cases --- */
{
  const x = nums('A', 'Hb_registration'), s = sortNum(x);
  add('describe', 'A', { kind: 'describe', numeric: ['Hb_registration'], categorical: ['Residence'], group: null, qtype: 6 },
    [['x.mean()', mean(x)], ['q1', quantile(s, 0.25, 6)], ['q3', quantile(s, 0.75, 6)], ['sw.pvalue', shapiroWilk(x).p, 1e-4]]);
  add('describe by group', 'A', { kind: 'describe', numeric: ['BMI'], categorical: ['IFA_adherence'], group: 'Residence', qtype: 7 }, [['len(d)', 120]]);
}
{
  const a = by('A', 'Hb_registration', 'Residence', 'Rural'), b = by('A', 'Hb_registration', 'Residence', 'Urban');
  const r = tTwoSample(a, b, { equalVar: false });
  add('Welch t', 'A', { kind: 't2', y: 'Hb_registration', g: 'Residence', levels: ['Rural', 'Urban'], equalVar: false }, [['res.pvalue', r.p], ['res.statistic', r.t]]);
  add('Student t', 'A', { kind: 't2', y: 'Hb_registration', g: 'Residence', levels: ['Rural', 'Urban'], equalVar: true }, [['res.pvalue', tTwoSample(a, b, { equalVar: true }).p]]);
  add('Mann-Whitney', 'A', { kind: 'mw', y: 'Hb_registration', g: 'Residence', levels: ['Rural', 'Urban'] }, [['res.pvalue', mannWhitney(a, b).p]]);
  const g1 = { label: 'A', n: 30, mean: 11.2, sd: 1.4 }, g2 = { label: 'B', n: 32, mean: 10.4, sd: 1.6 };
  add('t from summaries', null, { kind: 't2s', groups: [g1, g2], equalVar: false }, [['res.pvalue', tTwoSampleSummary(g1, g2, { equalVar: false }).p]]);
}
{
  add('one-sample t', 'A', { kind: 't1', y: 'Hb_registration', mu: 11 }, [['res.pvalue', tOneSample(nums('A', 'Hb_registration'), 11).p]]);
  add('one-sample Wilcoxon', 'A', { kind: 'w1', y: 'BMI', mu: 20 }, [['res.pvalue', wilcoxonSignedRank(nums('A', 'BMI'), null, { mu: 20 }).p]]);
  const { rows } = completeRows([col('A', 'Hb_registration'), col('A', 'Hb_3_months')]);
  const first = rows.map((r) => r[0]), second = rows.map((r) => r[1]);
  add('paired t', 'A', { kind: 'tp', a: 'Hb_registration', b: 'Hb_3_months' }, [['res.pvalue', tPaired(second, first).p], ['res.statistic', tPaired(second, first).t]]);
  add('paired Wilcoxon', 'A', { kind: 'wp', a: 'Hb_registration', b: 'Hb_3_months' }, [['res.pvalue', wilcoxonSignedRank(second, first).p]]);
}
{
  const levels = ['1', '2', '3'];
  const groups = levels.map((l) => by('A', 'Hb_registration', 'Trimester', l));
  add('one-way ANOVA', 'A', { kind: 'aov', y: 'Hb_registration', g: 'Trimester', levels, gNumeric: true }, [['res.pvalue', anova(groups).p], ['welch["p_unc"].iloc[0]', welchAnova(groups).p, 1e-8]]);
  const sp = splitBy(col('A', 'BMI'), col('A', 'Parity'));
  add('Kruskal-Wallis', 'A', { kind: 'kw', y: 'BMI', g: 'Parity', adjust: 'holm' }, [['res.pvalue', kruskalWallis(sp.groups).p]]);
  const cols = ['Hb_registration', 'Hb_3_months', 'Hb_6_months'];
  const { rows } = completeRows(cols.map((n) => col('A', n)));
  add('Friedman', 'A', { kind: 'fr', cols }, [['res.pvalue', friedman(rows).p]]);
  const rm = rmAnova(rows);
  add('repeated-measures ANOVA', 'A', { kind: 'rm', cols }, [['aov_rm["p_unc"].iloc[0]', rm.p, 1e-8], ['aov_rm["p_GG_corr"].iloc[0]', rm.pGG, 1e-6]]);
}
{
  const x = crossTab(col('A', 'Residence'), col('A', 'Anaemia_registration'));
  add('chi-square (2 x 2, Yates)', 'A', { kind: 'chi', r: 'Residence', c: 'Anaemia_registration' }, [['res.pvalue', chiSquareTest(x.table).pYates]]);
  const x2 = crossTab(col('A', 'Trimester'), col('A', 'IFA_adherence'));
  add('chi-square (3 x 2)', 'A', { kind: 'chi', r: 'Trimester', c: 'IFA_adherence' }, [['res.pvalue', chiSquareTest(x2.table).p]]);
  const t = [[12, 38], [5, 45]];
  add('chi-square typed', null, { kind: 'chiT', table: t, rows: ['Exposed', 'Not exposed'], cols: ['Yes', 'No'] }, [['res.pvalue', chiSquareTest(t).pYates]]);
  add('McNemar', null, { kind: 'mcn', a: 40, b: 12, c: 4, d: 44 }, [['exact.pvalue', mcnemar(12, 4).pExact], ['asym.pvalue', mcnemar(12, 4).p]]);
  const cq = ['Anaemia_registration', 'Anaemia_3_months', 'Anaemia_6_months'];
  const data = [];
  for (let i = 0; i < DS.A.n; i++) { const r = cq.map((n) => col('A', n).raw[i]); if (!r.some(isMissing)) data.push(r.map((v) => (v === 'Yes' ? 1 : 0))); }
  add("Cochran's Q", 'A', { kind: 'cq', cols: cq, positive: 'Yes' }, [['res.pvalue', cochranQ(data).p]]);
  add('one proportion', null, { kind: 'p1', x: 7, n: 20, p0: 0.5 }, [['res.pvalue', binomialTest(7, 20, 0.5).p]]);
  const tp = twoProportions(30, 100, 18, 105);
  add('two proportions', null, { kind: 'p2', x1: 30, n1: 100, x2: 18, n2: 105 }, [['ci[0]', tp.ci[0]], ['ci[1]', tp.ci[1]], ['res.pvalue', chiSquareTest([[30, 70], [18, 87]]).pYates]]);
}
{
  const { rows } = completeRows([col('A', 'Hb_registration'), col('A', 'BMI')]);
  const x = rows.map((r) => r[0]), y = rows.map((r) => r[1]);
  add('Pearson', 'A', { kind: 'cor', x: 'Hb_registration', y: 'BMI', method: 'pearson' }, [['res.pvalue', pearson(x, y).p], ['res.statistic', pearson(x, y).r]]);
  add('Spearman', 'A', { kind: 'cor', x: 'Hb_registration', y: 'BMI', method: 'spearman' }, [['res.pvalue', spearman(x, y).p, 1e-8]]);
  add('Kendall', 'A', { kind: 'cor', x: 'Hb_registration', y: 'BMI', method: 'kendall' }, [['res.pvalue', kendall(x, y).p, 1e-8]]);
  const items = [['Hb by residence', 0.012], ['Hb by trimester', 0.034], ['BMI by parity', 0.21], ['Age by adherence', 0.048], ['Hb change', 0.0004]].map(([label, p]) => ({ label, p }));
  for (const m of ['holm', 'bh', 'hochberg', 'by', 'bonferroni']) add(`adjust ${m}`, null, { kind: 'adj', items, method: m }, adjust(items.map((i) => i.p), m).map((v, i) => [`adjusted[${i}]`, v]));
}
{
  // Linear and logistic regression with a categorical predictor (reference Urban) and a numeric one.
  const ds = DS.A;
  const predictors = [{ name: 'Residence', type: 'categorical', values: col('A', 'Residence').raw, levels: ['Rural', 'Urban'], ref: 'Urban' }, { name: 'Age', type: 'numeric', values: col('A', 'Age').numbers }];
  const des = buildDesign({ y: col('A', 'Hb_registration').numbers, predictors });
  const fit = ols(des.X, des.y);
  add('linear regression', 'A', { kind: 'lm', y: 'Hb_registration', terms: [{ name: 'Residence', type: 'categorical', ref: 'Urban' }, { name: 'Age', type: 'numeric' }] },
    [['m.rsquared', fit.r2], ['m.params.iloc[1]', fit.coef[1].b], ['m.bse.iloc[2]', fit.coef[2].se]]);
  const yv = col('A', 'Anaemia_registration').raw.map((v) => (isMissing(v) ? null : v === 'Yes' ? 1 : 0));
  const des2 = buildDesign({ y: yv, predictors: [{ name: 'Residence', type: 'categorical', values: col('A', 'Residence').raw, levels: ['Rural', 'Urban'], ref: 'Urban' }, { name: 'BMI', type: 'numeric', values: col('A', 'BMI').numbers }] });
  const lg = logistic(des2.X, des2.y);
  add('logistic regression', 'A', { kind: 'logit', y: 'Anaemia_registration', event: 'Yes', terms: [{ name: 'Residence', type: 'categorical', ref: 'Urban' }, { name: 'BMI', type: 'numeric' }] },
    [['m.llr', lg.lr, 1e-7], ['m.params.iloc[1]', lg.coef[1].b, 1e-7]]);
  void ds;
}
{
  // Survival: TB cohort by HIV, Cox adjusted for age.
  const tc = col('T', 'Months'), ec = col('T', 'Unfavourable_outcome'), gc = col('T', 'HIV'), ac = col('T', 'Age');
  const t = [], e = [], g = [], age = [];
  for (let i = 0; i < DS.T.n; i++) { t.push(tc.numbers[i]); e.push(ec.numbers[i] === 1 ? 1 : 0); g.push(gc.raw[i]); age.push(ac.numbers[i]); }
  const lr = logRank(t, e, g);
  const X = g.map((v, i) => [age[i], v === 'Positive' ? 1 : 0]);
  const c = cox(X, t, e);
  add('survival', 'T', { kind: 'surv', time: 'Months', event: 'Unfavourable_outcome', eventLevel: '1', eventNumeric: true, group: 'HIV', groupLevels: gc.levels, groupNumeric: false, times: [3, 6], covars: [{ name: 'Age', type: 'numeric' }] },
    // lifelines stops at its default convergence tolerance, so Cox coefficients agree to about 4 significant figures.
    [['lr.p_value', lr.p, 1e-9], ['cph.params_["Age"]', c.coef[0].b, 2e-4], ['cph.params_["HIV_Positive"]', c.coef[1].b, 2e-4]]);
}
{
  const lev = ['No pallor', 'Some pallor', 'Severe pallor'];
  const a = col('G', 'Pallor_MO1').raw, b = col('G', 'Pallor_MO2').raw;
  const tab = lev.map((x) => lev.map((y) => a.filter((v, i) => v === x && b[i] === y).length));
  for (const w of ['none', 'linear', 'quadratic']) add(`kappa ${w}`, 'G', { kind: 'kappa', a: 'Pallor_MO1', b: 'Pallor_MO2', levels: lev, weights: w }, [['res.kappa', cohenKappa(tab, { weights: w }).kappa], ['res.std_kappa', cohenKappa(tab, { weights: w }).se, 1e-8]]);
  add('kappa typed', null, { kind: 'kappa', table: [[40, 9], [6, 45]], levels: ['Positive', 'Negative'], weights: 'none' }, [['res.kappa', cohenKappa([[40, 9], [6, 45]]).kappa]]);
  const cols = ['Pallor_MO1', 'Pallor_MO2', 'Pallor_MO3'];
  const counts = a.map((_, i) => lev.map((l) => cols.filter((cn) => col('G', cn).raw[i] === l).length));
  add("Fleiss' kappa", 'G', { kind: 'fleiss', cols }, [['kappa', fleissKappa(counts, { B: 10 }).kappa]]);
  const mc = ['MUAC_AWW1', 'MUAC_AWW2', 'MUAC_AWW3'];
  const { rows } = completeRows(mc.map((n) => col('G', n)));
  const o = icc(rows);
  for (const f of ['ICC1', 'ICC2', 'ICC3k']) add(`ICC ${f}`, 'G', { kind: 'icc', cols: mc, form: f }, [['row["ICC"].iloc[0]', o.forms.find((x) => x.id === f).icc, 1e-10]]);
  const pr = completeRows([col('G', 'Hb_HemoCue'), col('G', 'Hb_lab')]).rows;
  for (const scale of ['raw', 'percent', 'ratio']) {
    const ba = blandAltman(pr.map((r) => r[0]), pr.map((r) => r[1]), { scale });
    add(`Bland-Altman ${scale}`, 'G', { kind: 'ba', a: 'Hb_HemoCue', b: 'Hb_lab', scale }, [['bias', ba.bias], ['loa[0]', ba.loa[0]], ['loa[1]', ba.loa[1]], ['slope.pvalues[1]', ba.pSlope, 1e-8]]);
  }
  const items = ['Item1', 'Item2', 'Item3', 'Item4', 'Item5', 'Item6'];
  const ir = completeRows(items.map((n) => col('G', n))).rows;
  add("Cronbach's alpha", 'G', { kind: 'alpha', cols: items }, [['alpha', cronbach(ir).alpha]]);
}
{
  const bin = [['Study A', 18, 120, 30, 118, 'Facility'], ['Study B', 25, 210, 41, 205, 'Community'], ['Study C', 9, 64, 12, 60, 'Facility'], ['Study D', 0, 300, 4, 310, 'Community'],
    ['Study E', 0, 95, 0, 90, 'Facility'], ['Study F', 30, 150, 31, 148, 'Community'], ['Study G', 7, 80, 16, 82, 'Facility']];
  const studies = bin.map((r) => ({ name: r[0], vals: r.slice(1, 5), sub: r[5] }));
  for (const [measure, method, hksj] of [['OR', 'PM', true], ['RR', 'REML', false], ['RD', 'DL', true]]) {
    const eff = bin.map((r) => binaryEffect(r[1], r[2], r[3], r[4], measure)).filter((e) => !e.excluded);
    const f = pool(eff.map((e) => e.y), eff.map((e) => e.v), { method, hksj });
    add(`meta ${measure} ${method}`, null, { kind: 'meta', type: 'binary', measure, studies, model: 'random', method, hksj, subgroups: false },
      [['re', f.re, 1e-8], ['tau2', f.tau2, 1e-8, 1e-12], ['ci_re[0]', f.ciRE[0], 1e-8], ['Q', f.Q], ['pred_int[1]', f.pi[1], 1e-8], ['fe', f.fe]]);
  }
  const keep = bin.filter((r) => !binaryEffect(r[1], r[2], r[3], r[4], 'OR').excluded);
  const effs = keep.map((r) => binaryEffect(r[1], r[2], r[3], r[4], 'OR'));
  const sg = subgroups(effs.map((e) => e.y), effs.map((e) => e.v), keep.map((r) => r[5]), { method: 'PM', hksj: true });
  void sg;
  const cont = [[1.1, 0.9, 60, 0.6, 1.0, 58], [0.8, 1.2, 110, 0.5, 1.1, 105], [1.4, 1.0, 45, 0.7, 0.9, 47], [0.6, 0.8, 150, 0.5, 0.9, 148], [1.2, 1.3, 38, 0.4, 1.2, 40]];
  const ce = cont.map((r) => continuousEffect(...r, 'SMD'));
  const fc = pool(ce.map((e) => e.y), ce.map((e) => e.v), { method: 'PM', hksj: true });
  add('meta SMD', null, { kind: 'meta', type: 'continuous', measure: 'SMD', studies: cont.map((r, i) => ({ name: `S${i + 1}`, vals: r })), model: 'random', method: 'PM', hksj: true }, [['re', fc.re, 1e-8], ['ci_re[1]', fc.ciRE[1], 1e-8]]);
  const prop = [[120, 300], [210, 450], [55, 180], [300, 520], [0, 250]];
  const pe = prop.map((r) => proportionEffect(...r));
  const fp = pool(pe.map((e) => e.y), pe.map((e) => e.v), { method: 'REML', hksj: false });
  add('meta proportion', null, { kind: 'meta', type: 'proportion', measure: 'PLO', studies: prop.map((r, i) => ({ name: `P${i + 1}`, vals: r })), model: 'random', method: 'REML', hksj: false }, [['re', fp.re, 1e-8], ['tau2', fp.tau2, 1e-8]]);
  const rep = [[1.8, 1.2, 2.7], [2.3, 1.4, 3.9], [1.4, 0.9, 2.2], [2.9, 1.6, 5.3]];
  const re = rep.map((r) => reportedEffect(...r, { ratio: true }));
  const fr = pool(re.map((e) => e.y), re.map((e) => e.v), { method: 'DL' });
  add('meta reported fixed', null, { kind: 'meta', type: 'reported', measure: 'ratio', studies: rep.map((r, i) => ({ name: `R${i + 1}`, vals: r })), model: 'fixed', method: 'DL', hksj: false }, [['fe', fr.fe], ['ci_fe[0]', fr.ciFE[0]], ['Q', fr.Q]]);
}

/* ------------------------------------------- the same checks in R --- */
// Each Python check has an R twin; null where the R script reports the number differently.
function rExpr(spec, e) {
  const k = spec.kind;
  const direct = {
    'res.statistic': k === 'cor' ? 'res$estimate' : 'res$statistic', 'welch["p_unc"].iloc[0]': 'welch$p.value',
    'aov_rm["p_unc"].iloc[0]': 'summary(fit)[["Error: id:time"]][[1]][["Pr(>F)"]][1]', 'aov_rm["p_GG_corr"].iloc[0]': 'rm$anova_table[["Pr(>F)"]][1]',
    'exact.pvalue': 'exact$p.value', 'asym.pvalue': 'res$p.value', 'ci[0]': 'ci[["lower"]]', 'ci[1]': 'ci[["upper"]]',
    'm.rsquared': 'summary(m)$r.squared', 'm.params.iloc[1]': 'coef(m)[2]', 'm.bse.iloc[2]': 'coef(summary(m))[3, 2]', 'm.llr': 'm$null.deviance - m$deviance',
    'lr.p_value': 'lr$pvalue', 'cph.params_["Age"]': 'coef(cox)[2]', 'cph.params_["HIV_Positive"]': 'coef(cox)[1]',
    kappa: 'kappa', bias: 'bias', 'loa[0]': 'loa[1]', 'loa[1]': 'loa[2]', 'slope.pvalues[1]': 'summary(lm(diff ~ avg))$coefficients[2, 4]', alpha: 'res$total$raw_alpha',
    'x.mean()': 'mean(x)', q1: `unname(quantile(x, 0.25, type = ${spec.qtype || 6}))`, q3: `unname(quantile(x, 0.75, type = ${spec.qtype || 6}))`, 'sw.pvalue': 'shapiro.test(x)$p.value', 'len(d)': 'nrow(d)',
    re: 'c(res$b)', tau2: 'res$tau2', 'ci_re[0]': 'res$ci.lb', 'ci_re[1]': 'res$ci.ub', Q: 'res$QE', 'pred_int[1]': 'pred_int[2]',
    fe: spec.model === 'fixed' ? 'c(res$b)' : null, 'ci_fe[0]': spec.model === 'fixed' ? 'res$ci.lb' : null,
  };
  if (e === 'res.pvalue') return k === 'aov' ? 'summary(fit)[[1]][["Pr(>F)"]][1]' : k === 't2s' || k === 'cq' ? 'res[["p"]]' : 'res$p.value';
  if (e === 'res.kappa') return spec.weights === 'none' ? 'res$kappa' : 'res$weighted.kappa';
  if (e === 'res.std_kappa') return null;
  if (e === 'row["ICC"].iloc[0]') return `res$results$ICC[res$results$type == "${spec.form}"]`;
  const m = /^adjusted\[(\d+)\]$/.exec(e);
  if (m) return `adjusted[${Number(m[1]) + 1}]`;
  return e in direct ? direct[e] : undefined;
}
// metafor's iterative estimators and coxph stop at their own tolerances.
const rTol = (spec, e, rel) => (spec.kind === 'meta' && spec.method !== 'DL' && spec.model !== 'fixed' ? Math.max(rel, 5e-4) : spec.kind === 'surv' ? Math.max(rel, 1e-6) : rel);

/* -------------------------------------------------------------- run --- */
const root = mkdtempSync(join(tmpdir(), 'codegen-'));
const manifest = cases.map((c, i) => {
  const dir = join(root, `case${String(i).padStart(2, '0')}`);
  mkdirSync(dir);
  const sc = scriptFor(c.spec, 'py');
  if (!sc) throw new Error(`no generator for ${c.spec.kind}`);
  writeFileSync(join(dir, 'script.py'), sc.text);
  if (c.data) writeFileSync(join(dir, DATA_FILE), datasetCsv(DS[c.data]));
  const rs = scriptFor(c.spec, 'r');
  if (!rs?.text) throw new Error(`no R script for ${c.name}`);
  writeFileSync(join(dir, 'script.R'), rs.text);
  c.rchecks = c.checks.map(([e, want, rel = 1e-9, abs = 1e-12]) => {
    const r = rExpr(c.spec, e);
    if (r === undefined) throw new Error(`no R twin for ${c.name}: ${e}`);
    return r === null ? null : [r, want, rTol(c.spec, e, rel), abs];
  }).filter(Boolean);
  writeFileSync(join(dir, 'check.R'), [
    'zz <- file(tempfile(), "w"); sink(zz); sink(zz, type = "message")',
    '.err <- tryCatch({ source("script.R", local = globalenv()); NULL }, error = function(e) e)',
    'sink(type = "message"); sink(); close(zz)',
    'if (!is.null(.err)) cat("ERROR:", conditionMessage(.err), "\n") else {',
    ...c.rchecks.map(([r]) => `  cat("VAL", tryCatch(sprintf("%.17g", as.numeric(${r})[1]), error = function(e) "NA"), "\n")`),
    '}', ''].join('\n'));
  return { name: c.name, dir, exprs: c.checks.map((k) => k[0]) };
});
writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest));
const out = spawnSync('python3', ['-I', join(here, 'check.py'), join(root, 'manifest.json')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (out.status !== 0) { console.error(out.stderr); process.exit(1); }
const got = JSON.parse(out.stdout.trim().split('\n').pop());
let bad = 0, n = 0, nr = 0;
const close = (v, want, rel, abs) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v - want) <= abs + rel * Math.abs(want);
cases.forEach((c, i) => {
  const r = got[i];
  if (r.error) { bad++; console.log(`FAIL python ${c.name}: ${r.error.split('\n').slice(-3).join(' | ')}`); return; }
  c.checks.forEach(([expr, want, rel = 1e-9, abs = 1e-12], j) => {
    n++;
    if (!close(r.values[j], want, rel, abs)) { bad++; console.log(`FAIL python ${c.name}: ${expr} = ${r.values[j]}, app ${want}`); }
  });
  if (!c.checks.length) n++;
});
// R: run each script where R is installed; skip with a note otherwise.
const hasR = spawnSync('Rscript', ['--version'], { encoding: 'utf8' }).status === 0;
if (hasR) {
  cases.forEach((c, i) => {
    const dir = manifest[i].dir;
    const o = spawnSync('Rscript', ['--vanilla', 'check.R'], { cwd: dir, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    const lines = (o.stdout || '').split('\n');
    const err = lines.find((l) => l.startsWith('ERROR:'));
    if (o.status !== 0 || err) { bad++; console.log(`FAIL R ${c.name}: ${err || (o.stderr || '').split('\n').slice(-4).join(' | ')}`); return; }
    const vals = lines.filter((l) => l.startsWith('VAL ')).map((l) => Number(l.slice(4).trim()));
    c.rchecks.forEach(([expr, want, rel, abs], j) => {
      nr++;
      if (!close(vals[j], want, rel, abs)) { bad++; console.log(`FAIL R ${c.name}: ${expr} = ${vals[j]}, app ${want}`); }
    });
    if (!c.rchecks.length) nr++;
  });
}
console.log(`\n${cases.length} Python scripts, ${n} checks; ${hasR ? `${cases.length} R scripts, ${nr} checks` : 'R not installed: R scripts produced but not run'}; ${bad} failed`);
process.exit(bad ? 1 : 0);
