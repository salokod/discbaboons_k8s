import { query } from '../lib/database.js';

const bulkRecoverDiscsService = async (
  userId,
  contentIds,
  bagId,
  dbClient = { query },
) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!contentIds) {
    const error = new Error('content_ids is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!Array.isArray(contentIds)) {
    const error = new Error('content_ids must be an array');
    error.name = 'ValidationError';
    throw error;
  }

  if (contentIds.length === 0) {
    const error = new Error('content_ids cannot be empty');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bag_id is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Find all lost discs that exist and are owned by the user
  const lostDiscs = await dbClient.query(
    `SELECT id, user_id, bag_id, is_lost, lost_notes, lost_at
     FROM bag_contents 
     WHERE id = ANY($1) AND user_id = $2 AND is_lost = true`,
    [contentIds, userId],
  );

  const foundIds = lostDiscs.rows.map((disc) => disc.id);
  const failedIds = contentIds.filter((id) => !foundIds.includes(id));

  // If no valid lost discs found, return error
  if (foundIds.length === 0) {
    return {
      success: false,
      message: 'No valid lost discs found for the provided content IDs',
      updated_count: 0,
      failed_ids: contentIds,
    };
  }

  // Validate user owns the target bag
  const targetBag = await dbClient.query(
    'SELECT id, user_id FROM bags WHERE id = $1 AND user_id = $2',
    [bagId, userId],
  );

  if (targetBag.rows.length === 0) {
    return {
      success: false,
      message: 'Target bag not found or not owned by user',
      updated_count: 0,
      failed_ids: contentIds,
    };
  }

  // Perform bulk recovery - set is_lost = false, bag_id = target bag, clear lost fields
  const updateResult = await dbClient.query(
    `UPDATE bag_contents 
     SET is_lost = false, bag_id = $1, lost_notes = NULL, lost_at = NULL, updated_at = $2
     WHERE id = ANY($3) AND user_id = $4`,
    [
      bagId,
      new Date(),
      foundIds,
      userId,
    ],
  );

  return {
    success: true,
    updated_count: updateResult.rowCount,
    failed_ids: failedIds,
  };
};

export default bulkRecoverDiscsService;
