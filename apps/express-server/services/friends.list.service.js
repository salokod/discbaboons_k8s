import { queryRows, queryOne } from '../lib/database.js';

const getFriendsListService = async (userId) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Get all accepted friendships where user is either requester or recipient
  const friendshipsQuery = `
    SELECT 
      id,
      requester_id,
      recipient_id,
      status,
      created_at,
      updated_at
    FROM friendship_requests
    WHERE status = 'accepted'
      AND (requester_id = $1 OR recipient_id = $1)
    ORDER BY created_at DESC
  `;

  const friendships = await queryRows(friendshipsQuery, [userId]);

  // Transform each friendship into enhanced friend data
  const enhancedFriends = await Promise.all(
    friendships.map(async (friendship) => {
      // Determine who the friend is (the other person in the friendship)
      const friendUserId = friendship.requester_id === userId
        ? friendship.recipient_id
        : friendship.requester_id;

      // Get friend's user details
      const friendUserQuery = `
        SELECT id, username, email
        FROM users
        WHERE id = $1
      `;

      const friendUser = await queryOne(friendUserQuery, [friendUserId]);

      // Get friend's bag statistics
      const totalBagsQuery = `
        SELECT COUNT(*) as count
        FROM bags
        WHERE user_id = $1
      `;

      const totalBagsResult = await queryOne(totalBagsQuery, [friendUserId]);
      const totalBags = parseInt(totalBagsResult.count, 10);

      const publicBagsQuery = `
        SELECT COUNT(*) as count
        FROM bags
        WHERE user_id = $1 AND is_public = true
      `;

      const publicBagsResult = await queryOne(publicBagsQuery, [friendUserId]);
      const publicBags = parseInt(publicBagsResult.count, 10);

      const visibleBagsQuery = `
        SELECT COUNT(*) as count
        FROM bags
        WHERE user_id = $1 AND (is_public = true OR is_friends_visible = true)
      `;

      const visibleBagsResult = await queryOne(visibleBagsQuery, [friendUserId]);
      const visibleBags = parseInt(visibleBagsResult.count, 10);

      return {
        id: friendUser.id,
        username: friendUser.username,
        email: friendUser.email,
        friendship: {
          id: friendship.id,
          status: friendship.status,
          created_at: friendship.created_at,
        },
        bag_stats: {
          total_bags: totalBags,
          visible_bags: visibleBags,
          public_bags: publicBags,
        },
      };
    }),
  );

  return enhancedFriends;
};

export default getFriendsListService;
