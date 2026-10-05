import { afterEach, describe, expect, it } from 'vitest';
import RAPIER from '@dimforge/rapier2d';
import { createTuning, PHYSICS_GEOMETRY as G, withTuning, type Tuning } from '../../src/game/config/tuning';
import { CARGO } from '../../src/game/content/cargo';
import { SCENARIOS, terrainAt, type Scenario } from '../../src/game/content/scenarios';
import { NO_CONTROLS, type Controls } from '../../src/game/core/input';
import { PhysicsSimulation, type LoadPreset } from '../../src/game/physics/simulation';

const live: PhysicsSimulation[] = [];
const fullMass = CARGO.reduce((sum, item) => sum + item.mass, 0);
const scenario = (id: string): Scenario => {
  const result = SCENARIOS.find(item => item.id === id);
  if (!result) throw new Error('Missing scenario: ' + id);
  return result;
};
const create = (id: string | Scenario = 'flat', load: LoadPreset = 'full', tuning: Tuning = createTuning()) => {
  const simulation = new PhysicsSimulation(typeof id === 'string' ? scenario(id) : id, tuning, load);
  live.push(simulation);
  return simulation;
};
const advance = (simulation: PhysicsSimulation, seconds: number, controls: Controls = NO_CONTROLS) => {
  for (let i = 0; i < Math.round(seconds * simulation.tuning.physicsHz); i++) simulation.step(controls);
  return simulation.snapshot();
};
const charge = (simulation: PhysicsSimulation, seconds: number) => {
  simulation.step({ ...NO_CONTROLS, jumpHeld: true, jumpPressed: true });
  for (let i = 1; i < Math.round(seconds * simulation.tuning.physicsHz); i++) {
    simulation.step({ ...NO_CONTROLS, jumpHeld: true });
  }
};
const release = (simulation: PhysicsSimulation) => {
  simulation.step({ ...NO_CONTROLS, jumpReleased: true });
  return simulation.snapshot();
};
const deepWater = (): Scenario => {
  const authored = scenario('water');
  if (!authored.water) throw new Error('Missing water');
  return { ...authored, id: 'deep-mass-fixture', startX: 25,
    startY: authored.water.bottom + 1 - G.turtleHalfHeight - G.controllerOffset };
};
const assertFinite = (simulation: PhysicsSimulation) => {
  const snapshot = simulation.snapshot();
  const values = [snapshot.turtle.x, snapshot.turtle.y, snapshot.turtle.angle, snapshot.turtle.bodyAngle,
    snapshot.turtle.speed, snapshot.turtle.verticalSpeed, snapshot.shell.x, snapshot.shell.y, snapshot.shell.angle];
  simulation.world.forEachRigidBody(body => {
    values.push(body.translation().x, body.translation().y, body.rotation(), body.linvel().x, body.linvel().y, body.angvel());
  });
  expect(values.every(Number.isFinite)).toBe(true);
};

afterEach(() => { for (const simulation of live.splice(0)) simulation.dispose(); });

describe('charged jump and supported cargo', () => {
  it('holds at the charge cap without launching, then releases once with configured strength', () => {
    const simulation = create();
    charge(simulation, 3.5);
    const held = simulation.snapshot();
    expect(held.turtle.jumpChargeSeconds).toBe(simulation.tuning.jumpMaxChargeSeconds);
    expect(held.turtle.jumpCharging).toBe(true);
    expect(held.turtle.grounded).toBe(true);
    const launched = release(simulation);
    expect(launched.turtle.jumpCharging).toBe(false);
    expect(launched.turtle.jumpChargeSeconds).toBe(0);
    expect(launched.turtle.grounded).toBe(false);
    expect(launched.turtle.verticalSpeed).toBeCloseTo(
      simulation.tuning.jumpMaxLaunchSpeed - simulation.tuning.gravity / simulation.tuning.physicsHz, 6);
    expect(launched.turtle.x).toBeGreaterThan(held.turtle.x);
    simulation.step({ ...NO_CONTROLS, jumpReleased: true });
    expect(simulation.snapshot().turtle.verticalSpeed).toBeLessThan(launched.turtle.verticalSpeed);
  });

  it('launch speed scales linearly with charge, and gravity determines the resulting arc', () => {
    const short = create('flat', 'empty'), full = create('flat', 'empty');
    charge(short, 0.75); charge(full, 3);
    const shortStart = short.snapshot().turtle.y, fullStart = full.snapshot().turtle.y;
    const shortLaunch = release(short), fullLaunch = release(full);
    const gravityTick = short.tuning.gravity / short.tuning.physicsHz;
    expect(shortLaunch.turtle.verticalSpeed + gravityTick).toBeCloseTo(
      (fullLaunch.turtle.verticalSpeed + gravityTick) / 4, 6);
    let shortHeight = 0, fullHeight = 0;
    for (let i = 0; i < full.tuning.physicsHz; i++) {
      short.step(); full.step();
      shortHeight = Math.max(shortHeight, short.snapshot().turtle.y - shortStart);
      fullHeight = Math.max(fullHeight, full.snapshot().turtle.y - fullStart);
    }
    expect(shortHeight).toBeGreaterThan(0);
    expect(fullHeight).toBeGreaterThan(shortHeight * 10);
    expect(fullHeight).toBeCloseTo(full.tuning.jumpMaxLaunchSpeed ** 2 / (2 * full.tuning.gravity), 1);
  });

  it('retains the independent complete stack through a full grass jump and landing', () => {
    const simulation = create();
    charge(simulation, 3);
    const start = simulation.snapshot();
    release(simulation);
    let airborneTicks = 0;
    const flightAndLandingSeconds = 2 * simulation.tuning.jumpMaxLaunchSpeed / simulation.tuning.gravity + 0.5;
    for (let i = 0; i < simulation.tuning.physicsHz * flightAndLandingSeconds; i++) {
      simulation.step();
      const snapshot = simulation.snapshot();
      if (!snapshot.turtle.grounded) airborneTicks++;
      expect(snapshot.cargo.filter(item => item.state === 'lost')).toEqual([]);
      expect(snapshot.turtle.mass).toBeCloseTo(fullMass, 6);
      expect(snapshot.turtle.x - snapshot.cameraX).toBeGreaterThanOrEqual(simulation.tuning.cameraBack - 0.05);
      expect(snapshot.turtle.x - snapshot.cameraX).toBeLessThanOrEqual(simulation.tuning.cameraFront + 0.05);
      assertFinite(simulation);
    }
    expect(airborneTicks / simulation.tuning.physicsHz).toBeGreaterThan(simulation.tuning.lossGraceSeconds);
    expect(simulation.snapshot().turtle.grounded).toBe(true);
    expect(simulation.snapshot().turtle.x).toBeGreaterThan(start.turtle.x);
  });

  it('cancels charge explicitly and never gives separated cargo a remote takeoff impulse', () => {
    const canceled = create();
    charge(canceled, 1); canceled.cancelJump();
    expect(release(canceled).turtle.grounded).toBe(true);
    const simulation = create();
    charge(simulation, 3);
    const glass = simulation.cargo.find(item => item.definition.id === 'cocktailGlass');
    if (!glass) throw new Error('Missing glass');
    glass.body.setTranslation({ x: -10, y: 30 }, true);
    glass.body.setLinvel({ x: 0, y: -1 }, true);
    simulation.step({ ...NO_CONTROLS, jumpHeld: true });
    expect(simulation.tracker.state('cocktailGlass')).toBe('separated');
    const before = glass.body.linvel().y;
    release(simulation);
    expect(glass.body.linvel().y).toBeCloseTo(before - simulation.tuning.gravity / simulation.tuning.physicsHz, 4);
    expect(simulation.mass).toBeCloseTo(fullMass, 6);
  });

  it('resolves actual shell headroom while retaining forward translation on a constrained takeoff', () => {
    const simulation = create('flat', 'empty');
    charge(simulation, 3);
    const initial = simulation.snapshot();
    const roofBottom = initial.shell.y + 0.42 + 0.04;
    const roof = simulation.world.createCollider(RAPIER.ColliderDesc.cuboid(3, 0.1)
      .setTranslation(initial.turtle.x + 1, roofBottom + 0.1)
      .setCollisionGroups((1 << 16) | 2));
    simulation.step({ ...NO_CONTROLS, jumpHeld: true });
    const before = simulation.snapshot();
    const launch = release(simulation);
    expect(launch.turtle.y - before.turtle.y).toBeLessThan(
      simulation.tuning.jumpMaxLaunchSpeed / simulation.tuning.physicsHz);
    for (let tick = 0; tick < simulation.tuning.physicsHz; tick++) {
      const previous = simulation.snapshot();
      simulation.step();
      const snapshot = simulation.snapshot();
      expect(snapshot.turtle.x).toBeGreaterThan(previous.turtle.x);
      const support = simulation.world.getCollider(
        [...simulation.world.colliders.getAll()].find(collider => (collider.collisionGroups() >>> 16) === 8)!.handle);
      const contact = roof.contactShape(support.shape, snapshot.shell, snapshot.shell.angle, 0.01);
      expect(contact?.distance ?? 0.01).toBeGreaterThanOrEqual(-1e-5);
      assertFinite(simulation);
    }
  });

  it('preserves the departure body pitch during dry airborne motion', () => {
    const simulation = create('slopes-max', 'empty');
    advance(simulation, 2);
    charge(simulation, 3);
    const before = simulation.snapshot();
    expect(before.turtle.bodyAngle).toBeGreaterThan(0.4);
    release(simulation);
    for (let tick = 0; tick < simulation.tuning.physicsHz / 4; tick++) {
      expect(simulation.snapshot().turtle.grounded).toBe(false);
      expect(simulation.snapshot().turtle.bodyAngle).toBe(before.turtle.bodyAngle);
      simulation.step();
    }
  });
});

describe('terrain pose and actual shell support', () => {
  it('uses physical support pitch, a rotated pivot and world shell angle with manual compensation', () => {
    const simulation = create('slopes-max', 'empty');
    let measuredSlope = false, measuredCompensation = false;
    for (let i = 0; i < simulation.tuning.physicsHz * 20; i++) {
      const previous = simulation.snapshot();
      // The restored low pivot has genuine terrain clearance limits; do not
      // demand a fully horizontal shell where its front rim hits the ramp.
      const target = Math.max(-0.45, Math.min(0.45, -previous.turtle.bodyAngle));
      const vertical = previous.turtle.angle < target - 0.015 ? 1 : previous.turtle.angle > target + 0.015 ? -1 : 0;
      simulation.step({ horizontal: 0, vertical });
      const next = simulation.snapshot();
      expect(Math.abs(next.turtle.bodyAngle - previous.turtle.bodyAngle)).toBeLessThanOrEqual(
        simulation.tuning.shellAngularSpeed / simulation.tuning.physicsHz + 1e-7);
      expect(next.shell.x).toBeCloseTo(next.turtle.bodyX - Math.sin(next.turtle.bodyAngle) * simulation.tuning.shellPivotY, 5);
      expect(next.shell.y).toBeCloseTo(next.turtle.bodyY + Math.cos(next.turtle.bodyAngle) * simulation.tuning.shellPivotY, 5);
      expect(next.shell.angle).toBeCloseTo(next.turtle.bodyAngle + next.turtle.angle, 5);
      if (next.turtle.bodyAngle > 0.4) measuredSlope = true;
      if (next.turtle.bodyAngle > 0.4 && next.turtle.angle < -0.4) measuredCompensation = true;
      expect(next.turtle.x).toBeGreaterThan(previous.turtle.x);
      assertFinite(simulation);
    }
    expect(measuredSlope).toBe(true);
    expect(measuredCompensation).toBe(true);
  });

  it('keeps the terrain-aligned feet near the supporting plane without the proxy height', () => {
    const simulation = create('slopes-max', 'empty');
    let checked = false;
    const shaft = G.turtleHalfWidth - G.turtleHalfHeight;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 8; tick++) {
      simulation.step();
      const body = simulation.snapshot().turtle;
      if (body.bodyAngle < 0.6 || body.x < 9 || body.x > 11) continue;
      for (const direction of [-1, 1]) {
        const x = body.bodyX + direction * shaft * Math.cos(body.bodyAngle) + G.turtleHalfHeight * Math.sin(body.bodyAngle);
        const y = body.bodyY + direction * shaft * Math.sin(body.bodyAngle) - G.turtleHalfHeight * Math.cos(body.bodyAngle);
        const distance = (y - terrainAt(simulation.scenario, x).height) * Math.cos(body.bodyAngle);
        expect(distance).toBeGreaterThanOrEqual(-1e-4);
        expect(distance).toBeLessThan(0.12);
      }
      expect(body.y - body.bodyY).toBeGreaterThan(0.35);
      checked = true;
    }
    expect(checked).toBe(true);
  });

  it('starts in the midpoint of the configured movement window independently of dead zone', () => {
    const tuning = withTuning(createTuning(), { cameraDeadZonePercent: 35, cameraRearPercent: 18, cameraFrontPercent: 42 });
    const snapshot = create('flat', 'empty', tuning).snapshot();
    expect(snapshot.turtle.x - snapshot.cameraX).toBeCloseTo((tuning.cameraBack + tuning.cameraFront) / 2, 6);
  });

  it('keeps forward motion and the camera window through maximum ramps with sustained braking', () => {
    const simulation = create('slopes-max', 'empty');
    for (let tick = 0; tick < simulation.tuning.physicsHz * 35; tick++) {
      const previous = simulation.snapshot();
      simulation.step({ horizontal: -1, vertical: 0 });
      const snapshot = simulation.snapshot();
      if (previous.turtle.x >= simulation.scenario.endX) break;
      expect(snapshot.turtle.x).toBeGreaterThan(previous.turtle.x);
      expect(snapshot.turtle.x - snapshot.cameraX).toBeGreaterThanOrEqual(simulation.tuning.cameraBack - 0.05);
      expect(snapshot.turtle.x - snapshot.cameraX).toBeLessThanOrEqual(simulation.tuning.cameraFront + 0.05);
    }
    expect(simulation.snapshot().turtle.x).toBeGreaterThanOrEqual(simulation.scenario.endX);
  });
});

describe('mass-dependent water with preserved entry momentum', () => {
  const swimCandidate = () => withTuning(createTuning(), { waterCurrent: 0 });

  it('empty, sofa and full cargo rise in mass order from the same depth', () => {
    const empty = create(deepWater(), 'empty', swimCandidate());
    const light = create(deepWater(), 'light', swimCandidate());
    const full = create(deepWater(), 'full', swimCandidate());
    advance(empty, 0.25); advance(light, 0.25); advance(full, 0.25);
    expect(empty.mass).toBe(0); expect(light.mass).toBe(8); expect(full.mass).toBeCloseTo(13.6, 6);
    expect(empty.snapshot().turtle.y).toBeGreaterThan(light.snapshot().turtle.y);
    expect(light.snapshot().turtle.y).toBeGreaterThan(full.snapshot().turtle.y);
  });

  it('swim input itself has less acceleration with greater retained mass', () => {
    const responses: number[] = [];
    for (const load of ['empty', 'light', 'full'] as const) {
      const neutral = create(deepWater(), load, swimCandidate());
      const swimming = create(deepWater(), load, swimCandidate());
      neutral.step(); swimming.step({ horizontal: 0, vertical: 0, jumpHeld: true });
      responses.push(swimming.snapshot().turtle.verticalSpeed - neutral.snapshot().turtle.verticalSpeed);
    }
    expect(responses[0]).toBeGreaterThan(responses[1]);
    expect(responses[1]).toBeGreaterThan(responses[2]);
    expect(responses[2]).toBeGreaterThan(0);
  });

  it('current never adds a lateral fluid force directly to cargo', () => {
    const simulation = create(deepWater(), 'full', withTuning(createTuning(), { gripAssistance: 0, waterCurrent: 1.5 }));
    advance(simulation, 0.5);
    expect(simulation.snapshot().turtle.biome).toBe('water');
    for (const item of simulation.cargo) expect(item.body.userForce().x).toBe(0);
  });

  it('cushions the complete stack when a charged jump carries it into water', () => {
    const simulation = create('water-jump');
    advance(simulation, 1); charge(simulation, 3); release(simulation);
    let entered = false;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 8; tick++) {
      simulation.step();
      const snapshot = simulation.snapshot();
      if (snapshot.turtle.biome === 'water') entered = true;
      expect(snapshot.cargo.filter(item => item.state === 'lost')).toEqual([]);
      assertFinite(simulation);
    }
    expect(entered).toBe(true);
  });

  it.each(['empty', 'light', 'full'] as const)('%s load can swim to the surface and traverse the bank', load => {
    const simulation = create(deepWater(), load, swimCandidate());
    const initialMass = simulation.mass;
    const surface = simulation.scenario.water!.surface;
    let surfaced = false;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 25 && simulation.snapshot().turtle.x < simulation.scenario.endX; tick++) {
      const previous = simulation.snapshot();
      simulation.step({ horizontal: 0, vertical: 0, jumpHeld: previous.turtle.biome === 'water' });
      const snapshot = simulation.snapshot();
      if (!surfaced) expect(snapshot.turtle.mass).toBeCloseTo(initialMass, 6);
      if (snapshot.turtle.y >= surface) surfaced = true;
      expect(snapshot.turtle.x).toBeGreaterThan(previous.turtle.x);
      assertFinite(simulation);
    }
    expect(surfaced).toBe(true);
    expect(simulation.snapshot().turtle.biome).not.toBe('water');
    expect(simulation.snapshot().turtle.x).toBeGreaterThan(56);
  });

  it('natural immersion leaves empty cargo shallower than sofa and the complete load without a dive command', () => {
    const empty = create(deepWater(), 'empty', swimCandidate());
    const light = create(deepWater(), 'light', swimCandidate());
    const full = create(deepWater(), 'full', swimCandidate());
    for (const simulation of [empty, light, full]) advance(simulation, 5);
    expect(empty.mass).toBe(0); expect(light.mass).toBe(8); expect(full.mass).toBeCloseTo(fullMass, 6);
    expect(empty.snapshot().turtle.y).toBeGreaterThan(light.snapshot().turtle.y);
    expect(light.snapshot().turtle.y).toBeGreaterThan(full.snapshot().turtle.y);
    expect(empty.snapshot().turtle.y).toBeGreaterThan(simulationWaterBottom(empty) + 1.5);
  });

  it('keeps grace cargo weight until terminal loss and removes it in the loss snapshot', () => {
    const simulation = create(deepWater(), 'full', swimCandidate());
    const glass = simulation.cargo.find(item => item.definition.id === 'cocktailGlass');
    if (!glass) throw new Error('Missing glass');
    glass.body.setTranslation({ x: -10, y: 30 }, true);
    let sawSeparated = false;
    const lossTicks = Math.ceil(simulation.tuning.lossGraceSeconds * simulation.tuning.physicsHz) + 2;
    for (let tick = 0; tick < lossTicks; tick++) {
      simulation.step();
      const state = simulation.tracker.state('cocktailGlass');
      expect(glass.body.userForce()).toEqual({ x: 0, y: 0 });
      if (state === 'separated') {
        sawSeparated = true;
        expect(simulation.mass).toBeCloseTo(fullMass, 6);
        expect(simulation.tracker.separatedSeconds('cocktailGlass')).toBeLessThan(simulation.tuning.lossGraceSeconds);
      }
      if (state === 'lost') {
        expect(simulation.tracker.separatedSeconds('cocktailGlass')).toBeCloseTo(simulation.tuning.lossGraceSeconds, 6);
        expect(simulation.snapshot().turtle.mass).toBeCloseTo(fullMass - glass.definition.mass, 6);
        expect(simulation.snapshot().contacts.some(edge => edge.a === 'cocktailGlass' || edge.b === 'cocktailGlass')).toBe(false);
        break;
      }
    }
    expect(sawSeparated).toBe(true);
    expect(simulation.tracker.state('cocktailGlass')).toBe('lost');
  });
});

function simulationWaterBottom(simulation: PhysicsSimulation): number {
  if (!simulation.scenario.water) throw new Error('Missing water');
  return simulation.scenario.water.bottom;
}
