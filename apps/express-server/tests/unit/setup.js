import { jest } from '@jest/globals';

// Clean, stable mocking approach
const mockPrisma = {
  users: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user_profiles: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
};

// Mock the entire @prisma/client module first
jest.doMock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock the lib/prisma.js module - use relative path from test files
jest.doMock('../../lib/prisma.js', () => ({
  default: mockPrisma,
}));

// Export for use in tests
// eslint-disable-next-line import/prefer-default-export
export { mockPrisma };
