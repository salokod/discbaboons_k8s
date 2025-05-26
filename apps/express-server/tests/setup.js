// apps/express-server/tests/setup.js
// Test setup and database configuration

import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Create a separate Prisma instance for testing
const prisma = new PrismaClient({
  log: ['error'], // Only log errors in tests
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,
    },
  },
});

// Global test setup
beforeAll(async () => {
  await prisma.$connect();
});

// Clean up between tests
beforeEach(async () => {
  try {
    // Delete in order (foreign key constraints)
    await prisma.user_profiles.deleteMany();
    await prisma.users.deleteMany();
  } catch (error) {
    console.warn('⚠️ Database cleanup warning:', error.message);
  }
});

// Global test teardown
afterAll(async () => {
  await prisma.$disconnect();
});

// Export for use in tests
// eslint-disable-next-line import/prefer-default-export
export { prisma };
