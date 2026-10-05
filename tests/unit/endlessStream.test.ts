import { describe, expect, it } from 'vitest';
import { createLevelCameraFraming } from '../../src/game/config/cameraFraming';
import { createTuning } from '../../src/game/config/tuning';
import { EndlessGenerator } from '../../src/game/modes/endless/generator';
import { EndlessStream } from '../../src/game/modes/endless/stream';
import { ENDLESS_MODULES } from '../../src/game/modes/endless/modules';
import type { SimulationSnapshot } from '../../src/game/physics/simulation';
import type { HazardSnapshot, WorldChunk } from '../../src/game/physics/worldContent';

function frame(x: number, retainedCargoX = x): SimulationSnapshot {
  return { scenarioId: 'stream-fixture', tick: 0, time: 0, cameraX: x - 7, cameraY: 0,
    cameraSpeed: 2, cameraBlocked: false,
    turtle: { x, y: 0, bodyX: x, bodyY: 0, angle: 0, bodyAngle: 0, speed: 2, verticalSpeed: 0,
      biome: 'grass', mass: 8, grounded: true, jumpCharging: false, jumpChargeSeconds: 0 },
    shell: { x, y: 0.3, angle: 0 },
    cargo: [{ id: 'sofa', label: 'Sofá', x: retainedCargoX, y: 1, angle: 0, state: 'separated', separatedSeconds: 1 }],
    contacts: [], hazards: [], audioEvents: [],
  };
}

class FakeWorld {
  readonly chunks = new Map<string, WorldChunk>();
  hazards: HazardSnapshot[] = [];
  addWorldChunk(chunk: WorldChunk): void { this.chunks.set(chunk.id, chunk); }
  removeWorldChunk(id: string): void { this.chunks.delete(id); }
  hazardSnapshots(): readonly HazardSnapshot[] { return this.hazards; }
}

describe('bounded seeded Endless resident geometry', () => {
  it('preloads beyond the entire fixed visible right edge and preserves retained/separated cargo', () => {
    const tuning = createTuning(), world = new FakeWorld();
    const stream = new EndlessStream(world, new EndlessGenerator(tuning, 'hard', 'stream'), tuning, 40);
    // Approach the opening's end so preload is required even with a close visual frame.
    const initial = frame(25);
    stream.ensureAhead(initial);
    const framing = createLevelCameraFraming(tuning);
    expect(stream.modules.at(-1)!.endX).toBeGreaterThan(initial.cameraX + framing.leftOffset + framing.visibleMetres);
    const first = stream.modules[0];
    stream.ensureAhead(frame(300));
    stream.retireBehind(frame(300, first.startX + 1));
    expect(world.chunks.has(first.id)).toBe(true);
    stream.retireBehind(frame(300));
    expect(world.chunks.has(first.id)).toBe(false);
    expect(stream.prologue).toBeNull();
  });

  it('places approaching water flags on the actual passing height and freezes deployed flags', () => {
    const tuning = createTuning(), world = new FakeWorld();
    const pool = ENDLESS_MODULES.filter(module => module.id === 'BA' || module.id === 'AB');
    const stream = new EndlessStream(world, new EndlessGenerator(tuning, 'easy', 'water-flag', pool), tuning, 40);
    stream.ensureAhead(frame(25));
    const waterExit = stream.modules[0], flag = stream.pennants[0];
    expect(waterExit.exitBiome).toBe('water');
    expect(flag.y).toBeLessThan(waterExit.endHeight);
    const originalHeight = flag.y;
    stream.ensureAhead({ ...frame(30), cargo: [] });
    expect(stream.pennants[0].y).toBe(originalHeight);
    const approaching = frame(waterExit.endX - 2);
    approaching.turtle.biome = 'water';
    approaching.turtle.bodyY = waterExit.endHeight - 2.5;
    stream.ensureAhead(approaching);
    expect(flag.y).toBeCloseTo(approaching.turtle.bodyY - 0.24, 6);
    approaching.turtle.bodyY = waterExit.endHeight + 0.1;
    stream.ensureAhead(approaching);
    expect(flag.y).toBeCloseTo(waterExit.endHeight - 0.14, 6);
    flag.crossed = true;
    const deployedHeight = flag.y;
    approaching.turtle.bodyY -= 2;
    stream.ensureAhead({ ...approaching, cargo: [] });
    expect(flag.y).toBe(deployedHeight);
  });

  it('keeps pending interactions until spent, then releases all chunk ownership', () => {
    const tuning = createTuning(), world = new FakeWorld();
    const stream = new EndlessStream(world, new EndlessGenerator(tuning, 'hard', 'pending-hazards'), tuning, 40);
    stream.ensureAhead(frame(200));
    const first = stream.modules.find(module => module.traps.length)!;
    world.hazards = [{ ...first.traps[0], phase: 'active', lift: 0 }];
    stream.ensureAhead(frame(500));
    stream.retireBehind(frame(500));
    expect(world.chunks.has(first.id)).toBe(true);
    world.hazards[0].phase = 'spent';
    stream.retireBehind(frame(500));
    expect(world.chunks.has(first.id)).toBe(false);
  });

  it('keeps resource counts bounded over ten thousand concatenations', () => {
    const tuning = createTuning(), world = new FakeWorld();
    const stream = new EndlessStream(world, new EndlessGenerator(tuning, 'hard', 'ten-thousand'), tuning, 40);
    let x = 25, peak = 0;
    for (let index = 0; index < 10000; index++) {
      stream.ensureAhead(frame(x));
      stream.retireBehind(frame(x));
      peak = Math.max(peak, world.chunks.size);
      x = stream.modules.at(-1)!.endX - 5;
    }
    expect(peak).toBeLessThanOrEqual(4);
    expect(stream.modules.length).toBeLessThanOrEqual(4);
    expect(stream.pennants.length).toBeLessThanOrEqual(4);
    expect(stream.modules.at(-1)!.index).toBeGreaterThan(9999);
  });

  it('preserves next choices, socket types and pennant identity across rebasing', () => {
    const tuning = createTuning();
    const normal = new EndlessStream(new FakeWorld(), new EndlessGenerator(tuning, 'hard', 'rebase-stream'), tuning, 40);
    const shifted = new EndlessStream(new FakeWorld(), new EndlessGenerator(tuning, 'hard', 'rebase-stream'), tuning, 40);
    normal.ensureAhead(frame(500)); shifted.ensureAhead(frame(500));
    shifted.rebase(450, 3);
    normal.ensureAhead(frame(700)); shifted.ensureAhead(frame(250));
    expect(shifted.modules).toHaveLength(normal.modules.length);
    shifted.modules.forEach((module, index) => {
      const original = normal.modules[index];
      expect(module.id).toBe(original.id);
      expect(module.choices).toEqual(original.choices);
      expect(module.startX + 450).toBeCloseTo(original.startX, 8);
      expect(module.startHeight + 3).toBeCloseTo(original.startHeight, 8);
    });
    shifted.pennants.forEach((flag, index) => {
      const original = normal.pennants[index];
      expect(flag.id).toBe(original.id);
      expect(flag.moduleIndex).toBe(original.moduleIndex);
      expect(flag.crossed).toBe(original.crossed);
      expect(flag.x + 450).toBeCloseTo(original.x, 8);
      expect(flag.y + 3).toBeCloseTo(original.y, 8);
    });
  });
});
