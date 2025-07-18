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

  test('should throw if userId is missing', async () => {
    await expect(getFriendsListService(undefined))
      .rejects
      .toThrow(/user id is required/i);
  });

  test('should return accepted friends with enhanced data', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const friendUserId = chance.integer({ min: 2000, max: 3000 });

    const fakeFriendships = [
      {
        id: chance.integer({ min: 1, max: 1000 }),
        requester_id: userId,
        recipient_id: friendUserId,
        status: 'accepted',
        created_at: new Date(),
      },
    ];

    // Mock the friend user data
    const friendUserData = {
      id: friendUserId,
      username: chance.word(),
      email: chance.email(),
    };

    // Mock bag counts
    const totalBags = chance.integer({ min: 0, max: 10 });
    const publicBags = chance.integer({ min: 0, max: totalBags });
    const visibleBags = chance.integer({ min: publicBags, max: totalBags });

    // Setup mock responses for database calls
    mockDatabase.queryRows.mockResolvedValue(fakeFriendships); // friendship query
    mockDatabase.queryOne
      .mockResolvedValueOnce(friendUserData) // user details query
      .mockResolvedValueOnce({ count: totalBags }) // total bags
      .mockResolvedValueOnce({ count: publicBags }) // public bags
      .mockResolvedValueOnce({ count: visibleBags }); // visible bags

    const result = await getFriendsListService(userId);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('id', friendUserId);
    expect(result[0]).toHaveProperty('username', friendUserData.username);
    expect(result[0]).toHaveProperty('email', friendUserData.email);
    expect(result[0]).toHaveProperty('friendship');
    expect(result[0]).toHaveProperty('bag_stats');
  });

  test('should return empty array if user has no accepted friends', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });

    // Mock empty friendships result
    mockDatabase.queryRows.mockResolvedValue([]);

    const result = await getFriendsListService(userId);
    expect(result).toEqual([]);
  });

  test('should accept string userId and return enhanced data', async () => {
    const userId = String(chance.integer({ min: 1, max: 1000 }));
    const friendUserId = chance.integer({ min: 2000, max: 3000 });

    const fakeFriendships = [
      {
        id: chance.integer({ min: 1, max: 1000 }),
        requester_id: userId,
        recipient_id: friendUserId,
        status: 'accepted',
        created_at: new Date(),
      },
    ];

    // Mock the friend user data
    const friendUserData = {
      id: friendUserId,
      username: chance.word(),
      email: chance.email(),
    };

    // Mock bag counts
    const totalBags = chance.integer({ min: 0, max: 5 });
    const publicBags = chance.integer({ min: 0, max: totalBags });
    const visibleBags = chance.integer({ min: publicBags, max: totalBags });

    // Setup mock responses for database calls
    mockDatabase.queryRows.mockResolvedValue(fakeFriendships); // friendship query
    mockDatabase.queryOne
      .mockResolvedValueOnce(friendUserData) // user details query
      .mockResolvedValueOnce({ count: totalBags }) // total bags
      .mockResolvedValueOnce({ count: publicBags }) // public bags
      .mockResolvedValueOnce({ count: visibleBags }); // visible bags

    const result = await getFriendsListService(userId);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('id', friendUserId);
    expect(result[0]).toHaveProperty('username', friendUserData.username);
    expect(result[0]).toHaveProperty('bag_stats');
  });

  test('should include bag statistics for each friend in enhanced response', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const friendUserId = chance.integer({ min: 2000, max: 3000 });
    const friendUsername = chance.word({ length: chance.integer({ min: 5, max: 15 }) });
    const friendEmail = chance.email();

    // Mock friendship data
    const mockFriendshipData = [
      {
        id: chance.integer({ min: 1, max: 1000 }),
        requester_id: userId,
        recipient_id: friendUserId,
        status: 'accepted',
        created_at: new Date(),
      },
    ];

    // Mock friend user details
    const friendUserData = {
      id: friendUserId,
      username: friendUsername,
      email: friendEmail,
    };

    // Mock bag counts for the friend
    const totalBags = chance.integer({ min: 1, max: 10 });
    const publicBags = chance.integer({ min: 0, max: totalBags });
    const friendsVisibleBags = chance.integer({ min: 0, max: totalBags - publicBags });

    // Setup mock responses for database calls
    mockDatabase.queryRows.mockResolvedValue(mockFriendshipData); // friendship query
    mockDatabase.queryOne
      .mockResolvedValueOnce(friendUserData) // user details query
      .mockResolvedValueOnce({ count: totalBags }) // total_bags count
      .mockResolvedValueOnce({ count: publicBags }) // public_bags count
      .mockResolvedValueOnce({ count: friendsVisibleBags + publicBags }); // visible_bags count

    const result = await getFriendsListService(userId);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);

    // What we want the enhanced service to return:
    expect(result[0]).toHaveProperty('id', friendUserId);
    expect(result[0]).toHaveProperty('username', friendUsername);
    expect(result[0]).toHaveProperty('email', friendEmail);
    expect(result[0]).toHaveProperty('friendship');
    expect(result[0].friendship).toHaveProperty('id', mockFriendshipData[0].id);
    expect(result[0].friendship).toHaveProperty('status', 'accepted');
    expect(result[0]).toHaveProperty('bag_stats');
    expect(result[0].bag_stats).toHaveProperty('total_bags', totalBags);
    expect(result[0].bag_stats).toHaveProperty('visible_bags', friendsVisibleBags + publicBags);
    expect(result[0].bag_stats).toHaveProperty('public_bags', publicBags);
  });
});
