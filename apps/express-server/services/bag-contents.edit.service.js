import prisma from '../lib/prisma.js';

const editBagContentService = async (
  userId,
  bagId,
  contentId,
  updateData,
  prismaClient = prisma,
) => {
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

  if (!contentId) {
    const error = new Error('contentId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!updateData) {
    const error = new Error('updateData is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate flight numbers if provided
  if (updateData.speed !== undefined && updateData.speed !== null) {
    if (updateData.speed < 1 || updateData.speed > 15) {
      const error = new Error('speed must be between 1 and 15');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.glide !== undefined && updateData.glide !== null) {
    if (updateData.glide < 1 || updateData.glide > 7) {
      const error = new Error('glide must be between 1 and 7');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.turn !== undefined && updateData.turn !== null) {
    if (updateData.turn < -5 || updateData.turn > 2) {
      const error = new Error('turn must be between -5 and 2');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.fade !== undefined && updateData.fade !== null) {
    if (updateData.fade < 0 || updateData.fade > 5) {
      const error = new Error('fade must be between 0 and 5');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Validate custom brand/model if provided
  if (updateData.brand !== undefined && updateData.brand !== null) {
    if (typeof updateData.brand !== 'string' || updateData.brand.length > 50) {
      const error = new Error('brand must be a string with maximum 50 characters');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.model !== undefined && updateData.model !== null) {
    if (typeof updateData.model !== 'string' || updateData.model.length > 50) {
      const error = new Error('model must be a string with maximum 50 characters');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Find the bag content and verify user owns the bag
  const existingContent = await prismaClient.bag_contents.findFirst({
    where: {
      id: contentId,
      bag_id: bagId,
      bags: {
        user_id: userId,
      },
    },
    include: {
      bags: true,
    },
  });

  if (!existingContent) {
    const error = new Error('Content not found or access denied');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Update the bag content
  const updatedContent = await prismaClient.bag_contents.update({
    where: {
      id: contentId,
    },
    data: updateData,
  });

  return updatedContent;
};

export default editBagContentService;
