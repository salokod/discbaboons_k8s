/* eslint-disable no-underscore-dangle */
import prisma from '../lib/prisma.js';

const listBagsService = async (userId, prismaClient = prisma) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  const bags = await prismaClient.bags.findMany({
    where: { user_id: userId },
    // Note: bag_contents table doesn't exist yet (Phase 2)
    // include: {
    //   _count: {
    //     select: { bag_contents: true },
    //   },
    // },
  });

  const total = await prismaClient.bags.count({
    where: { user_id: userId },
  });

  // Transform bags to include disc_count (0 for now, since bag_contents doesn't exist yet)
  const bagsWithDiscCount = bags.map((bag) => ({
    ...bag,
    disc_count: 0, // Will be actual count once bag_contents table exists
  }));

  return { bags: bagsWithDiscCount, total };
};

export default listBagsService;
