import { ENDLESS, ENDLESS_DIFFICULTIES } from '../../config/endless';
import type { Difficulty, TrapProbabilityVector } from '../../config/endless';
import type { Tuning } from '../../config/tuning';
import { exportSettings } from '../../config/tuning';
import type { Biome } from '../../content/scenarios';
import { ENDLESS_MODULES, placeModule } from './modules';
import type { EndlessModuleDefinition, ModuleInstance, SocketChoice } from './modules';
import { newRunSeed, randomStream, seedHash } from './random';

export interface RunDescriptor {
  readonly seed: string; readonly difficulty: Difficulty; readonly safeModules: number;
  readonly poolVersion: string; readonly generatorVersion: string;
  readonly physicsVersion: string; readonly settingsVersion: string;
}

export function trapProbabilities(difficulty: Difficulty, moduleIndex: number, safeModules: number): TrapProbabilityVector {
  if (!Number.isSafeInteger(moduleIndex) || moduleIndex < 1 || !Number.isInteger(safeModules) ||
      safeModules < ENDLESS.safeModulesMin || safeModules > ENDLESS.safeModulesMax) throw new RangeError('Invalid progression index');
  const tuning = ENDLESS_DIFFICULTIES[difficulty];
  const elapsed = Math.max(0, moduleIndex - safeModules);
  const logarithm = Math.log1p(elapsed / ENDLESS.progressionScaleModules);
  const progress = logarithm / (1 + logarithm);
  return tuning.base.map((probability, count) => probability + progress *
    (tuning.limit[count] - probability)) as unknown as TrapProbabilityVector;
}

export function expectedTrapCount(probabilities: TrapProbabilityVector): number {
  return probabilities.reduce((sum, probability, count) => sum + probability * count, 0);
}

export function validateModulePool(pool: readonly EndlessModuleDefinition[]): void {
  if (pool.length === 0 || new Set(pool.map(module => module.id)).size !== pool.length) throw new Error('Empty or duplicate module pool');
  for (const module of pool) {
    if (!Number.isFinite(module.length) || module.length < 1 || module.sockets.length !== 3 ||
        new Set(module.sockets.map(socket => socket.id)).size !== 3) throw new Error('Invalid module metadata: ' + module.id);
    if (!pool.some(next => next.start.biome === module.end.biome)) throw new Error('Module pool dead end: ' + module.id);
    for (const socket of module.sockets) {
      if (!Number.isFinite(socket.x) || !Number.isFinite(socket.y) || socket.x < 0 || socket.x > module.length ||
          socket.compatible.length === 0 || new Set(socket.compatible).size !== socket.compatible.length) {
        throw new Error('Invalid trap socket: ' + module.id);
      }
      if (socket.compatible.includes('branch')) {
        const half = ENDLESS.branchPitHalfWidthMetres;
        const flat = module.terrain.some(terrain => terrain.points.some((point, i, points) =>
          i + 1 < points.length && point.x <= socket.x - half && points[i + 1].x >= socket.x + half &&
          point.y === socket.y && points[i + 1].y === socket.y));
        if (!flat) throw new Error('Branch socket lacks an escapable cover span: ' + module.id);
      }
    }
  }
}

/** Random choices are keyed by scoring index and purpose, independent of materialization cadence. */
export class EndlessGenerator {
  readonly descriptor: RunDescriptor;
  constructor(tuning: Tuning, difficulty: Difficulty = 'normal', seed = newRunSeed(),
    readonly pool: readonly EndlessModuleDefinition[] = ENDLESS_MODULES) {
    if (!(difficulty in ENDLESS_DIFFICULTIES) || !seed || seed.length > 256) throw new Error('Invalid run seed/difficulty');
    validateModulePool(pool);
    const safeRandom = randomStream(seed, 0, 'safe-window')();
    this.descriptor = Object.freeze({ seed, difficulty,
      safeModules: ENDLESS.safeModulesMin + Math.floor(safeRandom * (ENDLESS.safeModulesMax - ENDLESS.safeModulesMin + 1)),
      poolVersion: ENDLESS.poolVersion, generatorVersion: ENDLESS.generatorVersion, physicsVersion: ENDLESS.physicsVersion,
      settingsVersion: seedHash(exportSettings(tuning)).toString(16).padStart(8, '0'),
    });
  }

  definition(index: number, entryBiome: Biome): EndlessModuleDefinition {
    const candidates = this.pool.filter(module => module.start.biome === entryBiome)
      .sort((first, second) => first.id < second.id ? -1 : first.id > second.id ? 1 : 0);
    if (candidates.length === 0) throw new Error('No compatible successor for ' + entryBiome);
    return candidates[Math.floor(randomStream(this.descriptor.seed, index, 'module:' + entryBiome)() * candidates.length)];
  }

  trapChoices(definition: EndlessModuleDefinition, index: number): readonly SocketChoice[] {
    const descriptor = this.descriptor;
    const probabilities = trapProbabilities(descriptor.difficulty, index, descriptor.safeModules);
    const roll = randomStream(descriptor.seed, index, 'trap-count')();
    let cumulative = 0, count = 3;
    for (let candidate = 0; candidate < probabilities.length; candidate++) {
      cumulative += probabilities[candidate];
      if (roll < cumulative) { count = candidate; break; }
    }
    const remaining = [...definition.sockets].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const socketRandom = randomStream(descriptor.seed, index, 'trap-sockets');
    const selected: SocketChoice[] = [];
    for (let i = 0; i < count; i++) {
      const socket = remaining.splice(Math.floor(socketRandom() * remaining.length), 1)[0];
      const compatible = [...socket.compatible].sort();
      selected.push({ socketId: socket.id, kind: compatible[Math.floor(randomStream(descriptor.seed, index,
        'trap-type:' + socket.id)() * compatible.length)] });
    }
    return selected.sort((a, b) => a.socketId < b.socketId ? -1 : a.socketId > b.socketId ? 1 : 0);
  }

  generate(index: number, entryBiome: Biome, startX: number, startHeight: number): ModuleInstance {
    const definition = this.definition(index, entryBiome);
    return placeModule(definition, index, startX, startHeight, this.trapChoices(definition, index));
  }
}
