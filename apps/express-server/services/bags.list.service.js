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
    include: {
      _count: {
        select: { bag_contents: true },
      },
    },
  });

  const total = await prismaClient.bags.count({
    where: { user_id: userId },
  });

  // Transform bags to include disc_count from actual bag_contents relationship
  const bagsWithDiscCount = bags.map((bag) => ({
    ...bag,
    disc_count: bag._count.bag_contents,
  }));

  return { bags: bagsWithDiscCount, total };
};

export default listBagsService;
