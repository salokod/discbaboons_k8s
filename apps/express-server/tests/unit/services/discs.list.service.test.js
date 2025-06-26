import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';

import Chance from 'chance';

const chance = new Chance();

// Mock Prisma
const mockFindMany = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    disc_master: {
      findMany: mockFindMany,
    },
    $disconnect: vi.fn(),
  })),
}));

const { default: listDiscsService } = await import('../../../services/discs.list.service.js');

describe('listDiscsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof listDiscsService).toBe('function');
  });

  test('should throw ValidationError if speed is not a number or range', async () => {
    await expect(listDiscsService({ speed: 'fast' })).rejects.toThrow('Invalid filter value');
  });

  test('should throw ValidationError if glide is not a number or range', async () => {
    await expect(listDiscsService({ glide: 'floaty' })).rejects.toThrow('Invalid filter value');
  });

  test('should throw ValidationError if turn is not a number or range', async () => {
    await expect(listDiscsService({ turn: 'sideways' })).rejects.toThrow('Invalid filter value');
  });

  test('should throw ValidationError if fade is not a number or range', async () => {
    await expect(listDiscsService({ fade: 'sharp' })).rejects.toThrow('Invalid filter value');
  });

  test('should call Prisma with correct filters for single values', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({ brand: 'Innova', speed: '7', approved: 'true' });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        brand: 'Innova',
        speed: 7,
        approved: true,
      }),
    }));
  });

  test('should call Prisma with correct filters for range values', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({ speed: '2-10', glide: '4-6' });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        speed: { gte: 2, lte: 10 },
        glide: { gte: 4, lte: 6 },
      }),
    }));
  });

  test('should call Prisma with model contains filter', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({ model: 'leo' });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        model: { contains: 'leo', mode: 'insensitive' },
      }),
    }));
  });

  test('should apply limit and offset', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({ limit: '10', offset: '20' });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 20,
      take: 10,
    }));
  });

  test('should default to approved=true if approved is not specified', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({});
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        approved: true,
      }),
    }));
  });

  test('should allow approved=false for admin', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({ approved: 'false' });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        approved: false,
      }),
    }));
  });

  test('should call Prisma with random filters', async () => {
    mockFindMany.mockResolvedValue([]);
    const brand = chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']);
    const model = chance.word({ length: 4 });
    const speed = chance.integer({ min: 2, max: 14 }).toString();
    const glide = chance.integer({ min: 1, max: 7 }).toString();
    const turn = chance.integer({ min: -5, max: 2 }).toString();
    const fade = chance.integer({ min: 0, max: 5 }).toString();
    const approved = chance.pickone(['true', 'false']);
    const limit = chance.integer({ min: 1, max: 50 }).toString();
    const offset = chance.integer({ min: 0, max: 100 }).toString();

    await listDiscsService({
      brand,
      model,
      speed,
      glide,
      turn,
      fade,
      approved,
      limit,
      offset,
    });

    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        brand,
        model: { contains: model, mode: 'insensitive' },
        speed: Number(speed),
        glide: Number(glide),
        turn: Number(turn),
        fade: Number(fade),
        approved: approved === 'true',
      }),
      skip: Number(offset),
      take: Number(limit),
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    }));
  });

  test('should handle range values for all numeric filters', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({
      speed: '3-7',
      glide: '4-6',
      turn: '0-2',
      fade: '1-3',
    });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        speed: { gte: 3, lte: 7 },
        glide: { gte: 4, lte: 6 },
        turn: { gte: 0, lte: 2 },
        fade: { gte: 1, lte: 3 },
      }),
    }));
  });

  test('should handle missing filters gracefully', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({});
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        approved: true,
      }),
    }));
  });

  test('should handle negative numbers and negative ranges for turn', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({ turn: '-5--2' });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        turn: { gte: -5, lte: -2 },
      }),
    }));

    await listDiscsService({ turn: '-3' });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        turn: -3,
      }),
    }));
  });

  test('should handle negative and positive ranges for all numeric filters', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({
      speed: '-2-10',
      glide: '-1-7',
      turn: '-5-2',
      fade: '-1-4',
    });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        speed: { gte: -2, lte: 10 },
        glide: { gte: -1, lte: 7 },
        turn: { gte: -5, lte: 2 },
        fade: { gte: -1, lte: 4 },
      }),
    }));
  });

  test('should ignore filters that are undefined or empty strings', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({
      brand: '',
      model: undefined,
      speed: '',
      glide: undefined,
      turn: '',
      fade: undefined,
      approved: undefined,
    });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { approved: true },
    }));
  });

  test('should throw ValidationError if limit or offset are not numbers', async () => {
    await expect(listDiscsService({ limit: 'foo' })).rejects.toThrow('Invalid limit');
    await expect(listDiscsService({ offset: 'bar' })).rejects.toThrow('Invalid offset');
  });
  test('should return the results from Prisma (randomized)', async () => {
    const fakeResults = Array.from({ length: chance.integer({ min: 1, max: 5 }) }, () => ({
      id: chance.guid(),
      brand: chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']),
      model: chance.word({ length: 6 }),
      speed: chance.integer({ min: 1, max: 14 }),
    }));
    mockFindMany.mockResolvedValue(fakeResults);
    const result = await listDiscsService({ brand: fakeResults[0].brand });
    expect(result).toBe(fakeResults);
  });

  test('should order by brand and model ascending', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({});
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [
        { brand: 'asc' },
        { model: 'asc' },
      ],
    }));
  });

  test('should trim whitespace from string filters', async () => {
    mockFindMany.mockResolvedValue([]);
    await listDiscsService({
      brand: '  Innova  ',
      model: '  leo ',
    });
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        brand: 'Innova',
        model: { contains: 'leo', mode: 'insensitive' },
      }),
    }));
  });

  test('should return only pending discs when approved is false', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 1, brand: 'Test', model: 'Pending', approved: false,
      },
    ]);
    const result = await listDiscsService({ approved: false });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ approved: false }),
      }),
    );
    expect(result.every((d) => d.approved === false)).toBe(true);
  });
});
