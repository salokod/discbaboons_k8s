/**
 * Friend Service Tests
 * Test suite for friend management API interactions
 */

import { friendService } from '../friendService';
import { API_BASE_URL } from '../../config/environment';
import { getTokens } from '../tokenStorage';

// Mock the global fetch
global.fetch = jest.fn();

// Mock tokenStorage
jest.mock('../tokenStorage', () => ({
  getTokens: jest.fn(),
}));

describe('friendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    getTokens.mockClear();
  });

  describe('getFriends', () => {
    it('should export getFriends function', () => {
      expect(friendService.getFriends).toBeDefined();
      expect(typeof friendService.getFriends).toBe('function');
    });

    it('should return properly formatted response with friends and pagination', async () => {
      const mockTokens = { accessToken: 'mock-access-token' };
      const mockResponse = {
        success: true,
        friends: [
          {
            id: 789,
            username: 'johndoe',
            friendship: {
              id: 123,
              status: 'accepted',
              created_at: '2024-01-15T10:30:00.000Z',
            },
            bag_stats: {
              total_bags: 5,
              visible_bags: 3,
              public_bags: 1,
            },
          },
        ],
        pagination: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };

      getTokens.mockResolvedValueOnce(mockTokens);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await friendService.getFriends({ limit: 20, offset: 0 });

      expect(getTokens).toHaveBeenCalledWith();
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/friends?limit=20&offset=0`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        friends: mockResponse.friends,
        pagination: mockResponse.pagination,
      });
    });

    it('should throw error when no access token available', async () => {
      getTokens.mockResolvedValueOnce(null);

      await expect(friendService.getFriends())
        .rejects
        .toThrow('Authentication required. Please log in again.');

      expect(getTokens).toHaveBeenCalledWith();
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
