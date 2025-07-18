import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import moveDiscService from '../../../services/bag-contents.move.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.transaction.mockClear();
});

describe('moveDiscService', () => {
  test('should export a function', () => {
    expect(typeof moveDiscService).toBe('function');
  });

  test('should throw ValidationError when userId is missing', async () => {
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });

    await expect(moveDiscService(null, sourceBagId, targetBagId)).rejects.toThrow('userId is required');
    await expect(moveDiscService(undefined, sourceBagId, targetBagId)).rejects.toThrow('userId is required');
    await expect(moveDiscService('', sourceBagId, targetBagId)).rejects.toThrow('userId is required');
  });

  test('should throw ValidationError when sourceBagId is missing', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const targetBagId = chance.guid({ version: 4 });

    await expect(moveDiscService(userId, null, targetBagId)).rejects.toThrow('sourceBagId is required');
    await expect(moveDiscService(userId, undefined, targetBagId)).rejects.toThrow('sourceBagId is required');
    await expect(moveDiscService(userId, '', targetBagId)).rejects.toThrow('sourceBagId is required');
  });

  test('should throw ValidationError when targetBagId is missing', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });

    await expect(moveDiscService(userId, sourceBagId, null)).rejects.toThrow('targetBagId is required');
    await expect(moveDiscService(userId, sourceBagId, undefined)).rejects.toThrow('targetBagId is required');
    await expect(moveDiscService(userId, sourceBagId, '')).rejects.toThrow('targetBagId is required');
  });

  test('should return null for invalid sourceBagId UUID format', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const invalidSourceBagId = 'invalid-uuid-format';
    const targetBagId = chance.guid({ version: 4 });

    const result = await moveDiscService(userId, invalidSourceBagId, targetBagId);
    expect(result).toBeNull();
  });

  test('should return null for invalid targetBagId UUID format', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const invalidTargetBagId = 'invalid-uuid-format';

    const result = await moveDiscService(userId, sourceBagId, invalidTargetBagId);
    expect(result).toBeNull();
  });

  test('should return null for both invalid UUID formats', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const invalidSourceBagId = 'invalid-source-uuid';
    const invalidTargetBagId = 'invalid-target-uuid';

    const result = await moveDiscService(userId, invalidSourceBagId, invalidTargetBagId);
    expect(result).toBeNull();
  });

  test('should move single disc by contentId with updated timestamp', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });
    const contentId = chance.guid({ version: 4 });

    const mockClient = {
      query: vi.fn(),
    };

    // Mock transaction to execute the callback
    mockDatabase.transaction.mockImplementation(async (callback) => callback(mockClient));

    // Mock both bags exist and belong to user
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: sourceBagId }] }) // Source bag validation
      .mockResolvedValueOnce({ rows: [{ id: targetBagId }] }) // Target bag validation
      .mockResolvedValueOnce({ rows: [{ id: contentId }] }) // Find specific discs
      .mockResolvedValueOnce({ rowCount: 1 }); // Update operation

    const options = { contentIds: [contentId] };
    const result = await moveDiscService(
      userId,
      sourceBagId,
      targetBagId,
      options,
    );

    expect(result.message).toBe('Discs moved successfully');
    expect(result.movedCount).toBe(1);
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [sourceBagId, userId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [targetBagId, userId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bag_contents WHERE id IN ($2) AND bag_id = $1',
      [sourceBagId, ...options.contentIds],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'UPDATE bag_contents SET bag_id = $1, updated_at = $2 WHERE id IN ($3)',
      [targetBagId, expect.any(Date), contentId],
    );
  });

  test('should move multiple discs by contentIds array with updated timestamps', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });
    const discCount = chance.integer({ min: 2, max: 5 });
    const contentIds = Array.from({ length: discCount }, () => chance.guid({ version: 4 }));

    const mockClient = {
      query: vi.fn(),
    };

    // Mock transaction to execute the callback
    mockDatabase.transaction.mockImplementation(async (callback) => callback(mockClient));

    // Mock both bags exist and belong to user
    const foundDiscs = contentIds.map((id) => ({ id }));
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: sourceBagId }] }) // Source bag validation
      .mockResolvedValueOnce({ rows: [{ id: targetBagId }] }) // Target bag validation
      .mockResolvedValueOnce({ rows: foundDiscs }) // Find specific discs
      .mockResolvedValueOnce({ rowCount: discCount }); // Update operation

    const options = { contentIds };
    const result = await moveDiscService(
      userId,
      sourceBagId,
      targetBagId,
      options,
    );

    expect(result.message).toBe('Discs moved successfully');
    expect(result.movedCount).toBe(discCount);
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [sourceBagId, userId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [targetBagId, userId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id FROM bag_contents WHERE id IN'),
      [sourceBagId, ...contentIds],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE bag_contents SET bag_id = $1, updated_at = $2 WHERE id IN'),
      [targetBagId, expect.any(Date), ...contentIds],
    );
  });

  test('should move all discs from source to target bag when no contentIds specified', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });
    const discCount = chance.integer({ min: 3, max: 8 });

    const mockClient = {
      query: vi.fn(),
    };

    // Mock transaction to execute the callback
    mockDatabase.transaction.mockImplementation(async (callback) => callback(mockClient));

    // Mock finding all disc contents in source bag with random count
    const allDiscsInBag = Array.from({ length: discCount }, () => ({
      id: chance.guid({ version: 4 }),
    }));
    const allDiscIds = allDiscsInBag.map((disc) => disc.id);

    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: sourceBagId }] }) // Source bag validation
      .mockResolvedValueOnce({ rows: [{ id: targetBagId }] }) // Target bag validation
      .mockResolvedValueOnce({ rows: allDiscsInBag }) // Find all discs in source bag
      .mockResolvedValueOnce({ rowCount: discCount }); // Update operation

    const options = {}; // No contentIds means move all
    const result = await moveDiscService(
      userId,
      sourceBagId,
      targetBagId,
      options,
    );

    expect(result.message).toBe('Discs moved successfully');
    expect(result.movedCount).toBe(discCount);
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [sourceBagId, userId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [targetBagId, userId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bag_contents WHERE bag_id = $1',
      [sourceBagId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE bag_contents SET bag_id = $1, updated_at = $2 WHERE id IN'),
      [targetBagId, expect.any(Date), ...allDiscIds],
    );
  });

  test('should throw NotFoundError when source bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });

    const mockClient = {
      query: vi.fn(),
    };

    // Mock transaction to execute the callback
    mockDatabase.transaction.mockImplementation(async (callback) => callback(mockClient));

    // Mock source bag not found or not owned by user
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const options = {};

    await expect(
      moveDiscService(userId, sourceBagId, targetBagId, options),
    ).rejects.toThrow('Source bag not found or access denied');

    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [sourceBagId, userId],
    );
  });

  test('should throw NotFoundError when target bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });

    const mockClient = {
      query: vi.fn(),
    };

    // Mock transaction to execute the callback
    mockDatabase.transaction.mockImplementation(async (callback) => callback(mockClient));

    // Mock source bag exists but target bag not found
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: sourceBagId }] }) // Source bag found
      .mockResolvedValueOnce({ rows: [] }); // Target bag not found

    const options = {};

    await expect(
      moveDiscService(userId, sourceBagId, targetBagId, options),
    ).rejects.toThrow('Target bag not found or access denied');

    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [sourceBagId, userId],
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      'SELECT id FROM bags WHERE id = $1 AND user_id = $2',
      [targetBagId, userId],
    );
  });
});
