import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: false,
    include: ['src/integration-tests/**/*.integration.test.ts'],
    globalSetup: ['src/integration-tests/global-setup.ts'],
    setupFiles: ['src/integration-tests/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
  },
});
