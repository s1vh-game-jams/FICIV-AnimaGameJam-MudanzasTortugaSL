import { describe, expect, it } from 'vitest';
import { createTuning, withTuning } from '../../src/game/config/tuning';
import { createLevelCameraFraming } from '../../src/game/config/cameraFraming';
import { PhysicsSimulation, type LoadPreset } from '../../src/game/physics/simulation';
import { HAZARD_TUNING } from '../../src/game/config/hazards';
import type { TrapKind } from '../../src/game/physics/worldContent';

const flat = (traps: readonly TrapKind[] = [], load: LoadPreset = 'full') => {
  const simulation = new PhysicsSimulation({ id: 'stream', label: '', description: '', startX: 0, startY: 0,
    endX: Infinity, terrain: [{ biome: 'grass', bottom: -8, points: [{ x: -12, y: 0 }, { x: 80, y: 0 }] }] }, createTuning(), load);
  simulation.addWorldChunk({ id: 'traps', terrain: [], traps: traps.map((kind, i) => ({ id: kind, kind, x: 7 + i * 14, y: 0 })) });
  return simulation;
};

describe('streamed world and actual hazard responses', () => {
  it('keeps a lost body moving while visible in a wider configured frame, then retires it safely', () => {
    const tuning = withTuning(createTuning(), { cameraDeadZonePercent: 45 });
    const simulation = new PhysicsSimulation({ id: 'retirement', label: '', description: '', startX: 0, startY: 0,
      endX: Infinity, terrain: [{ biome: 'grass', points: [{ x: -60, y: 0 }, { x: 80, y: 0 }] }] }, tuning);
    try {
      const glass = simulation.cargo.find(cargo => cargo.definition.id === 'cocktailGlass')!;
      glass.body.setTranslation({ x: -40, y: 5 }, true);
      for (let i = 0; i < 120; i++) simulation.step();
      const snapshot = simulation.snapshot();
      expect(simulation.tracker.state('cocktailGlass')).toBe('lost');
      expect(glass.body.isValid()).toBe(true);
      expect(glass.body.translation().x).toBeGreaterThan(snapshot.cameraX + createLevelCameraFraming(tuning).leftOffset);
      glass.body.setTranslation({ x: -120, y: 0 }, true);
      simulation.step();
      expect(glass.body.isValid()).toBe(false);
      expect(simulation.snapshot().cargo.find(cargo => cargo.id === 'cocktailGlass')!.state).toBe('lost');
    } finally { simulation.dispose(); }
  });
  it('lands the pinecone on terrain while the carrier passes through its position', () => {
    const simulation = flat(['tree'], 'empty');
    try {
      let onGround = false;
      for (let i = 0; i < 8 * 60; i++) {
        simulation.step();
        const cone = simulation.snapshot().hazards[0].cone;
        if (cone) {
          expect(cone.y).toBeGreaterThan(HAZARD_TUNING.coneRadius - 0.05);
          onGround ||= cone.y < HAZARD_TUNING.coneRadius + 0.03;
        }
      }
      expect(onGround).toBe(true);
      expect(simulation.snapshot().turtle.x).toBeGreaterThan(12);
    } finally { simulation.dispose(); }
  });
  it('raises the position-based turtle with a stump and lets it continue', () => {
    const simulation = flat(['stump']);
    try {
      let highest = 0, active = false;
      for (let i = 0; i < 12 * 60; i++) {
        simulation.step(); const snapshot = simulation.snapshot();
        highest = Math.max(highest, snapshot.turtle.bodyY);
        active ||= snapshot.hazards[0].phase === 'active';
      }
      expect(active, JSON.stringify(simulation.snapshot())).toBe(true);
      expect(highest).toBeGreaterThan(1);
      expect(simulation.snapshot().turtle.x).toBeGreaterThan(18);
      expect(simulation.snapshot().hazards[0].phase).toBe('spent');
    } finally { simulation.dispose(); }
  });
  it('tree releases a real cargo-impacting body, never a cargo graph node', () => {
    const simulation = flat(['tree']);
    try {
      let sawCone = false;
      for (let i = 0; i < 10 * 60; i++) {
        simulation.step(); const snapshot = simulation.snapshot();
        sawCone ||= !!snapshot.hazards[0].cone;
        expect(snapshot.contacts.every(edge => edge.a !== 'tree' && edge.b !== 'tree')).toBe(true);
      }
      expect(sawCone).toBe(true);
      expect(simulation.snapshot().hazards[0].cone).toBeUndefined();
      expect(simulation.snapshot().turtle.x).toBeGreaterThan(15);
    } finally { simulation.dispose(); }
  });
  it('removes ownership and preserves queries and motion across an origin shift', () => {
    const simulation = flat(['stump', 'tree']);
    try {
      for (let i = 0; i < 120; i++) simulation.step();
      const before = simulation.snapshot();
      simulation.rebase(1000, -10);
      const shifted = simulation.snapshot();
      expect(shifted.turtle.x).toBeCloseTo(before.turtle.x - 1000, 3);
      expect(shifted.hazards[0].y).toBe(10);
      for (let i = 0; i < 120; i++) simulation.step();
      const after = simulation.snapshot();
      expect(after.turtle.bodyY).toBeGreaterThan(9.9);
      expect(after.turtle.x).toBeGreaterThan(shifted.turtle.x + 1);
      expect(after.cargo.every(cargo => [cargo.x, cargo.y, cargo.angle].every(Number.isFinite))).toBe(true);
      const count = simulation.world.colliders.len();
      simulation.removeWorldChunk('traps');
      expect(simulation.snapshot().hazards).toEqual([]);
      expect(simulation.world.colliders.len()).toBeLessThan(count);
    } finally { simulation.dispose(); }
  });
});
