/* eslint-disable import/prefer-default-export */
import pool from '../lib/database.js';

export async function addPlayerToRound(roundId, playerData, requestingUserId, db = pool) {
  if (!roundId) {
    const error = new Error('Round ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!playerData) {
    const error = new Error('Player data is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!requestingUserId) {
    const error = new Error('Requesting user ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!playerData.userId && !playerData.guestName) {
    const error = new Error('Player data must include either userId or guestName');
    error.name = 'ValidationError';
    throw error;
  }

  if (playerData.userId && playerData.guestName) {
    const error = new Error('Player data cannot have both userId and guestName');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if round exists
  const roundQuery = 'SELECT id, created_by_id FROM rounds WHERE id = $1';
  const roundResult = await db.query(roundQuery, [roundId]);

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
    const playerCheckResult = await db.query(playerCheckQuery, [roundId, requestingUserId]);

    if (playerCheckResult.rows.length === 0) {
      const error = new Error('You must be the round creator or a player to add new players');
      error.name = 'AuthorizationError';
      throw error;
    }
  }

  // Check if player (userId) is already in the round
  if (playerData.userId) {
    const duplicateCheckQuery = 'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2';
    const duplicateCheckResult = await db.query(duplicateCheckQuery, [roundId, playerData.userId]);

    if (duplicateCheckResult.rows.length > 0) {
      const error = new Error('User is already a player in this round');
      error.name = 'ConflictError';
      error.status = 409;
      throw error;
    }
  }

  // Insert the player
  let insertQuery;
  let insertParams;

  if (playerData.userId) {
    // Adding a registered user
    insertQuery = `
      INSERT INTO round_players (round_id, user_id, is_guest)
      VALUES ($1, $2, false)
      RETURNING id, round_id, user_id, guest_name, is_guest, joined_at
    `;
    insertParams = [roundId, playerData.userId];
  } else {
    // Adding a guest player
    insertQuery = `
      INSERT INTO round_players (round_id, guest_name, is_guest)
      VALUES ($1, $2, true)
      RETURNING id, round_id, user_id, guest_name, is_guest, joined_at
    `;
    insertParams = [roundId, playerData.guestName];
  }

  const insertResult = await db.query(insertQuery, insertParams);
  return insertResult.rows[0];
}
