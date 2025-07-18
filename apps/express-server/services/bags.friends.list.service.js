import { queryOne, queryRows } from '../lib/database.js';

const listFriendBagsService = async (userId, friendUserId, dbClient = { queryOne, queryRows }) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!friendUserId) {
    const error = new Error('friendUserId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Verify friendship exists and is accepted
  const friendshipQuery = `
    SELECT id, requester_id, recipient_id, status 
    FROM friendship_requests 
    WHERE status = 'accepted' 
      AND ((requester_id = $1 AND recipient_id = $2) 
           OR (requester_id = $2 AND recipient_id = $1))
    LIMIT 1
  `;

  const friendship = await dbClient.queryOne(friendshipQuery, [userId, friendUserId]);

  if (!friendship) {
    const error = new Error('You are not friends with this user');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Get friend's bags that are visible to friends or public, with disc count
  const bagsQuery = `
    SELECT 
      b.*,
      COUNT(bc.id) as disc_count
    FROM bags b
    LEFT JOIN bag_contents bc ON b.id = bc.bag_id
    WHERE b.user_id = $1 
      AND (b.is_public = true OR b.is_friends_visible = true)
    GROUP BY b.id, b.user_id, b.name, b.description, b.is_public, b.is_friends_visible, b.created_at, b.updated_at
    ORDER BY b.created_at DESC
  `;

  const bags = await dbClient.queryRows(bagsQuery, [friendUserId]);

  return {
    friend: { id: friendUserId },
    bags: bags.map((bag) => ({
      id: bag.id,
      user_id: bag.user_id,
      name: bag.name,
      description: bag.description,
      is_public: bag.is_public,
      is_friends_visible: bag.is_friends_visible,
      created_at: bag.created_at,
      updated_at: bag.updated_at,
      disc_count: parseInt(bag.disc_count, 10),
    })),
  };
};

export default listFriendBagsService;
