# Build Log

Newest entry first. Each entry records what changed, how it was checked, and anything left open.

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

### Open

- Not linked from the homepage yet; the build shows planned modules with their phase and a review notice. Linking waits for the owner's review.
- References in the p-value lesson and tool (Kirkwood and Sterne; Wasserstein and Lazar; Altman and Bland) to be re-verified in the Phase 8 audit with page-level detail.
