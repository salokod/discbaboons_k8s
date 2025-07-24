import { queryOne, query } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getParsService = async (roundId, requestingUserId) => {
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
  const round = await queryOne('SELECT id FROM rounds WHERE id = $1', [roundId]);

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check if user is participant in round
  const participant = await queryOne(
    'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
    [roundId, requestingUserId],
  );

  if (!participant) {
    const error = new Error('Permission denied: User is not a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Get all pars for the round
  const parsResult = await query(
    'SELECT hole_number, par, set_by_player_id, created_at FROM round_hole_pars WHERE round_id = $1 ORDER BY hole_number',
    [roundId],
  );

  // Convert array to object with hole numbers as keys
  const pars = {};
  parsResult.rows.forEach((row) => {
    pars[row.hole_number] = row.par;
  });

  return pars;
};

export default getParsService;
