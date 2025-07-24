import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import setParService from '../../../services/rounds.setPar.service.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
}));

describe('rounds.setPar.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof setParService).toBe('function');
  });

  test('should accept roundId, holeNumber, par, and requestingUserId parameters', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue({ id: roundId });

    const result = await setParService(roundId, holeNumber, par, requestingUserId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(null, holeNumber, par, requestingUserId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(invalidRoundId, holeNumber, par, requestingUserId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when holeNumber is missing', async () => {
    const roundId = chance.guid();
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(roundId, null, par, requestingUserId))
      .rejects.toThrow('Hole number is required');
  });

  test('should throw ValidationError when holeNumber is not a valid number', async () => {
    const roundId = chance.guid();
    const invalidHoleNumber = chance.word();
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(roundId, invalidHoleNumber, par, requestingUserId))
      .rejects.toThrow('Hole number must be a valid number');
  });

  test('should throw ValidationError when par is missing', async () => {
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(roundId, holeNumber, null, requestingUserId))
      .rejects.toThrow('Par is required');
  });

  test('should throw ValidationError when par is not a valid number', async () => {
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const invalidPar = chance.word();
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(roundId, holeNumber, invalidPar, requestingUserId))
      .rejects.toThrow('Par must be a valid number');
  });

  test('should throw ValidationError when requestingUserId is missing', async () => {
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });

    await expect(setParService(roundId, holeNumber, par, null))
      .rejects.toThrow('Requesting user ID is required');
  });

  test('should throw ValidationError when requestingUserId is not a valid number', async () => {
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const invalidUserId = chance.word();

    await expect(setParService(roundId, holeNumber, par, invalidUserId))
      .rejects.toThrow('Requesting user ID must be a valid number');
  });

  test('should throw ValidationError when hole number is out of range', async () => {
    const roundId = chance.guid();
    const invalidHoleNumber = chance.integer({ min: 51, max: 100 });
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(roundId, invalidHoleNumber, par, requestingUserId))
      .rejects.toThrow('Hole number must be between 1 and 50');
  });

  test('should throw ValidationError when par is out of range', async () => {
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const invalidPar = chance.integer({ min: 11, max: 20 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    await expect(setParService(roundId, holeNumber, invalidPar, requestingUserId))
      .rejects.toThrow('Par must be between 1 and 10');
  });

  test('should check if round exists', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(setParService(roundId, holeNumber, par, requestingUserId))
      .rejects.toThrow('Round not found');
  });

  test('should validate hole number against course hole count', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const courseHoleCount = 18;
    const invalidHoleNumber = courseHoleCount + 1; // Try hole 19 on 18-hole course
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue({
      id: roundId,
      course_id: chance.word(),
      hole_count: courseHoleCount,
    });

    await expect(setParService(roundId, invalidHoleNumber, par, requestingUserId))
      .rejects.toThrow(`Hole number cannot exceed course hole count (${courseHoleCount})`);
  });

  test('should check if user is participant in round', async () => {
    const { queryOne } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, course_id: chance.word(), hole_count: 18 })
      .mockResolvedValueOnce(null); // User not found in round

    await expect(setParService(roundId, holeNumber, par, requestingUserId))
      .rejects.toThrow('Permission denied: User is not a participant in this round');
  });

  test('should set par successfully', async () => {
    const { queryOne, query } = await import('../../../lib/database.js');
    const roundId = chance.guid();
    const holeNumber = chance.integer({ min: 1, max: 18 });
    const par = chance.integer({ min: 3, max: 5 });
    const requestingUserId = chance.integer({ min: 1, max: 1000 });
    const playerId = chance.guid();

    queryOne
      .mockResolvedValueOnce({ id: roundId, course_id: chance.word(), hole_count: 18 })
      .mockResolvedValueOnce({ id: playerId }); // User exists in round, return their playerId

    query.mockResolvedValue({ rowCount: 1 });

    const result = await setParService(roundId, holeNumber, par, requestingUserId);

    expect(result).toEqual({ success: true });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO round_hole_pars'),
      [roundId, holeNumber, par, playerId],
    );
  });
});
