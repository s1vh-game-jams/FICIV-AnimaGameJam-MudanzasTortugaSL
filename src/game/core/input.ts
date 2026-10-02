export interface Controls { horizontal: number; vertical: number }
export const NO_CONTROLS: Controls = { horizontal: 0, vertical: 0 };
export class KeyboardInput {
  private keys = new Set<string>();
  private down = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement) return;
    if (event.key.startsWith('Arrow')) { event.preventDefault(); this.keys.add(event.key); }
  };
  private up = (event: KeyboardEvent) => { this.keys.delete(event.key); };
  private blur = () => this.clear();
  constructor() {
    window.addEventListener('keydown', this.down); window.addEventListener('keyup', this.up);
    window.addEventListener('blur', this.blur);
  }
  read(): Controls {
    return { horizontal: Number(this.keys.has('ArrowRight')) - Number(this.keys.has('ArrowLeft')),
      vertical: Number(this.keys.has('ArrowUp')) - Number(this.keys.has('ArrowDown')) };
  }
  clear(): void { this.keys.clear(); }
  dispose(): void {
    window.removeEventListener('keydown', this.down); window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.blur);
  }
}
