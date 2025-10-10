/**
 * RoundService Tests
 */

import {
  createRound,
  getRounds,
  getRoundDetails,
  getRoundLeaderboard,
  addPlayersToRound,
  pauseRound,
  completeRound,
  getRoundPars,
  submitScores,
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

  describe('getRoundLeaderboard', () => {
    it('should export a getRoundLeaderboard function', () => {
      expect(getRoundLeaderboard).toBeDefined();
      expect(typeof getRoundLeaderboard).toBe('function');
    });

    it('should throw error when roundId is missing', async () => {
      await expect(getRoundLeaderboard()).rejects.toThrow('Round ID is required');
      await expect(getRoundLeaderboard(null)).rejects.toThrow('Round ID is required');
      await expect(getRoundLeaderboard('')).rejects.toThrow('Round ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should make GET request to correct API endpoint /api/rounds/:id/leaderboard', async () => {
      const mockResponse = {
        players: [
          {
            id: 1,
            username: 'player1',
            display_name: 'Alice',
            position: 1,
            total_score: -3,
          },
          {
            id: 2,
            username: 'player2',
            display_name: 'Bob',
            position: 2,
            total_score: 1,
          },
        ],
        roundSettings: {
          scoringType: 'stroke_play',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getRoundLeaderboard('round-123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/rounds/round-123/leaderboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should return formatted leaderboard data with players and roundSettings', async () => {
      const mockResponse = {
        players: [
          {
            id: 1,
            username: 'player1',
            display_name: 'Alice',
            position: 1,
            total_score: -3,
          },
        ],
        roundSettings: {
          scoringType: 'stroke_play',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getRoundLeaderboard('round-123');

      expect(result).toEqual({
        players: mockResponse.players,
        roundSettings: mockResponse.roundSettings,
      });
    });

    it('should handle 404 error when round not found', async () => {
      const errorResponse = {
        success: false,
        message: 'Round not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      await expect(getRoundLeaderboard('nonexistent-round')).rejects.toThrow('Round not found');
    });

    it('should handle empty leaderboard', async () => {
      const mockResponse = {
        players: [],
        roundSettings: {
          scoringType: 'stroke_play',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getRoundLeaderboard('round-123');

      expect(result).toEqual({
        players: [],
        roundSettings: mockResponse.roundSettings,
      });
    });
  });

  describe('addPlayersToRound', () => {
    it('should export an addPlayersToRound function', () => {
      expect(addPlayersToRound).toBeDefined();
      expect(typeof addPlayersToRound).toBe('function');
    });
  });

  describe('getRoundPars', () => {
    it('should export a getRoundPars function', () => {
      expect(getRoundPars).toBeDefined();
      expect(typeof getRoundPars).toBe('function');
    });

    it('should fetch pars for a round successfully', async () => {
      const mockPars = {
        1: 3,
        2: 4,
        3: 3,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPars,
      });

      const result = await getRoundPars('round-123');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/rounds/round-123/pars',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        }),
      );
      expect(result).toEqual(mockPars);
    });

    it('should throw error when roundId is missing', async () => {
      await expect(getRoundPars('')).rejects.toThrow('Round ID is required');
    });

    it('should handle 404 error when round not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Round not found' }),
      });

      await expect(getRoundPars('nonexistent-round')).rejects.toThrow('Round not found');
    });

    it('should handle empty pars object', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await getRoundPars('round-123');

      expect(result).toEqual({});
    });
  });

  describe('pauseRound', () => {
    it('should export a pauseRound function', () => {
      expect(pauseRound).toBeDefined();
      expect(typeof pauseRound).toBe('function');
    });

    it('should throw error when roundId is missing', async () => {
      await expect(pauseRound()).rejects.toThrow('Round ID is required');
      await expect(pauseRound(null)).rejects.toThrow('Round ID is required');
      await expect(pauseRound('')).rejects.toThrow('Round ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should make PUT request with status in_progress', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'round-123',
          status: 'in_progress',
          name: 'Morning Round',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await pauseRound('round-123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/rounds/round-123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({ status: 'in_progress' }),
        signal: expect.any(AbortSignal),
      });
    });

    it('should unwrap backend response and return data object', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'round-123',
          status: 'in_progress',
          name: 'Morning Round',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await pauseRound('round-123');

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle 404 error when round not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Round not found' }),
      });

      await expect(pauseRound('nonexistent-round')).rejects.toThrow('Round not found');
    });
  });

  describe('completeRound', () => {
    it('should export a completeRound function', () => {
      expect(completeRound).toBeDefined();
      expect(typeof completeRound).toBe('function');
    });

    it('should throw error when roundId is missing', async () => {
      await expect(completeRound()).rejects.toThrow('Round ID is required');
      await expect(completeRound(null)).rejects.toThrow('Round ID is required');
      await expect(completeRound('')).rejects.toThrow('Round ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should make PUT request with status completed', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'round-123',
          status: 'completed',
          name: 'Morning Round',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await completeRound('round-123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/rounds/round-123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({ status: 'completed' }),
        signal: expect.any(AbortSignal),
      });
    });

    it('should unwrap backend response and return data object', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'round-123',
          status: 'completed',
          name: 'Morning Round',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await completeRound('round-123');

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle 404 error when round not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Round not found' }),
      });

      await expect(completeRound('nonexistent-round')).rejects.toThrow('Round not found');
    });
  });

  describe('submitScores', () => {
    it('should export a submitScores function', () => {
      expect(submitScores).toBeDefined();
      expect(typeof submitScores).toBe('function');
    });

    it('should throw error when roundId is missing', async () => {
      await expect(submitScores()).rejects.toThrow('Round ID is required');
      await expect(submitScores(null, [])).rejects.toThrow('Round ID is required');
      await expect(submitScores('', [])).rejects.toThrow('Round ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when scores is missing', async () => {
      await expect(submitScores('round-123')).rejects.toThrow('Scores array is required');
      await expect(submitScores('round-123', null)).rejects.toThrow('Scores array is required');
      await expect(submitScores('round-123', 'not-array')).rejects.toThrow('Scores array is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when scores array is empty', async () => {
      await expect(submitScores('round-123', [])).rejects.toThrow('Scores array cannot be empty');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);
      const scores = [
        { hole: 1, player_id: 'player-1', score: 3 },
      ];

      await expect(submitScores('round-123', scores)).rejects.toThrow('Authentication required');
    });

    it('should successfully submit scores to backend', async () => {
      const scores = [
        { hole: 1, player_id: 'player-1', score: 3 },
        { hole: 1, player_id: 'player-2', score: 4 },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Scores saved successfully' }),
      });

      const result = await submitScores('round-123', scores);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/rounds/round-123/scores',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          }),
          body: JSON.stringify({ scores }),
        }),
      );

      expect(result).toEqual({ success: true, message: 'Scores saved successfully' });
    });

    it('should handle 401 authentication error', async () => {
      const scores = [{ hole: 1, player_id: 'player-1', score: 3 }];

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(submitScores('round-123', scores)).rejects.toThrow('Unauthorized');
    });

    it('should handle 400 validation error', async () => {
      const scores = [{ hole: 1, player_id: 'player-1', score: 3 }];

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid score data' }),
      });

      await expect(submitScores('round-123', scores)).rejects.toThrow('Invalid score data');
    });

    it('should handle 404 round not found error', async () => {
      const scores = [{ hole: 1, player_id: 'player-1', score: 3 }];

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Round not found' }),
      });

      await expect(submitScores('round-123', scores)).rejects.toThrow('Round not found');
    });

    it('should handle 500 server error', async () => {
      const scores = [{ hole: 1, player_id: 'player-1', score: 3 }];

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });

      await expect(submitScores('round-123', scores)).rejects.toThrow('Something went wrong');
    });

    it('should handle network error', async () => {
      const scores = [{ hole: 1, player_id: 'player-1', score: 3 }];

      const networkError = new Error('Network request failed');
      fetch.mockRejectedValueOnce(networkError);

      await expect(submitScores('round-123', scores)).rejects.toThrow('Network request failed');
    });
  });
});
