import {
  describe, test, expect, beforeAll, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

let removeDiscService;

beforeAll(async () => {
  ({ default: removeDiscService } = await import('../../../services/bag-contents.remove.service.js'));
});

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
  mockDatabase.query.mockClear();
});

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

    const result = await removeDiscService(userId, invalidUuid);
    expect(result).toBeNull();
  });

  test('should throw NotFoundError when disc content does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const contentId = chance.guid();

    // Mock no content found
    mockDatabase.queryOne.mockResolvedValue(null);

    await expect(removeDiscService(userId, contentId)).rejects.toThrow('Disc not found or access denied');
    await expect(removeDiscService(userId, contentId)).rejects.toMatchObject({
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

    // Mock content found and successful deletion
    mockDatabase.queryOne.mockResolvedValue(mockDiscContent);
    mockDatabase.query.mockResolvedValue({ rowCount: 1 });

    const result = await removeDiscService(userId, contentId);

    expect(result).toEqual({
      message: 'Disc removed successfully',
    });
  });
});
