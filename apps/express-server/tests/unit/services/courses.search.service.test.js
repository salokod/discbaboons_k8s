import { describe, test, expect } from 'vitest';
import Chance from 'chance';
import coursesSearchService from '../../../services/courses.search.service.js';

const chance = new Chance();

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
        state: chance.state(),
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    const mockPrisma = {
      courses: {
        findMany: async () => mockCourses,
        count: async () => 1,
      },
    };

    const result = await coursesSearchService({}, mockPrisma);
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should filter courses by state', async () => {
    const targetState = chance.state();
    const mockCourses = [
      {
        id: chance.word(),
        name: chance.sentence(),
        city: chance.city(),
        state: targetState,
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    const mockPrisma = {
      courses: {
        findMany: async (query) => {
          expect(query.where.state).toBe(targetState);
          return mockCourses;
        },
        count: async () => 1,
      },
    };

    const result = await coursesSearchService({ state: targetState }, mockPrisma);
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
        state: chance.state(),
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    const mockPrisma = {
      courses: {
        findMany: async (query) => {
          expect(query.where.city).toBe(targetCity);
          return mockCourses;
        },
        count: async () => 1,
      },
    };

    const result = await coursesSearchService({ city: targetCity }, mockPrisma);
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
        state: chance.state(),
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    const mockPrisma = {
      courses: {
        findMany: async (query) => {
          expect(query.where.name).toEqual({
            contains: searchName,
            mode: 'insensitive',
          });
          return mockCourses;
        },
        count: async () => 1,
      },
    };

    const result = await coursesSearchService({ name: searchName }, mockPrisma);
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should combine multiple filters', async () => {
    const targetState = chance.state();
    const targetCity = chance.city();
    const searchName = chance.word();
    const mockCourses = [
      {
        id: chance.word(),
        name: `${searchName} Park`,
        city: targetCity,
        state: targetState,
        hole_count: chance.integer({ min: 9, max: 27 }),
        approved: true,
      },
    ];

    const mockPrisma = {
      courses: {
        findMany: async (query) => {
          expect(query.where.approved).toBe(true);
          expect(query.where.state).toBe(targetState);
          expect(query.where.city).toBe(targetCity);
          expect(query.where.name).toEqual({
            contains: searchName,
            mode: 'insensitive',
          });
          return mockCourses;
        },
        count: async () => 1,
      },
    };

    const result = await coursesSearchService({
      state: targetState,
      city: targetCity,
      name: searchName,
    }, mockPrisma);
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(1);
  });

  test('should apply default pagination (limit 50)', async () => {
    const mockCourses = [{ id: chance.word(), approved: true }];

    const mockPrisma = {
      courses: {
        findMany: async (query) => {
          expect(query.take).toBe(50);
          expect(query.skip).toBe(0);
          return mockCourses;
        },
        count: async () => 100,
      },
    };

    const result = await coursesSearchService({}, mockPrisma);
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(100);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  test('should apply custom pagination parameters', async () => {
    const mockCourses = [{ id: chance.word(), approved: true }];

    const mockPrisma = {
      courses: {
        findMany: async (query) => {
          expect(query.take).toBe(100);
          expect(query.skip).toBe(200);
          return mockCourses;
        },
        count: async () => 500,
      },
    };

    const result = await coursesSearchService({
      limit: 100,
      offset: 200,
    }, mockPrisma);
    expect(result.courses).toEqual(mockCourses);
    expect(result.total).toBe(500);
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(200);
  });

  test('should enforce maximum limit of 500', async () => {
    const mockCourses = [{ id: chance.word(), approved: true }];

    const mockPrisma = {
      courses: {
        findMany: async (query) => {
          expect(query.take).toBe(500);
          return mockCourses;
        },
        count: async () => 1000,
      },
    };

    const result = await coursesSearchService({
      limit: 1000, // Requesting more than max
    }, mockPrisma);
    expect(result.limit).toBe(500);
  });
});
