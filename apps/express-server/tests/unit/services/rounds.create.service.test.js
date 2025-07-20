import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import roundsCreateService from '../../../services/rounds.create.service.js';

const chance = new Chance();

describe('roundsCreateService', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
    mockDatabase.queryRows.mockClear();
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

    // Mock course lookup to return a valid course
    mockDatabase.queryOne.mockResolvedValueOnce({ hole_count: courseHoleCount });

    // Should not throw when called with correct parameters
    await expect(roundsCreateService(roundData, userId)).resolves.toBeUndefined();

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT hole_count FROM courses WHERE id = $1',
      [roundData.courseId],
    );
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
    mockDatabase.queryOne.mockResolvedValueOnce({ hole_count: courseHoleCount });

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
    mockDatabase.queryOne.mockResolvedValueOnce(null);

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

    // Mock course lookup to return a valid course
    mockDatabase.queryOne.mockResolvedValueOnce({ hole_count: courseHoleCount });
    // Mock round creation to return the created round
    mockDatabase.queryOne.mockResolvedValueOnce(expectedRound);

    const result = await roundsCreateService(roundData, userId);

    expect(result).toEqual(expectedRound);
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      1,
      'SELECT hole_count FROM courses WHERE id = $1',
      [roundData.courseId],
    );
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO rounds'),
      expect.arrayContaining([userId, roundData.courseId, roundData.name]),
    );
  });
});
