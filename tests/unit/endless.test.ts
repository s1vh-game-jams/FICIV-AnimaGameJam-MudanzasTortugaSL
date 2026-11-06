import { describe, expect, it } from 'vitest';
import { ENDLESS_DIFFICULTIES, MODULE_DIFFICULTY_WEIGHT } from '../../src/game/config/endless';
import type { Difficulty } from '../../src/game/config/endless';
import { createTuning, MAX_TERRAIN_ANGLE } from '../../src/game/config/tuning';
import type { Biome } from '../../src/game/content/scenarios';
import { CARGO } from '../../src/game/content/cargo';
import { EndlessGenerator, expectedTrapCount, trapProbabilities, validateModulePool } from '../../src/game/modes/endless/generator';
import { ENDLESS_MODULES, placeModule } from '../../src/game/modes/endless/modules';
import { EndlessScore } from '../../src/game/modes/endless/score';
import type { Pennant } from '../../src/game/modes/endless/score';
import { randomStream } from '../../src/game/modes/endless/random';

const difficulties: readonly Difficulty[] = ['easy', 'normal', 'hard'];
const flags = (): Pennant[] => [{ id: 'flag-1', moduleIndex: 1, x: 100, y: 0, crossed: false },
  { id: 'flag-2', moduleIndex: 2, x: 180, y: 0, crossed: false }];

describe('seeded Endless difficulty', () => {
  it.each(difficulties)('preserves exact %s means during every safe module and approaches +0.5', difficulty => {
    const baseMean = { easy: 0.5, normal: 0.75, hard: 1.5 }[difficulty];
    for (let safe = 5; safe <= 10; safe++) {
      for (let n = 1; n <= safe; n++) {
        expect(trapProbabilities(difficulty, n, safe)).toEqual(ENDLESS_DIFFICULTIES[difficulty].base);
        expect(expectedTrapCount(trapProbabilities(difficulty, n, safe))).toBeCloseTo(baseMean, 12);
      }
      let previous = baseMean;
      for (const n of [safe + 1, safe + 10, safe + 50, safe + 1000, 1000000]) {
        const probabilities = trapProbabilities(difficulty, n, safe);
        const mean = expectedTrapCount(probabilities);
        expect(mean).toBeGreaterThan(previous);
        expect(mean).toBeLessThan(baseMean + 0.5);
        expect(probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
        expect(probabilities.every(probability => probability >= 0 && probability <= 1)).toBe(true);
        if (difficulty === 'easy') expect(probabilities[3]).toBe(0);
        previous = mean;
      }
    }
  });

  it('has stable isolated purpose streams and seeded 5–10 inclusive windows', () => {
    const first = randomStream('repeatable', 7, 'module');
    const expected = [first(), first(), first()];
    const decoration = randomStream('repeatable', 7, 'decoration');
    for (let i = 0; i < 100; i++) decoration();
    const second = randomStream('repeatable', 7, 'module');
    expect([second(), second(), second()]).toEqual(expected);
    const windows = new Set(Array.from({ length: 256 }, (_, index) =>
      new EndlessGenerator(createTuning(), 'normal', 'window-' + index).descriptor.safeModules));
    expect([...windows].sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9, 10]);
  });

  it.each(difficulties)('samples the %s base distribution without biased truncation', difficulty => {
    let total = 0;
    const counts = [0, 0, 0, 0];
    const samples = 12000;
    for (let seed = 0; seed < samples; seed++) {
      const generator = new EndlessGenerator(createTuning(), difficulty, `distribution-${seed}`);
      const choices = generator.trapChoices(ENDLESS_MODULES[0], 1);
      counts[choices.length]++;
      total += choices.length;
      expect(new Set(choices.map(choice => choice.socketId)).size).toBe(choices.length);
      expect(choices.every(choice => ENDLESS_MODULES[0].sockets.find(socket => socket.id === choice.socketId)!.compatible.includes(choice.kind))).toBe(true);
    }
    expect(total / samples).toBeCloseTo({ easy: 0.5, normal: 0.75, hard: 1.5 }[difficulty], 1);
    if (difficulty === 'easy') { expect(counts[3]).toBe(0); expect(counts[2] / samples).toBeLessThan(0.015); }
    if (difficulty === 'normal') expect(counts[3] / samples).toBeLessThan(0.015);
  });
});

describe('shared jam module pool', () => {
  it('authors hard ascents and descents at exactly 36 degrees within the fixed terrain ceiling', () => {
    for (const module of ENDLESS_MODULES) {
      const angles = module.terrain.flatMap(strip => strip.points.slice(1).map((point, i) =>
        Math.atan2(point.y - strip.points[i].y, point.x - strip.points[i].x)));
      expect(angles.every(angle => Math.abs(angle) <= MAX_TERRAIN_ANGLE + 1e-12)).toBe(true);
      if (module.difficulty === 'hard') {
        expect(Math.max(...angles)).toBeCloseTo(MAX_TERRAIN_ANGLE, 12);
        expect(Math.min(...angles)).toBeCloseTo(-MAX_TERRAIN_ANGLE, 12);
      }
    }
  });

  it('contains the original six transitions and three harder pieces, all valid sockets and no dead end', () => {
    expect(ENDLESS_MODULES.map(module => module.id).sort()).toEqual(['AB', 'AB-hard', 'AD', 'BA', 'BD', 'BD-hard', 'DA', 'DB', 'DB-hard']);
    expect(() => validateModulePool(ENDLESS_MODULES)).not.toThrow();
    expect(() => validateModulePool([ENDLESS_MODULES.find(module => module.id === 'BA')!])).toThrow('dead end');
  });

  it('uses every compatible module reproducibly across a long closed stream', () => {
    const first = new EndlessGenerator(createTuning(), 'hard', 'all-modules');
    const second = new EndlessGenerator(createTuning(), 'hard', 'all-modules', [...ENDLESS_MODULES].reverse());
    const seen = new Set<string>();
    let biome: Biome = 'grass', height = 0, x = 40;
    for (let index = 1; index <= 5000; index++) {
      const module = first.generate(index, biome, x, height);
      expect(second.generate(index, biome, x, height)).toEqual(module);
      expect(module.entryBiome).toBe(biome);
      expect(module.startX).toBe(x);
      expect(module.startHeight).toBe(height);
      seen.add(module.definitionId);
      biome = module.exitBiome; height = module.endHeight; x = module.endX;
    }
    expect([...seen].sort()).toEqual(ENDLESS_MODULES.map(module => module.id).sort());
  });

  it.each(difficulties)('keeps a closed %s stream within the selected terrain tier', difficulty => {
    const generator = new EndlessGenerator(createTuning(), difficulty, 'difficulty-pool');
    const seen = new Set<string>();
    let biome: Biome = 'grass';
    for (let index = 1; index <= 1500; index++) {
      const definition = generator.definition(index, biome);
      expect(MODULE_DIFFICULTY_WEIGHT[definition.difficulty]).toBeLessThanOrEqual(MODULE_DIFFICULTY_WEIGHT[difficulty]);
      seen.add(definition.id); biome = definition.end.biome;
    }
    expect([...seen].sort()).toEqual(ENDLESS_MODULES.filter(module =>
      MODULE_DIFFICULTY_WEIGHT[module.difficulty] <= MODULE_DIFFICULTY_WEIGHT[difficulty]).map(module => module.id).sort());
  });

  it('prefers high-tier terrain in hard mode while keeping easier recovery pieces', () => {
    const generator = new EndlessGenerator(createTuning(), 'hard', 'terrain-weight');
    const counts = { easy: 0, normal: 0, hard: 0 };
    for (let index = 1; index <= 6000; index++) counts[generator.definition(index, 'grass').difficulty]++;
    expect(counts.hard / 6000).toBeGreaterThan(0.75);
    expect(counts.easy).toBeGreaterThan(0);
  });

  it('rejects invalid difficulty metadata, excessive slopes and difficulty-specific dead ends', () => {
    const source = ENDLESS_MODULES.find(module => module.id === 'BA')!;
    expect(() => validateModulePool(ENDLESS_MODULES.map(module => module === source ?
      { ...module, difficulty: 'extreme' as Difficulty } : module))).toThrow('metadata');
    expect(() => validateModulePool(ENDLESS_MODULES.map(module => module === source ?
      { ...module, terrain: [{ biome: 'grass', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }] } : module))).toThrow('36-degree');
    const disconnected = ENDLESS_MODULES.map(module => module.start.biome === 'water' ? { ...module, difficulty: 'hard' as const } : module);
    expect(() => new EndlessGenerator(createTuning(), 'easy', 'dead-end', disconnected)).toThrow('Difficulty-filtered');
  });

  it.each(ENDLESS_MODULES)('authors pit geometry only for selected branch sockets in $id', module => {
    const ordinary = placeModule(module, 1, 100, 5);
    for (const socket of module.sockets) {
      const variant = placeModule(module, 1, 100, 5, [{ socketId: socket.id, kind: 'branch' }]);
      const extra = variant.terrain.flatMap(strip => strip.points).filter(point =>
        !ordinary.terrain.flatMap(strip => strip.points).some(other => point.x === other.x && point.y === other.y));
      expect(extra.some(point => point.y < variant.traps[0].y)).toBe(true);
      expect(variant.traps[0].x).toBe(100 + socket.x);
    }
    expect(() => placeModule(module, 1, 0, 0, [{ socketId: 'missing', kind: 'tree' }])).toThrow();
  });
});

describe('Endless pennant scoring and terminal ordering', () => {
  it('scores retained load including grace once per crossed distance, with increasing multipliers', () => {
    const score = new EndlessScore(), pennants = flags();
    const cargo = CARGO.map(item => ({ id: item.id, state: 'active' as const }));
    score.advance(99.9, cargo, pennants);
    expect(score.score).toBe(0);
    score.advance(100, cargo, pennants);
    expect(score.score).toBe(1250);
    score.advance(100, cargo, [{ ...pennants[0], crossed: false }]);
    expect(score.score).toBe(1250);
    score.advance(100, cargo, pennants);
    expect(score.score).toBe(1250);
    score.advance(180, [{ id: 'sofa', state: 'separated' }, { id: 'television', state: 'lost' }], pennants);
    expect(score.score).toBe(1450);
    expect(score.pennantsCrossed).toBe(2);
  });

  it('processes skipped boundaries in order and freezes final-loss score before same-tick crossing', () => {
    const score = new EndlessScore(), pennants = flags();
    score.advance(181, [{ id: 'cocktailGlass', state: 'active' }], pennants);
    expect(score.score).toBe(1500);
    const finalFlag: Pennant = { id: 'flag-3', moduleIndex: 3, x: 200, y: 0, crossed: false };
    score.advance(200, [{ id: 'cocktailGlass', state: 'lost' }], [...pennants, finalFlag]);
    expect(score.ended).toBe(true);
    expect(score.lastLoss).toEqual(['cocktailGlass']);
    expect(finalFlag.crossed).toBe(false);
    score.advance(300, [{ id: 'sofa', state: 'active' }], [finalFlag]);
    expect(score.score).toBe(1500);
    expect(finalFlag.crossed).toBe(false);
  });
});
