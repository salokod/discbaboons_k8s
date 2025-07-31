import {
  describe, test, expect, beforeAll, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

let getFriendsListService;

beforeAll(async () => {
  ({ default: getFriendsListService } = await import('../../../services/friends.list.service.js'));
});

beforeEach(() => {
  mockDatabase.queryRows.mockClear();
  mockDatabase.queryOne.mockClear();
});

describe('getFriendsListService', () => {
  test('should be a function', () => {
    expect(typeof getFriendsListService).toBe('function');
  });

  test('should accept pagination parameters and return paginated result', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const limit = 10;
    const offset = 0;

    // Mock the optimized query result with JOIN
    const mockQueryResult = [
      {
        friend_id: chance.integer({ min: 2000, max: 3000 }),
        username: chance.word(),
        friendship_id: chance.integer({ min: 1, max: 1000 }),
        friendship_status: 'accepted',
        friendship_created_at: new Date(),
        total_bags: chance.integer({ min: 0, max: 10 }),
        public_bags: chance.integer({ min: 0, max: 5 }),
        visible_bags: chance.integer({ min: 0, max: 8 }),
      },
    ];

    const mockCountResult = { count: '1' };

    mockDatabase.queryRows.mockResolvedValueOnce(mockQueryResult); // friends data
    mockDatabase.queryOne.mockResolvedValueOnce(mockCountResult); // total count

    const result = await getFriendsListService(userId, { limit, offset });

    expect(result).toHaveProperty('friends');
    expect(result).toHaveProperty('pagination');
    expect(result.friends).toHaveLength(1);
    expect(result.pagination).toEqual({
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
    });

    // Should NOT include email
    expect(result.friends[0]).not.toHaveProperty('email');
    expect(result.friends[0]).toHaveProperty('id');
    expect(result.friends[0]).toHaveProperty('username');
    expect(result.friends[0]).toHaveProperty('friendship');
    expect(result.friends[0]).toHaveProperty('bag_stats');
  });

  test('should handle negative offset by setting to 0', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    mockDatabase.queryRows.mockResolvedValueOnce([]); // empty friends data
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '0' }); // total count

    const result = await getFriendsListService(userId, { offset: -5 });

    expect(result.pagination.offset).toBe(0);
  });

  test('should handle zero limit by setting to 1', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    mockDatabase.queryRows.mockResolvedValueOnce([]); // empty friends data
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '0' }); // total count

    const result = await getFriendsListService(userId, { limit: 0 });

    expect(result.pagination.limit).toBe(1);
  });

  test('should handle negative limit by setting to 1', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    mockDatabase.queryRows.mockResolvedValueOnce([]); // empty friends data
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '0' }); // total count

    const result = await getFriendsListService(userId, { limit: -10 });

    expect(result.pagination.limit).toBe(1);
  });

  test('should cap limit at 100 maximum', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    mockDatabase.queryRows.mockResolvedValueOnce([]); // empty friends data
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '0' }); // total count

    const result = await getFriendsListService(userId, { limit: 500 });

    expect(result.pagination.limit).toBe(100);
  });

  test('should handle non-numeric pagination parameters gracefully', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    mockDatabase.queryRows.mockResolvedValueOnce([]); // empty friends data
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '0' }); // total count

    const result = await getFriendsListService(userId, { limit: 'invalid', offset: 'invalid' });

    expect(result.pagination.limit).toBe(20); // default
    expect(result.pagination.offset).toBe(0); // default
  });

  test('should throw if userId is missing', async () => {
    await expect(getFriendsListService(undefined))
      .rejects
      .toThrow(/user id is required/i);
  });

  test('should return accepted friends with enhanced data in paginated format', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const friendUserId = chance.integer({ min: 2000, max: 3000 });
    const friendUsername = chance.word();

    // Mock the optimized query result
    const mockFriendsData = [
      {
        friend_id: friendUserId,
        username: friendUsername,
        friendship_id: chance.integer({ min: 1, max: 1000 }),
        friendship_status: 'accepted',
        friendship_created_at: new Date(),
        total_bags: chance.integer({ min: 0, max: 10 }),
        public_bags: chance.integer({ min: 0, max: 5 }),
        visible_bags: chance.integer({ min: 0, max: 8 }),
      },
    ];

    const mockCountResult = { count: '1' };

    // Setup mock responses for database calls
    mockDatabase.queryRows.mockResolvedValueOnce(mockFriendsData); // optimized friends query
    mockDatabase.queryOne.mockResolvedValueOnce(mockCountResult); // total count

    const result = await getFriendsListService(userId);

    expect(result).toHaveProperty('friends');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.friends)).toBe(true);
    expect(result.friends.length).toBe(1);
    expect(result.friends[0]).toHaveProperty('id', friendUserId);
    expect(result.friends[0]).toHaveProperty('username', friendUsername);
    expect(result.friends[0]).not.toHaveProperty('email'); // Should not expose email
    expect(result.friends[0]).toHaveProperty('friendship');
    expect(result.friends[0]).toHaveProperty('bag_stats');
  });

  test('should return empty friends array if user has no accepted friends', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock empty friendships result
    mockDatabase.queryRows.mockResolvedValueOnce([]); // empty friends data
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '0' }); // total count is 0

    const result = await getFriendsListService(userId);
    expect(result).toEqual({
      friends: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    });
  });

  test('should accept string userId and return enhanced data in paginated format', async () => {
    const userId = String(chance.integer({ min: 1, max: 1000 }));
    const friendUserId = chance.integer({ min: 2000, max: 3000 });
    const friendUsername = chance.word();

    // Mock the optimized query result
    const mockFriendsData = [
      {
        friend_id: friendUserId,
        username: friendUsername,
        friendship_id: chance.integer({ min: 1, max: 1000 }),
        friendship_status: 'accepted',
        friendship_created_at: new Date(),
        total_bags: chance.integer({ min: 0, max: 5 }),
        public_bags: chance.integer({ min: 0, max: 3 }),
        visible_bags: chance.integer({ min: 0, max: 5 }),
      },
    ];

    const mockCountResult = { count: '1' };

    // Setup mock responses for database calls
    mockDatabase.queryRows.mockResolvedValueOnce(mockFriendsData); // optimized friends query
    mockDatabase.queryOne.mockResolvedValueOnce(mockCountResult); // total count

    const result = await getFriendsListService(userId);

    expect(result).toHaveProperty('friends');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.friends)).toBe(true);
    expect(result.friends.length).toBe(1);
    expect(result.friends[0]).toHaveProperty('id', friendUserId);
    expect(result.friends[0]).toHaveProperty('username', friendUsername);
    expect(result.friends[0]).not.toHaveProperty('email'); // Should not expose email
    expect(result.friends[0]).toHaveProperty('bag_stats');
  });

  test('should include bag statistics for each friend in enhanced paginated response', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const friendUserId = chance.integer({ min: 2000, max: 3000 });
    const friendUsername = chance.word({ length: chance.integer({ min: 5, max: 15 }) });

    // Mock bag counts for the friend
    const totalBags = chance.integer({ min: 1, max: 10 });
    const publicBags = chance.integer({ min: 0, max: totalBags });
    const visibleBags = chance.integer({ min: publicBags, max: totalBags });

    // Mock optimized query result
    const mockFriendsData = [
      {
        friend_id: friendUserId,
        username: friendUsername,
        friendship_id: chance.integer({ min: 1, max: 1000 }),
        friendship_status: 'accepted',
        friendship_created_at: new Date(),
        total_bags: totalBags,
        public_bags: publicBags,
        visible_bags: visibleBags,
      },
    ];

    const mockCountResult = { count: '1' };

    // Setup mock responses for database calls
    mockDatabase.queryRows.mockResolvedValueOnce(mockFriendsData); // optimized friends query
    mockDatabase.queryOne.mockResolvedValueOnce(mockCountResult); // total count

    const result = await getFriendsListService(userId);

    expect(result).toHaveProperty('friends');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.friends)).toBe(true);
    expect(result.friends.length).toBe(1);

    // What we want the enhanced service to return:
    expect(result.friends[0]).toHaveProperty('id', friendUserId);
    expect(result.friends[0]).toHaveProperty('username', friendUsername);
    expect(result.friends[0]).not.toHaveProperty('email'); // Should not expose email
    expect(result.friends[0]).toHaveProperty('friendship');
    expect(result.friends[0].friendship).toHaveProperty('id', mockFriendsData[0].friendship_id);
    expect(result.friends[0].friendship).toHaveProperty('status', 'accepted');
    expect(result.friends[0]).toHaveProperty('bag_stats');
    expect(result.friends[0].bag_stats).toHaveProperty('total_bags', totalBags);
    expect(result.friends[0].bag_stats).toHaveProperty('visible_bags', visibleBags);
    expect(result.friends[0].bag_stats).toHaveProperty('public_bags', publicBags);
  });
});
