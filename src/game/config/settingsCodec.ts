/** Human-authored numeric settings. This codec has no renderer or filesystem dependency. */
export const SETTINGS_RULES = {
  gravity: { min: 0.1, max: 30 },
  cameraVerticalSpeed: { min: 0.1, max: 10 },
  cameraSpeed: { min: 0.1, max: 10 },
  cameraRearPercent: { min: 0, max: 100 },
  cameraFrontPercent: { min: 0, max: 100 },
  cameraDeadZonePercent: { min: 0, max: 45 },
  cameraPressureWidth: { min: 0.05, max: 5 },
  cameraGuardMargin: { min: 0, max: 2 },
  cameraRecovery: { min: 0.1, max: 10 },
  baseSpeed: { min: 0.1, max: 10 },
  minSpeed: { min: 0.1, max: 10 },
  maxSpeed: { min: 0.1, max: 10 },
  acceleration: { min: 0.1, max: 5 },
  braking: { min: 0.1, max: 5 },
  shellMaxAngle: { min: Math.PI / 6, max: Math.PI / 4 },
  shellAngularSpeed: { min: 0.1, max: 2 },
  shellAngularDamping: { min: 0.1, max: 20 },
  shellPivotY: { min: 0.1, max: 0.8 },
  cargoFriction: { min: 0.05, max: 2 },
  cargoLinearDamping: { min: 0, max: 3 },
  cargoAngularDamping: { min: 0, max: 3 },
  gripAssistance: { min: 0, max: 3 },
  lossGraceSeconds: { min: 0.1, max: 2 },
  waterRiseAcceleration: { min: 0.1, max: 20 },
  waterWeightInfluence: { min: 0.05, max: 0.5 },
  waterDrag: { min: 0, max: 10 },
  waterSwimAcceleration: { min: 0.1, max: 20 },
  waterSwimWeightInfluence: { min: 0, max: 1 },
  waterCurrent: { min: 0, max: 2 },
  waterMaxVerticalSpeed: { min: 0.1, max: 5 },
  waterEntryDamping: { min: 0, max: 20 },
  waterBaseDepth: { min: 0, max: 2 },
  waterDepthPerKg: { min: 0, max: 0.5 },
  waterExitMargin: { min: 0, max: 2 },
  grassLandingDamping: { min: 0, max: 1 },
  rockLandingDamping: { min: 0, max: 1 },
  jumpMaxChargeSeconds: { min: 0.1, max: 10 },
  jumpMaxLaunchSpeed: { min: 0.1, max: 12 },
} as const;

export type SettingsKey = keyof typeof SETTINGS_RULES;
export type AdjustableSettings = { [K in SettingsKey]: number };
export const SETTINGS_KEYS = Object.keys(SETTINGS_RULES) as SettingsKey[];
export const SETTINGS_SCHEMA_VERSION = 2;
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

export function validateSettings(values: AdjustableSettings): void {
  for (const key of Object.keys(values)) {
    if (!Object.hasOwn(SETTINGS_RULES, key)) throw new Error('settings.txt: unknown setting ' + key);
  }
  for (const key of SETTINGS_KEYS) {
    const value = values[key];
    const { min, max } = SETTINGS_RULES[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      throw new Error(`settings.txt: ${key} must be a finite number between ${min} and ${max}`);
    }
  }
  if (values.minSpeed > values.baseSpeed || values.baseSpeed > values.maxSpeed) {
    throw new Error('settings.txt: minSpeed <= baseSpeed <= maxSpeed is required');
  }
  if (values.cameraSpeed < values.minSpeed || values.cameraSpeed > values.maxSpeed) {
    throw new Error('settings.txt: cameraSpeed must lie between minSpeed and maxSpeed');
  }
  if (values.cameraRearPercent >= values.cameraFrontPercent) {
    throw new Error('settings.txt: cameraRearPercent must be less than cameraFrontPercent');
  }
}

/** Require every schema key; comments, LF/CRLF and decimal exponents are supported. */
export function parseSettings(text: string): AdjustableSettings {
  const values: Partial<AdjustableSettings> = {};
  const seen = new Set<string>();
  let version: number | undefined;
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const entry = lines[index].split('#', 1)[0].trim();
    if (!entry) continue;
    const fail = (message: string): never => { throw new Error(`settings.txt:${index + 1}: ${message}`); };
    const match = /^([A-Za-z][A-Za-z0-9]*)\s*=\s*(.*?)$/.exec(entry);
    if (!match) fail('expected key=value');
    const [, key, raw] = match!;
    if (seen.has(key)) fail('duplicate setting ' + key);
    if (key !== 'schemaVersion' && !Object.hasOwn(SETTINGS_RULES, key)) fail('unknown setting ' + key);
    if (!NUMBER.test(raw)) fail('expected a decimal number for ' + key);
    const value = Number(raw);
    if (!Number.isFinite(value)) fail('non-finite number for ' + key);
    seen.add(key);
    if (key === 'schemaVersion') {
      if (value !== SETTINGS_SCHEMA_VERSION) fail('unsupported schemaVersion ' + raw + '; use schemaVersion=2, cameraDeadZonePercent and shellPivotY (see README)');
      version = value;
    } else {
      values[key as SettingsKey] = value;
    }
  }
  if (version === undefined) throw new Error('settings.txt: missing schemaVersion');
  const missing = SETTINGS_KEYS.filter(key => !seen.has(key));
  if (missing.length) throw new Error('settings.txt: missing setting ' + missing.join(', '));
  const complete = values as AdjustableSettings;
  validateSettings(complete);
  return complete;
}

/** Stable ordering and decimal values make exports directly reusable as settings.txt. */
export function serializeSettings(values: AdjustableSettings): string {
  validateSettings(values);
  return [
    '# Mudanzas Tortuga, S.L. - canonical adjustable defaults',
    '# Rear/front percentages use the fixed laboratory viewport. Dead zone is per side of a normal viewport.',
    '# Shell pivot height uses metres. Angles use radians.',
    '# Metres, kilograms and seconds elsewhere; see docs/PHYSICS.md for meanings.',
    `schemaVersion=${SETTINGS_SCHEMA_VERSION}`,
    ...SETTINGS_KEYS.map(key => key + '=' + String(values[key])),
    '',
  ].join('\n');
}
