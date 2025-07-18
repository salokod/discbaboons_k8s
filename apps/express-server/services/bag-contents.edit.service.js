import { queryOne } from '../lib/database.js';

const editBagContentService = async (
  userId,
  bagId,
  contentId,
  updateData,
  dbClient = { queryOne },
) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!bagId) {
    const error = new Error('bagId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!contentId) {
    const error = new Error('contentId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!updateData) {
    const error = new Error('updateData is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate flight numbers if provided
  if (updateData.speed !== undefined && updateData.speed !== null) {
    if (updateData.speed < 1 || updateData.speed > 15) {
      const error = new Error('speed must be between 1 and 15');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.glide !== undefined && updateData.glide !== null) {
    if (updateData.glide < 1 || updateData.glide > 7) {
      const error = new Error('glide must be between 1 and 7');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.turn !== undefined && updateData.turn !== null) {
    if (updateData.turn < -5 || updateData.turn > 2) {
      const error = new Error('turn must be between -5 and 2');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.fade !== undefined && updateData.fade !== null) {
    if (updateData.fade < 0 || updateData.fade > 5) {
      const error = new Error('fade must be between 0 and 5');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Validate custom brand/model if provided
  if (updateData.brand !== undefined && updateData.brand !== null) {
    if (typeof updateData.brand !== 'string' || updateData.brand.length > 50) {
      const error = new Error('brand must be a string with maximum 50 characters');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if (updateData.model !== undefined && updateData.model !== null) {
    if (typeof updateData.model !== 'string' || updateData.model.length > 50) {
      const error = new Error('model must be a string with maximum 50 characters');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Find the bag content and verify user owns the bag
  const existingContent = await dbClient.queryOne(
    `SELECT bc.*, b.user_id as bag_user_id, b.name, b.created_at as bag_created_at, b.updated_at as bag_updated_at
     FROM bag_contents bc
     JOIN bags b ON bc.bag_id = b.id
     WHERE bc.id = $1 AND bc.bag_id = $2 AND b.user_id = $3`,
    [contentId, bagId, userId],
  );

  if (!existingContent) {
    const error = new Error('Content not found or access denied');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Build update fields dynamically based on provided data
  const updateFields = [];
  const updateParams = [];
  let paramIndex = 1;

  Object.keys(updateData).forEach((key) => {
    updateFields.push(`${key} = $${paramIndex}`);
    updateParams.push(updateData[key]);
    paramIndex += 1;
  });

  // Always update the timestamp
  updateFields.push(`updated_at = $${paramIndex}`);
  updateParams.push(new Date());
  paramIndex += 1;

  // Add WHERE clause parameters
  updateParams.push(contentId);

  // Update the bag content with updated_at timestamp
  const updatedContent = await dbClient.queryOne(
    `UPDATE bag_contents 
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    updateParams,
  );

  return updatedContent;
};

export default editBagContentService;
