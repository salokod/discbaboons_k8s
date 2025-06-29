import {
  describe, test, expect, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let createBagService;

beforeAll(async () => {
  ({ default: createBagService } = await import('../../../services/bags.create.service.js'));
});

describe('createBagService', () => {
  test('should export a function', () => {
    expect(typeof createBagService).toBe('function');
  });

  test('should throw ValidationError if userId is missing', async () => {
    try {
      await createBagService(undefined, { name: chance.word() });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('should throw ValidationError if bag name is missing', async () => {
    try {
      await createBagService(chance.integer({ min: 1 }), {});
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('should throw ValidationError if bag name is not unique for user', async () => {
    const userId = chance.integer({ min: 1 });
    const bagName = chance.word();
    // Mock Prisma to simulate a duplicate bag
    const mockPrisma = {
      bags: {
        findFirst: async ({ where }) => ({ id: chance.guid(), ...where }),
      },
    };
    try {
      await createBagService(userId, { name: bagName }, mockPrisma);
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/already exists/i);
    }
  });

  test('should throw ValidationError if bag name is too long', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.string({ length: 101 }),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };
    try {
      await createBagService(userId, bagData, { bags: { findFirst: async () => null } });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/100 characters or less/i);
    }
  });

  test('should throw ValidationError if description is too long', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.string({ length: 501 }),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };
    try {
      await createBagService(userId, bagData, { bags: { findFirst: async () => null } });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/500 characters or less/i);
    }
  });

  test('should throw ValidationError if is_public is not boolean', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: 'yes',
      is_friends_visible: chance.bool(),
    };
    try {
      await createBagService(userId, bagData, { bags: { findFirst: async () => null } });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/is_public must be a boolean/i);
    }
  });

  test('should throw ValidationError if is_friends_visible is not boolean', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: 'no',
    };
    try {
      await createBagService(userId, bagData, { bags: { findFirst: async () => null } });
      throw new Error('Did not throw');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
      expect(err.message).toMatch(/is_friends_visible must be a boolean/i);
    }
  });

  test('should create and return a new bag if all inputs are valid', async () => {
    const userId = chance.integer({ min: 1 });
    const bagData = {
      name: chance.word(),
      description: chance.sentence(),
      is_public: chance.bool(),
      is_friends_visible: chance.bool(),
    };
    const createdBag = {
      id: chance.guid(),
      user_id: userId,
      ...bagData,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockPrisma = {
      bags: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdBag),
      },
    };

    const result = await createBagService(userId, bagData, mockPrisma);
    expect(mockPrisma.bags.findFirst).toHaveBeenCalledWith({
      where: { user_id: userId, name: { equals: bagData.name, mode: 'insensitive' } },
    });
    expect(mockPrisma.bags.create).toHaveBeenCalledWith({
      data: {
        user_id: userId,
        name: bagData.name,
        description: bagData.description,
        is_public: bagData.is_public,
        is_friends_visible: bagData.is_friends_visible,
      },
    });
    expect(result).toBe(createdBag);
  });
});
