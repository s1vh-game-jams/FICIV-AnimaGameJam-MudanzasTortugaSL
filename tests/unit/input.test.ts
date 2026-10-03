import { describe, expect, it, vi } from 'vitest';
import { KeyboardInput, isInteractiveTarget } from '../../src/game/core/input';

interface KeyOptions {
  repeat?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget;
}

function key(source: EventTarget, type: 'keydown' | 'keyup', code: string, options: KeyOptions = {}): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    code: { value: code },
    key: { value: code === 'Space' ? ' ' : code },
    repeat: { value: options.repeat ?? false },
    ctrlKey: { value: options.ctrlKey ?? false },
    metaKey: { value: options.metaKey ?? false },
    altKey: { value: options.altKey ?? false },
    shiftKey: { value: options.shiftKey ?? false },
    ...(options.target ? { target: { value: options.target } } : {}),
  });
  source.dispatchEvent(event);
  return event;
}

function interactiveTarget(): EventTarget {
  const target = new EventTarget();
  Object.defineProperty(target, 'closest', { value: () => target });
  return target;
}

describe('KeyboardInput', () => {
  it.each([
    ['ArrowRight', 1, 0], ['KeyD', 1, 0],
    ['ArrowLeft', -1, 0], ['KeyA', -1, 0],
    ['ArrowUp', 0, 1], ['KeyW', 0, 1],
    ['ArrowDown', 0, -1], ['KeyS', 0, -1],
  ] as const)('maps %s to the same bounded intent', (code, horizontal, vertical) => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    expect(key(source, 'keydown', code).defaultPrevented).toBe(true);
    expect(input.read()).toMatchObject({ horizontal, vertical });
    key(source, 'keyup', code);
    expect(input.read()).toMatchObject({ horizontal: 0, vertical: 0 });
    input.dispose();
  });

  it('does not double aliases or lose the remaining held alias', () => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    key(source, 'keydown', 'KeyD');
    key(source, 'keydown', 'ArrowRight');
    expect(input.read().horizontal).toBe(1);
    key(source, 'keyup', 'KeyD');
    expect(input.read().horizontal).toBe(1);
    key(source, 'keyup', 'ArrowRight');
    expect(input.read().horizontal).toBe(0);
    input.dispose();
  });

  it('opposing arrows and WASD cancel on both axes', () => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    for (const code of ['KeyD', 'ArrowLeft', 'KeyW', 'ArrowDown']) key(source, 'keydown', code);
    expect(input.read()).toMatchObject({ horizontal: 0, vertical: 0 });
    input.dispose();
  });

  it('consumes each jump edge once while preserving the held level', () => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    key(source, 'keydown', 'Space');
    expect(input.read()).toMatchObject({ jumpHeld: true, jumpPressed: true, jumpReleased: false });
    expect(input.read()).toMatchObject({ jumpHeld: true, jumpPressed: false, jumpReleased: false });
    key(source, 'keyup', 'Space');
    expect(input.read()).toMatchObject({ jumpHeld: false, jumpPressed: false, jumpReleased: true });
    expect(input.read()).toMatchObject({ jumpHeld: false, jumpPressed: false, jumpReleased: false });
    input.dispose();
  });

  it('retains a short press/release between fixed ticks', () => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    key(source, 'keydown', 'Space');
    key(source, 'keyup', 'Space');
    expect(input.read()).toMatchObject({ jumpHeld: false, jumpPressed: true, jumpReleased: true });
    expect(input.read()).toMatchObject({ jumpPressed: false, jumpReleased: false });
    input.dispose();
  });

  it('ignores repeat, including a pre-held key repeating after cancellation', () => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    key(source, 'keydown', 'Space');
    input.read();
    key(source, 'keydown', 'Space', { repeat: true });
    expect(input.read().jumpPressed).toBe(false);
    input.clear();
    expect(key(source, 'keydown', 'Space', { repeat: true }).defaultPrevented).toBe(true);
    key(source, 'keyup', 'Space');
    expect(input.read()).toMatchObject({ jumpHeld: false, jumpPressed: false, jumpReleased: false });
    key(source, 'keydown', 'Space');
    expect(input.read().jumpPressed).toBe(true);
    input.dispose();
  });

  it('clear discards queued release and never creates a phantom keyup', () => {
    const source = new EventTarget();
    const cancel = vi.fn();
    const input = new KeyboardInput(source, cancel);
    key(source, 'keydown', 'Space');
    key(source, 'keyup', 'Space');
    input.clear();
    key(source, 'keyup', 'Space');
    expect(input.read()).toMatchObject({ jumpPressed: false, jumpReleased: false, jumpHeld: false });
    expect(cancel).not.toHaveBeenCalled();
    input.dispose();
  });

  it.each(['ctrlKey', 'metaKey', 'altKey'] as const)('leaves %s browser shortcuts alone', (modifier) => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    expect(key(source, 'keydown', 'Space', { [modifier]: true }).defaultPrevented).toBe(false);
    expect(key(source, 'keydown', 'KeyD', { [modifier]: true }).defaultPrevented).toBe(false);
    key(source, 'keyup', 'Space');
    expect(input.read()).toMatchObject({ horizontal: 0, jumpHeld: false, jumpPressed: false, jumpReleased: false });
    input.dispose();
  });

  it('accepts Shift with gameplay keys without changing intent', () => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    key(source, 'keydown', 'KeyW', { shiftKey: true });
    key(source, 'keydown', 'Space', { shiftKey: true });
    expect(input.read()).toMatchObject({ vertical: 1, jumpPressed: true });
    input.dispose();
  });

  it('leaves interactive ancestors and native button Space behavior alone', () => {
    const source = new EventTarget();
    const cancel = vi.fn();
    const input = new KeyboardInput(source, cancel);
    const target = interactiveTarget();
    expect(isInteractiveTarget(target)).toBe(true);
    expect(key(source, 'keydown', 'Space', { target }).defaultPrevented).toBe(false);
    expect(key(source, 'keydown', 'KeyD', { target }).defaultPrevented).toBe(false);
    expect(input.read()).toMatchObject({ horizontal: 0, jumpPressed: false, jumpHeld: false });
    expect(cancel).toHaveBeenCalled();
    input.dispose();
  });

  it('cancels held input and charge when focus moves into an interactive ancestor', () => {
    const source = new EventTarget();
    const cancel = vi.fn();
    const input = new KeyboardInput(source, cancel);
    key(source, 'keydown', 'Space');
    key(source, 'keydown', 'KeyD');
    input.read();
    const focus = new Event('focusin');
    Object.defineProperty(focus, 'target', { value: interactiveTarget() });
    source.dispatchEvent(focus);
    key(source, 'keyup', 'Space');
    expect(cancel).toHaveBeenCalledOnce();
    expect(input.read()).toMatchObject({ horizontal: 0, jumpHeld: false, jumpReleased: false });
    input.dispose();
  });

  it('cancels on keyup over a control even if focusin was unavailable', () => {
    const source = new EventTarget();
    const cancel = vi.fn();
    const input = new KeyboardInput(source, cancel);
    key(source, 'keydown', 'Space');
    input.read();
    key(source, 'keyup', 'Space', { target: interactiveTarget() });
    expect(cancel).toHaveBeenCalledOnce();
    expect(input.read().jumpReleased).toBe(false);
    input.dispose();
  });

  it('window blur cancels and cannot be followed by a delayed release', () => {
    const source = new EventTarget();
    const cancel = vi.fn();
    const input = new KeyboardInput(source, cancel);
    key(source, 'keydown', 'Space');
    input.read();
    source.dispatchEvent(new Event('blur'));
    key(source, 'keyup', 'Space');
    expect(cancel).toHaveBeenCalledOnce();
    expect(input.read()).toMatchObject({ jumpHeld: false, jumpPressed: false, jumpReleased: false });
    input.dispose();
  });

  it('does not consume unrelated keys or retain listeners after disposal', () => {
    const source = new EventTarget();
    const input = new KeyboardInput(source);
    expect(key(source, 'keydown', 'KeyC').defaultPrevented).toBe(false);
    expect(isInteractiveTarget(null)).toBe(false);
    input.dispose();
    key(source, 'keydown', 'Space');
    key(source, 'keydown', 'KeyD');
    expect(input.read()).toMatchObject({ horizontal: 0, jumpPressed: false });
  });
});
