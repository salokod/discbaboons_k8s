import prisma from '../lib/prisma.js';

const moveDiscService = async (
  userId,
  sourceBagId,
  targetBagId,
  options = {},
  prismaClient = prisma,
) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!sourceBagId) {
    const error = new Error('sourceBagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!targetBagId) {
    const error = new Error('targetBagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format for both bag IDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sourceBagId) || !uuidRegex.test(targetBagId)) {
    return null; // Invalid UUID format, bags not found
  }

  return prismaClient.$transaction(async (transactionClient) => {
    // Validate both bags exist and belong to user
    const sourceBag = await transactionClient.bags.findFirst({
      where: {
        id: sourceBagId,
        user_id: userId,
      },
    });

    if (!sourceBag) {
      const error = new Error('Source bag not found or access denied');
      error.name = 'NotFoundError';
      throw error;
    }

    const targetBag = await transactionClient.bags.findFirst({
      where: {
        id: targetBagId,
        user_id: userId,
      },
    });

    if (!targetBag) {
      const error = new Error('Target bag not found or access denied');
      error.name = 'NotFoundError';
      throw error;
    }

    // Determine which discs to move
    let discsToMove;
    if (options.contentIds && options.contentIds.length > 0) {
      // Move specific discs by ID
      discsToMove = await transactionClient.bag_contents.findMany({
        where: {
          id: { in: options.contentIds },
          bag_id: sourceBagId,
        },
        select: { id: true },
      });
    } else {
      // Move all discs from source bag
      discsToMove = await transactionClient.bag_contents.findMany({
        where: { bag_id: sourceBagId },
        select: { id: true },
      });
    }

    if (discsToMove.length === 0) {
      return { message: 'No discs found to move', movedCount: 0 };
    }

    // Update discs to target bag with new timestamp
    const updateResult = await transactionClient.bag_contents.updateMany({
      where: {
        id: { in: discsToMove.map((disc) => disc.id) },
      },
      data: {
        bag_id: targetBagId,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Discs moved successfully',
      movedCount: updateResult.count,
    };
  });
};

export default moveDiscService;
