import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

import getRoundService from '../../../services/rounds.get.service.js';
import { queryOne, queryRows } from '../../../lib/database.js';

const chance = new Chance();

// Mock the database
vi.mock('../../../lib/database.js', () => ({
  queryOne: vi.fn(),
  queryRows: vi.fn(),
}));

describe('rounds.get.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof getRoundService).toBe('function');
  });

  test('should accept roundId and userId parameters', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue({
      id: roundId,
      created_by_id: userId,
      course_name: 'Test Course',
      course_location: 'Test Location',
    });
    queryRows
      .mockResolvedValueOnce([]) // players query
      .mockResolvedValueOnce([]); // pars query

    const result = await getRoundService(roundId, userId);

    expect(result).toBeDefined();
  });

  test('should throw ValidationError when roundId is missing', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(getRoundService(null, userId))
      .rejects.toThrow('Round ID is required');
  });

  test('should throw ValidationError when roundId is not a valid UUID', async () => {
    const invalidRoundId = chance.word();
    const userId = chance.integer({ min: 1, max: 1000 });

    await expect(getRoundService(invalidRoundId, userId))
      .rejects.toThrow('Round ID must be a valid UUID');
  });

  test('should throw ValidationError when userId is missing', async () => {
    const roundId = chance.guid();

    await expect(getRoundService(roundId, null))
      .rejects.toThrow('User ID is required');
  });

  test('should throw ValidationError when userId is not a valid number', async () => {
    const roundId = chance.guid();
    const invalidUserId = chance.word();

    await expect(getRoundService(roundId, invalidUserId))
      .rejects.toThrow('User ID must be a valid number');
  });

  test('should throw NotFoundError when round does not exist', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });

    queryOne.mockResolvedValue(null);

    await expect(getRoundService(roundId, userId))
      .rejects.toThrow('Round not found');
  });

  test('should throw AuthorizationError when user is not a participant', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const creatorId = chance.integer({ min: 2001, max: 3000 });

    queryOne
      .mockResolvedValueOnce({ id: roundId, created_by_id: creatorId })
      .mockResolvedValueOnce(null); // User is not a player

    await expect(getRoundService(roundId, userId))
      .rejects.toThrow('You must be a participant in this round to view details');
  });

  test('should return round details with players when user is participant', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const roundName = chance.sentence({ words: 3 });
    const courseId = chance.word();
    const courseName = 'Test Course';
    const courseLocation = 'Test Location';
    const mockRound = {
      id: roundId,
      created_by_id: userId,
      course_id: courseId,
      name: roundName,
      start_time: new Date(),
      starting_hole: 1,
      is_private: false,
      skins_enabled: false,
      skins_value: null,
      status: 'in_progress',
      created_at: new Date(),
      updated_at: new Date(),
      course_name: courseName,
      course_location: courseLocation,
    };

    const mockPlayers = [
      {
        id: chance.guid(),
        round_id: roundId,
        user_id: userId,
        is_guest: false,
        guest_name: null,
        username: chance.word(),
        joined_at: new Date(),
      },
    ];

    queryOne
      .mockResolvedValueOnce(mockRound) // round query
      .mockResolvedValueOnce({ hole_count: null }); // course query
    queryRows
      .mockResolvedValueOnce(mockPlayers) // players query
      .mockResolvedValueOnce([]); // pars query

    const result = await getRoundService(roundId, userId);

    expect(result).toEqual({
      id: roundId,
      created_by_id: userId,
      course_id: courseId,
      name: roundName,
      start_time: mockRound.start_time,
      starting_hole: 1,
      is_private: false,
      skins_enabled: false,
      skins_value: null,
      status: 'in_progress',
      created_at: mockRound.created_at,
      updated_at: mockRound.updated_at,
      course: {
        name: courseName,
        location: courseLocation,
        holeCount: null,
        holes: [],
      },
      players: mockPlayers,
      pars: {},
    });
  });

  test('should include pars data in round response', async () => {
    const roundId = chance.guid();
    const userId = chance.integer({ min: 1, max: 1000 });
    const mockRound = {
      id: roundId,
      created_by_id: userId,
      course_id: chance.word(),
      name: chance.sentence({ words: 3 }),
      start_time: new Date(),
      starting_hole: 1,
      is_private: false,
      skins_enabled: false,
      skins_value: null,
      status: 'in_progress',
      created_at: new Date(),
      updated_at: new Date(),
      course_name: 'Test Course',
      course_location: 'Test Location',
    };

    const mockParsRows = [
      { hole_number: 1, par: 3 },
      { hole_number: 2, par: 4 },
      { hole_number: 18, par: 5 },
    ];

    queryOne
      .mockResolvedValueOnce(mockRound) // round query
      .mockResolvedValueOnce({ hole_count: 18 }); // course query
    queryRows
      .mockResolvedValueOnce([]) // players query
      .mockResolvedValueOnce(mockParsRows); // pars query

    const result = await getRoundService(roundId, userId);

    expect(result).toHaveProperty('pars');
    expect(result.pars).toEqual({ 1: 3, 2: 4, 18: 5 });
    expect(result).toHaveProperty('course');
    expect(result.course).toEqual({
      name: 'Test Course',
      location: 'Test Location',
      holeCount: 18,
      holes: [
        { number: 1, par: 3 },
        { number: 2, par: 4 },
        { number: 18, par: 5 },
      ],
    });
  });
});
