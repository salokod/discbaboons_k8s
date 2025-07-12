import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import removeDiscService from '../../../services/bag-contents.remove.service.js';

const chance = new Chance();

describe('removeDiscService', () => {
  test('should export a function', () => {
    expect(typeof removeDiscService).toBe('function');
  });

  test('should throw ValidationError when userId is missing', async () => {
    await expect(removeDiscService()).rejects.toThrow('userId is required');
    await expect(removeDiscService()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  test('should throw ValidationError when contentId is missing', async () => {
    const userId = chance.integer({ min: 1 });

    await expect(removeDiscService(userId)).rejects.toThrow('contentId is required');
    await expect(removeDiscService(userId)).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  test('should return null when contentId is not a valid UUID', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidUuid = chance.word();

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => null,
      },
    };

    const result = await removeDiscService(userId, invalidUuid, mockPrisma);
    expect(result).toBeNull();
  });

  test('should throw NotFoundError when disc content does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const contentId = chance.guid();

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => null,
      },
    };

    await expect(removeDiscService(userId, contentId, mockPrisma)).rejects.toThrow('Disc not found or access denied');
    await expect(removeDiscService(userId, contentId, mockPrisma)).rejects.toMatchObject({
      name: 'NotFoundError',
    });
  });

  test('should successfully remove disc content when user owns it', async () => {
    const userId = chance.integer({ min: 1 });
    const contentId = chance.guid();

    const mockDiscContent = {
      id: contentId,
      user_id: userId,
      disc_id: chance.guid(),
    };

    const mockPrisma = {
      bag_contents: {
        findFirst: async () => mockDiscContent,
        delete: async () => mockDiscContent,
      },
    };

    const result = await removeDiscService(userId, contentId, mockPrisma);

    expect(result).toEqual({
      message: 'Disc removed successfully',
    });
  });
});
