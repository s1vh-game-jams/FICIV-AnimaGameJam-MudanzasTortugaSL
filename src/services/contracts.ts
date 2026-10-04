/** Serializable public data; authentication and credentials do not belong here. */
export const CONTENT_SCHEMA_VERSION = 1;
export const MAX_LEADERBOARD_ENTRIES = 100;

export interface VersionReference { readonly id: string; readonly version: string }
export interface VersionedContent extends VersionReference { readonly schemaVersion: typeof CONTENT_SCHEMA_VERSION }
export interface AuthorProfile { readonly id: string; readonly displayName: string }
/** IDs bind to existing game-runtime archetypes; collider data remains in the game. */
export type ArchetypeReference = VersionReference;
export interface CargoInstance {
  readonly instanceId: string; readonly archetype: VersionReference;
  readonly x: number; readonly y: number; readonly angle: number;
}
export interface TurtleConfiguration extends VersionedContent {
  readonly name: string; readonly authorUserId: string;
  readonly bodyArchetype: VersionReference; readonly cargo: readonly CargoInstance[];
}
export type ContentBiome = 'water' | 'grass' | 'sand' | 'rock';
export interface ModuleConnector { readonly biome: ContentBiome; readonly height: number }
export interface ContentPoint { readonly x: number; readonly y: number }
export interface ModuleTerrain {
  readonly biome: Exclude<ContentBiome, 'water'>; readonly points: readonly ContentPoint[];
  /** Optional finite lower solid bound, allowing islands above submerged routes. */
  readonly bottom?: number;
}
export interface ModuleTrapSocket {
  readonly id: string; readonly x: number; readonly y: number;
  readonly compatible: readonly ('branch' | 'stump' | 'tree')[];
}
export interface ModuleWater {
  readonly left: number; readonly right: number; readonly surface: number; readonly bottom: number;
}
export interface ModuleDefinition extends VersionedContent {
  readonly name: string; readonly length: number;
  readonly start: ModuleConnector; readonly end: ModuleConnector;
  readonly terrain: readonly ModuleTerrain[]; readonly water?: readonly ModuleWater[];
  readonly hazards?: readonly ContentPlacement[];
  readonly sockets?: readonly ModuleTrapSocket[];
  readonly jumps?: readonly { readonly chargeAtX: number; readonly landingX: number }[];
}
export type HazardParameter = string | number | boolean;
export interface HazardDefinition extends VersionedContent {
  readonly kind: string; readonly parameters: Readonly<Record<string, HazardParameter>>;
}
export interface ContentPlacement {
  readonly instanceId: string; readonly definition: VersionReference;
  readonly x: number; readonly y: number;
}
export interface LevelDefinition extends VersionedContent {
  readonly name: string; readonly thumbnail?: string; readonly authorUserId: string;
  readonly modules: readonly ContentPlacement[]; readonly hazards: readonly ContentPlacement[];
  readonly turtleConfiguration: VersionReference;
  readonly leaderboard: { readonly physicsVersion: string; readonly maxEntries: typeof MAX_LEADERBOARD_ENTRIES };
}
/** Every listed level is published. Schema validity does not certify playability. */
export interface ContentCatalog {
  readonly schemaVersion: typeof CONTENT_SCHEMA_VERSION;
  readonly authors: readonly AuthorProfile[];
  readonly bodyArchetypes: readonly ArchetypeReference[];
  readonly cargoArchetypes: readonly ArchetypeReference[];
  readonly turtleConfigurations: readonly TurtleConfiguration[];
  readonly modules: readonly ModuleDefinition[]; readonly hazards: readonly HazardDefinition[];
  readonly levels: readonly LevelDefinition[];
}
export interface LevelCatalogService {
  listPublishedLevels(): Promise<readonly LevelDefinition[]>;
  getPublishedLevel(id: string, version: string): Promise<LevelDefinition | null>;
  getModule(reference: VersionReference): Promise<ModuleDefinition | null>;
  getHazard(reference: VersionReference): Promise<HazardDefinition | null>;
  getTurtleConfiguration(reference: VersionReference): Promise<TurtleConfiguration | null>;
  getAuthor(id: string): Promise<AuthorProfile | null>;
}

export interface LeaderboardQuery { levelId: string; levelVersion: string; physicsVersion: string }
export interface ScoreEntry extends LeaderboardQuery {
  id: string; playerName: string; playerUserId?: string | null;
  score: number; timeMs: number; timestamp: number;
}
export interface LeaderboardService {
  submitScore(entry: ScoreEntry): Promise<void>;
  getTopScores(query: LeaderboardQuery, limit?: number): Promise<ScoreEntry[]>;
}
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
