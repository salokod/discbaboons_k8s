import { queryOne, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sideBetsGetService = async (betId, roundId, userId) => {
  if (!betId) {
    const error = new Error('Bet ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!UUID_REGEX.test(betId)) {
    const error = new Error('Invalid bet ID format');
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

  // Check if user is a participant in the round
  const participant = await queryOne(
    'SELECT id FROM round_players WHERE round_id = $1 AND user_id = $2',
    [roundId, userId],
  );

  if (!participant) {
    const error = new Error('You must be a participant in this round to view side bets');
    error.name = 'AuthorizationError';
    throw error;
  }

  // Fetch participants for the bet
  const participantsQuery = `
    SELECT 
      sbp.player_id,
      sbp.is_winner,
      sbp.won_at,
      sbp.declared_by_id,
      rp.user_id,
      rp.is_guest,
      CASE 
        WHEN rp.is_guest = true THEN rp.guest_name
        ELSE u.username
      END as display_name
    FROM side_bet_participants sbp
    JOIN round_players rp ON sbp.player_id = rp.id
    LEFT JOIN users u ON rp.user_id = u.id
    WHERE sbp.side_bet_id = $1
    ORDER BY display_name
  `;
  const participants = await queryRows(participantsQuery, [betId]);

  // Validate participants exist
  if (participants.length === 0) {
    const error = new Error('Side bet has no participants');
    error.name = 'ValidationError';
    throw error;
  }

  // Format participants with bet amounts
  const participantCount = participants.length;
  const betAmount = parseFloat(bet.amount);

  const formattedParticipants = participants.map((p) => {
    const baseParticipant = {
      playerId: p.player_id,
      userId: p.user_id,
      displayName: p.display_name,
      isWinner: p.is_winner,
      wonAt: p.won_at,
      declaredById: p.declared_by_id,
    };

    // Calculate amounts based on bet status
    if (!bet.cancelled_at) {
      if (p.is_winner) {
        // Winner gets the pot
        baseParticipant.betAmount = betAmount * (participantCount - 1);
      } else {
        // Non-winners owe the bet amount
        baseParticipant.betAmount = -betAmount;
      }
    } else {
      // Cancelled bets have no amounts
      baseParticipant.betAmount = 0;
    }

    return baseParticipant;
  });

  // Validate winner consistency for completed bets
  const winners = formattedParticipants.filter((p) => p.isWinner);
  if (winners.length > 1) {
    const error = new Error('Side bet cannot have multiple winners');
    error.name = 'ValidationError';
    throw error;
  }

  // Determine status
  let status = 'active';
  if (bet.cancelled_at) {
    status = 'cancelled';
  } else if (winners.length > 0) {
    status = 'completed';
  }

  // Return formatted bet details
  return {
    id: bet.id,
    roundId: bet.round_id,
    name: bet.name,
    description: bet.description,
    amount: bet.amount,
    betType: bet.bet_type,
    holeNumber: bet.hole_number,
    status,
    createdById: bet.created_by_id,
    createdAt: bet.created_at,
    updatedAt: bet.updated_at,
    cancelledAt: bet.cancelled_at,
    cancelledById: bet.cancelled_by_id,
    participants: formattedParticipants,
  };
};

export default sideBetsGetService;
