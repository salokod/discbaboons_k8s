import { queryOne } from '../lib/database.js';

const markDiscLostService = async (userId, bagContentId, lostData, dbClient = { queryOne }) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagContentId) {
    const error = new Error('bagContentId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format - if invalid, return null instead of letting database throw
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bagContentId)) {
    return null; // Invalid UUID format, bag content not found
  }

  if (!lostData) {
    const error = new Error('lostData is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (typeof lostData.is_lost !== 'boolean') {
    const error = new Error('is_lost is required and must be a boolean');
    error.name = 'ValidationError';
    throw error;
  }

  // Find bag content and ensure user owns it (security)
  const bagContent = await dbClient.queryOne(
    `SELECT id, user_id, bag_id, speed, glide, turn, fade, brand, model, is_lost, lost_notes, lost_at
     FROM bag_contents 
     WHERE id = $1 AND user_id = $2`,
    [bagContentId, userId],
  );

  if (!bagContent) {
    return null; // Not found or user doesn't own it
  }

  if (lostData.is_lost) {
    // Marking as lost: remove from bag, set notes and current timestamp
    const updatedBagContent = await dbClient.queryOne(
      `UPDATE bag_contents 
       SET is_lost = $1, bag_id = NULL, lost_notes = $2, lost_at = $3, updated_at = $4,
           speed = $5, glide = $6, turn = $7, fade = $8, brand = $9, model = $10
       WHERE id = $11
       RETURNING *`,
      [
        lostData.is_lost,
        lostData.lost_notes || null,
        new Date(),
        new Date(),
        bagContent.speed,
        bagContent.glide,
        bagContent.turn,
        bagContent.fade,
        bagContent.brand,
        bagContent.model,
        bagContentId,
      ],
    );

    return updatedBagContent;
  }
  // Marking as found: clear lost data and require bag assignment
  // bag_id is required when marking as found
  if (!lostData.bag_id) {
    const error = new Error('bag_id is required when marking disc as found');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format for bag_id
  if (!uuidRegex.test(lostData.bag_id)) {
    const error = new Error('Invalid bag_id format');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate user owns the target bag
  const targetBag = await dbClient.queryOne(
    `SELECT id, user_id, name 
       FROM bags 
       WHERE id = $1 AND user_id = $2`,
    [lostData.bag_id, userId],
  );

  if (!targetBag) {
    const error = new Error('Target bag not found or access denied');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Update the bag content - marking as found and assigning to target bag
  const updatedBagContent = await dbClient.queryOne(
    `UPDATE bag_contents 
       SET is_lost = $1, bag_id = $2, lost_notes = NULL, lost_at = NULL, updated_at = $3,
           speed = $4, glide = $5, turn = $6, fade = $7, brand = $8, model = $9
       WHERE id = $10
       RETURNING *`,
    [
      lostData.is_lost,
      lostData.bag_id,
      new Date(),
      bagContent.speed,
      bagContent.glide,
      bagContent.turn,
      bagContent.fade,
      bagContent.brand,
      bagContent.model,
      bagContentId,
    ],
  );

  return updatedBagContent;
};

export default markDiscLostService;
