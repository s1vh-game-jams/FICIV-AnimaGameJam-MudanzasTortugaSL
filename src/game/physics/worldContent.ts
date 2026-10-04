import type { TerrainStrip, WaterRegion } from '../content/scenarios';

export type TrapKind = 'branch' | 'stump' | 'tree';
export interface TrapPlacement { id: string; kind: TrapKind; x: number; y: number }
/** Coordinates are current local world metres. Ownership permits safe retirement. */
export interface WorldChunk {
  id: string;
  terrain: readonly TerrainStrip[];
  water?: readonly WaterRegion[];
  traps?: readonly TrapPlacement[];
}
export interface HazardSnapshot extends TrapPlacement {
  phase: 'idle' | 'triggered' | 'active' | 'spent';
  lift: number;
  cone?: { x: number; y: number; angle: number };
}
