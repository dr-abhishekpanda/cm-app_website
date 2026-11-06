/* Every module in the shared source. Each app picks modules by the `apps` list.
 * status: 'ready' (built and tested) or 'planned' (shown only in review builds, with its phase).
 * apps: research, epi, biostats, cm-epi-bio, cm-app
 */
import PValuesTool from './tools/p-values.jsx';
import PValuesLesson from './learn/p-values.jsx';
import PValuesPractice from './practice/p-values.jsx';
import DescribeTool from './tools/describe.jsx';
import TestsTool from './tools/tests.jsx';
import SampleSizeTool from './tools/samplesize.jsx';
import RegressionTool from './tools/regression.jsx';
import SurvivalTool from './tools/survival.jsx';
import AgreementTool from './tools/agreement.jsx';
import MetaTool from './tools/meta.jsx';
import ResultsTool from './tools/results.jsx';

export const STAGES = [
  { id: 'plan', label: 'Plan', blurb: 'Frame the question, search the literature, set objectives.' },
  { id: 'design', label: 'Design', blurb: 'Choose the design, the sampling and the sample size.' },
  { id: 'prepare', label: 'Prepare', blurb: 'Build the tools, the data plan, the ethics file and the protocol.' },
  { id: 'analyse', label: 'Analyse', blurb: 'Describe the data, test, estimate and model.' },
  { id: 'synthesise', label: 'Synthesise', blurb: 'Systematic reviews and meta-analysis.' },
  { id: 'report', label: 'Report', blurb: 'Write it up, check it against the guidelines, publish.' },
];

const ALL = ['research', 'epi', 'biostats', 'cm-epi-bio'];
const R = ['research'];
const RB = ['research', 'biostats', 'cm-epi-bio'];
const RE = ['research', 'epi', 'cm-epi-bio'];

export const MODULES = [
  // ---------------------------------------------------------------- ready
  {
    id: 'p-values', stage: 'analyse', status: 'ready', apps: RB,
    title: 'p-Values and Critical Values', tag: 'Statistics',
    summary: 'Exact p-values and critical values for z, t, chi-square and F; exact binomial and Poisson probabilities.',
    keywords: 'p value critical value significance alpha t z chi square F binomial poisson tables',
    tool: PValuesTool, lesson: PValuesLesson, practice: PValuesPractice,
  },

  // -------------------------------------------------------------- planned
  { id: 'question', stage: 'plan', phase: 3, apps: R, tag: 'Workflow', title: 'Research Question Builder', summary: 'FINER check, PICO, PECO and SPIDER frames, and a title that matches the design.' },
  { id: 'literature', stage: 'plan', phase: 3, apps: R, tag: 'Workflow', title: 'Literature Search and References', summary: 'PubMed search builder with MeSH, live hit counts when online, RIS export and Vancouver style.' },
  { id: 'objectives', stage: 'plan', phase: 3, apps: R, tag: 'Workflow', title: 'Objectives, Hypotheses and Variables', summary: 'SMART objectives, null and alternative hypotheses, outcome and exposure definitions.' },

  { id: 'design-chooser', stage: 'design', phase: 2, apps: ['research', 'epi', 'cm-epi-bio'], tag: 'Epidemiology', title: 'Study Design Chooser', summary: 'Three questions about how participants were selected decide the design and the right measures.' },
  { id: 'sampling', stage: 'design', phase: 3, apps: R, tag: 'Workflow', title: 'Sampling and Randomisation', summary: 'Probability and non-probability sampling, cluster and PPS selection, randomisation lists.' },
  {
    id: 'sample-size', stage: 'design', status: 'ready', apps: ALL, tag: 'Statistics', title: 'Sample Size and Power',
    summary: 'Seventeen designs, from a prevalence survey to a non-inferiority trial, with the formula, its source, a power curve and a protocol sentence.',
    keywords: 'sample size power prevalence proportion mean case control cohort odds ratio risk ratio trial survival log rank anova correlation regression non-inferiority design effect cluster icc non response fleiss',
    tool: SampleSizeTool,
  },
  { id: 'trials', stage: 'design', phase: 3, apps: R, tag: 'Workflow', title: 'Trials and Operational Research', summary: 'Parallel, cluster, crossover and stepped-wedge trials; OR and implementation frameworks.' },
  { id: 'qualitative', stage: 'design', phase: 3, apps: R, tag: 'Workflow', title: 'Qualitative and Mixed Methods', summary: 'Designs, saturation, interview and FGD guides, thematic analysis, COREQ and SRQR.' },

  { id: 'questionnaire', stage: 'prepare', phase: 3, apps: R, tag: 'Workflow', title: 'Questionnaire Design and Validation', summary: 'Item writing, translation, content validity index and reliability.' },
  { id: 'data-management', stage: 'prepare', phase: 3, apps: R, tag: 'Workflow', title: 'Data Management', summary: 'Codebook and CRF builder, spreadsheet and Epi Info templates, cleaning checks.' },
  { id: 'ethics', stage: 'prepare', phase: 3, apps: R, tag: 'Workflow', title: 'Ethics and Registration', summary: 'ICMR 2017 guidance, consent form builder, review categories and the CTRI checklist.' },
  { id: 'protocol', stage: 'prepare', phase: 3, apps: R, tag: 'Workflow', title: 'Protocol and Synopsis Builder', summary: 'Section by section, exported as DOCX in the format your university or IEC uses.' },
  { id: 'grant', stage: 'prepare', phase: 3, apps: R, tag: 'Workflow', title: 'Grant and Project Tools', summary: 'Timeline, budget, and ICMR proposal structures.' },

  {
    id: 'describe', stage: 'analyse', status: 'ready', apps: RB, tag: 'Statistics', title: 'Describe Your Data',
    summary: 'Paste or open a dataset: summaries, the shape of each distribution, frequency tables and plots, by group if you like.',
    keywords: 'descriptive mean median sd iqr normality shapiro wilk histogram box plot frequency table percentage skewness',
    tool: DescribeTool,
  },
  {
    id: 'tests', stage: 'analyse', status: 'ready', apps: RB, tag: 'Statistics', title: 'Choose and Run a Test',
    summary: 'A guided choice of test, then the result with its 95% CI, effect size, checks, post hoc comparisons and a sentence for your paper.',
    keywords: 't test anova mann whitney wilcoxon kruskal friedman chi square fisher mcnemar cochran correlation pearson spearman kendall proportion tukey bonferroni holm',
    tool: TestsTool,
  },
  {
    id: 'regression', stage: 'analyse', status: 'ready', apps: RB, tag: 'Statistics', title: 'Regression',
    summary: 'Linear and logistic regression with categorical predictors and interactions: adjusted estimates, term tests, ROC area, Hosmer-Lemeshow and model checks.',
    keywords: 'regression linear logistic multiple multivariable adjusted odds ratio coefficient r squared vif hosmer lemeshow roc auc two-way anova interaction',
    tool: RegressionTool,
  },
  {
    id: 'survival', stage: 'analyse', status: 'ready', apps: RB, tag: 'Statistics', title: 'Survival Analysis',
    summary: 'Kaplan-Meier curves with numbers at risk, median survival, the log-rank test and Cox hazard ratios.',
    keywords: 'survival kaplan meier log rank cox proportional hazards hazard ratio median survival censoring time to event',
    tool: SurvivalTool,
  },
  {
    id: 'agreement', stage: 'analyse', status: 'ready', apps: RB, tag: 'Statistics', title: 'Agreement and Reliability',
    summary: "Cohen's and weighted kappa, Fleiss' kappa, the intraclass correlation with a guide to its forms, Bland-Altman limits of agreement and Cronbach's alpha.",
    keywords: 'agreement reliability kappa cohen weighted fleiss inter-rater intra-rater observer icc intraclass correlation bland altman limits of agreement method comparison cronbach alpha internal consistency scale items questionnaire validation',
    tool: AgreementTool,
  },
  { id: 'measures', stage: 'analyse', phase: 2, apps: RE, tag: 'Epidemiology', title: 'Frequency, Association and Impact', summary: 'Rates and proportions; OR, RR and PR with CIs; attributable and preventable fractions.' },
  { id: 'diagnostic', stage: 'analyse', phase: 2, apps: RE, tag: 'Epidemiology', title: 'Diagnostic Accuracy and ROC', summary: 'Sensitivity, specificity, predictive values at any prevalence, likelihood ratios, ROC curves.' },
  { id: 'stratified', stage: 'analyse', phase: 2, apps: RE, tag: 'Epidemiology', title: 'Confounding and Standardisation', summary: 'Mantel–Haenszel estimates, effect modification, direct and indirect standardisation.' },
  { id: 'vaccines', stage: 'analyse', phase: 2, apps: RE, tag: 'Epidemiology', title: 'Vaccine and Screening Measures', summary: 'Vaccine efficacy and effectiveness, serial and parallel testing.' },
  { id: 'economics', stage: 'analyse', phase: 3, apps: R, tag: 'Workflow', title: 'Health Economics Basics', summary: 'Costing, ICER, DALYs and QALYs.' },

  { id: 'srma', stage: 'synthesise', phase: 3, apps: R, tag: 'Workflow', title: 'Systematic Review Workflow', summary: 'Protocol, search, screening, extraction, risk of bias, GRADE and the PRISMA flow diagram.' },
  {
    id: 'meta-analysis', stage: 'synthesise', status: 'ready', apps: R, tag: 'Statistics', title: 'Meta-Analysis',
    summary: 'Pool odds ratios, risk ratios, mean differences, SMDs, proportions or reported estimates: fixed and random effects, heterogeneity, subgroups, forest and funnel plots.',
    keywords: 'meta-analysis meta analysis systematic review srma pooled forest plot funnel plot heterogeneity i2 tau random effects fixed effect dersimonian laird paule mandel reml hartung knapp prediction interval subgroup egger publication bias prevalence pooled proportion',
    tool: MetaTool,
  },

  {
    id: 'results-text', stage: 'report', status: 'ready', apps: RB, tag: 'Statistics', title: 'Results to Text and Table 1',
    summary: 'Table 1 of participant characteristics with a first-draft paragraph, and every sentence and table you add from the tools, gathered for Word.',
    keywords: 'table 1 baseline characteristics participants demographic table results section write up word copy report sentences my results thesis dissertation manuscript',
    tool: ResultsTool,
  },
  { id: 'reporting', stage: 'report', phase: 3, apps: R, tag: 'Workflow', title: 'Reporting Checklists and Appraisal', summary: 'STROBE, CONSORT, STARD, PRISMA and more; critical appraisal checklists.' },
  { id: 'writing', stage: 'report', phase: 3, apps: R, tag: 'Workflow', title: 'Writing and Publishing', summary: 'IMRAD scaffold, journal checks, authorship and AI-disclosure statements.' },
  { id: 'code-export', stage: 'report', phase: 1, apps: RB, tag: 'Statistics', title: 'Code Export', summary: 'Every analysis as a ready-to-run R or Python script.' },
];

export function modulesFor(appId, { includePlanned }) {
  return MODULES.filter((m) => m.apps.includes(appId) && (includePlanned || m.status === 'ready'));
}
