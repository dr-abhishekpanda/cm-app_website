/* Tool: outbreak investigation. A line list (or typed counts) gives the epidemic curve with the
 * probable period of exposure, attack rates by group with their denominators' source, the
 * food-specific attack-rate table, and the incubation period from a common exposure. For #EPI-APP
 * and #CM-APP; the epidemic curve signature of the brand belongs here and nowhere else. */
import { useState, useMemo } from 'preact/hooks';
import { parseDateTime, epiCurve, suggestInterval, exposureWindow, attackRates, foodTable, foodCounts, readYesNo, incubation, dateFormat, plainTimes, HOUR, DAY } from '../../engine/outbreak.js';
import { isMissing } from '../../engine/data.js';
import { fixed, count, ratio, sig } from '../../engine/format.js';
import { PageHead, Seg, Callout, NumberField, TextField, SelectField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col, exampleOutbreakCsv } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs, Disclose } from '../../ui/results.jsx';
import { EpiCurvePlot, ForestPlot, Histogram, dayLabel, timeLabel } from '../../ui/plot.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';
import { pick } from '../presets.js';
import { pretty, P, pc, pcCI, rCI, Checks, RowsTable, readRows, mkRows, needData, BinaryFrom, defaultRule, readBinary } from './epishared.jsx';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const two = (x) => String(x).padStart(2, '0');
const dateLong = (t) => { const d = new Date(t); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const when = (t, timed = true) => (timed ? `${timeLabel(t)} on ${dateLong(t)}` : dateLong(t));
const hrs = (h) => (Number.isFinite(h) ? fixed(h, 1) : '—');
const short = (t, hourly) => (hourly ? `${dayLabel(t)} ${timeLabel(t)}` : dayLabel(t));
const span = (ms) => { const h = ms / HOUR; return h < 48 ? `${fixed(h, h < 10 ? 1 : 0)} hours` : `${fixed(h / 24, 1)} days`; };

const INTERVALS = [['auto', 'Suggested'], ['h1', '1 hour'], ['h2', '2 hours'], ['h3', '3 hours'], ['h4', '4 hours'], ['h6', '6 hours'], ['h8', '8 hours'], ['h12', '12 hours'], ['d1', '1 day'], ['d2', '2 days'], ['d3', '3 days'], ['w1', '1 week']];
const readInterval = (v) => ({ unit: v[0] === 'h' ? 'hour' : v[0] === 'd' ? 'day' : 'week', width: Number(v.slice(1)) });
const intervalAdj = ({ unit, width }) => `${width}-${unit}`;
const intervalLabel = ({ unit, width }) => (unit === 'hour' ? `${width} ${width === 1 ? 'hour' : 'hours'}` : unit === 'day' ? `${width} ${width === 1 ? 'day' : 'days'}` : `${width} ${width === 1 ? 'week' : 'weeks'}`);
const binText = (b, unit) => (unit === 'hour' ? `${dayLabel(b.start)} ${timeLabel(b.start)} to ${timeLabel(b.end)}` : unit === 'day' && b.end - b.start === DAY ? dayLabel(b.start) : `${dayLabel(b.start)} to ${dayLabel(b.end - DAY)}`);

/* ------------------------------------------------------------ line list --- */

const guess = (ds, rx) => ds?.columns.find((c) => rx.test(c.name))?.name ?? null;

/** Everything the tabs read from the line list: who is a case, when each case began, any problems. */
function useLineList(ds, setup) {
  return useMemo(() => {
    if (!ds) return null;
    const ill = col(ds, setup.ill), dc = col(ds, setup.date), tc = col(ds, setup.time);
    const isCase = ill ? readBinary(ill, setup.illRule ?? defaultRule(ill)) : null;
    const onsets = [], unreadable = [];
    ds.columns[0].raw.forEach((_, i) => {
      if (!dc || (isCase && isCase[i] !== true)) { onsets.push(null); return; }
      const dr = dc.raw[i], tr = tc ? tc.raw[i] : '';
      if (isMissing(dr)) { onsets.push(null); return; }
      const p = parseDateTime(dr, isMissing(tr) ? '' : tr, { order: setup.order });
      if (!p) unreadable.push(`${dr}${tc && !isMissing(tr) ? ` ${tr}` : ''}`);
      onsets.push(p);
    });
    const exposure = setup.exposure.trim() ? parseDateTime(setup.exposure, '', { order: setup.order }) : null;
    const cases = isCase ? isCase.filter((x) => x === true).length : ds.n;
    const known = isCase ? isCase.filter((x) => x !== null).length : ds.n;
    // R and Python can read the dates the same way only for the plain formats; otherwise no script is offered.
    const fmt = dc ? dateFormat(dc.raw, { order: setup.order }) : null;
    const codeOk = !!(ill && fmt && (!tc || plainTimes(tc.raw)));
    return { ill, isCase, onsets, unreadable, exposure, cases, known, fmt, codeOk, read: onsets.filter(Boolean).length, timed: onsets.filter((o) => o?.timed).length };
  }, [ds, setup.ill, setup.illRule, setup.date, setup.time, setup.order, setup.exposure]);
}

function SetupPanel({ ds, setup, set, line }) {
  return (
    <section class="panel stack" aria-labelledby="ll-h">
      <h2 id="ll-h">Your line list</h2>
      <p class="small" style="margin:0">One row per person: everyone exposed (a meal, a village) when you have them, or the cases alone. Dates written day first, as in India, unless you say otherwise.</p>
      <BinaryFrom ds={ds} label="Case column" value={setup.ill} onChange={(v) => set({ ill: v })} rule={setup.illRule} onRule={(r) => set({ illRule: r })} what="Case" />
      <div class="fields">
        <ColumnSelect ds={ds} label="Date of onset" value={setup.date} onChange={(v) => set({ date: v })} kind="any" allowNone />
        <ColumnSelect ds={ds} label="Time of onset, if in its own column" value={setup.time} onChange={(v) => set({ time: v })} kind="any" allowNone />
      </div>
      <Seg label="Dates written" value={setup.order} onChange={(v) => set({ order: v })} options={[{ value: 'dmy', label: 'Day first (14/03/2026)' }, { value: 'mdy', label: 'Month first (03/14/2026)' }]} />
      <div class="fields">
        <TextField label="Common exposure, if any (date and time)" value={setup.exposure} onInput={(v) => set({ exposure: v })} placeholder="14/03/2026 13:00"
          hint="The meal or event everyone shared. Leave blank for an outbreak spread from person to person or from a continuing source." />
        <TextField label="Case definition (for the sentences)" value={setup.def} onInput={(v) => set({ def: v })} placeholder="vomiting or diarrhoea within 72 hours of the lunch" />
      </div>
      {line ? (
        <p class="small" style="margin:0">
          {count(ds.n)} people listed; {line.isCase ? `${count(line.cases)} cases` : 'choose the case column'}
          {setup.date ? `; onset read for ${count(line.read)}${setup.time || line.timed ? ` (${count(line.timed)} with a time)` : ''}` : ''}.
          {line.exposure ? ` Common exposure: ${when(line.exposure.t, line.exposure.timed)}.` : setup.exposure.trim() ? ' The common exposure did not read as a date: write it as 14/03/2026 13:00.' : ''}
        </p>
      ) : null}
      {line?.unreadable.length ? <Callout kind="warn" mark="Check"><p>{count(line.unreadable.length)} dates of onset did not read, such as {line.unreadable.slice(0, 3).map((u) => `"${u}"`).join(', ')}. Write them as 14/03/2026, 2026-03-14 or 14 Mar 2026, with times as 22:30.</p></Callout> : null}
    </section>
  );
}

/* ---------------------------------------------------------- the curve --- */

const EX_COUNTS = [['05/08/2026', '1'], ['06/08/2026', '0'], ['07/08/2026', '3'], ['08/08/2026', '6'], ['09/08/2026', '11'], ['10/08/2026', '9'], ['11/08/2026', '7'], ['12/08/2026', '4'], ['13/08/2026', '2'], ['14/08/2026', '1']];

function CurvePanel({ ds, setup, line }) {
  const [iv, setIv] = useState('auto');
  const [by, setBy] = useState(null);
  const [inc, setInc] = useState({ min: '', avg: '', max: '' });
  const [rows, setRows] = useState(() => mkRows(EX_COUNTS));
  const mode = ds ? 'data' : 'typed';
  const gc = ds && by ? col(ds, by) : null;

  let events = [], err = null, spec = null;
  if (mode === 'data') {
    if (!setup.date) err = 'Choose the column with the date of onset.';
    else if (line) {
      line.onsets.forEach((o, i) => { if (o) events.push({ ...o, group: gc && !isMissing(gc.raw[i]) ? String(gc.raw[i]).trim() : null }); });
      if (!events.length) err = 'No dates of onset read for the cases.';
    }
  } else {
    const r = readRows(rows, { integer: [0] });
    if (r.error) err = r.error;
    else for (const x of r.rows) {
      const p = parseDateTime(x.label, '', { order: setup.order });
      if (!p) { err = `"${x.label}" did not read as a date.`; break; }
      for (let k = 0; k < x.x[0]; k++) events.push({ ...p, group: null });
    }
    if (!err && !events.length) err = 'Enter at least one case.';
  }
  const num = (v) => { const x = Number(String(v).trim()); return String(v).trim() && Number.isFinite(x) && x >= 0 ? x : NaN; };
  const agent = { min: num(inc.min), avg: num(inc.avg), max: num(inc.max) };
  const observed = mode === 'data' && line?.exposure?.timed ? incubation(events.filter((e) => e.timed).map((e) => ({ exposure: line.exposure.t, onset: e.t }))) : null;

  let interval = null, why = '';
  if (!err) {
    if (iv !== 'auto') interval = readInterval(iv);
    else if (Number.isFinite(agent.avg) && agent.avg > 0) { interval = suggestInterval(agent.avg); why = 'about a quarter of the average incubation period you entered'; }
    else if (observed?.n >= 3) { interval = suggestInterval(observed.mean); why = 'about a quarter of the average incubation period in these data'; }
    else {
      const ts = events.map((e) => e.t), spanH = (Math.max(...ts) - Math.min(...ts)) / HOUR;
      interval = suggestInterval(Math.max(1, (spanH * 4) / 15));
      why = 'about 15 intervals across the outbreak; enter the incubation period of the suspected agent for a better choice';
    }
    if (interval.unit === 'hour' && !events.some((e) => e.timed)) { interval = { unit: 'day', width: 1 }; why = 'days, because no time of onset was recorded'; }
  }
  const exposure = mode === 'data' ? line?.exposure : null;
  let curve = !err ? epiCurve(events, { ...interval, include: exposure ? [exposure.t] : [] }) : null;
  if (!err && !curve) err = 'No cases have a time of onset; choose an interval of a day or more.';
  const win = curve && (Number.isFinite(agent.min) || Number.isFinite(agent.avg) || Number.isFinite(agent.max)) ? exposureWindow(curve, agent) : null;
  // Widen the axis so that the probable period of exposure shows; the counts do not change.
  if (win?.from != null) curve = { ...epiCurve(events, { ...interval, include: [exposure?.t, win.from, win.to].filter(Number.isFinite) }), peak: curve.peak };
  if (curve && mode === 'data' && line?.codeOk) spec = { kind: 'epicurve', date: setup.date, time: setup.time, fmt: line.fmt, case: setup.ill, caseRule: setup.illRule ?? defaultRule(col(ds, setup.ill)), unit: interval.unit, width: interval.width, include: exposure ? exposure.t : null };

  return (
    <>
      <section class="panel stack" aria-labelledby="cv-h">
        <h2 id="cv-h">Epidemic curve</h2>
        {mode === 'typed' ? (
          <>
            <p class="small" style="margin:0">Without a line list, enter the number of cases by date of onset (or load the example outbreak above).</p>
            <RowsTable cols={['Cases']} rows={rows} setRows={setRows} what="date" numeric="numeric" />
          </>
        ) : null}
        <div class="fields">
          <SelectField label="Interval" value={iv} onChange={setIv} options={INTERVALS.map(([value, label]) => ({ value, label }))} />
          {ds ? <ColumnSelect ds={ds} label="Stack the bars by" value={by} onChange={setBy} kind="group" maxLevels={8} allowNone exclude={[setup.ill, setup.date, setup.time].filter(Boolean)} /> : null}
        </div>
        <Disclose title="Incubation period of the suspected agent">
          <p class="small">From a reference for the agent you suspect. The interval is set to about a quarter of the average, and the probable period of exposure is drawn on the curve: the first case less the minimum, the peak less the average, and the last case less the maximum (CDC).</p>
          <div class="fields">
            <NumberField label="Minimum, hours" value={inc.min} onInput={(v) => setInc({ ...inc, min: v })} />
            <NumberField label="Average, hours" value={inc.avg} onInput={(v) => setInc({ ...inc, avg: v })} />
            <NumberField label="Maximum, hours" value={inc.max} onInput={(v) => setInc({ ...inc, max: v })} />
          </div>
        </Disclose>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : curve ? <CurveResult curve={curve} interval={interval} why={why} win={win} exposure={exposure} setup={setup} grouped={by} spec={spec} /> : null}
    </>
  );
}

function CurveResult({ curve, interval, why, win, exposure, setup, grouped, spec }) {
  const hourly = curve.unit === 'hour';
  const t = (x) => (hourly ? when(x) : dateLong(x));
  const peaks = curve.peak;
  const peakText = peaks.length === 1 ? binText(peaks[0], curve.unit) : `${peaks.length} intervals (first ${binText(peaks[0], curve.unit)})`;
  const marks = exposure ? [{ t: exposure.t, label: 'Exposure' }] : [];
  const band = win?.from != null ? { from: win.from, to: win.to, label: 'Probable exposure' } : null;
  const cols = ['Interval', 'Cases', ...curve.groups];
  const tableRows = curve.bins.filter((b, i) => b.count || (i > 0 && i < curve.bins.length - 1)).map((b) => [binText(b, curve.unit), count(b.count), ...curve.groups.map((g) => count(b.groups[g] || 0))]);
  const after = exposure ? ` The first case began ${span(curve.first - exposure.t)} after the common exposure${exposure.timed ? ` at ${timeLabel(exposure.t)}` : ''}, and the peak ${span((peaks[0].start + peaks[0].end) / 2 - exposure.t)} after it.` : '';
  const def = setup.def.trim() ? ` (${setup.def.trim()})` : ' ([INSERT: case definition])';
  const say = `The ${count(curve.n)} cases${def} had onsets from ${t(curve.first)} to ${t(curve.last)}, with the most cases (${count(peaks[0].count)}) in ${peakText}.${after}`;
  const winText = win?.from != null ? `${hourly ? when(win.from) : dateLong(win.from)} to ${hourly ? when(win.to) : dateLong(win.to)}` : null;
  return (
    <section class="panel stack result-panel" aria-labelledby="ec-h" aria-live="polite">
      <div>
        <h2 id="ec-h" style="margin-bottom:6px">{count(curve.n)} cases over {span(curve.last - curve.first)}</h2>
        <p class="verdict-line mono">Peak {peakText} ({count(peaks[0].count)} cases); {intervalAdj(interval)} intervals</p>
      </div>
      <figure style="margin:0">
        <EpiCurvePlot curve={curve} marks={marks} band={band} label={`Epidemic curve: cases by time of onset in ${intervalAdj(interval)} intervals${grouped ? `, stacked by ${pretty(grouped)}` : ''}`} />
        <figcaption class="figcap">Cases by time of onset in {intervalAdj(interval)} intervals{why ? ` (${why})` : ''}{grouped ? `, stacked by ${pretty(grouped)}` : ''}.{exposure ? ' Dashed line: the common exposure.' : ''}{band ? ' Shaded: the probable period of exposure.' : ''}</figcaption>
      </figure>
      <Stats items={[['First case', short(curve.first, hourly)], ['Last case', short(curve.last, hourly)], ['Median onset', short(curve.median, hourly)], curve.untimed ? ['Without a time (left out)', count(curve.untimed)] : null,
        winText ? ['Probable exposure', `${short(win.from, hourly)} to ${short(win.to, hourly)}`] : null]} />
      <DataTable wrap caption={`Cases by time of onset, ${intervalAdj(interval)} intervals`} columns={cols} rows={tableRows} numeric={cols.map((_, i) => i).slice(1)} />
      {win?.from != null ? (
        <DataTable wrap caption="Probable period of exposure (counting back the incubation period)" columns={['From', 'Time']}
          rows={[win.fromFirst != null ? ['First case less the minimum', t(win.fromFirst)] : null, win.fromPeak != null ? ['Peak less the average', t(win.fromPeak)] : null, win.fromLast != null ? ['Last case less the maximum', t(win.fromLast)] : null].filter(Boolean)} />
      ) : null}
      <Checks items={[
        curve.untimed ? { text: `${count(curve.untimed)} case${curve.untimed === 1 ? ' has' : 's have'} a date but no time of onset and ${curve.untimed === 1 ? 'is' : 'are'} left out of an hourly curve; choose an interval of a day to include ${curve.untimed === 1 ? 'it' : 'them'}.` } : null,
        { text: 'A single peak with cases spread over about one incubation period suggests a common source at one time; a plateau suggests a continuing source; successive peaks about one incubation period apart suggest spread from person to person (CDC). Read the shape with what the investigation found.' },
        win && exposure ? { text: `The common exposure you entered (${when(exposure.t, exposure.timed)}) ${exposure.t >= win.from - HOUR && exposure.t <= win.to + HOUR ? 'falls within' : 'falls outside'} the probable period of exposure from the incubation period.` } : null,
        { text: 'Keep the same interval for curves you compare, and label the axis with the interval you chose.' },
      ]} />
      <Report text={say} />
      <CodeExport spec={spec} />
      <h3>References</h3>
      <Refs ids={['cdcEpiCurve', 'cdcExposure', 'reingold']} refs={REFS} />
    </section>
  );
}

/* ------------------------------------------------------- attack rates --- */

const EX_AR = [['Under 15', '10', '41'], ['15 to 44', '38', '93'], ['45 and over', '28', '52']];

function AttackPanel({ ds, setup, line }) {
  const [by, setBy] = useState(null);
  const [denom, setDenom] = useState('data');
  const [rows, setRows] = useState(() => mkRows(EX_AR));
  const [src, setSrc] = useState('');
  const [place, setPlace] = useState('');
  const mode = ds ? 'data' : 'typed';
  const gc = ds && by ? col(ds, by) : null;

  let groups = null, err = null, spec = null, fromData = false;
  if (mode === 'data' && denom === 'data') {
    if (!line?.isCase) err = 'Choose the case column in your line list.';
    else {
      fromData = true;
      const tally = new Map();
      line.isCase.forEach((y, i) => {
        if (y == null) return;
        const g = gc ? (isMissing(gc.raw[i]) ? null : String(gc.raw[i]).trim()) : 'Everyone';
        if (g == null) return;
        const t = tally.get(g) ?? { cases: 0, population: 0 };
        t.population += 1; if (y) t.cases += 1;
        tally.set(g, t);
      });
      groups = [...tally.entries()].map(([label, t]) => ({ label, ...t }));
      if (gc) groups.sort((a, b) => (gc.levels.indexOf(a.label) - gc.levels.indexOf(b.label)));
      spec = { kind: 'attack', case: setup.ill, caseRule: setup.illRule ?? defaultRule(col(ds, setup.ill)), group: by };
    }
  } else {
    const r = readRows(rows, { integer: [0, 1], positive: [1] });
    if (r.error) err = r.error;
    else {
      groups = r.rows.map((x) => ({ label: x.label, cases: x.x[0], population: x.x[1] }));
      const bad = groups.find((g) => g.cases > g.population);
      if (bad) err = `${bad.label}: more cases than people at risk.`;
      else if (!groups.length) err = 'Enter at least one group.';
      else spec = { kind: 'attack', typed: groups };
    }
  }
  const res = groups && !err ? attackRates(groups) : null;
  return (
    <>
      <section class="panel stack" aria-labelledby="ar-h">
        <h2 id="ar-h">Attack rates</h2>
        {mode === 'data' ? (
          <>
            <Seg label="People at risk" value={denom} onChange={setDenom} options={[{ value: 'data', label: 'Everyone at risk is in the line list' }, { value: 'typed', label: 'Only cases are listed: enter the population' }]} />
            {denom === 'data' ? <ColumnSelect ds={ds} label="Attack rate by" value={by} onChange={setBy} kind="group" maxLevels={15} allowNone exclude={[setup.ill, setup.date, setup.time].filter(Boolean)} /> : null}
          </>
        ) : <p class="small" style="margin:0">Enter the cases and the people at risk in each group (or load the example outbreak above).</p>}
        {mode === 'typed' || denom === 'typed' ? (
          <>
            <RowsTable cols={['Cases', 'People at risk']} rows={rows} setRows={setRows} what="group" numeric="numeric" />
            <TextField label="Source of the numbers at risk" value={src} onInput={setSrc} placeholder="Household survey by the ANM, March 2026" hint="Census, survey, eligible-couple or household registers: the report sentence names it." />
          </>
        ) : null}
        <TextField label="Where, or who (for the sentence)" value={place} onInput={setPlace} placeholder="guests at the wedding lunch" />
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : res ? <AttackResult res={res} fromData={fromData} src={src} place={place} by={by} setup={setup} spec={spec} /> : null}
    </>
  );
}

function AttackResult({ res, fromData, src, place, by, setup, spec }) {
  const tot = res.total;
  const multi = res.rows.length > 1;
  const who = place.trim() || '[INSERT: the population at risk]';
  const def = setup.def.trim() ? ` (${setup.def.trim()})` : '';
  const parts = multi ? res.rows.map((r) => `${pc(r.ar)} in ${r.label} (${count(r.cases)} of ${count(r.population)})`) : [];
  const source = fromData ? '' : ` Numbers at risk: ${src.trim() || '[INSERT: source of the numbers at risk]'}.`;
  const say = `Of ${count(tot.population)} ${who}, ${count(tot.cases)} became cases${def}: an attack rate of ${pc(tot.ar)} (95% CI ${pcCI(tot.ci)}).${multi ? ` By ${by ? pretty(by) : 'group'}, the attack rate was ${parts.join('; ')}.` : ''}${source}`;
  const arCell = (x, hl = '') => ({ text: `${pc(x.ar)} (${nb(pcCI(x.ci))}); ${nb(`${count(x.cases)} of ${count(x.population)}`)}`, cls: `wn ${hl}`.trim() });
  const rows = [...res.rows.map((r) => [r.label, arCell(r)]), ...(multi ? [[{ text: 'Total', cls: 'hl' }, arCell(tot, 'hl')]] : [])];
  return (
    <section class="panel stack result-panel" aria-labelledby="arr-h" aria-live="polite">
      <div>
        <h2 id="arr-h" style="margin-bottom:6px">Attack rate {pc(tot.ar)}</h2>
        <p class="verdict-line mono">95% CI {pcCI(tot.ci)} (Wilson); {count(tot.cases)} of {count(tot.population)}</p>
      </div>
      <DataTable wrap caption={`Attack rates${by ? ` by ${pretty(by)}` : ''}`} columns={['Group', 'Attack rate (95% CI); cases of those at risk']} rows={rows} numeric={[1]} />
      <Checks items={[
        { text: 'An attack rate is a proportion of the people at risk over the outbreak: count in the denominator only those who could have been exposed, and use the same case definition for everyone.' },
        !fromData ? { text: `Numbers at risk from ${src.trim() || 'an unnamed source'}: say when they were counted, and whether they cover the same area and people as the cases.` } : null,
        multi ? { text: 'Compare groups with a risk ratio and its CI (Frequency, Association and Impact) before reading a difference as real.' } : null,
      ]} />
      <Report text={say} />
      <CodeExport spec={spec} />
      <h3>References</h3>
      <Refs ids={['wilson', 'reingold']} refs={REFS} />
    </section>
  );
}

/* ------------------------------------------------------- food-specific --- */

const EX_FOOD = [['Rice', '71', '105', '5', '5'], ['Dal', '65', '90', '11', '20'], ['Mutton curry', '70', '52', '6', '58'], ['Mixed veg', '36', '69', '40', '41'], ['Kheer', '37', '61', '39', '49'], ['Curd raita', '37', '47', '39', '63'], ['Water', '63', '92', '13', '18']];

function yesNoColumns(ds, exclude) {
  return ds.columns.filter((c) => !exclude.includes(c.name)).filter((c) => {
    const vals = c.raw.filter((v) => !isMissing(v));
    return vals.length > 0 && c.levels.length === 2 && vals.every((v) => readYesNo(v) !== null);
  }).map((c) => c.name);
}

function FoodPanel({ ds, setup, line }) {
  const [design, setDesign] = useState('cohort');
  const [chosen, setChosen] = useState(null);
  const [rows, setRows] = useState(() => mkRows(EX_FOOD));
  const [event, setEvent] = useState('');
  const mode = ds ? 'data' : 'typed';
  const cc = design === 'case-control';
  const candidates = ds ? yesNoColumns(ds, [setup.ill, setup.date, setup.time].filter(Boolean)) : [];
  const items = chosen ?? candidates;

  let counts = null, err = null, spec = null;
  if (mode === 'data') {
    if (!line?.isCase) err = 'Choose the case column in your line list.';
    else if (!items.length) err = 'Tick the columns that record whether each person ate an item (Yes or No).';
    else {
      counts = foodCounts(line.isCase, items.map((name) => ({ name: pretty(name), ate: col(ds, name).raw.map(readYesNo) })));
      spec = { kind: 'foodtable', case: setup.ill, caseRule: setup.illRule ?? defaultRule(col(ds, setup.ill)), items, design };
    }
  } else {
    const r = readRows(rows, { integer: [0, 1, 2, 3] });
    if (r.error) err = r.error;
    else if (!r.rows.length) err = 'Enter at least one item.';
    else { counts = r.rows.map((x) => ({ name: x.label, a: x.x[0], b: x.x[1], c: x.x[2], d: x.x[3], missing: 0 })); spec = { kind: 'foodtable', typed: counts, design }; }
  }
  const bad = counts?.find((it) => it.a + it.b === 0 || it.c + it.d === 0 || it.a + it.c === 0 || it.b + it.d === 0);
  if (!err && bad) err = `${bad.name}: every row and column of its table needs at least one person.`;
  const res = counts && !err ? foodTable(counts, { design }) : null;
  const toggle = (n) => setChosen(items.includes(n) ? items.filter((x) => x !== n) : [...items, n]);
  const heads = cc ? ['Ate: cases', 'Ate: controls', 'Did not eat: cases', 'Did not eat: controls'] : ['Ate: ill', 'Ate: well', 'Did not eat: ill', 'Did not eat: well'];
  return (
    <>
      <section class="panel stack" aria-labelledby="fd-h">
        <h2 id="fd-h">Food-specific attack rates</h2>
        <Seg label="Who was asked" value={design} onChange={setDesign} options={[{ value: 'cohort', label: 'Everyone at the meal (cohort)' }, { value: 'case-control', label: 'Cases and a sample of the well (case-control)' }]} />
        {mode === 'data' ? (
          <div>
            <span class="label">Food and drink: columns with Yes or No for each person</span>
            <div class="varpick" role="group" aria-label="Food and drink columns">{candidates.map((n) => <label><input type="checkbox" checked={items.includes(n)} onChange={() => toggle(n)} />{pretty(n)}</label>)}</div>
            {!candidates.length ? <p class="small">No column holds only Yes and No answers.</p> : null}
          </div>
        ) : (
          <>
            <p class="small" style="margin:0">One row per item: the numbers who ate it and fell ill, ate it and stayed well, did not eat it and fell ill, and did not eat it and stayed well (or load the example outbreak above).</p>
            <RowsTable cols={heads} rows={rows} setRows={setRows} what="item" numeric="numeric" />
          </>
        )}
        <TextField label="The meal or event (for the sentence)" value={event} onInput={setEvent} placeholder="the wedding lunch on 14 March 2026" />
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : res ? <FoodResult res={res} counts={counts} event={event} spec={spec} /> : null}
    </>
  );
}

function FoodResult({ res, counts, event, spec }) {
  const cc = res.design === 'case-control';
  const R = cc ? 'OR' : 'RR', Rname = cc ? 'odds ratio' : 'risk ratio';
  const top = res.rows[0];
  const method = (r) => (r.method === 'wald' ? (cc ? 'Woolf' : 'Katz') : r.method === 'score' ? "Koopman's score" : r.method === 'exact' ? 'exact' : r.method);
  const sigItems = res.rows.filter((r) => r.ci && r.ci[0] > 1);
  const others = sigItems.filter((r) => r !== top).map((r) => `${r.name} (${R} ${ratio(r.ratio)}, 95% CI ${rCI(r.ci)})`);
  const ev = event.trim() || '[INSERT: the meal or event]';
  const say = cc
    ? `Of the cases, ${pc(top.casesExposed)} had eaten ${top.name.toLowerCase()} at ${ev}, against ${pc(top.controlsExposed)} of the controls (odds ratio ${ratio(top.ratio)}, 95% CI ${rCI(top.ci)}; ${P(top.test.p)}). ${others.length ? `Other items with a 95% CI above 1: ${others.join('; ')}.` : 'No other item had an odds ratio whose 95% CI lay above 1.'}`
    : `Of those who ate ${top.name.toLowerCase()} at ${ev}, ${pc(top.arAte)} (${count(top.a)} of ${count(top.ate)}) became ill, against ${pc(top.arNot)} (${count(top.c)} of ${count(top.notAte)}) of those who did not (risk ratio ${ratio(top.ratio)}, 95% CI ${rCI(top.ci)}; ${P(top.test.p)}); ${pc(top.shareOfCases, 0)} of cases had eaten it. ${others.length ? `Other items with a 95% CI above 1: ${others.join('; ')}.` : 'No other item had a risk ratio whose 95% CI lay above 1.'}`;
  const wn = (text, hl = '') => ({ text, cls: `wn ${hl}`.trim() });
  const rateRows = res.rows.map((r) => (cc
    ? [{ text: r.name, cls: r === top ? 'hl' : '' }, wn(`${count(r.a)} of ${count(r.a + r.c)} (${pc(r.casesExposed)})`), wn(`${count(r.b)} of ${count(r.b + r.d)} (${pc(r.controlsExposed)})`)]
    : [{ text: r.name, cls: r === top ? 'hl' : '' }, wn(`${count(r.a)} of ${count(r.ate)} (${pc(r.arAte)})`), wn(`${count(r.c)} of ${count(r.notAte)} (${pc(r.arNot)})`)]));
  const ratioRows = res.rows.map((r) => {
    const hl = r === top ? 'hl' : '';
    const est = r.ci ? `${ratio(r.ratio)} (${nb(rCI(r.ci))})` : ratio(r.ratio);
    return [{ text: r.name, cls: hl }, wn(r.test ? `${est}; ${nb(P(r.test.p))}` : est, hl), ...(cc ? [] : [pc(r.shareOfCases, 0)])];
  });
  const items = res.rows.filter((r) => Number.isFinite(r.ratio) && r.ratio > 0 && r.ci && r.ci[0] > 0 && Number.isFinite(r.ci[1])).map((r) => ({ kind: 'study', label: r.name, est: r.ratio, lo: r.ci[0], hi: r.ci[1], weight: 0.5 }));
  const few = res.rows.filter((r) => (cc ? r.a + r.b < 10 || r.c + r.d < 10 : r.ate < 10 || r.notAte < 10));
  const missing = counts.filter((c) => c.missing > 0);
  return (
    <section class="panel stack result-panel" aria-labelledby="fr-h" aria-live="polite">
      <div>
        <h2 id="fr-h" style="margin-bottom:6px">Highest {Rname}: {top.name}</h2>
        <p class="verdict-line mono">{R} {ratio(top.ratio)} (95% CI {rCI(top.ci)}, {method(top)}); {cc ? `${pc(top.casesExposed)} of cases exposed` : `eaten by ${pc(top.shareOfCases, 0)} of cases`}</p>
      </div>
      {items.length ? (
        <figure style="margin:0">
          <ForestPlot items={items} axis="log" nullAt={1} head="Item" fmt={(v) => ratio(v)} tickFmt={(t) => sig(t, 2)} label={`${cap1(Rname)} for each item with its 95% CI`} />
          <figcaption class="figcap">{cap1(Rname)} for each item with its 95% CI, highest first. Log scale; the line marks no difference.</figcaption>
        </figure>
      ) : null}
      <DataTable wrap caption={cc ? 'Exposure of cases and controls to each item' : 'Food-specific attack rates'} columns={cc ? ['Item', 'Cases who ate', 'Controls who ate'] : ['Item', 'Ate: ill', 'Did not eat: ill']} rows={rateRows} numeric={[1, 2]} />
      <DataTable wrap caption={`${cap1(Rname)} for each item`} columns={['Item', `${R} (95% CI); p`, ...(cc ? [] : ['Cases who ate'])]} rows={ratioRows} numeric={cc ? [1] : [1, 2]}
        note={`Highlighted: the item with the highest ${Rname}. Intervals: ${cc ? "Woolf's, or exact when a cell is below 5" : "Katz's, or Koopman's score when a cell is below 5"}; p from χ² with Yates' correction, or Fisher's exact test when an expected count is below 5.`} />
      <Checks items={[
        { text: cc ? 'The vehicle is usually the item that most cases ate and fewer controls ate, with the highest odds ratio.' : 'The vehicle is usually the item with a high attack rate among those who ate it, a low one among those who did not, and that most cases ate (WHO 2008).' },
        few.length ? { text: `Few people ${cc ? 'were exposed or unexposed to' : 'ate, or did not eat,'} ${few.map((r) => r.name.toLowerCase()).join(', ')}, so ${few.length === 1 ? 'its' : 'their'} comparison is weak.` } : null,
        res.rows.length > 3 ? { text: `With ${res.rows.length} items tested, one may reach p < 0.05 by chance alone; the pattern across attack rates matters more than any single p-value.` } : null,
        sigItems.length > 1 ? { text: 'More than one item stands out: people who ate one often ate the other. Stratify one item by the other (Confounding and Standardisation) to see which carries the risk.' } : null,
        missing.length ? { text: `Answers missing for ${missing.map((m) => `${m.name.toLowerCase()} (${count(m.missing)})`).join(', ')}; those people are left out of that item only.` } : null,
        { text: 'Confirm the vehicle with laboratory results from food samples and cases where possible.' },
      ]} />
      <Report text={say} />
      <CodeExport spec={spec} />
      <h3>References</h3>
      <Refs ids={['whoFoodborne', cc ? 'woolf' : 'katz', cc ? null : 'koopman', 'reingold'].filter(Boolean)} refs={REFS} />
    </section>
  );
}
const cap1 = (s) => s[0].toUpperCase() + s.slice(1);
/** Keeps an interval or a p-value on one line inside a cell that may wrap. */
const nb = (t) => String(t).replace(/ /g, '\u00a0');

/* ------------------------------------------------------- incubation --- */

function IncubationPanel({ ds, setup, line }) {
  if (!ds) return <>{needData}<p class="small">The incubation period needs a line list with the time of onset of each case, and the time of the common exposure.</p></>;
  let err = null, res = null, spec = null;
  if (!setup.date) err = 'Choose the column with the date of onset.';
  else if (!line?.exposure) err = 'Enter the date and time of the common exposure in your line list above.';
  else if (!line.exposure.timed) err = 'Give the time of the common exposure as well as the date, such as 14/03/2026 13:00.';
  else {
    const timed = line.onsets.filter((o) => o?.timed);
    res = incubation(timed.map((o) => ({ exposure: line.exposure.t, onset: o.t })));
    res.untimed = line.onsets.filter((o) => o && !o.timed).length;
    if (!res.n) err = 'No case has a time of onset after the exposure.';
    else if (line.codeOk) spec = { kind: 'incubation', date: setup.date, time: setup.time, fmt: line.fmt, case: setup.ill, caseRule: setup.illRule ?? defaultRule(col(ds, setup.ill)), exposure: line.exposure.t };
  }
  if (err) return <Callout kind="warn" mark="Check"><p>{err}</p></Callout>;
  const ex = when(line.exposure.t);
  const say = `Among ${count(res.n)} cases with a recorded time of onset, the incubation period from the common exposure at ${ex} had a median of ${hrs(res.median)} hours (interquartile range ${hrs(res.q1)} to ${hrs(res.q3)}; range ${hrs(res.min)} to ${hrs(res.max)}).`;
  return (
    <section class="panel stack result-panel" aria-labelledby="inc-h" aria-live="polite">
      <div>
        <h2 id="inc-h" style="margin-bottom:6px">Median incubation {hrs(res.median)} hours</h2>
        <p class="verdict-line mono">IQR {hrs(res.q1)} to {hrs(res.q3)}; range {hrs(res.min)} to {hrs(res.max)} hours (n = {count(res.n)})</p>
      </div>
      <figure style="margin:0">
        <Histogram x={res.hours} unit=" h" label="Histogram of incubation periods in hours" />
        <figcaption class="figcap">Incubation periods in hours, from the common exposure to onset.</figcaption>
      </figure>
      <Stats items={[['Cases with a time', count(res.n)], ['Geometric mean', `${hrs(res.geoMean)} h`], ['Dispersion factor', fixed(res.dispersion, 2)], ['Mean (SD)', `${hrs(res.mean)} (${hrs(res.sd)}) h`],
        res.untimed ? ['Date only (left out)', count(res.untimed)] : null, res.before ? ['Onset before exposure (left out)', count(res.before)] : null]} />
      <Checks items={[
        { text: "Incubation periods are usually skewed to the right and close to log-normal (Sartwell 1950): report the median and range, or the geometric mean with Sartwell's dispersion factor, rather than the mean." },
        res.before ? { text: `${count(res.before)} case${res.before === 1 ? ' began' : 's began'} before the exposure: ${res.before === 1 ? 'this case is' : 'these cases are'} not explained by it (a different source, a background case, or a wrong time).` } : null,
        res.untimed ? { text: `${count(res.untimed)} case${res.untimed === 1 ? ' has' : 's have'} a date of onset without a time and ${res.untimed === 1 ? 'is' : 'are'} left out.` } : null,
        { text: 'Compare the median and range with the incubation periods of the agents you suspect, together with the main symptoms.' },
      ]} />
      <Report text={say} />
      <CodeExport spec={spec} />
      <h3>References</h3>
      <Refs ids={['sartwell', 'whoFoodborne']} refs={REFS} />
    </section>
  );
}

/* ------------------------------------------------------------- page --- */

const TABS = [{ value: 'curve', label: 'Epidemic curve' }, { value: 'attack', label: 'Attack rates' }, { value: 'food', label: 'Food-specific' }, { value: 'incubation', label: 'Incubation period' }];

export default function OutbreakTool({ preset }) {
  const ds = useDataset();
  const [tab, setTab] = useState(() => pick(preset, 'outbreak', 'tab', 'curve'));
  const [setup0, setSetup] = useState({ ill: null, illRule: null, date: null, time: null, order: 'dmy', exposure: '', def: '' });
  // Guess the usual column names when a line list arrives; the user can change any of them.
  const setup = {
    ...setup0,
    ill: setup0.ill ?? guess(ds, /^(ill|case|sick|cases?_?status|outcome)$/i),
    date: setup0.date ?? guess(ds, /onset.*date|date.*onset|^onset$/i),
    time: setup0.time ?? guess(ds, /onset.*time|time.*onset/i),
    exposure: setup0.exposure || (ds?.source === 'example-outbreak' ? '14/03/2026 13:00' : ''),
  };
  const set = (patch) => setSetup({ ...setup, ...patch });
  const line = useLineList(ds, setup);
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} title="Outbreak Investigation"
        lede="From the line list to the epidemic curve, the probable period of exposure, attack rates with the source of their denominators, food-specific attack rates and the incubation period." />
      <div class="stack">
        <DataPanel examples={[{ label: 'Load example outbreak (wedding lunch)', csv: exampleOutbreakCsv, source: 'example-outbreak' }]} />
        <Disclose title="Steps of an outbreak investigation">
          <ol>
            <li>Prepare for fieldwork, and confirm that an outbreak exists and the diagnosis.</li>
            <li>Write a case definition (person, place, time, and clinical and laboratory criteria) and find cases; keep a line list.</li>
            <li>Describe the cases by time (the epidemic curve), place and person (attack rates).</li>
            <li>Form hypotheses about the source and spread; test them with a cohort or case-control study (food-specific attack rates).</li>
            <li>Put control measures in place as soon as the source is suspected; communicate the findings; keep up surveillance.</li>
          </ol>
          <p class="small">After Reingold (1998) and the WHO guidelines for foodborne disease outbreaks (2008). The order is a guide: control measures do not wait for the analysis.</p>
        </Disclose>
        {ds ? <SetupPanel ds={ds} setup={setup} set={set} line={line} /> : null}
        <div><Seg wide value={tab} onChange={setTab} options={TABS} /></div>
        {tab === 'curve' ? <CurvePanel ds={ds} setup={setup} line={line} />
          : tab === 'attack' ? <AttackPanel ds={ds} setup={setup} line={line} />
            : tab === 'food' ? <FoodPanel ds={ds} setup={setup} line={line} />
              : <IncubationPanel ds={ds} setup={setup} line={line} />}
      </div>
    </div>
  );
}
