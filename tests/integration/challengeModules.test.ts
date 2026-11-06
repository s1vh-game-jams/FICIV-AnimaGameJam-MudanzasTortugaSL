import { afterAll, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createTuning, exportSettings } from '../../src/game/config/tuning';
import { validateJumpTraversal } from '../../src/game/content/jumpValidation';
import type { Controls } from '../../src/game/core/input';
import { CHALLENGE_MODULES } from '../../src/game/modes/endless/challengeModules';
import { placeModule, scenarioForModule, type EndlessModuleDefinition, type SocketChoice } from '../../src/game/modes/endless/modules';
import { PhysicsSimulation, type LoadPreset } from '../../src/game/physics/simulation';

const loads: readonly LoadPreset[] = ['full', 'light', 'empty'];
const exhaustive = process.env.CHALLENGE_EXHAUSTIVE === '1';
const reports: unknown[] = [];
afterAll(async () => {
  const directory = join(process.cwd(), 'artifacts');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'challenge-traversal.json'), JSON.stringify({
    settings: exportSettings(createTuning()), exhaustive, routes: reports,
  }, null, 2));
});

function arrangements(definition: EndlessModuleDefinition): SocketChoice[][] {
  let variants: SocketChoice[][] = [[]];
  for (const socket of definition.sockets) variants = variants.flatMap(previous => [previous,
    ...socket.compatible.map(kind => [...previous, { socketId: socket.id, kind }])]);
  return variants;
}

function traverse(definition: EndlessModuleDefinition, load: LoadPreset, choices: readonly SocketChoice[]) {
  const diagnostic = scenarioForModule(definition);
  const placed = placeModule(definition, 1, 0, definition.start.height, choices);
  const simulation = new PhysicsSimulation({ ...diagnostic,
    terrain: [diagnostic.terrain[0], ...placed.terrain, diagnostic.terrain.at(-1)!],
  }, createTuning(), load);
  simulation.addWorldChunk({ id: 'challenge-traps', terrain: [], traps: placed.traps });
  let snapshot = simulation.snapshot(), heldX = snapshot.turtle.x, heldTicks = 0, charging = false;
  try {
    for (let tick = 0; tick < simulation.tuning.physicsHz * 100 && snapshot.turtle.x < definition.length + 3; tick++) {
      // Partial compensation leaves physical clearance for the shell rim on steep ramps.
      const target = snapshot.turtle.biome === 'water' ? 0 : -snapshot.turtle.bodyAngle * 0.5;
      const difference = target - snapshot.turtle.angle;
      const controls: Controls = { horizontal: 0, vertical: difference > 0.015 ? 1 : difference < -0.015 ? -1 : 0,
        jumpHeld: snapshot.turtle.biome === 'water' };
      if (charging) {
        if (snapshot.turtle.jumpChargeSeconds >= simulation.tuning.jumpMaxChargeSeconds) {
          controls.jumpReleased = true; charging = false;
        } else controls.jumpHeld = true;
      } else if (heldTicks >= 90 && snapshot.turtle.grounded && snapshot.turtle.biome !== 'water') {
        controls.jumpPressed = true; controls.jumpHeld = true; charging = true; heldTicks = 0;
      }
      simulation.step(controls); snapshot = simulation.snapshot();
      if (snapshot.turtle.x > heldX + 0.15) { heldX = snapshot.turtle.x; heldTicks = 0; } else heldTicks++;
      if (![snapshot.turtle.x, snapshot.turtle.bodyY, snapshot.shell.angle,
        ...snapshot.cargo.flatMap(item => [item.x, item.y, item.angle])].every(Number.isFinite)) {
        throw new Error(`Non-finite ${definition.id}/${load}`);
      }
    }
    reports.push({ module: definition.id, load, choices, finalX: snapshot.turtle.x, finalMass: snapshot.turtle.mass,
      elapsedSeconds: snapshot.time, retained: snapshot.cargo.filter(item => item.state !== 'lost').map(item => item.id) });
    return snapshot;
  } finally { simulation.dispose(); }
}

describe.each(CHALLENGE_MODULES)('steep authored module: $id', definition => {
  it.each(loads)('crosses the complete base route using the current %s load/settings', load => {
    const final = traverse(definition, load, []);
    expect(final.turtle.x, `${definition.id}/${load}: stalled at ${final.turtle.x}, Y ${final.turtle.bodyY}`).toBeGreaterThanOrEqual(definition.length + 3);
    expect(final.turtle.biome).toBe(definition.end.biome);
    if (load !== 'empty') expect(final.turtle.mass, 'The base control trace must support a continuing scored run').toBeGreaterThan(0);
  }, 40_000);

  it.each(loads)('records an actual full-charge first landing with the %s load', load => {
    for (const jump of definition.jumps) {
      const tuning = createTuning();
      const result = validateJumpTraversal(scenarioForModule(definition), tuning, { ...jump, maxSeconds: 45, load });
      expect(result.outcome, `${definition.id}/${load}: ${result.outcome} at ${result.final.turtle.x}`).toBe('passed');
      expect(result.chargeSeconds).toBe(tuning.jumpMaxChargeSeconds);
      expect(result.launchSpeed).toBe(tuning.jumpMaxLaunchSpeed);
      expect(result.launched).toBe(true);
      expect(result.final.turtle.grounded).toBe(true);
    }
  }, 40_000);

  it.each(loads)(exhaustive ? 'crosses all 64 compatible arrangements with the %s load' :
    'crosses complete three-trap arrangements with the %s load', load => {
    const variants = exhaustive ? arrangements(definition) :
      (['branch', 'stump', 'tree'] as const).map(kind => definition.sockets.map(socket => ({ socketId: socket.id, kind })));
    for (const choices of variants) {
      const final = traverse(definition, load, choices);
      expect(final.turtle.x, `${definition.id}/${load}/${JSON.stringify(choices)}: stalled at ${final.turtle.x}`).toBeGreaterThanOrEqual(definition.length + 3);
      expect(final.hazards.every(hazard => hazard.phase === 'spent'), 'Every selected trap must actually activate and finish').toBe(true);
    }
  }, exhaustive ? 600_000 : 120_000);
});
