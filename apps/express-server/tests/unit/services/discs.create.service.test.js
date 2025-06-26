/* eslint-disable camelcase, no-underscore-dangle */

import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock Prisma
const mockCreate = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    disc_master: {
      create: mockCreate,
      findFirst: mockFindFirst,
    },
    $disconnect: vi.fn(),
  })),
}));

const { default: createDiscService } = await import('../../../services/discs.create.service.js');

describe('createDiscService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof createDiscService).toBe('function');
  });

  test('should throw ValidationError if required fields are missing', async () => {
    const brand = chance.word();
    const model = chance.word();
    const speed = chance.integer({ min: 1, max: 14 });
    const glide = chance.integer({ min: 1, max: 7 });
    const turn = chance.integer({ min: -5, max: 2 });

    await expect(createDiscService({})).rejects.toThrow('Brand is required');
    await expect(createDiscService({ brand })).rejects.toThrow('Model is required');
    await expect(createDiscService({ brand, model })).rejects.toThrow('Speed is required');
    await expect(createDiscService({ brand, model, speed })).rejects.toThrow('Glide is required');
    await expect(createDiscService({
      brand, model, speed, glide,
    })).rejects.toThrow('Turn is required');
    await expect(createDiscService({
      brand, model, speed, glide, turn,
    })).rejects.toThrow('Fade is required');
  });

  test('should create a disc with pending approval and return the created disc', async () => {
    const brand = chance.word();
    const model = chance.word();
    const speed = chance.integer({ min: 1, max: 14 });
    const glide = chance.integer({ min: 1, max: 7 });
    const turn = chance.integer({ min: -5, max: 2 });
    const fade = chance.integer({ min: 0, max: 5 });
    const added_by_id = chance.integer({ min: 1, max: 100 });

    const fakeDisc = {
      id: chance.guid(),
      brand,
      model,
      speed,
      glide,
      turn,
      fade,
      approved: false,
      added_by_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockCreate.mockResolvedValue(fakeDisc);

    const result = await createDiscService({
      brand, model, speed, glide, turn, fade, added_by_id,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        brand,
        model,
        speed,
        glide,
        turn,
        fade,
        approved: false,
        added_by_id,
      },
    });
    expect(result).toBe(fakeDisc);
  });

  test('should throw ValidationError if disc with same brand and model exists (case-insensitive)', async () => {
    const brand = chance.word();
    const model = chance.word();
    const discData = {
      brand,
      model,
      speed: chance.integer({ min: 1, max: 14 }),
      glide: chance.integer({ min: 1, max: 7 }),
      turn: chance.integer({ min: -5, max: 2 }),
      fade: chance.integer({ min: 0, max: 5 }),
      added_by_id: chance.integer({ min: 1, max: 100 }),
    };

    // Simulate existing disc found
    mockFindFirst.mockResolvedValue({ id: chance.guid(), ...discData });

    await expect(createDiscService(discData)).rejects.toThrow('A disc with this brand and model already exists');
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        brand: { equals: brand, mode: 'insensitive' },
        model: { equals: model, mode: 'insensitive' },
      },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
