import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStorage, LeaderboardQuery, ScoreEntry } from '../../src/services/contracts';
import { LocalLeaderboardService } from '../../src/services/leaderboard';

const QUERY: LeaderboardQuery = {
  levelId: 'jam-level', levelVersion: 'level-1', physicsVersion: 'physics-1',
};

function score(overrides: Partial<ScoreEntry> = {}): ScoreEntry {
  return {
    ...QUERY, id: 'run-1', playerName: 'Don Tortuga', score: 3900,
    timeMs: 100_000, timestamp: 1_000, ...overrides,
  };
}

function storageKey(query: LeaderboardQuery = QUERY): string {
  return 'mudanzas-tortuga.leaderboard:' + JSON.stringify([
    query.levelId, query.levelVersion, query.physicsVersion,
  ]);
}

class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();
  readonly getItem = vi.fn((key: string) => this.data.get(key) ?? null);
  readonly setItem = vi.fn((key: string, value: string): void => { this.data.set(key, value); });
}

describe('LocalLeaderboardService', () => {
  it('accepts anonymous scores and survives a service reload without an account', async () => {
    const storage = new MemoryStorage();
    const service = new LocalLeaderboardService(storage);
    await service.submitScore(score());
    const reloaded = new LocalLeaderboardService(storage);
    expect(await reloaded.getTopScores(QUERY)).toEqual([{ ...score(), playerUserId: null }]);
    expect(reloaded.persistenceStatus).toBe('local');
    expect(reloaded.persistenceReason).toBeNull();
  });

  it('retains optional user identity as metadata while allowing other anonymous entries', async () => {
    const service = new LocalLeaderboardService();
    await service.submitScore(score({ playerUserId: 'user-42' }));
    await service.submitScore(score({ id: 'run-2', playerName: 'María 🐢', playerUserId: null, score: 4000 }));
    expect((await service.getTopScores(QUERY)).map((entry) => entry.playerUserId)).toEqual([null, 'user-42']);
  });

  it('retains the best 100 scores, including in persisted data', async () => {
    const storage = new MemoryStorage();
    const service = new LocalLeaderboardService(storage);
    await Promise.all(Array.from({ length: 120 }, (_, index) => service.submitScore(score({
      id: `run-${index}`, score: index,
    }))));
    const entries = await service.getTopScores(QUERY, 1000);
    expect(entries).toHaveLength(100);
    expect(entries[0].score).toBe(119);
    expect(entries.at(-1)?.score).toBe(20);
    expect(JSON.parse(storage.data.get(storageKey())!).entries).toHaveLength(100);
    expect(await new LocalLeaderboardService(storage).getTopScores(QUERY)).toEqual(entries);
    expect(await service.getTopScores(QUERY, 3)).toEqual(entries.slice(0, 3));
    expect(await service.getTopScores(QUERY, 0)).toEqual([]);
  });

  it('isolates level, geometry version and physics version independently', async () => {
    const service = new LocalLeaderboardService(new MemoryStorage());
    const queries = [QUERY, { ...QUERY, levelId: 'other-level' },
      { ...QUERY, levelVersion: 'level-2' }, { ...QUERY, physicsVersion: 'physics-2' }];
    for (let index = 0; index < queries.length; index++) {
      await service.submitScore(score({ ...queries[index], id: `run-${index}`, score: index }));
    }
    for (let index = 0; index < queries.length; index++) {
      expect((await service.getTopScores(queries[index])).map((entry) => entry.id)).toEqual([`run-${index}`]);
    }
    expect(await service.getTopScores({ ...QUERY, physicsVersion: 'unknown-version' })).toEqual([]);
  });

  it('keeps identifier separators from aliasing another partition', async () => {
    const service = new LocalLeaderboardService(new MemoryStorage());
    const first = { ...QUERY, levelId: 'level:version', levelVersion: '1' };
    const second = { ...QUERY, levelId: 'level', levelVersion: 'version:1' };
    await service.submitScore(score({ ...first, id: 'first' }));
    await service.submitScore(score({ ...second, id: 'second' }));
    expect((await service.getTopScores(first))[0].id).toBe('first');
    expect((await service.getTopScores(second))[0].id).toBe('second');
  });

  it('uses score, shorter time, earlier timestamp and stable codepoint id ordering', async () => {
    const service = new LocalLeaderboardService();
    const entries = [
      score({ id: 'lower-score', score: 1, timeMs: 1 }),
      score({ id: 'slow', score: 4000, timeMs: 5 }),
      score({ id: 'later', score: 4000, timeMs: 4, timestamp: 2 }),
      score({ id: 'z', score: 4000, timeMs: 4, timestamp: 1 }),
      score({ id: 'A', score: 4000, timeMs: 4, timestamp: 1 }),
      score({ id: 'highest', score: 4001, timeMs: 999 }),
    ];
    for (const entry of entries) await service.submitScore(entry);
    expect((await service.getTopScores(QUERY)).map((entry) => entry.id)).toEqual([
      'highest', 'A', 'z', 'later', 'slow', 'lower-score',
    ]);
  });

  it('merges submissions across instances that share current persisted data', async () => {
    const storage = new MemoryStorage();
    const first = new LocalLeaderboardService(storage);
    const second = new LocalLeaderboardService(storage);
    await first.getTopScores(QUERY);
    await second.getTopScores(QUERY);
    await Promise.all([
      first.submitScore(score({ id: 'first' })), second.submitScore(score({ id: 'second' })),
    ]);
    expect((await first.getTopScores(QUERY)).map((entry) => entry.id)).toEqual(['first', 'second']);
    expect((await second.getTopScores(QUERY)).map((entry) => entry.id)).toEqual(['first', 'second']);
  });

  it('makes identical submission retries idempotent and rejects a conflicting id', async () => {
    const storage = new MemoryStorage();
    const service = new LocalLeaderboardService(storage);
    await service.submitScore(score());
    await service.submitScore(score({ playerUserId: null }));
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    await expect(service.submitScore(score({ score: 4000 }))).rejects.toThrow(/Conflicting/);
    expect((await service.getTopScores(QUERY))[0].score).toBe(3900);
  });

  it('copies input and returned records so callers cannot mutate retained scores', async () => {
    const service = new LocalLeaderboardService();
    const original = score();
    await service.submitScore(original);
    original.score = 0;
    original.playerName = 'Changed';
    const result = await service.getTopScores(QUERY);
    result[0].score = 5;
    result.splice(0, 1);
    expect(await service.getTopScores(QUERY)).toEqual([{ ...score(), playerUserId: null }]);
  });

  it('keeps the game usable with explicit memory-only status when no storage exists', async () => {
    const service = new LocalLeaderboardService(null);
    expect(service.persistenceStatus).toBe('memory');
    expect(service.persistenceReason).toBe('unavailable');
    await service.submitScore(score());
    expect(await service.getTopScores(QUERY)).toHaveLength(1);
    expect(await new LocalLeaderboardService(null).getTopScores(QUERY)).toEqual([]);
  });

  it('continues in memory after read access is denied without attempting writes', async () => {
    const storage = new MemoryStorage();
    storage.getItem.mockImplementation(() => { throw new Error('Storage blocked'); });
    const service = new LocalLeaderboardService(storage);
    await service.submitScore(score());
    expect(service.persistenceStatus).toBe('memory');
    expect(service.persistenceReason).toBe('read-denied');
    expect(await service.getTopScores(QUERY)).toHaveLength(1);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('keeps known records and the new score in memory after write denial', async () => {
    const storage = new MemoryStorage();
    const service = new LocalLeaderboardService(storage);
    await service.submitScore(score());
    storage.setItem.mockImplementation(() => { throw new Error('Quota exceeded'); });
    await service.submitScore(score({ id: 'run-2', score: 4000 }));
    expect(service.persistenceStatus).toBe('memory');
    expect(service.persistenceReason).toBe('write-denied');
    expect((await service.getTopScores(QUERY)).map((entry) => entry.id)).toEqual(['run-2', 'run-1']);
    expect(await new LocalLeaderboardService(storage).getTopScores(QUERY)).toHaveLength(1);
  });

  it.each([
    'not-json', 'null', '[]', '{"schemaVersion":1}', '{"schemaVersion":1,"entries":{}}',
    '{"schemaVersion":0,"entries":[]}', '{"schemaVersion":"1","entries":[]}',
  ])('does not overwrite a corrupt stored envelope: %s', async (source) => {
    const storage = new MemoryStorage();
    storage.data.set(storageKey(), source);
    const service = new LocalLeaderboardService(storage);
    await service.submitScore(score());
    expect(service.persistenceReason).toBe('invalid-data');
    expect(service.persistenceStatus).toBe('memory');
    expect(storage.data.get(storageKey())).toBe(source);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(await service.getTopScores(QUERY)).toHaveLength(1);
  });

  it('preserves future storage versions and accepts new records only in memory', async () => {
    const storage = new MemoryStorage();
    const future = JSON.stringify({ schemaVersion: 2, entries: [score()], futureField: 'preserve' });
    storage.data.set(storageKey(), future);
    const service = new LocalLeaderboardService(storage);
    await service.submitScore(score({ id: 'new-run' }));
    expect(service.persistenceReason).toBe('unsupported-version');
    expect(service.persistenceStatus).toBe('memory');
    expect(storage.data.get(storageKey())).toBe(future);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect((await service.getTopScores(QUERY)).map((entry) => entry.id)).toEqual(['new-run']);
  });

  it('notices a future version even after that partition was previously cached', async () => {
    const storage = new MemoryStorage();
    const service = new LocalLeaderboardService(storage);
    await service.submitScore(score());
    const future = JSON.stringify({ schemaVersion: 5, entries: [] });
    storage.data.set(storageKey(), future);
    await service.submitScore(score({ id: 'new-run' }));
    expect(service.persistenceReason).toBe('unsupported-version');
    expect(storage.data.get(storageKey())).toBe(future);
    expect((await service.getTopScores(QUERY)).map((entry) => entry.id)).toEqual(['new-run', 'run-1']);
  });

  it('filters malformed, duplicate and foreign-version stored entries and strips unknown fields', async () => {
    const storage = new MemoryStorage();
    storage.data.set(storageKey(), JSON.stringify({ schemaVersion: 1, entries: [
      score({ id: 'valid' }), score({ id: 'valid', score: 4000 }), null,
      score({ id: 'wrong-physics', physicsVersion: 'other' }), score({ id: 'bad-score', score: -1 }),
      { ...score({ id: 'extra' }), privateData: 'not part of this contract' },
    ] }));
    const service = new LocalLeaderboardService(storage);
    const entries = await service.getTopScores(QUERY);
    expect(entries.map((entry) => entry.id)).toEqual(['valid', 'extra']);
    expect(entries[0].score).toBe(4000);
    expect(entries[1]).not.toHaveProperty('privateData');
    expect(service.persistenceStatus).toBe('local');
  });

  it.each<[string, unknown]>([
    ['id', ''], ['id', ' leading'], ['id', 'x'.repeat(129)], ['id', 'bad\nline'],
    ['playerName', ''], ['playerName', 'x'.repeat(81)], ['playerName', 'trailing '],
    ['levelId', ''], ['levelVersion', ''], ['physicsVersion', undefined],
    ['playerUserId', false], ['playerUserId', ''],
    ['score', -1], ['score', 1.5], ['score', Number.NaN], ['score', Number.POSITIVE_INFINITY],
    ['score', Number.MAX_SAFE_INTEGER + 1], ['score', '4000'],
    ['timeMs', -1], ['timeMs', 0.5], ['timeMs', Number.NaN],
    ['timestamp', -1], ['timestamp', Number.POSITIVE_INFINITY],
  ])('rejects invalid submitted %s = %s without changing storage', async (field, value) => {
    const storage = new MemoryStorage();
    const service = new LocalLeaderboardService(storage);
    await expect(service.submitScore({ ...score(), [field]: value } as ScoreEntry)).rejects.toThrow(/Invalid leaderboard/);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([null, [], {}, { levelId: 'jam-level' }, { ...QUERY, physicsVersion: '' }])(
    'rejects incomplete or invalid queries instead of mixing versions: %j', async (query) => {
      await expect(new LocalLeaderboardService().getTopScores(query as LeaderboardQuery)).rejects.toThrow(/Invalid leaderboard/);
    },
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid result limit %s', async (limit) => {
      await expect(new LocalLeaderboardService().getTopScores(QUERY, limit)).rejects.toThrow(/Invalid leaderboard limit/);
    },
  );
});
