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
    mockDatabase.queryOne.mockReset();
    // Default mock for count query
    mockDatabase.queryOne.mockResolvedValue({ count: '0' });
  });

  test('should export a function', () => {
    expect(typeof listDiscsService).toBe('function');
  });

  test('should throw ValidationError if speed is not a number or range', async () => {
    await expect(listDiscsService({ speed: 'fast' })).rejects.toThrow('Invalid speed filter value');
  });

  test('should throw ValidationError if glide is not a number or range', async () => {
    await expect(listDiscsService({ glide: 'floaty' })).rejects.toThrow('Invalid glide filter value');
  });

  test('should throw ValidationError if turn is not a number or range', async () => {
    await expect(listDiscsService({ turn: 'sideways' })).rejects.toThrow('Invalid turn filter value');
  });

  test('should throw ValidationError if fade is not a number or range', async () => {
    await expect(listDiscsService({ fade: 'sharp' })).rejects.toThrow('Invalid fade filter value');
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
    mockDatabase.queryOne.mockResolvedValue({ count: fakeResults.length.toString() });
    const result = await listDiscsService({ brand: fakeResults[0].brand }, mockDatabase);
    expect(result.discs).toBe(fakeResults);
    expect(result.total).toBe(fakeResults.length);
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
    const pendingDiscs = [
      {
        id: 1, brand: 'Test', model: 'Pending', approved: false,
      },
    ];
    mockDatabase.queryRows.mockResolvedValue(pendingDiscs);
    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    const result = await listDiscsService({ approved: false });
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [false, 50, 0],
    );
    expect(result.discs.every((d) => d.approved === false)).toBe(true);
  });

  test('should cap limit at 100', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ limit: '200' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE approved = $1 ORDER BY brand ASC, model ASC LIMIT $2 OFFSET $3',
      [true, 100, 0],
    );
  });

  test('should return pagination metadata with discs', async () => {
    const mockDiscs = [
      { id: 1, brand: 'Innova', model: 'Destroyer' },
      { id: 2, brand: 'Discraft', model: 'Buzzz' },
    ];

    // Mock both the data query and the count query
    mockDatabase.queryRows.mockResolvedValueOnce(mockDiscs);
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '25' });

    const result = await listDiscsService({ limit: '10', offset: '5' }, mockDatabase);

    expect(result).toEqual({
      discs: mockDiscs,
      total: 25,
      limit: 10,
      offset: 5,
      hasMore: true,
    });
  });

  test('should calculate hasMore correctly when on last page', async () => {
    const mockDiscs = [
      { id: 1, brand: 'Innova', model: 'Destroyer' },
    ];

    mockDatabase.queryRows.mockResolvedValueOnce(mockDiscs);
    mockDatabase.queryOne.mockResolvedValueOnce({ count: '21' });

    const result = await listDiscsService({ limit: '10', offset: '20' }, mockDatabase);

    expect(result.hasMore).toBe(false);
  });

  // Multi-select brand tests
  test('should handle comma-separated brands with OR logic', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ brand: 'Innova,Discraft,MVP' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE brand IN ($1, $2, $3) AND approved = $4 ORDER BY brand ASC, model ASC LIMIT $5 OFFSET $6',
      ['Innova', 'Discraft', 'MVP', true, 50, 0],
    );
  });

  test('should handle comma-separated brands with extra spaces', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ brand: ' Innova , Discraft , MVP ' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE brand IN ($1, $2, $3) AND approved = $4 ORDER BY brand ASC, model ASC LIMIT $5 OFFSET $6',
      ['Innova', 'Discraft', 'MVP', true, 50, 0],
    );
  });

  test('should handle single brand in comma format', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ brand: 'Innova,' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE brand IN ($1) AND approved = $2 ORDER BY brand ASC, model ASC LIMIT $3 OFFSET $4',
      ['Innova', true, 50, 0],
    );
  });

  // Multi-select flight number tests
  test('should handle comma-separated speed ranges with OR logic', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ speed: '1-4,10-15' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE ((speed >= $1 AND speed <= $2) OR (speed >= $3 AND speed <= $4)) AND approved = $5 ORDER BY brand ASC, model ASC LIMIT $6 OFFSET $7',
      [1, 4, 10, 15, true, 50, 0],
    );
  });

  test('should handle mixed single values and ranges for speed', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ speed: '5,10-12' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE (speed = $1 OR (speed >= $2 AND speed <= $3)) AND approved = $4 ORDER BY brand ASC, model ASC LIMIT $5 OFFSET $6',
      [5, 10, 12, true, 50, 0],
    );
  });

  test('should handle multiple single speed values', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ speed: '5,7,9' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE (speed = $1 OR speed = $2 OR speed = $3) AND approved = $4 ORDER BY brand ASC, model ASC LIMIT $5 OFFSET $6',
      [5, 7, 9, true, 50, 0],
    );
  });

  test('should handle comma-separated glide ranges', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ glide: '1-3,6-7' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE ((glide >= $1 AND glide <= $2) OR (glide >= $3 AND glide <= $4)) AND approved = $5 ORDER BY brand ASC, model ASC LIMIT $6 OFFSET $7',
      [1, 3, 6, 7, true, 50, 0],
    );
  });

  test('should handle comma-separated turn ranges with negative values', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ turn: '-5--1,0-0,1-2' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE ((turn >= $1 AND turn <= $2) OR (turn >= $3 AND turn <= $4) OR (turn >= $5 AND turn <= $6)) AND approved = $7 ORDER BY brand ASC, model ASC LIMIT $8 OFFSET $9',
      [-5, -1, 0, 0, 1, 2, true, 50, 0],
    );
  });

  test('should handle comma-separated fade ranges', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({ fade: '0-1,4-5' }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM disc_master WHERE ((fade >= $1 AND fade <= $2) OR (fade >= $3 AND fade <= $4)) AND approved = $5 ORDER BY brand ASC, model ASC LIMIT $6 OFFSET $7',
      [0, 1, 4, 5, true, 50, 0],
    );
  });

  test('should throw ValidationError for invalid comma-separated ranges', async () => {
    await expect(listDiscsService({ speed: '1-4,invalid,10-15' })).rejects.toThrow('Invalid speed filter value');
    await expect(listDiscsService({ glide: 'low,high' })).rejects.toThrow('Invalid glide filter value');
    await expect(listDiscsService({ turn: '1-2,abc-def' })).rejects.toThrow('Invalid turn filter value');
    await expect(listDiscsService({ fade: '0-1,2-' })).rejects.toThrow('Invalid fade filter value');
  });

  test('should handle complex multi-select combination', async () => {
    mockDatabase.queryRows.mockResolvedValue([]);
    await listDiscsService({
      brand: 'Innova,Discraft',
      speed: '1-4,10-15',
      glide: '4-5',
      turn: '-1,0,1',
    }, mockDatabase);

    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('WHERE brand IN ($1, $2)'),
      expect.arrayContaining(['Innova', 'Discraft', 1, 4, 10, 15, 4, 5, -1, 0, 1]),
    );
  });
});
