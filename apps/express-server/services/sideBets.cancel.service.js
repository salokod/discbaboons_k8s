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

  // Verify bet exists, is not cancelled, and user is authorized in one query
  const betAndPlayer = await queryOne(
    `SELECT sb.id as bet_id, rp.id as player_id 
     FROM side_bets sb
     JOIN round_players rp ON sb.round_id = rp.round_id 
     WHERE sb.id = $1 AND sb.round_id = $2 AND sb.cancelled_at IS NULL 
     AND rp.user_id = $3`,
    [betId, roundId, userId],
  );

  if (!betAndPlayer) {
    // Check what specifically failed for better error messages
    const bet = await queryOne(
      'SELECT id FROM side_bets WHERE id = $1 AND round_id = $2 AND cancelled_at IS NULL',
      [betId, roundId],
    );

    if (!bet) {
      const error = new Error('Side bet not found');
      error.name = 'NotFoundError';
      throw error;
    }

    // If bet exists but we're here, user is not authorized
    const error = new Error('User must be a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Cancel the bet by setting cancelled_at and cancelled_by_id
  await query(
    'UPDATE side_bets SET cancelled_at = NOW(), cancelled_by_id = $1, updated_at = NOW() WHERE id = $2 AND cancelled_at IS NULL',
    [betAndPlayer.player_id, betId],
  );

  return { success: true };
};

export default sideBetsCancelService;
