import { queryOne, queryRows } from '../lib/database.js';
import { processCourseCoordinates, processCoursesCoordinates } from '../lib/coordinates.js';

const listPending = async (filters = {}) => {
  // Pagination parameters
  const limit = Math.min(parseInt(filters.limit, 10) || 50, 500);
  const offset = parseInt(filters.offset, 10) || 0;

  // Get total count of pending courses
  const totalResult = await queryOne(
    'SELECT COUNT(*) as count FROM courses WHERE approved = false AND is_user_submitted = true',
    [],
  );
  const total = parseInt(totalResult.count, 10);

  // Get paginated pending courses
  const courses = await queryRows(
    'SELECT * FROM courses WHERE approved = false AND is_user_submitted = true ORDER BY created_at ASC LIMIT $1 OFFSET $2',
    [limit, offset],
  );

  return {
    courses: processCoursesCoordinates(courses),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
};

const approve = async (courseId, approved, adminNotes = null) => {
  const course = await queryOne(
    'UPDATE courses SET approved = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [approved, adminNotes, courseId],
  );

  return processCourseCoordinates(course);
};

const coursesAdminService = {
  listPending,
  approve,
};

export default coursesAdminService;
