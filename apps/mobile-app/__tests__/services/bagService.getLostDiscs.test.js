/**
 * Test for getLostDiscs response mapping fix
 * Validates that the function properly handles backend response format
 */

import { getLostDiscs } from '../../src/services/bagService';

// Mock the dependencies
jest.mock('../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(() => Promise.resolve({ accessToken: 'mock-token' })),
}));

jest.mock('../../src/config/environment', () => ({
  API_BASE_URL: 'https://api.test.com',
}));

// Mock global fetch
global.fetch = jest.fn();

describe('getLostDiscs Response Mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle backend response with lost_discs array and transform to items format', async () => {
    // Mock backend response format (what backend actually returns)
    const mockBackendResponse = {
      success: true,
      lost_discs: [
        { id: '1', disc_id: 'disc1', lost_notes: 'Lost at park' },
        { id: '2', disc_id: 'disc2', lost_notes: 'Lost on hole 7' },
      ],
      pagination: {
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const result = await getLostDiscs();

    // Verify the response is transformed to expected format
    expect(result).toEqual({
      items: [
        { id: '1', disc_id: 'disc1', lost_notes: 'Lost at park' },
        { id: '2', disc_id: 'disc2', lost_notes: 'Lost on hole 7' },
      ],
      pagination: {
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  });

  test('should handle empty lost_discs array', async () => {
    const mockBackendResponse = {
      success: true,
      lost_discs: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockBackendResponse),
    });

    const result = await getLostDiscs();

    expect(result).toEqual({
      items: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  });
});
