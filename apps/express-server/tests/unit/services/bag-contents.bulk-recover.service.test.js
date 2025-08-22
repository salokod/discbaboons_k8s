import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import bulkRecoverDiscsService from '../../../services/bag-contents.bulk-recover.service.js';

const chance = new Chance();

describe('bulkRecoverDiscsService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDatabase.query.mockReset();
    mockDatabase.queryOne.mockReset();
  });
  test('should export a function', () => {
    expect(typeof bulkRecoverDiscsService).toBe('function');
  });

  test('should throw error when userId is missing', async () => {
    await expect(bulkRecoverDiscsService(null, ['id1'], 'bagId'))
      .rejects
      .toThrow('userId is required');
  });

  test('should throw error when content_ids is missing', async () => {
    await expect(bulkRecoverDiscsService('userId', null, 'bagId'))
      .rejects
      .toThrow('content_ids is required');
  });

  test('should throw error when content_ids is not an array', async () => {
    await expect(bulkRecoverDiscsService('userId', 'notArray', 'bagId'))
      .rejects
      .toThrow('content_ids must be an array');
  });

  test('should throw error when content_ids array is empty', async () => {
    await expect(bulkRecoverDiscsService('userId', [], 'bagId'))
      .rejects
      .toThrow('content_ids cannot be empty');
  });

  test('should throw error when bagId is missing', async () => {
    await expect(bulkRecoverDiscsService('userId', ['id1'], null))
      .rejects
      .toThrow('bag_id is required');
  });

  test('should successfully recover discs to target bag', async () => {
    const userId = chance.guid();
    const contentIds = [chance.guid(), chance.guid()];
    const bagId = chance.guid();

    // Mock finding lost discs owned by user
    const mockLostDiscs = contentIds.map(
      (id) => ({
        id,
        user_id: userId,
        bag_id: null,
        is_lost: true,
        lost_notes: 'Tournament loss',
        lost_at: new Date(),
      }),
    );

    mockDatabase.query.mockResolvedValueOnce(
      {
        rows: mockLostDiscs,
      },
    );

    // Mock validating target bag ownership
    mockDatabase.query.mockResolvedValueOnce(
      {
        rows: [{ id: bagId, user_id: userId }],
      },
    );

    // Mock bulk update result
    mockDatabase.query.mockResolvedValueOnce(
      {
        rowCount: contentIds.length,
      },
    );

    const result = await bulkRecoverDiscsService(userId, contentIds, bagId, mockDatabase);

    expect(result).toEqual({
      success: true,
      updated_count: contentIds.length,
      failed_ids: [],
    });

    // Verify queries were called correctly
    expect(mockDatabase.query).toHaveBeenCalledTimes(3);

    // First query: find lost discs owned by user
    expect(mockDatabase.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT'),
      [contentIds, userId],
    );

    // Second query: validate target bag ownership
    expect(mockDatabase.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('SELECT'),
      [bagId, userId],
    );

    // Third query: bulk update recovery
    expect(mockDatabase.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE bag_contents'),
      expect.arrayContaining([bagId, contentIds, userId]),
    );
  });
});
