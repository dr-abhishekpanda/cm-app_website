/* Tool: choose and run a test. A short guide picks the test from the design and the data;
 * the runner takes columns from your dataset or typed summary figures and returns the
 * estimate, CI, test, effect size, assumption checks, post hoc comparisons and a sentence. */
import { useState, useMemo } from 'preact/hooks';
import { parseNumber, fixed, pValue, dpFor } from '../../engine/format.js';
import { splitBy, completeRows, crossTab, isMissing } from '../../engine/data.js';
import { normal } from '../../engine/dist.js';
import { ADJUST_METHODS } from '../../engine/multiplicity.js';
import { PageHead, Seg, Callout, AtLevel, NumberField, SelectField, TextField, useId } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs } from '../../ui/results.jsx';
import { BoxPlot, Histogram, PercentBars, ScatterPlot } from '../../ui/plot.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';
import * as R from './tests/run.js';

const pretty = (s) => String(s).replace(/_/g, ' ');
const decimalsOf = (...strs) => Math.max(0, ...strs.map((t) => (String(t).match(/\.(\d+)/) || [, ''])[1].length));

/* ------------------------------------------------------------ catalogue --- */

export const TESTS = [
  { id: 't2', group: 'Numeric outcome: two independent groups', name: 'Independent-samples t-test (Welch or Student)', data: true, summary: true },
  { id: 'mw', group: 'Numeric outcome: two independent groups', name: 'Mann-Whitney U test', data: true },
  { id: 'tp', group: 'Numeric outcome: two paired measurements', name: 'Paired t-test', data: true, summary: true },
  { id: 'wp', group: 'Numeric outcome: two paired measurements', name: 'Wilcoxon signed-rank test (paired)', data: true },
  { id: 'aov', group: 'Numeric outcome: three or more groups', name: 'One-way ANOVA (Welch, Tukey, Games-Howell)', data: true, summary: true },
  { id: 'kw', group: 'Numeric outcome: three or more groups', name: "Kruskal-Wallis test (Dunn's comparisons)", data: true },
  { id: 'rm', group: 'Numeric outcome: three or more measurements', name: 'Repeated-measures ANOVA', data: true },
  { id: 'fr', group: 'Numeric outcome: three or more measurements', name: 'Friedman test', data: true },
  { id: 't1', group: 'Numeric outcome: one group against a value', name: 'One-sample t-test', data: true, summary: true },
  { id: 'w1', group: 'Numeric outcome: one group against a value', name: 'One-sample Wilcoxon signed-rank test', data: true },
  { id: 'chi', group: 'Categorical outcome: independent groups', name: "Chi-square or Fisher's exact test", data: true, summary: true },
  { id: 'p2', group: 'Categorical outcome: independent groups', name: 'Two proportions: difference with 95% CI', data: true, summary: true },
  { id: 'mcn', group: 'Categorical outcome: paired', name: "McNemar's test", data: true, summary: true },
  { id: 'cq', group: 'Categorical outcome: paired', name: "Cochran's Q test", data: true },
  { id: 'p1', group: 'Categorical outcome: one group against a value', name: 'One proportion: exact binomial test', data: true, summary: true },
  { id: 'cor', group: 'Relationship between two numeric variables', name: 'Correlation (Pearson, Spearman, Kendall)', data: true },
  { id: 'adj', group: 'Several p-values', name: 'Adjust p-values for multiple comparisons', summary: true },
];
const byId = Object.fromEntries(TESTS.map((t) => [t.id, t]));

/* --------------------------------------------------------------- chooser --- */

const Q = {
  aim: { q: 'What do you want to do?', opts: [['compare', 'Compare groups or measurements'], ['known', 'Compare one group with a known value'], ['relate', 'Relate two numeric variables'], ['many', 'Adjust several p-values']] },
  outcome: { q: 'What kind of outcome?', opts: [['numeric', 'Numeric (a measurement or score)'], ['categorical', 'Categorical (yes/no or categories)']] },
  k: { q: 'How many groups or measurements?', opts: [['2', 'Two'], ['3', 'Three or more']] },
  design: { q: 'Independent groups, or the same people measured more than once?', opts: [['indep', 'Independent groups'], ['paired', 'Same or matched people (paired)']] },
  shape: { q: 'Is the outcome roughly normal in each group, or are there 30 or more in each?', opts: [['yes', 'Yes'], ['no', 'No, or not sure']] },
  ordered: { q: 'Are the groups ordered (age bands, doses) with a trend in mind?', opts: [['no', 'No'], ['yes', 'Yes, test for a trend']] },
};

function recommend(a) {
  if (a.aim === 'relate') return { id: 'cor', why: 'Correlation measures how two numeric variables move together: Pearson for roughly normal data, Spearman when not.' };
  if (a.aim === 'many') return { id: 'adj', why: 'Several tests on one dataset raise the chance of a false positive; adjust their p-values together.' };
  if (!a.outcome) return null;
  if (a.aim === 'known') {
    if (a.outcome === 'categorical') return { id: 'p1', why: 'Compare an observed proportion with an expected one using the exact binomial test.' };
    if (!a.shape) return null;
    return a.shape === 'yes' ? { id: 't1', alt: 'w1', why: 'A one-sample t-test compares a mean with a reference value.' } : { id: 'w1', alt: 't1', why: 'The signed-rank test compares a median with a reference value without assuming normality.' };
  }
  if (!a.k || !a.design) return null;
  if (a.outcome === 'categorical') {
    if (a.design === 'paired') return a.k === '2' ? { id: 'mcn', why: "McNemar's test compares a yes/no outcome measured twice on the same people." } : { id: 'cq', why: "Cochran's Q compares a yes/no outcome measured three or more times on the same people." };
    if (!a.ordered && a.k === '3') return null;
    if (a.k === '3' && a.ordered === 'yes') return { id: 'chi', why: 'The chi-square test of the table also reports the linear trend test (1 df) across ordered groups.' };
    return { id: 'chi', alt: a.k === '2' ? 'p2' : null, why: "The chi-square test compares proportions across groups; Fisher's exact test takes over when expected counts are small." };
  }
  if (!a.shape) return null;
  const normal2 = a.shape === 'yes';
  if (a.k === '2') {
    if (a.design === 'indep') return normal2 ? { id: 't2', alt: 'mw', why: "Welch's t-test compares two means without assuming equal variances." } : { id: 'mw', alt: 't2', why: 'The Mann-Whitney U test compares two independent groups using ranks.' };
    return normal2 ? { id: 'tp', alt: 'wp', why: 'The paired t-test compares two measurements on the same people.' } : { id: 'wp', alt: 'tp', why: 'The Wilcoxon signed-rank test compares paired measurements using ranks of the changes.' };
  }
  if (a.design === 'indep') return normal2 ? { id: 'aov', alt: 'kw', why: 'One-way ANOVA compares three or more means, with post hoc comparisons.' } : { id: 'kw', alt: 'aov', why: "The Kruskal-Wallis test compares three or more groups using ranks, with Dunn's comparisons." };
  return normal2 ? { id: 'rm', alt: 'fr', why: 'Repeated-measures ANOVA compares three or more measurements on the same people.' } : { id: 'fr', alt: 'rm', why: 'The Friedman test compares three or more measurements on the same people using ranks.' };
}

function questionsFor(a) {
  const qs = ['aim'];
  if (a.aim === 'compare' || a.aim === 'known') qs.push('outcome');
  if (a.aim === 'compare' && a.outcome) { qs.push('k', 'design'); }
  if (a.aim === 'compare' && a.outcome === 'numeric') qs.push('shape');
  if (a.aim === 'known' && a.outcome === 'numeric') qs.push('shape');
  if (a.aim === 'compare' && a.outcome === 'categorical' && a.k === '3' && a.design === 'indep') qs.push('ordered');
  return qs;
}

function Chooser({ onRun }) {
  const [a, setA] = useState({});
  const set = (key, v) => {
    const order = ['aim', 'outcome', 'k', 'design', 'shape', 'ordered'];
    const next = { ...a, [key]: v };
    order.slice(order.indexOf(key) + 1).forEach((k) => { if (key === 'aim' || key === 'outcome') delete next[k]; });
    setA(next);
  };
  const rec = recommend(a);
  return (
    <section class="panel stack" aria-labelledby="ch-h">
      <h2 id="ch-h">Find the right test</h2>
      {questionsFor(a).map((key) => (
        <div><Seg label={Q[key].q} value={a[key]} onChange={(v) => set(key, v)} options={Q[key].opts.map(([value, label]) => ({ value, label }))} /></div>
      ))}
      {a.shape === 'no' ? <p class="small">Not sure about the shape? <a href="#/tool/describe">Describe Your Data</a> checks each variable and suggests mean or median.</p> : null}
      {rec ? (
        <Callout mark="Use">
          <p><strong>{byId[rec.id].name}</strong>. {rec.why}{rec.alt ? <> Alternative: {byId[rec.alt].name}.</> : null}</p>
          <div class="btn-row" style="margin-top:10px">
            <button type="button" class="btn primary small" onClick={() => onRun(rec.id)}>Run this test</button>
            {rec.alt ? <button type="button" class="btn ghost small" onClick={() => onRun(rec.alt)}>Run the alternative</button> : null}
          </div>
        </Callout>
      ) : <p class="small">Answer the questions to see the recommended test.</p>}
    </section>
  );
}

/* --------------------------------------------------------- result view --- */

function ResultView({ res, onAlt }) {
  if (!res) return null;
  if (res.error) return <Callout kind="warn" mark="Check"><p>{res.error}</p></Callout>;
  const plot = res.plot;
  return (
    <section class="panel stack result-panel" aria-labelledby="res-h" aria-live="polite">
      <div>
        <p class="eyebrow" style="margin-bottom:8px">Result</p>
        <h2 id="res-h" style="margin-bottom:6px">{res.title}</h2>
        <p class="verdict-line mono">{res.line}</p>
      </div>
      {res.stats?.length ? <Stats items={res.stats} /> : null}
      {res.effects?.length ? <Stats items={res.effects} /> : null}
      {res.tables?.map((t) => <DataTable caption={t.caption} columns={t.columns} rows={t.rows} numeric={t.columns.map((_, i) => i).slice(1)} />)}
      {plot?.kind === 'box' ? <BoxPlot groups={plot.groups} labels={plot.labels} label="Box plots by group" /> : null}
      {plot?.kind === 'hist' ? <figure style="margin:0"><Histogram x={plot.x} normal label={plot.label || 'Histogram'} /><figcaption class="figcap">{plot.label || 'Distribution of the values'}, with a fitted normal curve.</figcaption></figure> : null}
      {plot?.kind === 'pct' ? <PercentBars items={plot.items} label={`Percentage ${plot.what} by group, with 95% CIs`} /> : null}
      {plot?.kind === 'scatter' ? <ScatterPlot x={plot.x} y={plot.y} xLabel={pretty(plot.names[0])} yLabel={pretty(plot.names[1])} line={plot.line} label={`Scatter plot of ${pretty(plot.names[1])} against ${pretty(plot.names[0])}`} /> : null}
      {res.posthoc ? <DataTable caption={res.posthoc.caption} columns={res.posthoc.columns} rows={res.posthoc.rows} numeric={res.posthoc.columns.map((_, i) => i).slice(1)} /> : null}
      {res.extra ? <AtLevel min="intermediate"><DataTable caption={res.extra.caption} columns={res.extra.columns} rows={res.extra.rows} numeric={res.extra.columns.map((_, i) => i).slice(1)} /></AtLevel> : null}
      {res.checks?.length ? (
        <div>
          <span class="label">Checks</span>
          <ul class="checks">{res.checks.map((c) => <li class={c.ok === true ? 'ok' : c.ok === false ? 'no' : 'info'}><span class="mk">{c.ok === true ? 'OK' : c.ok === false ? 'Check' : 'Note'}</span><span>{c.text}</span></li>)}</ul>
        </div>
      ) : null}
      <Report text={res.sentence} />
      {res.code ? <CodeExport spec={res.code} /> : null}
      {res.alt && byId[res.alt] && onAlt ? <p class="small">Want the alternative? <button type="button" class="linkbtn" onClick={() => onAlt(res.alt)}>{byId[res.alt].name}</button></p> : null}
      <AtLevel min="intermediate">
        {res.notes?.length ? <div class="prose small">{res.notes.map((n) => <p>{n}</p>)}</div> : null}
      </AtLevel>
      {res.refs?.length ? <div class="prose"><span class="label">References</span><Refs refs={REFS} ids={[...new Set(res.refs)]} /></div> : null}
    </section>
  );
}

/* ------------------------------------------------------------- inputs ----- */

function Mode({ test, mode, setMode, hasData }) {
  if (!(test.data && test.summary)) return null;
  return <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !hasData, title: hasData ? '' : 'Load data at the top first' }, { value: 'summary', label: 'Summary figures' }]} />;
}

const num = (s) => parseNumber(s);
const needData = <Callout mark="Data">Load or paste your data at the top of the page, or switch to summary figures where the test allows it.</Callout>;

function LevelPick({ c, value, onChange, label = 'Count as the event' }) {
  if (!c) return null;
  return <SelectField label={label} value={value ?? guessEvent(c.levels)} onChange={onChange} options={c.levels.map((l) => ({ value: l, label: l }))} />;
}
function guessEvent(levels) {
  return levels.find((l) => /^(yes|y|1|present|positive|true|case|died|dead|anaemic|abnormal)$/i.test(l)) ?? levels[0];
}

/* Two independent groups (t2, mw) */
function TwoGroupsRunner({ id, ds, mode }) {
  const [outcome, setOutcome] = useState(null);
  const [group, setGroup] = useState(null);
  const [lvA, setA] = useState(null), [lvB, setB] = useState(null);
  const [eq, setEq] = useState('welch');
  const [s, setS] = useState({ l1: 'Group A', n1: '30', m1: '11.2', sd1: '1.4', l2: 'Group B', n2: '32', m2: '10.4', sd2: '1.6' });
  if (mode === 'summary') {
    const g = [{ n: num(s.n1), mean: num(s.m1), sd: num(s.sd1) }, { n: num(s.n2), mean: num(s.m2), sd: num(s.sd2) }];
    const ok = g.every((x) => x.n >= 2 && Number.isInteger(x.n) && Number.isFinite(x.mean) && x.sd > 0);
    const d = dpFor(decimalsOf(s.m1, s.m2, s.sd1, s.sd2));
    const res = ok ? R.runTwoGroups({ labels: [s.l1, s.l2], outcome: 'the outcome', d, equalVar: eq === 'student', fromSummary: g }) : { error: 'Enter n (2 or more), mean and SD (above 0) for both groups.' };
    if (!res.error) res.code = { kind: 't2s', groups: [{ label: s.l1, ...g[0] }, { label: s.l2, ...g[1] }], equalVar: eq === 'student' };
    const f = (k) => (v) => setS({ ...s, [k]: v });
    return (
      <>
        <section class="panel stack"><h2>Summary figures</h2>
          {[1, 2].map((i) => (
            <div class="fields four">
              <TextField label={`Group ${i}`} value={s[`l${i}`]} onInput={f(`l${i}`)} />
              <NumberField label="n" value={s[`n${i}`]} onInput={f(`n${i}`)} inputMode="numeric" />
              <NumberField label="Mean" value={s[`m${i}`]} onInput={f(`m${i}`)} />
              <NumberField label="SD" value={s[`sd${i}`]} onInput={f(`sd${i}`)} />
            </div>
          ))}
          <Seg label="Variances" value={eq} onChange={setEq} options={[{ value: 'welch', label: "Unequal (Welch's, recommended)" }, { value: 'student', label: "Equal (Student's)" }]} />
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const oc = col(ds, outcome), gc = col(ds, group);
  let res = null;
  if (oc && gc) {
    const a = lvA ?? gc.levels[0], b = lvB ?? gc.levels[1];
    const sp = splitBy(oc, gc);
    const g1 = sp.groups[sp.labels.indexOf(a)] || [], g2 = sp.groups[sp.labels.indexOf(b)] || [];
    if (a === b) res = { error: 'Pick two different groups.' };
    else if (g1.length < 2 || g2.length < 2) res = { error: 'Each group needs at least two values.' };
    else {
      const d = dpFor(oc.decimals);
      res = id === 'mw' ? R.runMannWhitney({ g1, g2, labels: [a, b], outcome, d }) : R.runTwoGroups({ g1, g2, labels: [a, b], outcome, d, equalVar: eq === 'student' });
      if (!res.error) res.code = { kind: id === 'mw' ? 'mw' : 't2', y: outcome, g: group, levels: [a, b], gNumeric: gc.numeric, equalVar: eq === 'student' };
    }
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="Outcome (numeric)" value={outcome} onChange={setOutcome} kind="numeric" />
          <ColumnSelect ds={ds} label="Groups" value={group} onChange={(v) => { setGroup(v); setA(null); setB(null); }} kind="group" maxLevels={12} />
        </div>
        {gc && gc.levels.length > 2 ? (
          <div class="fields">
            <SelectField label="First group" value={lvA ?? gc.levels[0]} onChange={setA} options={gc.levels.map((l) => ({ value: l, label: l }))} />
            <SelectField label="Second group" value={lvB ?? gc.levels[1]} onChange={setB} options={gc.levels.map((l) => ({ value: l, label: l }))} />
          </div>
        ) : null}
        {id === 't2' ? <Seg label="Variances" value={eq} onChange={setEq} options={[{ value: 'welch', label: "Unequal (Welch's, recommended)" }, { value: 'student', label: "Equal (Student's)" }]} /> : null}
      </section>
      <ResultView res={res} />
    </>
  );
}

/* One sample (t1, w1) */
function OneSampleRunner({ id, ds, mode }) {
  const [c, setC] = useState(null);
  const [mu, setMu] = useState('11');
  const [s, setS] = useState({ n: '40', m: '10.6', sd: '1.3' });
  const mu0 = num(mu);
  const muField = <NumberField label="Test value (reference)" value={mu} onInput={setMu} hint="The value to compare against, such as a cut-off or a published mean" />;
  if (mode === 'summary') {
    const sm = { n: num(s.n), mean: num(s.m), sd: num(s.sd) };
    const ok = sm.n >= 2 && Number.isFinite(sm.mean) && sm.sd > 0 && Number.isFinite(mu0);
    const res = ok ? R.runOneSample({ mu0, outcome: 'the outcome', d: dpFor(decimalsOf(s.m, s.sd)), fromSummary: sm }) : { error: 'Enter n (2 or more), mean, SD (above 0) and the test value.' };
    return (
      <>
        <section class="panel stack"><h2>Summary figures</h2>
          <div class="fields four">
            <NumberField label="n" value={s.n} onInput={(v) => setS({ ...s, n: v })} inputMode="numeric" />
            <NumberField label="Mean" value={s.m} onInput={(v) => setS({ ...s, m: v })} />
            <NumberField label="SD" value={s.sd} onInput={(v) => setS({ ...s, sd: v })} />
            {muField}
          </div>
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const cc = col(ds, c);
  let res = null;
  if (cc && Number.isFinite(mu0)) {
    const x = cc.numbers.filter((v) => v !== null && Number.isFinite(v));
    const d = dpFor(cc.decimals);
    res = x.length < 3 ? { error: 'Needs at least three values.' } : id === 'w1' ? R.runOneSampleWilcoxon({ x, mu0, outcome: c, d }) : R.runOneSample({ x, mu0, outcome: c, d });
    if (!res.error) res.code = { kind: id, y: c, mu: mu0 };
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields"><ColumnSelect ds={ds} label="Variable (numeric)" value={c} onChange={setC} kind="numeric" />{muField}</div>
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Paired (tp, wp) */
function PairedRunner({ id, ds, mode }) {
  const [a, setA] = useState(null), [b, setB] = useState(null);
  const [s, setS] = useState({ n: '25', m: '0.8', sd: '1.1' });
  if (mode === 'summary') {
    const sm = { n: num(s.n), mean: num(s.m), sd: num(s.sd) };
    const ok = sm.n >= 2 && Number.isFinite(sm.mean) && sm.sd > 0;
    const res = ok ? R.runPaired({ d: dpFor(decimalsOf(s.m, s.sd)), fromSummary: sm }) : { error: 'Enter the number of pairs, the mean change and the SD of the changes.' };
    return (
      <>
        <section class="panel stack"><h2>Summary of the changes</h2>
          <div class="fields">
            <NumberField label="Pairs (n)" value={s.n} onInput={(v) => setS({ ...s, n: v })} inputMode="numeric" />
            <NumberField label="Mean change" value={s.m} onInput={(v) => setS({ ...s, m: v })} hint="Second minus first" />
            <NumberField label="SD of the changes" value={s.sd} onInput={(v) => setS({ ...s, sd: v })} hint="Not the SD of either measurement" />
          </div>
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const ca = col(ds, a), cb = col(ds, b);
  let res = null;
  if (ca && cb) {
    if (a === b) res = { error: 'Pick two different columns.' };
    else {
      const { rows, dropped } = completeRows([ca, cb]);
      const first = rows.map((r) => r[0]), second = rows.map((r) => r[1]);
      const d = dpFor(Math.max(ca.decimals, cb.decimals));
      res = rows.length < 3 ? { error: 'Needs at least three complete pairs.' } : id === 'wp' ? R.runPairedWilcoxon({ first, second, names: [a, b], d }) : R.runPaired({ first, second, names: [a, b], d });
      if (!res.error) res.code = { kind: id, a, b };
      if (dropped && !res.error) res.checks = [{ ok: null, text: `${dropped} row${dropped === 1 ? '' : 's'} with a missing value in either column left out.` }, ...res.checks];
    }
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="First measurement" value={a} onChange={setA} kind="numeric" hint="For example, before" />
          <ColumnSelect ds={ds} label="Second measurement" value={b} onChange={setB} kind="numeric" hint="For example, after; change = second − first" />
        </div>
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Three or more groups (aov, kw) */
function ManyGroupsRunner({ id, ds, mode }) {
  const [outcome, setOutcome] = useState(null);
  const [group, setGroup] = useState(null);
  const [ph, setPh] = useState('auto');
  const [adj, setAdj] = useState('holm');
  const [rows, setRows] = useState([{ l: 'Group 1', n: '20', m: '10.1', sd: '1.2' }, { l: 'Group 2', n: '22', m: '10.9', sd: '1.3' }, { l: 'Group 3', n: '19', m: '11.4', sd: '1.1' }]);
  const phSeg = id === 'aov' ? <Seg label="Post hoc comparisons" value={ph} onChange={setPh} options={[{ value: 'auto', label: 'Choose for me' }, { value: 'tukey', label: 'Tukey-Kramer' }, { value: 'gh', label: 'Games-Howell' }]} />
    : <SelectField label="Adjust Dunn's p-values" value={adj} onChange={setAdj} options={['holm', 'bonferroni', 'bh'].map((m) => ({ value: m, label: ADJUST_METHODS[m] }))} />;
  if (mode === 'summary') {
    const g = rows.map((r) => ({ n: num(r.n), mean: num(r.m), sd: num(r.sd) }));
    const ok = g.length >= 2 && g.every((x) => x.n >= 2 && Number.isFinite(x.mean) && x.sd > 0);
    const res = ok ? R.runAnova({ labels: rows.map((r) => r.l), outcome: 'the outcome', d: dpFor(decimalsOf(...rows.flatMap((r) => [r.m, r.sd]))), posthoc: ph, fromSummary: g }) : { error: 'Each group needs n (2 or more), a mean and an SD above 0.' };
    const upd = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
    return (
      <>
        <section class="panel stack"><h2>Summary figures</h2>
          {rows.map((r, i) => (
            <div class="fields four">
              <TextField label={`Group ${i + 1}`} value={r.l} onInput={(v) => upd(i, 'l', v)} />
              <NumberField label="n" value={r.n} onInput={(v) => upd(i, 'n', v)} inputMode="numeric" />
              <NumberField label="Mean" value={r.m} onInput={(v) => upd(i, 'm', v)} />
              <NumberField label="SD" value={r.sd} onInput={(v) => upd(i, 'sd', v)} />
            </div>
          ))}
          <div class="btn-row">
            {rows.length < 10 ? <button type="button" class="btn ghost small" onClick={() => setRows([...rows, { l: `Group ${rows.length + 1}`, n: '', m: '', sd: '' }])}>Add a group</button> : null}
            {rows.length > 2 ? <button type="button" class="btn ghost small" onClick={() => setRows(rows.slice(0, -1))}>Remove the last</button> : null}
          </div>
          {phSeg}
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const oc = col(ds, outcome), gc = col(ds, group);
  let res = null;
  if (oc && gc) {
    const sp = splitBy(oc, gc);
    const keep = sp.groups.map((g, i) => [g, sp.labels[i]]).filter(([g]) => g.length >= 2);
    if (keep.length < 2) res = { error: 'Needs at least two groups with two or more values each.' };
    else {
      const d = dpFor(oc.decimals);
      const groups = keep.map(([g]) => g), labels = keep.map(([, l]) => l);
      res = id === 'kw' ? R.runKruskal({ groups, labels, outcome, d, adjustMethod: adj }) : R.runAnova({ groups, labels, outcome, d, posthoc: ph });
      if (!res.error) res.code = id === 'kw' ? { kind: 'kw', y: outcome, g: group, adjust: adj } : { kind: 'aov', y: outcome, g: group, levels: labels, gNumeric: gc.numeric };
    }
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="Outcome (numeric)" value={outcome} onChange={setOutcome} kind="numeric" />
          <ColumnSelect ds={ds} label="Groups" value={group} onChange={setGroup} kind="group" maxLevels={12} />
        </div>
        {phSeg}
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Several columns of the same people (rm, fr, cq) */
function ColumnsPick({ ds, kind, value, onChange, label }) {
  const opts = ds.columns.filter((c) => (kind === 'numeric' ? c.numeric && c.levels.length > 2 : c.levels.length === 2));
  const toggle = (n) => onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);
  return (
    <div>
      <span class="label">{label}</span>
      <div class="varpick">{opts.map((c) => <label><input type="checkbox" checked={value.includes(c.name)} onChange={() => toggle(c.name)} />{pretty(c.name)}</label>)}</div>
      {value.length ? <p class="small">Order: {value.map(pretty).join(' → ')}</p> : null}
    </div>
  );
}

function RepeatedRunner({ id, ds }) {
  const [names, setNames] = useState([]);
  const [adj, setAdj] = useState('holm');
  if (!ds) return needData;
  let res = null;
  if (names.length >= 3) {
    const cs = names.map((n) => col(ds, n));
    const { rows, dropped } = completeRows(cs);
    if (rows.length < 3) res = { error: 'Needs at least three participants with every measurement.' };
    else {
      const d = dpFor(Math.max(...cs.map((c) => c.decimals)));
      res = id === 'fr' ? R.runFriedman({ rows, names, d, adjustMethod: adj }) : R.runRepeated({ rows, names, d, adjustMethod: adj });
      if (!res.error) res.code = { kind: id === 'fr' ? 'fr' : 'rm', cols: names };
      if (dropped) res.checks = [{ ok: null, text: `${dropped} participant${dropped === 1 ? '' : 's'} with a missing measurement left out.` }, ...res.checks];
    }
  } else if (names.length) res = { error: 'Pick at least three measurement columns, in time order.' };
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <ColumnsPick ds={ds} kind="numeric" value={names} onChange={setNames} label="Measurements on the same people, in time order" />
        <SelectField label="Adjust pairwise p-values" value={adj} onChange={setAdj} options={['holm', 'bonferroni', 'bh'].map((m) => ({ value: m, label: ADJUST_METHODS[m] }))} />
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Contingency table (chi) */
function TableRunner({ ds, mode }) {
  const [rv, setRv] = useState(null), [cv, setCv] = useState(null);
  const [ev, setEv] = useState(null);
  const [t, setT] = useState({ rows: ['Exposed', 'Not exposed'], cols: ['Outcome yes', 'Outcome no'], cells: [['12', '38'], ['5', '45']] });
  if (mode === 'summary') {
    const cells = t.cells.map((r) => r.map((v) => num(v)));
    const ok = cells.every((r) => r.every((v) => Number.isInteger(v) && v >= 0)) && cells.every((r) => r.some((v) => v > 0)) && cells[0].every((_, j) => cells.some((r) => r[j] > 0));
    const res = ok ? R.runTable({ table: cells, rowLevels: t.rows, colLevels: t.cols, rowName: null, colName: null, eventCol: 0 }) : { error: 'Enter whole-number counts; every row and every column needs at least one count above zero.' };
    if (!res.error) res.code = { kind: 'chiT', table: cells, rows: t.rows, cols: t.cols };
    const setCell = (i, j, v) => setT({ ...t, cells: t.cells.map((r, a) => (a === i ? r.map((x, b) => (b === j ? v : x)) : r)) });
    const R2 = t.rows.length, C2 = t.cols.length;
    return (
      <>
        <section class="panel stack"><h2>Counts</h2>
          <p class="small">Rows are the groups you compare; columns are the outcome categories. The first column is treated as the event for 2 x 2 tables.</p>
          <div class="tablewrap">
            <table class="table compact entry">
              <thead><tr><th></th>{t.cols.map((c, j) => <th><input aria-label={`Column ${j + 1} label`} value={c} onInput={(e) => setT({ ...t, cols: t.cols.map((x, b) => (b === j ? e.currentTarget.value : x)) })} /></th>)}</tr></thead>
              <tbody>{t.rows.map((r, i) => (
                <tr><th><input aria-label={`Row ${i + 1} label`} value={r} onInput={(e) => setT({ ...t, rows: t.rows.map((x, a) => (a === i ? e.currentTarget.value : x)) })} /></th>
                  {t.cols.map((_, j) => <td><input inputMode="numeric" aria-label={`Count, row ${i + 1}, column ${j + 1}`} value={t.cells[i][j]} onInput={(e) => setCell(i, j, e.currentTarget.value)} /></td>)}</tr>
              ))}</tbody>
            </table>
          </div>
          <div class="btn-row">
            {R2 < 8 ? <button type="button" class="btn ghost small" onClick={() => setT({ ...t, rows: [...t.rows, `Group ${R2 + 1}`], cells: [...t.cells, t.cols.map(() => '')] })}>Add a row</button> : null}
            {R2 > 2 ? <button type="button" class="btn ghost small" onClick={() => setT({ ...t, rows: t.rows.slice(0, -1), cells: t.cells.slice(0, -1) })}>Remove a row</button> : null}
            {C2 < 8 ? <button type="button" class="btn ghost small" onClick={() => setT({ ...t, cols: [...t.cols, `Category ${C2 + 1}`], cells: t.cells.map((r) => [...r, '']) })}>Add a column</button> : null}
            {C2 > 2 ? <button type="button" class="btn ghost small" onClick={() => setT({ ...t, cols: t.cols.slice(0, -1), cells: t.cells.map((r) => r.slice(0, -1)) })}>Remove a column</button> : null}
          </div>
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const rc = col(ds, rv), cc = col(ds, cv);
  let res = null;
  if (rc && cc) {
    if (rv === cv) res = { error: 'Pick two different columns.' };
    else {
      const x = crossTab(rc, cc);
      const keepR = x.table.map((r, i) => i).filter((i) => x.table[i].some((v) => v > 0));
      const keepC = x.colLevels.map((_, j) => j).filter((j) => x.table.some((r) => r[j] > 0));
      const table = keepR.map((i) => keepC.map((j) => x.table[i][j]));
      const rowLevels = keepR.map((i) => x.rowLevels[i]), colLevels = keepC.map((j) => x.colLevels[j]);
      const evName = ev ?? guessEvent(colLevels);
      if (table.length < 2 || colLevels.length < 2) res = { error: 'Needs at least two groups and two outcome categories with data.' };
      else res = R.runTable({ table, rowLevels, colLevels, rowName: rv, colName: cv, eventCol: Math.max(0, colLevels.indexOf(evName)) });
      if (!res.error) res.code = { kind: 'chi', r: rv, c: cv };
      if (x.dropped && !res.error) res.checks = [{ ok: null, text: `${x.dropped} row${x.dropped === 1 ? '' : 's'} with a missing value left out.` }, ...res.checks];
    }
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="Groups (rows)" value={rv} onChange={setRv} kind="group" maxLevels={12} hint="The exposure or comparison groups" />
          <ColumnSelect ds={ds} label="Outcome (columns)" value={cv} onChange={(v) => { setCv(v); setEv(null); }} kind="group" maxLevels={12} />
          {cc && cc.levels.length === 2 ? <LevelPick c={cc} value={ev} onChange={setEv} /> : null}
        </div>
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Two proportions (p2) */
function TwoPropRunner({ ds, mode }) {
  const [outcome, setOutcome] = useState(null), [group, setGroup] = useState(null), [ev, setEv] = useState(null);
  const [s, setS] = useState({ l1: 'Intervention', x1: '18', n1: '60', l2: 'Control', x2: '9', n2: '62' });
  if (mode === 'summary') {
    const v = { x1: num(s.x1), n1: num(s.n1), x2: num(s.x2), n2: num(s.n2) };
    const ok = [v.x1, v.n1, v.x2, v.n2].every((q) => Number.isInteger(q) && q >= 0) && v.n1 > 0 && v.n2 > 0 && v.x1 <= v.n1 && v.x2 <= v.n2;
    const res = ok ? R.runTwoProportions({ ...v, labels: [s.l1, s.l2], what: 'The outcome' }) : { error: 'Enter whole numbers: events cannot exceed the group size.' };
    if (!res.error) res.code = { kind: 'p2', ...v };
    return (
      <>
        <section class="panel stack"><h2>Counts</h2>
          {[1, 2].map((i) => (
            <div class="fields">
              <TextField label={`Group ${i}`} value={s[`l${i}`]} onInput={(v) => setS({ ...s, [`l${i}`]: v })} />
              <NumberField label="With the outcome" value={s[`x${i}`]} onInput={(q) => setS({ ...s, [`x${i}`]: q })} inputMode="numeric" />
              <NumberField label="Group size" value={s[`n${i}`]} onInput={(q) => setS({ ...s, [`n${i}`]: q })} inputMode="numeric" />
            </div>
          ))}
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const oc = col(ds, outcome), gc = col(ds, group);
  let res = null;
  if (oc && gc) {
    const evName = ev ?? guessEvent(oc.levels);
    const x = crossTab(gc, oc);
    if (x.rowLevels.length !== 2) res = { error: 'The group column needs exactly two groups; use the chi-square test for more.' };
    else {
      const j = x.colLevels.indexOf(evName);
      const n = x.table.map((r) => r.reduce((a, b) => a + b, 0));
      if (j < 0) res = { error: `No "${evName}" values in ${pretty(outcome)}.` };
      else res = R.runTwoProportions({ x1: x.table[0][j], n1: n[0], x2: x.table[1][j], n2: n[1], labels: x.rowLevels, what: `${pretty(outcome)} "${evName}"` });
      if (!res.error) res.code = { kind: 'p2', x1: x.table[0][j], n1: n[0], x2: x.table[1][j], n2: n[1] };
    }
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="Outcome" value={outcome} onChange={(v) => { setOutcome(v); setEv(null); }} kind="group" maxLevels={8} />
          <LevelPick c={oc} value={ev} onChange={setEv} />
          <ColumnSelect ds={ds} label="Groups (two)" value={group} onChange={setGroup} kind="group" minLevels={2} maxLevels={2} />
        </div>
      </section>
      <ResultView res={res} />
    </>
  );
}

/* McNemar (mcn) */
function McNemarRunner({ ds, mode }) {
  const [a, setA] = useState(null), [b, setB] = useState(null), [pos, setPos] = useState(null);
  const [s, setS] = useState({ a: '40', b: '24', c: '6', d: '50', l1: 'Yes', l2: 'No', n1: 'Before', n2: 'After' });
  if (mode === 'summary') {
    const v = ['a', 'b', 'c', 'd'].map((k) => num(s[k]));
    const ok = v.every((q) => Number.isInteger(q) && q >= 0) && v.reduce((x, y) => x + y, 0) > 0;
    const res = ok ? R.runMcNemar({ a: v[0], b: v[1], c: v[2], d: v[3], labels: [s.l1, s.l2], names: [s.n1, s.n2] }) : { error: 'Enter whole-number counts for the four cells.' };
    if (!res.error) res.code = { kind: 'mcn', a: v[0], b: v[1], c: v[2], d: v[3] };
    const F = (k, label, numeric = true) => (numeric ? <NumberField label={label} value={s[k]} onInput={(q) => setS({ ...s, [k]: q })} inputMode="numeric" />
      : <TextField label={label} value={s[k]} onInput={(v) => setS({ ...s, [k]: v })} />);
    return (
      <>
        <section class="panel stack"><h2>Paired counts</h2>
          <div class="fields four">{F('n1', 'First measurement', false)}{F('n2', 'Second measurement', false)}{F('l1', 'Category counted', false)}{F('l2', 'Other category', false)}</div>
          <div class="fields four">
            {F('a', `${s.l1} then ${s.l1}`)}{F('b', `${s.l1} then ${s.l2}`)}{F('c', `${s.l2} then ${s.l1}`)}{F('d', `${s.l2} then ${s.l2}`)}
          </div>
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const ca = col(ds, a), cb = col(ds, b);
  let res = null;
  if (ca && cb) {
    const levels = [...new Set([...ca.levels, ...cb.levels])];
    if (a === b) res = { error: 'Pick two different columns.' };
    else if (levels.length !== 2) res = { error: 'Both columns must use the same two categories, such as Yes and No.' };
    else {
      const p0 = pos ?? guessEvent(levels);
      const other = levels.find((l) => l !== p0);
      let A = 0, B = 0, C = 0, D = 0, dropped = 0;
      ca.raw.forEach((v, i) => {
        const w = cb.raw[i];
        if (isMissing(v) || isMissing(w)) { dropped++; return; }
        if (v === p0 && w === p0) A++; else if (v === p0) B++; else if (w === p0) C++; else D++;
      });
      res = R.runMcNemar({ a: A, b: B, c: C, d: D, labels: [p0, other], names: [a, b] });
      if (!res.error) res.code = { kind: 'mcn', a: A, b: B, c: C, d: D };
      if (dropped) res.checks = [{ ok: null, text: `${dropped} participant${dropped === 1 ? '' : 's'} with a missing value left out.` }, ...res.checks];
    }
  }
  const lv = ca && cb ? [...new Set([...ca.levels, ...cb.levels])] : [];
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="First measurement" value={a} onChange={setA} kind="group" minLevels={2} maxLevels={2} />
          <ColumnSelect ds={ds} label="Second measurement" value={b} onChange={setB} kind="group" minLevels={2} maxLevels={2} />
          {lv.length === 2 ? <SelectField label="Category counted" value={pos ?? guessEvent(lv)} onChange={setPos} options={lv.map((l) => ({ value: l, label: l }))} /> : null}
        </div>
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Cochran's Q (cq) */
function CochranRunner({ ds }) {
  const [names, setNames] = useState([]), [pos, setPos] = useState(null), [adj, setAdj] = useState('holm');
  if (!ds) return needData;
  let res = null;
  const cs = names.map((n) => col(ds, n));
  const levels = [...new Set(cs.flatMap((c) => c.levels))];
  if (names.length >= 3) {
    if (levels.length !== 2) res = { error: 'Every column must use the same two categories.' };
    else {
      const p0 = pos ?? guessEvent(levels);
      const data = [];
      let dropped = 0;
      for (let i = 0; i < ds.n; i++) {
        const vals = cs.map((c) => c.raw[i]);
        if (vals.some(isMissing)) { dropped++; continue; }
        data.push(vals.map((v) => (v === p0 ? 1 : 0)));
      }
      res = data.length < 2 ? { error: 'Needs complete data on at least two participants.' } : R.runCochranQ({ data, names, positive: p0, adjustMethod: adj });
      if (!res.error) res.code = { kind: 'cq', cols: names, positive: p0 };
      if (dropped && !res.error) res.checks = [{ ok: null, text: `${dropped} participant${dropped === 1 ? '' : 's'} with a missing value left out.` }];
    }
  } else if (names.length) res = { error: 'Pick at least three columns.' };
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <ColumnsPick ds={ds} kind="binary" value={names} onChange={setNames} label="Yes/no measurements on the same people" />
        <div class="fields">
          {levels.length === 2 ? <SelectField label="Category counted" value={pos ?? guessEvent(levels)} onChange={setPos} options={levels.map((l) => ({ value: l, label: l }))} /> : null}
          <SelectField label="Adjust pairwise p-values" value={adj} onChange={setAdj} options={['holm', 'bonferroni', 'bh'].map((m) => ({ value: m, label: ADJUST_METHODS[m] }))} />
        </div>
      </section>
      <ResultView res={res} />
    </>
  );
}

/* One proportion (p1) */
function OnePropRunner({ ds, mode }) {
  const [c, setC] = useState(null), [ev, setEv] = useState(null), [p0s, setP0] = useState('50');
  const [s, setS] = useState({ x: '64', n: '120' });
  const p0 = num(p0s) / 100;
  const p0Field = <NumberField label="Expected proportion (%)" value={p0s} onInput={setP0} hint="For example, a national or published figure" />;
  let res = null;
  if (mode === 'summary') {
    const x = num(s.x), n = num(s.n);
    const ok = Number.isInteger(x) && Number.isInteger(n) && n > 0 && x >= 0 && x <= n && p0 > 0 && p0 < 1;
    res = ok ? R.runOneProportion({ x, n, p0, what: 'the outcome' }) : { error: 'Enter whole numbers (events no more than n) and an expected percentage between 0 and 100.' };
    if (!res.error) res.code = { kind: 'p1', x, n, p0 };
    return (
      <>
        <section class="panel stack"><h2>Counts</h2>
          <div class="fields">
            <NumberField label="With the outcome" value={s.x} onInput={(v) => setS({ ...s, x: v })} inputMode="numeric" />
            <NumberField label="Total (n)" value={s.n} onInput={(v) => setS({ ...s, n: v })} inputMode="numeric" />
            {p0Field}
          </div>
        </section>
        <ResultView res={res} />
      </>
    );
  }
  if (!ds) return needData;
  const cc = col(ds, c);
  if (cc && p0 > 0 && p0 < 1) {
    const evName = ev ?? guessEvent(cc.levels);
    const present = cc.raw.filter((v) => !isMissing(v));
    res = R.runOneProportion({ x: present.filter((v) => v === evName).length, n: present.length, p0, what: `${pretty(c)} "${evName}"` });
    if (!res.error) res.code = { kind: 'p1', x: present.filter((v) => v === evName).length, n: present.length, p0 };
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="Variable" value={c} onChange={(v) => { setC(v); setEv(null); }} kind="group" maxLevels={12} />
          <LevelPick c={cc} value={ev} onChange={setEv} label="Category counted" />
          {p0Field}
        </div>
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Correlation (cor) */
function CorrRunner({ ds }) {
  const [a, setA] = useState(null), [b, setB] = useState(null), [m, setM] = useState('auto');
  if (!ds) return needData;
  const ca = col(ds, a), cb = col(ds, b);
  let res = null;
  if (ca && cb) {
    if (a === b) res = { error: 'Pick two different columns.' };
    else {
      const { rows, dropped } = completeRows([ca, cb]);
      res = rows.length < 4 ? { error: 'Needs at least four complete pairs.' } : R.runCorrelation({ x: rows.map((r) => r[0]), y: rows.map((r) => r[1]), names: [a, b], method: m });
      if (!res.error) res.code = { kind: 'cor', x: a, y: b, method: res.method };
      if (dropped && !res.error) res.checks = [{ ok: null, text: `${dropped} row${dropped === 1 ? '' : 's'} with a missing value left out.` }, ...res.checks];
    }
  }
  return (
    <>
      <section class="panel stack"><h2>Columns</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="First variable (x)" value={a} onChange={setA} kind="numeric" />
          <ColumnSelect ds={ds} label="Second variable (y)" value={b} onChange={setB} kind="numeric" />
        </div>
        <Seg label="Coefficient" value={m} onChange={setM} options={[{ value: 'auto', label: 'Choose for me' }, { value: 'pearson', label: 'Pearson' }, { value: 'spearman', label: 'Spearman' }, { value: 'kendall', label: 'Kendall' }]} />
      </section>
      <ResultView res={res} />
    </>
  );
}

/* Adjust p-values (adj) */
function AdjustRunner() {
  const [text, setText] = useState('Hb by residence, 0.012\nHb by trimester, 0.034\nBMI by parity, 0.21\nAge by adherence, 0.048\nHb change by adherence, 0.0004');
  const [m, setM] = useState('holm');
  const id = useId('padj');
  const items = text.split(/\r?\n/).map((line, i) => {
    const t = line.trim();
    if (!t) return null;
    const mm = t.match(/^(.*?)[,\t;:]\s*([0-9.eE\-−]+)\s*$/);
    const p = num(mm ? mm[2] : t);
    return Number.isFinite(p) && p >= 0 && p <= 1 ? { label: mm ? mm[1].trim() || `Test ${i + 1}` : `Test ${i + 1}`, p } : { bad: t };
  }).filter(Boolean);
  const bad = items.filter((x) => x.bad);
  const good = items.filter((x) => !x.bad);
  const res = bad.length ? { error: `Not read as a p-value: ${bad.slice(0, 3).map((x) => `"${x.bad}"`).join(', ')}. Put one p-value per line, optionally after a label and a comma.` }
    : good.length < 2 ? { error: 'Enter at least two p-values.' } : R.runAdjust({ items: good, method: m });
  if (!res.error) res.code = { kind: 'adj', items: good, method: m };
  return (
    <>
      <section class="panel stack"><h2>p-values</h2>
        <div class="field"><label for={id}>One per line, optionally "label, p"</label>
          <textarea id={id} class="paste" rows={6} value={text} onInput={(e) => setText(e.currentTarget.value)} spellcheck={false} /></div>
        <SelectField label="Method to report" value={m} onChange={setM} options={['holm', 'bonferroni', 'hochberg', 'bh', 'by'].map((q) => ({ value: q, label: ADJUST_METHODS[q] }))} />
      </section>
      <ResultView res={res} />
    </>
  );
}

/* ---------------------------------------------------------------- page --- */

function Runner({ testId, setTestId }) {
  const ds = useDataset();
  const t = byId[testId];
  const [modeSel, setMode] = useState(null);
  const mode = !t.data ? 'summary' : !t.summary ? 'data' : modeSel ?? (ds ? 'data' : 'summary');
  const groups = [...new Set(TESTS.map((x) => x.group))];
  const pickId = useId('pick');
  const props = { id: testId, ds, mode };
  const body = {
    t2: TwoGroupsRunner, mw: TwoGroupsRunner, t1: OneSampleRunner, w1: OneSampleRunner, tp: PairedRunner, wp: PairedRunner,
    aov: ManyGroupsRunner, kw: ManyGroupsRunner, rm: RepeatedRunner, fr: RepeatedRunner, chi: TableRunner, p2: TwoPropRunner,
    mcn: McNemarRunner, cq: CochranRunner, p1: OnePropRunner, cor: CorrRunner, adj: AdjustRunner,
  }[testId];
  const Body = body;
  return (
    <div class="stack">
      {t.data ? <DataPanel compact={false} /> : null}
      <section class="panel stack" aria-labelledby="pick-h">
        <h2 id="pick-h">Test</h2>
        <div class="field">
          <label for={pickId}>Choose a test</label>
          <select id={pickId} value={testId} onChange={(e) => { setTestId(e.currentTarget.value); setMode(null); }}>
            {groups.map((g) => <optgroup label={g}>{TESTS.filter((x) => x.group === g).map((x) => <option value={x.id}>{x.name}</option>)}</optgroup>)}
          </select>
        </div>
        <Mode test={t} mode={mode} setMode={setMode} hasData={!!ds} />
      </section>
      <Body key={`${testId}-${mode}`} {...props} />
    </div>
  );
}

export default function TestsTool() {
  const [tab, setTab] = useState('choose');
  const [testId, setTestId] = useState('t2');
  const run = (id) => { setTestId(id); setTab('run'); window.scrollTo(0, 0); };
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} eyebrow="Analyse"
        title="Choose and Run a Test"
        lede="Answer four questions to find the right test, then run it on your data or on summary figures. Every result gives the estimate with its 95% CI, the test, an effect size, the checks, and a sentence for your paper." />
      <div style="margin-bottom:18px">
        <Seg wide value={tab} onChange={setTab} options={[{ value: 'choose', label: 'Choose a test' }, { value: 'run', label: 'Run a test' }]} />
      </div>
      {tab === 'choose' ? <Chooser onRun={run} /> : <Runner testId={testId} setTestId={setTestId} />}
      <section class="panel prose" style="margin-top:18px" aria-labelledby="tref-h">
        <h2 id="tref-h">How the tests are computed</h2>
        <p>Every test is checked against SciPy, statsmodels, pingouin or exact enumeration before release. Small samples without ties get exact p-values for the Mann-Whitney, Wilcoxon and Kendall tests, as in R. Effect sizes for t-tests carry exact confidence intervals from the noncentral t distribution.</p>
        <AtLevel min="intermediate">
          <p>A p-value answers one narrow question. Report the estimate and its confidence interval first; the p-value adds the strength of evidence against "no difference". When you run several tests on the same data, adjust their p-values or name one primary outcome in advance.</p>
        </AtLevel>
        <Refs refs={REFS} ids={['kirkwood', 'asa']} />
      </section>
    </div>
  );
}
