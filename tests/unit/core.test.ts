import { describe, expect, it, vi } from 'vitest';
import {
  BASELINE_TUNING,
  createTuning,
  validateTuning,
  type Tuning,
} from '../../src/game/config/tuning';
import { SCENARIOS, terrainAt } from '../../src/game/content/scenarios';
import { FixedLoop } from '../../src/game/core/fixedLoop';
import {
  approach,
  nextShellAngle,
  targetSpeed,
} from '../../src/game/systems/controller';
import { publicAsset } from '../../src/utils/publicAsset';

describe('FixedLoop', () => {
  it.each([30, 60, 120])(
    'simulates three seconds as 180 fixed ticks at %s render FPS',
    (fps) => {
      const loop = new FixedLoop(1 / 60);
      const step = vi.fn();
      let reportedTicks = 0;

      for (let frame = 0; frame < fps * 3; frame += 1) {
        reportedTicks += loop.advance(1 / fps, step);
      }

      expect(step).toHaveBeenCalledTimes(180);
      expect(reportedTicks).toBe(180);
    },
  );

  it('clears pending fractions during pause and does not catch up on resume', () => {
    const loop = new FixedLoop(1 / 60);
    const step = vi.fn();
    expect(loop.advance(1 / 120, step)).toBe(0);

    loop.paused = true;
    expect(loop.advance(30, step)).toBe(0);
    expect(step).not.toHaveBeenCalled();

    loop.paused = false;
    expect(loop.advance(0, step)).toBe(0);
    expect(loop.advance(1 / 120, step)).toBe(0);
    expect(loop.advance(1 / 120, step)).toBe(1);
    expect(step).toHaveBeenCalledTimes(1);
  });

  it('single-steps exactly once only while paused', () => {
    const loop = new FixedLoop(1 / 60);
    const step = vi.fn();

    loop.singleStep(step);
    expect(step).not.toHaveBeenCalled();
    loop.paused = true;
    loop.singleStep(step);
    expect(step).toHaveBeenCalledTimes(1);
    loop.advance(10, step);
    expect(step).toHaveBeenCalledTimes(1);
    loop.paused = false;
    loop.advance(0, step);
    expect(step).toHaveBeenCalledTimes(1);
  });

  it('bounds a long frame and discards its excess wall time', () => {
    const loop = new FixedLoop(1 / 60, 0.1, 6);
    const step = vi.fn();

    expect(loop.advance(60, step)).toBe(6);
    expect(step).toHaveBeenCalledTimes(6);
    expect(loop.advance(0, step)).toBe(0);
    expect(loop.advance(1 / 60, step)).toBe(1);
  });

  it('honors a lower step budget without retaining whole backlog ticks', () => {
    const loop = new FixedLoop(1 / 60, 1, 3);
    const step = vi.fn();

    expect(loop.advance(1, step)).toBe(3);
    expect(loop.advance(0, step)).toBe(0);
    expect(step).toHaveBeenCalledTimes(3);
  });

  it('reset clears a pending fractional tick', () => {
    const loop = new FixedLoop(1 / 60);
    const step = vi.fn();
    loop.advance(1 / 120, step);
    loop.reset();

    expect(loop.advance(1 / 120, step)).toBe(0);
    expect(step).not.toHaveBeenCalled();
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'ignores invalid elapsed wall time %s',
    (elapsed) => {
      const step = vi.fn();
      expect(new FixedLoop(1 / 60).advance(elapsed, step)).toBe(0);
      expect(step).not.toHaveBeenCalled();
    },
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid fixed timestep %s',
    (stepSeconds) => {
      expect(() => new FixedLoop(stepSeconds)).toThrow();
    },
  );
});

describe('turtle and shell controls', () => {
  it('approaches a target progressively and never overshoots it', () => {
    expect(approach(0, 2, 0.5)).toBe(0.5);
    expect(approach(1.9, 2, 0.5)).toBe(2);
    expect(approach(2, 0, 0.5)).toBe(1.5);
    expect(approach(0.1, 0, 0.5)).toBe(0);
    expect(approach(1, 2, 0)).toBe(1);
  });

  it.each([-1, 1])('tilts progressively and respects the %s angle bound', (input) => {
    const tuning = createTuning();
    let angle = 0;
    let speed = 0;
    const first = nextShellAngle(angle, speed, input, 1 / 60, tuning);

    expect(Math.sign(first.angle)).toBe(input);
    expect(Math.abs(first.angle)).toBeGreaterThan(0);
    expect(Math.abs(first.angle)).toBeLessThan(tuning.shellMaxAngle / 10);

    for (let tick = 0; tick < 180; tick += 1) {
      ({ angle, speed } = nextShellAngle(angle, speed, input, 1 / 60, tuning));
      expect(Math.abs(angle)).toBeLessThanOrEqual(tuning.shellMaxAngle);
      expect(Math.abs(speed)).toBeLessThanOrEqual(tuning.shellAngularSpeed);
    }

    expect(angle).toBe(input * tuning.shellMaxAngle);
    expect(speed).toBe(0);
    const correction = nextShellAngle(angle, speed, -input, 1 / 60, tuning);
    expect(Math.abs(correction.angle)).toBeLessThan(tuning.shellMaxAngle);
  });

  it('damps angular motion after release without snapping the shell angle', () => {
    const tuning = createTuning();
    const result = nextShellAngle(0.2, 0.4, 0, 1 / 60, tuning);

    expect(result.speed).toBeGreaterThan(0);
    expect(result.speed).toBeLessThan(0.4);
    expect(result.angle).toBeGreaterThan(0.2);
    expect(result.angle - 0.2).toBeLessThan(0.4 / 60);
  });

  it('applies continuous front and rear speed pressure at the safe boundaries', () => {
    const tuning = createTuning();
    const { cameraBack: back, cameraFront: front, cameraPressureWidth: width } = tuning;
    const nearFront = targetSpeed(1, front - 0.001, tuning);
    const middleFront = targetSpeed(1, front - width / 2, tuning);
    const nearBack = targetSpeed(-1, back + 0.001, tuning);
    const middleBack = targetSpeed(-1, back + width / 2, tuning);

    expect(targetSpeed(1, front - width, tuning)).toBeCloseTo(tuning.maxSpeed);
    expect(nearFront).toBeGreaterThan(tuning.cameraSpeed);
    expect(nearFront).toBeLessThan(middleFront);
    expect(middleFront).toBeLessThan(tuning.maxSpeed);
    expect(targetSpeed(1, front, tuning)).toBe(tuning.cameraSpeed);
    expect(targetSpeed(1, front + 0.001, tuning)).toBe(tuning.cameraSpeed);
    expect(nearFront - tuning.cameraSpeed).toBeLessThan(0.005);

    expect(targetSpeed(-1, back + width, tuning)).toBeCloseTo(tuning.minSpeed);
    expect(nearBack).toBeLessThan(tuning.cameraSpeed);
    expect(nearBack).toBeGreaterThan(middleBack);
    expect(middleBack).toBeGreaterThan(tuning.minSpeed);
    expect(targetSpeed(-1, back, tuning)).toBe(tuning.cameraSpeed);
    expect(targetSpeed(-1, back - 0.001, tuning)).toBe(tuning.cameraSpeed);
    expect(tuning.cameraSpeed - nearBack).toBeLessThan(0.005);
  });

  it.each([-1, 1])(
    'keeps sustained input %s inside the safe window through integrated velocity',
    (input) => {
      const tuning = createTuning();
      const dt = 1 / tuning.physicsHz;
      let screenX = (tuning.cameraBack + tuning.cameraFront) / 2;
      let speed = tuning.baseSpeed;

      for (let tick = 0; tick < tuning.physicsHz * 20; tick += 1) {
        const target = targetSpeed(input, screenX, tuning);
        const rate = target > speed ? tuning.acceleration : tuning.braking;
        speed = approach(speed, target, rate * dt);
        screenX += (speed - tuning.cameraSpeed) * dt;

        expect(Number.isFinite(screenX)).toBe(true);
        expect(speed).toBeGreaterThan(0);
        expect(speed).toBeGreaterThanOrEqual(tuning.minSpeed);
        expect(speed).toBeLessThanOrEqual(tuning.maxSpeed);
        expect(screenX).toBeGreaterThanOrEqual(tuning.cameraBack - 1e-6);
        expect(screenX).toBeLessThanOrEqual(tuning.cameraFront + 1e-6);
      }

      expect(speed).toBeCloseTo(tuning.cameraSpeed, 4);
      expect(screenX).toBeCloseTo(input > 0 ? tuning.cameraFront : tuning.cameraBack, 3);
    },
  );

  it('allows recovery from either edge while preventing a reverse target', () => {
    const tuning = createTuning();
    expect(targetSpeed(1, tuning.cameraBack, tuning)).toBeGreaterThan(tuning.cameraSpeed);
    expect(targetSpeed(-1, tuning.cameraFront, tuning)).toBeLessThan(tuning.cameraSpeed);

    for (const input of [-1, 0, 1]) {
      for (const screenX of [tuning.cameraBack - 10, tuning.cameraBack, tuning.cameraFront, tuning.cameraFront + 10]) {
        expect(targetSpeed(input, screenX, tuning)).toBeGreaterThan(0);
      }
    }
  });

  it('keeps a deep-current advantage subject to the same front pressure', () => {
    const tuning = createTuning();
    const middle = (tuning.cameraBack + tuning.cameraFront) / 2;

    expect(targetSpeed(0, middle, tuning, 0.65)).toBeGreaterThan(targetSpeed(0, middle, tuning));
    expect(targetSpeed(1, tuning.cameraFront, tuning, 0.65)).toBe(tuning.cameraSpeed);
  });
});

describe('canonical tuning validation', () => {
  it('accepts baseline values and gives each caller an independent configuration', () => {
    const baselineAcceleration = BASELINE_TUNING.acceleration;
    const first = createTuning();
    const second = createTuning();
    expect(() => validateTuning(first)).not.toThrow();
    first.acceleration += 1;
    expect(second.acceleration).toBe(baselineAcceleration);
    expect(BASELINE_TUNING.acceleration).toBe(baselineAcceleration);
  });

  const invalidBounds: readonly [string, Partial<Tuning>][] = [
    ['zero physics frequency', { physicsHz: 0 }],
    ['zero minimum speed', { minSpeed: 0 }],
    ['minimum above base speed', { minSpeed: BASELINE_TUNING.baseSpeed + 1 }],
    ['base above maximum speed', { baseSpeed: BASELINE_TUNING.maxSpeed + 1 }],
    ['camera below minimum speed', { cameraSpeed: BASELINE_TUNING.minSpeed / 2 }],
    ['camera above maximum speed', { cameraSpeed: BASELINE_TUNING.maxSpeed + 1 }],
    ['reversed camera window', { cameraBack: BASELINE_TUNING.cameraFront + 1 }],
    ['empty camera window', { cameraBack: BASELINE_TUNING.cameraFront }],
    ['zero pressure width', { cameraPressureWidth: 0 }],
    ['zero world scale', { worldPixelsPerMetre: 0 }],
    ['zero swimming speed', { waterMaxVerticalSpeed: 0 }],
    ['shell below 30 degrees', { shellMaxAngle: Math.PI / 7 }],
    ['shell above 45 degrees', { shellMaxAngle: Math.PI / 3 }],
    ['fractional step budget', { maxStepsPerFrame: 1.5 }],
    ['zero step budget', { maxStepsPerFrame: 0 }],
    ['zero frame-time budget', { maxFrameSeconds: 0 }],
    ['nonfinite gravity', { gravity: Number.POSITIVE_INFINITY }],
    ['NaN grip', { gripAssistance: Number.NaN }],
    ['negative cargo friction', { cargoFriction: -1 }],
  ];

  it.each(invalidBounds)('rejects %s', (_label, changes) => {
    expect(() => validateTuning({ ...createTuning(), ...changes })).toThrow();
  });
});

describe('public asset URLs', () => {
  it.each([
    ['/', 'sprites/turtle/walk-01.svg', '/sprites/turtle/walk-01.svg'],
    ['/', '/sprites/cargo/sofa.svg', '/sprites/cargo/sofa.svg'],
    ['/MudanzasTortuga/', 'sprites/turtle/walk-01.svg', '/MudanzasTortuga/sprites/turtle/walk-01.svg'],
    ['/MudanzasTortuga', '/sprites/cargo/sofa.svg', '/MudanzasTortuga/sprites/cargo/sofa.svg'],
  ])('resolves %s and %s under the deployment base', (base, path, expected) => {
    expect(publicAsset(path, base)).toBe(expected);
  });
});

describe('diagnostic scenario terrain', () => {
  it('uses unique scenario IDs', () => {
    expect(new Set(SCENARIOS.map((scenario) => scenario.id)).size).toBe(SCENARIOS.length);
  });

  it.each(SCENARIOS)('$id has continuous terrain covering start through end', (scenario) => {
    expect(Number.isFinite(scenario.startX)).toBe(true);
    expect(Number.isFinite(scenario.startY)).toBe(true);
    expect(Number.isFinite(scenario.endX)).toBe(true);
    expect(scenario.endX).toBeGreaterThan(scenario.startX);
    expect(scenario.terrain.length).toBeGreaterThan(0);

    let previousEnd: { x: number; y: number } | undefined;
    for (const strip of scenario.terrain) {
      expect(strip.points.length).toBeGreaterThanOrEqual(2);
      const start = strip.points[0];
      expect(start).toBeDefined();
      if (previousEnd) expect(start).toEqual(previousEnd);
      for (let index = 0; index < strip.points.length; index += 1) {
        const point = strip.points[index];
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
        if (index > 0) expect(point.x).toBeGreaterThan(strip.points[index - 1].x);
        expect(terrainAt(scenario, point.x).height).toBeCloseTo(point.y);
      }
      previousEnd = strip.points[strip.points.length - 1];
    }

    expect(terrainAt(scenario, scenario.startX).height).toBeCloseTo(scenario.startY);
    for (let sample = 0; sample <= 100; sample += 1) {
      const x = scenario.startX + (scenario.endX - scenario.startX) * sample / 100;
      expect(Number.isFinite(terrainAt(scenario, x).height)).toBe(true);
    }

    if (scenario.water) {
      const water = scenario.water;
      for (const value of Object.values(water)) expect(Number.isFinite(value)).toBe(true);
      expect(water.left).toBeLessThan(water.right);
      expect(water.left).toBeGreaterThanOrEqual(scenario.startX);
      expect(water.right).toBeLessThan(scenario.endX);
      expect(water.surface).toBeGreaterThan(water.bottom);
    }
  });

  it('interpolates a ramp and rejects queries beyond diagnostic terrain', () => {
    const slopes = SCENARIOS.find((scenario) => scenario.id === 'slopes');
    expect(slopes).toBeDefined();
    if (!slopes) throw new Error('Missing required slope diagnostic');

    expect(terrainAt(slopes, 15).height).toBeCloseTo(1);
    expect(() => terrainAt(slopes, -13)).toThrow(/Outside/);
    expect(() => terrainAt(slopes, 131)).toThrow(/Outside/);
  });
});
