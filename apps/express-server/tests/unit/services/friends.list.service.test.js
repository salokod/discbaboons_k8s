import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

const mockFindMany = vi.fn();
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    friendship_requests: { findMany: mockFindMany },
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

  test('should return accepted friends', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeFriends = [
      {
        id: chance.integer({ min: 1, max: 1000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'accepted',
      },
      {
        id: chance.integer({ min: 1001, max: 2000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'accepted',
      },
    ];
    mockFindMany.mockResolvedValue(fakeFriends);

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
    expect(result).toEqual(fakeFriends);
  });

  test('should return empty array if user has no accepted friends', async () => {
    mockFindMany.mockResolvedValue([]);
    const userId = chance.integer({ min: 1, max: 1000 });

    const result = await getFriendsListService(userId);
    expect(result).toEqual([]);
  });

  test('should accept string userId', async () => {
    const userId = String(chance.integer({ min: 1, max: 1000 }));
    const fakeFriends = [
      {
        id: chance.integer({ min: 1, max: 1000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'accepted',
      },
      {
        id: chance.integer({ min: 1001, max: 2000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'accepted',
      },
    ];
    mockFindMany.mockResolvedValue(fakeFriends);

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
    expect(result).toEqual(fakeFriends);
  });
});
