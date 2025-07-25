import { queryOne, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const skinsCalculateService = async (roundId, userId) => {
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

  // Check if round exists and get round info including skins settings and starting hole
  const roundQuery = `
    SELECT r.id, r.created_by_id, r.skins_enabled, r.skins_value, r.starting_hole, c.hole_count
    FROM rounds r
    JOIN courses c ON r.course_id = c.id
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
      const error = new Error('You must be a participant in this round to view skins');
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
    ORDER BY hole_number ASC, player_id ASC
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

  // Group scores by hole
  const scoresByHole = {};
  scores.forEach((score) => {
    if (!scoresByHole[score.hole_number]) {
      scoresByHole[score.hole_number] = [];
    }
    scoresByHole[score.hole_number].push(score);
  });

  // Calculate skins for each hole
  const holes = {};
  const playerSummary = {};

  // Initialize player summary
  players.forEach((player) => {
    playerSummary[player.id] = { skinsWon: 0, totalValue: '0.00' };
  });

  // Create the correct hole order based on starting hole
  const generateHoleOrder = (startingHole, holeCount) => {
    const order = [];
    for (let i = 0; i < holeCount; i += 1) {
      const hole = ((startingHole - 1 + i) % holeCount) + 1;
      order.push(hole);
    }
    return order;
  };

  const holeOrder = generateHoleOrder(round.starting_hole, round.hole_count);

  // Process each hole with carry-over logic in correct play order
  let currentCarryOver = 0;
  holeOrder.forEach((holeNumber) => {
    // Skip holes that don't have scores yet
    if (!scoresByHole[holeNumber]) {
      return;
    }
    const holeScores = scoresByHole[holeNumber];

    // Find the lowest score on this hole
    const lowestScore = Math.min(...holeScores.map((s) => s.strokes));
    const winners = holeScores.filter((s) => s.strokes === lowestScore);

    const baseSkinsValue = parseFloat(round.skins_value);
    const totalSkinsValue = baseSkinsValue + (currentCarryOver * baseSkinsValue);

    if (winners.length === 1) {
      // Clear winner - award skins (including any carried over)
      const winner = winners[0];
      holes[holeNumber] = {
        winner: winner.player_id,
        winnerScore: lowestScore,
        skinsValue: totalSkinsValue.toFixed(2),
        carriedOver: currentCarryOver,
      };

      // Update player summary - include carried over skins in count
      const totalSkinsWon = 1 + currentCarryOver;
      playerSummary[winner.player_id].skinsWon += totalSkinsWon;
      playerSummary[winner.player_id].totalValue = (
        parseFloat(playerSummary[winner.player_id].totalValue) + totalSkinsValue
      ).toFixed(2);

      // Reset carry-over after awarding
      currentCarryOver = 0;
    } else {
      // Tie - skins carry over to next hole
      holes[holeNumber] = {
        winner: null,
        tied: true,
        tiedScore: lowestScore,
        skinsValue: baseSkinsValue.toFixed(2),
        carriedOver: currentCarryOver + 1, // Show total skins that will carry over
      };

      // Increment carry-over for next hole
      currentCarryOver += 1;
    }
  });

  return {
    roundId,
    skinsEnabled: round.skins_enabled,
    skinsValue: round.skins_value,
    holes,
    playerSummary,
    totalCarryOver: currentCarryOver,
  };
};

export default skinsCalculateService;
