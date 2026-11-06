import { CARGO } from './cargo';
import { CONTENT_SCHEMA_VERSION, type ContentCatalog, type ModuleDefinition } from '../../services/contracts';
import { ENDLESS_MODULES } from '../modes/endless/modules';

export const OFFICIAL_AUTHOR_ID = 'official-maintainer';
export const OFFICIAL_TURTLE_CONFIGURATION_ID = 'official-full-load';
export const INITIAL_CONTENT_VERSION = '1';

// Keep exact published revision-1 references valid; difficulty metadata is revision 2.
const originalModules: readonly ModuleDefinition[] = ENDLESS_MODULES.filter(module => module.version === '2').map(module => ({
  schemaVersion: 1, id: module.id, version: '1', name: module.name, length: module.length,
  start: module.start, end: module.end, terrain: module.terrain, water: module.water,
  sockets: module.sockets, jumps: module.jumps,
}));

/** Public maintainer metadata and the existing load; no diagnostic is a published level. */
export const JAM_CATALOG: ContentCatalog = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  authors: [{ id: OFFICIAL_AUTHOR_ID, displayName: 'Mudanzas Tortuga, S.L.' }],
  bodyArchetypes: [{ id: 'don-tortuga', version: INITIAL_CONTENT_VERSION }],
  cargoArchetypes: CARGO.map(item => ({ id: item.id, version: INITIAL_CONTENT_VERSION })),
  turtleConfigurations: [{
    schemaVersion: CONTENT_SCHEMA_VERSION, id: OFFICIAL_TURTLE_CONFIGURATION_ID,
    version: INITIAL_CONTENT_VERSION, name: 'Mudanza completa', authorUserId: OFFICIAL_AUTHOR_ID,
    bodyArchetype: { id: 'don-tortuga', version: INITIAL_CONTENT_VERSION },
    cargo: CARGO.map(item => ({
      instanceId: item.id + '-1', archetype: { id: item.id, version: INITIAL_CONTENT_VERSION },
      x: item.x, y: item.y, angle: 0,
    })),
  }],
  modules: [...originalModules, ...ENDLESS_MODULES],
  hazards: ['branch', 'stump', 'tree'].map(kind => ({ schemaVersion: CONTENT_SCHEMA_VERSION,
    id: kind, version: INITIAL_CONTENT_VERSION, kind, parameters: {} })),
  levels: [],
};
