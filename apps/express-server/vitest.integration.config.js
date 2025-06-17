import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/tests/integration/**/*.test.js'],
    setupFiles: ['./tests/integration/setup.js'],
    coverage: {
      include: ['**/*.js'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        'coverage/**',
        '**/prisma/**',
        '**/*.config.js',
      ],
    },
    testTimeout: 10000,
    globals: true,
  },
});
