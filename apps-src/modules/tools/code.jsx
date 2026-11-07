/* Tool page: code export. Explains the R and Python panels that sit under each result, lists what each
 * analysis uses, and downloads the working dataset as the CSV the scripts read. */
import { PageHead, Callout } from '../../ui/core.jsx';
import { DataPanel, useDataset } from '../../ui/data.jsx';
import { DataTable } from '../../ui/results.jsx';
import { datasetCsv, DATA_FILE } from '../../engine/codegen.js';

const ROWS = [
  ['Describe your data', 'mean, sd, quantile (type 6 or 7), shapiro.test, table', 'pandas, numpy.quantile, scipy.stats.shapiro'],
  ['t-tests (two groups, one sample, paired)', 't.test', 'scipy.stats.ttest_ind, ttest_1samp, ttest_rel'],
  ['Mann-Whitney and Wilcoxon tests', 'wilcox.test', 'scipy.stats.mannwhitneyu, wilcoxon (with R\'s exact rule)'],
  ['ANOVA, Welch, Tukey, Games-Howell', 'aov, oneway.test, TukeyHSD', 'scipy.stats.f_oneway, tukey_hsd; pingouin'],
  ['Kruskal-Wallis with Dunn', 'kruskal.test; Dunn\'s test written out', 'scipy.stats.kruskal; scikit-posthocs'],
  ['Friedman; repeated-measures ANOVA', 'friedman.test; aov with Error(); afex for Greenhouse-Geisser', 'scipy.stats.friedmanchisquare; pingouin.rm_anova'],
  ['Chi-square, Fisher, McNemar, Cochran\'s Q', 'chisq.test, fisher.test, mcnemar.test, binom.test', 'scipy.stats.chi2_contingency, fisher_exact; statsmodels'],
  ['Proportions', 'binom.test, prop.test (Wilson), Newcombe by formula', 'scipy.stats.binomtest; statsmodels confint_proportions_2indep'],
  ['Correlation; adjusted p-values', 'cor.test; p.adjust', 'scipy.stats pearsonr, spearmanr, kendalltau; statsmodels multipletests'],
  ['Linear and logistic regression', 'lm, glm, drop1; car, pROC; Hosmer-Lemeshow written out', 'statsmodels formula API'],
  ['Survival', 'survival: survfit, survdiff, coxph', 'lifelines'],
  ['Kappa, Fleiss\' kappa, ICC, alpha', 'psych::cohen.kappa, psych::ICC, psych::alpha; Fleiss\' kappa written out', 'statsmodels inter_rater; pingouin'],
  ['Bland-Altman', 'base R', 'numpy, statsmodels'],
  ['Meta-analysis', 'metafor::rma (effect sizes written out as in the app)', 'numpy and SciPy (written out as in the app)'],
  ['Proportions and rates', 'binom.test, prop.test (Wilson), poisson.test', 'scipy.stats.binomtest; chi2 quantiles for the exact Poisson CI'],
  ['Risk, prevalence and odds ratios; fractions; NNT', "Base R: Koopman's score CI and Newcombe's CI written out; fisher.test, chisq.test", 'numpy, SciPy (conditional odds ratio, brentq); statsmodels (Newcombe)'],
  ['Rate ratio from person-time', 'poisson.test', 'scipy.stats.binomtest, conditional on the events'],
  ['Matched pairs', 'binom.test, mcnemar.test', 'scipy.stats.binomtest; statsmodels mcnemar'],
];

export default function CodeTool() {
  const ds = useDataset();
  const download = () => {
    const url = URL.createObjectURL(new Blob([datasetCsv(ds)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = DATA_FILE;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Report' }]} title="Code Export"
        lede="Every analysis can be rerun in R or Python: open 'R and Python code for this analysis' under a result to copy or download the script." />
      <div class="stack">
        <Callout mark="How it works">
          <p>The script reads your data from <span class="mono">{DATA_FILE}</span>, so keep the two in one folder. Analyses from typed numbers (a table of counts, summary figures, a meta-analysis study table) carry the numbers inside the script.</p>
          <p>Before every release, each R and Python script is run on the example data and its numbers compared with the app's. The R scripts use base R and a few long-established packages (survival, psych, metafor, car, pROC, afex).</p>
        </Callout>
        <DataPanel compact />
        {ds ? <div class="btn-row"><button type="button" class="btn primary small" onClick={download}>Download the data ({DATA_FILE})</button></div> : null}
        <DataTable caption="What each analysis uses" columns={['Analysis', 'R', 'Python']} rows={ROWS} add={false} />
      </div>
    </div>
  );
}
