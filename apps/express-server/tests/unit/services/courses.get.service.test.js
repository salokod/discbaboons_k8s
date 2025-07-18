import {
  describe, it, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import coursesGetService from '../../../services/courses.get.service.js';

const chance = new Chance();

describe('courses.get.service', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
    mockDatabase.queryRows.mockClear();
  });

  it('should export a function', () => {
    expect(typeof coursesGetService).toBe('function');
  });

  it('should throw ValidationError when courseId is missing', async () => {
    await expect(coursesGetService()).rejects.toThrow('courseId is required');
  });

  it('should return course when found', async () => {
    const testCourseId = chance.string({ alpha: true });
    const mockCourse = {
      id: testCourseId,
      name: chance.string(),
      city: chance.city(),
      state_province: chance.state({ abbreviated: true }),
      country: 'US',
      hole_count: chance.integer({ min: 9, max: 18 }),
    };

    mockDatabase.queryOne.mockResolvedValue(mockCourse);

    const result = await coursesGetService(testCourseId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE id = $1 AND approved = true',
      [testCourseId],
    );
    expect(result).toEqual(mockCourse);
  });

  it('should return null when course not found', async () => {
    const testCourseId = chance.string({ alpha: true });

    mockDatabase.queryOne.mockResolvedValue(null);

    const result = await coursesGetService(testCourseId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE id = $1 AND approved = true',
      [testCourseId],
    );
    expect(result).toBe(null);
  });

  it('should return user own unapproved course when userId provided', async () => {
    const userId = chance.integer({ min: 1 });
    const testCourseId = chance.string({ alpha: true });
    const mockCourse = {
      id: testCourseId,
      name: chance.string(),
      approved: false,
      submitted_by_id: userId,
    };

    mockDatabase.queryOne.mockResolvedValue(mockCourse);

    const result = await coursesGetService(testCourseId, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('submitted_by_id = $2'),
      [testCourseId, userId],
    );
    expect(result).toEqual(mockCourse);
  });

  it('should return friend unapproved course when userId provided', async () => {
    const userId = chance.integer({ min: 1 });
    const testCourseId = chance.string({ alpha: true });
    const mockCourse = {
      id: testCourseId,
      name: chance.string(),
      approved: false,
      submitted_by_id: chance.integer({ min: 1 }),
    };

    mockDatabase.queryOne.mockResolvedValue(mockCourse);

    const result = await coursesGetService(testCourseId, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('friendship_requests'),
      [testCourseId, userId],
    );
    expect(result).toEqual(mockCourse);
  });

  it('should only return approved course when no userId provided', async () => {
    const testCourseId = chance.string({ alpha: true });
    const mockCourse = {
      id: testCourseId,
      name: chance.string(),
      approved: true,
    };

    mockDatabase.queryOne.mockResolvedValue(mockCourse);

    const result = await coursesGetService(testCourseId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE id = $1 AND approved = true',
      [testCourseId],
    );
    expect(result).toEqual(mockCourse);
  });

  it('should not return unapproved course when no userId provided', async () => {
    const testCourseId = chance.string({ alpha: true });

    mockDatabase.queryOne.mockResolvedValue(null);

    const result = await coursesGetService(testCourseId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE id = $1 AND approved = true',
      [testCourseId],
    );
    expect(result).toBe(null);
  });
});
