import prisma from '../lib/prisma.js';

const getBagService = async (userId, bagId, includeLost = false, prismaClient = prisma) => {
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

  // Validate UUID format - if invalid, return null instead of letting Prisma throw
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bagId)) {
    return null; // Invalid UUID format, bag not found
  }

  // Find bag and ensure user owns it (security)
  const bag = await prismaClient.bags.findFirst({
    where: {
      id: bagId,
      user_id: userId,
    },
    include: {
      bag_contents: {
        ...(includeLost ? {} : { where: { is_lost: false } }),
        include: {
          disc_master: true,
        },
      },
    },
  });

  return bag;
};

export default getBagService;
