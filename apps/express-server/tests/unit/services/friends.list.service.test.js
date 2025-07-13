import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

const mockFindMany = vi.fn();
const mockUsersClient = { findUnique: vi.fn() };
const mockBagsClient = { count: vi.fn() };
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    friendship_requests: { findMany: mockFindMany },
    users: mockUsersClient,
    bags: mockBagsClient,
    $disconnect: vi.fn(),
  })),
}));
const { default: getFriendsListService } = await import('../../../services/friends.list.service.js');

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
    mockFindMany.mockResolvedValue(fakeFriendships);

    // Mock the friend user data
    const friendUserData = {
      id: friendUserId,
      username: chance.word(),
      email: chance.email(),
    };
    mockUsersClient.findUnique.mockResolvedValue(friendUserData);

    // Mock bag counts
    const totalBags = chance.integer({ min: 0, max: 10 });
    const publicBags = chance.integer({ min: 0, max: totalBags });
    const visibleBags = chance.integer({ min: publicBags, max: totalBags });

    mockBagsClient.count
      .mockResolvedValueOnce(totalBags)
      .mockResolvedValueOnce(publicBags)
      .mockResolvedValueOnce(visibleBags);

    const result = await getFriendsListService(userId);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        status: 'accepted',
        OR: [
          { requester_id: userId },
          { recipient_id: userId },
        ],
      },
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('id', friendUserId);
    expect(result[0]).toHaveProperty('username', friendUserData.username);
    expect(result[0]).toHaveProperty('email', friendUserData.email);
    expect(result[0]).toHaveProperty('friendship');
    expect(result[0]).toHaveProperty('bag_stats');
  });

  test('should return empty array if user has no accepted friends', async () => {
    mockFindMany.mockResolvedValue([]);
    const userId = chance.integer({ min: 1, max: 1000 });

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
    mockFindMany.mockResolvedValue(fakeFriendships);

    // Mock the friend user data
    const friendUserData = {
      id: friendUserId,
      username: chance.word(),
      email: chance.email(),
    };
    mockUsersClient.findUnique.mockResolvedValue(friendUserData);

    // Mock bag counts
    const totalBags = chance.integer({ min: 0, max: 5 });
    const publicBags = chance.integer({ min: 0, max: totalBags });
    const visibleBags = chance.integer({ min: publicBags, max: totalBags });

    mockBagsClient.count
      .mockResolvedValueOnce(totalBags)
      .mockResolvedValueOnce(publicBags)
      .mockResolvedValueOnce(visibleBags);

    const result = await getFriendsListService(userId);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        status: 'accepted',
        OR: [
          { requester_id: userId },
          { recipient_id: userId },
        ],
      },
    });

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

    // Mock the friendship_requests.findMany call
    const mockFriendshipData = [
      {
        id: chance.integer({ min: 1, max: 1000 }),
        requester_id: userId,
        recipient_id: friendUserId,
        status: 'accepted',
        created_at: new Date(),
      },
    ];
    mockFindMany.mockResolvedValue(mockFriendshipData);

    // Mock finding the friend's user details
    mockUsersClient.findUnique.mockResolvedValue({
      id: friendUserId,
      username: friendUsername,
      email: friendEmail,
    });

    // Mock bag counts for the friend
    const totalBags = chance.integer({ min: 1, max: 10 });
    const publicBags = chance.integer({ min: 0, max: totalBags });
    const friendsVisibleBags = chance.integer({ min: 0, max: totalBags - publicBags });

    mockBagsClient.count
      .mockResolvedValueOnce(totalBags) // total_bags count
      .mockResolvedValueOnce(publicBags) // public_bags count
      .mockResolvedValueOnce(friendsVisibleBags + publicBags); // visible_bags count (all bags)

    const result = await getFriendsListService(userId);

    // This test will FAIL initially - that's the RED phase of TDD
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
