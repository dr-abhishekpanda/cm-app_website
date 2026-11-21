/* Study design chooser: the naming flow reproduces the classification of Grimes and Schulz (2002),
 * the planning rules give the textbook choices, every path ends in a design, and every design's
 * links, presets and references point to things that exist. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NAME_Q, nameQuestions, nameDesign, treePath, TREE, PLAN_Q, planQuestions, planDesign, FLOW_IDS } from '../../engine/designs.js';
import { DESIGNS, FAMILIES, designById, protocolText } from '../../modules/designs.js';
import { PRESETS, pick, toolHref } from '../../modules/presets.js';
import { REFS } from '../../modules/refs.js';

const registry = readFileSync(new URL('../../modules/registry.js', import.meta.url), 'utf8');
const READY = new Set([...registry.matchAll(/id: '([\w-]+)', stage: '\w+', status: 'ready'/g)].map((m) => m[1]));
const PLANNED = new Set([...registry.matchAll(/\{ id: '([\w-]+)', stage: '\w+', phase: \d/g)].map((m) => m[1]));

/** Every complete path through a flow: answer each question in turn with each option. */
function paths(questions, Q) {
  const done = [];
  const walk = (a) => {
    const next = questions(a).find((k) => !a[k]);
    if (!next) { done.push(a); return; }
    for (const o of Q[next].opts) walk({ ...a, [next]: o.value });
  };
  walk({});
  return done;
}

test('naming a design follows Grimes and Schulz (2002): assignment, random allocation, a comparison group, direction', () => {
  const E = { aim: 'effect' };
  const cases = [
    [{ ...E, assign: 'yes', alloc: 'random', unitR: 'individuals', crossover: 'no' }, 'rct', ['assign', 'exp', 'rct']],
    [{ ...E, assign: 'yes', alloc: 'random', unitR: 'individuals', crossover: 'yes' }, 'crossover', ['assign', 'exp', 'rct']],
    [{ ...E, assign: 'yes', alloc: 'random', unitR: 'clusters', steps: 'no' }, 'cluster-rct', ['assign', 'exp', 'rct']],
    [{ ...E, assign: 'yes', alloc: 'random', unitR: 'clusters', steps: 'yes' }, 'stepped-wedge', ['assign', 'exp', 'rct']],
    [{ ...E, assign: 'yes', alloc: 'nonrandom' }, 'nrct', ['assign', 'exp', 'nrct']],
    [{ ...E, assign: 'yes', alloc: 'none' }, 'before-after', ['assign', 'exp', 'nrct']],
    [{ ...E, assign: 'no', unitO: 'groups', series: 'no' }, 'ecological', ['assign', 'obs']],
    [{ ...E, assign: 'no', unitO: 'groups', series: 'yes' }, 'its', ['assign', 'obs']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'no', desc: 'report' }, 'case-report', ['assign', 'obs', 'desc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'no', desc: 'series' }, 'case-series', ['assign', 'obs', 'desc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'no', desc: 'survey' }, 'survey', ['assign', 'obs', 'desc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'forward', timing: 'no' }, 'cohort', ['assign', 'obs', 'anal', 'cohort'], 'prospective'],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'forward', timing: 'yes' }, 'cohort', ['assign', 'obs', 'anal', 'cohort'], 'retrospective'],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'backward', controls: 'unmatched' }, 'case-control', ['assign', 'obs', 'anal', 'cc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'backward', controls: 'matched' }, 'matched-cc', ['assign', 'obs', 'anal', 'cc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'backward', controls: 'nested' }, 'nested-cc', ['assign', 'obs', 'anal', 'cc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'backward', controls: 'tnd' }, 'tnd', ['assign', 'obs', 'anal', 'cc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'backward', controls: 'self' }, 'case-crossover', ['assign', 'obs', 'anal', 'cc']],
    [{ ...E, assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'same' }, 'cross-sectional', ['assign', 'obs', 'anal', 'cross']],
    [{ aim: 'test', recruit: 'one' }, 'diagnostic', []],
    [{ aim: 'test', recruit: 'two' }, 'diagnostic-cc', []],
    [{ aim: 'agree' }, 'agreement', []],
    [{ aim: 'predict' }, 'prediction', []],
    [{ aim: 'review', systematic: 'yes' }, 'srma', []],
    [{ aim: 'review', systematic: 'no' }, 'narrative', []],
    [{ aim: 'qual' }, 'qualitative', []],
  ];
  for (const [a, id, path, variant] of cases) {
    const got = nameDesign(a);
    assert.equal(got?.id, id, JSON.stringify(a));
    assert.equal(got.variant ?? undefined, variant, `${id} variant`);
    assert.deepEqual(treePath(a), path, `${id} path`);
  }
  // Every node the tree highlights exists in the drawn tree.
  const nodes = new Set(TREE.map((r) => r[0]));
  for (const [a] of cases) for (const n of treePath(a)) assert.ok(nodes.has(n), n);
  // Partial answers give no design; answers off the path are ignored.
  assert.equal(nameDesign({ aim: 'effect', assign: 'yes', alloc: 'random' }), null);
  assert.equal(nameDesign({ aim: 'effect', assign: 'no', unitO: 'individuals', compare: 'yes' }), null);
  assert.equal(nameDesign({ aim: 'test', assign: 'yes', alloc: 'random', recruit: 'one' }).id, 'diagnostic');
  assert.deepEqual(nameQuestions({ aim: 'effect', assign: 'no', unitO: 'individuals', compare: 'yes', direction: 'backward' }), ['aim', 'assign', 'unitO', 'compare', 'direction', 'controls']);
});

test('planning a study gives the textbook choices: rare outcome, rare exposure, fixed exposures, acute triggers, allocation', () => {
  const C = { goal: 'cause', acute: 'no' };
  const E = { goal: 'effect' };
  const cases = [
    [{ goal: 'cause', acute: 'yes' }, 'case-crossover'],
    [{ ...C, outcomeRare: 'rare', exposureRare: 'common' }, 'case-control'],
    [{ ...C, outcomeRare: 'rare', exposureRare: 'rare', records: 'yes' }, 'cohort', 'retrospective'],
    [{ ...C, outcomeRare: 'rare', exposureRare: 'rare', records: 'no' }, 'case-control'],
    [{ ...C, outcomeRare: 'common', exposureRare: 'rare', records: 'no' }, 'cohort', 'prospective'],
    [{ ...C, outcomeRare: 'common', exposureRare: 'rare', records: 'yes' }, 'cohort', 'retrospective'],
    [{ ...C, outcomeRare: 'common', exposureRare: 'common', fixed: 'yes' }, 'cross-sectional'],
    [{ ...C, outcomeRare: 'common', exposureRare: 'common', fixed: 'no', records: 'no' }, 'cohort', 'prospective'],
    [{ ...E, assignP: 'yes', randomP: 'yes', levelP: 'groups', stagedP: 'no' }, 'cluster-rct'],
    [{ ...E, assignP: 'yes', randomP: 'yes', levelP: 'groups', stagedP: 'yes' }, 'stepped-wedge'],
    [{ ...E, assignP: 'yes', randomP: 'yes', levelP: 'individuals', chronicP: 'yes' }, 'crossover'],
    [{ ...E, assignP: 'yes', randomP: 'yes', levelP: 'individuals', chronicP: 'no', niP: 'no' }, 'rct'],
    [{ ...E, assignP: 'yes', randomP: 'yes', levelP: 'individuals', chronicP: 'no', niP: 'yes' }, 'ni-trial'],
    [{ ...E, assignP: 'yes', randomP: 'no' }, 'nrct'],
    [{ ...E, assignP: 'no', seriesP: 'yes' }, 'its'],
    [{ ...E, assignP: 'no', seriesP: 'no', controlP: 'yes' }, 'nrct'],
    [{ ...E, assignP: 'no', seriesP: 'no', controlP: 'no' }, 'before-after'],
    [{ goal: 'prevalence', compareP: 'no', clusterP: 'no' }, 'survey'],
    [{ goal: 'prevalence', compareP: 'yes', clusterP: 'no' }, 'cross-sectional'],
    [{ goal: 'incidence', records: 'yes' }, 'cohort', 'retrospective'],
    [{ goal: 'test', spectrum: 'yes' }, 'diagnostic'],
    [{ goal: 'test', spectrum: 'no' }, 'diagnostic-cc'],
    [{ goal: 'groups', seriesG: 'no' }, 'ecological'],
    [{ goal: 'groups', seriesG: 'yes' }, 'its'],
    [{ goal: 'cases', howMany: 'one' }, 'case-report'],
    [{ goal: 'cases', howMany: 'many' }, 'case-series'],
    [{ goal: 'agree' }, 'agreement'], [{ goal: 'predict' }, 'prediction'], [{ goal: 'views' }, 'qualitative'], [{ goal: 'review' }, 'srma'],
  ];
  for (const [a, id, variant] of cases) {
    const r = planDesign(a);
    assert.equal(r?.id, id, JSON.stringify(a));
    assert.equal(r.variant ?? undefined, variant, `${id} variant`);
    assert.ok(r.why.length > 0, `${id} gives a reason`);
  }
  // Cluster sampling carries a design effect into the sample size.
  assert.equal(planDesign({ goal: 'prevalence', compareP: 'no', clusterP: 'yes' }).cluster, 'de');
  // Vaccine data decide the design and open the vaccine tool at the matching design.
  const V = { outbreak: ['cohort', 'cohort'], register: ['cohort', 'pt'], casecontrol: ['case-control', 'case-control'], tested: ['tnd', 'tnd'], coverage: ['screening-method', 'screening'] };
  for (const [vdata, [id, design]] of Object.entries(V)) {
    const r = planDesign({ goal: 'vaccine', vdata });
    assert.equal(r.id, id);
    assert.deepEqual(r.extra[0].preset, { tab: 've', design });
  }
  // Partial answers give no design.
  assert.equal(planDesign({ goal: 'cause', acute: 'no', outcomeRare: 'common' }), null);
  assert.equal(planDesign({ goal: 'effect', assignP: 'yes' }), null);
});

test('every complete path through either flow ends in a design in the catalogue, and every design can be reached', () => {
  const reached = new Set();
  for (const [questions, design, Q] of [[nameQuestions, nameDesign, NAME_Q], [planQuestions, planDesign, PLAN_Q]]) {
    const all = paths(questions, Q);
    assert.ok(all.length > 20, `${all.length} paths`);
    for (const a of all) {
      const r = design(a);
      assert.ok(r && designById[r.id], `no design for ${JSON.stringify(a)}`);
      reached.add(r.id);
      for (const alt of r.alts || []) assert.ok(designById[alt.id], `alternative ${alt.id}`);
      for (const h of r.extra || []) checkHandover(h, `plan extra for ${r.id}`);
      if (r.variant) assert.ok(designById[r.id].variants?.[r.variant], `${r.id} has no variant ${r.variant}`);
    }
  }
  assert.deepEqual([...reached].sort(), DESIGNS.map((d) => d.id).sort());
  assert.deepEqual([...FLOW_IDS].sort(), DESIGNS.map((d) => d.id).sort());
});

function checkHandover(h, where) {
  assert.ok(READY.has(h.tool), `${where}: ${h.tool} is not a ready module`);
  assert.ok(PRESETS[h.tool], `${where}: ${h.tool} takes no presets`);
  for (const [k, v] of Object.entries(h.preset || {})) assert.ok(PRESETS[h.tool][k]?.includes(v), `${where}: ${h.tool} does not accept ${k}=${v}`);
  assert.ok(h.label && h.label.length > 3, `${where}: label`);
}

test('every design card is complete, and its links, presets and references exist', () => {
  const fam = new Set(FAMILIES.map((f) => f[0]));
  for (const d of DESIGNS) {
    for (const k of ['id', 'name', 'line', 'chosen', 'answers']) assert.ok(typeof d[k] === 'string' && d[k].length > 1, `${d.id}.${k}`);
    assert.ok(fam.has(d.family), `${d.id} family`);
    assert.ok(d.measures.length && d.watch.length && d.refs.length, `${d.id} lists`);
    assert.ok(d.report || d.reportNote, `${d.id} says how to report`);
    for (const h of d.analyse) checkHandover(h, d.id);
    assert.ok(READY.has('sample-size'));
    for (const s of d.size) {
      assert.ok(PRESETS['sample-size'].design.includes(s.design), `${d.id} size ${s.design}`);
      assert.ok(s.cluster === null || PRESETS['sample-size'].cluster.includes(s.cluster), `${d.id} cluster`);
      assert.ok(s.label, `${d.id} size label`);
    }
    if (!d.size.length) assert.ok(d.sizeNote, `${d.id} explains the missing sample size`);
    for (const id of d.planned || []) assert.ok(PLANNED.has(id) || READY.has(id), `${d.id} planned ${id}`);
    const ids = [...d.refs, ...(d.report?.refs || []), ...(d.example?.ref ? [d.example.ref] : [])];
    for (const id of ids) {
      assert.ok(REFS[id], `${d.id}: reference ${id} missing`);
      assert.match(REFS[id].checked, /\d{4}-\d{2}/, `${id} has no check date`);
    }
    const p = protocolText(d, null);
    if (d.id === 'narrative') assert.equal(p, null);
    else assert.ok(p.includes('[INSERT:'), `${d.id} protocol has placeholders`);
    for (const v of Object.keys(d.variants || {})) assert.ok(!protocolText(d, v).includes('prospective or retrospective'), `${d.id} ${v}`);
  }
});

test("the chooser's text follows the house style: no banned words, straight quotes, no emoji", () => {
  const banned = /\b(delve|intricate|pivotal|underscore|crucial|landscape|realm|tapestry|testament|meticulous|commendable|foster|navigate|showcase|paramount|resonate|unwavering|compelling|elevate|surpass|holistic|seamless|moreover|furthermore|additionally)\b/i;
  const strings = [];
  const collect = (x) => {
    if (typeof x === 'string') strings.push(x);
    else if (typeof x === 'function') { strings.push(x(null), x('prospective'), x('retrospective')); }
    else if (Array.isArray(x)) x.forEach(collect);
    else if (x && typeof x === 'object') Object.values(x).forEach(collect);
  };
  collect(DESIGNS); collect(NAME_Q); collect(PLAN_Q); collect(TREE);
  for (const flow of [[nameQuestions, nameDesign, NAME_Q], [planQuestions, planDesign, PLAN_Q]]) for (const a of paths(flow[0], flow[2])) collect(flow[1](a));
  assert.ok(strings.length > 500, `${strings.length} strings`);
  for (const s of strings) {
    assert.doesNotMatch(s, banned, s);
    assert.doesNotMatch(s, /[\u2018\u2019\u201c\u201d]/, `curly quote: ${s}`);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `emoji: ${s}`);
    assert.doesNotMatch(s, /\b(randomiz|analyz|program\b|behavior|center\b|color\b)/i, `American spelling: ${s}`);
  }
});

test('presets: links encode their values, and tools fall back for values they do not accept', () => {
  assert.equal(toolHref('measures', { tab: 'two', design: 'case-control' }), '#/tool/measures?tab=two&design=case-control');
  assert.equal(toolHref('survival', {}), '#/tool/survival');
  assert.equal(toolHref('sample-size', { design: 'cc', cluster: null }), '#/tool/sample-size?design=cc');
  assert.equal(pick({ design: 'case-control' }, 'measures', 'design', 'cohort'), 'case-control');
  assert.equal(pick({ design: 'nonsense' }, 'measures', 'design', 'cohort'), 'cohort');
  assert.equal(pick(undefined, 'measures', 'tab', 'two'), 'two');
  assert.equal(pick({ tab: 'roc' }, 'unknown-tool', 'tab', 'test'), 'test');
});
