import { afterAll, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createTuning } from '../../src/game/config/tuning';
import type { CargoKind } from '../../src/game/content/cargo';
import type { Controls } from '../../src/game/core/input';
import { ENDLESS_MODULES, scenarioForModule } from '../../src/game/modes/endless/modules';
import { PhysicsSimulation } from '../../src/game/physics/simulation';
import type { SimulationSnapshot } from '../../src/game/physics/simulation';

const definition = ENDLESS_MODULES.find(module => module.id === 'DA')!;
const retained = (snapshot: SimulationSnapshot) => snapshot.cargo.filter(cargo => cargo.state !== 'lost').map(cargo => cargo.id);
const finite = (snapshot: SimulationSnapshot) => [snapshot.time, snapshot.turtle.x, snapshot.turtle.bodyY,
  snapshot.turtle.verticalSpeed, snapshot.shell.y, snapshot.shell.angle,
  ...snapshot.cargo.flatMap(cargo => [cargo.x, cargo.y, cargo.angle])].every(Number.isFinite);

interface RecoveryReport {
  waterControl: -1 | 0;
  escaped: boolean;
  retainedAtExit: readonly CargoKind[];
  jump?: { x: number; chargeSeconds: number; verticalSpeedAfterRelease: number };
  waterEntry?: { x: number; time: number; retained: readonly CargoKind[] };
  losses: readonly { id: CargoKind; x: number; time: number; biome: string }[];
}
const report: RecoveryReport[] = [];

describe('DA retained-cargo continuation with keyboard controls', () => {
  afterAll(async () => {
    const directory = join(process.cwd(), 'artifacts');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'endless-da-cargo-regressions.json'), JSON.stringify(report, null, 2));
  });

  it.each([0, -1] as const)('preserves a continuing load after the bank jump with water input %s', waterControl => {
    const tuning = createTuning();
    const simulation = new PhysicsSimulation(scenarioForModule(definition), tuning, 'full');
    const losses: RecoveryReport['losses'][number][] = [];
    const result: RecoveryReport = { waterControl, escaped: false, retainedAtExit: [], losses };
    report.push(result);
    try {
      let snapshot = simulation.snapshot();
      let phase: 'approach' | 'charging' | 'released' = 'approach';
      for (let tick = 0; tick < tuning.physicsHz * 75 && snapshot.turtle.x < definition.length + 3; tick++) {
        // Ordinary keyboard sequence: brake approaching the bank at x=45,
        // hold Space on the flat shelf from x=47 until fully charged, then
        // accelerate while airborne. Shell input is neutral on dry terrain;
        // after entering water, release movement keys or hold Down/S.
        let controls: Controls = { horizontal: 0, vertical: snapshot.turtle.biome === 'water' ? waterControl : 0 };
        let releasing = false;
        if (phase === 'approach' && snapshot.turtle.x >= 45) controls.horizontal = -1;
        if (phase === 'approach' && snapshot.turtle.x >= 47 && snapshot.turtle.grounded && snapshot.turtle.biome !== 'water') {
          phase = 'charging';
          controls = { ...controls, horizontal: -1, jumpPressed: true, jumpHeld: true };
        } else if (phase === 'charging') {
          if (!snapshot.turtle.jumpCharging) phase = 'approach';
          else if (snapshot.turtle.jumpChargeSeconds >= tuning.jumpMaxChargeSeconds) {
            phase = 'released';
            releasing = true;
            result.jump = { x: snapshot.turtle.x, chargeSeconds: snapshot.turtle.jumpChargeSeconds, verticalSpeedAfterRelease: 0 };
            controls = { ...controls, horizontal: 1, jumpReleased: true };
          } else controls = { ...controls, horizontal: -1, jumpHeld: true };
        } else if (phase === 'released' && snapshot.turtle.biome !== 'water') controls.horizontal = 1;

        expect([-1, 0, 1]).toContain(controls.horizontal);
        expect([-1, 0, 1]).toContain(controls.vertical);
        const previous = snapshot;
        simulation.step(controls);
        snapshot = simulation.snapshot();
        expect(finite(snapshot)).toBe(true);
        if (releasing && result.jump) result.jump.verticalSpeedAfterRelease = snapshot.turtle.verticalSpeed;
        if (!result.waterEntry && snapshot.turtle.biome === 'water') result.waterEntry = {
          x: snapshot.turtle.x, time: snapshot.time, retained: retained(snapshot),
        };
        for (const cargo of snapshot.cargo) {
          if (cargo.state === 'lost' && previous.cargo.find(item => item.id === cargo.id)?.state !== 'lost') {
            losses.push({ id: cargo.id, x: snapshot.turtle.x, time: snapshot.time, biome: snapshot.turtle.biome });
          }
        }
      }
      result.escaped = snapshot.turtle.x >= definition.length + 3;
      result.retainedAtExit = retained(snapshot);
      expect(result.jump?.chargeSeconds).toBeGreaterThanOrEqual(tuning.jumpMaxChargeSeconds);
      expect(result.jump?.verticalSpeedAfterRelease).toBeGreaterThan(0);
      expect(result.waterEntry).toBeDefined();
      expect(result.escaped).toBe(true);
      // Partial loss is allowed; this certifies an actual route that continues
      // the run, rather than requiring perfect retention or hands-free play.
      expect(result.retainedAtExit.length).toBeGreaterThan(0);
    } finally {
      simulation.dispose();
    }
  }, 30_000);
});
