import { describe, expect, it, vi } from 'vitest';
import type { AudioManager } from '../../src/audio/audioManager';
import { GameplayAudio } from '../../src/audio/gameplayAudio';
import { AUDIO_FILES } from '../../src/audio/manifest';
import type { CargoKind } from '../../src/game/content/cargo';
import type { SimulationSnapshot } from '../../src/game/physics/simulation';
import type { CargoState } from '../../src/game/systems/cargoGraph';

function frame(tick: number, time: number, options: {
  x?: number; y?: number; grounded?: boolean; wet?: boolean;
  cargo?: Partial<Record<CargoKind, CargoState>>;
  events?: SimulationSnapshot['audioEvents'];
} = {}): SimulationSnapshot {
  const x = options.x ?? 0, y = options.y ?? 0;
  const ids: CargoKind[] = ['sofa', 'television', 'cocktailGlass', 'floorLamp'];
  return {
    scenarioId: 'audio-fixture', tick, time, cameraX: 0, cameraY: 0, cameraSpeed: 0, cameraBlocked: false,
    turtle: { x, y, bodyX: x, bodyY: y, angle: 0, bodyAngle: 0, speed: 2, verticalSpeed: 0,
      biome: options.wet ? 'water' : 'grass', mass: 8, grounded: options.grounded ?? true,
      jumpCharging: false, jumpChargeSeconds: 0 },
    shell: { x, y, angle: 0 },
    cargo: ids.map(id => ({ id, label: id, x, y: y + 1, angle: 0,
      state: options.cargo?.[id] ?? 'active', separatedSeconds: 0 })),
    contacts: [], hazards: [], audioEvents: options.events ?? [],
  };
}

function harness(initial = frame(0, 0)) {
  const audio = { setGameplay: vi.fn(), playGameplay: vi.fn(), playUI: vi.fn(), setMovement: vi.fn() };
  const onLoss = vi.fn();
  const policy = new GameplayAudio(audio as unknown as AudioManager, onLoss);
  policy.reset(initial);
  return { audio, onLoss, policy };
}

describe('shared fixed-tick gameplay audio policy', () => {
  it('consumes paused diagnostic steps without replaying their losses, impacts or water entry on resume', () => {
    const { policy, audio, onLoss } = harness();
    policy.setPaused(true);
    const state = { cargo: { sofa: 'lost' as const }, wet: true,
      events: [{ type: 'cargoImpact' as const, tier: 'heavy' as const }, { type: 'waterEntry' as const, large: true }] };
    policy.observe(frame(1, 0.02, state));
    policy.setPaused(false);
    policy.observe(frame(2, 0.04, { cargo: state.cargo, wet: true }));
    policy.observe(frame(3, 1, { cargo: state.cargo, wet: true }));
    expect(audio.playGameplay).not.toHaveBeenCalled();
    expect(onLoss).not.toHaveBeenCalled();
  });
  it('aggregates one crash to its strongest tier and delays the next burst by its cooldown', () => {
    const { policy, audio } = harness();
    policy.observe(frame(1, 0.01, { events: [{ type: 'cargoImpact', tier: 'light' }] }));
    policy.observe(frame(2, 0.04, { events: [{ type: 'cargoImpact', tier: 'heavy' }] }));
    policy.observe(frame(3, 0.08, { events: [{ type: 'cargoImpact', tier: 'medium' }] }));
    expect(audio.playGameplay).not.toHaveBeenCalled();
    policy.observe(frame(4, 0.14));
    expect(audio.playGameplay).toHaveBeenCalledExactlyOnceWith(AUDIO_FILES.cargo.impactHeavy);
    policy.observe(frame(5, 0.16, { events: [{ type: 'cargoImpact', tier: 'light' }] }));
    policy.observe(frame(6, 0.20, { events: [{ type: 'cargoImpact', tier: 'medium' }] }));
    policy.observe(frame(7, 0.25));
    expect(audio.playGameplay).toHaveBeenCalledTimes(1);
    policy.observe(frame(8, 0.29));
    expect(audio.playGameplay).toHaveBeenNthCalledWith(2, AUDIO_FILES.cargo.impactMedium);
  });

  it('does not replay a transient physics event when the same tick is rendered repeatedly', () => {
    const { policy, audio } = harness();
    const snapshot = frame(1, 0.02, { events: [
      { type: 'landing', hard: true }, { type: 'hazard', name: 'pineconeHit' },
    ] });
    policy.observe(snapshot);
    policy.observe(snapshot);
    expect(audio.playGameplay.mock.calls).toEqual([
      [AUDIO_FILES.turtle.landingHard], [AUDIO_FILES.hazards.pineconeHit],
    ]);
  });

  it('maps each actual hazard transition to its selected recording', () => {
    const { policy, audio } = harness();
    const names = ['branchCreak', 'branchBreak', 'stumpTrigger', 'stumpHit',
      'pineconeRustle', 'pineconeFall', 'pineconeHit'] as const;
    names.forEach((name, i) => policy.observe(frame(i + 1, (i + 1) / 60, { events: [{ type: 'hazard', name }] })));
    expect(audio.playGameplay.mock.calls).toEqual(names.map(name => [AUDIO_FILES.hazards[name]]));
  });

  it('keeps temporarily separated cargo silent', () => {
    const { policy, audio, onLoss } = harness();
    policy.observe(frame(1, 0.1, { cargo: { television: 'separated', cocktailGlass: 'separated' } }));
    policy.observe(frame(2, 2));
    expect(audio.playGameplay).not.toHaveBeenCalled();
    expect(onLoss).not.toHaveBeenCalled();
  });

  it('groups definitive losses into the same single sound and notification callback', () => {
    const { policy, audio, onLoss } = harness();
    policy.observe(frame(1, 0.01, { cargo: { sofa: 'lost' } }));
    policy.observe(frame(2, 0.1, { cargo: { sofa: 'lost', television: 'lost' } }));
    const cargo = { sofa: 'lost', television: 'lost', cocktailGlass: 'lost' } as const;
    policy.observe(frame(3, 0.2, { cargo }));
    expect(audio.playGameplay).not.toHaveBeenCalled();
    policy.observe(frame(4, 0.32, { cargo }));
    expect(audio.playGameplay).toHaveBeenCalledExactlyOnceWith(AUDIO_FILES.cargo.lost);
    expect(onLoss).toHaveBeenCalledExactlyOnceWith(['sofa', 'television', 'cocktailGlass'], false);
    policy.observe(frame(5, 0.8, { cargo }));
    expect(onLoss).toHaveBeenCalledTimes(1);
  });

  it('flushes pending/final losses once before run-end gameplay cancellation', () => {
    const { policy, audio, onLoss } = harness();
    policy.observe(frame(1, 0.01, { cargo: { sofa: 'lost' } }));
    const cargo = { sofa: 'lost', television: 'lost', cocktailGlass: 'lost', floorLamp: 'lost' } as const;
    policy.observe(frame(2, 0.1, { cargo }), { ended: true, pennants: 1 });
    expect(audio.playUI).toHaveBeenCalledExactlyOnceWith('disabled');
    expect(audio.playGameplay).not.toHaveBeenCalled();
    expect(onLoss).toHaveBeenCalledExactlyOnceWith(['sofa', 'television', 'cocktailGlass', 'floorLamp'], true);
    expect(audio.setGameplay).toHaveBeenLastCalledWith(false);
    expect(audio.setMovement).toHaveBeenLastCalledWith(undefined);
    expect(audio.playUI.mock.invocationCallOrder[0]).toBeLessThan(audio.setGameplay.mock.invocationCallOrder.at(-1)!);
    policy.observe(frame(3, 0.5, { cargo }), { ended: true });
    expect(audio.playUI).toHaveBeenCalledTimes(1);
    expect(onLoss).toHaveBeenCalledTimes(1);
  });

  it('discards pending grouped impacts and loss notifications when pausing', () => {
    const { policy, audio, onLoss } = harness();
    policy.observe(frame(1, 0.01, { cargo: { sofa: 'lost' }, events: [{ type: 'cargoImpact', tier: 'heavy' }] }));
    policy.setPaused(true);
    policy.observe(frame(2, 0.5, { cargo: { sofa: 'lost' }, events: [{ type: 'landing', hard: true }] }));
    expect(audio.setGameplay).toHaveBeenLastCalledWith(false);
    policy.setPaused(false);
    policy.observe(frame(3, 0.6, { cargo: { sofa: 'lost' } }));
    expect(audio.playGameplay).not.toHaveBeenCalled();
    expect(onLoss).not.toHaveBeenCalled();
  });

  it('requires stable water transitions and suppresses repeated surface jitter', () => {
    const { policy, audio } = harness();
    policy.observe(frame(1, 0.01, { wet: true }));
    policy.observe(frame(2, 0.07));
    policy.observe(frame(3, 0.11, { wet: true }));
    policy.observe(frame(4, 0.18));
    policy.observe(frame(5, 0.4));
    expect(audio.playGameplay).not.toHaveBeenCalled();
    policy.observe(frame(6, 0.5, { wet: true }));
    policy.observe(frame(7, 0.66, { wet: true }));
    expect(audio.playGameplay).toHaveBeenCalledExactlyOnceWith(AUDIO_FILES.water.entrySmall);
  });

  it('preserves strong-entry telemetry through debounce and applies entry/exit cooldown', () => {
    const { policy, audio } = harness();
    policy.observe(frame(1, 0.01, { wet: true, events: [{ type: 'waterEntry', large: true }] }));
    policy.observe(frame(2, 0.17, { wet: true }));
    expect(audio.playGameplay).toHaveBeenCalledExactlyOnceWith(AUDIO_FILES.water.entryLarge);
    policy.observe(frame(3, 0.2));
    policy.observe(frame(4, 0.36));
    expect(audio.playGameplay).toHaveBeenCalledTimes(1);
    policy.observe(frame(5, 0.68));
    expect(audio.playGameplay).toHaveBeenNthCalledWith(2, AUDIO_FILES.water.exit);
    policy.observe(frame(6, 1));
    expect(audio.playGameplay).toHaveBeenCalledTimes(2);
  });

  it('does not synthesize an entry splash when resetting in already-submerged water', () => {
    const { policy, audio } = harness(frame(0, 0, { wet: true }));
    policy.observe(frame(1, 1, { wet: true }));
    expect(audio.playGameplay).not.toHaveBeenCalled();
  });

  it('uses actual movement and support rather than commanded speed for locomotion', () => {
    const { policy, audio } = harness();
    policy.observe(frame(1, 0.1, { x: 0.1 }));
    expect(audio.setMovement).toHaveBeenLastCalledWith('dry');
    policy.observe(frame(2, 0.2, { x: 0.1 }));
    expect(audio.setMovement).toHaveBeenLastCalledWith(undefined);
    policy.observe(frame(3, 0.3, { x: 0.2, grounded: false }));
    expect(audio.setMovement).toHaveBeenLastCalledWith(undefined);
    policy.observe(frame(4, 0.4, { x: 0.3, wet: true, grounded: false }));
    expect(audio.setMovement).toHaveBeenLastCalledWith('water');
    policy.observe(frame(5, 0.5, { x: 0.4 }), { ended: true });
    expect(audio.setMovement).toHaveBeenLastCalledWith(undefined);
    expect(audio.setGameplay).toHaveBeenLastCalledWith(false);
  });

  it('accounts for origin rebasing without inventing movement from a coordinate jump', () => {
    const { policy, audio } = harness(frame(0, 0, { x: 100, y: 20 }));
    policy.observe(frame(1, 0.1, { x: 0, y: 0 }), { logicalOffset: 100, heightOffset: 20 });
    expect(audio.setMovement).toHaveBeenLastCalledWith(undefined);
    policy.observe(frame(2, 0.2, { x: 0.1, y: 0 }), { logicalOffset: 100, heightOffset: 20 });
    expect(audio.setMovement).toHaveBeenLastCalledWith('dry');
  });

  it('emits help only once per appearance and suppresses cards while paused', () => {
    const { policy, audio } = harness();
    policy.showHelp('speed');
    policy.observe(frame(1, 0.1), { helpId: 'speed' });
    policy.observe(frame(2, 0.2), { helpId: 'speed' });
    expect(audio.playGameplay).toHaveBeenCalledExactlyOnceWith(AUDIO_FILES.ui.helpPop);
    policy.showHelp();
    policy.showHelp('balance');
    expect(audio.playGameplay).toHaveBeenCalledTimes(2);
    policy.setPaused(true);
    policy.showHelp('jump');
    expect(audio.playGameplay).toHaveBeenCalledTimes(2);
  });

  it('plays one pennant award feedback despite repeated snapshots and score aliases', () => {
    const { policy, audio } = harness();
    policy.observe(frame(1, 0.1), { pennants: 1 });
    policy.observe(frame(2, 0.2), { pennants: 1 });
    policy.observe(frame(3, 0.3), { pennants: 2 });
    expect(audio.playGameplay.mock.calls).toEqual([
      [AUDIO_FILES.scoring.checkpoint], [AUDIO_FILES.scoring.checkpoint],
    ]);
  });

  it('resets prior loss/help/award and pending impact state for a fresh run', () => {
    const { policy, audio, onLoss } = harness();
    policy.observe(frame(1, 0.1, { cargo: { sofa: 'lost' }, events: [{ type: 'cargoImpact', tier: 'heavy' }] }),
      { helpId: 'speed', pennants: 1 });
    policy.reset(frame(0, 0));
    audio.playGameplay.mockClear();
    policy.observe(frame(1, 0.1), { helpId: 'speed', pennants: 1 });
    expect(audio.playGameplay.mock.calls).toEqual([[AUDIO_FILES.scoring.checkpoint], [AUDIO_FILES.ui.helpPop]]);
    policy.observe(frame(2, 0.5));
    expect(onLoss).not.toHaveBeenCalled();
    expect(audio.playGameplay).toHaveBeenCalledTimes(2);
  });

  it('does not repeat already-lost items present in the initial snapshot', () => {
    const { policy, audio, onLoss } = harness(frame(0, 0, { cargo: { sofa: 'lost' } }));
    policy.observe(frame(1, 1, { cargo: { sofa: 'lost' } }));
    expect(audio.playGameplay).not.toHaveBeenCalled();
    expect(onLoss).not.toHaveBeenCalled();
  });
});
