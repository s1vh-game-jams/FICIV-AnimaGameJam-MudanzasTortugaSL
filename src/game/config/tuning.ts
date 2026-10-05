import settingsText from '../../../settings.txt?raw';
import {
  SETTINGS_KEYS, SETTINGS_RULES, parseSettings, serializeSettings, validateSettings,
  type AdjustableSettings, type SettingsKey,
} from './settingsCodec';

/** Fixed scheduling and logical viewport metrics are not laboratory settings. */
const FIXED_TUNING = {
  physicsHz: 60, maxFrameSeconds: 0.1, maxStepsPerFrame: 6,
  worldPixelsPerMetre: 76, viewWidth: 1280, viewHeight: 720,
} as const;
type FixedTuning = { -readonly [K in keyof typeof FIXED_TUNING]: number };

/** Bounded water assistance; cargo keeps independent motion and contact-based retention. */
export const WATER_CARGO_RESPONSE = {
  gripMultiplier: 3, frictionMultiplier: 1.5,
  linearDampingMultiplier: 1.5, angularDampingMultiplier: 2,
} as const;
/** Gentle grass motion: radians/seconds; separate from manual shell compensation. */
export const GRASS_SHELL_RESPONSE = {
  maxSwayAngle: 2 * Math.PI / 180,
  swayTargetSeconds: 1.5,
  swayReturnSeconds: 0.75,
  terrainPitchResponseSeconds: 0.25,
  randomSeed: 0x74757274,
} as const;
/** Metres, kilograms, seconds and radians; movement margins use the fixed laboratory viewport. */
export type Tuning = AdjustableSettings & FixedTuning & { cameraBack: number; cameraFront: number };

export const PHYSICS_GEOMETRY = {
  turtleHalfWidth: 0.95, turtleHalfHeight: 0.24,
  // Authored cargo y values reference the original support pivot.
  cargoLayoutShellPivotY: 0.30,
  // Metres of numerical clearance tolerance for simplified shell/solid queries.
  posePenetrationTolerance: 0.001,
  shellVertices: [-1.1, -0.05, 1.1, -0.05, 1.1, 0, 0.8, 0.32, 0.6, 0.42, -0.6, 0.42, -0.8, 0.32, -1.1, 0],
  controllerOffset: 0.05, controllerNudge: 0.003, stepHeight: 0.32, stepMinWidth: 0.3,
  settleTicks: 30,
  solverIterations: 8, internalSolverIterations: 2, terrainFloorY: -20,
  grassFriction: 0.8, rockFriction: 1, contactTolerance: 0.03, waterBottomClearance: 0.1,
} as const;

function adjustableValues(tuning: Tuning): AdjustableSettings {
  return Object.fromEntries(SETTINGS_KEYS.map(key => [key, tuning[key]])) as AdjustableSettings;
}

function deriveCamera(tuning: Tuning): void {
  const metresVisible = tuning.viewWidth / tuning.worldPixelsPerMetre;
  tuning.cameraBack = metresVisible * tuning.cameraRearPercent / 100;
  tuning.cameraFront = metresVisible * tuning.cameraFrontPercent / 100;
}

let loadedBaseline: Readonly<Tuning> | undefined;
function getBaseline(): Readonly<Tuning> {
  if (!loadedBaseline) {
    const candidate = { ...FIXED_TUNING, ...parseSettings(settingsText), cameraBack: 0, cameraFront: 0 };
    deriveCamera(candidate);
    validateTuning(candidate);
    loadedBaseline = Object.freeze(candidate);
  }
  return loadedBaseline;
}

/** Parse lazily so startup configuration errors reach the application's error screen. */
export function createTuning(): Tuning { return { ...getBaseline() }; }

/** Backwards-compatible readonly defaults; accessors share the same lazy loaded baseline. */
export const BASELINE_TUNING: Readonly<Tuning> = Object.freeze(Object.defineProperties({},
  Object.fromEntries([
    ...Object.keys(FIXED_TUNING), ...SETTINGS_KEYS, 'cameraBack', 'cameraFront',
  ].map(key => [key, { enumerable: true, get: () => getBaseline()[key as keyof Tuning] }]))
)) as Readonly<Tuning>;

/** Apply atomically to a fresh configuration; derived camera limits are always recomputed. */
export function withTuning(base: Tuning, overrides: Partial<Tuning>): Tuning {
  const candidate = { ...base, ...overrides };
  deriveCamera(candidate);
  validateTuning(candidate);
  return candidate;
}

export function exportSettings(tuning: Tuning): string {
  validateTuning(tuning);
  return serializeSettings(adjustableValues(tuning));
}

export interface TuningField { key: SettingsKey; label: string; min: number; max: number; step: number }
function field(key: SettingsKey, label: string, step: number): TuningField {
  return { key, label, ...SETTINGS_RULES[key], step };
}
export const TUNING_FIELDS: readonly TuningField[] = [
  field('acceleration', 'Acceleration · m/s²', 0.1),
  field('braking', 'Braking · m/s²', 0.1),
  field('shellAngularSpeed', 'Shell speed · rad/s', 0.05),
  field('cargoFriction', 'Cargo friction', 0.05),
  field('gripAssistance', 'Contact grip assistance', 0.1),
  field('cargoAngularDamping', 'Angular damping', 0.1),
  field('lossGraceSeconds', 'Contact grace · s', 0.05),
  field('waterWeightInfluence', 'Water weight response · kg⁻¹', 0.01),
  field('waterCurrent', 'Deep current · m/s', 0.05),
  field('cameraRearPercent', 'Rear movement margin · lab %', 0.0001),
  field('cameraFrontPercent', 'Front movement margin · lab %', 0.0001),
  field('cameraDeadZonePercent', 'Level dead zone · % per side', 1),
  field('shellPivotY', 'Shell height above body · m', 0.01),
  field('jumpMaxChargeSeconds', 'Maximum jump charge · s', 0.1),
  field('jumpMaxLaunchSpeed', 'Maximum jump speed · m/s', 0.1),
  field('gravity', 'Gravity · m/s²', 0.01),
  field('waterRiseAcceleration', 'Water buoyancy · s⁻²', 0.1),
  field('waterSwimAcceleration', 'Swim strength · m/s²', 0.1),
  field('waterSwimWeightInfluence', 'Swim weight response · kg⁻¹', 0.01),
];

export function validateTuning(tuning: Tuning): void {
  validateSettings(adjustableValues(tuning));
  for (const [key, value] of Object.entries(tuning)) {
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid tuning: ' + key);
  }
  if (tuning.physicsHz <= 0 || tuning.maxFrameSeconds <= 0 || tuning.viewWidth <= 0 || tuning.viewHeight <= 0 ||
      tuning.worldPixelsPerMetre <= 0 || !Number.isInteger(tuning.maxStepsPerFrame) || tuning.maxStepsPerFrame < 1) {
    throw new Error('Invalid fixed tuning bounds');
  }
  const metresVisible = tuning.viewWidth / tuning.worldPixelsPerMetre;
  const back = metresVisible * tuning.cameraRearPercent / 100;
  const front = metresVisible * tuning.cameraFrontPercent / 100;
  if (Math.abs(tuning.cameraBack - back) > 1e-10 || Math.abs(tuning.cameraFront - front) > 1e-10) {
    throw new Error('Invalid tuning: camera limits must match fixed laboratory viewport percentages');
  }
  if (tuning.cameraGuardMargin * 2 >= front - back) {
    throw new Error('settings.txt: camera window must be wider than twice cameraGuardMargin');
  }
  if (back < PHYSICS_GEOMETRY.turtleHalfWidth || front > metresVisible - PHYSICS_GEOMETRY.turtleHalfWidth) {
    throw new Error('settings.txt: camera boundaries must leave room for the turtle inside the viewport');
  }
}
