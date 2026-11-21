/* Research question, title, objectives and hypotheses from a question frame.
 *
 * Frames: PICO(T) for interventions (Richardson and colleagues 1995), PECO for exposures (Morgan and
 * colleagues 2018), population, index test, reference standard and target condition for test accuracy
 * (Campbell and colleagues 2015), CoCoPop for prevalence and incidence (Munn and colleagues 2015), and
 * SPIDER for qualitative questions (Cooke and colleagues 2012). The FINER criteria follow Farrugia and
 * colleagues (2010). Every sentence keeps an [INSERT: ...] placeholder where an element is blank, so a
 * draft never reads as finished when it is not.
 */

export const FRAMES = {
  pico: {
    name: 'PICO(T): an intervention', goal: 'effect', refs: ['richardson1995', 'farrugia'],
    parts: [
      ['P', 'Population', 'Who, and where', 'adolescent girls aged 10 to 19 years in government schools of Sundargarh district'],
      ['I', 'Intervention', 'What is given or done', 'weekly iron and folic acid supplementation with nutrition education'],
      ['C', 'Comparison', 'The alternative: usual care, placebo or another option', 'weekly iron and folic acid supplementation alone'],
      ['O', 'Outcome', 'What changes, and how it is measured', 'haemoglobin concentration (g/dL)'],
      ['T', 'Time (optional)', 'Over what period', 'six months', true],
    ],
  },
  peco: {
    name: 'PECO: an exposure or risk factor', goal: 'cause', refs: ['morgan2018', 'farrugia'],
    parts: [
      ['P', 'Population', 'Who, and where', 'adults aged 30 years and over in the mining blocks of Sundargarh district'],
      ['E', 'Exposure', 'The factor whose effect you study', 'work in open-cast mines for five years or more'],
      ['C', 'Comparator', 'The unexposed, or a lower level of exposure', 'adults who have never worked in mines'],
      ['O', 'Outcome', 'The health effect, and how it is measured', 'chronic obstructive pulmonary disease confirmed by spirometry'],
    ],
  },
  dta: {
    name: 'Test accuracy: population, index test, reference standard, condition', goal: 'test', refs: ['campbell2015', 'stard'],
    parts: [
      ['P', 'Population', 'People in whom the test would be used', 'children aged 6 to 59 months attending anganwadi centres'],
      ['I', 'Index test', 'The test you evaluate', 'palmar pallor examined by the anganwadi worker'],
      ['R', 'Reference standard', 'The best available way to find the condition', 'venous haemoglobin by an automated analyser'],
      ['D', 'Target condition', 'What the test should detect', 'anaemia (haemoglobin below 11 g/dL)'],
    ],
  },
  cocopop: {
    name: 'CoCoPop: how common a condition is', goal: 'prevalence', refs: ['munn2015'],
    parts: [
      ['Co', 'Condition', 'What you measure, with its definition', 'sickle cell trait and disease by HPLC'],
      ['Ct', 'Context', 'Place and time', 'tribal villages of Sundargarh district in 2026'],
      ['Pop', 'Population', 'Who', 'children aged 1 to 14 years'],
    ],
  },
  spider: {
    name: 'SPIDER: experiences and views (qualitative)', goal: 'views', refs: ['cooke2012'],
    parts: [
      ['S', 'Sample', 'Who you will speak with', 'mothers of children with sickle cell disease'],
      ['PI', 'Phenomenon of interest', 'What you want to understand', 'living with a child on long-term hydroxyurea'],
      ['D', 'Design', 'How the data are gathered', 'in-depth interviews'],
      ['E', 'Evaluation', 'What you look for', 'experiences, beliefs and barriers'],
      ['R', 'Research type', 'Qualitative or mixed methods', 'qualitative'],
    ],
  },
};

const ins = (v, what) => (String(v ?? '').trim() ? String(v).trim() : `[INSERT: ${what}]`);
const lc = (s) => (s.startsWith('[INSERT') ? s : s[0].toLowerCase() + s.slice(1));

/** The research question as a sentence. */
export function questionText(frame, v = {}, { measure = 'prevalence' } = {}) {
  switch (frame) {
    case 'pico': return `Among ${lc(ins(v.P, 'population'))}, what is the effect of ${lc(ins(v.I, 'intervention'))}, compared with ${lc(ins(v.C, 'comparison'))}, on ${lc(ins(v.O, 'outcome'))}${String(v.T ?? '').trim() ? ` over ${lc(v.T.trim())}` : ''}?`;
    case 'peco': return `Among ${lc(ins(v.P, 'population'))}, is ${lc(ins(v.E, 'exposure'))}, compared with ${lc(ins(v.C, 'comparator'))}, associated with ${lc(ins(v.O, 'outcome'))}?`;
    case 'dta': return `Among ${lc(ins(v.P, 'population'))}, how accurately does ${lc(ins(v.I, 'index test'))} detect ${lc(ins(v.D, 'target condition'))}, judged against ${lc(ins(v.R, 'reference standard'))}?`;
    case 'cocopop': return `What is the ${measure} of ${lc(ins(v.Co, 'condition'))} among ${lc(ins(v.Pop, 'population'))} in ${lc(ins(v.Ct, 'context'))}?`;
    case 'spider': return `What are the ${lc(ins(v.E, 'evaluation, such as experiences'))} of ${lc(ins(v.S, 'sample'))} regarding ${lc(ins(v.PI, 'phenomenon of interest'))}?`;
    default: return '';
  }
}

/** The topic as a noun phrase, for titles and objectives. */
function topic(frame, v, measure) {
  switch (frame) {
    case 'pico': return `Effect of ${lc(ins(v.I, 'intervention'))} on ${lc(ins(v.O, 'outcome'))}`;
    case 'peco': return `${ins(v.E, 'exposure')} and ${lc(ins(v.O, 'outcome'))}`;
    case 'dta': return `Accuracy of ${lc(ins(v.I, 'index test'))} for ${lc(ins(v.D, 'target condition'))}`;
    case 'cocopop': return `${measure[0].toUpperCase() + measure.slice(1)} of ${lc(ins(v.Co, 'condition'))}`;
    case 'spider': return `${ins(v.E, 'experiences')} of ${lc(ins(v.S, 'sample'))} regarding ${lc(ins(v.PI, 'phenomenon of interest'))}`;
    default: return '';
  }
}
const who = (frame, v) => lc(ins(frame === 'cocopop' ? v.Pop : frame === 'spider' ? v.S : v.P, 'population'));

/**
 * Titles that name the design, as STROBE and CONSORT ask (item 1a): a descriptive title with the
 * design after a colon, and a declarative or question form. designName is the design's usual name,
 * such as "a cross-sectional study"; place may be blank.
 */
export function titleOptions(frame, v = {}, { designName = '', place = '', measure = 'prevalence' } = {}) {
  const t = topic(frame, v, measure);
  const where = String(place).trim() || (frame === 'cocopop' ? String(v.Ct ?? '').trim() : '');
  const pl = where ? ` in ${where}` : '';
  const d = String(designName).trim() ? designName.trim() : '[INSERT: study design]';
  const article = /^[aeiou]/i.test(d) ? 'an' : 'a';
  const design = d.startsWith('[INSERT') ? d : `${article} ${lc(d)}`;
  const amongWho = frame === 'spider' ? '' : ` among ${who(frame, v)}`;
  return [
    { kind: 'Descriptive', text: `${t}${amongWho}${pl}: ${design}` },
    { kind: 'Question', text: `${questionText(frame, v, { measure }).replace(/\?$/, '')}${pl && frame !== 'cocopop' ? pl : ''}? ${design[0].toUpperCase() + design.slice(1)}` },
  ];
}

/** The primary objective, and secondary objectives to start from. */
export function objectivesFor(frame, v = {}, { measure = 'prevalence', design = '' } = {}) {
  const P = who(frame, v);
  switch (frame) {
    case 'pico': return {
      primary: `To compare ${lc(ins(v.O, 'outcome'))} between ${P} who receive ${lc(ins(v.I, 'intervention'))} and those who receive ${lc(ins(v.C, 'comparison'))}${String(v.T ?? '').trim() ? ` over ${lc(v.T.trim())}` : ''}.`,
      secondary: [`To compare adverse events between the groups.`, `To assess adherence to ${lc(ins(v.I, 'intervention'))}.`],
    };
    case 'peco': return {
      primary: `To determine the association between ${lc(ins(v.E, 'exposure'))} and ${lc(ins(v.O, 'outcome'))} among ${P}, compared with ${lc(ins(v.C, 'comparator'))}.`,
      secondary: [`To estimate the ${design === 'case-control' ? 'proportion of cases exposed' : 'frequency of the outcome'} among ${P}.`, `To identify other factors associated with ${lc(ins(v.O, 'outcome'))}.`],
    };
    case 'dta': return {
      primary: `To estimate the sensitivity and specificity of ${lc(ins(v.I, 'index test'))} for ${lc(ins(v.D, 'target condition'))} among ${P}, against ${lc(ins(v.R, 'reference standard'))}.`,
      secondary: [`To estimate the positive and negative predictive values at the prevalence found.`, `To find the cut-off with the best balance of sensitivity and specificity, if the test gives a score.`],
    };
    case 'cocopop': return {
      primary: `To estimate the ${measure} of ${lc(ins(v.Co, 'condition'))} among ${P} in ${lc(ins(v.Ct, 'context'))}.`,
      secondary: [`To identify factors associated with ${lc(ins(v.Co, 'condition'))} among ${P}.`],
    };
    case 'spider': return {
      primary: `To explore the ${lc(ins(v.E, 'experiences'))} of ${P} regarding ${lc(ins(v.PI, 'phenomenon of interest'))}.`,
      secondary: [`To identify what helps and what hinders ${P} in ${lc(ins(v.PI, 'phenomenon of interest'))}.`],
    };
    default: return { primary: '', secondary: [] };
  }
}

/**
 * Null and alternative hypotheses for the primary objective, or a note when the study estimates
 * rather than tests. aim: 'superiority' or 'non-inferiority' for interventions.
 */
export function hypothesesFor(frame, v = {}, { aim = 'superiority' } = {}) {
  const P = who(frame, v);
  if (frame === 'pico' && aim === 'non-inferiority') {
    return {
      h0: `Among ${P}, ${lc(ins(v.I, 'intervention'))} is worse than ${lc(ins(v.C, 'comparison'))} in ${lc(ins(v.O, 'outcome'))} by at least the non-inferiority margin of [INSERT: margin].`,
      h1: `Among ${P}, ${lc(ins(v.I, 'intervention'))} is worse than ${lc(ins(v.C, 'comparison'))} in ${lc(ins(v.O, 'outcome'))} by less than [INSERT: margin].`,
      sided: 'one-sided',
    };
  }
  if (frame === 'pico') {
    return {
      h0: `Among ${P}, ${lc(ins(v.O, 'outcome'))} does not differ between those who receive ${lc(ins(v.I, 'intervention'))} and those who receive ${lc(ins(v.C, 'comparison'))}.`,
      h1: `Among ${P}, ${lc(ins(v.O, 'outcome'))} differs between those who receive ${lc(ins(v.I, 'intervention'))} and those who receive ${lc(ins(v.C, 'comparison'))}.`,
      sided: 'two-sided',
    };
  }
  if (frame === 'peco') {
    return {
      h0: `Among ${P}, ${lc(ins(v.E, 'exposure'))} is not associated with ${lc(ins(v.O, 'outcome'))} (risk or odds ratio of 1).`,
      h1: `Among ${P}, ${lc(ins(v.E, 'exposure'))} is associated with ${lc(ins(v.O, 'outcome'))} (risk or odds ratio other than 1).`,
      sided: 'two-sided',
    };
  }
  return {
    note: frame === 'spider'
      ? 'Qualitative studies explore; they do not test hypotheses. State the aim and the research question instead.'
      : 'A study that estimates a prevalence or the accuracy of a test needs no hypothesis. State one only if you compare the estimate with a set value, such as a target or a published figure, and say which.',
  };
}

/** Variables to start the list from, with their roles. */
export function variablesFor(frame, v = {}) {
  const row = (name, role, type = '', definition = '') => ({ name, role, type, unit: '', definition, measure: '', when: '' });
  switch (frame) {
    case 'pico': return [row(ins(v.O, 'outcome'), 'Outcome'), row(ins(v.I, 'intervention'), 'Intervention', 'Binary', `${ins(v.I, 'intervention')} or ${lc(ins(v.C, 'comparison'))}`), row('Age', 'Confounder', 'Continuous'), row('Sex', 'Confounder', 'Binary')];
    case 'peco': return [row(ins(v.O, 'outcome'), 'Outcome'), row(ins(v.E, 'exposure'), 'Exposure'), row('Age', 'Confounder', 'Continuous'), row('Sex', 'Confounder', 'Binary')];
    case 'dta': return [row(ins(v.I, 'index test'), 'Index test'), row(ins(v.R, 'reference standard'), 'Reference standard'), row(ins(v.D, 'target condition'), 'Outcome', 'Binary')];
    case 'cocopop': return [row(ins(v.Co, 'condition'), 'Outcome'), row('Age', 'Descriptive', 'Continuous'), row('Sex', 'Descriptive', 'Binary')];
    default: return [];
  }
}

export const ROLES = ['Outcome', 'Exposure', 'Intervention', 'Index test', 'Reference standard', 'Confounder', 'Effect modifier', 'Descriptive'];
export const TYPES = ['Binary', 'Nominal', 'Ordinal', 'Continuous', 'Count', 'Time to event', 'Date', 'Text'];

/** FINER (Hulley's criteria, as set out by Farrugia and colleagues 2010): the checks to answer. */
export const FINER = [
  ['F', 'Feasible', [['subjects', 'Enough participants can be enrolled in the time you have'], ['expertise', 'You have, or can get, the skills and equipment the study needs'], ['afford', 'It is affordable in time and money'], ['scope', 'The scope is manageable: one main question']]],
  ['I', 'Interesting', [['interest', 'The answer interests you, your guide and the people who will use it']]],
  ['N', 'Novel', [['novel', 'It confirms, refutes or extends earlier findings, or adds new ones, in this setting']]],
  ['E', 'Ethical', [['ethical', 'An ethics committee can approve it: risks are small, consent is possible, and vulnerable groups are protected']]],
  ['R', 'Relevant', [['relevant', 'The answer matters for knowledge, for practice or policy, or for further research']]],
];

/** Weak points from FINER answers ({ key: 'yes' | 'no' | 'unsure' }). */
export function finerGaps(answers) {
  const out = [];
  for (const [letter, name, items] of FINER) for (const [key, text] of items) if (answers[key] && answers[key] !== 'yes') out.push({ letter, name, key, text, answer: answers[key] });
  return out;
}
