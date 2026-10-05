import RAPIER from '@dimforge/rapier2d';
import { PHYSICS_GEOMETRY as G, WATER_CARGO_RESPONSE as W, GRASS_SHELL_RESPONSE as B, validateTuning } from '../config/tuning';
import type { Tuning } from '../config/tuning';
import { CARGO } from '../content/cargo';
import type { CargoDefinition, CargoKind } from '../content/cargo';
import type { Biome, Scenario } from '../content/scenarios';
import { NO_CONTROLS } from '../core/input';
import type { Controls } from '../core/input';
import { CargoTracker } from '../systems/cargoGraph';
import type { CargoState, ContactEdge } from '../systems/cargoGraph';
import { approach, nextShellAngle, targetSpeed } from '../systems/controller';
import { JumpCharge } from '../systems/jumpCharge';
import { GrassSway } from '../systems/grassSway';
import { HAZARD_TUNING as H } from '../config/hazards';
import { createLevelCameraFraming } from '../config/cameraFraming';
import type { HazardSnapshot, TrapPlacement, WorldChunk } from './worldContent';
import { AUDIO_PHYSICS_TUNING as A } from '../../audio/physicsTuning';

const groups = (member: number, filter: number) => (member << 16) | filter;
const TERRAIN = 1, TURTLE = 2, CARGO_GROUP = 4, SHELL = 8, LOST = 16, PROJECTILE = 32;
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
const POSE_CLEARANCE_SEARCH_STEPS = 8;
const CONTACT_MOVEMENT_TOLERANCE = G.controllerNudge * G.controllerNudge;
// Rapier's float32 contact-distance queries can disagree near long prisms.
// Clearance tolerates one millimetre; camera movement has its own tolerance.
const POSE_PENETRATION_TOLERANCE = G.posePenetrationTolerance;
const SHELL_ROTATION_RADIUS = Math.max(...Array.from({ length: G.shellVertices.length / 2 }, (_, i) =>
  Math.hypot(G.shellVertices[i * 2], G.shellVertices[i * 2 + 1])));

/** Exact vertex minima prove a moving convex hull stays outside this support plane. */
function clearsContactPlane(origin: RAPIER.Vector, rotation: number, delta: RAPIER.Vector,
  angleChange: number, point: RAPIER.Vector, normal: RAPIER.Vector): boolean {
  const originDistance = (origin.x - point.x) * normal.x + (origin.y - point.y) * normal.y;
  const translation = delta.x * normal.x + delta.y * normal.y;
  const tau = Math.PI * 2;
  const initialDistance = Math.min(...Array.from({ length: G.shellVertices.length / 2 }, (_, i) => {
    const x = G.shellVertices[i * 2], y = G.shellVertices[i * 2 + 1];
    return originDistance + normal.x * (x * Math.cos(rotation) - y * Math.sin(rotation)) +
      normal.y * (x * Math.sin(rotation) + y * Math.cos(rotation));
  }));
  let arrivalMinimum = Infinity;
  for (let i = 0; i < G.shellVertices.length; i += 2) {
    const x = G.shellVertices[i], y = G.shellVertices[i + 1];
    const cosine = normal.x * x + normal.y * y;
    const sine = -normal.x * y + normal.y * x;
    const distance = (fraction: number) => originDistance + translation * fraction +
      cosine * Math.cos(rotation + angleChange * fraction) + sine * Math.sin(rotation + angleChange * fraction);
    arrivalMinimum = Math.min(arrivalMinimum, distance(1));
    let minimum = Math.min(distance(0), distance(1));
    const amplitude = angleChange * Math.hypot(cosine, sine);
    if (amplitude !== 0) {
      const root = -translation / amplitude;
      if (Math.abs(root) <= 1) {
        const phase = Math.atan2(cosine, sine);
        const low = Math.min(rotation, rotation + angleChange) + phase;
        const high = Math.max(rotation, rotation + angleChange) + phase;
        for (const extremum of [Math.acos(root), -Math.acos(root)]) {
          for (let turn = Math.ceil((low - extremum) / tau); turn <= Math.floor((high - extremum) / tau); turn++) {
            const fraction = (extremum + turn * tau - phase - rotation) / angleChange;
            minimum = Math.min(minimum, distance(fraction));
          }
        }
      }
    }
    if (minimum < Math.min(0, initialDistance) - CONTACT_MOVEMENT_TOLERANCE) return false;
  }
  // Existing numerical overlap may be escaped, never made deeper or dragged
  // sideways indefinitely. New obstacles still require the full sweep.
  return initialDistance >= -POSE_PENETRATION_TOLERANCE || arrivalMinimum > initialDistance + CONTACT_MOVEMENT_TOLERANCE;
}

function polygonVertices(shape: RAPIER.Shape, position: RAPIER.Vector, rotation: number): RAPIER.Vector[] | undefined {
  let vertices: ArrayLike<number>;
  if (shape.type === RAPIER.ShapeType.ConvexPolygon) vertices = (shape as RAPIER.ConvexPolygon).vertices;
  else if (shape.type === RAPIER.ShapeType.Cuboid) {
    const half = (shape as RAPIER.Cuboid).halfExtents;
    vertices = [-half.x, -half.y, half.x, -half.y, half.x, half.y, -half.x, half.y];
  } else return undefined;
  const cosine = Math.cos(rotation), sine = Math.sin(rotation);
  return Array.from({ length: vertices.length / 2 }, (_, i) => ({
    x: position.x + vertices[i * 2] * cosine - vertices[i * 2 + 1] * sine,
    y: position.y + vertices[i * 2] * sine + vertices[i * 2 + 1] * cosine,
  }));
}

/** Exact polygon separation avoids long-prism GJK distance false clearance. */
function polygonSeparation(obstacle: RAPIER.Collider, shape: RAPIER.Shape, position: RAPIER.Vector, rotation: number,
  immutableVertices?: RAPIER.Vector[]) {
  const first = immutableVertices ?? polygonVertices(obstacle.shape, obstacle.translation(), obstacle.rotation());
  const second = polygonVertices(shape, position, rotation);
  if (!first || !second) return undefined;
  let distance = -Infinity;
  let normal = { x: 0, y: 1 }, point = first[0];
  for (const polygon of [first, second]) for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length === 0) continue;
    const axis = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
    const project = (vertices: RAPIER.Vector[]) => vertices.map(vertex => vertex.x * axis.x + vertex.y * axis.y);
    const p = project(first), q = project(second);
    const outward = Math.min(...q) - Math.max(...p), inward = Math.min(...p) - Math.max(...q);
    const separation = Math.max(outward, inward);
    if (separation > distance) {
      distance = separation;
      normal = outward >= inward ? axis : { x: -axis.x, y: -axis.y };
      point = first.reduce((best, vertex) => vertex.x * normal.x + vertex.y * normal.y > best.x * normal.x + best.y * normal.y ? vertex : best);
    }
  }
  return { distance, normal1: normal, point1: point };
}

function convexEnvelope(vertices: number[]): RAPIER.ConvexPolygon {
  // Deduplicate/order the actual float32 coordinates consumed by Rapier.
  // Tiny departure/arrival differences can otherwise collapse after ordering
  // and create a zero-length edge in an assumed-convex native polyline.
  const points = Array.from({ length: vertices.length / 2 }, (_, i) => ({ x: Math.fround(vertices[i * 2]), y: Math.fround(vertices[i * 2 + 1]) }))
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((point, i, sorted) => i === 0 || point.x !== sorted[i - 1].x || point.y !== sorted[i - 1].y);
  const cross = (a: RAPIER.Vector, b: RAPIER.Vector, c: RAPIER.Vector) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const half = (sorted: RAPIER.Vector[]) => {
    const hull: RAPIER.Vector[] = [];
    for (const point of sorted) {
      while (hull.length > 1 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) hull.pop();
      hull.push(point);
    }
    return hull.slice(0, -1);
  };
  // Transient ConvexPolygon.vertices retains its input before WASM builds the
  // hull. SAT needs ordered edges; native hull normalization also handles its
  // own near-collinearity tolerance instead of trusting a fragile polyline.
  const ordered = [...half(points), ...half([...points].reverse())];
  return new RAPIER.ConvexPolygon(new Float32Array(ordered.flatMap(point => [point.x, point.y])), false);
}
export type LoadPreset = 'full' | 'light' | 'empty';
interface CargoBody { definition: CargoDefinition; body: RAPIER.RigidBody; colliders: RAPIER.Collider[]; retired?: { x: number; y: number; angle: number } }
interface LiveTrap {
  placement: TrapPlacement; phase: HazardSnapshot['phase']; seconds: number; lift: number;
  solid?: RAPIER.Collider; body?: RAPIER.RigidBody; cone?: RAPIER.RigidBody;
  hitSounded?: boolean; liftingTurtle?: boolean; launchedTurtle?: boolean;
}
interface LiveChunk { content: WorldChunk; colliders: RAPIER.Collider[]; traps: LiveTrap[] }
export type SimulationAudioEvent =
  | { readonly type: 'cargoImpact'; readonly tier: 'light' | 'medium' | 'heavy' }
  | { readonly type: 'landing'; readonly hard: boolean }
  | { readonly type: 'waterEntry'; readonly large: boolean }
  | { readonly type: 'waterExit' }
  | { readonly type: 'hazard'; readonly name: 'branchCreak' | 'branchBreak' | 'stumpTrigger' | 'stumpHit' |
    'pineconeRustle' | 'pineconeFall' | 'pineconeHit' };
export interface SimulationSnapshot {
  scenarioId: string; tick: number; time: number; cameraX: number; cameraY: number;
  cameraSpeed: number; cameraBlocked: boolean;
  turtle: { x: number; y: number; bodyX: number; bodyY: number; angle: number; bodyAngle: number; speed: number; verticalSpeed: number; biome: Biome; mass: number;
    grounded: boolean; jumpCharging: boolean; jumpChargeSeconds: number };
  shell: { x: number; y: number; angle: number };
  cargo: readonly { id: CargoKind; label: string; x: number; y: number; angle: number; state: CargoState; separatedSeconds: number }[];
  contacts: readonly ContactEdge[];
  hazards: readonly HazardSnapshot[];
  /** Transient presentation events from this fixed tick; no physics side effects. */
  audioEvents: readonly SimulationAudioEvent[];
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
  private terrainVertices = new Map<number, RAPIER.Vector[]>();
  private terrainBiomes = new Map<number, 'grass' | 'rock'>();
  private chunks = new Map<string, LiveChunk>();
  private shellCollider: RAPIER.Collider;
  private angle = 0;
  private bodyAngle = 0;
  private bodyOffsetY = 0;
  private angularSpeed = 0;
  private grassSway = new GrassSway();
  private grassSwayAngle = 0;
  private jump = new JumpCharge();
  private speed = 0;
  private verticalSpeed = 0;
  private water = false;
  private grounded = true;
  private groundSlope = 0;
  private groundAngle = 0;
  private biome: Biome = 'grass';
  private contacts: ContactEdge[] = [];
  private audioEvents: SimulationAudioEvent[] = [];
  private tickCount = 0;
  private cameraX: number;
  private cameraY: number;
  private cameraSpeed = 0;
  private cameraBlocked = false;
  private readonly retirementLeftOffset: number;
  private disposed = false;

  constructor(readonly scenario: Scenario, readonly tuning: Tuning, readonly load: LoadPreset = 'full') {
    validateTuning(tuning);
    this.world = new RAPIER.World({ x: 0, y: -tuning.gravity });
    this.world.timestep = 1 / tuning.physicsHz;
    this.world.numSolverIterations = G.solverIterations;
    this.world.numInternalPgsIterations = G.internalSolverIterations;
    this.cameraX = scenario.startX - (tuning.cameraBack + tuning.cameraFront) / 2;
    this.cameraY = scenario.startY;
    this.retirementLeftOffset = createLevelCameraFraming(tuning).leftOffset;
    this.speed = tuning.baseSpeed;
    this.addWorldChunk({ id: 'diagnostic-base', terrain: scenario.terrain,
      water: scenario.waters ?? (scenario.water ? [scenario.water] : []) });
    const position = { x: scenario.startX, y: scenario.startY + G.turtleHalfHeight + G.controllerOffset };
    this.turtle = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x, position.y));
    this.turtleCollider = this.world.createCollider(RAPIER.ColliderDesc.capsule(G.turtleHalfWidth - G.turtleHalfHeight, G.turtleHalfHeight).setRotation(Math.PI / 2)
      .setCollisionGroups(groups(TURTLE, TERRAIN)), this.turtle);
    this.controller = this.world.createCharacterController(G.controllerOffset);
    this.controller.setNormalNudgeFactor(G.controllerNudge);
    this.controller.enableAutostep(G.stepHeight, G.stepMinWidth, false);
    // Native snapping erases numerical clearance. Bounded descending-support
    // queries in step() preserve the same gap used by ordinary movement.
    // Tiny numerical tolerance does not expand the authored/pose slope limit.
    const climbTolerance = Math.atan(G.controllerNudge);
    this.controller.setMaxSlopeClimbAngle(tuning.shellMaxAngle + climbTolerance);
    this.controller.setMinSlopeSlideAngle(tuning.shellMaxAngle + climbTolerance);
    this.shell = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y + tuning.shellPivotY));
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
        this.scenario.startY + d.y + this.tuning.shellPivotY - G.cargoLayoutShellPivotY)
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
        .setCollisionGroups(groups(CARGO_GROUP, TERRAIN | CARGO_GROUP | SHELL | PROJECTILE)), body);
      this.colliderIds.set(collider.handle, d.id);
      return collider;
    });
    this.cargo.push({ definition: d, body, colliders });
  }

  get mass(): number {
    return this.cargo.reduce((sum, c) => sum + (this.tracker.state(c.definition.id) === 'lost' ? 0 : c.definition.mass), 0);
  }

  cancelJump(): void { this.jump.cancel(); }

  /** Install ownership-scoped geometry ahead of the reachable/visible corridor. */
  addWorldChunk(content: WorldChunk): void {
    if (this.disposed || this.chunks.has(content.id)) throw new Error('Invalid or duplicate world chunk: ' + content.id);
    const chunk: LiveChunk = { content, colliders: [], traps: [] };
    for (const strip of content.terrain) for (let i = 1; i < strip.points.length; i++) {
      const a = strip.points[i - 1], b = strip.points[i], bottom = strip.bottom ?? G.terrainFloorY;
      if (!(b.x > a.x) || !Number.isFinite(bottom) || bottom >= Math.min(a.y, b.y)) throw new Error('Invalid terrain bounds');
      const shape = RAPIER.ColliderDesc.convexHull(new Float32Array([a.x, a.y, b.x, b.y, b.x, bottom, a.x, bottom]));
      if (!shape) throw new Error('Invalid terrain geometry');
      const collider = this.world.createCollider(shape.setFriction(strip.biome === 'rock' ? G.rockFriction : G.grassFriction)
        .setRestitution(0).setCollisionGroups(groups(TERRAIN, TURTLE | CARGO_GROUP | LOST | PROJECTILE)));
      chunk.colliders.push(collider);
      this.terrainSlopes.set(collider.handle, (b.y - a.y) / (b.x - a.x));
      this.terrainBiomes.set(collider.handle, strip.biome);
      const vertices = polygonVertices(collider.shape, collider.translation(), collider.rotation());
      if (vertices) this.terrainVertices.set(collider.handle, vertices);
    }
    for (const placement of content.traps ?? []) {
      const trap: LiveTrap = { placement: { ...placement }, phase: 'idle', seconds: 0, lift: 0 };
      if (placement.kind === 'branch') {
        trap.solid = this.world.createCollider(RAPIER.ColliderDesc.cuboid(H.branchWidth / 2, H.branchThickness / 2)
          .setTranslation(placement.x, placement.y - H.branchThickness / 2)
          .setFriction(this.tuning.cargoFriction).setCollisionGroups(groups(TERRAIN, TURTLE | CARGO_GROUP | LOST | PROJECTILE)));
      } else if (placement.kind === 'stump') {
        trap.body = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
          .setTranslation(placement.x, placement.y - H.stumpHeight / 2));
        trap.solid = this.world.createCollider(RAPIER.ColliderDesc.cuboid(H.stumpWidth / 2, H.stumpHeight / 2)
          .setFriction(this.tuning.cargoFriction).setCollisionGroups(groups(TERRAIN, TURTLE | CARGO_GROUP | LOST | PROJECTILE)), trap.body);
        // The closed hatch is visual ground. A buried duplicate cuboid can
        // falsely present a convex side to the KCC before the stump rises.
        trap.solid.setEnabled(false);
      } else {
        // Sensor has no solid response and never enters the shell-rooted cargo graph.
        trap.solid = this.world.createCollider(RAPIER.ColliderDesc.cuboid(H.treeTouchWidth / 2, 0.7)
          .setTranslation(placement.x, placement.y + 0.7).setSensor(true)
          .setCollisionGroups(groups(TERRAIN, TURTLE)));
      }
      if (placement.kind !== 'tree' && trap.solid) {
        this.terrainSlopes.set(trap.solid.handle, 0);
        this.terrainBiomes.set(trap.solid.handle, 'grass');
      }
      chunk.traps.push(trap);
    }
    this.chunks.set(content.id, chunk);
  }

  removeWorldChunk(id: string): void {
    const chunk = this.chunks.get(id);
    if (!chunk) return;
    const remove = (collider: RAPIER.Collider) => {
      this.terrainSlopes.delete(collider.handle); this.terrainVertices.delete(collider.handle); this.terrainBiomes.delete(collider.handle);
      if (collider.isValid()) this.world.removeCollider(collider, false);
    };
    for (const collider of chunk.colliders) remove(collider);
    for (const trap of chunk.traps) {
      if (trap.solid) remove(trap.solid);
      if (trap.body?.isValid()) this.world.removeRigidBody(trap.body);
      if (trap.cone?.isValid()) this.world.removeRigidBody(trap.cone);
    }
    this.chunks.delete(id);
  }

  hazardSnapshots(): readonly HazardSnapshot[] {
    return [...this.chunks.values()].flatMap(chunk => chunk.traps.map(trap => ({
      ...trap.placement, phase: trap.phase, lift: trap.lift,
      cone: trap.cone?.isValid() ? { ...trap.cone.translation(), angle: trap.cone.rotation() } : undefined,
    })));
  }

  /** Fixed-tick origin shift preserves logical distance in the mode, and local float precision. */
  rebase(dx: number, dy = 0): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error('Invalid world origin shift');
    const shift = (p: { x: number; y: number }) => ({ x: p.x - dx, y: p.y - dy });
    this.world.forEachRigidBody(body => {
      const position = shift(body.translation()), next = shift(body.nextTranslation());
      body.setTranslation(position, false);
      if (body.isKinematic()) body.setNextKinematicTranslation(next);
    });
    this.world.forEachCollider(collider => { if (!collider.parent()) collider.setTranslation(shift(collider.translation())); });
    for (const vertices of this.terrainVertices.values()) for (const vertex of vertices) { vertex.x -= dx; vertex.y -= dy; }
    for (const chunk of this.chunks.values()) {
      chunk.content = { ...chunk.content,
        terrain: chunk.content.terrain.map(strip => ({ ...strip, bottom: strip.bottom === undefined ? undefined : strip.bottom - dy,
          points: strip.points.map(shift) })),
        water: chunk.content.water?.map(water => ({ left: water.left - dx, right: water.right - dx, surface: water.surface - dy, bottom: water.bottom - dy })),
      };
      for (const trap of chunk.traps) trap.placement = { ...trap.placement, ...shift(trap.placement) };
    }
    for (const cargo of this.cargo) if (cargo.retired) cargo.retired = { ...cargo.retired, ...shift(cargo.retired) };
    this.cameraX -= dx; this.cameraY -= dy;
    this.world.propagateModifiedBodyPositionsToColliders();
  }

  private updateHazards(dt: number, position: RAPIER.Vector): { lift: number; launch: boolean } {
    let liftDelta = 0;
    let launch = false;
    for (const chunk of this.chunks.values()) for (const trap of chunk.traps) {
      const p = trap.placement;
      trap.liftingTurtle = false;
      const width = p.kind === 'branch' ? H.branchWidth : p.kind === 'stump' ? H.stumpWidth : H.treeTouchWidth;
      const touchingGround = Math.abs(position.x - p.x) <= width / 2 + G.turtleHalfWidth &&
        Math.abs(position.y + this.bodyOffsetY - G.turtleHalfHeight - p.y - trap.lift) < 0.25;
      const touchingTree = p.kind === 'tree' && !!trap.solid &&
        trap.solid.intersectsShape(this.turtleCollider.shape, this.turtleCollider.translation(), this.turtleCollider.rotation());
      if (trap.phase === 'idle' && (p.kind === 'tree' ? touchingTree : touchingGround)) {
        trap.phase = 'triggered'; trap.seconds = 0;
        this.audioEvents.push({ type: 'hazard', name: p.kind === 'branch' ? 'branchCreak' :
          p.kind === 'stump' ? 'stumpTrigger' : 'pineconeRustle' });
        if (p.kind === 'stump') trap.solid?.setEnabled(true);
      }
      if (trap.phase === 'idle' || trap.phase === 'spent') continue;
      trap.seconds += dt;
      if (p.kind === 'branch' && trap.phase === 'triggered' && trap.seconds >= H.branchDelaySeconds) {
        if (trap.solid) {
          this.terrainSlopes.delete(trap.solid.handle); this.terrainBiomes.delete(trap.solid.handle);
          this.world.removeCollider(trap.solid, false); trap.solid = undefined;
        }
        trap.phase = 'spent';
        this.audioEvents.push({ type: 'hazard', name: 'branchBreak' });
      } else if (p.kind === 'stump') {
        trap.phase = 'active';
        const elapsed = trap.seconds;
        const previous = trap.lift;
        trap.lift = elapsed <= H.stumpRiseSeconds ? H.stumpRise * elapsed / H.stumpRiseSeconds :
          elapsed <= H.stumpRiseSeconds + H.stumpHoldSeconds ? H.stumpRise :
            Math.max(0, H.stumpRise * (1 - (elapsed - H.stumpRiseSeconds - H.stumpHoldSeconds) / H.stumpRetractSeconds));
        const above = Math.abs(position.x - p.x) < H.stumpWidth / 2 + G.turtleHalfWidth &&
          position.y + this.bodyOffsetY - G.turtleHalfHeight >= p.y + previous - 0.12 &&
          position.y + this.bodyOffsetY - G.turtleHalfHeight <= p.y + previous + 0.3;
        // Position-based KCC receives the upward swept support displacement explicitly.
        if (above && trap.lift > previous) {
          liftDelta = Math.max(liftDelta, trap.lift - previous);
          trap.liftingTurtle = true;
          if (!trap.launchedTurtle) {
            launch = true;
            trap.launchedTurtle = true;
          }
        }
        trap.body?.setNextKinematicTranslation({ x: p.x, y: p.y - H.stumpHeight / 2 + trap.lift });
        if (elapsed >= H.stumpRiseSeconds + H.stumpHoldSeconds + H.stumpRetractSeconds) {
          trap.phase = 'spent'; trap.solid?.setEnabled(false);
        }
      } else if (p.kind === 'tree') {
        if (trap.phase === 'triggered' && trap.seconds >= H.treeDelaySeconds) {
          trap.phase = 'active'; trap.seconds = 0;
          this.audioEvents.push({ type: 'hazard', name: 'pineconeFall' });
          trap.cone = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(p.x, p.y + H.coneHeight).setCcdEnabled(true));
          this.world.createCollider(RAPIER.ColliderDesc.ball(H.coneRadius).setMass(H.coneMass)
            .setFriction(0.35).setCollisionGroups(groups(PROJECTILE, CARGO_GROUP | TERRAIN)), trap.cone);
        } else if (trap.phase === 'active' && trap.seconds >= H.coneLifetimeSeconds) {
          if (trap.cone) this.world.removeRigidBody(trap.cone);
          trap.cone = undefined; trap.phase = 'spent';
        }
      }
    }
    // Takeoff already clears the moving support; do not add lift to jump speed.
    return { lift: launch ? 0 : liftDelta, launch };
  }

  private shellPose(position: RAPIER.Vector, bodyAngle: number, manualAngle: number, bodyOffsetY = this.bodyOffsetY) {
    return { x: position.x - Math.sin(bodyAngle) * this.tuning.shellPivotY,
      y: position.y + bodyOffsetY + Math.cos(bodyAngle) * this.tuning.shellPivotY, angle: bodyAngle + manualAngle };
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

  private nearbyGround(position: RAPIER.Vector, distance: number): RAPIER.ColliderShapeCastHit | null {
    return this.world.castShape({ x: position.x, y: position.y + G.controllerNudge }, Math.PI / 2,
      { x: 0, y: -1 }, this.turtleCollider.shape, G.controllerOffset, distance + G.controllerNudge, true,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS | RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
      groups(TURTLE, TERRAIN), undefined, undefined, collider => this.terrainSlopes.has(collider.handle));
  }

  private supportFromNormal(collider: RAPIER.Collider, normal: RAPIER.Vector): { angle: number; slope: number } | undefined {
    if (normal.y <= 0) return;
    const normalAngle = Math.atan2(-normal.x, normal.y);
    const authoredSlope = this.terrainSlopes.get(collider.handle);
    const authoredAngle = authoredSlope === undefined ? normalAngle : Math.atan(authoredSlope);
    const agreesWithFace = Math.abs(normalAngle - authoredAngle) <= Math.atan(G.controllerNudge);
    const angle = agreesWithFace ? authoredAngle : normalAngle;
    if (Math.abs(angle) > this.tuning.shellMaxAngle + Math.atan(G.controllerNudge)) return;
    return { angle: clamp(angle, -this.tuning.shellMaxAngle, this.tuning.shellMaxAngle),
      slope: clamp(-normal.x / normal.y, -Math.tan(this.tuning.shellMaxAngle), Math.tan(this.tuning.shellMaxAngle)) };
  }

  private castShellPose(position: RAPIER.Vector, bodyAngle: number, manualAngle: number, bodyOffsetY = this.bodyOffsetY):
    { time_of_impact: number; normal1: RAPIER.Vector } | null {
    const next = this.shellPose(position, bodyAngle, manualAngle, bodyOffsetY);
    const current = this.shell.translation();
    const angleChange = next.angle - this.shell.rotation();
    const delta = { x: next.x - current.x, y: next.y - current.y };
    const flags = RAPIER.QueryFilterFlags.EXCLUDE_SENSORS | RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC;
    const rounding = CONTACT_MOVEMENT_TOLERANCE;
    const separation = (collider: RAPIER.Collider, shape: RAPIER.Shape, position: RAPIER.Vector, rotation: number) =>
      polygonSeparation(collider, shape, position, rotation, this.terrainVertices.get(collider.handle));
    const filter = (collider: RAPIER.Collider) => {
      const polygon = separation(collider, this.shellCollider.shape, current, this.shell.rotation());
      if (polygon) return polygon.distance > G.controllerNudge ||
        !clearsContactPlane(current, this.shell.rotation(), delta, angleChange, polygon.point1, polygon.normal1);
      // Numerical clearance is not a physical wall: permit sliding along or
      // leaving an existing contact when the arrival hull remains outside it.
      // Otherwise a wall can prevent the very upward jump needed to clear it.
      const departure = collider.contactShape(this.shellCollider.shape, current, this.shell.rotation(), G.controllerNudge);
      if (!departure || departure.distance < -rounding) return true;
      const contactOffset = { x: departure.point2.x - current.x, y: departure.point2.y - current.y };
      const contactTravel = {
        x: delta.x + contactOffset.x * (Math.cos(angleChange) - 1) - contactOffset.y * Math.sin(angleChange),
        y: delta.y + contactOffset.x * Math.sin(angleChange) + contactOffset.y * (Math.cos(angleChange) - 1),
      };
      if (contactTravel.x * departure.normal1.x + contactTravel.y * departure.normal1.y < -rounding) return true;
      const arrival = collider.contactShape(this.shellCollider.shape, next, next.angle, G.controllerNudge);
      if (arrival && arrival.distance < -rounding) return true;
      // A departing contact point alone cannot justify ignoring a rotational
      // envelope. Every vertex must clear this convex collider's supporting
      // plane throughout the arc, including all interior derivative extrema.
      return !clearsContactPlane(current, this.shell.rotation(), delta, angleChange, departure.point1, departure.normal1);
    };
    // A zero-velocity shape cast can miss existing overlap. Query endpoint
    // intersections explicitly before the sweep, including every rotation.
    const sweepLeft = Math.min(current.x, next.x) - SHELL_ROTATION_RADIUS - G.controllerNudge;
    const sweepRight = Math.max(current.x, next.x) + SHELL_ROTATION_RADIUS + G.controllerNudge;
    const sweepBottom = Math.min(current.y, next.y) - SHELL_ROTATION_RADIUS - G.controllerNudge;
    const sweepTop = Math.max(current.y, next.y) + SHELL_ROTATION_RADIUS + G.controllerNudge;
    const terrainColliders = this.world.colliders.getAll().filter(collider => collider.isEnabled() && !collider.isSensor() &&
      !collider.parent()?.isDynamic() && ((collider.collisionGroups() >>> 16) & TERRAIN) !== 0 &&
      (collider.collisionGroups() & TURTLE) !== 0).filter(collider => {
        // Conservative full-arc AABB rejects only solids the swept shell cannot reach.
        const vertices = this.terrainVertices.get(collider.handle) ??
          polygonVertices(collider.shape, collider.translation(), collider.rotation());
        return !vertices || !(vertices.every(v => v.x < sweepLeft) || vertices.every(v => v.x > sweepRight) ||
          vertices.every(v => v.y < sweepBottom) || vertices.every(v => v.y > sweepTop));
      });
    for (const collider of terrainColliders) {
      const polygon = separation(collider, this.shellCollider.shape, next, next.angle);
      if (polygon) {
        if (polygon.distance < -POSE_PENETRATION_TOLERANCE && filter(collider)) {
          return { time_of_impact: 0, normal1: polygon.normal1 };
        }
        continue;
      }
      const contact = collider.contactShape(this.shellCollider.shape, next, next.angle, G.controllerNudge);
      if (contact && contact.distance < -rounding) {
        return { time_of_impact: 0, normal1: contact.normal1 };
      }
    }
    const finalHit = this.world.castShape(next, next.angle, { x: 0, y: 0 }, this.shellCollider.shape,
      G.controllerNudge, 0, true, flags, groups(TURTLE, TERRAIN), undefined, undefined,
      collider => !separation(collider, this.shellCollider.shape, next, next.angle) && filter(collider));
    if (finalHit) return finalHit;
    if (angleChange === 0) return this.world.castShape(current, next.angle,
      delta, this.shellCollider.shape, G.controllerNudge / 2, 1, false, flags, groups(TURTLE, TERRAIN), undefined, undefined, filter);
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
    const envelope = convexEnvelope(vertices);
    const sagitta = SHELL_ROTATION_RADIUS * (1 - Math.cos(angleChange / 2));
    for (const collider of terrainColliders) {
      if (!filter(collider)) continue;
      const polygon = separation(collider, envelope, current, 0);
      if (polygon) {
        if (polygon.distance < sagitta - POSE_PENETRATION_TOLERANCE) {
          return { time_of_impact: 0, normal1: polygon.normal1 };
        }
        continue;
      }
      const contact = collider.contactShape(envelope, current, 0, sagitta + G.controllerNudge / 2);
      if (contact && contact.distance < sagitta + G.controllerNudge / 2) {
        return { time_of_impact: 0, normal1: contact.normal1 };
      }
    }
    return this.world.castShape(current, 0, { x: 0, y: 0 }, envelope,
      sagitta + G.controllerNudge / 2, 0, true, flags, groups(TURTLE, TERRAIN), undefined, undefined,
      collider => !separation(collider, envelope, current, 0) && filter(collider));
  }

  private alignShell(position: RAPIER.Vector, bodyAngle: number, manualAngle: number, grounded: boolean,
    desiredMovement: RAPIER.Vector): RAPIER.Vector {
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
    if (!accepted && manualAngle !== this.angle) {
      // Forward translation may itself be blocked. A safe bounded correction
      // in place must still be accepted so the player can leave that contact.
      const origin = this.turtle.translation();
      for (let attempt = 0, fraction = 1; attempt < POSE_CLEARANCE_SEARCH_STEPS; attempt++, fraction /= 2) {
        const manual = this.angle + (manualAngle - this.angle) * fraction;
        if (!this.castShellPose(origin, this.bodyAngle, manual)) {
          this.angle = manual; position = origin; accepted = true;
          break;
        }
      }
    }
    if (!accepted) {
      // On a ramp join, automatic body leveling can cancel an intentional
      // shell correction. Let the shell leave contact while retaining the
      // last safe body pose/clearance; the ordinary grounded query catches up.
      for (let attempt = 0, fraction = 1; attempt < POSE_CLEARANCE_SEARCH_STEPS; attempt++, fraction /= 2) {
        const manual = this.angle + (manualAngle - this.angle) * fraction;
        const offset = Math.max(this.bodyOffsetY, this.supportOffset(position, this.bodyAngle, grounded));
        if (!this.castShellPose(position, this.bodyAngle, manual, offset)) {
          this.angle = manual; this.bodyOffsetY = offset; accepted = true;
          break;
        }
      }
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
        if (delta.y > 0 && hit.normal1.y < 0) {
          // SAT endpoint separation can select a diagonal hull axis at a
          // ceiling seam. Cancel the blocked ascent and test actual forward
          // clearance before projecting onto that ambiguous normal. Both the
          // locomotion capsule and the complete shell path must permit it.
          this.controller.computeColliderMovement(this.turtleCollider, { x: delta.x, y: 0 },
            RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
          const forward = this.controller.computedMovement();
          const level = { x: origin.x + forward.x, y: origin.y + forward.y };
          if (forward.x > 0 && !this.castShellPose(level, this.bodyAngle, this.angle)) {
            position = level; accepted = true; break;
          }
        }
        if (this.water && desiredMovement.y > 0 && hit.normal1.x < 0) {
          // The capsule can turn upward intent into downward sliding at an
          // island lip. Retry the original ascent without forward intent;
          // retain the capsule's physical slide and the full shell clearance.
          this.controller.computeColliderMovement(this.turtleCollider, { x: 0, y: desiredMovement.y },
            RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
          const upward = this.controller.computedMovement();
          const rise = { x: origin.x + upward.x, y: origin.y + upward.y };
          if (upward.y > 0 && !this.castShellPose(rise, this.bodyAngle, this.angle)) {
            position = rise; accepted = true; break;
          }
        }
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
    // Replace rather than clear so an already captured snapshot remains stable.
    this.audioEvents = [];
    const dt = this.world.timestep;
    const t = this.tuning;
    const position = this.turtle.translation();
    const bodyY = position.y + this.bodyOffsetY;
    // Diagnostics stop at the scenario's authored end; this is not a game finish.
    if (position.x >= this.scenario.endX) return;
    const horizontal = clamp(Number.isFinite(input.horizontal) ? input.horizontal : 0, -1, 1);
    const vertical = clamp(Number.isFinite(input.vertical) ? input.vertical : 0, -1, 1);
    const region = [...this.chunks.values()].flatMap(chunk => chunk.content.water ?? [])
      .find(region => position.x >= region.left && position.x <= region.right);
    const previousWater = this.water;
    this.water = !!region && position.x >= region.left && position.x <= region.right &&
      bodyY <= region.surface + (previousWater ? t.waterExitMargin : G.turtleHalfHeight);
    if (this.water !== previousWater) this.audioEvents.push(this.water ?
      { type: 'waterEntry', large: -this.shell.linvel().y >= A.waterLargeEntrySpeed } : { type: 'waterExit' });
    if (this.water) this.biome = 'water';
    else {
      // Pick the nearby support top, rather than the first overlapping X strip.
      const surfaces = [...this.chunks.values()].flatMap(chunk => chunk.content.terrain).flatMap(strip =>
        strip.points.slice(1).flatMap((b, i) => {
          const a = strip.points[i];
          if (position.x < a.x || position.x > b.x) return [];
          const height = a.y + (b.y - a.y) * (position.x - a.x) / (b.x - a.x);
          return height <= bodyY + 0.2 ? [{ biome: strip.biome, height }] : [];
        }));
      surfaces.sort((a, b) => b.height - a.height);
      this.biome = surfaces[0]?.biome ?? this.biome;
    }
    const hazard = this.updateHazards(dt, position);
    const hazardLift = hazard.lift;
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
    const jumpFraction = hazard.launch ? 1 : this.jump.update(input, !this.water && this.grounded, dt, t.jumpMaxChargeSeconds);
    if (hazard.launch) this.jump.cancel();
    const launching = jumpFraction !== undefined && jumpFraction > 0;
    // Rapier's solver integrates gravity over its solver substeps. Match the
    // mean displacement of those semi-implicit substeps rather than taking
    // one full-tick Euler step, which makes the support outrun falling cargo.
    const gravityDisplacementCorrection = this.water && !hazard.launch ? 0 :
      t.gravity * dt * (this.world.numSolverIterations - 1) / (2 * this.world.numSolverIterations);
    let launchVelocityChange = 0;
    if (this.water && region && !hazard.launch) {
      // Keep the incoming physical velocity. Drag and over-speed cushioning
      // amortize entry instead of discarding momentum with an instant clamp.
      if (!previousWater) this.verticalSpeed = previousVerticalSpeed;
      const targetY = Math.max(region.bottom + G.turtleHalfHeight + G.waterBottomClearance, region.surface - t.waterBaseDepth - this.mass * t.waterDepthPerKg);
      const rise = (targetY - bodyY) * t.waterRiseAcceleration / (1 + this.mass * t.waterWeightInfluence);
      // Space helps ascent; retained mass and entry momentum provide depth.
      const swim = (input.jumpHeld ? 1 : 0) * t.waterSwimAcceleration / (1 + this.mass * t.waterSwimWeightInfluence);
      const incomingSpeed = this.verticalSpeed;
      this.verticalSpeed += (rise - this.verticalSpeed * t.waterDrag + swim) * dt;
      const limited = clamp(this.verticalSpeed, -t.waterMaxVerticalSpeed, t.waterMaxVerticalSpeed);
      this.verticalSpeed = Math.abs(incomingSpeed) <= t.waterMaxVerticalSpeed ? limited :
        this.verticalSpeed + (limited - this.verticalSpeed) * (1 - Math.exp(-t.waterEntryDamping * dt));
    } else {
      if (launching) {
        this.verticalSpeed = jumpFraction * t.jumpMaxLaunchSpeed;
        launchVelocityChange = this.verticalSpeed - previousVerticalSpeed;
      }
      this.verticalSpeed -= t.gravity * dt;
    }
    const previousAngle = this.angle;
    const previousSway = this.grassSwayAngle;
    const desiredSway = this.grassSway.advance(!this.water && this.grounded && this.biome === 'grass' && !launching, dt);
    const tilt = nextShellAngle(this.angle - previousSway, this.angularSpeed, vertical, dt, t);
    const desiredManualAngle = clamp(tilt.angle + desiredSway, -t.shellMaxAngle, t.shellMaxAngle);
    this.angularSpeed = tilt.speed;
    // Follow the last supporting contact tangent so the KCC does not reduce
    // horizontal intent by projecting it a second time along an uphill slope.
    const supportSlope = this.grounded && this.verticalSpeed <= 0 ? this.groundSlope : 0;
    const movementVerticalSpeed = this.verticalSpeed + (!this.grounded || launching ? gravityDisplacementCorrection : 0);
    const desiredMovement = { x: (this.speed - movementVerticalSpeed * supportSlope) * dt,
      y: (movementVerticalSpeed + this.speed * supportSlope) * dt + hazardLift };
    this.controller.computeColliderMovement(this.turtleCollider, desiredMovement,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
    let movement = this.controller.computedMovement();
    if (this.water && desiredMovement.y > 0 && movement.y <= 0) {
      const facingLip = Array.from({ length: this.controller.numComputedCollisions() }, (_, i) =>
        this.controller.computedCollision(i)).some(hit => hit && hit.normal1.x < 0 && hit.normal1.y < 0);
      if (facingLip) {
        // At a convex lip the capsule may project rising forward intent down
        // the solid. Prefer an actually permitted ascent instead of undoing
        // its previous tick. The shell still requires complete-path clearance.
        this.controller.computeColliderMovement(this.turtleCollider, { x: 0, y: desiredMovement.y },
          RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
        const upward = this.controller.computedMovement();
        const rise = { x: position.x + upward.x, y: position.y + upward.y };
        if (upward.y > 0 && !this.castShellPose(rise, this.bodyAngle, this.angle)) movement = upward;
        else this.controller.computeColliderMovement(this.turtleCollider, desiredMovement,
          RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, groups(TURTLE, TERRAIN));
      }
    }
    let grounded = this.controller.computedGrounded() && ((this.water && !launching) || this.verticalSpeed <= 0);
    if (!grounded) this.groundSlope = 0;
    let support: { angle: number; slope: number } | undefined;
    if (grounded) for (let i = 0; i < this.controller.numComputedCollisions(); i++) {
      const collision = this.controller.computedCollision(i);
      if (!collision) continue;
      // A prism's convex corner can support the capsule with a horizontal
      // normal even when its top face slopes. Authored pitch is authoritative
      // only when that actual contact normal agrees with the top face.
      if (collision.normal1.y <= 0 || !collision.collider) continue;
      if (!this.water) this.biome = this.terrainBiomes.get(collision.collider.handle) ?? this.biome;
      const candidate = this.supportFromNormal(collision.collider, collision.normal1);
      if (candidate) {
        // When bridging a join, prefer the flatter actual support. The signed
        // tie break keeps collision iteration order from choosing the posture.
        if (!support || Math.abs(candidate.angle) < Math.abs(support.angle) ||
          (Math.abs(candidate.angle) === Math.abs(support.angle) && candidate.angle < support.angle)) support = candidate;
      }
    }
    const requested = { x: position.x + movement.x, y: position.y + movement.y };
    let followedGround = false;
    if (!this.water && this.grounded && this.verticalSpeed <= 0 && !launching && hazardLift === 0 &&
      (!grounded || supportSlope < -G.controllerNudge)) {
      // A shallow cast follows only nearby actual support after a grounded
      // departure. Preserve controller clearance; do not attach to deep drops,
      // an upward launch, water, or a face too steep for the controller.
      const hit = this.nearbyGround(requested, G.stepHeight);
      const candidate = hit && this.supportFromNormal(hit.collider, hit.normal1);
      if (hit && candidate && candidate.angle < -Math.atan(G.controllerNudge)) {
        requested.y += G.controllerNudge - hit.time_of_impact;
        support = candidate; grounded = true; followedGround = true;
        this.biome = this.terrainBiomes.get(hit.collider.handle) ?? this.biome;
      }
    }
    // Rapier can report grounded without a new sweep collision. Retain the
    // confirmed support instead of alternating its pitch with zero each tick.
    if (support) { this.groundAngle = support.angle; this.groundSlope = support.slope; }
    const desiredBodyAngle = this.water ? 0 : grounded ? this.groundAngle : this.bodyAngle;
    const bodyTarget = !this.water && grounded && this.biome === 'grass' ?
      this.bodyAngle + (desiredBodyAngle - this.bodyAngle) * (1 - Math.exp(-dt / B.terrainPitchResponseSeconds)) : desiredBodyAngle;
    const next = this.alignShell(requested, approach(this.bodyAngle, bodyTarget, t.shellAngularSpeed * dt), desiredManualAngle, grounded, desiredMovement);
    // Only account for sway actually accepted by the physical clearance guard.
    const acceptedAngleFraction = desiredManualAngle === previousAngle ? 1 :
      clamp((this.angle - previousAngle) / (desiredManualAngle - previousAngle), 0, 1);
    this.grassSwayAngle = previousSway + (desiredSway - previousSway) * acceptedAngleFraction;
    movement.x = next.x - position.x; movement.y = next.y - position.y;
    grounded = this.controller.computedGrounded() && ((this.water && !launching) || this.verticalSpeed <= 0);
    if (followedGround) {
      const hit = this.nearbyGround(next, G.controllerNudge);
      grounded ||= !!hit && !!this.supportFromNormal(hit.collider, hit.normal1);
    }
    const landingDelta = grounded && !this.grounded && this.verticalSpeed < 0 ? -this.verticalSpeed : 0;
    if (!this.water && landingDelta >= A.landingMinimumSpeed) {
      this.audioEvents.push({ type: 'landing', hard: landingDelta >= A.landingHardSpeed });
    }
    this.grounded = grounded;
    if (grounded && this.verticalSpeed < 0) this.verticalSpeed = 0;
    if (launching) {
      // A ceiling or another terrain constraint must not leave cargo with an
      // impulse the carrier could not execute. Rapier resolves support/gravity.
      const acceptedSupportSpeed = (this.shellPose(next, this.bodyAngle, this.angle).y - previousShellY) / dt;
      launchVelocityChange = acceptedSupportSpeed > 0 ? Math.max(0,
        Math.min(launchVelocityChange, acceptedSupportSpeed + gravityDisplacementCorrection - previousVerticalSpeed)) : 0;
      if (next.y !== requested.y) this.verticalSpeed = movement.y / dt;
    }
    this.turtle.setNextKinematicTranslation(next);
    const connected = new Set(this.tracker.connectedIds());
    const landingDamping = this.biome === 'grass' ? t.grassLandingDamping : t.rockLandingDamping;
    const grip = t.gripAssistance * (this.water ? W.gripMultiplier : 1);
    if (this.water !== previousWater) this.shellCollider.setFriction(t.cargoFriction * (this.water ? W.frictionMultiplier : 1));
    for (const c of this.cargo) {
      if (c.retired) continue;
      c.body.resetForces(false);
      if (this.tracker.state(c.definition.id) === 'lost') continue;
      // World-space damping must not slow the stack's freefall while the
      // kinematic carrier falls with undamped gravity. Keep angular damping.
      c.body.setLinearDamping(this.water ? t.cargoLinearDamping * W.linearDampingMultiplier : this.grounded ? t.cargoLinearDamping : 0);
      c.body.setAngularDamping(t.cargoAngularDamping * (this.water ? W.angularDampingMultiplier : 1));
      if (this.water !== previousWater) for (const collider of c.colliders) collider.setFriction(t.cargoFriction * (this.water ? W.frictionMultiplier : 1));
      if (connected.has(c.definition.id)) {
        const velocity = c.body.linvel();
        // Substep contact impulses can leave a tiny relative vertical speed
        // against a position-based carrier. Existing contact grip damps that
        // drift during flight; no root connection means no remote force.
        c.body.addForce({ x: c.definition.mass * (this.speed - velocity.x) * grip,
          y: !this.grounded && !this.water && !launching ?
            c.definition.mass * (this.verticalSpeed - velocity.y) * t.gripAssistance : 0 }, true);
        if (launching) {
          // One physical impulse shares the support's takeoff. Separated/lost
          // cargo receives no remote kick, and relative motion remains free.
          c.body.applyImpulse({ x: 0, y: c.definition.mass * launchVelocityChange }, true);
        }
      }
      if (this.water && !launching) {
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
    this.readAudioImpacts(next.y - position.y);
    this.contacts = this.readContacts();
    const previouslyLost = new Set(this.tracker.lostIds());
    this.tracker.update(this.contacts, dt);
    for (const c of this.cargo) if (this.tracker.state(c.definition.id) === 'lost' && !previouslyLost.has(c.definition.id)) {
      for (const collider of c.colliders) collider.setCollisionGroups(groups(LOST, TERRAIN));
      c.body.resetForces(true);
    }
    this.tickCount++;
    const retirementX = Math.min(this.turtle.translation().x - H.lostCargoRetireDistance,
      this.cameraX + this.retirementLeftOffset - SHELL_ROTATION_RADIUS * 2);
    // Finite diagnostics keep inspectable lost-body handles until reset/dispose.
    for (const cargo of this.cargo) if (!Number.isFinite(this.scenario.endX) && !cargo.retired && this.tracker.state(cargo.definition.id) === 'lost' &&
      cargo.body.translation().x < retirementX) {
      cargo.retired = { ...cargo.body.translation(), angle: cargo.body.rotation() };
      for (const collider of cargo.colliders) this.colliderIds.delete(collider.handle);
      this.world.removeRigidBody(cargo.body);
    }
    // A solid obstacle can exhaust the rear window, but cannot make the
    // camera push the carrier through geometry or leave it behind. Only the
    // camera advance is reduced; physics, cargo and run time keep advancing.
    const desiredCameraAdvance = t.cameraSpeed * dt;
    const allowedCameraAdvance = Math.max(0, this.turtle.translation().x - this.cameraX - t.cameraBack);
    const cameraAdvance = Math.min(desiredCameraAdvance, allowedCameraAdvance);
    this.cameraX += cameraAdvance;
    this.cameraSpeed = cameraAdvance / dt;
    this.cameraBlocked = cameraAdvance < desiredCameraAdvance - CONTACT_MOVEMENT_TOLERANCE;
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

  /** Read solver impulses only: no event flags, forces or secondary physics model. */
  private normalImpulse(first: RAPIER.Collider, second: RAPIER.Collider): number {
    let impulse = 0;
    this.world.contactPair(first, second, manifold => {
      for (let i = 0; i < manifold.numContacts(); i++) impulse += Math.max(0, manifold.contactImpulse(i));
    });
    return impulse;
  }

  private inverseDynamicMass(collider: RAPIER.Collider): number {
    const body = collider.parent();
    return body?.isDynamic() && body.mass() > 0 ? 1 / body.mass() : 0;
  }

  private readAudioImpacts(turtleRise: number): void {
    const pairs = new Map<string, { impulse: number; inverseMass: number }>();
    const visited = new Set<string>();
    for (const cargo of this.cargo) {
      if (cargo.retired || this.tracker.state(cargo.definition.id) === 'lost') continue;
      for (const collider of cargo.colliders) this.world.contactPairsWith(collider, other => {
        const colliderPair = [collider.handle, other.handle].sort((a, b) => a - b).join('|');
        if (visited.has(colliderPair)) return;
        visited.add(colliderPair);
        const otherId = this.colliderIds.get(other.handle);
        if (otherId && otherId !== 'shell' && this.tracker.state(otherId) === 'lost') return;
        const otherBody = other.parent();
        // Multiple collider pieces still belong to one perceived body collision.
        const otherKey = otherBody ? 'body:' + otherBody.handle : 'fixed:' + other.handle;
        const bodyPair = ['body:' + cargo.body.handle, otherKey].sort().join('|');
        const pair = pairs.get(bodyPair) ?? { impulse: 0,
          inverseMass: this.inverseDynamicMass(collider) + this.inverseDynamicMass(other) };
        pair.impulse += this.normalImpulse(collider, other);
        pairs.set(bodyPair, pair);
      });
    }
    const deltaV = Math.max(0, ...[...pairs.values()].map(pair => pair.impulse * pair.inverseMass));
    if (deltaV >= A.cargoLightDeltaV) this.audioEvents.push({ type: 'cargoImpact',
      tier: deltaV >= A.cargoHeavyDeltaV ? 'heavy' : deltaV >= A.cargoMediumDeltaV ? 'medium' : 'light' });
    for (const chunk of this.chunks.values()) for (const trap of chunk.traps) {
      if (trap.hitSounded) continue;
      if (trap.placement.kind === 'stump') {
        let cargoHit = false;
        if (trap.solid?.isEnabled()) this.world.contactPairsWith(trap.solid, other => {
          cargoHit ||= this.normalImpulse(trap.solid!, other) * this.inverseDynamicMass(other) >= A.cargoLightDeltaV;
        });
        if ((trap.liftingTurtle && turtleRise > CONTACT_MOVEMENT_TOLERANCE) || cargoHit) {
          trap.hitSounded = true;
          this.audioEvents.push({ type: 'hazard', name: 'stumpHit' });
        }
      } else if (trap.cone?.isValid()) {
        const collider = trap.cone.collider(0);
        let hit = false;
        this.world.contactPairsWith(collider, other => {
          const inverseMass = this.inverseDynamicMass(collider) + this.inverseDynamicMass(other);
          hit ||= this.normalImpulse(collider, other) * inverseMass >= A.pineconeMinimumDeltaV;
        });
        if (hit) {
          trap.hitSounded = true;
          this.audioEvents.push({ type: 'hazard', name: 'pineconeHit' });
        }
      }
    }
  }

  snapshot(): SimulationSnapshot {
    const position = this.turtle.translation();
    return {
      scenarioId: this.scenario.id, tick: this.tickCount, time: this.tickCount / this.tuning.physicsHz,
      cameraX: this.cameraX, cameraY: this.cameraY, cameraSpeed: this.cameraSpeed, cameraBlocked: this.cameraBlocked,
      turtle: { x: position.x, y: position.y, bodyX: position.x, bodyY: position.y + this.bodyOffsetY, angle: this.angle, speed: this.speed,
        bodyAngle: this.bodyAngle, verticalSpeed: this.verticalSpeed, biome: this.biome, mass: this.mass,
        grounded: this.grounded, jumpCharging: this.jump.charging, jumpChargeSeconds: this.jump.chargeSeconds },
      shell: { ...this.shell.translation(), angle: this.shell.rotation() },
      cargo: this.cargo.map(c => ({ id: c.definition.id, label: c.definition.label,
        x: c.retired?.x ?? c.body.translation().x, y: c.retired?.y ?? c.body.translation().y, angle: c.retired?.angle ?? c.body.rotation(),
        state: this.tracker.state(c.definition.id), separatedSeconds: this.tracker.separatedSeconds(c.definition.id) })),
      contacts: this.contacts,
      hazards: this.hazardSnapshots(),
      audioEvents: this.audioEvents,
    };
  }
  debugVertices(): Float32Array { return this.world.debugRender().vertices; }
  dispose(): void {
    if (!this.disposed) { this.world.free(); this.disposed = true; }
  }
}
