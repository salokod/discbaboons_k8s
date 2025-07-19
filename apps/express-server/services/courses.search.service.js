import { queryOne, queryRows } from '../lib/database.js';

const coursesSearchService = async (filters = {}) => {
  // Build WHERE conditions
  const whereConditions = ['approved = true'];
  const params = [];

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
