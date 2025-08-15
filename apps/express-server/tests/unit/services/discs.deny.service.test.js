// apps/express-server/tests/unit/services/discs.deny.service.test.js
import {
  describe, test, expect, vi,
} from 'vitest';
import denyDiscService from '../../../services/discs.deny.service.js';

describe('denyDiscService', () => {
  test('should export a function', () => {
    expect(typeof denyDiscService).toBe('function');
  });

  test('should throw if disc does not exist', async () => {
    const mockDbClient = {
      queryOne: vi.fn().mockResolvedValueOnce(null),
    };

    await expect(
      denyDiscService('non-existent-id', 'Test reason', 1, mockDbClient),
    ).rejects.toThrow('Disc not found');
  });

  test('should throw if denial reason not provided', async () => {
    const mockDbClient = {
      queryOne: vi.fn().mockResolvedValueOnce({ id: '123', approved: false }),
    };

    await expect(
      denyDiscService('existing-id', undefined, 1, mockDbClient),
    ).rejects.toThrow('Denial reason is required');
  });

  test('should throw if denial reason is empty', async () => {
    const mockDbClient = {
      queryOne: vi.fn().mockResolvedValueOnce({ id: '123', approved: false }),
    };

    await expect(
      denyDiscService('existing-id', '', 1, mockDbClient),
    ).rejects.toThrow('Denial reason is required');
  });

  test('should deny a pending disc with reason', async () => {
    const mockDisc = { id: '123', approved: false };
    const mockUpdatedDisc = {
      id: '123',
      approved: false,
      denied: true,
      denied_reason: 'Invalid flight numbers',
      denied_at: expect.any(Date),
      denied_by_id: 1,
    };

    const mockDbClient = {
      queryOne: vi.fn()
        .mockResolvedValueOnce(mockDisc)
        .mockResolvedValueOnce(mockUpdatedDisc),
    };

    const result = await denyDiscService('123', 'Invalid flight numbers', 1, mockDbClient);

    expect(mockDbClient.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDbClient.queryOne).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE disc_master'),
      [true, 'Invalid flight numbers', expect.any(Date), 1, '123'],
    );
    expect(result).toEqual(mockUpdatedDisc);
  });
});
