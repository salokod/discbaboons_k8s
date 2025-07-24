import { queryOne, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getRoundService = async (roundId, userId) => {
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

  // Get full round details
  const roundQuery = `
    SELECT id, created_by_id, course_id, name, start_time, starting_hole, 
           is_private, skins_enabled, skins_value, status, created_at, updated_at
    FROM rounds 
    WHERE id = $1
  `;
  const round = await queryOne(roundQuery, [roundId]);

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check if user is a participant (creator or player)
  if (round.created_by_id !== userId) {
    // Not the creator, check if they're a player
    const playerQuery = 'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2';
    const player = await queryOne(playerQuery, [roundId, userId]);

    if (!player) {
      const error = new Error('You must be a participant in this round to view details');
      error.name = 'AuthorizationError';
      throw error;
    }
  }

  // Get players with usernames
  const playersQuery = `
    SELECT rp.id, rp.round_id, rp.user_id, rp.guest_name, rp.is_guest, rp.joined_at, u.username
    FROM round_players rp
    LEFT JOIN users u ON rp.user_id = u.id
    WHERE rp.round_id = $1
    ORDER BY rp.joined_at ASC
  `;
  const players = await queryRows(playersQuery, [roundId]);

  // Get pars for the round
  const parsQuery = `
    SELECT hole_number, par, set_by_player_id, created_at 
    FROM round_hole_pars 
    WHERE round_id = $1 
    ORDER BY hole_number
  `;
  const parsResult = await queryRows(parsQuery, [roundId]);

  // Convert pars array to object with hole numbers as keys
  const pars = {};
  parsResult.forEach((row) => {
    pars[row.hole_number] = row.par;
  });

  return {
    ...round,
    players,
    pars,
  };
};

export default getRoundService;
