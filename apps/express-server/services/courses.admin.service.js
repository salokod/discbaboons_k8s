import { queryOne, queryRows } from '../lib/database.js';
import { processCourseCoordinates, processCoursesCoordinates } from '../lib/coordinates.js';

const listPending = async (filters = {}) => {
  // Pagination parameters
  const limit = Math.min(parseInt(filters.limit, 10) || 50, 500);
  const offset = parseInt(filters.offset, 10) || 0;

  // Get total count of pending courses (unreviewed user submissions)
  const totalResult = await queryOne(
    'SELECT COUNT(*) as count FROM courses WHERE is_user_submitted = true AND reviewed_at IS NULL',
    [],
  );
  const total = parseInt(totalResult.count, 10);

  // Get paginated pending courses (unreviewed user submissions)
  const courses = await queryRows(
    'SELECT * FROM courses WHERE is_user_submitted = true AND reviewed_at IS NULL ORDER BY created_at ASC LIMIT $1 OFFSET $2',
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

const approve = async (courseId, approved, adminNotes = null, adminUserId = null) => {
  const course = await queryOne(
    'UPDATE courses SET approved = $1, admin_notes = $2, reviewed_at = NOW(), reviewed_by_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [approved, adminNotes, adminUserId, courseId],
  );

  return processCourseCoordinates(course);
};

const coursesAdminService = {
  listPending,
  approve,
};

export default coursesAdminService;
