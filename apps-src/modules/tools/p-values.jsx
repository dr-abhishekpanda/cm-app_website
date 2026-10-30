/* Tool: p-values and critical values for z, t, chi-square and F; exact binomial and Poisson probabilities. */
import { useState } from 'preact/hooks';
import { normal, studentT, chiSquare, fDist, binomial, poisson } from '../../engine/dist.js';
import { sig, fixed, pValue, parseNumber, count } from '../../engine/format.js';
import { NumberField, SelectField, Seg, Callout, Chip, CopyButton, MathView, PageHead, AtLevel } from '../../ui/core.jsx';
import { DensityPlot, BarPlot } from '../../ui/plot.jsx';
import { tex, texd } from '../../ui/tex.js';

const DISTS = [
  { value: 'z', label: 'z (standard normal)' },
  { value: 't', label: 't' },
  { value: 'chi2', label: 'Chi-square (χ²)' },
  { value: 'F', label: 'F' },
];
const SYMBOL = { z: 'z', t: 't', chi2: 'χ²', F: 'F' };

function dfLabel(d, dist) {
  if (dist === 'F') return `${sig(d.df1, 6)} and ${sig(d.df2, 6)} degrees of freedom`;
  if (dist === 'z') return '';
  const v = sig(d.df1, 6);
  return `${v} degree${d.df1 === 1 ? '' : 's'} of freedom`;
}

/* --------------------------------------------------------- validation --- */
function readDf(dist, df1, df2) {
  const out = { df1: parseNumber(df1), df2: parseNumber(df2), errors: {} };
  if (dist === 't' || dist === 'chi2' || dist === 'F') {
    if (!(out.df1 > 0)) out.errors.df1 = dist === 'F' ? 'Enter the numerator df, greater than 0' : 'Enter degrees of freedom greater than 0';
  }
  if (dist === 'F' && !(out.df2 > 0)) out.errors.df2 = 'Enter the denominator df, greater than 0';
  return out;
}

/* ----------------------------------------------------- p from statistic --- */
function computeP(dist, x, d, tail) {
  const s = { z: normal, t: studentT, chi2: chiSquare, F: fDist }[dist];
  const args = dist === 'z' ? [] : dist === 'F' ? [d.df1, d.df2] : [d.df1];
  if (tail === 'upper') return s.sf(x, ...args);
  if (tail === 'lower') return s.cdf(x, ...args);
  if (dist === 'z' || dist === 't') return s.twoSided(x, ...args);
  // Two-sided F (ratio of two variances): twice the smaller tail.
  return Math.min(1, 2 * Math.min(s.cdf(x, ...args), s.sf(x, ...args)));
}

function plotSpec(dist, d, x, tail, crit) {
  if (dist === 'z' || dist === 't') {
    const df = dist === 't' ? d.df1 : Infinity;
    const pdf = (u) => (dist === 'z' ? normal.pdf(u) : studentT.pdf(u, df));
    const reach = Math.max(4, Math.abs(x ?? 0) + 0.8, ...(crit || []).map((c) => Math.abs(c) + 0.8));
    const lim = Math.min(reach, 12);
    return { pdf, xmin: -lim, xmax: lim };
  }
  const args = dist === 'F' ? [d.df1, d.df2] : [d.df1];
  const s = dist === 'F' ? fDist : chiSquare;
  const far = s.isf(0.002, ...args);
  const hi = Math.max(Number.isFinite(far) ? Math.min(far, dist === 'F' ? 12 : far) : 10, (x ?? 0) * 1.15, ...(crit || []).map((c) => c * 1.15));
  return { pdf: (u) => s.pdf(u, ...args), xmin: 0, xmax: Math.max(hi, 1) };
}

function regionsFor(dist, x, tail) {
  const INF = 1e9;
  if (tail === 'upper') return [{ from: x, to: INF, hot: true }];
  if (tail === 'lower') return [{ from: -INF, to: x, hot: true }];
  if (dist === 'z' || dist === 't') return [{ from: -INF, to: -Math.abs(x), hot: true }, { from: Math.abs(x), to: INF, hot: true }];
  return [];
}

function PFromStatistic() {
  const [dist, setDist] = useState('t');
  const [stat, setStat] = useState('2.10');
  const [df1, setDf1] = useState('18');
  const [df2, setDf2] = useState('20');
  const [tail, setTail] = useState('two');

  const twoAllowed = dist !== 'chi2';
  const effTail = !twoAllowed && tail === 'two' ? 'upper' : tail;
  const x = parseNumber(stat);
  const d = readDf(dist, df1, df2);
  const errors = { ...d.errors };
  if (!Number.isFinite(x)) errors.stat = 'Enter the test statistic as a number';
  else if ((dist === 'chi2' || dist === 'F') && x < 0) errors.stat = `${SYMBOL[dist]} cannot be negative`;
  const ok = Object.keys(errors).length === 0;
  const p = ok ? computeP(dist, x, d, effTail) : NaN;
  const pv = pValue(p);
  const tailWord = effTail === 'two' ? 'two-sided' : effTail === 'upper' ? 'upper-tail (one-sided)' : 'lower-tail (one-sided)';
  const say = ok ? `For ${SYMBOL[dist]} = ${sig(x, 4)}${dist === 'z' ? '' : ` with ${dfLabel(d, dist)}`}, the ${tailWord} p-value is ${pv.exact} (${pv.report}).` : '';
  const spec = ok ? plotSpec(dist, d, x, effTail) : null;

  const example = (k) => {
    if (k === 't') { setDist('t'); setStat('2.10'); setDf1('18'); setTail('two'); }
    if (k === 'chi2') { setDist('chi2'); setStat('3.84'); setDf1('1'); setTail('upper'); }
    if (k === 'F') { setDist('F'); setStat('3.35'); setDf1('2'); setDf2('27'); setTail('upper'); }
  };

  return (
    <div class="split">
      <section class="panel stack" aria-labelledby="pin-h">
        <h2 id="pin-h">Your statistic</h2>
        <div class="fields">
          <SelectField label="Distribution" value={dist} options={DISTS} onChange={(v) => { setDist(v); if (v === 'chi2' && tail === 'two') setTail('upper'); }} />
          <NumberField label={`Statistic (${SYMBOL[dist]})`} value={stat} onInput={setStat} error={errors.stat} />
          {dist !== 'z' ? <NumberField label={dist === 'F' ? 'df, numerator' : 'Degrees of freedom'} value={df1} onInput={setDf1} error={errors.df1}
            hint={dist === 't' ? 'Welch df can be a decimal' : undefined} /> : null}
          {dist === 'F' ? <NumberField label="df, denominator" value={df2} onInput={setDf2} error={errors.df2} /> : null}
        </div>
        <Seg label="Tail" value={effTail} onChange={setTail} options={[
          { value: 'two', label: 'Two-sided', disabled: !twoAllowed, title: twoAllowed ? '' : 'Chi-square tests of association and goodness of fit use the upper tail' },
          { value: 'upper', label: 'Upper tail' },
          { value: 'lower', label: 'Lower tail' },
        ]} />
        {!twoAllowed ? <p class="small">Chi-square tests of association and goodness of fit are upper-tail tests: a larger {SYMBOL.chi2} means a bigger departure from the null hypothesis.</p> : null}
        {dist === 'F' && effTail === 'two' ? <p class="small">Two-sided F is used for comparing two variances; ANOVA and regression F tests use the upper tail.</p> : null}
        <div class="btn-row">
          <span class="label" style="margin:0">Examples</span>
          <button type="button" class="btn ghost small" onClick={() => example('t')}>t = 2.10, 18 df</button>
          <button type="button" class="btn ghost small" onClick={() => example('chi2')}>{SYMBOL.chi2} = 3.84, 1 df</button>
          <button type="button" class="btn ghost small" onClick={() => example('F')}>F = 3.35, 2 and 27 df</button>
        </div>
      </section>

      <section class="panel" aria-labelledby="pout-h" aria-live="polite">
        <h2 id="pout-h">p-value</h2>
        {ok ? (
          <div class="stack">
            <div class="result">
              <div class="big">{pv.report}</div>
              <div class="sub">Exact: {pv.exact} · {tailWord}</div>
              <p class="say">{say}</p>
              <div class="copyrow"><CopyButton text={say} /></div>
            </div>
            <DensityPlot {...spec} regions={regionsFor(dist, x, effTail)}
              marks={[{ x: effTail === 'two' && (dist === 'z' || dist === 't') ? Math.abs(x) : x, label: `${SYMBOL[dist]} = ${sig(x, 3)}` }]}
              label={`Density of the ${SYMBOL[dist]} distribution with the p-value area shaded`} />
            <p class="figcap">The shaded area is the p-value: the probability, if the null hypothesis is true, of a statistic at least this far out.</p>
            <Verdict p={p} />
          </div>
        ) : <p class="small">Complete the fields on the left to see the p-value.</p>}
      </section>
    </div>
  );
}

function Verdict({ p }) {
  if (!Number.isFinite(p)) return null;
  const below = p < 0.05;
  const near = p >= 0.04 && p <= 0.06;
  return (
    <Callout kind={near ? 'warn' : 'info'} mark="Reading it">
      <p>
        {below ? 'Below 0.05, so the result is conventionally called statistically significant at the 5% level. '
          : 'Not below 0.05, so the result is not statistically significant at the 5% level. '}
        {near ? 'It sits close to 0.05: report the exact value and the confidence interval, and avoid treating 0.049 and 0.051 as different findings. ' : ''}
        A p-value says nothing about the size or importance of an effect; report the effect size with its confidence interval alongside it.
      </p>
    </Callout>
  );
}

/* ------------------------------------------------------ critical value --- */
function CriticalValue() {
  const [dist, setDist] = useState('t');
  const [alphaS, setAlphaS] = useState('0.05');
  const [df1, setDf1] = useState('18');
  const [df2, setDf2] = useState('20');
  const [tail, setTail] = useState('two');
  const a = parseNumber(alphaS);
  const d = readDf(dist, df1, df2);
  const errors = { ...d.errors };
  if (!(a > 0 && a < 1)) errors.alpha = 'Enter a significance level between 0 and 1, such as 0.05';
  const ok = Object.keys(errors).length === 0;
  const args = dist === 'z' ? [] : dist === 'F' ? [d.df1, d.df2] : [d.df1];
  const s = { z: normal, t: studentT, chi2: chiSquare, F: fDist }[dist];
  let crit = [];
  if (ok) {
    if (tail === 'two') crit = dist === 'z' || dist === 't' ? [-s.isf(a / 2, ...args), s.isf(a / 2, ...args)] : [s.ppf(a / 2, ...args), s.isf(a / 2, ...args)];
    else if (tail === 'upper') crit = [s.isf(a, ...args)];
    else crit = [s.ppf(a, ...args)];
  }
  const sym = SYMBOL[dist];
  const dfText = dist === 'z' ? '' : ` (${dfLabel(d, dist)})`;
  let rule = '';
  if (ok) {
    if (tail === 'two' && (dist === 'z' || dist === 't')) rule = `Reject the null hypothesis at α = ${sig(a, 3)} (two-sided) if |${sym}| ≥ ${fixed(crit[1], 3)}${dfText}.`;
    else if (tail === 'two') rule = `At α = ${sig(a, 3)} (two-sided), the critical values are ${fixed(crit[0], 3)} and ${fixed(crit[1], 3)}${dfText}.`;
    else if (tail === 'upper') rule = `Reject the null hypothesis at α = ${sig(a, 3)} (upper tail) if ${sym} ≥ ${fixed(crit[0], 3)}${dfText}.`;
    else rule = `Reject the null hypothesis at α = ${sig(a, 3)} (lower tail) if ${sym} ≤ ${fixed(crit[0], 3)}${dfText}.`;
  }
  const spec = ok ? plotSpec(dist, d, null, tail, crit) : null;
  const INF = 1e9;
  const regions = !ok ? [] : tail === 'upper' ? [{ from: crit[0], to: INF, hot: true }]
    : tail === 'lower' ? [{ from: -INF, to: crit[0], hot: true }]
    : [{ from: -INF, to: crit[0], hot: true }, { from: crit[1], to: INF, hot: true }];
  return (
    <div class="split">
      <section class="panel stack" aria-labelledby="cin-h">
        <h2 id="cin-h">Test settings</h2>
        <div class="fields">
          <SelectField label="Distribution" value={dist} options={DISTS} onChange={setDist} />
          <NumberField label="Significance level (α)" value={alphaS} onInput={setAlphaS} error={errors.alpha} hint="0.05, 0.01 or 0.001" />
          {dist !== 'z' ? <NumberField label={dist === 'F' ? 'df, numerator' : 'Degrees of freedom'} value={df1} onInput={setDf1} error={errors.df1} /> : null}
          {dist === 'F' ? <NumberField label="df, denominator" value={df2} onInput={setDf2} error={errors.df2} /> : null}
        </div>
        <Seg label="Tail" value={tail} onChange={setTail} options={[
          { value: 'two', label: 'Two-sided' }, { value: 'upper', label: 'Upper tail' }, { value: 'lower', label: 'Lower tail' },
        ]} />
      </section>
      <section class="panel" aria-labelledby="cout-h" aria-live="polite">
        <h2 id="cout-h">Critical value</h2>
        {ok ? (
          <div class="stack">
            <div class="result">
              <div class="big">{crit.length === 2 && (dist === 'z' || dist === 't') ? `±${fixed(crit[1], 3)}` : crit.map((c) => fixed(c, 3)).join('  and  ')}</div>
              <div class="sub">More digits: {crit.map((c) => sig(c, 8)).join(', ')}</div>
              <p class="say">{rule}</p>
              <div class="copyrow"><CopyButton text={rule} /></div>
            </div>
            <DensityPlot {...spec} regions={regions} marks={crit.map((c) => ({ x: c, label: fixed(c, 3) }))}
              label={`Rejection region of the ${sym} distribution at alpha ${sig(a, 3)}`} />
            <p class="figcap">The shaded tail{crit.length === 2 ? 's hold' : ' holds'} a total probability of {sig(a, 3)}: the rejection region.</p>
          </div>
        ) : <p class="small">Complete the fields on the left to see the critical value.</p>}
      </section>
    </div>
  );
}

/* --------------------------------------------------- exact probability --- */
function readProb(text) {
  const t = String(text).trim();
  if (/%$/.test(t)) return parseNumber(t.slice(0, -1)) / 100;
  return parseNumber(t);
}

function ExactProbability() {
  const [model, setModel] = useState('binomial');
  const [nS, setN] = useState('50');
  const [pS, setP] = useState('0.03');
  const [muS, setMu] = useState('2.5');
  const [kS, setK] = useState('4');
  const [ev, setEv] = useState('ge');
  const n = parseNumber(nS), p = readProb(pS), mu = parseNumber(muS), k = parseNumber(kS);
  const errors = {};
  if (model === 'binomial') {
    if (!(Number.isInteger(n) && n >= 1 && n <= 1e6)) errors.n = 'Enter a whole number of trials from 1 to 10,00,000';
    if (!(p >= 0 && p <= 1)) errors.p = 'Enter a probability between 0 and 1 (or a percentage such as 3%)';
    if (!(Number.isInteger(k) && k >= 0 && (!(n >= 1) || k <= n))) errors.k = 'Enter a whole number from 0 to n';
  } else {
    if (!(mu > 0 && mu <= 1e6)) errors.mu = 'Enter the expected number of events, greater than 0';
    if (!(Number.isInteger(k) && k >= 0)) errors.k = 'Enter a whole number, 0 or more';
  }
  const ok = Object.keys(errors).length === 0;
  let pmf, le, ge, mean, sd;
  if (ok) {
    if (model === 'binomial') {
      pmf = binomial.pmf(k, n, p); le = binomial.cdf(k, n, p); ge = binomial.sf(k - 1, n, p);
      mean = n * p; sd = Math.sqrt(n * p * (1 - p));
    } else {
      pmf = poisson.pmf(k, mu); le = poisson.cdf(k, mu); ge = poisson.sf(k - 1, mu);
      mean = mu; sd = Math.sqrt(mu);
    }
  }
  const val = ev === 'eq' ? pmf : ev === 'le' ? le : ge;
  const evText = ev === 'eq' ? `exactly ${k}` : ev === 'le' ? `${k} or fewer` : `${k} or more`;
  const say = ok ? (model === 'binomial'
    ? `With n = ${count(n)} and probability ${sig(p, 4)} per trial, the probability of ${evText} is ${sig(val, 4)}.`
    : `With an expected ${sig(mu, 4)} events, the probability of ${evText} is ${sig(val, 4)}.`) : '';
  let ks = [], ps = [];
  if (ok) {
    const lo = Math.max(0, Math.floor(mean - 4.5 * sd), Math.min(k, 0));
    let hi = model === 'binomial' ? Math.min(n, Math.ceil(mean + 4.5 * sd)) : Math.ceil(mean + 4.5 * sd);
    hi = Math.max(hi, k, lo + 4);
    if (model === 'binomial') hi = Math.min(hi, n);
    const lo2 = Math.min(lo, k);
    const step = Math.max(1, Math.ceil((hi - lo2 + 1) / 90));
    for (let i = lo2; i <= hi; i += step) { ks.push(i); ps.push(model === 'binomial' ? binomial.pmf(i, n, p) : poisson.pmf(i, mu)); }
  }
  const hot = (i) => (ev === 'eq' ? i === k : ev === 'le' ? i <= k : i >= k);
  return (
    <div class="split">
      <section class="panel stack" aria-labelledby="ein-h">
        <h2 id="ein-h">Counts</h2>
        <Seg label="Model" value={model} onChange={setModel} options={[{ value: 'binomial', label: 'Binomial' }, { value: 'poisson', label: 'Poisson' }]} />
        <div class="fields">
          {model === 'binomial' ? [
            <NumberField label="Trials (n)" value={nS} onInput={setN} error={errors.n} inputMode="numeric" />,
            <NumberField label="Probability per trial (p)" value={pS} onInput={setP} error={errors.p} hint="0.03 or 3%" />,
          ] : <NumberField label="Expected events (λ)" value={muS} onInput={setMu} error={errors.mu} hint="Rate × time or population" />}
          <NumberField label="Number of events (k)" value={kS} onInput={setK} error={errors.k} inputMode="numeric" />
        </div>
        <Seg label="Probability of" value={ev} onChange={setEv} options={[
          { value: 'eq', label: 'Exactly k' }, { value: 'le', label: 'k or fewer' }, { value: 'ge', label: 'k or more' },
        ]} />
        <Callout mark="Example">
          <p>{model === 'binomial'
            ? 'In a block where 3% of children are zero-dose, how likely is a sample of 50 children to contain 4 or more zero-dose children? Enter n = 50, p = 0.03, k = 4 and choose "k or more".'
            : 'A PHC usually sees 2.5 measles cases a month. How unusual is a month with 7 or more? Enter λ = 2.5, k = 7 and choose "k or more".'}</p>
        </Callout>
      </section>
      <section class="panel" aria-labelledby="eout-h" aria-live="polite">
        <h2 id="eout-h">Probability</h2>
        {ok ? (
          <div class="stack">
            <div class="result">
              <div class="big">{sig(val, 4)}</div>
              <div class="sub">P(X {ev === 'eq' ? '=' : ev === 'le' ? '≤' : '≥'} {k})</div>
              <p class="say">{say}</p>
              <div class="chips">
                <Chip lb="P(X = k)" vl={sig(pmf, 4)} />
                <Chip lb="P(X ≤ k)" vl={sig(le, 4)} />
                <Chip lb="P(X ≥ k)" vl={sig(ge, 4)} />
                <Chip lb="Mean" vl={sig(mean, 4)} />
                <Chip lb="SD" vl={sig(sd, 4)} />
              </div>
              <div class="copyrow"><CopyButton text={say} /></div>
            </div>
            <BarPlot ks={ks} ps={ps} hot={hot} label={`${model === 'binomial' ? 'Binomial' : 'Poisson'} probabilities with the event of interest highlighted`} />
            <p class="figcap">Each bar is the probability of that many events; the highlighted bars add up to the answer.</p>
          </div>
        ) : <p class="small">Complete the fields on the left to see the probability.</p>}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------ explainer --- */
function HowItWorks() {
  return (
    <section class="panel prose" aria-labelledby="how-h" style="margin-top:18px">
      <h2 id="how-h">How it works</h2>
      <p>A p-value is the probability of getting a test statistic at least as extreme as the one observed, assuming the null hypothesis is true. Each test produces its statistic; this tool turns the statistic into a p-value, or gives the critical value a statistic must reach.</p>
      <div class="mathrow">
        <MathView block html={texd`p_{\text{two-sided}} = 2\,P\!\left(T_{\nu} \ge |t|\right)`} />
        <MathView block html={texd`p_{\chi^2} = P\!\left(\chi^2_{\nu} \ge x\right)`} />
      </div>
      <AtLevel min="intermediate">
        <h3>Which tail</h3>
        <ul>
          <li><strong>Two-sided</strong> for z and t when a difference in either direction matters. This is the default in almost every medical study.</li>
          <li><strong>One-sided</strong> only when the direction was fixed before the data were seen and a result the other way would be treated as no effect. Decide this in the protocol.</li>
          <li><strong>Chi-square and ANOVA F</strong> statistics measure departure in any direction already, so their p-value is the upper tail.</li>
        </ul>
        <h3>Exact counts</h3>
        <div class="mathrow">
          <MathView block html={texd`P(X=k) = \binom{n}{k} p^{k} (1-p)^{n-k}`} />
          <MathView block html={texd`P(X=k) = \frac{e^{-\lambda}\lambda^{k}}{k!}`} />
        </div>
        <p>The binomial model counts events among a fixed number of independent trials; the Poisson model counts events in a fixed time or population when events are rare and independent.</p>
      </AtLevel>
      <AtLevel min="advanced">
        <h3>Computation</h3>
        <p>The t and F tails come from the regularised incomplete beta function, chi-square and Poisson tails from the regularised incomplete gamma function, and the normal tail from the complementary error function. Each tail is computed directly, so a p-value of 3 {'×'} 10<sup>{'−'}12</sup> keeps its digits. Quantiles are found by Brent's method on the log scale.</p>
        <Callout mark="Accuracy">
          <p>Every function is tested against SciPy, and quantiles against 40-digit mpmath solutions: relative error under 10<sup>{'−'}9</sup> in every tested case, including tail probabilities as small as 10<sup>{'−'}270</sup>.</p>
        </Callout>
      </AtLevel>
      <h3>Read more</h3>
      <ul class="refs">
        <li>Kirkwood BR, Sterne JAC. <em>Essential Medical Statistics</em>. 2nd ed. Oxford: Blackwell Science; 2003. Chapters 8 and 17.</li>
        <li>Wasserstein RL, Lazar NA. The ASA's statement on p-values: context, process, and purpose. <em>The American Statistician</em>. 2016;70(2):129{'–'}133.</li>
      </ul>
    </section>
  );
}

export default function PValuesTool() {
  const [tab, setTab] = useState('p');
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} eyebrow="Analyse"
        title="p-Values and Critical Values"
        lede="Turn a test statistic into an exact p-value, find the critical value for a test, or work out exact binomial and Poisson probabilities." />
      <div style="margin-bottom:18px">
        <Seg wide value={tab} onChange={setTab} options={[
          { value: 'p', label: 'p-value' }, { value: 'crit', label: 'Critical value' }, { value: 'exact', label: 'Exact counts' },
        ]} />
      </div>
      {tab === 'p' ? <PFromStatistic /> : tab === 'crit' ? <CriticalValue /> : <ExactProbability />}
      <HowItWorks />
      <div class="btn-row" style="margin-top:18px">
        <a class="btn ghost" href="#/learn/p-values">Lesson: reading a p-value <span class="arw">{'→'}</span></a>
        <a class="btn ghost" href="#/practice/p-values">Practise <span class="arw">{'→'}</span></a>
      </div>
    </div>
  );
}
