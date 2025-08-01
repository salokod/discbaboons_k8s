import { describe, it, expect } from 'vitest';
import {
  BET_CATEGORIES,
  VALID_BET_CATEGORIES,
  getResolutionType,
  categorizeBetName,
  isValidBetCategory,
} from '../../../lib/betCategories.js';

describe('betCategories', () => {
  describe('BET_CATEGORIES', () => {
    it('should export all expected categories', () => {
      expect(BET_CATEGORIES.LOWEST_SCORE).toBe('lowest_score');
      expect(BET_CATEGORIES.FIRST_BIRDIE).toBe('first_birdie');
      expect(BET_CATEGORIES.CLOSEST_TO_PIN).toBe('closest_to_pin');
      expect(BET_CATEGORIES.CUSTOM).toBe('custom');
    });

    it('should have 14 categories', () => {
      expect(Object.keys(BET_CATEGORIES)).toHaveLength(14);
    });
  });

  describe('VALID_BET_CATEGORIES', () => {
    it('should contain all category values', () => {
      expect(VALID_BET_CATEGORIES).toHaveLength(14);
      expect(VALID_BET_CATEGORIES).toContain('lowest_score');
      expect(VALID_BET_CATEGORIES).toContain('custom');
    });
  });

  describe('getResolutionType', () => {
    it('should return immediate for first_birdie', () => {
      expect(getResolutionType(BET_CATEGORIES.FIRST_BIRDIE)).toBe('immediate');
    });

    it('should return endOfRound for lowest_score', () => {
      expect(getResolutionType(BET_CATEGORIES.LOWEST_SCORE)).toBe('endOfRound');
    });

    it('should return progressive for most_consecutive_pars', () => {
      expect(getResolutionType(BET_CATEGORIES.MOST_CONSECUTIVE_PARS)).toBe('progressive');
    });

    it('should return manual for closest_to_pin', () => {
      expect(getResolutionType(BET_CATEGORIES.CLOSEST_TO_PIN)).toBe('manual');
    });

    it('should return manual for unknown category', () => {
      expect(getResolutionType('unknown_bet')).toBe('manual');
    });
  });

  describe('categorizeBetName', () => {
    it('should categorize direct matches', () => {
      expect(categorizeBetName('Lowest Score')).toBe(BET_CATEGORIES.LOWEST_SCORE);
      expect(categorizeBetName('first birdie')).toBe(BET_CATEGORIES.FIRST_BIRDIE);
      expect(categorizeBetName('MOST PARS')).toBe(BET_CATEGORIES.MOST_PARS);
    });

    it('should categorize pattern matches', () => {
      expect(categorizeBetName('CTP hole 5')).toBe(BET_CATEGORIES.CLOSEST_TO_PIN);
      expect(categorizeBetName('closest to the pin')).toBe(BET_CATEGORIES.CLOSEST_TO_PIN);
      expect(categorizeBetName('longest drive hole 10')).toBe(BET_CATEGORIES.LONGEST_DRIVE);
    });

    it('should handle variations', () => {
      expect(categorizeBetName('fewest bogeys')).toBe(BET_CATEGORIES.LEAST_BOGEYS);
      expect(categorizeBetName('best back 9')).toBe(BET_CATEGORIES.BEST_BACK_NINE);
      expect(categorizeBetName('low score')).toBe(BET_CATEGORIES.LOWEST_SCORE);
    });

    it('should return custom for unmatched patterns', () => {
      expect(categorizeBetName('random bet')).toBe(BET_CATEGORIES.CUSTOM);
      expect(categorizeBetName('skin game')).toBe(BET_CATEGORIES.CUSTOM);
      expect(categorizeBetName('')).toBe(BET_CATEGORIES.CUSTOM);
      expect(categorizeBetName(null)).toBe(BET_CATEGORIES.CUSTOM);
    });
  });

  describe('isValidBetCategory', () => {
    it('should validate correct categories', () => {
      expect(isValidBetCategory('lowest_score')).toBe(true);
      expect(isValidBetCategory('custom')).toBe(true);
      expect(isValidBetCategory(null)).toBe(true); // NULL is valid for legacy
    });

    it('should reject invalid categories', () => {
      expect(isValidBetCategory('invalid_category')).toBe(false);
      expect(isValidBetCategory('random')).toBe(false);
      expect(isValidBetCategory('')).toBe(false);
    });
  });
});
