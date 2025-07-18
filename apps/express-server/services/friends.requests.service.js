import { queryRows } from '../lib/database.js';

const getFriendRequestsService = async (userId, type, dbClient = { queryRows }) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!type) {
    const error = new Error('Type is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!['incoming', 'outgoing', 'all'].includes(type)) {
    const error = new Error('Type must be "incoming", "outgoing", or "all"');
    error.name = 'ValidationError';
    throw error;
  }

  if (type === 'incoming') {
    const query = `
      SELECT * FROM friendship_requests 
      WHERE recipient_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `;
    return dbClient.queryRows(query, [userId]);
  }

  if (type === 'outgoing') {
    const query = `
      SELECT * FROM friendship_requests 
      WHERE requester_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `;
    return dbClient.queryRows(query, [userId]);
  }

  if (type === 'all') {
    const query = `
      SELECT * FROM friendship_requests 
      WHERE status = 'pending' 
        AND (recipient_id = $1 OR requester_id = $1)
      ORDER BY created_at DESC
    `;
    return dbClient.queryRows(query, [userId]);
  }

  return [];
};

export default getFriendRequestsService;
