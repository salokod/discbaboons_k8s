import prisma from '../lib/prisma.js';

const listFriendBagsService = async (userId, friendUserId, prismaClient = prisma) => {
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
  const friendship = await prismaClient.friendship_requests.findFirst({
    where: {
      OR: [
        {
          requester_id: userId,
          recipient_id: friendUserId,
          status: 'accepted',
        },
        {
          requester_id: friendUserId,
          recipient_id: userId,
          status: 'accepted',
        },
      ],
    },
  });

  if (!friendship) {
    const error = new Error('You are not friends with this user');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Get friend's bags that are visible to friends or public
  const bags = await prismaClient.bags.findMany({
    where: {
      user_id: friendUserId,
      OR: [
        { is_public: true },
        { is_friends_visible: true },
      ],
    },
    include: {
      _count: {
        select: { bag_contents: true },
      },
    },
  });

  return {
    friend: { id: friendUserId },
    bags: bags.map((bag) => ({
      ...bag,
      disc_count: bag._count.bag_contents,
    })),
  };
};

export default listFriendBagsService;
