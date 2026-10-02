# AGENTS.md — Mudanzas Tortuga, S.L.

> Operational contract for Codex and any other coding agents working in this repository.
>
> **Read this file before making changes.**
> Whenever any documentation file is added, renamed, moved, or removed under `/docs/`, update the documentation registry in this file **in the same change**.

---

## 1. Project mission

**Mudanzas Tortuga, S.L.** is a lightweight 2D browser game created for the **Anima Valencia Game Jam 2026**, part of **FICIV — Festival Internacional de Cine Infantil de Valencia**.

The player controls Don Tortuga, who keeps moving to the right while carrying a precarious stack of household objects on his shell. Don Tortuga is not the failure resource: the **moving load is**. Terrain, inertia, impacts, hazards, slopes, and water threaten individual cargo items, producing partial losses and recoverable chaos rather than binary death.

The jam build should prioritize:

- fast browser loading;
- no installation;
- static hosting where practical;
- deterministic and debuggable systems;
- fast physics tuning;
- simple physical geometry;
- readable feedback for a child/family audience;
- minimal runtime dependencies;
- no mandatory backend.

Current technical foundation:

- **TypeScript**
- **Vite**
- **PixiJS 8** for rendering/presentation
- **Rapier2D** (`@dimforge/rapier2d`) for physics
- **HTML/CSS** for lightweight UI
- **npm** as the default package manager unless the repository later establishes another one

Do not replace this foundation with a larger engine/framework without a concrete architectural reason and explicit human approval.

---

## 2. Mandatory agent startup checklist

Before implementing, reviewing, refactoring, testing, merging, or documenting a task:

1. Read this file completely.
2. Read `/docs/GDD.md` for every task that can affect gameplay, mechanics, scoring, controls, camera, level design, biomes, traps, onboarding, tone, UX, or player-facing rules.
3. Read `/docs/PRD.md` for the current technical architecture, jam scope, acceptance criteria, build stages, and `physics-playground`.
4. Read `/docs/BACKLOG.md` for priorities, dependencies, completed work, deferred work, and known follow-ups.
5. Read `/CONTRIBUTING.md` before branch creation, commits, squash integration, pushes, attribution, or any operation involving `dev`/`main`.
6. Read `/docs/DEPLOYMENT.md` before changing Vite `base`, asset URL handling, build output, GitHub Actions, Pages settings, hosting, or release behavior.
7. Read any additional document registered in section 5 when its responsibility overlaps the task.
8. Inspect the current branch, working tree, package scripts, dependency versions, and existing code before assuming this bootstrap still describes implementation details exactly.
9. Prefer the smallest coherent change that satisfies the relevant sources of truth.
10. Run all applicable automated checks that actually exist.
11. Update documentation and `/docs/BACKLOG.md` before declaring the task ready for human local verification.

Do not skip documentation because a task looks small. The repository intentionally stores gameplay intent, technical constraints, production scope, and workflow rules in writing so humans and agents can collaborate without silently diverging.

---

## 3. Authority, operational scope, and conflict resolution

When documents overlap, use this hierarchy:

1. **The human's latest explicit instruction for the current task.**
2. **`/docs/GDD.md`** for the complete game design and intended player experience.
3. **`/docs/PRD.md`** for the technical realization and the operational scope of the current prototype/release phase.
4. **`/CONTRIBUTING.md`** for branch/commit/merge/push/authorship workflow.
5. **`/docs/BACKLOG.md`** for current work state, priority, sequencing, and tracked deferrals.
6. **`/docs/DEPLOYMENT.md`** for deployment and environment-specific procedure.
7. **`/README.md`** as the public-facing summary.

### 3.1 Complete design vs. current implementation scope

The GDD and PRD have different jobs:

- The **GDD is the source of truth for the complete game design**: rules, intended experience, UX, content model, scoring, modes, biomes, hazards, and long-term behavior.
- The **PRD is a phase-specific projection of that design**: it defines which subset must be implemented now, which systems are development-only, which complete-game features are stretch goals, and which are intentionally deferred.
- Therefore, **a feature being present in the GDD but omitted or deferred by the PRD is not a contradiction**.
- Example: the complete design contains four biomes and leaderboards; the Game Jam prototype may require only three biomes including water and may ship without a remote leaderboard.
- Even when a complete-game feature is out of scope, current architecture should remain compatible with it when doing so does not add disproportionate complexity.

Operational rule:

> **Use the GDD to decide what the game means; use the PRD to decide what this phase must build.**

Do not expand the current prototype merely because the GDD describes a later/full-game feature.

### 3.2 Technical extensions and approved clarifications

The PRD may define development-only facilities that intentionally do not belong in the player-facing GDD, including:

- `physics-playground`;
- diagnostics/debug shortcuts;
- test hooks;
- build/deployment rules;
- service boundaries;
- prototype-specific acceptance criteria.

The PRD may also contain an explicitly labelled **approved clarification** when the human has resolved an ambiguity or refined wording that has not yet been synchronized back into the GDD. Such a clarification is deliberate; it is not permission for agents to invent design changes.

Do not silently reinterpret the GDD. If code constraints appear to require a genuine design change:

1. document the discrepancy;
2. keep the implementation reversible where practical;
3. obtain/record a human design decision;
4. update the appropriate source document only when authorized.

Never rewrite the GDD merely to make current code easier to justify.

---

## 4. Language policy

Repository documentation uses:

- **Spanish:** `/README.md`, `/docs/GDD.md`
- **English:** all other documentation unless explicitly approved otherwise

Code identifiers, maintainers' comments, branch names, commit messages, tests, diagnostics, and agent notes should normally be in **English**.

Player-facing copy may be Spanish and should follow the brand/tone defined in the GDD.

---

## 5. Documentation registry

This table is mandatory project metadata.

**Any file added to `/docs/` must be registered here in the same commit/change.**

| Path | Language | Canonical responsibility | Agent behavior |
|---|---|---|---|
| `/README.md` | Spanish | Public repository cover; concise game overview; local setup/testing; simplified deployment; tester access to `physics-playground`. | Keep attractive and concise. Update when public setup, controls, modes, or top-level structure materially changes. |
| `/CONTRIBUTING.md` | English | Development methodology; branch hierarchy; preserved auxiliary-branch history; squash workflow; testing; documentation; attribution. | Read before Git operations. Never delete auxiliary branches as routine cleanup. Never promote `dev` to `main` without explicit human authorization. |
| `/LICENSE.md` | English | Provisional licensing notice and licensing boundaries. | Do not alter licensing intent without explicit approval. Check all third-party asset/audio licenses before inclusion. |
| `/docs/GDD.md` | Spanish | **Complete Game Design Document; source of truth for game design and UI/UX.** | Read before gameplay/player-facing changes, especially section 41 for UI/UX. Do not edit unless explicitly requested or an approved design change must be incorporated. |
| `/docs/PRD.md` | English | Product/technical requirements: architecture, phase-specific scope, build stages, `physics-playground`, approved implementation clarifications, assets, service boundaries, acceptance criteria. | Read before implementation. Use it to determine what the current phase must build while preserving compatibility with the complete GDD. |
| `/docs/BACKLOG.md` | English | Living task pool, priorities, dependencies, status, commit references, regression provenance, post-jam deferrals. | Updating it is part of development. Close tasks with commit hashes when known. Record suspected bug-introducing commits when useful and evidenced. |
| `/docs/DEPLOYMENT.md` | English | Local production serving, root/subpath builds, and pending GitHub Pages release procedure. | Read before build/base/hosting changes. Distinguish verified local serving from pending live publication. |
| `/docs/PHYSICS.md` | English | Current physical architecture, diagnostic controls, canonical configuration and tuning workflow. | Read for physics/playground changes. Keep implementation facts current; human feel validation remains separate. |
| `/docs/ASSETS.md` | English | Original placeholder provenance, dimensions, anchors, animation and artist repaint contract. | Read before visual replacements or registration changes. Preserve physics/art separation and record imported licenses. |

### Future documentation

Add focused documents when complexity justifies them. Examples:

- `/docs/API.md`
- `/docs/ASSETS.md`
- `/docs/AUDIO.md`
- `/docs/DEVELOPMENT.md`
- `/docs/LEVEL_FORMAT.md`
- `/docs/MIGRATION.md`
- `/docs/MCP.md`
- `/docs/PARITY.md`
- `/docs/PHYSICS.md`
- `/docs/TESTING.md`

When creating one:

1. Give it one clear responsibility.
2. Add it to this registry **in the same change**.
3. Link to it from the document that naturally owns the concern.
4. Update `/README.md` only if ordinary repository users need to discover it.
5. Do not duplicate canonical rules across several documents; link to the owner instead.

If project-specific MCP configuration or operating instructions become necessary, store their project documentation/configuration material under `/docs/` and register it here.

---

## 6. Target repository structure

Directories should be created incrementally as responsibilities appear. Do not generate empty architecture merely for appearance.

```text
/
├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── LICENSE.md
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
│
├── docs/
│   ├── GDD.md
│   ├── PRD.md
│   ├── BACKLOG.md
│   ├── DEPLOYMENT.md
│   └── ... future registered documentation
│
├── public/
│   ├── sprites/
│   │   ├── turtle/
│   │   ├── cargo/
│   │   ├── terrain/
│   │   ├── hazards/
│   │   ├── ui/
│   │   └── ... entity/category directories as needed
│   └── audio/
│       └── ... only after licensing is documented
│
├── src/
│   ├── main.ts
│   ├── app/
│   │   ├── bootstrap/
│   │   ├── routing/
│   │   └── screens/
│   ├── game/
│   │   ├── config/
│   │   ├── core/
│   │   ├── physics/
│   │   ├── entities/
│   │   │   ├── turtle/
│   │   │   ├── cargo/
│   │   │   └── hazards/
│   │   ├── systems/
│   │   ├── modes/
│   │   │   ├── physics-playground/
│   │   │   ├── designed-level/
│   │   │   └── endless/
│   │   └── content/
│   │       ├── modules/
│   │       ├── levels/
│   │       └── turtle-configurations/
│   ├── rendering/
│   ├── ui/
│   ├── styles/
│   └── utils/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
└── scripts/
    ├── localServer.py
    └── ... reusable agent/developer utilities
```

The concrete implementation may simplify this structure. Prefer a small number of clear modules to speculative abstraction.

---

## 7. Core architecture boundaries

### 7.1 PixiJS is presentation; Rapier is physics

Keep rendering and physical simulation separate.

**PixiJS owns:**

- scene graph;
- sprites/textures;
- visual transforms;
- backgrounds/parallax;
- particles and presentation feedback;
- visual overlays/debug drawing where appropriate.

**Rapier2D owns:**

- rigid bodies;
- colliders;
- mass/inertia/center-of-mass behavior;
- collision/contact resolution;
- sensors;
- physical world stepping;
- collision/contact events.

Do not make a Pixi sprite transform authoritative for a dynamic Rapier body.

Conceptual frame flow:

```text
input
  ↓
controller/gameplay intent
  ↓
fixed physics step(s)
  ↓
authoritative physics state
  ↓
render synchronization/interpolation
  ↓
Pixi render
```

### 7.2 Fixed physics timestep

Use a fixed physics timestep, initially targeting **60 Hz**, decoupled from rendering cadence.

Do not tune game behavior around variable render delta. Render interpolation may be added later, but must not mutate authoritative physics state.

### 7.3 Centralized tuning

Physics/game-feel constants must not be scattered across entities.

Prefer one configuration layer under:

```text
/src/game/config/
```

Expose the parameters identified by the GDD/PRD, especially:

- turtle base/min/max speed;
- acceleration and braking;
- camera safe-window behavior;
- shell angular speed;
- shell maximum angle;
- angular damping;
- gravity;
- cargo mass;
- friction/grip assistance;
- cargo damping;
- contact-loss hysteresis;
- impact response;
- biome response;
- buoyancy/current strength;
- telegraph timing.

The `physics-playground` and the game must consume the **same canonical tuning values**.

### 7.4 Avoid hidden magic

Gameplay-significant constants should have:

- a meaningful name;
- one authoritative definition;
- an understandable unit/meaning where practical;
- a reason to exist.

### 7.5 Data-driven content

Keep modules, levels, turtle configurations, cargo archetypes, biomes, and hazards data-driven enough to expand without rewriting the core loop.

Initial content may use typed TypeScript objects. Prefer serializable shapes where reasonable so future user-created content/editor work remains possible.

---

## 8. Static assets and prototype art

Direct static sprite assets live physically at:

```text
/public/sprites/{entity-or-category}/
```

Examples:

```text
/public/sprites/turtle/
/public/sprites/cargo/sofa/
/public/sprites/cargo/tv/
/public/sprites/cargo/cocktail-glass/
/public/sprites/cargo/floor-lamp/
/public/sprites/hazards/
/public/sprites/terrain/
```

Do not duplicate the same assets under `/src`.

### 8.1 Vite/GitHub Pages URL safety

GitHub Pages may host the game below a repository subpath. Never scatter absolute root URLs such as:

```ts
"/sprites/turtle/walk-01.png"
```

Create/use one shared public-asset URL helper based on:

```ts
import.meta.env.BASE_URL
```

Conceptually:

```ts
publicAsset("sprites/turtle/walk-01.png")
```

must work at both:

```text
http://localhost:5173/
```

and:

```text
https://<user>.github.io/<repo>/
```

Cover this with build/deployment smoke testing.

### 8.2 Prototype visual rule

The first prototype intentionally uses simple art:

- solid-color shapes;
- text labels naming represented entities;
- clear silhouettes;
- simplified physical geometry;
- consistent anchor/origin conventions.

These placeholders are **art scaffolding**, not a requirement that final art match collider detail.

Keep visuals and colliders decoupled so the artist can replace or paint over prototype sprites without gameplay rewrites.

### 8.3 Turtle animation contract

The intended right-walking animation is one second at **60 logical frames / 60 FPS**.

For the prototype:

- only **two unique keyframe images** are required;
- animation logic may alternate/reuse those images across the 60 logical frames;
- do **not** create 58 duplicate image files just to satisfy frame count.

The artist may later replace logical slots with true in-betweens without changing gameplay behavior.

PNG or vector-derived art is acceptable. Choose the format by visual workflow/performance, not collider complexity.

---

## 9. Physics-playground

`physics-playground` is an internal development/test mode defined by the PRD, not a player-facing GDD requirement.

It is mandatory for the first prototype milestone and should remain useful throughout development.

Access contract:

- from main menu: **`Shift + P`**
- direct/automation access: **`?mode=physics`**

The normal player UI must not advertise the shortcut. `/README.md` intentionally documents it for testers/contributors.

The playground should grow only when it improves tuning/diagnosis. Useful capabilities include:

- deterministic reset;
- representative turtle/cargo stack;
- representative terrain and required biomes;
- pause;
- single-step physics if practical;
- collider/contact debug rendering;
- current parameter readout;
- live tuning controls where they save iteration time;
- quick scenario switching.

Debug-only behavior must not leak into normal game rules.

The **first playable build** may consist only of the systems required by this playground.

---

## 10. Gameplay implementation guardrails

The GDD remains canonical. These are engineering reminders, not replacements.

### Cargo

- Cargo objects are independent physical bodies.
- Jam minimum: four mechanically distinct cargo archetypes.
- Visual complexity must not require complex colliders.
- Center of mass may differ from geometric center.
- Small errors should favor partial loss over total collapse.

### Active cargo graph

The active load is conceptually a contact graph rooted at Don Tortuga's shell.

An object remains active while connected to the shell directly or through other active cargo.

Temporary separation must use hysteresis/grace time; one missing-contact tick must not instantly lose an object.

Once definitively lost:

- it stops counting toward active cargo/score potential;
- it stops physically affecting Don Tortuga/gameplay;
- it cannot create a softlock;
- it may continue visually for comedic effect.

### Biomes

**Game Jam prototype scope (PRD):**

- at least **three of the four** GDD biomes;
- **water is mandatory**.

The complete-game design still contains all four biomes. Omitting one from the jam prototype is a scope decision, not a design change.

Water must preserve the GDD's special relationship among retained mass, depth, buoyancy, and stronger deep current.

### Modules

The designed level and potential Endless Run consume the **same module pool**.

Author modules first to make the designed jam level good. If Endless Run is implemented, it uses the complete set of compatible available modules rather than a separate procedural-only pool.

The jam does not require examples of all sixteen abstract biome transition combinations.

### Hazards

- minimum: two distinct hazard types;
- desired: three;
- hazards destabilize cargo rather than damage Don Tortuga;
- relevant threats must obey GDD telegraphing/readability rules.

---

## 11. Application flow and UI/UX implementation rules

Do not introduce React/Vue/Svelte or another UI framework merely for menus. HTML/CSS is the default UI layer.

The complete UI/UX design is defined in **GDD section 41**. For the Game Jam prototype, implement the PRD-scoped subset while keeping behavior compatible with that section.

### 11.1 Player-facing flow

```text
Main Menu
  ├── Credits (recommended for the jam)
  │     └── back to Main Menu
  │
  └── Mode Select
        ├── Designed Levels
        │     ↓
        │   Level Select
        │     ↓
        │   Level 1
        │     ↕
        │   Pause
        │     ↓
        │   Results / delivery note
        │     ├── Retry same level
        │     └── Main Menu
        │
        └── Endless Run — "Próximamente"
```

If Endless Run is implemented, replace the disabled/coming-soon state without changing the overall navigation contract unnecessarily.

`physics-playground` is a hidden development route, not a normal mode selector entry.

### 11.2 Menu and pause behavior

The Game Jam UI should be fully operable without a mouse:

- arrows move selection;
- `Enter` confirms;
- `Esc` returns to the previous menu;
- during gameplay, `Esc` opens/closes pause;
- mouse input may also be supported in menus;
- selected options must not rely on color alone.

While paused:

- physics is frozen;
- the run timer is frozen;
- **Continue** is selected by default;
- restart/exit require brief confirmation;
- selecting **Show controls again** resets contextual-help state but **does not unpause the game**;
- contextual help resumes only after the player explicitly leaves pause.

### 11.3 HUD

Designed-level gameplay HUD:

- initial-cargo icon row;
- lost objects become visually disabled/crossed out;
- run timer;
- no live designed-level score.

Keep the right side visually clear enough for upcoming terrain, hazards, and branches.

### 11.4 Approved contextual-help clarification

For implementation, use these approved rules for GDD section 41.7:

- there are three help messages: speed, shell balance, and swimming;
- each message has a fixed configurable display duration of approximately **3–5 seconds**, chosen according to text density/readability;
- the message disappears on its timer; **input is not required to dismiss it**;
- once its display period completes, it is considered seen **for the current run/level instance only**;
- help state is **not persisted across runs, browser sessions, or accounts**;
- replaying the same level starts with fresh help state;
- swimming help appears the first time Don Tortuga enters water during that run;
- the authored jam level must not place reachable water so early that speed/balance onboarding can overlap with swimming onboarding;
- specifically, water should not be immediately after the start and should be unreachable before the first two messages have completed at the fastest permitted early-run traversal;
- if malformed/community content nevertheless creates an overlap, the swimming message preempts the shell-balance message;
- future user-created levels are required to remain technically completable, but the engine cannot guarantee that user-authored onboarding layout is good design.

### 11.5 Results delivery note

The designed-level results screen follows GDD section 41.5.5.

For the delivery-status stamp:

1. compute delivered-value percentage from `Vₑ / V₀`;
2. convert it to percentage;
3. **round to the nearest integer**;
4. select the documented stamp range using that integer.

This stamp calculation is separate from the GDD's perfect-move bonus rule.

### 11.6 Loss feedback

Loss notifications must remain brief and non-blocking.

Where implemented in the jam build:

- group several near-simultaneous object losses into one accident notification;
- do not repeat the same line twice in a row;
- update the cargo HUD immediately when an object becomes definitively lost;
- keep the joke aimed at the moving service/logistics rather than at displaced animals or the player.

---

## 12. Leaderboard service boundary

The complete GDD includes level leaderboards. The **Game Jam prototype PRD may defer the remote/global implementation**; this is an operational scope decision, not removal of the feature from the complete game.

A remote leaderboard is desirable, not mandatory for jam completion.

The game must remain playable without a backend.

Keep persistence behind an interface, for example:

```ts
interface LeaderboardService {
  submitScore(entry: ScoreEntry): Promise<void>;
  getTopScores(levelId: string, limit?: number): Promise<ScoreEntry[]>;
}
```

A local implementation may use `localStorage`.

A future remote implementation must be swappable without rewriting scoring/gameplay.

Reserve version fields because the GDD requires rankings to remain tied to meaningful level/physics versions:

```ts
interface ScoreEntry {
  playerName: string;
  score: number;
  timeMs: number;
  levelId: string;
  levelVersion: string;
  physicsVersion: string;
  timestamp: number;
}
```

Desired future remote ranking: **Top 100** for the designed level/version.

Do not add secrets to the browser bundle.

---

## 13. Testing expectations

Run every applicable check that exists before integration into `dev`.

Target package-script contract:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Use:

```bash
npm run dev
```

for development and:

```bash
npm run preview
```

to inspect the production build.

If a script is not implemented:

- do not claim it passed;
- state that it is unavailable;
- update the backlog if the missing check should be added.

### High-value automated coverage

Prioritize deterministic logic:

- module biome compatibility;
- connector/height metadata;
- infinite-pool dead-end validation;
- seeded generation;
- score formulas;
- cargo state transitions;
- active-cargo graph;
- contact-loss hysteresis;
- game screen/state transitions;
- pause freezes physics and timer;
- contextual-help timer/priority/reset behavior;
- results-stamp rounding/range selection;
- content/config validation;
- softlock-prevention invariants where feasible.

Avoid brittle golden tests for exact floating-point trajectories unless a regression specifically requires them.

Prefer physics invariants:

- finite body states;
- valid turtle control bounds;
- lost cargo no longer interacts;
- deterministic configured resets;
- clean module joins;
- increased retained weight changes water behavior in the intended direction.

Use `physics-playground` plus human playtesting for subjective game feel.

---

## 14. BACKLOG is part of development

Updating `/docs/BACKLOG.md` is not optional housekeeping.

When completing a task:

1. update its status;
2. record the relevant commit hash when it exists;
3. preserve follow-ups rather than silently expanding scope;
4. record known limitations;
5. for regressions, record a suspected introducing commit only when there is a reasonable basis.

Do not erase useful historical information just because work is complete.

---

## 15. Git workflow summary

`/CONTRIBUTING.md` is authoritative.

Non-negotiable summary:

- `main` = stable deployment branch;
- `dev` = active integration/experimental branch;
- feature/fix/docs/etc. branches start from `dev`;
- auxiliary branches integrate into `dev` using **squash merge**;
- **do not delete auxiliary branches after squash integration**;
- preserve their detailed commit history and contributor/agent attribution;
- synchronize the preserved auxiliary branch and squash-integrated `dev` to the remote when authorized access is available;
- human local verification follows agent automated testing;
- **never promote `dev` to `main` without explicit human authorization**.

If remote access is unavailable, leave the local repository coherent and report exactly what remains unsynchronized.

---

## 16. Agent and subagent attribution

Agent contributions are intentionally traceable.

Do not fabricate identities.

### Preferred metadata

When agent work is material, commits may use trailers such as:

```text
Agent-Assisted-by: OpenAI Codex (<actual model/version if known>)
Agent-Role: implementation, tests, documentation
Subagent-Assisted-by: <actual agent/model identifier if known> — <role>
```

Use standard:

```text
Co-authored-by: Name <email>
```

**only when a real valid contributor name/email identity is known and authorized.**

Never invent a GitHub username/email for Codex, a model, or a subagent.
Never guess or inherit a model/version label from an example; record the actual identity/version only when the runtime exposes it.

Detailed feature-branch commits should preserve meaningful attribution. The squash commit on `dev` should summarize the result and identify the source branch/contributors, while the preserved auxiliary branch remains the detailed historical record.

This traceability supports:

- credit/provenance;
- debugging;
- understanding implementation decisions;
- restoring useful context to an agent/subagent that previously owned an area;
- improving future delegation.

---

## 17. Subagent guidance

Use subagents where work has a clear isolated contract, especially for:

- physics experiments;
- test generation/review;
- module/content validation;
- focused regression investigation;
- performance profiling;
- documentation consistency review;
- asset-pipeline validation.

When delegating:

1. define exact ownership/files;
2. include relevant GDD/PRD constraints;
3. avoid overlapping write ownership if parallel work is possible;
4. require appropriate tests/evidence;
5. preserve identifier/model/role in branch history when contribution is material;
6. review before integration.

Do not create subagents merely to maximize parallelism when coordination cost exceeds the task.

---

## 18. Scripts policy

Reusable helper scripts created by humans or agents belong in:

```text
/scripts/
```

Examples:

- local static servers;
- module validators;
- asset audits;
- schema checks;
- seeded-generation stress tests;
- diagnostic utilities.

If a one-off script becomes reusable, clean it up and copy/refactor it into `/scripts/`.

Do not commit:

- secrets;
- credentials;
- private tokens;
- machine-specific absolute paths;
- dependency caches;
- temporary dumps;
- generated artifacts already reproduced by normal build commands.

---

## 19. Dependency discipline

Before adding a runtime dependency, ask:

1. Does PixiJS, Rapier, Vite, TypeScript, or the browser already solve this?
2. Is the problem substantial enough to justify another dependency?
3. What does it add to bundle/init complexity?
4. Is its license compatible?
5. Does it work in a static GitHub Pages deployment?
6. Does it save more jam time than it costs?

Development-only tooling may be more permissive, but avoid unnecessary churn.

Do not replace PixiJS/Rapier or introduce another game engine without explicit approval.

---

## 20. Security and external services

The jam build should function without secrets.

- Never embed private API keys in client code.
- Never commit credentials or secret `.env` values.
- Treat a future leaderboard backend as an independent service boundary.
- Client-submitted scores cannot be considered inherently trustworthy; document anti-cheat limitations before presenting a leaderboard as strongly competitive.
- Third-party analytics are out of scope unless explicitly approved.

---

## 21. Definition of ready for human verification

A feature is ready for the human to test when:

- agreed implementation scope is complete;
- applicable automated checks pass;
- the production build succeeds;
- affected docs are current;
- `/docs/BACKLOG.md` is current;
- auxiliary branch history is preserved;
- the squash integration is present on `dev`;
- branch and `dev` are remotely synchronized when authorized access exists;
- known limitations/follow-ups are stated;
- **`main` remains untouched unless the human explicitly approved promotion**.

Automated success does not replace playtesting game feel.

---

## 22. Final production rule

When choosing between adding complexity and making the existing core more readable, tunable, stable, and fun, prefer the latter.

Use the GDD's production test:

> Does this make transporting the move more fun, terrain more interesting to anticipate, losing/saving an object funnier, or Don Tortuga more distinctly Don Tortuga?

If not, it is probably not jam-critical.
