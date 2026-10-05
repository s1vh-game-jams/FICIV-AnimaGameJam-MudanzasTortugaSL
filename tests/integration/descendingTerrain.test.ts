import { afterAll, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type RAPIER from '@dimforge/rapier2d';
import { createTuning, PHYSICS_GEOMETRY as G } from '../../src/game/config/tuning';
import type { Scenario } from '../../src/game/content/scenarios';
import { PhysicsSimulation } from '../../src/game/physics/simulation';
import type { LoadPreset, SimulationSnapshot } from '../../src/game/physics/simulation';

const slope = 0.3;
const slopeStart = 8, slopeEnd = 24;
const ramp = (direction: -1 | 1): Scenario => ({
  id: `mirrored-ramp-${direction}`, label: 'Mirrored support regression', description: 'Physical support must follow both ramp directions.',
  startX: 0, startY: 0, endX: 38,
  terrain: [{ biome: 'rock', bottom: -12, points: [
    { x: -12, y: 0 }, { x: slopeStart, y: 0 },
    { x: slopeEnd, y: direction * slope * (slopeEnd - slopeStart) },
    { x: 55, y: direction * slope * (slopeEnd - slopeStart) },
  ] }],
});
const finite = (simulation: PhysicsSimulation): boolean => {
  const values: number[] = [];
  simulation.world.forEachRigidBody(body => {
    values.push(body.translation().x, body.translation().y, body.rotation(), body.linvel().x, body.linvel().y, body.angvel());
  });
  return values.every(Number.isFinite);
};
interface Trace {
  load: LoadPreset;
  direction: -1 | 1;
  samples: readonly { x: number; proxyY: number; bodyY: number; bodyAngle: number; shellAngle: number; grounded: boolean; verticalSpeed: number }[];
  controllerSamples?: readonly { x: number; grounded: boolean; movement: { x: number; y: number }; normals: readonly { x: number; y: number }[] }[];
}
const reports: Trace[] = [];
const sample = (snapshot: SimulationSnapshot) => ({ x: snapshot.turtle.x, proxyY: snapshot.turtle.y,
  bodyY: snapshot.turtle.bodyY, bodyAngle: snapshot.turtle.bodyAngle, shellAngle: snapshot.shell.angle,
  grounded: snapshot.turtle.grounded, verticalSpeed: snapshot.turtle.verticalSpeed });

afterAll(async () => {
  const directory = join(process.cwd(), 'artifacts');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'descending-terrain.json'), JSON.stringify(reports, null, 2));
});

describe.each(['full', 'light', 'empty'] as const)('mirrored physical support with %s load', load => {
  it.each([-1, 1] as const)('transfers signed terrain pitch to the shell on ramp direction %s', direction => {
    const tuning = createTuning(), simulation = new PhysicsSimulation(ramp(direction), tuning, load);
    const samples: Trace['samples'][number][] = [];
    const controllerSamples: NonNullable<Trace['controllerSamples']>[number][] = [];
    reports.push({ load, direction, samples, controllerSamples });
    try {
      let previous = simulation.snapshot();
      for (let tick = 0; tick < tuning.physicsHz * 22 && previous.turtle.x < simulation.scenario.endX; tick++) {
        simulation.step({ horizontal: 0, vertical: 0 });
        const snapshot = simulation.snapshot();
        // Read-only diagnostic evidence; no controller parameters or physical
        // transforms are overridden to make the production route succeed.
        const controller = Reflect.get(simulation, 'controller') as RAPIER.KinematicCharacterController;
        if (snapshot.turtle.x < 0.5 || (snapshot.turtle.x > 12 && snapshot.turtle.x < 12.5)) {
          controllerSamples.push({ x: snapshot.turtle.x, grounded: controller.computedGrounded(), movement: { ...controller.computedMovement() },
            normals: Array.from({ length: controller.numComputedCollisions() }, (_, i) => controller.computedCollision(i))
              .flatMap(collision => collision ? [{ ...collision.normal1 }] : []) });
        }
        expect(finite(simulation)).toBe(true);
        expect(snapshot.turtle.x).toBeGreaterThan(previous.turtle.x);
        expect(snapshot.shell.angle).toBeCloseTo(snapshot.turtle.bodyAngle + snapshot.turtle.angle, 5);
        expect(snapshot.shell.x).toBeCloseTo(snapshot.turtle.bodyX - Math.sin(snapshot.turtle.bodyAngle) * tuning.shellPivotY, 5);
        expect(snapshot.shell.y).toBeCloseTo(snapshot.turtle.bodyY + Math.cos(snapshot.turtle.bodyAngle) * tuning.shellPivotY, 5);
        if (snapshot.turtle.x > slopeStart + 4 && snapshot.turtle.x < slopeEnd - 3) samples.push(sample(snapshot));
        previous = snapshot;
      }
      expect(samples.length).toBeGreaterThan(tuning.physicsHz);
      expect(previous.turtle.x).toBeGreaterThanOrEqual(simulation.scenario.endX);
      const expected = Math.atan(direction * slope);
      const aligned = samples.filter(row => Math.abs(row.bodyAngle - expected) < 0.04);
      expect(aligned.length / samples.length, 'Sustained actual ramp contact must align the body in either direction').toBeGreaterThan(0.9);
      expect(samples.filter(row => row.grounded).length / samples.length).toBeGreaterThan(0.9);
      // A horizontal locomotion proxy may sit above a ramp. The rotated body
      // still needs physical clearance at both ends of its capsule shaft.
      const shaft = G.turtleHalfWidth - G.turtleHalfHeight;
      for (const row of aligned) for (const end of [-1, 1]) {
        const x = row.x + end * shaft * Math.cos(row.bodyAngle) + G.turtleHalfHeight * Math.sin(row.bodyAngle);
        const y = row.bodyY + end * shaft * Math.sin(row.bodyAngle) - G.turtleHalfHeight * Math.cos(row.bodyAngle);
        const groundY = direction * slope * (x - slopeStart);
        const clearance = (y - groundY) * Math.cos(expected);
        expect(clearance).toBeGreaterThanOrEqual(-0.002);
        expect(clearance).toBeLessThan(0.12);
      }
      for (const row of aligned) {
        const shellX = row.x - Math.sin(row.bodyAngle) * tuning.shellPivotY;
        const shellY = row.bodyY + Math.cos(row.bodyAngle) * tuning.shellPivotY;
        for (let vertex = 0; vertex < G.shellVertices.length; vertex += 2) {
          const localX = G.shellVertices[vertex], localY = G.shellVertices[vertex + 1];
          const x = shellX + localX * Math.cos(row.shellAngle) - localY * Math.sin(row.shellAngle);
          const y = shellY + localX * Math.sin(row.shellAngle) + localY * Math.cos(row.shellAngle);
          const clearance = (y - direction * slope * (x - slopeStart)) * Math.cos(expected);
          expect(clearance, 'Authoritative shell hull must remain outside its actual supporting plane').toBeGreaterThanOrEqual(-G.posePenetrationTolerance);
        }
      }
    } finally { simulation.dispose(); }
  }, 30_000);
});

describe('unsupported downward motion', () => {
  it.each([-1, 1] as const)('retains departure pitch after jumping away from ramp direction %s', direction => {
    const tuning = createTuning(), simulation = new PhysicsSimulation(ramp(direction), tuning, 'empty');
    try {
      for (let tick = 0; tick < tuning.physicsHz * 10 && simulation.snapshot().turtle.x < 12; tick++) {
        simulation.step({ horizontal: 0, vertical: 0 });
      }
      simulation.step({ horizontal: -1, vertical: 0, jumpPressed: true, jumpHeld: true });
      for (let tick = 1; tick < tuning.physicsHz * tuning.jumpMaxChargeSeconds; tick++) {
        simulation.step({ horizontal: -1, vertical: 0, jumpHeld: true });
      }
      const departure = simulation.snapshot();
      expect(departure.turtle.jumpChargeSeconds).toBe(tuning.jumpMaxChargeSeconds);
      expect(departure.turtle.bodyAngle).toBeCloseTo(Math.atan(direction * slope), 1);
      simulation.step({ horizontal: 0, vertical: 0, jumpReleased: true });
      for (let tick = 0; tick < tuning.physicsHz / 4; tick++) {
        const snapshot = simulation.snapshot();
        expect(snapshot.turtle.grounded).toBe(false);
        expect(snapshot.turtle.bodyY).toBeGreaterThan(departure.turtle.bodyY);
        expect(snapshot.turtle.bodyAngle).toBeCloseTo(departure.turtle.bodyAngle, 6);
        expect(finite(simulation)).toBe(true);
        simulation.step({ horizontal: 0, vertical: 0 });
      }
    } finally { simulation.dispose(); }
  }, 30_000);

  it.each(['full', 'light', 'empty'] as const)('%s load falls freely after a cliff instead of snapping to the distant floor', load => {
    const cliff: Scenario = { id: 'cliff-regression', label: 'Cliff', description: 'No terrain snap across a six-metre fall.',
      startX: 0, startY: 0, endX: 35, terrain: [{ biome: 'rock', bottom: -12,
        points: [{ x: -12, y: 0 }, { x: 8, y: 0 }, { x: 8.001, y: -6 }, { x: 55, y: -6 }] }] };
    const tuning = createTuning(), simulation = new PhysicsSimulation(cliff, tuning, load);
    try {
      let previous = simulation.snapshot(), freeFallTicks = 0, firstUnsupportedY: number | undefined;
      for (let tick = 0; tick < tuning.physicsHz * 10 && previous.turtle.x < 16; tick++) {
        simulation.step({ horizontal: 0, vertical: 0 });
        const snapshot = simulation.snapshot();
        expect(finite(simulation)).toBe(true);
        if (snapshot.turtle.x > 8 + G.turtleHalfWidth + 0.1 && snapshot.turtle.bodyY > -4.5) {
          expect(snapshot.turtle.grounded).toBe(false);
          expect(snapshot.turtle.bodyY).toBeGreaterThan(previous.turtle.bodyY - 0.4);
          expect(snapshot.turtle.bodyAngle).toBeCloseTo(previous.turtle.bodyAngle, 6);
          if (firstUnsupportedY === undefined) firstUnsupportedY = snapshot.turtle.bodyY;
          freeFallTicks++;
        }
        previous = snapshot;
      }
      expect(freeFallTicks).toBeGreaterThan(5);
      expect(firstUnsupportedY).toBeGreaterThan(-2);
    } finally { simulation.dispose(); }
  }, 30_000);
});
