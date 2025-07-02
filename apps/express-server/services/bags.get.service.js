import prisma from '../lib/prisma.js';

const getBagService = async (userId, bagId, includeLost = false, prismaClient = prisma) => {
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

  // Find bag and ensure user owns it (security)
  const bag = await prismaClient.bags.findFirst({
    where: {
      id: bagId,
      user_id: userId,
    },
    include: {
      bag_contents: {
        ...(includeLost ? {} : { where: { is_lost: false } }),
        include: {
          disc_master: true,
        },
      },
    },
  });

  // Merge flight numbers and disc names: use custom values from bag_contents
  if (bag && bag.bag_contents) {
    bag.bag_contents = bag.bag_contents.map((content) => {
      if (content.disc_master) {
        // Create merged content with flight numbers and disc names
        const mergedContent = {
          ...content,
          speed: content.speed !== null ? content.speed : content.disc_master.speed,
          glide: content.glide !== null ? content.glide : content.disc_master.glide,
          turn: content.turn !== null ? content.turn : content.disc_master.turn,
          fade: content.fade !== null ? content.fade : content.disc_master.fade,
          brand: content.brand !== null ? content.brand : content.disc_master.brand,
          model: content.model !== null ? content.model : content.disc_master.model,
        };
        return mergedContent;
      }
      return content;
    });
  }

  return bag;
};

export default getBagService;
