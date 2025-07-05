import prisma from '../lib/prisma.js';

const listLostDiscsService = async (userId, options = {}, prismaClient = prisma) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Set default pagination and sorting options
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  const sortField = options.sort || 'lost_at';
  const sortOrder = options.order || 'desc';

  // Query for user's lost discs
  const lostDiscs = await prismaClient.bag_contents.findMany({
    where: {
      user_id: userId,
      is_lost: true,
    },
    include: {
      disc_master: true,
    },
    take: limit,
    skip: offset,
    orderBy: {
      [sortField]: sortOrder,
    },
  });

  // Merge custom flight numbers and disc names with disc_master fallbacks
  const mergedLostDiscs = lostDiscs.map((content) => ({
    ...content,
    speed: content.speed ?? content.disc_master.speed,
    glide: content.glide ?? content.disc_master.glide,
    turn: content.turn ?? content.disc_master.turn,
    fade: content.fade ?? content.disc_master.fade,
    brand: content.brand ?? content.disc_master.brand,
    model: content.model ?? content.disc_master.model,
  }));

  // Return results with pagination metadata
  return {
    lost_discs: mergedLostDiscs,
    pagination: {
      total: mergedLostDiscs.length,
      limit,
      offset,
      has_more: mergedLostDiscs.length === limit,
    },
  };
};

export default listLostDiscsService;
