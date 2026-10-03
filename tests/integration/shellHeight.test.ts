import RAPIER from '@dimforge/rapier2d';
import { afterEach, describe, expect, it } from 'vitest';
import { createTuning, withTuning } from '../../src/game/config/tuning';
import { SCENARIOS } from '../../src/game/content/scenarios';
import { PhysicsSimulation } from '../../src/game/physics/simulation';

const live: PhysicsSimulation[] = [];
const create = (shellPivotY: number) => {
  const simulation = new PhysicsSimulation(SCENARIOS[0], withTuning(createTuning(), { shellPivotY }), 'full');
  live.push(simulation);
  return simulation;
};

/** Inspect actual Rapier geometry, independent of the authored shape definitions. */
function colliderGeometry(simulation: PhysicsSimulation) {
  return simulation.world.colliders.getAll().map(collider => {
    const shape = collider.shape;
    let dimensions: object;
    if (shape instanceof RAPIER.Capsule) dimensions = { radius: shape.radius, halfHeight: shape.halfHeight };
    else if (shape instanceof RAPIER.Cuboid) dimensions = { halfExtents: { ...shape.halfExtents } };
    else if (shape instanceof RAPIER.ConvexPolygon) dimensions = { vertices: Array.from(shape.vertices) };
    else throw new Error('Unexpected collider shape in the shell-height fixture: ' + shape.type);
    return {
      type: shape.type, dimensions, volume: collider.volume(),
      localTranslation: collider.translationWrtParent(), localRotation: collider.rotationWrtParent(),
      bodyType: collider.parent()?.bodyType(), collisionGroups: collider.collisionGroups(),
    };
  });
}

function bodyMassProperties(simulation: PhysicsSimulation) {
  const properties: { type: RAPIER.RigidBodyType; mass: number; inertia: number; localCom: RAPIER.Vector }[] = [];
  simulation.world.forEachRigidBody(body => properties.push({
    type: body.bodyType(), mass: body.mass(), inertia: body.principalInertia(), localCom: body.localCom(),
  }));
  return properties;
}

afterEach(() => { for (const simulation of live.splice(0)) simulation.dispose(); });

describe('adjustable shell registration preserves independent geometry', () => {
  it.each([0.42, 0.55])('moves support and settled cargo by the %.2f m pivot difference without resizing', shellPivotY => {
    const original = create(0.30);
    const raised = create(shellPivotY);
    const lower = original.snapshot(), upper = raised.snapshot();
    const difference = shellPivotY - 0.30;

    expect(colliderGeometry(raised)).toEqual(colliderGeometry(original));
    expect(bodyMassProperties(raised)).toEqual(bodyMassProperties(original));
    expect(upper.turtle).toEqual(lower.turtle);
    expect(upper.shell.x).toBe(lower.shell.x);
    expect(upper.shell.angle).toBe(lower.shell.angle);
    expect(upper.shell.y - lower.shell.y).toBeCloseTo(difference, 5);
    expect(upper.turtle.mass).toBe(lower.turtle.mass);
    expect(upper.cargo).toHaveLength(lower.cargo.length);
    for (const item of upper.cargo) {
      const before = lower.cargo.find(candidate => candidate.id === item.id)!;
      expect(item.x).toBeCloseTo(before.x, 4);
      expect(item.y - before.y).toBeCloseTo(difference, 4);
      expect(item.angle).toBeCloseTo(before.angle, 4);
      expect(item.state).toBe(before.state);
      expect(item.separatedSeconds).toBe(before.separatedSeconds);
    }
  });

  it.each([0.30, 0.42, 0.55])('reconstructs a deterministic %.2f m support/load configuration', shellPivotY => {
    const first = create(shellPivotY), reset = create(shellPivotY);
    expect(reset.snapshot()).toEqual(first.snapshot());
    expect(colliderGeometry(reset)).toEqual(colliderGeometry(first));
    for (let tick = 0; tick < first.tuning.physicsHz; tick++) {
      first.step(); reset.step();
      expect(reset.snapshot()).toEqual(first.snapshot());
    }
  });
});
