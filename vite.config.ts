import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), wasm()],
  resolve: { alias: [{ find: /^assert$/, replacement: 'assert/' }, { find: /^isomorphic-ws$/, replacement: fileURLToPath(new URL('./src/web/browser-websocket.ts', import.meta.url)) }] },
  build: { target: 'es2022', sourcemap: false },
  optimizeDeps: { exclude: ['@midnight-ntwrk/ledger-v8', '@midnight-ntwrk/onchain-runtime-v3'] },
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
});
