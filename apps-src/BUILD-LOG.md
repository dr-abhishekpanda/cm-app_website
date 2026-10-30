# Build Log

Newest entry first. Each entry records what changed, how it was checked, and anything left open.

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
