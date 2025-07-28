import pool, { queryOne, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sideBetsCreateService = async (betData, roundId, userId) => {
  if (!betData) {
    const error = new Error('Bet data is required');
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

  const { name, amount, betType } = betData;

  if (!name) {
    const error = new Error('Bet name is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (amount === undefined || amount === null) {
    const error = new Error('Bet amount is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!betType) {
    const error = new Error('Bet type is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!['hole', 'round'].includes(betType)) {
    const error = new Error('Bet type must be either "hole" or "round"');
    error.name = 'ValidationError';
    throw error;
  }

  const { holeNumber } = betData;

  if (betType === 'hole' && !holeNumber) {
    const error = new Error('Hole number is required for hole bets');
    error.name = 'ValidationError';
    throw error;
  }

  if (betType === 'round' && holeNumber) {
    const error = new Error('Hole number should not be provided for round bets');
    error.name = 'ValidationError';
    throw error;
  }

  if (amount <= 0) {
    const error = new Error('Bet amount must be positive');
    error.name = 'ValidationError';
    throw error;
  }

  // Find the player record for this user in this round
  const player = await queryOne(
    'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
    [roundId, userId],
  );

  if (!player) {
    const error = new Error('User must be a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Validate participants are provided
  const { participants } = betData;

  if (!participants || participants.length === 0) {
    const error = new Error('Participants array is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (participants.length < 2) {
    const error = new Error('At least 2 participants are required for a bet');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate all participant IDs are UUIDs
  const invalidParticipantIds = participants.filter((id) => !UUID_REGEX.test(id));
  if (invalidParticipantIds.length > 0) {
    const error = new Error('Invalid participant ID format');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate all participant IDs are valid round players
  const participantQuery = `
    SELECT id FROM round_players
    WHERE round_id = $1 AND id = ANY($2)
  `;
  const validParticipants = await queryRows(participantQuery, [roundId, participants]);

  if (validParticipants.length !== participants.length) {
    const error = new Error('All participants must be players in this round');
    error.name = 'ValidationError';
    throw error;
  }

  const participantIds = participants;

  // Create the side bet and add all participants
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create the side bet
    const createBetQuery = `
      INSERT INTO side_bets (round_id, name, description, amount, bet_type, hole_number, created_by_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const { description } = betData;
    const betResult = await client.query(createBetQuery, [
      roundId,
      name,
      description || null,
      amount,
      betType,
      holeNumber || null,
      player.id,
    ]);

    // Add all participants to the bet
    const joinBetQuery = `
      INSERT INTO side_bet_participants (side_bet_id, player_id)
      VALUES ($1, $2)
    `;

    // Use Promise.all to avoid await in loop
    await Promise.all(
      participantIds.map((participantId) => client.query(
        joinBetQuery,
        [betResult.rows[0].id,
          participantId],
      )),
    );

    await client.query('COMMIT');

    return betResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default sideBetsCreateService;
