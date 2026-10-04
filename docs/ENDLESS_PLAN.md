# Endless jam implementation plan

**Date:** 2026-10-04
**Status:** PROPOSED — awaiting human implementation approval.
**Design authority:** [GDD](GDD.md), sections 16–17, 27, 33–35, 41–44.
**Required scope:** [PRD](PRD.md), sections 9–10 and 16.
**Task tracking:** [BACKLOG](BACKLOG.md).

This file owns the implementation sequence, proposed tuning and verification gates. It does not certify authored geometry or an implemented playable mode. Documentation is left uncommitted on `dev` at the human's request; no gameplay, settings, dependency or asset changes are part of this preparation.

## 1. Approved decisions and remaining plan assumptions

Approved by the human:

- Endless Run replaces the designed level as the jam deliverable.
- Six modules cover the three current runtime biomes: grass, rock and water.
- The complete GDD retains four biomes; sand and designed levels remain later work.
- Three traps: cracked branch/pit, hatch/rising stump, tree/falling pinecone.
- Three compatible trap sockets in every jam module.
- Statistical base means after the latest correction: easy 0.5, normal 0.75, hard 1.5. These replace the initially clarified 0.25/1/2. No finite-window quota.
- Seed chooses 5–10 scoring modules with unchanged base distribution.
- Subsequent logarithmic progression tends to base +0.5 without exceeding it.
- A separate protected dry opening has no traps, early reachable water or scoring pennant and is excluded from that 5–10-module window.
- Visual two-frame pennants, actual-route placement and the requested navigation loop.
- GDD/PRD changes are authorized now; implementation starts only after plan approval.

Proposals to validate with this plan:

- Use the six directed transitions `AB BD DA / AD DB BA`, A=water, B=grass, D=rock. The original GDD example lists abstract transition pairs, not eight existing geometries.
- Use the probability tables and progression rate in section 3.
- Initial cargo point values: sofa **100**, television **250**, floor lamp **400**, cocktail glass **500**, total **1,250**. These are provisional balance data; retain existing masses, shapes and initial positions.
- Normal is the default selected difficulty. Starting from its selector creates a new seed; pause restart repeats the current seed, difficulty and settings for a reproducible retry. Results offer return to title; an additional retry action is not necessary for the requested loop.
- Begin with safe single exits. Attempt one water route choice; keep different exit heights only if early route commitment and downstream visibility can be proven. Otherwise rejoin inside the module.

At the long-run limit, easy approaches one trap almost always and hard approaches two on average. Three remains forbidden in easy and occasional in hard. The latest lower base means avoid the earlier 2.5 hard-limit implication of at least 50% three-trap modules.

## 2. Six-module content proposal

| Pair | Proposed identity | Gameplay geometry | Exit strategy |
|---|---|---|---|
| BA: grass → water | Meadow and pond | Gentle dry undulations, a recoverable short drop, readable water entry and room to settle. | Single water connector with continuous surface/bed clearance. |
| AB: water → grass | Gentle bank | Swim upward, optional dry stepping island, forgiving exit ramp and grass recovery space. | Single dry exit. |
| BD: grass → rock | Rolling hills | Broad slopes, small raised rock shelf that invites a charged jump, space to land and rebalance. | Single rock exit, modest rise. |
| DB: rock → grass | Ledge and clearing | Controlled rock descent, optional short jump shortcut and a softer grass landing. | Routes rejoin before one grass exit. |
| DA: rock → water | Rocky ledge and pool | A readable dry approach and a drop into a sufficiently deep cushioning basin. | Single water exit, modest descent. |
| AD: water → rock | Island and rocky bank | Surface/deeper swimming alternatives, dry recovery sections and a rock-bank exit. | Candidate for vertical choice; early certified commitment or internal rejoin. |

Sketch local geometry first, around **50–80 m per module** as an initial pacing estimate; adjust lengths to provide three separated readable sockets, charging space and water/dry recovery. Heights are authored relative to entry, with modest net rises/descents. Dry slopes stay within current shell compensation; mandatory shelves/gaps retain a margin below demonstrated jump capability. These are authoring goals, not reachability certificates.

Water-entry modules may contain dry sections/islands, as permitted by GDD section 30. Every socket declares its own nonempty compatible-type list. Trees need a readable dry touch region; branch pits need a forward escape; stumps need swept headroom. Do not silently remove sockets or truncate a sampled three-trap count because a layout lacks compatible space: correct the layout first.

The opening begins on grass. Its minimum dry distance is derived from maximum permitted early-run speed × the combined first-three-help duration, plus carrier/geometry margin (currently 3.3 × 11 = **36.3 m**, before margin). Use roughly **40 m** as the first candidate and validate the actual earliest entry/activation with loaded settings. Start only BA or BD afterward because both accept grass.

## 3. Proposed probability law

Count is selected first; then choose that many distinct sockets without replacement, then a compatible type per socket. The three-socket decision makes every count realizable without biasing the required expectation.

Base distribution during the seeded window:

| Difficulty | P(0) | P(1) | P(2) | P(3) | Exact expectation |
|---|---:|---:|---:|---:|---:|
| Easy | 50.5% | 49% | 0.5% | 0% | 0.5 |
| Normal | 40.5% | 44.5% | 14.5% | 0.5% | 0.75 |
| Hard | 10% | 40% | 40% | 10% | 1.5 |

Limiting distribution, approached but not abruptly reached:

| Difficulty | P(0) | P(1) | P(2) | P(3) | Exact expectation |
|---|---:|---:|---:|---:|---:|
| Easy | 0.5% | 99% | 0.5% | 0% | 1 |
| Normal | 15% | 45.5% | 39% | 0.5% | 1.25 |
| Hard | 0% | 20% | 60% | 20% | 2 |

For one-based scoring-module index `n` and seeded window `S`:

```text
S = seeded integer in [5, 10]
k = max(0, n - S)
L = 10                         # proposed progression scale, in modules
u = ln(1 + k / L)
r = u / (1 + u)
P(n) = (1 - r) × P_base + r × P_limit
mean(n) = mean_base + 0.5 × r
```

For `n ≤ S`, r is exactly zero. The rise is monotonic and logarithmically slowing; it stays below +0.5 for every finite index. Ten modules after the window it adds about **0.205**; fifty after it adds about **0.321**. No difficulty setting changes jump, gravity, grip or cargo physics.

Store probability vectors/rate in canonical named configuration shared by game, diagnostics and tests. Preserve the existing `settings.txt` schema for the approved physical tuning unless a reviewed, explicit extension is necessary; do not scatter constants through hazard entities.

## 4. Implementation sequence and evidence gates

### Step 1 — Shared content and simulation lifecycle

**Ownership:** `src/game/physics/simulation.ts`, `src/game/content/scenarios.ts`, `src/services/contracts.ts`, `src/services/levelCatalog.ts`; new focused world-content helpers only as needed.

- Keep the tuned 60 Hz turtle/shell/cargo mechanics and existing diagnostics through a finite-scenario adapter.
- Support adding/removing module-owned solids and multiple water regions in one continuous world. A diagnostic `endX` remains optional diagnostic behavior, never an Endless finish.
- Separate solid bodies from support/material metadata. Replace X-only lookup where overlapping surfaces require pose/contact queries. Use module-local bed/solid bounds rather than an absolute floor at −20 m.
- Normalize legacy single exits; add sockets, route exits and solid geometry compatibly or document an explicit schema migration before using incompatible records.
- Define water connector reference surface/bed and optional route bands independently of the turtle's changing immersion depth.

**Gate:** existing physical/settings/catalog tests remain valid; adding/removing geometry does not reset cargo, leak handles/caches or change loaded physics.

### Step 2 — Seed, difficulty and module selector

**Ownership:** proposed `src/game/modes/endless/generator.ts`, `src/game/config/endless.ts` and module instance types.

- Capture seed, difficulty, pool/generator/settings versions and safe-window count at run creation.
- Use stable per-instance/per-purpose random streams for module/count/socket/type choices. Sort candidate IDs stably; presentation and preload order cannot consume gameplay randomness.
- Select from all compatible definitions; validate every selectable exit has successors.
- Realize the exact probability law, distinct socket subsets and compatible trap definitions once per instance.
- Provide a diagnostic reproduction descriptor including committed route history; the same seed with different player exits may legitimately generate a different continuation.

**Gate:** deterministic fixtures, all-eligible pool coverage, long sequences with no dead ends, exact probability-vector expectations, safe-window boundaries and monotonic/capped progression. Statistical sampling uses fixed seeds and meaningful tolerances; no flaky exact-count tests.

### Step 3 — Modules, joins and route certification

**Ownership:** proposed `src/game/content/modules/`, module placement helpers and traversal cases; preserve `jumpValidation.ts` as the existing single-jump validator.

- Author the safe prologue and six tabled definitions with three compatible sockets each.
- Align biome, horizontal connector, relative height and continuous water geometry.
- Build an authored route runner for multiple jumps/swimming/controlled input changes; current `validateJumpTraversal` alone covers only one constant-input jump.
- Validate full, sofa-only, empty and reachable partial-load cases. Empty traversal is diagnostic evidence even though normal Endless ends at zero cargo. Test all reachable cargo subsets where water/clearance changes with retained load.
- For each mandatory jump record full-charge launch and first grounded landing beyond the target, current settings, content revision and control sequence. Verify walking/swimming exits and recoverability too.
- For a split route, prove early irreversible exit commitment before downstream visibility/arrival; otherwise retain the authorized single-exit fallback.

**Gate:** base geometry for every accessible route/exit and join has successful actual-Rapier evidence with current 8 m/s jump and loaded tuning. Final trap-variant certification follows Step 4, before pool admission. A failed candidate is adjusted/retested; no analytic height-only certification. Human reading/feel remains a separate test.

### Step 4 — Three physical traps

**Ownership:** proposed `src/game/entities/hazards/`, `src/game/systems/hazards.ts`, simulation interaction API and hazard configuration.

- Give hazards explicit idle/triggered/active/spent phases, fixed-time delays and cleanup.
- Cracked branch: independent removable support over an authored pit; underlying forward escape stays intact.
- Hatch/stump: kinematic moving solid, explicit support displacement for the kinematic turtle, swept body/shell/cargo clearance and safe forward escape/retraction. A new collider alone is insufficient evidence that the carrier is lifted safely.
- Pinecone tree: non-solid turtle-contact sensor, visible delayed drop and dynamic cone impact on cargo. Hazard objects never become cargo-graph nodes. Disable/remove spent cones before they can leave a blocker.
- Preserve advance readability ≥3 s at fastest realizable approach, including water current and trap-assisted motion; ≥4 s for complex choices. Delay after touch is separate from telegraphing.

**Gate:** test triggers, delays, physical displacement/impact, permanent-loss isolation, paused timers, current-transform geometry queries and every generable socket/type combination. Cover pit escape, stump motion/clearance and cone aftermath with supported/partial loads. Rerun the Step 3 route/load/join matrix with these variants and admit modules only after that final certification.

### Step 5 — Streaming and long-run safety

**Ownership:** proposed `src/game/modes/endless/stream.ts`, resident-world lifecycle and renderer module containers.

- Instantiate upcoming terrain before it enters the fixed visible field or can be reached by the carrier/retained cargo; use captured framing and physical bounds to compute the preload horizon.
- Preserve one world and load through joins. Commit actual branch exits before downstream materialization.
- Dispose old colliders, water regions, hazards, debug/material caches and visuals only after the camera, all retained/separated cargo and pending interactions are clear.
- Retire definitively lost cargo bodies after their visible comic fall is safely behind the view, preserving terminal cargo/HUD/result metadata; do not leave fallen dynamic bodies drifting forever.
- Bound resident resources. Rebase active world coordinates at a fixed-tick boundary when required for float32 precision, shifting all bodies, next kinematic transforms, cameras, modules, hazard targets and water/query caches together; keep logical distance/index/seed history separate.

**Gate:** stress long seeded streams and actual representative runs; verify no seam gaps, premature deletion, increasing live-resource count or state change caused by cleanup/rebasing. Validate shifted worlds against equivalent short local coordinates using tolerances.

### Step 6 — Pennants, score and run termination

**Ownership:** proposed `src/game/modes/endless/run.ts`, pure score state and canonical cargo point values.

- After each physics tick's cargo-state update, detect new turtle distance crossings and add `n × retained value` once per boundary.
- Count active plus separated cargo in grace. Final loss takes precedence over a crossing; time and hazard/scoring updates freeze at the terminal snapshot.
- Guard every fixed-tick callback after terminal loss, including subsequent callbacks in the same `FixedLoop.advance` burst, so neither physics nor hazards advance again after results are captured.
- Track crossed pennants, elapsed simulation time, difficulty and last loss/group. Do not invent delivery/time/perfect bonuses.
- Pennants have no Rapier bodies/sensors. Position the two-frame visual at the committed route's visible connector, sized from the initial carrier/load presentation.
- Keep optional local personal-best storage separate by Endless difficulty, pool/generator and physics versions. Reuse robust storage utilities without manufacturing a published designed level to satisfy the old Top 100 API. This persistence is P1, not a prerequisite for the requested score screen.

**Gate:** pure formula, duplicate crossing, skipped-boundary processing, grace inclusion, same-tick final loss and frozen result tests; tree/cone contacts never alter cargo membership.

### Step 7 — Shared renderer and replaceable placeholders

**Ownership:** `src/rendering/playgroundRenderer.ts`, `visualDefinitions.ts`, new focused shared/Endless renderer as justified; `public/sprites/terrain/`, `public/sprites/hazards/{type}/`, `public/sprites/pennant/` and UI icons where needed.

- Reuse turtle/cargo textures and authoritative snapshots. Capture `createLevelCameraFraming` once; keep fixed normal-run zoom through flight, water, blockers and resize. Preserve fixed laboratory framing/debug behavior.
- Store simple original SVG shapes for new visible entities, including branch intact/broken, hatch/stump states, tree/cone and pennant folded/deployed. No raster-generation dependency or duplicate source assets is needed.
- Document sizes, anchors, frames and original provenance in ASSETS before handoff. Resolve all asset paths through `publicAsset`.
- Keep upcoming right-side geometry readable and put contextual help below the turtle. Vertical camera following may move; zoom stays fixed.

**Gate:** snapshot-only rendering, valid SVG dimensions/anchors, visible route pennants, fixed framing/resize and root/subpath asset loading.

### Step 8 — Navigation, pause, HUD and results

**Ownership:** `src/main.ts`, small `src/app/` route/screens, `src/ui/` helpers and `src/styles/main.css`; extract laboratory lifecycle without replacing the stack.

- Implement Title → Mode → Difficulty → Run → Results → Title, disabled customized-level entry and hidden playground access.
- Default to Normal; keyboard arrows/Enter/Esc plus optional mouse, clear selection beyond color.
- Pause freezes physics, run time, progression, help and hazards; Continue selected by default. Brief restart/exit confirmations; replay current seed on restart. Resetting help stays paused.
- Clear input/jump edges and fixed-loop accumulator during transitions/focus interruption. Auto-pause hidden pages; no catch-up on resume.
- HUD: all initial cargo icons/status, timer, pennants/multiplier and cumulative score. Freeze scene on final loss; show score/time/pennants/last loss and return to title.

**Gate:** state-transition tests, pause/confirmation/help invariants, no stale jump across menus, fresh help on restart and real keyboard-only completion of the navigation loop.

### Step 9 — Integrated checks and human handoff

- Run existing typecheck, lint, full Vitest and production builds, plus focused route/hazard/stream checks. Repeat traversal after any relevant tuning/geometry/controller change.
- Browser-smoke development and production root/subpath: fresh start in all difficulties, pause/restart, final results, textures/WASM, resize and both hidden playground access paths.
- Update PRD/BACKLOG/PHYSICS/ASSETS/BACKEND/README to describe actual completed behavior and remaining limitations; keep documentation registry current.
- Preserve focused auxiliary branch history/agent provenance and squash only the approved completed implementation into `dev` per CONTRIBUTING. Never promote to `main` without a separate explicit release instruction.
- Hand off seeds/settings/control traces and manual cases for geometry fun, partial loss, water advantage, trap readability and long-run feel. Compilation alone does not certify gameplay.

## 5. Review and readiness

The present work is documentation and planning only. Existing code supplies a diagnostic-only title/playground and services, not the six modules or any hazards/results. The proposed module geometry, moving-stump behavior and branch decisions must be implemented and validated before they can be described as safe.

Approval of this plan authorizes the ordered implementation above and its stated tuning assumptions. Subsequent genuine design contradictions are reported for a human decision; routine implementation choices stay within the approved scope.
