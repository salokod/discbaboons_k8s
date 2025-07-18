import { query, queryOne } from '../lib/database.js';

const updateBagService = async (userId, bagId, updateData) => {
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

  if (!updateData || Object.keys(updateData).length === 0) {
    const error = new Error('updateData is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Build dynamic SET clause and parameters
  const fields = Object.keys(updateData);
  const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
  const values = Object.values(updateData);

  // Update bag with user ownership validation
  const updateResult = await query(
    `UPDATE bags SET ${setClause}, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
    [bagId, userId, ...values],
  );

  // If no rows were updated, bag doesn't exist or user doesn't own it
  if (updateResult.rowCount === 0) {
    return null;
  }

  // Return the updated bag
  const updatedBag = await queryOne(
    'SELECT * FROM bags WHERE id = $1 AND user_id = $2',
    [bagId, userId],
  );

  return updatedBag;
};

export default updateBagService;
