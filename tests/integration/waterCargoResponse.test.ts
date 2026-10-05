import { afterEach, describe, expect, it } from 'vitest';
import { createTuning } from '../../src/game/config/tuning';
import type { Scenario } from '../../src/game/content/scenarios';
import { NO_CONTROLS, type Controls } from '../../src/game/core/input';
import { PhysicsSimulation } from '../../src/game/physics/simulation';

const live: PhysicsSimulation[] = [];
const basin: Scenario = {
  id: 'water-cargo-response', label: 'Submerged cargo response', description: '',
  startX: 0, startY: -2, endX: 100,
  terrain: [{ biome: 'grass', points: [{ x: -12, y: -4 }, { x: 120, y: -4 }] }],
  water: { left: -12, right: 120, surface: 0, bottom: -4 },
};
const bank: Scenario = {
  id: 'water-cargo-exit', label: 'Gentle water exit', description: '',
  startX: 0, startY: -2, endX: 80,
  terrain: [{ biome: 'grass', points: [{ x: -12, y: -4 }, { x: 12, y: -4 },
    { x: 24, y: 0 }, { x: 100, y: 0 }] }],
  water: { left: -12, right: 24, surface: 0, bottom: -4 },
};
const dry: Scenario = {
  id: 'dry-cargo-control', label: 'Dry cargo control', description: '',
  startX: 0, startY: 0, endX: 100,
  terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 120, y: 0 }] }],
};
const create = (scenario: Scenario) => {
  const simulation = new PhysicsSimulation(scenario, createTuning());
  live.push(simulation);
  return simulation;
};
const finite = (simulation: PhysicsSimulation) => {
  const values: number[] = [];
  simulation.world.forEachRigidBody(body => values.push(body.translation().x, body.translation().y,
    body.linvel().x, body.linvel().y, body.rotation(), body.angvel()));
  expect(values.every(Number.isFinite)).toBe(true);
};
const advance = (simulation: PhysicsSimulation, seconds: number, controls: Controls = NO_CONTROLS) => {
  for (let tick = 0; tick < Math.round(seconds * simulation.tuning.physicsHz); tick++) {
    simulation.step(controls);
    finite(simulation);
  }
};
afterEach(() => { for (const simulation of live.splice(0)) simulation.dispose(); });

describe('bounded physical water cargo response', () => {
  it('retains the full independent stack through ordinary partial corrections underwater', () => {
    const simulation = create(basin);
    const initialMass = simulation.mass;
    let largestShellAngle = 0, independentRotation = 0;
    const correctionAngle = Math.PI / 18;
    const duration = 2 * correctionAngle / simulation.tuning.shellAngularSpeed +
      2 * simulation.tuning.shellAngularSpeed / simulation.tuning.shellAngularDamping + 3;
    let phase: 'raise' | 'settle' | 'lower' | 'recover' = 'raise', settleTicks = 0;
    for (let tick = 0; tick < Math.ceil(simulation.tuning.physicsHz * duration); tick++) {
      // Digital input reaches a real ten-degree correction at the configured
      // angular speed, rests for one second, then returns to level.
      simulation.step({ horizontal: 0, vertical: phase === 'raise' ? 1 : phase === 'lower' ? -1 : 0 });
      const snapshot = simulation.snapshot();
      if (phase === 'raise' && snapshot.turtle.angle >= correctionAngle) phase = 'settle';
      else if (phase === 'settle' && ++settleTicks >= simulation.tuning.physicsHz) phase = 'lower';
      else if (phase === 'lower' && snapshot.turtle.angle <= 0) phase = 'recover';
      expect(snapshot.turtle.biome).toBe('water');
      expect(snapshot.cargo.every(item => item.state !== 'lost')).toBe(true);
      expect(snapshot.turtle.mass).toBeCloseTo(initialMass, 6);
      largestShellAngle = Math.max(largestShellAngle, Math.abs(snapshot.shell.angle));
      independentRotation = Math.max(independentRotation,
        ...snapshot.cargo.map(item => Math.abs(item.angle - snapshot.shell.angle)));
      finite(simulation);
    }
    expect(phase).toBe('recover');
    expect(largestShellAngle).toBeGreaterThan(0.12);
    expect(largestShellAngle).toBeLessThan(0.3);
    expect(independentRotation).toBeGreaterThan(0.03);
    expect(Math.abs(simulation.snapshot().shell.angle)).toBeLessThan(0.02);
    expect(simulation.cargo.every(item => item.body.isDynamic())).toBe(true);
  });

  it.each([-1, 1])('sustained extreme shell input %s can still lose cargo underwater', vertical => {
    const simulation = create(basin);
    advance(simulation, 8, { horizontal: 0, vertical });
    expect(simulation.snapshot().turtle.biome).toBe('water');
    expect(Math.abs(simulation.snapshot().shell.angle)).toBeCloseTo(simulation.tuning.shellMaxAngle, 6);
    expect(simulation.tracker.lostIds().length).toBeGreaterThan(0);
  });

  it('a violent physical impact loses a piece after ordinary contact grace instead of gluing it back', () => {
    const simulation = create(basin);
    advance(simulation, 1);
    const glass = simulation.cargo.find(item => item.definition.id === 'cocktailGlass')!;
    const initialMass = simulation.mass;
    glass.body.applyImpulse({ x: glass.body.mass() * 20, y: 0 }, true);
    glass.body.applyTorqueImpulse(0.8, true);
    let separated = false;
    for (let tick = 0; tick < Math.ceil((simulation.tuning.lossGraceSeconds + 0.7) * simulation.tuning.physicsHz); tick++) {
      const previousState = simulation.tracker.state('cocktailGlass');
      simulation.step();
      const state = simulation.tracker.state('cocktailGlass');
      if (state === 'separated') {
        separated = true;
        expect(simulation.snapshot().turtle.mass).toBeCloseTo(initialMass, 6);
        if (previousState === 'separated') expect(glass.body.userForce().x).toBe(0);
      }
      finite(simulation);
    }
    expect(separated).toBe(true);
    expect(simulation.tracker.state('cocktailGlass')).toBe('lost');
    expect(simulation.mass).toBeLessThan(initialMass);
    expect(simulation.snapshot().cargo.some(item => item.state !== 'lost')).toBe(true);
  });

  it('a Space hold across the water exit does not store a jump, and dry cargo recovers its ordinary response', () => {
    const simulation = create(bank);
    simulation.step({ ...NO_CONTROLS, jumpPressed: true, jumpHeld: true });
    let reachedDryGround = false;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 20; tick++) {
      simulation.step({ ...NO_CONTROLS, jumpHeld: true });
      const snapshot = simulation.snapshot();
      expect(snapshot.turtle.jumpCharging).toBe(false);
      expect(snapshot.turtle.jumpChargeSeconds).toBe(0);
      finite(simulation);
      if (snapshot.turtle.biome === 'grass' && snapshot.turtle.grounded && snapshot.turtle.x > 25) {
        reachedDryGround = true;
        break;
      }
    }
    expect(reachedDryGround).toBe(true);
    advance(simulation, 0.2, { ...NO_CONTROLS, jumpHeld: true });
    const before = simulation.snapshot();
    simulation.step({ ...NO_CONTROLS, jumpReleased: true });
    const released = simulation.snapshot();
    expect(released.turtle.grounded).toBe(true);
    expect(released.turtle.jumpCharging).toBe(false);
    expect(released.turtle.jumpChargeSeconds).toBe(0);
    expect(released.turtle.verticalSpeed).toBeLessThanOrEqual(0);
    expect(Math.abs(released.turtle.y - before.turtle.y)).toBeLessThan(0.01);
    expect(released.cargo.every(item => item.state !== 'lost')).toBe(true);
    for (const item of simulation.cargo) {
      expect(item.body.linearDamping()).toBeCloseTo(simulation.tuning.cargoLinearDamping, 6);
      expect(item.body.angularDamping()).toBeCloseTo(simulation.tuning.cargoAngularDamping, 6);
      for (const collider of item.colliders) expect(collider.friction()).toBeCloseTo(simulation.tuning.cargoFriction, 6);
    }

    const dryControl = create(dry);
    const waterControl = create(basin);
    const responses: { velocity: number; angularVelocity: number }[] = [];
    for (const candidate of [simulation, dryControl, waterControl]) {
      const glass = candidate.cargo.find(item => item.definition.id === 'cocktailGlass')!;
      // Free of all contacts, identical impulses expose actual Rapier damping.
      glass.body.setTranslation({ x: candidate.snapshot().turtle.x + 30, y: 15 }, true);
      candidate.step();
      expect(candidate.tracker.state('cocktailGlass')).toBe('separated');
      glass.body.setLinvel({ x: 0, y: 0 }, true);
      glass.body.setAngvel(0, true);
      glass.body.applyImpulse({ x: glass.body.mass() * 3, y: 0 }, true);
      glass.body.applyTorqueImpulse(glass.body.effectiveAngularInertia() * 2, true);
      advance(candidate, 0.5);
      responses.push({ velocity: glass.body.linvel().x, angularVelocity: glass.body.angvel() });
      expect(glass.body.userForce().x).toBe(0);
    }
    expect(responses[0].velocity).toBeCloseTo(responses[1].velocity, 5);
    expect(responses[0].angularVelocity).toBeCloseTo(responses[1].angularVelocity, 5);
    expect(responses[2].velocity).toBeLessThan(responses[0].velocity);
    expect(responses[2].angularVelocity).toBeLessThan(responses[0].angularVelocity);
  });
});
