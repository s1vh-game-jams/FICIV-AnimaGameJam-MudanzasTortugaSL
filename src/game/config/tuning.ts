/** Metres, kilograms, seconds and radians. Shared by every game mode. */
export const BASELINE_TUNING = {
  physicsHz: 60, maxFrameSeconds: 0.1, maxStepsPerFrame: 6,
  gravity: 9.81, cameraVerticalSpeed: 2, cameraSpeed: 2, cameraBack: 2.6, cameraFront: 5.2,
  cameraPressureWidth: 1.15, cameraGuardMargin: 0.2, cameraRecovery: 1.5, baseSpeed: 2, minSpeed: 0.75, maxSpeed: 3.3,
  acceleration: 1.8, braking: 2.4, shellMaxAngle: Math.PI / 5,
  shellAngularSpeed: 0.8, shellAngularDamping: 6,
  cargoFriction: 0.8, cargoLinearDamping: 0.16, cargoAngularDamping: 0.6,
  gripAssistance: 0.7, lossGraceSeconds: 0.65,
  waterRiseAcceleration: 4.2, waterWeightInfluence: 0.2, waterDrag: 1.5,
  waterSwimAcceleration: 4, waterCurrent: 0.65,
  waterMaxVerticalSpeed: 2, waterEntryDamping: 6,
  waterBaseDepth: 0.12, waterDepthPerKg: 0.075, waterExitMargin: 0.5,
  grassLandingDamping: 0.5, rockLandingDamping: 0.05,
  worldPixelsPerMetre: 76, viewWidth: 1280, viewHeight: 720,
} as const;
export type Tuning = { -readonly [K in keyof typeof BASELINE_TUNING]: number };
export function createTuning(): Tuning { return { ...BASELINE_TUNING }; }
export interface TuningField { key: keyof Tuning; label: string; min: number; max: number; step: number }
export const TUNING_FIELDS: readonly TuningField[] = [
  { key: 'acceleration', label: 'Acceleration · m/s²', min: 0.1, max: 5, step: 0.1 },
  { key: 'braking', label: 'Braking · m/s²', min: 0.1, max: 5, step: 0.1 },
  { key: 'shellAngularSpeed', label: 'Shell speed · rad/s', min: 0.1, max: 2, step: 0.05 },
  { key: 'cargoFriction', label: 'Cargo friction', min: 0.05, max: 2, step: 0.05 },
  { key: 'gripAssistance', label: 'Contact grip assistance', min: 0, max: 3, step: 0.1 },
  { key: 'cargoAngularDamping', label: 'Angular damping', min: 0, max: 3, step: 0.1 },
  { key: 'lossGraceSeconds', label: 'Contact grace · s', min: 0.1, max: 2, step: 0.05 },
  { key: 'waterWeightInfluence', label: 'Water weight response', min: 0.05, max: 0.5, step: 0.01 },
  { key: 'waterCurrent', label: 'Deep current · m/s', min: 0, max: 2, step: 0.05 },
];
export function validateTuning(t: Tuning): void {
  for (const [key, value] of Object.entries(t)) {
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid tuning: ' + key);
  }
  if (t.physicsHz <= 0 || t.maxFrameSeconds <= 0 || t.viewWidth <= 0 || t.viewHeight <= 0 || t.minSpeed <= 0 || t.minSpeed > t.baseSpeed || t.baseSpeed > t.maxSpeed ||
      t.cameraSpeed < t.minSpeed || t.cameraSpeed > t.maxSpeed || t.cameraBack >= t.cameraFront ||
      t.cameraPressureWidth <= 0 || t.cameraGuardMargin * 2 >= t.cameraFront - t.cameraBack || t.worldPixelsPerMetre <= 0 || t.waterMaxVerticalSpeed <= 0 ||
      t.shellMaxAngle < Math.PI / 6 || t.shellMaxAngle > Math.PI / 4 ||
      !Number.isInteger(t.maxStepsPerFrame) || t.maxStepsPerFrame < 1) throw new Error('Invalid tuning bounds');
}

export const PHYSICS_GEOMETRY = {
  turtleHalfWidth: 0.95, turtleHalfHeight: 0.24, shellPivotY: 0.30,
  shellVertices: [-1.1, -0.05, 1.1, -0.05, 1.1, 0, 0.8, 0.32, 0.6, 0.42, -0.6, 0.42, -0.8, 0.32, -1.1, 0],
  controllerOffset: 0.05, controllerNudge: 0.003, stepHeight: 0.32, stepMinWidth: 0.3, maxClimbAngle: Math.PI / 4,
  settleTicks: 30, initialCameraOffset: 3.5,
  solverIterations: 8, internalSolverIterations: 2, terrainFloorY: -20,
  grassFriction: 0.8, rockFriction: 1, contactTolerance: 0.03, waterBottomClearance: 0.1,
} as const;
