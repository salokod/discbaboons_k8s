import { queryOne, query } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const removePlayerService = async (roundId, playerId, requestingUserId) => {
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

  // Validate required playerId
  if (!playerId) {
    const error = new Error('Player ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate playerId format
  if (!UUID_REGEX.test(playerId)) {
    const error = new Error('Player ID must be a valid UUID');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate required requestingUserId
  if (!requestingUserId) {
    const error = new Error('Requesting user ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate requestingUserId format (must be a number)
  if (!Number.isInteger(requestingUserId) || requestingUserId <= 0) {
    const error = new Error('Requesting user ID must be a valid number');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if round exists
  const roundQuery = 'SELECT id, created_by_id FROM rounds WHERE id = $1';
  const round = await queryOne(roundQuery, [roundId]);

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check if player exists in round
  const playerQuery = 'SELECT id, user_id, is_guest FROM round_players WHERE id = $1 AND round_id = $2';
  const player = await queryOne(playerQuery, [playerId, roundId]);

  if (!player) {
    const error = new Error('Player not found in this round');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check permissions: user must be round creator OR the player being removed
  const isRoundCreator = round.created_by_id === requestingUserId;
  const isPlayerBeingRemoved = player.user_id === requestingUserId;

  if (!isRoundCreator && !isPlayerBeingRemoved) {
    const error = new Error('You can only remove yourself or you must be the round creator');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Delete the player from the round
  const deleteQuery = 'DELETE FROM round_players WHERE id = $1 AND round_id = $2';
  await query(deleteQuery, [playerId, roundId]);

  return { success: true };
};

export default removePlayerService;
