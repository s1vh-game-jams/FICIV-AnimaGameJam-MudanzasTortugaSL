import { afterEach, describe, expect, it } from 'vitest';
import { createTuning, PHYSICS_GEOMETRY, type Tuning } from '../../src/game/config/tuning';
import { CARGO } from '../../src/game/content/cargo';
import { SCENARIOS, type Scenario } from '../../src/game/content/scenarios';
import { NO_CONTROLS, type Controls } from '../../src/game/core/input';
import { PhysicsSimulation, type LoadPreset, type SimulationSnapshot } from '../../src/game/physics/simulation';

const live: PhysicsSimulation[] = [];
const scenarioById = (id: string): Scenario => {
  const scenario = SCENARIOS.find(candidate => candidate.id === id);
  if (!scenario) throw new Error(`Missing required scenario: ${id}`);
  return scenario;
};
const createSimulation = (scenario: Scenario, load: LoadPreset = 'full', changes: Partial<Tuning> = {}) => {
  const simulation = new PhysicsSimulation(scenario, { ...createTuning(), ...changes }, load);
  live.push(simulation);
  return simulation;
};
const advance = (simulation: PhysicsSimulation, seconds: number, input: Controls = NO_CONTROLS) => {
  for (let tick = 0; tick < seconds * simulation.tuning.physicsHz; tick += 1) simulation.step(input);
  return simulation.snapshot();
};
const assertFinite = (simulation: PhysicsSimulation, snapshot = simulation.snapshot()) => {
  const values = [snapshot.tick, snapshot.time, snapshot.cameraX, snapshot.cameraY,
    snapshot.turtle.x, snapshot.turtle.y, snapshot.turtle.angle, snapshot.turtle.speed,
    snapshot.turtle.verticalSpeed, snapshot.turtle.mass,
    ...snapshot.cargo.flatMap(item => [item.x, item.y, item.angle, item.separatedSeconds])];
  simulation.world.forEachRigidBody(body => {
    const position = body.translation(), velocity = body.linvel();
    values.push(position.x, position.y, body.rotation(), velocity.x, velocity.y, body.angvel());
  });
  expect(values.every(Number.isFinite), `Non-finite state in ${snapshot.scenarioId} at tick ${snapshot.tick}`).toBe(true);
};
const assertFullLoad = (snapshot: SimulationSnapshot) => {
  expect(snapshot.cargo.filter(item => item.state === 'lost').map(item => item.id)).toEqual([]);
  expect(snapshot.turtle.mass).toBeCloseTo(CARGO.reduce((total, item) => total + item.mass, 0), 6);
};
const enterWater = (simulation: PhysicsSimulation) => {
  let fastestFall = 0;
  for (let tick = 0; tick < simulation.tuning.physicsHz * 20; tick += 1) {
    const previous = simulation.snapshot();
    fastestFall = Math.min(fastestFall, previous.turtle.verticalSpeed);
    simulation.step();
    const snapshot = simulation.snapshot();
    if (snapshot.turtle.biome === 'water') return { snapshot, fastestFall };
  }
  throw new Error(`Water was not reached in ${simulation.scenario.id}`);
};

afterEach(() => {
  for (const simulation of live.splice(0)) simulation.dispose();
});

describe('real Rapier simulation invariants', () => {
  it.each(SCENARIOS)('$id stays finite under extreme controls and recovers from physical holds', scenario => {
    const simulation = createSimulation(scenario);
    const inputs: readonly Controls[] = [NO_CONTROLS, { horizontal: 1, vertical: 1 }, { horizontal: -1, vertical: -1 }];
    let snapshot = simulation.snapshot();
    let wallJumpStarted = false, wallJumpReleased = false;
    assertFinite(simulation, snapshot);
    for (let tick = 0; tick < simulation.tuning.physicsHz * 75 && snapshot.turtle.x < scenario.endX; tick += 1) {
      let controls = inputs[Math.floor(tick / 180) % inputs.length];
      if (scenario.id === 'jump-wall') {
        controls = NO_CONTROLS;
        if (!wallJumpStarted && snapshot.cameraBlocked && snapshot.turtle.grounded) {
          wallJumpStarted = true;
          controls = { ...NO_CONTROLS, jumpPressed: true, jumpHeld: true };
        } else if (wallJumpStarted && !wallJumpReleased) {
          wallJumpReleased = snapshot.turtle.jumpChargeSeconds >= simulation.tuning.jumpMaxChargeSeconds;
          controls = wallJumpReleased ? { ...NO_CONTROLS, jumpReleased: true } : { ...NO_CONTROLS, jumpHeld: true };
        }
      }
      simulation.step(controls);
      snapshot = simulation.snapshot();
      if (tick % 15 === 0) assertFinite(simulation, snapshot);
      expect(snapshot.turtle.speed).toBeGreaterThanOrEqual(simulation.tuning.minSpeed);
      expect(snapshot.turtle.speed).toBeLessThanOrEqual(simulation.tuning.maxSpeed + simulation.tuning.waterCurrent);
      expect(Math.abs(snapshot.turtle.angle)).toBeLessThanOrEqual(simulation.tuning.shellMaxAngle);
    }
    assertFinite(simulation, snapshot);
    if (scenario.id === 'jump-wall') expect(wallJumpReleased).toBe(true);
    expect(snapshot.turtle.x).toBeGreaterThan(scenario.startX);
    if (snapshot.turtle.x < scenario.endX) {
      // The original low shell can contact solid terrain at extreme manual
      // tilt. Prove recovery instead of requiring passage through that solid.
      const heldX = snapshot.turtle.x;
      for (let tick = 0; tick < simulation.tuning.physicsHz * 10; tick++) {
        const vertical = snapshot.turtle.angle > 0.03 ? -1 : snapshot.turtle.angle < -0.03 ? 1 : 0;
        simulation.step({ horizontal: 0, vertical });
        snapshot = simulation.snapshot();
        assertFinite(simulation, snapshot);
        if (snapshot.turtle.x >= Math.min(scenario.endX, heldX + 1)) break;
      }
      expect(snapshot.turtle.x, 'Raising a terrain-blocked shell must recover forward motion').toBeGreaterThan(heldX + 0.5);
    }
  }, 30_000);

  it.each(SCENARIOS)('$id restores the same configured initial state after prior simulation', scenario => {
    const first = createSimulation(scenario);
    const initial = first.snapshot();
    advance(first, 3, { horizontal: 1, vertical: -1 });
    first.dispose();
    const reset = createSimulation(scenario);
    expect(reset.snapshot()).toEqual(initial);
    expect(reset.snapshot().tick).toBe(0);
    expect(reset.snapshot().time).toBe(0);
  });

  it.each(['flat', 'slopes', 'comparison'])('%s maintains forward motion through unobstructed dry terrain', id => {
    const scenario = scenarioById(id);
    const simulation = createSimulation(scenario);
    let previous = simulation.snapshot();
    for (let tick = 0; tick < simulation.tuning.physicsHz * 65 && previous.turtle.x < scenario.endX; tick += 1) {
      const horizontal = tick < 180 ? -1 : tick < 360 ? 1 : 0;
      simulation.step({ horizontal, vertical: 0 });
      const next = simulation.snapshot();
      expect(next.turtle.x, `Forward motion stopped in ${id} at tick ${tick}`).toBeGreaterThan(previous.turtle.x);
      expect(next.turtle.speed).toBeGreaterThanOrEqual(simulation.tuning.minSpeed);
      expect(next.turtle.speed).toBeLessThanOrEqual(simulation.tuning.maxSpeed);
      previous = next;
    }
    expect(previous.turtle.x).toBeGreaterThanOrEqual(scenario.endX);
  }, 15_000);

  it.each([
    ['slopes', -1], ['slopes', 1], ['water', -1], ['water', 1],
  ] as const)('%s keeps sustained horizontal input %s inside the real camera window', (id, horizontal) => {
    const scenario = scenarioById(id);
    const simulation = createSimulation(scenario);
    const toleranceMetres = 0.05;
    let previous = simulation.snapshot();
    for (let tick = 0; tick < simulation.tuning.physicsHz * 65 && previous.turtle.x < scenario.endX; tick += 1) {
      simulation.step({ horizontal, vertical: 0 });
      const snapshot = simulation.snapshot();
      const screenX = snapshot.turtle.x - snapshot.cameraX;
      const context = `${id} input ${horizontal}, tick ${tick}, screen x ${screenX}`;
      expect(screenX, context).toBeGreaterThanOrEqual(simulation.tuning.cameraBack - toleranceMetres);
      expect(screenX, context).toBeLessThanOrEqual(simulation.tuning.cameraFront + toleranceMetres);
      expect(snapshot.turtle.x, context).toBeGreaterThan(previous.turtle.x);
      previous = snapshot;
    }
    expect(previous.turtle.x).toBeGreaterThanOrEqual(scenario.endX);
  }, 15_000);

  it('retains all four cargo on baseline grass for ten seconds without input', () => {
    const simulation = createSimulation(scenarioById('flat'));
    for (let tick = 0; tick < simulation.tuning.physicsHz * 10; tick += 1) {
      simulation.step();
      assertFullLoad(simulation.snapshot());
    }
    expect(simulation.snapshot().cargo.every(item => item.state === 'active')).toBe(true);
  });

  it('enforces speed and shell bounds under sustained and malformed controls', () => {
    const simulation = createSimulation(scenarioById('flat'));
    const controls: readonly Controls[] = [
      { horizontal: -1, vertical: -1 }, { horizontal: 1, vertical: 1 },
      { horizontal: 50, vertical: -50 }, { horizontal: Number.NaN, vertical: Number.POSITIVE_INFINITY },
    ];
    for (const input of controls) {
      for (let tick = 0; tick < 180; tick += 1) {
        simulation.step(input);
        const snapshot = simulation.snapshot();
        expect(snapshot.turtle.speed).toBeGreaterThanOrEqual(simulation.tuning.minSpeed);
        expect(snapshot.turtle.speed).toBeLessThanOrEqual(simulation.tuning.maxSpeed);
        expect(Math.abs(snapshot.turtle.angle)).toBeLessThanOrEqual(simulation.tuning.shellMaxAngle);
        assertFinite(simulation, snapshot);
      }
    }
  });

  it('uses physically distinct masses and actual local centers of mass', () => {
    const simulation = createSimulation(scenarioById('flat'));
    const centers: number[] = [], masses: number[] = [];
    for (const item of simulation.cargo) {
      const center = item.body.localCom();
      expect(center.x).toBeCloseTo(0, 6);
      expect(center.y).toBeCloseTo(item.definition.centerOfMassY, 6);
      expect(item.body.mass()).toBeCloseTo(item.definition.mass, 6);
      centers.push(center.y);
      masses.push(item.body.mass());
    }
    expect(new Set(centers).size).toBe(CARGO.length);
    expect(new Set(masses).size).toBe(CARGO.length);
    expect(centers.find(center => center < 0)).toBeDefined();
    expect(Math.max(...centers)).toBeGreaterThan(0.3);
  });

  it('isolates terminally lost cargo from turtle, shell and every other cargo', () => {
    const simulation = createSimulation(scenarioById('flat'));
    const removed = simulation.cargo.find(item => item.definition.id === 'cocktailGlass');
    if (!removed) throw new Error('Missing cocktail glass');
    removed.body.setTranslation({ x: -10, y: 30 }, true);
    removed.body.setLinvel({ x: 0, y: 0 }, true);
    advance(simulation, simulation.tuning.lossGraceSeconds + 0.1);
    expect(simulation.tracker.state('cocktailGlass')).toBe('lost');
    expect(simulation.mass).toBeCloseTo(CARGO.reduce((total, item) => total + item.mass, 0) - removed.definition.mass, 6);
    for (const collider of removed.colliders) {
      const mask = collider.collisionGroups();
      const membership = (mask >>> 16) & 0xffff, filter = mask & 0xffff;
      expect(filter & (2 | 4 | 8)).toBe(0);
      expect(filter & 1).toBe(1);
      simulation.world.forEachCollider(other => {
        if (removed.colliders.some(own => own.handle === other.handle)) return;
        const otherMask = other.collisionGroups();
        const otherMembership = (otherMask >>> 16) & 0xffff, otherFilter = otherMask & 0xffff;
        if (otherMembership & (2 | 4 | 8)) {
          expect((membership & otherFilter) !== 0 && (otherMembership & filter) !== 0).toBe(false);
        }
      });
    }
    removed.body.setTranslation({ x: simulation.snapshot().turtle.x, y: 3 }, true);
    advance(simulation, 0.5);
    expect(simulation.tracker.state('cocktailGlass')).toBe('lost');
    expect(simulation.snapshot().contacts.some(edge => edge.a === 'cocktailGlass' || edge.b === 'cocktailGlass')).toBe(false);
  });
});

describe('water weight and entry behavior', () => {
  it('retained full cargo reaches greater depth and gains stronger current than a light load', () => {
    const full = createSimulation(scenarioById('water'));
    const light = createSimulation(scenarioById('water'), 'light');
    enterWater(full);
    enterWater(light);
    let fullSpeed = 0, lightSpeed = 0;
    for (let tick = 0; tick < full.tuning.physicsHz * 4; tick += 1) {
      full.step(); light.step();
      const fullSnapshot = full.snapshot(), lightSnapshot = light.snapshot();
      fullSpeed += fullSnapshot.turtle.speed;
      lightSpeed += lightSnapshot.turtle.speed;
      assertFullLoad(fullSnapshot);
      expect(lightSnapshot.cargo[0].state).not.toBe('lost');
    }
    const fullSnapshot = full.snapshot(), lightSnapshot = light.snapshot();
    expect(fullSnapshot.turtle.biome).toBe('water');
    expect(lightSnapshot.turtle.biome).toBe('water');
    expect(fullSnapshot.turtle.y).toBeLessThan(lightSnapshot.turtle.y);
    expect(fullSpeed).toBeGreaterThan(lightSpeed);
  });

  it('a light load returns upward faster from the same deep-water starting position', () => {
    const authored = scenarioById('water');
    if (!authored.water) throw new Error('Missing water region');
    const deepStart: Scenario = { ...authored, id: 'water-rise-fixture', startX: 25,
      // Start below both preferred depths, with actual capsule clearance.
      startY: authored.water.bottom + 0.02 };
    const full = createSimulation(deepStart), light = createSimulation(deepStart, 'light');
    const initialY = full.snapshot().turtle.y;
    expect(light.snapshot().turtle.y).toBe(initialY);
    const fullSnapshot = advance(full, 1), lightSnapshot = advance(light, 1);
    assertFullLoad(fullSnapshot);
    expect(fullSnapshot.turtle.biome).toBe('water');
    expect(lightSnapshot.turtle.biome).toBe('water');
    expect(fullSnapshot.turtle.y).toBeGreaterThan(initialY);
    expect(lightSnapshot.turtle.y).toBeGreaterThan(fullSnapshot.turtle.y);
    expect(lightSnapshot.turtle.verticalSpeed).toBeGreaterThan(fullSnapshot.turtle.verticalSpeed);
  });

  it('vertical water input balances the shell in either direction without commanding depth', () => {
    const authored = scenarioById('water');
    if (!authored.water) throw new Error('Missing water region');
    const submerged: Scenario = { ...authored, id: 'water-swim-fixture', startX: 25,
      startY: authored.water.bottom + 1 - PHYSICS_GEOMETRY.turtleHalfHeight - PHYSICS_GEOMETRY.controllerOffset };
    const up = createSimulation(submerged, 'empty'), down = createSimulation(submerged, 'empty');
    for (let tick = 0; tick < up.tuning.physicsHz; tick += 1) {
      up.step({ horizontal: 0, vertical: 1 });
      down.step({ horizontal: 0, vertical: -1 });
      for (const simulation of [up, down]) {
        const snapshot = simulation.snapshot();
        expect(snapshot.turtle.biome).toBe('water');
        assertFinite(simulation, snapshot);
      }
    }
    expect(up.snapshot().turtle.angle).toBeGreaterThan(0.3);
    expect(down.snapshot().turtle.angle).toBeLessThan(-0.3);
    expect(up.snapshot().shell.angle).toBeCloseTo(up.snapshot().turtle.angle, 6);
    expect(down.snapshot().shell.angle).toBeCloseTo(down.snapshot().turtle.angle, 6);
    expect(up.snapshot().turtle.y).toBeCloseTo(down.snapshot().turtle.y, 6);
    expect(up.snapshot().turtle.verticalSpeed).toBeCloseTo(down.snapshot().turtle.verticalSpeed, 6);
  });

  it.each(['empty', 'light', 'full'] as const)('held Space accelerates ascent with %s cargo without charging a jump', load => {
    const authored = scenarioById('water');
    if (!authored.water) throw new Error('Missing water region');
    const submerged: Scenario = { ...authored, id: 'water-space-fixture', startX: 25,
      startY: authored.water.bottom + 1 - PHYSICS_GEOMETRY.turtleHalfHeight - PHYSICS_GEOMETRY.controllerOffset };
    const neutral = createSimulation(submerged, load), swimming = createSimulation(submerged, load);
    for (let tick = 0; tick < swimming.tuning.physicsHz; tick++) {
      neutral.step();
      swimming.step({ horizontal: 0, vertical: 0, jumpPressed: tick === 0, jumpHeld: true });
      expect(swimming.snapshot().turtle.jumpCharging).toBe(false);
      expect(swimming.snapshot().turtle.jumpChargeSeconds).toBe(0);
      expect(swimming.snapshot().turtle.biome).toBe('water');
    }
    expect(swimming.snapshot().turtle.y).toBeGreaterThan(neutral.snapshot().turtle.y);
    expect(swimming.snapshot().turtle.verticalSpeed).toBeGreaterThanOrEqual(neutral.snapshot().turtle.verticalSpeed);
    const before = swimming.snapshot();
    swimming.step({ horizontal: 0, vertical: 0, jumpReleased: true });
    expect(swimming.snapshot().turtle.jumpCharging).toBe(false);
    expect(swimming.snapshot().turtle.verticalSpeed).toBeLessThanOrEqual(before.turtle.verticalSpeed);
  });

  it('depth current produces forward assistance relative to the same load with current disabled', () => {
    const current = createSimulation(scenarioById('water'));
    const calm = createSimulation(scenarioById('water'), 'full', { waterCurrent: 0 });
    enterWater(current); enterWater(calm);
    const currentStart = current.snapshot().turtle.x, calmStart = calm.snapshot().turtle.x;
    const currentSnapshot = advance(current, 4), calmSnapshot = advance(calm, 4);
    assertFullLoad(currentSnapshot);
    assertFullLoad(calmSnapshot);
    expect(currentSnapshot.turtle.x - currentStart).toBeGreaterThan(calmSnapshot.turtle.x - calmStart);
  });

  it('cushions a high authored water entry without losing cargo', () => {
    const simulation = createSimulation(scenarioById('water-drop'));
    const entry = enterWater(simulation);
    expect(entry.fastestFall).toBeLessThan(-4);
    // Water now preserves entry momentum and amortizes it over fixed ticks.
    expect(entry.snapshot.turtle.verticalSpeed).toBeLessThan(-simulation.tuning.waterMaxVerticalSpeed);
    expect(entry.snapshot.turtle.verticalSpeed).toBeGreaterThan(entry.fastestFall);
    assertFullLoad(entry.snapshot);
    let reachedOrdinarySpeed = false;
    let previousVerticalSpeed = entry.snapshot.turtle.verticalSpeed;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 2; tick += 1) {
      simulation.step();
      const snapshot = simulation.snapshot();
      assertFullLoad(snapshot);
      assertFinite(simulation, snapshot);
      if (tick === 0) {
        expect(snapshot.turtle.verticalSpeed).toBeGreaterThan(previousVerticalSpeed);
        expect(snapshot.turtle.verticalSpeed).toBeLessThan(0);
      }
      if (Math.abs(snapshot.turtle.verticalSpeed) <= simulation.tuning.waterMaxVerticalSpeed) reachedOrdinarySpeed = true;
      if (reachedOrdinarySpeed) expect(Math.abs(snapshot.turtle.verticalSpeed)).toBeLessThanOrEqual(simulation.tuning.waterMaxVerticalSpeed);
      previousVerticalSpeed = snapshot.turtle.verticalSpeed;
    }
    expect(reachedOrdinarySpeed).toBe(true);
  });
});
