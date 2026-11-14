/* Tool: confounding and standardisation. Stratified analysis of 2 x 2 tables or person-time by a third
 * variable (Mantel-Haenszel estimates against the crude ones, tests of homogeneity for effect
 * modification); direct standardisation with the gamma CI, one group or two compared; indirect
 * standardisation (SMR) with the exact CI and test. From the loaded data or typed (or pasted) strata. */
import { useState } from 'preact/hooks';
import { mhTables, mhPersonTime, confoundingChange, directStandard, dsrRatio, indirectStandard } from '../../engine/strat.js';
import { isMissing, parseDelimited } from '../../engine/data.js';
import { fixed, pValue, count, sig, ratio, parseNumber } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, NumberField, TextField, SelectField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col, exampleCsv, exampleTbCsv } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs, Disclose } from '../../ui/results.jsx';
import { ForestPlot } from '../../ui/plot.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';
import { pretty, P, cap, isInt, pc, pcCI, pp, rCI, s3, ptx, mrow, MCOLS, guessLevel, other, needData, Checks, LevelPick, PER_RATE, UNITS, readPasted } from './epishared.jsx';

let rowId = 0;
const mkRows = (rows) => rows.map(([label, ...vals]) => ({ id: ++rowId, label, vals: vals.map(String) }));
const blank = (n) => ({ id: ++rowId, label: '', vals: Array(n).fill('') });

/* -------------------------------------------- a table of typed strata --- */

/** Typed rows: a label and numbers in fixed columns, with add, remove, paste and clear. */
function RowsTable({ cols, rows, setRows, what = 'stratum', numeric = 'decimal' }) {
  const [paste, setPaste] = useState(''), [msg, setMsg] = useState('');
  const set = (id, patch) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const use = () => {
    const got = readPasted(paste, cols.length, parseDelimited, parseNumber);
    if (!got.length) { setMsg(`No rows read. Each row needs the ${what} name and then ${cols.length} numbers, in the order of the table.`); return; }
    setMsg(''); setRows(got.map((g) => ({ id: ++rowId, ...g }))); setPaste('');
  };
  return (
    <>
      <div class="tablewrap">
        <table class="table compact entry">
          <thead><tr><th scope="col">{cap(what)}</th>{cols.map((c) => <th scope="col">{c}</th>)}<th scope="col"><span class="vh">Remove</span></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr>
              <td><input class="name" aria-label={`${cap(what)} ${i + 1} name`} value={r.label} onInput={(e) => set(r.id, { label: e.currentTarget.value })} /></td>
              {cols.map((c, j) => <td><input inputMode={numeric} aria-label={`${r.label || `${cap(what)} ${i + 1}`}: ${c}`} value={r.vals[j]} onInput={(e) => set(r.id, { vals: r.vals.map((v, q) => (q === j ? e.currentTarget.value : v)) })} /></td>)}
              <td class="rm"><button type="button" class="btn ghost small" aria-label={`Remove ${r.label || `${what} ${i + 1}`}`} onClick={() => setRows(rows.length > 1 ? rows.filter((x) => x.id !== r.id) : [blank(cols.length)])}>{'×'}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div class="btn-row">
        <button type="button" class="btn ghost small" onClick={() => setRows([...rows, blank(cols.length)])}>Add {/^[aeiou]/i.test(what) ? 'an' : 'a'} {what}</button>
        <button type="button" class="btn ghost small" onClick={() => setRows([blank(cols.length), blank(cols.length)])}>Clear</button>
      </div>
      <Disclose title="Paste rows from Excel or Google Sheets">
        <p class="small">One {what} per row: its name, then the {cols.length} numbers in the order of the table. A header row is skipped.</p>
        <textarea class="paste" rows={4} value={paste} onInput={(e) => setPaste(e.currentTarget.value)} aria-label={`Paste ${what} rows`} spellcheck={false} />
        {msg ? <p class="err" role="alert">{msg}</p> : null}
        <div class="btn-row"><button type="button" class="btn primary small" disabled={!paste.trim()} onClick={use}>Use these rows</button></div>
      </Disclose>
    </>
  );
}

/** The filled rows as numbers, or an error naming the first row that does not read. */
function readRows(rows, { integer = [], positive = [] } = {}) {
  const out = [];
  for (const [i, r] of rows.entries()) {
    if (!r.label.trim() && r.vals.every((v) => !String(v).trim())) continue;
    const name = r.label.trim() || `Row ${i + 1}`;
    const x = r.vals.map((v) => parseNumber(v));
    if (x.some((v) => !Number.isFinite(v) || v < 0)) return { error: `${name}: fill in every number (0 or more).` };
    if (integer.some((j) => !Number.isInteger(x[j]))) return { error: `${name}: counts must be whole numbers.` };
    if (positive.some((j) => !(x[j] > 0))) return { error: `${name}: population and person-time must be above zero.` };
    out.push({ label: name, x });
  }
  return { rows: out };
}

/* -------------------------------------------------- stratified analysis --- */

const DESIGNS = [{ value: 'cohort', label: 'Cohort or trial' }, { value: 'case-control', label: 'Case-control' }, { value: 'cross', label: 'Cross-sectional' }, { value: 'pt', label: 'Person-time' }];
const EX_STRATA = {
  cohort: [['Under 30', 10, 90, 5, 95], ['30 and over', 60, 140, 15, 35]],
  'case-control': [['Under 30', 12, 20, 8, 40], ['30 to 44', 30, 25, 20, 45], ['45 and over', 40, 15, 30, 25]],
  cross: [['Rural', 30, 70, 20, 80], ['Urban', 45, 55, 35, 65]],
  pt: [['Under 40', 12, 2400, 8, 3100], ['40 to 59', 30, 1800, 22, 2600], ['60 and over', 41, 950, 25, 1100]],
};
const STRATA_COLS = {
  cohort: ['Exposed: outcome', 'Exposed: none', 'Unexposed: outcome', 'Unexposed: none'],
  'case-control': ['Exposed cases', 'Exposed controls', 'Unexposed cases', 'Unexposed controls'],
  cross: ['Exposed: outcome', 'Exposed: none', 'Unexposed: outcome', 'Unexposed: none'],
  pt: ['Events, exposed', 'Person-time, exposed', 'Events, unexposed', 'Person-time, unexposed'],
};
const HEAD = { cohort: ['Risk ratio', 'RR'], 'case-control': ['Odds ratio', 'OR'], cross: ['Prevalence ratio', 'PR'], pt: ['Rate ratio', 'IRR'] };

function StratifiedPanel({ ds }) {
  const [design, setDesign] = useState('cohort');
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? (ds ? 'data' : 'typed');
  const [rowsBy, setRowsBy] = useState(() => Object.fromEntries(Object.entries(EX_STRATA).map(([k, v]) => [k, mkRows(v)])));
  const [stratName, setStratName] = useState('');
  const [e, setE] = useState(null), [eL, setEL] = useState(null), [o, setO] = useState(null), [oL, setOL] = useState(null), [sv, setSv] = useState(null), [tc, setTc] = useState(null);
  const [unit, setUnit] = useState('person-years'), [per, setPer] = useState('1000');
  const pt = design === 'pt', cc = design === 'case-control';
  const rows = rowsBy[design];
  const setRows = (r) => setRowsBy({ ...rowsBy, [design]: r });

  let strata = null, err = null, dropped = 0, stratifier = stratName.trim() || 'the third variable', g1 = 'exposed', spec = null;
  if (mode === 'data' && ds) {
    const ce = col(ds, e), co = col(ds, o), cs = col(ds, sv), ct = pt ? col(ds, tc) : true;
    if (ce && co && cs && ct) {
      if (new Set([e, o, sv]).size < 3) err = 'Pick three different columns: exposure, outcome and the variable to stratify by.';
      else {
        const el = eL ?? guessLevel(ce.levels), ol = oL ?? guessLevel(co.levels);
        const by = new Map(cs.levels.map((l) => [l, pt ? { a: 0, t1: 0, c: 0, t0: 0 } : [[0, 0], [0, 0]]]));
        for (let i = 0; i < ds.n; i++) {
          const x = ce.raw[i], y = co.raw[i], s = cs.raw[i], tv = pt ? ct.numbers[i] : 0;
          if (isMissing(x) || isMissing(y) || isMissing(s) || (pt && (tv === null || !Number.isFinite(tv) || tv < 0))) { dropped++; continue; }
          const ex = x === el, ou = y === ol, cell = by.get(s);
          if (pt) { if (ex) { cell.t1 += tv; if (ou) cell.a++; } else { cell.t0 += tv; if (ou) cell.c++; } } else cell[ex ? 0 : 1][ou ? 0 : 1]++;
        }
        strata = [...by.entries()].map(([label, v]) => (pt ? { label, ...v } : { label, t: v }));
        stratifier = pretty(sv); g1 = `${pretty(e)} "${el}"`;
        spec = { kind: 'mh', design, exposure: e, exposed: el, outcome: o, event: ol, stratum: sv, time: pt ? tc : null, numericE: ce.numeric, numericO: co.numeric, numericS: cs.numeric };
      }
    }
  } else if (mode === 'typed') {
    const r = readRows(rows, { integer: pt ? [0, 2] : [0, 1, 2, 3], positive: pt ? [1, 3] : [] });
    if (r.error) err = r.error;
    else if (r.rows.length < 2) err = 'Enter at least two strata.';
    else {
      strata = r.rows.map(({ label, x }) => (pt ? { label, a: x[0], t1: x[1], c: x[2], t0: x[3] } : { label, t: [[x[0], x[1]], [x[2], x[3]]] }));
      spec = { kind: 'mh', design, strata: strata.map((s) => (pt ? { label: s.label, vals: [s.a, s.t1, s.c, s.t0] } : { label: s.label, vals: s.t.flat() })) };
    }
  }
  let res = null;
  if (strata && !err) {
    res = pt ? mhPersonTime(strata) : mhTables(strata, { design });
    if (res.informative < 1) { err = `No stratum has both exposure groups and both ${cc ? 'cases and controls' : 'outcomes'}, so nothing can be estimated.`; res = null; }
    else if (pt ? !(res.crude && res.irr.est > 0 && Number.isFinite(res.irr.est)) : !Number.isFinite(res[cc ? 'or' : 'rr'].est) || !(res[cc ? 'or' : 'rr'].est > 0)) { err = 'The adjusted ratio is 0 or infinite (a zero count in every stratum); the data cannot support it.'; res = null; }
  }
  const m = Number(per);
  return (
    <>
      <section class="panel stack" aria-labelledby="st-h">
        <h2 id="st-h">Stratified analysis (Mantel-Haenszel)</h2>
        <Seg label="Study design" value={design} onChange={setDesign} options={DESIGNS} />
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'A table of strata' }]} />
        {mode === 'data' ? (ds ? (
          <div class="fields">
            <LevelPick ds={ds} label="Exposure column" value={e} onChange={setE} level={eL} onLevel={setEL} levelLabel="Exposed group" />
            <LevelPick ds={ds} label={cc ? 'Case or control column' : pt ? 'Event column' : 'Outcome column'} value={o} onChange={setO} level={oL} onLevel={setOL} levelLabel={cc ? 'Value for cases' : pt ? 'Value for an event' : 'Value for the outcome'} exclude={[e].filter(Boolean)} />
            <ColumnSelect ds={ds} label="Stratify by (possible confounder)" value={sv} onChange={setSv} kind="group" maxLevels={12} exclude={[e, o].filter(Boolean)} hint="A column with 2 to 12 values, such as age group or sex" />
            {pt ? <ColumnSelect ds={ds} label="Follow-up time column" value={tc} onChange={setTc} kind="numeric" exclude={[e, o, sv].filter(Boolean)} /> : null}
          </div>
        ) : needData) : (
          <>
            <TextField label="Stratified by (for the sentence)" value={stratName} onInput={setStratName} placeholder="age group" />
            <RowsTable cols={STRATA_COLS[design]} rows={rows} setRows={setRows} numeric={pt ? 'decimal' : 'numeric'} />
            <p class="small">Illustrative numbers: replace them with yours.</p>
          </>
        )}
        {pt ? (
          <div class="fields">
            <SelectField label="Unit of person-time" value={unit} onChange={setUnit} options={UNITS} />
            <SelectField label="Express rate differences" value={per} onChange={setPer} options={PER_RATE} />
          </div>
        ) : null}
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? <StratifiedResult res={res} design={design} stratifier={stratifier} sayStrat={mode === 'data' ? stratifier : stratName.trim() || '[INSERT: the stratifying variable]'} g1={g1} dropped={dropped} spec={spec} m={m} unit={unit} /> : null}
    </>
  );
}

function StratifiedResult({ res, design, stratifier, sayStrat, g1, dropped, spec, m, unit }) {
  const pt = design === 'pt', cc = design === 'case-control', cross = design === 'cross';
  const [name, short] = HEAD[design];
  const key = pt ? 'irr' : cc ? 'or' : 'rr';
  const adj = res[key];
  const crudeEst = pt ? res.crude.irr.est : cc ? res.crude.or.est : res.crude.rr.est;
  const crudeCI = pt ? res.crude.irr.exact : cc ? res.crude.or[res.crude.or.auto] : res.crude.rr[res.crude.rr.auto];
  const change = confoundingChange(crudeEst, adj.est);
  const confounded = Math.abs(change.change) >= 10;
  const homog = pt ? res.homogIRR : cc ? { q: res.bd.chi2Tarone, df: res.bd.df, p: res.bd.pTarone, k: res.bd.k } : res.homogRR;
  const homogName = pt ? 'test of homogeneity of the rate ratio' : cc ? 'Breslow-Day test with Tarone\'s correction' : `test of homogeneity of the ${cross ? 'prevalence' : 'risk'} ratio`;
  const modified = Number.isFinite(homog.p) && homog.p < 0.05;
  const test = pt ? res.test : res.cmh;
  const testName = pt ? 'Mantel-Haenszel test for person-time' : 'Cochran-Mantel-Haenszel test';
  const informative = res.strata.filter((s) => s.informative);
  const stratumEst = (s) => (pt ? { est: s.res.irr.est, ci: s.res.irr.exact } : cc ? { est: s.res.or.est, ci: s.res.or[s.res.or.auto] } : { est: s.res.rr.est, ci: s.res.rr[s.res.rr.auto] });
  // Each stratum's share of the Mantel-Haenszel weight, for the size of its square.
  const mhW = res.strata.map((s) => {
    if (pt) return (s.c * s.t1) / (s.t1 + s.t0);
    const [[a, b], [c, d]] = s.t, n = a + b + c + d;
    return n ? (cc ? (b * c) / n : (c * (a + b)) / n) : 0;
  });
  const W = mhW.reduce((x, y) => x + y, 0) || 1;
  const items = [
    ...res.strata.map((s, i) => (s.informative && Number.isFinite(stratumEst(s).est) && stratumEst(s).est > 0
      ? { kind: 'study', label: s.label, est: stratumEst(s).est, lo: stratumEst(s).ci?.[0], hi: stratumEst(s).ci?.[1], weight: mhW[i] / W }
      : { kind: 'head', label: `${s.label}: no estimate` })),
    { kind: 'pooled', label: 'Crude (collapsed)', short: 'Crude', est: crudeEst, lo: crudeCI?.[0], hi: crudeCI?.[1] },
    { kind: 'pooled', label: 'Mantel-Haenszel', short: 'MH', est: adj.est, lo: adj.ci[0], hi: adj.ci[1] },
  ];
  const diffRow = pt
    ? mrow(`Rate difference per ${count(m)} ${unit}`, 'Mantel-Haenszel, Greenland-Robins', s3(res.ird.est * m), `${s3(res.ird.ci[0] * m)} to ${s3(res.ird.ci[1] * m)}`)
    : cc ? null : mrow(`${cross ? 'Prevalence' : 'Risk'} difference, points`, 'Mantel-Haenszel, Sato', pp(res.rd.est, 1), `${pp(res.rd.ci[0], 1)} to ${pp(res.rd.ci[1], 1)}`);
  const measures = [
    mrow(`${name}, adjusted`, `Mantel-Haenszel, ${pt ? 'Greenland-Robins' : cc ? 'Robins-Breslow-Greenland' : 'Greenland-Robins'}`, ratio(adj.est), rCI(adj.ci), true),
    mrow(`${name}, crude`, pt ? 'exact' : 'as in the 2 × 2 tool', ratio(crudeEst), rCI(crudeCI)),
    ...(!pt && !cc ? [mrow(`${cross ? 'Prevalence odds ratio' : 'Odds ratio'}, adjusted`, 'Mantel-Haenszel, Robins-Breslow-Greenland', ratio(res.or.est), rCI(res.or.ci))] : []),
    ...(diffRow ? [diffRow] : []),
    ...(!pt && !cc ? [mrow(`${cross ? 'Prevalence' : 'Risk'} difference, crude, points`, 'Newcombe', pp(res.crude.rd.est, 1), `${pp(res.crude.rd.newcombe[0], 1)} to ${pp(res.crude.rd.newcombe[1], 1)}`)] : []),
  ];
  const tests = [
    [{ text: `${testName}, χ² = ${fixed(test.chi2, 3)} (continuity corrected)`, cls: 'hl' }, { text: pValue(test.p).exact, cls: 'hl' }],
    [`${testName}, χ² = ${fixed(test.chi2Uncorrected, 3)} (uncorrected)`, pValue(test.pUncorrected).exact],
    ...(!pt ? [[`Breslow-Day, χ² = ${fixed(res.bd.chi2, 3)} on ${res.bd.df} df`, pValue(res.bd.p).exact], [{ text: `Breslow-Day with Tarone's correction, χ² = ${fixed(res.bd.chi2Tarone, 3)}`, cls: cc ? 'hl' : '' }, { text: pValue(res.bd.pTarone).exact, cls: cc ? 'hl' : '' }]] : []),
    ...(!cc ? [[{ text: `Homogeneity of the ${short} (inverse variance), χ² = ${fixed(homog.q, 3)} on ${homog.df} df`, cls: 'hl' }, { text: pValue(homog.p).exact, cls: 'hl' }]] : []),
    ...(!pt && !cc ? [[`Homogeneity of the difference, χ² = ${fixed(res.homogRD.q, 3)} on ${res.homogRD.df} df`, pValue(res.homogRD.p).exact]] : []),
  ];
  const strataRows = res.strata.map((s) => {
    const n = pt ? `${count(s.a + s.c)} events` : `n = ${count(s.n)}`;
    if (!s.informative) return [`${s.label} (${n})`, 'No information: a group or outcome category is empty'];
    const se = stratumEst(s);
    return [`${s.label} (${n})`, `${ratio(se.est)} (${rCI(se.ci)})`];
  });
  const testSay = pt ? 'the Mantel-Haenszel test for person-time' : 'the Cochran-Mantel-Haenszel test';
  const say = `After stratifying by ${sayStrat} (${count(res.k)} strata), the Mantel-Haenszel ${name.toLowerCase()} was ${ratio(adj.est)} (95% CI ${rCI(adj.ci)}), against a crude ${name.toLowerCase()} of ${ratio(crudeEst)} (95% CI ${rCI(crudeCI)}); ${testSay} gave χ² = ${fixed(test.chi2, 2)}, ${P(test.p)}. The ${homogName} gave ${P(homog.p)}${modified ? `, so the ${short} differs between strata` : ''}.`;
  return (
    <section class="panel stack result-panel" aria-labelledby="str-h">
      <div><h2 id="str-h" style="margin-bottom:6px">Mantel-Haenszel {name.toLowerCase()} = {ratio(adj.est)}</h2>
        <p class="verdict-line mono">95% CI {rCI(adj.ci)}; crude {ratio(crudeEst)}; {pt ? 'MH test' : 'CMH test'} {P(test.p)}</p></div>
      <Stats items={[['Crude (collapsed)', `${ratio(crudeEst)} (${rCI(crudeCI)})`], [`Adjusted for ${stratifier}`, `${ratio(adj.est)} (${rCI(adj.ci)})`],
        ['Crude against adjusted', `${change.change >= 0 ? '+' : '−'}${fixed(Math.abs(change.change), 1)}%`], ['Homogeneity across strata', P(homog.p)],
        dropped ? ['Left out (missing)', count(dropped)] : null]} />
      <figure style="margin:0">
        <ForestPlot items={items} axis="log" nullAt={1} head="Stratum" fmt={(v) => ratio(v)} tickFmt={(t) => sig(t, 2)} label={`${name} in each stratum, crude and Mantel-Haenszel`} />
        <figcaption class="figcap">{name} in each stratum (squares sized by Mantel-Haenszel weight) with 95% CIs; diamonds: crude and adjusted. Log scale.</figcaption>
      </figure>
      <DataTable wrap caption={`${name} in each stratum of ${stratifier}`} columns={['Stratum', `${short} (95% CI)`]} rows={strataRows} numeric={[1]} />
      <DataTable wrap caption="Crude and adjusted measures" columns={MCOLS} rows={measures} numeric={[1]} />
      <DataTable wrap caption="Tests" columns={['Test', 'p']} rows={tests} numeric={[1]}
        note={`Highlighted: the test of association and the test of homogeneity reported above.${homog.k < res.k ? ` ${res.k - homog.k} stratum${res.k - homog.k === 1 ? '' : 's'} left out of the test of homogeneity (a zero count or no information).` : ''}`} />
      <Checks items={[
        confounded
          ? { ok: false, text: `The crude and adjusted ${short}s differ by ${fixed(Math.abs(change.change), 1)}%: ${stratifier} confounds the association. Report the adjusted estimate. (A change of 10% or more is the usual signal, Maldonado and Greenland 1993; judge it with what you know about the causes of the outcome.)` }
          : { ok: true, text: `The crude and adjusted ${short}s differ by ${fixed(Math.abs(change.change), 1)}%, under the usual 10%: little confounding by ${stratifier}.` },
        modified
          ? { ok: false, text: `The ${short} differs between strata (${homogName}, ${P(homog.p)}): ${stratifier} may modify the effect. Report the stratum-specific estimates, not only a single adjusted one.` }
          : { text: `No clear difference in the ${short} between strata (${P(homog.p)}). With few strata or small numbers these tests have little power, so look at the estimates themselves too.` },
        res.informative < res.k ? { text: `${res.k - res.informative} stratum${res.k - res.informative === 1 ? ' has' : 's have'} an empty group or outcome category and add${res.k - res.informative === 1 ? 's' : ''} nothing to the estimate.` } : null,
        { text: `The Mantel-Haenszel estimates stay valid with many small strata, where the crude table and maximum-likelihood methods can mislead (Greenland and Robins 1985).` },
        !cc && !pt ? { text: 'Effect modification depends on the scale: a ratio can be the same across strata while the difference is not, and the reverse. Both tests of homogeneity are shown.' } : null,
        { text: `Only ${stratifier} is adjusted for, and only as coarsely as its categories allow. To adjust for several variables at once, use regression (logistic, Poisson or Cox).` },
      ]} />
      <Report text={say} />
      {spec ? <CodeExport spec={spec} /> : null}
      <AtLevel min="advanced"><p class="small">{pt ? 'Mantel-Haenszel rate ratio Σ(a·T₀/T) / Σ(c·T₁/T) with the Greenland-Robins variance; the test compares the exposed events with their expectation m·T₁/T in each stratum.' : cc ? 'Mantel-Haenszel odds ratio Σ(ad/n) / Σ(bc/n) with the Robins-Breslow-Greenland variance; the Breslow-Day test compares each stratum\'s a with its expectation under the common odds ratio, and Tarone\'s correction removes the bias of using the Mantel-Haenszel estimate.' : 'Mantel-Haenszel risk ratio Σ(a·n₀/n) / Σ(c·n₁/n) with the Greenland-Robins variance; risk difference with the Sato-Greenland-Robins variance; the tests of homogeneity weight each stratum\'s estimate by its inverse variance (Woolf).'}{pt ? '' : " The CMH test is (|Σa − ΣE(a)| − ½)² / ΣVar(a), as R's mantelhaen.test."}</p></AtLevel>
      <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['mantelHaenszel', ...(cc ? ['rbg86', 'breslowDay80', 'tarone85'] : pt ? ['greenlandRobins85'] : ['greenlandRobins85', 'satoGR89', 'rbg86']), 'maldonadoGreenland', 'greenland89', 'rothmanME']} /></div>
    </section>
  );
}

/* ------------------------------------------------- direct standardisation --- */

// WHO World Standard Population (2000-2025), per cent, five-year groups 0-4 to 100+ (Ahmad et al. 2001, Table 4).
const WHO = [8.86, 8.69, 8.60, 8.47, 8.22, 7.93, 7.61, 7.15, 6.59, 6.04, 5.37, 4.55, 3.72, 2.96, 2.21, 1.52, 0.91, 0.44, 0.15, 0.04, 0.005];

/** WHO weights summed into age bands starting at `cuts` (multiples of 5, the first 0). */
function whoBands(cuts) {
  return cuts.map((c, i) => {
    const next = cuts[i + 1];
    const w = WHO.reduce((s, v, g) => (g * 5 >= c && (next === undefined || g * 5 < next) ? s + v : s), 0);
    return { label: next === undefined ? `${c}+` : `${c}-${next - 1}`, w: Math.round(w * 1000) / 1000 };
  });
}

const EX_DIRECT = [['0-14', 12, 52000, 26.15, 9, 30000], ['15-29', 18, 48000, 24.62, 12, 31000], ['30-44', 35, 39000, 21.35, 30, 30000], ['45-59', 80, 26000, 15.96, 85, 25000], ['60+', 210, 15000, 11.955, 260, 20000]];

function DirectPanel() {
  const [two, setTwo] = useState(false);
  const [rows, setRows] = useState(() => mkRows(EX_DIRECT));
  const [per, setPer] = useState('100000');
  const [names, setNames] = useState(['', '']);
  const [what, setWhat] = useState('');
  const [cuts, setCuts] = useState('0, 15, 30, 45, 60');
  const [cutMsg, setCutMsg] = useState('');
  const [whoUsed, setWhoUsed] = useState(true);
  const cols = ['Events', 'Population', 'Standard population', ...(two ? ['Events, group 2', 'Population, group 2'] : [])];
  const shown = rows.map((r) => ({ ...r, vals: two ? [...r.vals.slice(0, 3), r.vals[3] ?? '', r.vals[4] ?? ''] : r.vals.slice(0, 3) }));
  const setShown = (rs) => setRows(rs.map((r) => {
    const old = rows.find((x) => x.id === r.id);
    return { ...r, vals: two ? r.vals : [...r.vals, ...(old ? old.vals.slice(3) : ['', ''])] };
  }));
  const fillWho = (fiveYear) => {
    let c;
    if (fiveYear) c = WHO.map((_, i) => i * 5);
    else {
      c = cuts.split(/[,\s]+/).filter(Boolean).map(Number);
      if (!c.length || c[0] !== 0 || c.some((x) => !Number.isInteger(x) || x % 5 !== 0 || x > 100) || c.some((x, i) => i && x <= c[i - 1])) { setCutMsg('Give the lower age of each band, rising, in multiples of 5 and starting at 0: for example 0, 15, 30, 45, 60.'); return; }
    }
    setCutMsg('');
    const bands = whoBands(c);
    setRows(bands.map((b, i) => {
      const old = rows.find((r) => r.label.trim() === b.label) ?? (rows.length === bands.length ? rows[i] : null);
      return { id: ++rowId, label: b.label, vals: [old?.vals[0] ?? '', old?.vals[1] ?? '', String(b.w), old?.vals[3] ?? '', old?.vals[4] ?? ''] };
    }));
    setWhoUsed(true);
  };
  const r = readRows(shown, { integer: two ? [0, 3] : [0], positive: two ? [1, 2, 4] : [1, 2] });
  let res = null, res2 = null, err = r.error;
  if (!err && r.rows.length < 2) err = 'Enter at least two strata (age groups).';
  if (!err) {
    res = directStandard(r.rows.map(({ label, x }) => ({ label, x: x[0], n: x[1], std: x[2] })));
    if (two) res2 = directStandard(r.rows.map(({ label, x }) => ({ label, x: x[3], n: x[4], std: x[2] })));
  }
  const m = Number(per);
  const f = (v) => s3(v * m);
  const n1 = names[0].trim() || (two ? 'Group 1' : 'the study population'), n2 = names[1].trim() || 'Group 2';
  const s1 = names[0].trim() || (two ? '[INSERT: group 1]' : '[INSERT: population]'), s2 = names[1].trim() || '[INSERT: group 2]';
  const rr = res && res2 && res.dsr > 0 && res2.dsr > 0 ? dsrRatio(res, res2) : null;
  const perTxt = `per ${count(m)}`;
  const thing = what.trim() || 'rate';
  return (
    <>
      <section class="panel stack" aria-labelledby="ds-h">
        <h2 id="ds-h">Direct standardisation</h2>
        <p class="small">Applies each group's age-specific rates to one standard population, so groups with different age structures can be compared.</p>
        <Seg label="Groups" value={two ? 'two' : 'one'} onChange={(v) => setTwo(v === 'two')} options={[{ value: 'one', label: 'One group' }, { value: 'two', label: 'Compare two groups' }]} />
        <div class="fields">
          <TextField label={two ? 'Group 1 (for the sentence)' : 'Population (for the sentence)'} value={names[0]} onInput={(v) => setNames([v, names[1]])} placeholder="Sundargarh, 2025" />
          {two ? <TextField label="Group 2 (for the sentence)" value={names[1]} onInput={(v) => setNames([names[0], v])} placeholder="Odisha, 2025" /> : null}
          <TextField label="What the events are (for the sentence)" value={what} onInput={setWhat} placeholder="mortality" />
        </div>
        <RowsTable cols={cols} rows={shown} setRows={(rs) => {
          // Editing events or populations keeps the WHO label; changing the standard column (or the rows) drops it.
          const before = new Map(rows.map((x) => [x.id, x.vals[2]]));
          if (rs.length !== rows.length || rs.some((x) => before.get(x.id) !== x.vals[2])) setWhoUsed(false);
          setShown(rs);
        }} what="age group" />
        <Disclose title="Use the WHO World Standard Population">
          <p class="small">The WHO standard (2000-2025) gives the share of each five-year age group, 0-4 to 100+ (Ahmad and colleagues 2001). Fill it in for five-year groups, or summed into your own bands. Your events and populations stay where the band names match.</p>
          <div class="fields">
            <TextField label="Lower age of each band" value={cuts} onInput={setCuts} hint="Multiples of 5, starting at 0" />
          </div>
          {cutMsg ? <p class="err" role="alert">{cutMsg}</p> : null}
          <div class="btn-row">
            <button type="button" class="btn ghost small" onClick={() => fillWho(false)}>Fill WHO weights for these bands</button>
            <button type="button" class="btn ghost small" onClick={() => fillWho(true)}>Use the 21 five-year groups</button>
          </div>
        </Disclose>
        <div class="fields"><SelectField label="Express rates" value={per} onChange={setPer} options={PER_RATE.filter((o) => o.value !== '1')} /></div>
        <p class="small">Illustrative numbers: replace them with yours. The standard column can hold counts or percentages; only the proportions matter.</p>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="dsr-h">
          <div><h2 id="dsr-h" style="margin-bottom:6px">{rr ? `Ratio of standardised rates = ${ratio(rr.est)}` : `Standardised ${thing} = ${f(res.dsr)} ${perTxt}`}</h2>
            <p class="verdict-line mono">{rr ? `95% CI ${rCI(rr.ci)} (log scale); ${n1} ${f(res.dsr)} against ${n2} ${f(res2.dsr)} ${perTxt}` : `95% CI ${f(res.ci[0])} to ${f(res.ci[1])} (Fay-Feuer gamma); crude ${f(res.crude)}`}</p></div>
          <Stats items={[[`Crude, ${n1}`, `${f(res.crude)} ${perTxt}`], [`Standardised, ${n1}`, `${f(res.dsr)} (${f(res.ci[0])} to ${f(res.ci[1])})`],
            ...(res2 ? [[`Crude, ${n2}`, `${f(res2.crude)} ${perTxt}`], [`Standardised, ${n2}`, `${f(res2.dsr)} (${f(res2.ci[0])} to ${f(res2.ci[1])})`]] : []),
            rr ? ['Difference of standardised rates', `${f(rr.difference)} ${perTxt}`] : null]} />
          <DataTable wrap caption={`Rates in each age group, ${perTxt}, and the standard's weights`} columns={['Age group', two ? `Rate, ${n1}` : 'Rate', ...(two ? [`Rate, ${n2}`] : []), 'Standard weight']}
            rows={res.strata.map((s, i) => [s.label, f(s.rate), ...(two ? [f(res2.strata[i].rate)] : []), pc(s.weight)])} numeric={two ? [1, 2, 3] : [1, 2]} />
          <Checks items={[
            res.strata.some((s) => s.x < 5) ? { text: `${res.strata.filter((s) => s.x < 5).length} age group${res.strata.filter((s) => s.x < 5).length === 1 ? ' has' : 's have'} fewer than 5 events; its rate is unstable, and the interval allows for that.` } : null,
            { text: 'A standardised rate is for comparison only: its value depends on the standard chosen. Compare groups only when they use the same standard, and say which standard it is.' },
            res2 ? { text: `The crude ratio is ${ratio(res.crude / res2.crude)} and the standardised one ${ratio(rr ? rr.est : NaN)}: the difference between them is the part of the crude contrast that age structure explains.` } : null,
            res2 ? { text: "The CI of the ratio uses each standardised rate's variance on the log scale (delta method), an approximation that is fair when each group has a reasonable number of events." } : null,
          ]} />
          <Report text={rr
            ? `Directly standardised to ${whoUsed ? 'the WHO World Standard Population (2000-2025)' : 'the standard population [INSERT: name and source of the standard]'}, the ${thing} was ${f(res.dsr)} ${perTxt} (95% CI ${f(res.ci[0])} to ${f(res.ci[1])}) in ${s1} and ${f(res2.dsr)} ${perTxt} (95% CI ${f(res2.ci[0])} to ${f(res2.ci[1])}) in ${s2}, a ratio of ${ratio(rr.est)} (95% CI ${rCI(rr.ci)}); the crude rates were ${f(res.crude)} and ${f(res2.crude)} ${perTxt}.`
            : `The ${whoUsed ? 'age-standardised' : 'standardised'} ${thing} in ${s1} was ${f(res.dsr)} ${perTxt} (95% CI ${f(res.ci[0])} to ${f(res.ci[1])}, gamma method), against a crude rate of ${f(res.crude)} ${perTxt}; standard: ${whoUsed ? 'WHO World Standard Population (2000-2025)' : '[INSERT: name and source of the standard]'}.`} />
          <CodeExport spec={{ kind: 'dsr', strata: r.rows.map(({ label, x }) => ({ label, vals: x })), two, per: m }} />
          <AtLevel min="advanced"><p class="small">DSR = Σ wᵢ·xᵢ/nᵢ with wᵢ the standard's share of age group i; var = Σ (wᵢ/nᵢ)²·xᵢ. The gamma interval of Fay and Feuer (1997) matches a gamma distribution to the DSR and widens the upper limit by the largest wᵢ/nᵢ, as R's epitools::ageadjust.direct does.</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['fayFeuer', ...(whoUsed ? ['whoStandard'] : []), 'breslowDay87', 'rothmanME']} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ----------------------------------------------- indirect standardisation --- */

const EX_INDIRECT = [['0-14', 52000, 0.3], ['15-29', 48000, 0.4], ['30-44', 39000, 0.9], ['45-59', 26000, 3.0], ['60+', 15000, 13.0]];

function IndirectPanel() {
  const [rows, setRows] = useState(() => mkRows(EX_INDIRECT));
  const [obs, setObs] = useState('380');
  const [per, setPer] = useState('1000');
  const [crudeStd, setCrudeStd] = useState('');
  const [src, setSrc] = useState(''), [pop, setPop] = useState(''), [what, setWhat] = useState('');
  const r = readRows(rows, { positive: [0] });
  const O = parseNumber(obs);
  const m = Number(per);
  let err = r.error, res = null;
  if (!err && r.rows.length < 1) err = 'Enter at least one age group.';
  if (!err && !isInt(O)) err = 'Enter the observed number of events as a whole number.';
  if (!err) {
    res = indirectStandard(r.rows.map(({ label, x }) => ({ label, n: x[0], rate: x[1] / m })), O);
    if (!(res.expected > 0)) { err = 'The expected number is 0: give the standard rates.'; res = null; }
  }
  const cs = parseNumber(crudeStd);
  const isr = res && cs > 0 ? res.smr * cs : null;
  const source = src.trim() || '[INSERT: source and year of the standard rates]';
  const popName = pop.trim() || '[INSERT: population]';
  const thing = what.trim() || 'events';
  return (
    <>
      <section class="panel stack" aria-labelledby="is-h">
        <h2 id="is-h">Indirect standardisation (SMR)</h2>
        <p class="small">Compares the events observed in a population with those expected if it had a standard population's age-specific rates. Use it when the population is small or its age-specific rates are unknown.</p>
        <RowsTable cols={['Population (or person-years)', `Standard rate per ${count(m)}`]} rows={rows} setRows={setRows} what="age group" />
        <div class="fields">
          <NumberField label="Events observed (all ages)" value={obs} onInput={setObs} inputMode="numeric" />
          <SelectField label="Standard rates are" value={per} onChange={setPer} options={PER_RATE.filter((o) => o.value !== '1').map((o) => ({ ...o, label: o.label.replace('per', 'Per') }))} />
          <NumberField label={`Standard's crude rate per ${count(m)} (optional)`} value={crudeStd} onInput={setCrudeStd} hint="For the indirectly standardised rate" />
        </div>
        <div class="fields">
          <TextField label="Source of the standard rates, with year" value={src} onInput={setSrc} placeholder="SRS Statistical Report 2021, Odisha" />
          <TextField label="Population (for the sentence)" value={pop} onInput={setPop} placeholder="mine workers, Sundargarh" />
          <TextField label="What the events are (for the sentence)" value={what} onInput={setWhat} placeholder="deaths" />
        </div>
        <p class="small">Illustrative numbers: replace them with yours. Standard rates should come from a large reference population, with their source and year.</p>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="isr-h">
          <div><h2 id="isr-h" style="margin-bottom:6px">SMR = {ratio(res.smr)} ({fixed(100 * res.smr, 0)})</h2>
            <p class="verdict-line mono">95% CI {rCI(res.ci)} (exact Poisson); exact {P(res.p)}; observed {count(res.observed)}, expected {fixed(res.expected, 1)}</p></div>
          <Stats items={[['Observed', count(res.observed)], ['Expected', fixed(res.expected, 1)], ['SMR × 100', `${fixed(100 * res.smr, 0)} (${fixed(100 * res.ci[0], 0)} to ${fixed(100 * res.ci[1], 0)})`],
            isr !== null ? [`Indirectly standardised rate per ${count(m)}`, `${s3(isr)} (${s3(res.ci[0] * cs)} to ${s3(res.ci[1] * cs)})`] : null]} />
          <DataTable wrap caption="Expected events in each age group, at the standard's rates" columns={['Age group', `Population × rate per ${count(m)}`, 'Expected']}
            rows={res.strata.map((s) => [s.label, `${ptx(s.n)} × ${s3(s.rate * m)}`, fixed(s.expected, 2)])} numeric={[1, 2]} />
          <Checks items={[
            res.observed < 10 ? { text: `With ${res.observed} observed event${res.observed === 1 ? '' : 's'}, the exact interval is wide; report it with the counts.` } : null,
            { text: "SMRs of two populations should not be compared with each other: each is weighted by its own population's age structure. Compare each with the standard, or use direct standardisation." },
            { text: 'The SMR assumes the standard rates apply to this population apart from the factor under study; the standard population should be large, so its rates carry little sampling error.' },
          ]} />
          <Report text={`In ${popName}, ${count(res.observed)} ${thing} were observed against ${fixed(res.expected, 1)} expected from the age-specific rates of ${source}: standardised ${thing === 'deaths' ? 'mortality' : 'incidence'} ratio ${ratio(res.smr)} (95% CI ${rCI(res.ci)}, exact), ${P(res.p)}.${isr !== null ? ` The indirectly standardised rate was ${s3(isr)} per ${count(m)}.` : ''}`} />
          <CodeExport spec={{ kind: 'smr', strata: r.rows.map(({ label, x }) => ({ label, vals: x })), observed: O, per: m }} />
          <AtLevel min="advanced"><p class="small">Expected E = Σ nᵢ·Rᵢ (study population times the standard's rate in each age group); SMR = O/E. Exact limits from the chi-square form of the Poisson distribution (Ulm 1990): χ²(2O, 0.025)/(2E) and χ²(2O + 2, 0.975)/(2E). The p-value is R's poisson.test of O against E.</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['ulm90', 'breslowDay87', 'rothmanME']} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- page --- */

export default function StratifiedTool() {
  const ds = useDataset();
  const [tab, setTab] = useState('strat');
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} title="Confounding and Standardisation"
        lede="Adjust a 2 × 2 or person-time comparison for a third variable with Mantel-Haenszel methods, check whether the effect differs across strata, and standardise rates directly or indirectly." />
      <div class="stack">
        <DataPanel examples={[{ label: 'Load example antenatal data', csv: exampleCsv, source: 'example' }, { label: 'Load example TB cohort', csv: exampleTbCsv, source: 'example-tb' }]} />
        <Disclose title="Stratify or standardise?">
          <ul>
            <li><strong>Stratified analysis</strong>: you have individual-level data or counts for each stratum of a possible confounder (age group, sex, residence). The Mantel-Haenszel estimate adjusts for it; the strata themselves show whether the effect differs (effect modification).</li>
            <li><strong>Direct standardisation</strong>: you want to compare rates between populations (districts, years) whose age structures differ, and you know each population's age-specific rates.</li>
            <li><strong>Indirect standardisation</strong>: a population is small, or its age-specific rates are unknown but its total events are known, as in an occupational cohort.</li>
          </ul>
          <p>Confounding is a bias to remove; effect modification is a finding to report. Several confounders at once need regression.</p>
        </Disclose>
        <div><Seg wide value={tab} onChange={setTab} options={[{ value: 'strat', label: 'Stratified analysis' }, { value: 'direct', label: 'Direct standardisation' }, { value: 'indirect', label: 'Indirect (SMR)' }]} /></div>
        {tab === 'strat' ? <StratifiedPanel ds={ds} /> : tab === 'direct' ? <DirectPanel /> : <IndirectPanel />}
      </div>
    </div>
  );
}
