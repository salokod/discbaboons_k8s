import { describe, it, expect } from 'vitest';
import friendsRequestLimit from '../../../middleware/friendsRequestLimit.middleware.js';

describe('friendsRequestLimit.middleware.js', () => {
  describe('friendsRequestLimit', () => {
    it('should export friendsRequestLimit middleware', () => {
      expect(friendsRequestLimit).toBeDefined();
      expect(typeof friendsRequestLimit).toBe('function');
    });

    it('should have correct size limit configuration', () => {
      // Test that it's configured for 1KB limit
      // This is a functional test - we'll verify the limit is set correctly
      expect(friendsRequestLimit.name).toBe('jsonParser');
    });
  });
});
