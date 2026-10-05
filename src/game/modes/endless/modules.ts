import { ENDLESS } from '../../config/endless';
import type { Biome, Scenario, TerrainPoint, TerrainStrip, WaterRegion } from '../../content/scenarios';
import type { TrapKind, TrapPlacement, WorldChunk } from '../../physics/worldContent';

export interface ModuleConnector { biome: Biome; height: number }
export interface TrapSocket { id: string; x: number; y: number; compatible: readonly TrapKind[] }
export interface ModuleJump { chargeAtX: number; landingX: number }
export interface EndlessModuleDefinition {
  schemaVersion: 1; id: string; version: string; name: string; length: number;
  start: ModuleConnector; end: ModuleConnector;
  terrain: readonly TerrainStrip[]; water?: readonly WaterRegion[];
  sockets: readonly TrapSocket[];
  /** Optional full-charge traversal evidence targets, not mandatory jump-only routes. */
  jumps: readonly ModuleJump[];
}
export interface SocketChoice { socketId: string; kind: TrapKind }
export interface ModuleInstance extends WorldChunk {
  index: number; definitionId: string;
  startX: number; endX: number; startHeight: number; endHeight: number;
  entryBiome: Biome; exitBiome: Biome;
  traps: readonly TrapPlacement[];
  choices: readonly SocketChoice[];
}

const points = (coordinates: readonly (readonly [number, number])[]): TerrainPoint[] =>
  coordinates.map(([x, y]) => ({ x, y }));
const strip = (biome: 'grass' | 'rock', coordinates: readonly (readonly [number, number])[], bottom = -9): TerrainStrip =>
  ({ biome, points: points(coordinates), bottom });
const sockets = (coordinates: readonly (readonly [number, number])[]): TrapSocket[] =>
  coordinates.map(([x, y], i) => ({ id: `socket-${i + 1}`, x, y, compatible: ['branch', 'stump', 'tree'] }));

/** One reusable pool for Endless and future authored levels. A=water, B=grass, D=rock. */
export const ENDLESS_MODULES: readonly EndlessModuleDefinition[] = [
  {
    schemaVersion: 1, id: 'BA', version: '1', name: 'Pradera y estanque', length: 80,
    start: { biome: 'grass', height: 0 }, end: { biome: 'water', height: -0.1 },
    terrain: [strip('grass', [[0, 0], [8, 0], [10, 0.35], [18, 0.35], [24, -0.2], [26, -0.2],
      [28, 0.15], [36, 0.15], [42, -0.25], [44, -0.25], [46, 0.05], [52, 0.05], [58, -3.4], [80, -3.4]])],
    water: [{ left: 53, right: 80, surface: -0.1, bottom: -3.4 }],
    sockets: sockets([[14, 0.35], [32, 0.15], [49, 0.05]]), jumps: [{ chargeAtX: 1, landingX: 8 }],
  },
  {
    schemaVersion: 1, id: 'AB', version: '1', name: 'Orilla amable', length: 80,
    start: { biome: 'water', height: 0 }, end: { biome: 'grass', height: 0.2 },
    terrain: [strip('grass', [[0, -3.3], [18, -3.3], [26, 0.2], [38, 0.2], [44, 0.45],
      [54, 0.45], [60, 0.1], [70, 0.1], [76, 0.2], [80, 0.2]])],
    water: [{ left: 0, right: 25, surface: 0, bottom: -3.3 }],
    sockets: sockets([[34, 0.2], [50, 0.45], [66, 0.1]]), jumps: [{ chargeAtX: 28, landingX: 35 }],
  },
  {
    schemaVersion: 1, id: 'BD', version: '1', name: 'Colinas y cornisa', length: 72,
    start: { biome: 'grass', height: 0 }, end: { biome: 'rock', height: 0.6 },
    terrain: [
      strip('grass', [[0, 0], [8, 0], [10, 0.3], [18, 0.3], [24, 0.6], [28, 0.6]]),
      strip('rock', [[28, 0.6], [32, 1.05], [38, 1.05], [44, 0.35], [48, 0.35],
        [50, 0.6], [58, 0.6], [64, 1], [68, 0.6], [72, 0.6]]),
    ],
    sockets: sockets([[14, 0.3], [35, 1.05], [54, 0.6]]), jumps: [{ chargeAtX: 20, landingX: 27 }],
  },
  {
    schemaVersion: 1, id: 'DB', version: '1', name: 'Cornisa y claro', length: 72,
    start: { biome: 'rock', height: 0 }, end: { biome: 'grass', height: -0.6 },
    terrain: [
      strip('rock', [[0, 0], [8, 0], [10, 0.25], [18, 0.25], [24, -0.35], [28, -0.35]]),
      strip('grass', [[28, -0.35], [31, -0.6], [39, -0.6], [44, -1], [48, -1],
        [50, -0.6], [58, -0.6], [64, -0.25], [68, -0.6], [72, -0.6]]),
    ],
    sockets: sockets([[14, 0.25], [35, -0.6], [54, -0.6]]), jumps: [{ chargeAtX: 11.25, landingX: 18.25 }],
  },
  {
    schemaVersion: 1, id: 'DA', version: '1', name: 'Roca y poza', length: 80,
    start: { biome: 'rock', height: 0 }, end: { biome: 'water', height: -0.6 },
    terrain: [strip('rock', [[0, 0], [8, 0], [10, 0.4], [18, 0.4], [24, 0.1], [26, 0.1],
      [28, 0.25], [36, 0.25], [42, -0.15], [44, -0.15], [46, 0], [52, 0], [58, -3.9], [80, -3.9]])],
    water: [{ left: 53, right: 80, surface: -0.6, bottom: -3.9 }],
    sockets: sockets([[14, 0.4], [32, 0.25], [49, 0]]), jumps: [{ chargeAtX: 1, landingX: 8 }],
  },
  {
    schemaVersion: 1, id: 'AD', version: '1', name: 'Isla y orilla rocosa', length: 80,
    start: { biome: 'water', height: 0 }, end: { biome: 'rock', height: 0.3 },
    terrain: [
      strip('rock', [[0, -3.3], [5, -5.2], [18, -5.2], [29, 0.3], [38, 0.3], [44, 0.6],
        [54, 0.6], [60, 0.15], [70, 0.15], [76, 0.3], [80, 0.3]]),
      strip('rock', [[8, -0.21], [12, 0.12], [14, 0.12], [18, -0.21]], -0.22),
    ],
    water: [{ left: 0, right: 28.5, surface: 0, bottom: -5.2 }],
    sockets: sockets([[34, 0.3], [50, 0.6], [66, 0.15]]), jumps: [{ chargeAtX: 29.5, landingX: 36.5 }],
  },
];

/** Chosen branch covers get an underlying escapable recess; empty sockets retain ordinary ground. */
function recessedTerrain(definition: EndlessModuleDefinition, choices: readonly SocketChoice[]): readonly TerrainStrip[] {
  const branches = choices.filter(choice => choice.kind === 'branch').map(choice =>
    definition.sockets.find(socket => socket.id === choice.socketId)!);
  return definition.terrain.map(source => {
    let result = [...source.points];
    for (const socket of branches) {
      const half = ENDLESS.branchPitHalfWidthMetres;
      const left = socket.x - half, right = socket.x + half;
      const index = result.findIndex((a, i) => i + 1 < result.length && a.x <= left && result[i + 1].x >= right &&
        a.y === socket.y && result[i + 1].y === socket.y);
      if (index < 0) continue;
      const a = result[index], b = result[index + 1], low = socket.y - ENDLESS.branchPitDepthMetres;
      result = [...result.slice(0, index), a, { x: left, y: socket.y }, { x: left + 0.2, y: low },
        { x: socket.x, y: low }, { x: right, y: socket.y }, b, ...result.slice(index + 2)];
    }
    return { ...source, points: result };
  });
}

export function placeModule(definition: EndlessModuleDefinition, index: number, startX: number,
  startHeight: number, choices: readonly SocketChoice[] = []): ModuleInstance {
  const dy = startHeight - definition.start.height;
  const id = `module-${index}`;
  const terrain = recessedTerrain(definition, choices).map(source => ({
    ...source, bottom: (source.bottom ?? -9) + dy,
    points: source.points.map(point => ({ x: point.x + startX, y: point.y + dy })),
  }));
  const water = definition.water?.map(region => ({ left: region.left + startX, right: region.right + startX,
    surface: region.surface + dy, bottom: region.bottom + dy }));
  const traps = choices.map(choice => {
    const socket = definition.sockets.find(candidate => candidate.id === choice.socketId);
    if (!socket || !socket.compatible.includes(choice.kind)) throw new Error('Invalid module trap choice');
    return { id: `${id}-${socket.id}`, kind: choice.kind, x: startX + socket.x, y: dy + socket.y };
  });
  return { id, index, definitionId: definition.id, startX, endX: startX + definition.length,
    startHeight, endHeight: definition.end.height + dy, entryBiome: definition.start.biome,
    exitBiome: definition.end.biome, terrain, water, traps, choices: [...choices] };
}

/** A diagnostic lead-in/tail keeps validation independent of neighboring generator choices. */
export function scenarioForModule(definition: EndlessModuleDefinition): Scenario {
  const first = definition.terrain[0].points[0];
  const tail = definition.terrain.find(terrain => terrain.points.at(-1)!.x === definition.length)!;
  const last = tail.points.at(-1)!;
  const startY = definition.start.biome === 'water' ? definition.start.height - 1.1 : definition.start.height;
  return {
    id: `module-${definition.id}`, label: definition.name, description: 'Authored jam traversal diagnostic',
    startX: 0, startY, endX: definition.length + 8,
    terrain: [
      { biome: definition.terrain[0].biome, bottom: -9, points: [{ x: -12, y: first.y }, first] },
      ...definition.terrain,
      { biome: tail.biome, bottom: -9, points: [last, { x: definition.length + 20, y: last.y }] },
    ],
    waters: definition.water?.map(region => ({ ...region,
      left: region.left === 0 ? -12 : region.left,
      right: region.right === definition.length ? definition.length + 20 : region.right,
    })),
  };
}
