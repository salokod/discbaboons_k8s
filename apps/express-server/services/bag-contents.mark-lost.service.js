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
    // Marking as lost: remove from bag, set notes and current timestamp
    updateData.bag_id = null; // Remove from bag when lost
    updateData.lost_notes = lostData.lost_notes || null;
    updateData.lost_at = new Date();
  } else {
    // Marking as found: clear lost data and require bag assignment
    updateData.lost_notes = null;
    updateData.lost_at = null;

    // bag_id is required when marking as found
    if (!lostData.bag_id) {
      const error = new Error('bag_id is required when marking disc as found');
      error.name = 'ValidationError';
      throw error;
    }

    // Validate UUID format for bag_id
    if (!uuidRegex.test(lostData.bag_id)) {
      const error = new Error('Invalid bag_id format');
      error.name = 'ValidationError';
      throw error;
    }

    // Validate user owns the target bag
    const targetBag = await prismaClient.bags.findFirst({
      where: {
        id: lostData.bag_id,
        user_id: userId,
      },
    });

    if (!targetBag) {
      const error = new Error('Target bag not found or access denied');
      error.name = 'AuthorizationError';
      throw error;
    }

    updateData.bag_id = lostData.bag_id; // Assign to target bag
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
