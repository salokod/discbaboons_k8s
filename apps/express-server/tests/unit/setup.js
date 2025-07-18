import { vi } from 'vitest';

// Database mock functions for raw SQL approach
const mockDatabase = {
  query: vi.fn(),
  queryRows: vi.fn(),
  queryOne: vi.fn(),
  transaction: vi.fn(),
  testDatabaseConnection: vi.fn(),
  QueryBuilder: vi.fn(),
  table: vi.fn(),
};

// Mock the lib/database.js module - use relative path from test files
vi.doMock('../../lib/database.js', () => mockDatabase);

// Export for use in tests
export default mockDatabase;
