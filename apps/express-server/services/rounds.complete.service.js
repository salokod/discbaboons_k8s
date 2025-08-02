import { queryOne } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Round completion service
 *
 * Note: NotFoundError returns 400 instead of 404 due to the error handler middleware
 * converting specific error types. This is expected behavior in this codebase.
 */

const roundsCompleteService = async (roundId, userId) => {
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

  // Check if round exists and get its current status
  const round = await queryOne(
    'SELECT id, status FROM rounds WHERE id = $1',
    [roundId],
  );

  if (!round) {
    const error = new Error('Round not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check if user is participant in the round
  const userParticipation = await queryOne(
    'SELECT rp.id FROM round_players rp WHERE rp.round_id = $1 AND rp.user_id = $2',
    [roundId, userId],
  );

  if (!userParticipation) {
    const error = new Error('Permission denied: You are not a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Validate round is in progress
  if (round.status !== 'in_progress') {
    const error = new Error('Round must be in progress to be completed');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if all players have completed scoring for all holes
  // Performance Note: Consider adding index on scores(round_id, player_id, hole_number)
  // for better performance with large datasets
  const scoreCompletion = await queryOne(
    `WITH player_holes AS (
       SELECT rp.id as player_id, rhp.hole_number
       FROM round_players rp
       CROSS JOIN round_hole_pars rhp
       WHERE rp.round_id = $1 AND rhp.round_id = $1
     )
     SELECT 
       COUNT(*) = COUNT(s.id) as all_players_complete
     FROM player_holes ph
     LEFT JOIN scores s ON ph.player_id = s.player_id AND ph.hole_number = s.hole_number AND s.round_id = $1`,
    [roundId],
  );

  if (!scoreCompletion.all_players_complete) {
    const error = new Error('All players must complete scoring before the round can be completed');
    error.name = 'ValidationError';
    throw error;
  }

  // Update round status to completed
  const completedRound = await queryOne(
    'UPDATE rounds SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    ['completed', roundId],
  );

  // Return comprehensive completion data
  return {
    success: true,
    round: completedRound,
    // TODO: Add enhanced completion data in follow-up ticket:
    // - finalLeaderboard: Final leaderboard with positions and scores
    // - skinsResults: Skins game results if enabled
    // - sideBetsResults: All side bet outcomes
    // - summary: { totalHoles, duration, averageScore, etc. }
    // Track in issue: "Enhance round completion response with comprehensive data"
  };
};

export default roundsCompleteService;
