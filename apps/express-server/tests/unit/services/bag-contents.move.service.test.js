import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';
import moveDiscService from '../../../services/bag-contents.move.service.js';

const chance = new Chance();

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

    const mockPrismaClient = {
      bags: {
        findFirst: vi.fn(),
      },
      bag_contents: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    // Mock both bags exist and belong to user
    mockPrismaClient.bags.findFirst
      .mockResolvedValueOnce({ id: sourceBagId, user_id: userId })
      .mockResolvedValueOnce({ id: targetBagId, user_id: userId });

    // Mock finding the disc content
    mockPrismaClient.bag_contents.findMany.mockResolvedValue([
      { id: contentId, bag_id: sourceBagId },
    ]);

    // Mock the update operation
    mockPrismaClient.bag_contents.updateMany.mockResolvedValue({ count: 1 });

    // Mock transaction to execute the callback
    mockPrismaClient.$transaction.mockImplementation(
      async (callback) => callback(mockPrismaClient),
    );

    const options = { contentIds: [contentId] };
    const result = await moveDiscService(
      userId,
      sourceBagId,
      targetBagId,
      options,
      mockPrismaClient,
    );

    expect(result.message).toBe('Discs moved successfully');
    expect(result.movedCount).toBe(1);
    expect(mockPrismaClient.bags.findFirst).toHaveBeenCalledTimes(2);
    expect(mockPrismaClient.bag_contents.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [contentId] } },
      data: {
        bag_id: targetBagId,
        updated_at: expect.any(Date),
      },
    });
  });

  test('should move multiple discs by contentIds array with updated timestamps', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });
    const discCount = chance.integer({ min: 2, max: 5 });
    const contentIds = Array.from({ length: discCount }, () => chance.guid({ version: 4 }));

    const mockPrismaClient = {
      bags: {
        findFirst: vi.fn(),
      },
      bag_contents: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    // Mock both bags exist and belong to user
    mockPrismaClient.bags.findFirst
      .mockResolvedValueOnce({ id: sourceBagId, user_id: userId })
      .mockResolvedValueOnce({ id: targetBagId, user_id: userId });

    // Mock finding the disc contents
    const foundDiscs = contentIds.map((id) => ({ id, bag_id: sourceBagId }));
    mockPrismaClient.bag_contents.findMany.mockResolvedValue(foundDiscs);

    // Mock the update operation
    mockPrismaClient.bag_contents.updateMany.mockResolvedValue({ count: discCount });

    // Mock transaction to execute the callback
    mockPrismaClient.$transaction.mockImplementation(
      async (callback) => callback(mockPrismaClient),
    );

    const options = { contentIds };
    const result = await moveDiscService(
      userId,
      sourceBagId,
      targetBagId,
      options,
      mockPrismaClient,
    );

    expect(result.message).toBe('Discs moved successfully');
    expect(result.movedCount).toBe(discCount);
    expect(mockPrismaClient.bags.findFirst).toHaveBeenCalledTimes(2);
    expect(mockPrismaClient.bag_contents.updateMany).toHaveBeenCalledWith({
      where: { id: { in: contentIds } },
      data: {
        bag_id: targetBagId,
        updated_at: expect.any(Date),
      },
    });
  });

  test('should move all discs from source to target bag when no contentIds specified', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });
    const discCount = chance.integer({ min: 3, max: 8 });

    const mockPrismaClient = {
      bags: {
        findFirst: vi.fn(),
      },
      bag_contents: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    // Mock both bags exist and belong to user
    mockPrismaClient.bags.findFirst
      .mockResolvedValueOnce({ id: sourceBagId, user_id: userId })
      .mockResolvedValueOnce({ id: targetBagId, user_id: userId });

    // Mock finding all disc contents in source bag with random count
    const allDiscsInBag = Array.from({ length: discCount }, () => ({
      id: chance.guid({ version: 4 }),
      bag_id: sourceBagId,
    }));
    mockPrismaClient.bag_contents.findMany.mockResolvedValue(allDiscsInBag);

    // Mock the update operation
    mockPrismaClient.bag_contents.updateMany.mockResolvedValue({ count: discCount });

    // Mock transaction to execute the callback
    mockPrismaClient.$transaction.mockImplementation(
      async (callback) => callback(mockPrismaClient),
    );

    const options = {}; // No contentIds means move all
    const result = await moveDiscService(
      userId,
      sourceBagId,
      targetBagId,
      options,
      mockPrismaClient,
    );

    expect(result.message).toBe('Discs moved successfully');
    expect(result.movedCount).toBe(discCount);
    expect(mockPrismaClient.bags.findFirst).toHaveBeenCalledTimes(2);
    expect(mockPrismaClient.bag_contents.findMany).toHaveBeenCalledWith({
      where: { bag_id: sourceBagId },
      select: { id: true },
    });
    expect(mockPrismaClient.bag_contents.updateMany).toHaveBeenCalledWith({
      where: { id: { in: allDiscsInBag.map((disc) => disc.id) } },
      data: {
        bag_id: targetBagId,
        updated_at: expect.any(Date),
      },
    });
  });

  test('should throw NotFoundError when source bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });

    const mockPrismaClient = {
      bags: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    // Mock source bag not found or not owned by user
    mockPrismaClient.bags.findFirst.mockResolvedValueOnce(null);

    // Mock transaction to execute the callback
    mockPrismaClient.$transaction.mockImplementation(
      async (callback) => callback(mockPrismaClient),
    );

    const options = {};

    await expect(
      moveDiscService(userId, sourceBagId, targetBagId, options, mockPrismaClient),
    ).rejects.toThrow('Source bag not found or access denied');
  });

  test('should throw NotFoundError when target bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1, max: 10000 });
    const sourceBagId = chance.guid({ version: 4 });
    const targetBagId = chance.guid({ version: 4 });

    const mockPrismaClient = {
      bags: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    // Mock source bag exists but target bag not found
    mockPrismaClient.bags.findFirst
      .mockResolvedValueOnce({ id: sourceBagId, user_id: userId })
      .mockResolvedValueOnce(null);

    // Mock transaction to execute the callback
    mockPrismaClient.$transaction.mockImplementation(
      async (callback) => callback(mockPrismaClient),
    );

    const options = {};

    await expect(
      moveDiscService(userId, sourceBagId, targetBagId, options, mockPrismaClient),
    ).rejects.toThrow('Target bag not found or access denied');
  });
});
