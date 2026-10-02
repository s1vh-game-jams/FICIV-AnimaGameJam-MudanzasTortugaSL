# Deployment — Mudanzas Tortuga, S.L.

> **PLACEHOLDER DOCUMENT**
>
> This file contains only the deployment decisions known at project bootstrap.
> It **must evolve** as the repository name, Vite configuration, GitHub Actions workflow, domain, leaderboard service, or hosting platform becomes concrete.
>
> Current target: **GitHub Pages**
>
> Current release branch: **`main`**
>
> Development integration branch: **`dev`**

---

## 1. Current deployment goals

The jam build should deploy as a static site:

```text
TypeScript/Pixi/Rapier source
          ↓
      Vite build
          ↓
        dist/
          ↓
     GitHub Pages
```

No backend is required for the core game.

A future leaderboard may call an external service, but gameplay and build deployment must remain independently functional.

---

## 2. Release branch rule

Expected relationship:

```text
feature/* ── squash ──▶ dev ── explicit human approval ──▶ main ──▶ Pages
```

**Agents must not promote `dev` into `main` without explicit human authorization.**

GitHub Pages deployment should ultimately trigger from `main`, not from every experimental `dev` change.

---

## 3. Vite base path

The final value depends on the repository URL.

### User/organization root site or custom domain

If deployed to:

```text
https://<USERNAME>.github.io/
```

or a custom domain, Vite normally uses:

```ts
base: "/"
```

### Project Pages site

If deployed to:

```text
https://<USERNAME>.github.io/<REPOSITORY>/
```

configure:

```ts
base: "/<REPOSITORY>/"
```

Do not finalize this placeholder until the actual repository name/location is known.

---

## 4. Public assets

Assets stored physically under:

```text
/public/sprites/...
```

are copied into the Vite build.

Runtime code must not assume site-root hosting.

Use a shared helper based on:

```ts
import.meta.env.BASE_URL
```

Example shape:

```ts
export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\/+/, "")}`;
}
```

Then:

```ts
publicAsset("sprites/turtle/walk-01.png")
```

Do not scatter:

```ts
"/sprites/turtle/walk-01.png"
```

through the codebase.

---

## 5. Local development

Expected:

```bash
npm install
npm run dev
```

---

## 6. Production build

Expected:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Output is expected at:

```text
/dist
```

unless the Vite configuration deliberately changes `build.outDir`.

---

## 7. Production preview

Preferred:

```bash
npm run preview
```

Alternative helper:

```bash
python scripts/localServer.py --directory dist --port 4173
```

The Python helper is also a **placeholder utility** and may evolve.

Do not use `vite preview` as a production server; it is only for local preview of the built site.

---

## 8. GitHub Pages configuration — planned

When deployment is implemented:

1. Open repository **Settings → Pages**.
2. Select **GitHub Actions** as the Pages source.
3. Add a Pages workflow under:

```text
/.github/workflows/deploy.yml
```

4. Configure it to build/deploy on pushes to:

```text
main
```

5. Use `npm ci` in CI when `package-lock.json` is present.
6. Upload `/dist` as the Pages artifact.
7. Deploy using GitHub's Pages actions.

Exact action versions should be selected/updated when the workflow is actually created rather than frozen in this placeholder.

Conceptual workflow:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<CURRENT_VERSION>
      - uses: actions/setup-node@<CURRENT_VERSION>
        with:
          node-version: lts/*
          cache: npm

      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build

      - uses: actions/configure-pages@<CURRENT_VERSION>
      - uses: actions/upload-pages-artifact@<CURRENT_VERSION>
        with:
          path: dist

      - id: deployment
        uses: actions/deploy-pages@<CURRENT_VERSION>
```

Before committing the real workflow, verify current official GitHub/Vite guidance and pin appropriate action versions.

---

## 9. Rapier/WASM deployment checks

Rapier2D is WebAssembly-backed.

Production smoke testing must verify:

- the `.wasm` asset/module loads successfully;
- GitHub Pages serves it correctly;
- initialization is awaited before physics-dependent game startup;
- refreshing/direct-loading supported routes/query modes does not break initialization.

Because routing is expected to remain a single-page static entry with query/state navigation, avoid introducing server-side route requirements.

---

## 10. Physics-playground deployment check

The production build should support:

```text
https://<site>/?mode=physics
```

and the main-menu shortcut:

```text
Shift + P
```

This provides a useful post-build diagnostic without exposing the playground as a normal menu option.

---

## 11. Leaderboard deployment boundary

MVP:

```text
no remote backend required
```

Optional future:

```text
GitHub Pages frontend
        ↓ HTTPS
external leaderboard API
```

Any future backend configuration must document:

- provider;
- API base URL strategy;
- CORS;
- authentication if any;
- abuse/rate limits;
- score trust model;
- secrets handling;
- failure fallback.

**Never place private backend secrets in Vite client environment variables**, because client-side Vite values are bundled for users.

---

## 12. Release checklist — placeholder

Before requesting human approval to promote `dev` to `main`:

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] Production build opens locally.
- [ ] `?mode=physics` opens.
- [ ] Pixi assets load with configured `base`.
- [ ] Rapier initializes.
- [ ] Designed level completes.
- [ ] Results return to main menu.
- [ ] No known P0 softlock remains.
- [ ] License/third-party asset audit is current.
- [ ] `/docs/BACKLOG.md` is current.
- [ ] `/README.md` matches player-facing build state.
- [ ] Human performs local playtest on `dev`.
- [ ] Human explicitly authorizes promotion.

After authorization/deploy:

- [ ] Verify live site.
- [ ] Verify direct `?mode=physics` URL.
- [ ] Verify asset/WASM network requests.
- [ ] Verify game flow.
- [ ] Record release commit/tag if the project adopts tagging.

---

## 13. Migration rule

If hosting moves away from GitHub Pages:

1. update this document first/as part of the migration;
2. update `/AGENTS.md` if the deployment responsibility/path changes;
3. update `/README.md` simplified instructions;
4. preserve static deployment where possible;
5. add `/docs/MIGRATION.md` if the change is complex, and register it in `/AGENTS.md`.

---

## 14. Placeholder status

The following are intentionally unresolved:

- GitHub owner/account;
- repository name;
- final Pages URL;
- final Vite `base`;
- action versions;
- optional custom domain;
- remote leaderboard provider;
- release/tag naming convention.

Replace placeholders only with verified project values.
