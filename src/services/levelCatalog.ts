import { CARGO } from '../game/content/cargo';
import {
  CONTENT_SCHEMA_VERSION, MAX_LEADERBOARD_ENTRIES,
  type AuthorProfile, type ContentCatalog, type HazardDefinition, type LevelCatalogService,
  type LevelDefinition, type ModuleDefinition, type TurtleConfiguration, type VersionReference,
} from './contracts';

type RecordValue = Record<string, unknown>;
const fail = (path: string, message: string): never => { throw new Error(`Content catalog: ${path} ${message}`); };
function object(value: unknown, path: string, keys?: readonly string[]): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(path, 'must be a plain object');
  const record = value as RecordValue;
  if (keys) for (const key of Object.keys(record)) if (!keys.includes(key)) fail(path, 'has unknown field ' + key);
  return record;
}
function text(value: unknown, path: string, maximum = 128): asserts value is string {
  if (typeof value !== 'string' || !value || value.trim() !== value || value.length > maximum || /\p{Cc}/u.test(value)) {
    fail(path, `must be nonempty trimmed text of at most ${maximum} characters without controls`);
  }
}
function finite(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'must be a finite number');
}
function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'must be an array');
  return value as unknown[];
}
function reference(value: unknown, path: string): RecordValue {
  const record = object(value, path, ['id', 'version']);
  text(record.id, path + '.id'); text(record.version, path + '.version');
  return record;
}
function versioned(value: unknown, path: string, keys: readonly string[]): RecordValue {
  const record = object(value, path, ['schemaVersion', 'id', 'version', ...keys]);
  if (record.schemaVersion !== CONTENT_SCHEMA_VERSION) fail(path + '.schemaVersion', 'is unsupported');
  text(record.id, path + '.id'); text(record.version, path + '.version');
  return record;
}
const revisionKey = (id: unknown, version: unknown): string => JSON.stringify([id, version]);
function index(values: unknown[], path: string, validate: (value: unknown, path: string) => RecordValue, versioned = true): Map<string, RecordValue> {
  const result = new Map<string, RecordValue>();
  values.forEach((value, i) => {
    const record = validate(value, `${path}[${i}]`);
    text(record.id, path + '.id');
    if (versioned) text(record.version, path + '.version');
    const key = versioned ? revisionKey(record.id, record.version) : record.id;
    if (result.has(key)) fail(path, 'has a duplicate identity ' + key);
    result.set(key, record);
  });
  return result;
}
function resolves(value: unknown, path: string, records: Map<string, RecordValue>): void {
  const ref = reference(value, path), target = records.get(revisionKey(ref.id, ref.version));
  if (!target || target.version !== ref.version) fail(path, 'has an unresolved exact-version reference');
}
function author(value: unknown, path: string, authors: Map<string, RecordValue>): void {
  text(value, path); if (!authors.has(value)) fail(path, 'has an unresolved author reference');
}
function thumbnail(value: unknown, path: string): void {
  text(value, path, 1024);
  if (/[\\:%?#]/u.test(value) || value.split('/').some(part => !part || part === '.' || part === '..')) {
    fail(path, 'must be a safe relative public-asset path');
  }
}
function connector(value: unknown, path: string): RecordValue {
  const record = object(value, path, ['biome', 'height']);
  if (!['grass', 'rock', 'sand', 'water'].includes(record.biome as string)) fail(path + '.biome', 'is unknown');
  finite(record.height, path + '.height'); return record;
}
function moduleGeometry(value: unknown, path: string, hazards: Map<string, RecordValue>): RecordValue {
  const record = versioned(value, path, ['name', 'length', 'start', 'end', 'terrain', 'water', 'hazards']);
  text(record.name, path + '.name', 80); finite(record.length, path + '.length');
  if (record.length <= 0) fail(path + '.length', 'must be positive');
  const start = connector(record.start, path + '.start'), end = connector(record.end, path + '.end');
  const terrain = array(record.terrain, path + '.terrain');
  if (!terrain.length) fail(path + '.terrain', 'requires actual terrain geometry');
  let previous: RecordValue | undefined;
  terrain.forEach((value, i) => {
    const stripPath = `${path}.terrain[${i}]`, strip = object(value, stripPath, ['biome', 'points']);
    if (!['grass', 'rock', 'sand'].includes(strip.biome as string)) fail(stripPath + '.biome', 'is unknown');
    const points = array(strip.points, stripPath + '.points');
    if (points.length < 2) fail(stripPath + '.points', 'requires at least two points');
    let stripPrevious: RecordValue | undefined;
    points.forEach((value, j) => {
      const pointPath = `${stripPath}.points[${j}]`, point = object(value, pointPath, ['x', 'y']);
      finite(point.x, pointPath + '.x'); finite(point.y, pointPath + '.y');
      if (point.x < 0 || point.x > (record.length as number)) fail(pointPath + '.x', 'must lie within module length');
      if (stripPrevious && point.x <= (stripPrevious.x as number)) fail(pointPath + '.x', 'must increase strictly');
      if (j === 0) {
        if (previous && (point.x !== previous.x || point.y !== previous.y)) fail(stripPath, 'has a discontinuous terrain join');
        if (!previous && (point.x !== 0 || point.y !== start.height)) fail(stripPath, 'must meet the start connector');
      }
      stripPrevious = point;
    });
    previous = stripPrevious;
  });
  if (!previous || previous.x !== record.length || previous.y !== end.height) fail(path + '.terrain', 'must meet the end connector');
  if (record.water !== undefined) array(record.water, path + '.water').forEach((value, i) => {
    const waterPath = `${path}.water[${i}]`, region = object(value, waterPath, ['left', 'right', 'surface', 'bottom']);
    for (const key of ['left', 'right', 'surface', 'bottom']) finite(region[key], waterPath + '.' + key);
    if ((region.left as number) < 0 || (region.right as number) > (record.length as number) ||
        (region.left as number) >= (region.right as number) || (region.bottom as number) >= (region.surface as number)) {
      fail(waterPath, 'requires positive dimensions within module length');
    }
  });
  if (record.hazards !== undefined) placements(record.hazards, path + '.hazards', hazards, new Set<string>());
  return record;
}
function placements(value: unknown, path: string, definitions: Map<string, RecordValue>, instances: Set<string>): void {
  array(value, path).forEach((value, i) => {
    const placePath = `${path}[${i}]`, placement = object(value, placePath, ['instanceId', 'definition', 'x', 'y']);
    text(placement.instanceId, placePath + '.instanceId');
    if (instances.has(placement.instanceId)) fail(placePath, 'has a duplicate instanceId');
    instances.add(placement.instanceId);
    resolves(placement.definition, placePath + '.definition', definitions);
    finite(placement.x, placePath + '.x'); finite(placement.y, placePath + '.y');
  });
}

/** Structural/reference validation only; it does not certify jump traversal or gameplay. */
export function validateCatalog(value: unknown): asserts value is ContentCatalog {
  const catalog = object(value, 'root', ['schemaVersion', 'authors', 'bodyArchetypes', 'cargoArchetypes',
    'turtleConfigurations', 'modules', 'hazards', 'levels']);
  if (catalog.schemaVersion !== CONTENT_SCHEMA_VERSION) fail('schemaVersion', 'is unsupported');
  const authors = index(array(catalog.authors, 'authors'), 'authors', (value, path) => {
    const profile = object(value, path, ['id', 'displayName']);
    text(profile.id, path + '.id'); text(profile.displayName, path + '.displayName', 80); return profile;
  }, false);
  const bodies = index(array(catalog.bodyArchetypes, 'bodyArchetypes'), 'bodyArchetypes', (value, path) => {
    const body = reference(value, path);
    if (body.id !== 'don-tortuga') fail(path + '.id', 'has no existing runtime body archetype'); return body;
  });
  const cargoIds = new Set<string>(CARGO.map(item => item.id));
  const cargo = index(array(catalog.cargoArchetypes, 'cargoArchetypes'), 'cargoArchetypes', (value, path) => {
    const definition = reference(value, path);
    if (!cargoIds.has(definition.id as string)) fail(path + '.id', 'has no existing runtime cargo archetype'); return definition;
  });
  const turtles = index(array(catalog.turtleConfigurations, 'turtleConfigurations'), 'turtleConfigurations', (value, path) => {
    const turtle = versioned(value, path, ['name', 'authorUserId', 'bodyArchetype', 'cargo']);
    text(turtle.name, path + '.name', 80); author(turtle.authorUserId, path + '.authorUserId', authors);
    resolves(turtle.bodyArchetype, path + '.bodyArchetype', bodies);
    const instances = new Set<string>();
    array(turtle.cargo, path + '.cargo').forEach((value, i) => {
      const instancePath = `${path}.cargo[${i}]`, item = object(value, instancePath, ['instanceId', 'archetype', 'x', 'y', 'angle']);
      text(item.instanceId, instancePath + '.instanceId');
      if (instances.has(item.instanceId)) fail(instancePath, 'has a duplicate instanceId'); instances.add(item.instanceId);
      resolves(item.archetype, instancePath + '.archetype', cargo);
      for (const key of ['x', 'y', 'angle']) finite(item[key], instancePath + '.' + key);
    });
    return turtle;
  });
  const hazards = index(array(catalog.hazards, 'hazards'), 'hazards', (value, path) => {
    const hazard = versioned(value, path, ['kind', 'parameters']); text(hazard.kind, path + '.kind');
    const parameters = object(hazard.parameters, path + '.parameters');
    for (const [key, parameter] of Object.entries(parameters)) {
      text(key, path + '.parameters key');
      if (typeof parameter === 'number') finite(parameter, path + '.parameters.' + key);
      else if (typeof parameter !== 'string' && typeof parameter !== 'boolean') fail(path + '.parameters.' + key, 'must be a scalar');
    }
    return hazard;
  });
  const modules = index(array(catalog.modules, 'modules'), 'modules', (value, path) => moduleGeometry(value, path, hazards));
  index(array(catalog.levels, 'levels'), 'levels', (value, path) => {
    const level = versioned(value, path, ['name', 'thumbnail', 'authorUserId', 'modules', 'hazards', 'turtleConfiguration', 'leaderboard']);
    text(level.name, path + '.name', 80); author(level.authorUserId, path + '.authorUserId', authors);
    if (level.thumbnail !== undefined) thumbnail(level.thumbnail, path + '.thumbnail');
    if (!array(level.modules, path + '.modules').length) fail(path + '.modules', 'requires an authored module');
    const instances = new Set<string>(); placements(level.modules, path + '.modules', modules, instances);
    placements(level.hazards, path + '.hazards', hazards, instances);
    resolves(level.turtleConfiguration, path + '.turtleConfiguration', turtles);
    const leaderboard = object(level.leaderboard, path + '.leaderboard', ['physicsVersion', 'maxEntries']);
    text(leaderboard.physicsVersion, path + '.leaderboard.physicsVersion');
    if (leaderboard.maxEntries !== MAX_LEADERBOARD_ENTRIES) fail(path + '.leaderboard.maxEntries', 'must equal 100');
    return level;
  });
}

function immutable<T>(value: T): T {
  const snapshot = structuredClone(value);
  const freeze = (item: unknown): void => {
    if (!item || typeof item !== 'object') return;
    for (const child of Object.values(item)) freeze(child);
    Object.freeze(item);
  };
  freeze(snapshot); return snapshot;
}
/** Anonymous public reads. Definitions are selected by exact version, never version sorting. */
export class StaticLevelCatalog implements LevelCatalogService {
  private readonly catalog: ContentCatalog;
  constructor(value: unknown) { validateCatalog(value); this.catalog = immutable(value); }
  async listPublishedLevels(): Promise<readonly LevelDefinition[]> { return immutable(this.catalog.levels); }
  async getPublishedLevel(id: string, version: string): Promise<LevelDefinition | null> {
    text(id, 'levelId'); text(version, 'levelVersion');
    return this.get(this.catalog.levels, { id, version });
  }
  async getModule(ref: VersionReference): Promise<ModuleDefinition | null> { return this.get(this.catalog.modules, ref); }
  async getHazard(ref: VersionReference): Promise<HazardDefinition | null> { return this.get(this.catalog.hazards, ref); }
  async getTurtleConfiguration(ref: VersionReference): Promise<TurtleConfiguration | null> { return this.get(this.catalog.turtleConfigurations, ref); }
  async getAuthor(id: string): Promise<AuthorProfile | null> {
    text(id, 'authorId'); const author = this.catalog.authors.find(item => item.id === id); return author ? immutable(author) : null;
  }
  private get<T extends VersionReference>(values: readonly T[], ref: VersionReference): T | null {
    reference(ref, 'reference'); const item = values.find(value => value.id === ref.id && value.version === ref.version);
    return item ? immutable(item) : null;
  }
}
