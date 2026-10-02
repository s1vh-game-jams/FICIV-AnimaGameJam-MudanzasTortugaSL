import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: '/',
  // Keep WASM imports and wasm-bindgen glue in one module graph.
  optimizeDeps: { exclude: ['@dimforge/rapier2d'] },
  build: { target: 'es2022' },
  test: {
    environment: 'node', include: ['tests/**/*.test.ts'],
    // Rapier publishes a browser module field, without a Node main entry.
    alias: { '@dimforge/rapier2d': fileURLToPath(new URL('./node_modules/@dimforge/rapier2d/rapier.js', import.meta.url)) },
    server: { deps: { inline: [/rapier2d/] } },
  },
});
