import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
// Mock the service
vi.mock('../../../services/skins.calculate.service.js', () => ({
  default: vi.fn(),
}));

describe('skins.calculate.controller.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', async () => {
    const skinsCalculateController = await import('../../../controllers/skins.calculate.controller.js');
    expect(typeof skinsCalculateController.default).toBe('function');
  });
});
