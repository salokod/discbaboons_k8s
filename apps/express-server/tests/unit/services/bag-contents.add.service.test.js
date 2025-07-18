import {
  describe, test, expect, beforeAll, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';

const chance = new Chance();

let addToBagService;

beforeAll(async () => {
  ({ default: addToBagService } = await import('../../../services/bag-contents.add.service.js'));
});

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
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

    // Mock bag not found
    mockDatabase.queryOne.mockResolvedValue(null);

    await expect(addToBagService(userId, bagId, discData)).rejects.toThrow('Bag not found or access denied');
  });

  test('should throw error if disc does not exist', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = { disc_id: chance.guid({ version: 4 }) };

    // Mock bag found, disc not found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce(null); // Disc not found

    await expect(addToBagService(userId, bagId, discData)).rejects.toThrow('Disc not found');
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
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockDisc = {
      id: discId,
      brand: chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']),
      model: chance.word({ length: 8 }),
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
      approved: true,
    };

    // Mock bag found, disc found, content created
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce(mockDisc) // Disc found
      .mockResolvedValueOnce(mockBagContent); // Content created

    const result = await addToBagService(userId, bagId, discData);

    expect(result).toEqual(mockBagContent);
  });

  test('should prevent adding pending disc created by another user', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const otherUserId = chance.integer({ min: 1001, max: 2000 });
    const bagId = chance.guid({ version: 4 });
    const discId = chance.guid({ version: 4 });
    const discData = { disc_id: discId };

    const mockDisc = {
      id: discId,
      brand: chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']),
      model: chance.word({ length: 8 }),
      approved: false,
      added_by_id: otherUserId,
    };

    // Mock bag found, pending disc found created by another user
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce(mockDisc); // Disc found but pending by another user

    await expect(addToBagService(userId, bagId, discData)).rejects.toThrow('Cannot add pending disc created by another user');
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

    // Mock bag found, disc found, content created
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({
        id: discId, brand: chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']), model: chance.word({ length: 8 }), approved: true,
      }) // Disc found
      .mockResolvedValueOnce(mockBagContent); // Content created

    const result = await addToBagService(userId, bagId, discData);
    expect(result).toEqual(mockBagContent);
  });

  test('should pass flight numbers to database create method', async () => {
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

    const mockBagContent = {
      id: chance.guid(),
      bag_id: bagId,
      disc_id: discId,
      speed: 9,
      glide: 4,
      turn: -2,
      fade: 2,
    };

    // Mock successful responses
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({
        id: discId, brand: chance.company(), model: chance.word(), approved: true,
      }) // Disc found
      .mockResolvedValueOnce(mockBagContent); // Content created

    const result = await addToBagService(userId, bagId, discData);

    expect(result.speed).toBe(9);
    expect(result.glide).toBe(4);
    expect(result.turn).toBe(-2);
    expect(result.fade).toBe(2);
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

    // Mock successful responses
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({
        id: discId,
        brand: chance.company(),
        model: chance.word(),
        approved: false,
        added_by_id: userId,
      }) // Own pending disc found
      .mockResolvedValueOnce(mockBagContent); // Content created

    const result = await addToBagService(userId, bagId, discData);

    expect(result).toEqual(mockBagContent);
  });

  test('should reject speed below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      speed: 0, // Invalid: below 1
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('speed must be between 1 and 15');
  });

  test('should reject speed above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      speed: 16, // Invalid: above 15
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('speed must be between 1 and 15');
  });

  test('should reject glide below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      glide: 0, // Invalid: below 1
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('glide must be between 1 and 7');
  });

  test('should reject glide above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      glide: 8, // Invalid: above 7
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('glide must be between 1 and 7');
  });

  test('should reject turn below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      turn: -6, // Invalid: below -5
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('turn must be between -5 and 2');
  });

  test('should reject turn above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      turn: 3, // Invalid: above 2
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('turn must be between -5 and 2');
  });

  test('should reject fade below valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      fade: -1, // Invalid: below 0
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('fade must be between 0 and 5');
  });

  test('should reject fade above valid range', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      fade: 6, // Invalid: above 5
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('fade must be between 0 and 5');
  });

  test('should reject brand exceeding 50 characters', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      brand: 'a'.repeat(51), // Invalid: 51 characters
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('brand must be a string with maximum 50 characters');
  });

  test('should reject model exceeding 50 characters', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      model: 'b'.repeat(51), // Invalid: 51 characters
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('model must be a string with maximum 50 characters');
  });

  test('should reject non-string brand', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discData = {
      disc_id: chance.guid({ version: 4 }),
      brand: 123, // Invalid: not a string
    };

    // Mock bag found, disc found
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discData.disc_id, approved: true }); // Disc found

    await expect(addToBagService(userId, bagId, discData))
      .rejects.toThrow('brand must be a string with maximum 50 characters');
  });

  test('should accept valid custom brand and model', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const bagId = chance.guid({ version: 4 });
    const discId = chance.guid({ version: 4 });
    const customBrand = 'Custom Brand';
    const customModel = `${chance.word({ length: 6 })}-${chance.word({ length: 8 })}`;

    const discData = {
      disc_id: discId,
      brand: customBrand,
      model: customModel,
      notes: chance.sentence(),
    };

    const mockBagContent = {
      id: chance.guid({ version: 4 }),
      user_id: userId,
      bag_id: bagId,
      disc_id: discId,
      brand: customBrand,
      model: customModel,
      notes: discData.notes,
    };

    // Mock bag found, disc found, content created
    mockDatabase.queryOne
      .mockResolvedValueOnce({ id: bagId, user_id: userId }) // Bag found
      .mockResolvedValueOnce({ id: discId, approved: true }) // Disc found
      .mockResolvedValueOnce(mockBagContent); // Content created

    const result = await addToBagService(userId, bagId, discData);

    expect(result).toEqual(mockBagContent);
  });
});
