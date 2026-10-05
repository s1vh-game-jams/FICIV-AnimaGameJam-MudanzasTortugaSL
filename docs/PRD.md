# Product Requirements Document — Mudanzas Tortuga, S.L.

**Document:** `/docs/PRD.md`  
**Language:** English  
**Status:** Game Jam implementation baseline  
**Game-design authority:** `/docs/GDD.md`  
**Operational entry point for agents:** `/AGENTS.md`

**Scope revision (2026-10-04):** Endless Run is the required jam gameplay deliverable. The human approved [ENDLESS_PLAN.md](ENDLESS_PLAN.md) after committing the scope revision to `dev` as `cf0adc2`; implementation from preserved `codex/endless-jam` is integrated on `dev` as `5605d5c`.

---

## 1. Purpose

This PRD translates the Game Design Document into an implementable product/technical scope for the **Anima Valencia Game Jam 2026** browser build.

It exists to answer:

- what must ship for the jam;
- what may ship if time permits;
- what the technical stack is;
- how the project should be structured for fast iteration;
- how physics tuning is validated;
- how content should remain extensible after the jam;
- what can be postponed without compromising the core game.

This document must not silently override player-facing rules in `/docs/GDD.md`.

The GDD remains the source of truth for:

- core loop;
- controls;
- cargo-loss philosophy;
- scoring;
- biomes;
- module compatibility;
- hazards/telegraphing;
- camera contract;
- tone/brand;
- game feel;
- designed-level and Endless Run rules.

This PRD adds technical/development requirements, most notably **`physics-playground`**, which is an internal test facility and therefore does not need to appear as a normal player-facing mode in the GDD.

### 1.1 Operational scope model

The GDD and this PRD deliberately operate at different levels:

- **GDD:** describes the complete intended game.
- **PRD:** defines what must be implemented in a specific development phase/prototype and how that subset is realized technically.

A GDD feature may therefore be intentionally absent from a prototype without being removed from the game design.

This project currently works through two implementation phases:

#### Prototype 1 — Physics-tuning prototype

Primary deliverable:

```text
physics-playground
```

Purpose:

- validate Rapier/Pixi integration;
- tune turtle movement, shell tilt, cargo stability, partial loss, biome response, and water behavior;
- expose enough diagnostics to iterate quickly;
- use placeholder graphics;
- avoid spending jam time on final content before the physical core is proven.

Prototype 1 does **not** need the complete game flow, complete biome set, remote leaderboards, Endless Run, final art, or polished UX.

#### Prototype 2 — Game Jam playable prototype

Primary deliverable:

```text
one complete playable Endless Run with six reusable modules
```

It implements the **Game Jam scope** defined by this PRD, including the current UI/UX baseline.

The complete GDD remains the reference for architectural compatibility and later expansion even where Prototype 2 intentionally ships only a subset.

Examples:

- the GDD defines four biomes; Prototype 2 uses exactly the three established runtime biomes: grass, rock and water; sand remains later work;
- the GDD defines level leaderboards; Prototype 2 may ship without a remote/global leaderboard;
- the GDD defines designed levels; Prototype 2 displays `Nivel personalizado — Próximamente` and makes Endless Run playable.

Operational rule:

> **The GDD defines the complete game. The PRD defines the required projection of that game for the current phase.**

### 1.2 Approved clarifications

**Approved jam audio iteration (2026-10-05):** implement the closed [SOUNDS.md](SOUNDS.md) selection with native browser streaming audio, the shared publicAsset helper and no new dependency. Preserve all original WAV/MP3 files, unity volume/playback rate, browser/device volume control and no audio settings/mixer. BGM continues at unity through gameplay pause; hidden pages suspend it at the same playback position. Gain variation, ducking, fades and optional forest ambience remain outside this iteration. Shared fixed-tick presentation telemetry reports real impacts/landings/water/hazard transitions without changing physics; the presentation policy groups crashes and definitive loss/client notices, suppresses paused effects and provides once-only help/pennant cues. Technical evidence and current presentation thresholds belong to SOUNDS, not a new gameplay rule.

When this PRD labels a rule as an **approved clarification**, it records a human-resolved ambiguity or refinement that may not yet have been synchronized back into the GDD wording.

Agents should implement the clarification exactly and must not generalize it into unrelated design changes.

**Approved Prototype 1 scope:** the human approved grass and rock diagnostics plus a compact water basin/high-entry case. These establish the three required Prototype 2 biomes without requiring a real designed level in Prototype 1. Sand remains outside the current mandatory scope. Cargo visuals/colliders may combine a few simple shapes; the artist repaints the registered placeholders while physics geometry stays stable.

**Historical approved Prototype 1 extension (2026-10-03):** configurable viewport-relative camera boundaries and laboratory zoom; canonical root settings.txt with export; Space release-to-jump with a default three-second charge cap; WASD aliases; stronger load-dependent buoyancy; terrain-relative turtle/shell pose and manual compensation. That extension raised the shell pivot without changing turtle/shell shapes.

**Approved stability/camera revision (2026-10-03):** expose shell height as `shellPivotY`, restoring the original 0.30 m default; replace adjustable zoom with a percentage dead zone on each side of the physical movement corridor; keep the laboratory's character scale fixed; compute and freeze normal-level framing when loading the level. The current maximum jump launch speed is 8 m/s. A physical obstacle can stop Don Tortuga and, once rear-margin space is exhausted, stop camera progression until accepted forward movement permits it to resume. Simulation and run time continue during this obstacle wait. Every proposed module must receive real traversal tests with the currently loaded jump settings. Cargo must remain physically simulated when outside the visible frame.

**Approved visual default (2026-10-04):** `cameraDeadZonePercent=10` reserves 10 percent on each side and places the unchanged physical movement corridor in the central 80 percent. Only the canonical visual default changes; the load-time zoom formula, physical tuning and authored module geometry remain intact. The human accepts reduced advance visibility of terrain accidents for the jam, including an exception to the full-design three-second anticipation target, and will tune it manually if necessary; no new physical traversal certificate is required for this visual adjustment. Per-level relative zoom metadata remains future designed-level work.

Sol alone has scoped permission to synchronize these affected GDD rules. Builder agents/subagents treat the GDD as read-only and report discrepancies.

Implementation and tuning details belong to [PHYSICS.md](PHYSICS.md); placeholder registration and repaint rules belong to [ASSETS.md](ASSETS.md).

**Approved Prototype 2 revision (2026-10-04):** the human replaced the designed-level jam deliverable with Endless Run, corrected the initial pool to six modules for grass/rock/water, and explicitly preserved the complete GDD's four-biome design. Require cracked-branch pit, hatch/rising-stump and tree/falling-pinecone traps; a seed-selected 5–10-module base-frequency window; bounded logarithmic progression of at most +0.5 expected traps; visual two-frame route-specific pennants; and Title → Mode → Difficulty → Run → Results → Title. Clarifications approve statistical expectations, three compatible trap sockets per module and a separate protected opening with no scoring pennant. The latest human correction sets base means **0.5/0.75/1.5**, replacing the earlier 0.25/1/2; limiting means are **1/1.25/2**. Sol may synchronize these scoped GDD changes. The human approved the detailed plan after committing the documentation preparation as `cf0adc2`. Its probability tables, progression scale and cargo values are now implemented; the geometry uses six single-exit modules with AD's water alternatives rejoining internally.

**Approved jam service foundation (2026-10-03):** the human confirmed a packaged static published-level catalog and browser-local Top 100, with remote/global services later. Levels reserve stable IDs, name, optional thumbnail, coordinate-based module/hazard geometry, versioned turtle/load configuration, versioned ranking and author user ID. Anonymous play remains mandatory. Account creation (email/password and Google), authenticated community authoring and remote publishing are post-jam; preserve compatible contracts rather than implementing them now. See [BACKEND.md](BACKEND.md). Prepare only an inactive Pages Actions template under `/scripts/`; publication awaits final art/licenses and release authorization.

---

## 2. Product statement

Build a lightweight 2D browser game in which Don Tortuga automatically attempts to travel to the right while the player regulates speed and shell angle to preserve a physically simulated moving load. Physical blockers use the camera-wait and jump-recovery contract in section 12.

The game should produce readable, funny, partially recoverable physical failures rather than realistic simulation or binary character death.

The jam version should be:

- quick to load;
- playable in a modern desktop browser;
- suitable for static GitHub Pages deployment;
- visually readable for a child/family audience;
- controllable by keyboard;
- maintainable by humans and coding agents under a short jam schedule.

---

## 3. Technical stack

### 3.1 Required runtime/build stack

| Concern | Choice | Responsibility |
|---|---|---|
| Language | **TypeScript** | Game/application code, typed data, testable logic |
| Bundler/dev server | **Vite** | Development server, static build, asset processing |
| 2D renderer | **PixiJS 8** | Rendering, visual scene graph, sprites/textures, visual feedback |
| Physics | **Rapier2D** (`@dimforge/rapier2d`) | Rigid bodies, colliders, contacts, sensors, simulation |
| UI | **HTML + CSS** | Menus/results/lightweight overlays |
| Package manager | **npm** | Dependencies and scripts |
| Primary hosting | **GitHub Pages** | Static jam deployment |
| Optional backend | **None required** | Remote leaderboard may be added later |

Do not add Phaser or a larger engine merely to wrap PixiJS/Rapier.

Do not add React/Vue/Svelte solely for the light menu/UI requirements.

### 3.2 Test/tooling direction

Preferred baseline once test infrastructure is added:

- TypeScript compiler check;
- linter (exact configuration may be chosen during bootstrap);
- **Vitest** or another Vite-compatible unit/integration test runner;
- browser/manual smoke testing;
- `physics-playground` for game-feel validation.

Browser automation (e.g. Playwright) is optional and should only be added when it pays for itself during/after the jam.

---

## 4. Deployment model

The game must not require a backend to start, play Endless Run, calculate results, or use the physics playground. Future designed levels retain the same static-play requirement.

Expected deployment:

```text
static Vite build
      ↓
    /dist
      ↓
GitHub Pages
```

`main` is the deployment/release branch.

`dev` is the active integration branch.

Promotion from `dev` to `main` requires explicit human authorization.

See `/docs/DEPLOYMENT.md`.

---

## 5. Browser/runtime targets

Jam baseline:

- modern desktop Chromium-family browser;
- Firefox compatibility is desirable;
- Safari compatibility is desirable but must not jeopardize core completion;
- keyboard input is required;
- responsive scaling should avoid breaking gameplay composition, but the game may define a preferred landscape aspect ratio/resolution envelope.

Do not make touch/mobile controls a jam blocker unless explicitly reprioritized.

Performance target:

- aim for visually smooth rendering around 60 FPS on ordinary contemporary desktop/laptop hardware;
- physics simulation uses a fixed timestep targeting 60 Hz;
- simplify colliders before sacrificing simulation stability.

Exact minimum hardware/browser versions can be documented later if testing establishes meaningful limits.

---

## 6. Architecture principles

### 6.1 Separation of simulation and presentation

Rapier state is authoritative for physical bodies.

Pixi mirrors/interpolates simulation state for presentation.

Avoid coupling gameplay rules to sprite transforms.

### 6.2 Fixed physics step

Target:

```text
physics: 60 Hz fixed timestep
render: browser cadence
```

Rendering may run faster/slower than physics without changing game rules.

### 6.3 Tunable configuration

The following must remain easy to edit without hunting through entity code:

#### Don Tortuga

- base speed;
- minimum speed;
- maximum speed;
- acceleration;
- braking/deceleration;
- safe horizontal camera window;
- charged-jump maximum charge time and launch intensity;
- shared gravity;
- physical rear/front movement boundaries and per-side camera dead-zone percentage;
- shell height above the body origin;
- shell angular velocity;
- maximum shell angle;
- angular damping.

#### Cargo

- gravity interaction where appropriate;
- mass by object;
- center-of-mass offset;
- friction;
- assisted grip;
- damping;
- contact-loss grace/hysteresis;
- impact behavior.

#### Biomes

- friction/grip;
- impact response;
- inertia conservation;
- weight influence;
- buoyancy;
- current strength/depth relationship.

#### Design/testing

- camera speed;
- hazard telegraph thresholds;
- module dimensions/connectors;
- debug display settings.

Use canonical configuration consumed by both game and playground.

Root `settings.txt` supplies the adjustable startup defaults through a Vite raw-text import. Its versioned numeric `key=value` format supports `#` comment lines. Schema version 2 replaces `cameraZoom` with `cameraDeadZonePercent` and adds `shellPivotY`; old exports require explicit migration, documented in [PHYSICS.md](PHYSICS.md#4-configuration-and-tuning). A shared schema validates keys, ranges and cross-field constraints and serializes the current laboratory values. Technical timestep and collider-shape constants remain typed source configuration. Invalid settings produce a filename/key diagnostic rather than divergent silent defaults.

The laboratory edits a session copy. Restore reloads the startup defaults; Export downloads `settings.txt` without resetting the run. Replacing the repository file makes changes permanent after development reload or production rebuild. The static production bundle requires no configuration backend.

### 6.4 Data-driven content

Represent content with typed definitions where practical:

```text
CargoItemDefinition
BiomeDefinition
HazardDefinition
ModuleDefinition
LevelDefinition
TurtleConfiguration
```

Keep them serializable enough to make a future editor/community-content system feasible.

---

## 7. Prototype asset strategy

### 7.1 Asset location

Prototype and final static visuals live physically under:

```text
/public/sprites/{entity}/
```

Examples:

```text
/public/sprites/turtle/
/public/sprites/cargo/sofa/
/public/sprites/cargo/tv/
/public/sprites/cargo/cocktail-glass/
/public/sprites/cargo/floor-lamp/
/public/sprites/terrain/
/public/sprites/hazards/
/public/sprites/ui/
```

Do not duplicate these assets under `/src`.

### 7.2 Vite base-path requirement

At runtime, public asset URLs must be compatible with GitHub Pages subpaths.

Use a centralized helper built around:

```ts
import.meta.env.BASE_URL
```

Do not hardcode root-absolute `/sprites/...` paths throughout the code.

### 7.3 First visual pass

The first implementation uses intentionally crude visual scaffolding:

- solid-color blocks/shapes;
- high-contrast text labels;
- simple silhouettes;
- simple colliders.

Examples:

```text
[ SOFA ]
[  TV  ]
[GLASS ]
[ LAMP ]
```

The purpose is:

1. validate gameplay before art production;
2. expose exact placement/scale/origin expectations;
3. let the artist replace or paint over placeholders efficiently.

Physics geometry should remain simpler than visual geometry.

### 7.4 Turtle animation

Target animation contract:

- right-facing walk;
- one second;
- 60 logical frames at 60 FPS.

Jam prototype:

- two unique walking keyframes are sufficient;
- two registered head-lowered walking variants communicate jump charging, without a GUI charge meter;
- reuse those images across logical frames;
- do not generate dozens of duplicate files;
- final in-between frames may be supplied later by the artist.

PNG or vector-origin art may be used, whichever integrates best with the art workflow and Pixi rendering.

---

## 8. `physics-playground`

### 8.1 Purpose

The first playable build exists to answer one question:

> Is it fun and understandable to try to preserve a stack of objects while Don Tortuga accelerates, brakes, tilts, and crosses physically different surfaces?

The playground is the tuning/diagnostic environment for that question.

It is an engineering/product requirement, not a normal player mode.

### 8.2 Access

The title has a visible secondary **⚙ Laboratorio de físicas** entry, with smaller text than the main buttons and the same keyboard/mouse selection model. It opens the shared laboratory and permits return to title. It remains outside the normal mode selector.

Its replaceable original gear is `public/sprites/ui/laboratory.svg`, a decorative 32 × 32 SVG displayed at 1 rem through `publicAsset`; [ASSETS.md](ASSETS.md) owns its provenance and repaint contract.

**Approved shared-control revision (2026-10-05):** the human requested descending terrain-pitch recovery, underwater manual shell balance, held-Space ascent, no commanded dive, more permissive but finite underwater cargo assistance, updated per-run help and this visible secondary entry. This applies to the shared game/laboratory core. The GDD/README changes are explicitly authorized; final jam deployment belongs to a separate task.

The existing title shortcut remains:

```text
Shift + P
```

Direct route/query for developers/agents/tests:

```text
?mode=physics
```

The shortcut should not be advertised in ordinary game UI.

It **is** documented in the README for testers/contributors.

### 8.3 First-build scope

**Build 0 / first functional build contains only what the physics playground needs.**

Required systems:

- Pixi bootstrap/render loop;
- Rapier initialization;
- fixed timestep;
- Don Tortuga placeholder;
- shell collider/body behavior;
- acceleration/braking;
- shell tilt and terrain-relative physical support;
- charged jump and WASD aliases;
- settings-backed defaults/export, shell-height tuning and camera boundary/dead-zone tuning;
- representative cargo bodies;
- representative terrain;
- at least enough biome behavior to begin meaningful physics tuning;
- reset/restart;
- basic diagnostics.

It does **not** require:

- finished main level;
- final art;
- polished menu flow;
- leaderboard;
- Endless Run;
- final audio.

### 8.4 Representative cargo in playground

Use at least the same four mechanically distinct archetypes targeted for the jam:

1. **Sofa** — broad, low, comparatively stable.
2. **Television** — medium/tall, denser and less forgiving.
3. **Cocktail glass** — light/narrow/delicate, high score candidate, unstable center-of-mass profile.
4. **Floor lamp** — tall/slender/top-heavy, strong rotational instability.

Placeholder visuals should be clearly labeled.

Exact mass, collider, friction, center of mass, and scoring values remain tuning data.

### 8.5 Playground features

P0:

- deterministic reset;
- normal gameplay controls;
- representative cargo stack;
- visible terrain;
- selected biome changes;
- current FPS/physics state readout if inexpensive;
- collider debug visualization toggle.

P1 if useful during tuning:

- pause;
- single physics step;
- scenario selector;
- live sliders/input fields for high-value tuning parameters;
- reset current parameters to baseline;
- copy/export current tuning values.

Required for the approved extension:

- adjustable rear/front boundaries expressed as positions in percent of the fixed logical laboratory viewport, defining a physical movement corridor in metres;
- fixed laboratory character scale, independent of the normal-level dead zone;
- adjustable dead-zone percentage on each side of the movement corridor, with a read-only normal-level framing preview;
- shared immutable framing calculated once at normal-level load; resizing uniformly scales that composition without changing physical bounds or world span;
- adjustable shell pivot height, default 0.30 m, with unchanged body/shell shapes and corresponding initial cargo registration;
- deterministic reset after parameter changes, preserving pause;
- empty, sofa-only and complete load comparisons;
- Export settings and restore loaded settings;
- optional contextual-help preview for testing shared onboarding without creating normal levels.

Do not build a full editor UI during the jam unless it materially accelerates tuning.

---

## 9. Jam minimum viable product (MVP)

The jam is considered functionally shippable when all requirements below are met with placeholder or final art as appropriate.

### 9.1 One complete Endless Run

Required:

- a separate safe dry opening followed by a streamed six-module pool;
- difficulty selected before seed creation;
- biome/height-compatible generation using every compatible module;
- seeded trap counts, sockets and compatible types, with the approved bounded progression;
- module-boundary pennants and the GDD Endless score;
- simulation time recorded, without a finish line or time score;
- end on definitive loss of all retained cargo;
- frozen results overlay/screen and return to title.

Designed/customized-level gameplay, its selector, finish/delivery logic and scoring are deferred. Its disabled mode entry reads `Nivel personalizado — Próximamente`; the editor remains post-jam.

### 9.2 One turtle configuration

Required:

- one Don Tortuga configuration;
- one predefined initial cargo stack;
- no player cargo-building phase.

Architecture should permit future turtle configurations without requiring them for the jam.

### 9.3 Four cargo archetypes

Minimum mechanically distinct set:

- sofa;
- television;
- cocktail glass;
- floor lamp.

The final art may vary, but do not collapse them into near-identical physics profiles.

### 9.4 Biomes

Jam set: **grass, rock and water**, the three existing runtime biomes. Sand is deferred and is not a jam acceptance target. The complete GDD and content contracts retain all four biome identities.

Required water behavior must preserve the GDD's special role:

- safe/amortized major water entry;
- buoyancy;
- retained cargo weight affects depth/rise behavior;
- deeper water exposes stronger rightward current;
- heavy cargo can create a route/speed advantage.

### 9.5 Hazards

Require all three distinct types: cracked branch over an escapable pit, hatch with a rising stump, and a touch-triggered tree dropping a pinecone after a short delay.

Each of the six modules has three authored sockets, each with a nonempty set of geometry-compatible types. Select sockets without replacement; at most one trap per socket. Count compatible **placements**, not decorations or ambient terrain, for difficulty. Validate all generable combinations, not only each trap in isolation.

They must be readable/telegraphed and should attack cargo stability rather than health.

### 9.6 Core navigation loop

Required flow:

```text
Main Menu
  ├─ Créditos
  │    └─ Main Menu
  │
  ├─ ⚙ Laboratorio de físicas (secondary)
  │    └─ Main Menu
  │
  └─ Mode Select
       ├─ Nivel personalizado — "Próximamente" (disabled)
       └─ Carrera Infinita
            ↓
          Difficulty: Fácil / Normal / Difícil
            ↓
          Endless Run ↔ Pause
            ↓
          Endless results (may overlay the frozen scene)
            ↓
          Main Menu
```

The designed-level selector is deferred with that mode. A new difficulty selector is required for Endless Run only.

The jam prototype must support keyboard menu navigation:

- arrows move selection;
- `Enter` confirms;
- `Esc` goes back in menus;
- `Esc` opens/closes pause during gameplay;
- mouse navigation may also be supported;
- selected states must not rely on color alone.

Pause freezes both physics and run timer.

### 9.7 Scoring

Implement the GDD Endless formula: crossing pennant `n` adds `n × sum(retained cargo point values)` exactly once. Retained cargo includes temporary separation within grace. Apply definitive cargo-loss state updates before scoring a crossing on the same fixed tick; zero cargo ends the run and awards no crossing points. Time does not alter score.

Canonical `CARGO` definitions contain integer `scoreValue`: sofa 100, TV 250, floor lamp 400 and cocktail glass 500. These approved initial values can be tuned after playtesting. Designed-level time/cargo/perfect-bonus scoring and delivery stamps remain deferred.

Version identifiers must be available for future leaderboard separation.

---

## 10. Module/content system

### 10.1 Shared pool principle

There is **one module pool**, not separate pools for designed and procedural content.

Workflow:

```text
author and certify six useful modules
      ↓
jam Endless Run uses the full compatible pool
      ↓
future designed levels reuse the same definitions
```

Modules should therefore be:

- useful in Endless Run now and reusable by future designed levels;
- reusable;
- compatible through GDD biome-connector rules;
- vertically alignable through entrance/exit height metadata;
- independent of a fixed global Y position where possible.

### 10.2 No sixteen-type quota

With four biome codes there are sixteen abstract start/end type pairs, but the jam does **not** require at least one module of every type.

Allowed:

- multiple modules of the same pair;
- missing transition pairs;
- a smaller connected subset.

Required:

- enough variety to make the six-module Endless pool interesting;
- no dead end in the required Endless pool;
- every selectable module output must have at least one compatible next module input.

### 10.3 Endless pool semantics

Endless Run uses **all compatible modules available in the pool**, subject to compatibility and necessary safety constraints.

Do not maintain an arbitrary manually curated "procedural subset" that excludes valid modules merely because they were originally authored for the designed level.

Adding modules after the jam should automatically enrich Endless Run if they satisfy the module contract.

The approved three-biome pool is `AB BD DA / AD DB BA`, with A=water, B=grass and D=rock. The six definitions are shared static catalog content, with three compatible sockets each. All jam exits are single; the island's surface/submerged alternatives rejoin inside AD before its rocky bank. Water connector height means reference surface, with the bed described by terrain/water geometry. This does not redefine the GDD's four-biome domain or require all nine possible three-biome pairs.

### 10.3.1 Streaming, exits and geometry

Definitions must distinguish authored local geometry/sockets from generated instance placements/traps. Preserve existing published revisions and support legacy single `end` connectors through normalization; introduce a reviewed schema version/migration only if an incompatible extension is necessary.

Current heightfield diagnostics are not sufficient for removable bridge supports, pits, overhead clearance or overlapping vertical routes. Extend solid/support geometry and physical spatial queries using actual poses; never resolve terrain solely from horizontal X when several surfaces overlap. Water joins must align the authored reference surface, bed/clearance and route, not an arbitrary instantaneous turtle depth.

Each exit declares an ID, biome, relative connector height, horizontal join zone and identifiable route. Commit an exit early enough to place and reveal the next module before it can be seen/reached. If this cannot be certified, use a single exit, optionally with internal routes that rejoin. No gap may wait for a late nearest-height guess.

Keep several visible/upcoming modules ready. Remove old bodies, geometry-query caches, water regions, hazards and visuals only after no retained/separated cargo or pending interaction needs them. Long runs require bounded live resource counts and a precision strategy for accumulated horizontal/vertical coordinates; logical distance/index/score must survive any world-origin rebasing.

### 10.4 Future community levels

User-authored custom levels/editor support is **post-jam backlog**, not MVP.

The current data architecture should avoid making this impossible, but do not build the editor during the jam.

### 10.5 Mandatory jump and blockage validation

Every new module proposal must include authored real-Rapier traversal cases for each mandatory route and relevant supported load. Use the currently loaded settings, including `jumpMaxLaunchSpeed` (currently 8 m/s), gravity, charge cap, shell height, physical camera corridor and controller behavior. Demonstrate a full-charge release, clearance of the actual obstacle geometry and the first grounded landing at or beyond the authored reachable target. Walking onward after landing short cannot certify the jump. Validate the approach, room to charge, headroom, joins and recovery from a wall at the rear margin.

The shared `validateJumpTraversal` helper in `src/game/content/jumpValidation.ts` exercises an authored scenario and returns observed pass/outcome (including `landing-short`), launch, charge, first landing and settings evidence. A passing script certifies that route/load case only; a failed script blocks certification of that case and does not prove that all possible control sequences fail. Future modules must supply the full route/load matrix rather than relying on one successful diagnostic.

Repeat traversal validation after jump, gravity, geometry, shell registration or controller settings change. The idealized `v²/(2g)` height bound is an initial design estimate; it cannot replace collision-aware traversal. Human readability and playtesting still follow automated validation. Walls or blocking objects that cannot be cleared with the configured maximum jump are invalid authored content.

The matrix also covers accessible optional routes, empty/sofa-only/full loads, reachable partial-load arrangements, every compatible trap combination and adjacent joins. Water routes require swimming/ascent/bank-exit evidence; a dry-jump helper alone cannot certify them. Record versions, loaded settings and the successful input trace. No authored route is certified by this documentation revision.

---

## 11. Cargo state/loss requirements

The GDD defines active cargo as a contact network rooted at the shell.

Implementation requirements:

- track relevant object-to-object and object-to-shell contacts;
- derive whether each object has a reasonable connection path to the shell;
- apply a tunable separation grace period/hysteresis;
- support reconnection during that grace period;
- declare an item definitively lost only after the loss rule is satisfied.

Once lost:

- it no longer belongs to active cargo;
- it no longer reduces/affects scoring as active cargo;
- it must cease meaningful physical interaction with Don Tortuga/path;
- it must not create a softlock;
- it may continue a visual fall/roll for comedy.

The exact post-loss implementation may use collision-group changes, body deactivation/removal after visual completion, or another stable mechanism.

---

## 12. Don Tortuga control model

Required:

- automatic rightward progression when physical clearance permits;
- no reverse traversal;
- no player-commanded full stop; physical blockers may stop realized movement until a jump or other valid forward recovery clears them;
- player modifies velocity within a bounded range;
- Arrow keys and WASD both control speed and shell balance in dry terrain and water;
- player controls shell tilt in both media;
- turtle terrain pitch plus relative manual shell tilt produces the authoritative physical shell pose;
- shell maximum angle initially expected within the GDD's 30°–45° tuning range;
- camera/turtle safe-window constraints should alter allowed acceleration/deceleration smoothly rather than teleporting the turtle.

Camera progression normally uses its configured speed. At the rear movement margin, accepted physical forward movement limits camera advance when a solid ahead blocks Don Tortuga; a stationary blocked carrier holds the camera. Physics, jump charging, cargo and the run timer continue. Once forward movement becomes possible, the camera resumes automatically without requiring player consent or teleporting Don Tortuga. Clearing the obstacle must preserve upward jump movement and permit resumption during flight. This is obstacle handling, not voluntary pause.

The laboratory maps rear/front percentages through its fixed 1280×720 composition at 76 pixels/metre. Those metre boundaries remain independent of `cameraDeadZonePercent`. At normal-level load, the framing factory fits that corridor between equal per-side outer dead zones and freezes the resulting zoom. No normal-level camera zoom changes occur during a run. The shared factory supplies the laboratory preview and the implemented Endless renderer.

In water:

- horizontal inputs continue regulating forward motion;
- vertical inputs retain manual shell balance;
- held Space assists ascent immediately; release returns to natural buoyancy, without underwater jump charging;
- there is no commanded dive: retained weight and water-entry momentum determine immersion, including a possible dry jump before entry;
- stronger contact grip/friction and damping assist ordinary corrections, while independent cargo can still collapse under excessive tilt or strong impacts;
- Don Tortuga cannot drown.

Charged jump:

- press/hold Space while dry and grounded;
- launch once on release with linear charge fraction capped at `jumpMaxChargeSeconds` (default 3 s);
- holding beyond the cap never auto-launches;
- `jumpMaxLaunchSpeed` describes maximum upward launch speed in m/s for the kinematic carrier (currently 8 m/s); trajectory height is not linear in charge;
- preserve forward momentum and shared carrier/cargo gravity;
- pause, focus loss, reset, water entry or loss of ground eligibility cancels charge and pending release;
- an invalid press in air/water must not arm a later jump;
- convey charge through the lowered head/concentrated expression only;
- bounded takeoff assistance may affect currently shell-connected cargo; separated/lost cargo must not receive remote assistance.

Terrain support may use a stable translation proxy while the real shell follows the simulation-owned ground pose and rotated local pivot. Verify foot placement, shell clearance, automatic/manual rotation and realized traversal; rendering cannot invent authoritative physical support.

`shellPivotY` moves the shell pivot relative to the body origin along the terrain-relative local up axis. Its default is the original 0.30 m; increasing it raises the cargo support and changes stability, while preserving body, shell and cargo collider shapes. Initial cargo placement shifts by the same height difference before settling.

Water tuning must make an empty turtle resist sustained immersion, retain smoothly damped entry momentum, and permit heavier retained loads to reach deeper routes. Space assists ascent; arrows never command vertical swimming. All supported loads must be able to return to the surface and leave authored banks. Definitively lost cargo immediately stops contributing weight. Optional submerged routes require real entry/load evidence under these controls; prior downward-swimming traces are historical evidence only.

Use Rapier body/control patterns that transfer understandable motion to dynamic cargo without arbitrary sprite teleportation.

---

## 13. Physics/game-feel targets

Priority outcomes:

- small mistakes produce wobble and occasional partial loss;
- moderate impacts visibly threaten cargo;
- severe impacts may cause cascades;
- the default state is not constant total collapse;
- cargo must not feel glued into a rigid single body;
- leaving the visible frame must not alter cargo physics, connectivity or stability;
- player corrections must matter;
- a child should visually understand the direction of imminent collapse.

Expose enough tuning to iterate quickly.

Do not optimize for real-world accuracy at the expense of readability/fun.

---

## 14. UI/UX implementation requirements

The complete UI/UX design is now defined in **GDD section 41**.

The jam implementation should preserve its central principles:

- UI must not compete with Don Tortuga/cargo for attention;
- important information stays near the player's existing focus where practical;
- text is short, large, and non-essential to understanding core physical cause/effect;
- visual/icon/key feedback does most of the teaching;
- nothing pauses/intercepts gameplay except voluntary pause;
- Mudanzas Tortuga, S.L. branding should absorb the menu/results presentation where practical.

Technical boundary:

- HTML/CSS remains the default menu/HUD layer;
- no React/Vue/Svelte dependency is required;
- UI code must not become authoritative for physics state;
- gameplay simulation should remain usable by `physics-playground` without the polished player UI.

### 14.1 Menu navigation

Required for Prototype 2:

- keyboard-only navigation is supported;
- arrows move selection;
- `Enter` confirms;
- `Esc` returns to the previous menu;
- mouse input may also be supported;
- every screen opens with a sensible default selection;
- selection must be communicated by more than color alone.

### 14.2 Pause

`Esc` opens/closes pause during gameplay.

While paused:

- Rapier/gameplay simulation is frozen;
- the run timer is frozen;
- **Continue** is selected by default;
- **Restart route** and **Exit to main menu** request brief confirmation;
- **Show controls again** resets all contextual-help flags but keeps the game paused.

**Approved clarification:** selecting **Show controls again** must not resume gameplay. Help messages only resume once the player explicitly leaves pause, preventing an unexpected return to live physics.

A short resume countdown remains optional and should only be added if playtests show that immediate resume causes frustrating losses.

### 14.3 HUD

Endless Run HUD:

- cargo-status row containing all initial cargo icons;
- definitively lost objects are disabled/crossed out with a small non-blocking animation;
- run timer;
- pennants crossed/current multiplier and cumulative Endless score.

Future designed-level HUD retains its no-live-score rule.

Optional:

- temporary-separation wobble on the corresponding cargo icon.

Layout constraint:

- preserve clear visual space on the right side for incoming terrain/hazards/branches;
- keep contextual help close to/below Don Tortuga;
- client-loss messages should occupy a lower corner rather than the main action area.

### 14.4 Contextual onboarding

There are four gameplay help messages:

1. `←/A →/D` + **velocidad**
2. `↑/W ↓/S` + **equilibrar caparazón**
3. `Espacio` + **mantén y suelta para saltar**
4. `Espacio` + **mantén para subir; ↑/W ↓/S equilibran**

Rules synchronized with GDD 41.7:

- fixed configurable lifetimes in the approximate **3–5 second** range;
- timer dismissal requires no player input;
- seen state belongs only to the current run and begins when a message completes;
- restarting/replaying resets all four messages;
- no browser/session/account persistence;
- simulation pause freezes timers;
- **Show controls again** resets help while remaining paused;
- speed, balance and jump appear in sequence on dry terrain;
- first water entry activates swimming with priority over unfinished initial help; that help remains pending until it is eligible again on dry terrain;
- only one message is displayed.

Prototype 2 opening constraint: the authored safe opening must allow all three initial messages to complete before reachable water, even at maximum permitted early-run speed. Community-content preemption preserves technical operation but does not certify onboarding layout quality.

The shared help controller is integrated in Endless and the optional laboratory preview. Current default lifetimes are 3/4/4/3 seconds for speed/balance/jump/water. The approved water-copy revision retains these timers, per-run state, priority and pause/reset behavior.

### 14.5 Results / delivery note

Prototype 2 Endless results show pennants crossed, cumulative score, elapsed time, difficulty and the last lost object (or simultaneous last-loss group). Freeze simulation, hazard timers and scoring on final loss; the overlay may retain the final rendered scene. `Volver a la portada` completes the required loop. They do not use delivery stamps, perfect bonuses or time points.

For future designed levels, results are presented as a **delivery note (`albarán de entrega`)** and include:

- run time;
- delivered cargo icons;
- lost cargo disabled/crossed out;
- score breakdown (time, cargo, perfect bonus);
- total score;
- local personal best when local storage is available.

Delivery-status stamp:

```text
rawPercentage = (Vₑ / V₀) × 100
displayPercentage = round(rawPercentage)
```

**Approved clarification:** use the rounded integer `displayPercentage` to choose the GDD's stamp band.

This UI classification does not alter the perfect-bonus rule: `PerfectBonus` still follows the scoring rule defined by the GDD.

Future designed-level results actions:

- **Retry** is selected by default and reloads the same level directly;
- **Main Menu** returns to the title flow.

### 14.6 Loss feedback

When implemented for the jam build, cargo-loss feedback follows GDD section 41.8:

- brief client call/message;
- object icon/name included;
- never blocks gameplay;
- several losses from one accident are grouped;
- minimum cooldown between notifications is tunable;
- avoid repeating identical copy twice in a row;
- humor targets the moving service/logistics, never the displaced animals or the player.

The cargo HUD update itself is core feedback and should not depend on whether the richer client-message presentation ships.

### 14.7 Credits

**Approved presentation revision (2026-10-05):** the visible **Créditos** screen is required for the jam. GDD section 41.5.6 owns the exact human-authored dedication, signature and copyright; render that wording and punctuation without paraphrasing.

- Centre the dedication and its separate **— Mike Fieldins** signature.
- Link only **Argorias Svartha** in the dedication to `https://www.artstation.com/argorias`; the footer remains plain text.
- Display the exact copyright footer specified by the GDD.
- Retain **Volver a la portada**, selected by default, and `Esc` return behavior.
- Preserve native keyboard activation when the hyperlink is focused; menu `Enter` handling must not intercept it.

The original generic Credits screen was delivered with Endless; UX-012 tracks this approved dedication and the accompanying laboratory/help revision. Licensing and imported-asset attribution remain governed by [LICENSE.md](../LICENSE.md) and RELEASE-002.

---

## 15. Leaderboards

### 15.1 Jam priority

The complete GDD includes designed-level leaderboards. Prototype 2 may nevertheless ship without the remote/global leaderboard because the PRD controls current phase scope.

Remote leaderboards are **desirable, not required for MVP**.

Desired designed-level leaderboard:

- Top 100;
- ordered by higher score;
- lower time as tie-breaker;
- separated by relevant `levelVersion` and `physicsVersion`.

### 15.2 Architecture now, backend later

Create a service boundary early:

```ts
interface LeaderboardQuery {
  levelId: string;
  levelVersion: string;
  physicsVersion: string;
}
interface LeaderboardService {
  submitScore(entry: ScoreEntry): Promise<void>;
  getTopScores(query: LeaderboardQuery, limit?: number): Promise<ScoreEntry[]>;
}
```

A jam fallback may use:

```text
LocalLeaderboardService → localStorage
```

A future version may use:

```text
RemoteLeaderboardService → external API/backend
```

Do not let `ScoreSystem` know which persistence implementation is active.

The implemented designed-level local service caps each exact version partition at 100 and permits anonymous entries. The shared catalog now includes the six jam modules and three hazard definitions; there are no published designed levels. Endless scoring/results are implemented without routing runs through designed-level rankings. Optional local Endless records remain separate deferred work. [BACKEND.md](BACKEND.md) owns concrete schemas, persistence fallback and non-destructive remote/auth migration.

### 15.3 Security note

A static browser client cannot securely prove that submitted scores are legitimate by itself.

If a public remote leaderboard is added, document trust/validation limitations and avoid creating a complex anti-cheat backend during the jam unless explicitly prioritized.

---

## 16. Endless Run

### 16.1 Jam status

**Required P0 gameplay deliverable.** Designed/customized levels are the coming-soon entry. The human approved [ENDLESS_PLAN.md](ENDLESS_PLAN.md) on 2026-10-04.

### 16.2 Required behavior

It must:

- use the complete compatible module pool;
- use the existing turtle configuration;
- use a seed;
- place/use module-boundary flags;
- accumulate the GDD's multiplier score;
- end when active cargo reaches zero;
- record elapsed time without using it as the score formula;
- not require a global competitive leaderboard for jam completion.

Seed/reproduction behavior should be deterministic enough for debugging given the same content/version/configuration.

### 16.3 Difficulty and deterministic generation

Base expected traps per scoring module are **0.5 easy, 0.75 normal, 1.5 hard**. Every jam module exposes three compatible sockets. The safe prologue does not count as a module and awards no pennant. The seed selects an integer base-frequency window uniformly from 5 through 10 inclusive; modules 1 through that value retain exactly the base probability distribution. No compensation quota is required for a finite run.

After the window, a bounded logarithmic curve raises the expectation toward **1 / 1.25 / 2**, never above base +0.5. Easy has zero probability of three traps for every index. The approved vectors/formula are recorded in ENDLESS_PLAN and implemented in `src/game/config/endless.ts`. The run descriptor stores seed, difficulty, safe window, pool/generator/physics revisions and a settings hash. Each module/count/socket/type purpose has its own stable seeded stream.

Use stable per-instance/per-purpose random streams for module selection, trap counts, socket subsets and types. Preload timing, frame cadence, decoration and hazard activation must not consume gameplay randomness. A replay descriptor reserves seed, difficulty, safe-window count, generator/pool versions, physics settings/version and committed exits; physical reproduction also requires controls. Changing player route may legitimately change compatible future content.

### 16.4 Pennants and traps

Pennants are presentation only: no physics body, collider, sensor or cargo contact. Once the turtle reaches a boundary distance, deploy the corresponding visible exit's two-frame flag and add its score once. Height is above body/shell and roughly halfway up the initial stack. No pennant is scored at the end of the safe prologue.

The branch removes its support over a validated escapable pit. The rising stump requires explicit moving-support handling for the kinematic carrier and swept body/shell clearance, with a safe retraction/forward escape. A tree's touch zone may be a non-solid sensor; its delayed pinecone collides meaningfully with cargo without becoming a cargo-graph node and cannot leave a permanent blocker. Moving solids use current transforms, not cached immutable terrain vertices.

All three traps are visibly legible at least three seconds before earliest effect at maximum **realizable** approach speed, including current/stump assistance; complex route decisions receive approximately four seconds or more. A post-touch delay does not replace advance telegraphing. Constrain incompatible combinations at authoring time while preserving three usable sockets and the required count distribution.

---

## 17. Performance

Primary platform: browser.

Prefer:

- simplified colliders;
- pooled/reused visuals where appropriate;
- bounded module/hazard unloading for required long Endless runs;
- decoupled art/physics detail;
- minimal runtime dependencies;
- static assets;
- no unnecessary network calls during play.

Do not prematurely micro-optimize before profiling.

A beautiful lamp may still use a simple collider plus center-of-mass tuning.

---

## 18. Testing requirements

### 18.1 Build/check contract

Target scripts:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### 18.2 Automated priorities

P0/P1 tests should cover:

- score formulas;
- pennant once-only accumulation and final-loss ordering;
- trap-count distributions, forbidden counts, 5–10-module windows and bounded logarithmic progression;
- independent deterministic RNG streams and committed exits;
- cargo state transitions;
- contact-graph connection;
- separation hysteresis;
- module biome compatibility;
- pool non-dead-end condition;
- seeded selection;
- level state flow;
- pause freezing physics and timer;
- contextual-help timer expiry and per-run reset;
- swimming-message preemption and pending initial-help resumption;
- settings parse/export/default/session-copy invariants;
- charged-jump saturation, release-once and cancellation;
- terrain pitch/manual compensation and safe physical shell motion;
- shell-height registration and deterministic load placement without collider-shape changes;
- fixed laboratory scale and immutable dead-zone-derived normal-level framing;
- blocked rear-margin camera hold, preserved jump clearance and automatic resumption with ongoing simulation time;
- full-charge module traversal using current settings and representative load/route cases;
- high airborne stacks remaining independently simulated beyond viewport edges;
- empty/full water depth, ascent and bank-exit relationships;
- final Endless result freeze and difficulty-separated records where implemented;
- lost cargo no longer blocking gameplay;
- public asset URL helper/base-path behavior where practical.

### 18.3 Physics validation

Automated physics tests should prefer invariants over exact trajectories.

Human playtesting in `physics-playground` remains required for:

- grip feel;
- acceleration/braking feel;
- shell correction;
- partial-loss frequency;
- water feel;
- readable instability.

---

## 19. Build/milestone plan

The numbered builds are grouped into the two operational prototypes defined in section 1.1:

```text
Prototype 1
└── Build 0 — Physics playground

Prototype 2 — Game Jam playable prototype
├── Build 1 — Biome foundation
├── Build 2 — Module system
├── Build 3 — Hazards
├── Build 4 — Endless generation and score
├── Build 5 — Application / UI / presentation
└── Build 6 — Stretch
```

### Build 0 — Physics playground

Goal: validate the game's central physical interaction before level production.

Includes only:

- renderer/bootstrap;
- physics world;
- Don Tortuga;
- representative cargo;
- acceleration/braking;
- shell tilt and terrain-relative support;
- charged jump;
- settings/camera/WASD extension;
- representative terrain/biome behavior;
- cargo loss basics;
- tuning/debug tools needed for iteration.

Exit criterion:

> The team can tune and repeatedly test a stack that is unstable enough to be fun but stable enough to create recoverable situations.

### Build 1 — Biome foundation

- integrate established grass, rock and water into real module routes;
- defer sand without changing the complete GDD;
- stable transitions;
- weight-dependent water behavior.

### Build 2 — Module system

- module metadata;
- start/end biome;
- entrance/exit height;
- connector alignment;
- loading/placement;
- pool validation;
- current-settings full-charge traversal cases for each mandatory route and relevant load, repeated after physics or geometry changes.

### Build 3 — Hazards

- cracked branch/pit, hatch/rising stump and tree/pinecone;
- seeded socket/type selection and compatible combinations;
- telegraphing/readability;
- no permanent blockage.

### Build 4 — Endless generation and score

- separate protected opening and six-module certified pool;
- seeded compatible streaming and difficulty progression;
- route-specific visual pennants and cumulative score;
- timer;
- zero-retained-cargo end;
- results.

### Build 5 — Application / UI / presentation

- main menu;
- mode select;
- Endless difficulty select; disabled customized-level entry;
- keyboard navigation/focus states;
- pause and confirmations;
- Endless cargo/timer/pennant/score HUD;
- contextual onboarding;
- frozen Endless results and title return;
- retry/return flow;
- Mudanzas Tortuga, S.L. brand presentation;
- local personal-best display/storage where available;
- cargo-loss feedback (richer client-message presentation may be P1 polish);
- required Credits screen with the exact approved dedication, link, signature and copyright;
- replace prototype art as available;
- feedback/polish.

### Build 6 — Stretch

Only after core stability:

- local/remote leaderboard improvements;
- later designed/customized-level work remains outside this jam plan;
- additional modules/content;
- extra presentation polish.

---

## 20. MVP acceptance checklist

A jam candidate satisfies MVP when:

Checked items record implemented behavior and agent verification for the Endless candidate. Human balance/partial-loss and child/family readability remain TEST-005/TEST-006; live publication requires the separate main-promotion approval below. BACKLOG records the exact source, physical certificates and browser evidence.

- [x] Runs in browser from a production Vite build.
- [x] No mandatory backend is required.
- [x] `physics-playground` remains accessible to testers.
- [x] Endless Run is playable from safe opening to final cargo loss.
- [x] One turtle configuration exists.
- [x] Four distinct cargo archetypes exist.
- [x] Grass, rock and water are integrated; sand is deferred.
- [x] Six cross-biome modules form a closed compatible pool with three usable trap sockets each.
- [x] All three specified traps work, with safe recovery and validated generable combinations.
- [x] Seeded windows/distributions obey base means, easy never-three and the bounded +0.5 progression.
- [x] Module resources remain bounded and long-run coordinate precision is protected.
- [x] Cargo can be lost individually.
- [x] Lost cargo cannot softlock Don Tortuga.
- [x] Player can accelerate/brake and control shell angle on dry terrain using arrows or WASD.
- [x] Space charge/release jump works with the configured cap and concentrated pose.
- [x] Terrain pitch affects the physical shell and permits manual compensation.
- [x] Normal-run framing uses the configured physical corridor and per-side dead zone, frozen at level load.
- [x] A physical blocker holds the camera at the rear margin while physics/time continue; clearing it restores automatic forward camera progression.
- [x] Every mandatory module route passes current-settings full-charge traversal with its first grounded landing at or beyond the authored target.
- [x] Cargo physics and stability remain independent of viewport visibility.
- [x] Water changes controls/behavior according to the GDD.
- [x] Pennants are visual only, deploy at distance once and use the actual committed exit.
- [x] Endless multiplier score samples retained cargo after loss updates and ends at definitive zero.
- [x] Main → Mode → Difficulty → Endless → Results → Main works.
- [x] Main → Créditos → Main displays the exact GDD dedication/link/signature/copyright and supports keyboard return.
- [x] The visible secondary laboratory entry supports keyboard/mouse selection and retains `Shift + P` / `?mode=physics` access.
- [x] `Esc` pause freezes physics and timer and resumes safely.
- [x] Menus are fully navigable by keyboard and selected state does not depend only on color.
- [x] Endless HUD shows cargo state, timer, pennants/multiplier and cumulative score.
- [x] Contextual help uses fixed 3–5 s timed messages with per-run (not persistent) seen state.
- [x] Separate non-scoring prologue cannot reach water or traps before initial speed/balance/jump onboarding completes.
- [x] `Show controls again` resets help while remaining paused.
- [x] Results freeze the final scene and show score, pennants, time and last loss.
- [x] `Nivel personalizado — Próximamente` is visible and disabled.
- [x] Required threats are telegraphed/readable.
- [x] Placeholder/final art loads correctly under the configured Vite base path.
- [x] Relevant automated tests pass.
- [x] `npm run build` passes.
- [x] Documentation/backlog are current.
- [ ] `main` promotion has human approval before deployment.

---

## 21. Stretch acceptance

### Remote leaderboard

- [ ] Top 100 query.
- [ ] Score/time ordering.
- [ ] Level/physics version partition.
- [ ] Graceful offline/backend failure.
- [ ] No client secret.
- [ ] Trust model documented.

### Future designed levels

- [ ] Fixed sequence reuses the shared pool.
- [ ] Finish/saved-item rules and time/cargo/perfect-bonus score.
- [ ] Level selector, delivery note and rounded stamp.
- [ ] Local records separated by meaningful content/physics versions.

---

## 22. Explicitly out of MVP scope

Unless explicitly reprioritized:

- user level editor;
- designed/customized playable level, finish logic and delivery scoring/UI;
- sand, while retaining four-biome content compatibility;
- community level publishing/sharing;
- multiple turtle configurations;
- mandatory all-16 module transition coverage;
- account/authentication system;
- sophisticated anti-cheat;
- mandatory mobile/touch control parity (the proposed touch scheme is a desired optional jam feature tracked in BACKLOG);
- multiplayer;
- large backend;
- heavy UI framework;
- realistic simulation;
- advanced accessibility beyond what can be added without threatening completion.

The **user-created custom level/editor feature must remain recorded in `/docs/BACKLOG.md` for post-jam development**.

Items excluded from the Prototype 2 MVP remain part of the complete design when they exist in the GDD. Their deferral must not be described as removal from the game.

---

## 23. Documentation obligations

Any approved requirement change should update this PRD.

Any gameplay-design change should update the GDD only with explicit human approval.

Any task-state change should update the BACKLOG.

Any new `/docs/` document must be added to `/AGENTS.md`.

Any deployment implementation change should update `/docs/DEPLOYMENT.md`.

---

## 24. Product decision test

When time is constrained, prefer work that improves at least one of:

- cargo-preservation fun;
- terrain anticipation;
- readable physical cause/effect;
- funny partial failure/survival;
- Don Tortuga's identity;
- jam-build stability.

Do not let infrastructure become the game.
