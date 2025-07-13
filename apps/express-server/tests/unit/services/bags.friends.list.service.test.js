import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import listFriendBagsService from '../../../services/bags.friends.list.service.js';

const chance = new Chance();

describe('listFriendBagsService', () => {
  test('should export a function', () => {
    expect(typeof listFriendBagsService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await listFriendBagsService(undefined, chance.integer({ min: 1 }));
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if friendUserId is missing', async () => {
    try {
      await listFriendBagsService(chance.integer({ min: 1 }), undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/friendUserId is required/i);
    }
  });

  test('should throw AuthorizationError if users are not friends', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });

    const mockPrisma = {
      friendship_requests: {
        findFirst: async () => null, // No friendship found
      },
    };

    try {
      await listFriendBagsService(userId, friendUserId, mockPrisma);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/You are not friends with this user/i);
    }
  });

  test('should return friends visible bags with disc counts', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const friendship = {
      id: chance.integer({ min: 1 }),
      status: 'accepted',
    };
    const publicBagDiscCount = chance.integer({ min: 0, max: 20 });
    const friendsBagDiscCount = chance.integer({ min: 0, max: 20 });
    const bags = [
      {
        id: chance.guid(),
        name: chance.word(),
        description: chance.sentence(),
        is_public: true,
        is_friends_visible: false,
        created_at: new Date(),
        updated_at: new Date(),
        _count: { bag_contents: publicBagDiscCount },
      },
      {
        id: chance.guid(),
        name: chance.word(),
        description: chance.sentence(),
        is_public: false,
        is_friends_visible: true,
        created_at: new Date(),
        updated_at: new Date(),
        _count: { bag_contents: friendsBagDiscCount },
      },
    ];

    const mockPrisma = {
      friendship_requests: {
        findFirst: async () => friendship,
      },
      bags: {
        findMany: async () => bags,
      },
    };

    const result = await listFriendBagsService(userId, friendUserId, mockPrisma);

    expect(result).toEqual({
      friend: { id: friendUserId },
      bags: [
        {
          ...bags[0],
          disc_count: publicBagDiscCount,
        },
        {
          ...bags[1],
          disc_count: friendsBagDiscCount,
        },
      ],
    });
  });

  test('should not return private bags', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const friendship = {
      id: chance.integer({ min: 1 }),
      status: 'accepted',
    };

    // Mock Prisma to return only visible bags (private bags filtered out)
    const visibleBags = [
      {
        id: chance.guid(),
        name: chance.word(),
        is_public: true,
        is_friends_visible: false,
        _count: { bag_contents: chance.integer({ min: 0, max: 10 }) },
      },
    ];

    const mockPrisma = {
      friendship_requests: {
        findFirst: async () => friendship,
      },
      bags: {
        findMany: async ({ where }) => {
          // Verify the query filters correctly
          expect(where.user_id).toBe(friendUserId);
          expect(where.OR).toEqual([
            { is_public: true },
            { is_friends_visible: true },
          ]);
          return visibleBags;
        },
      },
    };

    const result = await listFriendBagsService(userId, friendUserId, mockPrisma);

    expect(result.bags).toHaveLength(1);
    expect(result.bags[0].is_public).toBe(true);
  });
});
