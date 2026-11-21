/* Research question, title, objectives and hypotheses: the sentences each frame builds, the
 * placeholders left for blank parts, and the links into the design chooser. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRAMES, questionText, titleOptions, objectivesFor, hypothesesFor, variablesFor, FINER, finerGaps, ROLES } from '../../engine/question.js';
import { PLAN_Q } from '../../engine/designs.js';
import { REFS } from '../../modules/refs.js';

const ex = (frame) => Object.fromEntries(FRAMES[frame].parts.map(([k, , , e]) => [k, e]));

test('each frame builds its question from the example, and leaves a placeholder for each blank part', () => {
  assert.equal(questionText('pico', ex('pico')), 'Among adolescent girls aged 10 to 19 years in government schools of Sundargarh district, what is the effect of weekly iron and folic acid supplementation with nutrition education, compared with weekly iron and folic acid supplementation alone, on haemoglobin concentration (g/dL) over six months?');
  assert.equal(questionText('peco', ex('peco')), 'Among adults aged 30 years and over in the mining blocks of Sundargarh district, is work in open-cast mines for five years or more, compared with adults who have never worked in mines, associated with chronic obstructive pulmonary disease confirmed by spirometry?');
  assert.equal(questionText('dta', ex('dta')), 'Among children aged 6 to 59 months attending anganwadi centres, how accurately does palmar pallor examined by the anganwadi worker detect anaemia (haemoglobin below 11 g/dL), judged against venous haemoglobin by an automated analyser?');
  assert.equal(questionText('cocopop', ex('cocopop')), 'What is the prevalence of sickle cell trait and disease by HPLC among children aged 1 to 14 years in tribal villages of Sundargarh district in 2026?');
  assert.equal(questionText('cocopop', ex('cocopop'), { measure: 'incidence' }).startsWith('What is the incidence of'), true);
  assert.equal(questionText('spider', ex('spider')), 'What are the experiences, beliefs and barriers of mothers of children with sickle cell disease regarding living with a child on long-term hydroxyurea?');
  // The optional time drops out cleanly; blank parts become placeholders.
  assert.ok(!questionText('pico', { ...ex('pico'), T: '' }).includes(' over '));
  assert.equal(questionText('peco', {}), 'Among [INSERT: population], is [INSERT: exposure], compared with [INSERT: comparator], associated with [INSERT: outcome]?');
});

test('titles name the design with the right article, and objectives and hypotheses follow the frame', () => {
  const t = titleOptions('cocopop', ex('cocopop'), { designName: 'Analytical cross-sectional study' });
  assert.equal(t[0].text, 'Prevalence of sickle cell trait and disease by HPLC among children aged 1 to 14 years in tribal villages of Sundargarh district in 2026: an analytical cross-sectional study');
  assert.ok(titleOptions('pico', ex('pico'), { designName: 'Randomised controlled trial', place: 'Sundargarh district, Odisha' })[0].text.endsWith('in Sundargarh district, Odisha: a randomised controlled trial'));
  assert.ok(titleOptions('peco', ex('peco'))[0].text.endsWith('[INSERT: study design]'));

  assert.equal(objectivesFor('dta', ex('dta')).primary, 'To estimate the sensitivity and specificity of palmar pallor examined by the anganwadi worker for anaemia (haemoglobin below 11 g/dL) among children aged 6 to 59 months attending anganwadi centres, against venous haemoglobin by an automated analyser.');
  assert.ok(objectivesFor('pico', ex('pico')).primary.startsWith('To compare haemoglobin concentration (g/dL) between adolescent girls'));
  assert.ok(objectivesFor('spider', ex('spider')).primary.startsWith('To explore the experiences, beliefs and barriers of mothers'));

  const sup = hypothesesFor('pico', ex('pico'));
  assert.equal(sup.sided, 'two-sided');
  assert.ok(sup.h0.includes('does not differ') && sup.h1.includes('differs'));
  const ni = hypothesesFor('pico', ex('pico'), { aim: 'non-inferiority' });
  assert.equal(ni.sided, 'one-sided');
  assert.ok(ni.h0.includes('by at least the non-inferiority margin') && ni.h1.includes('by less than'));
  assert.ok(hypothesesFor('peco', ex('peco')).h0.includes('(risk or odds ratio of 1)'));
  assert.ok(hypothesesFor('cocopop', ex('cocopop')).note && hypothesesFor('spider', ex('spider')).note.startsWith('Qualitative'));
});

test('variables, FINER gaps, and every frame leads to a design-chooser goal and checked references', () => {
  const roles = (f) => variablesFor(f, ex(f)).map((v) => v.role);
  assert.deepEqual(roles('pico'), ['Outcome', 'Intervention', 'Confounder', 'Confounder']);
  assert.deepEqual(roles('dta'), ['Index test', 'Reference standard', 'Outcome']);
  for (const f of Object.keys(FRAMES)) for (const v of variablesFor(f, ex(f))) assert.ok(ROLES.includes(v.role));
  const gaps = finerGaps({ subjects: 'no', afford: 'unsure', novel: 'yes' });
  assert.deepEqual(gaps.map((g) => [g.letter, g.key]), [['F', 'subjects'], ['F', 'afford']]);
  assert.equal(FINER.map((f) => f[0]).join(''), 'FINER');
  const goals = new Set(PLAN_Q.goal.opts.map((o) => o.value));
  for (const [id, f] of Object.entries(FRAMES)) {
    assert.ok(goals.has(f.goal), `${id} goal ${f.goal}`);
    for (const r of f.refs) assert.ok(REFS[r], `${id}: reference ${r}`);
  }
});
