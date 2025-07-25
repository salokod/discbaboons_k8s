import { queryOne, queryRows } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getLeaderboardService = async (roundId, userId) => {
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

  // Check if round exists and get round info including skins settings
  const roundQuery = 'SELECT id, created_by_id, skins_enabled, skins_value FROM rounds WHERE id = $1';
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
      const error = new Error('You must be a participant in this round to view leaderboard');
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
    ORDER BY player_id ASC, hole_number ASC
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

  // Calculate player statistics
  const playerStats = {};
  players.forEach((player) => {
    playerStats[player.id] = {
      playerId: player.id,
      username: player.username,
      guestName: player.guest_name,
      isGuest: player.is_guest,
      totalStrokes: 0,
      totalPar: 0,
      relativeScore: 0,
      holesCompleted: 0,
      currentHole: 1,
      skinsWon: 0, // Placeholder until Phase 4
    };
  });

  // Add scores to player statistics
  scores.forEach((score) => {
    if (playerStats[score.player_id]) {
      const par = parLookup[score.hole_number] || 3; // Default to par 3
      const relative = score.strokes - par;

      playerStats[score.player_id].totalStrokes += score.strokes;
      playerStats[score.player_id].totalPar += par;
      playerStats[score.player_id].relativeScore += relative;
      playerStats[score.player_id].holesCompleted += 1;

      // Current hole is the highest hole number played + 1
      if (score.hole_number >= playerStats[score.player_id].currentHole) {
        playerStats[score.player_id].currentHole = score.hole_number + 1;
      }
    }
  });

  // Convert to array and sort by total strokes (ascending, lowest score first)
  const leaderboard = Object.values(playerStats).sort((a, b) => {
    // Primary sort: total strokes (ascending)
    if (a.totalStrokes !== b.totalStrokes) {
      return a.totalStrokes - b.totalStrokes;
    }
    // Secondary sort: holes completed (descending, more holes completed = better position)
    return b.holesCompleted - a.holesCompleted;
  });

  // Add position numbers
  const playersWithPositions = leaderboard.map((player, index) => ({
    ...player,
    position: index + 1,
  }));

  return {
    players: playersWithPositions,
    roundSettings: {
      skinsEnabled: round.skins_enabled,
      skinsValue: round.skins_value,
      currentCarryOver: 0, // Placeholder until Phase 4
    },
  };
};

export default getLeaderboardService;
