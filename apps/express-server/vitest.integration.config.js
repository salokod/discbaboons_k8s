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
        '**/*.config.js',
      ],
    },
    testTimeout: 10000,
    globals: true,
    fileParallelism: false, // Run test files serially to avoid database race conditions
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
});
