# Development Backlog — Mudanzas Tortuga, S.L.

**Status:** Prototype 1 implemented and agent-verified; integration and human tuning handoff in progress
**Source of game-design truth:** `/docs/GDD.md`  
**Technical scope:** `/docs/PRD.md`

---

## 1. Backlog rules

This file is a living part of the development workflow.

Agents and humans should update it as work progresses.

### Status vocabulary

- `TODO` — ready or waiting to be scheduled
- `IN PROGRESS` — currently being worked on
- `BLOCKED` — cannot progress until the stated dependency/decision is resolved
- `DONE` — implemented and integrated into `dev`
- `DEFERRED` — intentionally postponed
- `CANCELLED` — explicitly rejected/obsolete

### Priority vocabulary

- `P0` — required to validate or ship the jam MVP
- `P1` — high-value jam work / desired completion
- `P2` — stretch goal
- `POST-JAM` — explicitly after jam unless reprioritized

### Commit provenance

When a task is completed and integrated, append the integration commit:

```text
commit: `abc1234`
```

If useful, the preserved source branch may also be recorded:

```text
branch: `feat/example`
```

For a regression/fix:

```text
suspected-introduced-by: `abc1234`
fixed-by: `def5678`
```

Do not invent hashes. Use `unknown` when provenance cannot be established confidently.

### Scope interpretation

The complete game is defined by `/docs/GDD.md`; this backlog schedules the phase-specific implementation defined by `/docs/PRD.md`.

Therefore:

- deferring a GDD feature from Prototype 1 or Prototype 2 does not remove it from the game design;
- Prototype 1 is the physics-tuning/`physics-playground` phase;
- Prototype 2 is the Game Jam playable prototype;
- remote leaderboards, the fourth biome, Endless Run, or other complete-game features may remain pending/deferred without creating a design contradiction when the PRD does not require them for the current phase.

---

## 2. Current critical path

```text
Repository bootstrap
        ↓
Build 0: physics-playground
        ↓
Physics tuning
        ↓
Required biomes (water mandatory)
        ↓
Module system + validators
        ↓
Hazards
        ↓
Designed level
        ↓
Scoring/results/navigation
        ↓
UI/UX baseline + art/polish
        ↓
Jam release on main
```

**Endless Run and remote leaderboard must not delay this path.**

---

# P0 — Repository and development bootstrap

### BOOT-001 — Scaffold Vite + TypeScript project
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** none
- **Acceptance:**
  - Vite project runs with `npm run dev`.
  - TypeScript is configured.
  - Production build creates `/dist`.
  - No unnecessary framework added.

### BOOT-002 — Install/configure PixiJS 8
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-001
- **Acceptance:**
  - Pixi application initializes.
  - Canvas resizes according to project viewport rules.
  - Basic render smoke test works.

### BOOT-003 — Install/configure Rapier2D
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-001
- **Acceptance:**
  - `@dimforge/rapier2d` initializes correctly.
  - WASM loads in dev and production preview.
  - Minimal body/collider simulation runs.

### BOOT-004 — Implement fixed-step game/physics loop
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-002, BOOT-003
- **Acceptance:**
  - Physics targets 60 Hz fixed timestep.
  - Render cadence is decoupled.
  - No variable-delta gameplay tuning.

### BOOT-005 — Add public asset URL helper
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-001
- **Acceptance:**
  - Uses `import.meta.env.BASE_URL`.
  - `/public/sprites/...` works under localhost and a repository subpath.
  - Asset URLs are not hardcoded as root-absolute paths throughout gameplay code.

### BOOT-006 — Establish baseline npm checks
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-001
- **Acceptance:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - Missing tool choices are documented before implementation.

### BOOT-008 — Provide a tested production-preview helper
- **Priority:** P0
- **Status:** IN PROGRESS
- **Acceptance:** reusable scripts/localServer.py supports root/subpath mounts, repository-relative default dist, clear option/bind errors and WASM serving; live standard-library tests pass.

### BOOT-007 — Add initial repository branch protections/workflow conventions
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** repository availability
- **Acceptance:**
  - `dev` exists as development integration branch.
  - `main` is treated as release/deployment branch.
  - auxiliary branches are preserved after squash integration.
  - no automation auto-deletes them.

---

# P0 — Build 0: Physics Playground

### PHYS-001 — Add physics-playground routing/access
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-001
- **Acceptance:**
  - `Shift + P` opens it from the main screen.
  - `?mode=physics` opens it directly.
  - It is not advertised as a normal player mode.

### PHYS-002 — Prototype Don Tortuga body and shell collider
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-003, BOOT-004
- **Acceptance:**
  - Placeholder visual exists.
  - Physical body/collider exists.
  - Shell is a physically meaningful cargo support.
  - Implementation allows controlled tilt.

### PHYS-003 — Implement dry-land turtle speed control
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-002
- **Acceptance:**
  - right input accelerates;
  - left input reduces speed;
  - no reverse;
  - no full stop;
  - min/base/max speeds are tunable.

### PHYS-004 — Implement shell tilt control
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-002
- **Acceptance:**
  - up/down adjust shell angle progressively;
  - max angle is tunable within intended GDD range;
  - angular speed/damping are tunable;
  - no instant angle teleport.

### PHYS-005 — Add four representative cargo archetypes
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-002
- **Objects:**
  - Sofa
  - Television
  - Cocktail glass
  - Floor lamp
- **Acceptance:**
  - visually labeled placeholders under `/public/sprites/cargo/...`;
  - distinct dimensions/mass/center-of-mass profiles;
  - simple colliders;
  - all are independent bodies.

### PHYS-006 — Centralize tuning configuration
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-003, PHYS-004, PHYS-005
- **Acceptance:**
  - physics/game-feel constants are not scattered;
  - playground and game consume same values;
  - units/meaning are understandable.

### PHYS-007 — Implement active cargo contact graph
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-005
- **Acceptance:**
  - detects direct/indirect physical connection to shell;
  - supports multiple-object chains;
  - exposes active cargo set.

### PHYS-008 — Implement contact-loss hysteresis
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-007
- **Acceptance:**
  - one brief loss of contact does not instantly lose an object;
  - reconnection during grace period restores normal state;
  - grace value is tunable.

### PHYS-009 — Disable gameplay interaction from definitively lost cargo
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-008
- **Acceptance:**
  - lost objects no longer block Don Tortuga;
  - lost objects do not rejoin active cargo;
  - optional visual fall/roll may continue;
  - no lost-object softlock.

### PHYS-010 — Add playground reset
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-002, PHYS-005
- **Acceptance:**
  - restores deterministic baseline turtle/cargo state;
  - fast enough for repeated tuning.

### PHYS-011 — Add collider/debug visualization
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BOOT-002, BOOT-003
- **Acceptance:**
  - toggleable;
  - shows useful collider/body information;
  - absent/disabled in ordinary player presentation.

### PHYS-012 — Tune first viable cargo behavior
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-003 through PHYS-011
- **Acceptance:**
  - acceleration/braking visibly transfer motion;
  - shell tilt can save cargo;
  - small disturbances do not routinely destroy entire stack;
  - cargo does not feel rigidly glued;
  - partial loss is observable and recoverable.
- **Verification:** human playtest required.

### PHYS-013 — Add playground pause/single-step controls
- **Priority:** P1
- **Status:** IN PROGRESS
- **Depends on:** PHYS-010
- **Acceptance:**
  - pause does not corrupt state;
  - single-step advances fixed physics deterministically enough for diagnosis.

### PHYS-014 — Add live high-value tuning controls
- **Priority:** P1
- **Status:** IN PROGRESS
- **Depends on:** PHYS-006
- **Acceptance:**
  - only parameters that materially accelerate tuning;
  - can reset to baseline;
  - optional copy/export of current values.

---

# P0 — Biomes

### BIOME-001 — Implement baseline grass behavior
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-012
- **Acceptance:** permissive reference dry biome consistent with GDD.

### BIOME-002 — Implement water body detection/state
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-012
- **Acceptance:**
  - enter/leave water state reliably;
  - controls switch appropriately;
  - Don Tortuga cannot drown.

### BIOME-003 — Implement buoyancy and weight-dependent depth
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BIOME-002
- **Acceptance:**
  - turtle floats;
  - more retained cargo produces perceptibly deeper/slower return toward surface;
  - tuning parameters are centralized.

### BIOME-004 — Implement depth-dependent rightward current
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BIOME-003
- **Acceptance:**
  - deeper position produces stronger rightward assistance;
  - retained cargo can unlock a meaningful deep-current advantage.

### BIOME-005 — Implement water impact damping
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** BIOME-002
- **Acceptance:** major water entries do not significantly destabilize cargo, consistent with GDD intent.

### BIOME-006 — Implement second required dry biome
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-012
- **Note:** rock selected by the human for the first playable prototype; sand remains optional.

### BIOME-007 — Implement remaining fourth biome
- **Priority:** P1
- **Status:** TODO
- **Depends on:** BIOME-006
- **Acceptance:** all four GDD biomes available.

### BIOME-008 — Add biome comparison scenarios to playground
- **Priority:** P1
- **Status:** IN PROGRESS
- **Depends on:** required biome implementations
- **Acceptance:** testers can reproduce meaningful surface/impact differences rapidly.

---

# P0 — Module system

### MOD-001 — Define typed ModuleDefinition
- **Priority:** P0
- **Status:** TODO
- **Depends on:** BOOT-001
- **Fields:** id, startBiome, endBiome, startHeight, endHeight, length, geometry, hazards, optional metadata.

### MOD-002 — Implement module placement/alignment
- **Priority:** P0
- **Status:** TODO
- **Depends on:** MOD-001
- **Acceptance:**
  - next start aligns to previous end;
  - vertical offset works;
  - join zone remains physically clean.

### MOD-003 — Validate biome connector compatibility
- **Priority:** P0
- **Status:** TODO
- **Depends on:** MOD-001
- **Acceptance:** incompatible output/input pairs cannot be silently chained.

### MOD-004 — Validate pool continuation safety
- **Priority:** P0
- **Status:** TODO
- **Depends on:** MOD-003
- **Acceptance:** every selectable exit biome has at least one compatible next-entry module if Endless generation is enabled.

### MOD-005 — Add automated module metadata tests
- **Priority:** P0
- **Status:** TODO
- **Depends on:** MOD-001 through MOD-004

### MOD-006 — Author first module pool for designed level
- **Priority:** P0
- **Status:** TODO
- **Depends on:** required biomes, MOD-002
- **Acceptance:**
  - enough variety for one interesting fixed level;
  - duplicates of transition types allowed;
  - no requirement to cover all sixteen abstract types.

---

# P0 — Hazards

### HAZ-001 — Implement hazard framework
- **Priority:** P0
- **Status:** TODO
- **Depends on:** module foundation
- **Acceptance:**
  - hazard activation and telegraph phases are explicit;
  - no health damage;
  - no permanent blockage.

### HAZ-002 — Implement hazard type A
- **Priority:** P0
- **Status:** TODO
- **Depends on:** HAZ-001
- **Candidate:** falling pinecone / falling object.

### HAZ-003 — Implement hazard type B
- **Priority:** P0
- **Status:** TODO
- **Depends on:** HAZ-001
- **Candidate:** weight-triggered falling log / terrain event.

### HAZ-004 — Implement third hazard type
- **Priority:** P1
- **Status:** TODO
- **Depends on:** HAZ-001

### HAZ-005 — Validate telegraph timing/readability
- **Priority:** P0
- **Status:** TODO
- **Depends on:** HAZ-002, HAZ-003
- **Acceptance:**
  - relevant threats meet GDD minimum anticipation at max allowed turtle speed;
  - complex choices receive more anticipation where needed.

---

# P0 — Designed level and core loop

### LEVEL-001 — Assemble jam designed level from module pool
- **Priority:** P0
- **Status:** TODO
- **Depends on:** MOD-006, required hazards
- **Acceptance:**
  - fixed sequence;
  - start and finish;
  - readable progression;
  - required biomes/hazards represented;
  - no softlocks.

### LEVEL-002 — Implement timer
- **Priority:** P0
- **Status:** TODO
- **Depends on:** LEVEL-001

### LEVEL-003 — Implement saved-object finish logic
- **Priority:** P0
- **Status:** TODO
- **Depends on:** PHYS-007, LEVEL-001
- **Acceptance:**
  - active cargo crossing finish counts;
  - object that independently crosses finish first can count according to GDD.

### SCORE-001 — Implement designed-level score formula
- **Priority:** P0
- **Status:** TODO
- **Depends on:** LEVEL-002, LEVEL-003
- **Acceptance:** matches GDD time + cargo + perfect bonus rules.

### SCORE-002 — Add score unit tests
- **Priority:** P0
- **Status:** TODO
- **Depends on:** SCORE-001
- **Cases:** zero cargo, partial cargo, perfect cargo, time cap, tie-related data.

### APP-001 — Implement main menu
- **Priority:** P0
- **Status:** TODO
- **Depends on:** basic UI shell

### APP-002 — Implement mode selector
- **Priority:** P0
- **Status:** TODO
- **Depends on:** APP-001
- **Acceptance:**
  - Designed Levels selectable;
  - Endless Run visible as `Próximamente` unless implemented.

### APP-003 — Implement designed-level selector
- **Priority:** P0
- **Status:** TODO
- **Depends on:** APP-002
- **Acceptance:** works cleanly with one level and can scale later.

### APP-004 — Implement results screen
- **Priority:** P0
- **Status:** TODO
- **Depends on:** SCORE-001
- **Acceptance:** displays relevant score/time/cargo result and return to main menu.

### APP-005 — Validate full MVP navigation loop
- **Priority:** P0
- **Status:** TODO
- **Depends on:** APP-001 through APP-004, LEVEL-001, UX-001, UX-002
- **Flow:** Main → Mode → Level Select → Level ↔ Pause → Results → Retry/Main.
- **Acceptance:**
  - `Esc` returns through menus;
  - `Esc` opens/closes pause during gameplay;
  - retry launches the same level directly;
  - Endless Run remains visible as `Próximamente` until implemented.

---

# P0/P1 — Camera, readability, UX, art

### CAM-001 — Implement constant camera progression + turtle safe window
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** PHYS-003
- **Acceptance:** boundary pressure smoothly reduces speed advantage/disadvantage; no teleport clamps.

### CAM-002 — Validate fixed zoom/readability
- **Priority:** P0
- **Status:** TODO
- **Depends on:** LEVEL-001
- **Acceptance:** hazards and branches can be read at standard zoom.

### UX-001 — Implement keyboard menu navigation and focus states
- **Priority:** P0
- **Status:** TODO
- **Depends on:** APP-001
- **Acceptance:**
  - arrows move selection;
  - `Enter` confirms;
  - `Esc` returns to previous menu;
  - sensible option selected by default on each screen;
  - selected state does not depend on color alone;
  - mouse menu input may coexist without breaking keyboard use.

### UX-002 — Implement pause flow
- **Priority:** P0
- **Status:** TODO
- **Depends on:** LEVEL-001
- **Acceptance:**
  - `Esc` opens/closes pause;
  - physics freezes;
  - run timer freezes;
  - Continue selected by default;
  - Restart and Exit require brief confirmation;
  - Show controls again does not unpause;
  - optional resume countdown added only if playtests justify it.

### UX-003 — Implement designed-level HUD
- **Priority:** P0
- **Status:** TODO
- **Depends on:** PHYS-007, LEVEL-002
- **Acceptance:**
  - displays all initial cargo icons;
  - definitively lost cargo is disabled/crossed out;
  - displays run timer;
  - does not display live designed-level score;
  - keeps right-side incoming-play space visually clear.

### UX-004 — Implement contextual onboarding messages
- **Priority:** P0
- **Status:** TODO
- **Depends on:** PHYS-003, PHYS-004, BIOME-002, UX-002
- **Messages:**
  1. `← →` + `velocidad`
  2. `↑ ↓` + `equilibrar caparazón`
  3. `↑ ↓` + `nadar`
- **Acceptance:**
  - each message uses a fixed tunable lifetime of approximately 3–5 seconds;
  - input is not required for dismissal;
  - each becomes seen only for the current run after its timer completes;
  - help state is not persisted across runs/browser sessions/accounts;
  - replaying/restarting the level starts fresh help state;
  - swimming message appears on first water entry;
  - Show controls again resets all three flags while the game remains paused;
  - messages resume only after leaving pause;
  - swimming message preempts shell-balance message if malformed/future community content causes overlap.

### UX-005 — Protect authored opening from onboarding overlap
- **Priority:** P0
- **Status:** TODO
- **Depends on:** UX-004, LEVEL-001
- **Acceptance:**
  - opening terrain is flat/safe while speed and balance messages display;
  - first water cannot be reached before both initial messages complete at maximum permitted early-run speed;
  - no immediate water body is placed after the start;
  - validation is applied to the jam-authored level, while future community levels only receive the runtime preemption fallback.

### UX-006 — Implement delivery-note results presentation
- **Priority:** P0
- **Status:** TODO
- **Depends on:** APP-004, SCORE-001
- **Acceptance:**
  - shows run time;
  - shows delivered/lost cargo icons;
  - shows time/cargo/perfect-bonus breakdown and total;
  - computes `round((Vₑ / V₀) × 100)` before selecting the delivery-status stamp band;
  - Retry is selected by default and directly reloads the same level;
  - Main Menu returns to title flow.

### UX-007 — Persist local per-level personal best
- **Priority:** P1
- **Status:** TODO
- **Depends on:** SCORE-001
- **Acceptance:**
  - stores best score/time locally when browser storage is available;
  - level selector/results can display it;
  - failure/unavailability of local storage never blocks play.
- **Note:** this is not the remote Top 100 leaderboard.

### UX-008 — Implement grouped client loss notifications
- **Priority:** P1
- **Status:** TODO
- **Depends on:** PHYS-009, UX-003
- **Acceptance:**
  - brief non-blocking call/text presentation;
  - includes lost object name/icon;
  - one notification per accident window rather than one per object;
  - tunable cooldown;
  - same phrase not repeated consecutively;
  - humor targets service/logistics and does not shame the player.

### UX-009 — Add Credits screen
- **Priority:** P1
- **Status:** TODO
- **Depends on:** APP-001
- **Acceptance:**
  - accessible from main menu;
  - returns cleanly to main menu;
  - supports required human/agent/art/audio attribution.
- **Note:** recommended for the jam; must not block core playability under schedule pressure.

### ART-001 — Create placeholder sprite hierarchy
- **Priority:** P0
- **Status:** IN PROGRESS
- **Acceptance:** `/public/sprites/{entity}/` convention exists and is used.

### ART-002 — Add two turtle walk keyframes
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** ART-001
- **Acceptance:** animation system represents 60 logical frames/1 second while reusing two unique prototype keyframes.

### ART-003 — Replace placeholder art with final/near-final art
- **Priority:** P1
- **Status:** TODO
- **Depends on:** stable gameplay silhouettes
- **Acceptance:** collider logic does not need rewriting.

### PRESENT-001 — Apply Mudanzas Tortuga brand to main presentation
- **Priority:** P1
- **Status:** TODO
- **Depends on:** APP-001, UX-001, UX-006

### FEEDBACK-001 — Add readable wobble/impact/loss feedback
- **Priority:** P1
- **Status:** TODO
- **Depends on:** stable physics
- **Acceptance:** cause/effect is understandable without textual explanation.

---

# P1 — Local persistence / leaderboard-ready boundary

### LB-001 — Define LeaderboardService interface
- **Priority:** P1
- **Status:** TODO
- **Depends on:** SCORE-001
- **Acceptance:** score system is persistence-agnostic.

### LB-002 — Implement localStorage leaderboard/history
- **Priority:** P1
- **Status:** TODO
- **Depends on:** LB-001, UX-007
- **Acceptance:** optional local ranking/history survives reload and includes level/physics version metadata.
- **Note:** UX-007 owns the simpler per-level personal-best requirement; this task expands beyond it.

### LB-003 — Add leaderboard screen/panel for local records
- **Priority:** P2
- **Status:** TODO
- **Depends on:** LB-002

### LB-004 — Implement remote Top 100 leaderboard
- **Priority:** P2
- **Status:** TODO
- **Depends on:** LB-001
- **Acceptance:**
  - Top 100;
  - score descending;
  - lower time tie-break;
  - version separation;
  - graceful backend failure;
  - no client secrets;
  - trust/anti-cheat limitations documented.
- **Note:** must not block jam MVP.

---

# P2 — Endless Run

### ENDLESS-001 — Implement seeded RNG/service
- **Priority:** P2
- **Status:** TODO
- **Depends on:** module system
- **Acceptance:** reproducible enough for debugging per content/version.

### ENDLESS-002 — Implement compatible module selection
- **Priority:** P2
- **Status:** TODO
- **Depends on:** ENDLESS-001, MOD-004
- **Acceptance:** uses full compatible module pool.

### ENDLESS-003 — Implement module boundary flags
- **Priority:** P2
- **Status:** TODO
- **Depends on:** ENDLESS-002

### ENDLESS-004 — Implement Endless score accumulation
- **Priority:** P2
- **Status:** TODO
- **Depends on:** ENDLESS-003
- **Acceptance:** GDD multiplier formula.

### ENDLESS-005 — End run at zero active cargo
- **Priority:** P2
- **Status:** TODO
- **Depends on:** PHYS-007, ENDLESS-002

### ENDLESS-006 — Add old-module cleanup/recycling if needed
- **Priority:** P2
- **Status:** TODO
- **Depends on:** ENDLESS-002
- **Trigger:** implement only if long-run profiling shows need.

### ENDLESS-007 — Enable Endless Run in mode selector
- **Priority:** P2
- **Status:** TODO
- **Depends on:** ENDLESS-002 through ENDLESS-005

---

# P0 — Testing and release

### TEST-001 — Add score regression suite
- **Priority:** P0
- **Status:** TODO

### TEST-002 — Add cargo graph/hysteresis tests
- **Priority:** P0
- **Status:** IN PROGRESS

### TEST-003 — Add module compatibility/pool tests
- **Priority:** P0
- **Status:** TODO

### TEST-004 — Add production-build smoke test checklist
- **Priority:** P0
- **Status:** IN PROGRESS
- **Acceptance:** dev route, `?mode=physics`, public assets, Rapier WASM, designed level all tested from production build.

### TEST-005 — Playtest partial-loss behavior
- **Priority:** P0
- **Status:** TODO
- **Handoff:** Prototype 1 is ready for human tuning; see [PHYSICS.md](PHYSICS.md#suggested-tuning-sequence).
- **Human verification required.**

### TEST-006 — Child/family readability pass
- **Priority:** P1
- **Status:** TODO
- **Acceptance:** controls/threats/cargo direction are understandable with minimal text.

### TEST-007 — Test pause invariants
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** UX-002
- **Acceptance:** physics and timer remain unchanged while paused; resume does not inject a simulation jump.

### TEST-008 — Test contextual onboarding state
- **Priority:** P0
- **Status:** TODO
- **Depends on:** UX-004
- **Acceptance:**
  - timed dismissal without input;
  - seen state resets on a fresh run;
  - Show controls again resets state without unpausing;
  - swim-message preemption fallback behaves deterministically.

### TEST-010 — Cover the physical core with real Rapier invariants
- **Priority:** P0
- **Status:** IN PROGRESS
- **Acceptance:** fixed-loop/config/controller unit coverage plus real Rapier finite states, repeatable reset, realized traversal/camera bounds, mass properties, lost-body isolation, water weight/rise/current/swim and high-entry cushioning.

### TEST-009 — Test delivery-stamp rounding
- **Priority:** P0
- **Status:** TODO
- **Depends on:** UX-006
- **Acceptance:** boundary percentages are rounded to integers before band selection.

### RELEASE-001 — Implement GitHub Pages workflow
- **Priority:** P0
- **Status:** TODO
- **Depends on:** stable Vite build
- **Acceptance:** deployment action targets `main`; correct base path; no dev auto-release.

### RELEASE-002 — Audit third-party assets/licenses/credits
- **Priority:** P0
- **Status:** TODO
- **Acceptance:** jam rule compliance; required credits recorded.

### RELEASE-003 — Resolve final software/content licensing
- **Priority:** P0
- **Status:** TODO
- **Depends on:** owner decision
- **Acceptance:** replace provisional licensing ambiguity before public release.

### RELEASE-004 — Human authorization to promote `dev` to `main`
- **Priority:** P0
- **Status:** BLOCKED
- **Blocked by:** completed candidate + human local verification
- **Note:** agents cannot self-unblock this task.

### RELEASE-005 — Deploy jam release
- **Priority:** P0
- **Status:** BLOCKED
- **Depends on:** RELEASE-004

---

# POST-JAM — Planned extensions

### FUTURE-001 — User-created level editor
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Requirement:** users can build custom levels from available content/modules.
- **Design note:** module architecture is a foundation, not necessarily a restriction on every manually placed editor element.

### FUTURE-002 — Community level publishing/sharing
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** FUTURE-001

### FUTURE-003 — Per-community-level leaderboards
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** FUTURE-002, remote leaderboard service

### FUTURE-004 — Additional turtle configurations
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Requirement:** turtle/load configuration chosen before Endless seed generation.

### FUTURE-005 — Expand module pool
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Note:** new compatible modules should automatically enrich Endless Run without requiring new designed levels.

### FUTURE-006 — Additional hazards/cargo/biomes content
- **Priority:** POST-JAM
- **Status:** DEFERRED

### FUTURE-007 — Full turtle in-between animation
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Note:** replace prototype reuse of two keyframes with artist-authored in-betweens.

### FUTURE-008 — Formalize audio pipeline/licensing
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **May move into jam:** if audio is selected before submission.

---

## 3. Known decisions awaiting later confirmation

| Decision | Current default | Trigger for update |
|---|---|---|
| Repository / Pages base | FICIV-AnimaGameJam-MudanzasTortugaSL; root and repository-subpath builds verified | live Pages configuration remains RELEASE-001 |
| Node baseline | >=22.12, npm lockfile | CI setup / dependency upgrade |
| Linter/test configuration | TypeScript strict, ESLint, Vitest; Python unittest for helper | expand when meaningful behavior is added |
| Third required biome choice | rock approved; grass/rock/water are the required playable-prototype set | sand remains optional for this phase |
| Contextual-help duration | 3–5 seconds per message, tuned for child-readable content | playtesting/readability tuning |
| Remote leaderboard provider | none | LB-004 starts |
| Final software license | unresolved | before public release |
| Audio license structure | unresolved | first audio asset selected |
| UI/UX specification | GDD section 41 approved; implementation clarifications recorded in PRD | revise only after new approved UX/design decision |

---

## 4. Prototype 1 verification and remaining work

Agent-side verification on 2026-10-03:

- TypeScript strict check and ESLint pass.
- Vitest: 105 tests pass (24 cargo graph, 55 core/config/content and 26 real Rapier).
- Python helper: 11 live unittest cases pass, including mounting, redirects, MIME, occupied ports and document-root containment.
- Root and repository-subpath production builds succeed; real-browser rendering, public textures and Rapier WASM initialize without console errors.
- Browser checks cover hidden Shift+P access, direct route/refresh, frozen pause/time, one-tick stepping, repeatable reset, scenario/load switching, valid parameter editing and empty-field restoration.
- The complete stack remains retained through ordinary water traversal with neutral input. This verifies a baseline, not subjective game feel.

The reviewed source implementation is commit `4ddd996` on preserved branch `codex/physics-playground`. Integration provenance will be recorded after squash into dev. No regression-introducing commit is claimed for fixes made before this first implementation commit.

Known limitations / follow-ups:

- PHYS-012 and TEST-005 need human assessment of correction feel and recoverable partial losses. Angular/camera/water assistance is provisional tuning.
- BIOME-001 through BIOME-006 have diagnostic implementations; designed-level integration, authored transitions and the full biome-foundation acceptance remain Prototype 2 work. BIOME-008 supplies the five comparison diagnostics now. Sand remains optional.
- BOOT-007 establishes branch conventions/dev/preserved history; remote protection and automatic branch-deletion settings have not been administered or certified.
- TEST-004 and TEST-007 cover the playground portion; designed-level navigation and final pause flow remain pending their implementation.
- No real level/module pool, hazard system, scoring/results, contextual help, leaderboard, final art or audio is included.
- Rapier WASM is approximately 2.4 MB before compression (about 921 kB gzip); actual cold-load/performance budgets need release profiling.
- No Pages workflow/live publication is configured; main remains the human-controlled release branch.

## 5. Backlog maintenance reminder

When implementing work from this file:

1. create/identify the auxiliary branch;
2. change status to `IN PROGRESS` when appropriate;
3. keep scope bounded;
4. run agent-side checks;
5. update affected docs;
6. squash-integrate into `dev`;
7. preserve the detailed branch;
8. record the integration commit hash here;
9. leave `main` untouched until explicit human authorization.
