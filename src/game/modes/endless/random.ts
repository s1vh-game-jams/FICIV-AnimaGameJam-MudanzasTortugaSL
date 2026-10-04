/** FNV-1a hashes UTF-16 code units; stable across browsers, hosts and preload order. */
export function seedHash(value: string): number {
  let state = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    state ^= value.charCodeAt(i);
    state = Math.imul(state, 0x01000193);
  }
  return state >>> 0;
}

/** Each gameplay purpose owns a stream; rendering never consumes generator state. */
export function randomStream(seed: string, moduleIndex: number, purpose: string): () => number {
  let state = seedHash(JSON.stringify([seed, moduleIndex, purpose]));
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

export function newRunSeed(): string {
  const values = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(values);
  else {
    values[0] = Date.now() >>> 0;
    values[1] = Math.floor(Math.random() * 0x100000000);
  }
  return [...values].map(value => value.toString(16).padStart(8, '0')).join('');
}
