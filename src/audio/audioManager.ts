import { publicAsset } from '../utils/publicAsset';
import { AUDIO_FILES, AUDIO_TIMING } from './manifest';

type MusicContext = keyof typeof AUDIO_FILES.bgm;
type UIEvent = keyof typeof AUDIO_FILES.ui;
type Voice = { element: HTMLAudioElement; gameplay: boolean; busy: boolean; generation: number; timer?: ReturnType<typeof setTimeout> };

/** Native streaming audio, unity volume/rate, lazy files and bounded reusable SFX. */
export class AudioManager {
  private unlocked = false;
  private hidden = false;
  private gameplay = false;
  private context: MusicContext = 'menu';
  private music: HTMLAudioElement | undefined;
  private readonly musicCache = new Map<string, HTMLAudioElement>();
  private readonly effects = new Map<string, Voice[]>();
  private readonly movement = new Map<string, HTMLAudioElement>();
  private wantedMovement: 'dry' | 'water' | undefined;

  constructor(private readonly createAudio: (url: string) => HTMLAudioElement = url => {
    const element = new Audio(url);
    element.hidden = true;
    document.body.append(element);
    return element;
  }) {}

  unlock(): void {
    if (this.hidden) return;
    this.unlocked = true;
    // Calling play synchronously in the gesture also works on direct lab access.
    this.startMusic(); this.syncMovement();
  }

  setMusicContext(context: MusicContext): void {
    const sameFile = AUDIO_FILES.bgm[this.context] === AUDIO_FILES.bgm[context];
    this.context = context;
    if (!sameFile && this.music) { this.music.pause(); this.music.currentTime = 0; this.music = undefined; }
    this.startMusic();
  }

  setGameplay(active: boolean): void {
    this.gameplay = active;
    if (!active) {
      this.wantedMovement = undefined;
      for (const voices of this.effects.values()) for (const voice of voices) if (voice.gameplay) this.stopVoice(voice);
    }
    this.syncMovement();
  }

  setPageHidden(hidden: boolean): void {
    this.hidden = hidden;
    if (hidden) {
      this.music?.pause();
      for (const voices of this.effects.values()) for (const voice of voices) this.stopVoice(voice);
      for (const audio of this.movement.values()) audio.pause();
    } else { this.startMusic(); this.syncMovement(); }
  }

  playUI(event: UIEvent): void { this.play(AUDIO_FILES.ui[event], false); }
  playGameplay(path: string): void { this.play(path, true); }

  setMovement(kind?: 'dry' | 'water'): void {
    const next = this.gameplay ? kind : undefined;
    if (next === this.wantedMovement) return;
    this.wantedMovement = next;
    this.syncMovement();
  }

  /** Only short, relevant effects are prefetched; never the full library or music buffers. */
  prepareGameplay(): void {
    if (!this.unlocked) return;
    const files = [AUDIO_FILES.cargo.impactLight, AUDIO_FILES.cargo.impactMedium, AUDIO_FILES.cargo.impactHeavy,
      AUDIO_FILES.cargo.lost, AUDIO_FILES.turtle.landingSoft, AUDIO_FILES.water.entrySmall,
      AUDIO_FILES.water.entryLarge, AUDIO_FILES.hazards.branchCreak, AUDIO_FILES.hazards.pineconeRustle,
      AUDIO_FILES.hazards.pineconeFall, AUDIO_FILES.ui.clientCall, AUDIO_FILES.ui.notification];
    for (const path of files) if (!this.effects.has(path)) this.newVoice(path);
  }

  dispose(): void {
    this.setGameplay(false);
    for (const voices of this.effects.values()) for (const voice of voices) {
      this.stopVoice(voice); voice.element.removeAttribute('src'); voice.element.load(); voice.element.remove();
    }
    for (const element of [...this.musicCache.values(), ...this.movement.values()]) {
      element.pause(); element.removeAttribute('src'); element.load(); element.remove();
    }
    this.effects.clear(); this.musicCache.clear(); this.movement.clear(); this.music = undefined;
    this.unlocked = false;
  }

  private element(path: string, loop = false): HTMLAudioElement {
    const element = this.createAudio(publicAsset(path));
    element.preload = loop ? 'none' : 'auto';
    element.loop = loop;
    // The human requested original levels, controlled by browser/device volume.
    element.volume = 1; element.playbackRate = 1;
    return element;
  }

  private startMusic(): void {
    if (!this.unlocked || this.hidden) return;
    const path = AUDIO_FILES.bgm[this.context];
    let music = this.musicCache.get(path);
    if (!music) { music = this.element(path, true); this.musicCache.set(path, music); }
    this.music = music;
    if (music.paused) void music.play().catch(() => { /* Retry on the next valid gesture; navigation remains usable. */ });
  }

  private syncMovement(): void {
    const path = this.wantedMovement === 'dry' ? AUDIO_FILES.turtle.movementDry
      : this.wantedMovement === 'water' ? AUDIO_FILES.turtle.movementWater : undefined;
    for (const [key, element] of this.movement) if (key !== path || !this.gameplay || this.hidden) {
      element.pause(); element.currentTime = 0;
    }
    if (!path || !this.unlocked || !this.gameplay || this.hidden) return;
    let element = this.movement.get(path);
    if (!element) { element = this.element(path, true); this.movement.set(path, element); }
    if (element.paused) void element.play().catch(() => { /* No deferred locomotion queue. */ });
  }

  private newVoice(path: string): Voice {
    const voice: Voice = { element: this.element(path), gameplay: false, busy: false, generation: 0 };
    const voices = this.effects.get(path) ?? [];
    voices.push(voice); this.effects.set(path, voices);
    voice.element.addEventListener('ended', () => this.stopVoice(voice));
    voice.element.addEventListener('error', () => this.stopVoice(voice));
    return voice;
  }

  private play(path: string, gameplay: boolean): void {
    if (!this.unlocked || this.hidden || (gameplay && !this.gameplay)) return;
    const voices = this.effects.get(path) ?? [];
    // Preserve one physical cue when a terminal/UI alias replaces a gameplay event.
    const alias = voices.find(voice => voice.busy && voice.element.currentTime < 0.04);
    if (alias) { if (!gameplay) alias.gameplay = false; return; }
    const all = [...this.effects.values()].flat();
    if (all.filter(voice => voice.busy).length >= AUDIO_TIMING.maxEffectVoices) {
      if (gameplay) return;
      const previous = all.find(voice => voice.busy && voice.gameplay) ?? all.find(voice => voice.busy);
      if (previous) this.stopVoice(previous);
    }
    let voice = voices.find(voice => !voice.busy);
    if (!voice && !gameplay && voices.length >= AUDIO_TIMING.maxVoicesPerFile) {
      voice = voices.find(voice => voice.gameplay);
      if (voice) this.stopVoice(voice);
    }
    if (!voice && voices.length < AUDIO_TIMING.maxVoicesPerFile) voice = this.newVoice(path);
    if (!voice) return;
    const selected = voice;
    const generation = ++selected.generation;
    selected.busy = true; selected.gameplay = gameplay; selected.element.currentTime = 0;
    // A slow network must not start a stale collision/loss after the fact.
    selected.timer = setTimeout(() => this.stopVoice(selected), AUDIO_TIMING.staleEffectMs);
    void selected.element.play().then(() => {
      if (selected.generation !== generation) return;
      clearTimeout(selected.timer); selected.timer = undefined;
    }).catch(() => { if (selected.generation === generation) this.stopVoice(selected); });
  }

  private stopVoice(voice: Voice): void {
    voice.generation++;
    clearTimeout(voice.timer); voice.timer = undefined;
    voice.element.pause(); voice.element.currentTime = 0; voice.busy = false;
  }
}
