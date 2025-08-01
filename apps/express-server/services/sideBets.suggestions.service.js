import { BET_CATEGORIES } from '../lib/betCategories.js';

const sideBetsSuggestionsService = async (roundId, userId) => {
  if (!roundId) {
    const error = new Error('Round ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (userId === null || userId === undefined) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
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
