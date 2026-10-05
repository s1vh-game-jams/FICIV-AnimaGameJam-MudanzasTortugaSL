import type { Difficulty } from '../game/config/endless';

export type GameScreen = 'title' | 'mode' | 'difficulty' | 'credits' | 'running' | 'pause' | 'confirm' | 'results';
export type NavigationEffect =
  | { type: 'start'; difficulty: Difficulty }
  | { type: 'pause' | 'resume' | 'restart' | 'exit' | 'reset-help' | 'laboratory' };

export interface MenuOption {
  readonly id: string;
  readonly label: string;
  readonly detail?: string;
  readonly disabled?: boolean;
  readonly secondary?: boolean;
}

const OPTIONS: Readonly<Partial<Record<GameScreen, readonly MenuOption[]>>> = {
  title: [
    { id: 'start', label: 'EMPEZAR MUDANZA' },
    { id: 'credits', label: 'Créditos' },
    { id: 'laboratory', label: 'Laboratorio de físicas', secondary: true },
  ],
  mode: [
    { id: 'custom', label: 'Nivel personalizado', detail: 'Próximamente', disabled: true },
    { id: 'endless', label: 'Carrera Infinita', detail: 'Conserva la carga todo lo que puedas.' },
  ],
  difficulty: [
    { id: 'easy', label: 'Fácil', detail: 'Una mudanza tranquila.' },
    { id: 'normal', label: 'Normal', detail: 'El servicio de siempre.' },
    { id: 'hard', label: 'Difícil', detail: 'Especialistas en cuestas arriba.' },
  ],
  credits: [{ id: 'back', label: 'Volver a la portada' }],
  pause: [
    { id: 'continue', label: 'Continuar' },
    { id: 'restart', label: 'Reiniciar recorrido' },
    { id: 'help', label: 'Ver los controles otra vez' },
    { id: 'exit', label: 'Salir al menú principal' },
  ],
  confirm: [{ id: 'cancel', label: 'Cancelar' }, { id: 'confirm', label: 'Confirmar' }],
  results: [{ id: 'back', label: 'Volver a la portada' }],
};

/** Navigation owns selection and confirmation, while the run owns simulation state. */
export class GameNavigation {
  screen: GameScreen = 'title';
  selected = 0;
  confirmation: 'restart' | 'exit' | undefined;

  get options(): readonly MenuOption[] { return OPTIONS[this.screen] ?? []; }
  get paused(): boolean { return this.screen === 'pause' || this.screen === 'confirm' || this.screen === 'results'; }

  move(direction: number): void {
    const options = this.options;
    if (!options.length || !direction) return;
    let next = this.selected;
    for (let index = 0; index < options.length; index++) {
      next = (next + Math.sign(direction) + options.length) % options.length;
      if (!options[next].disabled) { this.selected = next; return; }
    }
  }

  select(index: number): NavigationEffect | undefined {
    const option = this.options[index];
    if (!option || option.disabled) return;
    this.selected = index;
    return this.confirm();
  }

  confirm(): NavigationEffect | undefined {
    const option = this.options[this.selected];
    if (!option || option.disabled) return;
    switch (this.screen) {
      case 'title':
        if (option.id === 'laboratory') return { type: 'laboratory' };
        this.open(option.id === 'start' ? 'mode' : 'credits');
        return;
      case 'mode': this.open('difficulty'); return;
      case 'difficulty': {
        const difficulty = option.id as Difficulty;
        this.open('running');
        return { type: 'start', difficulty };
      }
      case 'pause':
        if (option.id === 'continue') { this.open('running'); return { type: 'resume' }; }
        if (option.id === 'help') return { type: 'reset-help' };
        this.confirmation = option.id as 'restart' | 'exit';
        this.open('confirm');
        return;
      case 'confirm': {
        const action = this.confirmation;
        this.confirmation = undefined;
        if (option.id === 'cancel' || !action) { this.open('pause'); return; }
        this.open(action === 'restart' ? 'running' : 'title');
        return { type: action };
      }
      case 'results': this.open('title'); return { type: 'exit' };
      case 'credits': this.open('title'); return;
      default: return;
    }
  }

  escape(): NavigationEffect | undefined {
    switch (this.screen) {
      case 'mode': case 'credits': this.open('title'); return;
      case 'difficulty': this.open('mode'); return;
      case 'running': return this.pause();
      case 'pause': this.open('running'); return { type: 'resume' };
      case 'confirm': this.confirmation = undefined; this.open('pause'); return;
      case 'results': this.open('title'); return { type: 'exit' };
      default: return;
    }
  }

  pause(): NavigationEffect | undefined {
    if (this.screen !== 'running') return;
    this.open('pause');
    return { type: 'pause' };
  }

  beginRun(): void { this.open('running'); }
  finishRun(): void { this.confirmation = undefined; this.open('results'); }

  private open(screen: GameScreen): void {
    this.screen = screen;
    this.selected = screen === 'mode' || screen === 'difficulty' ? 1 : 0;
  }
}

export function formatRunTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return Math.floor(whole / 60).toString().padStart(2, '0') + ':' + (whole % 60).toString().padStart(2, '0');
}
