# Roadmap

Five apps from one shared source. #RESEARCH-APP leads; the other four are subsets or extensions of the same modules. Each phase lands as one pull request on its own branch.

## Phases

| Phase | Scope | Main deliverables | Status |
|---|---|---|---|
| 0 | Foundations | Shared engine (special functions, distributions), UI kit, build to one offline file, service worker, icons, tests, first module (p-values: tool, lesson, practice) | Done (PR #4) |
| 1 | Statistics engine and tools | Describe data (upload or paste), test chooser and runner with effect sizes and CIs, sample size and power, regression (linear, logistic), survival (Kaplan-Meier, log-rank), agreement and reliability (kappa, weighted kappa, ICC, Bland-Altman, Cronbach's alpha), meta-analysis (fixed and random effects, heterogeneity, forest and funnel plots), results-to-text and Table 1, R and Python code export | Done: 1a (describe, tests), 1b (sample size), 1c (regression, survival), 1d (agreement, meta-analysis), 1e (Table 1, My results) and 1f (R and Python code export) |
| 2 | Epidemiology engine and tools | Study design chooser; frequency, association and impact measures with exact and Mantel-Haenszel CIs (Mantel-Haenszel and Peto pooling then join the meta-analysis tool); diagnostic accuracy and ROC; confounding, effect modification, direct and indirect standardisation; vaccine efficacy and effectiveness, screening programmes; outbreak toolkit (for #EPI-APP and #CM-APP) | Done: 2a (frequency, association, impact), 2b (confounding, standardisation), 2c (diagnostic accuracy, ROC), 2d (vaccines, screening), 2e (study design chooser) and 2f (outbreak toolkit, with the #EPI-APP scaffold) |
| 3 | Research workflow | Research question builder (FINER, PICO, PECO, SPIDER); literature search and references; objectives and hypotheses; sampling and randomisation; questionnaire design and validation; data management (codebook, CRF); ethics and registration (ICMR 2017, consent forms, CTRI); protocol and synopsis builder with DOCX export; trials and operational research; qualitative and mixed methods; systematic review workflow (PRISMA, risk of bias, GRADE); reporting checklists and appraisal; writing and publishing; grant and project tools; health economics basics | In progress: 3a (research question, objectives and hypotheses, variables; the shared study plan) done |
| 4 | Learn and Practice | A lesson at three depths and a seeded practice set for every module; teacher set numbers | Planned |
| 5 | AI Mode | Restricted-access research assistant: marking typed answers, tutor, plan review, biostatistician chat. Coach by default; drafting only for faculty codes, with an AI-disclosure reminder. Individual access codes, a server-side proxy and usage limits | Planned |
| 6 | #EPI-APP and #BIOSTATS-APP | Derived from the shared modules with their own configs, icons and home pages; one bundle per app, carrying only its own modules; code export headers that name the app | Planned (#EPI-APP scaffolded in 2f to host the outbreak toolkit) |
| 7 | #CM-EPI-BIO-APP and #CM-APP | The community medicine toolkit: SES scales (corrected), nutrition (WHO growth standards), benchmarks with sources, programme calculators, alongside the epidemiology and statistics modules | Planned |
| 8 | Audit and launch | Accuracy audit against references, accessibility review, phone testing, homepage links, retirement of the old builds | Planned |

## Phase 2 Waves

| Wave | Scope | Status |
|---|---|---|
| 2a | Frequency, association and impact: proportions and rates with exact CIs; the 2 × 2 table read by design (cohort or trial, case-control, cross-sectional) with only the measures the design supports; person-time; 1:1 matched pairs; attributable and prevented fractions; the NNT with Altman's CI; the impact of a published ratio on a population (Levin, Miettinen) | Done |
| 2b | Confounding and standardisation: Mantel-Haenszel odds, risk and rate ratios and risk difference with their variances; tests of homogeneity (Breslow-Day with Tarone's correction, Woolf); crude against adjusted; direct standardisation (gamma CI) and indirect (SMR with exact CI); Mantel-Haenszel and Peto pooling join the meta-analysis tool | Done |
| 2c | Diagnostic accuracy and ROC: sensitivity, specificity, predictive values at any prevalence, likelihood ratios, post-test probability; ROC curve, AUC with DeLong's CI, cut-offs, comparing two curves | Done |
| 2d | Vaccine efficacy and effectiveness (cohort, case-control, test-negative, screening method); screening programmes (serial and parallel tests, yield); two binary tests on the same people (paired sensitivities and specificities) | Done |
| 2e | Study design chooser, which hands over to the matching tool | Done |
| 2f | Outbreak toolkit (#EPI-APP and #CM-APP): line list, epidemic curve, attack rates with sources, food-specific attack-rate tables, incubation period | Done |

## Phase 3 Waves

| Wave | Scope | Status |
|---|---|---|
| 3a | Research question builder (PICO, PECO, test accuracy, CoCoPop and SPIDER frames; the FINER check; a title that names the design); objectives, hypotheses and the list of variables; a study plan shared by the planning tools | Done |
| 3b | Sampling and randomisation: probability and non-probability sampling, cluster and PPS selection, randomisation lists with allocation concealment | Next |
| 3c | Literature search and references | Planned |
| 3d | Questionnaire design and validation; data management (codebook, CRF, cleaning checks) | Planned |
| 3e | Ethics and registration (ICMR 2017, consent forms, CTRI) | Planned |
| 3f | Protocol and synopsis builder, in the formats you send | Planned |
| 3g | Trials and operational research; qualitative and mixed methods | Planned |
| 3h | Systematic review workflow (from your SOP); reporting checklists and appraisal | Planned |
| 3i | Writing and publishing; grant tools; health economics basics | Planned |

## Inputs Needed From You

| Phase | Input |
|---|---|
| 3 | Protocol and synopsis formats: OUHS thesis synopsis, NIHFW dissertation, GMCH IEC, ICMR extramural (EMR) and STS. Your SRMA SOP v1.0 (DOCX). |
| 5 | A monthly AI spend cap and the list of faculty code holders. |
| 7 | The February SES tool, the Pareek scale article, and your exam question sets. |

## Decisions On Record

- One shared source; #RESEARCH-APP first; no fixed date.
- Public use is offline; AI Mode is available only with an individual access code.
- Outbreak toolkit sits in #EPI-APP and #CM-APP, not #RESEARCH-APP.
- Preact compiled to one offline file per app; EWS v1.0; Indian English; English only.
- The epidemic curve appears only in the outbreak module.
- Benchmarks carry their source and date.
- `/imnci/` and `/kavach/` stay where they are.
- Old builds retire when their replacements go live.
- Meta-analysis defaults: random effects with the Paule-Mandel estimate of τ² and the Hartung-Knapp-Sidik-Jonkman CI (Veroniki 2016; IntHout 2014); REML and DerSimonian-Laird and the normal CI remain available.
- "None" and "Nil" are read as answers, not as missing values: in health records they are usually real categories.
- Code export: every R and Python script is run against the app before release (`npm run test:code`). R 4.3 and its packages come from Ubuntu's archive in the build environment; CRAN itself is not reachable, so scripts use only packages Ubuntu ships.
- 2 × 2 intervals: Wald (Katz for the risk ratio, Woolf for the odds ratio) when every cell is 5 or more; otherwise Koopman's score interval for the risk ratio and the exact conditional interval for the odds ratio (Fagerland 2015). Newcombe's interval for the difference. The test follows the Tests tool: Yates' χ², or Fisher's exact test when an expected count is below 5. Every interval is shown, with the reported one highlighted.
- Fractions follow the direction of the effect: attributable when the ratio is above 1, prevented when it is below 1. A case-control population fraction uses the proportion of cases exposed (Miettinen); Levin's formula only with a population's own exposure prevalence, and a warning when the ratio is adjusted (Darrow and Steenland 2011).
- epiR 2.0.67's score interval for the risk ratio is computed from a mis-ordered table, and statsmodels' closed-form version picks the wrong root when every exposed person has the outcome; the engine's reference for Koopman's interval is statsmodels' score statistic solved directly.
- Stratified analysis: Mantel-Haenszel estimates (Robins-Breslow-Greenland variance for the odds ratio, Greenland-Robins for the risk and rate ratios, Sato-Greenland-Robins for the risk difference); the CMH test as R's `mantelhaen.test`, with the continuity correction only when the deviation is at least 0.5; homogeneity by Breslow-Day with Tarone's correction for odds ratios and by inverse variance (Woolf) for risk, prevalence and rate ratios and for differences. A change of 10% or more between crude and adjusted estimates is shown as a signal of confounding to be judged, not a rule (Maldonado and Greenland 1993).
- Direct standardisation uses the Fay-Feuer gamma CI, as epitools' `ageadjust.direct`; the WHO World Standard Population (2000-2025) is offered with its source, and any other standard is left as an `[INSERT]` in the report sentence. Two groups are compared by the ratio of their standardised rates, with a delta-method CI on the log scale. The SMR uses the exact Poisson CI (Ulm 1990) and the exact test of R's `poisson.test`.
- Meta-analysis of 2 × 2 counts can pool by inverse variance (default), Mantel-Haenszel or Peto, matching metafor's `rma.mh` and `rma.peto`: heterogeneity comes from study effects with 0.5 added only to tables with a zero cell, and tables with no events in either arm are left out of it. Peto is for odds ratios only.
- Diagnostic accuracy: Wilson intervals for sensitivity, specificity and the sample's predictive values (Clopper-Pearson shown too); likelihood ratios with Simel's log interval when every cell is 5 or more, otherwise Koopman's score interval; the diagnostic odds ratio as the association tool's odds ratio; Youden's J with a Wald interval. Predictive values at a chosen prevalence come from the likelihood ratios by Bayes' theorem, carrying the likelihood ratio's interval with them (with the log interval this is the logit interval of Mercaldo, Lau and Zhou 2007). With people recruited by condition (diagnostic case-control), the sample's own prevalence, predictive values and accuracy are not shown.
- ROC: empirical curve and AUC; DeLong's variance with the CI on the AUC scale cut at 0 and 1, as R's pROC; paired curves by DeLong's test, independent curves by pROC's D on Satterthwaite-type degrees of freedom. Cut-offs are observed values (pROC reports midpoints between them), and the direction is the user's choice or, failing that, pROC's rule of comparing medians, with a warning that a direction chosen from the data flatters a weak marker. R's `fisher.test` finds large upper limits imprecisely (uniroot at its default tolerance), so SciPy is the reference for exact odds-ratio limits.
- Vaccine effectiveness is 1 minus the ratio each design estimates (risk ratio for cohorts and outbreaks, rate ratio with person-time, odds ratio for case-control and test-negative studies, the matched odds ratio for matched pairs), with the association tool's interval for that ratio carried across. The screening method (Orenstein 1985; Farrington 1993) uses the logit interval of Farrington's logistic model, or the exact one when fewer than 5 cases were vaccinated or unvaccinated; coverage is taken as known. Values of the vaccination column can be left out, so a dose can be compared with none.
- Two tests on the same people: Newcombe's (1998) method 10 for the paired difference (it reproduces his Table III), McNemar's test exact below 25 disagreements; series and parallel accuracy counted directly, with Gardner's conditional covariances. Planning a screening programme uses the product rules with optional covariances; planning figures carry no intervals.

## Defects To Fix From The Earlier Builds

Found while reviewing the five attached files; each is fixed in the phase that rebuilds the feature.

| Earlier build | Defect | Phase |
|---|---|---|
| CM-EPI-BIO epidemiology | Attributable fraction among the exposed: the formula shown uses OR but the value is computed from RR, including for case-control data, where only OR is valid | 2a, fixed |
| | Protective exposures give negative AF and PAR% instead of preventable fractions | 2a, fixed |
| | "Recovery" outcomes worded as harm | 2a, fixed |
| | NNT rounded up from an unrounded floating-point value, so an exact NNT of 5 can show as 6 (1/0.19999999999999998); no CI given | 2a, fixed (computed from the counts; Altman's CI) |
| | Attributable risk shown only as a risk difference, without AR% | 2a, fixed |
| | PAR% computed from the sample's exposure prevalence even in case-control data | 2a, fixed (Miettinen's formula) |
| | Sparse tables give infinity or N/A; chi-square without continuity correction or Fisher's exact test | 2a, fixed (score and exact intervals; Fisher's test) |
| | PPV and NPV at the sample prevalence only | 2c, fixed (any prevalence, with intervals) |
| | Study design guessed from keywords | 2 |
| | `alert()` pop-ups | 2a, fixed (inline checks) |
| CM-EPI-BIO statistics | Normal approximation used for t and r p-values | 1 |
| | Runs every pairwise test automatically (multiple testing) | 1 |
| CM-APP hub, SES | Kuppuswamy occupation scored 1 to 6 (scale goes to 10), maximum 25 instead of 29, wrong classes, per-capita income where total family income is needed | 7 |
| | Pareek scale wrong (the scale has nine items; classes above 43, 33 to 42, 24 to 32, 13 to 23, below 13) | 7 |
| | BG Prasad without a cited CPI base | 7 |
| CM-APP hub, nutrition | Asia-Pacific BMI cut-offs mislabelled (23 and 25) | 7 |
| | Child BMI uses adult fixed cut-offs instead of WHO BMI-for-age | 7 |
| | Gomez reference weights wrong (12-month boys 10.2 kg against a WHO median of 9.6 kg; 1 month 3.5 kg against 4.5 kg) | 7 |
| | MUAC bands without a source | 7 |
| CM-APP hub, benchmarks | An SDG target quoted for crude birth rate (there is none) | 7 |
| | ICMR 2010 RDAs (ICMR-NIN 2020 values supersede them) | 7 |
| | Attack-rate thresholds without a source | 2 |
| Not-only-p calculator | Repeated measures in three or more groups fall back to Kruskal-Wallis (needs Friedman or repeated-measures ANOVA) | 1 |
| | Small-sample nonparametric tests use the normal approximation (needs exact p) | 1 |
| Test chooser | Garbled ICC and Cochran's Q formulae; inconsistent kappa interpretation scales | 1 |
- Study design chooser: naming a design follows Grimes and Schulz (2002): whether the investigators assigned the exposure, whether allocation was random, whether there was a comparison group, and the direction of inquiry. Planning a study weighs how common the outcome and the exposure are, whether exposures are fixed or brief, what records exist, and whether and to whom the intervention can be allocated at random; the reasons and the designs worth considering instead are shown with each recommendation. Each design links to the tools that analyse it and to the Sample Size tool, opened ready for that design through presets in the address (`modules/presets.js`), and names its reporting guideline. Where the app cannot yet analyse a design properly (clustered outcomes, stepped-wedge trials, interrupted time series, regression for prevalence ratios, sample sizes for prediction models), the design's card says so.
- Outbreak toolkit: dates are read day first unless the user says otherwise, and every time is handled as UTC so a curve never shifts with the computer's time zone. Epidemic-curve intervals default to about a quarter of the average incubation period (CDC); the probable period of exposure counts back the minimum incubation period from the first case, the average from the peak and the maximum from the last (CDC). Attack rates carry Wilson intervals and, when the numbers at risk are typed, their source in the report sentence. Food-specific tables use the association tool's risk ratio (Katz, or Koopman's score when a cell is below 5) or odds ratio (Woolf, or exact), with Yates' χ² or Fisher's exact test; the item with the highest ratio is named, never declared the vehicle. Incubation periods are summarised by the median, quartiles and range, and by Sartwell's geometric mean and dispersion factor.
- #EPI-APP was scaffolded in 2f (config, icon, home page) to host the outbreak toolkit; until Phase 6 every app bundles all modules and lists only its own, and generated scripts still name #RESEARCH-APP in their header.
- The study plan (question, design, objectives, hypotheses, variables) is kept in the browser's own storage under `<app>:plan`, shared by the planning tools and, later, the protocol builder. Nothing leaves the device. The design chooser offers "Use this design in my study plan" only in apps that have the planning tools.
