import { queryOne, query, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const submitScoresService = async (roundId, scores, requestingUserId) => {
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

  // Validate required scores array
  if (!scores) {
    const error = new Error('Scores array is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate scores array is not empty
  if (!Array.isArray(scores) || scores.length === 0) {
    const error = new Error('Scores array cannot be empty');
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

  // Get all valid player IDs for this round
  const validPlayers = await queryRows(
    'SELECT id FROM round_players WHERE round_id = $1',
    [roundId],
  );
  const validPlayerIds = new Set(validPlayers.map((player) => player.id));

  // Validate each score in the array
  for (let i = 0; i < scores.length; i += 1) {
    const score = scores[i];

    // Validate playerId
    if (!score.playerId) {
      const error = new Error('Player ID is required for each score');
      error.name = 'ValidationError';
      throw error;
    }

    if (!UUID_REGEX.test(score.playerId)) {
      const error = new Error('Player ID must be a valid UUID');
      error.name = 'ValidationError';
      throw error;
    }

    // Validate that player is in this round
    if (!validPlayerIds.has(score.playerId)) {
      const error = new Error(`Player ID ${score.playerId} is not a participant in this round`);
      error.name = 'ValidationError';
      throw error;
    }

    // Validate holeNumber
    if (score.holeNumber === undefined || score.holeNumber === null) {
      const error = new Error('Hole number is required for each score');
      error.name = 'ValidationError';
      throw error;
    }

    if (!Number.isInteger(score.holeNumber) || score.holeNumber < 1 || score.holeNumber > 50) {
      const error = new Error('Hole number must be between 1 and 50');
      error.name = 'ValidationError';
      throw error;
    }

    // Validate hole number against course hole count
    if (score.holeNumber > round.hole_count) {
      const error = new Error(`Hole number cannot exceed course hole count (${round.hole_count})`);
      error.name = 'ValidationError';
      throw error;
    }

    // Validate strokes
    if (score.strokes === undefined || score.strokes === null) {
      const error = new Error('Strokes is required for each score');
      error.name = 'ValidationError';
      throw error;
    }

    if (!Number.isInteger(score.strokes) || score.strokes < 1 || score.strokes > 20) {
      const error = new Error('Strokes must be between 1 and 20');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Submit each score (upsert operation) - using Promise.all to avoid await in loop
  const scorePromises = scores.map((score) => query(`
    INSERT INTO scores (round_id, player_id, hole_number, strokes, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (round_id, player_id, hole_number)
    DO UPDATE SET
      strokes = EXCLUDED.strokes,
      updated_at = NOW()
  `, [roundId, score.playerId, score.holeNumber, score.strokes]));

  await Promise.all(scorePromises);

  return { success: true, scoresSubmitted: scores.length };
};

export default submitScoresService;
