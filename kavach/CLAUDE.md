# Maa 'o' Shishu Kavach — working notes for Claude

Digital Mother & Child Protection (MCP) Card, Odia + English. #CM-APP by Dr. Abhishek Panda (Community Medicine, GMCH Sundargarh). Served at `/kavach/` on dr-abhishekpanda-cm.app (Cloudflare Pages, this repo).

## Resume a session
1. Read `ROADMAP.md` (what is done / next) and the last entry of `BUILD-LOG.md`.
2. Build: `node kavach/tools/build.mjs` → writes the single-file `kavach/index.html` and `kavach/sw.js`. Commit both the sources and the built output (Cloudflare serves the committed files; no build step on the host).
3. Work on one chunk, build, test, log it in `BUILD-LOG.md`, tick it in `ROADMAP.md`, commit.

## Architecture (no framework, no npm dependencies)
- `src/index.template.html` → skeleton; `src/ui/icons.svg` → SVG sprite.
- `src/styles/NN-*.css` → concatenated in name order. EWS v1.0 tokens in `00-tokens.css` (copied from `/brand/ews.css`; do not invent colours).
- JS load order: `src/core/*.js` → `src/data/*.js` → `src/modules/*.js` → `src/main.js`. Each file is wrapped in its own `{ }` block; files share only `window.K`.
- Screens: `K.route('/card/:id/…', (params, query) => ({ title, sub, back, tab, html, mount }))`. Hash routing.
- HTML: always `K.h\`…\`` (auto-escapes); `K.raw()` only for trusted markup.
- Events: `data-act="x"` → `K.acts.x(el)`, `data-form="x"` → `K.forms.x(values, form)`, `data-live="x"` → `K.live.x(el)`.
- i18n: every string is `{ en, or }`. UI keys via `K.i18n.add({...})` and `K.t(key, vars)`; content objects via `K.L(obj)`. New language = new property (e.g. `hi`) or `K.i18n.patch('hi', {...})`, plus an entry in `K.i18n.langs`. Odia wording comes from the Odisha MCP card V-2023-24 where it exists (`docs/sources/odisha-mcp-v2023-24.or.txt`).
- Numerals: data is stored with Latin digits; `K.digits()`/`K.n()` localise on display (setting `odiaNum`). Use `K.keep()` for literal examples.
- Storage: IndexedDB `kavach` (stores `cards`, `media`, `meta`), fallback localStorage → memory. One card = one mother + `pregnancies[]` + `children[]`. Shapes live in `K.blank.*` (core/03-store.js). Settings in localStorage `kavach.settings`.
- Registries: `K.due.add(provider)` for due items (Home + Due tab), `K.summary.add(fn)` for the share text, `K.preg.addSection(order, fn)` for pregnancy overview sections.

## Clinical rules in code (cite the source in a comment when adding more)
- EDD = LMP + 280 d, or USG dating. ANC windows 0–12 / 14–26 / 28–34 / 36+ wk. PMSMA on the 9th (Sunday → 10th).
- HRP items = Odisha MCP V-2023-24 ଖ.୧ / ଖ.୨ list + national PMSMA extras (`modules/22-hrp.js`).
- Anaemia (AMB, pregnancy): <7 severe, 7–9.9 moderate, 10–10.9 mild.
- Immunisation = UIP National Immunization Schedule incl. fIPV-3 at 9 m, catch-up limits (see ROADMAP chunk 4 notes).

## Rules from the owner
- Indian English; never "delve/crucial/…" style words; no emoji in UI; straight quotes.
- EWS brand for this web app (teal #0C5E4E, amber #BE651F, paper #F4F5F1, ink #15201B; Fraunces / IBM Plex). No "Epidemiologist's Worksheet v1.0 · #CM-APP" footer string.
- Never present the app as an official Government app; no government emblems.
- No Aadhaar or bank numbers are collected.
- Test with Playwright (Chromium at /opt/pw-browsers) at 393×851 before committing a chunk.
