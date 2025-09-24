import { queryOne } from '../lib/database.js';

const cancelFriendRequestService = async (userId, requestId, dbClient = { queryOne }) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!requestId) {
    const error = new Error('Request ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if the request exists
  const request = await dbClient.queryOne(
    'SELECT * FROM friendship_requests WHERE id = $1',
    [requestId],
  );

  if (!request) {
    const error = new Error('Friend request not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check if the user is the requester (only requesters can cancel)
  if (request.requester_id !== userId) {
    const error = new Error('You can only cancel your own friend requests');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Check if the request is still pending
  if (request.status !== 'pending') {
    const error = new Error('Only pending requests can be canceled');
    error.name = 'ValidationError';
    throw error;
  }

  // Update the request status to canceled
  const canceledRequest = await dbClient.queryOne(
    'UPDATE friendship_requests SET status = $1 WHERE id = $2 RETURNING *',
    ['canceled', requestId],
  );

  return canceledRequest;
};

export default cancelFriendRequestService;
