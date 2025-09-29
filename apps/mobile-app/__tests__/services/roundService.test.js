/**
 * RoundService Tests
 */

import {
  createRound, getRounds, getRoundDetails, addPlayersToRound,
} from '../../src/services/roundService';
import { getTokens } from '../../src/services/tokenStorage';

// Mock the environment config
jest.mock('../../src/config/environment', () => ({
  API_BASE_URL: 'http://localhost:8080',
}));

// Mock tokenStorage service
jest.mock('../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock timers globally
global.setTimeout = jest.fn(() => {
  const id = Math.random();
  return id;
});
global.clearTimeout = jest.fn();

describe('RoundService Functions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fetch.mockClear();
    global.setTimeout.mockClear();
    global.clearTimeout.mockClear();

    // Mock successful token retrieval
    getTokens.mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  });

  describe('createRound', () => {
    it('should export a createRound function', () => {
      expect(createRound).toBeDefined();
      expect(typeof createRound).toBe('function');
    });

    it('should throw error when roundData is missing', async () => {
      await expect(createRound()).rejects.toThrow('Round data is required');
      await expect(createRound(null)).rejects.toThrow('Round data is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when courseId is missing', async () => {
      const roundData = {
        name: 'Morning Round',
      };
      await expect(createRound(roundData)).rejects.toThrow('Course ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when courseId is empty string', async () => {
      const roundData = {
        courseId: '',
        name: 'Morning Round',
      };
      await expect(createRound(roundData)).rejects.toThrow('Course ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when name is missing', async () => {
      const roundData = {
        courseId: 'course-123',
      };
      await expect(createRound(roundData)).rejects.toThrow('Round name is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when name is empty after trimming', async () => {
      const roundData = {
        courseId: 'course-123',
        name: '   ',
      };
      await expect(createRound(roundData)).rejects.toThrow('Round name cannot be empty');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when name is too long', async () => {
      const roundData = {
        courseId: 'course-123',
        name: 'A'.repeat(101), // Max 100 characters
      };
      await expect(createRound(roundData)).rejects.toThrow('Round name must be no more than 100 characters');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      const roundData = {
        courseId: 'course-123',
        name: 'Morning Round',
      };

      await expect(createRound(roundData)).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should make POST request to correct API endpoint /api/rounds', async () => {
      const mockResponse = {
        id: 'round-123',
        name: 'Morning Round',
        course_id: 'course-456',
        start_time: '2024-01-15T08:00:00Z',
        status: 'scheduled',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const roundData = {
        courseId: 'course-456',
        name: 'Morning Round',
      };

      await createRound(roundData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          courseId: 'course-456',
          name: 'Morning Round',
          startingHole: 1,
          isPrivate: false,
          skinsEnabled: false,
          skinsValue: null,
        }),
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle direct response object without success wrapper', async () => {
      const mockResponse = {
        id: 'round-123',
        name: 'Morning Round',
        course_id: 'course-456',
        start_time: '2024-01-15T08:00:00Z',
        status: 'scheduled',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const roundData = {
        courseId: 'course-456',
        name: 'Morning Round',
      };

      const result = await createRound(roundData);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRounds', () => {
    it('should export a getRounds function', () => {
      expect(getRounds).toBeDefined();
      expect(typeof getRounds).toBe('function');
    });

    it('should successfully get rounds with default parameters', async () => {
      const mockResponse = {
        success: true,
        rounds: [
          {
            id: 'round-123',
            course_id: 'course-456',
            name: 'Morning Round',
            start_time: '2024-01-15T08:00:00Z',
            status: 'in_progress',
            player_count: 2,
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
        json: async () => mockResponse,
      });

      const result = await getRounds();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/rounds', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        rounds: mockResponse.rounds,
        pagination: mockResponse.pagination,
      });
    });

    it('should successfully get rounds with query parameters', async () => {
      const mockResponse = {
        success: true,
        rounds: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 5,
          hasMore: false,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = { limit: 10, offset: 5, status: 'completed' };
      await getRounds(params);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/rounds?limit=10&offset=5&status=completed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      await expect(getRounds()).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle invalid response format', async () => {
      const invalidResponse = {
        // Missing success field and rounds field
        data: [],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(getRounds()).rejects.toThrow('Invalid response from server');
    });
  });

  describe('getRoundDetails', () => {
    it('should export a getRoundDetails function', () => {
      expect(getRoundDetails).toBeDefined();
      expect(typeof getRoundDetails).toBe('function');
    });

    it('should throw error when roundId is missing', async () => {
      await expect(getRoundDetails()).rejects.toThrow('Round ID is required');
      await expect(getRoundDetails(null)).rejects.toThrow('Round ID is required');
      await expect(getRoundDetails('')).rejects.toThrow('Round ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should successfully get round details', async () => {
      const mockResponse = {
        success: true,
        round: {
          id: 'round-123',
          course_id: 'course-456',
          name: 'Morning Round',
          start_time: '2024-01-15T08:00:00Z',
          status: 'completed',
          players: [
            {
              id: 'player-1',
              username: 'testuser1',
              is_creator: true,
            },
            {
              id: 'player-2',
              username: 'testuser2',
              is_creator: false,
            },
          ],
          pars: {
            1: 3,
            2: 4,
            3: 3,
          },
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getRoundDetails('round-123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/rounds/round-123', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse.round);
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      await expect(getRoundDetails('round-123')).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 404 error for round not found', async () => {
      const errorResponse = {
        success: false,
        message: 'Round not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      await expect(getRoundDetails('nonexistent-round')).rejects.toThrow('Round not found');
    });

    it('should handle direct response format from backend', async () => {
      // Backend returns round data directly (not wrapped in success/round structure)
      const directResponse = {
        id: 'round-123',
        course_id: 'course-456',
        name: 'Morning Round',
        start_time: '2024-01-15T08:00:00Z',
        status: 'completed',
        players: [
          {
            id: 'player-1',
            username: 'testuser1',
            is_creator: true,
          },
        ],
        pars: {
          1: 3,
          2: 4,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => directResponse,
      });

      const result = await getRoundDetails('round-123');

      expect(result).toEqual(directResponse);
    });

    it('should handle invalid response format', async () => {
      const invalidResponse = {
        // Missing success field and round field
        data: { id: 'round-123' },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(getRoundDetails('round-123')).rejects.toThrow('Invalid response from server');
    });
  });

  describe('addPlayersToRound', () => {
    it('should export an addPlayersToRound function', () => {
      expect(addPlayersToRound).toBeDefined();
      expect(typeof addPlayersToRound).toBe('function');
    });
  });
});
