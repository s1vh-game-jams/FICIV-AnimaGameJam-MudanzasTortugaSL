import { describe, expect, it } from 'vitest';
import { createTuning, MAX_TERRAIN_ANGLE } from '../../src/game/config/tuning';
import { SCENARIOS, type Scenario } from '../../src/game/content/scenarios';
import { PhysicsSimulation } from '../../src/game/physics/simulation';

describe('live laboratory shell rotation window', () => {
  it('preserves the physical world, cargo, time and pending jump when adjusted', () => {
    const simulation = new PhysicsSimulation(SCENARIOS[0], createTuning());
    try {
      for (let tick = 0; tick < 100; tick++) simulation.step();
      simulation.step({ horizontal: 0, vertical: 0, jumpPressed: true, jumpHeld: true });
      const before = simulation.snapshot(), world = simulation.world;
      const handles = simulation.cargo.map(item => item.body.handle);
      simulation.setShellMaxAngle(Math.PI / 4);
      expect(simulation.snapshot()).toEqual(before);
      expect(simulation.world).toBe(world);
      expect(simulation.cargo.map(item => item.body.handle)).toEqual(handles);
      expect(simulation.tuning.shellMaxAngle).toBe(Math.PI / 4);
      expect(() => simulation.setShellMaxAngle(NaN)).toThrow();
      expect(() => simulation.setShellMaxAngle(Math.PI / 3)).toThrow();
      expect(simulation.tuning.shellMaxAngle).toBe(Math.PI / 4);
    } finally { simulation.dispose(); }
  });

  it.each([-1, 1] as const)('reaches the selected window in direction %s without changing terrain', direction => {
    const water: Scenario = { id: 'live-angle-water', label: 'Unobstructed shell', description: '',
      startX: 0, startY: 0, endX: 200,
      terrain: [{ biome: 'rock', points: [{ x: -20, y: -10 }, { x: 220, y: -10 }] }],
      water: { left: -20, right: 220, surface: 0, bottom: -10 } };
    const simulation = new PhysicsSimulation(water, createTuning(), 'empty');
    try {
      for (const angle of [Math.PI / 4, Math.PI / 6]) {
        simulation.setShellMaxAngle(angle);
        for (let tick = 0; tick < 240; tick++) simulation.step({ horizontal: 0, vertical: direction });
        expect(simulation.snapshot().turtle.angle).toBeCloseTo(direction * angle, 6);
      }
      expect(simulation.scenario).toBe(water);
    } finally { simulation.dispose(); }
  });

  it('keeps actual ramp support identical when the manual window changes', () => {
    const rise = 8 * Math.tan(MAX_TERRAIN_ANGLE);
    const ramp: Scenario = { id: 'fixed-36-degree-ramp', label: 'Fixed terrain', description: '',
      startX: 0, startY: 0, endX: 34,
      terrain: [{ biome: 'rock', bottom: -12, points: [
        { x: -12, y: 0 }, { x: 8, y: 0 }, { x: 16, y: rise }, { x: 50, y: rise },
      ] }] };
    const first = new PhysicsSimulation(ramp, createTuning(), 'empty');
    const second = new PhysicsSimulation(ramp, createTuning(), 'empty');
    let sawMaximumPitch = false;
    try {
      second.setShellMaxAngle(Math.PI / 6);
      for (let tick = 0; tick < 1500 && first.snapshot().turtle.x < 28; tick++) {
        first.step(); second.step();
        expect(second.snapshot()).toEqual(first.snapshot());
        if (Math.abs(first.snapshot().turtle.bodyAngle - MAX_TERRAIN_ANGLE) < 0.01) sawMaximumPitch = true;
      }
      expect(first.snapshot().turtle.x).toBeGreaterThanOrEqual(28);
      expect(sawMaximumPitch).toBe(true);
    } finally { first.dispose(); second.dispose(); }
  });
});
