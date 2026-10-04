import { expect, it } from 'vitest';
import { FixedLoop } from '../../src/game/core/fixedLoop';

it('stops the remaining accumulator callbacks when terminal gameplay pauses inside a tick', () => {
  const loop = new FixedLoop(1 / 60);
  let ticks = 0;
  expect(loop.advance(0.1, () => { ticks++; loop.paused = true; })).toBe(1);
  expect(ticks).toBe(1);
  expect(loop.advance(0.1, () => ticks++)).toBe(0);
  loop.paused = false;
  expect(loop.advance(0, () => ticks++)).toBe(0);
});
