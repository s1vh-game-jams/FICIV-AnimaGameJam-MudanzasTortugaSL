import { describe, expect, it } from 'vitest';
import { ContextualHelp } from '../../src/game/systems/contextualHelp';

describe('ContextualHelp', () => {
  it('times speed, balance and jump in order without requiring gameplay input', () => {
    const help = new ContextualHelp();
    expect(help.update(0, { inWater: false })?.id).toBe('speed');
    expect(help.active?.keys).toContain('A');
    expect(help.update(3, { inWater: false })?.id).toBe('balance');
    expect(help.hasSeen('speed')).toBe(true);
    expect(help.active?.keys).toContain('W');
    expect(help.update(4, { inWater: false })?.id).toBe('jump');
    expect(help.active?.keys).toBe('Espacio');
    expect(help.active?.text).toBe('mantén y suelta para saltar');
    expect(help.update(4, { inWater: false })).toBeUndefined();
    expect(help.hasSeen('balance')).toBe(true);
    expect(help.hasSeen('jump')).toBe(true);
    expect(help.hasSeen('swim')).toBe(false);
    expect(help.update(0, { inWater: true })?.id).toBe('swim');
    expect(help.update(3, { inWater: true })).toBeUndefined();
    expect(help.hasSeen('swim')).toBe(true);
  });

  it.each([30, 60, 120])('completes the same initial sequence at %s updates/second', (hz) => {
    const help = new ContextualHelp();
    for (let tick = 0; tick < hz * 11; tick++) help.update(1 / hz, { inWater: false });
    expect(help.active).toBeUndefined();
    for (const id of ['speed', 'balance', 'jump'] as const) expect(help.hasSeen(id)).toBe(true);
  });

  it.each([
    ['speed', 1, 2],
    ['balance', 4, 3],
    ['jump', 8, 3],
  ] as const)('swim preempts %s and preserves its unfinished time', (id, initialTime, remainingTime) => {
    const help = new ContextualHelp();
    expect(help.update(initialTime, { inWater: false })?.id).toBe(id);
    expect(help.active?.elapsedSeconds).toBe(1);
    expect(help.update(0, { inWater: true })?.id).toBe('swim');
    expect(help.update(3, { inWater: true })).toBeUndefined();
    expect(help.hasSeen(id)).toBe(false);
    expect(help.update(0, { inWater: false })?.id).toBe(id);
    expect(help.active?.elapsedSeconds).toBe(1);
    help.update(remainingTime, { inWater: false });
    expect(help.hasSeen(id)).toBe(true);
  });

  it('an activated swim message keeps its lifetime through a brief water exit', () => {
    const help = new ContextualHelp();
    help.update(1, { inWater: false });
    expect(help.update(1, { inWater: true })?.id).toBe('swim');
    expect(help.update(1, { inWater: false })?.id).toBe('swim');
    expect(help.active?.elapsedSeconds).toBe(2);
    expect(help.update(1, { inWater: false })?.id).toBe('speed');
    expect(help.active?.elapsedSeconds).toBe(1);
  });

  it('does not repeat swim or show pending dry messages while still underwater', () => {
    const help = new ContextualHelp();
    help.update(3, { inWater: true });
    expect(help.hasSeen('swim')).toBe(true);
    expect(help.update(30, { inWater: true })).toBeUndefined();
    expect(help.hasSeen('speed')).toBe(false);
    expect(help.update(0, { inWater: false })?.id).toBe('speed');
    expect(help.update(0, { inWater: true })).toBeUndefined();
    expect(help.hasSeen('speed')).toBe(false);
  });

  it('pause freezes both timers and first-water eligibility', () => {
    const help = new ContextualHelp();
    help.update(4, { inWater: false });
    const paused = help.active;
    expect(help.update(60, { inWater: true, paused: true })).toEqual(paused);
    expect(help.hasSeen('swim')).toBe(false);
    expect(help.active?.elapsedSeconds).toBe(1);
    expect(help.update(0, { inWater: true })?.id).toBe('swim');
  });

  it('reset while paused clears the run without making a help message active', () => {
    const help = new ContextualHelp();
    help.update(20, { inWater: false });
    help.update(3, { inWater: true });
    help.reset();
    expect(help.update(60, { inWater: false, paused: true })).toBeUndefined();
    for (const id of ['speed', 'balance', 'jump', 'swim'] as const) expect(help.hasSeen(id)).toBe(false);
    expect(help.update(0, { inWater: false })?.id).toBe('speed');
    expect(help.active?.elapsedSeconds).toBe(0);
  });

  it('gives independent runs fresh state and copies configurable durations', () => {
    const durations = { speed: 5 };
    const first = new ContextualHelp(durations);
    durations.speed = 3;
    first.update(3, { inWater: false });
    expect(first.active?.id).toBe('speed');
    expect(first.active?.durationSeconds).toBe(5);
    const second = new ContextualHelp();
    expect(second.hasSeen('speed')).toBe(false);
    expect(second.update(0, { inWater: false })?.elapsedSeconds).toBe(0);
  });

  it.each([2.9, 5.1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid display duration %s', (speed) => {
    expect(() => new ContextualHelp({ speed })).toThrow(RangeError);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid elapsed duration %s', (dt) => {
    expect(() => new ContextualHelp().update(dt, { inWater: false })).toThrow(RangeError);
  });
});
