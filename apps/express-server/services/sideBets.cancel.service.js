import { queryOne, query } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sideBetsCancelService = async (betId, roundId, userId) => {
  if (!betId) {
    const error = new Error('Bet ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!UUID_REGEX.test(betId)) {
    const error = new Error('Invalid bet ID format');
    error.name = 'ValidationError';
    throw error;
  }

  if (!roundId) {
    const error = new Error('Round ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!UUID_REGEX.test(roundId)) {
    const error = new Error('Invalid round ID format');
    error.name = 'ValidationError';
    throw error;
  }

  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Verify bet exists and is not already cancelled
  const bet = await queryOne(
    'SELECT * FROM side_bets WHERE id = $1 AND round_id = $2 AND cancelled_at IS NULL',
    [betId, roundId],
  );

  if (!bet) {
    const error = new Error('Side bet not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Verify user is participant in round
  const player = await queryOne(
    'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
    [roundId, userId],
  );

  if (!player) {
    const error = new Error('User must be a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Cancel the bet by setting cancelled_at and cancelled_by_id
  await query(
    'UPDATE side_bets SET cancelled_at = NOW(), cancelled_by_id = $1, updated_at = NOW() WHERE id = $2',
    [player.id, betId],
  );

  return { success: true };
};

export default sideBetsCancelService;
