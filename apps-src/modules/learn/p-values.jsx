/* Lesson: reading a p-value. Depth follows the Basic / Intermediate / Advanced setting. */
import { MathView, PageHead, AtLevel, Callout, Seg, useSettings, LEVELS } from '../../ui/core.jsx';
import { studentT } from '../../engine/dist.js';
import { fixed } from '../../engine/format.js';
import { texd, tex } from '../../ui/tex.js';

export default function PValuesLesson() {
  const s = useSettings();
  const crit = studentT.isf(0.025, 18);
  const p = studentT.twoSided(2.1, 18);
  return (
    <div>
      <PageHead crumbs={[{ label: 'Learn', href: '#/learn' }, { label: 'Analyse' }]}
        title="Reading a p-Value"
        lede="What a p-value measures, what it does not, and how to report one so a reader can judge the finding." />
      <div class="levels">
        <Seg label="Depth" value={s.level} onChange={(level) => s.update({ level })} options={LEVELS.map((l) => ({ value: l.id, label: l.label }))} />
      </div>
      <article class="prose">
        <h2>The idea</h2>
        <p>Every test of significance starts from a <strong>null hypothesis</strong>: no difference, no association. The test turns the data into a single statistic, such as t, {'χ²'} or F. The <strong>p-value</strong> is the probability of a statistic at least as extreme as the one observed, <em>if the null hypothesis were true</em>.</p>
        <p>A small p-value means the data would be unusual under the null hypothesis. It does not say how large or how important the effect is.</p>

        <h2>A worked example</h2>
        <p>A study measures haemoglobin in 19 pregnant women at a PHC and compares their mean with a reference value. The one-sample t-test gives t = 2.10 with 18 degrees of freedom.</p>
        <MathView block html={texd`p = 2\,P\left(T_{18} \ge 2.10\right)`} />
        <p>The two-sided p-value is {fixed(p, 4)}. The critical value for a two-sided test at 5% with 18 df is {fixed(crit, 3)}, and 2.10 falls just short of it, which is why p sits just above 0.05.</p>
        <Callout kind="warn" mark="Just above">
          <p>A p of 0.050 and a p of 0.049 describe almost the same evidence. Report the exact value with the effect size and its confidence interval, and let the reader see both.</p>
        </Callout>

        <h2>What a p-value is not</h2>
        <ul>
          <li>It is <strong>not</strong> the probability that the null hypothesis is true.</li>
          <li>It is <strong>not</strong> the probability that the result happened "by chance".</li>
          <li>A p above 0.05 does <strong>not</strong> show that there is no effect. Absence of evidence is not evidence of absence.</li>
          <li>A p below 0.05 does <strong>not</strong> make an effect large, important or causal.</li>
        </ul>

        <AtLevel min="intermediate">
          <h2>Significance level and critical values</h2>
          <p>The significance level, {'α'}, is chosen before the data are seen; 0.05 is the convention, not a law. A result is called statistically significant when p {'<'} {'α'}, which is the same as the statistic passing the critical value.</p>
          <h3>One-sided or two-sided</h3>
          <p>Use a two-sided test unless the protocol fixed the direction in advance and an effect in the other direction would be treated as no effect. Switching to one-sided after seeing the data halves the p-value and misleads the reader.</p>
          <h3>Reporting</h3>
          <ul>
            <li>Give the exact p-value to two or three decimal places (p = 0.032), and p {'<'} 0.001 for smaller values. Never write p = 0.000.</li>
            <li>Report it next to the effect size and its 95% confidence interval: "mean difference 0.6 g/dL (95% CI 0.0 to 1.2), p = 0.050".</li>
            <li>Name the test used, and say whether it was one-sided or two-sided.</li>
          </ul>
        </AtLevel>

        <AtLevel min="advanced">
          <h2>Confidence intervals and multiple tests</h2>
          <p>For the same test, a two-sided p below 0.05 and a 95% confidence interval that excludes the null value are two views of one result. The interval adds what the p-value lacks: the range of effect sizes compatible with the data.</p>
          <p>Each extra test at {'α'} = 0.05 adds a 5% chance of a false positive. With k independent tests the chance of at least one is</p>
          <MathView block html={texd`1 - (1 - \alpha)^{k}`} />
          <p>which is 40% for ten tests. Pre-specify the primary outcome, and use a correction such as Bonferroni ({`α`}/k) or Holm for families of tests. Testing every pair of variables in a dataset and reporting the significant ones is a guaranteed route to false findings.</p>
        </AtLevel>

        <h2>Try it</h2>
        <p>Use the <a href="#/tool/p-values">p-value tool</a> to check the example above, then <a href="#/practice/p-values">practise</a> with new statistics.</p>

        <h2>Read more</h2>
        <ul class="refs">
          <li>Kirkwood BR, Sterne JAC. <em>Essential Medical Statistics</em>. 2nd ed. Oxford: Blackwell Science; 2003.</li>
          <li>Wasserstein RL, Lazar NA. The ASA's statement on p-values: context, process, and purpose. <em>The American Statistician</em>. 2016;70(2):129{'–'}133.</li>
          <li>Altman DG, Bland JM. Absence of evidence is not evidence of absence. <em>BMJ</em>. 1995;311:485.</li>
        </ul>
      </article>
    </div>
  );
}
