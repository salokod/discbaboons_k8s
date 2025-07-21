import { queryRows, queryOne } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const listPlayersService = async (roundId, userId) => {
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

  // Check if round exists
  const roundQuery = 'SELECT id, created_by_id FROM rounds WHERE id = $1';
  const round = await queryOne(roundQuery, [roundId]);

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check permissions: user must be creator or existing player
  if (round.created_by_id !== userId) {
    // Not the creator, check if they're already a player
    const playerCheckQuery = 'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2';
    const playerCheck = await queryOne(playerCheckQuery, [roundId, userId]);

    if (!playerCheck) {
      const error = new Error('You must be the round creator or a player to view players');
      error.name = 'AuthorizationError';
      throw error;
    }
  }

  const query = `
    SELECT 
      rp.*,
      u.username
    FROM round_players rp
    LEFT JOIN users u ON rp.user_id = u.id
    WHERE rp.round_id = $1
    ORDER BY rp.joined_at
  `;
  const players = await queryRows(query, [roundId]);

  return players;
};

export default listPlayersService;
