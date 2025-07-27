import { queryOne, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sideBetsListService = async (roundId, userId) => {
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

  // Check if round exists and get round info
  const roundQuery = `
    SELECT r.id, r.created_by_id
    FROM rounds r
    WHERE r.id = $1
  `;
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
      const error = new Error('You must be a participant in this round to view side bets');
      error.name = 'AuthorizationError';
      throw error;
    }
  }

  // Fetch all side bets for this round
  const sideBetsQuery = 'SELECT * FROM side_bets WHERE round_id = $1 ORDER BY created_at ASC';
  const sideBetsRows = await queryRows(sideBetsQuery, [roundId]);

  // Fetch participants for all side bets if any exist
  let participantsData = [];
  if (sideBetsRows.length > 0) {
    const sideBetIds = sideBetsRows.map((bet) => bet.id);
    const participantsQuery = `
      SELECT 
        sbp.side_bet_id,
        sbp.player_id,
        rp.user_id,
        rp.is_guest,
        CASE 
          WHEN rp.is_guest = true THEN rp.guest_name
          ELSE u.username
        END as display_name
      FROM side_bet_participants sbp
      JOIN round_players rp ON sbp.player_id = rp.id
      LEFT JOIN users u ON rp.user_id = u.id
      WHERE sbp.side_bet_id = ANY($1)
      ORDER BY display_name
    `;
    participantsData = await queryRows(participantsQuery, [sideBetIds]);
  }

  // Format side bets data with participants
  const sideBets = sideBetsRows.map((bet) => {
    const betParticipants = participantsData
      .filter((p) => p.side_bet_id === bet.id)
      .map((p) => ({
        playerId: p.player_id,
        userId: p.user_id,
        displayName: p.display_name,
      }));

    return {
      id: bet.id,
      name: bet.name,
      description: bet.description,
      amount: bet.amount,
      betType: bet.bet_type,
      holeNumber: bet.hole_number,
      status: bet.cancelled_at ? 'cancelled' : 'active',
      createdById: bet.created_by_id,
      createdAt: bet.created_at,
      updatedAt: bet.updated_at,
      cancelledAt: bet.cancelled_at,
      cancelledById: bet.cancelled_by_id,
      participants: betParticipants,
    };
  });

  // Get all round players for money summary calculation
  const playersQuery = `
    SELECT 
      rp.id as player_id,
      rp.user_id,
      rp.is_guest,
      CASE 
        WHEN rp.is_guest = true THEN rp.guest_name
        ELSE u.username
      END as display_name
    FROM round_players rp
    LEFT JOIN users u ON rp.user_id = u.id
    WHERE rp.round_id = $1
    ORDER BY display_name
  `;
  const playersRows = await queryRows(playersQuery, [roundId]);

  // Calculate money summary for each player
  const playerSummary = playersRows.map((player) => {
    const moneyIn = 0;
    let moneyOut = 0;
    let betCount = 0;

    sideBets.forEach((bet) => {
      const isParticipant = bet.participants.some((p) => p.playerId === player.player_id);

      if (isParticipant) {
        if (bet.status === 'active') {
          // For active bets, players have money at risk (money out)
          moneyOut += parseFloat(bet.amount);
          betCount += 1; // Count active bets
        } else if (bet.status === 'cancelled') {
          // Cancelled bets don't affect money flow or bet count
        }
        // TODO: When we add winner tracking, completed bets will affect moneyIn and betCount
      }
    });

    return {
      playerId: player.player_id,
      userId: player.user_id,
      displayName: player.display_name,
      moneyIn: moneyIn.toFixed(2),
      moneyOut: moneyOut.toFixed(2),
      total: (moneyIn - moneyOut).toFixed(2),
      betCount,
    };
  });

  return {
    roundId,
    sideBets,
    playerSummary,
  };
};

export default sideBetsListService;
