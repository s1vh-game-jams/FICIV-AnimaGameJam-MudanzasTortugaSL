import type { TerrainStrip } from '../../content/scenarios';
import { MAX_TERRAIN_ANGLE } from '../../config/tuning';
import type { EndlessModuleDefinition, TrapSocket } from './modules';

/** Fixed authored geometry: laboratory shell tuning never rebuilds these hills. */
const steepRise = 4 * Math.tan(MAX_TERRAIN_ANGLE);
const terrain = (biome: 'grass' | 'rock', points: readonly (readonly [number, number])[]): TerrainStrip =>
  ({ biome, bottom: -9, points: points.map(([x, y]) => ({ x, y })) });
const sockets = (coordinates: readonly (readonly [number, number])[]): TrapSocket[] =>
  coordinates.map(([x, y], index) => ({ id: `socket-${index + 1}`, x, y, compatible: ['branch', 'stump', 'tree'] }));

/** Each entry biome has a hard successor; dry hills reach the authored 36-degree ceiling. */
export const CHALLENGE_MODULES: readonly EndlessModuleDefinition[] = [
  {
    schemaVersion: 1, id: 'BD-hard', version: '1', name: 'Cuesta de la mudanza', difficulty: 'hard', length: 88,
    start: { biome: 'grass', height: 0 }, end: { biome: 'rock', height: 0 },
    terrain: [
      terrain('grass', [[0, 0], [22, 0], [26, steepRise], [32, steepRise], [36, 0], [40, 0]]),
      terrain('rock', [[40, 0], [88, 0]]),
    ],
    sockets: sockets([[14, 0], [48, 0], [70, 0]]),
    jumps: [{ chargeAtX: 18, landingX: 24 }],
  },
  {
    schemaVersion: 1, id: 'DB-hard', version: '1', name: 'Barranco de los muebles', difficulty: 'hard', length: 88,
    start: { biome: 'rock', height: 0 }, end: { biome: 'grass', height: 0 },
    terrain: [
      terrain('rock', [[0, 0], [22, 0], [26, -steepRise], [32, -steepRise], [36, 0], [40, 0]]),
      terrain('grass', [[40, 0], [88, 0]]),
    ],
    sockets: sockets([[14, 0], [48, 0], [70, 0]]),
    jumps: [{ chargeAtX: 18, landingX: 26 }],
  },
  {
    schemaVersion: 1, id: 'AB-hard', version: '1', name: 'Orilla y colina empinada', difficulty: 'hard', length: 108,
    start: { biome: 'water', height: 0 }, end: { biome: 'grass', height: 0.2 },
    terrain: [terrain('grass', [[0, -3.3], [18, -3.3], [26, 0.2], [44, 0.2],
      [48, 0.2 + steepRise], [54, 0.2 + steepRise], [58, 0.2], [108, 0.2]])],
    water: [{ left: 0, right: 25, surface: 0, bottom: -3.3 }],
    sockets: sockets([[34, 0.2], [66, 0.2], [90, 0.2]]),
    jumps: [{ chargeAtX: 40, landingX: 46 }],
  },
];
