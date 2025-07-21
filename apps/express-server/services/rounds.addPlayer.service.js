/* eslint-disable import/prefer-default-export */
import pool from '../lib/database.js';

export async function addPlayerToRound(roundId, players, requestingUserId, db = pool) {
  if (!roundId) {
    const error = new Error('Round ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!players || !Array.isArray(players) || players.length === 0) {
    const error = new Error('Players array is required and must contain at least one player');
    error.name = 'ValidationError';
    throw error;
  }

  if (!requestingUserId) {
    const error = new Error('Requesting user ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate each player in the array
  players.forEach((player, index) => {
    if (!player.userId && !player.guestName) {
      const error = new Error(`Player at index ${index} must include either userId or guestName`);
      error.name = 'ValidationError';
      throw error;
    }

    if (player.userId && player.guestName) {
      const error = new Error(`Player at index ${index} cannot have both userId and guestName`);
      error.name = 'ValidationError';
      throw error;
    }
  });

  // Start transaction for batch operations
  const client = db === pool ? await pool.connect() : db;

  try {
    if (db === pool) {
      await client.query('BEGIN');
    }

    // Check if round exists
    const roundQuery = 'SELECT id, created_by_id FROM rounds WHERE id = $1';
    const roundResult = await client.query(roundQuery, [roundId]);

    if (roundResult.rows.length === 0) {
      const error = new Error('Round not found');
      error.name = 'NotFoundError';
      throw error;
    }

    const round = roundResult.rows[0];

    // Check permissions: user must be creator or existing player
    if (round.created_by_id !== requestingUserId) {
      // Not the creator, check if they're already a player
      const playerCheckQuery = 'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2';
      const playerCheckResult = await client.query(playerCheckQuery, [roundId, requestingUserId]);

      if (playerCheckResult.rows.length === 0) {
        const error = new Error('You must be the round creator or a player to add new players');
        error.name = 'AuthorizationError';
        throw error;
      }
    }

    // Get existing players to check for duplicates
    const existingPlayersQuery = 'SELECT user_id FROM round_players WHERE round_id = $1 AND user_id IS NOT NULL';
    const existingPlayersResult = await client.query(existingPlayersQuery, [roundId]);
    const existingUserIds = new Set(existingPlayersResult.rows.map((row) => row.user_id));

    // Check for duplicates in the batch and against existing players
    const userIdsInBatch = new Set();
    players.forEach((player) => {
      if (player.userId) {
        // Check if user is already in the round
        if (existingUserIds.has(player.userId)) {
          const error = new Error(`User ${player.userId} is already a player in this round`);
          error.name = 'ConflictError';
          error.status = 409;
          throw error;
        }

        // Check for duplicates within the batch
        if (userIdsInBatch.has(player.userId)) {
          const error = new Error(`Duplicate userId ${player.userId} found in players array`);
          error.name = 'ValidationError';
          throw error;
        }

        userIdsInBatch.add(player.userId);
      }
    });

    // Insert all players
    const insertedPlayers = await Promise.all(
      players.map(async (player) => {
        let insertQuery;
        let insertParams;

        if (player.userId) {
          // Adding a registered user
          insertQuery = `
            INSERT INTO round_players (round_id, user_id, is_guest)
            VALUES ($1, $2, false)
            RETURNING id, round_id, user_id, guest_name, is_guest, joined_at
          `;
          insertParams = [roundId, player.userId];
        } else {
          // Adding a guest player
          insertQuery = `
            INSERT INTO round_players (round_id, guest_name, is_guest)
            VALUES ($1, $2, true)
            RETURNING id, round_id, user_id, guest_name, is_guest, joined_at
          `;
          insertParams = [roundId, player.guestName];
        }

        const insertResult = await client.query(insertQuery, insertParams);
        return insertResult.rows[0];
      }),
    );

    if (db === pool) {
      await client.query('COMMIT');
    }

    return insertedPlayers;
  } catch (error) {
    if (db === pool) {
      await client.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (db === pool) {
      client.release();
    }
  }
}
