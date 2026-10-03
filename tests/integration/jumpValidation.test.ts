import { describe, expect, it } from 'vitest';
import { createTuning, withTuning } from '../../src/game/config/tuning';
import { validateJumpTraversal, type JumpTraversalCase } from '../../src/game/content/jumpValidation';
import type { Scenario } from '../../src/game/content/scenarios';

const wall = (height: number): Scenario => ({
  id: `jump-gate-wall-${height}`, label: 'Jump content gate fixture', description: 'Near-vertical mandatory wall.',
  startX: 0, startY: 0, endX: 16,
  terrain: [{ biome: 'grass', points: [
    { x: -12, y: 0 }, { x: 5, y: 0 }, { x: 5.001, y: height }, { x: 24, y: height },
  ] }],
});
// Landing must be beyond the vertical face plus the rear shell footprint;
// a later walking checkpoint on the plateau cannot certify the jump itself.
const route: JumpTraversalCase = { chargeAtX: 3.7, landingX: 6.15, maxSeconds: 12, load: 'empty' };
const fullJump = () => withTuning(createTuning(), { jumpMaxLaunchSpeed: 8 });

describe('authored jump traversal gates using current real physics', () => {
  it.each(['empty', 'full'] as const)('clears a reachable wall and lands with the %s load', load => {
    const tuning = fullJump();
    const result = validateJumpTraversal(wall(2), tuning, { ...route, load });
    expect(result.outcome, `First landing X: ${result.final.turtle.x}`).toBe('passed');
    expect(result.passed).toBe(true);
    expect(result.launched).toBe(true);
    expect(result.chargeSeconds).toBe(tuning.jumpMaxChargeSeconds);
    expect(result.final.turtle.grounded).toBe(true);
    expect(result.final.turtle.x).toBeGreaterThanOrEqual(route.landingX);
    expect(result.elapsedSeconds).toBeLessThanOrEqual(route.maxSeconds);
  });

  it('rejects a wall too high for the current full-charge launch', () => {
    const result = validateJumpTraversal(wall(5), fullJump(), route);
    expect(result.passed).toBe(false);
    expect(result.outcome).toBe('landing-short');
    expect(result.launched).toBe(true);
    expect(result.final.turtle.x).toBeLessThan(route.landingX);
  });

  it.each([{ jumpMaxLaunchSpeed: 4.5 }, { gravity: 24 }])('revalidates the same geometry after tuning changes %j', changes => {
    const result = validateJumpTraversal(wall(2), withTuning(fullJump(), changes), route);
    expect(result.passed).toBe(false);
    expect(result.final.turtle.x).toBeLessThan(route.landingX);
    expect(result.launchSpeed).toBe(changes.jumpMaxLaunchSpeed ?? 8);
    expect(result.gravity).toBe(changes.gravity ?? fullJump().gravity);
  });

  it('does not certify a walk/autostep endpoint reached before a full jump', () => {
    const scenario: Scenario = {
      id: 'walk-is-not-jump', label: 'Flat short fixture', description: '', startX: 0, startY: 0, endX: 4,
      terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 20, y: 0 }] }],
    };
    const result = validateJumpTraversal(scenario, fullJump(), { ...route, chargeAtX: 1, landingX: 3, maxSeconds: 4 });
    expect(result.passed).toBe(false);
    expect(result.launched).toBe(false);
    expect(result.final.turtle.x).toBeGreaterThanOrEqual(3);
  });

  it('rejects a short first landing even when later walking could reach the endpoint', () => {
    const scenario: Scenario = {
      id: 'short-jump-before-walk', label: 'Landing must satisfy the gate', description: '', startX: 0, startY: 0, endX: 24,
      terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 40, y: 0 }] }],
    };
    const result = validateJumpTraversal(scenario, fullJump(), { ...route, chargeAtX: 0, landingX: 18, maxSeconds: 15 });
    expect(result.passed).toBe(false);
    expect(result.outcome).toBe('landing-short');
    expect(result.launched).toBe(true);
    expect(result.final.turtle.grounded).toBe(true);
    expect(result.final.turtle.x).toBeLessThan(18);
  });

  it('rejects charging canceled by an authored drop before release', () => {
    const scenario: Scenario = {
      id: 'charge-drop-fixture', label: 'Unsafe charging approach', description: '', startX: 0, startY: 0, endX: 14,
      terrain: [{ biome: 'grass', points: [
        { x: -12, y: 0 }, { x: 2, y: 0 }, { x: 2.001, y: -6 }, { x: 24, y: -6 },
      ] }],
    };
    const result = validateJumpTraversal(scenario, fullJump(), { ...route, chargeAtX: 0.2 });
    expect(result.passed).toBe(false);
    expect(result.outcome).toBe('charge-canceled');
    expect(result.launched).toBe(false);
  });

  it('fails a charge trigger that is never eligible on underwater terrain', () => {
    const scenario: Scenario = {
      id: 'underwater-charge-fixture', label: 'Ineligible start', description: '', startX: 0, startY: -0.5, endX: 14,
      terrain: [{ biome: 'grass', points: [{ x: -12, y: -2 }, { x: 24, y: -2 }] }],
      water: { left: -1, right: 20, surface: 0, bottom: -2 },
    };
    const result = validateJumpTraversal(scenario, fullJump(), { ...route, chargeAtX: 0.2 });
    expect(result.passed).toBe(false);
    expect(result.outcome).toBe('ineligible-charge');
    expect(result.launched).toBe(false);
  });

  it('requires an explicit finite ordered route and bounded time budget', () => {
    const tuning = fullJump();
    for (const changes of [{ maxSeconds: Infinity }, { maxSeconds: Number.MAX_VALUE }, { maxSeconds: 0 },
      { landingX: 3 }, { landingX: 17 }, { chargeAtX: -1 }]) {
      expect(() => validateJumpTraversal(wall(2), tuning, { ...route, ...changes })).toThrow(RangeError);
    }
  });

  it('produces reproducible outcomes from the same configured route', () => {
    const tuning = fullJump();
    const first = validateJumpTraversal(wall(2), tuning, route);
    const second = validateJumpTraversal(wall(2), tuning, route);
    expect(second).toEqual(first);
  });
});
