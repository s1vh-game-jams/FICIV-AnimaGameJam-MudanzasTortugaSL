/** Wall time never becomes a variable simulation timestep. */
export class FixedLoop {
  private accumulator = 0;
  paused = false;
  constructor(readonly stepSeconds: number, private maxFrameSeconds = 0.1, private maxSteps = 6) {
    if (!(stepSeconds > 0) || !Number.isFinite(stepSeconds) || !Number.isFinite(maxFrameSeconds) || maxFrameSeconds <= 0 || !Number.isInteger(maxSteps) || maxSteps < 1) throw new Error('Invalid timestep');
  }
  advance(elapsed: number, step: () => void): number {
    if (this.paused) { this.accumulator = 0; return 0; }
    this.accumulator += Math.min(Math.max(Number.isFinite(elapsed) ? elapsed : 0, 0), this.maxFrameSeconds);
    let count = 0;
    while (this.accumulator + 1e-12 >= this.stepSeconds && count < this.maxSteps) {
      step(); this.accumulator -= this.stepSeconds; count++;
    }
    if (count === this.maxSteps) this.accumulator = 0;
    return count;
  }
  singleStep(step: () => void): void { if (this.paused) step(); }
  reset(): void { this.accumulator = 0; }
}
