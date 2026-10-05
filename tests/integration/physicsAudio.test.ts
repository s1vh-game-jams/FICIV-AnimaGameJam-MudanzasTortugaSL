import { afterEach, describe, expect, it } from 'vitest';
import { createTuning } from '../../src/game/config/tuning';
import { AUDIO_PHYSICS_TUNING } from '../../src/audio/physicsTuning';
import { SCENARIOS, type Scenario } from '../../src/game/content/scenarios';
import { NO_CONTROLS, type Controls } from '../../src/game/core/input';
import { PhysicsSimulation, type LoadPreset, type SimulationAudioEvent } from '../../src/game/physics/simulation';
import type { TrapKind } from '../../src/game/physics/worldContent';

const live: PhysicsSimulation[] = [];
const scenario = (id: string) => SCENARIOS.find(candidate => candidate.id === id)!;
const create = (content: Scenario = scenario('flat'), load: LoadPreset = 'full') => {
  const simulation = new PhysicsSimulation(content, createTuning(), load);
  live.push(simulation);
  return simulation;
};
afterEach(() => { for (const simulation of live.splice(0)) simulation.dispose(); });
const advance = (simulation: PhysicsSimulation, seconds: number, controls: Controls = NO_CONTROLS) => {
  const events: SimulationAudioEvent[] = [];
  for (let tick = 0; tick < seconds * simulation.tuning.physicsHz; tick++) {
    simulation.step(controls);
    events.push(...simulation.snapshot().audioEvents);
  }
  return events;
};
const hazards = (kind: TrapKind, load: LoadPreset = 'full') => {
  const simulation = create(scenario('flat'), load);
  simulation.addWorldChunk({ id: 'audio-hazard', terrain: [], traps: [{ id: kind, kind, x: 7, y: 0 }] });
  return simulation;
};

describe('physical audio telemetry', () => {
  it('keeps settled support and baseline cargo wobble silent for ten seconds', () => {
    const simulation = create();
    expect(simulation.snapshot().audioEvents).toEqual([]);
    // A measured baseline maximum is 1.936 m/s normal impulse / reduced mass,
    // versus about 6.3 on rock slopes. Thresholds follow these real traces.
    expect(AUDIO_PHYSICS_TUNING.cargoLightDeltaV).toBeGreaterThan(1.94);
    expect(advance(simulation, 10)).toEqual([]);
    expect(simulation.cargo.every(cargo => simulation.tracker.state(cargo.definition.id) === 'active')).toBe(true);
  });

  it.each([
    [1, undefined], [2.5, 'light'], [4, 'medium'], [7, 'heavy'],
  ] as const)('classifies a real cargo landing at %s m/s as %s', (speed, tier) => {
    const simulation = create(scenario('flat'), 'light');
    const sofa = simulation.cargo[0];
    // Drop with a small true gap onto real terrain, away from the shell. The
    // collision occurs before contact grace, so the piece remains relevant.
    sofa.body.setTranslation({ x: 12, y: sofa.definition.height / 2 + 0.02 }, true);
    sofa.body.setLinvel({ x: 0, y: -speed }, true);
    const events = advance(simulation, 0.25).filter(event => event.type === 'cargoImpact');
    expect(events.map(event => event.tier)).toEqual(tier ? [tier] : []);
    expect(simulation.tracker.state('sofa')).not.toBe('lost');
  });

  it('excludes definitively lost cargo contacts from impact feedback', () => {
    const simulation = create(scenario('flat'), 'light');
    const sofa = simulation.cargo[0];
    sofa.body.setTranslation({ x: -20, y: 30 }, true);
    advance(simulation, simulation.tuning.lossGraceSeconds + 0.1);
    expect(simulation.tracker.state('sofa')).toBe('lost');
    sofa.body.setTranslation({ x: 12, y: sofa.definition.height / 2 + 0.02 }, true);
    sofa.body.setLinvel({ x: 0, y: -8 }, true);
    expect(advance(simulation, 0.25).filter(event => event.type === 'cargoImpact')).toEqual([]);
  });

  it('collapses simultaneous physical body contacts into the strongest impact per tick', () => {
    const simulation = create();
    const sofa = simulation.cargo.find(cargo => cargo.definition.id === 'sofa')!;
    const television = simulation.cargo.find(cargo => cargo.definition.id === 'television')!;
    for (const [cargo, x, speed] of [[sofa, 12, 2.5], [television, 18, 7]] as const) {
      cargo.body.setTranslation({ x, y: cargo.definition.height / 2 + 0.02 }, true);
      cargo.body.setLinvel({ x: 0, y: -speed }, true);
    }
    let heavy = false;
    for (let tick = 0; tick < 15; tick++) {
      simulation.step();
      const events = simulation.snapshot().audioEvents.filter(event => event.type === 'cargoImpact');
      expect(events.length).toBeLessThanOrEqual(1);
      heavy ||= events.some(event => event.tier === 'heavy');
    }
    expect(heavy).toBe(true);
  });

  it.each([[0.6, false], [3, true]] as const)('emits one meaningful landing after a %s-second jump', (charge, hard) => {
    const simulation = create(scenario('flat'), 'empty');
    simulation.step({ ...NO_CONTROLS, jumpPressed: true, jumpHeld: true });
    advance(simulation, charge, { ...NO_CONTROLS, jumpHeld: true });
    simulation.step({ ...NO_CONTROLS, jumpReleased: true });
    expect(simulation.snapshot().turtle.grounded).toBe(false);
    const events = advance(simulation, 3).filter(event => event.type === 'landing');
    expect(events).toEqual([{ type: 'landing', hard }]);
    expect(simulation.snapshot().turtle.grounded).toBe(true);
  });

  it.each([['water', false], ['water-drop', true]] as const)('uses undamped incoming speed for %s entry', (id, large) => {
    const simulation = create(scenario(id));
    const events = advance(simulation, 30);
    expect(events.filter(event => event.type === 'waterEntry')).toEqual([{ type: 'waterEntry', large }]);
    expect(events.filter(event => event.type === 'waterExit')).toEqual([{ type: 'waterExit' }]);
  });

  it.each(['branch', 'stump', 'tree'] as const)('fires %s phases once with bounded ownership', kind => {
    const simulation = hazards(kind, kind === 'tree' ? 'empty' : 'full');
    const events = advance(simulation, 10).filter(event => event.type === 'hazard');
    const expected = kind === 'branch' ? ['branchCreak', 'branchBreak'] :
      kind === 'stump' ? ['stumpTrigger', 'stumpHit'] : ['pineconeRustle', 'pineconeFall', 'pineconeHit'];
    expect(events.map(event => event.name)).toEqual(expected);
    const count = simulation.world.colliders.len();
    simulation.removeWorldChunk('audio-hazard');
    expect(simulation.snapshot().hazards).toEqual([]);
    expect(simulation.world.colliders.len()).toBeLessThanOrEqual(count);
    expect(advance(simulation, 0.5).filter(event => event.type === 'hazard')).toEqual([]);
  });

  it('detects the pinecone first hit against cargo as well as terrain', () => {
    const simulation = hazards('tree');
    const events = advance(simulation, 10).filter(event => event.type === 'hazard');
    expect(events.map(event => event.name)).toEqual(['pineconeRustle', 'pineconeFall', 'pineconeHit']);
  });

  it('retains a captured event snapshot but clears events on the next tick', () => {
    const simulation = hazards('branch');
    for (let tick = 0; tick < 180; tick++) {
      simulation.step();
      const captured = simulation.snapshot();
      if (!captured.audioEvents.some(event => event.type === 'hazard')) continue;
      const events = [...captured.audioEvents];
      simulation.step();
      expect(simulation.snapshot().audioEvents).toEqual([]);
      expect(captured.audioEvents).toEqual(events);
      return;
    }
    throw new Error('Branch never entered its warning phase');
  });
});
