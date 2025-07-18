import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/tests/unit/**/*.test.js'],
    setupFiles: ['./tests/unit/setup.js'],
    coverage: {
      include: ['**/*.js'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        'coverage/**',
        '**/*.config.js',
      ],
    },
    testTimeout: 5000,
    globals: true,
  },
});
