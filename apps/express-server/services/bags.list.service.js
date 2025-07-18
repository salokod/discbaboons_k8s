import { queryRows, queryOne } from '../lib/database.js';

const listBagsService = async (userId) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

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
  `;

  const bags = await queryRows(bagsQuery, [userId]);

  // Get total count of bags
  const countQuery = `
    SELECT COUNT(*) as count
    FROM bags
    WHERE user_id = $1
  `;

  const countResult = await queryOne(countQuery, [userId]);
  const total = parseInt(countResult.count, 10);

  // Transform bags to include disc_count as integer
  const bagsWithDiscCount = bags.map((bag) => ({
    ...bag,
    disc_count: parseInt(bag.disc_count, 10),
  }));

  return { bags: bagsWithDiscCount, total };
};

export default listBagsService;
