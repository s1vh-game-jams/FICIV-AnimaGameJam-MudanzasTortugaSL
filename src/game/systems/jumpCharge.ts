export interface JumpChargeInput {
  jumpHeld?: boolean;
  jumpPressed?: boolean;
  jumpReleased?: boolean;
}

export type JumpChargeState = 'idle' | 'charging';

/** Fixed-time charge only; the simulation decides how to apply the launch ratio. */
export class JumpCharge {
  private seconds = 0;
  private compensation = 0;
  private maximum = 3;
  private currentState: JumpChargeState = 'idle';

  get state(): JumpChargeState { return this.currentState; }
  get charging(): boolean { return this.currentState === 'charging'; }
  get chargeSeconds(): number { return this.seconds; }
  get charge(): number { return this.seconds / this.maximum; }

  update(
    input: JumpChargeInput,
    eligible: boolean,
    dtSeconds: number,
    maxSeconds: number,
  ): number | undefined {
    if (!Number.isFinite(dtSeconds) || dtSeconds < 0) {
      throw new RangeError('Jump timestep must be finite and nonnegative.');
    }
    if (!Number.isFinite(maxSeconds) || maxSeconds <= 0) {
      throw new RangeError('Maximum charge time must be finite and positive.');
    }
    this.maximum = maxSeconds;
    this.seconds = Math.min(this.seconds, maxSeconds);
    if (!eligible) {
      this.cancel();
      return undefined;
    }
    if (input.jumpPressed && !this.charging) {
      this.currentState = 'charging';
      this.seconds = 0;
      this.compensation = 0;
    }
    if (!this.charging) return undefined;

    if (input.jumpHeld) {
      const increment = dtSeconds - this.compensation;
      const total = this.seconds + increment;
      this.compensation = total - this.seconds - increment;
      this.seconds = Math.min(maxSeconds, total);
      if (this.seconds === maxSeconds) this.compensation = 0;
    }
    if (input.jumpReleased) {
      const ratio = this.charge;
      this.cancel();
      return ratio;
    }
    // An interrupted held state is canceled rather than interpreted as keyup.
    if (!input.jumpHeld) this.cancel();
    return undefined;
  }

  cancel(): void {
    this.currentState = 'idle';
    this.seconds = 0;
    this.compensation = 0;
  }

  reset(): void { this.cancel(); }
}
