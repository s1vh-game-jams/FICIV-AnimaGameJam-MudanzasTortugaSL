import { afterAll, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createTuning, PHYSICS_GEOMETRY } from '../../src/game/config/tuning';
import { HAZARD_TUNING } from '../../src/game/config/hazards';
import { validateJumpTraversal } from '../../src/game/content/jumpValidation';
import type { Scenario } from '../../src/game/content/scenarios';
import type { Controls } from '../../src/game/core/input';
import { ENDLESS_MODULES, placeModule, scenarioForModule } from '../../src/game/modes/endless/modules';
import type { EndlessModuleDefinition, SocketChoice } from '../../src/game/modes/endless/modules';
import { PhysicsSimulation } from '../../src/game/physics/simulation';
import type { LoadPreset, SimulationSnapshot } from '../../src/game/physics/simulation';
import type { TrapKind } from '../../src/game/physics/worldContent';

/** Opt-in release certificate: 6 definitions × 64 placements × 3 initial loads. */
const exhaustiveCompositions = process.env.ENDLESS_EXHAUSTIVE === '1';
// The authored tree sensor occupies the first 1.4 metres above its ground.
const treeTouchHeightMetres = 1.4;
const loads: readonly LoadPreset[] = ['full', 'light', 'empty'];
const finite = (snapshot: SimulationSnapshot) => [snapshot.cameraX, snapshot.cameraY,
  snapshot.turtle.x, snapshot.turtle.y, snapshot.turtle.bodyX, snapshot.turtle.bodyY,
  snapshot.turtle.speed, snapshot.turtle.verticalSpeed, snapshot.shell.x, snapshot.shell.y,
  snapshot.shell.angle, ...snapshot.cargo.flatMap(cargo => [cargo.x, cargo.y, cargo.angle])].every(Number.isFinite);

/** Digital balance keys counter terrain-relative pitch; Space owns ascent. */
const balanceInput = (snapshot: SimulationSnapshot): -1 | 0 | 1 => {
  const target = snapshot.turtle.biome === 'water' ? 0 : -snapshot.turtle.bodyAngle;
  const difference = target - snapshot.turtle.angle;
  return difference > 0.015 ? 1 : difference < -0.015 ? -1 : 0;
};

/** Authored controls, actual Rapier passage; losses remain diagnostic rather than stopping this runner. */
function traverse(simulation: PhysicsSimulation, targetX: number, ascent: 0 | 1 = 0, watchedTrapX?: number,
  waterApproachSpeed: -1 | 0 = 0, recoverWaterHolds = false, waterApproachEndX = 18) {
  let snapshot = simulation.snapshot(), maximumY = snapshot.turtle.bodyY;
  let minimumWaterY = Infinity, sawWater = false, charging = false, launchCount = 0, islandCrossingY: number | undefined;
  let islandCrossingMass: number | undefined;
  let heldX = snapshot.turtle.x, heldTicks = 0;
  let minimumTrapY = Infinity;
  let ascentHeld = ascent === 1, waterRecoveries = 0;
  const bypassedHazards = new Set<string>();
  for (let tick = 0; tick < simulation.tuning.physicsHz * 70 && snapshot.turtle.x < targetX; tick++) {
    const vertical = balanceInput(snapshot);
    let controls: Controls = { horizontal: snapshot.turtle.biome === 'water' && snapshot.turtle.x < waterApproachEndX ? waterApproachSpeed : 0,
      vertical, jumpHeld: snapshot.turtle.biome === 'water' && ascentHeld };
    if (recoverWaterHolds && heldTicks >= 90 && snapshot.turtle.biome === 'water') {
      // Release ascent to permit only the load's natural immersion/momentum,
      // or press Space to rise. No input commands downward translation.
      ascentHeld = !ascentHeld;
      controls = { ...controls, jumpHeld: ascentHeld }; heldTicks = 0; waterRecoveries++;
    }
    // A short recoverable physical hold may require the game's charged jump.
    // The runner never teleports the carrier or skips the obstruction.
    if (charging) {
      if (snapshot.turtle.jumpChargeSeconds >= simulation.tuning.jumpMaxChargeSeconds) {
        controls = { ...controls, jumpReleased: true }; charging = false; launchCount++;
      } else controls = { ...controls, jumpHeld: true };
    } else if (heldTicks >= 90 && snapshot.turtle.grounded && snapshot.turtle.biome !== 'water') {
      controls = { ...controls, jumpPressed: true, jumpHeld: true }; charging = true; heldTicks = 0;
    }
    simulation.step(controls); snapshot = simulation.snapshot();
    for (const hazard of snapshot.hazards) {
      const clearHeight = hazard.kind === 'tree' ? treeTouchHeightMetres : 0.25;
      if (hazard.phase === 'idle' && !snapshot.turtle.grounded &&
          Math.abs(snapshot.turtle.x - hazard.x) < 0.5 && snapshot.turtle.bodyY - PHYSICS_GEOMETRY.turtleHalfHeight > hazard.y + clearHeight) {
        bypassedHazards.add(hazard.id);
      }
    }
    if (islandCrossingY === undefined && snapshot.turtle.x >= 13) {
      islandCrossingY = snapshot.turtle.bodyY; islandCrossingMass = snapshot.turtle.mass;
    }
    maximumY = Math.max(maximumY, snapshot.turtle.bodyY);
    if (watchedTrapX !== undefined && Math.abs(snapshot.turtle.x - watchedTrapX) < 0.75) minimumTrapY = Math.min(minimumTrapY, snapshot.turtle.bodyY);
    if (snapshot.turtle.biome === 'water') {
      sawWater = true; minimumWaterY = Math.min(minimumWaterY, snapshot.turtle.bodyY);
    }
    if (snapshot.turtle.x > heldX + 0.15) { heldX = snapshot.turtle.x; heldTicks = 0; } else heldTicks++;
    if (!finite(snapshot)) throw new Error(`Non-finite ${snapshot.scenarioId} at tick ${snapshot.tick}`);
  }
  return { snapshot, maximumY, minimumWaterY, sawWater, launchCount, islandCrossingY, islandCrossingMass, minimumTrapY, waterRecoveries, bypassedHazards };
}

/** Water controls precede the dry charged jump without resetting its load/world. */
function islandJump(definition: EndlessModuleDefinition, load: LoadPreset) {
  const tuning = createTuning(), simulation = new PhysicsSimulation(scenarioForModule(definition), tuning, load);
  const jump = definition.jumps[0];
  let final = simulation.snapshot(), phase: 'approach' | 'charging' | 'airborne' = 'approach';
  let chargeSeconds = 0, launched = false;
  try {
    for (let tick = 0; tick < tuning.physicsHz * 35; tick++) {
      let controls: Controls = { horizontal: final.turtle.biome === 'water' && final.turtle.x < 18 && load === 'light' ? -1 : 0,
        vertical: balanceInput(final), jumpHeld: final.turtle.biome === 'water' };
      let releasing = false;
      if (phase === 'approach' && final.turtle.x >= jump.chargeAtX) {
        if (!final.turtle.grounded || final.turtle.biome === 'water') return { outcome: 'ineligible-charge', final, chargeSeconds, launched };
        phase = 'charging'; controls = { ...controls, jumpPressed: true, jumpHeld: true };
      } else if (phase === 'charging') {
        if (!final.turtle.jumpCharging) return { outcome: 'charge-canceled', final, chargeSeconds, launched };
        if (final.turtle.jumpChargeSeconds >= tuning.jumpMaxChargeSeconds) {
          chargeSeconds = final.turtle.jumpChargeSeconds; releasing = true; controls = { ...controls, jumpReleased: true };
        } else controls = { ...controls, jumpHeld: true };
      }
      simulation.step(controls); final = simulation.snapshot();
      if (!finite(final)) throw new Error('Non-finite multi-control island jump');
      if (releasing) {
        launched = !final.turtle.grounded && final.turtle.verticalSpeed > 0;
        if (!launched) return { outcome: 'launch-blocked', final, chargeSeconds, launched };
        phase = 'airborne';
      }
      if (launched && final.turtle.grounded) return { outcome: final.turtle.x >= jump.landingX ? 'passed' : 'landing-short', final, chargeSeconds, launched };
    }
    return { outcome: 'timeout', final, chargeSeconds, launched };
  } finally { simulation.dispose(); }
}

function trapScenario(definition: EndlessModuleDefinition, choices: readonly SocketChoice[]): Scenario {
  const diagnostic = scenarioForModule(definition), placed = placeModule(definition, 1, 0, definition.start.height, choices);
  return { ...diagnostic, terrain: [diagnostic.terrain[0], ...placed.terrain, diagnostic.terrain.at(-1)!] };
}

function variants(definition: EndlessModuleDefinition): SocketChoice[][] {
  let all: SocketChoice[][] = [[]];
  for (const socket of definition.sockets) all = all.flatMap(previous => [previous,
    ...socket.compatible.map(kind => [...previous, { socketId: socket.id, kind }])]);
  return all;
}

const tripleVariants = (definition: EndlessModuleDefinition): SocketChoice[][] => [
  ...(['branch', 'stump', 'tree'] as const).map(kind => definition.sockets.map(socket => ({ socketId: socket.id, kind }))),
  definition.sockets.map((socket, i) => ({ socketId: socket.id, kind: ['branch', 'stump', 'tree'][i] as TrapKind })),
];

function localTrapScenario(definition: EndlessModuleDefinition, choice: SocketChoice): Scenario {
  const placed = placeModule(definition, 1, 0, definition.start.height, [choice]);
  const socket = definition.sockets.find(candidate => candidate.id === choice.socketId)!;
  const terrain = placed.terrain.filter(strip => strip.points[0].x < socket.x + 8 && strip.points.at(-1)!.x > socket.x - 8);
  // Keep real authored slopes/recesses around the socket, trimming distant polygons only.
  const clip = (strip: typeof terrain[number]) => {
    const left = Math.max(socket.x - 8, strip.points[0].x), right = Math.min(socket.x + 8, strip.points.at(-1)!.x);
    const yAt = (x: number) => {
      const index = strip.points.findIndex((point, i) => i + 1 < strip.points.length && point.x <= x && strip.points[i + 1].x >= x);
      const a = strip.points[index], b = strip.points[index + 1];
      return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
    };
    return { ...strip, points: [{ x: left, y: yAt(left) }, ...strip.points.filter(point => point.x > left && point.x < right), { x: right, y: yAt(right) }] };
  };
  const clipped = terrain.map(clip);
  const startX = socket.x - 7;
  const startStrip = clipped.find(strip => strip.points[0].x <= startX && strip.points.at(-1)!.x >= startX)!;
  const segmentIndex = startStrip.points.findIndex((point, i) => i + 1 < startStrip.points.length && point.x <= startX && startStrip.points[i + 1].x >= startX);
  const a = startStrip.points[segmentIndex], b = startStrip.points[segmentIndex + 1];
  const startY = a.y + (b.y - a.y) * (startX - a.x) / (b.x - a.x);
  return { id: `${definition.id}-${choice.socketId}-${choice.kind}`, label: 'Authored socket recovery', description: '',
    startX, startY, endX: socket.x + 7,
    terrain: clipped,
  };
}

describe.each(ENDLESS_MODULES)('actual current-settings traversal: $id', definition => {
  it.each(loads)('crosses the complete base route with the %s load', load => {
    const tuning = createTuning();
    expect(tuning.jumpMaxLaunchSpeed).toBe(8);
    const simulation = new PhysicsSimulation(scenarioForModule(definition), tuning, load);
    try {
      const result = traverse(simulation, definition.length + 3, definition.id === 'AD' ? 1 : 0,
        undefined, definition.id === 'AD' && load === 'light' ? -1 : 0);
      expect(result.snapshot.turtle.x, `${definition.id}/${load} stalled at ${result.snapshot.turtle.x}`).toBeGreaterThanOrEqual(definition.length + 3);
      expect(result.snapshot.turtle.biome).toBe(definition.end.biome);
      expect(result.sawWater).toBe(!!definition.water?.length);
    } finally { simulation.dispose(); }
  }, 30_000);

  it.each(loads)('records a full-charge first landing across the authored jump with the %s load', load => {
    for (const jump of definition.jumps) {
      const result = definition.id === 'AD' ? islandJump(definition, load) : validateJumpTraversal(scenarioForModule(definition), createTuning(), {
        ...jump, maxSeconds: 35, load, controls: { horizontal: 0, vertical: 0 },
      });
      expect(result.outcome, `${definition.id}/${load}: ${result.outcome}; landing X ${result.final.turtle.x}`).toBe('passed');
      expect(result.chargeSeconds).toBe(3);
      expect(result.launched).toBe(true);
      expect(result.final.turtle.grounded).toBe(true);
    }
  }, 30_000);

  it.each(loads)('escapes every trap type at every authored socket with the %s load', load => {
    for (const socket of definition.sockets) for (const kind of socket.compatible) {
      const choices: SocketChoice[] = [{ socketId: socket.id, kind }];
      const simulation = new PhysicsSimulation(localTrapScenario(definition, choices[0]), createTuning(), load);
      const placed = placeModule(definition, 1, 0, definition.start.height, choices);
      simulation.addWorldChunk({ id: 'diagnostic-traps', terrain: [], traps: placed.traps });
      try {
        const result = traverse(simulation, socket.x + 6, 0, socket.x);
        expect(result.snapshot.turtle.x, `${definition.id}/${load}/${kind}/${socket.id}: stalled ${result.snapshot.turtle.x}`).toBeGreaterThanOrEqual(socket.x + 6);
        expect(result.snapshot.hazards.every(hazard => hazard.phase === 'spent')).toBe(true);
        if (kind === 'stump') expect(result.maximumY, `${definition.id}/${socket.id}/${load}: stump did not lift carrier`).toBeGreaterThan(socket.y + 0.8);
        if (kind === 'branch') expect(result.minimumTrapY, `${definition.id}/${socket.id}/${load}: branch did not drop carrier`).toBeLessThan(socket.y + 0.2);
      } finally { simulation.dispose(); }
    }
  }, 120_000);

  const compositionLabel = exhaustiveCompositions ?
    'crosses all 64 compatible trap compositions with the %s load' :
    'crosses all-three branch/stump/tree and mixed compositions with the %s load';
  it.each(loads)(compositionLabel, load => {
    for (const choices of exhaustiveCompositions ? variants(definition) : tripleVariants(definition)) {
      const simulation = new PhysicsSimulation(trapScenario(definition, choices), createTuning(), load);
      const placed = placeModule(definition, 1, 0, definition.start.height, choices);
      simulation.addWorldChunk({ id: 'diagnostic-traps', terrain: [], traps: placed.traps });
      try {
        const result = traverse(simulation, definition.length + 3, definition.id === 'AD' ? 1 : 0,
          undefined, definition.id === 'AD' && load === 'light' ? -1 : 0);
        expect(result.snapshot.turtle.x, `${definition.id}/${load}/${JSON.stringify(choices)}: stalled ${result.snapshot.turtle.x}`).toBeGreaterThanOrEqual(definition.length + 3);
        expect(result.snapshot.hazards.every(hazard => hazard.phase === 'spent' ||
          hazard.phase === 'idle' && result.bypassedHazards.has(hazard.id))).toBe(true);
      } finally { simulation.dispose(); }
    }
  }, exhaustiveCompositions ? 600_000 : 120_000);

  it('makes every occupancy/type variant valid and separates active interactions', () => {
    const tuning = createTuning(), maximumApproachSpeed = tuning.maxSpeed + tuning.waterCurrent;
    const all = variants(definition);
    expect(all).toHaveLength(64);
    for (const choices of all) {
      const placed = placeModule(definition, 1, 0, definition.start.height, choices);
      expect(new Set(placed.traps.map(trap => trap.id)).size).toBe(choices.length);
      for (const trap of placed.traps) {
        const socket = definition.sockets.find(candidate => trap.id.endsWith(candidate.id))!;
        expect(socket.compatible).toContain(trap.kind);
        const supportingStrip = definition.terrain.find(strip => strip.points.some((a, i) => {
          const b = strip.points[i + 1];
          return b && a.x <= socket.x - HAZARD_TUNING.branchWidth / 2 && b.x >= socket.x + HAZARD_TUNING.branchWidth / 2 && a.y === socket.y && b.y === socket.y;
        }));
        expect(supportingStrip, `${definition.id}/${socket.id} must support every compatible trap`).toBeDefined();
        if (trap.kind === 'branch') {
          const pit = placed.terrain.find(strip => strip.points.some(point => point.x === socket.x && point.y < socket.y))!;
          const floor = pit.points.find(point => point.x === socket.x)!;
          const escape = pit.points.find(point => point.x === socket.x + HAZARD_TUNING.branchWidth / 2)!;
          expect((escape.y - floor.y) / (escape.x - floor.x)).toBeLessThan(Math.tan(tuning.shellMaxAngle));
        }
      }
    }
    for (let i = 1; i < definition.sockets.length; i++) {
      const separationSeconds = (definition.sockets[i].x - definition.sockets[i - 1].x) / maximumApproachSpeed;
      expect(separationSeconds).toBeGreaterThanOrEqual(3);
      expect(separationSeconds).toBeGreaterThan(HAZARD_TUNING.coneLifetimeSeconds);
      expect(separationSeconds).toBeGreaterThan(HAZARD_TUNING.stumpRiseSeconds + HAZARD_TUNING.stumpHoldSeconds + HAZARD_TUNING.stumpRetractSeconds);
    }
  });
});

describe('water alternatives and reachable partial loads', () => {
  const island = ENDLESS_MODULES.find(module => module.id === 'AD')!;
  const chainReports: unknown[] = [];
  afterAll(async () => {
    const directory = join(process.cwd(), 'artifacts');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'endless-da-ad-entry.json'), JSON.stringify(chainReports, null, 2));
  });
  it('takes the natural submerged choice from an original full-load dry DA ledge', () => {
    const approach = ENDLESS_MODULES.find(module => module.id === 'DA')!;
    const first = placeModule(approach, 1, 0, approach.start.height);
    const second = placeModule(island, 2, first.endX, first.endHeight);
    const scenario: Scenario = {
      id: 'DA-AD-natural-immersion', label: 'Real entry and retained-mass island route', description: '',
      // The dry ledge fixture creates its original full load here; no carrier
      // or retained object is moved after physical registration/settling.
      startX: 47, startY: 0, endX: second.endX + 8,
      terrain: [scenarioForModule(approach).terrain[0], ...first.terrain, ...second.terrain,
        { biome: 'rock', bottom: -9, points: [{ x: second.endX, y: second.endHeight }, { x: second.endX + 16, y: second.endHeight }] }],
      waters: [...first.water ?? [], ...second.water ?? []],
    };
    const tuning = createTuning(), simulation = new PhysicsSimulation(scenario, tuning, 'full');
    let snapshot = simulation.snapshot();
    const initialMass = snapshot.turtle.mass;
    let crossingY: number | undefined, crossingMass = 0, adEntryMass: number | undefined;
    let waterEntry: unknown;
    const losses: unknown[] = [];
    try {
      for (let tick = 0; tick < tuning.physicsHz * 100 && snapshot.turtle.x < second.endX + 3; tick++) {
        const controls: Controls = { horizontal: 0, vertical: balanceInput(snapshot), jumpHeld: false };
        const previous = snapshot, previouslyWater = snapshot.turtle.biome === 'water';
        simulation.step(controls); snapshot = simulation.snapshot();
        if (waterEntry === undefined && !previouslyWater && snapshot.turtle.biome === 'water') {
          waterEntry = { turtle: snapshot.turtle, shell: snapshot.shell, cargo: snapshot.cargo };
        }
        for (const cargo of snapshot.cargo) if (cargo.state === 'lost' && previous.cargo.find(item => item.id === cargo.id)?.state !== 'lost') {
          losses.push({ id: cargo.id, x: snapshot.turtle.x, time: snapshot.time, biome: snapshot.turtle.biome });
        }
        if (adEntryMass === undefined && snapshot.turtle.x >= second.startX) adEntryMass = snapshot.turtle.mass;
        if (crossingY === undefined && snapshot.turtle.x >= second.startX + 13) {
          crossingY = snapshot.turtle.bodyY - second.startHeight;
          crossingMass = snapshot.turtle.mass;
        }
        expect(finite(snapshot)).toBe(true);
      }
      chainReports.push({ startX: scenario.startX, initialMass, waterEntry, adEntryMass, crossingY, crossingMass, losses,
        final: snapshot.turtle, retainedAtExit: snapshot.cargo.filter(cargo => cargo.state !== 'lost').map(cargo => cargo.id) });
      expect(waterEntry).toBeDefined();
      // The naturally submerged alternative must be reachable from the
      // complete original load, rather than an artificial deep-water spawn.
      expect(adEntryMass).toBe(initialMass);
      expect(crossingMass).toBe(initialMass);
      expect(crossingY, `final X ${snapshot.turtle.x}, crossing mass ${crossingMass}`).toBeLessThan(-0.5);
      expect(snapshot.turtle.x).toBeGreaterThanOrEqual(second.endX + 3);
      expect(crossingMass).toBeGreaterThan(0);
      expect(snapshot.turtle.mass).toBeGreaterThan(0);
    } finally { simulation.dispose(); }
  }, 30_000);

  it.each(loads)('takes the surface continuation using Space ascent with the %s load', load => {
      const simulation = new PhysicsSimulation(scenarioForModule(island), createTuning(), load);
      try {
        const result = traverse(simulation, island.length + 3, 1, undefined, load === 'light' ? -1 : 0, true);
        expect(result.snapshot.turtle.x, `${load}, Space ascent, ${JSON.stringify(result.snapshot.turtle)}`).toBeGreaterThanOrEqual(island.length + 3);
        expect(result.sawWater).toBe(true);
        expect(result.islandCrossingY).toBeDefined();
        expect(result.islandCrossingY).toBeGreaterThan(0.25);
        if (load !== 'empty') expect(result.islandCrossingMass).toBeGreaterThan(0);
      } finally { simulation.dispose(); }
  }, 30_000);

  it.each(loads)('escapes neutral-water holds with Space ascent or natural release using the %s load', load => {
    for (const ascent of [0, 1] as const) {
      const simulation = new PhysicsSimulation(scenarioForModule(island), createTuning(), load);
      try {
        let snapshot = simulation.snapshot();
        for (let tick = 0; tick < 12 * 60; tick++) { simulation.step(); snapshot = simulation.snapshot(); }
        const heldX = snapshot.turtle.x;
        const result = traverse(simulation, island.length + 3, ascent, undefined, 0, true);
        expect(result.snapshot.turtle.x, `${load}, late ascent ${ascent}, held X ${heldX}`).toBeGreaterThanOrEqual(island.length + 3);
        expect(result.snapshot.turtle.x).toBeGreaterThan(heldX + 20);
      } finally { simulation.dispose(); }
    }
  }, 30_000);

  it.each(ENDLESS_MODULES.filter(module => module.water?.length))('$id remains escapable after a real upper-stack loss', definition => {
    const simulation = new PhysicsSimulation(scenarioForModule(definition), createTuning(), 'full');
    try {
      // Only upper objects are moved away; they become lost through actual contact grace.
      // Sofa/TV keep their normal authored registration and independent dynamics.
      for (const cargo of simulation.cargo) if (cargo.definition.id === 'cocktailGlass' || cargo.definition.id === 'floorLamp') {
        cargo.body.setTranslation({ x: -8, y: 10 }, true); cargo.body.setLinvel({ x: 0, y: 0 }, true);
      }
      const result = traverse(simulation, definition.length + 3, 1);
      expect(result.snapshot.cargo.find(cargo => cargo.id === 'cocktailGlass')!.state).toBe('lost');
      expect(result.snapshot.cargo.find(cargo => cargo.id === 'floorLamp')!.state).toBe('lost');
      expect(result.snapshot.turtle.x, `${definition.id} partial load stalled at ${result.snapshot.turtle.x}`).toBeGreaterThanOrEqual(definition.length + 3);
    } finally { simulation.dispose(); }
  }, 30_000);
});

describe('every selectable aligned module seam', () => {
  for (const before of ENDLESS_MODULES) for (const after of ENDLESS_MODULES.filter(module => module.start.biome === before.end.biome)) {
    it.each(loads)(`${before.id} → ${after.id} crosses without a carrier reset with the %s load`, load => {
      const first = placeModule(before, 1, 0, before.start.height);
      const second = placeModule(after, 2, first.endX, first.endHeight);
      const finalStrip = first.terrain.find(strip => strip.points.at(-1)!.x === first.endX)!;
      const endPoint = finalStrip.points.at(-1)!;
      const scenario: Scenario = { id: `join-${before.id}-${after.id}`, label: 'Module connector traversal', description: '',
        startX: first.endX - 12,
        startY: before.end.biome === 'water' ? first.endHeight - 1.1 : endPoint.y,
        endX: first.endX + 14, terrain: [...first.terrain, ...second.terrain],
        waters: [...first.water ?? [], ...second.water ?? []],
      };
      const simulation = new PhysicsSimulation(scenario, createTuning(), load);
      try {
        const result = traverse(simulation, first.endX + 12, after.id === 'AD' ? 1 : 0,
          undefined, after.id === 'AD' && load === 'light' ? -1 : 0, true, first.endX + 18);
        expect(result.snapshot.turtle.x, `${before.id}/${after.id}/${load}: ${result.snapshot.turtle.x}`).toBeGreaterThanOrEqual(first.endX + 12);
        expect(result.snapshot.tick).toBeGreaterThan(0);
        expect(second.startHeight).toBe(first.endHeight);
        expect(second.entryBiome).toBe(first.exitBiome);
      } finally { simulation.dispose(); }
    }, 30_000);
  }
});
