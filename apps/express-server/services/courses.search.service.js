import { queryOne, queryRows } from '../lib/database.js';

const coursesSearchService = async (filters = {}) => {
  // Build WHERE conditions
  const whereConditions = ['approved = true'];
  const params = [];

  if (filters.state) {
    whereConditions.push(`state = $${params.length + 1}`);
    params.push(filters.state);
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

  // Get paginated results
  const courses = await queryRows(
    `SELECT * FROM courses WHERE ${whereClause} ORDER BY state ASC, city ASC, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
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
