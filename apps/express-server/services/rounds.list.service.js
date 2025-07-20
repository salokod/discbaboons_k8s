import { queryOne, queryRows } from '../lib/database.js';

const roundsListService = async (userId, filters = {}) => {
  // Validate required userId
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate and convert query parameters
  const validatedFilters = { ...filters };

  // Validate status filter
  if (filters.status && !['in_progress', 'completed', 'cancelled'].includes(filters.status)) {
    const error = new Error('Status must be one of: in_progress, completed, cancelled');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate and convert boolean filters
  if (filters.is_private !== undefined) {
    if (filters.is_private === 'true') {
      validatedFilters.is_private = true;
    } else if (filters.is_private === 'false') {
      validatedFilters.is_private = false;
    } else if (typeof filters.is_private !== 'boolean') {
      const error = new Error('is_private must be a boolean value (true or false)');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (filters.skins_enabled !== undefined) {
    if (filters.skins_enabled === 'true') {
      validatedFilters.skins_enabled = true;
    } else if (filters.skins_enabled === 'false') {
      validatedFilters.skins_enabled = false;
    } else if (typeof filters.skins_enabled !== 'boolean') {
      const error = new Error('skins_enabled must be a boolean value (true or false)');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Build WHERE conditions
  const whereConditions = ['created_by_id = $1'];
  const params = [userId];

  // Add status filter if provided
  if (validatedFilters.status) {
    whereConditions.push(`status = $${params.length + 1}`);
    params.push(validatedFilters.status);
  }

  // Add is_private filter if provided
  if (validatedFilters.is_private !== undefined) {
    whereConditions.push(`is_private = $${params.length + 1}`);
    params.push(validatedFilters.is_private);
  }

  // Add skins_enabled filter if provided
  if (validatedFilters.skins_enabled !== undefined) {
    whereConditions.push(`skins_enabled = $${params.length + 1}`);
    params.push(validatedFilters.skins_enabled);
  }

  // Add name filter if provided (case-insensitive partial match)
  if (validatedFilters.name) {
    whereConditions.push(`name ILIKE $${params.length + 1}`);
    params.push(`%${validatedFilters.name}%`);
  }

  // Get total count first (for pagination metadata) - use current params before adding limit/offset
  const countQuery = `SELECT COUNT(*) FROM rounds WHERE ${whereConditions.join(' AND ')}`;
  const countResult = await queryOne(countQuery, [...params]); // Use copy of params
  const total = parseInt(countResult.count, 10);

  // Add pagination
  const limit = Math.min(parseInt(validatedFilters.limit, 10) || 50, 500); // Default 50, max 500
  const offset = parseInt(validatedFilters.offset, 10) || 0; // Default offset

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
