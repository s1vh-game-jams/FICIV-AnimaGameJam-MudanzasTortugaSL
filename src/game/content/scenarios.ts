export type Biome = 'grass' | 'rock' | 'water';
export interface TerrainPoint { x: number; y: number }
export interface TerrainStrip { biome: Exclude<Biome, 'water'>; points: readonly TerrainPoint[] }
export interface WaterRegion { left: number; right: number; surface: number; bottom: number }
export interface Scenario {
  id: string; label: string; description: string; startX: number; startY: number;
  endX: number; terrain: readonly TerrainStrip[]; water?: WaterRegion;
}
const flat = (biome: 'grass' | 'rock'): TerrainStrip => ({ biome, points: [{ x: -12, y: 0 }, { x: 130, y: 0 }] });
export const SCENARIOS: readonly Scenario[] = [
  { id: 'flat', label: '01 · Hierba / equilibrio', description: 'Recta para observar inercia y correcciones.', startX: 0, startY: 0, endX: 110, terrain: [flat('grass')] },
  { id: 'slopes', label: '02 · Roca / desniveles', description: 'Rampas y descensos; conserva la carga con el caparazón.', startX: 0, startY: 0, endX: 105,
    terrain: [{ biome: 'rock', points: [{ x: -12, y: 0 }, { x: 12, y: 0 }, { x: 18, y: 2 }, { x: 23, y: 2 }, { x: 30, y: -1 }, { x: 37, y: -1 }, { x: 43, y: 0 }, { x: 130, y: 0 }] }] },
  { id: 'comparison', label: '03 · Hierba → roca', description: 'Misma geometría con distinta respuesta.', startX: 0, startY: 0, endX: 85,
    terrain: [
      { biome: 'grass', points: [{ x: -12, y: 0 }, { x: 12, y: 0 }, { x: 17, y: 1.4 }, { x: 19, y: 1.4 }, { x: 24, y: 0 }, { x: 32, y: 0 }] },
      { biome: 'rock', points: [{ x: 32, y: 0 }, { x: 44, y: 0 }, { x: 49, y: 1.4 }, { x: 51, y: 1.4 }, { x: 56, y: 0 }, { x: 110, y: 0 }] },
    ] },
  { id: 'water', label: '04 · Agua / peso y corriente', description: '↑ ↓ nadan. Más carga: más profundidad y corriente.', startX: 0, startY: 0, endX: 80,
    terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 13, y: 0 }, { x: 19, y: -3.5 }, { x: 47, y: -3.5 }, { x: 56, y: 0 }, { x: 100, y: 0 }] }],
    water: { left: 14, right: 54, surface: -0.1, bottom: -3.5 } },
  { id: 'water-drop', label: '05 · Agua / caída alta', description: 'Entrada amortiguada desde una plataforma elevada.', startX: 0, startY: 3, endX: 80,
    terrain: [{ biome: 'grass', points: [{ x: -12, y: 3 }, { x: 12, y: 3 }, { x: 12.05, y: -3.5 }, { x: 47, y: -3.5 }, { x: 56, y: 0 }, { x: 100, y: 0 }] }],
    water: { left: 12.05, right: 54, surface: -0.1, bottom: -3.5 } },
  { id: 'jump-obstacle', label: '06 · Salto / pequeño desnivel', description: 'Carga Espacio y suelta para saltar conservando el avance.', startX: 0, startY: 0, endX: 50,
    terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 8.5, y: 0 }, { x: 9.3, y: 0.5 },
      { x: 9.7, y: 0.5 }, { x: 10.5, y: 0 }, { x: 70, y: 0 }] }] },
  { id: 'slopes-max', label: '07 · Pendientes / compensación', description: 'Rampa de 36°: compensa la inclinación con el caparazón.', startX: 0, startY: 0, endX: 55,
    terrain: [{ biome: 'rock', points: [{ x: -12, y: 0 }, { x: 8, y: 0 },
      { x: 8 + 3 / Math.tan(Math.PI / 5), y: 3 }, { x: 19, y: 3 },
      { x: 19 + 3 / Math.tan(Math.PI / 5), y: 0 }, { x: 75, y: 0 }] }] },
  { id: 'water-jump', label: '08 · Salto / entrada al agua', description: 'Salta desde la orilla; observa la inercia y la amortiguación.', startX: 0, startY: 0, endX: 60,
    terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 9, y: 0 }, { x: 15, y: -3.5 },
      { x: 38, y: -3.5 }, { x: 47, y: 0 }, { x: 80, y: 0 }] }],
    water: { left: 10, right: 45, surface: -0.1, bottom: -3.5 } },
  { id: 'jump-wall', label: '09 · Pared / espera de cámara', description: 'Pared de 2 m: la cámara espera. Carga Espacio al llegar y suelta para continuar.', startX: 0, startY: 0, endX: 45,
    terrain: [{ biome: 'grass', points: [{ x: -12, y: 0 }, { x: 9, y: 0 }, { x: 9.001, y: 2 },
      { x: 16, y: 2 }, { x: 20, y: 0 }, { x: 70, y: 0 }] }] },
];
export function terrainAt(scenario: Scenario, x: number): { height: number; biome: 'grass' | 'rock' } {
  for (const strip of scenario.terrain) for (let i = 1; i < strip.points.length; i++) {
    const a = strip.points[i - 1], b = strip.points[i];
    if (x >= a.x && x <= b.x) return { height: a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x)), biome: strip.biome };
  }
  throw new Error('Outside diagnostic terrain: ' + x);
}
