/**
 * Presentation sizes in metres; anchors use the SVG's right/down coordinates.
 * These definitions do not create colliders or drive authoritative body state.
 * Paths are relative to public/ and must pass through the public-asset helper.
 */
export interface SpriteVisualDefinition {
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly label: string;
}

export interface WalkVisualDefinition {
  readonly frames: readonly string[];
  readonly chargeFrames: readonly string[];
  readonly width: number;
  readonly height: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly label: string;
  readonly logicalFrames: number;
  readonly framesPerSecond: number;
}

export const VISUALS = {
  sofa: {
    path: 'sprites/cargo/sofa/sofa.svg',
    width: 2.2,
    height: 0.65,
    anchorX: 0.5,
    anchorY: 0.5,
    label: 'SOFÁ',
  },
  television: {
    path: 'sprites/cargo/tv/tv.svg',
    width: 0.8,
    height: 0.9,
    anchorX: 0.5,
    anchorY: 0.5,
    label: 'TV',
  },
  cocktailGlass: {
    path: 'sprites/cargo/cocktail-glass/cocktail-glass.svg',
    width: 0.4,
    height: 0.7,
    anchorX: 0.5,
    anchorY: 0.5,
    label: 'VASO',
  },
  floorLamp: {
    path: 'sprites/cargo/floor-lamp/floor-lamp.svg',
    width: 0.55,
    height: 1.6,
    anchorX: 0.5,
    anchorY: 0.5,
    label: 'LÁMPARA',
  },
  turtle: {
    frames: ['sprites/turtle/walk-01.svg', 'sprites/turtle/walk-02.svg'],
    chargeFrames: ['sprites/turtle/charge-walk-01.svg', 'sprites/turtle/charge-walk-02.svg'],
    width: 2.4,
    height: 0.9,
    anchorX: 0.5,
    anchorY: 0.5,
    label: 'DON TORTUGA',
    logicalFrames: 60,
    framesPerSecond: 60,
  },
  shell: {
    path: 'sprites/turtle/shell.svg',
    width: 2.0,
    height: 0.68,
    anchorX: 0.5,
    // Keep the upper outline 0.30 m above the visual registration point.
    anchorY: 0.30 / 0.68,
    label: 'CAPARAZÓN',
  },
} as const satisfies {
  sofa: SpriteVisualDefinition;
  television: SpriteVisualDefinition;
  cocktailGlass: SpriteVisualDefinition;
  floorLamp: SpriteVisualDefinition;
  turtle: WalkVisualDefinition;
  shell: SpriteVisualDefinition;
};
