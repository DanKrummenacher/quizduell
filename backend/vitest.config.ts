import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    testTimeout: 30_000,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // The demo data only serve the local admin; main.ts is the bootstrap.
      exclude: ['src/main.ts', 'src/**/*.spec.ts', 'src/testing/demo-data.ts'],
      thresholds: { lines: 85, functions: 85, branches: 70, statements: 85 },
    },
  },
});
