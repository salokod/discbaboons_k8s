import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const friendsRequestService = async (requesterId, recipientId) => {
  if (!requesterId) {
    const error = new Error('Requester ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!recipientId) {
    const error = new Error('Recipient ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (requesterId === recipientId) {
    const error = new Error('Cannot send friend request to yourself');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if a request already exists (either direction)
  const existing = await prisma.friendship_requests.findUnique({
    where: {
      requester_id_recipient_id: {
        requester_id: requesterId,
        recipient_id: recipientId,
      },
    },
  });
  if (existing) {
    const error = new Error('Friend request already exists');
    error.name = 'ValidationError';
    throw error;
  }

  // Check for reverse request
  const reverse = await prisma.friendship_requests.findUnique({
    where: {
      requester_id_recipient_id: {
        requester_id: recipientId,
        recipient_id: requesterId,
      },
    },
  });
  if (reverse && reverse.status !== 'denied') {
    const error = new Error('Friend request already exists');
    error.name = 'ValidationError';
    throw error;
  }

  // Create new friend request
  const newRequest = await prisma.friendship_requests.create({
    data: {
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    },
  });

  return newRequest;
};

export default friendsRequestService;
