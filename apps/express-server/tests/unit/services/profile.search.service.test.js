import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import searchProfilesService from '../../../services/profile.search.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryRows.mockClear();
});

describe('searchProfilesService', () => {
  test('should be a function', () => {
    expect(typeof searchProfilesService).toBe('function');
  });

  test('should throw ValidationError if no query is provided', async () => {
    await expect(searchProfilesService()).rejects.toThrow('Search query is required');
    await expect(searchProfilesService(null)).rejects.toThrow('Search query is required');
    await expect(searchProfilesService({})).rejects.toThrow('Search query is required');
  });

  test('should return pagination object when a valid query is provided', async () => {
    // Mock both the profiles query and count query
    mockDatabase.queryRows
      .mockResolvedValueOnce([]) // profiles result
      .mockResolvedValueOnce([{ count: '0' }]); // count result
    const query = { username: chance.word() };
    const result = await searchProfilesService(query);
    expect(result).toHaveProperty('profiles');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('offset');
    expect(result).toHaveProperty('hasMore');
    expect(Array.isArray(result.profiles)).toBe(true);
  });

  test('should return profiles with only public fields', async () => {
    const username = chance.word();
    const fakeProfile = {
      user_id: chance.integer({ min: 1 }),
      name: chance.name(),
      bio: chance.sentence(),
      city: chance.city(),
      username,
      isnamepublic: true,
      isbiopublic: false,
      islocationpublic: true,
    };
    // Mock both the profiles query and count query
    mockDatabase.queryRows
      .mockResolvedValueOnce([fakeProfile]) // profiles result
      .mockResolvedValueOnce([{ count: '1' }]); // count result
    const result = await searchProfilesService({ username });
    expect(Array.isArray(result.profiles)).toBe(true);
    result.profiles.forEach((profile) => {
      expect(typeof profile).toBe('object');
    });
  });

  test('should return only public fields for matching profiles', async () => {
    const username = chance.word();
    const fakeProfile = {
      user_id: chance.integer({ min: 1 }),
      name: chance.name(),
      bio: chance.sentence(),
      city: chance.city(),
      username,
      isnamepublic: true,
      isbiopublic: false,
      islocationpublic: true,
    };

    // Mock both the profiles query and count query
    mockDatabase.queryRows
      .mockResolvedValueOnce([fakeProfile]) // profiles result
      .mockResolvedValueOnce([{ count: '1' }]); // count result

    const expected = {
      user_id: fakeProfile.user_id,
      username: fakeProfile.username,
      name: fakeProfile.name,
      city: fakeProfile.city,
      // bio is omitted because isbiopublic is false
    };

    const result = await searchProfilesService({ username });

    expect(result.profiles.length).toBeGreaterThan(0);
    expect(result.profiles[0]).toMatchObject(expected);
    expect(result.profiles[0]).not.toHaveProperty('bio');
  });

  describe('Pagination', () => {
    test('should apply default limit of 20 when no limit provided', async () => {
      // Mock both the profiles query and count query
      mockDatabase.queryRows
        .mockResolvedValueOnce([]) // profiles result
        .mockResolvedValueOnce([{ count: '0' }]); // count result
      const query = { username: chance.word() };

      await searchProfilesService(query);

      const sqlCall = mockDatabase.queryRows.mock.calls[0][0];
      expect(sqlCall).toContain('LIMIT 20');
      expect(sqlCall).toContain('OFFSET 0');
    });

    test('should apply custom limit when provided', async () => {
      // Mock both the profiles query and count query
      mockDatabase.queryRows
        .mockResolvedValueOnce([]) // profiles result
        .mockResolvedValueOnce([{ count: '0' }]); // count result
      const query = {
        username: chance.word(),
        limit: 10,
      };

      await searchProfilesService(query);

      const sqlCall = mockDatabase.queryRows.mock.calls[0][0];
      expect(sqlCall).toContain('LIMIT 10');
    });

    test('should enforce maximum limit of 100', async () => {
      // Mock both the profiles query and count query
      mockDatabase.queryRows
        .mockResolvedValueOnce([]) // profiles result
        .mockResolvedValueOnce([{ count: '0' }]); // count result
      const query = {
        username: chance.word(),
        limit: 200, // Try to set higher than max
      };

      await searchProfilesService(query);

      const sqlCall = mockDatabase.queryRows.mock.calls[0][0];
      expect(sqlCall).toContain('LIMIT 100');
    });

    test('should apply offset when provided', async () => {
      // Mock both the profiles query and count query
      mockDatabase.queryRows
        .mockResolvedValueOnce([]) // profiles result
        .mockResolvedValueOnce([{ count: '0' }]); // count result
      const query = {
        username: chance.word(),
        offset: 10,
      };

      await searchProfilesService(query);

      const sqlCall = mockDatabase.queryRows.mock.calls[0][0];
      expect(sqlCall).toContain('OFFSET 10');
    });

    test('should validate limit is a positive integer', async () => {
      const query = {
        username: chance.word(),
        limit: -5,
      };

      await expect(searchProfilesService(query)).rejects.toThrow('Limit must be a positive integer');
    });

    test('should validate offset is a non-negative integer', async () => {
      const query = {
        username: chance.word(),
        offset: -1,
      };

      await expect(searchProfilesService(query)).rejects.toThrow('Offset must be a non-negative integer');
    });

    test('should return pagination metadata in response', async () => {
      const profiles = [
        {
          user_id: 1,
          name: 'Test User',
          username: 'testuser',
          isnamepublic: true,
          isbiopublic: false,
          islocationpublic: false,
        },
      ];

      // Mock both the data query and count query
      mockDatabase.queryRows
        .mockResolvedValueOnce(profiles) // Data query
        .mockResolvedValueOnce([{ count: '25' }]); // Count query

      const query = {
        username: chance.word(),
        limit: 10,
        offset: 5,
      };

      const result = await searchProfilesService(query);

      expect(result).toHaveProperty('profiles');
      expect(result).toHaveProperty('total', 25);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('offset', 5);
      expect(result).toHaveProperty('hasMore', true);
    });
  });

  describe('Error response format', () => {
    test('should throw ValidationError with proper error name for consistency', async () => {
      try {
        await searchProfilesService();
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Search query is required');
      }
    });
  });
});
