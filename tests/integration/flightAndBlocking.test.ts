import { afterEach, describe, expect, it } from 'vitest';
import RAPIER from '@dimforge/rapier2d';
import { createTuning, PHYSICS_GEOMETRY as G, withTuning, type Tuning } from '../../src/game/config/tuning';
import { CARGO } from '../../src/game/content/cargo';
import { SCENARIOS, type Scenario } from '../../src/game/content/scenarios';
import { NO_CONTROLS, type Controls } from '../../src/game/core/input';
import { PhysicsSimulation, type LoadPreset } from '../../src/game/physics/simulation';

const live: PhysicsSimulation[] = [];
const fullMass = CARGO.reduce((total, item) => total + item.mass, 0);
const create = (changes: Partial<Tuning> = {}, load: LoadPreset = 'full', scenario: Scenario = SCENARIOS[0]) => {
  const simulation = new PhysicsSimulation(scenario, withTuning(createTuning(), changes), load);
  live.push(simulation);
  return simulation;
};
const advance = (simulation: PhysicsSimulation, seconds: number, controls: Controls = NO_CONTROLS) => {
  for (let tick = 0; tick < Math.round(seconds * simulation.tuning.physicsHz); tick++) simulation.step(controls);
};
const charge = (simulation: PhysicsSimulation) => {
  simulation.step({ ...NO_CONTROLS, jumpHeld: true, jumpPressed: true });
  for (let tick = 1; tick < Math.round(simulation.tuning.jumpMaxChargeSeconds * simulation.tuning.physicsHz); tick++) {
    simulation.step({ ...NO_CONTROLS, jumpHeld: true });
  }
};
const launch = (simulation: PhysicsSimulation) => simulation.step({ ...NO_CONTROLS, jumpReleased: true });
const assertFinite = (simulation: PhysicsSimulation) => {
  const values: number[] = [];
  simulation.world.forEachRigidBody(body => values.push(body.translation().x, body.translation().y,
    body.linvel().x, body.linvel().y, body.rotation(), body.angvel()));
  expect(values.every(Number.isFinite)).toBe(true);
};
const wallFixture = (): Scenario => ({
  id: 'blocked-wall', label: 'Blocked jumpable wall', description: 'Camera waits for accepted movement.',
  startX: 0, startY: 0, endX: 40,
  terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 6, y: 0 },
    { x: 6.001, y: 2 }, { x: 10, y: 2 }, { x: 10.001, y: 0 }, { x: 60, y: 0 }] }],
});
const waitForCamera = (simulation: PhysicsSimulation) => {
  let stillTicks = 0;
  for (let tick = 0; tick < simulation.tuning.physicsHz * 8; tick++) {
    simulation.step();
    const snapshot = simulation.snapshot();
    stillTicks = snapshot.cameraBlocked && snapshot.cameraSpeed < G.controllerNudge * G.controllerNudge * simulation.tuning.physicsHz ? stillTicks + 1 : 0;
    if (stillTicks >= simulation.tuning.physicsHz / 2) return snapshot;
  }
  throw new Error('Expected the wall to exhaust the rear camera window.');
};

afterEach(() => { for (const simulation of live.splice(0)) simulation.dispose(); });

describe('independent airborne load regression', () => {
  it.each([
    { jumpMaxLaunchSpeed: createTuning().jumpMaxLaunchSpeed, gravity: createTuning().gravity },
    { jumpMaxLaunchSpeed: 8, gravity: 9.81 },
    { jumpMaxLaunchSpeed: 8, gravity: 3 },
    { jumpMaxLaunchSpeed: 12, gravity: 9.81 },
  ])('retains the complete load during flight with launch $jumpMaxLaunchSpeed m/s and gravity $gravity m/s²', changes => {
    const simulation = create(changes);
    charge(simulation);
    const before = simulation.snapshot();
    launch(simulation);
    let airborneTicks = 0;
    let maxRelativeDistance = 0, maxRelativeRotation = 0;
    let landed = false;
    const flightSeconds = changes.jumpMaxLaunchSpeed * 2 / changes.gravity;
    for (let tick = 0; tick < Math.ceil((flightSeconds + 1.5) * simulation.tuning.physicsHz); tick++) {
      simulation.step();
      const snapshot = simulation.snapshot();
      landed ||= snapshot.turtle.grounded;
      if (!snapshot.turtle.grounded) airborneTicks++;
      if (!snapshot.turtle.grounded || changes.jumpMaxLaunchSpeed <= 8) {
        expect(snapshot.cargo.filter(item => item.state === 'lost')).toEqual([]);
        expect(snapshot.turtle.mass).toBeCloseTo(fullMass, 6);
      }
      if (!snapshot.turtle.grounded && !landed) for (const item of simulation.cargo) {
        const assistanceAcceleration = Math.abs(item.body.userForce().y) / item.definition.mass;
        // Force/mass = grip gain × relative vertical speed. The original
        // 0.5 m/s² bound at gain 0.7 s⁻¹ certified a 0.5/0.7 m/s correction
        // envelope; preserve that envelope when the human tunes the gain.
        if (simulation.tuning.gripAssistance > 0) {
          expect(assistanceAcceleration / simulation.tuning.gripAssistance).toBeLessThan(0.5 / 0.7);
        } else expect(assistanceAcceleration).toBe(0);
        const initial = before.cargo.find(cargo => cargo.id === item.definition.id)!;
        const relativeX = item.body.translation().x - snapshot.shell.x - (initial.x - before.shell.x);
        const relativeY = item.body.translation().y - snapshot.shell.y - (initial.y - before.shell.y);
        maxRelativeDistance = Math.max(maxRelativeDistance, Math.hypot(relativeX, relativeY));
        maxRelativeRotation = Math.max(maxRelativeRotation, Math.abs(item.body.rotation() - initial.angle));
      }
      assertFinite(simulation);
    }
    expect(airborneTicks / simulation.tuning.physicsHz).toBeGreaterThan(flightSeconds * 0.9);
    // Long flights must outlast grace; the legacy 8 m/s Earth-gravity case
    // now lands before the human's longer grace period expires.
    if (flightSeconds * 0.9 > simulation.tuning.lossGraceSeconds) {
      expect(airborneTicks / simulation.tuning.physicsHz).toBeGreaterThan(simulation.tuning.lossGraceSeconds);
    }
    expect(simulation.snapshot().turtle.grounded).toBe(true);
    expect(simulation.snapshot().turtle.x).toBeGreaterThan(before.turtle.x);
    // Retention preserves a physical stack, including bounded independent
    // wobble. These bounds reject a spreading/turning collapse without welding.
    expect(maxRelativeDistance, JSON.stringify({ changes, maxRelativeDistance, maxRelativeRotation })).toBeLessThan(0.5);
    expect(maxRelativeRotation, JSON.stringify({ changes, maxRelativeDistance, maxRelativeRotation })).toBeLessThan(simulation.tuning.shellMaxAngle);
  });

  it('produces identical physics while the same stack is outside a short viewport and inside a tall one', () => {
    const short = create({ gravity: 3, cameraVerticalSpeed: 0.1, viewHeight: 720 });
    const tall = create({ gravity: 3, cameraVerticalSpeed: 0.1, viewHeight: 2160 });
    charge(short); charge(tall); launch(short); launch(tall);
    let outsideShortViewport = false;
    for (let tick = 0; tick < short.tuning.physicsHz * 7; tick++) {
      short.step(); tall.step();
      const snapshot = short.snapshot();
      if (snapshot.cargo.some(item => (item.y - snapshot.cameraY) * short.tuning.worldPixelsPerMetre > short.tuning.viewHeight)) {
        outsideShortViewport = true;
      }
      expect(snapshot).toEqual(tall.snapshot());
      expect(snapshot.cargo.every(item => item.state !== 'lost')).toBe(true);
    }
    expect(outsideShortViewport).toBe(true);
  });

  it('never applies airborne grip or takeoff assistance to separated or lost cargo', () => {
    const simulation = create();
    charge(simulation);
    const glass = simulation.cargo.find(item => item.definition.id === 'cocktailGlass')!;
    glass.body.setTranslation({ x: -10, y: 30 }, true);
    glass.body.setLinvel({ x: 0, y: -1 }, true);
    simulation.step({ ...NO_CONTROLS, jumpHeld: true });
    expect(simulation.tracker.state('cocktailGlass')).toBe('separated');
    const initialVelocity = glass.body.linvel().y;
    launch(simulation);
    const lossTicks = Math.ceil(simulation.tuning.lossGraceSeconds * simulation.tuning.physicsHz) + 2;
    const assertFreefall = (ticks: number) => {
      const expected = initialVelocity - simulation.tuning.gravity * ticks / simulation.tuning.physicsHz;
      // Bound accumulated float32 rounding across Rapier's solver substeps;
      // an exact double-precision trajectory is not its arithmetic model.
      const roundoff = 2 ** -24 * (Math.abs(initialVelocity) + simulation.tuning.gravity * ticks / simulation.tuning.physicsHz) *
        (ticks * simulation.world.numSolverIterations + 1);
      expect(Math.abs(glass.body.linvel().y - expected)).toBeLessThanOrEqual(roundoff);
    };
    for (let tick = 0; tick < lossTicks; tick++) {
      expect(glass.body.userForce()).toEqual({ x: 0, y: 0 });
      assertFreefall(tick + 1);
      simulation.step();
    }
    expect(simulation.tracker.state('cocktailGlass')).toBe('lost');
    expect(glass.body.userForce()).toEqual({ x: 0, y: 0 });
    assertFreefall(lossTicks + 1);
  });

  it('can disable contact grip without adding hidden forces to compensate', () => {
    const simulation = create({ gripAssistance: 0 });
    charge(simulation); launch(simulation);
    for (let tick = 0; tick < simulation.tuning.physicsHz * 2; tick++) {
      for (const item of simulation.cargo) expect(item.body.userForce()).toEqual({ x: 0, y: 0 });
      simulation.step();
      assertFinite(simulation);
    }
  });

  it('keeps genuine cargo rotation and load losses under destabilizing shell input', () => {
    const simulation = create();
    charge(simulation);
    expect(simulation.snapshot().turtle.jumpChargeSeconds).toBe(simulation.tuning.jumpMaxChargeSeconds);
    launch(simulation);
    let independentRotation = false;
    const destabilizationSeconds = 2 * simulation.tuning.shellMaxAngle / simulation.tuning.shellAngularSpeed +
      2 * simulation.tuning.lossGraceSeconds;
    for (let tick = 0; tick < Math.ceil(simulation.tuning.physicsHz * destabilizationSeconds); tick++) {
      simulation.step({ horizontal: 0, vertical: 1 });
      const snapshot = simulation.snapshot();
      if (snapshot.cargo.some(item => Math.abs(item.angle - snapshot.shell.angle) > 0.15)) independentRotation = true;
      assertFinite(simulation);
    }
    expect(independentRotation).toBe(true);
    expect(simulation.tracker.lostIds().length).toBeGreaterThan(0);
  });

  it('matches the measured Rapier gravity integration without a once-per-tick displacement bias', () => {
    const world = new RAPIER.World({ x: 0, y: -9.81 });
    try {
      world.timestep = 1 / 60;
      world.numSolverIterations = G.solverIterations;
      world.numInternalPgsIterations = G.internalSolverIterations;
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 10).setLinvel(0, 8));
      world.createCollider(RAPIER.ColliderDesc.cuboid(1, 1), body);
      world.step();
      const substepFraction = (world.numSolverIterations + 1) / (2 * world.numSolverIterations);
      expect(body.translation().y - 10).toBeCloseTo(8 * world.timestep - 9.81 * world.timestep ** 2 * substepFraction, 6);
    } finally { world.free(); }
  });
});

describe('blocked camera without carrier repositioning', () => {
  it('keeps the wide-window wall approach finite when temporary hull vertices round to the same point', () => {
    const simulation = create({ cameraRearPercent: 20, cameraFrontPercent: 80 }, 'full',
      SCENARIOS.find(scenario => scenario.id === 'jump-wall')!);
    // This real approach reached a near-zero rotation whose distinct doubles
    // became duplicate float32 hull vertices and previously crashed Rapier.
    for (let tick = 0; tick < simulation.tuning.physicsHz * 3; tick++) {
      simulation.step({ horizontal: 1, vertical: -1 });
      assertFinite(simulation);
    }
    expect(simulation.snapshot().turtle.x).toBeGreaterThan(simulation.scenario.startX);
  });

  it('keeps the actual convex hull above a long floor and releases its rim when rotation is reversed', () => {
    const simulation = create({}, 'empty', { ...SCENARIOS[0], startX: 75 });
    const shell = simulation.world.colliders.getAll().find(collider => (collider.collisionGroups() >>> 16) === 8)!;
    const vertices = (shell.shape as RAPIER.ConvexPolygon).vertices;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 5; tick++) {
      simulation.step({ horizontal: 0, vertical: -1 });
      const position = shell.translation(), rotation = shell.rotation();
      const minimumY = Math.min(...Array.from({ length: vertices.length / 2 }, (_, i) =>
        position.y + vertices[i * 2] * Math.sin(rotation) + vertices[i * 2 + 1] * Math.cos(rotation)));
      expect(minimumY).toBeGreaterThanOrEqual(-G.posePenetrationTolerance - 1e-6);
    }
    const before = simulation.snapshot();
    expect(before.turtle.angle).toBeLessThan(-0.45);
    for (let tick = 0; tick < simulation.tuning.physicsHz * 2; tick++) {
      const angle = simulation.snapshot().turtle.angle;
      simulation.step({ horizontal: 0, vertical: angle < -0.02 ? 1 : angle > 0.02 ? -1 : 0 });
    }
    expect(simulation.snapshot().turtle.x).toBeGreaterThan(before.turtle.x + 0.5);
    expect(Math.abs(simulation.snapshot().turtle.angle), JSON.stringify({ before, after: simulation.snapshot() })).toBeLessThan(0.02);
    expect(simulation.snapshot().cameraBlocked).toBe(false);
  });
  it.each([60, 15])('keeps the full shell arc outside roof corners with %s Hz fixed steps while reversing away from contact', physicsHz => {
    // Larger diagnostic steps make the interior arc exceed the clearance
    // tolerance, proving that safe endpoints alone are insufficient.
    const simulation = create({ physicsHz, shellAngularSpeed: 2, shellAngularDamping: 12 }, 'empty');
    const roof = simulation.world.createCollider(RAPIER.ColliderDesc.cuboid(4, 0.1)
      .setTranslation(3, 1.14).setCollisionGroups((1 << 16) | 2));
    let nearRoof = false, outgoingRotation = false;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 5; tick++) {
      const previous = simulation.snapshot();
      simulation.step({ horizontal: 0, vertical: tick < simulation.tuning.physicsHz * 2 ? 1 : -1 });
      const snapshot = simulation.snapshot();
      const shell = simulation.world.colliders.getAll().find(collider => (collider.collisionGroups() >>> 16) === 8)!;
      for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
        const pose = { x: previous.shell.x + (snapshot.shell.x - previous.shell.x) * fraction,
          y: previous.shell.y + (snapshot.shell.y - previous.shell.y) * fraction };
        const angle = previous.shell.angle + (snapshot.shell.angle - previous.shell.angle) * fraction;
        const contact = roof.contactShape(shell.shape, pose, angle, 0.05);
        if (contact) {
          expect(contact.distance, JSON.stringify({ tick, fraction, previous, snapshot })).toBeGreaterThanOrEqual(-G.posePenetrationTolerance - 1e-4);
          if (contact.distance < 0.01) nearRoof = true;
        }
      }
      if (nearRoof && snapshot.shell.angle < previous.shell.angle - 0.001) outgoingRotation = true;
      assertFinite(simulation);
    }
    expect(nearRoof).toBe(true);
    expect(outgoingRotation).toBe(true);
  });

  it('blocks excessive downward shell tilt without penetration, then recovers when the shell is raised', () => {
    const simulation = create({}, 'empty', SCENARIOS.find(item => item.id === 'slopes-max')!);
    let blocked = false;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 20; tick++) {
      const previous = simulation.snapshot();
      simulation.step({ horizontal: 0, vertical: previous.turtle.bodyAngle > 0.02 ? -1 : 0 });
      const shell = simulation.world.colliders.getAll().find(collider => (collider.collisionGroups() >>> 16) === 8)!;
      const distances = simulation.world.colliders.getAll().filter(collider => (collider.collisionGroups() >>> 16) === 1)
        .map(collider => collider.contactShape(shell.shape, simulation.snapshot().shell, simulation.snapshot().shell.angle, 0.1)?.distance);
      for (const distance of distances) if (distance !== undefined) expect(distance).toBeGreaterThanOrEqual(-G.posePenetrationTolerance - 1e-4);
      if (simulation.snapshot().cameraBlocked && simulation.snapshot().cameraSpeed === 0) { blocked = true; break; }
    }
    expect(blocked).toBe(true);
    const stopped = simulation.snapshot();
    advance(simulation, 0.5);
    expect(simulation.snapshot().cameraX).toBeCloseTo(stopped.cameraX, 3);
    expect(simulation.snapshot().time).toBeGreaterThan(stopped.time);
    advance(simulation, 1, { horizontal: 0, vertical: 1 });
    expect(simulation.snapshot().turtle.x).toBeGreaterThan(stopped.turtle.x);
    expect(simulation.snapshot().cameraX).toBeGreaterThan(stopped.cameraX);
    expect(simulation.snapshot().cameraBlocked).toBe(false);
    assertFinite(simulation);
  });
  it('waits at the rear margin while time and independent cargo continue, then resumes when a full jump clears the wall', () => {
    const simulation = create({}, 'full', wallFixture());
    const blocked = waitForCamera(simulation);
    expect(blocked.turtle.x - blocked.cameraX).toBeCloseTo(simulation.tuning.cameraBack, 5);
    const glass = simulation.cargo.find(item => item.definition.id === 'cocktailGlass')!;
    glass.body.setTranslation({ x: -10, y: 20 }, true);
    const glassY = glass.body.translation().y;
    advance(simulation, 1);
    const waited = simulation.snapshot();
    expect(waited.cameraX).toBeCloseTo(blocked.cameraX, 3);
    expect(waited.turtle.x).toBeCloseTo(blocked.turtle.x, 3);
    expect(waited.time - blocked.time).toBeCloseTo(1, 6);
    expect(glass.body.translation().y).toBeLessThan(glassY);
    expect(simulation.tracker.state('cocktailGlass')).toBe('lost');
    expect(waited.turtle.grounded).toBe(true);
    charge(simulation);
    expect(simulation.snapshot().turtle.jumpChargeSeconds, JSON.stringify(simulation.snapshot())).toBe(simulation.tuning.jumpMaxChargeSeconds);
    launch(simulation);
    expect(simulation.snapshot().turtle.verticalSpeed, JSON.stringify(simulation.snapshot())).toBeGreaterThan(7);
    let resumed = false;
    for (let tick = 0; tick < simulation.tuning.physicsHz * 6; tick++) {
      const previous = simulation.snapshot();
      simulation.step();
      const snapshot = simulation.snapshot();
      expect(snapshot.cameraX).toBeGreaterThanOrEqual(previous.cameraX);
      expect(snapshot.cameraX - previous.cameraX).toBeLessThanOrEqual(simulation.tuning.cameraSpeed / simulation.tuning.physicsHz + 1e-7);
      expect(snapshot.turtle.x - snapshot.cameraX).toBeGreaterThanOrEqual(simulation.tuning.cameraBack - 1e-4);
      expect(snapshot.turtle.x - previous.turtle.x).toBeLessThanOrEqual(simulation.tuning.maxSpeed / simulation.tuning.physicsHz + 1e-4);
      if (!snapshot.cameraBlocked && snapshot.cameraSpeed > 0) resumed = true;
      assertFinite(simulation);
    }
    expect(simulation.snapshot(), 'final after blocked jump').toMatchObject({ turtle: { grounded: true } });
    expect(resumed, JSON.stringify(simulation.snapshot())).toBe(true);
    expect(simulation.snapshot().turtle.x).toBeGreaterThan(11);
  });

  it('also waits for a blocking solid object, and resumes when it no longer blocks', () => {
    const simulation = create({}, 'empty');
    const obstacle = simulation.world.createCollider(RAPIER.ColliderDesc.cuboid(0.3, 1.5)
      .setTranslation(6, 1.5).setCollisionGroups((1 << 16) | 2));
    const blocked = waitForCamera(simulation);
    advance(simulation, 0.5);
    expect(simulation.snapshot().cameraX).toBe(blocked.cameraX);
    simulation.world.removeCollider(obstacle, true);
    advance(simulation, 0.5);
    expect(simulation.snapshot().cameraX).toBeGreaterThan(blocked.cameraX);
    expect(simulation.snapshot().cameraBlocked).toBe(false);
  });

  it('keeps ordinary unobstructed camera progression at its configured speed', () => {
    const simulation = create({}, 'empty');
    const before = simulation.snapshot();
    advance(simulation, 5);
    const snapshot = simulation.snapshot();
    expect(snapshot.cameraX - before.cameraX).toBeCloseTo(5 * simulation.tuning.cameraSpeed, 5);
    expect(snapshot.cameraSpeed).toBeCloseTo(simulation.tuning.cameraSpeed, 6);
    expect(snapshot.cameraBlocked).toBe(false);
  });
});
