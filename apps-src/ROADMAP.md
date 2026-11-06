# Roadmap

Five apps from one shared source. #RESEARCH-APP leads; the other four are subsets or extensions of the same modules. Each phase lands as one pull request on its own branch.

## Phases

| Phase | Scope | Main deliverables | Status |
|---|---|---|---|
| 0 | Foundations | Shared engine (special functions, distributions), UI kit, build to one offline file, service worker, icons, tests, first module (p-values: tool, lesson, practice) | Done, awaiting review |
| 1 | Statistics engine and tools | Describe data (upload or paste), test chooser and runner with effect sizes and CIs, sample size and power, regression (linear, logistic), survival (Kaplan-Meier, log-rank), agreement and reliability (kappa, weighted kappa, ICC, Bland-Altman, Cronbach's alpha), meta-analysis (fixed and random effects, heterogeneity, forest and funnel plots), results-to-text and Table 1, R and Python code export | Next |
| 2 | Epidemiology engine and tools | Study design chooser; frequency, association and impact measures with exact and Mantel-Haenszel CIs; diagnostic accuracy and ROC; confounding, effect modification, direct and indirect standardisation; vaccine efficacy and effectiveness, screening programmes; outbreak toolkit (for #EPI-APP and #CM-APP) | Planned |
| 3 | Research workflow | Research question builder (FINER, PICO, PECO, SPIDER); literature search and references; objectives and hypotheses; sampling and randomisation; questionnaire design and validation; data management (codebook, CRF); ethics and registration (ICMR 2017, consent forms, CTRI); protocol and synopsis builder with DOCX export; trials and operational research; qualitative and mixed methods; systematic review workflow (PRISMA, risk of bias, GRADE); reporting checklists and appraisal; writing and publishing; grant and project tools; health economics basics | Planned |
| 4 | Learn and Practice | A lesson at three depths and a seeded practice set for every module; teacher set numbers | Planned |
| 5 | AI Mode | Restricted-access research assistant: marking typed answers, tutor, plan review, biostatistician chat. Coach by default; drafting only for faculty codes, with an AI-disclosure reminder. Individual access codes, a server-side proxy and usage limits | Planned |
| 6 | #EPI-APP and #BIOSTATS-APP | Derived from the shared modules with their own configs, icons and home pages | Planned |
| 7 | #CM-EPI-BIO-APP and #CM-APP | The community medicine toolkit: SES scales (corrected), nutrition (WHO growth standards), benchmarks with sources, programme calculators, alongside the epidemiology and statistics modules | Planned |
| 8 | Audit and launch | Accuracy audit against references, accessibility review, phone testing, homepage links, retirement of the old builds | Planned |

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

## Defects To Fix From The Earlier Builds

Found while reviewing the five attached files; each is fixed in the phase that rebuilds the feature.

| Earlier build | Defect | Phase |
|---|---|---|
| CM-EPI-BIO epidemiology | Attributable fraction among the exposed: the formula shown uses OR but the value is computed from RR, including for case-control data, where only OR is valid | 2 |
| | Protective exposures give negative AF and PAR% instead of preventable fractions | 2 |
| | "Recovery" outcomes worded as harm | 2 |
| | NNT rounded up from an unrounded floating-point value, so an exact NNT of 5 can show as 6 (1/0.19999999999999998); no CI given | 2 |
| | Attributable risk shown only as a risk difference, without AR% | 2 |
| | PAR% computed from the sample's exposure prevalence even in case-control data | 2 |
| | Sparse tables give infinity or N/A; chi-square without continuity correction or Fisher's exact test | 2 |
| | PPV and NPV at the sample prevalence only | 2 |
| | Study design guessed from keywords | 2 |
| | `alert()` pop-ups | 2 |
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
