import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    disc_master: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  })),
}));

const { default: approveDiscService } = await import('../../../services/discs.approve.service.js');

describe('approveDiscService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof approveDiscService).toBe('function');
  });

  test('should throw if disc does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    const randomId = chance.integer({ min: 1, max: 10000 });
    await expect(approveDiscService(randomId)).rejects.toThrow('Disc not found');
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: randomId } });
  });

  test('should approve a pending disc', async () => {
    const disc = {
      id: chance.integer({ min: 1, max: 10000 }),
      approved: false,
      brand: chance.word(),
      model: chance.word(),
    };
    mockFindUnique.mockResolvedValue(disc);
    mockUpdate.mockResolvedValue({ ...disc, approved: true });

    const result = await approveDiscService(disc.id);

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: disc.id } });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: disc.id },
      data: { approved: true },
    });
    expect(result).toEqual({ ...disc, approved: true });
  });
});
