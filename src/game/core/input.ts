export interface Controls {
  horizontal: number;
  vertical: number;
  jumpPressed?: boolean;
  jumpReleased?: boolean;
  jumpHeld?: boolean;
}

export const NO_CONTROLS: Controls = { horizontal: 0, vertical: 0 };

export interface KeyboardEventSource {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

/** Shared with laboratory shortcuts so editing never becomes gameplay input. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  const element = target as Element | null;
  if (!element || typeof element.closest !== 'function') return false;
  return element.closest(
    'input, select, textarea, button, a[href], summary, '
    + '[contenteditable]:not([contenteditable="false"]), '
    + '[role="textbox"], [role="button"], [role="link"], [role="combobox"]',
  ) !== null;
}

const GAME_CODES = new Set([
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space',
]);

function gameCode(event: KeyboardEvent): string {
  if (GAME_CODES.has(event.code)) return event.code;
  // Arrow fallbacks preserve synthetic/older events without changing WASD layout.
  return event.key?.startsWith('Arrow') ? event.key : '';
}

export class KeyboardInput {
  private readonly keys = new Set<string>();
  private jumpPressed = false;
  private jumpReleased = false;

  private readonly down: EventListener = (raw) => {
    const event = raw as KeyboardEvent;
    if (isInteractiveTarget(event.target)) {
      this.cancelContext();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const code = gameCode(event);
    if (!GAME_CODES.has(code)) return;
    event.preventDefault();
    // A held key repeating after a pause/blur must not become a fresh press.
    if (event.repeat || this.keys.has(code)) return;
    this.keys.add(code);
    if (code === 'Space') this.jumpPressed = true;
  };

  private readonly up: EventListener = (raw) => {
    const event = raw as KeyboardEvent;
    if (isInteractiveTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
      this.cancelContext();
      return;
    }
    const code = gameCode(event);
    const wasHeld = this.keys.delete(code);
    if (code === 'Space' && wasHeld) this.jumpReleased = true;
  };

  private readonly blur: EventListener = () => this.cancelContext();
  private readonly focus: EventListener = (event) => {
    if (isInteractiveTarget(event.target)) this.cancelContext();
  };

  constructor(
    private readonly source: KeyboardEventSource = window,
    private readonly onContextCancel?: () => void,
  ) {
    source.addEventListener('keydown', this.down);
    source.addEventListener('keyup', this.up);
    source.addEventListener('blur', this.blur);
    source.addEventListener('focusin', this.focus);
  }

  /** Press/release edges are consumed once per fixed tick, never per render. */
  read(): Controls {
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const up = this.keys.has('ArrowUp') || this.keys.has('KeyW');
    const down = this.keys.has('ArrowDown') || this.keys.has('KeyS');
    const result: Controls = {
      horizontal: Number(right) - Number(left),
      vertical: Number(up) - Number(down),
      jumpHeld: this.keys.has('Space'),
      jumpPressed: this.jumpPressed,
      jumpReleased: this.jumpReleased,
    };
    this.jumpPressed = false;
    this.jumpReleased = false;
    return result;
  }

  /** Cancellation is not a release. Lifecycle code also cancels simulation charge. */
  clear(): void {
    this.keys.clear();
    this.jumpPressed = false;
    this.jumpReleased = false;
  }

  dispose(): void {
    this.source.removeEventListener('keydown', this.down);
    this.source.removeEventListener('keyup', this.up);
    this.source.removeEventListener('blur', this.blur);
    this.source.removeEventListener('focusin', this.focus);
    this.clear();
  }

  private cancelContext(): void {
    this.clear();
    this.onContextCancel?.();
  }
}
