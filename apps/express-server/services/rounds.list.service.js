import { queryOne, queryRows } from '../lib/database.js';

const roundsListService = async (userId, filters = {}) => {
  // Validate required userId
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Build WHERE conditions
  const whereConditions = ['created_by_id = $1'];
  const params = [userId];

  // Add status filter if provided
  if (filters.status) {
    whereConditions.push(`status = $${params.length + 1}`);
    params.push(filters.status);
  }

  // Add is_private filter if provided
  if (filters.is_private !== undefined) {
    whereConditions.push(`is_private = $${params.length + 1}`);
    params.push(filters.is_private);
  }

  // Add skins_enabled filter if provided
  if (filters.skins_enabled !== undefined) {
    whereConditions.push(`skins_enabled = $${params.length + 1}`);
    params.push(filters.skins_enabled);
  }

  // Add name filter if provided (case-insensitive partial match)
  if (filters.name) {
    whereConditions.push(`name ILIKE $${params.length + 1}`);
    params.push(`%${filters.name}%`);
  }

  // Get total count first (for pagination metadata) - use current params before adding limit/offset
  const countQuery = `SELECT COUNT(*) FROM rounds WHERE ${whereConditions.join(' AND ')}`;
  const countResult = await queryOne(countQuery, [...params]); // Use copy of params
  const total = parseInt(countResult.count, 10);

  // Add pagination
  const limit = filters.limit || 50; // Default limit like courses
  const offset = filters.offset || 0; // Default offset

  params.push(limit);
  params.push(offset);

  const query = `SELECT * FROM rounds WHERE ${whereConditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const rounds = await queryRows(query, params);

  // Calculate hasMore
  const hasMore = (offset + limit) < total;

  return {
    rounds,
    total,
    limit,
    offset,
    hasMore,
  };
};

export default roundsListService;
