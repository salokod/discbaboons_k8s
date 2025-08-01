// Standardized bet categories for side bets
export const BET_CATEGORIES = {
  // Score-based bets (calculable from scores + pars)
  LOWEST_SCORE: 'lowest_score',
  FIRST_BIRDIE: 'first_birdie',
  FIRST_EAGLE: 'first_eagle',
  MOST_BIRDIES: 'most_birdies',
  MOST_PARS: 'most_pars',
  LEAST_BOGEYS: 'least_bogeys',
  NO_BOGEYS: 'no_bogeys',
  BEST_BACK_NINE: 'best_back_nine',
  BEST_FRONT_NINE: 'best_front_nine',
  MOST_CONSECUTIVE_PARS: 'most_consecutive_pars',

  // Hole-specific bets (manual tracking)
  CLOSEST_TO_PIN: 'closest_to_pin',
  LONGEST_DRIVE: 'longest_drive',

  // Fun/simple bets
  LAST_TO_FINISH: 'last_to_finish',

  // Custom category
  CUSTOM: 'custom',
};

// Array of all valid categories for validation
export const VALID_BET_CATEGORIES = Object.values(BET_CATEGORIES);

// Bet resolution types - when/how bets can be resolved
export const BET_RESOLUTION_TYPES = {
  // Can auto-resolve mid-round from scores
  immediate: [
    BET_CATEGORIES.FIRST_BIRDIE,
    BET_CATEGORIES.FIRST_EAGLE,
  ],

  // Auto-calculated from complete scores
  endOfRound: [
    BET_CATEGORIES.LOWEST_SCORE,
    BET_CATEGORIES.BEST_BACK_NINE,
    BET_CATEGORIES.BEST_FRONT_NINE,
    BET_CATEGORIES.MOST_BIRDIES,
    BET_CATEGORIES.MOST_PARS,
    BET_CATEGORIES.LEAST_BOGEYS,
    BET_CATEGORIES.NO_BOGEYS,
    BET_CATEGORIES.LAST_TO_FINISH,
  ],

  // Updates throughout round, final at end
  progressive: [
    BET_CATEGORIES.MOST_CONSECUTIVE_PARS,
  ],

  // Requires human decision
  manual: [
    BET_CATEGORIES.CLOSEST_TO_PIN,
    BET_CATEGORIES.LONGEST_DRIVE,
    BET_CATEGORIES.CUSTOM,
  ],
};

// Helper to get resolution type for a category
export const getResolutionType = (category) => {
  const resolutionEntries = Object.entries(BET_RESOLUTION_TYPES);
  const found = resolutionEntries.find(([, categories]) => categories.includes(category));
  return found ? found[0] : 'manual';
};

// Pattern matching for categorizing existing bets
export const categorizeBetName = (betName) => {
  if (!betName) return BET_CATEGORIES.CUSTOM;

  const normalized = betName.toLowerCase().trim();

  // Direct matches
  const directMatches = {
    'lowest score': BET_CATEGORIES.LOWEST_SCORE,
    'low score': BET_CATEGORIES.LOWEST_SCORE,
    'first birdie': BET_CATEGORIES.FIRST_BIRDIE,
    'first eagle': BET_CATEGORIES.FIRST_EAGLE,
    'most birdies': BET_CATEGORIES.MOST_BIRDIES,
    'most pars': BET_CATEGORIES.MOST_PARS,
    'least bogeys': BET_CATEGORIES.LEAST_BOGEYS,
    'fewest bogeys': BET_CATEGORIES.LEAST_BOGEYS,
    'no bogeys': BET_CATEGORIES.NO_BOGEYS,
    'best back nine': BET_CATEGORIES.BEST_BACK_NINE,
    'best back 9': BET_CATEGORIES.BEST_BACK_NINE,
    'best front nine': BET_CATEGORIES.BEST_FRONT_NINE,
    'best front 9': BET_CATEGORIES.BEST_FRONT_NINE,
    'last to finish': BET_CATEGORIES.LAST_TO_FINISH,
  };

  // Check direct matches first
  if (directMatches[normalized]) {
    return directMatches[normalized];
  }

  // Pattern-based matches
  if (normalized.includes('ctp') || (normalized.includes('closest') && normalized.includes('pin'))) {
    return BET_CATEGORIES.CLOSEST_TO_PIN;
  }

  if (normalized.includes('longest') && normalized.includes('drive')) {
    return BET_CATEGORIES.LONGEST_DRIVE;
  }

  if (normalized.includes('consecutive') && normalized.includes('par')) {
    return BET_CATEGORIES.MOST_CONSECUTIVE_PARS;
  }

  // Default to custom for unmatched patterns
  return BET_CATEGORIES.CUSTOM;
};

// Validation function
// eslint-disable-next-line
export const isValidBetCategory = (category) => category === null || VALID_BET_CATEGORIES.includes(category);
