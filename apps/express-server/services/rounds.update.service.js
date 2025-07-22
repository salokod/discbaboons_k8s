import { queryOne } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const updateRoundService = async (roundId, updateData, userId) => {
  // Validate required roundId
  if (!roundId) {
    const error = new Error('Round ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate roundId format
  if (!UUID_REGEX.test(roundId)) {
    const error = new Error('Round ID must be a valid UUID');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate required updateData
  if (!updateData) {
    const error = new Error('Update data is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate updateData is not empty
  if (Object.keys(updateData).length === 0) {
    const error = new Error('Update data cannot be empty');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate required userId
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate userId format (must be a number)
  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error('User ID must be a valid number');
    error.name = 'ValidationError';
    throw error;
  }

  // Define allowed fields and validate
  const allowedFields = ['name', 'status', 'starting_hole', 'is_private', 'skins_enabled', 'skins_value'];
  const invalidFields = Object.keys(updateData).filter((field) => !allowedFields.includes(field));

  if (invalidFields.length > 0) {
    const error = new Error(`Invalid update fields: ${invalidFields.join(', ')}`);
    error.name = 'ValidationError';
    throw error;
  }

  // Validate individual fields
  if ('name' in updateData && typeof updateData.name !== 'string') {
    const error = new Error('Name must be a string');
    error.name = 'ValidationError';
    throw error;
  }

  if ('status' in updateData) {
    const validStatuses = ['in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(updateData.status)) {
      const error = new Error('Status must be one of: in_progress, completed, cancelled');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if ('starting_hole' in updateData) {
    if (!Number.isInteger(updateData.starting_hole) || updateData.starting_hole <= 0) {
      const error = new Error('Starting hole must be a positive integer');
      error.name = 'ValidationError';
      throw error;
    }
  }

  if ('is_private' in updateData && typeof updateData.is_private !== 'boolean') {
    const error = new Error('Is private must be a boolean');
    error.name = 'ValidationError';
    throw error;
  }

  if ('skins_enabled' in updateData && typeof updateData.skins_enabled !== 'boolean') {
    const error = new Error('Skins enabled must be a boolean');
    error.name = 'ValidationError';
    throw error;
  }

  if ('skins_value' in updateData) {
    const skinsValue = parseFloat(updateData.skins_value);
    if (Number.isNaN(skinsValue) || skinsValue < 0) {
      const error = new Error('Skins value must be a valid decimal number');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Check if round exists
  const round = await queryOne(
    'SELECT id FROM rounds WHERE id = $1',
    [roundId],
  );

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check if user is participant in the round
  const userParticipation = await queryOne(
    `SELECT rp.id 
     FROM round_players rp 
     WHERE rp.round_id = $1 
       AND rp.user_id = $2`,
    [roundId, userId],
  );

  if (!userParticipation) {
    const error = new Error('Permission denied: You are not a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Build dynamic UPDATE query
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updateData).forEach((field) => {
    updateFields.push(`${field} = $${paramIndex}`);
    values.push(updateData[field]);
    paramIndex += 1;
  });

  values.push(roundId); // For WHERE clause

  const updateQuery = `
    UPDATE rounds 
    SET ${updateFields.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const updatedRound = await queryOne(updateQuery, values);

  return updatedRound;
};

export default updateRoundService;
