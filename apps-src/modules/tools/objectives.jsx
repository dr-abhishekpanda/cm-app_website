/* Tool: objectives, hypotheses and variables, drafted from the research question in the study plan.
 * Every draft can be edited; the variable list is the start of the codebook. */
import { useState } from 'preact/hooks';
import { questionText, objectivesFor, hypothesesFor, variablesFor, ROLES, TYPES } from '../../engine/question.js';
import { PageHead, Seg, Callout, TextField, SelectField, Icon } from '../../ui/core.jsx';
import { DataTable, Report, Refs } from '../../ui/results.jsx';
import { usePlan } from '../../ui/plan.jsx';
import { REFS } from '../refs.js';
import { pick, toolHref } from '../presets.js';
import { designById, designName } from '../designs.js';

const TABS = [{ value: 'objectives', label: 'Objectives' }, { value: 'hypotheses', label: 'Hypotheses' }, { value: 'variables', label: 'Variables' }];

function useQuestion(plan) {
  const frame = plan.frame || null;
  const vals = frame ? plan.values?.[frame] || {} : {};
  return { frame, vals, measure: plan.measure || 'prevalence' };
}

function NoQuestion() {
  return <Callout mark="Start"><p>Frame your question first in the <a href="#/tool/question">Research Question Builder</a>; the drafts here are built from it. You can still type your own below.</p></Callout>;
}

function ObjectivesPanel({ plan, update }) {
  const { frame, vals, measure } = useQuestion(plan);
  const sug = frame ? objectivesFor(frame, vals, { measure, design: plan.design?.id }) : { primary: '', secondary: [] };
  const obj = plan.objectives || {};
  const primary = obj.primary ?? sug.primary;
  const secondary = obj.secondary ?? sug.secondary;
  const set = (patch) => update({ objectives: { primary, secondary, ...patch } });
  const text = [`Primary objective: ${primary || '[INSERT: primary objective]'}`, ...(secondary.filter((s) => s.trim()).length ? ['Secondary objectives:', ...secondary.filter((s) => s.trim()).map((s, i) => `${i + 1}. ${s}`)] : [])].join('\n');
  return (
    <>
      {!frame ? <NoQuestion /> : <p class="small" style="margin:0">From your question: <em>{questionText(frame, vals, { measure })}</em></p>}
      <section class="panel stack" aria-labelledby="ob-h">
        <h2 id="ob-h">Objectives</h2>
        <div class="field">
          <label for="ob-primary">Primary objective</label>
          <textarea id="ob-primary" rows={3} value={primary} onInput={(e) => set({ primary: e.currentTarget.value })} />
          <div class="hint">One objective, with a verb that says what the study will do: estimate, compare, determine, explore.</div>
        </div>
        <span class="label">Secondary objectives</span>
        {secondary.map((s, i) => (
          <div class="objrow">
            <textarea aria-label={`Secondary objective ${i + 1}`} rows={2} value={s} onInput={(e) => set({ secondary: secondary.map((x, j) => (j === i ? e.currentTarget.value : x)) })} />
            <button type="button" class="btn ghost small" aria-label={`Remove secondary objective ${i + 1}`} onClick={() => set({ secondary: secondary.filter((_, j) => j !== i) })}>{'×'}</button>
          </div>
        ))}
        <div class="btn-row">
          <button type="button" class="btn ghost small" onClick={() => set({ secondary: [...secondary, ''] })}>Add a secondary objective</button>
          {frame ? <button type="button" class="btn ghost small" onClick={() => update({ objectives: null })}>Back to the suggestions</button> : null}
        </div>
      </section>
      <section class="panel stack result-panel" aria-labelledby="obr-h">
        <h2 id="obr-h">Checks</h2>
        <ul>
          <li>Each objective names the population, the measure and, where it applies, the comparison and the time.</li>
          <li>The primary objective is the one the sample size is calculated for.</li>
          <li>Every objective has a variable that measures it and an analysis that answers it.</li>
        </ul>
        <Report label="Objectives" text={text} />
        <h3>References</h3>
        <Refs ids={['farrugia']} refs={REFS} />
      </section>
    </>
  );
}

function HypothesesPanel({ plan, update }) {
  const { frame, vals } = useQuestion(plan);
  const aim = plan.aim || 'superiority';
  const h = frame ? hypothesesFor(frame, vals, { aim }) : null;
  const sizeFor = { pico: aim === 'non-inferiority' ? ['ni-props', 'ni-means'] : ['two-props', 'two-means'], peco: plan.design?.id === 'case-control' || plan.design?.id === 'matched-cc' ? ['cc'] : ['cohort', 'cc'], dta: ['diag'], cocopop: ['prop'] }[frame] || [];
  const LABEL = { 'ni-props': 'Non-inferiority: proportions', 'ni-means': 'Non-inferiority: means', 'two-props': 'Two proportions', 'two-means': 'Two means', cohort: 'Cohort study (risk ratio)', cc: 'Case-control study (odds ratio)', diag: 'Sensitivity and specificity of a test', prop: 'A prevalence or proportion' };
  return (
    <>
      {!frame ? <NoQuestion /> : null}
      {frame === 'pico' ? <section class="panel stack"><Seg label="What should the trial show?" value={aim} onChange={(v) => update({ aim: v })} options={[{ value: 'superiority', label: 'That one option differs (superiority)' }, { value: 'non-inferiority', label: 'That the new option is no worse (non-inferiority)' }]} /></section> : null}
      {h ? (
        <section class="panel stack result-panel" aria-labelledby="hy-h">
          <div>
            <h2 id="hy-h" style="margin-bottom:6px">{h.note ? 'No hypothesis needed' : 'Hypotheses for the primary objective'}</h2>
            <p class="verdict-line mono">{h.note ? 'estimation, not testing' : `${h.sided} test`}</p>
          </div>
          {h.note ? <p>{h.note}</p> : (
            <>
              <Report label="Null hypothesis (H0)" text={h.h0} />
              <Report label="Alternative hypothesis (H1)" text={h.h1} />
              <p class="small">A {h.sided} test at the 5% level unless you have a reason, stated in advance, to do otherwise. Report the estimate with its 95% CI, not only whether H0 was rejected.</p>
            </>
          )}
          {sizeFor.length ? (
            <>
              <h3>Sample size</h3>
              <ul class="handovers">{sizeFor.map((d) => <li><a class="handover" href={toolHref('sample-size', { design: d })}><span class="t">Sample Size and Power</span><span class="d">{LABEL[d]}</span><Icon name="arrow" /></a></li>)}</ul>
            </>
          ) : null}
          <h3>References</h3>
          <Refs ids={frame === 'pico' && aim === 'non-inferiority' ? ['farrugia', 'piaggioNI'] : ['farrugia']} refs={REFS} />
        </section>
      ) : null}
    </>
  );
}

const csvCell = (s) => (/[",\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s));

function VariablesPanel({ plan, update }) {
  const { frame, vals } = useQuestion(plan);
  const rows = plan.variables ?? (frame ? variablesFor(frame, vals) : []);
  const set = (next) => update({ variables: next });
  const edit = (i, patch) => set(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const blank = { name: '', role: 'Confounder', type: '', unit: '', definition: '', measure: '', when: '' };
  const COLS = ['Variable', 'Role', 'Type', 'Unit or categories', 'Definition', 'How measured', 'When'];
  const wn = (text) => ({ text, cls: 'wn' });
  const table = rows.map((r) => [r.name || '—', wn(`${r.role}${r.type ? `; ${r.type.toLowerCase()}` : ''}${r.unit ? ` (${r.unit})` : ''}`), wn([r.definition, r.measure, r.when].filter(Boolean).join('; ') || '—')]);
  const [saved, setSaved] = useState('');
  const download = () => {
    try {
      const text = [COLS.join(','), ...rows.map((r) => [r.name, r.role, r.type, r.unit, r.definition, r.measure, r.when].map((x) => csvCell(x ?? '')).join(','))].join('\n') + '\n';
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'variables.csv'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setSaved('Saved variables.csv.');
    } catch { setSaved('This browser did not allow the download; copy the table instead.'); }
  };
  return (
    <>
      {!frame && !rows.length ? <NoQuestion /> : null}
      <section class="panel stack" aria-labelledby="va-h">
        <h2 id="va-h">Variables</h2>
        <p class="small" style="margin:0">Every outcome, exposure and confounder, with a definition precise enough that two people would record the same value.</p>
        {rows.map((r, i) => (
          <fieldset class="varcard">
            <legend>{r.name || `Variable ${i + 1}`}</legend>
            <div class="fields">
              <TextField label="Name" value={r.name} onInput={(v) => edit(i, { name: v })} />
              <SelectField label="Role" value={r.role} onChange={(v) => edit(i, { role: v })} options={ROLES.map((x) => ({ value: x, label: x }))} />
              <SelectField label="Type" value={r.type} onChange={(v) => edit(i, { type: v })} options={[{ value: '', label: 'Choose' }, ...TYPES.map((x) => ({ value: x, label: x }))]} />
              <TextField label="Unit or categories" value={r.unit} onInput={(v) => edit(i, { unit: v })} placeholder="g/dL; or Yes, No" />
            </div>
            <TextField label="Operational definition" value={r.definition} onInput={(v) => edit(i, { definition: v })} placeholder="Anaemia: haemoglobin below 12 g/dL (WHO), by HemoCue on capillary blood" />
            <div class="fields">
              <TextField label="How measured" value={r.measure} onInput={(v) => edit(i, { measure: v })} placeholder="Interview schedule, item 14" />
              <TextField label="When" value={r.when} onInput={(v) => edit(i, { when: v })} placeholder="At enrolment" />
            </div>
            <div class="btn-row"><button type="button" class="btn ghost small" onClick={() => set(rows.filter((_, j) => j !== i))}>Remove {r.name || 'this variable'}</button></div>
          </fieldset>
        ))}
        <div class="btn-row">
          <button type="button" class="btn ghost small" onClick={() => set([...rows, blank])}>Add a variable</button>
          {frame ? <button type="button" class="btn ghost small" onClick={() => update({ variables: null })}>Back to the suggestions</button> : null}
        </div>
      </section>
      {rows.length ? (
        <section class="panel stack result-panel" aria-labelledby="vt-h">
          <h2 id="vt-h">Variable list</h2>
          <DataTable wrap caption="Variables" columns={['Variable', 'Role and type', 'Definition and measurement']} rows={table} />
          <div class="btn-row"><button type="button" class="btn ghost small" onClick={download}>Download as CSV</button></div>
          {saved ? <p class="small" role="status">{saved}</p> : null}
          <p class="small">Confounders are causes of the outcome that are also linked to the exposure and are not on the path between them; list them before collecting data, so they are measured.</p>
        </section>
      ) : null}
    </>
  );
}

export default function ObjectivesTool({ preset, config }) {
  const [tab, setTab] = useState(() => pick(preset, 'objectives', 'tab', 'objectives'));
  const [plan, update] = usePlan(config?.id);
  const d = plan.design?.id ? designById[plan.design.id] : null;
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Plan' }]} title="Objectives, Hypotheses and Variables"
        lede="Draft the primary and secondary objectives, the null and alternative hypotheses, and the list of variables with their definitions, from your research question." />
      <div class="stack">
        {d ? <p class="small" style="margin:0">Design in your plan: <strong>{designName(d, plan.design.variant)}</strong>.</p> : null}
        <div><Seg wide value={tab} onChange={setTab} options={TABS} /></div>
        {tab === 'objectives' ? <ObjectivesPanel plan={plan} update={update} /> : tab === 'hypotheses' ? <HypothesesPanel plan={plan} update={update} /> : <VariablesPanel plan={plan} update={update} />}
      </div>
    </div>
  );
}
