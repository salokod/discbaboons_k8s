import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import getBagService from '../../../services/bags.get.service.js';

const chance = new Chance();

describe('getBagService', () => {
  test('should export a function', () => {
    expect(typeof getBagService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await getBagService(undefined, chance.guid());
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/userId is required/i);
    }
  });

  test('should throw ValidationError if bagId is missing', async () => {
    try {
      await getBagService(chance.integer({ min: 1 }), undefined);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/bagId is required/i);
    }
  });

  test('should return bag if user owns it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };

    const mockPrisma = {
      bags: {
        findFirst: async () => mockBag,
      },
    };

    const result = await getBagService(userId, bagId, false, mockPrisma);

    expect(result).toEqual(mockBag);
  });

  test('should return null if bag does not exist or user does not own it', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();

    const mockPrisma = {
      bags: {
        findFirst: async () => null, // Bag not found or not owned
      },
    };

    const result = await getBagService(userId, bagId, false, mockPrisma);

    expect(result).toBeNull();
  });

  test('should return null if bagId is not a valid UUID format', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidBagId = 'badBagId'; // Invalid UUID format

    // Mock should not be called since we return early for invalid UUID
    const mockPrisma = {
      bags: {
        findFirst: async () => {
          throw new Error('Should not reach Prisma for invalid UUID');
        },
      },
    };

    const result = await getBagService(userId, invalidBagId, mockPrisma);

    expect(result).toBeNull();
  });

  test('should call findFirst with bag_contents include', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    let findFirstOptions;

    const mockPrisma = {
      bags: {
        findFirst: async (options) => {
          findFirstOptions = options;
          return null;
        },
      },
    };

    await getBagService(userId, bagId, false, mockPrisma);

    expect(findFirstOptions.include).toBeDefined();
    expect(findFirstOptions.include.bag_contents).toBeDefined();
  });

  test('should include disc_master with bag_contents', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    let findFirstOptions;

    const mockPrisma = {
      bags: {
        findFirst: async (options) => {
          findFirstOptions = options;
          return null;
        },
      },
    };

    await getBagService(userId, bagId, false, mockPrisma);

    expect(findFirstOptions.include.bag_contents.include).toBeDefined();
    expect(findFirstOptions.include.bag_contents.include.disc_master).toBe(true);
  });

  test('should filter out lost discs by default', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    let findFirstOptions;

    const mockPrisma = {
      bags: {
        findFirst: async (options) => {
          findFirstOptions = options;
          return null;
        },
      },
    };

    await getBagService(userId, bagId, false, mockPrisma);

    expect(findFirstOptions.include.bag_contents.where).toBeDefined();
    expect(findFirstOptions.include.bag_contents.where.is_lost).toBe(false);
  });

  test('should include lost discs when includeLost is true', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    let findFirstOptions;

    const mockPrisma = {
      bags: {
        findFirst: async (options) => {
          findFirstOptions = options;
          return null;
        },
      },
    };

    await getBagService(userId, bagId, true, mockPrisma);

    expect(findFirstOptions.include.bag_contents.where).toBeUndefined();
  });

  test('should use custom flight numbers from bag_contents over disc_master', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      bag_contents: [{
        id: chance.guid(),
        speed: 9, // Custom override
        glide: null, // Use disc_master fallback
        turn: -2, // Custom override
        fade: null, // Use disc_master fallback
        disc_master: {
          speed: 12, // Stock value (should be overridden)
          glide: 5, // Stock value (should be used)
          turn: -1, // Stock value (should be overridden)
          fade: 3, // Stock value (should be used)
        },
      }],
    };

    const mockPrisma = {
      bags: {
        findFirst: async () => mockBag,
      },
    };

    const result = await getBagService(userId, bagId, false, mockPrisma);

    expect(result.bag_contents[0].speed).toBe(9); // Custom used
    expect(result.bag_contents[0].glide).toBe(5); // Fallback used
    expect(result.bag_contents[0].turn).toBe(-2); // Custom used
    expect(result.bag_contents[0].fade).toBe(3); // Fallback used
  });

  test('should use all custom flight numbers when none are null', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      bag_contents: [{
        id: chance.guid(),
        speed: 11, // All custom values
        glide: 6, // All custom values
        turn: 0, // All custom values
        fade: 1, // All custom values
        disc_master: {
          speed: 12, // Should be ignored
          glide: 5, // Should be ignored
          turn: -1, // Should be ignored
          fade: 3, // Should be ignored
        },
      }],
    };

    const mockPrisma = {
      bags: {
        findFirst: async () => mockBag,
      },
    };

    const result = await getBagService(userId, bagId, false, mockPrisma);

    expect(result.bag_contents[0].speed).toBe(11); // All custom values used
    expect(result.bag_contents[0].glide).toBe(6);
    expect(result.bag_contents[0].turn).toBe(0);
    expect(result.bag_contents[0].fade).toBe(1);
  });

  test('should use custom brand/model from bag_contents over disc_master', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      bag_contents: [{
        id: chance.guid(),
        brand: 'Custom Brand', // Custom override
        model: null, // Use disc_master fallback
        disc_master: {
          brand: 'Stock Brand', // Stock value (should be overridden)
          model: 'Stock Model', // Stock value (should be used)
        },
      }],
    };

    const mockPrisma = {
      bags: {
        findFirst: async () => mockBag,
      },
    };

    const result = await getBagService(userId, bagId, false, mockPrisma);

    expect(result.bag_contents[0].brand).toBe('Custom Brand'); // Custom used
    expect(result.bag_contents[0].model).toBe('Stock Model'); // Fallback used
  });

  test('should use all custom brand/model when both are provided', async () => {
    const userId = chance.integer({ min: 1 });
    const bagId = chance.guid();
    const mockBag = {
      id: bagId,
      user_id: userId,
      bag_contents: [{
        id: chance.guid(),
        brand: 'Beat-in Brand', // All custom values
        model: 'Seasoned Destroyer', // All custom values
        disc_master: {
          brand: 'Innova', // Should be ignored
          model: 'Destroyer', // Should be ignored
        },
      }],
    };

    const mockPrisma = {
      bags: {
        findFirst: async () => mockBag,
      },
    };

    const result = await getBagService(userId, bagId, false, mockPrisma);

    expect(result.bag_contents[0].brand).toBe('Beat-in Brand'); // All custom values used
    expect(result.bag_contents[0].model).toBe('Seasoned Destroyer');
  });
});
