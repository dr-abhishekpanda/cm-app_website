/* Tool: vaccines and screening. Vaccine efficacy and effectiveness by design (cohort or outbreak,
 * person-time, case-control, test-negative, matched pairs, the screening method, a published ratio),
 * and what a screening programme finds with one test, or two in series or in parallel. */
import { useState } from 'preact/hooks';
import { vaccineEffectiveness, screeningMethod, fromPublished } from '../../engine/vaccine.js';
import { screeningYield, combineTests, covarianceRange } from '../../engine/diag.js';
import { isMissing } from '../../engine/data.js';
import { fixed, count, ratio, parseNumber } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, NumberField, TextField, SelectField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col, exampleMeaslesCsv, exampleCsv } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs, Disclose } from '../../ui/results.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';
import { pick } from '../presets.js';
import { pretty, isInt, pc, rCI, mrow, MCOLS, needData, Checks, BinaryFrom, defaultRule, readRule, readBinary } from './epishared.jsx';

/** A VE percentage, with minus infinity spelt out. */
const vp = (v) => (v === -Infinity ? '−∞' : pc(v));
const vpCI = (ci) => (ci ? `${vp(ci[0])} to ${vp(ci[1])}` : '—');

/* --------------------------------------------------- vaccination column --- */

const UNVACC = /^(0|no|none|nil|never|unvaccinated|not vaccinated|zero dose|zero)\b/i;
function defaultGroups(levels) {
  let unvacc = levels.filter((l) => UNVACC.test(String(l).trim()));
  if (!unvacc.length) unvacc = [levels[0]];
  return { vacc: levels.filter((l) => !unvacc.includes(l)), unvacc };
}

/** The vaccination column: tick the values that count as vaccinated and as unvaccinated; others are left out. */
function GroupsFrom({ ds, value, onChange, groups, onGroups, exclude = [] }) {
  const c = col(ds, value);
  const g = c ? groups ?? defaultGroups(c.levels) : null;
  const toggle = (k, l) => {
    const o = k === 'vacc' ? 'unvacc' : 'vacc';
    const on = g[k].includes(l);
    onGroups({ [k]: on ? g[k].filter((x) => x !== l) : [...g[k], l], [o]: g[o].filter((x) => x !== l) });
  };
  return (
    <div class="stack" style="gap:10px">
      <ColumnSelect ds={ds} label="Vaccination column" value={value} onChange={(v) => { onChange(v); onGroups(null); }} kind="group" maxLevels={12} exclude={exclude} hint="Vaccinated or not, or the number of doses" />
      {c ? (
        <>
          <div><span class="label">Vaccinated: the values that count</span>
            <div class="varpick" role="group" aria-label="Vaccinated values">{c.levels.map((l) => <label><input type="checkbox" checked={g.vacc.includes(l)} onChange={() => toggle('vacc', l)} />{l}</label>)}</div></div>
          <div><span class="label">Unvaccinated, the comparison group</span>
            <div class="varpick" role="group" aria-label="Unvaccinated values">{c.levels.map((l) => <label><input type="checkbox" checked={g.unvacc.includes(l)} onChange={() => toggle('unvacc', l)} />{l}</label>)}</div></div>
          <p class="small">Values in neither group are left out, so two doses can be compared with none, leaving out one.</p>
        </>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------- vaccine effectiveness --- */

const VE_DESIGNS = [
  { value: 'cohort', label: 'Cohort or outbreak' }, { value: 'pt', label: 'Person-time' }, { value: 'case-control', label: 'Case-control' },
  { value: 'tnd', label: 'Test-negative' }, { value: 'matched', label: 'Matched pairs' }, { value: 'screening', label: 'Screening method' }, { value: 'published', label: 'Published ratio' },
];
const DATA_OK = new Set(['cohort', 'pt', 'case-control', 'tnd', 'screening']);
const HEADS = { cohort: ['Ill (cases)', 'Not ill'], 'case-control': ['Cases', 'Controls'], tnd: ['Test positive', 'Test negative'] };
const OUTCOME = { cohort: 'Case', pt: 'Case', 'case-control': 'Case (not control)', tnd: 'Test positive', screening: 'Case' };
const EX = {
  cohort: [['9', '342'], ['24', '45']], 'case-control': [['40', '210'], ['95', '155']], tnd: [['120', '480'], ['160', '440']],
  pt: { a: '10', t1: '5000', c: '40', t0: '4000' }, matched: { e: '20', f: '8', g: '25', h: '47' },
  screening: { x: '18', n: '60' }, published: { r: '0.25', lo: '0.12', hi: '0.52' },
};
const RATIO_KINDS = [{ value: 'odds ratio', label: 'Odds ratio' }, { value: 'risk ratio', label: 'Risk ratio' }, { value: 'rate ratio', label: 'Rate ratio' }, { value: 'hazard ratio', label: 'Hazard ratio' }];
const METHOD = { wald: { 'risk ratio': 'Katz', 'odds ratio': 'Woolf', 'rate ratio': 'Wald', 'matched odds ratio': 'Wald' }, score: "Koopman's score", exact: 'exact', midp: 'mid-p', logit: "Farrington's logit" };
const methodName = (k, name) => (typeof METHOD[k] === 'object' ? METHOD[k][name] : METHOD[k]);

function VePanel({ ds, preset }) {
  const [design, setDesign] = useState(() => pick(preset, 'vaccines', 'design', 'cohort'));
  const [modeSel, setMode] = useState(null);
  const canData = DATA_OK.has(design);
  const mode = canData ? modeSel ?? (ds ? 'data' : 'typed') : 'typed';
  const [cells, setCells] = useState(EX);
  const [vc, setVc] = useState(null), [groups, setGroups] = useState(null), [oc, setOc] = useState(null), [oRule, setORule] = useState(null), [tc, setTc] = useState(null);
  const [covText, setCov] = useState(''), [covSrc, setCovSrc] = useState('');
  const [rKind, setRKind] = useState('odds ratio');
  const [names, setNames] = useState({ vaccine: '', disease: '' });
  const setCell = (key, path, v) => setCells({ ...cells, [key]: Array.isArray(cells[key]) ? cells[key].map((r, i) => (i === path[0] ? r.map((x, j) => (j === path[1] ? v : x)) : r)) : { ...cells[key], [path]: v } });

  let input = null, err = null, skipped = 0, spec = null, coverageFrom = null;
  const covTyped = parseNumber(covText), covOk = Number.isFinite(covTyped) && covTyped > 0 && covTyped < 100;
  if (mode === 'data' && canData && ds) {
    const cv = col(ds, vc), co = col(ds, oc), ct = design === 'pt' ? col(ds, tc) : null;
    if (cv && co && (design !== 'pt' || ct)) {
      const g = groups ?? defaultGroups(cv.levels), b = readRule(oRule ?? defaultRule(co));
      if (vc === oc) err = 'Pick two different columns: vaccination and the outcome.';
      else if (!g.vacc.length || !g.unvacc.length) err = 'Tick at least one value for the vaccinated and one for the unvaccinated.';
      else if (b.error) err = b.error;
      else {
        const y = readBinary(co, b.rule), grp = cv.raw.map((raw) => (isMissing(raw) ? null : g.vacc.includes(raw) ? 1 : g.unvacc.includes(raw) ? 0 : null));
        const tt = ct ? ct.numbers : null;
        let vcase = 0, vnon = 0, ucase = 0, unon = 0, t1 = 0, t0 = 0, vAll = 0, uAll = 0;
        for (let i = 0; i < y.length; i++) {
          if (grp[i] !== null) { if (grp[i]) vAll++; else uAll++; }
          if (grp[i] === null || y[i] === null || (tt && (tt[i] === null || !Number.isFinite(tt[i]) || tt[i] < 0))) { skipped++; continue; }
          if (grp[i]) { if (y[i]) vcase++; else vnon++; if (tt) t1 += tt[i]; } else { if (y[i]) ucase++; else unon++; if (tt) t0 += tt[i]; }
        }
        spec = { kind: 've', design, vacc: vc, groups: g, numericV: cv.numeric, outcome: oc, outcomeRule: b.rule, numericO: co.numeric, time: design === 'pt' ? tc : null };
        if (design === 'pt') input = { a: vcase, t1, c: ucase, t0 };
        else if (design === 'screening') {
          coverageFrom = covOk ? 'typed' : 'data';
          input = { x: vcase, n: vcase + ucase, cov: covOk ? covTyped / 100 : vAll / (vAll + uAll) };
          spec.coverage = input.cov; spec.coverageFrom = covOk ? 'typed' : 'data';
        } else input = { table: [[vcase, vnon], [ucase, unon]] };
      }
    }
  } else if (mode === 'typed') {
    const c = cells[design];
    if (design === 'published') {
      const [r, lo, hi] = [c.r, c.lo, c.hi].map(parseNumber);
      if (![r, lo, hi].every((v) => v > 0 && Number.isFinite(v))) err = 'Enter the ratio and its 95% limits as positive numbers.';
      else if (!(lo <= r && r <= hi)) err = 'The ratio must lie between its lower and upper limits.';
      else input = { r, lo, hi };
    } else if (design === 'pt') {
      const v = ['a', 't1', 'c', 't0'].map((k) => parseNumber(c[k]));
      if (!isInt(v[0]) || !isInt(v[2])) err = 'Enter the cases in each group as whole numbers.';
      else if (!(v[1] > 0 && v[3] > 0)) err = 'Enter the person-time in each group as positive numbers.';
      else { input = { a: v[0], t1: v[1], c: v[2], t0: v[3] }; spec = { kind: 've', design, ...input }; }
    } else if (design === 'matched') {
      const v = ['e', 'f', 'g', 'h'].map((k) => parseNumber(c[k]));
      if (!v.every(isInt)) err = 'Enter the four pair counts as whole numbers (0 is allowed).';
      else { input = { e: v[0], f: v[1], g: v[2], h: v[3] }; spec = { kind: 've', design, ...input }; }
    } else if (design === 'screening') {
      const [x, n] = [c.x, c.n].map(parseNumber);
      if (!isInt(x) || !isInt(n) || n < 1 || x > n) err = 'Enter the vaccinated cases and all cases as whole numbers, vaccinated cases no more than all cases.';
      else if (!covOk) err = 'Enter the vaccination coverage in the population the cases came from, as a percentage above 0 and below 100.';
      else { input = { x, n, cov: covTyped / 100 }; spec = { kind: 've', design, x, n, coverage: covTyped / 100 }; }
    } else {
      const v = c.map((r) => r.map(parseNumber));
      if (!v.every((r) => r.every(isInt))) err = 'Enter whole-number counts in all four cells (0 is allowed).';
      else { input = { table: v }; spec = { kind: 've', design, table: v }; }
    }
  }
  let res = null;
  if (input && !err) {
    if (design === 'published') res = { kind: 'published', ...fromPublished(input.r, input.lo, input.hi) };
    else if (design === 'screening') {
      if (input.n < 1) err = 'No cases with a known vaccination status.';
      else res = { kind: 'screening', ...screeningMethod(input.x, input.n, input.cov) };
    } else {
      const o = vaccineEffectiveness(input, { design });
      if (!o.ratio) err = design === 'matched' ? 'No discordant pairs: matched pairs say nothing about VE unless case and control differ in vaccination.' : 'Each group needs people in it, and some cases, for a ratio to exist.';
      else res = { kind: 'ratio', ...o };
    }
  }
  const setName = (k) => (v) => setNames({ ...names, [k]: v });
  const c = cells[design];
  return (
    <>
      <section class="panel stack" aria-labelledby="vp-h">
        <h2 id="vp-h">Vaccine efficacy and effectiveness</h2>
        <SelectField label="Study design" value={design} onChange={setDesign} options={VE_DESIGNS} />
        {canData ? <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'typed', label: 'Counts' }]} /> : null}
        {mode === 'data' ? (ds ? (
          <div class="stack">
            <GroupsFrom ds={ds} value={vc} onChange={setVc} groups={groups} onGroups={setGroups} exclude={[oc].filter(Boolean)} />
            <BinaryFrom ds={ds} label={design === 'tnd' ? 'Test result column' : design === 'case-control' ? 'Case or control column' : 'Outcome column'} value={oc} onChange={setOc} rule={oRule} onRule={setORule} exclude={[vc].filter(Boolean)} what={OUTCOME[design]} />
            {design === 'pt' ? <ColumnSelect ds={ds} label="Person-time column" value={tc} onChange={setTc} kind="numeric" exclude={[vc, oc].filter(Boolean)} hint="Time each person was followed" /> : null}
          </div>
        ) : needData) : design === 'published' ? (
          <div class="fields">
            <SelectField label="Ratio reported" value={rKind} onChange={setRKind} options={RATIO_KINDS} />
            <NumberField label="Ratio (vaccinated against unvaccinated)" value={c.r} onInput={(v) => setCell(design, 'r', v)} />
            <NumberField label="Lower 95% limit" value={c.lo} onInput={(v) => setCell(design, 'lo', v)} />
            <NumberField label="Upper 95% limit" value={c.hi} onInput={(v) => setCell(design, 'hi', v)} />
          </div>
        ) : design === 'pt' ? (
          <div class="fields">
            <NumberField label="Cases, vaccinated" value={c.a} onInput={(v) => setCell(design, 'a', v)} inputMode="numeric" />
            <NumberField label="Person-time, vaccinated" value={c.t1} onInput={(v) => setCell(design, 't1', v)} />
            <NumberField label="Cases, unvaccinated" value={c.c} onInput={(v) => setCell(design, 'c', v)} inputMode="numeric" />
            <NumberField label="Person-time, unvaccinated" value={c.t0} onInput={(v) => setCell(design, 't0', v)} />
          </div>
        ) : design === 'matched' ? (
          <div class="fields">
            <NumberField label="Both vaccinated" value={c.e} onInput={(v) => setCell(design, 'e', v)} inputMode="numeric" />
            <NumberField label="Case vaccinated, control not" value={c.f} onInput={(v) => setCell(design, 'f', v)} inputMode="numeric" />
            <NumberField label="Control vaccinated, case not" value={c.g} onInput={(v) => setCell(design, 'g', v)} inputMode="numeric" />
            <NumberField label="Neither vaccinated" value={c.h} onInput={(v) => setCell(design, 'h', v)} inputMode="numeric" />
          </div>
        ) : design === 'screening' ? (
          <div class="fields">
            <NumberField label="Cases vaccinated" value={c.x} onInput={(v) => setCell(design, 'x', v)} inputMode="numeric" />
            <NumberField label="All cases (vaccination status known)" value={c.n} onInput={(v) => setCell(design, 'n', v)} inputMode="numeric" />
          </div>
        ) : (
          <div class="tablewrap">
            <table class="table compact entry">
              <thead><tr><th scope="col">Group</th>{HEADS[design].map((h) => <th scope="col">{h}</th>)}</tr></thead>
              <tbody>{['Vaccinated', 'Unvaccinated'].map((rl, i) => (
                <tr><th scope="row">{rl}</th>{[0, 1].map((j) => <td><input inputMode="numeric" aria-label={`${rl}, ${HEADS[design][j].toLowerCase()}`} value={c[i][j]} onInput={(ev) => setCell(design, [i, j], ev.currentTarget.value)} /></td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {mode === 'typed' && design !== 'published' ? <p class="small">Illustrative numbers: replace them with yours.</p> : null}
        {design === 'screening' ? (
          <div class="fields">
            <NumberField label={mode === 'data' ? 'Coverage in the population, % (blank: from these data)' : 'Coverage in the population, %'} value={covText} onInput={setCov}
              error={covText.trim() && !covOk ? 'A percentage above 0 and below 100.' : ''} hint="The proportion vaccinated in the population the cases came from: same ages, same place, same time" />
            <TextField label="Source of the coverage" value={covSrc} onInput={setCovSrc} placeholder="NFHS-5 district fact sheet; or a coverage survey" />
          </div>
        ) : null}
        <div class="fields">
          <TextField label="Vaccine (for the sentence)" value={names.vaccine} onInput={setName('vaccine')} placeholder="measles-rubella vaccine" />
          <TextField label="Disease (for the sentence)" value={names.disease} onInput={setName('disease')} placeholder="measles" />
        </div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? <VeResult res={res} design={design} rKind={rKind} skipped={skipped} spec={spec} coverageFrom={coverageFrom} covSrc={covSrc.trim()}
        vaccine={names.vaccine.trim() || '[INSERT: vaccine]'} disease={names.disease.trim() || '[INSERT: disease]'} /> : null}
    </>
  );
}

function VeResult({ res, design, rKind, skipped, spec, coverageFrom, covSrc, vaccine, disease }) {
  let est, ci, method, rows = [], tiles = [], say = '', checks = [];
  if (res.kind === 'published') {
    est = res.est; ci = res.ci; method = `from the ${rKind}`;
    rows = [mrow('VE', `1 − ${rKind}`, vp(est), vpCI(ci), true), mrow(rKind[0].toUpperCase() + rKind.slice(1), 'as published', ratio(res.ratio), rCI(res.ratioCI))];
    say = `The ${rKind} of ${ratio(res.ratio)} (95% CI ${rCI(res.ratioCI)}) for ${disease} in people given ${vaccine} corresponds to a vaccine effectiveness of ${vp(est)} (95% CI ${vpCI(ci)}).`;
    checks = [{ text: `VE = 1 − ${rKind}. It inherits whatever the ${rKind} was adjusted for, and its biases; read the source for both.` },
      rKind === 'odds ratio' ? { text: 'An odds ratio approximates the risk ratio only when the disease is rare in the study population; with common outcomes it overstates VE away from zero.' } : null];
  } else if (res.kind === 'screening') {
    est = res.est; ci = res.ci; method = res.auto === 'exact' ? 'exact' : "Farrington's logit";
    rows = [mrow('VE', method, vp(est), vpCI(ci), true), mrow('VE', res.auto === 'exact' ? "Farrington's logit" : 'exact', vp(est), vpCI(res.auto === 'exact' ? res.logit : res.exact)),
      mrow('Cases vaccinated (PCV)', null, pc(res.pcv), null), mrow('Coverage (PPV)', coverageFrom === 'data' ? 'from these data' : 'as entered', pc(res.ppv), null)];
    tiles = [['Cases vaccinated', `${count(res.x)} of ${count(res.n)} (${pc(res.pcv)})`], ['Coverage', pc(res.ppv)]];
    const src = coverageFrom === 'data' ? 'in these data' : covSrc ? `(${covSrc})` : '[INSERT: source of the coverage]';
    say = `Of ${count(res.n)} cases of ${disease}, ${count(res.x)} (${pc(res.pcv)}) had received ${vaccine}, against a coverage of ${pc(res.ppv)} ${src}; by the screening method, vaccine effectiveness was ${vp(est)} (95% CI ${vpCI(ci)}).`;
    checks = [
      { text: 'The coverage must describe the population the cases came from: the same ages, place and period. Near 100% coverage, a small error in it moves VE a long way (Orenstein and colleagues 1985).' },
      { text: 'This is a crude estimate. Farrington (1993) shows how to adjust the screening method for age and other factors by logistic regression with the coverage of each stratum as an offset.' },
      res.auto === 'exact' ? { text: 'Fewer than 5 cases were vaccinated, or unvaccinated, so the exact interval is reported.' } : null,
      coverageFrom === 'data' ? { text: 'Coverage was taken from everyone in these data; that is right only if the data are a sample of the population the cases came from.' } : null,
    ];
  } else {
    const { ratio: R, ve, src } = res;
    est = ve.est; ci = ve.ci; method = `from the ${R.name}, ${methodName(ve.auto, R.name)}`;
    rows = [mrow('VE', methodName(ve.auto, R.name), vp(est), vpCI(ci), true),
      ...Object.keys(ve.intervals).filter((k) => k !== ve.auto).map((k) => mrow('VE', methodName(k, R.name), vp(est), vpCI(ve.intervals[k]))),
      mrow(R.name[0].toUpperCase() + R.name.slice(1), methodName(R.auto, R.name), ratio(R.est), rCI(R.intervals[R.auto]))];
    if (design === 'cohort') {
      tiles = [['Attack rate, vaccinated', `${pc(src.r1.p)} (${count(src.a)} of ${count(src.n1)})`], ['Attack rate, unvaccinated', `${pc(src.r0.p)} (${count(src.c)} of ${count(src.n0)})`], ['Risk ratio', ratio(R.est)]];
      say = `Of ${count(src.n1)} people vaccinated with ${vaccine}, ${count(src.a)} developed ${disease} (attack rate ${pc(src.r1.p)}), against ${count(src.c)} of ${count(src.n0)} unvaccinated (${pc(src.r0.p)}); vaccine effectiveness was ${vp(est)} (95% CI ${vpCI(ci)}).`;
    } else if (design === 'pt') {
      tiles = [['Rate, vaccinated (per 1,000)', fixed(1000 * src.a / src.t1, 2)], ['Rate, unvaccinated (per 1,000)', fixed(1000 * src.c / src.t0, 2)], ['Rate ratio', ratio(R.est)]];
      say = `${disease[0].toUpperCase() + disease.slice(1)} occurred at ${fixed(1000 * src.a / src.t1, 2)} per 1,000 [INSERT: person-years, or the unit of time entered] among people vaccinated with ${vaccine} and ${fixed(1000 * src.c / src.t0, 2)} among the unvaccinated; vaccine effectiveness was ${vp(est)} (95% CI ${vpCI(ci)}).`;
    } else if (design === 'matched') {
      tiles = [['Pairs', count(src.n)], ['Discordant pairs', `${count(src.f)} and ${count(src.g)}`], ['Matched odds ratio', ratio(R.est)]];
      say = `In ${count(src.n)} matched pairs, ${count(src.f)} cases of ${disease} were vaccinated with ${vaccine} where their control was not, and ${count(src.g)} controls where their case was not; vaccine effectiveness was ${vp(est)} (95% CI ${vpCI(ci)}).`;
    } else {
      const tnd = design === 'tnd', a = src.a, m1 = src.m1, b = src.b, m0 = src.m0;
      tiles = [[tnd ? 'Test-positives vaccinated' : 'Cases vaccinated', `${pc(a / m1)} (${count(a)} of ${count(m1)})`], [tnd ? 'Test-negatives vaccinated' : 'Controls vaccinated', `${pc(b / m0)} (${count(b)} of ${count(m0)})`], ['Odds ratio', ratio(R.est)]];
      say = tnd
        ? `Among ${count(m1 + m0)} people tested, ${count(a)} of ${count(m1)} who tested positive for ${disease} (${pc(a / m1)}) and ${count(b)} of ${count(m0)} who tested negative (${pc(b / m0)}) had received ${vaccine}; by the test-negative design, vaccine effectiveness was ${vp(est)} (95% CI ${vpCI(ci)}).`
        : `${count(a)} of ${count(m1)} cases of ${disease} (${pc(a / m1)}) and ${count(b)} of ${count(m0)} controls (${pc(b / m0)}) had received ${vaccine}; vaccine effectiveness was ${vp(est)} (95% CI ${vpCI(ci)}).`;
    }
    checks = [
      design === 'cohort' ? { text: 'Attack rates compare like with like only if the vaccinated and unvaccinated were equally exposed, with cases found the same way and vaccination recorded from cards rather than recall where possible (Orenstein and colleagues 1985).' } : null,
      design === 'tnd' ? { text: 'The test-negative design assumes that vaccination does not change the risk of the other illnesses that bring people to testing, and that VE does not vary with care-seeking; restrict to periods when the disease circulates and adjust for calendar time (Jackson and Nelson 2013; Sullivan and colleagues 2016).' } : null,
      design === 'case-control' ? { text: 'Controls must come from the population that produced the cases, with vaccination ascertained the same way in both.' } : null,
      design === 'matched' ? { text: 'Only discordant pairs carry information; the interval is exact, conditional on their number.' } : null,
      (design === 'case-control' || design === 'tnd') ? { text: 'VE = 1 − odds ratio; with incidence-density sampling of controls the odds ratio estimates the rate ratio without the rare-disease assumption.' } : null,
      design !== 'pt' && design !== 'matched' && ve.auto !== 'wald' ? { text: `A cell is below 5, so ${ve.auto === 'score' ? "Koopman's score interval" : 'the exact interval'} is reported.` } : null,
      design === 'pt' ? { text: 'The interval is exact: given the total number of cases, their split between vaccinated and unvaccinated person-time is binomial.' } : null,
    ];
  }
  const negative = Number.isFinite(est) && est < 0;
  checks = [...checks,
    negative ? { ok: false, text: 'VE is negative: in these data the vaccinated had the higher risk. Look for confounding (older or sicker people vaccinated first), misclassification of vaccination, and waning protection before reading it as harm.' } : null,
    res.kind !== 'published' ? { text: 'This is a crude estimate. Adjust for age and other confounders by stratification (Confounding and Standardisation) or logistic regression before reporting VE.' } : null,
    skipped ? { text: `${count(skipped)} people with a missing or excluded value were left out.` } : null,
  ];
  const refIds = res.kind === 'screening' ? ['orenstein', 'farrington', 'clopper'] : design === 'tnd' ? ['orenstein', 'jacksonNelson', 'sullivanTND', 'woolf'] : design === 'case-control' ? ['orenstein', 'woolf'] : design === 'matched' ? ['orenstein', 'breslowDay80'] : design === 'cohort' ? ['orenstein', 'katz', 'koopman'] : ['orenstein'];
  return (
    <section class="panel stack result-panel" aria-labelledby="ve-h">
      <div><h2 id="ve-h" style="margin-bottom:6px">VE = {vp(est)}</h2>
        <p class="verdict-line mono">95% CI {vpCI(ci)} ({method})</p></div>
      {tiles.length ? <Stats items={tiles} /> : null}
      <DataTable wrap caption="Vaccine effectiveness" columns={MCOLS} rows={rows} numeric={[1]} note="Highlighted: the estimate reported above." />
      <Checks items={checks} />
      <Report text={say} />
      {spec ? <CodeExport spec={spec} /> : null}
      <AtLevel min="advanced"><p class="small">VE = 1 − the ratio the design estimates; its limits are 1 minus the ratio's upper and lower limits. Screening method: VE = 1 − [PCV/(1 − PCV)] × [(1 − PPV)/PPV], with the interval for the proportion of cases vaccinated (PCV) carried across and the coverage (PPV) taken as known.</p></AtLevel>
      <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={refIds} /></div>
    </section>
  );
}

/* ------------------------------------------------------ screening programme --- */

const STRATEGIES = [{ value: 'single', label: 'One test' }, { value: 'serial', label: 'Two tests in series' }, { value: 'parallel', label: 'Two tests in parallel' }];

function ProgrammePanel() {
  const [v, setV] = useState({ N: '10000', prev: '2', src: '', se1: '90', sp1: '95', c1: '50', se2: '95', sp2: '98', c2: '400', cse: '', csp: '' });
  const [strategy, setStrategy] = useState('serial');
  const set = (k) => (x) => setV({ ...v, [k]: x });
  const n = (k) => parseNumber(v[k]);
  const pct = (k) => { const x = n(k); return x >= 0 && x <= 100 ? x / 100 : NaN; };
  const N = n('N'), prev = pct('prev'), se1 = pct('se1'), sp1 = pct('sp1'), se2 = pct('se2'), sp2 = pct('sp2');
  const c1 = v.c1.trim() ? n('c1') : 0, c2 = v.c2.trim() ? n('c2') : 0;
  const covSe = v.cse.trim() ? n('cse') : 0, covSp = v.csp.trim() ? n('csp') : 0;
  const two = strategy !== 'single';
  let err = null;
  if (!(N >= 1)) err = 'Enter the number of people to be screened.';
  else if (!(prev > 0 && prev < 1)) err = 'Enter the prevalence as a percentage above 0 and below 100.';
  else if (![se1, sp1, ...(two ? [se2, sp2] : [])].every((x) => x > 0 && x <= 1)) err = 'Enter each sensitivity and specificity as a percentage above 0, up to 100.';
  else if (![c1, c2].every((x) => Number.isFinite(x) && x >= 0)) err = 'Costs must be numbers, 0 or more (or left blank).';
  else if (two && (!Number.isFinite(covSe) || !Number.isFinite(covSp))) err = 'Covariances must be numbers (or left blank for none).';
  else if (two) {
    const [a, b] = covarianceRange(se1, se2), [c, d] = covarianceRange(sp1, sp2);
    if (covSe < a - 1e-12 || covSe > b + 1e-12) err = `With these sensitivities the covariance among people with the condition must lie between ${fixed(a, 4)} and ${fixed(b, 4)}.`;
    else if (covSp < c - 1e-12 || covSp > d + 1e-12) err = `With these specificities the covariance among people without the condition must lie between ${fixed(c, 4)} and ${fixed(d, 4)}.`;
  }
  let res = null, all = null;
  if (!err) {
    res = screeningYield({ N, prev, se1, sp1, se2, sp2, covSe, covSp, strategy, cost1: c1, cost2: c2 });
    all = [['Test 1 alone', screeningYield({ N, prev, se1, sp1, cost1: c1 })]];
    if (two || (se2 > 0 && sp2 > 0)) {
      all.push(['Test 2 alone', screeningYield({ N, prev, se1: se2, sp1: sp2, cost1: c2 })],
        ['In series', screeningYield({ N, prev, se1, sp1, se2, sp2, covSe, covSp, strategy: 'serial', cost1: c1, cost2: c2 })],
        ['In parallel', screeningYield({ N, prev, se1, sp1, se2, sp2, covSe, covSp, strategy: 'parallel', cost1: c1, cost2: c2 })]);
    }
  }
  const money = (x) => (Number.isFinite(x) ? count(Math.round(x)) : '—');
  const r0 = (x) => count(Math.round(x));
  const costs = c1 > 0 || c2 > 0;
  return (
    <>
      <section class="panel stack" aria-labelledby="pg-h">
        <h2 id="pg-h">What a screening programme finds</h2>
        <div class="fields">
          <NumberField label="People to be screened" value={v.N} onInput={set('N')} inputMode="numeric" />
          <NumberField label="Prevalence, %" value={v.prev} onInput={set('prev')} />
          <TextField label="Source of the prevalence" value={v.src} onInput={set('src')} placeholder="NFHS-5; NCD screening register, 2025" />
        </div>
        <Seg label="Strategy" value={strategy} onChange={setStrategy} options={STRATEGIES} />
        <div class="fields">
          <NumberField label="Test 1: sensitivity, %" value={v.se1} onInput={set('se1')} />
          <NumberField label="Test 1: specificity, %" value={v.sp1} onInput={set('sp1')} />
          <NumberField label="Test 1: cost per person (optional)" value={v.c1} onInput={set('c1')} />
        </div>
        <div class="fields">
          <NumberField label="Test 2: sensitivity, %" value={v.se2} onInput={set('se2')} />
          <NumberField label="Test 2: specificity, %" value={v.sp2} onInput={set('sp2')} />
          <NumberField label="Test 2: cost per person (optional)" value={v.c2} onInput={set('c2')} />
        </div>
        <Disclose title="If the two tests tend to err together">
          <p class="small">Tests that measure the same thing tend to miss the same people. Enter the conditional covariances (Gardner and colleagues 2000): among people with the condition, P(both positive) − Se₁Se₂; among people without it, P(both negative) − Sp₁Sp₂. The Diagnostic Accuracy tool reports both when the two tests were done on the same people. Blank means none.</p>
          <div class="fields">
            <NumberField label="Covariance, with the condition" value={v.cse} onInput={set('cse')} placeholder="0" />
            <NumberField label="Covariance, without the condition" value={v.csp} onInput={set('csp')} placeholder="0" />
          </div>
        </Disclose>
        <p class="small">Illustrative values: replace them with the tests and population you are planning for. In series, test 2 is done only on those positive on test 1; in parallel, everyone has both.</p>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="sy-h">
          <div><h2 id="sy-h" style="margin-bottom:6px">Finds {r0(res.tp)} of {r0(res.D)} cases</h2>
            <p class="verdict-line mono">Net sensitivity {pc(res.net.se)}, specificity {pc(res.net.sp)}; positive predictive value {pc(res.ppv)}</p></div>
          <Stats items={[['People screened per case found', fixed(res.screenedPerCase, 1)], ['Positives per case found', fixed(res.positivesPerCase, 2)], ['Cases missed', r0(res.fn)],
            two ? ['Second tests', r0(res.tests[1])] : null, costs ? ['Cost per case found', money(res.costPerCase)] : null]} />
          <DataTable wrap caption={`Expected results in ${count(res.N)} people`} columns={['Result', 'With the condition', 'Without']} numeric={[1, 2]}
            rows={[['Positive', r0(res.tp), r0(res.fp)], ['Negative', r0(res.fn), r0(res.tn)], ['Total', r0(res.D), r0(res.H)]]} />
          <DataTable wrap caption="Strategies compared" columns={['Strategy', 'Result']} rows={all.map(([name, y]) => [name, { text: `Se ${pc(y.net.se)}, Sp ${pc(y.net.sp)}: finds ${r0(y.tp)}, misses ${r0(y.fn)}, ${r0(y.fp)} false positives; PPV ${pc(y.ppv)}${costs ? `; cost per case ${money(y.costPerCase)}` : ''}`, cls: 'wrap' }])} />
          <Checks items={[
            { text: 'Series testing raises specificity and lowers sensitivity; parallel testing does the reverse. Both assume the tests err independently unless you enter the covariances; tests that miss the same people gain less from either (Gardner and colleagues 2000; Cebul and colleagues 1982).' },
            { text: `Predictive values follow the prevalence: at ${pc(prev)}, ${r0(res.fp)} of ${r0(res.positives)} positives are false. ${v.src.trim() ? `Prevalence from ${v.src.trim()}.` : 'Give the source of the prevalence when you report this.'}` },
            { text: 'Yield is not benefit: a programme helps only if earlier detection leads to treatment that changes outcomes, and survival from diagnosis is inflated by lead time and by finding slow-growing disease (length bias).' },
          ]} />
          <Report text={`Screening ${count(res.N)} people at a prevalence of ${pc(prev)}${v.src.trim() ? ` (${v.src.trim()})` : ' [INSERT: source of the prevalence]'} with ${strategy === 'single' ? 'one test' : strategy === 'serial' ? 'two tests in series' : 'two tests in parallel'} (net sensitivity ${pc(res.net.se)}, specificity ${pc(res.net.sp)}) would be expected to find ${r0(res.tp)} of ${r0(res.D)} cases and give ${r0(res.fp)} false positives (positive predictive value ${pc(res.ppv)}): ${fixed(res.screenedPerCase, 1)} people screened${costs ? ` and ${money(res.costPerCase)} spent` : ''} for each case found.`} />
          <AtLevel min="advanced"><p class="small">Series: Se = Se₁Se₂ + cov₊, Sp = 1 − (1 − Sp₁)(1 − Sp₂) − cov₋. Parallel: Se = 1 − (1 − Se₁)(1 − Se₂) − cov₊, Sp = Sp₁Sp₂ + cov₋. Expected counts are the population times these probabilities; these are planning figures, without confidence intervals.</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['cebul', 'gardner', 'altmanBland94b']} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------- page --- */

export default function VaccinesTool({ preset }) {
  const ds = useDataset();
  const [tab, setTab] = useState(() => pick(preset, 'vaccines', 'tab', 've'));
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} title="Vaccines and Screening"
        lede="Vaccine efficacy and effectiveness from a cohort or outbreak, person-time, a case-control or test-negative study, matched pairs, the screening method or a published ratio; and what a screening programme finds with one test, or two in series or in parallel." />
      <div class="stack">
        <DataPanel examples={[{ label: 'Load example measles outbreak', csv: exampleMeaslesCsv, source: 'example-measles' }, { label: 'Load example antenatal data', csv: exampleCsv, source: 'example' }]} />
        <Disclose title="Which part do I need?">
          <ul>
            <li><strong>Vaccine effectiveness</strong>: how much a vaccine lowered the risk of disease, from a field study or outbreak, or from a published adjusted ratio. Efficacy comes from trials; effectiveness from routine use. The arithmetic is the same: VE = 1 − the ratio.</li>
            <li><strong>Screening programme</strong>: what one test, or two in series or in parallel, would find in a population, and at what cost per case.</li>
          </ul>
          <p>The example measles outbreak has 420 children in six hamlets, with doses of measles-rubella vaccine and measles by the outbreak case definition. It is simulated; the protection built into it is illustrative.</p>
        </Disclose>
        <div><Seg wide value={tab} onChange={setTab} options={[{ value: 've', label: 'Vaccine effectiveness' }, { value: 'programme', label: 'Screening programme' }]} /></div>
        {tab === 've' ? <VePanel ds={ds} preset={preset} /> : <ProgrammePanel />}
      </div>
    </div>
  );
}
