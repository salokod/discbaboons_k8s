import { BET_CATEGORIES } from '../lib/betCategories.js';
import { queryOne } from '../lib/database.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sideBetsSuggestionsService = async (roundId, userId) => {
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
      const error = new Error('You must be a participant in this round to view side bet suggestions');
      error.name = 'AuthorizationError';
      throw error;
    }
  }

  // For now, return basic suggestions based on categories
  const suggestions = [
    {
      category: BET_CATEGORIES.LOWEST_SCORE,
      name: 'Lowest Score',
      description: 'Player with the lowest total score wins',
      popularity: 0.85, // 85% of rounds have this bet
    },
    {
      category: BET_CATEGORIES.FIRST_BIRDIE,
      name: 'First Birdie',
      description: 'First player to score under par on any hole',
      popularity: 0.72,
    },
    {
      category: BET_CATEGORIES.CLOSEST_TO_PIN,
      name: 'Closest to Pin',
      description: 'Closest tee shot to the pin on a specific hole',
      popularity: 0.68,
    },
  ];

  return {
    roundId,
    suggestions,
  };
};

export default sideBetsSuggestionsService;
