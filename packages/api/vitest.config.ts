import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/database/migrations/',
        'src/database/seed.ts',
        'src/index.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'tests/setup.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
