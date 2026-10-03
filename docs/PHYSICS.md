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
| `settings.txt` | Canonical adjustable startup defaults for game and laboratory. |
| `src/game/config/tuning.ts`, `settingsCodec.ts` | Typed tuning/geometry, physical camera-corridor derivation, validation, parsing/export and laboratory fields. |
| `src/game/config/cameraFraming.ts` | Fixed laboratory framing and immutable normal-level framing derived from the corridor/dead zones. |
| `src/game/systems/controller.ts` | Progressive speed changes, camera-window pressure and bounded relative shell angular motion. |
| `src/game/systems/jumpCharge.ts` | Fixed-time dry-grounded charge, capped release-once and cancellation. |
| `src/game/systems/contextualHelp.ts` | Shared timed per-run speed/balance/jump/swim onboarding and water priority. |
| `src/game/systems/cargoGraph.ts` | Pure shell-rooted cargo connectivity, separation grace and terminal loss. |
| `src/game/physics/simulation.ts` | Rapier world, terrain queries, turtle/shell control, cargo bodies, biome response and snapshots. |
| `src/game/content/cargo.ts` | Cargo dimensions, mass, center of mass and initial placement. |
| `src/game/content/scenarios.ts` | Authored diagnostic terrain and water regions. |
| `src/game/content/jumpValidation.ts` | Real-physics full-charge traversal validation for an authored route/load case. |
| `src/rendering/playgroundRenderer.ts` | Snapshot-to-Pixi synchronization, debug overlays and responsive viewport scaling. |
| `src/rendering/visualDefinitions.ts` | Visual asset paths, sizes, anchors and walk-animation slots. |
| `src/utils/publicAsset.ts` | Public asset URLs based on Vite's deployment base. |

### Fixed simulation and lifecycle

The baseline physics frequency is 60 Hz. Browser frames can produce zero, one or several fixed ticks. Long frames have a bounded catch-up budget; excess wall time is discarded rather than becoming a large simulation timestep. The displayed simulation time derives from the number of completed physics ticks.

Reset constructs a new world from the selected scenario, load and tuning. A fixed stationary settling phase establishes the initial stack before diagnostic tick zero. Reset clears pending elapsed time and pressed controls. It preserves the laboratory's pause state.

Pause freezes simulation time and world stepping. Resume clears pending elapsed time, avoiding a catch-up burst. Hiding the browser page automatically pauses the playground. Losing window focus clears pressed keys.

The application disposes the previous Rapier world and Pixi scene when leaving or rebuilding the playground. Shared asset textures remain cached for reuse.

### Turtle and shell

The turtle uses a fixed horizontal capsule as a simplified translation proxy on a position-based kinematic Rapier body. The character controller resolves movement against solid convex terrain. Simulation-owned body pitch follows confirmed physical support with bounded angular motion. An authored top-face angle is used only when the collision normal agrees with that face; corners use their actual normal. Simultaneous contacts prefer the flatter support deterministically, and grounded ticks without a new collision retain the last confirmed pitch. A downward Rapier query of the rotated capsule supplies the corrected body origin; lowering is smooth and upward terrain clearance takes priority. The fixed proxy remains responsible for locomotion, while the corrected origin drives both artwork and real shell support. Snapshots expose bodyX/bodyY alongside proxy x/y. Airborne body offset stays at its departure value and water eases it toward neutral. Airborne pitch keeps its departure orientation; water gently returns the pose toward horizontal.

The shell is a separate position-based kinematic body with the same simplified convex collider: curved sides and a short flat crown. `shellPivotY` controls its height above the body origin, along the rotated local up axis. The default returns to the original 0.30 m; the previously raised 0.42 m remains an optional tuning candidate. Initial cargo registration shifts by `shellPivotY - 0.30` before settling. Height changes affect support/cargo stability but preserve all body, shell and cargo collider shapes. World shell angle combines terrain body pitch and relative manual compensation. The traversable slope limit uses the same canonical shell compensation bound, initially 36 degrees. Physical support motion reaches dynamic cargo through Rapier.

The angular bound describes the requested control range, not guaranteed clearance at every support height. With the original 0.30 m pivot on a 36-degree uphill ramp, complete -36-degree relative compensation would push the shell's right rim approximately 0.12 m into the ramp. Safe partial compensation permits normal traversal while preserving body shape and foot placement. Extreme downward rotation can bring the shell against solid terrain and hold forward movement/camera progression until the player raises its front or jumps to clear the contact. The simulation does not silently raise the body or deform the shell to accept an impossible pose.

Terrain-clearance guards use physical collider vertices and transforms rather than artwork. For static convex polygons and cuboids, polygon separation checks use the separating-axis theorem (SAT), with the canonical `PHYSICS_GEOMETRY.posePenetrationTolerance` of 0.001 m. An explicitly ordered convex envelope of the departure/arrival hulls, expanded by the angular sagitta, protects the intermediate rotation arc; pure translation also uses Rapier's native linear sweep. Endpoint checks use the same 1 mm geometric tolerance rather than demanding an additional full clearance gap.

Temporary envelope coordinates are rounded to Rapier's float32 precision before sorting, deduplicating and ordering the hull; Rapier then normalizes that ordered hull. This prevents near-identical double vertices from becoming an invalid duplicate-edge polyline at conversion, without bypassing geometric clearance. The 20/80 movement-window wall approach is a regression case.

An existing support contact may be skipped only when analytic minima for every moving shell vertex prove that the entire path clears its support plane within numerical tolerance. Recovery may reduce an existing overlap but must not deepen it. Safe corrective rotation can occur in place before forward travel resumes. Rejected translation projects remaining movement along the contact tangent and rechecks the locomotion controller, preserving upward wall-clearance movement without allowing passage through the solid. Ramp joins, bank exits and headroom cases require actual traversal tests. The locomotion capsule keeps its horizontal orientation; it is a simplified translation proxy rather than a model of articulated feet.

In the recorded long-floor regression, the shell's actual geometric minimum was 15.48 mm below the floor while the pinned Rapier version's contact-distance query reported a positive 0.725 mm separation for that pose. This fixture-specific discrepancy requires the independent polygon guard; a zero-velocity cast or contact-distance result alone cannot certify clearance. Only immutable authored terrain vertices are cached. Additional static solids use their current collider transforms.

The character controller preserves numerical clearance through the canonical `controllerOffset` and `controllerNudge` settings. Snap-to-ground is deliberately disabled; gravity provides ground following. During implementation, snapping erased clearance at shallow contacts, allowing zero-time-of-impact normals to block horizontal travel even while the requested speed remained positive. Changes to clearance, nudging, terrain geometry or snapping must repeat the actual forward-traversal tests, not only the target-speed unit tests.

Movement uses Rapier's next-kinematic-transform APIs at the fixed timestep, allowing the solver to convey support movement to dynamic cargo. Ordinary traversal must not reposition cargo through sprite transforms or instant positional clamps.

The horizontal camera normally advances at its configured speed. Rear/front boundaries are percentages from the fixed laboratory viewport's left edge, converted to metre offsets from camera X at 76 pixels/metre. Initial placement comes from the validated corridor midpoint. Front and rear window pressure progressively bring requested turtle speed toward camera speed. A small inner margin and proportional speed recovery correct realized drift toward either boundary without changing position directly. Acceleration/braking then approach that target. Supporting contact normals orient motion along slopes, with the groundward component applied normal to the support so uphill projection does not consume horizontal intent. Terrain resolution and water transitions must also be tested: a smooth requested speed alone does not prove smooth realized movement.

If a solid ahead blocks accepted forward movement, the camera can consume the remaining rear-margin space but cannot push the carrier beyond that physical limit. At the rear margin, camera advance is bounded by accepted forward displacement: a stationary blocker holds the camera while physics, run time, cargo and jump charging continue. Once a jump clears the obstruction and accepted forward movement resumes, camera progression resumes automatically. This does not pause the world, reverse the camera or reposition the turtle. Lost cargo still cannot create a blocker.

### Camera framing and dead zones

The laboratory always renders its 1280×720 logical scene at 76 pixels/metre before uniform host scaling. Changing `cameraDeadZonePercent` does not change laboratory sprite scale or the physical corridor. The read-only laboratory preview reports the composition that a normal level would capture.

For a normal level, `createLevelCameraFraming(tuning)` produces an immutable frame at level load. Let `p = cameraDeadZonePercent / 100`, `back = cameraBack` and `front = cameraFront`:

```text
physical corridor width = front - back
visible world width = (front - back) / (1 - 2p)
visible left offset from camera X = back - p × visible world width
pixels per metre = 1280 / visible world width
rear viewport position = 100p percent
front viewport position = 100(1 - p) percent
```

Each outer dead zone occupies the chosen percentage of the complete normal-level viewport. The central corridor occupies the remaining `100 - 2 × cameraDeadZonePercent` percent. The accepted range is 0–45 percent per side. The default 40 percent reserves 40 percent on either side and leaves 20 percent for movement. The human's recovered defaults place the laboratory movement boundaries at 20 and 80 percent: approximately 3.37 and 13.47 m from camera X, a 10.11 m physical corridor. At 40 percent dead zone, a normal level would capture approximately 50.53 m of visible world; the laboratory keeps its fixed approximately 16.84 m span. Zoom is a derived framing result, not an adjustable setting.

The configured movement margins locate the carrier's centre. At zero dead zone those centres reach the viewport edges, so small dead-zone candidates can clip body/shell artwork. Normal-level authoring must check the complete Don Tortuga/shell silhouette at both horizontal margins with the chosen corridor and dead zone. The factory preserves the requested percentages; it does not silently clamp framing or change zoom during a run to repair readability.

Normal-level code must capture this frame once and retain it throughout the run. Host resizing uniformly scales the same composition rather than changing world span, physical movement limits or effective framing. Prototype 1 provides the shared factory and tests; the designed-level runtime remains future work.

The kinematic carrier does not acquire a finite dynamic body mass from the cargo. Retained cargo mass is an explicit gameplay input, used for the water response. The snapshot's `turtle.mass` and the kilogram readout refer to **retained cargo mass**, excluding definitively lost items. A future carrier-controller experiment can change this implementation behind the simulation boundary without changing visual asset definitions.

### Charged jump

Space begins charging only when dry and grounded. Fixed simulation time grows the charge up to jumpMaxChargeSeconds (default 3 s). Release launches once with a fraction of jumpMaxLaunchSpeed (currently 8 m/s), preserving forward motion. The launch intensity is linear in charge; ballistic height is not. Carrier and cargo share the configured gravity; see root settings.txt for the loaded value.

Pause, reset, focus loss, interactive-control focus, water entry and loss of ground eligibility cancel charging. A held key after interruption must not arm a later jump. No automatic launch occurs at the cap. Supported cargo may receive one bounded mass-proportional takeoff impulse based on accepted carrier motion. Temporarily separated/lost cargo receives no remote impulse, and existing relative/rotational motion remains independent. Global contact grace is unchanged.

Two registered head-lowered walking variants communicate concentration. There is no charge GUI. Clearing charge restores the neutral head pose; pause still freezes logical walking animation time.

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

Retained cargo uses zero linear damping during dry airborne motion so world-space damping cannot slow its freefall relative to the undamped kinematic carrier. Canonical linear damping returns while grounded or in water; angular damping remains active throughout. The carrier's dry airborne displacement matches the mean gravity integration of Rapier's solver substeps. Takeoff compensation uses accepted support motion with that integration correction, avoiding a one-tick displacement bias. Water-entry velocity compensation uses realized carrier velocity.

Contact grip assistance is a tunable physical aid on connected cargo. During dry airborne motion, its existing gain also gently reduces relative vertical-speed differences with the carrier; this is a mass-proportional force, not a position clamp. The takeoff frame uses its single bounded impulse instead. Separated or lost cargo receives neither takeoff nor airborne grip assistance. Setting `gripAssistance` to zero removes the assistance. Gravity matching and this bounded aid work together; gravity matching alone does not eliminate all relative velocity introduced by kinematic contacts. Global contact-loss grace remains unchanged, and cargo keeps independent rotation and can still be lost through actual tilt or impacts.

The high-jump regression was independent of visibility: no viewport-based physics culling exists. Longer flights exposed accumulated carrier/cargo displacement and contact-velocity differences, causing the ordinary separation timer to expire before landing. The correction addresses those physical differences while bodies and contacts continue stepping outside the frame. Neutral 8 m/s and low-gravity flights are retention cases; an extreme 12 m/s landing can still produce a genuine impact loss. Human testing must establish whether the assistance remains helpful without removing meaningful corrections and partial losses.

### Dry surfaces and water

Grass provides the permissive reference surface. Rock uses a different contact/landing response. Compare the same shapes of terrain on both surfaces before attributing a difference to the material alone.

Water is an authored region with horizontal bounds, a surface and a bottom. It switches vertical input from shell tilt to swimming. There is no oxygen, health or drowning system. Entry/exit tolerance helps avoid rapid control switching near the surface.

The controller derives a weight-dependent preferred depth and upward response from retained cargo mass. Water buoyancy gain starts at 8.4 s⁻². Swimming strength starts at 8 m/s² and its separate mass response at 0.05 kg⁻¹. An empty turtle has stronger natural restoration and resists sustained immersion; heavier retained loads reach deeper positions. Up/down modulates descent and return to the surface. Verify both controllable ascent and bank exit across empty, sofa-only and full loads. Cargo in separation grace still contributes to this calculation. Depth increases the rightward current affecting the carrier; the same camera-window pressure still applies. The resulting advantage should be evaluated over a traversal, including the point where front-window pressure limits further positional gain.

Water does not add a lateral fluid force directly to cargo. Current modifies carrier motion. General shell-contact grip can still transmit the carrier's movement. Water entry uses vertical cushioning of retained cargo. Dry landing assistance applies on an air-to-ground transition, rather than repeatedly injecting vertical energy while grounded. This is deliberate gameplay assistance rather than a complete fluid simulation.

Water entry preserves incoming vertical momentum, then drag and overspeed damping smoothly reduce it toward the normal vertical-speed bound. It does not instantly clip a high-drop entry to that bound. Cargo vertical cushioning still protects the stack. Water-entry cushioning, weight/depth behavior and stable transitions are tuning objectives. Verify both ordinary entry and the high-drop diagnostic before considering those behaviors suitable for level production.

## 2. Access and laboratory controls

Open the playground with `Shift + P` from the title screen, or navigate directly to `?mode=physics`. The ordinary title screen does not advertise the shortcut. Local setup and static-server commands belong in the [README](../README.md); deployment configuration belongs in [DEPLOYMENT](DEPLOYMENT.md).

| Control | Action |
|---|---|
| `→/D` / `←/A` | Accelerate / reduce forward speed; no reverse input. |
| `↑/W` / `↓/S` on dry terrain | Progressively tilt the shell front up / down relative to terrain pitch. |
| `Space` on dry ground | Hold to charge; release to jump. |
| `↑/W` / `↓/S` in water | Modulate upward / downward swimming. |
| `Esc` | Pause / continue the laboratory. |
| `R` | Reset the current scenario and selected load. |
| `N` | Advance one fixed tick while paused, using neutral gameplay controls. |
| `C` | Toggle collider/contact/camera-window debugging. |
| Scenario selector | Select another diagnostic and reset. |
| Initial-load selector | Compare complete, sofa-only and empty loads. |
| Parameter field | Apply a valid value and reset, preserving pause. |
| Restore settings button | Restore the loaded settings.txt defaults and reset. |
| Export settings button | Download current settings.txt without resetting or changing pause. |
| Preview help checkbox | Test shared onboarding in the diagnostic scene; ordinary level integration remains pending. |
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
| `jump-obstacle` | Small raised obstacle: partial/full charged takeoff and landing. |
| `slopes-max` | Near-limit rock ramps: terrain-relative pitch and manual compensation. |
| `water-jump` | Jump entry into a basin: incoming momentum and water cushioning. |
| `jump-wall` | Near-vertical 2 m wall at X=9 with a raised platform to X=16: camera hold at the rear margin and full-charge forward recovery. |

The nine scenarios are development diagnostics, not completed normal levels or reusable modules.

The complete load contains the sofa, television, cocktail glass and floor lamp. The light diagnostic contains only the sofa. The empty diagnostic contains no cargo and is used to compare buoyancy. These presets investigate a mass relationship; they are development controls, not a player cargo-building or configuration-selection screen.

Scenario definitions use world coordinates and typed terrain strips. Their start/end bounds must stay inside supported terrain. Adjacent strips must meet without positional gaps. Water bounds and bottom/surface values must form a valid region. They are not the reusable module format or a procedural pool.

## 4. Configuration and tuning

Root settings.txt is authoritative for adjustable gameplay defaults, including shell pivot height. createTuning loads an independent session copy; readonly BASELINE_TUNING reflects the same file. PHYSICS_GEOMETRY, CARGO, SCENARIOS and VISUALS remain authoritative for fixed collider shapes, authored cargo-layout reference, content and presentation. Fixed scheduling and logical viewport metrics remain source constants.

The versioned settings codec accepts numeric key=value entries, # comments, LF/CRLF and decimal exponents. It validates required/unknown/duplicate keys, finite bounds and cross-field relationships before applying a complete configuration. Errors identify settings.txt and the affected key/line. Spinner increments are conveniences rather than restrictions on valid fine decimal values.

Current exports use `schemaVersion=2`. To migrate a version-1 export, retain its other tuning values, change `schemaVersion` to 2, remove `cameraZoom`, add `cameraDeadZonePercent=40` as a starting framing candidate and add `shellPivotY=0.30`. Review the dead zone separately: the old direct zoom and the new percentage have different meanings and no automatic numerical conversion. The codec rejects unsupported versions rather than guessing a migration. The schema contains 38 adjustable numeric values plus its version entry.

The human supplied the recovered version-1 tuning as text on 2026-10-03. All shared numeric values were retained, including the 20/80 percent movement margins and 8 m/s maximum jump. Only the obsolete version/zoom entries were migrated; the new dead-zone and shell-height settings retain their approved 40 percent/0.30 m values. Later browser downloads are session candidates and do not replace that source provenance. Keep a backup before replacing a tuned repository file or an earlier downloaded candidate.

The human subsequently finalized the playground tuning in `fd12654`, promoted with `3b3d1f0` on main: `gripAssistance=2.0` and `lossGraceSeconds=1.33`. The jam service foundation preserves these values and the physical implementation. Regression observation windows must use the configured separation grace; assistance-force comparisons must account for the configured grip gain instead of silently assuming an older default.

Physical coordinates use metres with positive Y upward; masses use kilograms, elapsed time uses seconds and angles use radians. Pixi converts physical Y to downward screen coordinates and scales the logical viewport to its host without changing physics.

| Configuration group | Meaning |
|---|---|
| `physicsHz`, `maxFrameSeconds`, `maxStepsPerFrame` | Fixed frequency and bounded wall-time catch-up. |
| `minSpeed`, `baseSpeed`, `maxSpeed`, `acceleration`, `braking` | Dry forward-control range and rate of change. |
| `cameraSpeed`, `cameraVerticalSpeed`, rear/front percentages | Camera advance/following and fixed-laboratory movement boundaries; derived cameraBack/Front are metres relative to camera X. |
| `cameraDeadZonePercent` | Outer normal-level dead zone on each side, as percent of the complete viewport; changes derived framing only. |
| `cameraPressureWidth`, `cameraGuardMargin`, `cameraRecovery` | Smooth boundary pressure and velocity recovery. |
| `jumpMaxChargeSeconds`, `jumpMaxLaunchSpeed`, `gravity` | Maximum hold time, upward launch speed and shared airborne acceleration. |
| `shellMaxAngle`, `shellAngularSpeed`, `shellAngularDamping`, `shellPivotY` | Angular bound, requested angular speed, rate of approaching that speed, and pivot height above the body origin. |
| Cargo friction, linear/angular damping, `gripAssistance`, `lossGraceSeconds` | Contact retention, motion damping, gentle carrier-following assistance and temporary-separation duration. |
| Water depth/rise/weight/drag fields | Preferred depth and natural rise as functions of retained cargo mass. |
| Water swim/current/entry fields | Vertical input strength, depth-based horizontal assistance and vertical cushioning. |
| Grass/rock landing fields | Material-specific assistance during downward landing. |
| `worldPixelsPerMetre`, `viewWidth`, `viewHeight` | Visual world scale and logical viewport size. |
| `PHYSICS_GEOMETRY` | Carrier/shell dimensions, controller clearances and initial preparation settings. |
| `CARGO` | Per-object mass, center of mass, dimensions, primitive collider parts and initial stack placement. |

Some names describe their gameplay purpose rather than a complete physical model. For example, `shellAngularDamping` limits angular-speed change per second in the controller; it is not a dynamic torque law. Water rise is a gain toward a mass-dependent depth, not a simulation of displaced liquid volume.

The visible field list exposes 19 high-value parameters: movement/cargo/water controls, rear/front movement percentages, per-side normal-level dead zone, shell height, jump charge/launch, gravity, buoyancy and swimming strength/mass response. All 38 adjustable settings are exported, including those edited directly in settings.txt. Collider-shape and scheduling constants are not laboratory controls.

Changing a visible parameter validates a fresh configuration and resets the physical state, preserving pause. Rear/front boundary changes update the physical corridor and laboratory guides; dead-zone changes update the normal-level framing preview while laboratory scale stays fixed. Shell-height changes rebuild support and initial cargo placement before settling. Export downloads the current complete schema as settings.txt; it does not reset or step the world. Restore settings reinstates the loaded defaults.

To make laboratory changes permanent, replace root settings.txt with the exported file or edit it in a text editor. Reload development or rebuild production. Vite imports the file as raw text into the bundle; the Python helper and preview serve that existing bundle, so repository edits alone cannot change a previously built game. No browser filesystem writeback or backend is required.

### Suggested tuning sequence

1. Start with baseline values, complete cargo and `flat`. Observe hands-off stability before introducing corrective input.
2. Compare sustained acceleration and braking. Watch relative cargo movement and the approach to both camera boundaries.
3. Apply small shell corrections, then deliberately make a larger error. Look for recoverable wobble and individual loss rather than universal collapse or a rigidly glued stack.
4. Use pause, neutral single-step and collider/contact markers to investigate a separation. Check whether graph state and the grace timer explain the outcome.
5. Compare grass and rock with the repeated bump geometry. Check control response, landing energy and the direction of visible instability.
6. Repeat the water basin with complete, sofa-only and empty loads. Compare retained mass, depth, natural rise, swimming response and forward assistance.
7. Use the high-drop water case to inspect entry. Cargo should not become lost merely because entering water produces an abrupt carrier/cargo mismatch.
8. Try partial/full charge in jump-obstacle and water-jump; inspect takeoff, head posture, landing and cargo connectivity, including an 8 m/s flight above the visible frame. Compare near-limit ramps with and without manual compensation.
9. Compare shell-height candidates against the original 0.30 m default. Check stability, terrain clearance, initial cargo placement and foot visibility without resizing shapes.
10. In `jump-wall`, approach the 2 m wall until rear-margin space is exhausted. Check camera hold, continuing charge/time and automatic camera resumption after full-charge clearance. Compare the fixed laboratory guides with the read-only normal-level dead-zone preview.
11. Change one high-value parameter at a time, reset and repeat. Export useful candidates; replace the root file and rebuild to retain them. Record the scenario, load, changed values, control sequence and approximate simulation time when reporting a result.

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

Camera tests must preserve physical corridor width as dead-zone values change, prove fixed laboratory scale and verify that a captured normal-level frame stays immutable even when its source tuning is later changed.

Real-Rapier integration coverage targets finite body states, repeatable configured resets, continuous forward traversal, independent mass properties, lost-cargo collision isolation, water-control switching, weight/depth/rise/current relationships and high-entry cushioning. Prefer directional relationships and safety invariants over golden floating-point trajectories.

Flight regressions must cover long high jumps, retained independent bodies above the visible top edge, unchanged contact-loss grace and meaningful relative motion when an actual disturbance occurs. Test camera hold against a physical blocker and resumption during accepted airborne forward motion while simulation time continues.

Actual-geometry tests must check shell non-penetration against the 1 mm pose tolerance on every accepted ramp/long-floor pose, including complete downward compensation at the 0.30 m pivot, and normal traversal with safe partial compensation. Check the actual vertices/transforms independently of reported contact distances. Verify intermediate rotation clearance near roof corners, corrective rotation away from contact and recovery before forward travel resumes. A terrain-contact hold must remain recoverable through shell rotation or an eligible jump; camera/time behavior must follow the existing blocker contract. Keep body/foot registration unchanged and verify moved static solids use their current geometry rather than cached authored terrain data.

### Validating new module proposals

Every proposed module requires authored traversal cases for each mandatory route and relevant supported load, using the currently loaded settings (maximum jump speed is currently 8 m/s). `validateJumpTraversal(scenario, tuning, { chargeAtX, landingX, maxSeconds, load, controls? })` runs actual Rapier geometry, charges to the configured maximum, releases and requires the first grounded landing at or beyond the authored landing target. An earlier landing produces `landing-short`; walking forward after an insufficient jump cannot turn that case into a pass. Its result records the observed outcome, scenario/load, charge, launch, height, time, maximum launch speed, gravity and final snapshot.

Use those cases to validate approach/charging space, wall height and width, headroom, landing room, connector joins and recovery at the rear camera margin. A passing case demonstrates that authored route/load/control sequence. A failed sequence blocks certification of that case but does not prove no alternative sequence exists. The module owner must adjust geometry or author and verify a viable sequence before acceptance.

Repeat the full required route/load matrix after changes to launch speed, gravity, charge cap, shell registration, geometry, physical movement corridor or controller behavior. An idealized `v²/(2g)` height estimate is useful for sketching; it omits collision clearance, width, approach and landing constraints and cannot certify reachability. Prototype 1 diagnostics and helper tests do not constitute an implemented module pool or certified designed level.

Inspect the production build in a browser as well as the development server. Check both playground access paths, public SVG textures, Rapier WASM loading, keyboard controls, pause/reset, scenario switching, resize behavior and asset loading below the configured repository subpath. A successful compilation or HTTP response alone does not prove initialization or visible play works.

Record actual automated results and human findings in the backlog and handoff. This document defines what to verify; it does not certify the current tuning or replace those results.

## 6. Current boundaries and follow-ups

The laboratory intentionally has no designed-level scoring, delivery finish logic, hazard framework, complete menu flow, leaderboard, Endless Run, final art or audio. The shared four-message onboarding controller and optional preview are implemented; normal-level/menu integration remains pending. Sand and full authored biome transitions remain later work. These deferrals follow the current PRD phase and do not remove features from the GDD.

The diagnostic pause/reset behavior is not the final player-facing pause menu with restart/exit confirmations. Early water diagnostics do not satisfy the designed level's onboarding-layout constraint. The finite scenario endpoint must not become a normal no-cargo failure condition.

The independent polygon pose guard currently covers static convex/cuboid solids; it does not certify moving dynamic hazards. That future integration must validate collision filtering and swept moving-obstacle behavior when HAZ-001 begins, as tracked in the backlog.

Visual assets live under `public/sprites/` and use the shared Vite-base-aware URL helper. Visual dimensions and anchors are presentation data; replacing artwork must not redefine collider behavior. Turtle walking uses two unique prototype keyframes across 60 logical slots per second. Additional artist frames can extend the visual definition later.

The current controller, simplified material response and vertical water assistance are tunable implementation choices. If a controller cannot meet the GDD's continuous motion, recoverable loss or safe water behavior, investigate the smallest replacement through the simulation interface and record the evidence. Any actual gameplay-design change requires an approved decision and the appropriate source-document update.
