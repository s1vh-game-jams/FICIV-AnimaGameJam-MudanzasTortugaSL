# Product Requirements Document — Mudanzas Tortuga, S.L.

**Document:** `/docs/PRD.md`  
**Language:** English  
**Status:** Game Jam implementation baseline  
**Game-design authority:** `/docs/GDD.md`  
**Operational entry point for agents:** `/AGENTS.md`

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
one complete playable designed level
```

It implements the **Game Jam scope** defined by this PRD, including the current UI/UX baseline.

The complete GDD remains the reference for architectural compatibility and later expansion even where Prototype 2 intentionally ships only a subset.

Examples:

- the GDD defines four biomes; Prototype 2 requires at least three, including water;
- the GDD defines level leaderboards; Prototype 2 may ship without a remote/global leaderboard;
- the GDD defines Endless Run; Prototype 2 may display it as `Próximamente`.

Operational rule:

> **The GDD defines the complete game. The PRD defines the required projection of that game for the current phase.**

### 1.2 Approved clarifications

When this PRD labels a rule as an **approved clarification**, it records a human-resolved ambiguity or refinement that may not yet have been synchronized back into the GDD wording.

Agents should implement the clarification exactly and must not generalize it into unrelated design changes.

---

## 2. Product statement

Build a lightweight 2D browser game in which Don Tortuga continuously travels to the right while the player regulates speed and shell angle to preserve a physically simulated moving load.

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

The game must not require a backend to start, play the designed level, calculate results, or use the physics playground.

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

- two unique keyframes are sufficient;
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

From the main screen:

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
- shell tilt;
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

Do not build a full editor UI during the jam unless it materially accelerates tuning.

---

## 9. Jam minimum viable product (MVP)

The jam is considered functionally shippable when all requirements below are met with placeholder or final art as appropriate.

### 9.1 One designed level

Required:

- exactly one playable designed level is sufficient;
- it is assembled from reusable sections/modules;
- it has a start;
- it has a finish line;
- it records run time;
- it calculates score according to the GDD;
- it reaches a results screen;
- player can return to main menu.

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

Minimum:

- **three of the four GDD biome types**;
- **water is mandatory**.

The chosen other two may be selected based on production value and level needs.

Ideal jam target: all four.

Required water behavior must preserve the GDD's special role:

- safe/amortized major water entry;
- buoyancy;
- retained cargo weight affects depth/rise behavior;
- deeper water exposes stronger rightward current;
- heavy cargo can create a route/speed advantage.

### 9.5 Hazards

Minimum:

- two mechanically distinct hazard/trap types.

Ideal:

- three.

They must be readable/telegraphed and should attack cargo stability rather than health.

### 9.6 Core navigation loop

Minimum flow:

```text
Main Menu
  ├─ Credits (recommended)
  │    └─ Main Menu
  │
  └─ Mode Select
       ├─ Designed Levels
       │    ↓
       │  Level Select
       │    ↓
       │  Level 1
       │    ↕
       │  Pause
       │    ↓
       │  Results / delivery note
       │    ├─ Retry Level 1
       │    └─ Main Menu
       │
       └─ Endless Run — "Próximamente"
```

The Designed Levels selector must exist even with only one level because it establishes the intended extensible flow.

The jam prototype must support keyboard menu navigation:

- arrows move selection;
- `Enter` confirms;
- `Esc` goes back in menus;
- `Esc` opens/closes pause during gameplay;
- mouse navigation may also be supported;
- selected states must not rely on color alone.

Pause freezes both physics and run timer.

### 9.7 Scoring

Implement the GDD's designed-level scoring:

- time component;
- cargo component;
- perfect-move bonus;
- saved-item rules;
- deterministic rounding/handling.

Version identifiers must be available for future leaderboard separation.

---

## 10. Module/content system

### 10.1 Shared pool principle

There is **one module pool**, not separate pools for designed and procedural content.

Workflow:

```text
design useful modules
      ↓
assemble the handcrafted jam level
      ↓
same available module pool
      ↓
optional Endless Run generator
```

Modules should therefore be:

- useful in the designed level first;
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

- enough variety to make the designed level interesting;
- no dead end in the pool if Endless Run is enabled;
- every selectable module output must have at least one compatible next module input.

### 10.3 Endless pool semantics

If Endless Run is implemented, it uses **all compatible modules available in the pool**, subject to compatibility and any necessary safety constraints.

Do not maintain an arbitrary manually curated "procedural subset" that excludes valid modules merely because they were originally authored for the designed level.

Adding modules after the jam should automatically enrich Endless Run if they satisfy the module contract.

### 10.4 Future community levels

User-authored custom levels/editor support is **post-jam backlog**, not MVP.

The current data architecture should avoid making this impossible, but do not build the editor during the jam.

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

- continuous rightward progression;
- no reverse traversal;
- no full stop;
- player modifies velocity within a bounded range;
- player controls shell tilt on dry terrain;
- shell maximum angle initially expected within the GDD's 30°–45° tuning range;
- camera/turtle safe-window constraints should alter allowed acceleration/deceleration smoothly rather than teleporting the turtle.

In water:

- horizontal inputs continue regulating forward motion;
- vertical inputs control swimming rather than shell tilt;
- Don Tortuga cannot drown.

Use Rapier body/control patterns that transfer understandable motion to dynamic cargo without arbitrary sprite teleportation.

---

## 13. Physics/game-feel targets

Priority outcomes:

- small mistakes produce wobble and occasional partial loss;
- moderate impacts visibly threaten cargo;
- severe impacts may cause cascades;
- the default state is not constant total collapse;
- cargo must not feel glued into a rigid single body;
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

Designed-level HUD:

- cargo-status row containing all initial cargo icons;
- definitively lost objects are disabled/crossed out with a small non-blocking animation;
- run timer;
- no live designed-level score.

Optional:

- temporary-separation wobble on the corresponding cargo icon.

Layout constraint:

- preserve clear visual space on the right side for incoming terrain/hazards/branches;
- keep contextual help close to/below Don Tortuga;
- client-loss messages should occupy a lower corner rather than the main action area.

### 14.4 Contextual onboarding

There are exactly three gameplay help messages:

1. `← →` + **velocidad**
2. `↑ ↓` + **equilibrar caparazón**
3. `↑ ↓` + **nadar**

**Approved clarification of GDD 41.7:**

- each message has a fixed configurable lifetime in the approximate **3–5 second** range;
- choose the concrete duration according to text density, large child-readable typography, and key illustrations;
- messages disappear on their timer; **player input is not required for dismissal**;
- a message is considered seen for the **current run/level instance** once its display interval ends;
- contextual-help state is **not persisted across runs, browser sessions, or accounts**;
- restarting/replaying a level starts the onboarding sequence fresh;
- message 3 remains pending until the first water entry in that run;
- **Show controls again** resets all three flags while remaining paused; the sequence becomes eligible again only after gameplay resumes.

Prototype 2 authored-level constraint:

- the opening section must be flat/safe enough for messages 1 and 2;
- water must not be reachable early enough to overlap those two messages;
- validate this at the maximum permitted early-run speed;
- in practical composition terms, there should be no immediate water body after the start and the first water body should not be visible/encountered as part of the initial onboarding beat.

Fallback for future malformed/community content:

- if swimming onboarding becomes eligible while message 2 is still visible, swimming onboarding **preempts** message 2;
- this fallback keeps the level operable but does not make the user-authored level well designed.

### 14.5 Results / delivery note

Prototype 2 results are presented as a **delivery note (`albarán de entrega`)** and include:

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

Results actions:

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

A Credits screen from the main menu is recommended for the jam, especially to preserve human/agent/art/audio attribution.

It is not allowed to block Prototype 2 core playability if schedule pressure forces it to be finished during final presentation/polish.

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
interface LeaderboardService {
  submitScore(entry: ScoreEntry): Promise<void>;
  getTopScores(levelId: string, limit?: number): Promise<ScoreEntry[]>;
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

### 15.3 Security note

A static browser client cannot securely prove that submitted scores are legitimate by itself.

If a public remote leaderboard is added, document trust/validation limitations and avoid creating a complex anti-cheat backend during the jam unless explicitly prioritized.

---

## 16. Endless Run

### 16.1 Jam status

**Stretch goal.**

The mode selector must show it even when unavailable:

```text
Carrera Infinita — Próximamente
```

### 16.2 If implemented

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

---

## 17. Performance

Primary platform: browser.

Prefer:

- simplified colliders;
- pooled/reused visuals where appropriate;
- sensible module unloading if Endless Run is implemented;
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
- perfect bonus;
- saved-item edge cases;
- cargo state transitions;
- contact-graph connection;
- separation hysteresis;
- module biome compatibility;
- pool non-dead-end condition;
- seeded selection;
- level state flow;
- pause freezing physics and timer;
- contextual-help timer expiry and per-run reset;
- swimming-message preemption fallback;
- results-stamp integer rounding and band selection;
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
├── Build 4 — Designed level
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
- shell tilt;
- representative terrain/biome behavior;
- cargo loss basics;
- tuning/debug tools needed for iteration.

Exit criterion:

> The team can tune and repeatedly test a stack that is unstable enough to be fun but stable enough to create recoverable situations.

### Build 1 — Biome foundation

- minimum three biomes including water;
- target all four if schedule permits;
- stable transitions;
- weight-dependent water behavior.

### Build 2 — Module system

- module metadata;
- start/end biome;
- entrance/exit height;
- connector alignment;
- loading/placement;
- pool validation.

### Build 3 — Hazards

- minimum two distinct hazards;
- ideal three;
- telegraphing/readability;
- no permanent blockage.

### Build 4 — Designed level

- handcrafted module sequence;
- start/finish;
- timer;
- scoring;
- results.

### Build 5 — Application / UI / presentation

- main menu;
- mode select;
- level select;
- keyboard navigation/focus states;
- pause and confirmations;
- designed-level HUD;
- contextual onboarding;
- results delivery note and rounded delivery-status stamp;
- retry/return flow;
- Mudanzas Tortuga, S.L. brand presentation;
- local personal-best display/storage where available;
- cargo-loss feedback (richer client-message presentation may be P1 polish);
- Credits screen if schedule permits;
- replace prototype art as available;
- feedback/polish.

### Build 6 — Stretch

Only after core stability:

- local/remote leaderboard improvements;
- Endless Run;
- additional modules/content;
- extra presentation polish.

---

## 20. MVP acceptance checklist

A jam candidate satisfies MVP when:

- [ ] Runs in browser from a production Vite build.
- [ ] No mandatory backend is required.
- [ ] `physics-playground` remains accessible to testers.
- [ ] Designed level is playable start-to-finish.
- [ ] One turtle configuration exists.
- [ ] Four distinct cargo archetypes exist.
- [ ] At least three biomes exist, including water.
- [ ] At least two distinct hazards exist.
- [ ] Cargo can be lost individually.
- [ ] Lost cargo cannot softlock Don Tortuga.
- [ ] Player can accelerate/brake and control shell angle on dry terrain.
- [ ] Water changes controls/behavior according to the GDD.
- [ ] Designed-level scoring works.
- [ ] Main → Mode → Level Select → Level → Results → Main works.
- [ ] `Esc` pause freezes physics and timer and resumes safely.
- [ ] Menus are fully navigable by keyboard and selected state does not depend only on color.
- [ ] Designed-level HUD shows cargo state and timer without a live designed-level score.
- [ ] Contextual help uses fixed 3–5 s timed messages with per-run (not persistent) seen state.
- [ ] Authored jam level cannot reach first water before initial speed/balance onboarding completes.
- [ ] `Show controls again` resets help while remaining paused.
- [ ] Results use the delivery-note presentation and rounded integer percentage for the delivery-status stamp.
- [ ] Endless Run appears as `Próximamente` if not implemented.
- [ ] Required threats are telegraphed/readable.
- [ ] Placeholder/final art loads correctly under the configured Vite base path.
- [ ] Relevant automated tests pass.
- [ ] `npm run build` passes.
- [ ] Documentation/backlog are current.
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

### Endless Run

- [ ] Seeded.
- [ ] Uses full compatible module pool.
- [ ] Never selects an impossible next biome.
- [ ] Boundary flags/multipliers work.
- [ ] Ends at zero active cargo.
- [ ] Can unload/recycle old modules if required for long runs.

---

## 22. Explicitly out of MVP scope

Unless explicitly reprioritized:

- user level editor;
- community level publishing/sharing;
- multiple turtle configurations;
- mandatory all-16 module transition coverage;
- account/authentication system;
- sophisticated anti-cheat;
- mobile/touch control parity;
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
