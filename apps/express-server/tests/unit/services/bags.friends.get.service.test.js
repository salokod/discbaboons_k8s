import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import getFriendBagService from '../../../services/bags.friends.get.service.js';

const chance = new Chance();

describe('getFriendBagService', () => {
  test('should export a function', () => {
    expect(typeof getFriendBagService).toBe('function');
  });

  test('should throw ValidationError when userId is missing', async () => {
    await expect(getFriendBagService()).rejects.toThrow('userId is required');
  });

  test('should throw ValidationError when friendUserId is missing', async () => {
    await expect(getFriendBagService(123)).rejects.toThrow('friendUserId is required');
  });

  test('should throw ValidationError when bagId is missing', async () => {
    await expect(getFriendBagService(123, 456)).rejects.toThrow('bagId is required');
  });

  test('should throw ValidationError when bagId is not a valid UUID', async () => {
    await expect(getFriendBagService(123, 456, 'invalid-uuid')).rejects.toThrow('Invalid bagId format');
  });

  test('should throw AuthorizationError if users are not friends', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const validBagId = chance.guid();

    const mockPrisma = {
      friendship_requests: {
        findFirst: async () => null, // No friendship found
      },
    };

    try {
      await getFriendBagService(userId, friendUserId, validBagId, mockPrisma);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/You are not friends with this user/i);
    }
  });

  test('should throw AuthorizationError if bag not found or not visible', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const validBagId = chance.guid();
    const friendship = {
      id: chance.integer({ min: 1 }),
      status: 'accepted',
    };

    const mockPrisma = {
      friendship_requests: {
        findFirst: async () => friendship,
      },
      bags: {
        findFirst: async () => null, // Bag not found or not visible
      },
    };

    try {
      await getFriendBagService(userId, friendUserId, validBagId, mockPrisma);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/Bag not found or not visible/i);
    }
  });

  test('should return friend bag with contents and personal data', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const validBagId = chance.guid();
    const friendship = {
      id: chance.integer({ min: 1 }),
      status: 'accepted',
    };

    const bagContents = [
      {
        id: chance.guid(),
        disc_id: chance.guid(),
        notes: chance.sentence(),
        weight: chance.floating({ min: 150, max: 180 }),
        condition: 'good',
        plastic_type: 'Champion',
        color: 'Red',
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
        brand: 'Custom Brand',
        model: 'Custom Model',
        is_lost: false,
        added_at: new Date(),
        updated_at: new Date(),
        disc_master: {
          id: chance.guid(),
          brand: 'Innova',
          model: 'Destroyer',
          speed: 12,
          glide: 5,
          turn: -1,
          fade: 3,
        },
      },
    ];

    const bag = {
      id: validBagId,
      name: chance.word(),
      description: chance.sentence(),
      is_public: true,
      is_friends_visible: false,
      created_at: new Date(),
      updated_at: new Date(),
      bag_contents: bagContents,
    };

    const mockPrisma = {
      friendship_requests: {
        findFirst: async () => friendship,
      },
      bags: {
        findFirst: async () => bag,
      },
    };

    const result = await getFriendBagService(userId, friendUserId, validBagId, mockPrisma);

    expect(result).toEqual({
      friend: { id: friendUserId },
      bag: {
        id: bag.id,
        name: bag.name,
        description: bag.description,
        is_public: bag.is_public,
        is_friends_visible: bag.is_friends_visible,
        created_at: bag.created_at,
        updated_at: bag.updated_at,
        contents: [
          {
            id: bagContents[0].id,
            disc: bagContents[0].disc_master,
            notes: bagContents[0].notes,
            weight: bagContents[0].weight,
            condition: bagContents[0].condition,
            plastic_type: bagContents[0].plastic_type,
            color: bagContents[0].color,
            speed: bagContents[0].speed,
            glide: bagContents[0].glide,
            turn: bagContents[0].turn,
            fade: bagContents[0].fade,
            brand: bagContents[0].brand,
            model: bagContents[0].model,
            added_at: bagContents[0].added_at,
            updated_at: bagContents[0].updated_at,
          },
        ],
      },
    });
  });
});
