import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import coursesEditService from '../../../services/courses.edit.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
  mockDatabase.queryRows.mockClear();
});

describe('coursesEditService', () => {
  test('should export an object with edit function', () => {
    expect(typeof coursesEditService).toBe('object');
    expect(typeof coursesEditService.edit).toBe('function');
  });

  describe('edit', () => {
    test('should allow admin to edit any course', async () => {
      const courseId = chance.word();
      const userId = chance.integer({ min: 1 });
      const updateData = {
        name: chance.sentence(),
        city: chance.city(),
        state_province: chance.state({ abbreviated: true }),
      };

      const mockAdmin = { id: userId, is_admin: true };
      const mockExistingCourse = {
        id: courseId,
        submitted_by_id: chance.integer({ min: 1 }),
      };
      const mockUpdatedCourse = {
        id: courseId,
        ...updateData,
        updated_at: new Date(),
      };

      mockDatabase.queryOne
        .mockResolvedValueOnce(mockAdmin) // Admin check
        .mockResolvedValueOnce(mockExistingCourse) // Course existence check
        .mockResolvedValueOnce(mockUpdatedCourse); // Updated course

      const result = await coursesEditService.edit(courseId, updateData, userId);

      expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
        1,
        'SELECT id, is_admin FROM users WHERE id = $1',
        [userId],
      );
      expect(result).toEqual(mockUpdatedCourse);
    });

    test('should allow user to edit their own submitted course', async () => {
      const courseId = chance.word();
      const userId = chance.integer({ min: 1 });
      const updateData = {
        name: chance.sentence(),
        city: chance.city(),
      };

      const mockUser = { id: userId, is_admin: false };
      const mockExistingCourse = {
        id: courseId,
        submitted_by_id: userId,
      };
      const mockUpdatedCourse = {
        id: courseId,
        ...updateData,
        submitted_by_id: userId,
      };

      mockDatabase.queryOne
        .mockResolvedValueOnce(mockUser) // User check
        .mockResolvedValueOnce(mockExistingCourse) // Course ownership check
        .mockResolvedValueOnce(mockUpdatedCourse); // Updated course

      const result = await coursesEditService.edit(courseId, updateData, userId);

      expect(result).toEqual(mockUpdatedCourse);
    });

    test('should allow friend to edit user submitted course', async () => {
      const courseId = chance.word();
      const userId = chance.integer({ min: 1 });
      const friendId = chance.integer({ min: 1 });
      const updateData = {
        name: chance.sentence(),
      };

      const mockUser = { id: userId, is_admin: false };
      const mockCourse = {
        id: courseId,
        submitted_by_id: friendId,
      };
      const mockFriendship = { requester_id: userId, recipient_id: friendId };
      const mockUpdatedCourse = {
        id: courseId,
        ...updateData,
        submitted_by_id: friendId,
      };

      mockDatabase.queryOne
        .mockResolvedValueOnce(mockUser) // User check
        .mockResolvedValueOnce(mockCourse) // Course check
        .mockResolvedValueOnce(mockFriendship) // Friendship check
        .mockResolvedValueOnce(mockUpdatedCourse); // Updated course

      const result = await coursesEditService.edit(courseId, updateData, userId);

      expect(result).toEqual(mockUpdatedCourse);
    });

    test('should throw error if user has no permission', async () => {
      const courseId = chance.word();
      const userId = chance.integer({ min: 1 });
      const otherUserId = chance.integer({ min: 1 });
      const updateData = { name: chance.sentence() };

      const mockUser = { id: userId, is_admin: false };
      const mockCourse = {
        id: courseId,
        submitted_by_id: otherUserId, // Different user
      };

      mockDatabase.queryOne
        .mockResolvedValueOnce(mockUser) // User check
        .mockResolvedValueOnce(mockCourse) // Course check
        .mockResolvedValueOnce(null); // No friendship

      await expect(coursesEditService.edit(courseId, updateData, userId))
        .rejects.toThrow('You do not have permission to edit this course');
    });

    test('should return null if course not found', async () => {
      const courseId = chance.word();
      const userId = chance.integer({ min: 1 });
      const updateData = { name: chance.sentence() };

      const mockUser = { id: userId, is_admin: false };

      mockDatabase.queryOne
        .mockResolvedValueOnce(mockUser) // User check
        .mockResolvedValueOnce(null); // Course not found

      const result = await coursesEditService.edit(courseId, updateData, userId);

      expect(result).toBeNull();
    });
  });
});
