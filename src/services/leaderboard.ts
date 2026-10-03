import {
  MAX_LEADERBOARD_ENTRIES,
  type KeyValueStorage,
  type LeaderboardQuery,
  type LeaderboardService,
  type ScoreEntry,
} from './contracts';

export type LeaderboardPersistenceStatus = 'local' | 'memory';
export type LeaderboardPersistenceReason =
  | 'unavailable'
  | 'read-denied'
  | 'write-denied'
  | 'invalid-data'
  | 'unsupported-version';

const STORAGE_PREFIX = 'mudanzas-tortuga.leaderboard:';
const STORAGE_SCHEMA_VERSION = 1;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, label: string, maxLength = 128): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength
    || value !== value.trim() || Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })) {
    throw new TypeError(`Invalid leaderboard ${label}`);
  }
  return value;
}

function nonnegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Invalid leaderboard ${label}`);
  }
  return value;
}

function querySnapshot(value: unknown): LeaderboardQuery {
  if (!record(value)) throw new TypeError('Invalid leaderboard query');
  return {
    levelId: text(value.levelId, 'levelId'),
    levelVersion: text(value.levelVersion, 'levelVersion'),
    physicsVersion: text(value.physicsVersion, 'physicsVersion'),
  };
}

function entrySnapshot(value: unknown): ScoreEntry {
  if (!record(value)) throw new TypeError('Invalid leaderboard entry');
  return {
    ...querySnapshot(value),
    id: text(value.id, 'id'),
    playerName: text(value.playerName, 'playerName', 80),
    // A provided identity is metadata, never evidence of authentication.
    playerUserId: value.playerUserId == null ? null : text(value.playerUserId, 'playerUserId'),
    score: nonnegativeInteger(value.score, 'score'),
    timeMs: nonnegativeInteger(value.timeMs, 'timeMs'),
    timestamp: nonnegativeInteger(value.timestamp, 'timestamp'),
  };
}

function partitionKey(query: LeaderboardQuery): string {
  // Tuple encoding keeps separators inside IDs/versions unambiguous.
  return STORAGE_PREFIX + JSON.stringify([query.levelId, query.levelVersion, query.physicsVersion]);
}

function samePartition(entry: ScoreEntry, query: LeaderboardQuery): boolean {
  return entry.levelId === query.levelId && entry.levelVersion === query.levelVersion
    && entry.physicsVersion === query.physicsVersion;
}

function compareEntries(first: ScoreEntry, second: ScoreEntry): number {
  return second.score - first.score || first.timeMs - second.timeMs
    || first.timestamp - second.timestamp || (first.id < second.id ? -1 : first.id > second.id ? 1 : 0);
}

function retainedEntries(values: unknown[], query: LeaderboardQuery): ScoreEntry[] {
  const entries = new Map<string, ScoreEntry>();
  for (const value of values) {
    let entry: ScoreEntry;
    try { entry = entrySnapshot(value); } catch { continue; }
    if (!samePartition(entry, query)) continue;
    const previous = entries.get(entry.id);
    if (!previous || compareEntries(entry, previous) < 0) entries.set(entry.id, entry);
  }
  return [...entries.values()].sort(compareEntries).slice(0, MAX_LEADERBOARD_ENTRIES);
}

/** Browser-local records only: no authentication, remote competition or score verification. */
export class LocalLeaderboardService implements LeaderboardService {
  private readonly cached = new Map<string, ScoreEntry[]>();
  private status: LeaderboardPersistenceStatus;
  private reason: LeaderboardPersistenceReason | null;

  constructor(private readonly storage: KeyValueStorage | null = null) {
    this.status = storage ? 'local' : 'memory';
    this.reason = storage ? null : 'unavailable';
  }

  get persistenceStatus(): LeaderboardPersistenceStatus { return this.status; }
  get persistenceReason(): LeaderboardPersistenceReason | null { return this.reason; }

  async submitScore(value: ScoreEntry): Promise<void> {
    const entry = entrySnapshot(value);
    const entries = this.load(entry);
    const previous = entries.find((candidate) => candidate.id === entry.id);
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(entry)) {
        throw new TypeError('Conflicting leaderboard entry id in the same partition');
      }
      return;
    }
    const retained = [...entries, entry].sort(compareEntries).slice(0, MAX_LEADERBOARD_ENTRIES);
    const key = partitionKey(entry);
    this.cached.set(key, retained);
    if (this.status === 'local' && this.storage) {
      try {
        this.storage.setItem(key, JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION, entries: retained }));
      } catch {
        this.useMemory('write-denied');
      }
    }
  }

  async getTopScores(value: LeaderboardQuery, limit = MAX_LEADERBOARD_ENTRIES): Promise<ScoreEntry[]> {
    const query = querySnapshot(value);
    const count = Math.min(nonnegativeInteger(limit, 'limit'), MAX_LEADERBOARD_ENTRIES);
    return this.load(query).slice(0, count).map((entry) => ({ ...entry }));
  }

  private useMemory(reason: LeaderboardPersistenceReason): void {
    this.status = 'memory';
    this.reason = reason;
  }

  private load(query: LeaderboardQuery): ScoreEntry[] {
    const key = partitionKey(query);
    const cached = this.cached.get(key) ?? [];
    if (this.status === 'memory' || !this.storage) return cached;

    // Re-read before each operation to incorporate additions from another service instance.
    let source: string | null;
    try { source = this.storage.getItem(key); } catch {
      this.useMemory('read-denied');
      return cached;
    }
    if (source === null) {
      this.cached.set(key, []);
      return [];
    }

    let envelope: unknown;
    try { envelope = JSON.parse(source); } catch {
      this.useMemory('invalid-data');
      return cached;
    }
    if (record(envelope) && typeof envelope.schemaVersion === 'number'
      && Number.isInteger(envelope.schemaVersion) && envelope.schemaVersion > STORAGE_SCHEMA_VERSION) {
      this.useMemory('unsupported-version');
      return cached;
    }
    if (!record(envelope) || envelope.schemaVersion !== STORAGE_SCHEMA_VERSION || !Array.isArray(envelope.entries)) {
      this.useMemory('invalid-data');
      return cached;
    }
    const entries = retainedEntries(envelope.entries, query);
    this.cached.set(key, entries);
    return entries;
  }
}
