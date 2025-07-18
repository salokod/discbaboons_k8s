import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import approveDiscService from '../../../services/discs.approve.service.js';

const chance = new Chance();

describe('approveDiscService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDatabase.queryOne.mockReset();
  });

  test('should export a function', () => {
    expect(typeof approveDiscService).toBe('function');
  });

  test('should throw if disc does not exist', async () => {
    const randomId = chance.integer({ min: 1, max: 10000 });

    // Mock queryOne to return null (disc not found)
    mockDatabase.queryOne.mockResolvedValue(null);

    await expect(approveDiscService(randomId, mockDatabase)).rejects.toThrow('Disc not found');

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT id, brand, model, speed, glide, turn, fade, approved, added_by_id, created_at, updated_at
     FROM disc_master 
     WHERE id = $1`,
      [randomId],
    );
  });

  test('should approve a pending disc', async () => {
    const disc = {
      id: chance.integer({ min: 1, max: 10000 }),
      brand: chance.word(),
      model: chance.word(),
      speed: chance.integer({ min: 1, max: 15 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      approved: false,
      added_by_id: chance.integer({ min: 1 }),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const approvedDisc = {
      ...disc,
      approved: true,
      updated_at: new Date(),
    };

    // Mock the sequence of database calls
    mockDatabase.queryOne
      .mockResolvedValueOnce(disc) // First call: find disc
      .mockResolvedValueOnce(approvedDisc); // Second call: update disc

    const result = await approveDiscService(disc.id, mockDatabase);

    expect(result).toEqual(approvedDisc);

    // Verify the database calls
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      1,
      `SELECT id, brand, model, speed, glide, turn, fade, approved, added_by_id, created_at, updated_at
     FROM disc_master 
     WHERE id = $1`,
      [disc.id],
    );
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      `UPDATE disc_master 
     SET approved = $1, updated_at = $2 
     WHERE id = $3 
     RETURNING *`,
      [true, expect.any(Date), disc.id],
    );
  });
});
