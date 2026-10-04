import { CARGO } from '../../content/cargo';
import type { CargoKind } from '../../content/cargo';
import type { CargoState } from '../../systems/cargoGraph';

export interface Pennant { id: string; moduleIndex: number; x: number; y: number; crossed: boolean }
export interface ScoringCargo { id: CargoKind; state: CargoState }

/** Definitive cargo loss is processed before distance. A grace separation still scores. */
export class EndlessScore {
  score = 0;
  pennantsCrossed = 0;
  ended = false;
  lastLoss: readonly CargoKind[] = [];
  private lost = new Set<CargoKind>();
  private lastCrossedIndex = 0;

  advance(turtleX: number, cargo: readonly ScoringCargo[], pennants: readonly Pennant[]): void {
    if (this.ended) return;
    const newLoss = cargo.filter(item => item.state === 'lost' && !this.lost.has(item.id)).map(item => item.id);
    if (newLoss.length) this.lastLoss = newLoss;
    for (const id of newLoss) this.lost.add(id);
    const retained = cargo.filter(item => item.state !== 'lost');
    if (retained.length === 0) { this.ended = true; return; }
    const value = retained.reduce((sum, item) => sum + CARGO.find(definition => definition.id === item.id)!.scoreValue, 0);
    for (const pennant of [...pennants].sort((a, b) => a.moduleIndex - b.moduleIndex)) {
      if (!pennant.crossed && turtleX >= pennant.x) {
        pennant.crossed = true;
        // A retired/reconstructed visual cannot resubmit an old boundary.
        // Monotonic indices avoid an ever-growing set during long runs.
        if (pennant.moduleIndex <= this.lastCrossedIndex) continue;
        this.lastCrossedIndex = pennant.moduleIndex;
        this.pennantsCrossed++;
        this.score += pennant.moduleIndex * value;
      }
    }
  }
}
