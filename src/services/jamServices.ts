import { JAM_CATALOG } from '../game/content/jamCatalog';
import type { ContentCatalog, KeyValueStorage, LeaderboardService, LevelCatalogService } from './contracts';
import { StaticLevelCatalog } from './levelCatalog';
import { LocalLeaderboardService } from './leaderboard';
import { AnonymousSessionService, type SessionService } from './session';

export interface JamServices {
  readonly levels: LevelCatalogService;
  readonly leaderboard: LeaderboardService;
  readonly session: SessionService;
}

/** Composition boundary: gameplay depends on contracts, not storage or a provider. */
export function createJamServices(options: {
  catalog?: ContentCatalog;
  storage?: KeyValueStorage | null;
} = {}): JamServices {
  return Object.freeze({
    levels: new StaticLevelCatalog(options.catalog ?? JAM_CATALOG),
    leaderboard: new LocalLeaderboardService(options.storage ?? null),
    session: new AnonymousSessionService(),
  });
}

/** Even reading the browser storage getter can throw (privacy/sandbox policies). */
export function createBrowserJamServices(storageProvider: () => KeyValueStorage = () => window.localStorage): JamServices {
  let storage: KeyValueStorage | null;
  try { storage = storageProvider(); } catch { storage = null; }
  return createJamServices({ storage });
}
