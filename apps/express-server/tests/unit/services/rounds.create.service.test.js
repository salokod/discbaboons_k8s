import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import roundsCreateService from '../../../services/rounds.create.service.js';

// Import the mocked queryOne
import { queryOne } from '../../../lib/database.js';

// Mock the pool module
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

vi.mock('../../../lib/database.js', () => ({
  default: {
    connect: vi.fn(() => Promise.resolve(mockClient)),
  },
  queryOne: vi.fn(),
}));

const chance = new Chance();

describe('roundsCreateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof roundsCreateService).toBe('function');
  });

  test('should accept round data and user ID parameters', async () => {
    const courseHoleCount = chance.integer({ min: 9, max: 27 });
    const roundData = {
      courseId: chance.word(),
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: courseHoleCount }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
    };
    const userId = chance.integer({ min: 1 });
    const roundId = chance.guid({ version: 4 });

    // Mock course lookup
    queryOne.mockResolvedValue({ hole_count: courseHoleCount });

    // Mock transaction and queries
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: roundId, created_by_id: userId }] }) // Round insert
      .mockResolvedValueOnce(undefined) // Player insert
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await roundsCreateService(roundData, userId);

    expect(result).toEqual({ id: roundId, created_by_id: userId });
    expect(queryOne).toHaveBeenCalledWith(
      'SELECT hole_count FROM courses WHERE id = $1',
      [roundData.courseId],
    );
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  test('should throw ValidationError when starting hole exceeds course hole count', async () => {
    const courseId = chance.word();
    const courseHoleCount = chance.integer({ min: 9, max: 18 });
    const invalidStartingHole = courseHoleCount + chance.integer({ min: 1, max: 5 });

    const roundData = {
      courseId,
      name: chance.sentence({ words: 3 }),
      startingHole: invalidStartingHole,
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
    };
    const userId = chance.integer({ min: 1 });

    // Mock course lookup to return a course with limited holes
    queryOne.mockResolvedValue({ hole_count: courseHoleCount });

    await expect(roundsCreateService(roundData, userId))
      .rejects
      .toThrow('Starting hole cannot exceed course hole count');
  });

  test('should throw ValidationError when course does not exist', async () => {
    const roundData = {
      courseId: chance.word(),
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: 18 }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
    };
    const userId = chance.integer({ min: 1 });

    // Mock course lookup to return null (course not found)
    queryOne.mockResolvedValue(null);

    await expect(roundsCreateService(roundData, userId))
      .rejects
      .toThrow('Course not found');
  });

  test('should throw ValidationError when courseId is missing', async () => {
    const roundData = {
      // courseId missing
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: 18 }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
    };
    const userId = chance.integer({ min: 1 });

    await expect(roundsCreateService(roundData, userId))
      .rejects
      .toThrow('Course ID is required');
  });

  test('should throw ValidationError when name is missing', async () => {
    const roundData = {
      courseId: chance.word(),
      // name missing
      startingHole: chance.integer({ min: 1, max: 18 }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
    };
    const userId = chance.integer({ min: 1 });

    await expect(roundsCreateService(roundData, userId))
      .rejects
      .toThrow('Round name is required');
  });

  test('should throw ValidationError when userId is missing', async () => {
    const roundData = {
      courseId: chance.word(),
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: 18 }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
    };
    // userId missing

    await expect(roundsCreateService(roundData, null))
      .rejects
      .toThrow('User ID is required');
  });

  test('should create round and return round object', async () => {
    const courseHoleCount = chance.integer({ min: 9, max: 27 });
    const roundData = {
      courseId: chance.word(),
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: courseHoleCount }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
      skinsValue: chance.floating({ min: 1, max: 50, fixed: 2 }),
    };
    const userId = chance.integer({ min: 1 });

    const expectedRound = {
      id: chance.guid({ version: 4 }),
      created_by_id: userId,
      course_id: roundData.courseId,
      name: roundData.name,
      starting_hole: roundData.startingHole,
      is_private: roundData.isPrivate,
      skins_enabled: roundData.skinsEnabled,
      skins_value: roundData.skinsValue,
      status: 'in_progress',
    };

    // Mock course lookup
    queryOne.mockResolvedValue({ hole_count: courseHoleCount });

    // Mock transaction and database operations
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [expectedRound] }) // Round insert
      .mockResolvedValueOnce(undefined) // Player insert
      .mockResolvedValueOnce(undefined); // COMMIT

    const result = await roundsCreateService(roundData, userId);

    expect(result).toEqual(expectedRound);
    expect(queryOne).toHaveBeenCalledWith(
      'SELECT hole_count FROM courses WHERE id = $1',
      [roundData.courseId],
    );
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO rounds'),
      expect.arrayContaining([userId, roundData.courseId, roundData.name]),
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  test('should automatically add creator as player in the round', async () => {
    const courseHoleCount = chance.integer({ min: 9, max: 27 });
    const roundData = {
      courseId: chance.word(),
      name: chance.sentence({ words: 3 }),
      startingHole: chance.integer({ min: 1, max: courseHoleCount }),
      isPrivate: chance.bool(),
      skinsEnabled: chance.bool(),
    };
    const userId = chance.integer({ min: 1 });
    const roundId = chance.guid({ version: 4 });

    const expectedRound = {
      id: roundId,
      created_by_id: userId,
      course_id: roundData.courseId,
      name: roundData.name,
      starting_hole: roundData.startingHole,
      is_private: roundData.isPrivate,
      skins_enabled: roundData.skinsEnabled,
      status: 'in_progress',
    };

    // Mock course lookup using queryOne (happens before transaction)
    queryOne.mockResolvedValue({ hole_count: courseHoleCount });

    // Mock transaction and database operations
    mockClient.query
      .mockResolvedValueOnce(undefined) // BEGIN
      .mockResolvedValueOnce({ rows: [expectedRound] }) // Round insert
      .mockResolvedValueOnce(undefined) // Player insert
      .mockResolvedValueOnce(undefined); // COMMIT

    await roundsCreateService(roundData, userId);

    // Verify the creator was added as a player
    expect(mockClient.query).toHaveBeenCalledWith(
      'INSERT INTO round_players (round_id, user_id, is_guest)\n       VALUES ($1, $2, false)',
      [roundId, userId],
    );
  });
});
