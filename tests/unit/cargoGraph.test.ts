import { describe, expect, it } from 'vitest';
import {
  CargoTracker,
  type ContactEdge,
} from '../../src/game/systems/cargoGraph';

describe('CargoTracker', () => {
  it('retains the initial cargo until contacts are evaluated', () => {
    const tracker = new CargoTracker(['sofa', 'glass'], 0.5);

    expect(tracker.retainedIds()).toEqual(['sofa', 'glass']);
    expect(tracker.state('sofa')).toBe('active');
    expect(tracker.lostIds()).toEqual([]);
    expect(tracker.connectedIds()).toEqual([]);
  });

  it('finds direct and indirect shell connections regardless of edge order', () => {
    const tracker = new CargoTracker(['sofa', 'tv', 'glass', 'lamp'], 0.5);
    const edges: readonly ContactEdge[] = [
      { a: 'glass', b: 'tv' },
      { a: 'lamp', b: 'sofa' },
      { a: 'tv', b: 'sofa' },
      { a: 'sofa', b: 'shell' },
    ];

    tracker.update(edges, 1);

    expect(tracker.connectedIds()).toEqual(['sofa', 'tv', 'glass', 'lamp']);
    expect(tracker.retainedIds()).toEqual(['sofa', 'tv', 'glass', 'lamp']);
    expect(tracker.lostIds()).toEqual([]);
    expect(tracker.separatedSeconds('glass')).toBe(0);
  });

  it('does not treat a disconnected cargo cycle as connected to the shell', () => {
    const tracker = new CargoTracker(['a', 'b', 'c', 'supported'], 0.5);

    tracker.update(
      [
        { a: 'a', b: 'b' },
        { a: 'b', b: 'c' },
        { a: 'c', b: 'a' },
        { a: 'shell', b: 'supported' },
      ],
      0.5,
    );

    expect(tracker.connectedIds()).toEqual(['supported']);
    expect(tracker.retainedIds()).toEqual(['supported']);
    expect(tracker.lostIds()).toEqual(['a', 'b', 'c']);
  });

  it('ignores unknown bodies rather than allowing them to bridge cargo', () => {
    const tracker = new CargoTracker(['glass'], 0.5);

    tracker.update(
      [
        { a: 'shell', b: 'terrain' },
        { a: 'terrain', b: 'glass' },
        { a: 'unknown', b: 'another-unknown' },
      ],
      0.5,
    );

    expect(tracker.state('glass')).toBe('lost');
    expect(tracker.connectedIds()).toEqual([]);
  });

  it('retains temporarily separated cargo until the exact grace boundary', () => {
    const tracker = new CargoTracker(['sofa', 'glass'], 0.5);
    const contacts = [{ a: 'shell', b: 'sofa' }];

    tracker.update(contacts, 0.25);
    expect(tracker.state('glass')).toBe('separated');
    expect(tracker.retainedIds()).toEqual(['sofa', 'glass']);
    expect(tracker.separatedSeconds('glass')).toBe(0.25);

    tracker.update(contacts, 0.25);
    expect(tracker.state('glass')).toBe('lost');
    expect(tracker.retainedIds()).toEqual(['sofa']);
    expect(tracker.lostIds()).toEqual(['glass']);
    expect(tracker.separatedSeconds('glass')).toBe(0.5);
  });

  it('expires grace after thirty 60 Hz physics ticks without an extra tick', () => {
    const tracker = new CargoTracker(['glass'], 0.5);

    for (let tick = 0; tick < 29; tick += 1) {
      tracker.update([], 1 / 60);
    }
    expect(tracker.state('glass')).toBe('separated');

    tracker.update([], 1 / 60);
    expect(tracker.state('glass')).toBe('lost');
    expect(tracker.separatedSeconds('glass')).toBe(0.5);
  });

  it('reconnection clears separation time instead of accumulating across bounces', () => {
    const tracker = new CargoTracker(['glass'], 0.5);

    tracker.update([], 0.375);
    tracker.update([{ a: 'shell', b: 'glass' }], 0.25);
    expect(tracker.state('glass')).toBe('active');
    expect(tracker.separatedSeconds('glass')).toBe(0);

    tracker.update([], 0.375);
    expect(tracker.state('glass')).toBe('separated');
    tracker.update([], 0.125);
    expect(tracker.state('glass')).toBe('lost');
  });

  it('keeps loss terminal and prevents lost cargo from supporting other items', () => {
    const tracker = new CargoTracker(['sofa', 'glass'], 0.5);

    tracker.update([{ a: 'shell', b: 'glass' }], 0.5);
    expect(tracker.state('sofa')).toBe('lost');

    tracker.update(
      [
        { a: 'shell', b: 'sofa' },
        { a: 'sofa', b: 'glass' },
      ],
      0.25,
    );
    expect(tracker.state('sofa')).toBe('lost');
    expect(tracker.state('glass')).toBe('separated');
    expect(tracker.connectedIds()).toEqual([]);

    tracker.update([{ a: 'shell', b: 'glass' }], 0);
    expect(tracker.state('glass')).toBe('active');
    expect(tracker.retainedIds()).toEqual(['glass']);
  });

  it('tracks each item separation independently', () => {
    const tracker = new CargoTracker(['sofa', 'glass'], 0.5);

    tracker.update([{ a: 'shell', b: 'sofa' }], 0.25);
    tracker.update([], 0.25);

    expect(tracker.state('glass')).toBe('lost');
    expect(tracker.state('sofa')).toBe('separated');
    expect(tracker.separatedSeconds('sofa')).toBe(0.25);
  });

  it('handles duplicate, reversed and self contacts without duplicate cargo', () => {
    const tracker = new CargoTracker(['sofa'], 0);

    tracker.update(
      [
        { a: 'shell', b: 'sofa' },
        { a: 'sofa', b: 'shell' },
        { a: 'shell', b: 'sofa' },
        { a: 'sofa', b: 'sofa' },
      ],
      0,
    );

    expect(tracker.connectedIds()).toEqual(['sofa']);
    expect(tracker.state('sofa')).toBe('active');
  });

  it('supports zero grace and zero elapsed time', () => {
    const immediate = new CargoTracker(['glass'], 0);
    immediate.update([], 0);
    expect(immediate.state('glass')).toBe('lost');

    const tolerant = new CargoTracker(['glass'], 0.5);
    tolerant.update([], 0);
    expect(tolerant.state('glass')).toBe('separated');
    expect(tolerant.separatedSeconds('glass')).toBe(0);
    expect(tolerant.retainedIds()).toEqual(['glass']);
  });

  it('supports an empty cargo set', () => {
    const tracker = new CargoTracker([], 0.5);
    tracker.update([{ a: 'shell', b: 'unknown' }], 1);
    tracker.reset();

    expect(tracker.retainedIds()).toEqual([]);
    expect(tracker.lostIds()).toEqual([]);
    expect(tracker.connectedIds()).toEqual([]);
  });

  it('reset restores lost and separated cargo and clears contact diagnostics', () => {
    const tracker = new CargoTracker(['sofa', 'glass', 'lamp'], 0.5);
    tracker.update(
      [
        { a: 'shell', b: 'sofa' },
        { a: 'shell', b: 'lamp' },
      ],
      0.5,
    );
    tracker.update([{ a: 'shell', b: 'sofa' }], 0.25);

    tracker.reset();

    expect(tracker.retainedIds()).toEqual(['sofa', 'glass', 'lamp']);
    expect(tracker.lostIds()).toEqual([]);
    expect(tracker.connectedIds()).toEqual([]);
    for (const id of tracker.retainedIds()) {
      expect(tracker.state(id)).toBe('active');
      expect(tracker.separatedSeconds(id)).toBe(0);
    }

    tracker.update([], 0.25);
    expect(tracker.lostIds()).toEqual([]);
  });

  it('returns independent snapshots of retained, lost and connected IDs', () => {
    const tracker = new CargoTracker(['sofa', 'glass'], 0.5);
    tracker.update([{ a: 'shell', b: 'sofa' }], 0.5);

    tracker.retainedIds().push('intruder');
    tracker.lostIds().pop();
    tracker.connectedIds().pop();

    expect(tracker.retainedIds()).toEqual(['sofa']);
    expect(tracker.lostIds()).toEqual(['glass']);
    expect(tracker.connectedIds()).toEqual(['sofa']);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects invalid grace duration %s',
    (graceSeconds) => {
      expect(() => new CargoTracker(['glass'], graceSeconds)).toThrow(RangeError);
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects invalid dt %s without mutating state',
    (dtSeconds) => {
      const tracker = new CargoTracker(['glass'], 0.5);
      tracker.update([{ a: 'shell', b: 'glass' }], 0.25);

      expect(() => tracker.update([], dtSeconds)).toThrow(RangeError);
      expect(tracker.state('glass')).toBe('active');
      expect(tracker.connectedIds()).toEqual(['glass']);
      expect(tracker.separatedSeconds('glass')).toBe(0);
    },
  );

  it('rejects duplicate IDs and the reserved shell ID', () => {
    expect(() => new CargoTracker(['glass', 'glass'], 0.5)).toThrow(/Duplicate/);
    expect(() => new CargoTracker(['shell'], 0.5)).toThrow(/reserved/);
  });

  it('reports an unknown queried ID without creating cargo', () => {
    const tracker = new CargoTracker(['glass'], 0.5);

    expect(() => tracker.state('unknown')).toThrow(RangeError);
    expect(() => tracker.separatedSeconds('unknown')).toThrow(RangeError);
    expect(tracker.retainedIds()).toEqual(['glass']);
  });
});
