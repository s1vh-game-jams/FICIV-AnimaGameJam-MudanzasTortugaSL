import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from '../../src/audio/audioManager';
import { AUDIO_FILES, AUDIO_TIMING } from '../../src/audio/manifest';

class MockAudio {
  readonly listeners = new Map<string, (() => void)[]>();
  readonly plays: { resolve: () => void; reject: (reason?: unknown) => void }[] = [];
  paused = true;
  currentTime = 0;
  preload = '';
  loop = false;
  volume = 0;
  playbackRate = 0;
  deferPlay = false;
  readonly pause = vi.fn(() => { this.paused = true; });
  readonly load = vi.fn();
  readonly remove = vi.fn();
  readonly removeAttribute = vi.fn();
  readonly play = vi.fn(() => {
    this.paused = false;
    if (!this.deferPlay) return Promise.resolve();
    return new Promise<void>((resolve, reject) => { this.plays.push({ resolve, reject }); });
  });

  constructor(readonly url: string) {}

  addEventListener(event: string, listener: () => void): void {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
  }

  emit(event: string): void { for (const listener of this.listeners.get(event) ?? []) listener(); }
}

function harness() {
  const elements: MockAudio[] = [];
  const manager = new AudioManager(url => {
    const element = new MockAudio(url);
    elements.push(element);
    return element as unknown as HTMLAudioElement;
  });
  const forPath = (path: string) => elements.filter(element => element.url.endsWith('/' + path));
  return { manager, elements, forPath };
}

async function settle(): Promise<void> { await Promise.resolve(); await Promise.resolve(); }

describe('native jam audio lifecycle', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('creates no audio or loading work until an interaction unlocks playback', () => {
    const { manager, elements } = harness();
    manager.setMusicContext('endless');
    manager.setGameplay(true);
    manager.setMovement('dry');
    manager.prepareGameplay();
    manager.playUI('confirm');
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    expect(elements).toHaveLength(0);
    manager.unlock();
    expect(elements).toHaveLength(2);
    // These calls happen synchronously within the original user-gesture stack.
    for (const element of elements) expect(element.play).toHaveBeenCalledOnce();
  });

  it('keeps every original recording at unity volume and playback rate', () => {
    const { manager, elements } = harness();
    manager.unlock();
    manager.prepareGameplay();
    manager.setGameplay(true);
    manager.setMovement('dry');
    manager.setMovement('water');
    manager.playUI('move');
    manager.setMusicContext('endless');
    manager.setGameplay(false);
    for (const element of elements) {
      expect(element.volume).toBe(1);
      expect(element.playbackRate).toBe(1);
      expect(element.url.startsWith('/audio/')).toBe(true);
    }
  });

  it('keeps music streaming/lazy and prefetches only short gameplay effects once', () => {
    const { manager, elements } = harness();
    manager.unlock();
    expect(elements[0].preload).toBe('none');
    manager.prepareGameplay();
    const count = elements.length;
    manager.prepareGameplay();
    expect(elements).toHaveLength(count);
    expect(elements.filter(element => element.loop)).toHaveLength(1);
    expect(elements.slice(1).every(element => element.preload === 'auto')).toBe(true);
    expect(elements.some(element => element.url.endsWith(AUDIO_FILES.ambient.forest))).toBe(false);
    expect(elements.some(element => element.url.endsWith(AUDIO_FILES.bgm.endless))).toBe(false);
  });

  it('preserves the menu track through repeated menu contexts and interactions', () => {
    const { manager, forPath } = harness();
    manager.unlock();
    const music = forPath(AUDIO_FILES.bgm.menu)[0];
    music.currentTime = 32;
    manager.setMusicContext('menu');
    manager.unlock();
    expect(forPath(AUDIO_FILES.bgm.menu)).toHaveLength(1);
    expect(music.play).toHaveBeenCalledOnce();
    expect(music.pause).not.toHaveBeenCalled();
    expect(music.currentTime).toBe(32);
  });

  it('shares Patio Party across Credits/lab and resets only on a real track change', () => {
    const { manager, forPath } = harness();
    manager.setMusicContext('credits');
    manager.unlock();
    const patio = forPath(AUDIO_FILES.bgm.credits)[0];
    patio.currentTime = 18;
    manager.setMusicContext('physicsLab');
    expect(forPath(AUDIO_FILES.bgm.credits)).toHaveLength(1);
    expect(patio.play).toHaveBeenCalledOnce();
    expect(patio.currentTime).toBe(18);
    manager.setMusicContext('endless');
    expect(patio.paused).toBe(true);
    expect(patio.currentTime).toBe(0);
    manager.setMusicContext('credits');
    expect(forPath(AUDIO_FILES.bgm.credits)).toHaveLength(1);
    expect(patio.play).toHaveBeenCalledTimes(2);
  });

  it('cancels active gameplay voices and locomotion on pause, permits UI, and keeps BGM', () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.setMovement('dry');
    manager.playGameplay(AUDIO_FILES.cargo.impactHeavy);
    const music = forPath(AUDIO_FILES.bgm.menu)[0];
    music.currentTime = 15;
    manager.setGameplay(false);
    expect(forPath(AUDIO_FILES.turtle.movementDry)[0].paused).toBe(true);
    expect(forPath(AUDIO_FILES.cargo.impactHeavy)[0].paused).toBe(true);
    expect(music.paused).toBe(false);
    expect(music.volume).toBe(1);
    expect(music.currentTime).toBe(15);
    manager.playUI('pauseOpen');
    expect(forPath(AUDIO_FILES.ui.pauseOpen)[0].play).toHaveBeenCalledOnce();
  });

  it('drops paused events rather than replaying a queue or restarting locomotion on resume', () => {
    const { manager, elements } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.setMovement('dry');
    manager.setGameplay(false);
    const count = elements.length;
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    manager.setMovement('water');
    manager.setGameplay(true);
    vi.advanceTimersByTime(10_000);
    expect(elements).toHaveLength(count);
    expect(elements.filter(element => element.loop && !element.paused)).toHaveLength(1);
  });

  it('suspends everything while hidden and resumes BGM at its retained position', () => {
    const { manager, elements, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.setMovement('water');
    manager.playUI('move');
    const music = forPath(AUDIO_FILES.bgm.menu)[0];
    music.currentTime = 27;
    manager.setPageHidden(true);
    expect(elements.every(element => element.paused)).toBe(true);
    const count = elements.length;
    manager.playUI('disabled');
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    manager.unlock();
    expect(elements).toHaveLength(count);
    manager.setPageHidden(false);
    expect(music.currentTime).toBe(27);
    expect(music.play).toHaveBeenCalledTimes(2);
    expect(forPath(AUDIO_FILES.turtle.movementWater)[0].play).toHaveBeenCalledTimes(2);
    expect(forPath(AUDIO_FILES.ui.move)[0].play).toHaveBeenCalledOnce();
  });

  it('never layers dry and water locomotion and reuses their original elements', () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.setMovement('dry');
    const dry = forPath(AUDIO_FILES.turtle.movementDry)[0];
    dry.currentTime = 4;
    manager.setMovement('water');
    const water = forPath(AUDIO_FILES.turtle.movementWater)[0];
    expect(dry.paused).toBe(true);
    expect(dry.currentTime).toBe(0);
    expect(water.paused).toBe(false);
    manager.setMovement();
    expect(water.paused).toBe(true);
    manager.setMovement('dry');
    expect(forPath(AUDIO_FILES.turtle.movementDry)).toHaveLength(1);
    expect(dry.play).toHaveBeenCalledTimes(2);
  });

  it('suppresses simultaneous aliases of the same physical feedback recording', () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.playUI('confirm');
    manager.playUI('helpPop');
    manager.playGameplay(AUDIO_FILES.scoring.checkpoint);
    manager.playGameplay(AUDIO_FILES.scoring.scorePop);
    expect(forPath(AUDIO_FILES.ui.confirm)).toHaveLength(1);
    expect(forPath(AUDIO_FILES.ui.confirm)[0].play).toHaveBeenCalledOnce();
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    manager.playGameplay(AUDIO_FILES.cargo.lastObjectLost);
    expect(forPath(AUDIO_FILES.cargo.lost)[0].play).toHaveBeenCalledOnce();
  });

  it('limits overlap per physical file and reuses a finished voice', () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.playUI('move');
    const first = forPath(AUDIO_FILES.ui.move)[0];
    first.currentTime = 0.1;
    manager.playUI('move');
    const second = forPath(AUDIO_FILES.ui.move)[1];
    second.currentTime = 0.1;
    manager.playUI('move');
    expect(forPath(AUDIO_FILES.ui.move)).toHaveLength(AUDIO_TIMING.maxVoicesPerFile);
    first.emit('ended');
    manager.playUI('move');
    expect(first.play).toHaveBeenCalledTimes(2);
    expect(second.play).toHaveBeenCalledOnce();
  });

  it('preserves terminal feedback when it aliases a just-started gameplay loss', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    await settle();
    const loss = forPath(AUDIO_FILES.cargo.lost)[0];
    loss.currentTime = 0.02;
    manager.playUI('disabled');
    manager.setGameplay(false);
    expect(loss.paused).toBe(false);
    expect(loss.play).toHaveBeenCalledOnce();
  });

  it('reserves terminal feedback by replacing an older gameplay voice at the file limit', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    const first = forPath(AUDIO_FILES.cargo.lost)[0];
    first.currentTime = 0.1;
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    const second = forPath(AUDIO_FILES.cargo.lost)[1];
    second.currentTime = 0.1;
    manager.playUI('disabled');
    await settle();
    manager.setGameplay(false);
    expect(forPath(AUDIO_FILES.cargo.lost)).toHaveLength(2);
    expect(first.paused).toBe(false);
    expect(first.play).toHaveBeenCalledTimes(2);
    expect(second.paused).toBe(true);
  });

  it('keeps UI feedback available when gameplay fills the global voice limit', async () => {
    const { manager, elements, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    const paths = [...new Set([...Object.values(AUDIO_FILES.cargo),
      ...Object.values(AUDIO_FILES.water), ...Object.values(AUDIO_FILES.hazards), AUDIO_FILES.ui.clientCall])];
    for (const path of paths) manager.playGameplay(path);
    expect(elements.filter(element => !element.loop && !element.paused)).toHaveLength(AUDIO_TIMING.maxEffectVoices);
    manager.playUI('move');
    await settle();
    expect(elements.filter(element => !element.loop && !element.paused)).toHaveLength(AUDIO_TIMING.maxEffectVoices);
    manager.setGameplay(false);
    expect(forPath(AUDIO_FILES.ui.move)[0].paused).toBe(false);
  });

  it('bounds global effect overlap while leaving the music playing', () => {
    const { manager, elements } = harness();
    manager.unlock();
    manager.setGameplay(true);
    const paths = [...new Set([
      ...Object.values(AUDIO_FILES.ui), ...Object.values(AUDIO_FILES.cargo),
      ...Object.values(AUDIO_FILES.water), ...Object.values(AUDIO_FILES.hazards),
    ])];
    for (const path of paths) manager.playGameplay(path);
    expect(elements.filter(element => !element.loop)).toHaveLength(AUDIO_TIMING.maxEffectVoices);
    expect(elements[0].paused).toBe(false);
  });

  it('releases a failed effect and allows a later valid retry', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.prepareGameplay();
    const loss = forPath(AUDIO_FILES.cargo.lost)[0];
    loss.deferPlay = true;
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    loss.plays[0].reject(new Error('autoplay/network failure'));
    await settle();
    expect(loss.paused).toBe(true);
    manager.playGameplay(AUDIO_FILES.cargo.lost);
    expect(loss.play).toHaveBeenCalledTimes(2);
  });

  it('lets an effect that starts promptly finish beyond the network stale window', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.hazards.branchCreak);
    const effect = forPath(AUDIO_FILES.hazards.branchCreak)[0];
    await settle();
    vi.advanceTimersByTime(AUDIO_TIMING.staleEffectMs * 2);
    expect(effect.paused).toBe(false);
    effect.emit('ended');
    expect(effect.paused).toBe(true);
  });

  it('releases an errored media element instead of leaving its pool slot busy', () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.playUI('move');
    const effect = forPath(AUDIO_FILES.ui.move)[0];
    effect.emit('error');
    expect(effect.paused).toBe(true);
    manager.playUI('move');
    expect(forPath(AUDIO_FILES.ui.move)).toHaveLength(1);
    expect(effect.play).toHaveBeenCalledTimes(2);
  });

  it('cancels a slow effect before it can become stale feedback', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.prepareGameplay();
    const effect = forPath(AUDIO_FILES.cargo.impactHeavy)[0];
    effect.deferPlay = true;
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.impactHeavy);
    vi.advanceTimersByTime(AUDIO_TIMING.staleEffectMs);
    expect(effect.paused).toBe(true);
    expect(effect.currentTime).toBe(0);
    effect.plays[0].resolve();
    await settle();
    expect(effect.play).toHaveBeenCalledOnce();
    expect(effect.paused).toBe(true);
  });

  it('does not let a rejected old play promise cancel a newly reused voice', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.prepareGameplay();
    const effect = forPath(AUDIO_FILES.cargo.impactHeavy)[0];
    effect.deferPlay = true;
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.impactHeavy);
    manager.setGameplay(false);
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.impactHeavy);
    effect.plays[0].reject(new Error('old interrupted playback'));
    await settle();
    expect(effect.play).toHaveBeenCalledTimes(2);
    expect(effect.paused).toBe(false);
  });

  it('does not let an old successful promise remove a reused voice stale timeout', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    manager.prepareGameplay();
    const effect = forPath(AUDIO_FILES.cargo.impactHeavy)[0];
    effect.deferPlay = true;
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.impactHeavy);
    manager.setGameplay(false);
    manager.setGameplay(true);
    manager.playGameplay(AUDIO_FILES.cargo.impactHeavy);
    effect.plays[0].resolve();
    await settle();
    vi.advanceTimersByTime(AUDIO_TIMING.staleEffectMs);
    expect(effect.paused).toBe(true);
  });

  it('retries rejected music on a later gesture without blocking UI', async () => {
    const { manager, forPath } = harness();
    manager.unlock();
    const music = forPath(AUDIO_FILES.bgm.menu)[0];
    music.pause();
    music.deferPlay = true;
    manager.unlock();
    music.pause();
    music.plays[0].reject(new Error('autoplay blocked'));
    await settle();
    manager.playUI('move');
    expect(forPath(AUDIO_FILES.ui.move)[0].paused).toBe(false);
    manager.unlock();
    expect(music.play).toHaveBeenCalledTimes(3);
  });

  it('cleans pending sounds and original sources on dispose with no delayed restart', async () => {
    const { manager, elements, forPath } = harness();
    manager.unlock();
    manager.prepareGameplay();
    manager.setGameplay(true);
    manager.setMovement('water');
    const effect = forPath(AUDIO_FILES.cargo.impactHeavy)[0];
    effect.deferPlay = true;
    manager.playGameplay(AUDIO_FILES.cargo.impactHeavy);
    manager.dispose();
    for (const element of elements) {
      expect(element.paused).toBe(true);
      expect(element.removeAttribute).toHaveBeenCalledWith('src');
      expect(element.load).toHaveBeenCalledOnce();
      expect(element.remove).toHaveBeenCalledOnce();
    }
    effect.plays[0].resolve();
    await settle();
    vi.advanceTimersByTime(10_000);
    const oldCount = elements.length;
    manager.playUI('move');
    expect(elements).toHaveLength(oldCount);
    expect(elements.every(element => element.paused)).toBe(true);
  });
});
