# Physics playground — implementation and tuning

**Language:** English
**Responsibility:** Current physical architecture, diagnostic controls, configuration and tuning workflow.
**Game-design authority:** [GDD](GDD.md), especially sections 8–13, 20–24 and 51–55.
**Phase scope:** [PRD](PRD.md), sections 1.1, 8 and 19.
**Task status and verification provenance:** [BACKLOG](BACKLOG.md).

This document describes Prototype 1. The playground uses grass, rock and compact water diagnostics to investigate the physical core. These diagnostic surfaces do not constitute completion of the designed-level or full biome-foundation milestone. Tuning values remain provisional until human playtesting establishes the intended feel.

## 1. Architecture and ownership

Rapier owns physical bodies, colliders, contacts and world stepping. Pixi renders a read-only simulation snapshot. HTML/CSS owns the laboratory toolbar, parameter fields and status readouts. Rendering does not write physical transforms.

| Source | Responsibility |
|---|---|
| `src/main.ts` | Hidden route, laboratory controls, world lifecycle, fixed-loop scheduling and parameter editing. |
| `src/game/core/fixedLoop.ts` | Accumulate render elapsed time and advance fixed simulation ticks; pause and single-step support. |
| `src/game/core/input.ts` | Keyboard state and input cleanup. |
| `src/game/config/tuning.ts` | Canonical tuning, validation, geometry/controller settings and the visible tuning-field list. |
| `src/game/systems/controller.ts` | Progressive speed changes, camera-window pressure and bounded shell angular motion. |
| `src/game/systems/cargoGraph.ts` | Pure shell-rooted cargo connectivity, separation grace and terminal loss. |
| `src/game/physics/simulation.ts` | Rapier world, terrain queries, turtle/shell control, cargo bodies, biome response and snapshots. |
| `src/game/content/cargo.ts` | Cargo dimensions, mass, center of mass and initial placement. |
| `src/game/content/scenarios.ts` | Authored diagnostic terrain and water regions. |
| `src/rendering/playgroundRenderer.ts` | Snapshot-to-Pixi synchronization, debug overlays and responsive viewport scaling. |
| `src/rendering/visualDefinitions.ts` | Visual asset paths, sizes, anchors and walk-animation slots. |
| `src/utils/publicAsset.ts` | Public asset URLs based on Vite's deployment base. |

### Fixed simulation and lifecycle

The baseline physics frequency is 60 Hz. Browser frames can produce zero, one or several fixed ticks. Long frames have a bounded catch-up budget; excess wall time is discarded rather than becoming a large simulation timestep. The displayed simulation time derives from the number of completed physics ticks.

Reset constructs a new world from the selected scenario, load and tuning. A fixed stationary settling phase establishes the initial stack before diagnostic tick zero. Reset clears pending elapsed time and pressed controls. It preserves the laboratory's pause state.

Pause freezes simulation time and world stepping. Resume clears pending elapsed time, avoiding a catch-up burst. Hiding the browser page automatically pauses the playground. Losing window focus clears pressed keys.

The application disposes the previous Rapier world and Pixi scene when leaving or rebuilding the playground. Shared asset textures remain cached for reuse.

### Turtle and shell

The turtle uses a horizontal capsule on a position-based kinematic Rapier body. Rapier's character controller resolves its requested movement against solid convex terrain prisms. The shell is a separate position-based kinematic body with a simplified convex collider: curved sides and a short flat crown provide a useful initial support surface. Its translation follows the carrier while its rotation follows the player's bounded shell control.

The character controller preserves numerical clearance through the canonical `controllerOffset` and `controllerNudge` settings. Snap-to-ground is deliberately disabled; gravity provides ground following. During implementation, snapping erased clearance at shallow contacts, allowing zero-time-of-impact normals to block horizontal travel even while the requested speed remained positive. Changes to clearance, nudging, terrain geometry or snapping must repeat the actual forward-traversal tests, not only the target-speed unit tests.

Movement uses Rapier's next-kinematic-transform APIs at the fixed timestep, allowing the solver to convey support movement to dynamic cargo. Ordinary traversal must not reposition cargo through sprite transforms or instant positional clamps.

The horizontal camera advances at a configured constant speed. Front and rear window pressure progressively bring the requested turtle speed toward camera speed. A small inner margin and proportional speed recovery correct realized drift toward either boundary without changing position directly. Acceleration/braking then approach that target. Supporting contact normals orient motion along slopes, with the groundward component applied normal to the support so uphill projection does not consume horizontal intent. Terrain resolution and water transitions must also be tested: a smooth requested speed alone does not prove smooth realized movement.

The kinematic carrier does not acquire a finite dynamic body mass from the cargo. Retained cargo mass is an explicit gameplay input, used for the water response. The snapshot's `turtle.mass` and the kilogram readout refer to **retained cargo mass**, excluding definitively lost items. A future carrier-controller experiment can change this implementation behind the simulation boundary without changing visual asset definitions.

### Cargo and loss

Each cargo item is an independent dynamic Rapier body. Colliders contribute no density; explicit mass properties supply mass, inertia and the local center-of-mass offset. Sofa and television use simple boxes. Glass and lamp use a small number of primitive/convex parts, allowing distinct silhouettes without detailed collision meshes.

The cargo graph's root is the reserved ID `shell`. Only a chain of eligible cargo contacts to that root establishes connectivity. Contacts through terrain, unknown bodies or definitively lost cargo cannot bridge the load. A disconnected cycle of cargo is not connected merely because its members touch each other.

| State | Meaning | Counts toward retained mass? |
|---|---|---|
| `active` | Connected to the shell directly or through other eligible cargo. | Yes |
| `separated` | Temporarily disconnected; the configured grace period has not expired. | Yes |
| `lost` | Grace expired; terminal until reset. | No |

Reconnection during grace clears the separation timer. Grace uses simulation time, not wall time. The pure tracker compensates floating-point accumulation so repeated fixed ticks do not unintentionally add a tick to an exact grace boundary.

On terminal loss, the simulation changes collision groups so the object can still fall against terrain but cannot interact with the turtle, shell or remaining cargo. It cannot return to the active graph. Its continuing visual motion is diagnostic/comedic presentation, not a gameplay obstacle.

Retained cargo uses zero linear damping during dry airborne motion so world-space damping cannot slow its freefall relative to the undamped kinematic carrier. Canonical linear damping returns while grounded or in water; angular damping remains active throughout. Water-entry velocity compensation uses realized carrier velocity.

Contact grip assistance is a tunable physical aid on connected cargo. It supplements friction and damping without welding the stack into one rigid body. Human testing must establish whether it remains helpful without removing meaningful corrections and partial losses.

### Dry surfaces and water

Grass provides the permissive reference surface. Rock uses a different contact/landing response. Compare the same shapes of terrain on both surfaces before attributing a difference to the material alone.

Water is an authored region with horizontal bounds, a surface and a bottom. It switches vertical input from shell tilt to swimming. There is no oxygen, health or drowning system. Entry/exit tolerance helps avoid rapid control switching near the surface.

The controller derives a weight-dependent preferred depth and upward response from retained cargo mass. Cargo in separation grace still contributes to this calculation. Depth increases the rightward current affecting the carrier; the same camera-window pressure still applies. The resulting advantage should be evaluated over a traversal, including the point where front-window pressure limits further positional gain.

Water does not add a lateral fluid force directly to cargo. Current modifies carrier motion. General shell-contact grip can still transmit the carrier's movement. Water entry uses vertical cushioning of retained cargo. Dry landing assistance applies on an air-to-ground transition, rather than repeatedly injecting vertical energy while grounded. This is deliberate gameplay assistance rather than a complete fluid simulation.

Water-entry cushioning, weight/depth behavior and stable transitions are tuning objectives. Verify both ordinary entry and the high-drop diagnostic before considering those behaviors suitable for level production.

## 2. Access and laboratory controls

Open the playground with `Shift + P` from the title screen, or navigate directly to `?mode=physics`. The ordinary title screen does not advertise the shortcut. Local setup and static-server commands belong in the [README](../README.md); deployment configuration belongs in [DEPLOYMENT](DEPLOYMENT.md).

| Control | Action |
|---|---|
| `→` / `←` | Accelerate / reduce forward speed; no reverse input. |
| `↑` / `↓` on dry terrain | Progressively raise / lower the shell's front. |
| `↑` / `↓` in water | Swim upward / downward. |
| `Esc` | Pause / continue the laboratory. |
| `R` | Reset the current scenario and selected load. |
| `N` | Advance one fixed tick while paused, using neutral gameplay controls. |
| `D` | Toggle collider/contact/camera-window debugging. |
| Scenario selector | Select another diagnostic and reset. |
| Initial-load selector | Compare the complete stack with the sofa-only load. |
| Parameter field | Apply a valid value and reset, preserving pause. |
| Restore baseline button | Restore the canonical baseline and reset. |
| Title button | Dispose the playground and return to the title screen. |

Keyboard shortcuts and movement do not intercept editing in the parameter/select fields. Focus the canvas again when returning to keyboard traversal.

Collider debugging is initially enabled. It draws physical edges, contact links, center-of-mass markers and the camera window. Cargo labels and status chips distinguish active, temporarily separated and lost items using symbols/text as well as color. The readout includes material, controlled speed, shell angle, retained cargo mass, simulation time and rendering FPS.

Each diagnostic stops advancing at its authored end. Use reset to repeat it. This endpoint is a laboratory boundary, not a game finish, delivery result or failure condition.

## 3. Scenarios and load comparison

| ID | Diagnostic purpose |
|---|---|
| `flat` | Grass baseline: stationary support, forward travel, acceleration/braking and shell correction. |
| `slopes` | Rock ramps and descents: terrain resolution, vertical motion and stack response. |
| `comparison` | Comparable bumps on grass followed by rock: material response with consistent geometry. |
| `water` | Basin traversal: control switching, full/light load depth, natural rise and current. |
| `water-drop` | Elevated entry: downward speed and vertical cushioning before and after entering water. |

The complete load contains the sofa, television, cocktail glass and floor lamp. The light diagnostic contains only the sofa. These presets investigate a mass relationship; they are development controls, not a player cargo-building or configuration-selection screen.

Scenario definitions use world coordinates and typed terrain strips. Their start/end bounds must stay inside supported terrain. Adjacent strips must meet without positional gaps. Water bounds and bottom/surface values must form a valid region. They are not the reusable module format or a procedural pool.

## 4. Configuration and tuning

`BASELINE_TUNING`, `PHYSICS_GEOMETRY`, `CARGO`, `SCENARIOS` and `VISUALS` are the current authoritative definitions for their respective responsibilities. Change those sources rather than introducing another playground-only set of physics values.

Physical coordinates use metres with positive Y upward; masses use kilograms, elapsed time uses seconds and angles use radians. Pixi converts physical Y to downward screen coordinates and scales the logical viewport to its host without changing physics.

| Configuration group | Meaning |
|---|---|
| `physicsHz`, `maxFrameSeconds`, `maxStepsPerFrame` | Fixed frequency and bounded wall-time catch-up. |
| `minSpeed`, `baseSpeed`, `maxSpeed`, `acceleration`, `braking` | Dry forward-control range and rate of change. |
| `cameraSpeed`, `cameraBack`, `cameraFront`, `cameraPressureWidth` | Camera advance, vertical following, safe-window position/pressure and smooth recovery, in world units relative to camera X. |
| `shellMaxAngle`, `shellAngularSpeed`, `shellAngularDamping` | Angular bound, requested angular speed and the rate of approaching that speed. |
| Cargo friction, linear/angular damping, `gripAssistance`, `lossGraceSeconds` | Contact retention, motion damping, gentle carrier-following assistance and temporary-separation duration. |
| Water depth/rise/weight/drag fields | Preferred depth and natural rise as functions of retained cargo mass. |
| Water swim/current/entry fields | Vertical input strength, depth-based horizontal assistance and vertical cushioning. |
| Grass/rock landing fields | Material-specific assistance during downward landing. |
| `worldPixelsPerMetre`, `viewWidth`, `viewHeight` | Visual world scale and logical viewport size. |
| `PHYSICS_GEOMETRY` | Carrier/shell dimensions, controller clearances and initial preparation settings. |
| `CARGO` | Per-object mass, center of mass, dimensions, primitive collider parts and initial stack placement. |

Some names describe their gameplay purpose rather than a complete physical model. For example, `shellAngularDamping` limits angular-speed change per second in the controller; it is not a dynamic torque law. Water rise is a gain toward a mass-dependent depth, not a simulation of displaced liquid volume.

The visible field list intentionally exposes only high-value parameters: acceleration, braking, shell angular speed, cargo friction, grip assistance, cargo angular damping, separation grace, water weight influence and current. Other values remain editable in canonical source configuration.

Changing a visible parameter resets the physical state so comparisons begin from the same preparation. It does not modify the baseline source file or persist across leaving/reopening the playground. Tuning export/persistence is not implemented.

### Suggested tuning sequence

1. Start with baseline values, complete cargo and `flat`. Observe hands-off stability before introducing corrective input.
2. Compare sustained acceleration and braking. Watch relative cargo movement and the approach to both camera boundaries.
3. Apply small shell corrections, then deliberately make a larger error. Look for recoverable wobble and individual loss rather than universal collapse or a rigidly glued stack.
4. Use pause, neutral single-step and collider/contact markers to investigate a separation. Check whether graph state and the grace timer explain the outcome.
5. Compare grass and rock with the repeated bump geometry. Check control response, landing energy and the direction of visible instability.
6. Repeat the water basin with complete and sofa-only loads. Compare retained mass, depth, natural rise, swimming response and forward assistance.
7. Use the high-drop water case to inspect entry. Cargo should not become lost merely because entering water produces an abrupt carrier/cargo mismatch.
8. Change one high-value parameter at a time, reset and repeat. Record the scenario, load, changed values, control sequence and approximate simulation time when reporting a result.

Subjective corrections and appropriate loss frequency require human playtesting. A numerically stable world is necessary, but does not establish that preserving the stack is understandable or fun.

## 5. Verification philosophy

Run the repository's applicable checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Unit coverage targets root-only connectivity, independent cargo timers, reconnect/reset behavior, terminal loss, fixed cadence, pause/resume, angular/speed bounds, camera pressure, configuration validation and deployment-base asset URLs.

Real-Rapier integration coverage targets finite body states, repeatable configured resets, continuous forward traversal, independent mass properties, lost-cargo collision isolation, water-control switching, weight/depth/rise/current relationships and high-entry cushioning. Prefer directional relationships and safety invariants over golden floating-point trajectories.

Inspect the production build in a browser as well as the development server. Check both playground access paths, public SVG textures, Rapier WASM loading, keyboard controls, pause/reset, scenario switching, resize behavior and asset loading below the configured repository subpath. A successful compilation or HTTP response alone does not prove initialization or visible play works.

Record actual automated results and human findings in the backlog and handoff. This document defines what to verify; it does not certify the current tuning or replace those results.

## 6. Current boundaries and follow-ups

The laboratory intentionally has no designed-level scoring, delivery finish logic, hazard framework, complete menu flow, contextual onboarding, leaderboard, Endless Run, final art or audio. Sand and full authored biome transitions remain later work. These deferrals follow the current PRD phase and do not remove features from the GDD.

The diagnostic pause/reset behavior is not the final player-facing pause menu with restart/exit confirmations. Early water diagnostics do not satisfy the designed level's onboarding-layout constraint. The finite scenario endpoint must not become a normal no-cargo failure condition.

Visual assets live under `public/sprites/` and use the shared Vite-base-aware URL helper. Visual dimensions and anchors are presentation data; replacing artwork must not redefine collider behavior. Turtle walking uses two unique prototype keyframes across 60 logical slots per second. Additional artist frames can extend the visual definition later.

The current controller, simplified material response and vertical water assistance are tunable implementation choices. If a controller cannot meet the GDD's continuous motion, recoverable loss or safe water behavior, investigate the smallest replacement through the simulation interface and record the evidence. Any actual gameplay-design change requires an approved decision and the appropriate source-document update.
