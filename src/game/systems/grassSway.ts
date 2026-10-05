import { GRASS_SHELL_RESPONSE as G } from '../config/tuning';
import { approach } from './controller';

/** Fixed-step local randomness never consumes the procedural content streams. */
export class GrassSway {
  private randomState: number = G.randomSeed;
  private seconds: number = G.swayTargetSeconds;
  private from = 0;
  private target = 0;
  private angle = 0;

  advance(active: boolean, dt: number): number {
    if (!active) {
      this.angle = approach(this.angle, 0, G.maxSwayAngle * dt / G.swayReturnSeconds);
      this.seconds = G.swayTargetSeconds;
      return this.angle;
    }
    if (this.seconds >= G.swayTargetSeconds) {
      this.randomState ^= this.randomState << 13;
      this.randomState ^= this.randomState >>> 17;
      this.randomState ^= this.randomState << 5;
      this.from = this.angle;
      this.target = ((this.randomState >>> 0) / 0x100000000 * 2 - 1) * G.maxSwayAngle;
      this.seconds = 0;
    }
    this.seconds = Math.min(G.swayTargetSeconds, this.seconds + dt);
    const progress = this.seconds / G.swayTargetSeconds;
    const smooth = progress * progress * (3 - 2 * progress);
    this.angle = this.from + (this.target - this.from) * smooth;
    return this.angle;
  }
}
