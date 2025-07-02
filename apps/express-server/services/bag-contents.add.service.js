import prisma from '../lib/prisma.js';

const addToBagService = async (userId, bagId, discData, prismaClient = prisma) => {
  if (!userId) {
    const error = new Error('user_id is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bag_id is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!discData.disc_id) {
    const error = new Error('disc_id is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate bag ownership (security-first approach)
  const bag = await prismaClient.bags.findFirst({
    where: {
      id: bagId,
      user_id: userId,
    },
  });

  if (!bag) {
    const error = new Error('Bag not found or access denied');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Validate disc exists
  const disc = await prismaClient.disc_master.findUnique({
    where: {
      id: discData.disc_id,
    },
  });

  if (!disc) {
    const error = new Error('Disc not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Validate disc approval status and ownership for pending discs
  if (!disc.approved && disc.added_by_id !== userId) {
    const error = new Error('Cannot add pending disc created by another user');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Validate flight numbers if provided
  if (discData.speed !== undefined && discData.speed !== null) {
    if (discData.speed < 1 || discData.speed > 15) {
      const error = new Error('speed must be between 1 and 15');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (discData.glide !== undefined && discData.glide !== null) {
    if (discData.glide < 1 || discData.glide > 7) {
      const error = new Error('glide must be between 1 and 7');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (discData.turn !== undefined && discData.turn !== null) {
    if (discData.turn < -5 || discData.turn > 2) {
      const error = new Error('turn must be between -5 and 2');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (discData.fade !== undefined && discData.fade !== null) {
    if (discData.fade < 0 || discData.fade > 5) {
      const error = new Error('fade must be between 0 and 5');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Create bag content
  const bagContent = await prismaClient.bag_contents.create({
    data: {
      user_id: userId,
      bag_id: bagId,
      disc_id: discData.disc_id,
      notes: discData.notes || null,
      weight: discData.weight || null,
      condition: discData.condition || null,
      plastic_type: discData.plastic_type || null,
      color: discData.color || null,
      speed: discData.speed || null,
      glide: discData.glide || null,
      turn: discData.turn || null,
      fade: discData.fade || null,
      is_lost: false,
    },
  });

  return bagContent;
};

export default addToBagService;
