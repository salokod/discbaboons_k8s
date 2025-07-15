import prisma from '../lib/prisma.js';

const getFriendBagService = async (userId, friendUserId, bagId, prismaClient = prisma) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!friendUserId) {
    const error = new Error('friendUserId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bagId)) {
    const error = new Error('Invalid bagId format');
    error.name = 'ValidationError';
    throw error;
  }

  // Verify friendship exists and is accepted (bidirectional)
  const friendship = await prismaClient.friendship_requests.findFirst({
    where: {
      OR: [
        {
          requester_id: userId,
          recipient_id: friendUserId,
          status: 'accepted'
        },
        {
          requester_id: friendUserId,
          recipient_id: userId,
          status: 'accepted'
        }
      ]
    }
  });

  if (!friendship) {
    const error = new Error('You are not friends with this user');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Get the specific bag if it's visible to friends or public
  const bag = await prismaClient.bags.findFirst({
    where: {
      id: bagId,
      user_id: friendUserId,
      OR: [
        { is_public: true },
        { is_friends_visible: true }
      ]
    },
    include: {
      bag_contents: {
        where: {
          is_lost: false
        },
        include: {
          disc_master: true
        }
      }
    }
  });

  if (!bag) {
    const error = new Error('Bag not found or not visible');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Transform bag contents to include personal data with fallbacks
  const contents = bag.bag_contents.map(content => ({
    id: content.id,
    disc: content.disc_master,
    notes: content.notes,
    weight: content.weight,
    condition: content.condition,
    plastic_type: content.plastic_type,
    color: content.color,
    speed: content.speed || content.disc_master.speed,
    glide: content.glide || content.disc_master.glide,
    turn: content.turn || content.disc_master.turn,
    fade: content.fade || content.disc_master.fade,
    brand: content.brand || content.disc_master.brand,
    model: content.model || content.disc_master.model,
    added_at: content.added_at,
    updated_at: content.updated_at
  }));

  // Remove bag_contents from bag object and add transformed contents
  const { bag_contents, ...bagData } = bag;

  return {
    friend: { id: friendUserId },
    bag: {
      ...bagData,
      contents
    }
  };
};

export default getFriendBagService;
