import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getFriendsListService = async (userId) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  return prisma.friendship_requests.findMany({
    where: {
      status: 'accepted',
      OR: [
        { requester_id: userId },
        { recipient_id: userId },
      ],
    },
  });
};

export default getFriendsListService;
