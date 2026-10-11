# Deploying Maa 'o' Shishu Kavach

The app is one HTML file plus a service worker, a manifest and four icons, all inside `kavach/`. Cloudflare (Workers Builds, project `cm-app-website`) serves the repository's static files from `main`, so there is no build step on the host: whatever is committed and merged is what goes live. Builds of non-production branches (such as `feature/kavach`) fail on Cloudflare at present, so there is no automatic branch preview; review the app from the Claude review link or a local server instead.

## What goes live

| File | Purpose |
|---|---|
| `kavach/index.html` | The whole app (built from `kavach/src/`) |
| `kavach/sw.js` | Service worker: offline app shell, cached fonts |
| `kavach/manifest.webmanifest` | Install to home screen (name, icons, colours, shortcuts) |
| `kavach/icons/` | `favicon.svg`, `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` |

Live address after merge: `https://dr-abhishekpanda-cm.app/kavach/`

## Releasing

1. Build: `node kavach/tools/build.mjs` (writes `index.html` and `sw.js`; the build hash changes on every content change, which makes phones pick up the new version).
2. Check at phone size (393 × 851) in English and Odia — the Playwright flows used during development are described in `BUILD-LOG.md`.
3. Merge `feature/kavach` into `main`, the branch Cloudflare Workers Builds deploys. The site updates within a minute or two; check that the "Workers Builds: cm-app-website" run on `main` succeeds.
4. Phones that already have the app get the new version the next time they open it online; a small "new version ready — Reload" bar appears.

After the first deploy, check the response headers of `/kavach/sw.js` and `/kavach/index.html` (browser dev tools → Network): they should not be cached for long (`max-age=0` or `no-cache`), or phones will be slow to see updates. If they are, add a `_headers` file with `Cache-Control: no-cache` for those two paths.

## Offline and data

- After the first visit the app opens without a network. Fonts fall back to system fonts until they have been cached once (Noto Sans Oriya is the Android system font for Odia, so Odia always renders).
- Card data lives only in the phone's IndexedDB (`kavach` database). Nothing is sent to any server. Clearing the browser's site data deletes the cards — this is why the app nags for a backup every 30 days (More → Backup).
- Backups are JSON files; restoring merges by card, newer edit wins.

## Before wider use

- **Odia review:** About → "Odia review sheet (CSV)" exports every English–Odia pair (about 1,580 rows) with empty status and comment columns. Text taken from the Odisha MCP card V-2023-24 is marked in the data-file headers; lines written for the app (newborn-care list, feeding headings, tool texts, the October 2026 audit fixes) need a native reviewer most.
- **Home visits:** the app follows SSBSK (June 2026) by default. Districts still on HBNC + HBYC can switch in Settings → "ASHA home-visit schedule"; tell users which one your district uses.
- **Clinical review:** an independent audit (October 2026) found 24 issues, all fixed in chunk 11. What still needs a clinician's eye is listed under "Notes to carry forward" in `ROADMAP.md`: feeding amounts, fast-breathing cut-offs, the JE catch-up interval (national footnote vs the Odisha deck), the gestation split for severe anaemia in the AMB 2026 flowchart, and one 24-month warning sign.
- **Amounts and helplines:** each scheme on the Helplines page shows its source and the date it was checked; re-check them at least every six months.
- The app says plainly that it is not an official government app and shows no government emblem; keep it that way.

## Local testing

Serve the repository folder over HTTP (any static server) and open `/kavach/index.html`. The service worker is skipped on `localhost` unless `localStorage.setItem('kavach.swdev', '1')` is set, so development builds are not cached by accident.
