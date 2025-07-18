import { query } from '../lib/database.js';

const deleteBagService = async (userId, bagId) => {
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

  // Validate UUID format - if invalid, return null instead of letting SQL throw
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bagId)) {
    return null; // Invalid UUID format, bag not found
  }

  // Delete bag with user ownership validation
  const deleteResult = await query(
    'DELETE FROM bags WHERE id = $1 AND user_id = $2',
    [bagId, userId],
  );

  // If no rows were deleted, bag doesn't exist or user doesn't own it
  if (deleteResult.rowCount === 0) {
    return null;
  }

  // Return true to indicate successful deletion
  return true;
};

export default deleteBagService;
