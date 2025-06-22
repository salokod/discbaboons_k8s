import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getFriendRequestsService = async (userId, type) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!type) {
    const error = new Error('Type is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!['incoming', 'outgoing', 'all'].includes(type)) {
    const error = new Error('Type must be "incoming", "outgoing", or "all"');
    error.name = 'ValidationError';
    throw error;
  }

  if (type === 'incoming') {
    return prisma.friendship_requests.findMany({
      where: { recipient_id: userId, status: 'pending' },
    });
  }
  if (type === 'outgoing') {
    return prisma.friendship_requests.findMany({
      where: { requester_id: userId, status: 'pending' },
    });
  }
  if (type === 'all') {
    return prisma.friendship_requests.findMany({
      where: {
        status: 'pending',
        OR: [
          { recipient_id: userId },
          { requester_id: userId },
        ],
      },
    });
  }
  return [];
};

export default getFriendRequestsService;
