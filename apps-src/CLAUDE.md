# apps-src: Shared Source for the #CM-APP Family

One source tree builds five offline web apps for dr-abhishekpanda-cm.app. Each app is a subset of the same tested engine, UI kit and content library, so the same data give the same answer everywhere.

| App | Site path | Phase |
|---|---|---|
| #RESEARCH-APP | /research-app/ | Built first; ships in waves from Phase 0 |
| #EPI-APP | /epi-app/ | Phase 6, derived from the shared modules |
| #BIOSTATS-APP | /biostats-app/ | Phase 6, derived from the shared modules |
| #CM-EPI-BIO-APP | /cm-app/cm-epi-bio/ | Phase 7 |
| #CM-APP | /cm-app/ | Phase 7, the full toolkit hub |

ROADMAP.md has the phase plan, BUILD-LOG.md the dated record, DEPLOY.md the release steps.

## Commands

Run from `apps-src/`.

| Task | Command |
|---|---|
| Install dev dependencies | `npm install` |
| Engine tests (SciPy and mpmath references) | `npm test` |
| Run every generated Python script against the app (needs Python with SciPy, statsmodels, pingouin, lifelines, scikit-posthocs) | `npm run test:code` |
| Build one app, or all | `npm run build -- research-app` / `npm run build` |
| Smoke test a built app | `npm run e2e -- research-app` (add `--shots <dir>` for screenshots) |
| Regenerate reference values | `python3 -I tools/refgen/engine_ref.py` (needs scipy, mpmath) |
| Draw a new app icon | `python3 -I tools/outline_icon.py E apps/epi-app/icon.svg` (needs fonttools, brotli) |

The build writes `../<app-path>/`: `index.html` (one file, fonts and formulas inside), `sw.js`, `manifest.webmanifest`, `icon.svg` and four PNG icons. It also adds a `no-cache` rule for the app to the root `_headers`. The e2e test and the PNG icons use the Playwright installed on the machine; Playwright is deliberately not a dependency here.

## Layout

| Folder | Holds |
|---|---|
| `engine/` | Pure functions, no DOM: special functions, distributions, formatting. Every function has reference tests. |
| `ui/` | Preact UI kit: routing, settings, form controls, plots, shell, app CSS over `brand/ews.css`. |
| `modules/` | `tools/`, `learn/`, `practice/` per topic; `home/` index views; `registry.js` lists every module, its stage, phase and which apps include it. |
| `apps/<app>/` | `app.config.js` (names, paths, copy), `main.jsx`, `icon.svg`. |
| `tools/` | Build (`build.mjs`, `fonts.mjs`, `icons.mjs`), icon outliner, reference generators. |
| `tests/` | `engine/` unit tests, `ref/` reference JSON, `e2e/` browser smoke test. |

## Rules

1. **Engine first.** A new calculation gets reference values from an independent implementation (SciPy, statsmodels, R output, or a worked example in a named textbook) and a test before any UI uses it. Regenerate references only to add cases, never to make a failing test pass.
2. **Offline in public.** No network calls at run time, no CDNs: fonts are embedded, formulas are MathML made at build time (write `tex\`...\`` or `texd\`...\``). The only planned exception is AI Mode (Phase 5), behind individual access codes.
3. **No silent wrong answers.** Validate every input inline; never `alert()`. Use exact methods where the sample is small (exact p for small-sample nonparametric tests, t not z for t statistics), and say which method ran.
4. **Every result is reportable.** Give the estimate, its confidence interval where one exists, a report sentence with a copy button, and the method's reference.
5. **Benchmarks carry their source and date** (NFHS-5, SRS bulletin year, HMIS year). No benchmark without a citation.
6. **Brand.** EWS v1.0 tokens from `brand/ews.css`; app layer in `ui/css/app.css`. The epidemic curve appears only in the outbreak module. Footer credit stays exactly as in `ui/shell.jsx`. No eyebrow labels (small uppercase labels above headings): use the page title, section headings and subheadings, in normal case (owner's preference, November 2026; `brand/ews.css` stays at v1.0 until the owner issues v1.1).
7. **Language.** Indian English (programme, analyse, randomisation), straight quotes, no emoji. Avoid the owner's banned words (delve, intricate, pivotal, underscore, crucial, landscape, realm, tapestry, testament, meticulous, commendable, foster, navigate, showcase, paramount, resonate, unwavering, compelling, elevate, surpass, holistic, seamless; "robust" only in its statistical sense).
8. **References are verified.** Cite only sources checked against PubMed, the publisher, or the government portal. Never invent a DOI, PMID, page range or guideline clause.
9. **Storage** goes through `store` in `ui/core.jsx` (wrapped in try/catch); keys start with the app id (`research:`).
10. **Layouts** must not scroll sideways at 320 px; the e2e test checks 360 px and 1280 px.

## Git

- One feature branch and pull request per phase. Merge only when the owner asks (on 7 November 2026 the owner asked Claude to merge the Phase 0 and 1 stack). Never push to `main` directly.
- The clone is shallow: `git fetch origin main` before pushing or opening a PR.
- Never commit `node_modules`. Keep `package.json` inside `apps-src/` (a root `package.json` makes Workers Builds install and upload dependencies).
- Commit the built app folders; Cloudflare serves them as plain files.
- Do not move or edit `/imnci/` or `/kavach/`. Retire an old build only when its replacement is live.
