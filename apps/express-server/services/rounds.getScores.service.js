import { queryOne, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getScoresService = async (roundId, userId) => {
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
  if (userId === null || userId === undefined) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate userId format (must be a positive integer)
  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error('User ID must be a valid number');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if round exists and get creator info
  const roundQuery = 'SELECT id, created_by_id FROM rounds WHERE id = $1';
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
      const error = new Error('You must be a participant in this round to view scores');
      error.name = 'AuthorizationError';
      throw error;
    }
  }

  // Get all players in the round
  const playersQuery = `
    SELECT rp.id, rp.user_id, rp.guest_name, rp.is_guest, u.username
    FROM round_players rp
    LEFT JOIN users u ON rp.user_id = u.id
    WHERE rp.round_id = $1
    ORDER BY rp.joined_at ASC
  `;
  const players = await queryRows(playersQuery, [roundId]);

  // Get all scores for the round
  const scoresQuery = `
    SELECT player_id, hole_number, strokes
    FROM scores
    WHERE round_id = $1
    ORDER BY player_id ASC, hole_number ASC
  `;
  const scores = await queryRows(scoresQuery, [roundId]);

  // Get all pars for the round
  const parsQuery = `
    SELECT hole_number, par
    FROM round_hole_pars
    WHERE round_id = $1
    ORDER BY hole_number ASC
  `;
  const pars = await queryRows(parsQuery, [roundId]);

  // Convert pars to lookup object (default to 3 for missing holes)
  const parLookup = {};
  pars.forEach((row) => {
    parLookup[row.hole_number] = row.par;
  });

  // Build result object organized by player
  const result = {};

  players.forEach((player) => {
    result[player.id] = {
      username: player.username,
      guestName: player.guest_name,
      isGuest: player.is_guest,
      holes: {},
      total: 0,
      totalPar: 0,
      relativeScore: 0,
    };
  });

  // Add scores to players
  scores.forEach((score) => {
    const par = parLookup[score.hole_number] || 3; // Default to par 3
    const relative = score.strokes - par;

    result[score.player_id].holes[score.hole_number] = {
      strokes: score.strokes,
      par,
      relative,
    };

    result[score.player_id].total += score.strokes;
    result[score.player_id].totalPar += par;
    result[score.player_id].relativeScore += relative;
  });

  return result;
};

export default getScoresService;
