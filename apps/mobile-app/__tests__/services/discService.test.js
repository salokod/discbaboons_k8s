/**
 * Tests for Disc Service
 * Handles API calls for disc database operations (master, pending, submission)
 */

import {
  searchDiscs, submitDisc, getPendingDiscs, approveDisc,
} from '../../src/services/discService';
import { getTokens } from '../../src/services/tokenStorage';

// Mock tokenStorage
jest.mock('../../src/services/tokenStorage');

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch;

// Mock environment
jest.mock('../../src/config/environment', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

describe('discService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Default mock for getTokens
    getTokens.mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  });

  describe('searchDiscs', () => {
    it('should export searchDiscs function', () => {
      expect(typeof searchDiscs).toBe('function');
    });

    it('should make GET request to /api/discs/master with no filters', async () => {
      const mockResponse = {
        success: true,
        discs: [
          {
            id: '1',
            brand: 'Innova',
            model: 'Destroyer',
            speed: 12,
            glide: 5,
            turn: -1,
            fade: 3,
            approved: true,
          },
        ],
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await searchDiscs();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/discs/master',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
          signal: expect.any(AbortSignal),
        },
      );

      expect(result.discs).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should build query parameters from filters', async () => {
      const mockResponse = {
        success: true,
        discs: [],
        pagination: {
          total: 0, limit: 50, offset: 0, hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await searchDiscs({
        brand: 'Innova',
        model: 'Destroyer',
        speed: '9-12',
        glide: 5,
        turn: '-2--1',
        fade: 3,
        limit: 25,
        offset: 10,
        approved: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/discs/master?brand=Innova&model=Destroyer&speed=9-12&glide=5&turn=-2--1&fade=3&limit=25&offset=10&approved=true',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        }),
      );
    });

    it('should handle 401 authentication error', async () => {
      const mockResponse = {
        success: false,
        message: 'Access token required',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(searchDiscs()).rejects.toThrow('Access token required');
    });

    it('should handle 400 validation error', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid filter parameters',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(searchDiscs({ speed: 'invalid' })).rejects.toThrow('Invalid filter parameters');
    });

    it('should handle missing access token', async () => {
      getTokens.mockResolvedValueOnce(null);

      await expect(searchDiscs()).rejects.toThrow('Authentication required. Please log in again.');
    });

    it('should handle server errors with user-friendly message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Internal Server Error' }),
      });

      await expect(searchDiscs()).rejects.toThrow('Something went wrong. Please try again.');
    });

    it('should validate response format', async () => {
      const mockResponse = {
        success: false, // Invalid response
        discs: 'not-an-array',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(searchDiscs()).rejects.toThrow('Invalid response from server');
    });

    it('should provide default pagination when missing', async () => {
      const mockResponse = {
        success: true,
        discs: [{ id: '1', brand: 'Test', model: 'Disc' }],
        // No pagination field
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await searchDiscs();

      expect(result.pagination).toEqual({
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      });
    });
  });

  describe('submitDisc', () => {
    const validDiscData = {
      brand: 'Innova',
      model: 'Destroyer',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
    };

    it('should export submitDisc function', () => {
      expect(typeof submitDisc).toBe('function');
    });

    it('should make POST request with valid disc data', async () => {
      const mockResponse = {
        success: true,
        disc: {
          id: '1',
          ...validDiscData,
          approved: false,
          added_by_id: 123,
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T10:30:00.000Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await submitDisc(validDiscData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/discs/master',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
          body: JSON.stringify({
            brand: 'Innova',
            model: 'Destroyer',
            speed: 12,
            glide: 5,
            turn: -1,
            fade: 3,
          }),
          signal: expect.any(AbortSignal),
        },
      );

      expect(result.brand).toBe('Innova');
      expect(result.approved).toBe(false);
    });

    it('should validate required fields', async () => {
      await expect(submitDisc()).rejects.toThrow('Disc data is required');
      await expect(submitDisc({})).rejects.toThrow('Brand is required');
      await expect(submitDisc({ brand: 'Innova' })).rejects.toThrow('Model is required');
    });

    it('should validate flight numbers', async () => {
      await expect(submitDisc({
        brand: 'Innova',
        model: 'Destroyer',
        speed: 20, // Invalid
        glide: 5,
        turn: -1,
        fade: 3,
      })).rejects.toThrow('Speed must be between 1 and 15');

      await expect(submitDisc({
        brand: 'Innova',
        model: 'Destroyer',
        speed: 12,
        glide: 10, // Invalid
        turn: -1,
        fade: 3,
      })).rejects.toThrow('Glide must be between 1 and 7');

      await expect(submitDisc({
        brand: 'Innova',
        model: 'Destroyer',
        speed: 12,
        glide: 5,
        turn: -10, // Invalid
        fade: 3,
      })).rejects.toThrow('Turn must be between -5 and 2');

      await expect(submitDisc({
        brand: 'Innova',
        model: 'Destroyer',
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 10, // Invalid
      })).rejects.toThrow('Fade must be between 0 and 5');
    });

    it('should handle 400 duplicate error', async () => {
      const mockResponse = {
        success: false,
        message: 'A disc with this brand and model already exists',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(submitDisc(validDiscData)).rejects.toThrow('A disc with this brand and model already exists');
    });

    it('should handle 429 rate limiting', async () => {
      const mockResponse = {
        success: false,
        message: 'Too many disc submissions. Please try again in an hour.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(submitDisc(validDiscData)).rejects.toThrow('Too many disc submissions. Please try again in an hour.');
    });

    it('should trim brand and model fields', async () => {
      const mockResponse = {
        success: true,
        disc: { ...validDiscData, id: '1', approved: false },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await submitDisc({
        brand: '  Innova  ',
        model: '  Destroyer  ',
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.brand).toBe('Innova');
      expect(requestBody.model).toBe('Destroyer');
    });
  });

  describe('getPendingDiscs', () => {
    it('should export getPendingDiscs function', () => {
      expect(typeof getPendingDiscs).toBe('function');
    });

    it('should make GET request to /api/discs/pending', async () => {
      const mockResponse = {
        success: true,
        discs: [
          {
            id: '1',
            brand: 'Dynamic Discs',
            model: 'Truth',
            speed: 5,
            glide: 5,
            turn: 0,
            fade: 2,
            approved: false,
            added_by_id: 456,
          },
        ],
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await getPendingDiscs();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/discs/pending',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
          signal: expect.any(AbortSignal),
        },
      );

      expect(result.discs).toHaveLength(1);
      expect(result.discs[0].approved).toBe(false);
    });

    it('should handle 403 admin access required', async () => {
      const mockResponse = {
        success: false,
        message: 'Admin access required',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(getPendingDiscs()).rejects.toThrow('Admin access required');
    });

    it('should support filtering like searchDiscs', async () => {
      const mockResponse = {
        success: true,
        discs: [],
        pagination: {
          total: 0, limit: 50, offset: 0, hasMore: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await getPendingDiscs({
        brand: 'Innova',
        speed: '9-12',
        limit: 10,
        offset: 5,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/discs/pending?brand=Innova&speed=9-12&limit=10&offset=5',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        }),
      );
    });
  });

  describe('approveDisc', () => {
    it('should export approveDisc function', () => {
      expect(typeof approveDisc).toBe('function');
    });

    it('should make PATCH request to approve disc', async () => {
      const discId = '770e8400-e29b-41d4-a716-446655440000';
      const mockResponse = {
        success: true,
        disc: {
          id: discId,
          brand: 'Dynamic Discs',
          model: 'Truth',
          speed: 5,
          glide: 5,
          turn: 0,
          fade: 2,
          approved: true,
          added_by_id: 456,
          created_at: '2024-01-15T10:30:00.000Z',
          updated_at: '2024-01-15T11:00:00.000Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await approveDisc(discId);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/discs/${discId}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          },
          signal: expect.any(AbortSignal),
        },
      );

      expect(result.id).toBe(discId);
      expect(result.approved).toBe(true);
    });

    it('should validate disc ID is required', async () => {
      await expect(approveDisc()).rejects.toThrow('Disc ID is required');
      await expect(approveDisc('')).rejects.toThrow('Disc ID is required');
      await expect(approveDisc(123)).rejects.toThrow('Disc ID is required');
    });

    it('should handle 404 disc not found', async () => {
      const mockResponse = {
        success: false,
        message: 'Disc not found',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(approveDisc('invalid-id')).rejects.toThrow('Disc not found');
    });

    it('should handle 403 admin access required', async () => {
      const mockResponse = {
        success: false,
        message: 'Admin access required',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await expect(approveDisc('valid-id')).rejects.toThrow('Admin access required');
    });
  });

  describe('timeout handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should abort requests after 30 seconds', async () => {
      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';

      mockFetch.mockRejectedValueOnce(abortError);

      const promise = searchDiscs();

      // Fast-forward time by 30 seconds
      jest.advanceTimersByTime(30000);

      await expect(promise).rejects.toThrow('The operation was aborted.');
    });
  });

  describe('network error handling', () => {
    it('should handle fetch network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(searchDiscs()).rejects.toThrow('Network error');
    });

    it('should handle fetch timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      await expect(submitDisc({
        brand: 'Test',
        model: 'Disc',
        speed: 5,
        glide: 5,
        turn: 0,
        fade: 2,
      })).rejects.toThrow('Request timeout');
    });
  });
});
