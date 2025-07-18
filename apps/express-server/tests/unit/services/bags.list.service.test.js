/* eslint-disable no-underscore-dangle */
import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import listBagsService from '../../../services/bags.list.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

describe('listBagsService', () => {
  beforeEach(() => {
    mockDatabase.queryRows.mockClear();
    mockDatabase.queryOne.mockClear();
  });

  test('should export a function', () => {
    expect(typeof listBagsService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await listBagsService(undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should return bags array and total for valid userId', async () => {
    const userId = chance.integer({ min: 1 });

    // Mock empty results
    mockDatabase.queryRows.mockResolvedValue([]);
    mockDatabase.queryOne.mockResolvedValue({ count: '0' });

    const result = await listBagsService(userId);

    expect(result).toHaveProperty('bags');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.bags)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(result.total).toBe(0);
  });

  test('should include disc_count for each bag', async () => {
    const userId = chance.integer({ min: 1 });
    const discCount = chance.integer({ min: 0, max: 20 });
    const mockBag = {
      id: chance.guid(),
      user_id: userId,
      name: chance.word(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
      created_at: new Date(),
      updated_at: new Date(),
      disc_count: discCount.toString(), // Raw SQL returns as string
    };

    // Mock database results
    mockDatabase.queryRows.mockResolvedValue([mockBag]);
    mockDatabase.queryOne.mockResolvedValue({ count: '1' });

    const result = await listBagsService(userId);

    expect(result.bags[0]).toHaveProperty('disc_count');
    expect(result.bags[0].disc_count).toBe(discCount);
    expect(typeof result.bags[0].disc_count).toBe('number');
  });

  test('should query bags with disc count using LEFT JOIN', async () => {
    const userId = chance.integer({ min: 1 });

    // Mock empty results
    mockDatabase.queryRows.mockResolvedValue([]);
    mockDatabase.queryOne.mockResolvedValue({ count: '0' });

    await listBagsService(userId);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN bag_contents bc ON b.id = bc.bag_id'),
      [userId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) as count'),
      [userId],
    );
  });
});
