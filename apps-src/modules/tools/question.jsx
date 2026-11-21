/* Tool: research question builder. A question frame (PICO, PECO, test accuracy, CoCoPop, SPIDER)
 * becomes the research question, the FINER criteria check it, and the title names the design. The
 * answers are kept in the study plan, which the objectives tool and the design chooser read. */
import { useState } from 'preact/hooks';
import { FRAMES, questionText, titleOptions, FINER, finerGaps } from '../../engine/question.js';
import { PageHead, Seg, Callout, TextField, SelectField, Icon, CopyButton } from '../../ui/core.jsx';
import { Report, Refs, Disclose } from '../../ui/results.jsx';
import { usePlan } from '../../ui/plan.jsx';
import { REFS } from '../refs.js';
import { pick, toolHref } from '../presets.js';
import { DESIGNS, designById, designName } from '../designs.js';

const TABS = [{ value: 'frame', label: 'Frame the question' }, { value: 'finer', label: 'FINER check' }, { value: 'title', label: 'Title' }];
const FRAME_OPTS = Object.entries(FRAMES).map(([value, f]) => ({ value, label: f.name }));
const ANSWERS = [{ value: 'yes', label: 'Yes' }, { value: 'unsure', label: 'Not sure' }, { value: 'no', label: 'No' }];

function FramePanel({ plan, update }) {
  const frame = plan.frame || 'pico';
  const f = FRAMES[frame];
  const vals = plan.values?.[frame] || {};
  const measure = plan.measure || 'prevalence';
  const setVal = (k, v) => update({ frame, values: { ...(plan.values || {}), [frame]: { ...vals, [k]: v } } });
  const example = () => update({ frame, values: { ...(plan.values || {}), [frame]: Object.fromEntries(f.parts.map(([k, , , ex]) => [k, ex])) } });
  const q = questionText(frame, vals, { measure });
  const filled = f.parts.filter(([k, , , , optional]) => !optional).every(([k]) => String(vals[k] ?? '').trim());
  const goal = frame === 'cocopop' ? (measure === 'incidence' ? 'incidence' : 'prevalence') : f.goal;
  return (
    <>
      <section class="panel stack" aria-labelledby="fq-h">
        <h2 id="fq-h">Frame the question</h2>
        <SelectField label="What kind of question?" value={frame} onChange={(v) => update({ frame: v })} options={FRAME_OPTS} />
        {frame === 'cocopop' ? <Seg label="Measure" value={measure} onChange={(v) => update({ measure: v })} options={[{ value: 'prevalence', label: 'Prevalence' }, { value: 'incidence', label: 'Incidence' }]} /> : null}
        <div class="stack" style="gap:12px">
          {f.parts.map(([k, label, hint, ex]) => (
            <TextField label={`${label} (${k})`} value={vals[k] || ''} onInput={(v) => setVal(k, v)} placeholder={ex} hint={hint} />
          ))}
        </div>
        <div class="btn-row"><button type="button" class="btn ghost small" onClick={example}>Fill in the example</button></div>
      </section>
      <section class="panel stack result-panel" aria-labelledby="rq-h" aria-live="polite">
        <div>
          <h2 id="rq-h" style="margin-bottom:6px">Your research question</h2>
          <p class="verdict-line mono">{f.name.split(':')[0]}{filled ? '' : '; fill in every part'}</p>
        </div>
        <p class="rq">{q}</p>
        <Report label="Research question" text={q} />
        <h3>Next steps</h3>
        <ul class="handovers">
          <li><a class="handover" href={toolHref('design-chooser', { tab: 'plan', goal })}><span class="t">Study Design Chooser</span><span class="d">Choose the design for this question</span><Icon name="arrow" /></a></li>
          <li><a class="handover" href="#/tool/objectives"><span class="t">Objectives, Hypotheses and Variables</span><span class="d">Objectives, hypotheses and the list of variables, from this question</span><Icon name="arrow" /></a></li>
        </ul>
        <h3>References</h3>
        <Refs ids={f.refs} refs={REFS} />
      </section>
    </>
  );
}

function FinerPanel({ plan, update }) {
  const answers = plan.finer || {};
  const set = (k, v) => update({ finer: { ...answers, [k]: v } });
  const gaps = finerGaps(answers);
  const total = FINER.reduce((s, [, , items]) => s + items.length, 0);
  const done = Object.keys(answers).length;
  return (
    <>
      <section class="panel stack" aria-labelledby="fn-h">
        <h2 id="fn-h">FINER check</h2>
        <p class="small" style="margin:0">Is the question Feasible, Interesting, Novel, Ethical and Relevant? Answer for your setting, not in general.</p>
        {FINER.map(([letter, name, items]) => (
          <div class="stack" style="gap:10px">
            <h3>{letter}: {name}</h3>
            {items.map(([k, text]) => <Seg label={text} value={answers[k]} onChange={(v) => set(k, v)} options={ANSWERS} />)}
          </div>
        ))}
      </section>
      <section class="panel stack result-panel" aria-labelledby="fr2-h" aria-live="polite">
        <div>
          <h2 id="fr2-h" style="margin-bottom:6px">{done < total ? `${done} of ${total} answered` : gaps.length ? `${gaps.length} point${gaps.length === 1 ? '' : 's'} to settle` : 'The question passes FINER'}</h2>
          <p class="verdict-line mono">{gaps.length ? gaps.map((g) => g.name).filter((x, i, a) => a.indexOf(x) === i).join(', ') : done < total ? 'answer every check' : 'feasible, interesting, novel, ethical, relevant'}</p>
        </div>
        {gaps.length ? (
          <ul>{gaps.map((g) => <li><strong>{g.name}</strong> ({g.answer === 'no' ? 'no' : 'not sure'}): {g.text.toLowerCase()}. {ADVICE[g.key]}</li>)}</ul>
        ) : null}
        <h3>References</h3>
        <Refs ids={['farrugia']} refs={REFS} />
      </section>
    </>
  );
}
const ADVICE = {
  subjects: 'Estimate the sample size first (Sample Size and Power), then count the eligible people you can reach in the time you have; narrow the question or widen the setting if they fall short.',
  expertise: 'Name the person or department who will train you or do the measurement, and plan a pilot.',
  afford: 'Cost the field work, tests and travel; seek an intramural or ICMR short-term grant, or cut the scope.',
  scope: 'Keep one primary question; move the rest to secondary objectives or a later study.',
  interest: 'Talk to your guide and to the programme officers who would use the answer.',
  novel: 'Search PubMed and Indian journals for studies in a similar setting; say what yours adds.',
  ethical: 'Discuss the risks, consent and any vulnerable groups with your ethics committee early.',
  relevant: 'Say who will act on the answer and how: a programme, a clinic, a policy.',
};

function TitlePanel({ plan, update }) {
  const frame = plan.frame || 'pico';
  const vals = plan.values?.[frame] || {};
  const chosen = plan.design?.id ? designName(designById[plan.design.id], plan.design.variant) : '';
  const [own, setOwn] = useState('');
  const dn = own || chosen;
  const options = titleOptions(frame, vals, { designName: dn ? dn.replace(/ study$/i, (m) => m) : '', place: plan.place || '', measure: plan.measure || 'prevalence' });
  return (
    <>
      <section class="panel stack" aria-labelledby="ti-h">
        <h2 id="ti-h">Title</h2>
        <TextField label="Place (for the title)" value={plan.place || ''} onInput={(v) => update({ place: v })} placeholder="Sundargarh district, Odisha" />
        <SelectField label="Study design" value={own || (chosen ? '__plan' : '')} onChange={(v) => setOwn(v === '__plan' ? '' : v)}
          options={[...(chosen ? [{ value: '__plan', label: `From your plan: ${chosen}` }] : [{ value: '', label: 'Choose the design' }]), ...DESIGNS.map((d) => ({ value: d.name, label: d.name }))]} />
        {!chosen ? <p class="small" style="margin:0">Or choose it with the <a href={toolHref('design-chooser', { tab: 'plan', goal: FRAMES[frame].goal })}>Study Design Chooser</a> and press "Use this design in my study plan".</p> : null}
      </section>
      <section class="panel stack result-panel" aria-labelledby="tr-h" aria-live="polite">
        <div>
          <h2 id="tr-h" style="margin-bottom:6px">Title options</h2>
          <p class="verdict-line mono">The design named in the title (STROBE and CONSORT, item 1a)</p>
        </div>
        {options.map((o) => (
          <div class="report">
            <p class="label">{o.kind} ({o.text.split(/\s+/).length} words)</p>
            <p class="say">{o.text}</p>
            <div class="copyrow"><CopyButton text={o.text} label="Copy title" /></div>
          </div>
        ))}
        <p class="small">Check the target journal's limit on title length, and keep abbreviations out of the title.</p>
        <h3>References</h3>
        <Refs ids={['strobe', 'consort2025']} refs={REFS} />
      </section>
    </>
  );
}

export default function QuestionTool({ preset, config }) {
  const [tab, setTab] = useState(() => pick(preset, 'question', 'tab', 'frame'));
  const [plan, update, clear] = usePlan(config?.id);
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Plan' }]} title="Research Question Builder"
        lede="Turn an idea into a research question with the frame that fits it (PICO, PECO, test accuracy, CoCoPop or SPIDER), check it against the FINER criteria, and draft a title that names the design." />
      <div class="stack">
        <Disclose title="Which frame fits my question?">
          <ul>
            <li><strong>PICO(T)</strong>: does an intervention work? A treatment, a programme, health education.</li>
            <li><strong>PECO</strong>: is an exposure or risk factor linked to an outcome? Occupation, diet, environment, a gene.</li>
            <li><strong>Test accuracy</strong>: how well does a test find a condition, against the best available reference?</li>
            <li><strong>CoCoPop</strong>: how common is a condition (prevalence) or how often does it begin (incidence)?</li>
            <li><strong>SPIDER</strong>: how do people experience or explain something? Qualitative and mixed-methods questions.</li>
          </ul>
        </Disclose>
        <div><Seg wide value={tab} onChange={setTab} options={TABS} /></div>
        {tab === 'frame' ? <FramePanel plan={plan} update={update} /> : tab === 'finer' ? <FinerPanel plan={plan} update={update} /> : <TitlePanel plan={plan} update={update} />}
        <Callout mark="Saved"><p>Your answers are kept in this browser only, for the planning tools to share. <button type="button" class="btn ghost small" onClick={clear}>Clear my study plan</button></p></Callout>
      </div>
    </div>
  );
}
