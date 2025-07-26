import pool, { queryOne } from '../lib/database.js';

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

  // Create the side bet and auto-join the creator
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

    // Auto-join the creator as a participant
    const joinBetQuery = `
      INSERT INTO side_bet_participants (side_bet_id, player_id)
      VALUES ($1, $2)
    `;
    await client.query(joinBetQuery, [betResult.rows[0].id, player.id]);

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
