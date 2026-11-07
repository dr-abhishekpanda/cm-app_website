/* Tool: frequency, association and impact. A proportion or a rate with its CI; a 2 x 2 table read by
 * design (cohort or trial, case-control, cross-sectional) with only the measures that design supports;
 * person-time; 1:1 matched pairs; and the population impact of a published ratio. Fractions follow the
 * direction of the effect (attributable or prevented), and the number needed to treat is worded by
 * whether the outcome is one to prevent or one to achieve. */
import { useState } from 'preact/hooks';
import { proportion, rate, twoByTwo, personTime, matchedPairs, populationFraction, impliedRiskDifference, numberNeeded } from '../../engine/epi.js';
import { isMissing } from '../../engine/data.js';
import { fixed, pValue, count, sig, sci, ratio, parseNumber } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, NumberField, TextField, SelectField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col, exampleCsv, exampleTbCsv } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs, Disclose } from '../../ui/results.jsx';
import { PercentBars } from '../../ui/plot.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';

const pretty = (s) => String(s).replace(/_/g, ' ');
const P = (p) => pValue(p).report;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const isInt = (v) => Number.isInteger(v) && v >= 0;

/** A percentage with one decimal, two below 1%. */
const pd = (p) => (Math.abs(p) < 0.01 && p !== 0 ? 2 : 1);
const pc = (p, d = pd(p)) => (Number.isFinite(p) ? `${fixed(100 * p, d)}%` : '—');
const pcCI = (ci, d) => (ci ? `${pc(ci[0], d ?? pd(Math.min(...ci.map(Math.abs))))} to ${pc(ci[1], d ?? pd(Math.min(...ci.map(Math.abs))))}` : '—');
const pp = (v, d) => fixed(100 * v, d);
const rCI = (ci) => (ci ? `${ratio(ci[0])} to ${ratio(ci[1])}` : '—');
const nn = (v) => (Number.isFinite(v) ? fixed(v, 1) : '∞');
const ptx = (t) => (Number.isInteger(t) ? count(t) : sig(t, 6));
/** Three significant figures, keeping trailing zeros so the limits of an interval line up (1.30, not 1.3). */
const s3 = (x) => (!Number.isFinite(x) ? (Number.isNaN(x) ? '—' : '∞') : Math.abs(x) >= 1000 ? count(x) : x !== 0 && Math.abs(x) < 1e-6 ? sci(x, 3) : x.toPrecision(3).replace(/^-/, '−'));
/** A row of a two-column table that fits a phone: the measure with its method, and the estimate with its CI. */
const mrow = (name, method, est, ci, on = false) => [{ text: method ? `${name} (${method})` : name, cls: on ? 'hl' : '' }, { text: ci ? `${est} (${ci})` : est, cls: on ? 'hl' : '' }];
const MCOLS = ['Measure (method)', 'Estimate (95% CI)'];

const POSITIVE = ['yes', 'y', '1', 'true', 'positive', 'pos', 'present', 'case', 'cases', 'exposed', 'dead', 'died', 'death', 'event', 'reactive', 'abnormal', 'poor'];
const guessLevel = (levels) => levels.find((l) => POSITIVE.includes(String(l).trim().toLowerCase())) ?? levels[levels.length - 1];
const other = (levels, l) => levels.find((x) => x !== l);

const needData = <Callout mark="Data">Load or paste your data at the top of the page, or try one of the example datasets.</Callout>;

function Checks({ items }) {
  const xs = items.filter(Boolean);
  if (!xs.length) return null;
  return (
    <div>
      <h3 class="sub">Checks</h3>
      <ul class="checks">{xs.map((c) => <li class={c.ok === true ? 'ok' : c.ok === false ? 'no' : 'info'}><span class="mk">{c.ok === true ? 'OK' : c.ok === false ? 'Check' : 'Note'}</span><span>{c.text}</span></li>)}</ul>
    </div>
  );
}

/** A two-level column and the level that counts (exposed, outcome present). */
function LevelPick({ ds, label, value, onChange, level, onLevel, exclude = [], levelLabel }) {
  const c = col(ds, value);
  return (
    <>
      <ColumnSelect ds={ds} label={label} value={value} onChange={(v) => { onChange(v); onLevel(null); }} kind="group" maxLevels={2} exclude={exclude}
        hint="A column with two values; recode others first." />
      {c ? <SelectField label={levelLabel} value={level ?? guessLevel(c.levels)} onChange={onLevel} options={c.levels.map((l) => ({ value: l, label: l }))} /> : null}
    </>
  );
}

/** Rows a and c count the exposed and unexposed with the outcome. */
function countTable(ds, e, eLevel, o, oLevel) {
  const ce = col(ds, e), co = col(ds, o);
  let a = 0, b = 0, c = 0, d = 0, dropped = 0;
  for (let i = 0; i < ds.n; i++) {
    const x = ce.raw[i], y = co.raw[i];
    if (isMissing(x) || isMissing(y)) { dropped++; continue; }
    const ex = x === eLevel, ou = y === oLevel;
    if (ex && ou) a++; else if (ex) b++; else if (ou) c++; else d++;
  }
  return { t: [[a, b], [c, d]], dropped };
}

/** The NNT and its CI in words: benefit or harm by the sign and the kind of outcome. */
function nntWords(nnt, harmfulOutcome) {
  const harmSide = (sign) => (harmfulOutcome ? sign > 0 : sign < 0);
  const kind = nnt.sign === 0 ? null : harmSide(nnt.sign) ? 'NNH' : 'NNT';
  let ci = '—';
  if (nnt.interval && !nnt.interval.crosses) ci = `${nn(nnt.interval.ci[0])} to ${nn(nnt.interval.ci[1])}`;
  else if (nnt.interval) {
    const neg = `${harmSide(-1) ? 'NNH' : 'NNT'} ${nn(nnt.interval.neg)}`, pos = `${harmSide(1) ? 'NNH' : 'NNT'} ${nn(nnt.interval.pos)}`;
    ci = harmSide(1) ? `${neg} to ∞ to ${pos}` : `${pos} to ∞ to ${neg}`;
  }
  return { kind, ci, crosses: !!nnt.interval?.crosses };
}

/* ----------------------------------------------------------- Frequency --- */

const MEASURES = [
  { value: 'prevalence', label: 'Prevalence' }, { value: 'risk', label: 'Risk (cumulative incidence)' }, { value: 'attack rate', label: 'Attack rate' },
  { value: 'case fatality', label: 'Case fatality' }, { value: 'coverage', label: 'Coverage' }, { value: 'proportion', label: 'Other proportion' },
];
const PER = [{ value: '100', label: 'per 100 (%)' }, { value: '1000', label: 'per 1,000' }, { value: '10000', label: 'per 10,000' }, { value: '100000', label: 'per 1,00,000' }];
const PER_RATE = [{ value: '1', label: 'per 1' }, { value: '100', label: 'per 100' }, { value: '1000', label: 'per 1,000' }, { value: '10000', label: 'per 10,000' }, { value: '100000', label: 'per 1,00,000' }];
const UNITS = [{ value: 'person-years', label: 'Person-years' }, { value: 'person-months', label: 'Person-months' }, { value: 'person-weeks', label: 'Person-weeks' }, { value: 'person-days', label: 'Person-days' }];
const perText = (m) => (m === 100 ? '%' : ` per ${count(m)}`);

function FrequencyPanel({ ds }) {
  const [kind, setKind] = useState('prop');
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? (ds ? 'data' : 'typed');
  const [what, setWhat] = useState('prevalence');
  const [ofWhat, setOf] = useState('');
  const [x, setX] = useState('17'), [n, setN] = useState('120');
  const [method, setMethod] = useState('wilson');
  const [per, setPer] = useState('100');
  const [ev, setEv] = useState('12'), [pt, setPt] = useState('3456.5');
  const [unit, setUnit] = useState('person-years'), [perR, setPerR] = useState('1000');
  const [cOut, setCOut] = useState(null), [lOut, setLOut] = useState(null), [cTime, setCTime] = useState(null);

  let res = null, err = null, dropped = 0, name = ofWhat.trim();
  if (kind === 'prop') {
    let xi, ni;
    if (mode === 'data' && ds) {
      const c = col(ds, cOut);
      if (c) {
        const lv = lOut ?? guessLevel(c.levels);
        xi = 0; ni = 0;
        c.raw.forEach((v) => { if (isMissing(v)) dropped++; else { ni++; if (v === lv) xi++; } });
        if (!name) name = `${pretty(cOut)} "${lv}"`;
      }
    } else { xi = parseNumber(x); ni = parseNumber(n); }
    if (xi !== undefined) {
      if (!isInt(xi) || !isInt(ni)) err = 'Enter whole numbers: the number with the condition and the number in the group.';
      else if (ni === 0) err = 'The group needs at least one person.';
      else if (xi > ni) err = 'The numerator cannot be larger than the denominator.';
      else res = proportion(xi, ni, { method });
    }
  } else {
    let xi, ti;
    if (mode === 'data' && ds) {
      const c = col(ds, cOut), t = col(ds, cTime);
      if (c && t) {
        const lv = lOut ?? guessLevel(c.levels);
        xi = 0; ti = 0;
        for (let i = 0; i < ds.n; i++) {
          const v = c.raw[i], tv = t.numbers[i];
          if (isMissing(v) || tv === null || !Number.isFinite(tv)) { dropped++; continue; }
          ti += tv; if (v === lv) xi++;
        }
        if (!name) name = `${pretty(cOut)} "${lv}"`;
      }
    } else { xi = parseNumber(ev); ti = parseNumber(pt); }
    if (xi !== undefined) {
      if (!isInt(xi)) err = 'Enter a whole number of events.';
      else if (!(ti > 0)) err = 'Person-time must be a positive number.';
      else res = rate(xi, ti);
    }
  }
  const m = kind === 'prop' ? Number(per) : Number(perR);
  const measureName = kind === 'prop' ? MEASURES.find((o) => o.value === what).label.replace(' (cumulative incidence)', '') : 'Incidence rate';
  const fmtP = (v) => (m === 100 ? pc(v) : s3(v * m));
  return (
    <>
      <section class="panel stack" aria-labelledby="fq-h">
        <h2 id="fq-h">A proportion or a rate</h2>
        <Seg label="Measure" value={kind} onChange={setKind} options={[{ value: 'prop', label: 'A proportion (prevalence, risk, attack rate)' }, { value: 'rate', label: 'A rate (events per person-time)' }]} />
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'From your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'Type the numbers' }]} />
        {mode === 'data' ? (ds ? (
          <div class="fields">
            <ColumnSelect ds={ds} label={kind === 'prop' ? 'Column' : 'Event column'} value={cOut} onChange={(v) => { setCOut(v); setLOut(null); }} kind="group" maxLevels={kind === 'prop' ? 12 : 2} />
            {col(ds, cOut) ? <SelectField label={kind === 'prop' ? 'Count the value' : 'Value that marks an event'} value={lOut ?? guessLevel(col(ds, cOut).levels)} onChange={setLOut} options={col(ds, cOut).levels.map((l) => ({ value: l, label: l }))} /> : null}
            {kind === 'rate' ? <ColumnSelect ds={ds} label="Person-time column (each person's follow-up)" value={cTime} onChange={setCTime} kind="numeric" /> : null}
          </div>
        ) : needData) : kind === 'prop' ? (
          <div class="fields">
            <NumberField label="Number with the condition" value={x} onInput={setX} inputMode="numeric" />
            <NumberField label="Number in the group" value={n} onInput={setN} inputMode="numeric" />
          </div>
        ) : (
          <div class="fields">
            <NumberField label="Number of events (new cases, deaths)" value={ev} onInput={setEv} inputMode="numeric" />
            <NumberField label="Person-time at risk" value={pt} onInput={setPt} hint="Sum of each person's follow-up, or mid-period population × years" />
          </div>
        )}
        <div class="fields">
          {kind === 'prop' ? <SelectField label="What it measures" value={what} onChange={setWhat} options={MEASURES} /> : <SelectField label="Unit of person-time" value={unit} onChange={setUnit} options={UNITS} />}
          <TextField label="Of what (for the sentence)" value={ofWhat} onInput={setOf} placeholder={kind === 'prop' ? 'anaemia' : 'tuberculosis'} />
          {kind === 'prop' ? <SelectField label="Express" value={per} onChange={setPer} options={PER} /> : <SelectField label="Express" value={perR} onChange={setPerR} options={PER_RATE} />}
        </div>
        {kind === 'prop' ? <Seg label="95% CI" value={method} onChange={setMethod} options={[{ value: 'wilson', label: 'Wilson (recommended)' }, { value: 'exact', label: 'Exact (Clopper-Pearson)' }]} /> : null}
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res && kind === 'prop' ? (
        <section class="panel stack result-panel" aria-labelledby="fqr-h">
          <div><h2 id="fqr-h" style="margin-bottom:6px">{measureName} = {fmtP(res.p)}{m === 100 ? '' : perText(m)}</h2>
            <p class="verdict-line mono">95% CI {m === 100 ? pcCI(res.ci) : `${s3(res.ci[0] * m)} to ${s3(res.ci[1] * m)}${perText(m)}`} ({method === 'exact' ? 'Clopper-Pearson' : 'Wilson'})</p></div>
          <Stats items={[['Numerator', count(res.x)], ['Denominator', count(res.n)], ['Wilson 95% CI', pcCI(proportion(res.x, res.n).ci)], ['Exact 95% CI', pcCI(proportion(res.x, res.n, { method: 'exact' }).ci)], dropped ? ['Left out (missing)', count(dropped)] : null]} />
          <Checks items={[
            res.x === 0 || res.x === res.n ? { text: `With ${res.x === 0 ? 'no one' : 'everyone'} counted, the interval is one-sided in effect; the exact and Wilson limits differ most here. A rough guide for zero events is the "rule of three": an upper limit of about 3/n (${pc(3 / res.n)}).` } : null,
            what === 'case fatality' ? { text: 'Case fatality is a proportion of cases, not a rate per person-time; it depends on how long cases were followed and on how completely mild cases were found.' } : null,
            what === 'prevalence' ? { text: 'From a cluster or multistage survey, this CI is too narrow: it assumes a simple random sample. Multiply the variance by the design effect, or analyse with the survey design.' } : null,
          ]} />
          <Report text={`The ${what === 'proportion' ? 'proportion' : what}${name ? ` of ${name}` : ''} was ${fmtP(res.p)}${m === 100 ? '' : perText(m)} (${count(res.x)} of ${count(res.n)}; 95% CI ${m === 100 ? pcCI(res.ci) : `${s3(res.ci[0] * m)} to ${s3(res.ci[1] * m)}`}, ${method === 'exact' ? 'Clopper-Pearson exact' : 'Wilson score'} interval).`} />
          <CodeExport spec={mode === 'data' ? { kind: 'freqP', col: cOut, level: lOut ?? guessLevel(col(ds, cOut).levels), numeric: col(ds, cOut).numeric, method } : { kind: 'freqP', x: res.x, n: res.n, method }} />
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={[method === 'exact' ? 'clopper' : 'wilson', 'kirkwood']} /></div>
        </section>
      ) : null}
      {res && kind === 'rate' ? (
        <section class="panel stack result-panel" aria-labelledby="fqr-h">
          <div><h2 id="fqr-h" style="margin-bottom:6px">Incidence rate = {s3(res.rate * m)} per {count(m)} {unit}</h2>
            <p class="verdict-line mono">95% CI {s3(res.ci[0] * m)} to {s3(res.ci[1] * m)} (exact Poisson)</p></div>
          <Stats items={[['Events', count(res.x)], ['Person-time', `${ptx(res.t)} ${unit}`], ['Expected events, 95% limits', `${sig(res.countCi[0], 4)} to ${sig(res.countCi[1], 4)}`], dropped ? ['Left out (missing)', count(dropped)] : null]} />
          <Checks items={[
            res.x < 10 ? { text: `With ${res.x} event${res.x === 1 ? '' : 's'}, the interval is wide: a rate rests on the number of events, not the person-time.` } : null,
            { text: 'A single rate assumes the rate stays roughly constant over follow-up. If risk changes with time since entry, use survival analysis.' },
          ]} />
          <Report text={`The incidence rate${name ? ` of ${name}` : ''} was ${s3(res.rate * m)} per ${count(m)} ${unit} (${count(res.x)} events in ${ptx(res.t)} ${unit}; 95% CI ${s3(res.ci[0] * m)} to ${s3(res.ci[1] * m)}, exact Poisson interval).`} />
          <CodeExport spec={mode === 'data' ? { kind: 'freqR', col: cOut, level: lOut ?? guessLevel(col(ds, cOut).levels), numeric: col(ds, cOut).numeric, time: cTime } : { kind: 'freqR', x: res.x, t: res.t }} />
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['garwood', 'kirkwood']} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ----------------------------------------------------------- 2 x 2 table --- */

const DESIGNS = [{ value: 'cohort', label: 'Cohort or trial' }, { value: 'case-control', label: 'Case-control' }, { value: 'cross', label: 'Cross-sectional' }];
const EXAMPLE = { cohort: [['40', '60'], ['20', '80']], 'case-control': [['45', '30'], ['55', '120']], cross: [['60', '140'], ['30', '170']] };
const METHOD_NAME = { wald: 'Wald', score: 'score (Koopman)', exact: 'exact', midp: 'mid-p exact', newcombe: 'Newcombe' };

function TwoByTwoPanel({ ds }) {
  const [design, setDesign] = useState('cohort');
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? (ds ? 'data' : 'typed');
  const [cells, setCells] = useState(EXAMPLE);
  const [expName, setExpName] = useState(''), [outName, setOutName] = useState('');
  const [e, setE] = useState(null), [eL, setEL] = useState(null), [o, setO] = useState(null), [oL, setOL] = useState(null);
  const [harmful, setHarmful] = useState('harm');
  const [peText, setPe] = useState('');

  const cc = design === 'case-control';
  let t = null, err = null, dropped = 0, g1 = 'exposed', g0 = 'unexposed', outcome = outName.trim() || 'the outcome', exposure = expName.trim() || 'the exposure', spec = null;
  let expPhrase = expName.trim() ? `were exposed to ${expName.trim()}` : 'were exposed';
  if (mode === 'data' && ds) {
    const ce = col(ds, e), co = col(ds, o);
    if (ce && co) {
      if (e === o) err = 'Pick two different columns.';
      else {
        const el = eL ?? guessLevel(ce.levels), ol = oL ?? guessLevel(co.levels);
        const r = countTable(ds, e, el, o, ol);
        t = r.t; dropped = r.dropped;
        g1 = `${pretty(e)} "${el}"`; g0 = `${pretty(e)} "${other(ce.levels, el)}"`;
        exposure = `${pretty(e)} "${el}"`; outcome = `${pretty(o)} "${ol}"`; expPhrase = `were in the ${g1} group`;
        spec = { kind: 'epi2x2', design, exposure: e, exposed: el, outcome: o, event: ol, numericE: ce.numeric, numericO: co.numeric };
      }
    }
  } else if (mode === 'typed') {
    const v = cells[design].map((r) => r.map(parseNumber));
    if (!v.every((r) => r.every(isInt))) err = 'Enter whole-number counts in all four cells (0 is allowed).';
    else t = v;
  }
  let res = null;
  if (t && !err) {
    const [[a, b], [c, d]] = t;
    if (cc ? a + c === 0 || b + d === 0 : a + b === 0 || c + d === 0) err = cc ? 'The study needs at least one case and one control.' : 'Each group needs at least one person.';
    else if (cc ? a + b === 0 || c + d === 0 : a + c === 0 || b + d === 0) err = cc ? 'No one, or everyone, was exposed, so the groups cannot be compared.' : 'No one, or everyone, had the outcome, so the groups cannot be compared.';
    else {
      res = twoByTwo(t, { design });
      if (!spec) spec = { kind: 'epi2x2', design, table: t };
    }
  }
  const pe = parseNumber(peText);
  const peOk = Number.isFinite(pe) && pe > 0 && pe < 100;
  const setCell = (i, j, val) => setCells({ ...cells, [design]: cells[design].map((r, x) => (x === i ? r.map((cv, y) => (y === j ? val : cv)) : r)) });
  const colLabels = cc ? ['Cases', 'Controls'] : ['Outcome', 'No outcome'];

  return (
    <>
      <section class="panel stack" aria-labelledby="tt-h">
        <h2 id="tt-h">Two groups: a 2 × 2 table</h2>
        <Seg label="Study design" value={design} onChange={setDesign} options={DESIGNS} />
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'A table of counts' }]} />
        {mode === 'data' ? (ds ? (
          <div class="fields">
            <LevelPick ds={ds} label="Exposure column" value={e} onChange={setE} level={eL} onLevel={setEL} levelLabel="Exposed group" />
            <LevelPick ds={ds} label={cc ? 'Case or control column' : 'Outcome column'} value={o} onChange={setO} level={oL} onLevel={setOL} levelLabel={cc ? 'Value for cases' : 'Value for the outcome'} exclude={[e].filter(Boolean)} />
          </div>
        ) : needData) : (
          <>
            <div class="fields">
              <TextField label="Exposure (for the sentence)" value={expName} onInput={setExpName} placeholder="tobacco use" />
              <TextField label={cc ? 'Disease of the cases' : 'Outcome (for the sentence)'} value={outName} onInput={setOutName} placeholder="tuberculosis" />
            </div>
            <div class="tablewrap">
              <table class="table compact entry">
                <thead><tr><th scope="col">Exposure</th>{colLabels.map((l) => <th scope="col">{l}</th>)}</tr></thead>
                <tbody>{['Exposed', 'Unexposed'].map((rl, i) => (
                  <tr><th scope="row">{rl}</th>{[0, 1].map((j) => <td><input inputMode="numeric" aria-label={`Count: ${rl}, ${colLabels[j]}`} value={cells[design][i][j]} onInput={(ev) => setCell(i, j, ev.currentTarget.value)} /></td>)}</tr>
                ))}</tbody>
              </table>
            </div>
            <p class="small">Illustrative numbers: replace them with yours.</p>
          </>
        )}
        {design === 'cohort' ? <Seg label="The outcome is" value={harmful} onChange={setHarmful} options={[{ value: 'harm', label: 'One to prevent (illness, death)' }, { value: 'benefit', label: 'One to achieve (cure, recovery)' }]} /> : null}
        {design === 'cohort' && harmful === 'harm' ? (
          <div class="fields">
            <NumberField label="Exposed in the population, % (optional)" value={peText} onInput={setPe} hint="For the population fraction when your sample's split is not the population's (Levin's formula); give its source in the text"
              error={peText.trim() && !peOk ? 'Enter a percentage between 0 and 100.' : ''} />
          </div>
        ) : null}
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? <TwoByTwoResult res={res} design={design} harmful={design !== 'cohort' || harmful === 'harm'} g1={g1} g0={g0} outcome={outcome} exposure={exposure} expPhrase={expPhrase} dropped={dropped} pe={peOk && design === 'cohort' && harmful === 'harm' ? pe / 100 : null} spec={spec} typed={mode === 'typed'} /> : null}
    </>
  );
}

function TwoByTwoResult({ res, design, harmful, g1, g0, outcome, exposure, expPhrase, dropped, pe, spec, typed }) {
  const { a, b, c, d, n1, n0, m1, m0, N } = res;
  const cc = design === 'case-control', cross = design === 'cross';
  const T = res.tests;
  const testName = T.exact ? "Fisher's exact test" : "χ² with Yates' correction";
  const pMain = T.exact ? T.pFisher : T.pYates;
  const testText = T.exact ? `Fisher's exact test ${P(T.pFisher)}` : `χ² = ${fixed(T.chi2Yates, 2)} with Yates' correction, ${P(T.pYates)}`;
  // The headline measure for the design, with the interval the rule picks.
  const head = cc ? { name: 'Odds ratio', short: 'OR', m: res.or, method: res.or.auto } : { name: cross ? 'Prevalence ratio' : 'Risk ratio', short: cross ? 'PR' : 'RR', m: res.rr, method: res.rr.auto };
  const hci = head.m[head.method];
  const rLabel = cross ? 'Prevalence' : 'Risk';
  const orName = cross ? 'Prevalence odds ratio' : 'Odds ratio';
  const rows = [];
  const hl = (on, v) => ({ text: v, cls: on ? 'hl' : '' });
  if (!cc) {
    const rr = ratio(res.rr.est), rd = `${pp(res.rd.est, 1)} points`, dn = cross ? 'Prevalence difference' : 'Risk difference';
    rows.push(mrow(head.name, 'Wald, log scale', rr, rCI(res.rr.wald), head.method === 'wald'));
    rows.push(mrow(head.name, 'score, Koopman', rr, rCI(res.rr.score), head.method === 'score'));
    rows.push(mrow(dn, 'Newcombe', rd, `${pp(res.rd.newcombe[0], 1)} to ${pp(res.rd.newcombe[1], 1)}`, true));
    rows.push(mrow(dn, 'Wald', rd, `${pp(res.rd.wald[0], 1)} to ${pp(res.rd.wald[1], 1)}`));
  }
  const on = cc ? 'Odds ratio' : orName, or = ratio(res.or.est);
  rows.push(mrow(on, 'Wald, Woolf', or, rCI(res.or.wald), cc && res.or.auto === 'wald'));
  rows.push(mrow(on, 'exact, conditional', or, rCI(res.or.exact), cc && res.or.auto === 'exact'));
  rows.push(mrow(on, 'mid-p exact', or, rCI(res.or.midp)));

  // Impact.
  const impact = [];
  const nnt = design === 'cohort' ? res.nnt : null;
  const nw = nnt ? nntWords(nnt, harmful) : null;
  if (nnt && nw.kind) impact.push(mrow(nw.kind === 'NNT' ? 'Number needed to treat (or be exposed) for one more to benefit, NNT' : 'Number needed to be exposed for one more to be harmed, NNH', "Altman, from Newcombe's CI", `${nn(nnt.value)}, round up to ${count(nnt.whole)}`, nw.ci));
  const afe = harmful ? res.afe : null;
  let paf = harmful ? res.paf : null, pafFormula = cc ? "Miettinen's formula, Jewell's CI" : "the study's own exposure split, Jewell's CI";
  if (pe !== null && harmful) {
    paf = populationFraction({ est: res.rr.est, ci: res.rr[res.rr.auto], pe });
    pafFormula = `Levin's formula, ${pc(pe)} exposed, CI from the RR's limits`;
  }
  const fracName = (f, where) => (f.kind === 'attributable' ? `Attributable fraction ${where}` : `Prevented fraction ${where}`);
  const afeName = cc ? 'among the exposed (from the OR)' : cross ? 'of prevalent cases among the exposed' : 'among the exposed (AR%)';
  const pafName = cross ? 'of prevalent cases in the population' : 'in the population (PAR%)';
  if (afe) impact.push(mrow(fracName(afe, afeName), `from the ${cc ? 'OR' : head.short}'s ${METHOD_NAME[head.method]} limits`, pc(afe.est), pcCI(afe.ci, 1)));
  if (paf) impact.push(mrow(fracName(paf, pafName), pafFormula, pc(paf.est), pcCI(paf.ci, 1)));

  const tests = [
    [hl(!T.exact, `χ² = ${fixed(T.chi2Yates, 3)}, Yates' correction`), hl(!T.exact, pValue(T.pYates).exact)],
    [`χ² = ${fixed(T.chi2, 3)}, uncorrected`, pValue(T.p).exact],
    [hl(T.exact, "Fisher's exact test"), hl(T.exact, pValue(T.pFisher).exact)],
    ['Mid-p exact test', pValue(T.pMidp).exact],
  ];

  const r1 = res.r1, r0 = res.r0;
  const common = !cc && (Math.max(a / n1, c / n0) > 0.1);
  const sentence = cc
    ? `Of ${count(m1)} cases, ${count(a)} (${pc(a / m1)}) ${expPhrase}, against ${count(b)} of ${count(m0)} controls (${pc(b / m0)}): odds ratio ${ratio(res.or.est)} (95% CI ${rCI(hci)}, ${METHOD_NAME[head.method]}); ${testText}.`
    : `${cap(outcome)} was recorded in ${count(a)} of ${count(n1)} (${pc(a / n1)}) in the ${g1} group and ${count(c)} of ${count(n0)} (${pc(c / n0)}) in the ${g0} group: ${head.name.toLowerCase()} ${ratio(res.rr.est)} (95% CI ${rCI(hci)}, ${METHOD_NAME[head.method]}), ${cross ? 'prevalence' : 'risk'} difference ${pp(res.rd.est, 1)} percentage points (95% CI ${pp(res.rd.newcombe[0], 1)} to ${pp(res.rd.newcombe[1], 1)}); ${testText}.`;
  let impactSentence = '';
  if (harmful && afe && paf && Number.isFinite(afe.est)) {
    const who = cc || g1 === 'exposed' ? 'the exposed' : `the ${g1} group`;
    const where = pe !== null ? 'the population' : cc ? 'the source population' : 'the study population';
    impactSentence = afe.kind === 'attributable'
      ? ` If the association is causal, ${pc(afe.est)} of ${cross ? 'prevalent cases' : 'cases'} among ${who} (95% CI ${pcCI(afe.ci, 1)}) and ${pc(paf.est)} in ${where} (95% CI ${pcCI(paf.ci, 1)}) can be attributed to ${exposure}.`
      : ` If the association is causal, ${exposure} prevented ${pc(afe.est)} of the ${cross ? 'prevalent cases' : 'cases'} expected among ${who} (95% CI ${pcCI(afe.ci, 1)}) and ${pc(paf.est)} in ${where} (95% CI ${pcCI(paf.ci, 1)}).`;
  }
  if (nnt && nw.kind && Number.isFinite(nnt.value)) {
    // Harm: more of an outcome to prevent, or less of one to achieve. Benefit: the reverse.
    const what = harmful ? (nw.kind === 'NNH' ? `one more person had ${outcome}` : `one case of ${outcome} was prevented`)
      : nw.kind === 'NNT' ? `one more person achieved ${outcome}` : `one fewer person achieved ${outcome}`;
    impactSentence += ` For every ${count(nnt.whole)} people ${nw.kind === 'NNH' ? 'exposed' : 'treated (or exposed)'}, ${what} (number needed to ${nw.kind === 'NNH' ? 'harm' : 'treat'} ${nn(nnt.value)}; 95% CI ${nw.ci}).`;
  }
  return (
    <section class="panel stack result-panel" aria-labelledby="ttr-h">
      <div><h2 id="ttr-h" style="margin-bottom:6px">{head.name} = {ratio(head.m.est)}</h2>
        <p class="verdict-line mono">95% CI {rCI(hci)} ({METHOD_NAME[head.method]}); {testName}, {P(pMain)}</p></div>
      <Stats items={cc
        ? [['Cases exposed', `${count(a)} of ${count(m1)} (${pc(a / m1)})`], ['Controls exposed', `${count(b)} of ${count(m0)} (${pc(b / m0)})`], ['Odds of exposure: cases, controls', `${s3(c ? a / c : Infinity)}, ${s3(d ? b / d : Infinity)}`], dropped ? ['Left out (missing)', count(dropped)] : null]
        : [[`${rLabel}, ${g1}`, `${pc(a / n1)} (${pcCI(r1.ci)})`], [`${rLabel}, ${g0}`, `${pc(c / n0)} (${pcCI(r0.ci)})`], [`${rLabel}, overall`, `${pc(m1 / N)} (${count(m1)} of ${count(N)})`], dropped ? ['Left out (missing)', count(dropped)] : null]} />
      <figure style="margin:0">
        <PercentBars items={cc
          ? [{ label: 'Cases', pct: (100 * a) / m1, ci: res.pCases.ci.map((x) => 100 * x) }, { label: 'Controls', pct: (100 * b) / m0, ci: res.pControls.ci.map((x) => 100 * x) }]
          : [{ label: g1, pct: (100 * a) / n1, ci: r1.ci.map((x) => 100 * x) }, { label: g0, pct: (100 * c) / n0, ci: r0.ci.map((x) => 100 * x) }]}
          label={cc ? 'Percentage exposed among cases and controls, with 95% CIs' : `${rLabel} of the outcome in each group, with 95% CIs`} />
        <figcaption class="figcap">{cc ? 'Percentage exposed among cases and controls' : `${rLabel} of ${outcome} in each group`}; whiskers: Wilson 95% CIs.</figcaption>
      </figure>
      <DataTable wrap caption={cc ? 'The 2 × 2 table: exposure among cases and controls' : `The 2 × 2 table: ${outcome} by group`}
        columns={cc ? ['', 'Cases', 'Controls', 'Total'] : ['', 'Outcome', 'No outcome', 'Total']}
        rows={[[typed ? 'Exposed' : g1, count(a), count(b), count(a + b)], [typed ? 'Unexposed' : g0, count(c), count(d), count(c + d)], ['Total', count(m1), count(m0), count(N)]]}
        numeric={[1, 2, 3]} />
      <DataTable wrap caption="Measures of association" columns={MCOLS} rows={rows} numeric={[1]}
        note={`Highlighted: the interval reported above. ${res.small ? 'A cell below 5, so the score (risk ratio) or exact (odds ratio) interval.' : 'Every cell is 5 or more, so the Wald interval.'}`} />
      {impact.length ? <DataTable wrap caption="Measures of impact" columns={MCOLS} rows={impact} numeric={[1]} /> : null}
      <DataTable wrap caption="Tests of association" columns={['Test', 'p']} rows={tests} numeric={[1]}
        note={`Highlighted: the test reported above (${T.exact ? 'an expected count below 5' : 'every expected count 5 or more'}; smallest expected ${fixed(T.minExpected, 2)}).`} />
      <Checks items={[
        cc ? { text: 'Risks, the risk ratio and the risk difference cannot be estimated from a case-control study: the investigator fixed how many cases and controls to take. The odds ratio estimates the risk ratio when the disease is rare, or the rate ratio when controls are sampled from those at risk as each case arises.' } : null,
        cc ? { text: "The population fraction uses the proportion of cases exposed (Miettinen's formula), not the controls' or the whole sample's exposure, which the design does not fix." } : null,
        common && !cc ? { ok: false, text: `The outcome is common (${pc(Math.max(a / n1, c / n0))} in one group), so the ${cross ? 'prevalence odds ratio' : 'odds ratio'} (${ratio(res.or.est)}) lies further from 1 than the ${head.name.toLowerCase()} (${ratio(res.rr.est)}). Report the ${head.name.toLowerCase()}.` } : null,
        res.small ? { ok: false, text: `A cell has fewer than 5 people, so the ${cc ? 'odds ratio uses the exact (conditional) interval' : 'ratio uses the score interval (Koopman), which stays valid with small and zero counts'}.${T.exact ? " Fisher's exact test replaces the χ² test." : ''}` } : { ok: true, text: 'Every cell has 5 or more people: the Wald intervals are adequate.' },
        hci && hci[0] <= 1 && hci[1] >= 1 && (afe || paf) ? { text: 'The CI of the ratio includes 1, so the attributable or prevented fractions may be zero; their CIs cross zero.' } : null,
        design === 'cohort' && harmful && pe === null && paf ? { text: "The population fraction uses your study's own share of exposed people. That holds for a population-based cohort; if the groups were recruited separately, enter the population's exposure prevalence (Levin's formula) with its source." } : null,
        cross ? { text: 'Cross-sectional data show prevalence, which mixes how often disease starts with how long it lasts, and cannot show whether the exposure came first. The fractions describe prevalent cases only.' } : null,
        nw && nw.crosses ? { text: 'The CI of the risk difference includes zero, so the CI of the NNT runs from benefit through infinity to harm (Altman 1998).' } : null,
        { text: 'These are crude measures. If the groups differ in age, sex or other causes of the outcome, adjust: stratify (Mantel-Haenszel) or use regression.' },
      ]} />
      <Report text={sentence + impactSentence} />
      {spec ? <CodeExport spec={pe !== null ? { ...spec, pe } : spec} /> : null}
      <AtLevel min="advanced"><p class="small">Risk ratio CI: Wald on the log scale with SE √(1/a − 1/n₁ + 1/c − 1/n₀), or Koopman's score interval, which inverts the score test of p₁/p₀ = θ. Odds ratio: Woolf's SE √(1/a + 1/b + 1/c + 1/d); the exact and mid-p limits solve the noncentral hypergeometric tail probabilities. Attributable fraction among the exposed: (RR − 1)/RR; prevented fraction: 1 − RR. Population fraction: (R − R₀)/R for a cohort, with var log(1 − PAF) = (b + PAF(a + d))/(Nc); p_c(OR − 1)/OR for a case-control study, with var log(1 − PAF) = a/(c·m₁) + b/(d·m₀) (Jewell 2004). NNT = 1/|RD|, computed from the counts so that an exact whole number is not lost to rounding.</p></AtLevel>
      <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={[...(cc ? ['woolf'] : ['katz', 'koopman', 'newcombe']), 'fagerland', 'rothmanME', ...(nnt ? ['laupacis', 'altmanNNT'] : []), ...(harmful ? ['miettinen74', 'jewell'] : []), ...(pe !== null ? ['levin', 'rockhill'] : []), 'cochranRule']} /></div>
    </section>
  );
}

/* ----------------------------------------------------------- person-time --- */

function PersonTimePanel({ ds }) {
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? (ds ? 'data' : 'typed');
  const [v, setV] = useState({ a: '41', t1: '28010', c: '15', t0: '19017' });
  const [unit, setUnit] = useState('person-years'), [per, setPer] = useState('1000');
  const [expName, setExpName] = useState(''), [outName, setOutName] = useState('');
  const [e, setE] = useState(null), [eL, setEL] = useState(null), [o, setO] = useState(null), [oL, setOL] = useState(null), [tc, setTc] = useState(null);
  let inp = null, err = null, dropped = 0, g1 = 'exposed', g0 = 'unexposed', outcome = outName.trim() || 'events', exposure = expName.trim() || 'the exposure', spec = null;
  if (mode === 'data' && ds) {
    const ce = col(ds, e), co = col(ds, o), ct = col(ds, tc);
    if (ce && co && ct) {
      if (e === o) err = 'Pick two different columns.';
      else {
        const el = eL ?? guessLevel(ce.levels), ol = oL ?? guessLevel(co.levels);
        let a = 0, t1 = 0, c = 0, t0 = 0, neg = 0;
        for (let i = 0; i < ds.n; i++) {
          const x = ce.raw[i], y = co.raw[i], tv = ct.numbers[i];
          if (isMissing(x) || isMissing(y) || tv === null || !Number.isFinite(tv)) { dropped++; continue; }
          if (tv < 0) { neg++; continue; }
          if (x === el) { t1 += tv; if (y === ol) a++; } else { t0 += tv; if (y === ol) c++; }
        }
        if (neg) err = `${neg} row${neg === 1 ? ' has' : 's have'} negative follow-up time; correct ${neg === 1 ? 'it' : 'them'} first.`;
        inp = { a, t1, c, t0 };
        g1 = `${pretty(e)} "${el}"`; g0 = `${pretty(e)} "${other(ce.levels, el)}"`; exposure = g1; outcome = `${pretty(o)} "${ol}"`;
        spec = { kind: 'eptime', exposure: e, exposed: el, outcome: o, event: ol, time: tc, numericE: ce.numeric, numericO: co.numeric };
      }
    }
  } else if (mode === 'typed') {
    const a = parseNumber(v.a), t1 = parseNumber(v.t1), c = parseNumber(v.c), t0 = parseNumber(v.t0);
    if (!isInt(a) || !isInt(c)) err = 'Enter whole numbers of events.';
    else if (!(t1 > 0) || !(t0 > 0)) err = 'Person-time must be positive in both groups.';
    else inp = { a, t1, c, t0 };
  }
  let res = null;
  if (inp && !err) {
    if (!(inp.t1 > 0) || !(inp.t0 > 0)) err = 'Both groups need some person-time.';
    else if (inp.a + inp.c === 0) err = 'There are no events, so the rates cannot be compared.';
    else { res = personTime(inp.a, inp.t1, inp.c, inp.t0); if (!spec) spec = { kind: 'eptime', ...inp }; }
  }
  const m = Number(per);
  const r = (x) => s3(x * m);
  const rc = (ci) => `${r(ci[0])} to ${r(ci[1])}`;
  const set = (k) => (val) => setV({ ...v, [k]: val });
  return (
    <>
      <section class="panel stack" aria-labelledby="pt-h">
        <h2 id="pt-h">Two groups followed over time: rates</h2>
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'Events and person-time' }]} />
        {mode === 'data' ? (ds ? (
          <div class="fields">
            <LevelPick ds={ds} label="Exposure column" value={e} onChange={setE} level={eL} onLevel={setEL} levelLabel="Exposed group" />
            <LevelPick ds={ds} label="Event column" value={o} onChange={setO} level={oL} onLevel={setOL} levelLabel="Value for an event" exclude={[e].filter(Boolean)} />
            <ColumnSelect ds={ds} label="Follow-up time column" value={tc} onChange={setTc} kind="numeric" exclude={[e, o].filter(Boolean)} />
          </div>
        ) : needData) : (
          <>
            <div class="fields">
              <TextField label="Exposure (for the sentence)" value={expName} onInput={setExpName} placeholder="diabetes" />
              <TextField label="Events (for the sentence)" value={outName} onInput={setOutName} placeholder="deaths" />
            </div>
            <div class="fields four">
              <NumberField label="Events, exposed" value={v.a} onInput={set('a')} inputMode="numeric" />
              <NumberField label="Person-time, exposed" value={v.t1} onInput={set('t1')} />
              <NumberField label="Events, unexposed" value={v.c} onInput={set('c')} inputMode="numeric" />
              <NumberField label="Person-time, unexposed" value={v.t0} onInput={set('t0')} />
            </div>
            <p class="small">Illustrative numbers: replace them with yours.</p>
          </>
        )}
        <div class="fields">
          <SelectField label="Unit of person-time" value={unit} onChange={setUnit} options={UNITS} />
          <SelectField label="Express rates" value={per} onChange={setPer} options={PER_RATE} />
        </div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="ptr-h">
          <div><h2 id="ptr-h" style="margin-bottom:6px">Rate ratio = {ratio(res.irr.est)}</h2>
            <p class="verdict-line mono">95% CI {rCI(res.irr.exact)} (exact, conditional on {count(res.m)} events); exact {P(res.tests.pExact)}</p></div>
          <Stats items={[[`Rate, ${g1}`, `${r(res.ir1.rate)} per ${count(m)} ${unit} (${rc(res.ir1.ci)})`], [`Rate, ${g0}`, `${r(res.ir0.rate)} per ${count(m)} ${unit} (${rc(res.ir0.ci)})`],
            ['Rate difference', `${r(res.ird.est)} per ${count(m)} ${unit} (${rc(res.ird.wald)})`], dropped ? ['Left out (missing)', count(dropped)] : null]} />
          <DataTable wrap caption={`Events, person-time (${unit}) and rates per ${count(m)}`} columns={['', 'Events', 'Person-time', 'Rate']}
            rows={[[cap(g1), count(res.a), ptx(res.t1), r(res.ir1.rate)], [cap(g0), count(res.c), ptx(res.t0), r(res.ir0.rate)], ['Total', count(res.m), ptx(res.T), r(res.irt.rate)]]} numeric={[1, 2, 3]} />
          <DataTable wrap caption="Measures" columns={MCOLS}
            rows={[mrow('Rate ratio', 'exact, conditional on the events', ratio(res.irr.est), rCI(res.irr.exact), true),
              mrow('Rate ratio', 'mid-p exact', ratio(res.irr.est), rCI(res.irr.midp)), mrow('Rate ratio', 'Wald, log scale', ratio(res.irr.est), rCI(res.irr.wald)),
              mrow(`Rate difference per ${count(m)} ${unit}`, 'Wald', r(res.ird.est), rc(res.ird.wald)),
              mrow(res.afe.kind === 'attributable' ? 'Attributable fraction among the exposed' : 'Prevented fraction among the exposed', 'from the exact limits', pc(res.afe.est), pcCI(res.afe.ci, 1)),
              mrow(res.paf.kind === 'attributable' ? 'Attributable fraction in the population studied' : 'Prevented fraction in the population studied', 'exact, from the split of the events', pc(res.paf.est), pcCI(res.paf.ci, 1))]}
            numeric={[1]} />
          <DataTable wrap caption="Tests" columns={['Test', 'p']} rows={[[{ text: 'Exact, conditional on the events', cls: 'hl' }, { text: pValue(res.tests.pExact).exact, cls: 'hl' }], ['Mid-p exact', pValue(res.tests.pMidp).exact], [`Score test, z = ${fixed(res.tests.z, 2)}`, pValue(res.tests.pScore).exact]]} numeric={[1]} />
          <Checks items={[
            res.a === 0 || res.c === 0 ? { ok: false, text: 'A group has no events: the rate ratio is 0 or infinite, and only the exact limits are usable.' } : null,
            { text: 'Rates assume a roughly constant rate over follow-up within each group. If risk changes with time, or people are followed for very different lengths, compare survival curves (Kaplan-Meier, Cox) as well.' },
            { text: "The population fraction applies to the person-time studied; for another population, enter that population's exposure prevalence under Impact." },
            { text: 'These are crude measures; adjust for confounders by stratification or Poisson regression.' },
          ]} />
          <Report text={`There were ${count(res.a)} ${outcome} in ${ptx(res.t1)} ${unit} in the ${g1} group (${r(res.ir1.rate)} per ${count(m)} ${unit}) and ${count(res.c)} in ${ptx(res.t0)} ${unit} in the ${g0} group (${r(res.ir0.rate)} per ${count(m)}): rate ratio ${ratio(res.irr.est)} (95% CI ${rCI(res.irr.exact)}, exact), rate difference ${r(res.ird.est)} per ${count(m)} ${unit} (95% CI ${rc(res.ird.wald)}); exact ${P(res.tests.pExact)}.${res.afe.kind === 'attributable' ? ` If the association is causal, ${pc(res.afe.est)} of the ${outcome} among the exposed (95% CI ${pcCI(res.afe.ci, 1)}) can be attributed to ${exposure}.` : ` If the association is causal, ${exposure} prevented ${pc(res.afe.est)} of the ${outcome} expected among the exposed (95% CI ${pcCI(res.afe.ci, 1)}).`}`} />
          {spec ? <CodeExport spec={spec} /> : null}
          <AtLevel min="advanced"><p class="small">Given the total number of events m, the events among the exposed follow a binomial distribution with p = θT₁/(θT₁ + T₀), where θ is the rate ratio; the exact limits for p from Clopper-Pearson give the limits for θ, as R's poisson.test does. The same split gives the exact interval for the population fraction, since 1 − PAF = (1 − a/m)·T/T₀.</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['garwood', 'clopper', 'rothmanME', 'miettinen74', 'kirkwood']} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ----------------------------------------------------------- matched pairs --- */

function MatchedPanel({ ds }) {
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? 'typed';
  const [v, setV] = useState({ e: '20', f: '30', g: '10', h: '40' });
  const [expName, setExpName] = useState('');
  const [ca, setCa] = useState(null), [co, setCo] = useState(null), [lv, setLv] = useState(null);
  let inp = null, err = null, dropped = 0, exposure = expName.trim() ? ` to ${expName.trim()}` : '', spec = null;
  if (mode === 'data' && ds) {
    const x = col(ds, ca), y = col(ds, co);
    if (x && y) {
      if (ca === co) err = 'Pick two different columns.';
      else {
        const levels = [...new Set([...x.levels, ...y.levels])];
        if (levels.length !== 2) err = `The two columns should share the same two values; here there are ${levels.length} (${levels.slice(0, 5).join(', ')}).`;
        else {
          const l = lv ?? guessLevel(levels);
          let e = 0, f = 0, g = 0, h = 0;
          for (let i = 0; i < ds.n; i++) {
            const p = x.raw[i], q = y.raw[i];
            if (isMissing(p) || isMissing(q)) { dropped++; continue; }
            const pe = p === l, qe = q === l;
            if (pe && qe) e++; else if (pe) f++; else if (qe) g++; else h++;
          }
          inp = { e, f, g, h };
          exposure = ` ("${l}")`;
          spec = { kind: 'epmatch', ...inp };
        }
      }
    }
  } else if (mode === 'typed') {
    const vals = ['e', 'f', 'g', 'h'].map((k) => parseNumber(v[k]));
    if (!vals.every(isInt)) err = 'Enter whole numbers of pairs in all four cells.';
    else { const [e, f, g, h] = vals; inp = { e, f, g, h }; spec = { kind: 'epmatch', ...inp }; }
  }
  let res = null;
  if (inp && !err) {
    if (inp.f + inp.g === 0) err = 'There are no discordant pairs (pairs where only the case or only the control was exposed), so the matched odds ratio cannot be estimated.';
    else res = matchedPairs(inp.e, inp.f, inp.g, inp.h);
  }
  const set = (k) => (val) => setV({ ...v, [k]: val });
  const x = ds ? col(ds, ca) : null, y = ds ? col(ds, co) : null;
  const levels = x && y ? [...new Set([...x.levels, ...y.levels])] : [];
  return (
    <>
      <section class="panel stack" aria-labelledby="mp-h">
        <h2 id="mp-h">Matched case-control pairs (1:1)</h2>
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data (one row per pair)', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'A table of pairs' }]} />
        {mode === 'data' ? (ds ? (
          <div class="fields">
            <ColumnSelect ds={ds} label="Case's exposure" value={ca} onChange={(val) => { setCa(val); setLv(null); }} kind="group" maxLevels={2} />
            <ColumnSelect ds={ds} label="Matched control's exposure" value={co} onChange={(val) => { setCo(val); setLv(null); }} kind="group" maxLevels={2} exclude={[ca].filter(Boolean)} />
            {levels.length === 2 ? <SelectField label="Value for exposed" value={lv ?? guessLevel(levels)} onChange={setLv} options={levels.map((l) => ({ value: l, label: l }))} /> : null}
          </div>
        ) : needData) : (
          <>
            <TextField label="Exposure (for the sentence)" value={expName} onInput={setExpName} placeholder="indoor air pollution" />
            <div class="tablewrap">
              <table class="table compact entry">
                <thead><tr><th scope="col">Case \ control</th><th scope="col">Control exposed</th><th scope="col">Control unexposed</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Case exposed</th><td><input inputMode="numeric" aria-label="Pairs: case exposed, control exposed" value={v.e} onInput={(ev) => set('e')(ev.currentTarget.value)} /></td><td><input inputMode="numeric" aria-label="Pairs: case exposed, control unexposed" value={v.f} onInput={(ev) => set('f')(ev.currentTarget.value)} /></td></tr>
                  <tr><th scope="row">Case unexposed</th><td><input inputMode="numeric" aria-label="Pairs: case unexposed, control exposed" value={v.g} onInput={(ev) => set('g')(ev.currentTarget.value)} /></td><td><input inputMode="numeric" aria-label="Pairs: case unexposed, control unexposed" value={v.h} onInput={(ev) => set('h')(ev.currentTarget.value)} /></td></tr>
                </tbody>
              </table>
            </div>
            <p class="small">Each cell counts pairs, not people. Illustrative numbers: replace them with yours.</p>
          </>
        )}
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="mpr-h">
          <div><h2 id="mpr-h" style="margin-bottom:6px">Matched odds ratio = {ratio(res.or.est)}</h2>
            <p class="verdict-line mono">95% CI {rCI(res.or.exact)} (exact, from {count(res.disc)} discordant pairs); McNemar {res.tests.exact ? `exact ${P(res.tests.pExact)}` : `χ² = ${fixed(res.tests.chi2, 2)}, ${P(res.tests.p)}`}</p></div>
          <Stats items={[['Pairs', count(res.n)], ['Case exposed only', count(res.f)], ['Control exposed only', count(res.g)], ['Cases exposed', pc(res.pCases.p)], ['Controls exposed', pc(res.pControls.p)], dropped ? ['Left out (missing)', count(dropped)] : null]} />
          <DataTable wrap caption="Measures" columns={MCOLS}
            rows={[mrow('Matched odds ratio', 'exact, from the discordant pairs', ratio(res.or.est), rCI(res.or.exact), true),
              mrow('Matched odds ratio', 'mid-p exact', ratio(res.or.est), rCI(res.or.midp)), mrow('Matched odds ratio', 'Wald, log scale', ratio(res.or.est), rCI(res.or.wald)),
              mrow(res.afe.kind === 'attributable' ? 'Attributable fraction among the exposed' : 'Prevented fraction among the exposed', 'from the exact limits', pc(res.afe.est), pcCI(res.afe.ci, 1))]}
            numeric={[1]} />
          <DataTable wrap caption="McNemar's test" columns={['Test', 'p']}
            rows={[[{ text: 'Exact (binomial)', cls: res.tests.exact ? 'hl' : '' }, { text: pValue(res.tests.pExact).exact, cls: res.tests.exact ? 'hl' : '' }],
              [{ text: `χ² = ${fixed(res.tests.chi2, 3)}, continuity corrected`, cls: res.tests.exact ? '' : 'hl' }, { text: pValue(res.tests.p).exact, cls: res.tests.exact ? '' : 'hl' }],
              ['Mid-p exact', pValue(res.tests.pMidp).exact]]} numeric={[1]} />
          <Checks items={[
            { text: 'Only discordant pairs carry information on the odds ratio; pairs where both or neither were exposed do not. The unmatched odds ratio from the same data would be biased towards 1.' },
            res.tests.exact ? { text: "Fewer than 25 discordant pairs: McNemar's exact test is reported." } : null,
            { text: 'With more than one control per case, or to adjust for further variables, use conditional logistic regression.' },
          ]} />
          <Report text={`Of ${count(res.n)} matched pairs, the case alone was exposed${exposure} in ${count(res.f)} and the control alone in ${count(res.g)}: matched odds ratio ${ratio(res.or.est)} (95% CI ${rCI(res.or.exact)}, exact); McNemar's ${res.tests.exact ? `exact test ${P(res.tests.pExact)}` : `χ² = ${fixed(res.tests.chi2, 2)}, ${P(res.tests.p)}`}.`} />
          {spec ? <CodeExport spec={spec} /> : null}
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['mcnemar', 'clopper', 'rothmanME', 'kirkwood']} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------- population impact --- */

function ImpactPanel() {
  const [measure, setMeasure] = useState('rr');
  const [est, setEst] = useState('2.0'), [lo, setLo] = useState('1.5'), [hi, setHi] = useState('2.7');
  const [adjusted, setAdjusted] = useState('crude');
  const [basis, setBasis] = useState('pe');
  const [prop, setProp] = useState('30');
  const [src, setSrc] = useState('');
  const [exposure, setExposure] = useState(''), [outcome, setOutcome] = useState('');
  const [casesText, setCases] = useState('');
  const [baseText, setBase] = useState('');
  const r = parseNumber(est), l = parseNumber(lo), u = parseNumber(hi), q = parseNumber(prop) / 100;
  const hasCI = lo.trim() !== '' || hi.trim() !== '';
  let err = null;
  if (!(r > 0)) err = 'Enter the ratio as a positive number.';
  else if (hasCI && !(l > 0 && u > 0 && l <= r && r <= u)) err = 'The CI limits must be positive and lie either side of the estimate.';
  else if (!(q >= 0 && q <= 1)) err = 'Enter the proportion as a percentage between 0 and 100.';
  const cases = parseNumber(casesText), base = parseNumber(baseText) / 100;
  const ci = hasCI && !err ? [l, u] : null;
  const res = err ? null : populationFraction({ est: r, ci, ...(basis === 'pe' ? { pe: q } : { pc: q }) });
  const name = { rr: 'risk ratio', or: 'odds ratio', hr: 'hazard ratio' }[measure];
  const ex = exposure.trim() || 'the exposure', ou = outcome.trim() || 'the outcome';
  const source = src.trim() || '[INSERT: source and year]';
  let nntRes = null;
  if (res && baseText.trim() && base > 0 && base < 1) {
    const rd = impliedRiskDifference(measure === 'or' ? 'or' : 'rr', r, base);
    const rdCi = ci ? [impliedRiskDifference(measure === 'or' ? 'or' : 'rr', l, base), impliedRiskDifference(measure === 'or' ? 'or' : 'rr', u, base)] : null;
    nntRes = numberNeeded(rd, rdCi, null);
  }
  const nw = nntRes ? nntWords(nntRes, true) : null;
  // Attributable cases are PAF x observed cases. Prevented cases are those that would have occurred without
  // the exposure: observed x PF / (1 - PF).
  const toCases = (f) => (res.kind === 'attributable' ? f * cases : (cases * f) / (1 - f));
  const attrib = res && Number.isFinite(cases) && cases > 0 ? { est: toCases(res.est), ci: res.ci ? res.ci.map(toCases) : null } : null;
  return (
    <>
      <section class="panel stack" aria-labelledby="im-h">
        <h2 id="im-h">Impact on a population, from a published estimate</h2>
        <p class="small">For a ratio from a study or a meta-analysis, applied to a population you know, such as your district.</p>
        <Seg label="The estimate is a" value={measure} onChange={setMeasure} options={[{ value: 'rr', label: 'Risk or rate ratio' }, { value: 'or', label: 'Odds ratio' }, { value: 'hr', label: 'Hazard ratio' }]} />
        <div class="fields">
          <NumberField label={cap(name)} value={est} onInput={setEst} />
          <NumberField label="95% CI, lower (optional)" value={lo} onInput={setLo} />
          <NumberField label="95% CI, upper (optional)" value={hi} onInput={setHi} />
        </div>
        <Seg label="The ratio is" value={adjusted} onChange={setAdjusted} options={[{ value: 'crude', label: 'Crude' }, { value: 'adjusted', label: 'Adjusted for confounders' }]} />
        <Seg label="What you know about exposure" value={basis} onChange={setBasis} options={[{ value: 'pe', label: 'Share of the population exposed (Levin)' }, { value: 'pc', label: 'Share of cases exposed (Miettinen)' }]} />
        <div class="fields">
          <NumberField label={basis === 'pe' ? 'Population exposed, %' : 'Cases exposed, %'} value={prop} onInput={setProp} />
          <TextField label="Source of that figure, with its year" value={src} onInput={setSrc} placeholder="NFHS-5 (2019-21), Odisha" />
        </div>
        <div class="fields">
          <TextField label="Exposure (for the sentence)" value={exposure} onInput={setExposure} placeholder="tobacco use" />
          <TextField label="Outcome (for the sentence)" value={outcome} onInput={setOutcome} placeholder="tuberculosis" />
        </div>
        <div class="fields">
          <NumberField label="Cases in the population (optional)" value={casesText} onInput={setCases} hint="To turn the fraction into a number of cases" />
          <NumberField label="Risk without the exposure, % (optional)" value={baseText} onInput={setBase} hint="Baseline or control-arm risk, for the number needed" />
        </div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="imr-h">
          <div><h2 id="imr-h" style="margin-bottom:6px">{res.kind === 'attributable' ? 'Population attributable fraction' : 'Population prevented fraction'} = {pc(res.est)}</h2>
            <p class="verdict-line mono">{res.ci ? `95% CI ${pcCI(res.ci, 1)} (the ratio's limits substituted)` : 'Enter the CI of the ratio for an interval'}</p></div>
          <Stats items={[['Formula', basis === 'pe' ? "Levin: p(r − 1) / (1 + p(r − 1))" : "Miettinen: pc(r − 1) / r"], [cap(name), `${ratio(r)}${ci ? ` (${rCI(ci)})` : ''}`], [basis === 'pe' ? 'Population exposed' : 'Cases exposed', pc(q)],
            attrib ? [res.kind === 'attributable' ? 'Cases attributable' : 'Cases prevented (beyond those observed)', `${count(attrib.est)}${attrib.ci ? ` (${count(attrib.ci[0])} to ${count(attrib.ci[1])})` : ''}`] : null,
            nntRes && nw.kind ? [nw.kind === 'NNT' ? 'Number needed to treat (or expose) to prevent one case' : 'Number needed to be exposed for one more case', `${nn(nntRes.value)} (round up: ${count(nntRes.whole)}); 95% CI ${nw.ci}`] : null]} />
          <Checks items={[
            basis === 'pe' && adjusted === 'adjusted' ? { ok: false, text: "Levin's formula with an adjusted ratio is biased when the exposure is confounded: it under- or overestimates the fraction (Darrow and Steenland 2011). With an adjusted ratio, use the share of cases exposed (Miettinen's formula) if you have it." } : null,
            measure === 'or' ? { text: 'An odds ratio stands in for the risk ratio here; that is reasonable only when the outcome is rare (under about 10%).' } : null,
            measure === 'hr' ? { text: 'A hazard ratio stands in for the risk ratio; the two are close when the outcome is uncommon over the follow-up.' } : null,
            res.ci ? { text: `The interval treats the ${basis === 'pe' ? 'population' : 'case'} exposure figure as exact. If it comes from a survey, the true interval is wider.` } : null,
            { text: 'A population fraction assumes the association is causal and unbiased. Fractions for several exposures can add up to more than 100%, because causes act together (Rockhill and colleagues 1998).' },
            nntRes && measure === 'or' ? { text: 'The number needed comes from the odds ratio and the baseline risk (risk with exposure = OR·p₀ / (1 − p₀ + OR·p₀)).' } : null,
          ]} />
          <Report text={`Assuming a causal effect, ${res.kind === 'attributable' ? `${pc(res.est)}${res.ci ? ` (95% CI ${pcCI(res.ci, 1)})` : ''} of ${ou} in the population can be attributed to ${ex}${attrib ? `, about ${count(attrib.est)} of ${count(cases)} cases` : ''}` : `${ex} prevented ${pc(res.est)}${res.ci ? ` (95% CI ${pcCI(res.ci, 1)})` : ''} of ${ou} that would otherwise have occurred in the population${attrib ? `, about ${count(attrib.est)} cases beyond the ${count(cases)} observed` : ''}`}; ${basis === 'pe' ? "Levin's" : "Miettinen's"} formula with a ${adjusted === 'adjusted' ? 'confounder-adjusted ' : ''}${name} of ${ratio(r)}${ci ? ` (95% CI ${rCI(ci)})` : ''} and ${pc(q)} of ${basis === 'pe' ? 'the population' : 'cases'} exposed (${source}).`} />
          <AtLevel min="advanced"><p class="small">Levin: PAF = p(r − 1)/(1 + p(r − 1)), with p the proportion of the population exposed. Miettinen: PAF = pc(r − 1)/r, with pc the proportion of cases exposed; it stays valid with a confounder-adjusted ratio. For a protective exposure the prevented fraction is p(1 − r). The interval substitutes the ratio's limits.</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['levin', 'miettinen74', 'walter76', 'rockhill', 'darrow', 'greenlandRobins88', ...(nntRes ? ['cookSackett', 'benderNNE'] : [])]} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- page --- */

export default function MeasuresTool() {
  const ds = useDataset();
  const [tab, setTab] = useState('two');
  const Body = { freq: FrequencyPanel, two: TwoByTwoPanel, pt: PersonTimePanel, matched: MatchedPanel, impact: ImpactPanel }[tab];
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} title="Frequency, Association and Impact"
        lede="Prevalence, risks and rates with their CIs; the risk, odds, prevalence or rate ratio your design supports; attributable and prevented fractions, and the number needed to treat." />
      <div class="stack">
        <DataPanel examples={[{ label: 'Load example antenatal data', csv: exampleCsv, source: 'example' }, { label: 'Load example TB cohort', csv: exampleTbCsv, source: 'example-tb' }]} />
        <Disclose title="Which measure fits my study?">
          <ul>
            <li><strong>Cohort study or trial</strong> (groups defined by exposure, followed for the outcome): risk ratio, risk difference, number needed to treat, attributable or prevented fractions.</li>
            <li><strong>Cohort with person-time</strong> (people followed for different lengths of time): rate ratio and rate difference.</li>
            <li><strong>Case-control study</strong> (people chosen by outcome): odds ratio only; fractions from the odds ratio and the cases' exposure.</li>
            <li><strong>Matched case-control pairs</strong>: the matched odds ratio from the discordant pairs.</li>
            <li><strong>Cross-sectional survey</strong> (exposure and outcome measured at one time): prevalence, the prevalence ratio and the prevalence difference.</li>
          </ul>
          <p>Terms differ between textbooks: "attributable risk" means the risk difference in some and the attributable fraction among the exposed (AR%) in others. The tables here name the measure and give its formula, so state which one you report.</p>
        </Disclose>
        <div><Seg wide value={tab} onChange={setTab} options={[
          { value: 'freq', label: 'Proportion or rate' }, { value: 'two', label: 'Two groups (2 × 2)' }, { value: 'pt', label: 'Person-time' },
          { value: 'matched', label: 'Matched pairs' }, { value: 'impact', label: 'Population impact' },
        ]} /></div>
        <Body ds={ds} />
      </div>
    </div>
  );
}
