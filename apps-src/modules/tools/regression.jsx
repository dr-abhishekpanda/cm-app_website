/* Tool: linear and logistic regression with categorical predictors, an optional interaction,
 * term tests, the model checks a reviewer asks for, and sentences for the results section. */
import { useState, useMemo } from 'preact/hooks';
import { buildDesign, ols, dropTermF, vif, logistic, dropTermLR, hosmerLemeshow, rocAuc, classify } from '../../engine/regression.js';
import { shapiroWilk } from '../../engine/describe.js';
import { isMissing } from '../../engine/data.js';
import { normal } from '../../engine/dist.js';
import { fixed, pValue, count, interval, sig, dpFor, ratio } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, SelectField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs } from '../../ui/results.jsx';
import { ScatterPlot, QQPlot, LinePlot } from '../../ui/plot.jsx';
import { REFS } from '../refs.js';

const pretty = (s) => String(s).replace(/_/g, ' ');
const P = (p) => pValue(p).report;
const pCell = (p) => pValue(p).report.replace(/^p = /, '').replace(/^p /, '');
const guessEvent = (levels) => levels.find((l) => /^(yes|y|1|present|positive|true|case|died|dead|anaemic|abnormal)$/i.test(l)) ?? levels[levels.length - 1];

export function PredictorPicker({ ds, outcome, chosen, setChosen }) {
  const cols = ds.columns.filter((c) => c.name !== outcome && (c.numeric || c.levels.length <= 12) && c.levels.length >= 2);
  const toggle = (name) => {
    if (chosen[name]) { const n = { ...chosen }; delete n[name]; setChosen(n); }
    else {
      const c = col(ds, name);
      setChosen({ ...chosen, [name]: { type: c.numeric && c.levels.length > 6 ? 'numeric' : c.numeric ? 'numeric' : 'categorical', ref: c.levels[0] } });
    }
  };
  return (
    <div class="stack">
      <div>
        <span class="label">Predictors</span>
        <div class="varpick">{cols.map((c) => <label><input type="checkbox" checked={!!chosen[c.name]} onChange={() => toggle(c.name)} />{pretty(c.name)}</label>)}</div>
      </div>
      {Object.entries(chosen).map(([name, o]) => {
        const c = col(ds, name);
        if (!c) return null;
        return (
          <div class="fields">
            <div class="field"><label>{pretty(name)}</label>
              <select value={o.type} disabled={!c.numeric} onChange={(e) => setChosen({ ...chosen, [name]: { ...o, type: e.currentTarget.value } })}>
                <option value="numeric">Numeric (per unit)</option><option value="categorical">Categories</option>
              </select>
            </div>
            {o.type === 'categorical' ? <SelectField label="Reference category" value={o.ref} onChange={(v) => setChosen({ ...chosen, [name]: { ...o, ref: v } })} options={c.levels.map((l) => ({ value: l, label: l }))} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function prepare(ds, outcome, chosen, interaction, kind, event) {
  const oc = col(ds, outcome);
  const names = Object.keys(chosen).filter((n) => col(ds, n));
  if (!oc || !names.length) return null;
  const y = kind === 'linear'
    ? oc.numbers.map((v) => (v === null || !Number.isFinite(v) ? null : v))
    : oc.raw.map((v) => (isMissing(v) ? null : v === event ? 1 : 0));
  const predictors = names.map((n) => {
    const c = col(ds, n), o = chosen[n];
    return o.type === 'numeric'
      ? { name: pretty(n), type: 'numeric', values: c.numbers.map((v) => (v === null || !Number.isFinite(v) ? null : v)) }
      : { name: pretty(n), type: 'categorical', values: c.raw.map((v) => (isMissing(v) ? null : v)), ref: o.ref, levels: c.levels };
  });
  const inter = interaction && interaction[0] !== interaction[1] ? interaction.map((n) => names.indexOf(n)) : null;
  return buildDesign({ y, predictors, interaction: inter && inter.every((i) => i >= 0) ? inter : null });
}

/* ------------------------------------------------------------- linear ----- */

function LinearResult({ des, outcome, d }) {
  const f = useMemo(() => ols(des.X, des.y), [des]);
  if (f.error) return <Callout kind="warn" mark="Check"><p>{f.error}</p></Callout>;
  const v = des.X[0].length > 2 ? vif(des.X) : [];
  const multi = des.terms.filter((t) => t.cols.length > 1 || t.type === 'interaction');
  const termTests = multi.map((t) => ({ t, r: dropTermF(des.X, des.y, t.cols, f) })).filter((x) => x.r);
  const sw = f.n >= 3 && f.n <= 5000 ? shapiroWilk(f.resid) : { p: NaN };
  const influential = f.cooks.filter((c) => c > 4 / f.n).length;
  const maxVif = v.length ? Math.max(...v) : 1;
  const rows = f.coef.map((q, j) => [des.names[j], fixed(q.b, d), interval(q.ci, d), fixed(q.se, d), fixed(q.t, 2), { text: pCell(q.p), cls: q.p < 0.05 && j > 0 ? 'hl' : '' }, j > 0 && v.length ? fixed(v[j - 1], 2) : '']);
  const sigTerms = f.coef.map((q, j) => ({ q, j })).filter(({ q, j }) => j > 0 && q.p < 0.05);
  const say = `In a linear regression of ${pretty(outcome)} on ${des.terms.map((t) => t.name).join(', ')} (n = ${count(f.n)}; R² = ${fixed(f.r2, 2)}, adjusted R² = ${fixed(f.adjR2, 2)}; F(${f.df1}, ${f.df}) = ${fixed(f.F, 2)}, ${P(f.pF)}), ${sigTerms.length
    ? sigTerms.map(({ q, j }) => `${des.names[j]} was associated with ${des.dummy[j] ? 'a difference' : 'a change per unit'} of ${fixed(q.b, d)} (95% CI ${interval(q.ci, d)}, ${P(q.p)})`).join('; ')
    : 'no predictor was associated with the outcome at the 5% level'}${des.terms.length > 1 ? ', each adjusted for the others' : ''}.`;
  return (
    <section class="panel stack result-panel" aria-labelledby="lin-h">
      <div><p class="eyebrow" style="margin-bottom:8px">Result</p><h2 id="lin-h" style="margin-bottom:6px">Linear regression</h2>
        <p class="verdict-line mono">R² = {fixed(f.r2, 3)}, F({f.df1}, {f.df}) = {fixed(f.F, 2)}, {P(f.pF)}</p></div>
      <Stats items={[['Participants', count(f.n)], des.dropped ? ['Left out (missing data)', count(des.dropped)] : null, ['R²', fixed(f.r2, 3)], ['Adjusted R²', fixed(f.adjR2, 3)], ['Residual SE', fixed(f.s, d)], ['F', `${fixed(f.F, 2)} on ${f.df1}, ${f.df} df`], ['p (model)', pValue(f.pF).exact]]} />
      <DataTable caption={`Coefficients: change in ${pretty(outcome)}`} columns={['Term', 'B', '95% CI', 'SE', 't', 'p', 'VIF']} rows={rows} numeric={[1, 2, 3, 4, 5, 6]} />
      {termTests.length ? <DataTable caption="Tests of terms with more than one coefficient" columns={['Term', 'F', 'df', 'p']} rows={termTests.map(({ t, r }) => [t.name, fixed(r.F, 2), `${r.df1}, ${r.df2}`, pCell(r.p)])} numeric={[1, 2, 3]} /> : null}
      <div>
        <span class="label">Checks</span>
        <ul class="checks">
          <li class={!(sw.p < 0.05) || f.n >= 100 ? 'ok' : 'no'}><span class="mk">{!(sw.p < 0.05) || f.n >= 100 ? 'OK' : 'Check'}</span><span>Residuals: Shapiro-Wilk {Number.isFinite(sw.p) ? P(sw.p) : 'not run'}{sw.p < 0.05 && f.n >= 100 ? '; with 100 or more participants the estimates and CIs are robust to this' : ''}. Look at the Q-Q plot.</span></li>
          <li class={maxVif < 5 ? 'ok' : 'no'}><span class="mk">{maxVif < 5 ? 'OK' : 'Check'}</span><span>Collinearity: largest VIF {v.length ? fixed(maxVif, 2) : '1.00'}{maxVif >= 5 ? '. Above 5, the predictors overlap: consider dropping or combining one.' : '.'}</span></li>
          <li class={influential <= Math.max(1, 0.05 * f.n) ? 'ok' : 'no'}><span class="mk">{influential <= Math.max(1, 0.05 * f.n) ? 'OK' : 'Check'}</span><span>{influential} participant{influential === 1 ? '' : 's'} with Cook's distance above 4/n; check these records for errors before you report.</span></li>
          <li class={f.n / (f.p - 1) >= 10 ? 'ok' : 'no'}><span class="mk">{f.n / (f.p - 1) >= 10 ? 'OK' : 'Check'}</span><span>{fixed(f.n / Math.max(1, f.p - 1), 1)} participants per coefficient; fewer than 10 to 20 risks an over-fitted model.</span></li>
          {des.terms.some((t) => t.type === 'interaction') ? <li class="info"><span class="mk">Note</span><span>With an interaction in the model, each main-effect coefficient is the effect when the other variable is at its reference (or zero). Read the interaction test first.</span></li> : null}
        </ul>
      </div>
      <div class="plotgrid">
        <figure><ScatterPlot x={f.fitted} y={f.resid} xLabel="Fitted value" yLabel="Residual" label="Residuals against fitted values" /><figcaption>No pattern or funnel shape should appear.</figcaption></figure>
        <figure><QQPlot x={f.resid} ppf={normal.ppf} label="Normal Q-Q plot of the residuals" /><figcaption>Residuals near the line are close to normal.</figcaption></figure>
      </div>
      <Report text={say} />
      <AtLevel min="intermediate"><p class="small">B is the change in {pretty(outcome)} for a one-unit increase in a numeric predictor, or for a category against its reference, holding the other predictors fixed. CIs and p-values use the t distribution with {f.df} df.</p></AtLevel>
      <div class="prose"><span class="label">References</span><Refs refs={REFS} ids={['kirkwood']} /></div>
    </section>
  );
}

/* ----------------------------------------------------------- logistic ----- */

function rocPoints(y, s) {
  const idx = s.map((_, i) => i).sort((a, b) => s[b] - s[a]);
  const P1 = y.reduce((a, b) => a + b, 0), N0 = y.length - P1;
  const xs = [0], ys = [0];
  let tp = 0, fp = 0;
  for (let k = 0; k < idx.length;) {
    const v = s[idx[k]];
    while (k < idx.length && s[idx[k]] === v) { if (y[idx[k]]) tp++; else fp++; k++; }
    xs.push(fp / N0); ys.push(tp / P1);
  }
  return { xs, ys };
}

function LogisticResult({ des, outcome, event }) {
  const f = useMemo(() => logistic(des.X, des.y), [des]);
  if (f.error) return <Callout kind="warn" mark="Check"><p>{f.error}</p></Callout>;
  const multi = des.terms.filter((t) => t.cols.length > 1 || t.type === 'interaction');
  const termTests = multi.map((t) => ({ t, r: dropTermLR(des.X, des.y, t.cols, f) })).filter((x) => x.r);
  const hl = hosmerLemeshow(des.y, f.fitted);
  const roc = rocAuc(des.y, f.fitted);
  const cl = classify(des.y, f.fitted);
  const v = des.X[0].length > 2 ? vif(des.X) : [];
  const maxVif = v.length ? Math.max(...v) : 1;
  const rows = f.coef.map((q, j) => (j === 0
    ? [des.names[0], '', '', fixed(q.b, 3), fixed(q.se, 3), fixed(q.z, 2), pCell(q.p)]
    : [des.names[j], ratio(q.or), `${ratio(q.ci[0])} to ${ratio(q.ci[1])}`, fixed(q.b, 3), fixed(q.se, 3), fixed(q.z, 2), { text: pCell(q.p), cls: q.p < 0.05 ? 'hl' : '' }]));
  const sigTerms = f.coef.map((q, j) => ({ q, j })).filter(({ q, j }) => j > 0 && q.p < 0.05);
  const adj = des.terms.length > 1 ? 'adjusted ' : '';
  const say = `In a logistic regression of ${pretty(outcome)} ("${event}"; ${count(f.events)} of ${count(f.n)}) on ${des.terms.map((t) => t.name).join(', ')}, ${sigTerms.length
    ? sigTerms.map(({ q, j }) => `${des.names[j]} had an ${adj}odds ratio of ${ratio(q.or)}${des.dummy[j] ? '' : ' per unit'} (95% CI ${ratio(q.ci[0])} to ${ratio(q.ci[1])}, ${P(q.p)})`).join('; ')
    : 'no predictor was associated with the outcome at the 5% level'}. The model's likelihood-ratio χ² was ${fixed(f.lr, 2)} (df ${f.dfLR}, ${P(f.pLR)}); Nagelkerke R² ${fixed(f.nagelkerke, 2)}; area under the ROC curve ${fixed(roc.auc, 2)} (95% CI ${interval(roc.ci, 2)}); Hosmer-Lemeshow ${P(hl.p)}.`;
  const rp = rocPoints(des.y, f.fitted);
  return (
    <section class="panel stack result-panel" aria-labelledby="log-h">
      <div><p class="eyebrow" style="margin-bottom:8px">Result</p><h2 id="log-h" style="margin-bottom:6px">Logistic regression</h2>
        <p class="verdict-line mono">LR χ² = {fixed(f.lr, 2)}, df = {f.dfLR}, {P(f.pLR)} · AUC {fixed(roc.auc, 2)}</p></div>
      <Stats items={[['Participants', count(f.n)], ['With the outcome', `${count(f.events)} (${fixed((100 * f.events) / f.n, 1)}%)`], des.dropped ? ['Left out (missing data)', count(des.dropped)] : null,
        ['Nagelkerke R²', fixed(f.nagelkerke, 3)], ['Cox-Snell R²', fixed(f.coxSnell, 3)], ['ROC area (DeLong 95% CI)', `${fixed(roc.auc, 3)} (${interval(roc.ci, 3)})`],
        ['Hosmer-Lemeshow', `χ² ${fixed(hl.chi2, 2)}, df ${hl.df}, ${P(hl.p)}`], ['Correctly classified at 0.5', `${fixed(100 * cl.correct, 1)}%`]]} />
      <DataTable caption={`Odds ratios for ${pretty(outcome)} = "${event}"`} columns={['Term', 'OR', '95% CI', 'B', 'SE', 'z', 'p']} rows={rows} numeric={[1, 2, 3, 4, 5, 6]} />
      {termTests.length ? <DataTable caption="Likelihood-ratio tests of terms with more than one coefficient" columns={['Term', 'χ²', 'df', 'p']} rows={termTests.map(({ t, r }) => [t.name, fixed(r.chi2, 2), String(r.df), pCell(r.p)])} numeric={[1, 2, 3]} /> : null}
      <div>
        <span class="label">Checks</span>
        <ul class="checks">
          <li class={f.epv >= 10 ? 'ok' : 'no'}><span class="mk">{f.epv >= 10 ? 'OK' : 'Check'}</span><span>Events per variable: {fixed(f.epv, 1)} (the smaller outcome group per coefficient). Below 10, odds ratios can be biased and unstable (Peduzzi and colleagues).</span></li>
          {f.separation ? <li class="no"><span class="mk">Check</span><span>Some predicted probabilities are almost exactly 0 or 1 with very large coefficients: a predictor separates the outcome completely, so its odds ratio is not estimable. Merge categories or use penalised (Firth) regression.</span></li> : null}
          <li class={!(hl.p < 0.05) ? 'ok' : 'no'}><span class="mk">{!(hl.p < 0.05) ? 'OK' : 'Check'}</span><span>Calibration: Hosmer-Lemeshow {P(hl.p)} across {hl.groups} risk groups{hl.p < 0.05 ? '; predicted and observed risks differ' : ''}.</span></li>
          <li class={maxVif < 5 ? 'ok' : 'no'}><span class="mk">{maxVif < 5 ? 'OK' : 'Check'}</span><span>Collinearity: largest VIF {v.length ? fixed(maxVif, 2) : '1.00'}.</span></li>
          {!f.converged ? <li class="no"><span class="mk">Check</span><span>The fitting did not fully converge; treat the estimates with caution.</span></li> : null}
        </ul>
      </div>
      <figure style="margin:0"><LinePlot xs={rp.xs} ys={rp.ys} xLabel="1 − specificity" yFmt={(t) => `${Math.round(t * 100)}%`} label="ROC curve of the fitted model" /><figcaption class="figcap">ROC curve of the predicted risks; the area is {fixed(roc.auc, 2)}.</figcaption></figure>
      <Report text={say} />
      <AtLevel min="intermediate"><p class="small">Odds ratios compare the odds of "{event}" for a one-unit increase, or against the reference category, holding the other predictors fixed. CIs are Wald intervals; with sparse data, profile-likelihood or exact methods are safer.</p></AtLevel>
      <div class="prose"><span class="label">References</span><Refs refs={REFS} ids={['hosmer', 'peduzzi', 'nagelkerke', 'delong']} /></div>
    </section>
  );
}

/* ---------------------------------------------------------------- page ---- */

export default function RegressionTool() {
  const ds = useDataset();
  const [kind, setKind] = useState('linear');
  const [outcome, setOutcome] = useState(null);
  const [event, setEvent] = useState(null);
  const [chosen, setChosen] = useState({});
  const [interA, setInterA] = useState(''), [interB, setInterB] = useState('');
  const oc = ds ? col(ds, outcome) : null;
  const ev = oc && kind === 'logistic' ? (event && oc.levels.includes(event) ? event : guessEvent(oc.levels)) : null;
  const names = Object.keys(chosen);
  const des = ds && oc ? prepare(ds, outcome, chosen, interA && interB ? [interA, interB] : null, kind, ev) : null;
  let body = null;
  if (!ds) body = <Callout mark="Start here"><p>Load or paste your data above, or load the example: a simulated antenatal anaemia follow-up of 120 women.</p></Callout>;
  else if (!oc) body = <p class="small">Choose the outcome.</p>;
  else if (!names.length) body = <p class="small">Choose at least one predictor.</p>;
  else if (!des || des.X.length < des.X[0].length + 2) body = <Callout kind="warn" mark="Check"><p>Too few complete rows for this many coefficients.</p></Callout>;
  else body = kind === 'linear' ? <LinearResult des={des} outcome={outcome} d={dpFor(oc.decimals)} /> : <LogisticResult des={des} outcome={outcome} event={ev} />;
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} eyebrow="Analyse" title="Regression"
        lede="Linear regression for a numeric outcome and logistic regression for a yes/no outcome, with categorical predictors, an optional interaction, adjusted estimates and the model checks reviewers ask for." />
      <div class="stack">
        <DataPanel />
        {ds ? (
          <section class="panel stack" aria-labelledby="mod-h">
            <h2 id="mod-h">Model</h2>
            <Seg label="Outcome type" value={kind} onChange={(k) => { setKind(k); setOutcome(null); }} options={[{ value: 'linear', label: 'Numeric: linear' }, { value: 'logistic', label: 'Yes/no: logistic' }]} />
            <div class="fields">
              <ColumnSelect ds={ds} label="Outcome" value={outcome} onChange={(v) => { setOutcome(v); setEvent(null); const n = { ...chosen }; delete n[v]; setChosen(n); }} kind={kind === 'linear' ? 'numeric' : 'group'} minLevels={2} maxLevels={2} />
              {oc && kind === 'logistic' ? <SelectField label="Outcome counted as the event" value={ev} onChange={setEvent} options={oc.levels.map((l) => ({ value: l, label: l }))} /> : null}
            </div>
            {outcome ? <PredictorPicker ds={ds} outcome={outcome} chosen={chosen} setChosen={setChosen} /> : null}
            {names.length >= 2 ? (
              <div class="fields">
                <SelectField label="Interaction (optional)" value={interA} onChange={setInterA} options={[{ value: '', label: 'None' }, ...names.map((n) => ({ value: n, label: pretty(n) }))]} />
                {interA ? <SelectField label="with" value={interB} onChange={setInterB} options={[{ value: '', label: 'Choose' }, ...names.filter((n) => n !== interA).map((n) => ({ value: n, label: pretty(n) }))]} /> : null}
              </div>
            ) : null}
          </section>
        ) : null}
        {body}
      </div>
    </div>
  );
}
