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

  // Create bag content
  const bagContent = await prismaClient.bag_contents.create({
    data: {
      bag_id: bagId,
      disc_id: discData.disc_id,
      notes: discData.notes || null,
      weight: discData.weight || null,
      condition: discData.condition || 'good',
      plastic_type: discData.plastic_type || null,
      color: discData.color || null,
      is_lost: false,
    },
  });

  return bagContent;
};

export default addToBagService;
