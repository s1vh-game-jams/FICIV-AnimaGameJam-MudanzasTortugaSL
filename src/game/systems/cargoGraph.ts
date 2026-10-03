export interface ContactEdge {
  readonly a: string;
  readonly b: string;
}

export type CargoState = 'active' | 'separated' | 'lost';

interface CargoStatus {
  state: CargoState;
  separatedSeconds: number;
  separationCompensation: number;
}

const SHELL_ID = 'shell';

function validateDuration(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be finite and nonnegative.`);
  }
}

/** Tracks cargo retention independently of Rapier bodies and rendering. */
export class CargoTracker {
  private readonly cargo = new Map<string, CargoStatus>();
  private connected = new Set<string>();

  constructor(
    ids: readonly string[],
    private readonly graceSeconds: number,
  ) {
    validateDuration(graceSeconds, 'graceSeconds');

    for (const id of ids) {
      if (id === SHELL_ID) {
        throw new Error(`Cargo ID '${SHELL_ID}' is reserved for the shell.`);
      }
      if (this.cargo.has(id)) {
        throw new Error(`Duplicate cargo ID: ${id}`);
      }

      this.cargo.set(id, {
        state: 'active',
        separatedSeconds: 0,
        separationCompensation: 0,
      });
    }
  }

  /** dtSeconds is elapsed simulation time, rather than render or wall time. */
  update(edges: readonly ContactEdge[], dtSeconds: number): void {
    validateDuration(dtSeconds, 'dtSeconds');
    this.connected = this.findConnectedCargo(edges);

    for (const [id, status] of this.cargo) {
      if (status.state === 'lost') {
        continue;
      }

      if (this.connected.has(id)) {
        status.state = 'active';
        status.separatedSeconds = 0;
        status.separationCompensation = 0;
        continue;
      }

      // Compensated summation prevents an exact fixed-tick grace boundary
      // from slipping to the next tick because of accumulated roundoff.
      const increment = dtSeconds - status.separationCompensation;
      const elapsed = status.separatedSeconds + increment;
      status.separationCompensation =
        elapsed - status.separatedSeconds - increment;
      status.separatedSeconds = Math.min(elapsed, this.graceSeconds);
      status.state = elapsed >= this.graceSeconds ? 'lost' : 'separated';

      if (status.state === 'lost') {
        status.separationCompensation = 0;
      }
    }
  }

  state(id: string): CargoState {
    return this.getStatus(id).state;
  }

  separatedSeconds(id: string): number {
    return this.getStatus(id).separatedSeconds;
  }

  /** Temporary separation still contributes to retained cargo and its mass. */
  retainedIds(): string[] {
    return [...this.cargo.keys()].filter(
      (id) => this.getStatus(id).state !== 'lost',
    );
  }

  lostIds(): string[] {
    return [...this.cargo.keys()].filter(
      (id) => this.getStatus(id).state === 'lost',
    );
  }

  /** Shell-connected cargo from the last update; excludes the shell itself. */
  connectedIds(): string[] {
    return [...this.cargo.keys()].filter((id) => this.connected.has(id));
  }

  reset(): void {
    this.connected.clear();
    for (const status of this.cargo.values()) {
      status.state = 'active';
      status.separatedSeconds = 0;
      status.separationCompensation = 0;
    }
  }

  private getStatus(id: string): CargoStatus {
    const status = this.cargo.get(id);
    if (status === undefined) {
      throw new RangeError(`Unknown cargo ID: ${id}`);
    }
    return status;
  }

  private findConnectedCargo(edges: readonly ContactEdge[]): Set<string> {
    const adjacency = new Map<string, Set<string>>();
    const isEligible = (id: string): boolean =>
      id === SHELL_ID ||
      (this.cargo.has(id) && this.getStatus(id).state !== 'lost');

    for (const { a, b } of edges) {
      // Unknown contacts and terminally lost bodies cannot bridge the load.
      if (!isEligible(a) || !isEligible(b)) {
        continue;
      }
      const aNeighbors = adjacency.get(a) ?? new Set<string>();
      const bNeighbors = adjacency.get(b) ?? new Set<string>();
      aNeighbors.add(b);
      bNeighbors.add(a);
      adjacency.set(a, aNeighbors);
      adjacency.set(b, bNeighbors);
    }

    const visited = new Set<string>([SHELL_ID]);
    const queue = [SHELL_ID];
    for (const current of queue) {
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    visited.delete(SHELL_ID);
    return visited;
  }
}
