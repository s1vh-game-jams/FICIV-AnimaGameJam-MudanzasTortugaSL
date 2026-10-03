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
import { JumpCharge } from '../systems/jumpCharge';

const groups = (member: number, filter: number) => (member << 16) | filter;
const TERRAIN = 1, TURTLE = 2, CARGO_GROUP = 4, SHELL = 8, LOST = 16;
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
const POSE_CLEARANCE_SEARCH_STEPS = 8;
const SHELL_ROTATION_RADIUS = Math.max(...Array.from({ length: G.shellVertices.length / 2 }, (_, i) =>
  Math.hypot(G.shellVertices[i * 2], G.shellVertices[i * 2 + 1])));
export type LoadPreset = 'full' | 'light' | 'empty';
interface CargoBody { definition: CargoDefinition; body: RAPIER.RigidBody; colliders: RAPIER.Collider[] }
export interface SimulationSnapshot {
  scenarioId: string; tick: number; time: number; cameraX: number; cameraY: number;
  turtle: { x: number; y: number; bodyX: number; bodyY: number; angle: number; bodyAngle: number; speed: number; verticalSpeed: number; biome: Biome; mass: number;
    grounded: boolean; jumpCharging: boolean; jumpChargeSeconds: number };
  shell: { x: number; y: number; angle: number };
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
  private terrainSlopes = new Map<number, number>();
  private shellCollider: RAPIER.Collider;
  private angle = 0;
  private bodyAngle = 0;
  private bodyOffsetY = 0;
  private angularSpeed = 0;
  private jump = new JumpCharge();
  private speed = 0;
  private verticalSpeed = 0;
  private water = false;
  private grounded = true;
  private groundSlope = 0;
  private groundAngle = 0;
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
    this.cameraX = scenario.startX - (tuning.cameraBack + tuning.cameraFront) / 2;
    this.cameraY = scenario.startY;
    this.speed = tuning.baseSpeed;
    for (const strip of scenario.terrain) {
      for (let i = 1; i < strip.points.length; i++) {
        const a = strip.points[i - 1], b = strip.points[i];
        const shape = RAPIER.ColliderDesc.convexHull(new Float32Array([a.x, a.y, b.x, b.y, b.x, G.terrainFloorY, a.x, G.terrainFloorY]));
        if (!shape) throw new Error('Invalid terrain geometry');
        const collider = this.world.createCollider(shape.setFriction(strip.biome === 'rock' ? G.rockFriction : G.grassFriction)
          .setRestitution(0).setCollisionGroups(groups(TERRAIN, TURTLE | CARGO_GROUP | LOST)));
        this.terrainSlopes.set(collider.handle, (b.y - a.y) / (b.x - a.x));
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
    // Tiny numerical tolerance does not expand the authored/pose slope limit.
    const climbTolerance = Math.atan(G.controllerNudge);
    this.controller.setMaxSlopeClimbAngle(tuning.shellMaxAngle + climbTolerance);
    this.controller.setMinSlopeSlideAngle(tuning.shellMaxAngle + climbTolerance);
    this.shell = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y + G.shellPivotY));
    const shellShape = RAPIER.ColliderDesc.convexHull(new Float32Array(G.shellVertices));
    if (!shellShape) throw new Error('Invalid shell geometry');
    this.shellCollider = this.world.createCollider(shellShape.setFriction(tuning.cargoFriction)
      .setCollisionGroups(groups(SHELL, CARGO_GROUP)), this.shell);
    this.colliderIds.set(this.shellCollider.handle, 'shell');
    const definitions = load === 'empty' ? [] : load === 'light' ? CARGO.filter(d => d.id === 'sofa') : CARGO;
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
      .setTranslation(this.scenario.startX + d.x,
        this.scenario.startY + d.y + G.shellPivotY - G.cargoLayoutShellPivotY)
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

  cancelJump(): void { this.jump.cancel(); }

  private shellPose(position: RAPIER.Vector, bodyAngle: number, manualAngle: number, bodyOffsetY = this.bodyOffsetY) {
    return { x: position.x - Math.sin(bodyAngle) * G.shellPivotY,
      y: position.y + bodyOffsetY + Math.cos(bodyAngle) * G.shellPivotY, angle: bodyAngle + manualAngle };
  }

  private supportOffset(position: RAPIER.Vector, bodyAngle: number, grounded: boolean): number {
    const maximumShift = G.turtleHalfWidth * this.tuning.shellAngularSpeed * this.world.timestep;
    if (grounded) {
      // The fixed horizontal KCC remains the locomotion proxy. A bounded
      // rotated-shape floor query supplies the actual body/support origin.
      const castStart = { x: position.x, y: position.y + G.turtleHalfWidth };
      const hit = this.world.castShape(castStart, Math.PI / 2 + bodyAngle, { x: 0, y: -1 },
        this.turtleCollider.shape, G.controllerOffset, G.turtleHalfWidth * 2, true,
        RAPIER.QueryFilterFlags.EXCLUDE_SENSORS | RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
        groups(TURTLE, TERRAIN), undefined, undefined, collider => this.terrainSlopes.has(collider.handle));
      if (hit) {
        const required = castStart.y - hit.time_of_impact - position.y;
        // Lowering is smooth. Upward clearance always wins over smoothing.
        return Math.max(required, approach(this.bodyOffsetY, required, maximumShift));
      }
    }
    return this.water ? approach(this.bodyOffsetY, 0, maximumShift) : this.bodyOffsetY;
  }

  private castShellPose(position: RAPIER.Vector, bodyAngle: number, manualAngle: number, bodyOffsetY = this.bodyOffsetY) {
    const next = this.shellPose(position, bodyAngle, manualAngle, bodyOffsetY);
    const current = this.shell.translation();
    const angleChange = next.angle - this.shell.rotation();
    const flags = RAPIER.QueryFilterFlags.EXCLUDE_SENSORS | RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC;
    const finalHit = this.world.castShape(next, next.angle, { x: 0, y: 0 }, this.shellCollider.shape,
      G.controllerNudge, 0, true, flags, groups(TURTLE, TERRAIN));
    if (finalHit) return finalHit;
    const delta = { x: next.x - current.x, y: next.y - current.y };
    if (angleChange === 0) return this.world.castShape(current, next.angle,
      delta, this.shellCollider.shape, G.controllerNudge / 2, 1, false, flags, groups(TURTLE, TERRAIN));
    // Rapier has no rotational sweep. The convex envelope of departure and
    // arrival hulls covers translation and their vertex chords. Inflate only
    // by the angular sagitta to cover the curved motion between those chords.
    // The endpoint keeps the full numerical gap; the sweep uses half that gap
    // so float rounding at the already-safe departure cannot trap recovery.
    const vertices: number[] = [];
    for (let i = 0; i < G.shellVertices.length; i += 2) {
      const x = G.shellVertices[i], y = G.shellVertices[i + 1];
      for (const endpoint of [false, true]) {
        const rotation = endpoint ? next.angle : this.shell.rotation();
        vertices.push(x * Math.cos(rotation) - y * Math.sin(rotation) + (endpoint ? delta.x : 0),
          x * Math.sin(rotation) + y * Math.cos(rotation) + (endpoint ? delta.y : 0));
      }
    }
    const envelope = new RAPIER.ConvexPolygon(new Float32Array(vertices), false);
    const sagitta = SHELL_ROTATION_RADIUS * (1 - Math.cos(angleChange / 2));
    return this.world.castShape(current, 0, { x: 0, y: 0 }, envelope,
      sagitta + G.controllerNudge / 2, 0, true, flags, groups(TURTLE, TERRAIN));
  }

  private alignShell(position: RAPIER.Vector, bodyAngle: number, manualAngle: number, grounded: boolean): RAPIER.Vector {
    let fraction = 1;
    let accepted = false;
    for (let attempt = 0; attempt < POSE_CLEARANCE_SEARCH_STEPS; attempt++) {
      const body = this.bodyAngle + (bodyAngle - this.bodyAngle) * fraction;
      const manual = this.angle + (manualAngle - this.angle) * fraction;
      const targetOffset = this.supportOffset(position, body, grounded);
      const offset = targetOffset > this.bodyOffsetY ? targetOffset :
        this.bodyOffsetY + (targetOffset - this.bodyOffsetY) * fraction;
      if (!this.castShellPose(position, body, manual, offset)) {
        this.bodyAngle = body; this.angle = manual; this.bodyOffsetY = offset;
        accepted = true;
        break;
      }
      fraction /= 2;
    }
    if (!accepted) {
      // Keep the last safe angles and resolve translation against the actual
      // support. A rejected rotation must not bypass collision clearance.
      const origin = this.turtle.translation();
      let candidate = position;
      for (let attempt = 0; attempt < POSE_CLEARANCE_SEARCH_STEPS; attempt++) {
        const hit = this.castShellPose(candidate, this.bodyAngle, this.angle);
        if (!hit) { position = candidate; accepted = true; break; }
        const delta = { x: candidate.x - origin.x, y: candidate.y - origin.y };
        const travel = Math.max(0, hit.time_of_impact - G.controllerNudge / Math.max(Math.hypot(delta.x, delta.y), G.controllerNudge));
        const remaining = { x: delta.x * (1 - travel), y: delta.y * (1 - travel) };
        const intoObstacle = Math.min(0, remaining.x * hit.normal1.x + remaining.y * hit.normal1.y);
        const sliding = { x: delta.x * travel + remaining.x - intoObstacle * hit.normal1.x,
          y: delta.y * travel + remaining.y - intoObstacle * hit.normal1.y };
        this.controller.computeColliderMovement(this.turtleCollider, sliding,
          RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
        const movement = this.controller.computedMovement();
        candidate = { x: origin.x + movement.x, y: origin.y + movement.y };
      }
      if (!accepted) position = origin;
      this.angularSpeed = 0;
    }
    const pose = this.shellPose(position, this.bodyAngle, this.angle);
    this.shell.setNextKinematicTranslation(pose);
    this.shell.setNextKinematicRotation(pose.angle);
    return position;
  }

  step(input: Controls = NO_CONTROLS): void {
    if (this.disposed) throw new Error('Simulation already disposed');
    const dt = this.world.timestep;
    const t = this.tuning;
    const position = this.turtle.translation();
    const bodyY = position.y + this.bodyOffsetY;
    // Diagnostics stop at the scenario's authored end; this is not a game finish.
    if (position.x >= this.scenario.endX) return;
    const horizontal = clamp(Number.isFinite(input.horizontal) ? input.horizontal : 0, -1, 1);
    const vertical = clamp(Number.isFinite(input.vertical) ? input.vertical : 0, -1, 1);
    const region = this.scenario.water;
    const previousWater = this.water;
    this.water = !!region && position.x >= region.left && position.x <= region.right &&
      bodyY <= region.surface + (previousWater ? t.waterExitMargin : G.turtleHalfHeight);
    this.biome = this.water ? 'water' : terrainAt(this.scenario, position.x).biome;
    const depth = region && this.water ? Math.max(0, region.surface - bodyY) : 0;
    const current = region && this.water ? t.waterCurrent * clamp(depth / (region.surface - region.bottom), 0, 1) : 0;
    const screenX = position.x - this.cameraX;
    const pressure = targetSpeed(horizontal, screenX, t, current);
    // Smooth speed correction also recovers realized terrain/controller drift.
    const rearRecovery = Math.max(0, t.cameraBack + t.cameraGuardMargin - screenX);
    const frontRecovery = Math.max(0, screenX - t.cameraFront + t.cameraGuardMargin);
    const desired = clamp(pressure + (rearRecovery - frontRecovery) * t.cameraRecovery, t.minSpeed, t.maxSpeed + current);
    this.speed = approach(this.speed, desired, (desired > this.speed ? t.acceleration : t.braking) * dt);
    const previousVerticalSpeed = this.shell.linvel().y;
    const previousShellY = this.shell.translation().y;
    const jumpFraction = this.jump.update(input, !this.water && this.grounded, dt, t.jumpMaxChargeSeconds);
    const launching = jumpFraction !== undefined && jumpFraction > 0;
    let launchVelocityChange = 0;
    let desiredManualAngle: number;
    if (this.water && region) {
      // Keep the incoming physical velocity. Drag and over-speed cushioning
      // amortize entry instead of discarding momentum with an instant clamp.
      if (!previousWater) this.verticalSpeed = previousVerticalSpeed;
      const targetY = Math.max(region.bottom + G.turtleHalfHeight + G.waterBottomClearance, region.surface - t.waterBaseDepth - this.mass * t.waterDepthPerKg);
      const rise = (targetY - bodyY) * t.waterRiseAcceleration / (1 + this.mass * t.waterWeightInfluence);
      const swim = vertical * t.waterSwimAcceleration / (1 + this.mass * t.waterSwimWeightInfluence);
      const incomingSpeed = this.verticalSpeed;
      this.verticalSpeed += (rise - this.verticalSpeed * t.waterDrag + swim) * dt;
      const limited = clamp(this.verticalSpeed, -t.waterMaxVerticalSpeed, t.waterMaxVerticalSpeed);
      this.verticalSpeed = Math.abs(incomingSpeed) <= t.waterMaxVerticalSpeed ? limited :
        this.verticalSpeed + (limited - this.verticalSpeed) * (1 - Math.exp(-t.waterEntryDamping * dt));
      desiredManualAngle = approach(this.angle, 0, t.shellAngularSpeed * dt);
      this.angularSpeed = 0;
    } else {
      if (launching) {
        this.verticalSpeed = jumpFraction * t.jumpMaxLaunchSpeed;
        launchVelocityChange = this.verticalSpeed - previousVerticalSpeed;
      }
      this.verticalSpeed -= t.gravity * dt;
      const tilt = nextShellAngle(this.angle, this.angularSpeed, vertical, dt, t);
      desiredManualAngle = tilt.angle; this.angularSpeed = tilt.speed;
    }
    // Follow the last supporting contact tangent so the KCC does not reduce
    // horizontal intent by projecting it a second time along an uphill slope.
    const supportSlope = this.grounded && this.verticalSpeed <= 0 ? this.groundSlope : 0;
    const desiredMovement = { x: (this.speed - this.verticalSpeed * supportSlope) * dt,
      y: (this.verticalSpeed + this.speed * supportSlope) * dt };
    this.controller.computeColliderMovement(this.turtleCollider, desiredMovement,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
    const movement = this.controller.computedMovement();
    let grounded = this.controller.computedGrounded() && (this.water || this.verticalSpeed <= 0);
    if (!grounded) this.groundSlope = 0;
    let support: { angle: number; slope: number } | undefined;
    if (grounded) for (let i = 0; i < this.controller.numComputedCollisions(); i++) {
      const collision = this.controller.computedCollision(i);
      if (!collision) continue;
      // A prism's convex corner can support the capsule with a horizontal
      // normal even when its top face slopes. Authored pitch is authoritative
      // only when that actual contact normal agrees with the top face.
      if (collision.normal1.y <= 0 || !collision.collider) continue;
      const normalAngle = Math.atan2(-collision.normal1.x, collision.normal1.y);
      const authoredSlope = this.terrainSlopes.get(collision.collider.handle);
      const authoredAngle = authoredSlope === undefined ? normalAngle : Math.atan(authoredSlope);
      const agreesWithFace = Math.abs(normalAngle - authoredAngle) <= Math.atan(G.controllerNudge);
      const angle = agreesWithFace ? authoredAngle : normalAngle;
      if (Math.abs(angle) <= t.shellMaxAngle + Math.atan(G.controllerNudge)) {
        const candidate = { angle: clamp(angle, -t.shellMaxAngle, t.shellMaxAngle),
          slope: clamp(-collision.normal1.x / collision.normal1.y,
            -Math.tan(t.shellMaxAngle), Math.tan(t.shellMaxAngle)) };
        // When bridging a join, prefer the flatter actual support. The signed
        // tie break keeps collision iteration order from choosing the posture.
        if (!support || Math.abs(candidate.angle) < Math.abs(support.angle) ||
          (Math.abs(candidate.angle) === Math.abs(support.angle) && candidate.angle < support.angle)) support = candidate;
      }
    }
    // Rapier can report grounded without a new sweep collision. Retain the
    // confirmed support instead of alternating its pitch with zero each tick.
    if (support) { this.groundAngle = support.angle; this.groundSlope = support.slope; }
    const requested = { x: position.x + movement.x, y: position.y + movement.y };
    const desiredBodyAngle = this.water ? 0 : grounded ? this.groundAngle : this.bodyAngle;
    const next = this.alignShell(requested, approach(this.bodyAngle, desiredBodyAngle, t.shellAngularSpeed * dt), desiredManualAngle, grounded);
    movement.x = next.x - position.x; movement.y = next.y - position.y;
    grounded = this.controller.computedGrounded() && (this.water || this.verticalSpeed <= 0);
    const landingDelta = grounded && !this.grounded && this.verticalSpeed < 0 ? -this.verticalSpeed : 0;
    this.grounded = grounded;
    if (grounded && this.verticalSpeed < 0) this.verticalSpeed = 0;
    if (launching) {
      // A ceiling or another terrain constraint must not leave cargo with an
      // impulse the carrier could not execute. Rapier resolves support/gravity.
      const acceptedSupportSpeed = (this.shellPose(next, this.bodyAngle, this.angle).y - previousShellY) / dt;
      launchVelocityChange = acceptedSupportSpeed > 0 ? Math.max(0,
        Math.min(launchVelocityChange, acceptedSupportSpeed - previousVerticalSpeed)) : 0;
      if (next.y !== requested.y) this.verticalSpeed = movement.y / dt;
    }
    this.turtle.setNextKinematicTranslation(next);
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
        if (launching) {
          // One physical impulse shares the support's takeoff. Separated/lost
          // cargo receives no remote kick, and relative motion remains free.
          c.body.applyImpulse({ x: 0, y: c.definition.mass * launchVelocityChange }, true);
        }
      }
      if (this.water) {
        // Vertical cushioning preserves the load on water entry. Water never
        // applies a lateral force to cargo: current acts on the carrier only.
        const velocity = c.body.linvel();
        const carrierVerticalSpeed = (this.shellPose(next, this.bodyAngle, this.angle).y - previousShellY) / dt;
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
    this.cameraY = approach(this.cameraY, this.turtle.translation().y + this.bodyOffsetY - G.turtleHalfHeight, dt * t.cameraVerticalSpeed);
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
      turtle: { x: position.x, y: position.y, bodyX: position.x, bodyY: position.y + this.bodyOffsetY, angle: this.angle, speed: this.speed,
        bodyAngle: this.bodyAngle, verticalSpeed: this.verticalSpeed, biome: this.biome, mass: this.mass,
        grounded: this.grounded, jumpCharging: this.jump.charging, jumpChargeSeconds: this.jump.chargeSeconds },
      shell: { ...this.shell.translation(), angle: this.shell.rotation() },
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
