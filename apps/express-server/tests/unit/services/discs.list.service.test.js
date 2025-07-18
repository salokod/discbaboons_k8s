import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import listDiscsService from '../../../services/discs.list.service.js';

const chance = new Chance();

describe('listDiscsService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockDatabase.queryRows.mockReset();
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

  test('should call database with correct filters for single values', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    const brand = chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']);
    const speed = chance.integer({ min: 1, max: 14 }).toString();
    await listDiscsService({ brand, speed, approved: 'true' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE brand = $1 AND speed = $2 AND approved = $3 ORDER BY brand ASC, model ASC LIMIT $4 OFFSET $5',
      [brand, parseInt(speed, 10), true, 50, 0],
    );
  });

  test('should call database with correct filters for range values', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ speed: '2-10', glide: '4-6' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE speed >= $1 AND speed <= $2 AND glide >= $3 AND glide <= $4 AND approved = $5 ORDER BY brand ASC, model ASC LIMIT $6 OFFSET $7',
      [2, 10, 4, 6, true, 50, 0],
    );
  });

  test('should call database with model contains filter', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    const model = chance.word({ length: 4 });
    await listDiscsService({ model }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE model ILIKE $1 AND approved = $2 ORDER BY brand ASC, model ASC LIMIT $3 OFFSET $4',
      [`%${model}%`, true, 50, 0],
    );
  });

  test('should apply limit and offset', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ limit: '10', offset: '20' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [true, 10, 20],
    );
  });

  test('should default to approved=true if approved is not specified', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({});

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [true, 50, 0],
    );
  });

  test('should allow approved=false for admin', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ approved: 'false' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [false, 50, 0],
    );
  });

  test('should call database with random filters', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
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

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM disc_master WHERE'),
      expect.arrayContaining([
        brand,
        Number(speed),
        Number(glide),
        Number(turn),
        Number(fade),
        approved === 'true',
        Number(limit),
        Number(offset),
      ]),
    );
  });

  test('should handle range values for all numeric filters', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({
      speed: '3-7',
      glide: '4-6',
      turn: '0-2',
      fade: '1-3',
    });
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM disc_master WHERE'),
      expect.arrayContaining([3, 7, 4, 6, 0, 2, 1, 3]),
    );
  });

  test('should handle missing filters gracefully', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({});

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [true, 50, 0],
    );
  });

  test('should handle negative numbers and negative ranges for turn', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ turn: '-5--2' });
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE turn >= $1 AND turn <= $2 AND approved = $3 ORDER BY brand ASC, model ASC LIMIT $4 OFFSET $5',
      [-5, -2, true, 50, 0],
    );

    await listDiscsService({ turn: '-3' });
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE turn = $1 AND approved = $2 ORDER BY brand ASC, model ASC LIMIT $3 OFFSET $4',
      [-3, true, 50, 0],
    );
  });

  test('should handle negative and positive ranges for all numeric filters', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({
      speed: '-2-10',
      glide: '-1-7',
      turn: '-5-2',
      fade: '-1-4',
    });
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE speed >= $1 AND speed <= $2 AND glide >= $3 AND glide <= $4 AND turn >= $5 AND turn <= $6 AND fade >= $7 AND fade <= $8 AND approved = $9 ORDER BY brand ASC, model ASC LIMIT $10 OFFSET $11',
      [-2, 10, -1, 7, -5, 2, -1, 4, true, 50, 0],
    );
  });

  test('should ignore filters that are undefined or empty strings', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({
      brand: '',
      model: undefined,
      speed: '',
      glide: undefined,
      turn: '',
      fade: undefined,
      approved: undefined,
    });
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [true, 50, 0],
    );
  });

  test('should throw ValidationError if limit or offset are not numbers', async () => {
    await expect(listDiscsService({ limit: 'foo' })).rejects.toThrow('Invalid limit');
    await expect(listDiscsService({ offset: 'bar' })).rejects.toThrow('Invalid offset');
  });
  test('should return the results from database (randomized)', async () => {
    const fakeResults = Array.from({ length: chance.integer({ min: 1, max: 5 }) }, () => ({
      id: chance.guid(),
      brand: chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']),
      model: chance.word({ length: 6 }),
      speed: chance.integer({ min: 1, max: 14 }),
    }));
    mockDatabase.queryRows.mockResolvedValue(fakeResults);
    const result = await listDiscsService({ brand: fakeResults[0].brand }, mockDatabase);
    expect(result).toBe(fakeResults);
  });

  test('should order by brand and model ascending', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({});
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY brand ASC, model ASC'),
      [true, 50, 0],
    );
  });

  test('should trim whitespace from string filters', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    const brand = chance.pickone(['Innova', 'Discraft', 'Latitude 64', 'MVP', 'Axiom Discs']);
    const model = chance.word({ length: 4 });
    await listDiscsService({
      brand: `  ${brand}  `,
      model: `  ${model} `,
    }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE brand = $1 AND model ILIKE $2 AND approved = $3 ORDER BY brand ASC, model ASC LIMIT $4 OFFSET $5',
      [brand, `%${model}%`, true, 50, 0],
    );
  });

  test('should return only pending discs when approved is false', async () => {
    mockDatabase.queryRows.mockResolvedValue([
      {
        id: 1, brand: 'Test', model: 'Pending', approved: false,
      },
    ]);
    const result = await listDiscsService({ approved: false });
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [false, 50, 0],
    );
    expect(result.every((d) => d.approved === false)).toBe(true);
  });
});
