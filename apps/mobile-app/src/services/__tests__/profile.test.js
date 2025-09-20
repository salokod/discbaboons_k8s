/**
 * Profile Service Tests
 * Tests for profile-related API calls
 */

import { searchUsers } from '../profile';
import { getTokens } from '../tokenStorage';

// Mock dependencies
jest.mock('../tokenStorage');
jest.mock('../../config/environment', () => ({
  API_BASE_URL: 'http://localhost:3001',
}));

// Mock fetch
global.fetch = jest.fn();

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTokens.mockResolvedValue(mockTokens);
  });

  describe('searchUsers', () => {
    it('should export searchUsers function', () => {
      expect(searchUsers).toBeDefined();
      expect(typeof searchUsers).toBe('function');
    });

    it('should search users with query parameter', async () => {
      const mockResponse = {
        success: true,
        users: [
          {
            id: 123,
            username: 'testuser',
            email: 'test@example.com',
            profile_image: null,
          },
        ],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchUsers('testuser');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/profile/search?query=testuser&limit=20&offset=0',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
          signal: expect.any(AbortSignal),
        },
      );

      expect(result).toEqual({
        users: mockResponse.users,
        pagination: mockResponse.pagination,
      });
    });

    it('should handle search with pagination options', async () => {
      const mockResponse = {
        success: true,
        users: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 5,
          hasMore: false,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await searchUsers('test', { limit: 10, offset: 5 });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/profile/search?query=test&limit=10&offset=5',
        expect.any(Object),
      );
    });

    it('should throw error when query is missing', async () => {
      await expect(searchUsers()).rejects.toThrow('Search query is required');
      await expect(searchUsers('')).rejects.toThrow('Search query is required');
    });
  });
});
