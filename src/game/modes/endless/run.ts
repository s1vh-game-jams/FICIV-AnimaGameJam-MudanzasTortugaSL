import { ENDLESS } from '../../config/endless';
import type { Difficulty } from '../../config/endless';
import type { Tuning } from '../../config/tuning';
import type { CargoKind } from '../../content/cargo';
import type { Scenario } from '../../content/scenarios';
import { NO_CONTROLS } from '../../core/input';
import type { Controls } from '../../core/input';
import { PhysicsSimulation } from '../../physics/simulation';
import type { LoadPreset, SimulationSnapshot } from '../../physics/simulation';
import type { HazardSnapshot, WorldChunk } from '../../physics/worldContent';
import { DEFAULT_HELP_DURATIONS } from '../../systems/contextualHelp';
import { EndlessGenerator } from './generator';
import type { RunDescriptor } from './generator';
import type { ModuleInstance } from './modules';
import { EndlessScore } from './score';
import type { Pennant } from './score';
import { EndlessStream, protectedOpeningStart } from './stream';

export interface EndlessResult {
  readonly score: number; readonly time: number; readonly pennantsCrossed: number;
  readonly difficulty: Difficulty; readonly lastLoss: readonly CargoKind[];
  readonly descriptor: RunDescriptor;
}
export interface EndlessSnapshot {
  readonly physics: SimulationSnapshot; readonly modules: readonly ModuleInstance[];
  readonly prologue: WorldChunk | null;
  readonly hazards: readonly HazardSnapshot[]; readonly pennants: readonly Pennant[];
  readonly score: number; readonly pennantsCrossed: number; readonly time: number;
  readonly ended: boolean; readonly result: EndlessResult | null;
  readonly logicalOffset: number; readonly heightOffset: number;
}

export function protectedOpeningLength(tuning: Tuning): number {
  const seconds = DEFAULT_HELP_DURATIONS.speed + DEFAULT_HELP_DURATIONS.balance + DEFAULT_HELP_DURATIONS.jump;
  return Math.max(ENDLESS.prologueMetres, tuning.maxSpeed * seconds + 4);
}

/** The caller schedules fixed ticks. After final loss every further call is inert. */
export class EndlessRun {
  readonly tuning: Tuning;
  readonly simulation: PhysicsSimulation;
  readonly descriptor: RunDescriptor;
  readonly stream: EndlessStream;
  private readonly scoring = new EndlessScore();
  private terminal: EndlessSnapshot | null = null;
  private offset = 0;
  private verticalOffset = 0;
  private disposed = false;

  constructor(tuning: Tuning, difficulty: Difficulty = 'normal', seed?: string, load: LoadPreset = 'full') {
    this.tuning = Object.freeze({ ...tuning });
    const generator = new EndlessGenerator(this.tuning, difficulty, seed);
    this.descriptor = generator.descriptor;
    const length = protectedOpeningLength(this.tuning);
    const scenario: Scenario = { id: 'endless', label: 'Carrera Infinita', description: 'Protected non-scoring opening',
      startX: 0, startY: 0, endX: Infinity,
      terrain: [{ biome: 'grass', bottom: -9, points: [{ x: protectedOpeningStart(this.tuning), y: 0 }, { x: length, y: 0 }] }],
    };
    this.simulation = new PhysicsSimulation(scenario, this.tuning, load);
    this.stream = new EndlessStream(this.simulation, generator, this.tuning, length);
    this.stream.ensureAhead(this.simulation.snapshot());
  }

  step(input: Controls = NO_CONTROLS): void {
    if (this.disposed) throw new Error('Endless run is disposed');
    if (this.terminal) return;
    this.stream.ensureAhead(this.simulation.snapshot());
    this.simulation.step(input);
    let physical = this.simulation.snapshot();
    this.scoring.advance(physical.turtle.x, physical.cargo, this.stream.pennants);
    if (this.scoring.ended) {
      const result: EndlessResult = Object.freeze({ score: this.scoring.score, time: physical.time,
        pennantsCrossed: this.scoring.pennantsCrossed, difficulty: this.descriptor.difficulty,
        lastLoss: [...this.scoring.lastLoss], descriptor: this.descriptor });
      this.terminal = { ...this.capture(physical), ended: true, result };
      return;
    }
    this.stream.retireBehind(physical);
    if (physical.turtle.x >= ENDLESS.rebaseThresholdMetres ||
        Math.abs(physical.cameraY) >= ENDLESS.rebaseVerticalThresholdMetres) {
      const dx = physical.turtle.x >= ENDLESS.rebaseThresholdMetres ? physical.cameraX : 0;
      const dy = Math.abs(physical.cameraY) >= ENDLESS.rebaseVerticalThresholdMetres ? physical.cameraY : 0;
      this.simulation.rebase(dx, dy);
      this.stream.rebase(dx, dy);
      this.offset += dx;
      this.verticalOffset += dy;
      physical = this.simulation.snapshot();
    }
    this.stream.ensureAhead(physical);
  }

  cancelJump(): void { this.simulation.cancelJump(); }
  snapshot(): EndlessSnapshot { return this.terminal ?? this.capture(this.simulation.snapshot()); }
  dispose(): void { if (!this.disposed) { this.simulation.dispose(); this.disposed = true; } }

  private capture(physics: SimulationSnapshot): EndlessSnapshot {
    return { physics, modules: this.stream.modules, prologue: this.stream.prologue, hazards: this.simulation.hazardSnapshots(),
      pennants: this.stream.pennants, score: this.scoring.score, pennantsCrossed: this.scoring.pennantsCrossed,
      time: physics.time, ended: this.scoring.ended, result: null,
      logicalOffset: this.offset, heightOffset: this.verticalOffset };
  }
}
