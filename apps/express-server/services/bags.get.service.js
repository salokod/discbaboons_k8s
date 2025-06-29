import prisma from '../lib/prisma.js';

const getBagService = async (userId, bagId, prismaClient = prisma) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Find bag and ensure user owns it (security)
  const bag = await prismaClient.bags.findFirst({
    where: {
      id: bagId,
      user_id: userId,
    },
  });

  return bag;
};

export default getBagService;
