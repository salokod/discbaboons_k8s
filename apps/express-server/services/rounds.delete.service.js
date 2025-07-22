import { queryOne, query } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const deleteRoundService = async (roundId, userId) => {
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

  // Check if round exists and get the created_by_id for permission check
  const round = await queryOne(
    'SELECT id, created_by_id FROM rounds WHERE id = $1',
    [roundId]
  );

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check permission: only the round creator can delete the round
  if (round.created_by_id !== userId) {
    const error = new Error('Permission denied: Only the round creator can delete the round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Delete the round (CASCADE will handle related round_players, scores, etc.)
  await query('DELETE FROM rounds WHERE id = $1', [roundId]);

  return { success: true };
};

export default deleteRoundService;