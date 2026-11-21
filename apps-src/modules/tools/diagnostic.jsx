/* Tool: diagnostic accuracy and ROC. A test against a reference standard (sensitivity, specificity,
 * likelihood ratios, predictive values at any prevalence), ROC curves with their cut-offs, and two ROC
 * curves compared. From columns of the loaded data or typed counts. */
import { useState } from 'preact/hooks';
import { testAccuracy, atPrevalence, classifyValue, countTable, rocAnalysis, rocCutoffs, rocPaired, rocUnpaired, compareAucSummary, expandGrouped, autoDirection, compareBinaryTests } from '../../engine/diag.js';
import { isMissing } from '../../engine/data.js';
import { fixed, count, sig, ratio, parseNumber } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, NumberField, TextField, SelectField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col, exampleAgreementCsv, exampleCsv } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs, Disclose } from '../../ui/results.jsx';
import { RocPlot, ProportionCurves } from '../../ui/plot.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';
import { pretty, P, isInt, pc, pcCI, rCI, mrow, MCOLS, needData, Checks, RowsTable, readRows, mkRows, BinaryFrom, defaultRule, readRule, ruleText, readBinary, NEGATIVE, num } from './epishared.jsx';

/* --------------------------------------------------------- marker columns --- */

const DIRS = [{ value: 'auto', label: 'Decide from the data' }, { value: 'higher', label: 'Higher means the condition' }, { value: 'lower', label: 'Lower means the condition' }];
const ORDER_SCORE = [[NEGATIVE, 0], [/\b(mild|some|slight|low|minimal|occasional)\b/i, 1], [/\b(moderate|medium|often)\b/i, 2], [/\b(severe|marked|high|heavy|gross|always)\b/i, 3]];
/** A first guess at the order of categories, lowest first: none, mild, moderate, severe; others in place. */
function guessOrder(levels) {
  const score = (l) => { for (const [re, s] of ORDER_SCORE) if (re.test(String(l).trim())) return s; return 1.5; };
  return levels.map((l, i) => [l, score(l), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);
}
const sameSet = (a, b) => a && b && a.length === b.length && b.every((x) => a.includes(x));

function OrderList({ items, onChange, label }) {
  const move = (i, d) => { const a = [...items]; [a[i], a[i + d]] = [a[i + d], a[i]]; onChange(a); };
  return (
    <ol class="orderlist" aria-label={label}>
      {items.map((it, i) => (
        <li><span>{it}</span>
          <button type="button" class="btn ghost small" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${it} up`}>{'↑'}</button>
          <button type="button" class="btn ghost small" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${it} down`}>{'↓'}</button>
        </li>
      ))}
    </ol>
  );
}

/** A marker: a numeric column, or ordered categories; with the direction that points to the condition. */
function MarkerPick({ ds, label, value, onChange, order, onOrder, dir, onDir, exclude = [] }) {
  const c = col(ds, value);
  const cat = c && !c.numeric;
  return (
    <div class="stack" style="gap:10px">
      <ColumnSelect ds={ds} label={label} value={value} onChange={(v) => { onChange(v); onOrder(null); }} kind="any" exclude={exclude} hint="Numbers, or ordered categories (up to 12)" />
      {cat && c.levels.length <= 12 ? <div><span class="label">{`Order of ${pretty(value)}, lowest first`}</span><OrderList items={markerOrder(c, order)} onChange={onOrder} label={`Order of ${pretty(value)}`} /></div> : null}
      {c ? <Seg label={`Direction, ${label.toLowerCase()}`} value={dir} onChange={onDir} options={DIRS} /> : null}
    </div>
  );
}
const markerOrder = (c, order) => (order && sameSet(order, c.levels) ? order : guessOrder(c.levels));
/** Marker values as numbers: the column's numbers, or each category's place in the order (1 = lowest). */
function markerValues(c, order) {
  if (c.numeric) return c.numbers.map((v) => (v === null || !Number.isFinite(v) ? null : v));
  const ord = markerOrder(c, order);
  return c.raw.map((raw) => { const k = ord.indexOf(raw); return isMissing(raw) || k < 0 ? null : k + 1; });
}
/** How a cut-off reads: "≥ 11.2", or "Some pallor or higher" for ordered categories. */
const cutWords = (cut, higher, order) => (order ? `${order[cut - 1]} or ${higher ? 'higher' : 'lower'}` : `${higher ? '≥' : '≤'} ${num(cut)}`);

/* ------------------------------------------------- test against reference --- */

const DESIGNS = [{ value: 'cross', label: 'One sample (consecutive or random)' }, { value: 'case-control', label: 'With and without the condition recruited separately' }];
const EX_TABLE = [['90', '30'], ['10', '170']];
const LR_NAME = { log: 'log, Simel', score: 'score, Koopman' };

/** How far a likelihood ratio moves the probability (Jaeschke, Guyatt and Sackett 1994). */
function lrWords(lr, positive) {
  const x = positive ? lr : 1 / lr;
  if (!(x > 1)) return 'no shift towards the condition';
  return x >= 10 ? 'a large, often conclusive shift' : x >= 5 ? 'a moderate shift' : x >= 2 ? 'a small shift' : 'a slight, rarely useful shift';
}

function TestPanel({ ds, seed }) {
  const [design, setDesign] = useState('cross');
  const [modeSel, setMode] = useState(seed ? 'typed' : null);
  const mode = modeSel ?? (ds ? 'data' : 'typed');
  const [cells, setCells] = useState(seed ? [[String(seed.tp), String(seed.fp)], [String(seed.fn), String(seed.tn)]] : EX_TABLE);
  const [names, setNames] = useState({ test: seed?.test || '', ref: seed?.ref || '', cond: seed?.cond || '' });
  const [tc, setTc] = useState(null), [tRule, setTRule] = useState(null), [rc, setRc] = useState(null), [rRule, setRRule] = useState(null);
  const [prevText, setPrev] = useState(''), [prevSrc, setPrevSrc] = useState('');

  let tab = null, err = null, skipped = 0, spec = null, testLabel = names.test.trim(), refLabel = names.ref.trim();
  if (mode === 'data' && ds) {
    const ct = col(ds, tc), cr = col(ds, rc);
    if (ct && cr) {
      const a = readRule(tRule ?? defaultRule(ct)), b = readRule(rRule ?? defaultRule(cr));
      if (tc === rc) err = 'Pick two different columns: the test and the reference standard.';
      else if (a.error || b.error) err = a.error || b.error;
      else {
        tab = countTable(readBinary(ct, a.rule), readBinary(cr, b.rule)); skipped = tab.skipped;
        testLabel = testLabel || `${pretty(tc)} ${a.rule.kind === 'cut' ? ruleText(a.rule) : `(${ruleText(a.rule)})`}`;
        refLabel = refLabel || `${pretty(rc)} ${b.rule.kind === 'cut' ? ruleText(b.rule) : `(${ruleText(b.rule)})`}`;
        spec = { kind: 'diag', design, test: tc, testRule: a.rule, numericT: ct.numeric, ref: rc, refRule: b.rule, numericR: cr.numeric };
      }
    }
  } else if (mode === 'typed') {
    const v = cells.map((r) => r.map(parseNumber));
    if (!v.every((r) => r.every(isInt))) err = 'Enter whole-number counts in all four cells (0 is allowed).';
    else { tab = { tp: v[0][0], fp: v[0][1], fn: v[1][0], tn: v[1][1] }; spec = { kind: 'diag', design, table: [tab.tp, tab.fp, tab.fn, tab.tn] }; }
  }
  let res = null;
  if (tab && !err) {
    if (tab.tp + tab.fn === 0 || tab.fp + tab.tn === 0) err = 'The reference standard must find some people with the condition and some without.';
    else res = testAccuracy(tab, { design });
  }
  const pv = parseNumber(prevText);
  const prevOk = Number.isFinite(pv) && pv > 0 && pv < 100;
  if (spec && prevOk) spec.prevalence = pv / 100;
  const setCell = (i, j, val) => setCells(cells.map((r, x) => (x === i ? r.map((cv, y) => (y === j ? val : cv)) : r)));
  const setName = (k) => (v) => setNames({ ...names, [k]: v });

  return (
    <>
      <section class="panel stack" aria-labelledby="ta-h">
        <h2 id="ta-h">A test against a reference standard</h2>
        <Seg label="How the people were recruited" value={design} onChange={setDesign} options={DESIGNS} />
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'A table of counts' }]} />
        {mode === 'data' ? (ds ? (
          <div class="stack">
            <BinaryFrom ds={ds} label="Test being evaluated (index test)" value={tc} onChange={setTc} rule={tRule} onRule={setTRule} what="Test positive" />
            <BinaryFrom ds={ds} label="Reference standard" value={rc} onChange={setRc} rule={rRule} onRule={setRRule} exclude={[tc].filter(Boolean)} what="Condition present" />
          </div>
        ) : needData) : (
          <>
            <div class="tablewrap">
              <table class="table compact entry">
                <thead><tr><th scope="col">Test</th><th scope="col">Condition present</th><th scope="col">Condition absent</th></tr></thead>
                <tbody>{['Test positive', 'Test negative'].map((rl, i) => (
                  <tr><th scope="row">{rl}</th>{[0, 1].map((j) => <td><input inputMode="numeric" aria-label={`Count: ${rl}, condition ${j ? 'absent' : 'present'}`} value={cells[i][j]} onInput={(ev) => setCell(i, j, ev.currentTarget.value)} /></td>)}</tr>
                ))}</tbody>
              </table>
            </div>
            <p class="small">Illustrative numbers: replace them with yours. The condition is present or absent by the reference standard.</p>
          </>
        )}
        <div class="fields">
          <TextField label="Test (for the sentence)" value={names.test} onInput={setName('test')} placeholder="palmar pallor" />
          <TextField label="Reference standard (for the sentence)" value={names.ref} onInput={setName('ref')} placeholder="venous haemoglobin below 11 g/dL" />
          <TextField label="Condition (for the sentence)" value={names.cond} onInput={setName('cond')} placeholder="anaemia" />
        </div>
        <div class="fields">
          <NumberField label="Prevalence where the test will be used, % (optional)" value={prevText} onInput={setPrev}
            hint={design === 'case-control' ? 'Needed for predictive values: the sample prevalence was set by the design' : 'Or the pre-test probability for one patient; blank uses the sample prevalence'}
            error={prevText.trim() && !prevOk ? 'Enter a percentage above 0 and below 100.' : ''} />
          <TextField label="Source of that prevalence" value={prevSrc} onInput={setPrevSrc} placeholder="NFHS-5, Odisha, children 6-59 months" />
        </div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? <TestResult res={res} prev={prevOk ? pv / 100 : null} prevSrc={prevSrc.trim()} skipped={skipped} spec={spec}
        testLabel={testLabel || '[INSERT: index test]'} refLabel={refLabel || '[INSERT: reference standard]'} cond={names.cond.trim() || '[INSERT: condition]'} /> : null}
    </>
  );
}

function TestResult({ res, prev, prevSrc, skipped, spec, testLabel, refLabel, cond }) {
  const { se, sp, lrPos, lrNeg, dor, youden, n1, n0, N } = res;
  const cross = res.design !== 'case-control';
  // A prevalence given: predictive values there from the likelihood ratios. None: the sample's own (cross-sectional only).
  const atP = prev !== null ? atPrevalence(res, prev) : null;
  const markP = prev ?? (cross ? res.prev.est : null);
  const dorKey = dor ? (dor.auto === 'wald' ? 'woolf' : 'exact') : null;
  const lrCI = (r) => (r ? rCI(r[r.auto]) : '—');
  const measures = [
    mrow('Sensitivity', 'Wilson', pc(se.est), pcCI(se.wilson), true),
    mrow('Specificity', 'Wilson', pc(sp.est), pcCI(sp.wilson), true),
    mrow('Positive likelihood ratio', LR_NAME[lrPos.auto], ratio(lrPos.est), lrCI(lrPos), true),
    mrow('Negative likelihood ratio', LR_NAME[lrNeg.auto], ratio(lrNeg.est), lrCI(lrNeg), true),
    dor ? mrow('Diagnostic odds ratio', dorKey === 'woolf' ? 'Woolf' : 'exact', ratio(dor.est), rCI(dor[dorKey])) : null,
    mrow("Youden's J", 'Wald', fixed(youden.est, 2), `${fixed(youden.ci[0], 2)} to ${fixed(youden.ci[1], 2)}`),
    ...(cross ? [
      mrow('Positive predictive value in this sample', 'Wilson', pc(res.ppv?.est), res.ppv ? pcCI(res.ppv.wilson) : '—'),
      mrow('Negative predictive value in this sample', 'Wilson', pc(res.npv?.est), res.npv ? pcCI(res.npv.wilson) : '—'),
      mrow('Prevalence in this sample', 'Wilson', pc(res.prev.est), pcCI(res.prev.wilson)),
      mrow('Correctly classified', 'Wilson', pc(res.acc.est), pcCI(res.acc.wilson)),
    ] : []),
    mrow('Sensitivity', 'Clopper-Pearson', pc(se.est), pcCI(se.exact)),
    mrow('Specificity', 'Clopper-Pearson', pc(sp.est), pcCI(sp.exact)),
    lrPos[lrPos.auto === 'log' ? 'score' : 'log'] ? mrow('Positive likelihood ratio', LR_NAME[lrPos.auto === 'log' ? 'score' : 'log'], ratio(lrPos.est), rCI(lrPos[lrPos.auto === 'log' ? 'score' : 'log'])) : null,
    lrNeg[lrNeg.auto === 'log' ? 'score' : 'log'] ? mrow('Negative likelihood ratio', LR_NAME[lrNeg.auto === 'log' ? 'score' : 'log'], ratio(lrNeg.est), rCI(lrNeg[lrNeg.auto === 'log' ? 'score' : 'log'])) : null,
  ].filter(Boolean);
  // Predictive values across prevalence, for the plot.
  const xs = Array.from({ length: 99 }, (_, k) => (k + 1) / 100);
  const curves = xs.map((x) => atPrevalence(res, x));
  const series = [
    { label: 'Positive predictive value', ys: curves.map((c) => c.ppv.est), lo: curves.map((c) => c.ppv.ci?.[0] ?? NaN), hi: curves.map((c) => c.ppv.ci?.[1] ?? NaN) },
    { label: 'Negative predictive value', ys: curves.map((c) => c.npv.est), lo: curves.map((c) => c.npv.ci?.[0] ?? NaN), hi: curves.map((c) => c.npv.ci?.[1] ?? NaN) },
  ].map((s) => (s.lo.every(Number.isFinite) && s.hi.every(Number.isFinite) ? s : { label: s.label, ys: s.ys }));
  const full = (x) => x.est === 1;
  const say = `Against ${refLabel}, ${testLabel} had a sensitivity of ${pc(se.est)} (95% CI ${pcCI(se.wilson)}) and a specificity of ${pc(sp.est)} (95% CI ${pcCI(sp.wilson)}) in ${count(n1)} people with ${cond} and ${count(n0)} without; the positive likelihood ratio was ${ratio(lrPos.est)} (95% CI ${lrCI(lrPos)}) and the negative ${ratio(lrNeg.est)} (95% CI ${lrCI(lrNeg)}).${atP ? ` At a prevalence of ${pc(prev)}${prevSrc ? ` (${prevSrc})` : ' [INSERT: source of the prevalence]'}, the positive predictive value would be ${pc(atP.ppv.est)} (95% CI ${pcCI(atP.ppv.ci)}) and the negative predictive value ${pc(atP.npv.est)} (95% CI ${pcCI(atP.npv.ci)}).`
    : cross && res.ppv && res.npv ? ` In this sample (prevalence ${pc(res.prev.est)}), the positive predictive value was ${pc(res.ppv.est)} (95% CI ${pcCI(res.ppv.wilson)}) and the negative predictive value ${pc(res.npv.est)} (95% CI ${pcCI(res.npv.wilson)}).` : ''}`;
  return (
    <section class="panel stack result-panel" aria-labelledby="dg-h">
      <div><h2 id="dg-h" style="margin-bottom:6px">Sensitivity {pc(se.est)}, specificity {pc(sp.est)}</h2>
        <p class="verdict-line mono">95% CI {pcCI(se.wilson)} and {pcCI(sp.wilson)} (Wilson); LR+ {ratio(lrPos.est)}, LR− {ratio(lrNeg.est)}</p></div>
      <Stats items={[["Youden's J", `${fixed(youden.est, 2)} (${fixed(youden.ci[0], 2)} to ${fixed(youden.ci[1], 2)})`], dor ? ['Diagnostic odds ratio', `${ratio(dor.est)} (${rCI(dor[dorKey])})`] : null,
        cross ? ['Prevalence in this sample', pc(res.prev.est)] : null, cross ? ['Correctly classified', pc(res.acc.est)] : null, skipped ? ['Left out (missing)', count(skipped)] : null]} />
      <DataTable wrap caption={`The table (${count(N)} people)`} columns={['Test', 'Condition present', 'Condition absent']} numeric={[1, 2]}
        rows={[['Test positive', count(res.tp), count(res.fp)], ['Test negative', count(res.fn), count(res.tn)], ['Total', count(n1), count(n0)]]} />
      <DataTable wrap caption="Accuracy" columns={MCOLS} rows={measures} numeric={[1]} note="Highlighted: the measures reported above." />
      <div class="stack" style="gap:10px">
        <h3 class="sub">{atP ? `At a prevalence of ${pc(prev)}` : 'Predictive values and prevalence'}</h3>
        {atP ? <DataTable wrap caption={`Predictive values at a prevalence (pre-test probability) of ${pc(prev)}`} columns={MCOLS} numeric={[1]} rows={[
          mrow('Positive predictive value', `from the LR, ${LR_NAME[atP.ppv.method].split(',')[0]}`, pc(atP.ppv.est), pcCI(atP.ppv.ci), true),
          mrow('Negative predictive value', `from the LR, ${LR_NAME[atP.npv.method].split(',')[0]}`, pc(atP.npv.est), pcCI(atP.npv.ci), true),
          mrow('Probability of the condition after a negative test', '1 − NPV', pc(atP.postNeg.est), pcCI(atP.postNeg.ci)),
        ]} /> : cross ? <p class="small">The predictive values above are this sample's. Give the prevalence where the test will be used to see them there.</p>
          : <Callout mark="Prevalence">Give the prevalence where the test will be used to see predictive values: with people recruited by condition, the sample's own prevalence means nothing.</Callout>}
        <figure style="margin:0">
          <ProportionCurves xs={xs} series={series} mark={markP !== null ? { x: markP, label: pc(markP) } : null} xLabel="Prevalence (pre-test probability)" label="Positive and negative predictive values against prevalence, with 95% CIs" />
          <figcaption class="figcap">Predictive values across prevalence for this sensitivity and specificity, with 95% CIs from the likelihood ratios{markP !== null ? `; the dashed line marks ${prev !== null ? 'the prevalence you gave' : 'the sample prevalence'}` : ''}.</figcaption>
        </figure>
      </div>
      <Checks items={[
        res.small ? { text: 'A cell is below 5, so the likelihood ratios use Koopman\'s score interval and the diagnostic odds ratio the exact one.' } : null,
        full(se) ? { ok: false, text: `Sensitivity is 100% in ${count(n1)} people with ${cond}; the true value could be as low as ${pc(se.wilson[0])} (lower Wilson limit).` } : null,
        full(sp) ? { ok: false, text: `Specificity is 100% in ${count(n0)} people without ${cond}; the true value could be as low as ${pc(sp.wilson[0])}.` } : null,
        { text: `LR+ ${ratio(lrPos.est)}: a positive result gives ${lrWords(lrPos.est, true)}; LR− ${ratio(lrNeg.est)}: a negative result gives ${lrWords(lrNeg.est, false).replace('towards the condition', 'away from the condition')} (bands of Jaeschke and colleagues 1994: 10 and 0.1, 5 and 0.2, 2 and 0.5).` },
        !cross ? { text: 'People with and without the condition were recruited separately, so this sample\'s prevalence, predictive values and accuracy are not shown: they would reflect the design, not any population.' } : null,
        { text: 'Predictive values depend on prevalence: a test with good sensitivity and specificity can still have a low positive predictive value where the condition is rare. Sensitivity and specificity can also differ between settings with different case mix (Leeflang and colleagues 2013).' },
        { text: 'Who was tested, and how, shapes these numbers: severe cases against healthy volunteers inflate accuracy (spectrum bias), and checking only test-positives with the reference standard inflates sensitivity (verification bias). Report recruitment, blinding and verification as STARD 2015 asks; QUADAS-2 lists the same risks for reviewers.' },
      ]} />
      <Report text={say} />
      {spec ? <CodeExport spec={spec} /> : null}
      <AtLevel min="advanced"><p class="small">Sensitivity TP/(TP + FN) and specificity TN/(FP + TN) with Wilson intervals. LR+ = Se/(1 − Sp) and LR− = (1 − Se)/Sp, each a ratio of two independent proportions: Simel's log interval, var(ln LR+) = 1/TP − 1/(TP + FN) + 1/FP − 1/(FP + TN), when every cell is 5 or more, else Koopman's score interval. At prevalence p, post-test odds = p/(1 − p) × LR; carrying the log interval through gives the logit interval of Mercaldo, Lau and Zhou (2007). Youden's J = Se + Sp − 1 with var = Se(1 − Se)/n₁ + Sp(1 − Sp)/n₀.</p></AtLevel>
      <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['altmanBland94a', 'altmanBland94b', 'deeksAltman', 'wilson', 'simel', 'koopman', 'mercaldo', 'glas', 'youden', 'jaeschke', 'fagan', 'leeflang', 'ransohoff', 'stard', 'quadas2']} /></div>
    </section>
  );
}

/* ---------------------------------------------------------------- ROC curve --- */

// Hanley and McNeil (1982): ratings of 109 CT images, 51 abnormal and 58 normal by the reference standard.
const EX_GROUPED = [['1 Definitely normal', 3, 33], ['2 Probably normal', 2, 6], ['3 Questionable', 2, 6], ['4 Probably abnormal', 11, 11], ['5 Definitely abnormal', 33, 2]];

function RocPanel({ ds, onExamine }) {
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? (ds ? 'data' : 'typed');
  const [mc, setMc] = useState(null), [order, setOrder] = useState(null), [dir, setDir] = useState('auto');
  const [rc, setRc] = useState(null), [rRule, setRRule] = useState(null);
  const [rows, setRows] = useState(() => mkRows(EX_GROUPED));
  const [gDir, setGDir] = useState('higher');
  const [tSe, setTSe] = useState('90'), [tSp, setTSp] = useState('90');
  const [names, setNames] = useState({ marker: '', cond: '' });

  let y = null, x = null, err = null, higher = true, auto = false, ord = null, spec = null, skipped = 0;
  let marker = names.marker.trim(), refLabel = '';
  if (mode === 'data' && ds) {
    const cm = col(ds, mc), cr = col(ds, rc);
    if (cm && cr) {
      const b = readRule(rRule ?? defaultRule(cr));
      if (mc === rc) err = 'Pick two different columns: the marker and the reference standard.';
      else if (!cm.numeric && cm.levels.length > 12) err = 'The marker needs numbers, or ordered categories (12 at most).';
      else if (b.error) err = b.error;
      else {
        ord = cm.numeric ? null : markerOrder(cm, order);
        const yy = readBinary(cr, b.rule), xx = markerValues(cm, order);
        const ok = yy.map((v, i) => v !== null && xx[i] !== null);
        skipped = ok.filter((v) => !v).length;
        y = yy.filter((_, i) => ok[i]); x = xx.filter((_, i) => ok[i]);
        auto = dir === 'auto';
        higher = auto ? autoDirection(y, x) === 'higher' : dir === 'higher';
        marker = marker || pretty(mc); refLabel = `${pretty(rc)} ${b.rule.kind === 'cut' ? ruleText(b.rule) : `(${ruleText(b.rule)})`}`;
        spec = { kind: 'roc', marker: mc, numericM: cm.numeric, order: ord, higher, ref: rc, refRule: b.rule, numericR: cr.numeric };
      }
    }
  } else if (mode === 'typed') {
    const r = readRows(rows, { integer: [0, 1] });
    if (r.error) err = r.error;
    else if (r.rows.length < 2) err = 'Enter at least two categories, lowest first.';
    else {
      ord = r.rows.map((q) => q.label);
      const g = expandGrouped(r.rows.map((q) => ({ cases: q.x[0], controls: q.x[1] })));
      y = g.y; x = g.x; higher = gDir === 'higher';
      spec = { kind: 'roc', grouped: r.rows.map((q) => ({ label: q.label, cases: q.x[0], controls: q.x[1] })), higher };
    }
  }
  let res = null;
  if (y && !err) {
    const m = y.filter(Boolean).length;
    if (!m || m === y.length) err = 'The reference standard must find some people with the condition and some without.';
    else res = rocAnalysis(y, x, { higher });
  }
  const ts = parseNumber(tSe), tp = parseNumber(tSp);
  const targetsOk = ts > 0 && ts <= 100 && tp > 0 && tp <= 100;
  return (
    <>
      <section class="panel stack" aria-labelledby="ro-h">
        <h2 id="ro-h">ROC curve of a marker</h2>
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'Counts by category' }]} />
        {mode === 'data' ? (ds ? (
          <div class="stack">
            <MarkerPick ds={ds} label="Marker" value={mc} onChange={setMc} order={order} onOrder={setOrder} dir={dir} onDir={setDir} />
            <BinaryFrom ds={ds} label="Reference standard" value={rc} onChange={setRc} rule={rRule} onRule={setRRule} exclude={[mc].filter(Boolean)} what="Condition present" />
          </div>
        ) : needData) : (
          <>
            <RowsTable cols={['With the condition', 'Without']} rows={rows} setRows={setRows} what="category" numeric="numeric" />
            <Seg label="The condition is more likely in" value={gDir} onChange={setGDir} options={[{ value: 'higher', label: 'Later categories' }, { value: 'lower', label: 'Earlier categories' }]} />
            <p class="small">Categories lowest first. The example is the CT rating study of Hanley and McNeil (1982): 109 images, 51 abnormal.</p>
          </>
        )}
        <div class="fields">
          <TextField label="Marker (for the sentence)" value={names.marker} onInput={(v) => setNames({ ...names, marker: v })} placeholder="HemoCue haemoglobin" />
          <TextField label="Condition (for the sentence)" value={names.cond} onInput={(v) => setNames({ ...names, cond: v })} placeholder="anaemia" />
          <NumberField label="Target sensitivity, %" value={tSe} onInput={setTSe} error={tSe.trim() && !(ts > 0 && ts <= 100) ? 'A percentage up to 100.' : ''} />
          <NumberField label="Target specificity, %" value={tSp} onInput={setTSp} error={tSp.trim() && !(tp > 0 && tp <= 100) ? 'A percentage up to 100.' : ''} />
        </div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? <RocResult res={res} ord={ord} auto={auto} skipped={skipped} spec={spec} marker={marker || '[INSERT: marker]'} refLabel={refLabel} cond={names.cond.trim() || '[INSERT: condition]'}
        targets={targetsOk ? { targetSe: ts / 100, targetSp: tp / 100 } : {}} onExamine={onExamine} grouped={mode === 'typed'} /> : null}
    </>
  );
}

function RocResult({ res, ord, auto, skipped, spec, marker, refLabel, cond, targets, onExamine, grouped }) {
  const { m, n, auc, ci, higher } = res;
  const cut = rocCutoffs(res, targets);
  const words = (p) => cutWords(p.cut, higher, ord);
  const yo = cut.youden[0] ?? null;
  const [pick, setPick] = useState(null);
  const chosen = res.points.find((p) => String(p.cut) === pick) ?? yo ?? res.points[Math.floor(res.points.length / 2)];
  const acc = testAccuracy({ tp: chosen.tp, fp: chosen.fp, fn: chosen.fn, tn: chosen.tn });
  const row = (name, p) => [name, p ? words(p) : 'None', p ? `${pc(p.se)}, ${pc(p.sp)}` : '—'];
  const coords = res.points.map((p) => [words(p), pc(p.se), pc(p.sp), fixed(p.j, 2)]);
  const ciText = `${fixed(ci[0], 2)} to ${fixed(ci[1], 2)}`;
  const yoAcc = yo ? testAccuracy({ tp: yo.tp, fp: yo.fp, fn: yo.fn, tn: yo.tn }) : null;
  const say = `The area under the ROC curve of ${marker} for ${cond}${refLabel ? ` (${refLabel})` : ''} was ${fixed(auc, 2)} (95% CI ${ciText}, DeLong) in ${count(m)} people with the condition and ${count(n)} without.${yo ? ` The cut-off with the largest Youden's J, ${words(yo)}, gave a sensitivity of ${pc(yo.se)} (95% CI ${pcCI(yoAcc.se.wilson)}) and a specificity of ${pc(yo.sp)} (95% CI ${pcCI(yoAcc.sp.wilson)}); it was chosen in these data and needs confirming in another sample.` : ''}`;
  return (
    <section class="panel stack result-panel" aria-labelledby="roc-h">
      <div><h2 id="roc-h" style="margin-bottom:6px">AUC = {fixed(auc, 2)}</h2>
        <p class="verdict-line mono">95% CI {ciText} (DeLong); {count(m)} with the condition, {count(n)} without</p></div>
      <Stats items={[['Best cut-off (Youden)', yo ? `${words(yo)}: Se ${pc(yo.se)}, Sp ${pc(yo.sp)}` : 'None better than chance'], ["Youden's J at that cut-off", yo ? fixed(yo.j, 2) : '—'],
        ['Direction', `${higher ? 'Higher' : 'Lower'} values mean the condition${auto ? ' (from the data)' : ''}`], skipped ? ['Left out (missing)', count(skipped)] : null]} />
      <figure style="margin:0">
        <RocPlot curves={[{ label: marker, path: res.path }]} marks={yo ? [{ fpr: 1 - yo.sp, tpr: yo.se, label: words(yo), i: 0 }] : []} label={`ROC curve of ${marker}, AUC ${fixed(auc, 2)}`} />
        <figcaption class="figcap">Sensitivity against 1 − specificity at every cut-off; the dot marks the largest Youden's J; the dashed diagonal is chance (AUC 0.5).</figcaption>
      </figure>
      <DataTable wrap caption="Cut-offs" columns={['Criterion', 'Positive if', 'Sensitivity, specificity']} numeric={[2]} rows={[
        row("Largest Youden's J", yo), row('Closest to the top-left corner', cut.topleft[0]),
        row(`Sensitivity at least ${pc(cut.targetSe, 0)}`, cut.forSe), row(`Specificity at least ${pc(cut.targetSp, 0)}`, cut.forSp),
      ]} />
      <div class="stack" style="gap:10px">
        <h3 class="sub">One cut-off in detail</h3>
        <div class="fields"><SelectField label="Cut-off" value={String(chosen.cut)} onChange={setPick} options={res.points.map((p) => ({ value: String(p.cut), label: `Positive if ${words(p)}` }))} /></div>
        <DataTable wrap caption={`Positive if ${words(chosen)}`} columns={MCOLS} numeric={[1]} rows={[
          mrow('Sensitivity', 'Wilson', pc(acc.se.est), pcCI(acc.se.wilson), true), mrow('Specificity', 'Wilson', pc(acc.sp.est), pcCI(acc.sp.wilson), true),
          mrow('Positive likelihood ratio', LR_NAME[acc.lrPos.auto], ratio(acc.lrPos.est), rCI(acc.lrPos[acc.lrPos.auto])),
          mrow('Negative likelihood ratio', LR_NAME[acc.lrNeg.auto], ratio(acc.lrNeg.est), rCI(acc.lrNeg[acc.lrNeg.auto])),
          mrow('Counts', 'TP, FP, FN, TN', `${chosen.tp}, ${chosen.fp}, ${chosen.fn}, ${chosen.tn}`, null),
        ]} />
        {onExamine ? <div class="btn-row"><button type="button" class="btn ghost small" onClick={() => onExamine({ tp: chosen.tp, fp: chosen.fp, fn: chosen.fn, tn: chosen.tn, test: `${marker} ${words(chosen)}`, ref: refLabel, cond: cond.startsWith('[') ? '' : cond })}>Predictive values for this cut-off</button></div> : null}
      </div>
      <Disclose title={`Every cut-off (${res.points.length})`}>
        <DataTable wrap caption="Sensitivity (Se), specificity (Sp) and Youden's J at each cut-off" columns={['Positive if', 'Se', 'Sp', 'J']} numeric={[1, 2, 3]} rows={coords} />
      </Disclose>
      <Checks items={[
        auto ? { text: `Direction taken from the data (the medians), as R's pROC does: ${higher ? 'higher' : 'lower'} values of ${marker} go with the condition. Set it to the direction you expected before seeing the data; choosing it from the data can flatter a weak marker.` } : null,
        auc < 0.5 ? { ok: false, text: `The AUC is below 0.5: in these data, ${higher ? 'lower' : 'higher'} values go with the condition. Check the direction and the coding of the reference standard.` } : null,
        yo ? { ok: false, text: 'A cut-off picked as the best in the same data overstates its sensitivity and specificity, most in small studies (Ewald 2006). Prespecify the cut-off, or confirm it in a new sample.' } : null,
        yo && cut.topleft[0] && cut.topleft[0].cut !== yo.cut ? { text: `Youden's J and the point closest to the top-left corner choose different cut-offs (${words(yo)} and ${words(cut.topleft[0])}); Perkins and Schisterman (2006) explain why, and favour J.` } : null,
        cut.youden.length > 1 ? { text: `${cut.youden.length} cut-offs share the largest Youden's J; the lowest is shown.` } : null,
        m < 20 || n < 20 ? { text: `With ${m} people with the condition and ${n} without, the DeLong interval is approximate; report the counts with it.` } : null,
        ord ? { text: `An ordinal marker of ${ord.length} categories gives a curve with ${ord.length - 1} corners; ties count as half in the AUC.` } : null,
        { text: 'The AUC is the probability that a person with the condition has a more abnormal value than one without (Hanley and McNeil 1982). It summarises every cut-off, including ones nobody would use; report sensitivity and specificity at the cut-off you recommend.' },
      ]} />
      <Report text={say} />
      {spec ? <CodeExport spec={spec} /> : null}
      <AtLevel min="advanced"><p class="small">Empirical ROC curve; AUC = P(X₁ &gt; X₀) + ½P(X₁ = X₀), the Mann-Whitney statistic over n₁n₀. DeLong's variance: var = S₁₀/n₁ + S₀₁/n₀ from the structural components, the share of controls each case exceeds and of cases each control falls below. CI on the AUC scale, cut at 0 and 1, as pROC. Cut-offs are observed values; a person is positive {higher ? 'at or above' : 'at or below'} the cut-off.{grouped ? ' Grouped counts are treated as tied values of the category number.' : ''}</p></AtLevel>
      <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['hanley', 'delong', 'pROC', 'altmanBland94c', 'youden', 'perkins', 'ewald', 'stard']} /></div>
    </section>
  );
}

/* ----------------------------------------------------- two curves compared --- */

const KINDS = [{ value: 'binary', label: 'Two tests, same people' }, { value: 'paired', label: 'Two markers, same people' }, { value: 'unpaired', label: 'One marker, two groups' }, { value: 'summary', label: 'Two published AUCs' }];

function ComparePanel({ ds }) {
  const [kind, setKind] = useState('binary');
  const [ma, setMa] = useState(null), [oa, setOa] = useState(null), [da, setDa] = useState('auto');
  const [mb, setMb] = useState(null), [ob, setOb] = useState(null), [db, setDb] = useState('auto');
  const [rc, setRc] = useState(null), [rRule, setRRule] = useState(null), [gc, setGc] = useState(null);
  const [sum, setSum] = useState({ a1: '0.85', l1: '0.80', h1: '0.90', a2: '0.75', l2: '0.68', h2: '0.82', n1: '', n2: '' });
  const [cond, setCond] = useState('');
  if (kind === 'binary') return <TwoTestsPanel ds={ds} kindSeg={<Seg label="Compare" value={kind} onChange={setKind} options={KINDS} />} />;

  let out = null, err = null, spec = null, labels = null;
  if (kind === 'summary') {
    const v = ['a1', 'l1', 'h1', 'a2', 'l2', 'h2'].map((k) => parseNumber(sum[k]));
    if (!v.every((t) => t >= 0 && t <= 1)) err = 'Enter each AUC and its 95% limits as numbers between 0 and 1.';
    else if (!(v[1] <= v[0] && v[0] <= v[2] && v[4] <= v[3] && v[3] <= v[5])) err = 'Each AUC must lie between its lower and upper limits.';
    else { out = { kind, ...compareAucSummary(v[0], [v[1], v[2]], v[3], [v[4], v[5]]), aucs: [[v[0], [v[1], v[2]]], [v[3], [v[4], v[5]]]] }; labels = [sum.n1.trim() || 'Study 1', sum.n2.trim() || 'Study 2']; }
  } else if (ds) {
    const cr = col(ds, rc), ca = col(ds, ma);
    if (cr && ca) {
      const b = readRule(rRule ?? defaultRule(cr));
      if (b.error) err = b.error;
      const y = b.rule ? readBinary(cr, b.rule) : null;
      const dirOf = (d, yy, xx) => (d === 'auto' ? autoDirection(yy, xx) === 'higher' : d === 'higher');
      if (!err && kind === 'paired') {
        const cb = col(ds, mb);
        if (cb) {
          if (new Set([ma, mb, rc]).size < 3) err = 'Pick three different columns: two markers and the reference standard.';
          else {
            const xa = markerValues(ca, oa), xb = markerValues(cb, ob);
            const ok = y.map((v, i) => v !== null && xa[i] !== null && xb[i] !== null);
            const yy = y.filter((_, i) => ok[i]), aa = xa.filter((_, i) => ok[i]), bb = xb.filter((_, i) => ok[i]);
            const hA = dirOf(da, yy, aa), hB = dirOf(db, yy, bb);
            if (!yy.some(Boolean) || yy.every(Boolean)) err = 'The reference standard must find some people with the condition and some without.';
            else {
              out = { kind, ...rocPaired(yy, aa, bb, { higherA: hA, higherB: hB }), dropped: ok.filter((v) => !v).length, autos: [da === 'auto', db === 'auto'] };
              labels = [pretty(ma), pretty(mb)];
              spec = { kind: 'roc2', paired: true, a: ma, numericA: ca.numeric, orderA: ca.numeric ? null : markerOrder(ca, oa), higherA: hA,
                b: mb, numericB: cb.numeric, orderB: cb.numeric ? null : markerOrder(cb, ob), higherB: hB, ref: rc, refRule: b.rule, numericR: cr.numeric };
            }
          }
        }
      } else if (!err && kind === 'unpaired') {
        const cg = col(ds, gc);
        if (cg) {
          if (new Set([ma, gc, rc]).size < 3) err = 'Pick three different columns: the marker, the reference standard and the groups.';
          else {
            const xa = markerValues(ca, oa);
            const ok = y.map((v, i) => v !== null && xa[i] !== null && !isMissing(cg.raw[i]));
            const [g1, g2] = cg.levels;
            const part = (g) => { const yy = [], xx = []; y.forEach((v, i) => { if (ok[i] && cg.raw[i] === g) { yy.push(v); xx.push(xa[i]); } }); return { yy, xx }; };
            const P1 = part(g1), P2 = part(g2);
            const h = dirOf(da, y.filter((_, i) => ok[i]), xa.filter((_, i) => ok[i]));
            if ([P1, P2].some((q) => !q.yy.some(Boolean) || q.yy.every(Boolean))) err = 'Each group needs some people with the condition and some without.';
            else {
              out = { kind, ...rocUnpaired(rocAnalysis(P1.yy, P1.xx, { higher: h }), rocAnalysis(P2.yy, P2.xx, { higher: h })), dropped: ok.filter((v) => !v).length, autos: [da === 'auto'] };
              labels = [`${pretty(gc)} "${g1}"`, `${pretty(gc)} "${g2}"`];
              spec = { kind: 'roc2', paired: false, a: ma, numericA: ca.numeric, orderA: ca.numeric ? null : markerOrder(ca, oa), higherA: h, group: gc, groups: [g1, g2], numericG: cg.numeric, ref: rc, refRule: b.rule, numericR: cr.numeric };
            }
          }
        }
      }
    }
  }
  const setS = (k) => (v) => setSum({ ...sum, [k]: v });
  return (
    <>
      <section class="panel stack" aria-labelledby="cm-h">
        <h2 id="cm-h">Two ROC curves compared</h2>
        <Seg label="Compare" value={kind} onChange={setKind} options={KINDS} />
        {kind === 'summary' ? (
          <>
            <div class="fields">
              <TextField label="First study (for the sentence)" value={sum.n1} onInput={setS('n1')} placeholder="Author, year" />
              <NumberField label="AUC, first study" value={sum.a1} onInput={setS('a1')} />
              <NumberField label="Lower 95% limit, first" value={sum.l1} onInput={setS('l1')} />
              <NumberField label="Upper 95% limit, first" value={sum.h1} onInput={setS('h1')} />
            </div>
            <div class="fields">
              <TextField label="Second study (for the sentence)" value={sum.n2} onInput={setS('n2')} placeholder="Author, year" />
              <NumberField label="AUC, second study" value={sum.a2} onInput={setS('a2')} />
              <NumberField label="Lower 95% limit, second" value={sum.l2} onInput={setS('l2')} />
              <NumberField label="Upper 95% limit, second" value={sum.h2} onInput={setS('h2')} />
            </div>
            <p class="small">Illustrative numbers: replace them with the published ones. Only for independent samples; two markers measured on the same people need the paired test, which needs the data.</p>
          </>
        ) : ds ? (
          <div class="stack">
            <MarkerPick ds={ds} label={kind === 'paired' ? 'First marker' : 'Marker'} value={ma} onChange={setMa} order={oa} onOrder={setOa} dir={da} onDir={setDa} exclude={[mb, rc].filter(Boolean)} />
            {kind === 'paired' ? <MarkerPick ds={ds} label="Second marker" value={mb} onChange={setMb} order={ob} onOrder={setOb} dir={db} onDir={setDb} exclude={[ma, rc].filter(Boolean)} />
              : <ColumnSelect ds={ds} label="Groups to compare" value={gc} onChange={setGc} kind="group" maxLevels={2} exclude={[ma, rc].filter(Boolean)} hint="A column with two values, such as sex or residence" />}
            <BinaryFrom ds={ds} label="Reference standard" value={rc} onChange={setRc} rule={rRule} onRule={setRRule} exclude={[ma, mb, gc].filter(Boolean)} what="Condition present" />
          </div>
        ) : needData}
        <div class="fields"><TextField label="Condition (for the sentence)" value={cond} onInput={setCond} placeholder="anaemia" /></div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {out ? <CompareResult out={out} labels={labels} spec={spec} cond={cond.trim() || '[INSERT: condition]'} /> : null}
    </>
  );
}

function CompareResult({ out, labels, spec, cond }) {
  const f2 = (v) => fixed(v, 2), ciT = (c) => `${f2(c[0])} to ${f2(c[1])}`;
  const aucs = out.kind === 'summary' ? out.aucs : [[out.A.auc, out.A.ci], [out.B.auc, out.B.ci]];
  const testText = out.kind === 'paired' ? `DeLong's test for paired curves, z = ${f2(out.z)}, ${P(out.p)}`
    : out.kind === 'unpaired' ? `DeLong's test for independent curves, D = ${f2(out.t)} on ${fixed(out.df, 1)} df, ${P(out.p)}` : `z = ${f2(out.z)}, ${P(out.p)}`;
  const say = `${out.kind === 'paired' ? `In the same ${count(out.m + out.n)} people (${count(out.m)} with ${cond}), the` : 'The'} AUC was ${f2(aucs[0][0])} (95% CI ${ciT(aucs[0][1])}) for ${labels[0]} and ${f2(aucs[1][0])} (95% CI ${ciT(aucs[1][1])}) for ${labels[1]}, a difference of ${f2(out.diff)} (95% CI ${ciT(out.ci)}; ${testText}).`;
  return (
    <section class="panel stack result-panel" aria-labelledby="cmp-h">
      <div><h2 id="cmp-h" style="margin-bottom:6px">Difference in AUC = {f2(out.diff)}</h2>
        <p class="verdict-line mono">95% CI {ciT(out.ci)}; {testText}</p></div>
      {out.kind !== 'summary' ? (
        <figure style="margin:0">
          <RocPlot curves={[{ label: labels[0], path: out.A.path }, { label: labels[1], path: out.B.path }]} label={`ROC curves of ${labels[0]} and ${labels[1]}`} />
          <figcaption class="figcap">The two ROC curves; the dashed diagonal is chance.</figcaption>
        </figure>
      ) : null}
      <DataTable wrap caption="Areas under the curves" columns={MCOLS} numeric={[1]} rows={[
        mrow(`AUC, ${labels[0]}`, out.kind === 'summary' ? 'as published' : 'DeLong', f2(aucs[0][0]), ciT(aucs[0][1]), true),
        mrow(`AUC, ${labels[1]}`, out.kind === 'summary' ? 'as published' : 'DeLong', f2(aucs[1][0]), ciT(aucs[1][1]), true),
        mrow('Difference', out.kind === 'unpaired' ? `t on ${fixed(out.df, 1)} df` : 'normal', f2(out.diff), ciT(out.ci), true),
        out.kind === 'paired' ? mrow('Correlation of the two AUCs', 'DeLong', f2(out.r), null) : null,
        mrow('Test of no difference', out.kind === 'paired' ? 'DeLong, paired' : out.kind === 'unpaired' ? 'DeLong, independent' : 'z, independent', P(out.p), null),
      ].filter(Boolean)} />
      <Checks items={[
        out.kind === 'paired' && out.dropped ? { text: `${count(out.dropped)} people without both markers and the reference standard were left out, so both curves use the same people.` } : null,
        out.kind === 'unpaired' && out.dropped ? { text: `${count(out.dropped)} people with a missing value were left out.` } : null,
        out.autos?.some(Boolean) ? { text: 'A direction was taken from the data; set each to the direction you expected, so that a weak marker is not flattered.' } : null,
        out.kind === 'paired' ? { text: 'Both markers were measured on the same people, so the test uses the correlation between the two AUCs (DeLong and colleagues 1988); comparing their CIs alone would be too cautious.' } : null,
        out.kind === 'unpaired' ? { text: "The groups are independent; the difference is referred to Student's t with Satterthwaite-type degrees of freedom, as R's pROC does." } : null,
        out.kind === 'summary' ? { text: 'Standard errors are read from the published 95% limits, assumed symmetric; the samples must be independent. If either AUC came from a logistic model fitted in the same data, it is optimistic.' } : null,
        { text: 'Two curves can have similar areas and still differ where it matters, at the cut-offs used in practice; compare sensitivity and specificity there too.' },
      ]} />
      <Report text={say} />
      {spec ? <CodeExport spec={spec} /> : null}
      <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['delong', 'hanley', 'pROC', 'altmanBland94c']} /></div>
    </section>
  );
}

/* ------------------------------------------------- two tests, same people --- */

// Illustrative counts: rows first test positive or negative, columns second test positive or negative.
const EX_TWO = { pos: [['70', '12'], ['6', '12']], neg: [['4', '14'], ['6', '176']] };
const ppts = (d) => fixed(100 * d, 1);
const pptsCI = (ci) => `${fixed(100 * ci[0], 1)} to ${fixed(100 * ci[1], 1)}`;

function TwoTestsPanel({ ds, kindSeg }) {
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? (ds ? 'data' : 'typed');
  const [cells, setCells] = useState(EX_TWO);
  const [ac, setAc] = useState(null), [aRule, setARule] = useState(null), [bc, setBc] = useState(null), [bRule, setBRule] = useState(null);
  const [rc, setRc] = useState(null), [rRule, setRRule] = useState(null);
  const [names, setNames] = useState({ a: '', b: '', cond: '' });
  let pos = null, neg = null, err = null, skipped = 0, spec = null, la = names.a.trim(), lb = names.b.trim(), refLabel = '';
  if (mode === 'data' && ds) {
    const ca = col(ds, ac), cb = col(ds, bc), cr = col(ds, rc);
    if (ca && cb && cr) {
      const A = readRule(aRule ?? defaultRule(ca)), B = readRule(bRule ?? defaultRule(cb)), Rr = readRule(rRule ?? defaultRule(cr));
      if (new Set([ac, bc, rc]).size < 3) err = 'Pick three different columns: two tests and the reference standard.';
      else if (A.error || B.error || Rr.error) err = A.error || B.error || Rr.error;
      else {
        const ta = readBinary(ca, A.rule), tb = readBinary(cb, B.rule), d = readBinary(cr, Rr.rule);
        pos = [0, 0, 0, 0]; neg = [0, 0, 0, 0];
        d.forEach((dd, i) => { if (dd === null || ta[i] === null || tb[i] === null) { skipped++; return; } (dd ? pos : neg)[ta[i] && tb[i] ? 0 : ta[i] ? 1 : tb[i] ? 2 : 3]++; });
        const words = (c, r) => `${pretty(c)} ${r.kind === 'cut' ? ruleText(r) : `(${ruleText(r)})`}`;
        la = la || words(ac, A.rule); lb = lb || words(bc, B.rule); refLabel = words(rc, Rr.rule);
        spec = { kind: 'tests2', a: ac, aRule: A.rule, numericA: ca.numeric, b: bc, bRule: B.rule, numericB: cb.numeric, ref: rc, refRule: Rr.rule, numericR: cr.numeric };
      }
    }
  } else if (mode === 'typed') {
    const v = { pos: cells.pos.map((r) => r.map(parseNumber)), neg: cells.neg.map((r) => r.map(parseNumber)) };
    if (![...v.pos.flat(), ...v.neg.flat()].every(isInt)) err = 'Enter whole-number counts in all eight cells (0 is allowed).';
    else { pos = [...v.pos[0], ...v.pos[1]]; neg = [...v.neg[0], ...v.neg[1]]; spec = { kind: 'tests2', pos, neg }; }
  }
  let res = null;
  if (pos && !err) {
    if (!pos.some((x) => x > 0) || !neg.some((x) => x > 0)) err = 'The reference standard must find some people with the condition and some without.';
    else res = compareBinaryTests(pos, neg);
  }
  const setCell = (g, i, j, val) => setCells({ ...cells, [g]: cells[g].map((r, x) => (x === i ? r.map((cv, y) => (y === j ? val : cv)) : r)) });
  const entry = (g, title) => (
    <div class="tablewrap">
      <table class="table compact entry">
        <caption>{title}</caption>
        <thead><tr><th scope="col">First test</th><th scope="col">Second positive</th><th scope="col">Second negative</th></tr></thead>
        <tbody>{['Positive', 'Negative'].map((rl, i) => (
          <tr><th scope="row">{rl}</th>{[0, 1].map((j) => <td><input inputMode="numeric" aria-label={`${title}: first test ${rl.toLowerCase()}, second ${j ? 'negative' : 'positive'}`} value={cells[g][i][j]} onInput={(ev) => setCell(g, i, j, ev.currentTarget.value)} /></td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
  return (
    <>
      <section class="panel stack" aria-labelledby="t2-h">
        <h2 id="t2-h">Two tests on the same people</h2>
        {kindSeg}
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'Counts' }]} />
        {mode === 'data' ? (ds ? (
          <div class="stack">
            <BinaryFrom ds={ds} label="First test" value={ac} onChange={setAc} rule={aRule} onRule={setARule} exclude={[bc, rc].filter(Boolean)} what="First test positive" />
            <BinaryFrom ds={ds} label="Second test" value={bc} onChange={setBc} rule={bRule} onRule={setBRule} exclude={[ac, rc].filter(Boolean)} what="Second test positive" />
            <BinaryFrom ds={ds} label="Reference standard" value={rc} onChange={setRc} rule={rRule} onRule={setRRule} exclude={[ac, bc].filter(Boolean)} what="Condition present" />
          </div>
        ) : needData) : (
          <>
            {entry('pos', 'People with the condition')}
            {entry('neg', 'People without the condition')}
            <p class="small">Illustrative numbers: replace them with yours. Every person had both tests and the reference standard.</p>
          </>
        )}
        <div class="fields">
          <TextField label="First test (for the sentence)" value={names.a} onInput={(v) => setNames({ ...names, a: v })} placeholder="rapid diagnostic test" />
          <TextField label="Second test (for the sentence)" value={names.b} onInput={(v) => setNames({ ...names, b: v })} placeholder="microscopy" />
          <TextField label="Condition (for the sentence)" value={names.cond} onInput={(v) => setNames({ ...names, cond: v })} placeholder="malaria" />
        </div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? <TwoTestsResult res={res} la={la || '[INSERT: first test]'} lb={lb || '[INSERT: second test]'} refLabel={refLabel} cond={names.cond.trim() || '[INSERT: condition]'} skipped={skipped} spec={spec} /> : null}
    </>
  );
}

function TwoTestsResult({ res, la, lb, refLabel, cond, skipped, spec }) {
  const { se, sp, seA, seB, spA, spB } = res;
  const mcP = (d) => `${d.exact ? 'exact' : 'χ²'} ${P(d.p)}`;
  const split = (seA.est - seB.est) * (spA.est - spB.est) < 0;
  const say = `In ${count(res.n1)} people with ${cond} and ${count(res.n0)} without${refLabel ? ` (${refLabel})` : ''}, all given both tests, the sensitivity of ${la} was ${pc(seA.est)} (95% CI ${pcCI(seA.wilson)}) against ${pc(seB.est)} (95% CI ${pcCI(seB.wilson)}) for ${lb}, a difference of ${ppts(se.diff)} percentage points (95% CI ${pptsCI(se.ci)}; McNemar ${mcP(se)}); specificities were ${pc(spA.est)} and ${pc(spB.est)}, a difference of ${ppts(sp.diff)} points (95% CI ${pptsCI(sp.ci)}; McNemar ${mcP(sp)}).`;
  return (
    <section class="panel stack result-panel" aria-labelledby="tt-h">
      <div><h2 id="tt-h" style="margin-bottom:6px">Sensitivity {pc(seA.est)} and {pc(seB.est)}; specificity {pc(spA.est)} and {pc(spB.est)}</h2>
        <p class="verdict-line mono">Differences {ppts(se.diff)} points (95% CI {pptsCI(se.ci)}; {mcP(se)}) and {ppts(sp.diff)} points (95% CI {pptsCI(sp.ci)}; {mcP(sp)})</p></div>
      <Stats items={[['Disagreements, with the condition', `${count(se.f)} and ${count(se.g)}`], ['Disagreements, without', `${count(sp.f)} and ${count(sp.g)}`],
        ['Covariance, with the condition', fixed(res.covSe, 3)], ['Covariance, without', fixed(res.covSp, 3)], skipped ? ['Left out (missing)', count(skipped)] : null]} />
      <DataTable wrap caption="Each test" columns={MCOLS} numeric={[1]} rows={[
        mrow(`Sensitivity, ${la}`, 'Wilson', pc(seA.est), pcCI(seA.wilson), true), mrow(`Sensitivity, ${lb}`, 'Wilson', pc(seB.est), pcCI(seB.wilson), true),
        mrow(`Specificity, ${la}`, 'Wilson', pc(spA.est), pcCI(spA.wilson), true), mrow(`Specificity, ${lb}`, 'Wilson', pc(spB.est), pcCI(spB.wilson), true),
      ]} />
      <DataTable wrap caption="Paired differences (first minus second, percentage points)" columns={MCOLS} numeric={[1]} rows={[
        mrow('Sensitivity', 'Newcombe, paired', ppts(se.diff), pptsCI(se.ci), true), mrow('McNemar test, with the condition', se.exact ? 'exact' : 'χ², corrected', P(se.p), null),
        mrow('Specificity', 'Newcombe, paired', ppts(sp.diff), pptsCI(sp.ci), true), mrow('McNemar test, without the condition', sp.exact ? 'exact' : 'χ², corrected', P(sp.p), null),
      ]} />
      <DataTable wrap caption="Both tests together, counted" columns={MCOLS} numeric={[1]} rows={[
        mrow('In series (positive if both are): sensitivity', 'Wilson', pc(res.serialSe.est), pcCI(res.serialSe.wilson)),
        mrow('In series: specificity', 'Wilson', pc(res.serialSp.est), pcCI(res.serialSp.wilson)),
        mrow('In parallel (positive if either is): sensitivity', 'Wilson', pc(res.parallelSe.est), pcCI(res.parallelSe.wilson)),
        mrow('In parallel: specificity', 'Wilson', pc(res.parallelSp.est), pcCI(res.parallelSp.wilson)),
      ]} />
      <Checks items={[
        split ? { text: 'Neither test is better on both counts: one finds more of the condition, the other gives fewer false alarms. Weigh them by their likelihood ratios and by what each kind of error costs where the test will be used (Macaskill and colleagues 2002).' } : null,
        se.exact || sp.exact ? { text: 'Fewer than 25 people disagreed between the tests in a group, so McNemar\'s test is exact there.' } : null,
        res.covSe > 0.005 || res.covSp > 0.005 ? { text: 'The covariances are positive: the tests tend to err on the same people, so combining them gains less than if they erred independently. The series and parallel figures above are counted from these people, so they already allow for it; the Screening programme tab of Vaccines and Screening can carry them into planning (Gardner and colleagues 2000).' } : null,
        { text: 'A paired comparison needs every person to have both tests and the same reference standard; testing only those positive on one test with the reference biases the comparison (verification bias; STARD 2015).' },
        skipped ? { text: `${count(skipped)} people without both tests and the reference standard were left out.` } : null,
      ]} />
      <Report text={say} />
      {spec ? <CodeExport spec={spec} /> : null}
      <AtLevel min="advanced"><p class="small">With e both positive, f first only, g second only and h neither, the difference is (f − g)/n; Newcombe's method 10 combines the Wilson limits of the two proportions with their correlation φ (continuity-corrected when positive). McNemar's test uses the f + g disagreements: exact binomial below 25, otherwise χ² with Edwards' correction. Specificity is compared the same way with "negative" as the outcome.</p></AtLevel>
      <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['newcombePaired', 'mcnemar', 'wilson', 'gardner', 'macaskill', 'stard']} /></div>
    </section>
  );
}

/* ---------------------------------------------------------------- page --- */

export default function DiagnosticTool() {
  const ds = useDataset();
  const [tab, setTab] = useState('test');
  const [seed, setSeed] = useState(null);
  const examine = (s) => { setSeed({ ...s, id: Date.now() }); setTab('test'); };
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} title="Diagnostic Accuracy and ROC"
        lede="How well a test finds a condition: sensitivity, specificity and likelihood ratios against a reference standard, predictive values at the prevalence where the test will be used, ROC curves and cut-offs, and two ROC curves compared." />
      <div class="stack">
        <DataPanel examples={[{ label: 'Load example screening-camp data', csv: exampleAgreementCsv, source: 'example-agree' }, { label: 'Load example antenatal data', csv: exampleCsv, source: 'example' }]} />
        <Disclose title="Which part do I need?">
          <ul>
            <li><strong>A test against a reference standard</strong>: a positive or negative test (a rapid test, a sign, a score above a cut-off) checked against the best available way of finding the condition.</li>
            <li><strong>ROC curve</strong>: a marker measured on a scale (haemoglobin, a questionnaire score, an ordered grade), to see how well it separates people with and without the condition at every cut-off, and which cut-off to use.</li>
            <li><strong>Compare tests</strong>: two positive-or-negative tests done on the same people against one reference standard; or ROC curves: two markers on the same people, one marker in two groups, or two published AUCs.</li>
          </ul>
          <p>The example screening-camp data have haemoglobin by a venous laboratory method (the reference: anaemia below 11 g/dL in children 6 to 59 months), by HemoCue, and palmar pallor graded by three medical officers.</p>
        </Disclose>
        <div><Seg wide value={tab} onChange={setTab} options={[{ value: 'test', label: 'Test against a reference' }, { value: 'roc', label: 'ROC curve' }, { value: 'compare', label: 'Compare tests' }]} /></div>
        {tab === 'test' ? <TestPanel key={seed?.id ?? 'start'} ds={ds} seed={seed} /> : tab === 'roc' ? <RocPanel ds={ds} onExamine={examine} /> : <ComparePanel ds={ds} />}
      </div>
    </div>
  );
}
