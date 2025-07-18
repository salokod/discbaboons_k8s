import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import getFriendBagService from '../../../services/bags.friends.get.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
  mockDatabase.queryRows.mockClear();
});

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

    mockDatabase.queryOne.mockResolvedValue(null); // No friendship found

    try {
      await getFriendBagService(userId, friendUserId, validBagId);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/You are not friends with this user/i);
    }

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT id FROM friendship_requests 
     WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)) 
     AND status = 'accepted'`,
      [userId, friendUserId],
    );
  });

  test('should throw AuthorizationError if bag not found or not visible', async () => {
    const userId = chance.integer({ min: 1 });
    const friendUserId = chance.integer({ min: 1 });
    const validBagId = chance.guid();
    const friendship = {
      id: chance.integer({ min: 1 }),
      status: 'accepted',
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(friendship) // Friendship found
      .mockResolvedValueOnce(null); // Bag not found or not visible

    try {
      await getFriendBagService(userId, friendUserId, validBagId);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('AuthorizationError');
      expect(err.message).toMatch(/Bag not found or not visible/i);
    }

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT id FROM friendship_requests 
     WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)) 
     AND status = 'accepted'`,
      [userId, friendUserId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT * FROM bags 
     WHERE id = $1 AND user_id = $2 AND (is_public = true OR is_friends_visible = true)`,
      [validBagId, friendUserId],
    );
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
        notes: chance.sentence(),
        weight: chance.floating({ min: 150, max: 180 }).toString(),
        condition: 'good',
        plastic_type: 'Champion',
        color: 'Red',
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
        brand: 'Custom Brand',
        model: 'Custom Model',
        added_at: new Date(),
        updated_at: new Date(),
        disc_master_id: chance.guid(),
        disc_master_speed: 12,
        disc_master_glide: 5,
        disc_master_turn: -1,
        disc_master_fade: 3,
        disc_master_brand: 'Innova',
        disc_master_model: 'Destroyer',
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
    };

    mockDatabase.queryOne
      .mockResolvedValueOnce(friendship) // Friendship found
      .mockResolvedValueOnce(bag); // Bag found
    mockDatabase.queryRows.mockResolvedValue(bagContents); // Bag contents

    const result = await getFriendBagService(userId, friendUserId, validBagId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT id FROM friendship_requests 
     WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)) 
     AND status = 'accepted'`,
      [userId, friendUserId],
    );
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      `SELECT * FROM bags 
     WHERE id = $1 AND user_id = $2 AND (is_public = true OR is_friends_visible = true)`,
      [validBagId, friendUserId],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [validBagId],
    );

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
            disc: {
              id: bagContents[0].disc_master_id,
              speed: bagContents[0].disc_master_speed,
              glide: bagContents[0].disc_master_glide,
              turn: bagContents[0].disc_master_turn,
              fade: bagContents[0].disc_master_fade,
              brand: bagContents[0].disc_master_brand,
              model: bagContents[0].disc_master_model,
            },
            notes: bagContents[0].notes,
            weight: parseFloat(bagContents[0].weight).toString(),
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
