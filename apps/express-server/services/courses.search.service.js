import { queryOne, queryRows } from '../lib/database.js';

const coursesSearchService = async (filters = {}, userId = null) => {
  // Build WHERE conditions
  const whereConditions = [];
  const params = [];

  // Base visibility rules: approved courses OR user's own unapproved courses
  // OR friend's unapproved courses
  if (userId) {
    whereConditions.push(`(
      approved = true 
      OR submitted_by_id = $${params.length + 1}
      OR (approved = false AND submitted_by_id IN (
        SELECT CASE 
          WHEN requester_id = $${params.length + 1} THEN recipient_id
          WHEN recipient_id = $${params.length + 1} THEN requester_id
        END as friend_id
        FROM friendship_requests 
        WHERE status = 'accepted' 
          AND (requester_id = $${params.length + 1} OR recipient_id = $${params.length + 1})
      ))
    )`);
    params.push(userId);
  } else {
    // No user context - only show approved courses
    whereConditions.push('approved = true');
  }

  // Country filter (new for international support)
  if (filters.country) {
    whereConditions.push(`country = $${params.length + 1}`);
    params.push(filters.country.toUpperCase());
  }

  // State/Province filter (updated field name)
  if (filters.stateProvince || filters.state) {
    // Support both old 'state' and new 'stateProvince' for backward compatibility
    const stateValue = filters.stateProvince || filters.state;
    whereConditions.push(`state_province = $${params.length + 1}`);
    params.push(stateValue);
  }

  if (filters.city) {
    whereConditions.push(`city = $${params.length + 1}`);
    params.push(filters.city);
  }

  if (filters.name) {
    whereConditions.push(`name ILIKE $${params.length + 1}`);
    params.push(`%${filters.name}%`);
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
    courses,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
};

export default coursesSearchService;
