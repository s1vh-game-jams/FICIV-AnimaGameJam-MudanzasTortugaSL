import { describe, expect, it, vi } from 'vitest';
import sourceSettings from '../../settings.txt?raw';
import {
  parseSettings, serializeSettings, validateSettings, SETTINGS_KEYS,
  type AdjustableSettings,
} from '../../src/game/config/settingsCodec';
import {
  BASELINE_TUNING, createTuning, exportSettings, TUNING_FIELDS, validateTuning, withTuning,
} from '../../src/game/config/tuning';

const defaults = () => parseSettings(sourceSettings);
const replaceSetting = (key: string, value: string) =>
  sourceSettings.replace(new RegExp('^' + key + '=.*$', 'm'), key + '=' + value);

describe('canonical text settings', () => {
  it('loads every adjustable default from the repository source and keeps copies independent', () => {
    const settings = defaults();
    const first = createTuning(), second = createTuning();
    for (const key of SETTINGS_KEYS) {
      expect(first[key]).toBe(settings[key]);
      expect(BASELINE_TUNING[key]).toBe(settings[key]);
    }
    first.gravity = 12;
    expect(second.gravity).toBe(settings.gravity);
    expect(BASELINE_TUNING.gravity).toBe(settings.gravity);
    expect(Object.isFrozen(BASELINE_TUNING)).toBe(true);
    expect(first.shellPivotY).toBe(settings.shellPivotY);
    expect(first.jumpMaxLaunchSpeed).toBe(settings.jumpMaxLaunchSpeed);
  });

  it('accepts BOM, Windows newlines, spacing, blank lines, comments and decimal exponents', () => {
    const text = '\uFEFF# ignored header\r\n\r\n' + sourceSettings
      .replace(/^gravity=.*$/m, '  gravity = ' + String(defaults().gravity) + 'e0 # inline unit comment')
      .replace(/\n/g, '\r\n');
    expect(parseSettings(text)).toEqual(defaults());
  });

  it('exports the same complete schema in stable order and round-trips edited values', () => {
    const tuning = withTuning(createTuning(), {
      gravity: 12.4, cameraRearPercent: 17, cameraFrontPercent: 37,
      cameraDeadZonePercent: 35, shellPivotY: 0.42, jumpMaxChargeSeconds: 2.5, waterSwimAcceleration: 5.5,
    });
    const text = exportSettings(tuning);
    const parsed = parseSettings(text);
    for (const key of SETTINGS_KEYS) expect(parsed[key]).toBe(tuning[key]);
    expect(serializeSettings(parsed)).toBe(text);
    expect(text.endsWith('\n')).toBe(true);
    expect(text).not.toMatch(/(?:physicsHz|cameraBack|cameraFront|viewWidth|worldPixelsPerMetre)=/);
    expect(text.match(/^schemaVersion=/gm)).toHaveLength(1);
    expect(text.split('\n').filter(line => /^[A-Za-z]/.test(line))).toHaveLength(SETTINGS_KEYS.length + 1);
  });

  it.each([
    ['unknown key', () => sourceSettings + '\nunknownSetting=2', /unknownSetting/],
    ['duplicate key', () => sourceSettings + '\ngravity=10', /duplicate setting gravity/],
    ['duplicate version', () => sourceSettings + '\nschemaVersion=2', /duplicate setting schemaVersion/],
    ['missing version', () => sourceSettings.replace('schemaVersion=2', ''), /missing schemaVersion/],
    ['unsupported version', () => sourceSettings.replace('schemaVersion=2', 'schemaVersion=99'), /unsupported schemaVersion/],
    ['old zoom format', () => sourceSettings.replace('schemaVersion=2', 'schemaVersion=1'), /cameraDeadZonePercent and shellPivotY/],
    ['missing value', () => sourceSettings.replace(/^waterSwimAcceleration=.*$/m, ''), /missing setting waterSwimAcceleration/],
    ['empty value', () => replaceSetting('gravity', ''), /decimal number.*gravity/],
    ['NaN', () => replaceSetting('gravity', 'NaN'), /decimal number.*gravity/],
    ['Infinity', () => replaceSetting('gravity', 'Infinity'), /decimal number.*gravity/],
    ['numeric overflow', () => replaceSetting('gravity', '1e999'), /non-finite number.*gravity/],
    ['hexadecimal', () => replaceSetting('gravity', '0x10'), /decimal number.*gravity/],
    ['boolean', () => replaceSetting('gravity', 'true'), /decimal number.*gravity/],
    ['expression', () => replaceSetting('gravity', '9.81 * 2'), /decimal number.*gravity/],
    ['missing assignment', () => sourceSettings + '\njumpMaxLaunchSpeed', /expected key=value/],
    ['prototype key', () => sourceSettings + '\n__proto__=1', /expected key=value/],
  ] as const)('rejects %s with a useful text diagnostic', (_name, text, error) => {
    expect(() => parseSettings(text())).toThrow(error);
  });

  it('includes the source line number for syntactically invalid assignments', () => {
    expect(() => parseSettings('# header\nschemaVersion=2\ngravity=nope')).toThrow('settings.txt:3:');
  });

  it.each([
    ['negative gravity', { gravity: -1 }],
    ['zero charge time', { jumpMaxChargeSeconds: 0 }],
    ['excessive launch speed', { jumpMaxLaunchSpeed: 100 }],
    ['rear after front', { cameraRearPercent: 50, cameraFrontPercent: 40 }],
    ['camera out of speed range', { cameraSpeed: 5 }],
    ['reversed turtle speed range', { minSpeed: 3 }],
    ['overlapping dead zones', { cameraDeadZonePercent: 50 }],
    ['negative shell height', { shellPivotY: -1 }],
    ['NaN buoyancy', { waterRiseAcceleration: Number.NaN }],
    ['infinite swimming mass response', { waterSwimWeightInfluence: Number.POSITIVE_INFINITY }],
  ] as const)('validates %s before serializing or applying', (_name, changes) => {
    const settings = { ...defaults(), ...changes };
    expect(() => validateSettings(settings)).toThrow();
    expect(() => serializeSettings(settings)).toThrow();
    expect(() => withTuning(createTuning(), changes)).toThrow();
  });

  it('rejects unknown or missing programmatic settings rather than exporting an incomplete file', () => {
    expect(() => validateSettings({ ...defaults(), accidentalKey: 1 } as AdjustableSettings)).toThrow(/unknown setting/);
    const incomplete: Partial<AdjustableSettings> = defaults();
    delete incomplete.waterCurrent;
    expect(() => serializeSettings(incomplete as AdjustableSettings)).toThrow(/waterCurrent/);
  });

  it('keeps malformed source parsing inside startup rather than module initialization', async () => {
    vi.resetModules();
    vi.doMock('../../settings.txt?raw', () => ({ default: 'schemaVersion=2\ngravity=bad\n' }));
    try {
      const module = await import('../../src/game/config/tuning');
      expect(() => module.createTuning()).toThrow(/settings.txt:2:.*gravity/);
    } finally {
      vi.doUnmock('../../settings.txt?raw');
      vi.resetModules();
    }
  });
});

describe('viewport-derived tuning', () => {
  it('maps baseline movement margins to the fixed laboratory reference', () => {
    const tuning = createTuning();
    expect(tuning.cameraBack).toBeCloseTo(tuning.viewWidth / tuning.worldPixelsPerMetre * tuning.cameraRearPercent / 100, 12);
    expect(tuning.cameraFront).toBeCloseTo(tuning.viewWidth / tuning.worldPixelsPerMetre * tuning.cameraFrontPercent / 100, 12);
    expect(() => validateTuning(tuning)).not.toThrow();
  });

  it.each([0, 20, 40, 45])('keeps laboratory margins independent of dead zone %s', cameraDeadZonePercent => {
    const base = createTuning();
    const tuning = withTuning(base, { cameraDeadZonePercent });
    const pixelsPerMetre = tuning.worldPixelsPerMetre;
    expect(tuning.cameraBack * pixelsPerMetre / tuning.viewWidth * 100).toBeCloseTo(tuning.cameraRearPercent, 12);
    expect(tuning.cameraFront * pixelsPerMetre / tuning.viewWidth * 100).toBeCloseTo(tuning.cameraFrontPercent, 12);
    expect(tuning.cameraBack).toBe(base.cameraBack);
    expect(tuning.cameraFront).toBe(base.cameraFront);
  });

  it('recomputes derived values rather than accepting manual camera-limit overrides', () => {
    const base = createTuning();
    const tuning = withTuning(base, { cameraBack: 999, cameraFront: 1000 });
    expect(tuning.cameraBack).toBe(base.cameraBack);
    expect(tuning.cameraFront).toBe(base.cameraFront);
    expect(() => validateTuning({ ...base, cameraBack: 999 })).toThrow(/camera limits/);
  });

  it('rejects a window too narrow for smooth recovery and an offscreen turtle boundary', () => {
    const base = createTuning();
    expect(() => withTuning(base, { cameraRearPercent: 20, cameraFrontPercent: 21 })).toThrow(/cameraGuardMargin/);
    expect(() => withTuning(base, { cameraRearPercent: 0 })).toThrow(/room for the turtle/);
    expect(() => withTuning(base, { cameraFrontPercent: 100 })).toThrow(/room for the turtle/);
    expect(base).toEqual(createTuning());
  });

  it('exports every exposed field and never exposes derived or fixed scheduler values', () => {
    const settings = parseSettings(exportSettings(createTuning()));
    const fields = TUNING_FIELDS.map(field => field.key);
    expect(new Set(fields).size).toBe(fields.length);
    expect(fields).toHaveLength(19);
    for (const field of TUNING_FIELDS) {
      expect(settings[field.key]).toBeDefined();
      expect(settings[field.key]).toBeGreaterThanOrEqual(field.min);
      expect(settings[field.key]).toBeLessThanOrEqual(field.max);
    }
    expect(fields).toEqual(expect.arrayContaining([
      'cameraRearPercent', 'cameraFrontPercent', 'cameraDeadZonePercent', 'shellPivotY', 'jumpMaxChargeSeconds',
      'jumpMaxLaunchSpeed', 'gravity', 'waterRiseAcceleration', 'waterSwimAcceleration',
      'waterSwimWeightInfluence',
    ]));
  });
});
