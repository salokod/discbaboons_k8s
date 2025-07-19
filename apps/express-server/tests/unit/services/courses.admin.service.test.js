import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import coursesAdminService from '../../../services/courses.admin.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
  mockDatabase.queryRows.mockClear();
});

describe('coursesAdminService', () => {
  test('should export an object with listPending and approve functions', () => {
    expect(typeof coursesAdminService).toBe('object');
    expect(typeof coursesAdminService.listPending).toBe('function');
    expect(typeof coursesAdminService.approve).toBe('function');
  });

  describe('listPending', () => {
    test('should return pending courses with pagination', async () => {
      const mockCourses = [
        {
          id: chance.word(),
          name: chance.sentence(),
          city: chance.city(),
          state_province: chance.state({ abbreviated: true }),
          country: 'US',
          hole_count: chance.integer({ min: 9, max: 27 }),
          approved: false,
          is_user_submitted: true,
          submitted_by_id: chance.integer({ min: 1 }),
        },
      ];

      mockDatabase.queryOne.mockResolvedValue({ count: '1' });
      mockDatabase.queryRows.mockResolvedValue(mockCourses);

      const result = await coursesAdminService.listPending();

      expect(mockDatabase.queryOne).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM courses WHERE approved = false AND is_user_submitted = true',
        [],
      );
      expect(mockDatabase.queryRows).toHaveBeenCalledWith(
        'SELECT * FROM courses WHERE approved = false AND is_user_submitted = true ORDER BY created_at ASC LIMIT $1 OFFSET $2',
        [50, 0],
      );
      expect(result.courses).toEqual(mockCourses);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });
  });

  describe('approve', () => {
    test('should approve a course and return updated course', async () => {
      const courseId = chance.word();
      const adminNotes = chance.sentence();
      const mockCourse = {
        id: courseId,
        name: chance.sentence(),
        approved: true,
        admin_notes: adminNotes,
      };

      mockDatabase.queryOne.mockResolvedValue(mockCourse);

      const result = await coursesAdminService.approve(courseId, true, adminNotes);

      expect(mockDatabase.queryOne).toHaveBeenCalledWith(
        'UPDATE courses SET approved = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [true, adminNotes, courseId],
      );
      expect(result).toEqual(mockCourse);
    });

    test('should reject a course and return updated course', async () => {
      const courseId = chance.word();
      const adminNotes = chance.sentence();
      const mockCourse = {
        id: courseId,
        name: chance.sentence(),
        approved: false,
        admin_notes: adminNotes,
      };

      mockDatabase.queryOne.mockResolvedValue(mockCourse);

      const result = await coursesAdminService.approve(courseId, false, adminNotes);

      expect(mockDatabase.queryOne).toHaveBeenCalledWith(
        'UPDATE courses SET approved = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [false, adminNotes, courseId],
      );
      expect(result).toEqual(mockCourse);
    });

    test('should return null if course not found', async () => {
      const courseId = chance.word();

      mockDatabase.queryOne.mockResolvedValue(null);

      const result = await coursesAdminService.approve(courseId, true);

      expect(result).toBeNull();
    });
  });
});
