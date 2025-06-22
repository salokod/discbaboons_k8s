import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const respondToFriendRequestService = async (requestId, userId, action) => {
  if (!requestId) {
    const error = new Error('Request ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!['accept', 'deny'].includes(action)) {
    const error = new Error('Action must be "accept" or "deny"');
    error.name = 'ValidationError';
    throw error;
  }

  const request = await prisma.friendship_requests.findUnique({
    where: { id: Number(requestId) },
  });
  if (!request) {
    const error = new Error('Friend request not found');
    error.name = 'NotFoundError';
    throw error;
  }

  if (request.recipient_id !== userId) {
    const error = new Error('Not authorized to respond to this request');
    error.name = 'AuthorizationError';
    throw error;
  }

  if (request.status !== 'pending') {
    const error = new Error('Request is not pending');
    error.name = 'ValidationError';
    throw error;
  }

  // Update the request status
  const updated = await prisma.friendship_requests.update({
    where: { id: Number(requestId) },
    data: { status: action === 'accept' ? 'accepted' : 'denied' },
  });

  return updated;
};

export default respondToFriendRequestService;
