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

  test('should return an array when a valid query is provided', async () => {
    mockDatabase.queryRows.mockResolvedValueOnce([]);
    const query = { username: chance.word() };
    const result = await searchProfilesService(query);
    expect(Array.isArray(result)).toBe(true);
  });

  test('should return profiles with only public fields', async () => {
    const username = chance.word();
    const fakeProfile = {
      user_id: chance.integer({ min: 1 }),
      name: chance.name(),
      bio: chance.sentence(),
      city: chance.city(),
      isnamepublic: true,
      isbiopublic: false,
      islocationpublic: true,
      users: { username }, // <-- add this line
    };
    mockDatabase.queryRows.mockResolvedValueOnce([fakeProfile]);
    const result = await searchProfilesService({ username });
    expect(Array.isArray(result)).toBe(true);
    result.forEach((profile) => {
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
      isnamepublic: true,
      isbiopublic: false,
      islocationpublic: true,
      users: { username }, // <-- add this line
    };

    mockDatabase.queryRows.mockResolvedValueOnce([fakeProfile]);

    const expected = {
      user_id: fakeProfile.user_id,
      name: fakeProfile.name,
      city: fakeProfile.city,
      // bio is omitted because isbiopublic is false
    };

    const result = await searchProfilesService({ username });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject(expected);
    expect(result[0]).not.toHaveProperty('bio');
  });
});
