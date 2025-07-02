import {
  describe, test, expect, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let addToBagService;

beforeAll(async () => {
  ({ default: addToBagService } = await import('../../../services/bag-contents.add.service.js'));
});

describe('addToBagService', () => {
  test('should export a function', () => {
    expect(typeof addToBagService).toBe('function');
  });

  test('should require disc_id parameter', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });

    await expect(addToBagService(userId, bagId, {})).rejects.toThrow('disc_id is required');
  });

  test('should require bag_id parameter', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const discData = { disc_id: chance.guid({ version: 4 }) };

    await expect(addToBagService(userId, null, discData)).rejects.toThrow('bag_id is required');
  });

  test('should require user_id parameter', async () => {
    const bagId = chance.guid({ version: 4 });
    const discData = { disc_id: chance.guid({ version: 4 }) };

    await expect(addToBagService(null, bagId, discData)).rejects.toThrow('user_id is required');
  });

  test('should throw error if bag not found or user does not own bag', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = { disc_id: chance.guid({ version: 4 }) };

    const mockPrisma = {
      bags: {
        findFirst: () => null,
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma)).rejects.toThrow('Bag not found or access denied');
  });

  test('should throw error if disc does not exist', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = { disc_id: chance.guid({ version: 4 }) };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => null,
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma)).rejects.toThrow('Disc not found');
  });

  test('should successfully create bag content', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discId = chance.guid({ version: 4 });
    const contentId = chance.guid({ version: 4 });
    const discData = {
      disc_id: discId,
      notes: chance.sentence(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
      condition: 'good',
    };

    const mockBagContent = {
      id: contentId,
      user_id: userId,
      bag_id: bagId,
      disc_id: discId,
      notes: discData.notes,
      weight: discData.weight,
      condition: discData.condition,
      plastic_type: null,
      color: null,
      is_lost: false,
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({
          id: discId, brand: 'Innova', model: 'Destroyer', approved: true,
        }),
      },
      bag_contents: {
        create: () => mockBagContent,
      },
    };

    const result = await addToBagService(userId, bagId, discData, mockPrisma);

    expect(result).toEqual(mockBagContent);
  });

  test('should prevent adding pending disc created by another user', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const otherUserId = chance.integer({ min: 1001, max: 2000 });
    const bagId = chance.guid({ version: 4 });
    const discId = chance.guid({ version: 4 });
    const discData = { disc_id: discId };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({
          id: discId,
          brand: 'Innova',
          model: 'Destroyer',
          approved: false,
          added_by_id: otherUserId,
        }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma)).rejects.toThrow('Cannot add pending disc created by another user');
  });

  test('should accept optional flight numbers in discData', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discId = chance.guid({ version: 4 });
    const contentId = chance.guid({ version: 4 });
    const discData = {
      disc_id: discId,
      notes: chance.sentence(),
      speed: 12, // Custom flight numbers
      glide: 5,
      turn: -1,
      fade: 3,
    };

    const mockBagContent = {
      id: contentId,
      user_id: userId,
      bag_id: bagId,
      disc_id: discId,
      notes: discData.notes,
      speed: discData.speed,
      glide: discData.glide,
      turn: discData.turn,
      fade: discData.fade,
      weight: null,
      condition: null,
      plastic_type: null,
      color: null,
      is_lost: false,
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({
          id: discId, brand: 'Innova', model: 'Destroyer', approved: true,
        }),
      },
      bag_contents: {
        create: () => mockBagContent,
      },
    };

    const result = await addToBagService(userId, bagId, discData, mockPrisma);
    expect(result).toEqual(mockBagContent);
  });

  test('should pass flight numbers to Prisma create method', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discId = chance.guid({ version: 4 });
    const discData = {
      disc_id: discId,
      speed: 9,
      glide: 4,
      turn: -2,
      fade: 2,
    };

    let createCallData;
    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({
          id: discId, brand: 'Innova', model: 'Teebird', approved: true,
        }),
      },
      bag_contents: {
        create: (data) => {
          createCallData = data.data;
          return { id: chance.guid(), ...data.data };
        },
      },
    };

    await addToBagService(userId, bagId, discData, mockPrisma);

    expect(createCallData.speed).toBe(9);
    expect(createCallData.glide).toBe(4);
    expect(createCallData.turn).toBe(-2);
    expect(createCallData.fade).toBe(2);
  });

  test('should allow adding own pending disc', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discId = chance.guid({ version: 4 });
    const contentId = chance.guid({ version: 4 });
    const discData = { disc_id: discId };

    const mockBagContent = {
      id: contentId,
      user_id: userId,
      bag_id: bagId,
      disc_id: discId,
      notes: null,
      weight: null,
      condition: 'good',
      plastic_type: null,
      color: null,
      is_lost: false,
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({
          id: discId,
          brand: 'Innova',
          model: 'Destroyer',
          approved: false,
          added_by_id: userId,
        }),
      },
      bag_contents: {
        create: () => mockBagContent,
      },
    };

    const result = await addToBagService(userId, bagId, discData, mockPrisma);

    expect(result).toEqual(mockBagContent);
  });

  test('should reject speed below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      speed: 0, // Invalid: below 1
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('speed must be between 1 and 15');
  });

  test('should reject speed above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      speed: 16, // Invalid: above 15
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('speed must be between 1 and 15');
  });

  test('should reject glide below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      glide: 0, // Invalid: below 1
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('glide must be between 1 and 7');
  });

  test('should reject glide above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      glide: 8, // Invalid: above 7
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('glide must be between 1 and 7');
  });

  test('should reject turn below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      turn: -6, // Invalid: below -5
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('turn must be between -5 and 2');
  });

  test('should reject turn above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      turn: 3, // Invalid: above 2
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('turn must be between -5 and 2');
  });

  test('should reject fade below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      fade: -1, // Invalid: below 0
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('fade must be between 0 and 5');
  });

  test('should reject fade above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      fade: 6, // Invalid: above 5
    };

    const mockPrisma = {
      bags: {
        findFirst: () => ({ id: bagId, user_id: userId }),
      },
      disc_master: {
        findUnique: () => ({ id: discData.disc_id, approved: true }),
      },
    };

    await expect(addToBagService(userId, bagId, discData, mockPrisma))
      .rejects.toThrow('fade must be between 0 and 5');
  });
});
