# Contributing to Mudanzas Tortuga, S.L.

Thank you for contributing to **Mudanzas Tortuga, S.L.**

This project is being developed under game-jam time pressure, but speed is not an excuse for losing provenance, silently changing design, breaking `dev`, hiding automated contributions, or pushing unverified work to production.

This workflow optimizes for:

- rapid experimentation;
- a buildable integration branch;
- preserved detailed feature history;
- explicit human local verification;
- traceable human/agent/subagent contributions;
- controlled promotion to production.

Before gameplay or architectural work, read:

```text
/AGENTS.md
/docs/GDD.md
/docs/PRD.md
/docs/BACKLOG.md
```

---

## 1. Branch hierarchy

```text
main
└── dev
    ├── feat/<topic>
    ├── fix/<topic>
    ├── docs/<topic>
    ├── refactor/<topic>
    ├── test/<topic>
    └── chore/<topic>
```

### `main`

`main` is the stable deployment/release branch.

Rules:

- It should represent a version considered safe for publication.
- GitHub Pages is expected to deploy from work promoted to `main`.
- Agents must **not merge, rebase, fast-forward, or otherwise promote `dev` into `main` without explicit human authorization**.
- Agents must not push an equivalent unapproved integration directly to `main`.
- Passing automated tests does not imply release authorization.

### `dev`

`dev` is the active experimental/integration branch.

Rules:

- Normal completed work lands here.
- Agents may integrate completed auxiliary branches into `dev` according to this document.
- `dev` should remain buildable/testable.
- Human local playtesting occurs here after agent-side checks.

### Auxiliary branches

Normal implementation happens on focused branches created from an up-to-date `dev`.

Recommended prefixes:

```text
feat/
fix/
docs/
refactor/
test/
chore/
```

Examples:

```text
feat/physics-playground
feat/cargo-contact-graph
feat/module-pool
fix/water-buoyancy-jitter
docs/pages-deployment
test/module-generator
```

Keep each branch focused on one coherent goal.

---

## 2. Auxiliary branches are historical records

**Do not delete auxiliary branches after squash integration.**

This intentionally differs from a conventional squash-and-delete workflow.

The project wants both:

1. a concise integration history on `dev`;
2. a detailed implementation history on the preserved auxiliary branch.

The preserved branch keeps:

- granular commits;
- implementation reasoning visible through history;
- human/agent/subagent attribution;
- useful provenance for regressions;
- a context trail for bringing a previous agent/subagent back to related work.

Therefore, after integration:

- do not delete the local branch;
- do not delete the remote branch;
- do not enable/use automatic branch deletion for these branches;
- do not force-rewrite shared history merely to make it prettier.

Delete/archive auxiliary branches only with explicit human approval.

---

## 3. Standard feature workflow

### Step 1 — synchronize `dev`

Conceptually:

```bash
git switch dev
git pull --ff-only
```

Do not destroy unrelated local work to obtain a clean tree.

### Step 2 — create a branch from `dev`

```bash
git switch -c feat/<short-topic>
```

Do not branch from `main` for normal development.

### Step 3 — work in meaningful commits

Prefer coherent commits that preserve the evolution of the feature.

Example:

```text
feat(physics): create fixed-step Rapier world
feat(playground): add turtle and representative cargo
test(physics): cover cargo loss hysteresis
docs(backlog): record playground milestone
```

The auxiliary branch is where detailed history belongs.

### Step 4 — run agent-side checks

Run every applicable script that exists:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Also perform focused runtime verification where relevant.

For physics/game-feel work, use `physics-playground`.

If a check does not exist, state that explicitly. Never report an unavailable test as passed.

### Step 5 — update documentation

Before integration, update all affected contracts:

- `/docs/BACKLOG.md`;
- `/docs/PRD.md` when approved technical/product requirements changed;
- `/README.md` when public setup, controls, modes, or top-level behavior changed;
- `/docs/DEPLOYMENT.md` when deployment behavior changed;
- `/AGENTS.md` whenever a file is added/renamed/moved/removed under `/docs/`.

Do not edit `/docs/GDD.md` merely to rationalize implementation drift.

### Step 6 — push/preserve the detailed branch

When remote access/authorization exists:

```bash
git push -u origin feat/<short-topic>
```

The remote auxiliary branch is part of project history and remains after integration.

### Step 7 — squash into `dev`

Conceptually:

```bash
git switch dev
git pull --ff-only
git merge --squash feat/<short-topic>
git commit
```

The squash commit should summarize the completed feature instead of reproducing every internal commit.

### Step 8 — synchronize `dev`

When remote access/authorization exists:

```bash
git push origin dev
```

Afterward, both histories should exist remotely:

```text
origin/dev
origin/feat/<short-topic>
```

### Step 9 — human local verification

The human will test the integrated `dev` build locally after agent checks.

Report:

- what changed;
- automated checks performed;
- manual/diagnostic route to exercise the feature;
- known limitations;
- follow-up backlog work.

Do not promote to `main`.

---

## 4. Promotion from `dev` to `main`

Promotion is a separate release action.

**Explicit human authorization is mandatory.**

Without it, agents must not:

- merge `dev` into `main`;
- rebase/fast-forward `main` onto development work;
- cherry-pick the integrated feature set into `main`;
- push an equivalent release commit to `main`;
- modify deployment configuration in a way that bypasses this approval boundary.

When authorization is given, follow `/docs/DEPLOYMENT.md`.

---

## 5. Commit style

Use clear imperative Conventional-Commit-style subjects where practical.

Examples:

```text
feat(physics): add cargo contact graph
fix(water): stabilize buoyancy near surface
test(modules): stress seeded compatibility
docs(backlog): close playground milestone
refactor(rendering): centralize public asset URLs
```

Avoid:

```text
updates
fix stuff
changes
final final
```

Temporary WIP commits may exist inside an auxiliary branch when necessary, but meaningful history is preferred.

---

## 6. Human, agent, and subagent attribution

Automated contributions should not become anonymous.

The point is practical provenance and fair credit:

- understand who/what built a subsystem;
- inspect how an approach evolved;
- restore useful context to a previous agent;
- diagnose regressions;
- improve future delegation.

### Never fabricate identity

Do not invent:

- a GitHub username for Codex;
- a model email address;
- a verified identity for a subagent.

GitHub's standard `Co-authored-by:` trailer should be used **only** when a real valid contributor name/email identity is known and authorized.

Do not guess a model/version or copy a stale example identity; record it only when the current runtime exposes it.

### Preferred agent trailers

When agent participation is material:

```text
Agent-Assisted-by: OpenAI Codex (<actual model/version if known>)
Agent-Role: implementation, tests
```

When subagents participate materially:

```text
Subagent-Assisted-by: <identifier/model> — physics investigation
Subagent-Assisted-by: <identifier/model> — test review
```

If a future Codex/GitHub integration exposes an authentic contributor identity, standard co-author metadata may then be used.

### Example feature commit

```text
feat(physics): implement cargo loss hysteresis

Keep temporarily disconnected cargo active for a tunable grace period
and disable gameplay collisions once an item is definitively lost.

Agent-Assisted-by: OpenAI Codex (<actual model/version if known>)
Agent-Role: implementation, tests
Subagent-Assisted-by: <identifier> — contact-graph review
```

### Example squash commit on `dev`

```text
feat(physics): integrate cargo stability prototype

Adds fixed-step simulation, representative cargo, shell interaction,
loss hysteresis, and playground reset/debug behavior.

Squashed-from: feat/physics-playground
Contributors: Miguel Campins; OpenAI Codex (<actual model/version if known>)
```

The squash message is concise by design. Detailed attribution/history stays on the preserved source branch.

---

## 7. Documentation is part of Definition of Done

Code is not finished when its controlling documentation is wrong.

### `/docs/BACKLOG.md`

Update it as part of development.

When work is complete, attach the integration commit once available:

```text
DONE — `abc1234`
```

For regressions/fixes:

```text
suspected-introduced-by: `abc1234`
fixed-by: `def5678`
```

Do not invent provenance. Use `unknown` when uncertain.

### `/AGENTS.md`

Any new `/docs/` file must be added to the documentation registry **in the same change**.

---

## 8. GDD discipline

`/docs/GDD.md` is the source of truth for game design.

Do not alter it because current code behaves differently.

If implementation exposes a genuine design problem:

1. document the mismatch;
2. keep the implementation reversible where practical;
3. identify the minimum design decision needed;
4. update the GDD only after human approval.

Engineering-only debug tools belong in the PRD/development documentation instead.

---

## 9. Testing discipline

Target checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Runtime changes should also receive focused browser verification.

Prioritize tests for:

- score calculations;
- module compatibility;
- deterministic seeded generation;
- active cargo/contact graph;
- loss state transitions/hysteresis;
- screen/game state transitions;
- data/config validation;
- regression cases.

Avoid brittle tests based on exact floating-point trajectories. Use stable invariants and `physics-playground` for game-feel work.

---

## 10. Physics-playground is a first-class development tool

For core physics work, validate behavior in `physics-playground`.

Access:

```text
Shift + P
```

from the main menu, or direct:

```text
?mode=physics
```

A core physics change that cannot be reproduced or inspected in the playground should have a clear reason.

---

## 11. Assets

Prototype/final static sprite assets live under:

```text
/public/sprites/{entity}/
```

Do not duplicate them under `/src`.

Keep art and colliders decoupled.

Before adding a third-party asset:

- verify its license;
- preserve required attribution;
- document restrictions;
- never assume public Internet availability means reusable.

Audio licensing will be documented separately when audio is selected.

---

## 12. Reusable scripts

Reusable helpers belong under:

```text
/scripts/
```

If an agent creates a useful diagnostic one-off script, clean/refactor it into this directory.

Do not commit secrets, credentials, or machine-specific personal paths.

---

## 13. Pull requests

Pull requests are optional during rapid local jam iteration unless the human/repository requires them.

When used, describe:

- scope;
- backlog IDs;
- tests;
- manual verification route;
- known limitations;
- documentation changes;
- agent/subagent participation.

Do not configure PR merge behavior to automatically delete preserved auxiliary branches.

---

## 14. Jam scope control

Before adding systems, compare the idea against `/docs/PRD.md` and `/docs/BACKLOG.md`.

Prefer:

- stable/tunable cargo physics;
- completing the minimum designed level;
- readable hazards and feedback;
- the required biomes;
- robust module composition;
- fixing softlocks;
- replacing prototype art cleanly.

Do not let optional work jeopardize the minimum jam build.

Optional/deferred work includes, unless the backlog explicitly reprioritizes it:

- remote Top 100 leaderboard;
- Endless Run;
- user-created level editor/content;
- broad content expansion.

---

## 15. Licensing

`/LICENSE.md` is currently provisional.

Public source availability is not by itself permission to reuse it.

Do not change licensing terms or add incompatibly licensed dependencies/assets without explicit approval.

---

## 16. Integration checklist

Before saying an auxiliary branch is ready:

- [ ] Created from `dev`.
- [ ] Scope matches GDD/PRD.
- [ ] Applicable automated checks pass.
- [ ] `npm run build` passes.
- [ ] Runtime behavior checked where appropriate.
- [ ] `BACKLOG.md` updated.
- [ ] Other affected docs updated.
- [ ] New `/docs/` files registered in `AGENTS.md`.
- [ ] Agent/subagent participation attributed without fabricated identities.
- [ ] Detailed auxiliary branch history preserved.
- [ ] Auxiliary branch pushed when remote access is available.
- [ ] Squash integration committed on `dev`.
- [ ] `dev` pushed when remote access is available.
- [ ] `main` untouched unless explicit human authorization was given.
