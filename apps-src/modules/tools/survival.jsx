/* Tool: survival analysis. Kaplan-Meier curves with censoring marks and numbers at risk,
 * median survival and survival at chosen times with 95% CIs, the log-rank test, and hazard
 * ratios from a Cox model with optional covariates. */
import { useState, useMemo } from 'preact/hooks';
import { kaplanMeier, logRank, cox } from '../../engine/survival.js';
import { buildDesign } from '../../engine/regression.js';
import { isMissing, parseNumberList } from '../../engine/data.js';
import { fixed, pValue, count, interval, sig, ratio } from '../../engine/format.js';
import { PageHead, Callout, AtLevel, SelectField, TextField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col, exampleCsv, exampleTbCsv } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs } from '../../ui/results.jsx';
import { KMPlot, seriesColour } from '../../ui/plot.jsx';
import { PredictorPicker } from './regression.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';

const pretty = (s) => String(s).replace(/_/g, ' ');
const P = (p) => pValue(p).report;
const pCell = (p) => pValue(p).report.replace(/^p = /, '').replace(/^p /, '');
const guessEvent = (levels) => levels.find((l) => /^(1|yes|y|died|dead|death|event|relapse|failure|true)$/i.test(l)) ?? levels[levels.length - 1];
const fmtT = (t) => (Number.isFinite(t) ? sig(t, 4) : 'not reached');
const pct = (v) => fixed(100 * v, 1);

export default function SurvivalTool() {
  const ds = useDataset();
  const [tName, setT] = useState(null), [eName, setE] = useState(null), [evLevel, setEv] = useState(null);
  const [gName, setG] = useState(null);
  const [unit, setUnit] = useState('months');
  const [timesText, setTimes] = useState('');
  const [chosen, setChosen] = useState({});
  const tc = ds ? col(ds, tName) : null, ec = ds ? col(ds, eName) : null, gc = ds && gName ? col(ds, gName) : null;
  const ev = ec ? (evLevel && ec.levels.includes(evLevel) ? evLevel : guessEvent(ec.levels)) : null;

  const data = useMemo(() => {
    if (!tc || !ec) return null;
    const rows = [];
    let dropped = 0, negative = 0;
    for (let i = 0; i < ds.n; i++) {
      const t = tc.numbers[i], e = ec.raw[i], g = gc ? gc.raw[i] : 'All';
      if (t === null || !Number.isFinite(t) || isMissing(e) || (gc && isMissing(g))) { dropped++; continue; }
      if (t < 0) { negative++; continue; }
      rows.push({ i, t, e: e === ev ? 1 : 0, g });
    }
    return { rows, dropped, negative };
  }, [ds, tName, eName, ev, gName]);

  let body = null;
  if (!ds) body = <Callout mark="Start here"><p>Load your data, or the example TB treatment cohort (simulated): months to death or loss to follow-up, by HIV status, diabetes, age and sex.</p></Callout>;
  else if (!tc || !ec) body = <p class="small">Choose the follow-up time and the event column.</p>;
  else if (data.rows.length < 3) body = <Callout kind="warn" mark="Check"><p>Fewer than three usable rows.</p></Callout>;
  else {
    const groups = gc ? gc.levels.filter((l) => data.rows.some((r) => r.g === l)) : ['All'];
    const fits = groups.map((g) => {
      const rs = data.rows.filter((r) => r.g === g);
      const km = kaplanMeier(rs.map((r) => r.t), rs.map((r) => r.e));
      return { g, km, rs, censored: rs.filter((r) => !r.e).map((r) => r.t), tmax: Math.max(...rs.map((r) => r.t)) };
    });
    const tmaxAll = Math.max(...fits.map((f) => f.tmax));
    const userTimes = parseNumberList(timesText).values.filter((t) => t > 0 && t <= tmaxAll);
    const atTimes = userTimes.length ? userTimes : [tmaxAll / 2, tmaxAll].map((t) => Number(sig(t, 2)));
    const lr = gc && groups.length > 1 ? logRank(data.rows.map((r) => r.t), data.rows.map((r) => r.e), data.rows.map((r) => r.g)) : null;
    // Cox model: the group (if any) plus chosen covariates.
    let coxRes = null, des = null;
    const covNames = Object.keys(chosen).filter((n) => n !== tName && n !== eName && n !== gName && col(ds, n));
    if ((gc && groups.length > 1) || covNames.length) {
      const idx = data.rows.map((r) => r.i);
      const predictors = [
        ...(gc && groups.length > 1 ? [{ name: pretty(gName), type: 'categorical', values: idx.map((i) => gc.raw[i]), levels: groups }] : []),
        ...covNames.map((n) => { const c = col(ds, n), o = chosen[n]; return o.type === 'numeric' ? { name: pretty(n), type: 'numeric', values: idx.map((i) => c.numbers[i]) } : { name: pretty(n), type: 'categorical', values: idx.map((i) => (isMissing(c.raw[i]) ? null : c.raw[i])), ref: o.ref, levels: c.levels }; }),
      ];
      des = buildDesign({ y: data.rows.map((r) => r.t), predictors });
      const ev2 = des.rows.map((k) => data.rows[k].e);
      const X = des.X.map((row) => row.slice(1));
      coxRes = X[0].length ? cox(X, des.y, ev2) : null;
    }
    const series = fits.map((f) => ({ label: f.g, steps: f.km.steps, censored: f.censored, tmax: f.tmax }));
    const tableRows = fits.map((f) => [f.g, count(f.rs.length), count(f.km.events),
      Number.isFinite(f.km.median) ? `${fmtT(f.km.median)} (${fmtT(f.km.medianCI[0])} to ${fmtT(f.km.medianCI[1])})` : 'not reached',
      ...atTimes.map((t) => { const s = f.km.at(t); return `${pct(s.S)}% (${pct(s.lo)} to ${pct(s.hi)})`; })]);
    const first = fits[0];
    const say = gc && groups.length > 1
      ? `${fits.map((f, i) => `${i ? 'in' : 'In'} the ${pretty(gName)} ${f.g} group (n = ${count(f.rs.length)}, ${count(f.km.events)} events), ${pct(f.km.at(atTimes[0]).S)}% were event-free at ${sig(atTimes[0], 3)} ${unit}${Number.isFinite(f.km.median) ? ` and the median time was ${fmtT(f.km.median)} ${unit}` : ''}`).join('; ')}. The curves ${lr.p < 0.05 ? 'differed' : 'did not differ clearly'} (log-rank χ² = ${fixed(lr.chi2, 2)}, df = ${lr.df}, ${P(lr.p)}).${coxRes && !coxRes.error ? ` ${des.names.slice(1).map((nm, j) => `${nm}: hazard ratio ${ratio(coxRes.coef[j].hr)} (95% CI ${ratio(coxRes.coef[j].ci[0])} to ${ratio(coxRes.coef[j].ci[1])}, ${P(coxRes.coef[j].p)})`).join('; ')}${covNames.length ? ', from a Cox model adjusted for the other terms' : ', from a Cox model'}.` : ''}`
      : `Of ${count(first.rs.length)} participants, ${count(first.km.events)} had the event; ${pct(first.km.at(atTimes[0]).S)}% (95% CI ${pct(first.km.at(atTimes[0]).lo)} to ${pct(first.km.at(atTimes[0]).hi)}) were event-free at ${sig(atTimes[0], 3)} ${unit}${Number.isFinite(first.km.median) ? `, and the median time to the event was ${fmtT(first.km.median)} ${unit}` : ''}.`;
    body = (
      <section class="panel stack result-panel" aria-labelledby="km-h">
        <div><p class="eyebrow" style="margin-bottom:8px">Result</p><h2 id="km-h" style="margin-bottom:6px">Kaplan-Meier analysis</h2>
          {lr ? <p class="verdict-line mono">Log-rank χ² = {fixed(lr.chi2, 2)}, df = {lr.df}, {P(lr.p)}</p> : null}</div>
        <Stats items={[['Participants', count(data.rows.length)], ['Events', count(data.rows.filter((r) => r.e).length)], data.dropped ? ['Left out (missing data)', count(data.dropped)] : null, data.negative ? ['Left out (negative time)', count(data.negative)] : null]} />
        <figure style="margin:0">
          <KMPlot series={series} unit={unit} band={series.length === 1} label="Kaplan-Meier curves" />
          {series.length > 1 ? <p class="small">{series.map((s, i) => <span style={`margin-right:14px;color:${seriesColour(i)};font-weight:600`}>— {s.label}</span>)}</p> : null}
          <figcaption class="figcap">Ticks mark censored participants{series.length === 1 ? '; dashed lines are the 95% CI' : ''}.</figcaption>
        </figure>
        <DataTable caption="Survival by group" columns={['Group', 'n', 'Events', `Median, ${unit} (95% CI)`, ...atTimes.map((t) => `Event-free at ${sig(t, 3)} ${unit} (95% CI)`)]} rows={tableRows} numeric={[1, 2]} />
        <DataTable caption="Number at risk" columns={['Group', ...[0, 0.25, 0.5, 0.75, 1].map((q) => sig(q * tmaxAll, 3))]}
          rows={fits.map((f) => [f.g, ...[0, 0.25, 0.5, 0.75, 1].map((q) => count(f.rs.filter((r) => r.t >= q * tmaxAll).length))])} numeric={[1, 2, 3, 4, 5]} />
        {lr ? <DataTable caption="Log-rank test: observed and expected events" columns={['Group', 'Observed', 'Expected']} rows={lr.labels.map((l, i) => [l, count(lr.observed[i]), fixed(lr.expected[i], 1)])} numeric={[1, 2]} /> : null}
        {coxRes ? (coxRes.error ? <Callout kind="warn" mark="Cox model"><p>{coxRes.error}</p></Callout> : (
          <>
            <DataTable caption={`Hazard ratios (Cox model, Efron ties; n = ${count(coxRes.n)}, ${count(coxRes.events)} events)`} columns={['Term', 'Hazard ratio', '95% CI', 'p']}
              rows={des.names.slice(1).map((nm, j) => [nm, ratio(coxRes.coef[j].hr), `${ratio(coxRes.coef[j].ci[0])} to ${ratio(coxRes.coef[j].ci[1])}`, { text: pCell(coxRes.coef[j].p), cls: coxRes.coef[j].p < 0.05 ? 'hl' : '' }])} numeric={[1, 2, 3]} />
            <Stats items={[['Likelihood-ratio χ²', `${fixed(coxRes.lr, 2)} on ${coxRes.dfLR} df`], ['p (model)', pValue(coxRes.pLR).exact], ["Harrell's C", fixed(coxRes.concordance, 3)], ['Events per coefficient', fixed(coxRes.events / coxRes.p, 1)]]} />
          </>
        )) : null}
        <div>
          <span class="label">Checks</span>
          <ul class="checks">
            <li class="info"><span class="mk">Note</span><span>Censoring must be unrelated to the outcome (non-informative): people lost to follow-up should have the same prospects as those who stay.</span></li>
            {coxRes && !coxRes.error ? <li class="info"><span class="mk">Note</span><span>Hazard ratios assume proportional hazards: curves that cross, or whose gap grows and shrinks, break this assumption.</span></li> : null}
            {coxRes && !coxRes.error && coxRes.events / coxRes.p < 10 ? <li class="no"><span class="mk">Check</span><span>Fewer than 10 events per coefficient: the Cox model may be over-fitted.</span></li> : null}
          </ul>
        </div>
        <Report text={say} />
        <CodeExport spec={{
          kind: 'surv', time: tName, event: eName, eventLevel: ev, eventNumeric: ec.numeric, group: gc && groups.length > 1 ? gName : null, groupLevels: groups, groupNumeric: gc ? gc.numeric : false, times: atTimes,
          covars: covNames.map((n) => { const c = col(ds, n), o = chosen[n]; return o.type === 'numeric' ? { name: n, type: 'numeric' } : { name: n, type: 'categorical', ref: o.ref && c.levels.includes(o.ref) ? o.ref : c.levels[0], levels: c.levels, numeric: c.numeric }; }),
        }} />
        <AtLevel min="advanced"><p class="small">Survival uses the product-limit estimator with Greenwood's variance; the 95% limits use the log(−log) transformation, and the median's interval comes from where those limits cross 50% (Brookmeyer and Crowley). Tied event times in the Cox model use Efron's method.</p></AtLevel>
        <div class="prose"><span class="label">References</span><Refs refs={REFS} ids={['kaplanMeier', 'mantelLogrank', 'brookmeyer', 'coxPH', 'efron', 'kirkwood']} /></div>
      </section>
    );
  }
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} eyebrow="Analyse" title="Survival Analysis"
        lede="Kaplan-Meier curves with numbers at risk, median survival and survival at chosen times, the log-rank test, and hazard ratios from a Cox model." />
      <div class="stack">
        <DataPanel examples={[{ label: 'Load example TB cohort', csv: exampleTbCsv, source: 'example-tb' }, { label: 'Load anaemia example', csv: exampleCsv, source: 'example' }]} />
        {ds ? (
          <section class="panel stack" aria-labelledby="sv-h">
            <h2 id="sv-h">Columns</h2>
            <div class="fields">
              <ColumnSelect ds={ds} label="Follow-up time" value={tName} onChange={setT} kind="numeric" hint="Time to the event, or to the last contact if censored" />
              <ColumnSelect ds={ds} label="Event" value={eName} onChange={(v) => { setE(v); setEv(null); }} kind="group" minLevels={2} maxLevels={2} />
              {ec ? <SelectField label="Value meaning the event happened" value={ev} onChange={setEv} options={ec.levels.map((l) => ({ value: l, label: l }))} /> : null}
              <ColumnSelect ds={ds} label="Compare groups (optional)" value={gName} onChange={setG} kind="group" maxLevels={8} allowNone exclude={[eName].filter(Boolean)} />
              <TextField label="Time unit" value={unit} onInput={setUnit} />
              <TextField label="Survival at times" value={timesText} onInput={setTimes} placeholder="For example 3, 6" hint="Blank: half-way and the end" />
            </div>
            {tName && eName ? (
              <details class="disclose" style="padding:10px 14px">
                <summary style="cursor:pointer;font-weight:600">Adjust hazard ratios for covariates (Cox model)</summary>
                <div style="margin-top:12px"><PredictorPicker ds={{ ...ds, columns: ds.columns.filter((c) => ![tName, eName, gName].includes(c.name)) }} outcome={tName} chosen={chosen} setChosen={setChosen} /></div>
              </details>
            ) : null}
          </section>
        ) : null}
        {body}
      </div>
    </div>
  );
}
