/* Tool: meta-analysis. A study table for 2 x 2 counts, means and SDs, single proportions or reported
 * estimates with CIs (typed or pasted from Excel); inverse-variance fixed-effect and random-effects
 * pooling (Paule-Mandel, REML or DerSimonian-Laird tau-squared, optional Hartung-Knapp-Sidik-Jonkman
 * CI), or Mantel-Haenszel and Peto pooling for 2 x 2 counts; heterogeneity with intervals; the
 * prediction interval; subgroups; leave-one-out; forest and funnel plots; Egger's test; a sentence for
 * the results section. */
import { useState } from 'preact/hooks';
import { binaryEffect, continuousEffect, proportionEffect, reportedEffect, pool, subgroups, leaveOneOut, egger, poolMH, poolPeto, subgroupsMH } from '../../engine/meta.js';
import { parseDelimited } from '../../engine/data.js';
import { fixed, pValue, count, sig, parseNumber, ratio } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, TextField } from '../../ui/core.jsx';
import { DataTable, Report, Stats, Refs, Disclose } from '../../ui/results.jsx';
import { ForestPlot, FunnelPlot } from '../../ui/plot.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';

const Z = 1.959963984540054;
const P = (p) => pValue(p).report;
const pct = (v) => fixed(100 * v, 0);

const TYPES = {
  binary: { label: 'Events and totals', groups: true, cols: (g) => [`Events, ${g[0]}`, `Total, ${g[0]}`, `Events, ${g[1]}`, `Total, ${g[1]}`],
    measures: [{ value: 'OR', label: 'Odds ratio' }, { value: 'RR', label: 'Risk ratio' }, { value: 'RD', label: 'Risk difference' }] },
  continuous: { label: 'Means and SDs', groups: true, cols: (g) => [`Mean, ${g[0]}`, `SD, ${g[0]}`, `n, ${g[0]}`, `Mean, ${g[1]}`, `SD, ${g[1]}`, `n, ${g[1]}`],
    measures: [{ value: 'MD', label: 'Mean difference' }, { value: 'SMD', label: "Standardised mean difference (Hedges' g)" }] },
  proportion: { label: 'One proportion per study', groups: false, cols: () => ['Events', 'Total'], measures: [{ value: 'PLO', label: 'Proportion (pooled on the logit scale)' }] },
  reported: { label: 'Estimate with 95% CI', groups: true, cols: () => ['Estimate', 'Lower 95% limit', 'Upper 95% limit'],
    measures: [{ value: 'ratio', label: 'Ratio (OR, RR, HR)' }, { value: 'diff', label: 'Difference (MD, RD, coefficient)' }] },
};

/* Illustrative numbers for trying the tool. They are not real studies. */
const EX = {
  binary: [['Study A', 18, 120, 30, 118, 'Facility'], ['Study B', 25, 210, 41, 205, 'Community'], ['Study C', 9, 64, 12, 60, 'Facility'], ['Study D', 40, 300, 52, 310, 'Community'],
    ['Study E', 12, 95, 25, 90, 'Facility'], ['Study F', 30, 150, 31, 148, 'Community'], ['Study G', 7, 80, 16, 82, 'Facility']],
  continuous: [['Study A', 1.1, 0.9, 60, 0.6, 1.0, 58, ''], ['Study B', 0.8, 1.2, 110, 0.5, 1.1, 105, ''], ['Study C', 1.4, 1.0, 45, 0.7, 0.9, 47, ''],
    ['Study D', 0.6, 0.8, 150, 0.5, 0.9, 148, ''], ['Study E', 1.2, 1.3, 38, 0.4, 1.2, 40, ''], ['Study F', 0.9, 1.0, 80, 0.8, 1.1, 82, '']],
  proportion: [['Survey A', 120, 300, ''], ['Survey B', 210, 450, ''], ['Survey C', 55, 180, ''], ['Survey D', 300, 520, ''], ['Survey E', 88, 250, ''], ['Survey F', 150, 310, ''], ['Survey G', 60, 200, ''], ['Survey H', 400, 700, '']],
  ratio: [['Study A', 1.8, 1.2, 2.7, ''], ['Study B', 2.3, 1.4, 3.9, ''], ['Study C', 1.4, 0.9, 2.2, ''], ['Study D', 2.9, 1.6, 5.3, ''], ['Study E', 1.6, 1.1, 2.4, ''], ['Study F', 2.1, 1.3, 3.4, '']],
  diff: [['Study A', 0.42, 0.1, 0.74, ''], ['Study B', 0.25, -0.05, 0.55, ''], ['Study C', 0.61, 0.2, 1.02, ''], ['Study D', 0.18, -0.12, 0.48, ''], ['Study E', 0.35, 0.05, 0.65, '']],
};
const exKey = (type, measure) => (type === 'reported' ? measure : type);
let rowId = 0;
const toRows = (ex) => ex.map((r) => ({ id: ++rowId, study: String(r[0]), vals: r.slice(1, -1).map(String), sub: String(r[r.length - 1] ?? '') }));
const blankRow = (n) => ({ id: ++rowId, study: '', vals: Array(n).fill(''), sub: '' });
const DEFAULT_GROUPS = { binary: ['Intervention', 'Control'], continuous: ['Intervention', 'Control'], reported: ['Exposed', 'Unexposed'], proportion: ['', ''] };
const MEASURE_NAME = { OR: 'odds ratio', RR: 'risk ratio', RD: 'risk difference', MD: 'mean difference', SMD: "standardised mean difference (Hedges' g)", PLO: 'proportion', ratio: 'ratio', diff: 'difference' };
const METHOD_NAME = { PM: 'Paule-Mandel', REML: 'restricted maximum likelihood', DL: 'DerSimonian-Laird' };

/** Turn the typed rows into effects y with variances v (analysis scale), or errors. */
function readStudies(type, measure, rows) {
  const studies = [], errors = [], excluded = [], warnings = [];
  rows.forEach((r, i) => {
    if (!r.study.trim() && r.vals.every((x) => !String(x).trim())) return;
    const name = r.study.trim() || `Study ${i + 1}`;
    const x = r.vals.map((s) => parseNumber(s));
    if (x.some((v) => !Number.isFinite(v))) { errors.push(`${name}: fill in every number.`); return; }
    let e = null, N = null, shown = null;
    if (type === 'binary') {
      const [e1, n1, e2, n2] = x;
      if (![e1, n1, e2, n2].every(Number.isInteger)) { errors.push(`${name}: events and totals must be whole numbers.`); return; }
      if (n1 < 1 || n2 < 1 || e1 < 0 || e2 < 0 || e1 > n1 || e2 > n2) { errors.push(`${name}: events must lie between 0 and the group total.`); return; }
      e = { ...binaryEffect(e1, n1, e2, n2, measure), counts: [e1, n1, e2, n2] }; N = n1 + n2;
    } else if (type === 'continuous') {
      const [m1, s1, n1, m2, s2, n2] = x;
      if (!(s1 > 0 && s2 > 0)) { errors.push(`${name}: SDs must be above zero.`); return; }
      if (!(Number.isInteger(n1) && Number.isInteger(n2) && n1 >= 2 && n2 >= 2)) { errors.push(`${name}: each group needs a whole-number n of at least 2.`); return; }
      e = continuousEffect(m1, s1, n1, m2, s2, n2, measure); N = n1 + n2;
    } else if (type === 'proportion') {
      const [ev, n] = x;
      if (!(Number.isInteger(ev) && Number.isInteger(n) && n >= 1 && ev >= 0 && ev <= n)) { errors.push(`${name}: events must be a whole number between 0 and the total.`); return; }
      e = proportionEffect(ev, n); N = n;
    } else {
      const [est, lo, hi] = x;
      const isR = measure === 'ratio';
      if (isR && !(est > 0 && lo > 0 && hi > 0)) { errors.push(`${name}: ratios and their limits must be above zero.`); return; }
      if (!(lo < hi && lo <= est && est <= hi)) { errors.push(`${name}: the estimate must lie between the lower and upper limits, with the lower limit first.`); return; }
      e = reportedEffect(est, lo, hi, { ratio: isR });
      const t = isR ? Math.log : (v) => v;
      const mid = (t(lo) + t(hi)) / 2, half = (t(hi) - t(lo)) / 2;
      if (Math.abs(t(est) - mid) > 0.25 * half) warnings.push(`${name}: the estimate is not in the middle of its CI${isR ? ' on the log scale' : ''}. Check the figures; the CI may come from another method.`);
      shown = [est, lo, hi];
    }
    if (e.excluded) { excluded.push(`${name} (${e.excluded})`); return; }
    if (!(e.v > 0) || !Number.isFinite(e.y)) { errors.push(`${name}: these numbers give no usable estimate.`); return; }
    studies.push({ name, sub: r.sub.trim(), y: e.y, v: e.v, corrected: !!e.corrected, N, shown, counts: e.counts });
  });
  return { studies, errors, excluded, warnings };
}

function StudyTable({ type, measure, rows, setRows, groups, useSub }) {
  const cols = TYPES[type].cols(groups);
  const set = (id, patch) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <div class="tablewrap">
      <table class="table compact entry">
        <thead><tr><th scope="col">Study</th>{cols.map((c) => <th scope="col">{c}</th>)}{useSub ? <th scope="col">Subgroup</th> : null}<th scope="col"><span class="vh">Remove</span></th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr>
            <td><input class="name" aria-label={`Study ${i + 1} name`} value={r.study} onInput={(e) => set(r.id, { study: e.currentTarget.value })} /></td>
            {cols.map((c, j) => <td><input inputMode="decimal" aria-label={`${r.study || `Study ${i + 1}`}: ${c}`} value={r.vals[j]} onInput={(e) => set(r.id, { vals: r.vals.map((v, q) => (q === j ? e.currentTarget.value : v)) })} /></td>)}
            {useSub ? <td><input aria-label={`${r.study || `Study ${i + 1}`}: subgroup`} value={r.sub} onInput={(e) => set(r.id, { sub: e.currentTarget.value })} /></td> : null}
            <td class="rm"><button type="button" class="btn ghost small" aria-label={`Remove ${r.study || `study ${i + 1}`}`} onClick={() => setRows(rows.length > 1 ? rows.filter((x) => x.id !== r.id) : [blankRow(cols.length)])}>{'×'}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function PasteBox({ ncols, onRows }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const use = () => {
    const { rows } = parseDelimited(text);
    const out = [];
    let sub = false;
    for (const r of rows) {
      const nums = r.slice(1, 1 + ncols);
      if (nums.length < ncols || nums.some((s) => !Number.isFinite(parseNumber(s)))) continue; // header or short row
      const s = (r[1 + ncols] || '').trim();
      if (s) sub = true;
      out.push({ id: ++rowId, study: (r[0] || '').trim(), vals: nums.map((v) => v.trim()), sub: s });
    }
    if (!out.length) { setMsg(`No rows read. Each row needs the study name and then ${ncols} numbers, in the order of the table.`); return; }
    setMsg('');
    onRows(out, sub);
    setText('');
  };
  return (
    <Disclose title="Paste rows from Excel or Google Sheets">
      <p class="small">One study per row: the name, then the {ncols} numbers in the order of the table, and the subgroup last if you use subgroups. A header row is skipped.</p>
      <textarea class="paste" rows={5} value={text} onInput={(e) => setText(e.currentTarget.value)} aria-label="Paste study rows" spellcheck={false} />
      {msg ? <p class="err" role="alert">{msg}</p> : null}
      <div class="btn-row"><button type="button" class="btn primary small" disabled={!text.trim()} onClick={use}>Use these rows</button></div>
    </Disclose>
  );
}

export default function MetaTool() {
  const [type, setTypeRaw] = useState('binary');
  const [measures, setMeasures] = useState({ binary: 'OR', continuous: 'MD', proportion: 'PLO', reported: 'ratio' });
  const measure = measures[type];
  const [rowsBy, setRowsBy] = useState(() => ({ binary: toRows(EX.binary), continuous: toRows(EX.continuous), proportion: toRows(EX.proportion), reported: toRows(EX.ratio) }));
  const [subBy, setSubBy] = useState({ binary: false, continuous: false, proportion: false, reported: false });
  const [repName, setRepName] = useState({ ratio: '', diff: '' });
  const [groupsBy, setGroupsBy] = useState(DEFAULT_GROUPS);
  const [model, setModel] = useState('random');
  const [method, setMethod] = useState('PM');
  const [hksj, setHksj] = useState(true);
  const [poolingSel, setPooling] = useState('iv');
  const rows = rowsBy[type], useSub = subBy[type], groups = groupsBy[type];
  const setRows = (r) => setRowsBy({ ...rowsBy, [type]: r });
  const ncols = TYPES[type].cols(groups).length;
  const isRatio = ['OR', 'RR', 'ratio'].includes(measure);
  const isProp = measure === 'PLO';
  const disp = isRatio ? Math.exp : isProp ? (v) => 1 / (1 + Math.exp(-v)) : (v) => v;
  const fmt = isRatio ? (v) => ratio(v) : isProp ? (v) => `${fixed(100 * v, 1)}%` : measure === 'RD' ? (v) => fixed(v, 3) : (v) => fixed(v, 2);
  const show = (y) => fmt(disp(y));
  const showCI = (c) => `${show(c[0])} to ${show(c[1])}`;
  const mName = (type === 'reported' && repName[measure].trim()) || MEASURE_NAME[measure];

  const { studies, errors, excluded, warnings } = readStudies(type, measure, rows);
  const k = studies.length;
  // Mantel-Haenszel and Peto pool 2 x 2 counts; Peto gives odds ratios only.
  const pooling = type !== 'binary' ? 'iv' : poolingSel === 'peto' && measure !== 'OR' ? 'mh' : poolingSel;
  const petoSwapped = type === 'binary' && poolingSel === 'peto' && measure !== 'OR';
  const common = pooling !== 'iv';
  const random = !common && model === 'random';
  const POOL_NAME = { mh: 'Mantel-Haenszel', peto: 'Peto' };
  let body = null;
  if (errors.length) body = <Callout kind="warn" mark="Check">{errors.slice(0, 8).map((e) => <p>{e}</p>)}</Callout>;
  else if (k < 2) body = <Callout mark="Studies"><p>Enter at least two studies with complete numbers.</p></Callout>;
  else {
    const y = studies.map((s) => s.y), v = studies.map((s) => s.v);
    const opts = { method, hksj, conf: 0.95 };
    const fit = pool(y, v, opts);
    const counts = common ? studies.map((s) => s.counts) : null;
    const poolC = (c) => (pooling === 'peto' ? poolPeto(c) : poolMH(c, measure));
    const cfit = common ? poolC(counts) : null;
    // The heterogeneity figures come from the method in use.
    const het = common ? cfit : fit;
    const est = common ? cfit.y : random ? fit.re : fit.fe, ci = common ? cfit.ci : random ? fit.ciRE : fit.ciFE, p = common ? cfit.p : random ? fit.pRE : fit.pFE;
    const wts = common ? cfit.weights : random ? fit.weightsRE : fit.weightsFE;
    const subs = useSub ? studies.map((s) => s.sub || 'Not given') : null;
    const sg = useSub && new Set(subs).size > 1 ? (common ? subgroupsMH(counts, subs, { method: pooling === 'peto' ? 'Peto' : 'MH', measure }) : subgroups(y, v, subs, { random, ...opts })) : null;
    const sgEst = (g) => (common ? g.fit.y : random ? g.fit.re : g.fit.fe), sgCI = (g) => (common ? g.fit.ci : random ? g.fit.ciRE : g.fit.ciFE);
    const loo = k >= 3 ? (common ? counts.map((_, i) => poolC(counts.filter((__, j) => j !== i))) : leaveOneOut(y, v, opts)) : null;
    const eg = k >= 3 ? egger(y, v) : null;
    const N = studies.every((s) => s.N) ? studies.reduce((t, s) => t + s.N, 0) : null;
    // Study estimates as the method sees them: Peto's per-study odds ratio, or 0.5 added to tables with a zero cell.
    const shownEffect = (s, i) => (common && Number.isFinite(cfit.effects[i].y) ? cfit.effects[i] : s);
    const studyCI = (s, i) => { if (s.shown) return s.shown; const e = shownEffect(s, i); return [disp(e.y), disp(e.y - Z * Math.sqrt(e.v)), disp(e.y + Z * Math.sqrt(e.v))]; };
    const studyItem = (s, i) => { const [e, lo, hi] = studyCI(s, i); return { kind: 'study', label: s.name, est: e, lo, hi, weight: wts[i] }; };
    const pooledItem = (label, short, e, c, pi, w) => ({ kind: 'pooled', label, short, est: disp(e), lo: disp(c[0]), hi: disp(c[1]), pi: pi && Number.isFinite(pi[0]) ? pi.map(disp) : undefined, weight: w });
    const items = [];
    if (sg) {
      sg.fits.forEach((g) => {
        items.push({ kind: 'head', label: g.label });
        g.idx.forEach((i) => items.push(studyItem(studies[i], i)));
        const w = g.idx.reduce((t, i) => t + wts[i], 0);
        items.push(pooledItem(`Subtotal (${g.idx.length} ${g.idx.length === 1 ? 'study' : 'studies'})`, 'Subtotal', sgEst(g), sgCI(g), null, w));
      });
    } else studies.forEach((s, i) => items.push(studyItem(s, i)));
    items.push(pooledItem(common ? `${POOL_NAME[pooling]}, fixed effect` : random ? 'Random effects' : 'Fixed effect', 'Overall', est, ci, random && k >= 3 ? fit.pi : null, 1));
    const nullAt = isRatio ? 1 : isProp ? null : 0;
    const sides = TYPES[type].groups ? [`Lower in ${groups[0] || 'group 1'}`, `Higher in ${groups[0] || 'group 1'}`] : null;
    const tickFmt = isRatio ? (t) => sig(t, 2) : isProp ? (t) => `${Math.round(100 * t)}%` : (t) => sig(t, 3);
    const modelText = common ? `fixed-effect meta-analysis (${POOL_NAME[pooling]} method)` : random ? `random-effects meta-analysis (${METHOD_NAME[method]} estimate of τ²${hksj ? ', Hartung-Knapp-Sidik-Jonkman CI' : ''})` : 'fixed-effect (inverse-variance) meta-analysis';
    const say = `A ${modelText} of ${count(k)} studies${N ? ` (${count(N)} participants)` : ''} gave a pooled ${mName} of ${show(est)} (95% CI ${showCI(ci)}${isProp ? '' : `; ${P(p)}`}), with I² = ${pct(het.I2)}%${Number.isFinite(het.I2ci[0]) ? ` (95% CI ${pct(het.I2ci[0])}% to ${pct(het.I2ci[1])}%)` : ''}${random ? ` and τ² = ${sig(fit.tau2, 3)}` : ''}.${random && k >= 3 ? ` The 95% prediction interval for the ${isProp ? 'proportion in a new setting' : 'effect in a new study'} was ${showCI(fit.pi)}.` : ''}${sg ? ` The test for subgroup differences gave χ² = ${fixed(sg.Q, 2)}, df = ${sg.df} (${P(sg.p)}).` : ''}`;
    const arms = common ? studies.map((s) => s.counts[1] / s.counts[3]) : [];
    const unbalanced = arms.some((r) => r > 2 || r < 0.5);
    body = (
      <section class="panel stack result-panel" aria-labelledby="ma-h">
        <div><h2 id="ma-h" style="margin-bottom:6px">Pooled {mName} {show(est)}</h2>
          <p class="verdict-line mono">95% CI {showCI(ci)}{isProp ? '' : `; ${P(p)}`}; {common ? `${POOL_NAME[pooling]}, fixed effect` : random ? 'random effects' : 'fixed effect'}</p></div>
        <Stats items={[['Studies', count(k)], N ? ['Participants', count(N)] : null, ['Heterogeneity Q', `${fixed(het.Q, 2)} on ${het.df} df, ${P(het.pQ)}`],
          ['I² (95% CI)', `${pct(het.I2)}%${Number.isFinite(het.I2ci[0]) ? ` (${pct(het.I2ci[0])}% to ${pct(het.I2ci[1])}%)` : ''}`],
          common ? null : ['τ² (95% CI)', `${sig(fit.tau2, 3)} (${sig(fit.tau2ci[0], 3)} to ${sig(fit.tau2ci[1], 3)})`],
          random && k >= 3 ? ['95% prediction interval', showCI(fit.pi)] : null]} />
        <figure style="margin:0">
          <ForestPlot items={items} axis={isRatio ? 'log' : 'linear'} nullAt={nullAt} sides={sides} fmt={fmt} tickFmt={tickFmt} label="Forest plot" />
          <figcaption class="figcap">Squares: study estimates, sized by weight, with 95% CIs. Diamonds: pooled estimates{random && k >= 3 ? '; the dashed line across the overall diamond is the 95% prediction interval' : ''}.{isRatio ? ' Log scale.' : ''}{sides ? ` Left of the line of no effect: lower in ${groups[0] || 'group 1'}; right: higher.` : ''}</figcaption>
        </figure>
        <DataTable caption="Studies" columns={['Study', ...(useSub ? ['Subgroup'] : []), `${mName[0].toUpperCase()}${mName.slice(1)} (95% CI)`, `Weight, ${common ? POOL_NAME[pooling] : random ? 'random' : 'fixed'}`, 'Note']}
          rows={studies.map((s, i) => { const [e, lo, hi] = studyCI(s, i); return [s.name, ...(useSub ? [s.sub || 'Not given'] : []), `${fmt(e)} (${fmt(lo)} to ${fmt(hi)})`, `${fixed(100 * wts[i], 1)}%`, pooling === 'peto' ? '' : shownEffect(s, i).corrected ? '0.5 added to each cell, for this row only' : '']; })}
          numeric={useSub ? [2, 3] : [1, 2]} note={type === 'reported' ? 'CIs as entered; the analysis uses the standard error each CI implies.' : null} />
        <DataTable caption={common ? 'Methods compared' : 'Both models'} columns={['Model', 'Estimate (95% CI)', 'p']}
          rows={[...(common ? [[{ text: `${POOL_NAME[pooling]}, fixed effect`, cls: 'hl' }, { text: `${show(cfit.y)} (${showCI(cfit.ci)})`, cls: 'hl' }, { text: pValue(cfit.p).exact, cls: 'hl' }]] : []),
            ['Fixed effect (inverse variance)', `${show(fit.fe)} (${showCI(fit.ciFE)})`, isProp ? '—' : pValue(fit.pFE).exact],
            [`Random effects (${METHOD_NAME[method]}${hksj ? ', HKSJ' : ''})`, `${show(fit.re)} (${showCI(fit.ciRE)})`, isProp ? '—' : pValue(fit.pRE).exact]]} numeric={[1, 2]}
          note={common ? 'The inverse-variance rows use 0.5 added to tables with a zero cell; the Mantel-Haenszel and Peto estimates use the counts as they are.' : null} />
        {sg ? (
          <DataTable caption={`Subgroups: test for subgroup differences χ² = ${fixed(sg.Q, 2)}, df = ${sg.df}, ${P(sg.p)}`} columns={['Subgroup', 'Studies', 'Estimate (95% CI)', 'I²', 'τ²']}
            rows={sg.fits.map((g) => [g.label, count(g.idx.length), `${show(sgEst(g))} (${showCI(sgCI(g))})`, g.idx.length > 1 ? `${pct(g.fit.I2)}%` : '—', g.idx.length > 1 && !common ? sig(g.fit.tau2, 3) : '—'])}
            numeric={[1, 2, 3, 4]} note={`${common ? `Each subgroup is pooled by the ${POOL_NAME[pooling]} method.` : 'Each subgroup has its own τ².'} A subgroup difference is an observational comparison across studies, not a randomised one.`} />
        ) : null}
        {loo ? (
          <Disclose title="Leave-one-out analysis">
            <DataTable caption="Pooled result with each study left out" columns={['Study left out', 'Estimate (95% CI)', 'I²', 'τ²']}
              rows={loo.map((f, i) => [studies[i].name, common ? `${show(f.y)} (${showCI(f.ci)})` : `${show(random ? f.re : f.fe)} (${showCI(random ? f.ciRE : f.ciFE)})`, `${pct(f.I2)}%`, common ? '—' : sig(f.tau2, 3)])} numeric={[1, 2, 3]} />
          </Disclose>
        ) : null}
        {eg ? (
          <Disclose title="Small-study effects: funnel plot and Egger's test">
            <FunnelPlot y={y} se={v.map(Math.sqrt)} centre={est} label="Funnel plot" xLabel={`${mName[0].toUpperCase()}${mName.slice(1)}${isRatio ? ' (log scale)' : isProp ? ' (logit scale)' : ''}`}
              scale={isRatio ? 'log' : isProp ? 'logit' : 'linear'} />
            <p>Egger's test: intercept {fixed(eg.intercept, 2)} (95% CI {fixed(eg.ci[0], 2)} to {fixed(eg.ci[1], 2)}), t = {fixed(eg.t, 2)} on {eg.df} df, {P(eg.p)}.</p>
            {k < 10 ? <p class="small">With fewer than 10 studies, tests for funnel plot asymmetry have too little power to tell chance from real asymmetry (Sterne and colleagues 2011): read the plot, and do not rely on the test.</p> : null}
            <p class="small">Asymmetry has causes other than publication bias, including real differences between small and large studies.{measure === 'SMD' || measure === 'OR' ? ` For the ${mName}, the estimate and its standard error are linked, which can create some asymmetry by itself.` : ''}</p>
          </Disclose>
        ) : null}
        <div>
          <h3 class="sub">Checks</h3>
          <ul class="checks">
            {excluded.length ? <li class="info"><span class="mk">Note</span><span>Left out of the {mName}: {excluded.join('; ')}. Such a study carries no information on a ratio; a risk difference can use it.</span></li> : null}
            {studies.some((s) => s.corrected) ? <li class="info"><span class="mk">Note</span><span>0.5 was added to every cell of {studies.filter((s) => s.corrected).length === 1 ? 'one study' : `${studies.filter((s) => s.corrected).length} studies`} with a zero cell, the usual correction (Cochrane Handbook); it pulls those estimates slightly towards no effect.</span></li> : null}
            {warnings.map((w) => <li class="no"><span class="mk">Check</span><span>{w}</span></li>)}
            {!random && het.I2 > 0.3 ? <li class="no"><span class="mk">Check</span><span>A fixed-effect model assumes one true effect shared by every study; with I² of {pct(het.I2)}%, the random-effects model and its prediction interval describe the spread more honestly.</span></li> : null}
            {petoSwapped ? <li class="info"><span class="mk">Note</span><span>Peto's method pools odds ratios only, so the {mName} is pooled by the Mantel-Haenszel method.</span></li> : null}
            {pooling === 'peto' && (unbalanced || Math.abs(est) > Math.log(3)) ? <li class="no"><span class="mk">Check</span><span>Peto's method is biased when group sizes differ a lot within studies (here up to {fixed(Math.max(...arms.map((r) => Math.max(r, 1 / r))), 1)} to 1) or the effect is large; Mantel-Haenszel without zero-cell corrections is safer then (Greenland and Salvan 1990; Bradburn and colleagues 2007).</span></li> : null}
            {pooling === 'peto' && !unbalanced && Math.abs(est) <= Math.log(3) ? <li class="info"><span class="mk">Note</span><span>Peto's method suits rare events (under about 1%) when groups are of similar size and effects are not large (Bradburn and colleagues 2007).</span></li> : null}
            {pooling === 'mh' ? <li class="info"><span class="mk">Note</span><span>The Mantel-Haenszel estimate uses the counts as they are, so zero cells need no correction; only the study estimates shown in the plot add 0.5 to tables with a zero cell.</span></li> : null}
            {random && hksj && k <= 5 ? <li class="info"><span class="mk">Note</span><span>With 5 or fewer studies, especially of very unequal size, even the Hartung-Knapp-Sidik-Jonkman interval needs caution (IntHout and colleagues 2014).</span></li> : null}
            <li class="info"><span class="mk">Note</span><span>I² is the share of the variation in estimates due to heterogeneity rather than chance. The Cochrane Handbook reads 0% to 40% as possibly unimportant and 75% to 100% as considerable, with overlapping bands between; read it with its CI and with τ², which measures the spread itself.</span></li>
            {isProp ? <li class="info"><span class="mk">Note</span><span>Proportions are pooled on the logit scale and transformed back. In prevalence reviews heterogeneity is usually large; the prediction interval shows the range to expect in a new setting.</span></li> : null}
          </ul>
        </div>
        <Report text={say} />
        <CodeExport spec={{
          kind: 'meta', type, measure, model: common ? 'fixed' : model, method, hksj, subgroups: !!sg, pooling,
          studies: rows.filter((r) => r.study.trim() || r.vals.some((x) => String(x).trim())).map((r, i) => ({ name: r.study.trim() || `Study ${i + 1}`, vals: r.vals.map((x) => parseNumber(x)), sub: useSub ? r.sub.trim() || 'Not given' : '' })),
        }} />
        {common ? <AtLevel min="advanced"><p class="small">{pooling === 'peto' ? "Peto: log OR = Σ(O − E) / ΣV, SE = 1/√ΣV, where O is the events in the first group, E = n₁m/N its expectation and V = n₁n₂m(N − m) / (N²(N − 1)) its hypergeometric variance; each study's weight is V. Heterogeneity Q = Σ(O − E)²/V − (Σ(O − E))²/ΣV." : `Mantel-Haenszel ${mName}: ${measure === 'OR' ? 'Σ(ad/n) / Σ(bc/n), weights bc/n, with the Robins-Breslow-Greenland variance' : measure === 'RR' ? 'Σ(a·n₀/n) / Σ(c·n₁/n), weights c·n₁/n, with the Greenland-Robins variance' : 'Σ(a·n₀ − c·n₁)/n ÷ Σ(n₁n₀/n), weights n₁n₀/n, with the Sato-Greenland-Robins variance'}. Heterogeneity Q sums each study's squared distance from the pooled value, weighted by its inverse variance.`} The same as metafor's {pooling === 'peto' ? 'rma.peto' : 'rma.mh'} in R.</p></AtLevel> : null}
        {common ? null : <AtLevel min="advanced"><p class="small">Study weights are 1 / (v + τ²) for random effects and 1 / v for the fixed effect, with v the within-study variance on the analysis scale (log for ratios, logit for proportions). τ² by {METHOD_NAME[method]}{method === 'PM' ? ' (iterated until the generalised Q equals k − 1)' : method === 'REML' ? ' (maximising the restricted likelihood)' : ' (method of moments)'}, truncated at 0, with the Q-profile 95% CI. {hksj ? 'The Hartung-Knapp-Sidik-Jonkman CI scales the standard error by the weighted residual variance and uses t on k − 1 df. ' : ''}The prediction interval uses t on k − 2 df. The I² interval is the Higgins and Thompson test-based one.</p></AtLevel>}
        <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['cochraneHandbook', ...(pooling === 'mh' ? ['mantelHaenszel', measure === 'OR' ? 'rbg86' : measure === 'RR' ? 'greenlandRobins85' : 'satoGR89'] : pooling === 'peto' ? ['yusufPeto', 'greenlandSalvan', 'bradburn'] : []), ...(random ? [method === 'PM' ? 'pauleMandel' : method === 'REML' ? 'viechtbauer05' : 'dersimonian', 'veroniki', 'viechtbauer07'] : []), ...(random && hksj ? ['inthout'] : []), 'higginsI2', ...(random && k >= 3 ? ['higgins09'] : []), ...(sg ? ['borensteinHiggins'] : []), ...(eg ? ['egger', 'sterne11'] : [])]} /></div>
      </section>
    );
  }

  const setType = (t) => setTypeRaw(t);
  const loadExample = () => setRows(toRows(EX[exKey(type, measure)]));
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Synthesise' }]} title="Meta-Analysis"
        lede="Pool the results of several studies: odds and risk ratios, risk and mean differences, standardised mean differences, single proportions, or estimates reported with a CI. Fixed and random effects, heterogeneity, subgroups, forest and funnel plots, and a sentence for your paper." />
      <div class="stack">
        <section class="panel stack" aria-labelledby="mi-h">
          <h2 id="mi-h">Studies</h2>
          <Seg label="Each study reports" value={type} onChange={setType} options={Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label }))} />
          {TYPES[type].measures.length > 1 ? <Seg label="Effect measure" value={measure} onChange={(m) => setMeasures({ ...measures, [type]: m })} options={TYPES[type].measures} /> : null}
          {TYPES[type].groups ? (
            <div class="fields">
              <TextField label="First group" value={groups[0]} onInput={(v) => setGroupsBy({ ...groupsBy, [type]: [v, groups[1]] })} />
              <TextField label="Comparison group" value={groups[1]} onInput={(v) => setGroupsBy({ ...groupsBy, [type]: [groups[0], v] })} />
              {type === 'reported' ? <TextField label="Name of the measure" value={repName[measure]} placeholder={measure === 'ratio' ? 'For example, adjusted odds ratio' : 'For example, mean difference'} hint="Used in the result sentence" onInput={(v) => setRepName({ ...repName, [measure]: v })} /> : null}
            </div>
          ) : null}
          <StudyTable type={type} measure={measure} rows={rows} setRows={setRows} groups={groups} useSub={useSub} />
          <div class="btn-row">
            <button type="button" class="btn ghost small" onClick={() => setRows([...rows, blankRow(ncols)])}>Add a study</button>
            <button type="button" class="btn ghost small" onClick={() => setSubBy({ ...subBy, [type]: !useSub })} aria-pressed={useSub ? 'true' : 'false'}>{useSub ? 'Remove subgroups' : 'Add subgroups'}</button>
            <button type="button" class="btn ghost small" onClick={loadExample}>Load example</button>
            <button type="button" class="btn ghost small" onClick={() => setRows([blankRow(ncols), blankRow(ncols)])}>Clear</button>
          </div>
          <p class="small">The example numbers are illustrative, not real studies. Everything stays on this device.</p>
          <PasteBox ncols={ncols} onRows={(r, sub) => { setRows(r); if (sub) setSubBy({ ...subBy, [type]: true }); }} />
        </section>
        <section class="panel stack" aria-labelledby="mm-h">
          <h2 id="mm-h">Model</h2>
          {type === 'binary' ? <Seg label="Pooling method" value={poolingSel} onChange={setPooling} options={[{ value: 'iv', label: 'Inverse variance' }, { value: 'mh', label: 'Mantel-Haenszel' }, { value: 'peto', label: 'Peto (odds ratio)', disabled: measure !== 'OR', title: measure !== 'OR' ? 'Peto pools odds ratios only' : '' }]} /> : null}
          {common ? <p class="small">Mantel-Haenszel and Peto are fixed-effect (common-effect) methods that work from the counts, without zero-cell corrections. Mantel-Haenszel is the Cochrane default for 2 × 2 data under a fixed effect; Peto suits rare events in groups of similar size. For a random-effects model, choose inverse variance.</p> : null}
          {common ? null : <Seg label="Model" value={model} onChange={setModel} options={[{ value: 'random', label: 'Random effects' }, { value: 'fixed', label: 'Fixed effect' }]} />}
          {common ? null : random ? (
            <>
              <Seg label="Between-study variance (τ²)" value={method} onChange={setMethod} options={[{ value: 'PM', label: 'Paule-Mandel' }, { value: 'REML', label: 'REML' }, { value: 'DL', label: 'DerSimonian-Laird' }]} />
              <Seg label="CI for the pooled effect" value={hksj ? 'hksj' : 'wald'} onChange={(x) => setHksj(x === 'hksj')} options={[{ value: 'hksj', label: 'Hartung-Knapp-Sidik-Jonkman' }, { value: 'wald', label: 'Normal (Wald)' }]} />
              <p class="small">Paule-Mandel suits binary and continuous outcomes and REML continuous ones better than DerSimonian-Laird (Veroniki and colleagues 2016); the Hartung-Knapp-Sidik-Jonkman CI keeps error rates closer to 5% (IntHout and colleagues 2014). To reproduce an older analysis, such as RevMan 5's default, choose DerSimonian-Laird with the normal CI.</p>
            </>
          ) : <p class="small">A fixed-effect model assumes every study estimates one common effect.{type === 'binary' ? ' For 2 × 2 counts, the Mantel-Haenszel method is usually preferred to inverse variance under a fixed effect.' : ''}</p>}
        </section>
        {body}
      </div>
    </div>
  );
}
