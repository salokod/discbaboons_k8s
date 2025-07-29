import { queryOne, queryRows } from '../lib/database.js';
import { processCoursesCoordinates } from '../lib/coordinates.js';

const coursesSearchService = async (filters = {}, userId = null) => {
  // Validate boolean filters
  if (filters.is_user_submitted !== undefined && typeof filters.is_user_submitted !== 'boolean') {
    const error = new Error('is_user_submitted must be a boolean value (true or false)');
    error.name = 'ValidationError';
    throw error;
  }
  if (filters.approved !== undefined && typeof filters.approved !== 'boolean') {
    const error = new Error('approved must be a boolean value (true or false)');
    error.name = 'ValidationError';
    throw error;
  }

  // Build WHERE conditions
  const whereConditions = [];
  const params = [];

  // Base visibility rules: approved courses OR user's own unapproved courses
  // OR friend's unapproved courses
  if (userId) {
    // Use a more efficient approach with EXISTS instead of IN subquery
    whereConditions.push(`(
      approved = true 
      OR submitted_by_id = $${params.length + 1}
      OR (approved = false AND EXISTS (
        SELECT 1 FROM friendship_requests fr
        WHERE fr.status = 'accepted' 
          AND ((fr.requester_id = $${params.length + 1} AND fr.recipient_id = courses.submitted_by_id)
               OR (fr.recipient_id = $${params.length + 1} AND fr.requester_id = courses.submitted_by_id))
      ))
    )`);
    params.push(userId);
  } else {
    // No user context - only show approved courses
    whereConditions.push('approved = true');
  }

  // Country filter (new for international support)
  if (filters.country) {
    whereConditions.push(`country ILIKE $${params.length + 1}`);
    params.push(`%${filters.country}%`);
  }

  // State/Province filter (updated field name)
  if (filters.stateProvince || filters.state) {
    // Support both old 'state' and new 'stateProvince' for backward compatibility
    const stateValue = filters.stateProvince || filters.state;
    whereConditions.push(`state_province ILIKE $${params.length + 1}`);
    params.push(`%${stateValue}%`);
  }

  if (filters.city) {
    whereConditions.push(`city ILIKE $${params.length + 1}`);
    params.push(`%${filters.city}%`);
  }

  if (filters.name) {
    whereConditions.push(`name ILIKE $${params.length + 1}`);
    params.push(`%${filters.name}%`);
  }

  // is_user_submitted filter (boolean)
  if (filters.is_user_submitted !== undefined) {
    whereConditions.push(`is_user_submitted = $${params.length + 1}`);
    params.push(filters.is_user_submitted);
  }

  // approved filter (boolean)
  if (filters.approved !== undefined) {
    whereConditions.push(`approved = $${params.length + 1}`);
    params.push(filters.approved);
  }

  const whereClause = whereConditions.join(' AND ');

  // Pagination parameters
  const limit = Math.min(parseInt(filters.limit, 10) || 50, 500); // Default 50, max 500
  const offset = parseInt(filters.offset, 10) || 0;

  // Get total count for pagination metadata
  const totalResult = await queryOne(
    `SELECT COUNT(*) as count FROM courses WHERE ${whereClause}`,
    params,
  );
  const total = parseInt(totalResult.count, 10);

  // Get paginated results (updated ordering for international support)
  const courses = await queryRows(
    `SELECT * FROM courses WHERE ${whereClause} ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  return {
    courses: processCoursesCoordinates(courses),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
};

export default coursesSearchService;
