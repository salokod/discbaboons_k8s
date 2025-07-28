import pool, { queryOne } from '../lib/database.js';

const sideBetsUpdateService = async (betId, roundId, userId, updateData) => {
  if (!betId) {
    const error = new Error('Bet ID is required');
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

  if (!updateData) {
    const error = new Error('Update data is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Verify bet exists and belongs to the round
  const bet = await queryOne(
    'SELECT * FROM side_bets WHERE id = $1 AND round_id = $2',
    [betId, roundId],
  );

  if (!bet) {
    const error = new Error('Side bet not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Verify user is participant in round
  const player = await queryOne(
    'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
    [roundId, userId],
  );

  if (!player) {
    const error = new Error('User must be a participant in this round');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Start transaction for updates
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Build dynamic UPDATE query based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(updateData.name);
      paramIndex += 1;
    }

    if (updateData.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(updateData.description);
      paramIndex += 1;
    }

    // Handle winner declaration/clearing - this is done on participants table, not bet table
    let winnerDeclared = false;
    if (updateData.winnerId !== undefined) {
      if (updateData.winnerId === null) {
        // Clear all winners (reactivate bet)
        await client.query(
          'UPDATE side_bet_participants SET is_winner = false, won_at = NULL, declared_by_id = NULL WHERE side_bet_id = $1',
          [betId],
        );
      } else {
        // First clear all existing winners
        await client.query(
          'UPDATE side_bet_participants SET is_winner = false, won_at = NULL, declared_by_id = NULL WHERE side_bet_id = $1',
          [betId],
        );

        // Then set the new winner
        const winnerResult = await client.query(
          'UPDATE side_bet_participants SET is_winner = true, won_at = NOW(), declared_by_id = $1 WHERE side_bet_id = $2 AND player_id = $3',
          [player.id, betId, updateData.winnerId],
        );

        // Validate that the winner was actually found and updated
        if (winnerResult.rowCount === 0) {
          const error = new Error('Invalid winnerId: player not found in this bet');
          error.name = 'ValidationError';
          throw error;
        }
      }
      winnerDeclared = true;
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');

    // Add bet ID as final parameter
    updateValues.push(betId);

    // Update bet fields if any were provided
    let result;
    if (updateFields.length > 1) { // > 1 because updated_at is always added
      const updateQuery = `
        UPDATE side_bets 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      result = await client.query(updateQuery, updateValues);
    } else if (winnerDeclared) {
      // If only winner was updated, fetch the bet
      result = await client.query('SELECT * FROM side_bets WHERE id = $1', [betId]);
    } else {
      // No updates were made, return original bet
      result = { rows: [bet] };
    }

    await client.query('COMMIT');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default sideBetsUpdateService;
