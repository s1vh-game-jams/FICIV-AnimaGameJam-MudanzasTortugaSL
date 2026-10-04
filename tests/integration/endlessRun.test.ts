import { describe, expect, it } from 'vitest';
import { createTuning } from '../../src/game/config/tuning';
import { EndlessRun, protectedOpeningLength } from '../../src/game/modes/endless/run';
import { DEFAULT_HELP_DURATIONS } from '../../src/game/systems/contextualHelp';

describe('Endless run lifecycle with real Rapier', () => {
  it('starts on the protected non-scoring dry prologue and repeats seed choices', () => {
    const tuning = createTuning();
    const first = new EndlessRun(tuning, 'normal', 'reproducible-start');
    const replay = new EndlessRun(tuning, 'normal', first.descriptor.seed);
    try {
      const seconds = DEFAULT_HELP_DURATIONS.speed + DEFAULT_HELP_DURATIONS.balance + DEFAULT_HELP_DURATIONS.jump;
      expect(protectedOpeningLength(tuning)).toBeGreaterThan(tuning.maxSpeed * seconds);
      expect(first.descriptor).toEqual(replay.descriptor);
      expect(first.snapshot().modules).toEqual(replay.snapshot().modules);
      expect(first.snapshot().score).toBe(0);
      expect(first.snapshot().pennants.every(flag => flag.moduleIndex > 0)).toBe(true);
      expect(first.snapshot().physics.turtle.biome).toBe('grass');
      for (let tick = 0; tick < 120; tick++) { first.step(); replay.step(); }
      expect(first.snapshot()).toEqual(replay.snapshot());
    } finally { first.dispose(); replay.dispose(); }
  });

  it('captures final loss once and prevents later callbacks in the same accumulator burst', () => {
    const run = new EndlessRun(createTuning(), 'hard', 'terminal-freeze');
    try {
      run.step();
      run.simulation.tracker.update([], 2);
      run.step();
      const final = run.snapshot();
      expect(final.ended).toBe(true);
      expect(final.result?.lastLoss).toHaveLength(4);
      expect(final.result?.difficulty).toBe('hard');
      for (let tick = 0; tick < 6; tick++) run.step({ horizontal: 1, vertical: 1, jumpPressed: true });
      expect(run.snapshot()).toBe(final);
      expect(run.simulation.snapshot().tick).toBe(final.physics.tick);
      expect(run.simulation.snapshot().time).toBe(final.time);
    } finally { run.dispose(); }
  });
});
