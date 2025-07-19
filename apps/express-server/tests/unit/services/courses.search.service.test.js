import {
  describe, test, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import coursesSearchService from '../../../services/courses.search.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

beforeEach(() => {
  mockDatabase.queryOne.mockClear();
  mockDatabase.queryRows.mockClear();
});

describe('coursesSearchService', () => {
  test('should export a function', () => {
    expect(typeof coursesSearchService).toBe('function');
  });

  test('should return all approved courses when no filters provided', async () => {
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        city: chance.city(),
        state_province: chance.state({ abbreviated: true }),
        country: 'US',
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({});

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true',
      [],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $1 OFFSET $2',
      [50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should filter courses by state', async () => {
    const targetState = chance.state({ abbreviated: true });
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        city: chance.city(),
        state_province: targetState,
        country: 'US',
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ state: targetState });

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true AND state_province ILIKE $1',
      [`%${targetState}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true AND state_province ILIKE $1 ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $2 OFFSET $3',
      [`%${targetState}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should filter courses by city', async () => {
    const targetCity = chance.city();
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        city: targetCity,
        state_province: chance.state({ abbreviated: true }),
        country: 'US',
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ city: targetCity });

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true AND city ILIKE $1',
      [`%${targetCity}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true AND city ILIKE $1 ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $2 OFFSET $3',
      [`%${targetCity}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should filter courses by name with case-insensitive partial match', async () => {
    const searchName = chance.word();
    const mockCourses = [
      {
        id: chance.word(),
        name: `${searchName} Disc Golf Course`,
        city: chance.city(),
        state_province: chance.state({ abbreviated: true }),
        country: 'US',
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ name: searchName });

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true AND name ILIKE $1',
      [`%${searchName}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true AND name ILIKE $1 ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $2 OFFSET $3',
      [`%${searchName}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should combine multiple filters', async () => {
    const targetState = chance.state({ abbreviated: true });
    const targetCity = chance.city();
    const searchName = chance.word();
    const mockCourses = [
      {
        id: chance.word(),
        name: `${searchName} Park`,
        city: targetCity,
        state_province: targetState,
        country: 'US',
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({
      state: targetState,
      city: targetCity,
      name: searchName,
    });

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true AND state_province ILIKE $1 AND city ILIKE $2 AND name ILIKE $3',
      [`%${targetState}%`, `%${targetCity}%`, `%${searchName}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true AND state_province ILIKE $1 AND city ILIKE $2 AND name ILIKE $3 ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $4 OFFSET $5',
      [`%${targetState}%`, `%${targetCity}%`, `%${searchName}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should apply default pagination (limit 50)', async () => {
    const mockCourses = [{ id: chance.word(), approved: true }];

    mockDatabase.queryOne.mockResolvedValue({ count: '100' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({});

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true',
      [],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $1 OFFSET $2',
      [50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(100);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  test('should apply custom pagination parameters', async () => {
    const mockCourses = [{ id: chance.word(), approved: true }];

    mockDatabase.queryOne.mockResolvedValue({ count: '500' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({
      limit: 100,
      offset: 200,
    });

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true',
      [],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $1 OFFSET $2',
      [100, 200],
    );
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(500);
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(200);
  });

  test('should enforce maximum limit of 500', async () => {
    const mockCourses = [{ id: chance.word(), approved: true }];

    mockDatabase.queryOne.mockResolvedValue({ count: '1000' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({
      limit: 1000, // Requesting more than max
    });

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true',
      [],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $1 OFFSET $2',
      [500, 0],
    );
    expect(result.limit).toBe(500);
  });

  test('should include user own unapproved courses when userId provided', async () => {
    const userId = chance.integer({ min: 1 });
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        approved: false,
        submitted_by_id: userId,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({}, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('submitted_by_id = $1'),
      [userId],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('submitted_by_id = $1'),
      [userId, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  test('should include friend unapproved courses when userId provided', async () => {
    const userId = chance.integer({ min: 1 });
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        approved: false,
        submitted_by_id: chance.integer({ min: 1 }),
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({}, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('friendship_requests'),
      [userId],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('friendship_requests'),
      [userId, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  test('should only show approved courses when no userId provided', async () => {
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({});

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM courses WHERE approved = true',
      [],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      'SELECT * FROM courses WHERE approved = true ORDER BY country ASC, state_province ASC, city ASC, name ASC LIMIT $1 OFFSET $2',
      [50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  test('should combine filters with user visibility when userId provided', async () => {
    const userId = chance.integer({ min: 1 });
    const targetState = chance.state({ abbreviated: true });
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        state_province: targetState,
        approved: false,
        submitted_by_id: userId,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ state: targetState }, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('state_province ILIKE $2'),
      [userId, `%${targetState}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('state_province ILIKE $2'),
      [userId, `%${targetState}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  // Case-insensitive search tests
  test('should perform case-insensitive search for city', async () => {
    const userId = chance.integer({ min: 1 });
    const targetCity = 'East Moline';
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        city: 'east moline', // lowercase in database
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ city: targetCity }, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('city ILIKE'),
      [userId, `%${targetCity}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('city ILIKE'),
      [userId, `%${targetCity}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  test('should perform case-insensitive search for state/province', async () => {
    const userId = chance.integer({ min: 1 });
    const targetState = 'california';
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        state_province: 'CA', // abbreviated in database
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ stateProvince: targetState }, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('state_province ILIKE'),
      [userId, `%${targetState}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('state_province ILIKE'),
      [userId, `%${targetState}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  test('should perform case-insensitive search for country', async () => {
    const userId = chance.integer({ min: 1 });
    const targetCountry = 'us';
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        country: 'US', // uppercase in database
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ country: targetCountry }, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('country ILIKE'),
      [userId, `%${targetCountry}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('country ILIKE'),
      [userId, `%${targetCountry}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  test('should perform case-insensitive search for name', async () => {
    const userId = chance.integer({ min: 1 });
    const searchName = 'PARK';
    const mockCourses = [
      {
        id: chance.word(),
        name: 'Heritage park disc golf course', // lowercase in database
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService({ name: searchName }, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('name ILIKE'),
      [userId, `%${searchName}%`],
    );
    expect(mockDatabase.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('name ILIKE'),
      [userId, `%${searchName}%`, 50, 0],
    );
    expect(result.courses).toEqual(mockCourses);
  });

  test('should combine case-insensitive filters', async () => {
    const userId = chance.integer({ min: 1 });
    const filters = {
      city: 'East Moline',
      stateProvince: 'illinois',
      country: 'us',
      name: 'PARK',
    };
    const mockCourses = [
      {
        id: chance.word(),
        name: 'heritage park',
        city: 'east moline',
        state_province: 'IL',
        country: 'US',
        approved: true,
      },
    ];

    mockDatabase.queryOne.mockResolvedValue({ count: '1' });
    mockDatabase.queryRows.mockResolvedValue(mockCourses);

    const result = await coursesSearchService(filters, userId);

    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringMatching(/country ILIKE.*state_province ILIKE.*city ILIKE.*name ILIKE/),
      [userId, `%${filters.country}%`, `%${filters.stateProvince}%`, `%${filters.city}%`, `%${filters.name}%`],
    );
    expect(result.courses).toEqual(mockCourses);
  });
});
