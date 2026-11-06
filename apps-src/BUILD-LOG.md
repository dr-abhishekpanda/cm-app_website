# Build Log

Newest entry first. Each entry records what changed, how it was checked, and anything left open.

## 2026-10-31 · Phase 1f: R and Python Code Export

Branch `feature/research-app-1f`, stacked on Phase 1e. Phase 1 (statistics) is complete with this wave.

### Built

- **Engine** (`codegen.js`): R and Python scripts from an analysis spec for 29 kinds of analysis: describe; t-tests (from data or summary figures), Mann-Whitney, Wilcoxon (one-sample and paired), ANOVA with Welch and post hoc tests, Kruskal-Wallis with Dunn, Friedman, repeated-measures ANOVA, chi-square (data or typed table), McNemar, Cochran's Q, one and two proportions, correlation, adjusted p-values; linear and logistic regression with reference categories and interactions; Kaplan-Meier, log-rank and Cox; kappa (data or table), Fleiss' kappa with the bootstrap CI, ICC, Bland-Altman (three scales), Cronbach's alpha; meta-analysis for every data type, estimator and option.
- **Matching the app on purpose**: R's exact rules for Mann-Whitney and Wilcoxon carried into Python; Spearman by the t approximation in R (`exact = FALSE`); meta-analysis effect sizes written out with the app's zero-cell rules and RevMan's Hedges' g; the prediction interval on k − 2 df; Wald CIs for odds ratios.
- **"R and Python code for this analysis"** under every result in Describe, Run a Test, Regression, Survival, Agreement and Meta-Analysis: copy, download the script, and download the data as `research-app-data.csv`.
- **Code Export page**: how the scripts work, what each analysis uses, and the data download.
- **Example data generators** moved to `engine/examples.js` so tests can use them (the data are unchanged).

### Checked

| Check | Result |
|---|---|
| Engine tests (`npm test`) | 55 of 55 pass |
| Generated Python scripts (`npm run test:code`) | 50 scripts run on the example data; 117 numbers compared with the app's engine, all within 1e-8 (Cox coefficients within 2e-4: lifelines' default convergence) |
| R scripts | produced for every case and read through; not run (no R in the build environment) |
| Browser smoke test | 108 of 108 pass, including the code panels at 360 px and 1280 px |

### Open

- Run the R scripts once on a machine with R (or allow an R runtime in the build environment) and add them to `npm run test:code`.

## 2026-10-31 · Phase 1e: Results to Text and Table 1

Branch `feature/research-app-1e`, stacked on Phase 1d.

### Built

- **Engine** (`table1.js`):
  - Table 1 overall and by a group of up to 8 levels: mean (SD), median (IQR, quartiles as in SPSS or R) or n (%); one more decimal than the data; a row for missing values;
  - a suggested summary for each variable (categories for 6 or fewer values, the median when Shapiro-Wilk rejects normality in any group);
  - optional tests chosen as in the test runner (Welch's t or ANOVA, Mann-Whitney or Kruskal-Wallis, chi-square with Yates' correction for 2 x 2, Fisher or Fisher-Freeman-Halton when Cochran's rule fails), marked with footnote letters.
- **Results to Text and Table 1 tool**:
  - the Table 1 builder with per-variable summaries and a first-draft participants paragraph;
  - "My results": every sentence and table added from any tool, kept in this browser, editable, reorderable, copied for Word in one go or downloaded as a page that opens in Word.
- **Every result sentence and table** now has "Add to my results"; "Copy table" puts a real table on the clipboard as well as tab-separated text, so Word and Excel paste rows and columns intact.
- **A caution before p-values in Table 1**, citing the CONSORT 2010 and STROBE explanation papers.

### Checked

| Check | Result |
|---|---|
| Engine tests (`npm test`) | 55 of 55 pass |
| Table 1 against NumPy, SciPy and pingouin | means, SDs and quartiles (types 6 and 7) to 1e-10; Welch's ANOVA and t, Kruskal-Wallis, Mann-Whitney, chi-square and Yates' chi-square to 1e-8; counts, missing rows and dropped participants exact |
| Browser smoke test | 100 of 100 pass, including Table 1 and My results at 360 px and 1280 px |

### Decisions

- p-values in Table 1 are off by default, with a caution, because both CONSORT and STROBE advise against them in baseline and descriptive tables.
- Results are kept in browser storage under the app's own key; if storage is blocked, the page says so and the list lasts for the session.
- Code export moves to its own wave, 1f, so that each script can be run against the app's numbers before release.

## 2026-10-31 · Phase 1d: Agreement, Reliability and Meta-Analysis

Branch `feature/research-app-1d`, stacked on Phase 1c.

### Built

- **Engine**:
  - `agreement.js`:
    - Cohen's kappa, unweighted, linear or quadratic weights, with the Fleiss-Cohen-Everitt standard errors;
    - Fleiss' kappa with the Fleiss-Nee-Landis null standard error, category kappas and a percentile bootstrap CI (2,000 resamples of subjects, fixed seed);
    - the six intraclass correlations with F tests and CIs;
    - Bland-Altman bias and limits of agreement with their CIs and a proportional-bias slope, on the raw, percentage or ratio scale;
    - Cronbach's alpha with Feldt's CI, item-rest correlations and alpha if an item is deleted.
  - `meta.js`:
    - effect sizes: log OR, log RR and RD from 2 x 2 counts (0.5 added to zero cells; double-zero studies left out of ratios), MD and Hedges' g (RevMan formulas), logit proportions, and estimates reported with a CI;
    - inverse-variance fixed and random effects, with τ² by Paule-Mandel, REML or DerSimonian-Laird, the Q-profile CI for τ², the Hartung-Knapp-Sidik-Jonkman CI, the Higgins-Thompson I² interval and the prediction interval;
    - subgroup analysis with the test for subgroup differences, leave-one-out analysis and Egger's test.
  - `random.js`: the seeded generator, now shared by the Monte Carlo Fisher test and the bootstrap.
- **Agreement and Reliability tool**: five tabs (two raters, three or more raters, ICC, Bland-Altman, Cronbach's alpha); kappa from columns or a typed table, with category order for weighted kappa; Fleiss' kappa from one column per rater or per category; a guide to choosing the ICC form (Koo and Li); an optional acceptable limit for Bland-Altman; checks, sentences and references for each.
- **Meta-Analysis tool**: a study table for four kinds of data, typed or pasted from Excel; group and measure names; random or fixed effects; forest plot with subgroups and the prediction interval; summary, subgroup and leave-one-out tables; funnel plot with Egger's test; checks and a results sentence.
- **Example data**: a simulated screening camp of 100 children (pallor graded by three medical officers, haemoglobin by laboratory and HemoCue, MUAC by three Anganwadi workers, a six-item scale with one weak item), labelled as simulated. The meta-analysis examples are labelled as illustrative, not real studies.
- **Fixes**: "None" and "Nil" are no longer read as missing (they are usually real answers); text boxes across the tools now have proper labels; hidden table text no longer widens the page on phones.
- **References**: 16 added, each checked on PubMed, the publisher, RePEc, NIST or the Cochrane site (74 in all).

### Checked

| Check | Result |
|---|---|
| Engine tests (`npm test`) | 53 of 53 pass |
| Kappa and Fleiss' kappa against statsmodels | kappa and SEs to 1e-10 |
| Fleiss-Nee-Landis null SE against 20,000 simulations | 0.02977 against 0.02967 (0.3%) |
| Bootstrap CI against an independent NumPy bootstrap | within 0.015 |
| ICC and Cronbach's alpha against pingouin | estimates to 1e-11; CIs to pingouin's rounding |
| Pooling against statsmodels | fixed and random effects, τ², I² and HKSJ to 1e-9 (Paule-Mandel 1e-6) |
| REML against direct maximisation of the restricted likelihood (SciPy) | τ² to 1e-6 |
| Q-profile CI and subgroup test against SciPy root-finding and the formulas | to 1e-9 |
| Two pooled examples in the browser against statsmodels | MD 0.37 (0.07 to 0.67), RD −0.066 (−0.098 to −0.034): identical |
| Browser smoke test | 88 of 88 pass (phone and desktop) |

### Decisions

- Fleiss' kappa shows a bootstrap CI, not the asymptotic one, after Zapf and colleagues (2016) found the asymptotic CI covers poorly.
- Meta-analysis defaults to random effects, Paule-Mandel and HKSJ (Veroniki 2016; IntHout 2014), with a note on reproducing RevMan 5's DerSimonian-Laird analysis.
- Mantel-Haenszel and Peto pooling wait for the Phase 2 stratified-analysis engine, so both modules share one tested implementation.

## 2026-10-31 · Phase 1c: Regression and Survival Analysis

Branch `feature/research-app-1c`, stacked on Phase 1b.

### Built

- **Engine**:
  - `linalg.js`: Householder QR least squares, Cholesky solves and inverses.
  - `regression.js`:
    - design matrices with dummy coding, a chosen reference category and an optional two-way interaction;
    - ordinary least squares with leverage, Cook's distance, VIF and drop-term F tests;
    - logistic regression by IRLS with step-halving and a separation check;
    - likelihood-ratio tests, McFadden, Cox-Snell and Nagelkerke R²;
    - Hosmer-Lemeshow (deciles of risk, as R's `hoslem.test`);
    - ROC area with DeLong's SE, classification at 0.5, and events per variable.
  - `survival.js`:
    - Kaplan-Meier with Greenwood variance and log(−log) limits;
    - median survival with the Brookmeyer-Crowley interval;
    - the log-rank test for k groups;
    - Cox proportional hazards with Efron ties and Harrell's C.
- **Regression tool**: linear and logistic models from dataset columns, with:
  - numeric or categorical predictors, a choice of reference category, and an interaction;
  - coefficient and odds-ratio tables, and term tests;
  - checks for residuals, collinearity, influence, events per variable, calibration and separation;
  - residual and Q-Q plots, a ROC curve, and sentences for the results section.
- **Survival tool**:
  - Kaplan-Meier curves with censoring marks and numbers at risk;
  - median survival and survival at chosen times with 95% CIs;
  - the log-rank test with observed and expected events;
  - Cox hazard ratios, unadjusted or adjusted for chosen covariates.
- **Example data**: a simulated cohort of 160 adults on TB treatment, labelled as simulated.
- **Display**: odds, risk and hazard ratios print to two decimals (more below 0.1, one decimal from 10).

### Checked

| Check | Result |
|---|---|
| Engine tests (`npm test`) | 48 of 48 pass |
| OLS against statsmodels | coefficients, SEs, CIs, R², F, leverage and Cook's distance to 1e-9 or better |
| Logistic against statsmodels and scikit-learn | coefficients and SEs to 1e-7; LR test, McFadden R², AUC; DeLong SE and Hosmer-Lemeshow against their definitions |
| Kaplan-Meier, log-rank and Cox against lifelines | survival and limits to 1e-9, medians and their intervals exact; log-rank to 1e-10; Cox coefficients to 1e-6 (lifelines refitted with tight convergence) |
| Browser smoke test | 62 of 62 pass |

### Decisions

- The null log-likelihood is the closed form; statsmodels fits it iteratively, so the two agree to about 1e-10.
- Wald intervals for odds ratios, labelled as such; the page notes that sparse data call for profile-likelihood or exact methods.
- Models with an interaction show the interaction's test and explain how to read the main effects.

## 2026-10-31 · Phase 1b: Sample Size and Power

Branch `feature/research-app-1b`, stacked on Phase 1a.

### Built

- **Engine** (`engine/samplesize.js`): estimation of a proportion (absolute or relative precision, finite population correction) and of a mean; Buderer's sensitivity and specificity; Fleiss's two proportions with unequal allocation and the continuity correction, with its exact inverse for power; case-control (odds ratio) and cohort (risk ratio) through it; two means, paired means and one mean by the exact noncentral-t search, with the normal formula alongside; one proportion; Connor's paired proportions; correlation by Fisher's z; one-way ANOVA and multiple regression by the noncentral F; Schoenfeld's events for the log-rank test; non-inferiority for proportions and means; design effect and non-response adjustments.
- **Sample Size and Power tool**: 17 designs, the formula for each, the working, adjustments for clustering (cluster size and ICC, or a design effect) and loss, a power curve, and a protocol sentence that marks each assumption needing a citation with [INSERT: source].
- **References**: Lwanga and Lemeshow (WHO 1991), Fleiss, Levin and Paik (2003), Buderer (1996), Connor (1987), Schoenfeld (1983), Julious (2004), Chow, Shao and Wang (2008), Cohen (1988), Killip and colleagues (2004), Charan and Biswas (2013), each checked on PubMed or a library catalogue.

### Checked

| Check | Result |
|---|---|
| Engine tests (`npm test`) | 44 of 44 pass |
| Against statsmodels | t-test and ANOVA sample sizes to 1e-6 relative, power at fixed n to 1e-9 |
| Against the published formulas, rewritten independently in Python | estimation, Buderer, Fleiss (with and without correction), case-control, Connor, correlation, Schoenfeld, non-inferiority: 1e-12 |
| Worked values | 30% prevalence ±5 points gives 323; 35% vs 20% gives 151 per group with Fleiss's correction (138 without); one-way ANOVA f = 0.25, 3 groups gives 159 in total; a hazard ratio of 0.7 needs 247 events |
| Browser smoke test | 56 of 56 pass |

## 2026-10-31 · Phase 1a: Describe Your Data, Choose and Run a Test

Branch `feature/research-app-1a`, stacked on Phase 0.

### Built

- **Engine**, each file with reference tests:
  - `noncentral.js`: noncentral t (AS 243 as refined in R), chi-square and F, for effect-size intervals now and power later;
  - `range.js`: studentized range (R's ptukey) for Tukey-Kramer and Games-Howell;
  - `describe.js`: summaries, quartiles (SPSS type 6 or R type 7), bias-adjusted skewness and kurtosis, the order-statistic CI for a median, Shapiro-Wilk (AS R94), Wilson intervals;
  - `compare.js`: one-sample, paired, Student and Welch t-tests with exact CIs for Cohen's d; one-way and Welch ANOVA; Levene and Brown-Forsythe; Tukey-Kramer; Games-Howell; repeated-measures ANOVA with Mauchly's test and Greenhouse-Geisser and Huynh-Feldt corrections;
  - `nonparam.js`: Mann-Whitney U and Wilcoxon signed-rank (exact p for small samples without ties, as in R), Hodges-Lehmann estimates and CIs, Kruskal-Wallis with Dunn's comparisons, Friedman;
  - `tables.js`: Pearson and likelihood-ratio chi-square, Yates, adjusted residuals, Cramer's V; Fisher's exact test with the conditional MLE odds ratio and exact CI; Fisher-Freeman-Halton (exact enumeration, seeded Monte Carlo beyond two million tables); McNemar; linear-by-linear trend; Cochran's Q;
  - `correlate.js`: Pearson, Spearman (Bonett-Wright CI), Kendall tau-b (exact or tie-corrected);
  - `proportions.js`: Wilson and Clopper-Pearson CIs, exact binomial test, Newcombe's interval for a difference;
  - `multiplicity.js`: Bonferroni, Holm, Hochberg, Benjamini-Hochberg, Benjamini-Yekutieli;
  - `data.js`: pasted cells, CSV files and number lists into typed columns.
- **Describe Your Data**: numeric summaries with the shape check and the summary to report (Kim 2013 cut-offs), frequency tables with Wilson CIs, cross-tabulation by group, histogram with normal curve, Q-Q plot, box plots, sentences for the results section, copyable tables.
- **Choose and Run a Test**: a five-question chooser and 17 runners (t-tests, ANOVA family, rank tests, chi-square and Fisher, two proportions, McNemar, Cochran's Q, one proportion, correlation, p-value adjustment), from dataset columns or typed summary figures, each with the estimate and 95% CI, effect size, checks, post hoc table, plot, sentence and references.
- **Example dataset**: a simulated antenatal anaemia follow-up of 120 women (12 variables), labelled as simulated wherever it appears.
- **References**: `modules/refs.js` holds every cited source with where and when it was checked (PubMed, publisher or R documentation).

### Checked

| Check | Result |
|---|---|
| Engine tests (`npm test`) | 39 of 39 pass: SciPy 1.18.1, statsmodels 0.15.0, pingouin 0.7.0, scikit-posthocs 0.17.1, mpmath (noncentral t integrals) and brute-force enumeration |
| Notable agreements | Shapiro-Wilk W to 1e-6 and p to 2e-4 (SciPy runs the same algorithm in single precision); Tukey and Games-Howell p to 1e-5; everything else to 1e-8 or better |
| Monte Carlo Fisher-Freeman-Halton | Three seeds of 200,000 tables give 0.0355 to 0.0358 against the exact 0.03550 |
| Browser smoke test | 50 of 50 pass at 360 px and 1280 px, including describe and test flows on the example data |
| Every runner on the example data | 18 runs, results and sentences reviewed by hand; no console errors |

### Decisions

- Mauchly's p uses the second-order correction in R's `mauchly.test`, so it matches R and pingouin rather than the first-order chi-square some packages print.
- Display: a p-value from 0.0495 to just under 0.05 prints with four decimals, so it is never shown as "0.050" while being called significant.
- Two-way and factorial ANOVA go with regression in Phase 1c, where the linear model handles unbalanced designs.

## 2026-10-31 · Phase 0: Foundations · #RESEARCH-APP v0.1.0

Branch `feature/research-app`.

### Built

- **Engine** (`engine/`): log-gamma (Lanczos), regularised incomplete gamma and beta with both tails computed directly, erf and erfc, Brent root finding with a relative tolerance, tail inversion on the log scale; normal, t, chi-square, F, binomial, Poisson and hypergeometric distributions; number formatting in Indian style (en-IN grouping, U+2212 minus, p-value reporting rules).
- **UI kit** (`ui/`): hash routing, Learn / Practice / Tools modes, Basic / Intermediate / Advanced depth, light / dark / as-device themes, form controls with inline validation, result blocks with copy buttons, SVG density and bar plots drawn at their measured width.
- **First module, p-values** (`modules/*/p-values.jsx`): p-value from z, t, chi-square or F with tail rules (chi-square upper tail only; two-sided F as twice the smaller tail); critical values; exact binomial and Poisson probabilities; a lesson at three depths; a seeded practice set of eight questions with tolerances and worked solutions.
- **Catalogue**: the 29 planned modules shown on the home page with their phase (review builds only).
- **Build** (`tools/build.mjs`): esbuild and Preact into one HTML file with the EWS fonts embedded (latin subsets, 9 faces) and formulas converted to MathML by Temml at build time; service worker (network first, saved copy after 4 s or offline, IMNCI pattern); web manifest; icons outlined from Fraunces so the SVG needs no font.

### Checked

| Check | Result |
|---|---|
| Engine against SciPy 1.18.1 and 40-digit mpmath 1.4.1 (`npm test`) | 27 of 27 pass; relative error under 1e-9 in every case, tails checked down to 1e-274 |
| Worked example: t = 2.10, 18 df, two-sided | p = 0.0500904 (engine) and "p = 0.050" on screen; the normal approximation would give 0.0357, the error in the old CM-EPI-BIO-APP |
| Browser smoke test at 360 px and 1280 px (`npm run e2e`) | 40 of 40 pass: renders, fonts load, no console errors, no sideways scroll on any page, MathML present, worked answers match, dark theme persists, unknown routes handled, reopens and computes offline |
| Narrow screens | No sideways scroll at 320 px on any page |
| Output size | `index.html` about 430 KB, of which the embedded fonts are about 330 KB |

### Decisions

- Browser targets: ES2020, Chrome 87, Firefox 78, Safari 15. Safari 14 cannot be targeted because esbuild does not transform destructuring for it.
- Fonts embedded as latin subsets only; Greek letters and superscripts use the system font, as they would with hosted fonts.
- `.assetsignore` at the site root keeps `apps-src/` (source, tests, docs) out of the public upload.
- Playwright is used from the machine's own install for icons and the smoke test, not added as a dependency.
- The page runs edge to edge when installed (viewport-fit=cover); the top bar, side gutters and footer add the phone's safe-area insets so nothing sits under a notch.

### Open

- Not linked from the homepage yet; the build shows planned modules with their phase and a review notice. Linking waits for the owner's review.
- References in the p-value lesson and tool (Kirkwood and Sterne; Wasserstein and Lazar; Altman and Bland) to be re-verified in the Phase 8 audit with page-level detail.
