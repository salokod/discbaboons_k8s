import prisma from '../lib/prisma.js';

const updateBagService = async (userId, bagId, updateData, prismaClient = prisma) => {
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

  if (!updateData || Object.keys(updateData).length === 0) {
    const error = new Error('updateData is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Update bag with user ownership validation
  const updateResult = await prismaClient.bags.updateMany({
    where: {
      id: bagId,
      user_id: userId,
    },
    data: updateData,
  });

  // If no rows were updated, bag doesn't exist or user doesn't own it
  if (updateResult.count === 0) {
    return null;
  }

  // Return the updated bag
  const updatedBag = await prismaClient.bags.findFirst({
    where: {
      id: bagId,
      user_id: userId,
    },
  });

  return updatedBag;
};

export default updateBagService;
