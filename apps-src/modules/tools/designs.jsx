/* Tool: study design chooser. Plan a new study from what it must find out, or name the design of
 * an existing one (Grimes and Schulz 2002). Either way the design's card says how it chooses its
 * participants, what it gives and cannot give, what threatens it, where to analyse it and work out
 * its sample size in this app (links that open those tools ready for the design), the reporting
 * guideline, and a sentence to start the protocol. The answers live in the address, so the browser's
 * Back button returns to them and a link to the page keeps them. */
import { useState, useEffect } from 'preact/hooks';
import { PageHead, Seg, Icon } from '../../ui/core.jsx';
import { Report, Refs, Disclose } from '../../ui/results.jsx';
import { usePlan } from '../../ui/plan.jsx';
import { REFS } from '../refs.js';
import { toolHref } from '../presets.js';
import { NAME_Q, nameQuestions, nameDesign, treePath, TREE, PLAN_Q, planQuestions, planDesign } from '../../engine/designs.js';
import { DESIGNS, FAMILIES, designById, designName, protocolText } from '../designs.js';

const TABS = [{ value: 'plan', label: 'Plan my study' }, { value: 'name', label: "Name a study's design" }, { value: 'all', label: 'All designs' }];

/** Answers from the address, keeping only values the questions offer. */
function readAnswers(preset, Q) {
  const a = {};
  for (const [k, q] of Object.entries(Q)) {
    const v = preset?.[k];
    if (v && q.opts.some((o) => o.value === v)) a[k] = v;
  }
  return a;
}

/** Keep only the answers on the current path, in question order. */
const prune = (a, keys) => Object.fromEntries(keys.filter((k) => a[k]).map((k) => [k, a[k]]));

/* ---------------------------------------------------------- pieces --- */

/** One question. Once answered it folds to the answer, with a button to change it, so the next
 * question is in view on a phone. */
function Question({ q, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const chosen = q.opts.find((o) => o.value === value);
  if (chosen && !editing) {
    return (
      <div class="q answered">
        <p><span class="ql">{q.q}</span> <span class="qv">{chosen.label}</span></p>
        <button type="button" class="btn ghost small" aria-label={`Change the answer to: ${q.q}`} onClick={() => setEditing(true)}>Change</button>
      </div>
    );
  }
  return (
    <fieldset class="q">
      <legend>{q.q}</legend>
      {q.hint ? <p class="small qhint">{q.hint}</p> : null}
      <div class="choices">
        {q.opts.map((o) => (
          <button type="button" aria-pressed={value === o.value ? 'true' : 'false'} onClick={() => { setEditing(false); onChange(o.value); }}>
            <span class="t">{o.label}</span>{o.hint ? <span class="h">{o.hint}</span> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** The classification of Grimes and Schulz (2002), with the answers' path highlighted. */
function DesignTree({ path }) {
  const on = new Set(path);
  const ROW = 31, X0 = 6, IND = 18, W = 322;
  const rows = TREE.map(([id, depth, text], i) => ({ id, depth, text, x: X0 + depth * IND, y: 16 + i * ROW }));
  const links = rows.map((r, i) => {
    if (!r.depth) return null;
    let p = i - 1;
    while (rows[p].depth !== r.depth - 1) p -= 1;
    const P = rows[p];
    return { lit: on.has(r.id) && on.has(P.id), d: `M${P.x + 5} ${P.y + 5} V${r.y} H${r.x + 1}` };
  }).filter(Boolean).sort((a, b) => Number(a.lit) - Number(b.lit));
  const label = `Study design tree after Grimes and Schulz (2002)${path.length ? `; highlighted: ${rows.filter((r) => on.has(r.id)).map((r) => r.text).join(' then ')}` : ''}`;
  return (
    <figure class="dtree">
      <svg viewBox={`0 0 ${W} ${rows.length * ROW + 4}`} role="img" aria-label={label}>
        {links.map((l) => <path class={l.lit ? 'on' : undefined} d={l.d} />)}
        {rows.map((r) => (
          <g class={on.has(r.id) ? 'on' : undefined} data-node={r.id}>
            <circle cx={r.x + 5} cy={r.y} r="4.5" />
            <text x={r.x + 15} y={r.y + 4.5}>{r.text}</text>
          </g>
        ))}
      </svg>
      <figcaption class="small">How Grimes and Schulz (2002) classify study designs. Your answers so far are highlighted; the questions above add the finer distinctions (clusters, matching, timing).</figcaption>
    </figure>
  );
}

function HandoverList({ items }) {
  if (!items.length) return null;
  return (
    <ul class="handovers">
      {items.map((h) => (
        <li><a class="handover" href={h.href}><span class="t">{h.title}</span><span class="d">{h.label}</span><Icon name="arrow" /></a></li>
      ))}
    </ul>
  );
}

/** Everything about one design except its heading and references. */
function DesignBody({ d, extra = [], cluster = null, modules }) {
  const ready = new Set(modules.filter((m) => m.status === 'ready').map((m) => m.id));
  const titleOf = (id) => modules.find((m) => m.id === id)?.title || id;
  const analyse = [...extra, ...d.analyse].filter((h) => ready.has(h.tool))
    .map((h) => ({ href: toolHref(h.tool, h.preset), title: titleOf(h.tool), label: h.label }));
  const sizes = ready.has('sample-size') ? d.size.map((s) => ({ href: toolHref('sample-size', { design: s.design, cluster: cluster || s.cluster }), title: titleOf('sample-size'), label: s.label })) : [];
  const planned = (d.planned || []).map((id) => modules.find((m) => m.id === id && m.status !== 'ready')).filter(Boolean);
  return (
    <div class="dcard">
      <h3>How participants are chosen</h3>
      <p>{d.chosen}</p>
      <h3>What it can answer</h3>
      <p>{d.answers}</p>
      <h3>Measures it gives</h3>
      <ul>{d.measures.map((m) => <li>{m}</li>)}</ul>
      {d.cannot ? <><h3>What it cannot give</h3><ul>{d.cannot.map((m) => <li>{m}</li>)}</ul></> : null}
      <h3>Watch for</h3>
      <ul>{d.watch.map((m) => <li>{m}</li>)}</ul>
      {d.example ? <p class="small example"><strong>Example.</strong> {d.example.text}</p> : null}
      {analyse.length || d.analyseNote ? <h3>Analysis in this app</h3> : null}
      <HandoverList items={analyse} />
      {d.analyseNote ? <p class="small">{d.analyseNote}</p> : null}
      {sizes.length || d.sizeNote ? <h3>Sample size</h3> : null}
      <HandoverList items={sizes} />
      {d.sizeNote ? <p class="small">{d.sizeNote}</p> : null}
      {cluster === 'de' && sizes.length ? <p class="small">The links set the design effect for cluster sampling; enter it from a pilot or a similar survey.</p> : null}
      {planned.length ? <p class="small">Coming later in this app: {planned.map((m) => m.title).join('; ')}.</p> : null}
      <h3>Report it with</h3>
      <p>{d.report ? d.report.text : d.reportNote}</p>
      {d.report && d.reportNote ? <p class="small">{d.reportNote}</p> : null}
    </div>
  );
}

const refsOf = (d) => [...new Set([...d.refs, ...(d.report?.refs || []), ...(d.example?.ref ? [d.example.ref] : [])])];

/** A design as a result: heading, why, the card, the protocol sentence, alternatives, references. */
function DesignResult({ rec, modules, headingId, plan }) {
  const d = designById[rec.id];
  const inPlan = plan && plan.value.design?.id === rec.id && (plan.value.design?.variant || null) === (rec.variant || null);
  return (
    <section class="panel stack result-panel" aria-labelledby={headingId} aria-live="polite">
      <div>
        <h2 id={headingId} style="margin-bottom:6px">{designName(d, rec.variant)}</h2>
        <p class="verdict-line mono">{d.line}</p>
      </div>
      {rec.why?.length ? <div class="why"><h3 class="dsec">Why this design</h3><ul>{rec.why.map((w) => <li>{w}</li>)}</ul></div> : null}
      <DesignBody d={d} extra={rec.extra} cluster={rec.cluster} modules={modules} />
      <Report label="For your protocol" text={protocolText(d, rec.variant)} />
      {plan ? (
        <div class="btn-row">
          <button type="button" class="btn primary small" disabled={inPlan} onClick={() => plan.update({ design: { id: rec.id, variant: rec.variant || null } })}>{inPlan ? 'In your study plan' : 'Use this design in my study plan'}</button>
          {inPlan ? <a class="small" href="#/tool/question?tab=title">Draft the title</a> : null}
        </div>
      ) : null}
      {rec.alts?.length ? (
        <div class="stack-tight">
          <h3 class="dsec">Also consider</h3>
          {rec.alts.map((x) => {
            const a = designById[x.id];
            return (
              <Disclose title={a.name}>
                <p><strong>When:</strong> {x.why}</p>
                <DesignBody d={a} modules={modules} />
              </Disclose>
            );
          })}
        </div>
      ) : null}
      <div>
        <h3 class="dsec">References</h3>
        <Refs ids={refsOf(d)} refs={REFS} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ tabs --- */

function PlanPanel({ answers, setAnswers, modules, plan }) {
  const keys = planQuestions(answers);
  const set = (k, v) => { const next = { ...answers, [k]: v }; setAnswers(prune(next, planQuestions(next))); };
  const rec = planDesign(answers);
  return (
    <>
      <section class="panel stack" aria-labelledby="plan-h">
        <h2 id="plan-h">Plan my study</h2>
        <p class="small" style="margin:0">Answer each question; the design, with links to analyse it and work out its sample size, appears below.</p>
        {keys.map((k) => <Question key={k} q={PLAN_Q[k]} value={answers[k]} onChange={(v) => set(k, v)} />)}
        {keys.length > 1 ? <div><button type="button" class="btn ghost small" onClick={() => setAnswers({})}>Start again</button></div> : null}
      </section>
      {rec ? <DesignResult rec={rec} modules={modules} headingId="dc-h" plan={plan} /> : null}
    </>
  );
}

function NamePanel({ answers, setAnswers, modules, plan }) {
  const keys = nameQuestions(answers);
  const set = (k, v) => { const next = { ...answers, [k]: v }; setAnswers(prune(next, nameQuestions(next))); };
  const found = nameDesign(answers);
  return (
    <>
      <section class="panel stack" aria-labelledby="name-h">
        <h2 id="name-h">Name a study's design</h2>
        <p class="small" style="margin:0">For a paper you are reading or a study already done: answer from what the investigators did, not from what the paper calls itself.</p>
        {keys.map((k) => <Question key={k} q={NAME_Q[k]} value={answers[k]} onChange={(v) => set(k, v)} />)}
        {answers.aim === 'effect' ? <DesignTree path={treePath(answers)} /> : null}
        {keys.length > 1 ? <div><button type="button" class="btn ghost small" onClick={() => setAnswers({})}>Start again</button></div> : null}
      </section>
      {found ? <DesignResult rec={found} modules={modules} headingId="dn-h" plan={plan} /> : null}
    </>
  );
}

function AllPanel({ modules, open }) {
  return (
    <section class="panel stack" aria-labelledby="all-h">
      <h2 id="all-h">All designs</h2>
      <p class="small" style="margin:0">Each design with the measures it gives, its main threats, where to analyse it here, and how to report it.</p>
      {FAMILIES.map(([fid, label]) => (
        <div class="stack-tight">
          <h3>{label}</h3>
          {DESIGNS.filter((d) => d.family === fid).map((d) => (
            <Disclose title={d.name} open={open === d.id}>
              <p class="verdict-line mono">{d.line}</p>
              <DesignBody d={d} modules={modules} />
              <Report label="For your protocol" text={protocolText(d, null)} />
              <h3 class="dsec">References</h3>
              <Refs ids={refsOf(d)} refs={REFS} />
            </Disclose>
          ))}
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------ page --- */

export default function DesignTool({ preset, modules = [], config }) {
  const [planValue, planUpdate] = usePlan(config?.id);
  // Only #RESEARCH-APP has the planning tools that read the study plan.
  const plan = modules.some((m) => m.id === 'question' && m.status === 'ready') ? { value: planValue, update: planUpdate } : null;
  const [tab, setTab] = useState(() => (TABS.some((t) => t.value === preset?.tab) ? preset.tab : 'plan'));
  const [planA, setPlan] = useState(() => { const a = readAnswers(preset, PLAN_Q); return prune(a, planQuestions(a)); });
  const [name, setName] = useState(() => { const a = readAnswers(preset, NAME_Q); return prune(a, nameQuestions(a)); });
  const open = preset?.open && designById[preset.open] ? preset.open : null;

  // Keep the answers in the address without adding history entries, so Back from a linked tool returns here.
  useEffect(() => {
    try {
      const q = Object.entries({ tab, ...planA, ...name }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      const url = `#/tool/design-chooser?${q}`;
      if (location.hash !== url) history.replaceState(history.state, '', url);
    } catch { /* the address is a convenience; the tool works without it */ }
  }, [tab, JSON.stringify(planA), JSON.stringify(name)]);

  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Design' }]} title="Study Design Chooser"
        lede="Choose the design for a new study from what it must find out, or name the design of one already done. Each design comes with the measures it gives, its main threats, links to analyse it and work out its sample size here, and the guideline for reporting it." />
      <div class="stack">
        <Disclose title="How the chooser decides">
          <p>Naming a design follows the classification of Grimes and Schulz (2002): whether the investigators assigned the exposure, whether allocation was random, whether there was a comparison group, and which way the study ran, from exposure to outcome (cohort), from outcome to exposure (case-control), or both at one time (cross-sectional). Tests, agreement, prediction, reviews and qualitative work are asked about first, because the tree does not cover them.</p>
          <p>Planning weighs how common the outcome and the exposure are, whether the intervention can be allocated at random and to whom, and what records already exist. The reasons are shown with each recommendation, with the designs worth considering instead.</p>
        </Disclose>
        <div><Seg wide value={tab} onChange={setTab} options={TABS} /></div>
        {tab === 'plan' ? <PlanPanel answers={planA} setAnswers={setPlan} modules={modules} plan={plan} />
          : tab === 'name' ? <NamePanel answers={name} setAnswers={setName} modules={modules} plan={plan} />
            : <AllPanel modules={modules} open={open} />}
      </div>
    </div>
  );
}
