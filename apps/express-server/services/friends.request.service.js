import { queryOne } from '../lib/database.js';

const friendsRequestService = async (requesterId, recipientId) => {
  // 1. Check for missing IDs first
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
  // 2. Then check for "yourself"
  if (requesterId === recipientId) {
    const error = new Error('Cannot send friend request to yourself');
    error.name = 'ValidationError';
    throw error;
  }

  // 3. Check if a request already exists (either direction)
  const existing = await queryOne(
    'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
    [requesterId, recipientId],
  );
  if (existing && existing.status !== 'denied' && existing.status !== 'canceled') {
    const error = new Error('Friend request already exists');
    error.name = 'ValidationError';
    throw error;
  }

  // 4. Check for reverse request
  const reverse = await queryOne(
    'SELECT id, status FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2',
    [recipientId, requesterId],
  );
  if (reverse && reverse.status !== 'denied' && reverse.status !== 'canceled') {
    const error = new Error('Friend request already exists');
    error.name = 'ValidationError';
    throw error;
  }

  // 5. Create new friend request or reactivate canceled one
  if (existing && existing.status === 'canceled') {
    // Update existing canceled request to pending
    const newRequest = await queryOne(
      'UPDATE friendship_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['pending', existing.id],
    );
    return newRequest;
  }

  // Insert new request
  const newRequest = await queryOne(
    'INSERT INTO friendship_requests (requester_id, recipient_id, status) VALUES ($1, $2, $3) RETURNING *',
    [requesterId, recipientId, 'pending'],
  );
  return newRequest;
};

export default friendsRequestService;
