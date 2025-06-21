import { vi } from 'vitest';

// Clean, stable mocking approach
const mockPrisma = {
  users: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  },
  user_profiles: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
};

// Mock the entire @prisma/client module first
vi.doMock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Mock the lib/prisma.js module - use relative path from test files
vi.doMock('../../lib/prisma.js', () => ({
  default: mockPrisma,
}));

// Export for use in tests
// eslint-disable-next-line import/prefer-default-export
export { mockPrisma };
