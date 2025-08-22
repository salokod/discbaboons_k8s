import { query } from '../lib/database.js';

const bulkMarkDiscLostService = async (
  userId,
  contentIds,
  lostData,
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

  if (!lostData) {
    const error = new Error('lostData is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (typeof lostData !== 'object' || Array.isArray(lostData)) {
    const error = new Error('lostData must be an object');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate lost_notes if provided
  if (lostData.lost_notes !== undefined && lostData.lost_notes !== null) {
    if (typeof lostData.lost_notes !== 'string') {
      const error = new Error('lost_notes must be a string');
      error.name = 'ValidationError';
      throw error;
    }

    if (lostData.lost_notes.length > 500) {
      const error = new Error('lost_notes cannot exceed 500 characters');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Find all bag contents that exist and are owned by the user
  const bagContents = await dbClient.query(
    `SELECT id, user_id, bag_id, speed, glide, turn, fade, brand, model, is_lost, lost_notes, lost_at
     FROM bag_contents 
     WHERE id = ANY($1) AND user_id = $2`,
    [contentIds, userId],
  );

  const foundIds = bagContents.rows.map((content) => content.id);
  const failedIds = contentIds.filter((id) => !foundIds.includes(id));

  // If no valid discs found, return error
  if (foundIds.length === 0) {
    return {
      success: false,
      message: 'No valid discs found for the provided content IDs',
      updated_count: 0,
      failed_ids: contentIds,
    };
  }

  // Perform bulk update to mark discs as lost
  const updateResult = await dbClient.query(
    `UPDATE bag_contents 
     SET is_lost = true, bag_id = NULL, lost_notes = $1, lost_at = $2, updated_at = $3
     WHERE id = ANY($4) AND user_id = $5`,
    [
      lostData.lost_notes || null,
      new Date(),
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

export default bulkMarkDiscLostService;
