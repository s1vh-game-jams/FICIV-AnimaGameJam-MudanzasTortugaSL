export type CargoKind = 'sofa' | 'television' | 'cocktailGlass' | 'floorLamp';
export type CargoShape =
  | { kind: 'box'; halfWidth: number; halfHeight: number; x: number; y: number }
  | { kind: 'hull'; vertices: readonly number[] };
export interface CargoDefinition {
  id: CargoKind; label: string; width: number; height: number; mass: number;
  centerOfMassY: number; x: number; y: number; shapes: readonly CargoShape[];
}
/** Metres/kg; spawn is relative to ground. Colliders remain independent of art. */
export const CARGO: readonly CargoDefinition[] = [
  { id: 'sofa', label: 'Sofá', width: 2.2, height: 0.65, mass: 8, centerOfMassY: -0.08, x: 0, y: 1.29,
    shapes: [{ kind: 'box', halfWidth: 1.1, halfHeight: 0.325, x: 0, y: 0 }] },
  { id: 'television', label: 'TV', width: 0.8, height: 0.9, mass: 4, centerOfMassY: 0.08, x: 0.3, y: 2.07,
    shapes: [{ kind: 'box', halfWidth: 0.4, halfHeight: 0.45, x: 0, y: 0 }] },
  { id: 'cocktailGlass', label: 'Vaso', width: 0.4, height: 0.7, mass: 0.4, centerOfMassY: 0.12, x: 0.32, y: 2.88,
    shapes: [
      { kind: 'box', halfWidth: 0.15, halfHeight: 0.04, x: 0, y: -0.31 },
      { kind: 'box', halfWidth: 0.025, halfHeight: 0.17, x: 0, y: -0.1 },
      { kind: 'hull', vertices: [-0.2, 0.35, 0.2, 0.35, 0, 0.02] },
    ] },
  { id: 'floorLamp', label: 'Lámpara', width: 0.55, height: 1.6, mass: 1.2, centerOfMassY: 0.35, x: -0.72, y: 2.42,
    shapes: [
      { kind: 'box', halfWidth: 0.275, halfHeight: 0.08, x: 0, y: -0.72 },
      { kind: 'box', halfWidth: 0.045, halfHeight: 0.61, x: 0, y: -0.04 },
      { kind: 'hull', vertices: [-0.275, 0.45, 0.275, 0.45, 0, 0.8] },
    ] },
];
