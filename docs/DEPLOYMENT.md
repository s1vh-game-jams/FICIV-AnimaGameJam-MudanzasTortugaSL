# Deployment — Mudanzas Tortuga, S.L.

Local Vite production serving and repository-subpath builds are implemented. An inactive GitHub Pages workflow template exists under `/scripts/`; activation/publication remain pending final art/licenses and release approval. This document does not certify a live deployment.

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

Open `http://127.0.0.1:4173/?mode=physics`. Vite preview is a local verification server. The [README local-server guide](../README.md#-servidor-web-local-para-pruebas) provides tester-oriented setup, fixed-port commands, rebuild steps and troubleshooting.

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

The expected Pages URL is `https://s1vh-game-jams.github.io/FICIV-AnimaGameJam-MudanzasTortugaSL/`, subject to actual repository Pages configuration. That live site/settings have not been verified or enabled by this milestone.

## 4. Prototype 1 browser smoke check

After building, use a real browser:

1. Verify hidden Shift+P access, direct `?mode=physics` and refresh.
2. Verify textures, default 0.30 m shell registration, collider drawing, cargo and Rapier WASM initialization. Change shell height and verify coherent support/load placement with unchanged shapes.
3. Compare arrows/WASD. D must accelerate; C toggles debug.
4. Hold Space for partial/full/over-cap charges; release must launch once. Check lowered-head pose, no charge GUI, supported cargo and ordinary landing. At the current 8 m/s maximum, include high flight that carries cargo above the visible frame; visibility must not affect physics or connectivity.
5. Pause/blur during charge, then return: no deferred jump. Pause freezes time and help; neutral single-step advances physics by one tick without advancing onboarding.
6. Compare empty/sofa/full water behavior, initial dive momentum, swimming and bank exit.
7. Compare slopes and manual compensation; verify actual shell contact motion and visible feet.
8. Edit fine decimal values, rear/front movement percentages and per-side dead-zone percentage; check validated reset and pause preservation. Lab guides and physical bounds must match its fixed 76 pixels/metre scale. Dead-zone edits change the read-only normal-level framing preview without changing laboratory character size or physical corridor width. Resize the landscape viewport.
9. Enable help preview: speed/balance/jump sequence, first-water priority and per-run reset.
10. Export settings while paused: download must preserve time/tick/pause; its text round-trips through the shared codec. Replace source settings and rebuild/reload to verify permanent defaults; restore recovers loaded values.
11. Repeat root and repository-subpath production access, public/charge textures, refresh and WASM initialization; inspect browser errors.
12. At a reachable vertical blocker, exhaust the rear-margin space. Camera progression must hold while physics, time and jump charging continue; full-charge clearance must restore camera advance as accepted forward movement resumes.

Automated physics and Python helper coverage complement this smoke check. Human partial-loss/game-feel testing remains necessary. Designed-level completion, results and full navigation cannot be certified by the physics-only milestone.

## 5. Future GitHub Pages release

The provisional template is [scripts/pages-deploy.provisional.yml](../scripts/pages-deploy.provisional.yml). GitHub does not execute this file in `/scripts/`. No `.github/workflows/` release action is activated by this task, and no Pages settings or live site were changed.

The template uses manual `workflow_dispatch` only, guards both jobs to `refs/heads/main`, explicitly checks out `main`, runs the existing type/lint/game/helper checks and `build:pages`, then uploads/deploys the static artifact. Build and deployment permissions are separate; publication uses the `github-pages` environment. Full action SHAs have readable release comments, verified against the [official Vite Pages guide](https://vite.dev/guide/static-deploy.html#github-pages) and [GitHub custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Recheck those pins before activation. A local review/build cannot certify an Actions runner or successful Pages deployment.

After final art/licenses and explicit release approval:

- verify current official GitHub/Vite guidance and pin supported action versions;
- copy the reviewed template to `.github/workflows/pages.yml` on the approved `main` candidate;
- select GitHub Actions as the repository Pages source and restrict the `github-pages` environment to `main`, with any required human reviewer;
- dispatch the workflow manually from `main`; `configure-pages` reads existing setup and does not enable Pages itself;
- do not auto-deploy `dev` or delete preserved auxiliary branches;
- inspect the actual live root and physics route, textures and WASM after deployment.

Before releasing Prototype 2, verify the required six-module Endless run in each difficulty, pause/results/navigation, safe non-scoring onboarding, seeded trap progression, pennants, bounded streaming, readability, absence of P0 softlocks, licensing/credits, updated backlog and human playtest approval. The scope/plan revision of 2026-10-04 has not implemented or certified those routes. Every accessible authored module route/load and trap combination must pass real traversal with the release settings; mandatory jumps include full charge, wall recovery and the first grounded landing at or beyond the target. Verify swimming/bank exits separately. Rerun after jump, gravity, geometry, shell height or controller changes. Capture normal-run dead-zone framing once and verify it stays fixed through jumps, camera holds and resize. Repeat both production root and repository-subpath navigation/texture/WASM checks. Record the actual release commit and URL.

## 6. Service and migration boundaries

The approved jam service foundation is a packaged catalog plus browser-local Top 100 and anonymous session, described in [BACKEND.md](BACKEND.md). It requires no API/database deployment or secrets. Browser records are scoped to origin/profile; a different host or port has separate records. Static Vite output and Pages cannot execute a future server API.

A future remote leaderboard/auth/catalog must document provider, versioned score model, CORS, abuse limits, score trust, fallback and secret handling. Account/editor writes require verified server-side ownership; public level reads and play remain anonymous. Never put private credentials into client Vite variables.

A hosting migration must update this document and the README, preserve static deployment where practical, and register any additional migration document in AGENTS.

Still unresolved: live Pages settings/workflow, custom domain, release/tag convention, remote leaderboard provider and final project licensing.
