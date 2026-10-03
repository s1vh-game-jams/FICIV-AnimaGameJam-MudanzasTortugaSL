import { CARGO } from './cargo';
import { CONTENT_SCHEMA_VERSION, type ContentCatalog } from '../../services/contracts';

export const OFFICIAL_AUTHOR_ID = 'official-maintainer';
export const OFFICIAL_TURTLE_CONFIGURATION_ID = 'official-full-load';
export const INITIAL_CONTENT_VERSION = '1';

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
  modules: [], hazards: [], levels: [],
};
