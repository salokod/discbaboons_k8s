import prisma from '../lib/prisma.js';

const markDiscLostService = async (userId, bagContentId, lostData, prismaClient = prisma) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagContentId) {
    const error = new Error('bagContentId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format - if invalid, return null instead of letting Prisma throw
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bagContentId)) {
    return null; // Invalid UUID format, bag content not found
  }

  if (!lostData) {
    const error = new Error('lostData is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (typeof lostData.is_lost !== 'boolean') {
    const error = new Error('is_lost is required and must be a boolean');
    error.name = 'ValidationError';
    throw error;
  }

  // Find bag content and ensure user owns it (security)
  const bagContent = await prismaClient.bag_contents.findFirst({
    where: {
      id: bagContentId,
      user_id: userId,
    },
  });

  if (!bagContent) {
    return null; // Not found or user doesn't own it
  }

  // Prepare update data based on is_lost status
  const updateData = {
    is_lost: lostData.is_lost,
    updated_at: new Date(), // Always update the timestamp
  };

  if (lostData.is_lost) {
    // Marking as lost: set notes and current timestamp
    updateData.lost_notes = lostData.lost_notes || null;
    updateData.lost_at = new Date();
  } else {
    // Marking as found: clear lost data
    updateData.lost_notes = null;
    updateData.lost_at = null;
  }

  // Update the bag content
  const updatedBagContent = await prismaClient.bag_contents.update({
    where: {
      id: bagContentId,
    },
    data: updateData,
  });

  return updatedBagContent;
};

export default markDiscLostService;
