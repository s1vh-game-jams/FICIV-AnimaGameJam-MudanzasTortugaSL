# Deployment — Mudanzas Tortuga, S.L.

Local Vite production serving and repository-subpath builds are implemented. The main-only manual Pages workflow is active at `.github/workflows/jekyll-gh-pages.yml` (the historical filename does not imply a Jekyll build). The approved `main` release is live on GitHub Pages: run `37366809747`, attempt 2, successfully deployed commit `6e5061e` on 2026-10-05 at 20:19 UTC. Live browser verification loaded the title, mode/difficulty selectors and a Normal run with sprites, physics and an advancing timer, without console errors or warnings.

## 1. Build and branch contract

Use Node.js **22.12 or newer** and npm. The lockfile pins the reviewed dependency set.

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

The default build writes `dist/` and uses Vite base `/`. It contains static HTML, CSS, JavaScript, public SVGs and a hashed Rapier WASM asset. No backend or secret is required.

Root settings.txt is imported as raw text into the application bundle. Editing/replacing it requires a development reload or production rebuild; preview and scripts/localServer.py serve the existing build. The laboratory exports the same configuration schema as a download. Current schemaVersion=2 uses `cameraDeadZonePercent` and `shellPivotY`; migrate older exports before building, following [PHYSICS.md](PHYSICS.md#4-configuration-and-tuning). There is no extra configuration endpoint, public source duplicate or server writeback.

`dev` is the integration/testing branch. Auxiliary branches are preserved after squash integration. Only an explicitly human-approved promotion to `main` may become a release; see [CONTRIBUTING](../CONTRIBUTING.md).

## 2. Serve the production build locally

Preferred Vite preview:

```bash
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/` for the title and playable Endless Run, or `http://127.0.0.1:4173/?mode=physics` for the laboratory. Vite preview is a local verification server. The [README local-server guide](../README.md#-servidor-web-local-para-pruebas) provides tester-oriented setup, fixed-port commands, rebuild steps and troubleshooting.

The standard-library Python helper is an alternative:

```bash
npm run build
python scripts/localServer.py --port 4173
```

Without `--directory`, the helper serves the repository's `dist/`, regardless of the shell's working directory. An explicit relative directory resolves from the shell's working directory.

Supported options:

| Option | Default / meaning |
|---|---|
| `--directory PATH` | Repository `dist/`; serve an existing build directory. |
| `--host HOST` | `127.0.0.1`; bind to loopback. |
| `--port PORT` | `4173`; `0` requests an available port and prints its actual URL. |
| `--base-path PATH` | `/`; mount files at a normalized URL prefix. |

The helper prints a ready URL, preserves WASM MIME handling, disables local caching and refuses traversal/symlink escapes from its document root. A mount without its trailing slash redirects while preserving the query string. Missing directories and occupied ports produce an explanatory error. Stop with `Ctrl+C`.

The helper and its tests require Python 3.10 or newer. On Windows, `py -3` may replace `python`; on other systems, use `python3` if that is the installed Python 3 command:

```bash
python -m unittest discover -s tests/python -v
```

Changing the mount only changes where files are served. Build Vite with the matching base first.

## 3. Repository-subpath build

The verified Git remote is:

`https://github.com/s1vh-game-jams/FICIV-AnimaGameJam-MudanzasTortugaSL.git`

For a project Pages site, its expected subpath is:

`/FICIV-AnimaGameJam-MudanzasTortugaSL/`

Build and emulate that mount locally:

```bash
npm run build:pages
python scripts/localServer.py --directory dist --port 4173 --base-path /FICIV-AnimaGameJam-MudanzasTortugaSL/
```

Open:

`http://127.0.0.1:4173/FICIV-AnimaGameJam-MudanzasTortugaSL/?mode=physics`

`build:pages` passes the repository base to Vite; it overwrites the normal `dist/`. Run `npm run build` again to return to a root build. A custom static-host base can be supplied with `npm run build -- --base=/chosen-prefix/`.

Public asset metadata uses relative paths through `src/utils/publicAsset.ts`, based on `import.meta.env.BASE_URL`. Rapier's WASM URL is resolved by Vite. Do not hardcode root sprite paths. Query-based routing needs no server-side route rewrites.

Jam audio uses the same helper for all selected relative paths in `src/audio/manifest.ts`. Vite copies the 21 original WAV/MP3 recordings without transformation; native media elements stream them after the first interaction rather than decoding the full roughly 112 MB set at startup. Root/subpath smoke checks must inspect audio requests and native ready/playback states as well as textures/WASM. Original volume is controlled by browser/device, with no in-game mixer. [SOUNDS.md](SOUNDS.md) owns playback/event rules and the human auditory verification boundary.

The Pages URL is `https://s1vh-game-jams.github.io/FICIV-AnimaGameJam-MudanzasTortugaSL/`. The repository uses GitHub Actions as its Pages source, HTTPS with no custom domain, and a `github-pages` environment restricted to the `main` branch. These settings were verified on 2026-10-05; successful live publication is tracked separately below.

## 4. Prototype 1 browser smoke check

After building, use a real browser:

1. Verify the secondary gear-labelled title entry with mouse/keyboard, existing Shift+P access, direct `?mode=physics` and refresh.
2. Verify textures, default 0.30 m shell registration, collider drawing, cargo and Rapier WASM initialization. Change shell height and verify coherent support/load placement with unchanged shapes.
3. Compare arrows/WASD. D must accelerate; C toggles debug.
4. Hold Space for partial/full/over-cap charges; release must launch once. Check lowered-head pose, no charge GUI, supported cargo and ordinary landing. At the current 8 m/s maximum, include high flight that carries cargo above the visible frame; visibility must not affect physics or connectivity.
5. Pause/blur during charge, then return: no deferred jump. Pause freezes time and help; neutral single-step advances physics by one tick without advancing onboarding.
6. Compare empty/sofa/full water behavior and natural entry momentum. Arrows/W/S must balance the shell; held Space must assist ascent without charging, with no commanded dive. Check partial tilt, violent-impact losses and bank exit.
7. Compare ascending/descending slopes and manual compensation; verify actual shell contact motion and visible feet. Check airborne departure pitch and freefalls. Buoyant forward travel beneath the island must not require a downward command to leave a ceiling contact.
8. Edit fine decimal values, rear/front movement percentages and per-side dead-zone percentage; check validated reset and pause preservation. Lab guides and physical bounds must match its fixed 76 pixels/metre scale. Dead-zone edits change the read-only normal-level framing preview without changing laboratory character size or physical corridor width. Resize the landscape viewport.
9. Enable help preview: speed/balance/jump sequence, first-water priority and per-run reset.
10. Export settings while paused: download must preserve time/tick/pause; its text round-trips through the shared codec. Replace source settings and rebuild/reload to verify permanent defaults; restore recovers loaded values.
11. Repeat root and repository-subpath production access, public/charge textures, refresh and WASM initialization; inspect browser errors.
12. At a reachable vertical blocker, exhaust the rear-margin space. Camera progression must hold while physics, time and jump charging continue; full-charge clearance must restore camera advance as accepted forward movement resumes.

Automated physics and Python helper coverage complement this laboratory smoke check. Human partial-loss/game-feel testing remains necessary.

### Endless production smoke check

Repeat on both root and repository-subpath builds:

1. Navigate Title → Mode → Difficulty with arrows/Enter/Esc and mouse. Normal is selected initially; customized levels are visibly disabled. Start each difficulty and check texture/WASM loading and console errors.
2. Inspect cargo icons, timer, score, deployed pennants and upcoming terrain. The separate dry opening has no scoring flag or traps. Complete the initial timed help before entering water.
3. Pause and verify frozen physics/time/help/hazards. Continue is selected initially; restart and exit require confirmation with cancel selected. Restart preserves seed/difficulty/settings and resets help. Showing controls again keeps the game paused.
4. Resize a landscape viewport, including 640×360. The captured world scale remains unchanged and the HUD remains usable. Blur/hide the page and verify automatic pause without a catch-up burst.
5. Reach definitive zero cargo and inspect frozen results, score/pennants/time/difficulty/last loss. Return to title and start a fresh run. Confirm the secondary laboratory entry and both existing diagnostic access paths work.
6. Open Credits. Verify the centred exact GDD 41.5.6 dedication, signature, Argorias ArtStation link and copyright footer; return with the button/Enter or Esc. The link must retain native keyboard activation.

The 2026-10-04 implementation has browser evidence for the full flow, all difficulties, a real pennant award, definitive-zero results, pause/restart/help and root/subpath assets/WASM. Current-settings traversal is covered separately by the physical matrix in [PHYSICS.md](PHYSICS.md#validating-new-module-proposals). Final human balance/readability and live release approval remain outstanding; local production serving does not publish the game.

The 2026-10-05 local root/subpath builds also initialize the revised shared physics and visible laboratory without browser errors. Credits show the exact centred dedication, link, signature and footer, with keyboard return. The secondary laboratory entry works with mouse and arrows/Enter and displays the new water controls; the original diagnostic routes remain. A Normal run reaches an actual pennant award and frozen zero-cargo results. These local checks do not publish a live release.

## 5. GitHub Pages release from main

The active workflow is [.github/workflows/jekyll-gh-pages.yml](../.github/workflows/jekyll-gh-pages.yml), added to `main` by the human in `0e14828`. It builds Vite, not Jekyll. The original [scripts/pages-deploy.provisional.yml](../scripts/pages-deploy.provisional.yml) remains an inactive historical template.

The workflow uses manual `workflow_dispatch` only, guards both jobs to `refs/heads/main`, checks out the exact dispatched `main` commit (`github.sha`), runs the existing type/lint/game/helper checks and `build:pages`, then uploads/deploys `dist/`. Build and deployment permissions are separate; publication uses the `github-pages` environment. Full action SHAs match the [official Vite Pages guide](https://vite.dev/guide/static-deploy.html#github-pages), rechecked on 2026-10-05, and the [GitHub custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). A local review/build cannot certify an Actions runner or successful Pages deployment.

**Explicit human release exception (2026-10-05):** after reviewing the 51 failing tests, the human authorized modifying the workflow on `main` to publish the current jam candidate. `allow_game_test_failure` is a boolean dispatch input, default **false**. Tests always run; only a dispatch explicitly selecting **true** may continue after their failure. That run emits a visible warning and job-summary exception note. Types, lint, Python helper tests and production build remain mandatory. This exception changes no gameplay/settings and does not certify physical traversal; future default dispatches still block on failing game tests.

**Subsequent urgent human test waiver (2026-10-05):** the human requested immediate publication of calm-stack recovery, stump takeoff, heavier pinecones and the visual-only shell adjustment, explicitly forbidding tests after these changes. The new boolean `skip_tests`, default **false**, skips both game and Python helper tests only when explicitly selected. The workflow records a warning and job-summary waiver; type/lint/build remain mandatory. Default dispatch behavior stays strict, and `allow_game_test_failure` continues to apply when tests are run. This urgent release does not include the unfinished `codex/current-tuning-tests` implementation or a new physical certificate. Publication must still originate from approved `main` and use its exact dispatched SHA.

The dispatch `runner` choice defaults to `ubuntu-24.04` and also accepts `ubuntu-24.04-arm`, an official standard runner for public repositories. Both jobs use the same selected Linux platform. ARM is an alternative when hosted runner assignment is delayed; the static browser bundle and release permissions remain the same. An already queued attempt should be cancelled before dispatching its replacement in the shared `pages` concurrency group.

**Current publication:** workflow/documentation source is preserved in `codex/pages-release` (`112aba4`, `8e80e29`); squash integration and explicitly authorized main promotion are `6e5061e`, synchronized remotely with `dev` and the preserved source branch. [Actions run 37366809747](https://github.com/s1vh-game-jams/FICIV-AnimaGameJam-MudanzasTortugaSL/actions/runs/37366809747) uses that exact main commit with `allow_game_test_failure=true`. The first attempt was cancelled before any step ran, with the annotation "The job was not acquired by Runner of type hosted even after multiple attempts", during the [GitHub Actions incident](https://www.githubstatus.com/). Rerunning the same authorized release succeeded: build at 20:19:07 UTC and deployment at 20:19:36 UTC on 2026-10-05. The public URL then loaded title → mode → Normal difficulty → actual running game, with all four cargo sprites and the timer advancing; the browser reported no errors/warnings. Publication uses the documented test exception and does not certify the failing physical regressions.

For subsequent human-approved releases:

- verify current official GitHub/Vite guidance and pin supported action versions;
- keep the active workflow on the approved `main` candidate;
- preserve GitHub Actions as the repository Pages source and the `github-pages` environment restriction to `main`;
- dispatch the workflow manually from `main`; `configure-pages` reads existing setup and does not enable Pages itself;
- do not auto-deploy `dev` or delete preserved auxiliary branches;
- inspect the actual live root and physics route, textures and WASM after deployment.

Dispatch using the Actions page or GitHub CLI:

```bash
gh workflow run jekyll-gh-pages.yml --ref main --repo s1vh-game-jams/FICIV-AnimaGameJam-MudanzasTortugaSL
```

For this explicitly approved jam publication only:

```bash
gh workflow run jekyll-gh-pages.yml --ref main --repo s1vh-game-jams/FICIV-AnimaGameJam-MudanzasTortugaSL -f allow_game_test_failure=true
```

The first release attempt is [Actions run 37365860940](https://github.com/s1vh-game-jams/FICIV-AnimaGameJam-MudanzasTortugaSL/actions/runs/37365860940), dispatched from `main` at `0e14828`; cancellation was requested while it remained queued, before dispatching the revised workflow. Local strict TypeScript, ESLint, root/Pages builds and all 11 Python helper tests pass. Vitest reports **645 passed / 51 failed across 29 files** (284.81 seconds), matching the pre-existing failures recorded in UX-013. Thirty-seven assertions still pin historical jump speed/charge values; other failures concern physical response/recovery and cannot all be dismissed as stale numeric expectations. Human settings commit `82380b1` changed the charge cap to 2 seconds and launch speed to 9.81 m/s, alongside grip/damping/balance/water tuning; this task preserves that configuration. Local Pages-subpath title/mode/difficulty/Normal and laboratory initialization succeed without browser errors. Publication uses the explicit human exception above; never present a queued workflow as a published site. The full local diagnostic log is ignored `artifacts/pages-tests.log`.

Before releasing Prototype 2, verify the required six-module Endless run in each difficulty, pause/results/navigation, safe non-scoring onboarding, seeded trap progression, pennants, bounded streaming, readability, absence of P0 softlocks, licensing/credits, updated backlog and human playtest approval. Every accessible authored module route/load and trap combination must pass real traversal with the release settings; mandatory jumps include full charge, wall recovery and the first grounded landing at or beyond the target. Verify swimming/bank exits separately. Rerun after jump, gravity, geometry, shell height or controller changes, including the opt-in exhaustive physical certificate. Capture normal-run dead-zone framing once and verify it stays fixed through jumps, camera holds and resize. Repeat both production root and repository-subpath navigation/texture/WASM checks. Record the actual release commit and URL.

## 6. Service and migration boundaries

The approved jam service foundation is a packaged catalog plus browser-local Top 100 and anonymous session, described in [BACKEND.md](BACKEND.md). It requires no API/database deployment or secrets. Browser records are scoped to origin/profile; a different host or port has separate records. Static Vite output and Pages cannot execute a future server API.

A future remote leaderboard/auth/catalog must document provider, versioned score model, CORS, abuse limits, score trust, fallback and secret handling. Account/editor writes require verified server-side ownership; public level reads and play remain anonymous. Never put private credentials into client Vite variables.

A hosting migration must update this document and the README, preserve static deployment where practical, and register any additional migration document in AGENTS.

Still unresolved: first successful live publication, custom domain if desired, release/tag convention, remote leaderboard provider and the outstanding release audit items in BACKLOG. LICENSE.md already records the owner's mixed-license terms; this deployment task does not change them.
