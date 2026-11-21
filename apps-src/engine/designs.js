/* Study design chooser: two question flows and the rules that turn answers into a design.
 *
 * Naming a study's design follows the classification of Grimes and Schulz (2002): whether the
 * investigators assigned the exposure, whether allocation was random, whether there was a
 * comparison group, and the direction of inquiry (exposure to outcome, outcome to exposure, or
 * both at one time). Diagnostic accuracy, agreement, prediction, reviews and qualitative studies
 * sit outside that tree and are asked about first.
 *
 * Planning a study follows the usual trade-offs: case-control studies for rare outcomes or long
 * latency, cohorts for rare exposures, incidence or several outcomes, cross-sectional studies for
 * states and fixed exposures, case-crossover for brief exposures and acute events, and randomised
 * trials whenever the intervention can be allocated by chance.
 *
 * Answers are plain objects of question key to option value. Each flow exposes the questions to
 * ask next (in order) and the design once enough is known; both ignore answers that the current
 * path does not use, so changing an early answer cannot leave a stale design behind.
 */

const opts = (list) => list.map(([value, label, hint]) => ({ value, label, hint }));

/* ------------------------------------------------------- name a design --- */

export const NAME_Q = {
  aim: { q: 'What was the study for?', opts: opts([
    ['effect', 'How common something is, or what causes or changes it', 'Studies of frequency, risk factors, treatments and programmes'],
    ['test', 'How accurate a test is against a reference standard'],
    ['agree', 'How far observers, instruments or methods agree'],
    ['predict', 'A score or model to predict an outcome for individuals'],
    ['review', 'Combining the results of earlier studies'],
    ['qual', "People's experiences, views or reasons, in their own words"],
  ]) },
  assign: { q: 'Did the investigators assign the exposure or intervention?', opts: opts([
    ['yes', 'Yes: they decided who received it', 'An experimental study'],
    ['no', 'No: they observed exposures that people already had or chose', 'An observational study'],
  ]) },
  alloc: { q: 'How was it allocated?', opts: opts([
    ['random', 'At random, with a comparison group'],
    ['nonrandom', 'Not at random, with a comparison group', 'By area, by alternation, or by choice'],
    ['none', 'No comparison group', 'One group measured before and after'],
  ]) },
  unitR: { q: 'What was randomised?', opts: opts([
    ['individuals', 'Individual participants'],
    ['clusters', 'Groups', 'Villages, schools, sub-centres or facilities'],
  ]) },
  crossover: { q: 'Did each participant receive the interventions in turn, in a random order?', opts: opts([
    ['no', 'No: each received one'],
    ['yes', 'Yes: each received both, one after the other'],
  ]) },
  steps: { q: 'Did the clusters switch to the intervention in steps, in a random order, until all had it?', opts: opts([
    ['no', 'No: each cluster stayed in its arm'],
    ['yes', 'Yes: a staged roll-out'],
  ]) },
  unitO: { q: 'Were the data about individuals, or only about groups?', opts: opts([
    ['individuals', 'Individuals'],
    ['groups', 'Groups only', 'Rates or averages for villages, districts, states or years'],
  ]) },
  series: { q: 'Was one outcome followed at many points in time, before and after a programme or policy began?', opts: opts([
    ['no', 'No: groups compared with each other'],
    ['yes', 'Yes: a series of time points around a start date'],
  ]) },
  compare: { q: 'Was there a comparison group?', hint: 'People without the exposure, or without the outcome', opts: opts([
    ['yes', 'Yes'],
    ['no', 'No', 'Only people with the condition, or one population described'],
  ]) },
  desc: { q: 'What did the study describe?', opts: opts([
    ['report', 'One patient, or a few'],
    ['series', 'A series of patients with the same condition or treatment'],
    ['survey', 'A sample of a defined population at one time'],
  ]) },
  direction: { q: 'In which direction did the study run?', opts: opts([
    ['forward', 'From exposure to outcome', 'People grouped by exposure (or a population enrolled), all free of the outcome, then followed to see who developed it'],
    ['backward', 'From outcome to exposure', 'People chosen because they had the outcome (cases) or did not (controls); their past exposure then compared'],
    ['same', 'Both at one time', 'Exposure and outcome measured together in one sample'],
  ]) },
  timing: { q: 'Had the outcomes already happened when the study began?', opts: opts([
    ['no', 'No: people were followed from the start of the study', 'Prospective'],
    ['yes', 'Yes: the cohort was assembled from past records and followed up to the present', 'Retrospective'],
  ]) },
  controls: { q: 'How were the controls chosen?', opts: opts([
    ['unmatched', 'A sample of people without the outcome', 'From the population that gave rise to the cases'],
    ['matched', 'Matched individually to each case', 'For example, on age, sex and village'],
    ['nested', 'From members of an existing cohort', 'Still at risk when each case occurred'],
    ['tnd', 'People who tested negative', 'Tested for the same disease at the same facilities'],
    ['self', 'No separate controls', "Each case compared with an earlier period of their own"],
  ]) },
  recruit: { q: 'How were participants recruited?', opts: opts([
    ['one', 'One group, all given both the test and the reference standard', 'A consecutive or random series of people in whom the test would be used'],
    ['two', 'Two groups recruited separately', 'People known to have the condition, and people known not to have it'],
  ]) },
  systematic: { q: 'Did the authors search systematically, with criteria for choosing and appraising studies set in advance?', opts: opts([
    ['yes', 'Yes'],
    ['no', 'No: studies chosen and summarised by the authors'],
  ]) },
};

/** The questions to show, in order, for the answers so far. */
export function nameQuestions(a) {
  const qs = ['aim'];
  if (a.aim === 'effect') {
    qs.push('assign');
    if (a.assign === 'yes') {
      qs.push('alloc');
      if (a.alloc === 'random') {
        qs.push('unitR');
        if (a.unitR === 'individuals') qs.push('crossover');
        if (a.unitR === 'clusters') qs.push('steps');
      }
    } else if (a.assign === 'no') {
      qs.push('unitO');
      if (a.unitO === 'groups') qs.push('series');
      if (a.unitO === 'individuals') {
        qs.push('compare');
        if (a.compare === 'no') qs.push('desc');
        if (a.compare === 'yes') {
          qs.push('direction');
          if (a.direction === 'forward') qs.push('timing');
          if (a.direction === 'backward') qs.push('controls');
        }
      }
    }
  }
  if (a.aim === 'test') qs.push('recruit');
  if (a.aim === 'review') qs.push('systematic');
  return qs;
}

const DESC = { report: 'case-report', series: 'case-series', survey: 'survey' };
const CONTROLS = { unmatched: 'case-control', matched: 'matched-cc', nested: 'nested-cc', tnd: 'tnd', self: 'case-crossover' };

/** The design named by the answers, as { id, variant }, or null while questions remain. */
export function nameDesign(a) {
  switch (a.aim) {
    case 'test': return a.recruit ? { id: a.recruit === 'one' ? 'diagnostic' : 'diagnostic-cc' } : null;
    case 'agree': return { id: 'agreement' };
    case 'predict': return { id: 'prediction' };
    case 'review': return a.systematic ? { id: a.systematic === 'yes' ? 'srma' : 'narrative' } : null;
    case 'qual': return { id: 'qualitative' };
    case 'effect': break;
    default: return null;
  }
  if (a.assign === 'yes') {
    if (a.alloc === 'nonrandom') return { id: 'nrct' };
    if (a.alloc === 'none') return { id: 'before-after' };
    if (a.alloc === 'random') {
      if (a.unitR === 'individuals' && a.crossover) return { id: a.crossover === 'yes' ? 'crossover' : 'rct' };
      if (a.unitR === 'clusters' && a.steps) return { id: a.steps === 'yes' ? 'stepped-wedge' : 'cluster-rct' };
    }
    return null;
  }
  if (a.assign === 'no') {
    if (a.unitO === 'groups') return a.series ? { id: a.series === 'yes' ? 'its' : 'ecological' } : null;
    if (a.unitO !== 'individuals') return null;
    if (a.compare === 'no') return a.desc ? { id: DESC[a.desc] } : null;
    if (a.compare !== 'yes') return null;
    if (a.direction === 'same') return { id: 'cross-sectional' };
    if (a.direction === 'forward') return a.timing ? { id: 'cohort', variant: a.timing === 'yes' ? 'retrospective' : 'prospective' } : null;
    if (a.direction === 'backward') return a.controls ? { id: CONTROLS[a.controls] } : null;
  }
  return null;
}

/** The nodes of the Grimes and Schulz (2002) tree that the answers so far pass through. */
export function treePath(a) {
  if (a.aim !== 'effect') return [];
  const p = ['assign'];
  if (a.assign === 'yes') {
    p.push('exp');
    if (a.alloc === 'random') p.push('rct');
    else if (a.alloc) p.push('nrct');
  } else if (a.assign === 'no') {
    p.push('obs');
    if (a.unitO === 'individuals') {
      if (a.compare === 'no') p.push('desc');
      if (a.compare === 'yes') {
        p.push('anal');
        if (a.direction) p.push({ forward: 'cohort', backward: 'cc', same: 'cross' }[a.direction]);
      }
    }
  }
  return p;
}

/** Rows of the tree as drawn: [id, depth, text]. */
export const TREE = [
  ['assign', 0, 'Did investigators assign the exposure?'],
  ['exp', 1, 'Yes: experimental. Random allocation?'],
  ['rct', 2, 'Yes: randomised controlled trial'],
  ['nrct', 2, 'No: non-randomised trial'],
  ['obs', 1, 'No: observational. Comparison group?'],
  ['desc', 2, 'No: descriptive study'],
  ['anal', 2, 'Yes: analytical. Direction?'],
  ['cohort', 3, 'Exposure to outcome: cohort'],
  ['cc', 3, 'Outcome to exposure: case-control'],
  ['cross', 3, 'At one time: cross-sectional'],
];

/* ----------------------------------------------------- plan a new study --- */

export const PLAN_Q = {
  goal: { q: 'What do you want to find out?', opts: opts([
    ['prevalence', 'How common a condition, behaviour or coverage is', 'Prevalence, or a mean level, at one time'],
    ['incidence', 'How often new cases occur', 'Risk or rate over a period'],
    ['cause', 'Whether an exposure or risk factor is linked to an outcome'],
    ['effect', 'Whether a treatment, programme or other intervention works'],
    ['vaccine', 'How well a vaccine protects in routine use'],
    ['test', 'How accurate a test or screening tool is'],
    ['agree', 'Whether observers, instruments or methods agree'],
    ['predict', 'Who is likely to develop an outcome', 'A risk score or prediction model'],
    ['groups', 'Patterns across places or years, from group-level data', 'District, state or yearly figures from HMIS, survey fact sheets or the census'],
    ['cases', 'An unusual patient, or a set of patients with one condition'],
    ['views', 'How people experience or explain something, in their own words'],
    ['review', 'What earlier studies show when combined'],
  ]) },
  compareP: { q: 'Will you compare prevalence between groups in the sample?', opts: opts([
    ['no', 'No: describing how common it is'],
    ['yes', 'Yes', 'For example, by sex, residence or wealth quintile'],
  ]) },
  clusterP: { q: 'Will you sample clusters rather than individuals from a list?', hint: 'Villages, households or schools chosen first, then people within them', opts: opts([
    ['no', 'No: individuals from a list'],
    ['yes', 'Yes: cluster sampling'],
  ]) },
  acute: { q: 'Is the exposure brief and the outcome sudden, with any effect expected soon after?', hint: 'For example, heavy exertion before a heart attack, or a sedative dose before a fall', opts: opts([
    ['no', 'No'],
    ['yes', 'Yes'],
  ]) },
  outcomeRare: { q: 'How common is the outcome among the people you could study?', opts: opts([
    ['rare', 'Rare, or it appears years after exposure', 'For example, a cancer or a birth defect'],
    ['common', 'Common enough to count in the time you have'],
  ]) },
  exposureRare: { q: 'How common is the exposure?', opts: opts([
    ['common', 'Common: many people have it'],
    ['rare', 'Rare', 'A particular occupation, drug or local source, such as work in a mine'],
  ]) },
  fixed: { q: 'Does the exposure stay the same for life, or is the outcome a current state rather than an event?', hint: 'Fixed exposures: sex, blood group, sickle cell status. States: anaemia, hypertension, a behaviour', opts: opts([
    ['no', 'No'],
    ['yes', 'Yes'],
  ]) },
  records: { q: 'Do records already show, for each person, when follow-up began and whether the outcome occurred?', hint: 'For example, registers, programme records or hospital files', opts: opts([
    ['no', 'No: people must be followed from now'],
    ['yes', 'Yes: the records cover the follow-up'],
  ]) },
  assignP: { q: 'Can you decide who receives the intervention, ethically and in practice?', opts: opts([
    ['yes', 'Yes'],
    ['no', 'No', 'It is already running, or set by policy'],
  ]) },
  randomP: { q: 'Can allocation be random?', opts: opts([
    ['yes', 'Yes'],
    ['no', 'No', 'It must go to chosen areas or people'],
  ]) },
  levelP: { q: 'Is the intervention delivered to whole groups, or would it spread to others nearby?', hint: 'Village health education, ASHA-led activities, water supply, school programmes', opts: opts([
    ['individuals', 'No: given to individuals, one by one'],
    ['groups', 'Yes: delivered to groups, or likely to spread'],
  ]) },
  stagedP: { q: 'Must every cluster receive the intervention in the end, rolled out in stages?', opts: opts([
    ['no', 'No'],
    ['yes', 'Yes: a staged roll-out'],
  ]) },
  chronicP: { q: 'Is the condition stable and long-lasting, and the effect of treatment short-lived?', hint: 'If so, each person can take both treatments in turn', opts: opts([
    ['no', 'No'],
    ['yes', 'Yes'],
  ]) },
  niP: { q: 'Is the aim to show that a new option is no worse than the standard?', hint: 'Cheaper, simpler or safer, and accepted if it is not worse by more than a set margin', opts: opts([
    ['no', 'No: to show that it is better'],
    ['yes', 'Yes: non-inferiority'],
  ]) },
  seriesP: { q: 'Do routine data cover many time points before and after it started?', hint: 'For example, monthly HMIS indicators over several years', opts: opts([
    ['no', 'No'],
    ['yes', 'Yes'],
  ]) },
  controlP: { q: 'Can you find a comparison group that did not receive it, measured before and after?', opts: opts([
    ['yes', 'Yes'],
    ['no', 'No'],
  ]) },
  vdata: { q: 'What data can you get?', opts: opts([
    ['outbreak', 'An outbreak, or a defined group followed up', 'Vaccination status known for everyone'],
    ['register', 'A register with dates of vaccination and follow-up time'],
    ['casecontrol', 'Cases, and controls from the same community'],
    ['tested', 'Everyone tested for the disease at health facilities', 'Positive or negative'],
    ['coverage', "Cases' vaccination status, and coverage in their population", 'Cases from surveillance; coverage from a survey or records'],
  ]) },
  spectrum: { q: 'Can everyone in a series of people in whom the test would be used receive both the test and the reference standard?', hint: 'People suspected of the condition, or everyone screened', opts: opts([
    ['yes', 'Yes'],
    ['no', 'No: only known cases and known non-cases are available'],
  ]) },
  seriesG: { q: 'Do you want to see change after a programme or policy, over many time points?', opts: opts([
    ['no', 'No: comparing places or groups'],
    ['yes', 'Yes'],
  ]) },
  howMany: { q: 'How many patients?', opts: opts([
    ['one', 'One, or a few'],
    ['many', 'A series'],
  ]) },
};

/** The questions to show, in order, for the answers so far. */
export function planQuestions(a) {
  const qs = ['goal'];
  switch (a.goal) {
    case 'prevalence': qs.push('compareP', 'clusterP'); break;
    case 'incidence': qs.push('records'); break;
    case 'cause':
      qs.push('acute');
      if (a.acute === 'no') {
        qs.push('outcomeRare', 'exposureRare');
        const r = a.outcomeRare, e = a.exposureRare;
        if (r === 'common' && e === 'common') {
          qs.push('fixed');
          if (a.fixed === 'no') qs.push('records');
        } else if (r && e && !(r === 'rare' && e === 'common')) qs.push('records');
      }
      break;
    case 'effect':
      qs.push('assignP');
      if (a.assignP === 'yes') {
        qs.push('randomP');
        if (a.randomP === 'yes') {
          qs.push('levelP');
          if (a.levelP === 'groups') qs.push('stagedP');
          if (a.levelP === 'individuals') {
            qs.push('chronicP');
            if (a.chronicP === 'no') qs.push('niP');
          }
        }
      } else if (a.assignP === 'no') {
        qs.push('seriesP');
        if (a.seriesP === 'no') qs.push('controlP');
      }
      break;
    case 'vaccine': qs.push('vdata'); break;
    case 'test': qs.push('spectrum'); break;
    case 'groups': qs.push('seriesG'); break;
    case 'cases': qs.push('howMany'); break;
    default: break;
  }
  return qs;
}

const cohortOf = (records) => (records === 'yes'
  ? { variant: 'retrospective', why: 'The records already cover the follow-up, so a retrospective (historical) cohort is quicker and cheaper than following people from now.' }
  : { variant: 'prospective', why: 'Without records that cover the follow-up, people must be followed forward from now (a prospective cohort).' });

/**
 * The recommended design for a new study, or null while questions remain:
 * { id, variant, why: [reasons], alts: [{ id, why }], extra: [handovers to show first], cluster }.
 * `extra` items are { tool, preset, label }; `cluster` marks sample sizes that need a design effect.
 */
export function planDesign(a) {
  const out = (id, why, more = {}) => ({ id, variant: null, why, alts: [], extra: [], cluster: null, ...more });
  switch (a.goal) {
    case 'prevalence': {
      if (!a.compareP || !a.clusterP) return null;
      const why = ['Prevalence comes from a sample of the population, each person studied once.'];
      if (a.compareP === 'yes') why.push('Comparing groups within the sample makes it an analytical cross-sectional study: report prevalence ratios, not only prevalences.');
      if (a.clusterP === 'yes') why.push('Cluster sampling makes people in the same cluster alike, so the sample size needs a design effect and the confidence intervals must allow for clustering.');
      return out(a.compareP === 'yes' ? 'cross-sectional' : 'survey', why, { cluster: a.clusterP === 'yes' ? 'de' : null });
    }
    case 'incidence': {
      if (!a.records) return null;
      const c = cohortOf(a.records);
      return out('cohort', ['Incidence needs people free of the outcome at the start, followed over time to count new cases.', c.why], {
        variant: c.variant, alts: [{ id: 'survey', why: 'Gives prevalence, not incidence; use it only if prevalence answers the question.' }],
      });
    }
    case 'cause': {
      if (!a.acute) return null;
      if (a.acute === 'yes') return out('case-crossover', ['A brief exposure that may trigger a sudden event fits a case-crossover design: each case is compared with their own earlier periods, so controls need not be found.'], {
        alts: [{ id: 'case-control', why: 'If exposure in earlier periods cannot be recalled or recorded precisely, compare cases with separate controls.' }],
      });
      const r = a.outcomeRare, e = a.exposureRare;
      if (!r || !e) return null;
      if (r === 'rare' && e === 'common') return out('case-control', ['The outcome is rare or slow to appear, so start from cases: a cohort would need very many people followed for a long time to see enough of them.', 'The exposure is common, so enough controls and cases will have it.'], {
        alts: [{ id: 'nested-cc', why: 'If a cohort with stored records or samples already exists, sample cases and controls from it.' }, { id: 'cohort', why: 'Only with a very large population and long follow-up, as in registries.' }],
      });
      if (r === 'common' && e === 'common') {
        if (!a.fixed) return null;
        if (a.fixed === 'yes') return out('cross-sectional', ['The exposure does not change, or the outcome is a current state, so one visit can measure both without confusing their order.', 'Both are common, so a single sample will contain enough people with each.'], {
          alts: [{ id: 'cohort', why: 'To show that the exposure came first, or to measure incidence rather than prevalence.' }],
        });
        if (!a.records) return null;
        const c = cohortOf(a.records);
        return out('cohort', ['Both are common, so following exposed and unexposed people will produce enough cases, with the exposure measured before the outcome.', c.why], {
          variant: c.variant,
          alts: [{ id: 'case-control', why: 'Quicker when time is short, at the cost of more room for selection and recall bias.' }, { id: 'cross-sectional', why: 'A quick first look; it cannot show which came first.' }],
        });
      }
      if (!a.records) return null;
      if (e === 'rare' && r === 'common') {
        const c = cohortOf(a.records);
        return out('cohort', ['The exposure is rare, so choose people by exposure: a cohort of the exposed (a workforce, users of a drug) and a comparable unexposed group.', 'The outcome is common enough to occur during follow-up.', c.why], { variant: c.variant });
      }
      // both rare
      if (a.records === 'yes') return out('cohort', ['Both are rare. A register of the exposed (for example, workers in a mine) followed through records gathers enough exposed people, and the records supply the outcomes.', cohortOf('yes').why], {
        variant: 'retrospective', alts: [{ id: 'case-control', why: 'Starts from the rare outcome instead; check that enough cases will have been exposed.' }],
      });
      return out('case-control', ['Both are rare. Starting from cases is usually the only way to see enough of the outcome.', 'With a rare exposure, few cases or controls may have it: check in the sample size that enough cases will have been exposed, and consider several controls per case.'], {
        alts: [{ id: 'cohort', why: 'If a group with the exposure (a workforce, a register) can be followed, choose people by exposure instead.' }],
      });
    }
    case 'effect': {
      if (!a.assignP) return null;
      if (a.assignP === 'yes') {
        if (!a.randomP) return null;
        if (a.randomP === 'no') return out('nrct', ['The intervention can be assigned but not at random, so a comparison group measured before and after is the next best protection against bias.'], {
          alts: [{ id: 'stepped-wedge', why: 'If the programme will reach every area anyway, randomising the order of roll-out may be acceptable.' }, { id: 'cluster-rct', why: 'Even a modest number of randomised clusters protects against selection bias better than chosen areas.' }],
        });
        if (!a.levelP) return null;
        if (a.levelP === 'groups') {
          if (!a.stagedP) return null;
          return a.stagedP === 'yes'
            ? out('stepped-wedge', ['The intervention acts on groups, so clusters are randomised.', 'Every cluster must receive it in the end, so randomise the order in which clusters start.'], { alts: [{ id: 'cluster-rct', why: 'Simpler and shorter if a control arm can wait until the trial ends.' }] })
            : out('cluster-rct', ['The intervention acts on groups or would spread between people nearby, so groups are randomised and outcomes measured in individuals.'], { alts: [{ id: 'stepped-wedge', why: 'If every cluster must receive the intervention in the end.' }] });
        }
        if (!a.chronicP) return null;
        if (a.chronicP === 'yes') return out('crossover', ['The condition is stable and the treatment effect short-lived, so each person can take both treatments in turn and serve as their own control, needing fewer participants.'], {
          alts: [{ id: 'rct', why: 'If carry-over between periods cannot be ruled out, or drop-outs are likely.' }],
        });
        if (!a.niP) return null;
        return a.niP === 'yes'
          ? out('ni-trial', ['The intervention can be allocated at random to individuals.', 'The question is whether the new option is no worse than the standard by more than a margin set in advance.'])
          : out('rct', ['The intervention can be allocated at random to individuals: randomisation balances known and unknown confounders between the groups.']);
      }
      if (!a.seriesP) return null;
      if (a.seriesP === 'yes') return out('its', ['The intervention cannot be assigned, but routine data cover many time points before and after it began, so the change in level and trend can be separated from the trend already present.'], {
        alts: [{ id: 'nrct', why: 'Add a comparison area that did not receive it, as a controlled before-after study.' }],
      });
      if (!a.controlP) return null;
      return a.controlP === 'yes'
        ? out('nrct', ['The intervention cannot be assigned, but a comparison group measured before and after allows the change in the two groups to be compared (difference in differences).'])
        : out('before-after', ['With no comparison group and no long series, only a before-after comparison is possible; it cannot separate the intervention from other changes over the same time.'], {
          alts: [{ id: 'cohort', why: 'Compare people who did and did not receive the intervention, adjusting for how they differ.' }],
        });
    }
    case 'vaccine': {
      const V = {
        outbreak: out('cohort', ['Vaccination status is known for everyone in the group, so attack rates in the vaccinated and unvaccinated give VE = 1 − risk ratio.'], {
          extra: [{ tool: 'vaccines', preset: { tab: 've', design: 'cohort' }, label: 'Vaccine effectiveness from attack rates' }],
        }),
        register: out('cohort', ['A register with dates gives person-time vaccinated and unvaccinated, so VE = 1 − rate ratio, even when people move between groups.'], {
          extra: [{ tool: 'vaccines', preset: { tab: 've', design: 'pt' }, label: 'Vaccine effectiveness from person-time' }],
        }),
        casecontrol: out('case-control', ['Starting from cases is efficient when the disease is uncommon; VE = 1 − odds ratio.'], {
          extra: [{ tool: 'vaccines', preset: { tab: 've', design: 'case-control' }, label: 'Vaccine effectiveness from cases and controls' }],
          alts: [{ id: 'matched-cc', why: 'Match controls to cases on age and locality when those strongly affect both vaccination and disease.' }],
        }),
        tested: out('tnd', ['People tested at the same facilities share care-seeking habits, so test-negative controls limit that bias; VE = 1 − odds ratio.'], {
          extra: [{ tool: 'vaccines', preset: { tab: 've', design: 'tnd' }, label: 'Vaccine effectiveness, test-negative design' }],
        }),
        coverage: out('screening-method', ["With only cases' vaccination status and coverage in their population, the screening method gives a quick first estimate."], {
          extra: [{ tool: 'vaccines', preset: { tab: 've', design: 'screening' }, label: 'Vaccine effectiveness by the screening method' }],
          alts: [{ id: 'case-control', why: 'For an estimate that can be adjusted for confounders.' }],
        }),
      };
      return V[a.vdata] || null;
    }
    case 'test':
      if (!a.spectrum) return null;
      return a.spectrum === 'yes'
        ? out('diagnostic', ['Testing everyone in a series of people in whom the test would be used gives accuracy as it will be in practice, and predictive values at that prevalence.'])
        : out('diagnostic-cc', ['Only known cases and non-cases are available, so it is a two-gate design: suitable for a first check of a new test, but expect accuracy higher than in practice.'], {
          alts: [{ id: 'diagnostic', why: 'Needed before the test is used in practice.' }],
        });
    case 'agree': return out('agreement', ['The same subjects measured or classified by each observer, instrument or method show how far they agree.']);
    case 'predict': return out('prediction', ['Predictors measured at the start and the outcome followed up, in enough people with the outcome, give a model that can then be validated.']);
    case 'groups':
      if (!a.seriesG) return null;
      return a.seriesG === 'yes'
        ? out('its', ['Many time points before and after a start date separate the change from the trend already present.'])
        : out('ecological', ['Group-level data compare places or groups; conclusions apply to the groups, not to the people in them.']);
    case 'cases':
      if (!a.howMany) return null;
      return a.howMany === 'one'
        ? out('case-report', ['One patient, or a few, described in detail.'])
        : out('case-series', ['A series of patients with the same condition, described together.']);
    case 'views': return out('qualitative', ['Experiences, beliefs and reasons are best explored in participants\' own words.']);
    case 'review': return out('srma', ['Earlier studies found by a systematic search, appraised and, where they are similar enough, combined.']);
    default: return null;
  }
}

/** Every design id either flow can return, for tests and the full list. */
export const FLOW_IDS = ['rct', 'ni-trial', 'crossover', 'cluster-rct', 'stepped-wedge', 'nrct', 'before-after', 'its',
  'cohort', 'case-control', 'matched-cc', 'nested-cc', 'case-crossover', 'tnd', 'screening-method', 'cross-sectional',
  'case-report', 'case-series', 'survey', 'ecological', 'diagnostic', 'diagnostic-cc', 'agreement', 'prediction',
  'srma', 'narrative', 'qualitative'];
