import { afterAll, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createTuning } from '../../src/game/config/tuning';
import { CARGO } from '../../src/game/content/cargo';
import type { CargoKind } from '../../src/game/content/cargo';
import type { Controls } from '../../src/game/core/input';
import { ENDLESS_MODULES, scenarioForModule } from '../../src/game/modes/endless/modules';
import type { EndlessModuleDefinition } from '../../src/game/modes/endless/modules';
import { PhysicsSimulation } from '../../src/game/physics/simulation';
import type { SimulationSnapshot } from '../../src/game/physics/simulation';

const requests = Array.from({ length: (1 << CARGO.length) - 1 }, (_, index) => ({
  mask: index + 1,
  requested: CARGO.filter((_, itemIndex) => ((index + 1) & (1 << itemIndex)) !== 0).map(cargo => cargo.id),
}));

interface Observation {
  requested: readonly CargoKind[];
  retainedAfterGrace: readonly CargoKind[];
  statesAfterGrace: readonly string[];
  terminalAfterGrace: boolean;
  escaped: boolean;
  reachedWater: boolean;
  retainedAtExit: readonly CargoKind[];
}

const cargoMask = (ids: readonly CargoKind[]) => CARGO.reduce((mask, cargo, index) => mask | (ids.includes(cargo.id) ? 1 << index : 0), 0);

const retained = (snapshot: SimulationSnapshot): CargoKind[] => snapshot.cargo.filter(cargo => cargo.state !== 'lost').map(cargo => cargo.id);
const finite = (snapshot: SimulationSnapshot): boolean => [snapshot.tick, snapshot.time, snapshot.cameraX, snapshot.cameraY,
  snapshot.turtle.x, snapshot.turtle.y, snapshot.turtle.bodyX, snapshot.turtle.bodyY,
  snapshot.turtle.angle, snapshot.turtle.speed, snapshot.turtle.verticalSpeed, snapshot.turtle.mass,
  snapshot.shell.x, snapshot.shell.y, snapshot.shell.angle,
  ...snapshot.cargo.flatMap(cargo => [cargo.x, cargo.y, cargo.angle, cargo.separatedSeconds])].every(Number.isFinite);

/** Original bodies/tuning throughout; input changes are normal player controls. */
function authoredControls(snapshot: SimulationSnapshot, definition: EndlessModuleDefinition): Controls {
  const vertical = snapshot.turtle.biome === 'water' ? (definition.id === 'AD' && snapshot.turtle.x < 18 ? -1 : 1) :
    snapshot.turtle.angle > 0.025 ? -1 : snapshot.turtle.angle < -0.025 ? 1 : 0;
  return { horizontal: 0, vertical };
}

describe.each(ENDLESS_MODULES.filter(module => module.water?.length))('actual reachable partial loads: $id', definition => {
  const observations: Observation[] = [];
  afterAll(async () => {
    // This distinguishes physically observed loads from merely requested masks.
    // Unsupported floating arrangements that go terminal are never certificates.
    console.info(`Partial-load observations ${definition.id}; bits sofa=1, TV=2, glass=4, lamp=8: ${JSON.stringify(observations.map(observation => ({
      requested: cargoMask(observation.requested), retainedAfterGrace: cargoMask(observation.retainedAfterGrace),
      separatedAfterGrace: observation.statesAfterGrace.filter(state => state.endsWith(':separated')).map(state => state.split(':')[0]),
      terminalAfterGrace: observation.terminalAfterGrace, escaped: observation.escaped,
      reachedWater: observation.reachedWater, retainedAtExit: cargoMask(observation.retainedAtExit),
    })))}`);
    // A reproducible, ignored verification artifact preserves exact outcomes
    // even when a reporter suppresses successful-test console messages.
    const directory = join(process.cwd(), 'artifacts');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `endless-partial-loads-${definition.id}.json`), JSON.stringify({
      moduleId: definition.id, lossGraceSeconds: createTuning().lossGraceSeconds,
      physicsHz: createTuning().physicsHz, observations,
    }, null, 2));
  });

  it.each(requests)('observes requested mask $mask through real grace and validates its nonterminal route', ({ requested }) => {
    const tuning = createTuning(), simulation = new PhysicsSimulation(scenarioForModule(definition), tuning, 'full');
    try {
      for (const cargo of simulation.cargo) if (!requested.includes(cargo.definition.id)) {
        // Move only discarded objects away. Shapes, masses, shell registration
        // and the turtle are untouched; loss still waits for actual contact grace.
        cargo.body.setTranslation({ x: -30 - CARGO.findIndex(item => item.id === cargo.definition.id) * 3, y: 8 }, true);
        cargo.body.setLinvel({ x: 0, y: 0 }, true);
      }
      let snapshot = simulation.snapshot(), reachedWater = snapshot.turtle.biome === 'water';
      const graceTicks = Math.ceil(tuning.lossGraceSeconds * tuning.physicsHz) + 2;
      for (let tick = 0; tick < graceTicks; tick++) {
        simulation.step(authoredControls(snapshot, definition)); snapshot = simulation.snapshot();
        reachedWater ||= snapshot.turtle.biome === 'water';
        expect(finite(snapshot)).toBe(true);
      }
      for (const cargo of snapshot.cargo) if (!requested.includes(cargo.id)) expect(cargo.state).toBe('lost');
      const observed = retained(snapshot);
      expect(observed.every(id => requested.includes(id))).toBe(true);
      const observation: Observation = { requested, retainedAfterGrace: [...observed],
        statesAfterGrace: snapshot.cargo.map(cargo => `${cargo.id}:${cargo.state}`),
        terminalAfterGrace: observed.length === 0, escaped: false, reachedWater, retainedAtExit: [] };
      observations.push(observation);
      if (observation.terminalAfterGrace) {
        // An unsupported requested arrangement can genuinely lose everything.
        // Its outcome is reported, while existing empty-load route gates cover it.
        expect(snapshot.cargo.every(cargo => cargo.state === 'lost')).toBe(true);
        return;
      }

      let heldX = snapshot.turtle.x, heldTicks = 0, charging = false;
      let forcedSwim: -1 | 1 | undefined, forcedUntilX = 0;
      const targetX = definition.length + 3;
      for (let tick = 0; tick < tuning.physicsHz * 75 && snapshot.turtle.x < targetX; tick++) {
        let controls = authoredControls(snapshot, definition);
        if (forcedSwim !== undefined && snapshot.turtle.x >= forcedUntilX) forcedSwim = undefined;
        if (snapshot.turtle.biome === 'water') {
          if (heldTicks >= 90) {
            forcedSwim = controls.vertical > 0 ? -1 : 1;
            forcedUntilX = snapshot.turtle.x + 2; heldTicks = 0;
          }
          if (forcedSwim !== undefined) controls = { ...controls, vertical: forcedSwim };
        }
        if (charging) {
          if (snapshot.turtle.jumpChargeSeconds >= tuning.jumpMaxChargeSeconds) {
            controls = { ...controls, jumpReleased: true }; charging = false;
          } else controls = { ...controls, jumpHeld: true };
        } else if (heldTicks >= 90 && snapshot.turtle.grounded && snapshot.turtle.biome !== 'water') {
          controls = { ...controls, jumpPressed: true, jumpHeld: true }; charging = true; heldTicks = 0;
        }
        simulation.step(controls); snapshot = simulation.snapshot();
        reachedWater ||= snapshot.turtle.biome === 'water';
        if (snapshot.turtle.x >= heldX + 0.15) { heldX = snapshot.turtle.x; heldTicks = 0; } else heldTicks++;
        if (tick % 15 === 0) expect(finite(snapshot)).toBe(true);
      }
      observation.escaped = snapshot.turtle.x >= targetX;
      observation.reachedWater = reachedWater;
      observation.retainedAtExit = retained(snapshot);
      expect(finite(snapshot)).toBe(true);
      expect(observation.escaped, `${definition.id}, requested ${requested.join('+')}, retained after grace ${observed.join('+')}, final X ${snapshot.turtle.x}`).toBe(true);
      expect(reachedWater).toBe(true);
    } finally { simulation.dispose(); }
  }, 30_000);
});
