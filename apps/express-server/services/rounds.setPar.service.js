import { queryOne, query } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const setParService = async (roundId, holeNumber, par, requestingUserId) => {
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

  // Validate required holeNumber
  if (!holeNumber) {
    const error = new Error('Hole number is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate holeNumber format (must be a number)
  if (!Number.isInteger(holeNumber) || holeNumber <= 0) {
    const error = new Error('Hole number must be a valid number');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate holeNumber range (1-50)
  if (holeNumber < 1 || holeNumber > 50) {
    const error = new Error('Hole number must be between 1 and 50');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate required par
  if (!par) {
    const error = new Error('Par is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate par format (must be a number)
  if (!Number.isInteger(par) || par <= 0) {
    const error = new Error('Par must be a valid number');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate par range (1-10)
  if (par < 1 || par > 10) {
    const error = new Error('Par must be between 1 and 10');
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

  // Check if round exists and get course hole count for validation
  const round = await queryOne(
    `SELECT r.id, r.course_id, c.hole_count 
     FROM rounds r 
     JOIN courses c ON r.course_id = c.id 
     WHERE r.id = $1`,
    [roundId],
  );

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Validate hole number against course hole count
  if (holeNumber > round.hole_count) {
    const error = new Error(`Hole number cannot exceed course hole count (${round.hole_count})`);
    error.name = 'ValidationError';
    throw error;
  }

  // Check if user is participant in round and get their playerId
  const player = await queryOne(
    'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
    [roundId, requestingUserId],
  );

  if (!player) {
    const error = new Error('Permission denied: User is not a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Set or update par for the hole (upsert)
  await query(`
    INSERT INTO round_hole_pars (round_id, hole_number, par, set_by_player_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (round_id, hole_number)
    DO UPDATE SET
      par = EXCLUDED.par,
      set_by_player_id = EXCLUDED.set_by_player_id,
      updated_at = NOW()
  `, [roundId, holeNumber, par, player.id]);

  return { success: true };
};

export default setParService;
