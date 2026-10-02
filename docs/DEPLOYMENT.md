# Deployment — Mudanzas Tortuga, S.L.

Local production serving and repository-subpath builds are implemented. GitHub Pages publication and its workflow remain pending; this document does not certify a live deployment.

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

`dev` is the integration/testing branch. Auxiliary branches are preserved after squash integration. Only an explicitly human-approved promotion to `main` may become a release; see [CONTRIBUTING](../CONTRIBUTING.md).

## 2. Serve the production build locally

Preferred Vite preview:

```bash
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/?mode=physics`. Vite preview is a local verification server.

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

Its tests require Python 3:

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

1. Open the root/title page; it must not advertise a normal physics menu entry.
2. Press `Shift+P`; verify the playground opens.
3. Direct-load and refresh `?mode=physics`.
4. Verify visible textures, collider drawing and a moving physical stack. An HTTP 200 alone does not prove WASM initialization.
5. Pause; simulation time and body poses must freeze. Single-step must add one fixed tick; resume must not catch up paused wall time.
6. Reset, change scenario/load, edit a valid parameter and restore baseline. Reset should preserve pause.
7. Repeat on the repository subpath, including direct access and refresh.
8. Inspect browser errors and asset/WASM requests.

Automated physics and Python helper coverage complement this smoke check. Human partial-loss/game-feel testing remains necessary. Designed-level completion, results, onboarding and full navigation cannot be certified by the physics-only milestone.

## 5. Future GitHub Pages release

No deployment workflow is installed in Prototype 1. When RELEASE-001 begins:

- verify current official GitHub/Vite guidance and pin supported action versions;
- select GitHub Actions as the repository Pages source;
- install using `npm ci`, run all checks, build with `npm run build:pages`, upload `dist/`;
- trigger publication from `main` after the human's release authorization;
- do not auto-deploy `dev` or delete preserved auxiliary branches;
- inspect the actual live root and physics route, textures and WASM after deployment.

Before releasing Prototype 2, also verify designed-level completion, pause/results/navigation, onboarding/readability, absence of P0 softlocks, licensing/credits, updated backlog and human playtest approval. Record the actual release commit and URL.

## 6. Service and migration boundaries

The game remains playable without a backend. A future leaderboard must document provider, versioned score model, CORS, abuse limits, score trust, fallback and secret handling. Never put private credentials into client Vite variables.

A hosting migration must update this document and the README, preserve static deployment where practical, and register any additional migration document in AGENTS.

Still unresolved: live Pages settings/workflow, custom domain, release/tag convention, remote leaderboard provider and final project licensing.
