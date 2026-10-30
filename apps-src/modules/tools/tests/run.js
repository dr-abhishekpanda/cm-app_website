/* Runners for "Choose and Run a Test". Each takes plain numbers (from the dataset or typed
 * summaries) and returns a result object the page renders:
 *   { title, p, line, stats, tables, effects, checks, sentence, posthoc, plot, refs, notes }
 * Wording follows the conventions in Kirkwood and Sterne: estimate, 95% CI, then the test.
 */
import { summarise, shapiroWilk } from '../../../engine/describe.js';
import { tOneSampleSummary, tPaired, tTwoSampleSummary, anovaSummary, welchAnovaSummary, levene, tukeyHSD, gamesHowell, rmAnova, summary as sumOf } from '../../../engine/compare.js';
import { mannWhitney, wilcoxonSignedRank, kruskalWallis, friedman } from '../../../engine/nonparam.js';
import { chiSquareTest, fisher2x2, fisherRxC, mcnemar, linearByLinear, cochranQ } from '../../../engine/tables.js';
import { pearson, spearman, kendall } from '../../../engine/correlate.js';
import { wilson, clopperPearson, binomialTest, twoProportions, proportionZ } from '../../../engine/proportions.js';
import { adjust, ADJUST_METHODS } from '../../../engine/multiplicity.js';
import { fixed, pValue, count, interval, sig } from '../../../engine/format.js';

const P = (p) => pValue(p).report;
// The p-value alone, for table cells: "0.032", "< 0.001", "> 0.999".
const pCell = (p) => pValue(p).report.replace(/^p = /, '').replace(/^p /, '');
const pretty = (s) => String(s).replace(/_/g, ' ');
const pct = (x, n) => (n ? (100 * x) / n : NaN);
const df1 = (df) => (Number.isInteger(df) ? String(df) : fixed(df, 1));
const listAnd = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/* ------------------------------------------------------------- checks --- */

function normalityCheck(groups, labels, what = 'each group') {
  const small = groups.some((g) => g.length < 30);
  if (!small) return { ok: true, text: `Every group has 30 or more values, so the test is robust to departures from normality.` };
  const bad = [];
  groups.forEach((g, i) => {
    if (g.length >= 3) { const sw = shapiroWilk(g); if (sw.p < 0.05) bad.push(`${labels[i]} (Shapiro-Wilk ${P(sw.p)})`); }
  });
  if (bad.length) return { ok: false, text: `Not normal in ${bad.join(', ')}, and fewer than 30 values in ${what === 'each group' ? 'some groups' : what}. Prefer the rank-based alternative or check the plots.` };
  return { ok: true, text: `Shapiro-Wilk p is 0.05 or more in ${what}.` };
}

function groupRowsNumeric(groups, labels, d) {
  return groups.map((g, i) => {
    const s = summarise(g, { qtype: 6 });
    return [labels[i], count(s.n), s.n > 1 ? `${fixed(s.mean, d)} (${fixed(s.sd, d)})` : fixed(s.mean, d), s.n > 1 ? interval(s.ciMean, d) : '—', `${fixed(s.median, d)} (${fixed(s.q1, d)} to ${fixed(s.q3, d)})`];
  });
}
const GROUP_COLS = ['Group', 'n', 'Mean (SD)', '95% CI of mean', 'Median (IQR)'];

/* --------------------------------------------------------- numeric: two -- */

export function runTwoGroups({ g1, g2, labels, outcome, d, equalVar = false, fromSummary = null }) {
  const s1 = fromSummary ? fromSummary[0] : sumOf(g1), s2 = fromSummary ? fromSummary[1] : sumOf(g2);
  const r = tTwoSampleSummary(s1, s2, { equalVar });
  const checks = [];
  if (!fromSummary) {
    checks.push(normalityCheck([g1, g2], labels));
    const lv = levene([g1, g2], 'mean');
    checks.push(equalVar
      ? { ok: !(lv.p < 0.05), text: `Levene's test ${P(lv.p)}${lv.p < 0.05 ? ": the variances differ, so use Welch's test." : ': no evidence that the variances differ.'}` }
      : { ok: true, text: `Welch's test does not assume equal variances (Levene's test ${P(lv.p)}).` });
  } else checks.push({ ok: null, text: 'From summary figures the shape of each group cannot be checked: make sure the data are roughly normal or each group has 30 or more.' });
  const name = equalVar ? "Student's t" : "Welch's t";
  return {
    title: equalVar ? "Student's t-test (equal variances)" : "Welch's t-test (unequal variances)",
    p: r.p, line: `t = ${fixed(r.t, 2)}, df = ${df1(r.df)}, ${P(r.p)}`,
    stats: [['Difference in means', `${fixed(r.diff, d)}`], ['95% CI', interval(r.ci, d)], ['t', fixed(r.t, 3)], ['df', df1(r.df)], ['p', pValue(r.p).exact], ["Cohen's d", `${fixed(r.d, 2)} (${interval(r.ciD, 2)})`], ["Hedges' g", fixed(r.g, 2)]],
    tables: [{ caption: pretty(outcome), columns: fromSummary ? ['Group', 'n', 'Mean (SD)'] : GROUP_COLS,
      rows: fromSummary ? fromSummary.map((s, i) => [labels[i], count(s.n), `${fixed(s.mean, d)} (${fixed(s.sd, d)})`]) : groupRowsNumeric([g1, g2], labels, d) }],
    checks,
    sentence: `Mean ${pretty(outcome)} was ${fixed(s1.mean, d)} (SD ${fixed(s1.sd, d)}) in ${labels[0]} (n = ${count(s1.n)}) and ${fixed(s2.mean, d)} (SD ${fixed(s2.sd, d)}) in ${labels[1]} (n = ${count(s2.n)}); the difference (${labels[0]} minus ${labels[1]}) was ${fixed(r.diff, d)} (95% CI ${interval(r.ci, d)}; ${name} = ${fixed(r.t, 2)}, df = ${df1(r.df)}, ${P(r.p)}; Cohen's d = ${fixed(r.d, 2)}).`,
    plot: fromSummary ? null : { kind: 'box', groups: [g1, g2], labels },
    refs: equalVar ? ['kirkwood', 'cumming'] : ['kirkwood', 'welch', 'cumming'],
    notes: ["Cohen's d uses the pooled SD; its 95% CI is exact, from the noncentral t distribution. Hedges' g corrects d for small samples."],
    alt: 'mw',
  };
}

export function runMannWhitney({ g1, g2, labels, outcome, d }) {
  const r = mannWhitney(g1, g2);
  const s1 = summarise(g1), s2 = summarise(g2);
  const hl = r.hl;
  const dir = r.U1 > r.U2 ? 'higher' : 'lower';
  return {
    title: 'Mann-Whitney U test (Wilcoxon rank-sum)', p: r.p,
    line: `U = ${sig(r.U, 6)}${r.method.startsWith('exact') ? '' : `, z = ${fixed(r.z, 2)}`}, ${P(r.p)}`,
    stats: [['U', sig(r.U, 6)], ...(r.method.startsWith('exact') ? [] : [['z', fixed(r.z, 2)]]), ['p', pValue(r.p).exact], ['Method', r.method],
      hl ? ['Median difference (Hodges-Lehmann)', `${fixed(hl.estimate, d)} (${interval(hl.ci, d)})`] : null,
      ['Rank-biserial r', fixed(r.rankBiserial, 2)], ['P(first group higher)', fixed(r.probSuperiority, 2)]],
    tables: [{ caption: pretty(outcome), columns: ['Group', 'n', 'Median (IQR)', 'Mean rank'],
      rows: [[labels[0], count(r.n1), `${fixed(s1.median, d)} (${fixed(s1.q1, d)} to ${fixed(s1.q3, d)})`, fixed(r.R1 / r.n1, 1)],
        [labels[1], count(r.n2), `${fixed(s2.median, d)} (${fixed(s2.q1, d)} to ${fixed(s2.q3, d)})`, fixed(r.R2 / r.n2, 1)]] }],
    checks: [{ ok: null, text: 'The test compares whole distributions. Read it as a shift in medians only when the two groups have a similar shape and spread (see the box plots).' },
      r.ties ? { ok: null, text: 'Tied values: the normal approximation with a tie correction is used.' } : { ok: true, text: 'No ties: the exact p-value is used where the groups are small.' }],
    sentence: `${pretty(outcome)} was ${dir} in ${labels[0]} (median ${fixed(s1.median, d)}, IQR ${fixed(s1.q1, d)} to ${fixed(s1.q3, d)}; n = ${count(r.n1)}) than in ${labels[1]} (median ${fixed(s2.median, d)}, IQR ${fixed(s2.q1, d)} to ${fixed(s2.q3, d)}; n = ${count(r.n2)})${hl ? `; Hodges-Lehmann median difference ${fixed(hl.estimate, d)} (95% CI ${interval(hl.ci, d)})` : ''} (Mann-Whitney U = ${sig(r.U, 6)}, ${P(r.p)}).`,
    plot: { kind: 'box', groups: [g1, g2], labels },
    refs: ['kirkwood', 'hodgesLehmann', 'campbellGardner'],
    notes: ['U counts the pairs in which the first group has the larger value (ties count a half).'],
    alt: 't2',
  };
}

/* ---------------------------------------------------------- one sample --- */

export function runOneSample({ x, mu0, outcome, d, fromSummary = null }) {
  const s = fromSummary || sumOf(x);
  const r = tOneSampleSummary(s, mu0);
  const checks = fromSummary ? [{ ok: null, text: 'From summary figures the shape cannot be checked: the data should be roughly normal, or n 30 or more.' }]
    : [normalityCheck([x], ['the data'], 'the data')];
  return {
    title: 'One-sample t-test', p: r.p, line: `t = ${fixed(r.t, 2)}, df = ${r.df}, ${P(r.p)}`,
    stats: [['Mean', fixed(s.mean, d)], ['Test value', String(mu0)], ['Difference', fixed(r.diff, d)], ['95% CI', interval(r.ci, d)], ['t', fixed(r.t, 3)], ['df', String(r.df)], ['p', pValue(r.p).exact], ["Cohen's d", `${fixed(r.d, 2)} (${interval(r.ciD, 2)})`]],
    tables: [], checks,
    sentence: `Mean ${pretty(outcome)} was ${fixed(s.mean, d)} (SD ${fixed(s.sd, d)}; n = ${count(s.n)}), ${fixed(Math.abs(r.diff), d)} ${r.diff >= 0 ? 'above' : 'below'} the reference value of ${mu0} (95% CI for the difference ${interval(r.ci, d)}; t = ${fixed(r.t, 2)}, df = ${r.df}, ${P(r.p)}).`,
    plot: fromSummary ? null : { kind: 'hist', x },
    refs: ['kirkwood', 'cumming'], alt: 'w1',
  };
}

export function runOneSampleWilcoxon({ x, mu0, outcome, d }) {
  const r = wilcoxonSignedRank(x, null, { mu: mu0 });
  const s = summarise(x);
  return {
    title: 'One-sample Wilcoxon signed-rank test', p: r.p,
    line: `V = ${sig(r.V, 6)}${r.method.startsWith('exact') ? '' : `, z = ${fixed(r.z, 2)}`}, ${P(r.p)}`,
    stats: [['Median', fixed(s.median, d)], ['Test value', String(mu0)], ['V (sum of positive ranks)', sig(r.V, 6)], ['p', pValue(r.p).exact], ['Method', r.method],
      r.hl ? ['Pseudo-median (Hodges-Lehmann)', `${fixed(r.hl.estimate, d)} (${interval(r.hl.ci, d)})`] : null, ['Values equal to the test value (dropped)', String(r.zeros)]],
    tables: [], checks: [{ ok: null, text: 'Assumes the differences from the test value are roughly symmetric.' }],
    sentence: `Median ${pretty(outcome)} was ${fixed(s.median, d)} (IQR ${fixed(s.q1, d)} to ${fixed(s.q3, d)}; n = ${count(s.n)}) against a reference value of ${mu0} (Wilcoxon signed-rank V = ${sig(r.V, 6)}, ${P(r.p)}).`,
    plot: { kind: 'hist', x }, refs: ['kirkwood', 'hodgesLehmann'], alt: 't1',
  };
}

/* -------------------------------------------------------------- paired --- */

export function runPaired({ first, second, names, d, fromSummary = null }) {
  if (fromSummary) {
    const { n, mean, sd } = fromSummary;
    const r = tOneSampleSummary({ n, mean, sd }, 0);
    return {
      title: 'Paired t-test', p: r.p, line: `t = ${fixed(r.t, 2)}, df = ${r.df}, ${P(r.p)}`,
      stats: [['Mean change', fixed(mean, d)], ['95% CI', interval(r.ci, d)], ['t', fixed(r.t, 3)], ['df', String(r.df)], ['p', pValue(r.p).exact], ["Cohen's dz", `${fixed(r.d, 2)} (${interval(r.ciD, 2)})`]],
      tables: [], checks: [{ ok: null, text: 'From summary figures the shape of the differences cannot be checked: they should be roughly normal, or n 30 or more.' }],
      sentence: `The mean change was ${fixed(mean, d)} (SD ${fixed(sd, d)}; 95% CI ${interval(r.ci, d)}; n = ${count(n)} pairs; paired t = ${fixed(r.t, 2)}, df = ${r.df}, ${P(r.p)}).`,
      plot: null, refs: ['kirkwood', 'cumming'], alt: 'wp',
    };
  }
  const r = tPaired(second, first);
  const diffs = second.map((v, i) => v - first[i]);
  const s1 = summarise(first), s2 = summarise(second);
  return {
    title: 'Paired t-test', p: r.p, line: `t = ${fixed(r.t, 2)}, df = ${r.df}, ${P(r.p)}`,
    stats: [['Mean change (second − first)', fixed(r.diff, d)], ['95% CI', interval(r.ci, d)], ['t', fixed(r.t, 3)], ['df', String(r.df)], ['p', pValue(r.p).exact], ["Cohen's dz", `${fixed(r.dz, 2)} (${interval(r.ciDz, 2)})`]],
    tables: [{ caption: `${count(first.length)} complete pairs`, columns: ['Measurement', 'Mean (SD)', 'Median (IQR)'],
      rows: [[pretty(names[0]), `${fixed(s1.mean, d)} (${fixed(s1.sd, d)})`, `${fixed(s1.median, d)} (${fixed(s1.q1, d)} to ${fixed(s1.q3, d)})`],
        [pretty(names[1]), `${fixed(s2.mean, d)} (${fixed(s2.sd, d)})`, `${fixed(s2.median, d)} (${fixed(s2.q1, d)} to ${fixed(s2.q3, d)})`],
        [{ text: 'Change', cls: 'hl' }, `${fixed(r.mean, d)} (${fixed(r.sd, d)})`, '']] }],
    checks: [normalityCheck([diffs], ['the differences'], 'the differences')],
    sentence: `Mean ${pretty(names[0])} was ${fixed(s1.mean, d)} (SD ${fixed(s1.sd, d)}) and mean ${pretty(names[1])} was ${fixed(s2.mean, d)} (SD ${fixed(s2.sd, d)}); the mean change was ${fixed(r.diff, d)} (95% CI ${interval(r.ci, d)}; paired t = ${fixed(r.t, 2)}, df = ${r.df}, ${P(r.p)}; n = ${count(first.length)} pairs).`,
    plot: { kind: 'hist', x: diffs, label: 'Differences (second − first)' },
    refs: ['kirkwood', 'cumming'], notes: ["Cohen's dz is the mean change divided by the SD of the changes."], alt: 'wp',
  };
}

export function runPairedWilcoxon({ first, second, names, d }) {
  const r = wilcoxonSignedRank(second, first);
  const diffs = second.map((v, i) => v - first[i]);
  const s1 = summarise(first), s2 = summarise(second), sd = summarise(diffs);
  return {
    title: 'Wilcoxon signed-rank test (paired)', p: r.p,
    line: `V = ${sig(r.V, 6)}${r.method.startsWith('exact') ? '' : `, z = ${fixed(r.z, 2)}`}, ${P(r.p)}`,
    stats: [['Median change', fixed(sd.median, d)], ['V (sum of positive ranks)', sig(r.V, 6)], ['p', pValue(r.p).exact], ['Method', r.method],
      r.hl ? ['Pseudo-median change (Hodges-Lehmann)', `${fixed(r.hl.estimate, d)} (${interval(r.hl.ci, d)})`] : null, ['Matched-pairs rank-biserial r', fixed(r.rankBiserial, 2)], ['Pairs with no change (dropped)', String(r.zeros)]],
    tables: [{ caption: `${count(first.length)} complete pairs`, columns: ['Measurement', 'Median (IQR)'],
      rows: [[pretty(names[0]), `${fixed(s1.median, d)} (${fixed(s1.q1, d)} to ${fixed(s1.q3, d)})`], [pretty(names[1]), `${fixed(s2.median, d)} (${fixed(s2.q1, d)} to ${fixed(s2.q3, d)})`],
        [{ text: 'Change', cls: 'hl' }, `${fixed(sd.median, d)} (${fixed(sd.q1, d)} to ${fixed(sd.q3, d)})`]] }],
    checks: [{ ok: null, text: 'Assumes the changes are roughly symmetric around their median.' }],
    sentence: `Median ${pretty(names[0])} was ${fixed(s1.median, d)} (IQR ${fixed(s1.q1, d)} to ${fixed(s1.q3, d)}) and median ${pretty(names[1])} was ${fixed(s2.median, d)} (IQR ${fixed(s2.q1, d)} to ${fixed(s2.q3, d)})${r.hl ? `; the Hodges-Lehmann estimate of the change was ${fixed(r.hl.estimate, d)} (95% CI ${interval(r.hl.ci, d)})` : ''} (Wilcoxon signed-rank V = ${sig(r.V, 6)}, ${P(r.p)}; n = ${count(first.length)} pairs).`,
    plot: { kind: 'hist', x: diffs, label: 'Differences (second − first)' }, refs: ['kirkwood', 'hodgesLehmann'], alt: 'tp',
  };
}

/* ------------------------------------------------------- three or more --- */

export function runAnova({ groups, labels, outcome, d, posthoc = 'auto', fromSummary = null }) {
  const sums = fromSummary || groups.map(sumOf);
  const a = anovaSummary(sums), w = welchAnovaSummary(sums);
  const checks = [];
  let lv = null;
  if (!fromSummary) {
    checks.push(normalityCheck(groups, labels));
    lv = levene(groups, 'mean');
    checks.push({ ok: !(lv.p < 0.05), text: `Levene's test ${P(lv.p)}${lv.p < 0.05 ? ": the variances differ, so read Welch's ANOVA and Games-Howell comparisons." : ': no evidence that the variances differ.'}` });
  } else checks.push({ ok: null, text: `From summary figures the shape cannot be tested. The largest SD is ${fixed(Math.max(...(fromSummary.map((s) => s.sd))) / Math.min(...(fromSummary.map((s) => s.sd))), 1)} times the smallest; above 2, Welch's ANOVA and Games-Howell comparisons are used.` });
  // From summaries Levene's test is not possible; a largest-to-smallest SD ratio above 2 stands in for it.
  const sdRatio = Math.max(...sums.map((s) => s.sd)) / Math.min(...sums.map((s) => s.sd));
  const useGH = posthoc === 'gh' || (posthoc === 'auto' && (fromSummary ? sdRatio > 2 : lv.p < 0.05));
  const ph = useGH ? gamesHowell(sums, 0.95, labels) : tukeyHSD(sums, 0.95, labels);
  const unequal = useGH;
  const mainF = unequal ? w : a;
  const sigPairs = ph.pairs.filter((q) => q.p < 0.05);
  return {
    title: unequal ? "One-way ANOVA with Welch's correction" : 'One-way ANOVA', p: mainF.p,
    line: unequal ? `Welch F(${a.df1}, ${fixed(w.df2, 1)}) = ${fixed(w.F, 2)}, ${P(w.p)}` : `F(${a.df1}, ${a.df2}) = ${fixed(a.F, 2)}, ${P(a.p)}`,
    stats: [['F (classic)', fixed(a.F, 3)], ['df', `${a.df1}, ${a.df2}`], ['p (classic)', pValue(a.p).exact], ["Welch's F", fixed(w.F, 3)], ['Welch df', `${a.df1}, ${fixed(w.df2, 1)}`], ["p (Welch)", pValue(w.p).exact], ['Eta squared', fixed(a.eta2, 3)], ['Omega squared', fixed(a.omega2, 3)]],
    tables: [
      { caption: pretty(outcome), columns: fromSummary ? ['Group', 'n', 'Mean (SD)'] : GROUP_COLS,
        rows: fromSummary ? sums.map((s, i) => [labels[i], count(s.n), `${fixed(s.mean, d)} (${fixed(s.sd, d)})`]) : groupRowsNumeric(groups, labels, d) },
      { caption: 'ANOVA table', columns: ['Source', 'Sum of squares', 'df', 'Mean square', 'F', 'p'],
        rows: [['Between groups', fixed(a.ssb, 3), String(a.df1), fixed(a.msb, 3), fixed(a.F, 2), pCell(a.p)], ['Within groups', fixed(a.ssw, 3), String(a.df2), fixed(a.msw, 3), '', ''], ['Total', fixed(a.sst, 3), String(a.N - 1), '', '', '']] },
    ],
    posthoc: { caption: `${ph.method} comparisons (95% simultaneous CIs)`, columns: ['Comparison', 'Difference', '95% CI', 'Adjusted p'],
      rows: ph.pairs.map((q) => [`${q.a} − ${q.b}`, fixed(q.diff, d), interval(q.ci, d), { text: pCell(q.p), cls: q.p < 0.05 ? 'hl' : '' }]) },
    checks,
    sentence: `Mean ${pretty(outcome)} ${mainF.p < 0.05 ? 'differed' : 'did not differ clearly'} across ${labels.length} groups (${unequal ? `Welch's F(${a.df1}, ${fixed(w.df2, 1)}) = ${fixed(w.F, 2)}` : `one-way ANOVA F(${a.df1}, ${a.df2}) = ${fixed(a.F, 2)}`}, ${P(mainF.p)}; η² = ${fixed(a.eta2, 2)}).${sigPairs.length ? ` ${ph.method} comparisons: ${sigPairs.map((q) => `${q.a} vs ${q.b}, difference ${fixed(q.diff, d)} (95% CI ${interval(q.ci, d)}, ${P(q.p)})`).join('; ')}.` : ` No pair differed at the 5% level after ${ph.method} adjustment.`}`,
    plot: fromSummary ? null : { kind: 'box', groups, labels },
    refs: ['kirkwood', 'welch', 'kramer', 'gamesHowell', 'levene'], alt: 'kw',
    notes: ['Tukey-Kramer comparisons assume equal variances; Games-Howell comparisons do not. The page picks Games-Howell when Levene\'s test is below 0.05; you can override this.'],
  };
}

export function runKruskal({ groups, labels, outcome, d, adjustMethod = 'holm' }) {
  const r = kruskalWallis(groups, { posthoc: adjustMethod });
  const sig2 = r.dunn.pairs.filter((q) => q.pAdj < 0.05);
  return {
    title: 'Kruskal-Wallis test', p: r.p, line: `H = ${fixed(r.H, 2)}, df = ${r.df}, ${P(r.p)}`,
    stats: [['H', fixed(r.H, 3)], ['df', String(r.df)], ['p', pValue(r.p).exact], ['Epsilon squared', fixed(r.epsilon2, 3)]],
    tables: [{ caption: pretty(outcome), columns: ['Group', 'n', 'Median (IQR)', 'Mean rank'],
      rows: groups.map((g, i) => { const s = summarise(g); return [labels[i], count(s.n), `${fixed(s.median, d)} (${fixed(s.q1, d)} to ${fixed(s.q3, d)})`, fixed(r.meanRanks[i], 1)]; }) }],
    posthoc: { caption: `Dunn's comparisons, ${ADJUST_METHODS[adjustMethod]} adjusted`, columns: ['Comparison', 'z', 'p', 'Adjusted p'],
      rows: r.dunn.pairs.map((q) => [`${labels[q.i]} − ${labels[q.j]}`, fixed(q.z, 2), pCell(q.p), { text: pCell(q.pAdj), cls: q.pAdj < 0.05 ? 'hl' : '' }]) },
    checks: [{ ok: null, text: 'Compares whole distributions across groups. Read it as a difference in medians only when the groups have a similar shape and spread.' }],
    sentence: `${pretty(outcome)} ${r.p < 0.05 ? 'differed' : 'did not differ clearly'} across ${labels.length} groups (Kruskal-Wallis H = ${fixed(r.H, 2)}, df = ${r.df}, ${P(r.p)}).${sig2.length ? ` Dunn's comparisons (${ADJUST_METHODS[adjustMethod]} adjusted): ${sig2.map((q) => `${labels[q.i]} vs ${labels[q.j]}, ${P(q.pAdj)}`).join('; ')}.` : ''}`,
    plot: { kind: 'box', groups, labels }, refs: ['kirkwood', 'dunn', 'holm'], alt: 'aov',
  };
}

export function runRepeated({ rows, names, d, adjustMethod = 'holm' }) {
  const r = rmAnova(rows);
  const k = names.length;
  const sph = r.mauchly ? r.mauchly.p >= 0.05 : true;
  const useHF = !sph && r.epsGG > 0.75;
  const pRep = sph ? r.p : useHF ? r.pHF : r.pGG;
  const corr = sph ? '' : useHF ? 'Huynh-Feldt' : 'Greenhouse-Geisser';
  const eps = sph ? 1 : useHF ? r.epsHF : r.epsGG;
  const pairs = [];
  for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) {
    const t = tPaired(rows.map((x) => x[b]), rows.map((x) => x[a]));
    pairs.push({ a, b, diff: t.diff, ci: t.ci, p: t.p });
  }
  const adj = adjust(pairs.map((q) => q.p), adjustMethod);
  pairs.forEach((q, i) => { q.pAdj = adj[i]; });
  const cols = names.map((_, j) => rows.map((x) => x[j]));
  return {
    title: `Repeated-measures ANOVA${corr ? ` (${corr} corrected)` : ''}`, p: pRep,
    line: `F(${fixed(r.df1 * eps, eps === 1 ? 0 : 2)}, ${fixed(r.df2 * eps, eps === 1 ? 0 : 1)}) = ${fixed(r.F, 2)}, ${P(pRep)}`,
    stats: [['F', fixed(r.F, 3)], ['df', `${r.df1}, ${r.df2}`], ['p (sphericity assumed)', pValue(r.p).exact], ['Greenhouse-Geisser ε', fixed(r.epsGG, 3)], ['p (Greenhouse-Geisser)', pValue(r.pGG).exact], ['Huynh-Feldt ε', fixed(r.epsHF, 3)], ['p (Huynh-Feldt)', pValue(r.pHF).exact], ['Partial η²', fixed(r.partialEta2, 3)]],
    tables: [{ caption: `${count(rows.length)} participants with every measurement`, columns: ['Measurement', 'Mean (SD)', 'Median (IQR)'],
      rows: cols.map((c, j) => { const s = summarise(c); return [pretty(names[j]), `${fixed(s.mean, d)} (${fixed(s.sd, d)})`, `${fixed(s.median, d)} (${fixed(s.q1, d)} to ${fixed(s.q3, d)})`]; }) }],
    posthoc: { caption: `Paired t-tests, ${ADJUST_METHODS[adjustMethod]} adjusted`, columns: ['Comparison', 'Mean change', '95% CI (unadjusted)', 'Adjusted p'],
      rows: pairs.map((q) => [`${pretty(names[q.b])} − ${pretty(names[q.a])}`, fixed(q.diff, d), interval(q.ci, d), { text: pCell(q.pAdj), cls: q.pAdj < 0.05 ? 'hl' : '' }]) },
    checks: [r.mauchly ? { ok: sph, text: `Mauchly's test of sphericity W = ${fixed(r.mauchly.W, 3)}, ${P(r.mauchly.p)}${sph ? ': sphericity holds; the uncorrected F is used.' : `: sphericity does not hold, so the ${corr} correction is used (ε = ${fixed(eps, 3)}).`}` } : { ok: null, text: 'Sphericity is not tested with fewer than three measurements.' },
      normalityCheck(cols, names.map(pretty), 'each measurement')],
    sentence: `Mean values ${pRep < 0.05 ? 'differed' : 'did not differ clearly'} across ${listAnd(names.map(pretty))} (repeated-measures ANOVA${corr ? ` with ${corr} correction` : ''}, F(${fixed(r.df1 * eps, eps === 1 ? 0 : 2)}, ${fixed(r.df2 * eps, eps === 1 ? 0 : 1)}) = ${fixed(r.F, 2)}, ${P(pRep)}; partial η² = ${fixed(r.partialEta2, 2)}; n = ${count(rows.length)}).`,
    plot: { kind: 'box', groups: cols, labels: names.map(pretty) },
    refs: ['kirkwood', 'greenhouse', 'holm'], alt: 'fr',
    notes: ['Mauchly\'s p uses the second-order correction in R\'s mauchly.test. When sphericity fails, Greenhouse-Geisser is used if ε is 0.75 or less, Huynh-Feldt above that.'],
  };
}

export function runFriedman({ rows, names, d, adjustMethod = 'holm' }) {
  const r = friedman(rows, { posthoc: adjustMethod });
  const cols = names.map((_, j) => rows.map((x) => x[j]));
  return {
    title: 'Friedman test', p: r.p, line: `χ² = ${fixed(r.chi2, 2)}, df = ${r.df}, ${P(r.p)}`,
    stats: [['χ²', fixed(r.chi2, 3)], ['df', String(r.df)], ['p', pValue(r.p).exact], ["Kendall's W", fixed(r.kendallW, 3)]],
    tables: [{ caption: `${count(rows.length)} participants with every measurement`, columns: ['Measurement', 'Median (IQR)', 'Mean rank'],
      rows: cols.map((c, j) => { const s = summarise(c); return [pretty(names[j]), `${fixed(s.median, d)} (${fixed(s.q1, d)} to ${fixed(s.q3, d)})`, fixed(r.meanRanks[j], 2)]; }) }],
    posthoc: { caption: `Wilcoxon signed-rank tests, ${ADJUST_METHODS[adjustMethod]} adjusted`, columns: ['Comparison', 'p', 'Adjusted p'],
      rows: r.pairwise.pairs.map((q) => [`${pretty(names[q.j])} vs ${pretty(names[q.i])}`, pCell(q.p), { text: pCell(q.pAdj), cls: q.pAdj < 0.05 ? 'hl' : '' }]) },
    checks: [{ ok: null, text: 'Ranks within each participant: no assumption about the shape of the data.' }],
    sentence: `Values ${r.p < 0.05 ? 'differed' : 'did not differ clearly'} across ${listAnd(names.map(pretty))} (Friedman χ² = ${fixed(r.chi2, 2)}, df = ${r.df}, ${P(r.p)}; Kendall's W = ${fixed(r.kendallW, 2)}; n = ${count(rows.length)}).`,
    plot: { kind: 'box', groups: cols, labels: names.map(pretty) }, refs: ['kirkwood', 'holm'], alt: 'rm',
  };
}

/* --------------------------------------------------------- categorical --- */

/** Rows: groups (exposure); columns: outcome categories. eventCol picks the outcome for 2 x 2 summaries. */
export function runTable({ table, rowLevels, colLevels, rowName, colName, eventCol = 0 }) {
  // rowName and colName are column names from the dataset, or null for typed counts.
  const c = chiSquareTest(table);
  const R = table.length, C = table[0].length;
  const is2 = R === 2 && C === 2;
  const N = c.N;
  const rowTot = table.map((r) => r.reduce((a, b) => a + b, 0));
  const useExact = !c.cochranOk || (is2 && c.minExpected < 5);
  let fisher = null;
  if (is2) fisher = fisher2x2(table);
  else if (useExact) fisher = fisherRxC(table);
  const pMain = useExact && fisher ? fisher.p : is2 ? c.pYates : c.p;
  const mainName = useExact ? (is2 ? "Fisher's exact test" : 'Fisher-Freeman-Halton exact test') : is2 ? 'Chi-square test with Yates\' correction' : 'Chi-square test';
  const stats = [['Pearson χ²', fixed(c.chi2, 3)], ['df', String(c.df)], ['p (χ²)', pValue(c.p).exact]];
  if (is2) stats.push(["χ² with Yates' correction", fixed(c.chi2Yates, 3)], ['p (Yates)', pValue(c.pYates).exact], ["p (Fisher's exact)", pValue(fisher.p).exact]);
  else if (fisher) stats.push([`p (exact, ${fisher.method})`, pValue(fisher.p).exact]);
  stats.push([is2 ? 'Phi' : "Cramér's V", fixed(is2 ? c.phi : c.cramerV, 3)], ['Smallest expected count', fixed(c.minExpected, 2)]);
  const effects = [];
  let sentence;
  const ev = colLevels[eventCol];
  const evText = colName ? `${pretty(colName)} "${ev}"` : `"${ev}"`;
  rowName = rowName || 'Group';
  if (is2) {
    const tp = twoProportions(table[0][eventCol], rowTot[0], table[1][eventCol], rowTot[1]);
    effects.push(['Difference in proportions', `${fixed(100 * tp.diff, 1)} percentage points (${interval(tp.ci.map((v) => 100 * v), 1)})`]);
    const f2 = fisher2x2(eventCol === 0 ? table : table.map((r) => [r[1], r[0]]));
    effects.push(['Odds ratio (conditional MLE)', `${sig(f2.orMLE, 3)} (${sig(f2.ci[0], 3)} to ${sig(f2.ci[1], 3)})`]);
    sentence = `${evText} was recorded in ${count(table[0][eventCol])} of ${count(rowTot[0])} (${fixed(pct(table[0][eventCol], rowTot[0]), 1)}%) in ${rowLevels[0]} and ${count(table[1][eventCol])} of ${count(rowTot[1])} (${fixed(pct(table[1][eventCol], rowTot[1]), 1)}%) in ${rowLevels[1]}; difference ${fixed(100 * tp.diff, 1)} percentage points (95% CI ${interval(tp.ci.map((v) => 100 * v), 1)}; ${useExact ? `Fisher's exact test ${P(fisher.p)}` : `χ² = ${fixed(c.chi2Yates, 2)} with Yates' correction, df = 1, ${P(c.pYates)}`}).`;
  } else {
    sentence = `${colName ? pretty(colName) : 'The outcome'} ${pMain < 0.05 ? 'was associated' : 'was not clearly associated'} with ${colName ? pretty(rowName) : 'group'} (${useExact ? `${mainName}, ${P(pMain)}` : `χ² = ${fixed(c.chi2, 2)}, df = ${c.df}, ${P(c.p)}`}; Cramér's V = ${fixed(c.cramerV, 2)}; n = ${count(N)}).`;
  }
  const show = table.map((r, i) => [rowLevels[i], ...r.map((v) => `${count(v)} (${fixed(pct(v, rowTot[i]), 1)}%)`), count(rowTot[i])]);
  const colTot = table[0].map((_, j) => table.reduce((s, r) => s + r[j], 0));
  show.push([{ text: 'Total', cls: 'hl' }, ...colTot.map((v) => `${count(v)} (${fixed(pct(v, N), 1)}%)`), count(N)]);
  const resid = { caption: 'Adjusted standardised residuals (beyond ±1.96 marks a cell that departs from independence)', columns: [pretty(rowName), ...colLevels.map(String)],
    rows: c.adjResiduals.map((r, i) => [rowLevels[i], ...r.map((v) => ({ text: fixed(v, 2), cls: Math.abs(v) > 1.96 ? 'hl' : '' }))]) };
  let trend = null;
  const numericLevels = rowLevels.every((l) => Number.isFinite(Number(l)));
  if (R > 2 && C === 2) {
    const lb = linearByLinear(table, numericLevels ? rowLevels.map(Number) : null);
    trend = ['Linear trend (linear-by-linear, 1 df)', `χ² = ${fixed(lb.M2, 2)}, ${P(lb.p)}`];
  }
  return {
    title: mainName, p: pMain,
    line: useExact ? `${mainName}: ${P(pMain)}` : is2 ? `χ² = ${fixed(c.chi2Yates, 2)} (Yates), df = 1, ${P(c.pYates)}` : `χ² = ${fixed(c.chi2, 2)}, df = ${c.df}, ${P(c.p)}`,
    stats: trend ? [...stats, trend] : stats, effects,
    tables: [{ caption: colName ? `${pretty(rowName)} by ${pretty(colName)}: n (row %)` : 'Counts: n (row %)', columns: [pretty(rowName), ...colLevels.map(String), 'Total'], rows: show }],
    extra: R * C > 4 ? resid : null,
    checks: [{ ok: c.cochranOk, text: `Expected counts: smallest ${fixed(c.minExpected, 2)}; ${c.cellsBelow5} of ${R * C} cells below 5 (${fixed(c.pctBelow5, 0)}%). ${c.cochranOk ? (is2 && c.minExpected < 5 ? "Fisher's exact test is reported for a 2 x 2 table with an expected count below 5." : 'The chi-square approximation is adequate.') : 'Too many small expected counts for the chi-square approximation: the exact test is reported.'}` }],
    sentence, plot: { kind: 'pct', items: rowLevels.map((l, i) => ({ label: l, pct: pct(table[i][eventCol], rowTot[i]), ci: wilson(table[i][eventCol], rowTot[i]).map((v) => 100 * v) })), what: evText },
    refs: ['kirkwood', 'cochranRule', ...(useExact && !is2 ? ['freemanHalton'] : []), ...(is2 ? ['newcombe'] : []), ...(trend ? ['mantel'] : [])],
    notes: is2 ? ['The odds ratio is the conditional maximum-likelihood estimate with an exact CI, as in R\'s fisher.test. Risk ratios and attributable fractions are in the epidemiology tools.'] : [],
  };
}

export function runMcNemar({ a, b, c, d, labels, names }) {
  const r = mcnemar(b, c);
  const n = a + b + c + d;
  const useExact = b + c < 25;
  const p = useExact ? r.pExact : r.p;
  const p1 = (a + b) / n, p2 = (a + c) / n;
  const cp = b + c > 0 ? clopperPearson(b, b + c) : [NaN, NaN];
  const or = c === 0 ? Infinity : b / c;
  const orCi = cp.map((q) => q / (1 - q));
  return {
    title: `McNemar's test${useExact ? ' (exact)' : ''}`, p,
    line: useExact ? `exact ${P(r.pExact)} (discordant pairs ${b} and ${c})` : `χ² = ${fixed(r.chi2, 2)}, df = 1, ${P(r.p)}`,
    stats: [['Discordant pairs', `${b} and ${c}`], ['p (exact binomial)', pValue(r.pExact).exact], ['χ² (continuity corrected)', fixed(r.chi2, 3)], ['p (χ²)', pValue(r.p).exact], ['Odds ratio (discordant pairs)', `${sig(or, 3)} (${sig(orCi[0], 3)} to ${sig(orCi[1], 3)})`]],
    tables: [{ caption: `${count(n)} pairs: rows ${pretty(names[0])}, columns ${pretty(names[1])}`, columns: [pretty(names[0]), labels[0], labels[1], 'Total'],
      rows: [[labels[0], count(a), count(b), count(a + b)], [labels[1], count(c), count(d), count(c + d)], [{ text: 'Total', cls: 'hl' }, count(a + c), count(b + d), count(n)]] }],
    checks: [{ ok: null, text: useExact ? 'Fewer than 25 discordant pairs: the exact binomial p is reported.' : '25 or more discordant pairs: the continuity-corrected chi-square is reported (the exact p is also shown).' }],
    sentence: `"${labels[0]}" was recorded in ${count(a + b)} of ${count(n)} (${fixed(100 * p1, 1)}%) for ${pretty(names[0])} and ${count(a + c)} (${fixed(100 * p2, 1)}%) for ${pretty(names[1])}; ${b} pairs changed from "${labels[0]}" to "${labels[1]}" and ${c} the other way (McNemar's ${useExact ? `exact test ${P(r.pExact)}` : `χ² = ${fixed(r.chi2, 2)}, ${P(r.p)}`}).`,
    plot: null, refs: ['kirkwood', 'mcnemar', 'clopper'],
  };
}

export function runCochranQ({ data, names, positive, adjustMethod = 'holm' }) {
  const r = cochranQ(data);
  const n = data.length, k = names.length;
  const pairs = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    let b = 0, c = 0;
    for (const row of data) { if (row[i] === 1 && row[j] === 0) b++; if (row[i] === 0 && row[j] === 1) c++; }
    const m = mcnemar(b, c);
    pairs.push({ i, j, p: b + c < 25 ? m.pExact : m.p });
  }
  const adj = adjust(pairs.map((q) => q.p), adjustMethod);
  return {
    title: "Cochran's Q test", p: r.p, line: `Q = ${fixed(r.Q, 2)}, df = ${r.df}, ${P(r.p)}`,
    stats: [['Q', fixed(r.Q, 3)], ['df', String(r.df)], ['p', pValue(r.p).exact]],
    tables: [{ caption: `"${positive}" in each measurement (${count(n)} participants with all)`, columns: ['Measurement', 'n', '%', '95% CI'],
      rows: names.map((nm, j) => [pretty(nm), count(r.colTotals[j]), fixed(pct(r.colTotals[j], n), 1), interval(wilson(r.colTotals[j], n).map((v) => 100 * v), 1)]) }],
    posthoc: { caption: `Pairwise McNemar tests, ${ADJUST_METHODS[adjustMethod]} adjusted`, columns: ['Comparison', 'p', 'Adjusted p'],
      rows: pairs.map((q, i) => [`${pretty(names[q.i])} vs ${pretty(names[q.j])}`, pCell(q.p), { text: pCell(adj[i]), cls: adj[i] < 0.05 ? 'hl' : '' }]) },
    checks: [],
    sentence: `The proportion "${positive}" ${r.p < 0.05 ? 'changed' : 'did not change clearly'} across ${k} measurements (${names.map((nm, j) => `${pretty(nm)} ${fixed(pct(r.colTotals[j], n), 1)}%`).join(', ')}; Cochran's Q = ${fixed(r.Q, 2)}, df = ${r.df}, ${P(r.p)}; n = ${count(n)}).`,
    plot: { kind: 'pct', items: names.map((nm, j) => ({ label: pretty(nm), pct: pct(r.colTotals[j], n), ci: wilson(r.colTotals[j], n).map((v) => 100 * v) })), what: positive },
    refs: ['kirkwood', 'mcnemar', 'holm'],
  };
}

export function runOneProportion({ x, n, p0, what = 'the proportion' }) {
  const b = binomialTest(x, n, p0);
  const z = proportionZ(x, n, p0);
  return {
    title: 'One proportion: exact binomial test', p: b.p, line: `${count(x)}/${count(n)} = ${fixed(100 * x / n, 1)}% vs ${fixed(100 * p0, 1)}%: exact ${P(b.p)}`,
    stats: [['Proportion', `${fixed(100 * x / n, 2)}%`], ['95% CI (Wilson)', `${interval(b.ciWilson.map((v) => 100 * v), 2)}%`], ['95% CI (Clopper-Pearson)', `${interval(b.ci.map((v) => 100 * v), 2)}%`], ['Expected proportion', `${fixed(100 * p0, 2)}%`], ['p (exact binomial)', pValue(b.p).exact], ['p (z approximation)', pValue(z.p).exact]],
    tables: [], checks: [{ ok: null, text: 'The Wilson interval is the better default; Clopper-Pearson is "exact" and errs on the wide side.' }],
    sentence: `${count(x)} of ${count(n)} (${fixed(100 * x / n, 1)}%; 95% CI ${interval(b.ciWilson.map((v) => 100 * v), 1)}) had ${what}, compared with the expected ${fixed(100 * p0, 1)}% (exact binomial ${P(b.p)}).`,
    plot: null, refs: ['kirkwood', 'wilson', 'clopper'],
  };
}

export function runTwoProportions({ x1, n1, x2, n2, labels, what = 'the outcome' }) {
  const t = twoProportions(x1, n1, x2, n2);
  const f = fisher2x2([[x1, n1 - x1], [x2, n2 - x2]]);
  const c = chiSquareTest([[x1, n1 - x1], [x2, n2 - x2]]);
  const exact = c.minExpected < 5;
  const p = exact ? f.p : c.pYates;
  return {
    title: 'Two proportions', p,
    line: `${fixed(100 * t.p1, 1)}% vs ${fixed(100 * t.p2, 1)}%; ${exact ? `Fisher's exact ${P(f.p)}` : `χ² (Yates) = ${fixed(c.chi2Yates, 2)}, ${P(c.pYates)}`}`,
    stats: [[labels[0], `${count(x1)}/${count(n1)} = ${fixed(100 * t.p1, 1)}%`], [labels[1], `${count(x2)}/${count(n2)} = ${fixed(100 * t.p2, 1)}%`], ['Difference', `${fixed(100 * t.diff, 1)} points`], ['95% CI (Newcombe)', interval(t.ci.map((v) => 100 * v), 1)], ['p (χ², uncorrected)', pValue(t.pChi2).exact], ["p (χ², Yates)", pValue(c.pYates).exact], ["p (Fisher's exact)", pValue(f.p).exact]],
    tables: [], checks: [{ ok: !exact, text: `Smallest expected count ${fixed(c.minExpected, 2)}. ${exact ? "Below 5, so Fisher's exact test is reported." : "The chi-square approximation is adequate; Yates' corrected p is reported."}` }],
    sentence: `${what} was recorded in ${count(x1)} of ${count(n1)} (${fixed(100 * t.p1, 1)}%) in ${labels[0]} and ${count(x2)} of ${count(n2)} (${fixed(100 * t.p2, 1)}%) in ${labels[1]}; difference ${fixed(100 * t.diff, 1)} percentage points (95% CI ${interval(t.ci.map((v) => 100 * v), 1)}; ${exact ? `Fisher's exact test ${P(f.p)}` : `χ² = ${fixed(c.chi2Yates, 2)} with Yates' correction, ${P(c.pYates)}`}).`,
    plot: { kind: 'pct', items: [{ label: labels[0], pct: 100 * t.p1, ci: wilson(x1, n1).map((v) => 100 * v) }, { label: labels[1], pct: 100 * t.p2, ci: wilson(x2, n2).map((v) => 100 * v) }], what },
    refs: ['kirkwood', 'newcombe', 'wilson'],
  };
}

/* ---------------------------------------------------------- correlation --- */

export function runCorrelation({ x, y, names, method = 'auto' }) {
  const n = x.length;
  let m = method;
  let why = '';
  if (method === 'auto') {
    const swx = shapiroWilk(x), swy = shapiroWilk(y);
    // Shapiro-Wilk is not run above 5,000 values (p is NaN there); large samples count as normal enough.
    const normalish = (n >= 30 || (swx.p >= 0.05 && swy.p >= 0.05)) && !(swx.p < 0.001) && !(swy.p < 0.001);
    m = normalish ? 'pearson' : 'spearman';
    why = normalish ? 'Both variables look roughly normal, so Pearson\'s r is used.' : `At least one variable is clearly not normal (Shapiro-Wilk ${P(Math.min(swx.p, swy.p))}), so Spearman's rho is used.`;
  }
  const r = m === 'pearson' ? pearson(x, y) : m === 'spearman' ? spearman(x, y) : kendall(x, y);
  const est = m === 'pearson' ? r.r : m === 'spearman' ? r.rho : r.tau;
  const sym = m === 'pearson' ? 'r' : m === 'spearman' ? 'ρ' : 'τ-b';
  const label = m === 'pearson' ? "Pearson's r" : m === 'spearman' ? "Spearman's rho" : "Kendall's tau-b";
  const strength = Math.abs(est) < 0.1 ? 'negligible' : Math.abs(est) < 0.3 ? 'weak' : Math.abs(est) < 0.5 ? 'moderate' : Math.abs(est) < 0.7 ? 'strong' : 'very strong';
  return {
    title: label, p: r.p, line: `${sym} = ${fixed(est, 2)}${r.ci ? ` (95% CI ${interval(r.ci, 2)})` : ''}, ${P(r.p)}, n = ${count(n)}`,
    stats: [[label, fixed(est, 3)], r.ci ? ['95% CI', interval(r.ci, 3)] : null, ['p', pValue(r.p).exact], ['n', count(n)], m === 'pearson' ? ['r² (shared variance)', fixed(r.r2, 3)] : null, r.method ? ['Method', r.method] : null],
    tables: [],
    checks: [why ? { ok: null, text: why } : null, { ok: null, text: 'Correlation measures a straight-line (Pearson) or monotonic (Spearman, Kendall) association; check the scatter plot for curves, clusters and outliers. It does not show cause.' }].filter(Boolean),
    sentence: `${pretty(names[0])} and ${pretty(names[1])} showed a ${strength} ${est >= 0 ? 'positive' : 'negative'} correlation (${label} = ${fixed(est, 2)}${r.ci ? `, 95% CI ${interval(r.ci, 2)}` : ''}; ${P(r.p)}; n = ${count(n)}).`,
    plot: { kind: 'scatter', x, y, names, line: m === 'pearson' },
    refs: ['kirkwood', ...(m === 'spearman' ? ['bonettWright'] : [])],
    notes: ['Strength labels (under 0.1 negligible, 0.1 to 0.3 weak, 0.3 to 0.5 moderate, 0.5 to 0.7 strong, above 0.7 very strong) are a convention, not a rule; say what the size means for your question.'],
  };
}

/* --------------------------------------------------------- multiplicity --- */

export function runAdjust({ items, method = 'holm' }) {
  const ps = items.map((it) => it.p);
  const res = {};
  for (const m of ['bonferroni', 'holm', 'hochberg', 'bh', 'by']) res[m] = adjust(ps, m);
  const kept = res[method].filter((p) => p < 0.05).length;
  return {
    title: `Adjusted p-values (${ADJUST_METHODS[method]})`, p: null, line: `${kept} of ${items.length} below 0.05 after ${ADJUST_METHODS[method]} adjustment`,
    stats: [],
    tables: [{ caption: 'Adjusted p-values', columns: ['Comparison', 'p', 'Bonferroni', 'Holm', 'Hochberg', 'Benjamini-Hochberg', 'Benjamini-Yekutieli'],
      rows: items.map((it, i) => [it.label, sig(it.p, 3), ...['bonferroni', 'holm', 'hochberg', 'bh', 'by'].map((m) => ({ text: sig(res[m][i], 3), cls: m === method && res[m][i] < 0.05 ? 'hl' : '' }))]) }],
    checks: [{ ok: null, text: 'Holm controls the chance of any false positive and is never less powerful than Bonferroni. Benjamini-Hochberg controls the expected share of false positives among the findings, which suits screening many outcomes.' }],
    sentence: `After ${ADJUST_METHODS[method]} adjustment for ${items.length} comparisons, ${kept} remained below 0.05${kept ? ` (${items.filter((_, i) => res[method][i] < 0.05).map((it) => it.label).join(', ')})` : ''}.`,
    plot: null, refs: ['holm', 'bh'],
  };
}
