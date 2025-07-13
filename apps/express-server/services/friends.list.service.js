import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getFriendsListService = async (userId) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Get all accepted friendships where user is either requester or recipient
  const friendships = await prisma.friendship_requests.findMany({
    where: {
      status: 'accepted',
      OR: [
        { requester_id: userId },
        { recipient_id: userId },
      ],
    },
  });

  // Transform each friendship into enhanced friend data
  const enhancedFriends = await Promise.all(
    friendships.map(async (friendship) => {
      // Determine who the friend is (the other person in the friendship)
      const friendUserId = friendship.requester_id === userId
        ? friendship.recipient_id
        : friendship.requester_id;

      // Get friend's user details
      const friendUser = await prisma.users.findUnique({
        where: { id: friendUserId },
        select: { id: true, username: true, email: true },
      });

      // Get friend's bag statistics
      const totalBags = await prisma.bags.count({
        where: { user_id: friendUserId },
      });

      const publicBags = await prisma.bags.count({
        where: {
          user_id: friendUserId,
          is_public: true,
        },
      });

      const visibleBags = await prisma.bags.count({
        where: {
          user_id: friendUserId,
          OR: [
            { is_public: true },
            { is_friends_visible: true },
          ],
        },
      });

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
