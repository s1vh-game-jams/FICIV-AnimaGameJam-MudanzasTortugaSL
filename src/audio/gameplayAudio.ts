import type { CargoKind } from '../game/content/cargo';
import type { SimulationSnapshot } from '../game/physics/simulation';
import { AudioManager } from './audioManager';
import { AUDIO_FILES, AUDIO_TIMING as T } from './manifest';

type ImpactTier = 'light' | 'medium' | 'heavy';
const IMPACT_RANK = { light: 1, medium: 2, heavy: 3 } as const;
export interface AudioObservation {
  readonly logicalOffset?: number;
  readonly heightOffset?: number;
  readonly pennants?: number;
  readonly helpId?: string;
  readonly ended?: boolean;
}

/** Fixed-tick presentation policy shared by Endless and the physical laboratory. */
export class GameplayAudio {
  private previous: { tick: number; time: number; x: number; y: number } | undefined;
  private lost = new Set<CargoKind>();
  private losses = new Set<CargoKind>();
  private lossDeadline = 0;
  private impact: ImpactTier | undefined;
  private impactDeadline = 0;
  private impactAllowedAt = 0;
  private wet = false;
  private candidateWet = false;
  private waterSince = 0;
  private waterAllowedAt = 0;
  private largeEntry = false;
  private helpId: string | undefined;
  private pennants = 0;
  private paused = false;

  constructor(private readonly audio: AudioManager,
    private readonly onLoss?: (ids: readonly CargoKind[], terminal: boolean) => void) {}

  reset(snapshot: SimulationSnapshot): void {
    this.audio.setGameplay(false);
    this.previous = { tick: snapshot.tick, time: snapshot.time, x: snapshot.turtle.x, y: snapshot.turtle.y };
    this.lost = new Set(snapshot.cargo.filter(item => item.state === 'lost').map(item => item.id));
    this.losses.clear(); this.lossDeadline = 0;
    this.impact = undefined; this.impactDeadline = 0; this.impactAllowedAt = 0;
    this.wet = this.candidateWet = snapshot.turtle.biome === 'water';
    this.waterSince = snapshot.time; this.waterAllowedAt = 0; this.largeEntry = false;
    this.helpId = undefined; this.pennants = 0;
    this.audio.setGameplay(!this.paused);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.impact = undefined; this.losses.clear(); this.lossDeadline = 0;
    this.audio.setGameplay(!paused);
  }

  showHelp(id?: string): void {
    if (id && id !== this.helpId && !this.paused) this.audio.playGameplay(AUDIO_FILES.ui.helpPop);
    this.helpId = id;
  }

  observe(snapshot: SimulationSnapshot, context: AudioObservation = {}): void {
    const time = snapshot.time;
    const x = snapshot.turtle.x + (context.logicalOffset ?? 0);
    const y = snapshot.turtle.y + (context.heightOffset ?? 0);
    if (this.paused) {
      // Diagnostic single-step may change state while paused; consume it silently.
      this.previous = { tick: snapshot.tick, time, x, y };
      this.lost = new Set(snapshot.cargo.filter(item => item.state === 'lost').map(item => item.id));
      this.wet = this.candidateWet = snapshot.turtle.biome === 'water';
      this.waterSince = time; this.largeEntry = false;
      this.pennants = context.pennants ?? this.pennants;
      return;
    }
    if (snapshot.tick === this.previous?.tick) return;
    const dt = this.previous ? time - this.previous.time : 0;
    const moving = !!this.previous && dt > 0 && Math.hypot(x - this.previous.x, y - this.previous.y) / dt > T.movementMinimumMetresPerSecond;
    this.previous = { tick: snapshot.tick, time, x, y };

    for (const event of snapshot.audioEvents) {
      if (event.type === 'cargoImpact') {
        if (!this.impact) this.impactDeadline = time + T.impactGroupSeconds;
        if (!this.impact || IMPACT_RANK[event.tier] > IMPACT_RANK[this.impact]) this.impact = event.tier;
      } else if (event.type === 'landing') {
        this.audio.playGameplay(event.hard ? AUDIO_FILES.turtle.landingHard : AUDIO_FILES.turtle.landingSoft);
      } else if (event.type === 'waterEntry') this.largeEntry = event.large;
      else if (event.type === 'hazard') this.audio.playGameplay(AUDIO_FILES.hazards[event.name]);
    }
    if (this.impact && time >= this.impactDeadline && time >= this.impactAllowedAt && !context.ended) {
      this.audio.playGameplay(this.impact === 'heavy' ? AUDIO_FILES.cargo.impactHeavy
        : this.impact === 'medium' ? AUDIO_FILES.cargo.impactMedium : AUDIO_FILES.cargo.impactLight);
      this.impact = undefined; this.impactAllowedAt = time + T.impactCooldownSeconds;
    }

    const inWater = snapshot.turtle.biome === 'water';
    if (inWater !== this.candidateWet) { this.candidateWet = inWater; this.waterSince = time; }
    if (this.candidateWet !== this.wet && time - this.waterSince >= T.waterStableSeconds && time >= this.waterAllowedAt) {
      this.wet = this.candidateWet;
      this.audio.playGameplay(this.wet ? this.largeEntry ? AUDIO_FILES.water.entryLarge : AUDIO_FILES.water.entrySmall : AUDIO_FILES.water.exit);
      this.largeEntry = false; this.waterAllowedAt = time + T.waterCooldownSeconds;
    }

    for (const item of snapshot.cargo) if (item.state === 'lost' && !this.lost.has(item.id)) {
      this.lost.add(item.id); this.losses.add(item.id);
      if (!this.lossDeadline) this.lossDeadline = time + T.lossGroupSeconds;
    }
    if (this.losses.size && (time >= this.lossDeadline || context.ended)) {
      // Final feedback survives the immediate gameplay stop; never play lost + lastObjectLost twice.
      if (context.ended) this.audio.playUI('disabled');
      else this.audio.playGameplay(AUDIO_FILES.cargo.lost);
      this.onLoss?.([...this.losses], !!context.ended);
      this.losses.clear(); this.lossDeadline = 0;
    }
    if ((context.pennants ?? 0) > this.pennants && !context.ended) this.audio.playGameplay(AUDIO_FILES.scoring.checkpoint);
    this.pennants = context.pennants ?? this.pennants;
    this.showHelp(context.helpId);
    this.audio.setMovement(!context.ended && moving ? inWater ? 'water' : snapshot.turtle.grounded ? 'dry' : undefined : undefined);
    if (context.ended) { this.impact = undefined; this.audio.setGameplay(false); }
  }

  dispose(): void { this.setPaused(true); }
}
