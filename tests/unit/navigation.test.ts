import { describe, expect, it } from 'vitest';
import { formatRunTime, GameNavigation } from '../../src/app/navigation';

describe('keyboard navigation', () => {
  it('completes title, mode, normal difficulty, play, results and title', () => {
    const navigation = new GameNavigation();
    expect(navigation.options[navigation.selected].id).toBe('start');
    navigation.confirm();
    expect(navigation.screen).toBe('mode');
    expect(navigation.options[navigation.selected].id).toBe('endless');
    navigation.move(1);
    expect(navigation.options[navigation.selected].id).toBe('endless');
    navigation.confirm();
    expect(navigation.options[navigation.selected].id).toBe('normal');
    expect(navigation.confirm()).toEqual({ type: 'start', difficulty: 'normal' });
    expect(navigation.screen).toBe('running');
    navigation.finishRun();
    expect(navigation.paused).toBe(true);
    expect(navigation.confirm()).toEqual({ type: 'exit' });
    expect(navigation.screen).toBe('title');
  });

  it('does not activate disabled custom mode by mouse', () => {
    const navigation = new GameNavigation();
    navigation.confirm();
    expect(navigation.select(0)).toBeUndefined();
    expect(navigation.screen).toBe('mode');
  });

  it('opens each menu with a selection and returns one menu at a time', () => {
    const navigation = new GameNavigation();
    navigation.confirm(); navigation.confirm();
    navigation.move(-1);
    expect(navigation.confirm()).toEqual({ type: 'start', difficulty: 'easy' });
    navigation.escape();
    expect(navigation.options[navigation.selected].id).toBe('continue');
    expect(navigation.escape()).toEqual({ type: 'resume' });
    const menus = new GameNavigation();
    menus.confirm(); menus.confirm();
    menus.escape(); expect(menus.screen).toBe('mode');
    menus.escape(); expect(menus.screen).toBe('title');
  });

  it('resets help while paused and asks before restarting or exiting', () => {
    const navigation = new GameNavigation();
    navigation.beginRun(); navigation.pause();
    expect(navigation.select(2)).toEqual({ type: 'reset-help' });
    expect(navigation.screen).toBe('pause');
    expect(navigation.paused).toBe(true);
    navigation.select(1);
    expect(navigation.screen).toBe('confirm');
    expect(navigation.confirmation).toBe('restart');
    expect(navigation.options[navigation.selected].id).toBe('cancel');
    navigation.escape();
    expect(navigation.screen).toBe('pause');
    navigation.select(1);
    expect(navigation.select(1)).toEqual({ type: 'restart' });
    expect(navigation.screen).toBe('running');
    navigation.pause(); navigation.select(3);
    expect(navigation.select(1)).toEqual({ type: 'exit' });
    expect(navigation.screen).toBe('title');
  });

  it('auto pause is idempotent and cannot replace results', () => {
    const navigation = new GameNavigation();
    navigation.beginRun();
    expect(navigation.pause()).toEqual({ type: 'pause' });
    expect(navigation.pause()).toBeUndefined();
    navigation.finishRun();
    expect(navigation.pause()).toBeUndefined();
    expect(navigation.screen).toBe('results');
    expect(navigation.escape()).toEqual({ type: 'exit' });
  });

  it('formats elapsed simulation time without a countdown', () => {
    expect(formatRunTime(0)).toBe('00:00');
    expect(formatRunTime(61.9)).toBe('01:01');
    expect(formatRunTime(3600)).toBe('60:00');
  });
});
