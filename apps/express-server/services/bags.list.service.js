import { queryRows, queryOne } from '../lib/database.js';

const listBagsService = async (userId, options = {}) => {
  // Validate required userId
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate and extract pagination parameters
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(options.offset, 10) || 0, 0);

  // Get bags with disc count
  const bagsQuery = `
    SELECT 
      b.id,
      b.user_id,
      b.name,
      b.description,
      b.is_public,
      b.is_friends_visible,
      b.created_at,
      b.updated_at,
      COUNT(bc.id) as disc_count
    FROM bags b
    LEFT JOIN bag_contents bc ON b.id = bc.bag_id
    WHERE b.user_id = $1
    GROUP BY b.id, b.user_id, b.name, b.description, b.is_public, b.is_friends_visible, b.created_at, b.updated_at
    ORDER BY b.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const bags = await queryRows(bagsQuery, [userId, limit, offset]);

  // Get total count of bags
  const countQuery = `
    SELECT COUNT(*) as count
    FROM bags
    WHERE user_id = $1
  `;

  const countResult = await queryOne(countQuery, [userId]);
  const total = parseInt(countResult.count, 10);
  const hasMore = offset + limit < total;

  // Transform bags to include disc_count as integer
  const bagsWithDiscCount = bags.map((bag) => ({
    ...bag,
    disc_count: parseInt(bag.disc_count, 10),
  }));

  return {
    bags: bagsWithDiscCount,
    pagination: {
      total,
      limit,
      offset,
      hasMore,
    },
  };
};

export default listBagsService;
