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

  describe('getRequests', () => {
    it('should export getRequests function', () => {
      expect(friendService.getRequests).toBeDefined();
      expect(typeof friendService.getRequests).toBe('function');
    });

    it('should filter requests correctly by type parameter', async () => {
      const mockTokens = { accessToken: 'mock-access-token' };
      const mockResponse = {
        success: true,
        requests: [
          {
            id: 456,
            requester_id: 789,
            recipient_id: 123,
            status: 'pending',
            requester: {
              id: 789,
              username: 'johndoe',
              profile_image: null,
            },
            created_at: '2024-01-15T10:30:00.000Z',
          },
        ],
      };

      getTokens.mockResolvedValueOnce(mockTokens);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await friendService.getRequests('incoming');

      expect(getTokens).toHaveBeenCalledWith();
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/friends/requests?type=incoming`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mockTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        requests: mockResponse.requests,
      });
    });
  });

  describe('sendRequest', () => {
    it('should export sendRequest function', () => {
      expect(friendService.sendRequest).toBeDefined();
      expect(typeof friendService.sendRequest).toBe('function');
    });

    it('should send friend request with correct parameters', async () => {
      const mockTokens = { accessToken: 'mock-access-token' };
      const mockResponse = {
        success: true,
        request: {
          id: 789,
          requester_id: 123,
          recipient_id: 456,
          status: 'pending',
          created_at: '2024-01-15T10:30:00.000Z',
        },
      };

      getTokens.mockResolvedValueOnce(mockTokens);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await friendService.sendRequest(456);

      expect(getTokens).toHaveBeenCalledWith();
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId: 456 }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        request: mockResponse.request,
      });
    });
  });

  describe('searchUsers', () => {
    it('should export searchUsers function', () => {
      expect(friendService.searchUsers).toBeDefined();
      expect(typeof friendService.searchUsers).toBe('function');
    });
  });

  describe('respondToRequest', () => {
    it('should export respondToRequest function', () => {
      expect(friendService.respondToRequest).toBeDefined();
      expect(typeof friendService.respondToRequest).toBe('function');
    });

    it('should respond to friend request with accept action', async () => {
      const mockTokens = { accessToken: 'mock-access-token' };
      const mockResponse = {
        success: true,
        friendship: {
          id: 999,
          user1_id: 123,
          user2_id: 789,
          status: 'accepted',
          created_at: '2024-01-15T10:30:00.000Z',
        },
      };

      getTokens.mockResolvedValueOnce(mockTokens);
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await friendService.respondToRequest(456, 'accept');

      expect(getTokens).toHaveBeenCalledWith();
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/friends/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId: 456, action: 'accept' }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        friendship: mockResponse.friendship,
      });
    });
  });
});
