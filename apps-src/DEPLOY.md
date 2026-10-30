# Deploying the Apps

The site is a Cloudflare Worker that serves the repository as static files (`wrangler.jsonc`, `assets.directory: "."`). There is no build step on Cloudflare: the built app folders are committed, and merging to `main` publishes them.

## Release Steps

1. On the phase branch, from `apps-src/`:
   - `npm test` (engine; must be all pass)
   - `npm run build -- research-app`
   - `npm run e2e -- research-app` (must be all pass)
2. Commit the source and the built folder (`research-app/`, plus the `_headers` line the build adds the first time).
3. `git fetch origin main`, then push the branch and open a pull request.
4. The owner reviews the preview and merges. Cloudflare deploys `main` within a few minutes.
5. Open `https://dr-abhishekpanda-cm.app/research-app/` and confirm the footer shows the new build id.

## What Gets Published

| Path | Published | Why |
|---|---|---|
| `/research-app/` and later app folders | Yes | Built output |
| `/_headers` | Read by Cloudflare | `no-cache` for each app folder, so browsers re-check on every visit |
| `/apps-src/` | No | Listed in `/.assetsignore`; source, tests and notes stay in the repository only |

Keep `package.json` inside `apps-src/`. A `package.json` at the root makes Workers Builds install dependencies, which can push `node_modules` into the upload.

## How Updates Reach Users

Each app registers `sw.js`. Page loads go to the network first; if the network fails, or takes longer than 4 seconds, the saved copy opens. A new build has a new build id, so its service worker replaces the old saved copy on the next online visit. Nothing needs to be cleared by hand.

## AI Mode (Phase 5)

The public apps stay offline. AI Mode will add a separate Worker route as a proxy, individual access codes stored server-side, and monthly usage limits; it needs the API key set as a Worker secret, never committed. Details land with Phase 5.

## Retiring Old Builds

An old build is removed only after its replacement is live and linked. Earlier pages (CM-EPI-BIO, the p-value calculator, the test chooser) are not in this repository yet, so there is nothing to retire until they are.
