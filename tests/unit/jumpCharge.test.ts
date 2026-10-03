import { describe, expect, it } from 'vitest';
import { JumpCharge } from '../../src/game/systems/jumpCharge';

describe('JumpCharge', () => {
  it.each([0.75, 1.5, 2.25, 3])('launches once with a linear fraction after %s seconds', (seconds) => {
    const jump = new JumpCharge();
    expect(jump.update({ jumpPressed: true, jumpHeld: true }, true, seconds, 3)).toBeUndefined();
    expect(jump.state).toBe('charging');
    expect(jump.chargeSeconds).toBe(seconds);
    expect(jump.update({ jumpReleased: true }, true, 1 / 60, 3)).toBe(seconds / 3);
    expect(jump.state).toBe('idle');
    expect(jump.chargeSeconds).toBe(0);
    expect(jump.update({ jumpReleased: true }, true, 1 / 60, 3)).toBeUndefined();
  });

  it('caps exactly at 180 fixed ticks and never auto-launches while held', () => {
    const jump = new JumpCharge();
    for (let tick = 0; tick < 360; tick++) {
      expect(jump.update({ jumpPressed: tick === 0, jumpHeld: true }, true, 1 / 60, 3)).toBeUndefined();
      expect(jump.charge).toBeLessThanOrEqual(1);
      if (tick === 179) expect(jump.chargeSeconds).toBe(3);
    }
    expect(jump.charging).toBe(true);
    expect(jump.chargeSeconds).toBe(3);
    expect(jump.update({ jumpReleased: true }, true, 0, 3)).toBe(1);
  });

  it('does not restart charge from duplicate pressed edges', () => {
    const jump = new JumpCharge();
    jump.update({ jumpPressed: true, jumpHeld: true }, true, 1, 3);
    jump.update({ jumpPressed: true, jumpHeld: true }, true, 1, 3);
    expect(jump.chargeSeconds).toBe(2);
    expect(jump.update({ jumpReleased: true }, true, 0, 3)).toBe(2 / 3);
  });

  it('does not buffer a held key across invalid eligibility or landing', () => {
    const jump = new JumpCharge();
    jump.update({ jumpPressed: true, jumpHeld: true }, false, 1, 3);
    jump.update({ jumpHeld: true }, true, 1, 3);
    expect(jump.charging).toBe(false);
    expect(jump.update({ jumpReleased: true }, true, 0, 3)).toBeUndefined();
    jump.update({ jumpPressed: true, jumpHeld: true }, true, 1, 3);
    expect(jump.charging).toBe(true);
  });

  it('invalid eligibility cancels a valid charge before release', () => {
    const jump = new JumpCharge();
    jump.update({ jumpPressed: true, jumpHeld: true }, true, 2, 3);
    expect(jump.update({ jumpReleased: true }, false, 0, 3)).toBeUndefined();
    expect(jump.chargeSeconds).toBe(0);
    expect(jump.update({ jumpReleased: true }, true, 0, 3)).toBeUndefined();
  });

  it.each(['cancel', 'reset'] as const)('%s never turns a held key into a launch', (method) => {
    const jump = new JumpCharge();
    jump.update({ jumpPressed: true, jumpHeld: true }, true, 2, 3);
    jump[method]();
    expect(jump.state).toBe('idle');
    expect(jump.charge).toBe(0);
    expect(jump.update({ jumpHeld: true }, true, 1, 3)).toBeUndefined();
    expect(jump.update({ jumpReleased: true }, true, 0, 3)).toBeUndefined();
  });

  it('interrupted held input cancels rather than simulating release', () => {
    const jump = new JumpCharge();
    jump.update({ jumpPressed: true, jumpHeld: true }, true, 1, 3);
    expect(jump.update({}, true, 1 / 60, 3)).toBeUndefined();
    expect(jump.charging).toBe(false);
    expect(jump.update({ jumpReleased: true }, true, 0, 3)).toBeUndefined();
  });

  it('retains an explicit zero-charge tap without inventing minimum strength', () => {
    const jump = new JumpCharge();
    expect(jump.update({ jumpPressed: true, jumpReleased: true, jumpHeld: false }, true, 1 / 60, 3)).toBe(0);
    expect(jump.charging).toBe(false);
  });

  it('a zero-duration update may select a pose but cannot advance time', () => {
    const jump = new JumpCharge();
    jump.update({ jumpPressed: true, jumpHeld: true }, true, 0, 3);
    expect(jump.charging).toBe(true);
    expect(jump.chargeSeconds).toBe(0);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid max seconds %s', (maximum) => {
    expect(() => new JumpCharge().update({}, true, 0, maximum)).toThrow(RangeError);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid elapsed seconds %s', (dt) => {
    expect(() => new JumpCharge().update({}, true, dt, 3)).toThrow(RangeError);
  });
});
