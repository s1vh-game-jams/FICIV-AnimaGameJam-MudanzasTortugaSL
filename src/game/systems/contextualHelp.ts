export type HelpId = 'speed' | 'balance' | 'jump' | 'swim';
export type HelpDurations = Readonly<Record<HelpId, number>>;

export const DEFAULT_HELP_DURATIONS: HelpDurations = {
  speed: 3,
  balance: 4,
  jump: 4,
  swim: 3,
};

const INITIAL_HELP: readonly HelpId[] = ['speed', 'balance', 'jump'];
const HELP_COPY: Readonly<Record<HelpId, { keys: string; text: string }>> = {
  speed: { keys: '← / A   → / D', text: 'velocidad' },
  balance: { keys: '↑ / W   ↓ / S', text: 'equilibrar caparazón' },
  jump: { keys: 'Espacio', text: 'mantén y suelta para saltar' },
  swim: { keys: 'Espacio', text: 'mantén para subir; ↑/W ↓/S equilibran' },
};

export interface HelpMessage {
  readonly id: HelpId;
  readonly keys: string;
  readonly text: string;
  readonly durationSeconds: number;
  readonly elapsedSeconds: number;
}

export interface HelpContext {
  readonly inWater: boolean;
  readonly paused?: boolean;
}

/** Timed, per-run onboarding. It has no DOM, storage or level dependencies. */
export class ContextualHelp {
  private readonly durations: HelpDurations;
  private readonly seen = new Set<HelpId>();
  private readonly elapsed = new Map<HelpId, number>();
  private readonly compensation = new Map<HelpId, number>();
  private activeId: HelpId | undefined;
  private swimmingTriggered = false;

  constructor(durations: Partial<HelpDurations> = {}) {
    this.durations = { ...DEFAULT_HELP_DURATIONS, ...durations };
    for (const value of Object.values(this.durations)) {
      if (!Number.isFinite(value) || value < 3 || value > 5) {
        throw new RangeError('Help duration must be between 3 and 5 seconds.');
      }
    }
  }

  get active(): HelpMessage | undefined {
    const id = this.activeId;
    return id ? {
      id,
      ...HELP_COPY[id],
      durationSeconds: this.durations[id],
      elapsedSeconds: this.elapsed.get(id) ?? 0,
    } : undefined;
  }

  hasSeen(id: HelpId): boolean { return this.seen.has(id); }

  update(dtSeconds: number, context: HelpContext): HelpMessage | undefined {
    if (!Number.isFinite(dtSeconds) || dtSeconds < 0) {
      throw new RangeError('Help timestep must be finite and nonnegative.');
    }
    if (context.paused) return this.active;
    if (context.inWater) this.swimmingTriggered = true;
    this.activeId = this.choose(context.inWater);
    let remaining = dtSeconds;

    while (this.activeId && remaining > 0) {
      const id = this.activeId;
      const elapsed = this.elapsed.get(id) ?? 0;
      const step = Math.min(remaining, this.durations[id] - elapsed);
      const increment = step - (this.compensation.get(id) ?? 0);
      const total = elapsed + increment;
      this.compensation.set(id, total - elapsed - increment);
      this.elapsed.set(id, Math.min(total, this.durations[id]));
      remaining = Math.max(0, remaining - step);
      // Ignore sub-picosecond residue from an exact fixed-tick boundary.
      if (remaining < 1e-12) remaining = 0;

      if (total >= this.durations[id]) {
        this.seen.add(id);
        this.compensation.set(id, 0);
        this.activeId = this.choose(context.inWater);
      } else {
        break;
      }
    }
    return this.active;
  }

  reset(): void {
    this.seen.clear();
    this.elapsed.clear();
    this.compensation.clear();
    this.activeId = undefined;
    this.swimmingTriggered = false;
  }

  private choose(inWater: boolean): HelpId | undefined {
    // An activated swim message keeps its fixed duration, including a short exit.
    if (this.swimmingTriggered && !this.seen.has('swim')) return 'swim';
    if (inWater) return undefined;
    return INITIAL_HELP.find((id) => !this.seen.has(id));
  }
}
