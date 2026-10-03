import { describe, expect, it } from 'vitest';
import { createBrowserJamServices, createJamServices } from '../../src/services/jamServices';
import { AnonymousSessionService } from '../../src/services/session';
import type { KeyValueStorage, ScoreEntry } from '../../src/services/contracts';

const entry: ScoreEntry = {
  id: 'run-1', playerName: 'Cliente', playerUserId: null, score: 120, timeMs: 2000, timestamp: 1000,
  levelId: 'level-1', levelVersion: '1', physicsVersion: 'settings-1',
};

describe('jam service composition', () => {
  it('starts anonymously with an empty playable catalog and no storage', async () => {
    const services = createJamServices();
    expect(await services.session.getSession()).toEqual({ status: 'anonymous' });
    expect(await services.levels.listPublishedLevels()).toEqual([]);
    await services.leaderboard.submitScore(entry);
    expect(await services.leaderboard.getTopScores(entry)).toEqual([entry]);
  });

  it('starts and retains session records when the browser storage getter throws', async () => {
    const services = createBrowserJamServices(() => { throw new Error('Access denied'); });
    expect(await services.session.getSession()).toEqual({ status: 'anonymous' });
    await services.leaderboard.submitScore(entry);
    expect(await services.leaderboard.getTopScores(entry)).toEqual([entry]);
  });

  it('uses supplied storage across new service instances without a user account', async () => {
    const records = new Map<string, string>();
    const storage: KeyValueStorage = {
      getItem: key => records.get(key) ?? null,
      setItem: (key, value) => { records.set(key, value); },
    };
    const first = createBrowserJamServices(() => storage);
    await first.leaderboard.submitScore(entry);
    const reloaded = createBrowserJamServices(() => storage);
    expect(await reloaded.session.getSession()).toEqual({ status: 'anonymous' });
    expect(await reloaded.leaderboard.getTopScores(entry)).toEqual([entry]);
  });

  it('never fabricates an authenticated identity or persistent guest account', async () => {
    const session = new AnonymousSessionService();
    const current = await session.getSession();
    expect(current.status).toBe('anonymous');
    expect('userId' in current).toBe(false);
    expect(Object.isFrozen(current)).toBe(true);
  });
});
