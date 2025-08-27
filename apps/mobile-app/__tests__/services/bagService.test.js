/**
 * BagService Tests
 */

import {
  getBags,
  getBag,
  createBag,
  updateBag,
  deleteBag,
  addDiscToBag,
  removeDiscFromBag,
  updateDiscInBag,
  markDiscAsLost,
  moveDiscBetweenBags,
  bulkMarkDiscsAsLost,
  getLostDiscs,
  bulkRecoverDiscs,
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
global.setTimeout = jest.fn(() => {
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
          Authorization: 'Bearer mock-access-token',
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
          Authorization: 'Bearer mock-access-token',
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
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('getBag', () => {
    it('should successfully get a bag with proper API response format', async () => {
      // This is the actual format the API returns (based on user's Bruno test)
      const mockResponse = {
        success: true,
        bag: {
          id: '812ec400-2da5-432f-988b-dcac7167a4d0',
          user_id: 4,
          name: 'Squatch',
          description: 'Main',
          is_public: false,
          is_friends_visible: true,
          created_at: '2025-08-09T12:30:52.802Z',
          updated_at: '2025-08-09T12:30:52.802Z',
          bag_contents: [],
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getBag('812ec400-2da5-432f-988b-dcac7167a4d0');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/812ec400-2da5-432f-988b-dcac7167a4d0', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });

      // Should return just the bag data (unwrapped from success envelope)
      expect(result).toEqual(mockResponse.bag);
    });

    it('should handle bag with include_lost parameter', async () => {
      const mockResponse = {
        success: true,
        bag: {
          id: 'test-bag',
          name: 'Test Bag',
          bag_contents: [
            {
              id: 'content-1',
              is_lost: true,
              model: 'Thunderbird',
            },
          ],
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getBag('test-bag', { include_lost: true });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/bags/test-bag?include_lost=true',
        expect.objectContaining({
          method: 'GET',
        }),
      );

      expect(result).toEqual(mockResponse.bag);
    });

    it('should handle bag with null bag_contents', async () => {
      const mockResponse = {
        success: true,
        bag: {
          id: 'empty-bag',
          name: 'Empty Bag',
          bag_contents: null, // API might return null instead of []
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getBag('empty-bag');

      // Should convert null to empty array
      expect(result.bag_contents).toEqual([]);
    });

    it('should throw error for invalid response format', async () => {
      const invalidResponse = {
        // Missing success field and bag field
        data: { id: 'test' },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(getBag('test-bag')).rejects.toThrow('Invalid response from server');
    });

    it('should throw error when bagId is missing', async () => {
      await expect(getBag()).rejects.toThrow('Bag ID is required');
      await expect(getBag('')).rejects.toThrow('Bag ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 404 error for bag not found', async () => {
      const errorResponse = {
        error: 'NotFoundError',
        message: 'Bag not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      await expect(getBag('nonexistent-bag')).rejects.toThrow('Bag not found');
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
          Authorization: 'Bearer mock-access-token',
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
          Authorization: 'Bearer mock-access-token',
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

  describe('addDiscToBag', () => {
    it('should successfully add a disc to a bag', async () => {
      const mockBagContent = {
        id: '660e8400-e29b-41d4-a716-446655440000',
        user_id: 123,
        bag_id: '550e8400-e29b-41d4-a716-446655440000',
        disc_id: '770e8400-e29b-41d4-a716-446655440000',
        notes: null,
        weight: null,
        condition: null,
        plastic_type: null,
        color: null,
        speed: 9,
        glide: 5,
        turn: -1,
        fade: 2,
        brand: 'Innova',
        model: 'Thunderbird',
        is_lost: false,
        added_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z',
      };

      const mockResponse = {
        success: true,
        bag_content: mockBagContent,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const discData = {
        disc_id: '770e8400-e29b-41d4-a716-446655440000',
      };

      const result = await addDiscToBag('550e8400-e29b-41d4-a716-446655440000', discData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/550e8400-e29b-41d4-a716-446655440000/discs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify(discData),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockBagContent);
    });

    it('should throw error when bagId is missing', async () => {
      const discData = { disc_id: 'test-disc-id' };
      await expect(addDiscToBag('', discData)).rejects.toThrow('Bag ID is required');
      await expect(addDiscToBag(null, discData)).rejects.toThrow('Bag ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when discData is missing', async () => {
      await expect(addDiscToBag('test-bag', null)).rejects.toThrow('Disc data is required');
      await expect(addDiscToBag('test-bag', {})).rejects.toThrow('Disc ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error when disc_id is missing from discData', async () => {
      const discData = { notes: 'test notes' };
      await expect(addDiscToBag('test-bag', discData)).rejects.toThrow('Disc ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 403 authorization error', async () => {
      const errorResponse = {
        error: 'AuthorizationError',
        message: 'Bag not found or access denied',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => errorResponse,
      });

      const discData = { disc_id: 'test-disc-id' };
      await expect(addDiscToBag('test-bag', discData)).rejects.toThrow('Bag not found or access denied');
    });

    it('should handle 404 disc not found error', async () => {
      const errorResponse = {
        error: 'NotFoundError',
        message: 'Disc not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      const discData = { disc_id: 'nonexistent-disc-id' };
      await expect(addDiscToBag('test-bag', discData)).rejects.toThrow('Disc not found');
    });
  });

  describe('removeDiscFromBag', () => {
    it('should export removeDiscFromBag function', () => {
      expect(removeDiscFromBag).toBeInstanceOf(Function);
    });

    it('should throw error for missing contentId', async () => {
      await expect(removeDiscFromBag()).rejects.toThrow('Content ID is required');
      await expect(removeDiscFromBag('')).rejects.toThrow('Content ID is required');
      await expect(removeDiscFromBag(null)).rejects.toThrow('Content ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should include authentication headers', async () => {
      const mockResponse = {
        success: true,
        message: 'Disc removed from bag',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await removeDiscFromBag('test-content-id');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/discs/test-content-id', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle successful removal', async () => {
      const mockResponse = {
        success: true,
        message: 'Disc removed from bag',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await removeDiscFromBag('test-content-id');

      expect(result).toEqual(mockResponse);
    });

    it('should handle disc not found error', async () => {
      const errorResponse = {
        success: false,
        message: 'Disc not found in bag',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      await expect(removeDiscFromBag('nonexistent-content-id')).rejects.toThrow('Disc not found in bag');
    });

    it('should handle authentication errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Access token required',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      await expect(removeDiscFromBag('test-content-id')).rejects.toThrow('Access token required');
    });

    it('should handle network timeout with 30-second timeout', async () => {
      // Test that timeout is set up correctly
      const mockResponse = {
        success: true,
        message: 'Disc removed from bag',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await removeDiscFromBag('test-content-id');

      // Verify setTimeout was called for 30 seconds (30000ms)
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
      // Verify clearTimeout was called
      expect(global.clearTimeout).toHaveBeenCalled();
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      await expect(removeDiscFromBag('test-content-id')).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Internal server error',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      await expect(removeDiscFromBag('test-content-id')).rejects.toThrow('Something went wrong. Please try again.');
    });
  });

  describe('updateDiscInBag', () => {
    it('should export updateDiscInBag function', () => {
      expect(updateDiscInBag).toBeInstanceOf(Function);
    });

    it('should throw error for missing bagId', async () => {
      await expect(updateDiscInBag()).rejects.toThrow('Bag ID is required');
      await expect(updateDiscInBag('')).rejects.toThrow('Bag ID is required');
      await expect(updateDiscInBag(null)).rejects.toThrow('Bag ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error for missing contentId', async () => {
      await expect(updateDiscInBag('bag-123')).rejects.toThrow('Content ID is required');
      await expect(updateDiscInBag('bag-123', '')).rejects.toThrow('Content ID is required');
      await expect(updateDiscInBag('bag-123', null)).rejects.toThrow('Content ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error for missing updates', async () => {
      await expect(updateDiscInBag('bag-123', 'content-456')).rejects.toThrow('Updates object is required');
      await expect(updateDiscInBag('bag-123', 'content-456', null)).rejects.toThrow('Updates object is required');
      await expect(updateDiscInBag('bag-123', 'content-456', '')).rejects.toThrow('Updates object is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should include authentication headers', async () => {
      const mockResponse = {
        success: true,
        bag_content: {
          id: 'content-456',
          speed: 9,
          glide: 5,
          notes: 'My favorite driver',
          color: 'red',
          condition: 'good',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const updates = { speed: 9, glide: 5 };
      await updateDiscInBag('bag-123', 'content-456', updates);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/bag-123/discs/content-456', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify(updates),
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle successful update', async () => {
      const mockResponse = {
        success: true,
        bag_content: {
          id: 'content-456',
          speed: 9,
          glide: 5,
          notes: 'My favorite driver',
          color: 'red',
          condition: 'good',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const updates = {
        speed: 9,
        glide: 5,
        notes: 'My favorite driver',
        color: 'red',
        condition: 'good',
      };

      const result = await updateDiscInBag('bag-123', 'content-456', updates);

      expect(result).toEqual(mockResponse.bag_content);
    });

    it('should handle disc not found error', async () => {
      const errorResponse = {
        success: false,
        message: 'Disc not found in bag',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      const updates = { speed: 9 };
      await expect(updateDiscInBag('bag-123', 'nonexistent-content-id', updates)).rejects.toThrow('Disc not found in bag');
    });

    it('should handle validation errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Invalid update data',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      const updates = { speed: 'invalid' };
      await expect(updateDiscInBag('bag-123', 'content-456', updates)).rejects.toThrow('Invalid update data');
    });

    it('should handle authentication errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Access token required',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      const updates = { speed: 9 };
      await expect(updateDiscInBag('bag-123', 'content-456', updates)).rejects.toThrow('Access token required');
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Internal server error',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      const updates = { speed: 9 };
      await expect(updateDiscInBag('bag-123', 'content-456', updates)).rejects.toThrow('Something went wrong. Please try again.');
    });

    it('should handle network timeout with 30-second timeout', async () => {
      const mockResponse = {
        success: true,
        bag_content: {
          id: 'content-456',
          speed: 9,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const updates = { speed: 9 };
      await updateDiscInBag('bag-123', 'content-456', updates);

      // Verify setTimeout was called for 30 seconds (30000ms)
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
      // Verify clearTimeout was called
      expect(global.clearTimeout).toHaveBeenCalled();
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      const updates = { speed: 9 };
      await expect(updateDiscInBag('bag-123', 'content-456', updates)).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('markDiscAsLost', () => {
    it('should export markDiscAsLost function', () => {
      expect(markDiscAsLost).toBeInstanceOf(Function);
    });

    it('should throw error for missing contentId', async () => {
      await expect(markDiscAsLost()).rejects.toThrow('Content ID is required');
      await expect(markDiscAsLost('')).rejects.toThrow('Content ID is required');
      await expect(markDiscAsLost(null)).rejects.toThrow('Content ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle successful disc marked as lost', async () => {
      const mockResponse = {
        success: true,
        bag_content: {
          id: 'content-456',
          disc_id: 'disc-123',
          is_lost: true,
          lost_notes: 'Lost at hole 7',
          updated_at: '2024-01-15T10:30:00.000Z',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await markDiscAsLost('content-456', true, 'Lost at hole 7');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/discs/content-456/lost', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          is_lost: true,
          lost_notes: 'Lost at hole 7',
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse.bag_content);
    });

    it('should handle successful disc marked as found', async () => {
      const mockResponse = {
        success: true,
        bag_content: {
          id: 'content-456',
          disc_id: 'disc-123',
          is_lost: false,
          lost_notes: null,
          updated_at: '2024-01-15T10:30:00.000Z',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await markDiscAsLost('content-456', false);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/discs/content-456/lost', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          is_lost: false,
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse.bag_content);
    });

    it('should handle disc not found error', async () => {
      const errorResponse = {
        success: false,
        message: 'Disc not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      await expect(markDiscAsLost('nonexistent-content-id', true)).rejects.toThrow('Disc not found');
    });

    it('should handle authentication errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Access token required',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      await expect(markDiscAsLost('content-456', true)).rejects.toThrow('Access token required');
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Internal server error',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      await expect(markDiscAsLost('content-456', true)).rejects.toThrow('Something went wrong. Please try again.');
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      await expect(markDiscAsLost('content-456', true)).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle network timeout with 30-second timeout', async () => {
      const mockResponse = {
        success: true,
        bag_content: {
          id: 'content-456',
          is_lost: true,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await markDiscAsLost('content-456', true);

      // Verify setTimeout was called for 30 seconds (30000ms)
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
      // Verify clearTimeout was called
      expect(global.clearTimeout).toHaveBeenCalled();
    });
  });

  describe('moveDiscBetweenBags', () => {
    it('should export moveDiscBetweenBags function', () => {
      expect(moveDiscBetweenBags).toBeInstanceOf(Function);
    });

    it('should throw error for missing sourceBagId', async () => {
      await expect(moveDiscBetweenBags()).rejects.toThrow('Source bag ID is required');
      await expect(moveDiscBetweenBags('')).rejects.toThrow('Source bag ID is required');
      await expect(moveDiscBetweenBags(null)).rejects.toThrow('Source bag ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error for missing targetBagId', async () => {
      await expect(moveDiscBetweenBags('source-bag-id')).rejects.toThrow('Target bag ID is required');
      await expect(moveDiscBetweenBags('source-bag-id', '')).rejects.toThrow('Target bag ID is required');
      await expect(moveDiscBetweenBags('source-bag-id', null)).rejects.toThrow('Target bag ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error for missing contentIds', async () => {
      await expect(moveDiscBetweenBags('source-bag-id', 'target-bag-id')).rejects.toThrow('Content IDs are required');
      await expect(moveDiscBetweenBags('source-bag-id', 'target-bag-id', null)).rejects.toThrow('Content IDs are required');
      await expect(moveDiscBetweenBags('source-bag-id', 'target-bag-id', '')).rejects.toThrow('Content IDs are required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throw error for empty contentIds array', async () => {
      await expect(moveDiscBetweenBags('source-bag-id', 'target-bag-id', [])).rejects.toThrow('At least one content ID is required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should include authentication headers and make PUT request with correct payload', async () => {
      const mockResponse = {
        success: true,
        movedCount: 2,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const sourceBagId = 'source-bag-123';
      const targetBagId = 'target-bag-456';
      const contentIds = ['content-1', 'content-2'];

      await moveDiscBetweenBags(sourceBagId, targetBagId, contentIds);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/discs/move', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          sourceBagId,
          targetBagId,
          contentIds,
        }),
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle successful move operation', async () => {
      const mockResponse = {
        success: true,
        movedCount: 2,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await moveDiscBetweenBags('source-bag-123', 'target-bag-456', ['content-1', 'content-2']);

      expect(result).toEqual(mockResponse);
    });

    it('should handle 401 authentication errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Authentication required. Please log in again.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      await expect(moveDiscBetweenBags('source-bag-123', 'target-bag-456', ['content-1'])).rejects.toThrow('Authentication required. Please log in again.');
    });

    it('should handle 404 not found errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Source bag not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      await expect(moveDiscBetweenBags('nonexistent-bag', 'target-bag-456', ['content-1'])).rejects.toThrow('Source bag not found');
    });

    it('should handle network timeout with 30-second timeout', async () => {
      const mockResponse = {
        success: true,
        movedCount: 1,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await moveDiscBetweenBags('source-bag-123', 'target-bag-456', ['content-1']);

      // Verify setTimeout was called for 30 seconds (30000ms)
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
      // Verify clearTimeout was called
      expect(global.clearTimeout).toHaveBeenCalled();
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      await expect(moveDiscBetweenBags('source-bag-123', 'target-bag-456', ['content-1'])).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Internal server error',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      await expect(moveDiscBetweenBags('source-bag-123', 'target-bag-456', ['content-1'])).rejects.toThrow('Something went wrong. Please try again.');
    });
  });

  describe('bulkMarkDiscsAsLost', () => {
    it('should successfully mark multiple discs as lost', async () => {
      const successResponse = {
        success: true,
        markedLostCount: 2,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => successResponse,
      });

      const result = await bulkMarkDiscsAsLost(['content-1', 'content-2'], true, 'Lost during tournament');

      expect(result).toEqual(successResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/bags/discs/bulk-mark-lost',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          }),
          body: JSON.stringify({
            contentIds: ['content-1', 'content-2'],
            isLost: true,
            notes: 'Lost during tournament',
          }),
        }),
      );
    });

    it('should validate contentIds parameter', async () => {
      await expect(bulkMarkDiscsAsLost()).rejects.toThrow('Content IDs are required');
      await expect(bulkMarkDiscsAsLost(null)).rejects.toThrow('Content IDs are required');
      await expect(bulkMarkDiscsAsLost([])).rejects.toThrow('At least one content ID is required');
    });

    it('should handle authentication errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Authentication required',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      await expect(bulkMarkDiscsAsLost(['content-1'])).rejects.toThrow('Authentication required');
    });

    it('should handle not found errors', async () => {
      const errorResponse = {
        success: false,
        message: 'One or more discs not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      await expect(bulkMarkDiscsAsLost(['content-1', 'content-2'])).rejects.toThrow('One or more discs not found');
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Internal server error',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      await expect(bulkMarkDiscsAsLost(['content-1'])).rejects.toThrow('Something went wrong. Please try again.');
    });

    it('should default isLost to true and notes to empty string', async () => {
      const successResponse = {
        success: true,
        markedLostCount: 1,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => successResponse,
      });

      await bulkMarkDiscsAsLost(['content-1']);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/bags/discs/bulk-mark-lost',
        expect.objectContaining({
          body: JSON.stringify({
            contentIds: ['content-1'],
            isLost: true,
            notes: '',
          }),
        }),
      );
    });

    it('should support marking discs as found', async () => {
      const successResponse = {
        success: true,
        markedFoundCount: 1,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => successResponse,
      });

      await bulkMarkDiscsAsLost(['content-1'], false);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/bags/discs/bulk-mark-lost',
        expect.objectContaining({
          body: JSON.stringify({
            contentIds: ['content-1'],
            isLost: false,
            notes: '',
          }),
        }),
      );
    });
  });

  describe('getLostDiscs', () => {
    it('should export getLostDiscs function', () => {
      expect(getLostDiscs).toBeInstanceOf(Function);
    });

    it('should successfully get lost discs with default parameters', async () => {
      const mockResponse = {
        success: true,
        items: [
          {
            id: 'content-1',
            disc_id: 'disc-123',
            bag_id: 'bag-456',
            bag_name: 'My Bag',
            brand: 'Innova',
            model: 'Thunderbird',
            is_lost: true,
            lost_notes: 'Lost at hole 7',
            lost_at: '2024-01-15T10:30:00.000Z',
          },
          {
            id: 'content-2',
            disc_id: 'disc-789',
            bag_id: 'bag-456',
            bag_name: 'My Bag',
            brand: 'Discraft',
            model: 'Buzzz',
            is_lost: true,
            lost_notes: null,
            lost_at: '2024-01-14T15:20:00.000Z',
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getLostDiscs();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/lost-discs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        items: mockResponse.items,
        pagination: {
          total: mockResponse.total,
          limit: mockResponse.limit,
          offset: mockResponse.offset,
          hasMore: mockResponse.hasMore,
        },
      });
    });

    it('should successfully get lost discs with pagination parameters', async () => {
      const mockResponse = {
        success: true,
        items: [],
        total: 5,
        limit: 2,
        offset: 4,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = { limit: 2, offset: 4 };
      await getLostDiscs(params);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/lost-discs?limit=2&offset=4', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle authentication errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Authentication required. Please log in again.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      await expect(getLostDiscs()).rejects.toThrow('Authentication required. Please log in again.');
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Internal server error',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      await expect(getLostDiscs()).rejects.toThrow('Something went wrong. Please try again.');
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      await expect(getLostDiscs()).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle invalid response format', async () => {
      const invalidResponse = {
        // Missing success field and items field
        data: [],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(getLostDiscs()).rejects.toThrow('Invalid response from server');
    });

    it('should handle network timeout with 30-second timeout', async () => {
      const mockResponse = {
        success: true,
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getLostDiscs();

      // Verify setTimeout was called for 30 seconds (30000ms)
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
      // Verify clearTimeout was called
      expect(global.clearTimeout).toHaveBeenCalled();
    });
  });

  describe('bulkRecoverDiscs', () => {
    it('should export bulkRecoverDiscs function', () => {
      expect(bulkRecoverDiscs).toBeInstanceOf(Function);
    });

    it('should successfully recover multiple lost discs to specified bag', async () => {
      const mockResponse = {
        success: true,
        recoveredCount: 2,
        message: '2 discs recovered successfully',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = {
        contentIds: ['content-1', 'content-2'],
        targetBagId: 'bag-456',
      };

      const result = await bulkRecoverDiscs(payload);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/discs/bulk-recover', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          content_ids: payload.contentIds,
          bag_id: payload.targetBagId,
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should transform camelCase field names to snake_case for backend API', async () => {
      const mockResponse = {
        success: true,
        recoveredCount: 3,
        message: '3 discs recovered successfully',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = {
        contentIds: ['content-a', 'content-b', 'content-c'],
        targetBagId: 'target-bag-123',
      };

      await bulkRecoverDiscs(payload);

      // Verify that camelCase fields are transformed to snake_case
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/bags/discs/bulk-recover', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        body: JSON.stringify({
          content_ids: ['content-a', 'content-b', 'content-c'],
          bag_id: 'target-bag-123',
        }),
        signal: expect.any(AbortSignal),
      });
    });

    it('should validate payload parameter', async () => {
      await expect(bulkRecoverDiscs()).rejects.toThrow('Recovery payload is required');
      await expect(bulkRecoverDiscs(null)).rejects.toThrow('Recovery payload is required');
      await expect(bulkRecoverDiscs({})).rejects.toThrow('Content IDs are required');
    });

    it('should validate contentIds in payload', async () => {
      await expect(bulkRecoverDiscs({ contentIds: null })).rejects.toThrow('Content IDs are required');
      await expect(bulkRecoverDiscs({ contentIds: [] })).rejects.toThrow('At least one content ID is required');
      await expect(bulkRecoverDiscs({ contentIds: 'invalid' })).rejects.toThrow('Content IDs are required');
    });

    it('should validate targetBagId in payload', async () => {
      await expect(bulkRecoverDiscs({ contentIds: ['content-1'] })).rejects.toThrow('Target bag ID is required');
      await expect(bulkRecoverDiscs({ contentIds: ['content-1'], targetBagId: '' })).rejects.toThrow('Target bag ID is required');
      await expect(bulkRecoverDiscs({ contentIds: ['content-1'], targetBagId: null })).rejects.toThrow('Target bag ID is required');
    });

    it('should handle authentication errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Authentication required. Please log in again.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      });

      const payload = {
        contentIds: ['content-1'],
        targetBagId: 'bag-456',
      };

      await expect(bulkRecoverDiscs(payload)).rejects.toThrow('Authentication required. Please log in again.');
    });

    it('should handle validation errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Invalid recovery request',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      const payload = {
        contentIds: ['content-1'],
        targetBagId: 'bag-456',
      };

      await expect(bulkRecoverDiscs(payload)).rejects.toThrow('Invalid recovery request');
    });

    it('should handle not found errors', async () => {
      const errorResponse = {
        success: false,
        message: 'One or more discs not found',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

      const payload = {
        contentIds: ['content-1', 'nonexistent'],
        targetBagId: 'bag-456',
      };

      await expect(bulkRecoverDiscs(payload)).rejects.toThrow('One or more discs not found');
    });

    it('should handle server errors', async () => {
      const errorResponse = {
        success: false,
        message: 'Internal server error',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
      });

      const payload = {
        contentIds: ['content-1'],
        targetBagId: 'bag-456',
      };

      await expect(bulkRecoverDiscs(payload)).rejects.toThrow('Something went wrong. Please try again.');
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      const payload = {
        contentIds: ['content-1'],
        targetBagId: 'bag-456',
      };

      await expect(bulkRecoverDiscs(payload)).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle invalid response format', async () => {
      const invalidResponse = {
        // Missing success field
        data: { recoveredCount: 2 },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      const payload = {
        contentIds: ['content-1'],
        targetBagId: 'bag-456',
      };

      await expect(bulkRecoverDiscs(payload)).rejects.toThrow('Invalid response from server');
    });

    it('should handle network timeout with 30-second timeout', async () => {
      const mockResponse = {
        success: true,
        recoveredCount: 1,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = {
        contentIds: ['content-1'],
        targetBagId: 'bag-456',
      };

      await bulkRecoverDiscs(payload);

      // Verify setTimeout was called for 30 seconds (30000ms)
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 30000);
      // Verify clearTimeout was called
      expect(global.clearTimeout).toHaveBeenCalled();
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

    it('should export a removeDiscFromBag function', () => {
      expect(removeDiscFromBag).toBeTruthy();
    });

    it('should export a updateDiscInBag function', () => {
      expect(updateDiscInBag).toBeTruthy();
    });

    it('should export a markDiscAsLost function', () => {
      expect(markDiscAsLost).toBeTruthy();
    });

    it('should export a moveDiscBetweenBags function', () => {
      expect(moveDiscBetweenBags).toBeTruthy();
    });

    it('should export a bulkMarkDiscsAsLost function', () => {
      expect(bulkMarkDiscsAsLost).toBeTruthy();
    });

    it('should export a getLostDiscs function', () => {
      expect(getLostDiscs).toBeTruthy();
    });

    it('should export a bulkRecoverDiscs function', () => {
      expect(bulkRecoverDiscs).toBeTruthy();
    });
  });
});
