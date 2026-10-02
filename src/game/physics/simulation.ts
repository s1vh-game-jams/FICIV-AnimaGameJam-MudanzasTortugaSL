import RAPIER from '@dimforge/rapier2d';
import { PHYSICS_GEOMETRY as G, validateTuning } from '../config/tuning';
import type { Tuning } from '../config/tuning';
import { CARGO } from '../content/cargo';
import type { CargoDefinition, CargoKind } from '../content/cargo';
import { terrainAt } from '../content/scenarios';
import type { Biome, Scenario } from '../content/scenarios';
import { NO_CONTROLS } from '../core/input';
import type { Controls } from '../core/input';
import { CargoTracker } from '../systems/cargoGraph';
import type { CargoState, ContactEdge } from '../systems/cargoGraph';
import { approach, nextShellAngle, targetSpeed } from '../systems/controller';

const groups = (member: number, filter: number) => (member << 16) | filter;
const TERRAIN = 1, TURTLE = 2, CARGO_GROUP = 4, SHELL = 8, LOST = 16;
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
export type LoadPreset = 'full' | 'light';
interface CargoBody { definition: CargoDefinition; body: RAPIER.RigidBody; colliders: RAPIER.Collider[] }
export interface SimulationSnapshot {
  scenarioId: string; tick: number; time: number; cameraX: number; cameraY: number;
  turtle: { x: number; y: number; angle: number; speed: number; verticalSpeed: number; biome: Biome; mass: number };
  cargo: readonly { id: CargoKind; label: string; x: number; y: number; angle: number; state: CargoState; separatedSeconds: number }[];
  contacts: readonly ContactEdge[];
}

/** Rapier alone owns all physical transforms. No renderer/DOM dependency. */
export class PhysicsSimulation {
  readonly world: RAPIER.World;
  readonly tracker: CargoTracker;
  readonly cargo: CargoBody[] = [];
  private turtle: RAPIER.RigidBody;
  private turtleCollider: RAPIER.Collider;
  private shell: RAPIER.RigidBody;
  private controller: RAPIER.KinematicCharacterController;
  private colliderIds = new Map<number, string>();
  private shellCollider: RAPIER.Collider;
  private angle = 0;
  private angularSpeed = 0;
  private speed = 0;
  private verticalSpeed = 0;
  private water = false;
  private grounded = true;
  private groundSlope = 0;
  private biome: Biome = 'grass';
  private contacts: ContactEdge[] = [];
  private tickCount = 0;
  private cameraX: number;
  private cameraY: number;
  private disposed = false;

  constructor(readonly scenario: Scenario, readonly tuning: Tuning, readonly load: LoadPreset = 'full') {
    validateTuning(tuning);
    this.world = new RAPIER.World({ x: 0, y: -tuning.gravity });
    this.world.timestep = 1 / tuning.physicsHz;
    this.world.numSolverIterations = G.solverIterations;
    this.world.numInternalPgsIterations = G.internalSolverIterations;
    this.cameraX = scenario.startX - G.initialCameraOffset;
    this.cameraY = scenario.startY;
    this.speed = tuning.baseSpeed;
    for (const strip of scenario.terrain) {
      for (let i = 1; i < strip.points.length; i++) {
        const a = strip.points[i - 1], b = strip.points[i];
        const shape = RAPIER.ColliderDesc.convexHull(new Float32Array([a.x, a.y, b.x, b.y, b.x, G.terrainFloorY, a.x, G.terrainFloorY]));
        if (!shape) throw new Error('Invalid terrain geometry');
        this.world.createCollider(shape.setFriction(strip.biome === 'rock' ? G.rockFriction : G.grassFriction)
          .setRestitution(0).setCollisionGroups(groups(TERRAIN, TURTLE | CARGO_GROUP | LOST)));
      }
    }
    const position = { x: scenario.startX, y: scenario.startY + G.turtleHalfHeight + G.controllerOffset };
    this.turtle = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x, position.y));
    this.turtleCollider = this.world.createCollider(RAPIER.ColliderDesc.capsule(G.turtleHalfWidth - G.turtleHalfHeight, G.turtleHalfHeight).setRotation(Math.PI / 2)
      .setCollisionGroups(groups(TURTLE, TERRAIN)), this.turtle);
    this.controller = this.world.createCharacterController(G.controllerOffset);
    this.controller.setNormalNudgeFactor(G.controllerNudge);
    this.controller.enableAutostep(G.stepHeight, G.stepMinWidth, false);
    // Gravity provides ground following; snapping repeatedly erases the
    // numerical clearance used by the controller at shallow contact angles.
    this.controller.setMaxSlopeClimbAngle(G.maxClimbAngle);
    this.controller.setMinSlopeSlideAngle(G.maxClimbAngle);
    this.shell = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y + G.shellPivotY));
    const shellShape = RAPIER.ColliderDesc.convexHull(new Float32Array(G.shellVertices));
    if (!shellShape) throw new Error('Invalid shell geometry');
    this.shellCollider = this.world.createCollider(shellShape.setFriction(tuning.cargoFriction)
      .setCollisionGroups(groups(SHELL, CARGO_GROUP)), this.shell);
    this.colliderIds.set(this.shellCollider.handle, 'shell');
    const definitions = load === 'light' ? CARGO.filter(d => d.id === 'sofa') : CARGO;
    this.tracker = new CargoTracker(definitions.map(d => d.id), tuning.lossGraceSeconds);
    for (const definition of definitions) this.createCargo(definition);
    // Fixed stationary settling gives a repeatable supported stack at tick zero.
    for (let i = 0; i < G.settleTicks; i++) this.world.step();
    this.contacts = this.readContacts();
    this.tracker.update(this.contacts, 0);
    for (const c of this.cargo) c.body.setLinvel({ x: tuning.baseSpeed, y: 0 }, true);
  }

  private createCargo(d: CargoDefinition): void {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(this.scenario.startX + d.x, this.scenario.startY + d.y)
      .setAdditionalMassProperties(d.mass, { x: 0, y: d.centerOfMassY },
        d.mass * (d.width * d.width + d.height * d.height) / 12)
      .setLinearDamping(this.tuning.cargoLinearDamping)
      .setAngularDamping(this.tuning.cargoAngularDamping).setCcdEnabled(true));
    const shapes = d.shapes.map(shape => {
      if (shape.kind === 'box') return RAPIER.ColliderDesc.cuboid(shape.halfWidth, shape.halfHeight).setTranslation(shape.x, shape.y);
      const hull = RAPIER.ColliderDesc.convexHull(new Float32Array(shape.vertices));
      if (!hull) throw new Error('Invalid cargo geometry: ' + d.id);
      return hull;
    });
    const colliders = shapes.map(shape => {
      const collider = this.world.createCollider(shape.setDensity(0)
        .setFriction(this.tuning.cargoFriction).setRestitution(0)
        .setCollisionGroups(groups(CARGO_GROUP, TERRAIN | CARGO_GROUP | SHELL)), body);
      this.colliderIds.set(collider.handle, d.id);
      return collider;
    });
    this.cargo.push({ definition: d, body, colliders });
  }

  get mass(): number {
    return this.cargo.reduce((sum, c) => sum + (this.tracker.state(c.definition.id) === 'lost' ? 0 : c.definition.mass), 0);
  }

  step(input: Controls = NO_CONTROLS): void {
    if (this.disposed) throw new Error('Simulation already disposed');
    const dt = this.world.timestep;
    const t = this.tuning;
    const position = this.turtle.translation();
    // Diagnostics stop at the scenario's authored end; this is not a game finish.
    if (position.x >= this.scenario.endX) return;
    const horizontal = clamp(Number.isFinite(input.horizontal) ? input.horizontal : 0, -1, 1);
    const vertical = clamp(Number.isFinite(input.vertical) ? input.vertical : 0, -1, 1);
    const region = this.scenario.water;
    const previousWater = this.water;
    this.water = !!region && position.x >= region.left && position.x <= region.right &&
      position.y <= region.surface + (previousWater ? t.waterExitMargin : G.turtleHalfHeight);
    this.biome = this.water ? 'water' : terrainAt(this.scenario, position.x).biome;
    const depth = region && this.water ? Math.max(0, region.surface - position.y) : 0;
    const current = region && this.water ? t.waterCurrent * clamp(depth / (region.surface - region.bottom), 0, 1) : 0;
    const screenX = position.x - this.cameraX;
    const pressure = targetSpeed(horizontal, screenX, t, current);
    // Smooth speed correction also recovers realized terrain/controller drift.
    const rearRecovery = Math.max(0, t.cameraBack + t.cameraGuardMargin - screenX);
    const frontRecovery = Math.max(0, screenX - t.cameraFront + t.cameraGuardMargin);
    const desired = clamp(pressure + (rearRecovery - frontRecovery) * t.cameraRecovery, t.minSpeed, t.maxSpeed + current);
    this.speed = approach(this.speed, desired, (desired > this.speed ? t.acceleration : t.braking) * dt);
    const previousVerticalSpeed = this.turtle.linvel().y;
    if (this.water && region) {
      const targetY = Math.max(region.bottom + G.turtleHalfHeight + G.waterBottomClearance, region.surface - t.waterBaseDepth - this.mass * t.waterDepthPerKg);
      const rise = (targetY - position.y) * t.waterRiseAcceleration / (1 + this.mass * t.waterWeightInfluence);
      this.verticalSpeed += (rise - this.verticalSpeed * t.waterDrag + vertical * t.waterSwimAcceleration) * dt;
      this.verticalSpeed = clamp(this.verticalSpeed, -t.waterMaxVerticalSpeed, t.waterMaxVerticalSpeed);
    } else {
      this.verticalSpeed -= t.gravity * dt;
      const tilt = nextShellAngle(this.angle, this.angularSpeed, vertical, dt, t);
      this.angle = tilt.angle; this.angularSpeed = tilt.speed;
    }
    // Follow the last supporting contact tangent so the KCC does not reduce
    // horizontal intent by projecting it a second time along an uphill slope.
    const supportSlope = this.grounded && this.verticalSpeed <= 0 ? this.groundSlope : 0;
    const desiredMovement = { x: (this.speed - this.verticalSpeed * supportSlope) * dt,
      y: (this.verticalSpeed + this.speed * supportSlope) * dt };
    this.controller.computeColliderMovement(this.turtleCollider, desiredMovement,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
    const movement = this.controller.computedMovement();
    const grounded = this.controller.computedGrounded();
    this.groundSlope = 0;
    if (grounded) for (let i = 0; i < this.controller.numComputedCollisions(); i++) {
      const normal = this.controller.computedCollision(i)?.normal1;
      if (normal && normal.y >= Math.cos(G.maxClimbAngle)) this.groundSlope = -normal.x / normal.y;
    }
    const landingDelta = grounded && !this.grounded && this.verticalSpeed < 0 ? -this.verticalSpeed : 0;
    this.grounded = grounded;
    if (grounded && this.verticalSpeed < 0) this.verticalSpeed = 0;
    const next = { x: position.x + movement.x, y: position.y + movement.y };
    this.turtle.setNextKinematicTranslation(next);
    this.shell.setNextKinematicTranslation({ x: next.x, y: next.y + G.shellPivotY });
    this.shell.setNextKinematicRotation(this.angle);
    const connected = new Set(this.tracker.connectedIds());
    const landingDamping = this.biome === 'grass' ? t.grassLandingDamping : t.rockLandingDamping;
    for (const c of this.cargo) {
      c.body.resetForces(false);
      if (this.tracker.state(c.definition.id) === 'lost') continue;
      // World-space damping must not slow the stack's freefall while the
      // kinematic carrier falls with undamped gravity. Keep angular damping.
      c.body.setLinearDamping(this.grounded || this.water ? t.cargoLinearDamping : 0);
      if (connected.has(c.definition.id)) {
        const velocity = c.body.linvel();
        c.body.addForce({ x: c.definition.mass * (this.speed - velocity.x) * t.gripAssistance, y: 0 }, true);
      }
      if (this.water) {
        // Vertical cushioning preserves the load on water entry. Water never
        // applies a lateral force to cargo: current acts on the carrier only.
        const velocity = c.body.linvel();
        const carrierVerticalSpeed = movement.y / dt;
        const entryDelta = !previousWater ? carrierVerticalSpeed - previousVerticalSpeed : 0;
        const y = carrierVerticalSpeed + (velocity.y + entryDelta - carrierVerticalSpeed) * Math.exp(-t.waterEntryDamping * dt);
        c.body.setLinvel({ x: velocity.x, y }, true);
      } else if (landingDelta > 0 && landingDamping > 0) {
        const velocity = c.body.linvel();
        c.body.setLinvel({ x: velocity.x, y: velocity.y + landingDelta * landingDamping }, true);
      }
    }
    this.world.step();
    this.contacts = this.readContacts();
    const previouslyLost = new Set(this.tracker.lostIds());
    this.tracker.update(this.contacts, dt);
    for (const c of this.cargo) if (this.tracker.state(c.definition.id) === 'lost' && !previouslyLost.has(c.definition.id)) {
      for (const collider of c.colliders) collider.setCollisionGroups(groups(LOST, TERRAIN));
      c.body.resetForces(true);
    }
    this.tickCount++;
    this.cameraX += t.cameraSpeed * dt;
    this.cameraY = approach(this.cameraY, this.turtle.translation().y - G.turtleHalfHeight, dt * t.cameraVerticalSpeed);
  }

  private readContacts(): ContactEdge[] {
    const found = new Map<string, ContactEdge>();
    const scan = (collider: RAPIER.Collider) => {
      const a = this.colliderIds.get(collider.handle);
      if (!a) return;
      this.world.contactPairsWith(collider, other => {
        const b = this.colliderIds.get(other.handle);
        if (!b || a === b) return;
        let supporting = false;
        this.world.contactPair(collider, other, manifold => {
          for (let i = 0; i < manifold.numContacts(); i++) if (manifold.contactDist(i) <= G.contactTolerance) supporting = true;
        });
        if (supporting) {
          const pair = [a, b].sort();
          found.set(pair.join('|'), { a: pair[0], b: pair[1] });
        }
      });
    };
    scan(this.shellCollider);
    for (const c of this.cargo) if (this.tracker.state(c.definition.id) !== 'lost') for (const collider of c.colliders) scan(collider);
    return [...found.values()];
  }

  snapshot(): SimulationSnapshot {
    const position = this.turtle.translation();
    return {
      scenarioId: this.scenario.id, tick: this.tickCount, time: this.tickCount / this.tuning.physicsHz,
      cameraX: this.cameraX, cameraY: this.cameraY,
      turtle: { x: position.x, y: position.y, angle: this.angle, speed: this.speed,
        verticalSpeed: this.verticalSpeed, biome: this.biome, mass: this.mass },
      cargo: this.cargo.map(c => ({ id: c.definition.id, label: c.definition.label,
        x: c.body.translation().x, y: c.body.translation().y, angle: c.body.rotation(),
        state: this.tracker.state(c.definition.id), separatedSeconds: this.tracker.separatedSeconds(c.definition.id) })),
      contacts: this.contacts,
    };
  }
  debugVertices(): Float32Array { return this.world.debugRender().vertices; }
  dispose(): void {
    if (!this.disposed) { this.world.free(); this.disposed = true; }
  }
}
