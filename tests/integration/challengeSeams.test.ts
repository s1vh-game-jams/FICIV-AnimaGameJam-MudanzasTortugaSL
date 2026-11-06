import { describe, expect, it } from 'vitest';
import { createTuning } from '../../src/game/config/tuning';
import type { Scenario } from '../../src/game/content/scenarios';
import type { Controls } from '../../src/game/core/input';
import { ENDLESS_MODULES, placeModule } from '../../src/game/modes/endless/modules';
import { PhysicsSimulation } from '../../src/game/physics/simulation';
import type { LoadPreset, SimulationSnapshot } from '../../src/game/physics/simulation';

const loads: readonly LoadPreset[] = ['full', 'light', 'empty'];
const balance = (snapshot: SimulationSnapshot): -1 | 0 | 1 => {
  const target = snapshot.turtle.biome === 'water' ? 0 : -snapshot.turtle.bodyAngle;
  const difference = target - snapshot.turtle.angle;
  return difference > 0.015 ? 1 : difference < -0.015 ? -1 : 0;
};

/** Local seam certificates retain the real neighboring geometry and one Rapier world. */
describe('every compatible seam involving a hard module', () => {
  for (const before of ENDLESS_MODULES) for (const after of ENDLESS_MODULES.filter(module =>
    module.start.biome === before.end.biome && (before.difficulty === 'hard' || module.difficulty === 'hard'))) {
    it.each(loads)(`${before.id} → ${after.id} joins physically with %s load`, load => {
      const first = placeModule(before, 1, 0, before.start.height);
      const second = placeModule(after, 2, first.endX, first.endHeight);
      const finalStrip = first.terrain.find(strip => strip.points.at(-1)!.x === first.endX)!;
      const startY = before.end.biome === 'water' ? first.endHeight - 1.1 : finalStrip.points.at(-1)!.y;
      const scenario: Scenario = {
        id: `challenge-join-${before.id}-${after.id}`, label: 'Challenge module connector', description: '',
        startX: first.endX - 12, startY, endX: first.endX + 14,
        terrain: [...first.terrain, ...second.terrain],
        waters: [...first.water ?? [], ...second.water ?? []],
      };
      const tuning = createTuning(), simulation = new PhysicsSimulation(scenario, tuning, load);
      let snapshot = simulation.snapshot(), heldX = snapshot.turtle.x, heldTicks = 0;
      let ascent = after.id === 'AD', charging = false;
      try {
        for (let tick = 0; tick < tuning.physicsHz * 70 && snapshot.turtle.x < first.endX + 12; tick++) {
          let controls: Controls = {
            horizontal: after.id === 'AD' && load === 'light' && snapshot.turtle.biome === 'water' &&
              snapshot.turtle.x < first.endX + 18 ? -1 : 0,
            vertical: balance(snapshot), jumpHeld: snapshot.turtle.biome === 'water' && ascent,
          };
          if (heldTicks >= 90 && snapshot.turtle.biome === 'water') {
            ascent = !ascent;
            controls = { ...controls, jumpHeld: ascent }; heldTicks = 0;
          }
          if (charging) {
            if (snapshot.turtle.jumpChargeSeconds >= tuning.jumpMaxChargeSeconds) {
              controls = { ...controls, jumpReleased: true }; charging = false;
            } else controls = { ...controls, jumpHeld: true };
          } else if (heldTicks >= 90 && snapshot.turtle.grounded && snapshot.turtle.biome !== 'water') {
            controls = { ...controls, jumpPressed: true, jumpHeld: true }; charging = true; heldTicks = 0;
          }
          simulation.step(controls); snapshot = simulation.snapshot();
          if (snapshot.turtle.x > heldX + 0.15) { heldX = snapshot.turtle.x; heldTicks = 0; } else heldTicks++;
        }
        expect(snapshot.turtle.x, `${scenario.id}/${load} stalled: ${JSON.stringify(snapshot.turtle)}`)
          .toBeGreaterThanOrEqual(first.endX + 12);
        expect(snapshot.tick).toBeGreaterThan(0);
        expect(snapshot.time).toBeGreaterThan(0);
        expect(second.startHeight).toBe(first.endHeight);
        expect(second.entryBiome).toBe(first.exitBiome);
        expect([snapshot.turtle.x, snapshot.turtle.y, snapshot.shell.x, snapshot.shell.y,
          ...snapshot.cargo.flatMap(item => [item.x, item.y, item.angle])].every(Number.isFinite)).toBe(true);
      } finally { simulation.dispose(); }
    }, 60_000);
  }
});
