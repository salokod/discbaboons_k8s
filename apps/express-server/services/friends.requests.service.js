import { queryRows } from '../lib/database.js';

/**
 * Transform incoming request raw data to include nested requester object
 */
function transformIncomingRequest(request) {
  const {
    requester_user_id: requesterUserId,
    requester_username: requesterUsername,
    requester_email: requesterEmail,
    ...requestData
  } = request;

  return {
    ...requestData,
    requester: {
      id: requesterUserId,
      username: requesterUsername,
      email: requesterEmail,
    },
  };
}

/**
 * Transform outgoing request raw data to include nested recipient object
 */
function transformOutgoingRequest(request) {
  const {
    recipient_user_id: recipientUserId,
    recipient_username: recipientUsername,
    recipient_email: recipientEmail,
    ...requestData
  } = request;

  return {
    ...requestData,
    recipient: {
      id: recipientUserId,
      username: recipientUsername,
      email: recipientEmail,
    },
  };
}

/**
 * Transform "all" request data based on user relationship
 */
function transformAllRequest(request, userId) {
  const {
    requester_user_id: requesterUserId,
    requester_username: requesterUsername,
    requester_email: requesterEmail,
    recipient_user_id: recipientUserId,
    recipient_username: recipientUsername,
    recipient_email: recipientEmail,
    ...requestData
  } = request;

  // If user is recipient, include requester data
  if (request.recipient_id === userId) {
    return {
      ...requestData,
      requester: {
        id: requesterUserId,
        username: requesterUsername,
        email: requesterEmail,
      },
    };
  }

  // If user is requester, include recipient data
  return {
    ...requestData,
    recipient: {
      id: recipientUserId,
      username: recipientUsername,
      email: recipientEmail,
    },
  };
}

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
      SELECT fr.*, u.id as requester_user_id, u.username as requester_username, u.email as requester_email
      FROM friendship_requests fr
      JOIN users u ON fr.requester_id = u.id
      WHERE fr.recipient_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;
    const rawResults = await dbClient.queryRows(query, [userId]);
    return rawResults.map(transformIncomingRequest);
  }

  if (type === 'outgoing') {
    const query = `
      SELECT fr.*, u.id as recipient_user_id, u.username as recipient_username, u.email as recipient_email
      FROM friendship_requests fr
      JOIN users u ON fr.recipient_id = u.id
      WHERE fr.requester_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;
    const rawResults = await dbClient.queryRows(query, [userId]);
    return rawResults.map(transformOutgoingRequest);
  }

  if (type === 'all') {
    const query = `
      SELECT fr.*,
        CASE WHEN fr.recipient_id = $1 THEN req_u.id ELSE NULL END as requester_user_id,
        CASE WHEN fr.recipient_id = $1 THEN req_u.username ELSE NULL END as requester_username,
        CASE WHEN fr.recipient_id = $1 THEN req_u.email ELSE NULL END as requester_email,
        CASE WHEN fr.requester_id = $1 THEN rec_u.id ELSE NULL END as recipient_user_id,
        CASE WHEN fr.requester_id = $1 THEN rec_u.username ELSE NULL END as recipient_username,
        CASE WHEN fr.requester_id = $1 THEN rec_u.email ELSE NULL END as recipient_email
      FROM friendship_requests fr
      LEFT JOIN users req_u ON fr.requester_id = req_u.id
      LEFT JOIN users rec_u ON fr.recipient_id = rec_u.id
      WHERE fr.status = 'pending'
        AND (fr.recipient_id = $1 OR fr.requester_id = $1)
      ORDER BY fr.created_at DESC
    `;
    const rawResults = await dbClient.queryRows(query, [userId]);
    return rawResults.map((request) => transformAllRequest(request, userId));
  }

  return [];
};

export default getFriendRequestsService;
