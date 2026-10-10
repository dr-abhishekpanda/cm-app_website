# Deploying Maa 'o' Shishu Kavach

The app is one HTML file plus a service worker, a manifest and four icons, all inside `kavach/`. Cloudflare Pages serves the repository as it is, so there is no build step on the host: whatever is committed is what goes live.

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
3. Merge `feature/kavach` into the branch Cloudflare Pages publishes (usually `main`). The site updates within a minute or two.
4. Phones that already have the app get the new version the next time they open it online; a small "new version ready — Reload" bar appears.

Cloudflare Pages already sends `Cache-Control: public, max-age=0, must-revalidate` for these files, so no `_headers` rule is needed. If a CDN or another host is used later, serve `sw.js` and `index.html` with `no-cache`.

## Offline and data

- After the first visit the app opens without a network. Fonts fall back to system fonts until they have been cached once (Noto Sans Oriya is the Android system font for Odia, so Odia always renders).
- Card data lives only in the phone's IndexedDB (`kavach` database). Nothing is sent to any server. Clearing the browser's site data deletes the cards — this is why the app nags for a backup every 30 days (More → Backup).
- Backups are JSON files; restoring merges by card, newer edit wins.

## Before wider use

- **Odia review:** About → "Odia review sheet (CSV)" exports every English–Odia pair (about 1,550 rows) with empty status and comment columns. Text taken from the Odisha MCP card V-2023-24 is marked in the data-file headers; lines written for the app (newborn-care list, feeding headings, tool texts) need a native reviewer most.
- **Clinical review:** the open items are listed under "Notes to carry forward" in `ROADMAP.md` (feeding amounts, fast-breathing cut-offs, the June 2026 Anaemia Mukt Bharat Abhiyaan revision, one 24-month warning sign).
- **Amounts and helplines:** each scheme on the Helplines page shows its source and the date it was checked; re-check them at least every six months.
- The app says plainly that it is not an official government app and shows no government emblem; keep it that way.

## Local testing

Serve the repository folder over HTTP (any static server) and open `/kavach/index.html`. The service worker is skipped on `localhost` unless `localStorage.setItem('kavach.swdev', '1')` is set, so development builds are not cached by accident.
