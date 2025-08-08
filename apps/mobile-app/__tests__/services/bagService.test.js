/**
 * BagService Tests
 */

import {
  getBags, createBag, updateBag, deleteBag,
} from '../../src/services/bagService';
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
global.setTimeout = jest.fn((fn, delay) => {
  const id = Math.random();
  return id;
});
global.clearTimeout = jest.fn();

describe('BagService Functions', () => {
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

  describe('createBag', () => {
    it('should successfully create a bag with valid data', async () => {
      const mockResponse = {
        success: true,
        bag: {
          id: '123',
          name: 'Tournament Bag',
          description: 'My competitive discs',
          is_public: false,
          is_friends_visible: false,
          disc_count: 0,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const bagData = {
        name: 'Tournament Bag',
        description: 'My competitive discs',
        privacy: 'private',
      };

      const result = await createBag(bagData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          name: 'Tournament Bag',
          description: 'My competitive discs',
          is_public: false,
          is_friends_visible: false,
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse.bag);
    });

    it('should throw error when bag name is missing', async () => {
      const bagData = {
        description: 'My competitive discs',
        privacy: 'private',
      };

      await expect(createBag(bagData)).rejects.toThrow('Bag name is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when bag name is empty', async () => {
      const bagData = {
        name: '   ',
        description: 'My competitive discs',
        privacy: 'private',
      };

      await expect(createBag(bagData)).rejects.toThrow('Bag name cannot be empty');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when privacy is invalid', async () => {
      const bagData = {
        name: 'Tournament Bag',
        description: 'My competitive discs',
        privacy: 'invalid',
      };

      await expect(createBag(bagData)).rejects.toThrow('Privacy must be private, friends, or public');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 409 conflict error for duplicate bag name', async () => {
      const mockResponse = {
        success: false,
        message: 'You already have a bag with this name',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockResponse,
      });

      const bagData = {
        name: 'Tournament Bag',
        description: 'My competitive discs',
        privacy: 'private',
      };

      await expect(createBag(bagData)).rejects.toThrow('You already have a bag with this name');
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      const bagData = {
        name: 'Tournament Bag',
        description: 'My competitive discs',
        privacy: 'private',
      };

      await expect(createBag(bagData)).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('getBags', () => {
    it('should successfully get bags with default parameters', async () => {
      const mockResponse = {
        success: true,
        bags: [
          {
            id: '123',
            name: 'Tournament Bag',
            description: 'My competitive discs',
            is_public: false,
            is_friends_visible: false,
            disc_count: 5,
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

      const result = await getBags();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        bags: mockResponse.bags,
        pagination: mockResponse.pagination,
      });
    });

    it('should successfully get bags with query parameters', async () => {
      const mockResponse = {
        success: true,
        bags: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = { limit: 10, offset: 0, include_lost: true };
      await getBags(params);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags?limit=10&offset=0&include_lost=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('updateBag', () => {
    it('should successfully update a bag', async () => {
      const mockResponse = {
        success: true,
        bag: {
          id: '123',
          name: 'Updated Tournament Bag',
          description: 'My updated competitive discs',
          is_public: false,
          is_friends_visible: true,
          disc_count: 5,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const updates = {
        name: 'Updated Tournament Bag',
        description: 'My updated competitive discs',
        privacy: 'friends',
      };

      const result = await updateBag('123', updates);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          name: 'Updated Tournament Bag',
          description: 'My updated competitive discs',
          is_public: false,
          is_friends_visible: true,
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse.bag);
    });

    it('should throw error when bagId is missing', async () => {
      const updates = { name: 'Updated Bag' };
      await expect(updateBag(null, updates)).rejects.toThrow('Bag ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 404 error for bag not found', async () => {
      const mockResponse = {
        success: false,
        message: 'Bag not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      const updates = { name: 'Updated Bag' };
      await expect(updateBag('999', updates)).rejects.toThrow('Bag not found');
    });
  });

  describe('deleteBag', () => {
    it('should successfully delete a bag', async () => {
      const mockResponse = {
        success: true,
        message: 'Bag deleted successfully',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await deleteBag('123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/123', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when bagId is missing', async () => {
      await expect(deleteBag(null)).rejects.toThrow('Bag ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 409 error when bag contains discs', async () => {
      const mockResponse = {
        success: false,
        message: 'Cannot delete bag that contains discs',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockResponse,
      });

      await expect(deleteBag('123')).rejects.toThrow('Cannot delete bag that contains discs');
    });
  });

  describe('export functions', () => {
    it('should export a getBags function', () => {
      expect(getBags).toBeTruthy();
    });

    it('should export a createBag function', () => {
      expect(createBag).toBeTruthy();
    });

    it('should export a updateBag function', () => {
      expect(updateBag).toBeTruthy();
    });

    it('should export a deleteBag function', () => {
      expect(deleteBag).toBeTruthy();
    });
  });
});
