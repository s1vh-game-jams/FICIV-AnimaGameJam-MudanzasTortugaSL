import { describe, expect, it } from 'vitest';
import { CARGO } from '../../src/game/content/cargo';
import {
  INITIAL_CONTENT_VERSION, JAM_CATALOG, OFFICIAL_AUTHOR_ID, OFFICIAL_TURTLE_CONFIGURATION_ID,
} from '../../src/game/content/jamCatalog';
import { CONTENT_SCHEMA_VERSION, type ContentCatalog } from '../../src/services/contracts';
import { StaticLevelCatalog, validateCatalog } from '../../src/services/levelCatalog';
import { publicAsset } from '../../src/utils/publicAsset';

type Mutable<T> = T extends readonly (infer Item)[] ? Mutable<Item>[] :
  T extends object ? { -readonly [Key in keyof T]: Mutable<T[Key]> } : T;

/** Schema fixtures only: these definitions are not published game content or certified routes. */
function fixture(): Mutable<ContentCatalog> {
  const catalog = structuredClone(JAM_CATALOG) as Mutable<ContentCatalog>;
  // Isolate schema fixtures from the runtime pool so negative edits target
  // their own authored fields regardless of future published catalog growth.
  catalog.modules = [];
  catalog.hazards = [];
  catalog.hazards.push({ schemaVersion: CONTENT_SCHEMA_VERSION, id: 'fixture-hazard', version: '1',
    kind: 'fixture-only', parameters: { strength: 1, enabled: true, label: 'Fixture' } });
  catalog.modules.push({ schemaVersion: CONTENT_SCHEMA_VERSION, id: 'fixture-module', version: '1',
    name: 'Schema fixture', length: 10,
    start: { biome: 'grass', height: 0 }, end: { biome: 'rock', height: 1 },
    terrain: [
      { biome: 'grass', points: [{ x: 0, y: 0 }, { x: 5, y: 0 }] },
      { biome: 'rock', points: [{ x: 5, y: 0 }, { x: 10, y: 1 }] },
    ],
    water: [{ left: 2, right: 4, surface: 0, bottom: -2 }],
    hazards: [{ instanceId: 'local-fixture-hazard', definition: { id: 'fixture-hazard', version: '1' }, x: 7, y: 0 }],
  });
  catalog.levels.push({ schemaVersion: CONTENT_SCHEMA_VERSION, id: 'fixture-level', version: '1',
    name: 'Catalog test fixture', thumbnail: 'sprites/turtle/walk-01.svg', authorUserId: OFFICIAL_AUTHOR_ID,
    modules: [{ instanceId: 'module-1', definition: { id: 'fixture-module', version: '1' }, x: 0, y: 0 }],
    hazards: [{ instanceId: 'hazard-1', definition: { id: 'fixture-hazard', version: '1' }, x: 5, y: 1 }],
    turtleConfiguration: { id: OFFICIAL_TURTLE_CONFIGURATION_ID, version: INITIAL_CONTENT_VERSION },
    leaderboard: { physicsVersion: 'fixture-physics-1', maxEntries: 100 },
  });
  return catalog;
}

describe('StaticLevelCatalog', () => {
  it('publishes the shared six-module pool and three hazards without inventing designed levels', async () => {
    const service = new StaticLevelCatalog(JAM_CATALOG);
    expect(await service.listPublishedLevels()).toEqual([]);
    expect(JAM_CATALOG.modules.map(module => module.id).sort()).toEqual(['AB', 'AD', 'BA', 'BD', 'DA', 'DB']);
    expect(JAM_CATALOG.hazards.map(hazard => hazard.id).sort()).toEqual(['branch', 'stump', 'tree']);
    expect((await service.getModule({ id: 'AD', version: '1' }))?.sockets).toHaveLength(3);
    const turtle = await service.getTurtleConfiguration({ id: OFFICIAL_TURTLE_CONFIGURATION_ID, version: '1' });
    expect(turtle?.cargo).toEqual(CARGO.map(item => ({
      instanceId: item.id + '-1', archetype: { id: item.id, version: '1' }, x: item.x, y: item.y, angle: 0,
    })));
    expect(await service.getAuthor(OFFICIAL_AUTHOR_ID)).toEqual({ id: OFFICIAL_AUTHOR_ID, displayName: 'Mudanzas Tortuga, S.L.' });
  });

  it('reads published content anonymously and resolves every exact-version definition', async () => {
    const source = fixture(), service = new StaticLevelCatalog(source);
    const levels = await service.listPublishedLevels();
    expect(levels).toEqual(source.levels);
    expect(await service.getPublishedLevel('fixture-level', '1')).toEqual(levels[0]);
    expect(await service.getModule(levels[0].modules[0].definition)).toEqual(source.modules[0]);
    expect(await service.getHazard(levels[0].hazards[0].definition)).toEqual(source.hazards[0]);
    expect(await service.getTurtleConfiguration(levels[0].turtleConfiguration)).toEqual(source.turtleConfigurations[0]);
    expect(await service.getPublishedLevel('fixture-level', 'missing-version')).toBeNull();
    expect(await service.getPublishedLevel('missing-level', '1')).toBeNull();
    expect(await service.getModule({ id: 'fixture-module', version: '2' })).toBeNull();
    expect(await service.getHazard({ id: 'missing-hazard', version: '1' })).toBeNull();
    expect(await service.getAuthor('missing-author')).toBeNull();
  });

  it('preserves historical level, module, hazard and turtle revisions without choosing latest', async () => {
    const source = fixture();
    source.modules.push({ ...structuredClone(source.modules[0]), version: '2', name: 'Revised schema fixture' });
    source.hazards.push({ ...structuredClone(source.hazards[0]), version: '2' });
    source.turtleConfigurations.push({ ...structuredClone(source.turtleConfigurations[0]), version: '2', cargo: [] });
    const next = structuredClone(source.levels[0]);
    next.version = '2'; next.modules[0].definition.version = '2';
    next.hazards[0].definition.version = '2'; next.turtleConfiguration.version = '2';
    source.levels.push(next);
    const service = new StaticLevelCatalog(source);
    expect((await service.listPublishedLevels()).map(level => level.version)).toEqual(['1', '2']);
    expect((await service.getPublishedLevel('fixture-level', '1'))?.turtleConfiguration.version).toBe('1');
    expect((await service.getPublishedLevel('fixture-level', '2'))?.turtleConfiguration.version).toBe('2');
    expect((await service.getModule({ id: 'fixture-module', version: '1' }))?.name).toBe('Schema fixture');
    expect((await service.getModule({ id: 'fixture-module', version: '2' }))?.name).toBe('Revised schema fixture');
    expect((await service.getTurtleConfiguration({ id: OFFICIAL_TURTLE_CONFIGURATION_ID, version: '2' }))?.cargo).toEqual([]);
  });

  it('accepts repeated cargo archetypes only when each instance has its own identity and pose', async () => {
    const source = fixture(), cargo = source.turtleConfigurations[0].cargo;
    cargo.push({ ...structuredClone(cargo[0]), instanceId: 'second-sofa', x: 2, y: 3, angle: 0.25 });
    const service = new StaticLevelCatalog(source);
    expect((await service.getTurtleConfiguration(source.levels[0].turtleConfiguration))?.cargo).toHaveLength(CARGO.length + 1);
    cargo[cargo.length - 1].instanceId = cargo[0].instanceId;
    expect(() => new StaticLevelCatalog(source)).toThrow(/duplicate instanceId/);
  });

  it('returns frozen defensive snapshots and isolates future reads from caller mutations', async () => {
    const source = fixture(), service = new StaticLevelCatalog(source);
    source.levels[0].name = 'Changed input'; source.modules[0].terrain[0].points[0].y = 999;
    const first = await service.listPublishedLevels(), second = await service.listPublishedLevels();
    expect(first[0].name).toBe('Catalog test fixture');
    expect(first).not.toBe(second); expect(first[0]).not.toBe(second[0]);
    expect(Object.isFrozen(first)).toBe(true); expect(Object.isFrozen(first[0].modules[0].definition)).toBe(true);
    expect(() => { (first as Mutable<typeof first>)[0].name = 'Changed output'; }).toThrow(TypeError);
    const module = await service.getModule(first[0].modules[0].definition);
    expect(module?.terrain[0].points[0].y).toBe(0);
    expect(Object.isFrozen(module?.terrain[0].points[0])).toBe(true);
    expect((await service.getPublishedLevel('fixture-level', '1'))?.name).toBe('Catalog test fixture');
  });

  it('accepts serializable JSON snapshots and keeps relative asset paths unresolved', async () => {
    const source: unknown = JSON.parse(JSON.stringify(fixture()));
    const service = new StaticLevelCatalog(source);
    const thumbnail = (await service.getPublishedLevel('fixture-level', '1'))?.thumbnail;
    expect(thumbnail).toBe('sprites/turtle/walk-01.svg');
    expect(publicAsset(thumbnail!, '/')).toBe('/sprites/turtle/walk-01.svg');
    expect(publicAsset(thumbnail!, '/repo/')).toBe('/repo/sprites/turtle/walk-01.svg');
  });

  it('rejects malformed read identifiers rather than guessing a content revision', async () => {
    const service = new StaticLevelCatalog(JAM_CATALOG);
    await expect(service.getPublishedLevel('', '1')).rejects.toThrow(/levelId/);
    await expect(service.getPublishedLevel('fixture-level', ' 1')).rejects.toThrow(/levelVersion/);
    await expect(service.getModule({ id: 'module', version: '' })).rejects.toThrow(/reference.version/);
    await expect(service.getAuthor('author\n')).rejects.toThrow(/authorId/);
  });
});

describe('catalog validation', () => {
  it.each([null, [], 1, { schemaVersion: 1 }, { ...JAM_CATALOG, schemaVersion: 2 },
    { ...JAM_CATALOG, authors: null }, { ...JAM_CATALOG, authors: [{ id: 'only-id' }] }])(
    'rejects malformed unknown catalog input %#', value => {
      expect(() => validateCatalog(value)).toThrow(/Content catalog:/);
    },
  );

  it.each(['authors', 'bodyArchetypes', 'cargoArchetypes', 'turtleConfigurations', 'modules', 'hazards', 'levels'] as const)(
    'rejects duplicate identities in %s', collection => {
      const source = fixture(); source[collection].push(structuredClone(source[collection][0]) as never);
      expect(() => validateCatalog(source)).toThrow(/duplicate identity/);
    },
  );

  it('rejects unsupported record schemas and runtime archetype IDs', () => {
    const schema = fixture(); Object.assign(schema.modules[0], { schemaVersion: 2 });
    expect(() => validateCatalog(schema)).toThrow(/schemaVersion/);
    const body = fixture(); body.bodyArchetypes[0].id = 'invented-turtle';
    expect(() => validateCatalog(body)).toThrow(/runtime body archetype/);
    const cargo = fixture(); cargo.cargoArchetypes[0].id = 'invented-cargo';
    expect(() => validateCatalog(cargo)).toThrow(/runtime cargo archetype/);
  });

  const referenceFaults: [string, (source: Mutable<ContentCatalog>) => void][] = [
    ['author', source => { source.levels[0].authorUserId = 'unknown-author'; }],
    ['turtle author', source => { source.turtleConfigurations[0].authorUserId = 'unknown-author'; }],
    ['body version', source => { source.turtleConfigurations[0].bodyArchetype.version = 'missing'; }],
    ['cargo version', source => { source.turtleConfigurations[0].cargo[0].archetype.version = 'missing'; }],
    ['module version', source => { source.levels[0].modules[0].definition.version = 'missing'; }],
    ['hazard version', source => { source.levels[0].hazards[0].definition.version = 'missing'; }],
    ['turtle version', source => { source.levels[0].turtleConfiguration.version = 'missing'; }],
    ['module hazard version', source => { source.modules[0].hazards![0].definition.version = 'missing'; }],
  ];
  it.each(referenceFaults)('rejects unresolved %s references', (_label, edit) => {
    const source = fixture(); edit(source); expect(() => validateCatalog(source)).toThrow(/unresolved/);
  });

  it('rejects duplicate placement identities, including module-local hazards', () => {
    const source = fixture(); source.levels[0].hazards[0].instanceId = source.levels[0].modules[0].instanceId;
    expect(() => validateCatalog(source)).toThrow(/duplicate instanceId/);
    const local = fixture(); local.modules[0].hazards!.push(structuredClone(local.modules[0].hazards![0]));
    expect(() => validateCatalog(local)).toThrow(/duplicate instanceId/);
  });

  const geometryFaults: [string, (source: Mutable<ContentCatalog>) => void][] = [
    ['cargo pose', source => { source.turtleConfigurations[0].cargo[0].angle = NaN; }],
    ['level placement', source => { source.levels[0].modules[0].x = Infinity; }],
    ['local hazard placement', source => { source.modules[0].hazards![0].y = -Infinity; }],
    ['terrain point', source => { source.modules[0].terrain[0].points[0].y = NaN; }],
    ['connector', source => { source.modules[0].start.height = Infinity; }],
    ['length', source => { source.modules[0].length = 0; }],
    ['terrain ordering', source => { source.modules[0].terrain[0].points[1].x = 0; }],
    ['terrain join', source => { source.modules[0].terrain[1].points[0].y = 2; }],
    ['start connector join', source => { source.modules[0].start.height = 2; }],
    ['end connector join', source => { source.modules[0].end.height = 2; }],
    ['water width', source => { source.modules[0].water![0].right = 11; }],
    ['water depth', source => { source.modules[0].water![0].bottom = 1; }],
    ['hazard scalar', source => { source.hazards[0].parameters.strength = NaN; }],
  ];
  it.each(geometryFaults)('rejects invalid %s geometry', (_label, edit) => {
    const source = fixture(); edit(source); expect(() => validateCatalog(source)).toThrow(/Content catalog:/);
  });

  it.each(['/sprites/image.svg', '../image.svg', 'sprites/../image.svg', './image.svg',
    'https://example.test/image.svg', '//example.test/image.svg', 'C:\\image.svg',
    'sprites\\image.svg', 'sprites/%2e%2e/image.svg', 'sprites/image.svg?x=1', 'sprites/image.svg#hash'])(
    'rejects unsafe thumbnail path %s', path => {
      const source = fixture(); source.levels[0].thumbnail = path;
      expect(() => validateCatalog(source)).toThrow(/public-asset path/);
    },
  );

  it('reserves public profile IDs without accepting email or credentials', () => {
    const source = fixture(); Object.assign(source.authors[0], { email: 'fixture@example.test' });
    expect(() => validateCatalog(source)).toThrow(/unknown field email/);
    const credential = fixture(); Object.assign(credential.authors[0], { credentials: 'not-allowed' });
    expect(() => validateCatalog(credential)).toThrow(/unknown field credentials/);
  });

  it.each([0, 50, 101])('requires a Top100 cap, rejecting %i', cap => {
    const source = fixture(); Object.assign(source.levels[0].leaderboard, { maxEntries: cap });
    expect(() => validateCatalog(source)).toThrow(/must equal 100/);
  });

  it('requires a physics ranking version and an authored module for every listed level', () => {
    const source = fixture(); source.levels[0].leaderboard.physicsVersion = '';
    expect(() => validateCatalog(source)).toThrow(/physicsVersion/);
    const empty = fixture(); empty.levels[0].modules = [];
    expect(() => validateCatalog(empty)).toThrow(/authored module/);
  });
});
