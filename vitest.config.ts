import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'd.o.it.brainstorming',
        short_name: 'd.o.it',
        theme_color: '#ffffff',
        icons: [],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.{idea,git,cache,output}/**'],
    include: ['./src/tests/**/*.{test,spec}.{ts,tsx}'],
    maxConcurrency: 1, // Reduce concurrency to avoid "too many open files" error
    maxThreads: 1,
    minThreads: 1,
    fileParallelism: false, // Disable file parallelism to avoid "too many open files" error
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
