# Development Backlog — Mudanzas Tortuga, S.L.

**Status:** Six-module Endless prototype and selected jam audio integrated on `dev`; audio integration is `d803628`. Source branches remain preserved. Human playtesting and release approval follow.
**Source of game-design truth:** `/docs/GDD.md`  
**Technical scope:** `/docs/PRD.md`

**Current handoff (2026-10-05):** jam audio is integrated as `d803628`, from preserved `codex/jam-audio` at `a86269a`. The squash tree exactly matches the verified source tree before this documentation-only closure. TypeScript, ESLint, 696 Vitest cases, 11 Python helper cases, root/Pages builds, native browser media states and 42 unchanged-recording HTTP paths pass. Original volume/formats remain intact; human auditory/target-browser verification is pending. No GDD/physical tuning/replay change or `main` publication is included.

**Earlier handoff (2026-10-05):** descending support, shared underwater controls/cargo assistance, the visible secondary laboratory entry and the human-authored Credits dedication are integrated in `dev` as `6299f64`, from preserved `codex/slopes-water-controls`. GDD/README changes are explicitly authorized. Agent checks pass; human local review remains pending. Earlier downward-swimming traces are historical evidence. Final jam deployment remains a separate task.

Preserved source commits: `13f5093` (shared physics/tuning/physical regressions), `aa24e5d` (laboratory/help/Credits), `0c1c228` (revised traversal evidence) and `2bf2a19` (design/implementation documentation). Agent checks pass **640 tests across 26 files**: 515 general cases plus the 125-case opt-in traversal file. The latter certifies all **1,152 complete physical trap compositions** and took 1,681.61 seconds; no source changed during the run.

Certificate documentation is `acd123c`; squash `6299f64` matched that verified source tree exactly before this documentation-only integration record. Both detailed and integration histories are preserved; no `main` promotion or live deployment is part of this task.

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
- remote leaderboards, the fourth biome and designed/customized levels remain deferred; Endless Run is now the required Prototype 2 deliverable.

---

## 2. Current critical path

### AUDIO-001 — Implement the selected jam audio
- **Priority:** P0
- **Status:** DONE — `d803628`, from preserved `codex/jam-audio` at `a86269a`; human auditory/target-browser verification pending
- **Authorization:** the human requested SOUNDS implementation on 2026-10-05, at original file levels/formats, without listening to/reselecting tracks, conversion, audio options or a mixer.
- **Scope:** native lazy streaming music for menus/laboratory/Credits/Endless; semantic aliases and bounded SFX voices; real fixed-tick impacts/landings/water/hazard phases; strongest-impact aggregation, grouped loss/client call/text, help/pennant cues and locomotion based on realized motion. Pause cancels gameplay effects and keeps unity BGM/UI; hidden-page BGM preserves position. Diagnostic single-step consumes events silently.
- **Evidence:** TypeScript/ESLint, 696 Vitest cases across 29 files (236.93 seconds; 56 audio cases), 11 Python helper cases and root/Pages production builds pass. Native browser states verify interaction unlock, menu/context transitions, original WAV/MP3 playback and pause behavior. All 21 source/build recordings keep their hashes; 42 root/subpath HTTP paths return the unchanged files. Historical parity preserves every physical snapshot/body state over 10,800 ticks. No physical tuning, geometry, assets, dependencies or replay revisions change; no new full trap-composition certificate is claimed.
- **Follow-up:** human auditory readability/target-browser pass remains pending. Optional forest ambience, fades and gain/rate variation are excluded from this original-level iteration. WAV compression stays FUTURE-010.
- **Provenance:** root owns manager/presentation/application/docs/integration; `/root/physics_audio_events` owns read-only physics telemetry/calibration/regressions; `/root/audio_tests_review` owns media/policy tests and review.
- **Source commits:** `e7224ca` (physical telemetry/regressions), `619791d` (native runtime/application/media-policy regressions), `a86269a` (contract/verification documentation).

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
Three hazards + seeded difficulty
        ↓
Six-module Endless streaming + pennants
        ↓
Scoring/results/navigation
        ↓
UI/UX baseline + art/polish
        ↓
Jam release on main
```

**Implementation approval:** received on 2026-10-04 for the reviewable ENDLESS_PLAN. Remote rankings, designed levels, sand and editor work must not delay the approved path.

### DOC-001 — Refocus jam scope and prepare reviewable Endless plan
- **Priority:** P0
- **Status:** DONE — `cf0adc2`; human approved implementation on 2026-10-04
- **Authorization:** GDD/PRD edits and open changes on `dev`; no commit/push requested for this preparation.
- **Decisions:** six modules for grass/rock/water; full GDD keeps four biomes; three compatible sockets per module; separate safe non-scoring prologue; statistical base means corrected to 0.5/0.75/1.5, tending to 1/1.25/2 after a seed-selected 5–10-module base window.
- **Acceptance:** design/scope/backlog and affected guidance agree; probabilities/geometry/point values and verification gates reviewed and approved by the human.

---

# P0 — Repository and development bootstrap

### BOOT-001 — Scaffold Vite + TypeScript project
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** none
- **Acceptance:**
  - Vite project runs with `npm run dev`.
  - TypeScript is configured.
  - Production build creates `/dist`.
  - No unnecessary framework added.

### BOOT-002 — Install/configure PixiJS 8
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-001
- **Acceptance:**
  - Pixi application initializes.
  - Canvas resizes according to project viewport rules.
  - Basic render smoke test works.

### BOOT-003 — Install/configure Rapier2D
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-001
- **Acceptance:**
  - `@dimforge/rapier2d` initializes correctly.
  - WASM loads in dev and production preview.
  - Minimal body/collider simulation runs.

### BOOT-004 — Implement fixed-step game/physics loop
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-002, BOOT-003
- **Acceptance:**
  - Physics targets 60 Hz fixed timestep.
  - Render cadence is decoupled.
  - No variable-delta gameplay tuning.

### BOOT-005 — Add public asset URL helper
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-001
- **Acceptance:**
  - Uses `import.meta.env.BASE_URL`.
  - `/public/sprites/...` works under localhost and a repository subpath.
  - Asset URLs are not hardcoded as root-absolute paths throughout gameplay code.

### BOOT-006 — Establish baseline npm checks
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-001
- **Acceptance:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - Missing tool choices are documented before implementation.

### BOOT-007 — Add initial repository branch protections/workflow conventions
- **Priority:** P0
- **Status:** IN PROGRESS
- **Depends on:** repository availability
- **Acceptance:**
  - `dev` exists as development integration branch.
  - `main` is treated as release/deployment branch.
  - auxiliary branches are preserved after squash integration.
  - no automation auto-deletes them.
### BOOT-008 — Provide a tested production-preview helper
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Acceptance:** reusable scripts/localServer.py supports root/subpath mounts, repository-relative default dist, clear option/bind errors and WASM serving; live standard-library tests pass.

### BOOT-009 — Document copyable local-server workflows for human testers
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/human-settings-local-guide`
- **Integration:** `e6efc0a` · documentation: `0921a4c`
- **Acceptance:** existing Spanish README explains prerequisites and repository-root terminal setup; development and production URLs; copyable Vite/preview/Python commands; rebuild/reload behavior, Ctrl+C, occupied ports, matched subpath builds and configuration backups. Options match the installed tooling and tested helper.


---

# P0 — Build 0: Physics Playground

### PHYS-001 — Add physics-playground routing/access
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-001
- **Acceptance:**
  - `Shift + P` opens it from the main screen.
  - `?mode=physics` opens it directly.
  - It is not advertised as a normal player mode.

### PHYS-002 — Prototype Don Tortuga body and shell collider
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-003, BOOT-004
- **Acceptance:**
  - Placeholder visual exists.
  - Physical body/collider exists.
  - Shell is a physically meaningful cargo support.
  - Implementation allows controlled tilt.

### PHYS-003 — Implement dry-land turtle speed control
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-002
- **Acceptance:**
  - right input accelerates;
  - left input reduces speed;
  - no reverse;
  - no player-commanded full stop; physical obstacle waiting is defined by PHYS-023;
  - min/base/max speeds are tunable.

### PHYS-004 — Implement shell tilt control
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-002
- **Acceptance:**
  - up/down adjust shell angle progressively;
  - max angle is tunable within intended GDD range;
  - angular speed/damping are tunable;
  - no instant angle teleport.

### PHYS-005 — Add four representative cargo archetypes
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
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
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-003, PHYS-004, PHYS-005
- **Acceptance:**
  - physics/game-feel constants are not scattered;
  - playground and game consume same values;
  - units/meaning are understandable.

### PHYS-007 — Implement active cargo contact graph
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-005
- **Acceptance:**
  - detects direct/indirect physical connection to shell;
  - supports multiple-object chains;
  - exposes active cargo set.

### PHYS-008 — Implement contact-loss hysteresis
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-007
- **Acceptance:**
  - one brief loss of contact does not instantly lose an object;
  - reconnection during grace period restores normal state;
  - grace value is tunable.

### PHYS-009 — Disable gameplay interaction from definitively lost cargo
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-008
- **Acceptance:**
  - lost objects no longer block Don Tortuga;
  - lost objects do not rejoin active cargo;
  - optional visual fall/roll may continue;
  - no lost-object softlock.

### PHYS-010 — Add playground reset
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-002, PHYS-005
- **Acceptance:**
  - restores deterministic baseline turtle/cargo state;
  - fast enough for repeated tuning.

### PHYS-011 — Add collider/debug visualization
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** BOOT-002, BOOT-003
- **Acceptance:**
  - toggleable;
  - shows useful collider/body information;
  - absent/disabled in ordinary player presentation.

### PHYS-012 — Tune first viable cargo behavior
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854`, refined by the later physics milestones; human-finalized settings: `fd12654`, promoted to main in `3b3d1f0`.
- **Depends on:** PHYS-003 through PHYS-011
- **Acceptance:**
  - acceleration/braking visibly transfer motion;
  - shell tilt can save cargo;
  - small disturbances do not routinely destroy entire stack;
  - cargo does not feel rigidly glued;
  - partial loss is observable and recoverable.
- **Verification:** the human declared the physics playground ready and finalized its tuning on 2026-10-03. This closes Prototype 1 feel validation; gameplay partial-loss playtesting remains TEST-005, now scoped to Endless Run.

### PHYS-013 — Add playground pause/single-step controls
- **Priority:** P1
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-010
- **Acceptance:**
  - pause does not corrupt state;
  - single-step advances fixed physics deterministically enough for diagnosis.

### PHYS-014 — Add live high-value tuning controls
- **Priority:** P1
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-006
- **Acceptance:**
  - only parameters that materially accelerate tuning;
  - can reset to baseline;
  - optional copy/export of current values.

---

### PHYS-015 — Persist and export laboratory tuning defaults
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `22a656f` · branch: `codex/physics-controls-settings`
- **Branch:** `codex/physics-controls-settings`
- **Acceptance:** root settings.txt is canonical; strict shared numeric schema/codec; session edits and restore are independent; export round-trips current values; production rebuild workflow documented.

### PHYS-016 — Add viewport-relative camera tuning and laboratory zoom
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `22a656f`, `287a7f9` · branch: `codex/physics-controls-settings`
- **Depends on:** PHYS-015
- **Acceptance:** rear/front viewport positions and zoom share simulation/render bounds; reset preserves pause; valid initial placement; CSS resize preserves composition; normal-run zoom is fixed.

### PHYS-017 — Add soft charged jump
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `a03fc42`, `9284942` · branch: `codex/physics-controls-settings`
- **Acceptance:** dry grounded Space hold/release; linear launch intensity; configurable default 3 s cap; no auto-launch at cap; maximum launch speed/shared gravity adjustable; safe lifecycle cancellation; independent supported cargo can accompany takeoff/landing without global grace extension.

### PHYS-018 — Convey terrain inclination through turtle/shell support
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `9284942` · branch: `codex/physics-controls-settings`
- **Acceptance:** simulation-owned ground pose and rotated shell pivot; relative manual compensation; matched traversable slope/compensation limit; smooth joins and clear feet/shell; body and shell shapes preserved while shell pivot is raised.

### PHYS-019 — Add WASD aliases and input edge handling
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `a03fc42` · branch: `codex/physics-controls-settings`
- **Acceptance:** arrows and WASD coexist without doubled axes; partial alias release works; Space edges consumed once; editor/button focus respected; C replaces D as collider shortcut.

### PHYS-020 — Restore and expose shell height
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/physics-stability-camera`
- **Integration:** `3cbbd00` · reviewed implementation: `19e55fa`
- **Acceptance:** adjustable `shellPivotY` defaults to original 0.30 m; changing height shifts the real support and initial cargo registration without changing shapes; current maximum launch is 8 m/s. Remaining human tuning import is tracked separately in PHYS-024.

### PHYS-021 — Preserve independent cargo through high offscreen jumps
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/physics-stability-camera`
- **Integration:** `3cbbd00` · reviewed implementation: `19e55fa`
- **Acceptance:** high full-charge jumps preserve the stack absent actual destabilizing forces, irrespective of visibility; finite independent bodies; separated/lost cargo gets no remote flight correction; unchanged global contact grace; meaningful real-Rapier regression coverage.
- **Regression provenance:** investigated against the controls/settings source integrated by `e705e70`; precise introducing commit not yet established.

### PHYS-022 — Replace adjustable zoom with per-side dead-zone framing
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/physics-stability-camera`
- **Integration:** `3cbbd00` · reviewed implementation: `19e55fa`
- **Acceptance:** schema 2 replaces `cameraZoom` with `cameraDeadZonePercent`; laboratory character scale remains fixed; physical movement bounds are independent of dead zone; shared immutable level-load framing derives zoom and visible origin from the physical corridor and per-side viewport percentage; normal-level integration remains future level work; explicit export/migration instructions and preview.

### PHYS-023 — Wait at a blocked rear movement margin
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/physics-stability-camera`
- **Integration:** `3cbbd00` · reviewed implementation: `19e55fa`
- **Acceptance:** solid frontal blockage limits camera advance before crossing the rear margin; camera resumes as accepted forward motion allows it after jumping; world/time/cargo keep running; no collision bypass or character teleport; diagnostic wall route and grounded/full-charge traversal tests.

### PHYS-024 — Adopt the human's supplied permanent tuning defaults
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/human-settings-local-guide`
- **Integration:** `e6efc0a` · implementation: `9d2f319`
- **Acceptance:** preserve all unaffected human values when migrating the supplied configuration to schema 2, with the approved 0.30 m shell height and dead-zone semantics; validate and repeat applicable physics checks.
- **Input provenance:** the original attachment was absent during the prior task. A later browser export test generated a new `settings.txt` in Downloads with dead zone 35 percent and shell height 0.42 m; that agent-generated export was not imported. The human has now pasted the recovered schema-1 backup directly into this chat, resolving the missing-input dependency.
- **Migration:** all 36 shared numeric settings match the recovered values. Only movement margins change from the previously retained defaults: rear 20 percent, front 80 percent. Remove obsolete `cameraZoom`, retain schema 2, dead zone 40 percent and shell height 0.30 m. Current launch remains 8 m/s.

### PHYS-025 — Normalize transient shell hulls at Rapier precision
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/human-settings-local-guide`
- **Fixed by:** `9d2f319` · squash integration: `e6efc0a`
- **Depends on:** PHYS-024 validation
- **Suspected introduced by:** reviewed implementation `19e55fa`, squash integration `3cbbd00`; the assumed-convex temporary envelope sorted/deduplicated double-precision vertices before float32 conversion.
- **Evidence:** the recovered 20/80 movement window deterministically exposed a wall-approach pose where distinct double vertices became an identical float32 point. Rapier rejected the duplicate-edge polyline, raising `expected instance of RawShape` during the configured-reset regression.
- **Acceptance:** quantize before hull ordering/deduplication and let Rapier normalize the ordered envelope; retain SAT/rotation clearance checks and human tuning values. Explicit real-physics wall approach remains finite; full reset, clearance and traversal suites pass.

### PHYS-026 — Follow descending support and preserve physical terrain pitch
- **Priority:** P0
- **Status:** DONE — `6299f64`; source `13f5093`, preserved `codex/slopes-water-controls`
- **Acceptance:** actual downhill support rotates body/shell/cargo like uphill support; preserve bounded clearance, dry jumps, departure pitch and freefalls. Shared simulation serves laboratory and Endless.
- **Evidence:** the mirrored −0.3 slope previously had only 16.7% grounded ticks and a frozen −0.0203 rad body pitch. A shallow clearance-preserving Rapier support query yields 100% grounding and −0.29146 rad, with about 0.05 m foot separation. All eleven mirrored-load/jump/cliff cases pass. Native snapping was rejected because it interrupted ordinary forward travel.
- **Regression provenance:** terrain-pitch adaptation was integrated in `e705e70`, but the exact introducing commit for this symptom has not been established by physical historical reproduction.

### PHYS-027 — Share underwater balance, Space ascent and bounded cargo assistance
- **Priority:** P0
- **Status:** DONE — `6299f64`; source `13f5093`, preserved `codex/slopes-water-controls`
- **Acceptance:** arrows/W/S retain shell balance in water; held Space assists ascent without underwater/deferred jump; no commanded dive. Retained weight and entry momentum determine immersion. Stronger wet grip/friction/damping tolerate ordinary correction but extreme tilt/impacts can lose independent pieces; dry response returns on exit.
- **Evidence:** five physical water-response cases cover partial correction, both extreme directions, violent individual impact, actual grace/loss and dry restoration. New controls and route traces share the canonical simulation. A guard-checked forward slide resolves the island ceiling hold exposed by removing downward swimming.

### PHYS-028 — Recertify water choices and module recovery under revised controls
- **Priority:** P0
- **Status:** DONE — `6299f64`; source traces `0c1c228`, certificate `acd123c`
- **Depends on:** PHYS-026, PHYS-027
- **Acceptance:** all six module routes/first landings, reachable partial loads and exhaustive compatible traps use current settings and keyboard-equivalent controls. A submerged route must be reached through natural load/entry response, without dive commands or avatar teleports; distinguish carrier escape from retained-load continuation.
- **Implementation tuning:** the original AD underpass relied on commanded diving. After asking for an optional water-tuning/geometry preference and continuing independent work, Sol retained the geometry and selected configurable `waterDepthPerKg=0.25` and `waterSwimAcceleration=14` as the starting revision. These are not human-selected permanent values. Real traces retain the original 13.6 kg from a dry DA ledge through AD's natural underpass; full/sofa/empty Space routes use the surface alternative. Full DA three-second bank-jump traces separately retain the sofa beyond the module.
- **Recovery evidence:** the shared ascending-intent fallback clears AD's island lip after actual upper-cargo loss. Across 123 recorded passage states, minimum shell/island separation is 3.142 mm and capsule/island separation is 49.946 mm; no geometry or carrier teleport is used. All 60 partial-load cases and all 1,152 exhaustive trap compositions pass with the revised controls/settings.

---

# P0 — Biomes

### BIOME-001 — Implement baseline grass behavior
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** PHYS-012
- **Acceptance:** permissive reference dry biome consistent with GDD.

### BIOME-002 — Implement water body detection/state
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** PHYS-012
- **Acceptance:**
  - enter/leave water state reliably;
  - controls switch appropriately;
  - Don Tortuga cannot drown.

### BIOME-003 — Implement buoyancy and weight-dependent depth
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** BIOME-002
- **Acceptance:**
  - turtle floats;
  - more retained cargo produces perceptibly deeper/slower return toward surface;
  - tuning parameters are centralized.

### BIOME-004 — Implement depth-dependent rightward current
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** BIOME-003
- **Acceptance:**
  - deeper position produces stronger rightward assistance;
  - retained cargo can unlock a meaningful deep-current advantage.

### BIOME-005 — Implement water impact damping
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** BIOME-002
- **Acceptance:** major water entries do not significantly destabilize cargo, consistent with GDD intent.

### BIOME-006 — Implement second required dry biome
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** PHYS-012
- **Note:** rock selected by the human; grass/rock/water are the current jam set. Sand is deferred after the 2026-10-04 scope revision.

### BIOME-007 — Implement remaining fourth biome
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** BIOME-006
- **Acceptance:** all four GDD biomes available.

### BIOME-008 — Add biome comparison scenarios to playground
- **Priority:** P1
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** required biome implementations
- **Acceptance:** testers can reproduce meaningful surface/impact differences rapidly.

---

### BIOME-009 — Strengthen empty/heavy buoyancy and swimming
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `9284942` · branch: `codex/physics-controls-settings`
- **Acceptance:** adjustable buoyancy; empty turtle resists sinking; retained mass enables deeper travel; smooth initial immersion and natural rise; up/down modulate velocity; empty/light/full loads surface and leave banks; terminal loss removes weight immediately.

---

# P0 — Module system

### MOD-001 — Define typed ModuleDefinition
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/jam-services-pages-template`
- **Integration:** `49dfa9d` · implementation: `bd4f8a0`
- **Depends on:** BOOT-001
- **Fields:** id, startBiome, endBiome, startHeight, endHeight, length, geometry, hazards, optional metadata.
- **Foundation:** versioned serializable module metadata in services/contracts.ts with start/end biome-height connectors, length, actual terrain/water and optional local hazard placements. Catalog validation does not certify joins, traversal or pool continuation; those remain MOD-002 through MOD-007.

### MOD-002 — Implement module placement/alignment
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-001
- **Acceptance:**
  - next start aligns to previous end;
  - vertical offset works;
  - join zone remains physically clean.

### MOD-003 — Validate biome connector compatibility
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-001
- **Acceptance:** incompatible output/input pairs cannot be silently chained.

### MOD-004 — Validate pool continuation safety
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-003
- **Acceptance:** every selectable exit biome has at least one compatible next-entry module if Endless generation is enabled.

### MOD-005 — Add automated module metadata tests
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-001 through MOD-004

### MOD-006 — Author six-module pool for Endless jam
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** required biomes, MOD-002
- **Acceptance:**
  - six transitions `AB BD DA / AD DB BA` with A=water, B=grass and D=rock;
  - interesting geometry and three compatible trap sockets in each definition;
  - every selectable exit has a biome/height-compatible continuation; final pool eligibility requires MOD-009 certification after hazard implementation;
  - future expansion may duplicate transition types; the initial six definitions use the listed pairs;
  - no requirement to cover all sixteen abstract types.

### MOD-007 — Gate proposed modules on current-settings jump traversal
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Branch:** `codex/physics-stability-camera`
- **Diagnostic foundation:** `3cbbd00` · reviewed implementation: `19e55fa`; six-module integration and authored route/load evidence are supplied by `be8d6fe` on `codex/endless-jam`.
- **Acceptance:** shared real-Rapier diagnostic traversal validator observes actual full-charge release and grounded landing with a bounded authored route; clearable/unreachable geometry and launch/gravity changes tested. Future module proposals must provide every mandatory route/load case and human validation; rerun after relevant settings, geometry or controller changes. An analytical height estimate alone is insufficient.

---

### MOD-008 — Extend module/world geometry for sockets and route exits
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-001
- **Acceptance:** preserve existing revisions/diagnostics; independent solids/removable supports, pose-aware support/material queries, multiple water regions, local bounds and three compatible sockets; normalize single exits and permit only early certified multi-exit commitment. Water joins align reference surface/bed/clearance. Review schema migration if incompatible changes are necessary.

### MOD-009 — Certify routes, loads, joins and trap combinations
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-006, MOD-007, MOD-008, HAZ-002 through HAZ-004
- **Acceptance:** real-Rapier control traces for multiple jumps/swimming and accessible exits; full/sofa/empty/reachable partial loads; correct first landing; pit/stump/cone recovery and all generable compatible combinations; current settings/version evidence. Failed routes block content acceptance.

# P0 — Hazards

### HAZ-001 — Implement hazard framework
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** module foundation
- **Acceptance:**
  - hazard activation and telegraph phases are explicit;
  - no health damage;
  - no permanent blockage.
  - if dynamic solid blockers are introduced, test actual shell/headroom clearance as well as carrier movement; current shell-clearance queries exclude dynamic bodies and the existing blocker regressions use static solids.

### HAZ-002 — Implement touch-triggered tree and falling pinecone
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** HAZ-001
- **Acceptance:** non-blocking tree touch region; fixed-time delayed cone drop onto cargo; cone excluded from cargo graph and cleaned up before it can leave a permanent blocker; readable warning.

### HAZ-003 — Implement cracked branch over an escapable pit
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** HAZ-001
- **Acceptance:** independently removable cover triggered by turtle passage; intact underlying pit/forward escape; current-settings recovery and readable warning.

### HAZ-004 — Implement hatch and rising stump
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** HAZ-001
- **Acceptance:** explicitly lift the kinematic carrier through safe support handling; swept body/shell/cargo clearance, current-transform queries, fixed-time phases and guaranteed forward escape/retraction.

### HAZ-005 — Validate telegraph timing/readability
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** HAZ-002, HAZ-003, HAZ-004
- **Acceptance:**
  - relevant threats meet GDD minimum anticipation at max allowed turtle speed;
  - complex choices receive more anticipation where needed.

---

# P0 — Core loop / deferred designed-level work

### LEVEL-001 — Assemble jam designed level from module pool
- **Priority:** POST-JAM
- **Status:** DEFERRED — replaced as jam deliverable by Endless Run on 2026-10-04
- **Depends on:** MOD-006, required hazards
- **Acceptance:**
  - fixed sequence;
  - start and finish;
  - readable progression;
  - required biomes/hazards represented;
  - no softlocks.

### LEVEL-002 — Implement timer
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-002
- **Acceptance:** simulation-time timer, frozen in pause/results; Endless time never changes score. Shared implementation remains reusable by future designed levels.

### LEVEL-003 — Implement saved-object finish logic
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** PHYS-007, LEVEL-001
- **Acceptance:**
  - active cargo crossing finish counts;
  - object that independently crosses finish first can count according to GDD.

### SCORE-001 — Implement designed-level score formula
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** LEVEL-002, LEVEL-003
- **Acceptance:** matches GDD time + cargo + perfect bonus rules.

### SCORE-002 — Add score unit tests
- **Priority:** POST-JAM
- **Status:** DEFERRED — designed-level cases; current Endless coverage belongs to TEST-001
- **Depends on:** SCORE-001
- **Cases:** zero cargo, partial cargo, perfect cargo, time cap, tie-related data.

### APP-001 — Implement main menu
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** basic UI shell

### APP-002 — Implement mode selector
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** APP-001
- **Acceptance:**
  - `Nivel personalizado — Próximamente` visible and disabled;
  - Carrera Infinita selectable and opens the difficulty selector.

### APP-003 — Implement designed-level selector
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** APP-002
- **Acceptance:** works cleanly with one level and can scale later.

### APP-004 — Implement results screen
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-004, ENDLESS-005
- **Acceptance:** freeze final scene; show Endless score/pennants/time/difficulty/last loss and return to title. No delivery stamp/time points/perfect bonus.

### APP-005 — Validate full MVP navigation loop
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** APP-001, APP-002, APP-004, APP-006, ENDLESS-007, UX-001, UX-002
- **Flow:** Main → Mode → Difficulty → Endless ↔ Pause → Results → Main.
- **Acceptance:**
  - `Esc` returns through menus;
  - `Esc` opens/closes pause during gameplay;
  - pause restart repeats the current seed/difficulty/settings;
  - a new start from difficulty selection creates a fresh seed;
  - customized-level entry remains disabled as `Próximamente`.

### APP-006 — Implement Endless difficulty selector
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** APP-002, ENDLESS-001, UX-001
- **Acceptance:** Fácil/Normal/Difícil before seed creation; Normal selected by default; keyboard/mouse and Esc return; chosen difficulty changes trap frequency while preserving approved physics.

---

# P0/P1 — Camera, readability, UX, art

### CAM-001 — Implement constant camera progression + turtle safe window
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** PHYS-003
- **Acceptance:** boundary pressure smoothly reduces speed advantage/disadvantage; no teleport clamps.

### CAM-002 — Validate fixed zoom/readability
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-006, ENDLESS-002
- **Acceptance:** hazards and branches can be read at standard zoom.

### CAM-003 — Use ten-percent visual dead zones for the jam
- **Priority:** P1
- **Status:** DONE — `7628134`; preserved source `3873634`
- **Branch:** `codex/level-zoom-default`
- **Authorization:** the human selected `cameraDeadZonePercent=10` as the new default and accepts reduced advance visibility for the jam; physical traversal checks and module reauthoring are not required for this visual adjustment.
- **Scope:** one canonical visual setting; existing immutable load-time formula fits the unchanged 20/80 physical corridor into the central 80 percent. Visible width is approximately 12.63 m and zoom is 1.3333. Physics/controller code, physical tuning and authored modules are unchanged; no level-relative zoom metadata is implemented.
- **Verification:** all 340 existing unit cases pass across 14 files (15.51 seconds), including settings/framing/stream; strict TypeScript, ESLint and the production build pass. The real browser reports zoom 1.3333 before/after pause and resume, renders the complete initial stack, and has no console errors/warnings. Three stream fixtures approach the opening's end before expecting resident modules, accommodating the narrower visible field. No physical matrix was rerun; the previous certificate remains historical evidence.

### UX-001 — Implement keyboard menu navigation and focus states
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
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
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-002
- **Acceptance:**
  - `Esc` opens/closes pause;
  - physics freezes;
  - run timer freezes;
  - Continue selected by default;
  - Restart and Exit require brief confirmation;
  - Show controls again does not unpause;
  - optional resume countdown added only if playtests justify it.

### UX-003 — Implement Endless HUD
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** PHYS-007, LEVEL-002
- **Acceptance:**
  - displays all initial cargo icons;
  - definitively lost cargo is disabled/crossed out;
  - displays run timer;
  - displays crossed pennants/multiplier and cumulative Endless score;
  - keeps right-side incoming-play space visually clear.

### UX-004 — Implement contextual onboarding messages
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** PHYS-003, PHYS-004, BIOME-002, UX-002
- **Messages:**
  1. `←/A →/D` + `velocidad`
  2. `↑/W ↓/S` + `equilibrar caparazón`
  3. `Espacio` + `mantén y suelta para saltar`
  4. `Espacio` + `mantén para subir; ↑/W ↓/S equilibran` — revised copy tracked in UX-012
- **Acceptance:**
  - each message uses a fixed tunable lifetime of approximately 3–5 seconds;
  - input is not required for dismissal;
  - each becomes seen only for the current run after its timer completes;
  - help state is not persisted across runs/browser sessions/accounts;
  - replaying/restarting the level starts fresh help state;
  - swimming message appears on first water entry;
  - Show controls again resets all four flags while the game remains paused;
  - messages resume only after leaving pause;
  - swimming message preempts unfinished initial help if malformed/future community content causes overlap; unfinished help remains pending for dry terrain.

### UX-005 — Protect authored opening from onboarding overlap
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** UX-004, ENDLESS-002
- **Acceptance:**
  - separate dry prologue is flat/safe and trap-free while speed, balance and jump messages display;
  - no scoring pennant/module index in prologue; 5–10-module base window starts afterward;
  - first water cannot be reached before all three initial messages complete at maximum permitted early-run speed;
  - no immediate water body is placed after the start;
  - validation is applied to the jam-authored level, while future community levels only receive the runtime preemption fallback.

### UX-006 — Implement delivery-note results presentation
- **Priority:** POST-JAM
- **Status:** DEFERRED — designed-level results; current Endless results are APP-004
- **Depends on:** APP-004, SCORE-001
- **Acceptance:**
  - shows run time;
  - shows delivered/lost cargo icons;
  - shows time/cargo/perfect-bonus breakdown and total;
  - computes `round((Vₑ / V₀) × 100)` before selecting the delivery-status stamp band;
  - Retry is selected by default and directly reloads the same level;
  - Main Menu returns to title flow.

### UX-007 — Persist local per-level personal best
- **Priority:** POST-JAM
- **Status:** DEFERRED — designed levels; optional Endless records are ENDLESS-009
- **Depends on:** SCORE-001
- **Acceptance:**
  - stores best score/time locally when browser storage is available;
  - level selector/results can display it;
  - failure/unavailability of local storage never blocks play.
- **Note:** this is not the remote Top 100 leaderboard.

### UX-008 — Implement grouped client loss notifications
- **Priority:** P1
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
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
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** APP-001
- **Acceptance:**
  - accessible from main menu;
  - returns cleanly to main menu;
  - supports required human/agent/art/audio attribution.
- **Note:** the original generic screen is integrated. The required human-authored dedication, link, signature and copyright now follow GDD 41.5.6; their approved revision is tracked in UX-012.

### UX-010 — Add optional touch controls
- **Priority:** P1
- **Status:** TODO
- **Target:** desired for the jam, not mandatory; not implemented by this extension.
- **Proposal:** touch Don Tortuga or the shell to charge a jump; a single tap ahead/behind regulates lateral position; two-finger drag in the desired rotation direction balances the shell.
- **Design follow-ups:** define tap duration/velocity mapping, release/cancellation, gesture priority and swimming gestures before implementation.
- **Acceptance:** preserve landscape composition; avoid accidental simultaneous jump/rotation; update README control instructions when touch ships.

### UX-011 — Prepare four-message shared onboarding controller
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `a03fc42`, `287a7f9` · branch: `codex/physics-controls-settings`
- **Acceptance:** timed per-run speed/balance/jump/swim sequence; pause/reset; first-water priority and pending-message resume; optional laboratory preview. Full normal-level integration remains UX-004.

### UX-012 — Expose the laboratory and synchronize water help and authored Credits
- **Priority:** P0
- **Status:** DONE — `6299f64`; source `aa24e5d`, preserved `codex/slopes-water-controls`
- **Depends on:** APP-001, UX-001, UX-004, UX-009, PHYS-027
- **Authorization:** the human approved a visible secondary laboratory entry, shared underwater controls/help and the exact Credits dedication on 2026-10-05.
- **Acceptance:**
  - title exposes **⚙ Laboratorio de físicas** with smaller text, arrows/Enter and mouse selection; `Shift + P` and `?mode=physics` remain available;
  - gear is an original replaceable `public/sprites/ui/laboratory.svg`, with decorative HTML semantics and the contract recorded in ASSETS;
  - first-water help uses held Space for ascent and reminds the player that `↑/W ↓/S` continue to balance the shell; 3/4/4/3-second default timers, per-run state, priority and paused reset remain unchanged;
  - Credits centre the exact dedication, signature and copyright owned by GDD 41.5.6, with only the dedication's Argorias Svartha name linked to ArtStation;
  - the existing return button and `Esc` preserve navigation, while focused-link `Enter` retains native activation.
- **Evidence:** all 27 focused navigation/contextual-help tests and focused ESLint pass. Gear XML parses with matching 32 × 32 dimensions/viewBox and no external dependencies. Root/subpath browser review confirms the secondary gear entry, updated controls and centred exact Credits text, link, signature, footer and keyboard return. These checks are included in the final 640-case evidence; source implementation is `aa24e5d`.
- **Provenance:** `/root/ui_game` implements UI, original icon, targeted tests and affected documentation; root Sol owns design synchronization and integration.

### ART-004 — Register charged-head walking variants
- **Priority:** P0
- **Status:** DONE
- **Integration:** `e705e70` · branch: `codex/physics-controls-settings`
- **Source commits:** `a03fc42` · branch: `codex/physics-controls-settings`
- **Acceptance:** two simple head-lowered/concentrated poses; existing body/leg geometry, canvas and anchors preserved; 60 logical slots remain; no charge GUI; artist contract updated for raised shell pivot.

### ART-001 — Create placeholder sprite hierarchy
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Acceptance:** `/public/sprites/{entity}/` convention exists and is used.

### ART-002 — Add two turtle walk keyframes
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Depends on:** ART-001
- **Acceptance:** animation system represents 60 logical frames/1 second while reusing two unique prototype keyframes.

### ART-003 — Replace placeholder art with final/near-final art
- **Priority:** P1
- **Status:** TODO
- **Depends on:** stable gameplay silhouettes
- **Acceptance:** collider logic does not need rewriting.

### ART-005 — Register simple Endless terrain/hazard/pennant placeholders
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** MOD-006, HAZ-001, ENDLESS-003
- **Acceptance:** original simple SVG states in `public/sprites/{entity}/`; folded/deployed pennant; branch/hatch/stump/tree/cone visuals; ASSETS dimensions/anchors/provenance; Vite-safe URLs and independent colliders.

### PRESENT-001 — Apply Mudanzas Tortuga brand to main presentation
- **Priority:** P1
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
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
- **Status:** DONE
- **Branch:** `codex/jam-services-pages-template`
- **Integration:** `49dfa9d` · implementation: `bd4f8a0`, `a2572ab`
- **Score integration:** SCORE-001 remains pending; the persistence contract can be implemented before scoring.
- **Acceptance:** score system is persistence-agnostic.
- **Foundation:** full level ID/level revision/physics revision query, anonymous player metadata and stable run IDs; no scoring implementation.

### LB-002 — Implement localStorage leaderboard/history
- **Priority:** P1
- **Status:** DONE
- **Branch:** `codex/jam-services-pages-template`
- **Integration:** `49dfa9d` · implementation: `a2572ab`
- **Depends on:** LB-001
- **Acceptance:** optional local ranking/history survives reload and includes level/physics version metadata.
- **Note:** storage adapter foundation is implemented separately from UI. UX-007 still owns the per-level personal-best screen/integration; LB-003 remains pending. Human confirmed local rather than global Top 100 for this phase.

### BACK-001 — Prepare validated published content and anonymous jam services
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/jam-services-pages-template`
- **Integration:** `49dfa9d` · implementation: `bd4f8a0`, `a2572ab`
- **Acceptance:** serializable versioned level IDs/name/optional thumbnail/module and hazard coordinates/turtle-load configuration/Top 100/author user reference; exact referential validation and defensive anonymous reads; packaged official seed without inventing playable levels; browser storage acquisition cannot block startup.
- **Scope:** no HTTP server/database/authentication/editor or public write operation. Static catalog and local rankings are the human-approved jam foundation. Concrete contracts and future migration are owned by BACKEND.md.

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

# P0 — Endless Run jam deliverable

### ENDLESS-001 — Implement seeded RNG/service
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** module system
- **Acceptance:** seed/difficulty/safe-count/version capture; independent stable gameplay streams; same content/settings/exit history reproduces selections regardless of rendering/preload timing; restart repeats the current descriptor.

### ENDLESS-002 — Implement compatible module selection
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-001, MOD-004
- **Acceptance:** one continuous world uses all compatible certified six-module definitions; align every committed biome/height exit, preload before visibility/arrival, safe single-exit fallback and no gaps. Integrate the separate non-scoring prologue.

### ENDLESS-003 — Implement module boundary flags
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-002
- **Acceptance:** visual-only folded/deployed pennant, no collider/sensor; turtle distance crossing once; selected-route height, above body/shell and roughly half initial stack; no scoring flag at prologue end.

### ENDLESS-004 — Implement Endless score accumulation
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-003
- **Acceptance:** canonical cargo values; add n × retained value once after cargo-state updates, including grace; no time points; no award on same-tick terminal zero; regression coverage. Approved initial values are 100/250/400/500.

### ENDLESS-005 — End run at zero active cargo
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** PHYS-007, ENDLESS-002
- **Acceptance:** terminal definitive zero, not one missing-contact tick; freeze simulation/timer/help/hazards/score and capture last loss/group for results.

### ENDLESS-006 — Bound streaming resources and long-run coordinate precision
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-002
- **Acceptance:** dispose old solids/water/hazards/visuals/caches after all retained/separated cargo and interactions clear; bounded resident counts; fixed-tick rebasing or demonstrated equivalent precision strategy preserves bodies/camera/joins/logical distance/score/seed history.

### ENDLESS-007 — Enable Endless Run in mode selector
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-002 through ENDLESS-006, ENDLESS-008, MOD-009, HAZ-005

### ENDLESS-008 — Implement seeded trap occupancy and bounded difficulty curve
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** ENDLESS-001, MOD-006, HAZ-001
- **Acceptance:** three compatible sockets; distinct sampled subset/type per instance; base expectations 0.5/0.75/1.5 for seed-selected 5–10 scoring modules; logarithmic saturation toward 1/1.25/2; easy never three; shared probability/rate configuration; no quota compensation or physics changes.

### ENDLESS-009 — Optional local Endless personal records
- **Priority:** P1
- **Status:** DEFERRED — gameplay/results ship without persistent Endless records
- **Depends on:** ENDLESS-004, APP-004
- **Acceptance:** mode/difficulty/pool/generator/physics partitions, optional seed metadata, robust storage failure fallback; no invented designed-level entry or global ranking claim.

---

# P0 — Testing and release

### TEST-001 — Add score regression suite
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Acceptance:** Endless retained-value multiplier, grace inclusion, duplicate crossing, skipped boundaries and same-tick final-loss order; designed score cases remain SCORE-002.

### TEST-002 — Add cargo graph/hysteresis tests
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`

### TEST-003 — Add module compatibility/pool tests
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`

### TEST-011 — Keep physics regressions compatible with human tuning
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/jam-services-pages-template`
- **Integration:** `49dfa9d` · implementation: `fcbbac7`
- **Evidence:** human tuning commit `fd12654` changed grip to 2.0 and separation grace to 1.33 s. Existing tests encoded a 0.5 m/s² assistance ceiling at gain 0.7 and expected terminal loss within 1 s; the unchanged physics correctly uses the new gain/grace.
- **Acceptance:** preserve complete-load/relative-motion/zero-assistance and mass-loss invariants, normalize the observed assistance bound by grip gain, and observe separation beyond the configured grace. No source physics or settings change.

### TEST-004 — Add production-build smoke test checklist
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Acceptance:** title/mode/difficulty/Endless/results and `?mode=physics`, public assets and Rapier WASM tested from production root/subpath builds; baseline diagnostics alone do not certify gameplay.

### TEST-005 — Playtest partial-loss behavior
- **Priority:** P0
- **Status:** TODO
- **Handoff:** the human finalized Prototype 1 tuning in `fd12654` and declared the playground ready. This task now owns Endless module/trap partial-loss playtesting; see [PHYSICS.md](PHYSICS.md#suggested-tuning-sequence).
- **Human verification required.**

### TEST-006 — Child/family readability pass
- **Priority:** P1
- **Status:** TODO
- **Acceptance:** controls/threats/cargo direction are understandable with minimal text.

### TEST-007 — Test pause invariants
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** UX-002
- **Acceptance:** physics and timer remain unchanged while paused; resume does not inject a simulation jump.

### TEST-008 — Test contextual onboarding state
- **Priority:** P0
- **Status:** DONE — `5605d5c`; source implementation `be8d6fe`
- **Depends on:** UX-004
- **Acceptance:**
  - timed dismissal without input;
  - seen state resets on a fresh run;
  - Show controls again resets state without unpausing;
  - swim-message preemption fallback behaves deterministically.

### TEST-009 — Test delivery-stamp rounding
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** UX-006
- **Acceptance:** boundary percentages are rounded to integers before band selection.

### TEST-012 — Human long-run cargo retention and balance pass
- **Priority:** P1
- **Status:** TODO
- **Depends on:** ENDLESS-007, TEST-005
- **Acceptance:** record seed/settings/control traces from sustained Endless play with retained cargo; compare easier/harder distributions, island route choice and recoverable losses. Observe automatic origin rebasing in a real retained-load run beyond 1,024 m, alongside the existing physical rebase and 10,000-concatenation resource invariants.
- **Evidence boundary:** an attempted automatic sofa-only kilometre soak with seed `endless-physical-soak-5131` lost its last item at 53.02 m / 27.27 s. It did not certify long-run retention or automatic rebase during retained play. Authored carrier-escape certificates continue after cargo loss and must not be presented as loss-free human runs.

### RELEASE-001 — Implement GitHub Pages workflow
- **Priority:** P0
- **Status:** TODO
- **Depends on:** stable Vite build
- **Acceptance:** deployment action targets `main`; correct base path; no dev auto-release.
- **Preparation:** inactive template is tracked separately as RELEASE-006. Activation remains pending final art/licenses and explicit release authorization.

### RELEASE-006 — Prepare an inactive main-only Pages Actions template
- **Priority:** P0
- **Status:** DONE
- **Branch:** `codex/jam-services-pages-template`
- **Integration:** `49dfa9d` · implementation/documentation: `d8bada3`
- **Acceptance:** YAML remains under scripts/, manual dispatch/main guards and explicit main checkout, least job permissions, current checks/build:pages, pinned verified actions and deployment docs. No .github activation, Pages settings changes or live publication.

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
### TEST-010 — Cover the physical core with real Rapier invariants
- **Priority:** P0
- **Status:** DONE
- **Integration:** `2d6e854` · branch: `codex/physics-playground`
- **Acceptance:** fixed-loop/config/controller unit coverage plus real Rapier finite states, repeatable reset, realized traversal/camera bounds, mass properties, lost-body isolation, water weight/rise/current/swim and high-entry cushioning.


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
- **Jam implementation:** the selected-recording runtime pipeline moved into AUDIO-001. SOUNDS owns aliases/events/provenance; LICENSE already records Audio Hero synchronization boundaries.
- **Remaining:** post-jam tooling and release receipt/EULA audit under RELEASE-002; this implementation does not change licensing terms.

### FUTURE-009 — Add accounts and authenticated community ownership
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** FUTURE-001/FUTURE-002 and an approved remote provider
- **Requirement:** email/password and Google sign-in; stable application user IDs linked to authored levels; server-verified ownership for create/update/publish. Published levels and Endless play remain anonymous. Do not migrate local rankings into verified remote rankings without an explicit reviewed import policy.

### FUTURE-010 — Compress WAV runtime audio to MP3
- **Priority:** POST-JAM
- **Status:** DEFERRED
- **Depends on:** stable jam audio integration / `SOUNDS.md`
- **Goal:** reduce the deployed audio footprint after the jam by replacing runtime WAV assets with MP3 equivalents while preserving the two existing MP3 assets unchanged where appropriate.
- **Acceptance:**
  - convert the current WAV runtime assets under `public/audio/` to suitably compressed MP3 versions using the original WAV files as sources;
  - preserve canonical semantic filenames and update the audio manifest/routes/extensions consistently;
  - remove obsolete WAV runtime copies after successful verification;
  - confirm menu, gameplay, hazards, water, UI, ambient audio and BGM still load correctly in Vite development and production/subpath builds;
  - compare audible quality and looping/transition behavior before accepting the compressed versions;
  - record the resulting deployed audio size reduction;
  - keep licensing/provenance mapping intact despite the format conversion.
- **Note:** explicitly deferred until after the jam; the current mixed WAV/MP3 set is accepted for the jam release to avoid last-minute asset conversion risk.

---

## 3. Known decisions awaiting later confirmation

| Decision | Current default | Trigger for update |
|---|---|---|
| Repository / Pages base | FICIV-AnimaGameJam-MudanzasTortugaSL; root and repository-subpath builds verified | live Pages configuration remains RELEASE-001 |
| Node baseline | >=22.12, npm lockfile | CI setup / dependency upgrade |
| Linter/test configuration | TypeScript strict, ESLint, Vitest; Python unittest for helper | expand when meaningful behavior is added |
| Third required biome choice | rock approved; grass/rock/water are the required playable-prototype set | sand is deferred beyond this jam scope |
| Endless jam difficulty | approved base means 0.5/0.75/1.5; limits 1/1.25/2; statistical rather than quota | human balance playtesting; configuration in endless.ts |
| Initial Endless pool | six cross-biome modules; three compatible sockets each; single exits, AD internal route rejoin | repeat route/load/hazard certification after relevant geometry/settings/controller changes |
| Cargo point values | approved sofa 100 / TV 250 / lamp 400 / glass 500 | balance playtesting |
| Contextual-help duration | 3–5 seconds per message, tuned for child-readable content | playtesting/readability tuning |
| Remote leaderboard provider | none | LB-004 starts |
| Final software license | unresolved | before public release |
| Audio license structure | Audio Hero bundle/synchronization terms in LICENSE; selected paths/provenance in SOUNDS | RELEASE-002 receipt/EULA audit and final release approval |
| UI/UX specification | GDD section 41 approved; implementation clarifications recorded in PRD | revise only after new approved UX/design decision |

---

## 4. Original Prototype 1 verification and historical remaining work

Agent-side verification of original source commit `4ddd996` on 2026-10-03:

- TypeScript strict check and ESLint pass.
- Vitest: 105 tests pass (24 cargo graph, 55 core/config/content and 26 real Rapier).
- Python helper: 11 live unittest cases pass, including mounting, redirects, MIME, occupied ports and document-root containment.
- Root and repository-subpath production builds succeed; real-browser rendering, public textures and Rapier WASM initialize without console errors.
- Browser checks cover hidden Shift+P access, direct route/refresh, frozen pause/time, one-tick stepping, repeatable reset, scenario/load switching, valid parameter editing and empty-field restoration.
- The complete stack remains retained through ordinary water traversal with neutral input. This verifies a baseline, not subjective game feel.

The reviewed source implementation is commit `4ddd996` on preserved branch `codex/physics-playground`. Squash integration: `2d6e854` on `dev`. Source history and attribution remain on `codex/physics-playground`. No regression-introducing commit is claimed for fixes made before this first implementation commit.

Historical limitations / follow-ups at that original milestone:

- PHYS-012 and TEST-005 need human assessment of correction feel and recoverable partial losses. Angular/camera/water assistance is provisional tuning.
- BIOME-001 through BIOME-006 have diagnostic implementations; designed-level integration, authored transitions and the full biome-foundation acceptance remain Prototype 2 work. BIOME-008 supplied the five original diagnostics at that milestone. Sand remains optional.
- BOOT-007 establishes branch conventions/dev/preserved history; remote protection and automatic branch-deletion settings have not been administered or certified.
- TEST-004 and TEST-007 cover the playground portion; designed-level navigation and final pause flow remain pending their implementation.
- That original milestone did not include a real level/module pool, hazard system, scoring/results, contextual help, leaderboard, final art or audio.
- Rapier WASM is approximately 2.4 MB before compression (about 921 kB gzip); actual cold-load/performance budgets need release profiling.
- No Pages workflow/live publication is configured; main remains the human-controlled release branch.

### Approved extension and human feedback — 2026-10-03

The human reported natural physical feel and intuitive controls in the initial playground, then approved the controls/settings/physics plan and requested a slightly higher shell without shape changes. This is positive baseline feedback, not final verification of the extension or every partial-loss criterion.

Completed extension tasks: PHYS-015 through PHYS-019, BIOME-009, UX-011 and ART-004. Sol synchronized only the explicitly authorized GDD changes; builder/subagent GDD permissions remain unchanged. The source branch is preserved as `codex/physics-controls-settings`. Reviewed source implementation: `c9c527d`. Squash integration: `e705e70` on `dev`. Detailed commits and agent attribution remain on the preserved source branch; main remains untouched.

Extension verification on 2026-10-03:

- TypeScript strict check and global ESLint pass.
- Vitest: **232 tests pass** across eight files: 181 unit cases and 51 real-Rapier integration cases.
- Python helper: 11 live unittest cases pass; helper behavior is unchanged.
- Root and repository-subpath production builds succeed; browser textures, WASM, direct access and subpath refresh initialize without console errors.
- Production browser checks cover fine decimal editing, invalid camera-window rejection, zoom/reset/pause preservation, restoration and actual settings download. The downloaded text contains all 37 values plus schemaVersion and the edited acceleration/zoom; exporting leaves tick/time/pause unchanged.
- Help preview reaches the jump message after speed/balance. Paused single-step advances physics without advancing help. Landscape layout was measured at 854×480 without horizontal overflow; specific mobile game-feel remains human testing.
- The browser shows corrected feet/body/shell support on the 36-degree ramp. Existing full-load neutral-water retention remains covered. Partial/full/capped jump, independent cargo flight/landing, headroom, support joins, finite state, weight-ordered immersion/rise and retained full-load surfacing pass real-physics invariants.
- Full-load extreme-control traces complete maximum slopes and the jump obstacle without reverse or stalled ticks.
- Nine original SVGs retain valid dimensions/registration; neutral body, legs and shell artwork remain unchanged. The shell pivot rises from 0.30 to 0.42 m.

Human verification remains pending for this extension: compare partial/full/over-cap jump feel, slope compensation and recoverable losses, empty/sofa/full immersion/swimming, and camera candidates. Permanent settings require replacing root settings.txt and reloading development or rebuilding production. Normal-level onboarding integration remains UX-004; real levels and touch controls remain deferred (UX-010 records gestures and the README-update reminder).

### Approved flight/camera/shell-height corrections — 2026-10-03

The human requested restoration of the original shell height, high-jump cargo consistency, per-side camera dead zones and physical obstacle waiting, and authorized Sol to synchronize the affected GDD rules. The reviewed implementation is `19e55fa`, with documentation commit `ac01575`, on preserved source branch `codex/physics-stability-camera`. Squash integration is `3cbbd00` on `dev`; its tree matches the verified source. Main remains untouched.

Agent verification on the reviewed implementation:

- Strict TypeScript and global ESLint pass. The checks used the bundled Node runtime directly because this Windows environment's npm runtime junction could not be resolved inside the sandbox; the repository package-script checks themselves remain unchanged.
- Vitest: **276 tests pass across 12 files**. Coverage includes full-charge 8 m/s and lower-gravity retention, higher 12 m/s flight, identical snapshots inside/outside different viewport heights, unchanged cargo independence and separation grace, and no remote assistance for separated/lost cargo. Harder landings and intentional imbalance may still lose objects.
- Actual collider shapes, masses, inertia and body registration remain unchanged across 0.30/0.42/0.55 m shell-height candidates. Static convex containment, complete rotation arcs at 60 Hz and adversarial 15 Hz, safe corrective rotation and terrain recovery pass.
- Blocked wall/object tests keep camera movement bounded while time and cargo continue; an actual full-charge jump clears the wall and resumes scrolling without repositioning the carrier. The authored-route validator stops at the first landing, preventing subsequent walking from certifying an insufficient jump.
- Root and repository-subpath production builds succeed. Browser checks initialize WASM, textures and the 19 controls with no console errors; the wall diagnostic holds camera X while simulation time continues. The fixed-scale laboratory preview, height editing, invalid dead-zone rejection, reset/pause preservation and single-step controls were verified. A real export contains all 38 tuning values plus schema version 2 without advancing the paused simulation. Landscape layout at 854×480 has no horizontal overflow.
- The unchanged local production-server helper passes **11 live Python unittest cases**. The root production server remains available for human testing at `http://127.0.0.1:4173/?mode=physics`; scenario 09 exercises wall waiting and charged-jump recovery.

The flight failure was independent of rendering: longer airborne intervals amplified carrier/cargo integration and contact-velocity differences until ordinary contact grace expired. The fix matches solver displacement and uses existing bounded contact grip without welding cargo or changing loss grace. The low restored shell pivot also required independent static polygon clearance: the recorded long-floor query discrepancy and corrective rotation recovery are documented in [PHYSICS.md](PHYSICS.md).

Human feel verification remains pending. Normal-level framing is supplied as an immutable load-time factory; its runtime integration waits for real levels. Full module-format integration remains MOD-001/MOD-006, and future dynamic-hazard shell clearance remains HAZ-001. **At this milestone PHYS-024 was blocked:** the original human settings attachment was unavailable; the later Downloads file was created by the agent's export test and was not imported. Only the explicitly approved shell height and 8 m/s launch plus the new dead-zone schema were adopted; other defaults remained unchanged until the human supplied the recovered text.

### Recovered tuning and local tester guide — 2026-10-03

The human supplied the recovered settings as pasted text, resolving PHYS-024 without relying on a later agent-generated download. Reviewed code/settings/test commit: `9d2f319`; documentation: `0921a4c`, on preserved branch `codex/human-settings-local-guide`. Squash integration: `e6efc0a` on `dev`, with the same verified source tree. BOOT-009, PHYS-024 and PHYS-025 are complete. All **36 shared numeric values** match the supplied backup exactly. Movement margins are now 20/80 percent; schema 2 retains the approved 40 percent dead zone and 0.30 m shell pivot. The obsolete direct zoom was removed during migration; maximum launch remains 8 m/s. No shared value required an incompatibility adjustment.

That movement window exposed PHYS-025: two distinct double-precision vertices in a transient shell envelope collapsed to the same float32 point, invalidating the assumed-convex native polyline. Coordinates are now quantized before ordering/deduplication, and Rapier normalizes the ordered hull. Independent SAT and rotation-clearance guards remain. The explicit full-load wall approach is covered as a finite-state regression; the configured-reset suite also passes.

Agent verification of the completed implementation:

- Strict TypeScript and global ESLint pass; **277 Vitest tests pass across 12 files**. The bundled Node runtime invoked the package tools directly because of the existing Windows sandbox/npm junction limitation; package scripts are unchanged.
- All 36 shared human defaults were compared numerically against the pasted text. The complete settings codec/schema tests pass.
- The unchanged Python server helper passes **11 live unittest cases**.
- Root and repository-subpath production builds succeed. Real-browser checks on Vite development, Vite preview, root Python serving and subpath Python serving initialize the canvas, textures and Rapier WASM with the expected 20/80 margins, 40 percent dead zone, 0.30 m shell pivot and 8 m/s launch, without console errors.
- The README's copyable local-server guide covers prerequisites, opening a repository-root terminal, dependency installation, explicit URLs/ports, rebuild/reload behavior, stopping servers, Python command alternatives, occupied ports, subpath builds and configuration backups. Tool help confirms the documented flags. The canonical file remains `README.md`; no duplicate `README.txt` was created.
- Temporary development/preview/subpath servers were stopped after verification. The root production helper remains available at `http://127.0.0.1:4173/?mode=physics`; the browser laboratory was reset and paused at tick/time zero with the complete 13.6 kg load.

Human feel verification of the wider movement corridor remains pending. The laboratory's physical corridor is approximately 10.11 m; its normal-level framing preview is approximately 50.53 m with the current 40 percent outer dead zones. Normal-level integration and authoring/readability checks remain Prototype 2 work. Main remains under human release control.

### Human-approved playground and jam service foundation — 2026-10-03

The human declared the physics playground ready, fine-tuned `gripAssistance=2.0` and `lossGraceSeconds=1.33` in `fd12654`, and promoted the verified work to main via `3b3d1f0`. The current service preparation preserves those settings, colliders and physical source. The approved main build is now served locally with Vite preview at `http://127.0.0.1:4173/?mode=physics`, separately from the new candidate builds.

The human explicitly selected a **packaged static catalog and browser-local Top 100**, with remote/global services later. Reviewed source commits on preserved branch `codex/jam-services-pages-template`: `bd4f8a0` (versioned content/catalog/load), `a2572ab` (ranking, anonymous composition and bootstrap), `fcbbac7` (configuration-aware physics tests) and `d8bada3` (service documentation and inactive workflow). Squash integration: `49dfa9d` on dev. MOD-001, LB-001, LB-002, BACK-001, TEST-011 and RELEASE-006 are complete. Main remains at the human-promoted `3b3d1f0`; the new service candidate awaits the separate human verification/promotion workflow.

The seed includes the existing full-load configuration and public maintainer/archetype metadata only. No real level, hazard behavior, editor, scoring screen, account registration or HTTP API is added. All seven requested level fields are represented by validated versioned contracts, including coordinate placements and author ownership metadata. Exact historical revisions coexist without reinterpretation. Account ownership must eventually be verified by the server; a profile ID is not authentication. [BACKEND.md](BACKEND.md) owns the concrete contracts and non-destructive migration rules.

Local service tests cover anonymous reload persistence, Top 100/order/ties, independent version partitions, mutation isolation, blocked storage, corrupt/future-version preservation, exact references, geometry, historical revisions and safe asset paths. The existing physics regression assumptions exposed by the new human tuning are tracked in TEST-011; source physics/settings remain unchanged.

The provisional Actions file remains **inactive** under `scripts/pages-deploy.provisional.yml`; manual dispatch/main guards, explicit main checkout, separate permissions, current checks and subpath build were reviewed. All five action SHAs and inputs were checked against official current Vite/GitHub documentation and their pinned action definitions. A YAML parser/actionlint/Actions runner was unavailable; no runner or actual Pages deployment result is claimed. Art/licensing, Pages settings, template activation and live publication remain release work.

The normal level/module pool, physics traversal matrix, hazards, score/results UI and Endless integration continue in their existing Prototype 2 tasks. Future account creation includes email/password and Google sign-in, while published-level and Endless play remain anonymous. No release authorization is inferred from successful local tests of this new service candidate.

Verified build/runtime evidence for this candidate:

- All **396 Vitest tests pass across 15 files**, including 119 new service tests (60 catalog, 55 ranking and 4 composition). The corrected real-physics suites also pass 35/35 with the actual human grip/grace.
- Strict TypeScript and global ESLint pass. Checks use the bundled Node runtime directly because of the existing sandbox/npm junction limitation; package scripts and dependency versions are unchanged.
- Root and repository-subpath production builds pass. Real-browser root menu, direct physics access, subpath access/refresh and textures/WASM initialize without console errors. Both new candidate routes show grip 2.0 and grace 1.33; startup requires no login.
- All 11 existing Python helper tests pass. Temporary candidate preview/subpath servers were stopped after smoke checks; the separately captured main-approved build remains served by Vite preview at port 4173, reset and paused for human testing.
- `settings.txt`, source physics/configuration, public art and package/lock files match the human-approved main tree. New service/catalog bootstrap adds no runtime dependency and no public workflow activation.

### Endless scope and planning review — 2026-10-04

The human explicitly changed the jam deliverable to Endless Run and authorized Sol to synchronize the scoped GDD/PRD design. A later correction sets **six** modules for the current **grass/rock/water** subset while preserving the complete GDD's four biomes. Clarifications approve three compatible trap sockets in every module, a separate dry non-scoring opening and a statistical base-frequency window of 5–10 scoring modules chosen per seed. The latest correction replaces the initially discussed 0.25/1/2 means with **0.5/0.75/1.5**, tending to **1/1.25/2** with at most +0.5 progression.

[ENDLESS_PLAN.md](ENDLESS_PLAN.md) records geometry, probability vectors, logarithmic rate, cargo values, file ownership and verification gates. During preparation these documentation edits stayed open and uncommitted on dev as requested; no gameplay change or new route certification was claimed at that stage. The human subsequently committed the preparation as `cf0adc2`, synchronized the repository and approved implementation. The following milestone records the resulting behavior and evidence.

Read-only subagent reviews `/root/design_audit` and `/root/architecture_review` identified the six-cycle adaptation, statistical/socket constraints, moving-stump support requirements, water joins, finite/X-only scenario limits and missing cargo values. Root Sol owns the authorized GDD edits.

Baseline checks on unchanged source during planning: strict TypeScript and ESLint pass; all **396 Vitest tests across 15 files** pass; root production build succeeds. Checks used the bundled Node runtime directly due the previously documented Windows npm runtime junction limitation. These checks certify the existing source baseline, not planned Endless gameplay. No release, push or main promotion occurred.

### Approved Endless implementation — 2026-10-04

The human approved the plan and synchronized dev before implementation. The production implementation is `be8d6fe`, with partial-load coverage in `48759ce` and digital DA cargo recovery in `93e1da6`, on preserved branch `codex/endless-jam`. The verified source head is `5dcfc8a`; squash integration is `5605d5c` on `dev`, with an identical implementation tree. The detailed source branch remains available locally and remotely. The current scope is six grass/rock/water modules, three traps and the complete Endless navigation/pause/score/results loop; the full GDD retains four biomes.

Agent verification:

- Strict TypeScript and global ESLint pass. The final suite including partial loads and digital DA recovery passes **618 tests across 24 files** in 225.27 seconds. The bundled Node runtime invokes the repository package tools directly because of the documented Windows npm junction limitation; dependencies and package scripts are unchanged.
- The opt-in `ENDLESS_EXHAUSTIVE=1` certificate passes all **1,152 complete physical routes** (six modules × 64 socket/type arrangements × full/sofa/empty loads), within 124 traversal cases. The certificate took 1,468.59 seconds on this host. Every socket/type also receives local recovery checks: 162 physical placements demonstrate activation and branch drop/stump lift; 36 physical compatible joins and 18 full-charge first-landings pass.
- All **15 nonempty cargo subsets** remain physically observed after original contact-loss grace in each of the four water modules: 60 carrier routes escape without changing shapes, masses or turtle position. Reports under ignored `artifacts/endless-partial-loads-{module}.json` distinguish carrier escape from cargo retention. The basic relative-angle trace (AD dives beneath the island; banks use upward swimming) retains cargo at the exit in BA 12/15, AB 9/15, AD 4/15 and DA 0/15; these are control-trace results, not guarantees for every input.
- Separate digital-control DA regressions brake/charge before the drop and accelerate on release, then use neutral/downward swimming. They retain sofa, TV and glass beyond the module with an initial full stack, demonstrating a viable continuing run without geometry or tuning changes. Tested sofa-only probe variants still lose the last item; no exhaustive retention or impossibility claim is made. Human control/balance refinement remains TEST-005/TEST-012.
- Seeded distributions/window limits, no-dead-end selection, once-only pennants, same-tick final loss, terminal accumulator guards, pause/help resets and captured framing pass. The streaming fake-world stress keeps at most four chunks/flags across 10,000 concatenations; actual Rapier tests separately validate ownership removal, body/query motion after origin shifts and safe retirement behind the captured visible edge. No kilometre-long retained physical run is claimed.
- Root and repository-subpath production builds pass. Real-browser verification covers all difficulties, keyboard/mouse navigation, disabled customized mode, pause/default confirmations, same-seed restart, help reset while paused, 640×360 resize, terminal results and return to title. A real production run scores 1,250 points at its first pennant and reaches frozen results at 86.283 seconds. Both hidden laboratory routes, textures and WASM load without errors; latest root/subpath checks preserve grip 2.0, grace 1.33, shell pivot 0.30 and jump maximum 8 m/s.
- The unchanged local server helper passes all 11 Python tests. Eleven new original terrain/hazard/pennant SVGs have valid XML/dimensions and artist replacement contracts. `settings.txt`, package/lock files and the original turtle/cargo assets retain the human-approved values/artwork.

Root Sol implemented the shared physical/service adapters and reviewed integration. `/root/endless_content` supplied seeded content/scoring/streaming; `/root/ui_game` supplied navigation/rendering and browser QA; `/root/assets_validation` supplied original assets and physical matrices; `/root/final_review` independently reviewed behavior/documentation. Review found asymmetric pinecone/terrain collision groups and overly early lost-body retirement for wider frames; both were corrected before source commit `be8d6fe`, with physical regressions. No earlier bug-introducing commit is claimed.

Human follow-up remains TEST-005/TEST-006/TEST-012 for balance, partial-loss recovery, readability and sustained retained-load play. Optional Endless records, touch controls, final art/audio and publication remain their tracked scopes. Local serving at `http://127.0.0.1:4173/` is available for review; live Pages/main promotion is a separate human-controlled release.

### Shared slopes, water and Credits handoff — 2026-10-05

The human requested the shared-game downhill fix, underwater balance/Space ascent, bounded wet cargo assistance and visible secondary laboratory access, then supplied the exact Credits dedication/link/signature/footer. Implementation is `13f5093` and `aa24e5d`, with revised route tests `0c1c228`, documentation `2bf2a19` and certificate record `acd123c`, on preserved branch `codex/slopes-water-controls`. Squash integration is `6299f64` on `dev`; its tree matched the verified source exactly before documentation-only bookkeeping. Root Sol owns the approved GDD synchronization; no module geometry, shapes, gravity, dry launch cap or camera corridor changed. Configurable starting depth/ascent are 0.25 m/kg and 14 m/s²; the revised partition is `endless-physics-2`.

Agent verification:

- Strict TypeScript and global ESLint pass. The general suite excluding the separately exhaustive traversal file passes 515 cases across 25 files in 198.66 seconds. The opt-in file passes 125/125 in 1,681.61 seconds. Together: **640 cases across 26 files**, including **1,152 complete compositions**, 18 mandatory full-charge first landings, socket recovery and compatible seams. Checks use the existing package tools through the bundled Node runtime because of the documented Windows npm junction limitation; packages/scripts are unchanged.
- Eleven mirrored-ramp/load/jump/cliff regressions verify real downward pitch, about 0.05 m foot clearance, shell separation, eligible jump departure and freefall. Five independent physical water-response cases verify ordinary correction, both extreme angles, violent impact, actual contact grace/loss and restoration of dry response. Island-lip recovery preserves rising intent and passes actual capsule plus complete shell-path guards.
- All 15 nonempty cargo subsets are physically observed after grace in each water module; all 60 carrier routes escape. Revised authored traces retain cargo at the exit in AB 12/15, BA 9/15, AD 10/15 and DA 2/15. Separate whole-route DA three-second jumps retain the sofa with Space ascent either held or released. The original full stack spawned/settled on a dry DA ledge reaches AD's natural underpass with all 13.6 kg, then exits with continuing cargo. This local-entry certificate does not claim perfect retention through all earlier DA terrain or all arbitrary inputs.
- Root and repository-subpath production builds pass. Browser checks confirm Credits' exact centred wording, hyperlink and footer, mouse/keyboard return, smaller gear entry, Shift+P/direct laboratory access, new control strip and textures/WASM without errors. A Normal production run records an actual pennant award and frozen zero-cargo results. The screenshot is ignored `artifacts/credits-2026-10-05.png`; the exact repeatable contract lives in GDD 41.5.6.
- All 11 Python server-helper tests pass. The original gear's XML/dimensions/viewBox are valid and its subpath asset resolves correctly. Current geometry and physical clearances, rather than avatar/object relocation, support the recovery evidence.

Root Sol implemented/integrated the shared physics and documentation. `/root/assets_validation` supplied downhill regression and measured island clearance; `/root/endless_content` supplied keyboard-equivalent route, real-entry and partial-load certification; `/root/ui_game` supplied menus, help, exact Credits, original gear and cargo-response tests; `/root/final_review` reviewed current source/contracts without finding actionable issues. The exact introducing commit for the prior downhill symptom remains unproven.

Human review remains necessary for feel, challenge, underwater grip, partial-loss recovery and the configurable depth/ascent starting values. TEST-005/TEST-006/TEST-012 preserve those follow-ups. The root production preview remains available locally; final live deployment belongs to the separately requested release thread.

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
