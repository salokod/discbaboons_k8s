import { queryRows, queryOne } from '../lib/database.js';
import { validateUserId, validateQueryParams } from '../lib/validation.js';

const getFriendsListService = async (userId, options = {}) => {
  // Validate user ID format to prevent database errors
  const validatedUserId = validateUserId(userId);

  // Parse pagination options with robust validation
  const parsedLimit = parseInt(options.limit, 10);
  const parsedOffset = parseInt(options.offset, 10);

  const limit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 20 : parsedLimit, 1), 100);
  const offset = Math.max(Number.isNaN(parsedOffset) ? 0 : parsedOffset, 0);

  // Optimized single query with JOINs to get all friend data and bag statistics
  const friendsQuery = `
    WITH friend_bag_stats AS (
      SELECT 
        user_id,
        COUNT(*) as total_bags,
        COUNT(*) FILTER (WHERE is_public = true) as public_bags,
        COUNT(*) FILTER (WHERE is_public = true OR is_friends_visible = true) as visible_bags
      FROM bags
      GROUP BY user_id
    )
    SELECT 
      CASE 
        WHEN fr.requester_id = $1 THEN fr.recipient_id 
        ELSE fr.requester_id 
      END as friend_id,
      u.username,
      fr.id as friendship_id,
      fr.status as friendship_status,
      fr.created_at as friendship_created_at,
      COALESCE(fbs.total_bags, 0) as total_bags,
      COALESCE(fbs.public_bags, 0) as public_bags,
      COALESCE(fbs.visible_bags, 0) as visible_bags
    FROM friendship_requests fr
    JOIN users u ON (
      CASE 
        WHEN fr.requester_id = $1 THEN u.id = fr.recipient_id 
        ELSE u.id = fr.requester_id 
      END
    )
    LEFT JOIN friend_bag_stats fbs ON fbs.user_id = u.id
    WHERE fr.status = 'accepted'
      AND (fr.requester_id = $1 OR fr.recipient_id = $1)
    ORDER BY fr.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as count
    FROM friendship_requests
    WHERE status = 'accepted'
      AND (requester_id = $1 OR recipient_id = $1)
  `;

  // Validate query parameters before database execution
  const friendsQueryParams = validateQueryParams([validatedUserId, limit, offset]);
  const countQueryParams = validateQueryParams([validatedUserId]);

  // Execute both queries with performance monitoring
  const [friendsData, totalResult] = await Promise.all([
    queryRows(friendsQuery, friendsQueryParams, {
      slowQueryThreshold: 500, // Friends query should be fast
      logPerformance: true,
    }),
    queryOne(countQuery, countQueryParams, {
      slowQueryThreshold: 200, // Count query should be very fast
    }),
  ]);

  const total = parseInt(totalResult.count, 10);
  const hasMore = offset + limit < total;

  // Transform the query results into the expected format
  const friends = friendsData.map((row) => ({
    id: row.friend_id,
    username: row.username,
    // Note: email is intentionally excluded for privacy
    friendship: {
      id: row.friendship_id,
      status: row.friendship_status,
      created_at: row.friendship_created_at,
    },
    bag_stats: {
      total_bags: parseInt(row.total_bags, 10),
      visible_bags: parseInt(row.visible_bags, 10),
      public_bags: parseInt(row.public_bags, 10),
    },
  }));

  return {
    friends,
    pagination: {
      total,
      limit,
      offset,
      hasMore,
    },
  };
};

export default getFriendsListService;
