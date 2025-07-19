import {
  describe, it, expect, beforeEach,
} from 'vitest';
import Chance from 'chance';
import mockDatabase from '../setup.js';
import coursesSubmitService from '../../../services/courses.submit.service.js';

const chance = new Chance();

describe('courses.submit.service', () => {
  beforeEach(() => {
    mockDatabase.queryOne.mockClear();
    mockDatabase.queryRows.mockClear();
  });

  it('should export a function', () => {
    expect(typeof coursesSubmitService).toBe('function');
  });

  it('should throw ValidationError when userId is missing', async () => {
    await expect(coursesSubmitService()).rejects.toThrow('userId is required');
  });

  it('should throw ValidationError when course name is missing', async () => {
    const userId = chance.integer({ min: 1 });
    const courseData = {};

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Course name is required');
  });

  it('should throw ValidationError when city is missing', async () => {
    const userId = chance.integer({ min: 1 });
    const courseData = { name: chance.string() };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('City is required');
  });

  it('should throw ValidationError when stateProvince is missing', async () => {
    const userId = chance.integer({ min: 1 });
    const courseData = {
      name: chance.string(),
      city: chance.city(),
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('State/Province is required');
  });

  it('should throw ValidationError when holeCount is missing', async () => {
    const userId = chance.integer({ min: 1 });
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
      // Missing holeCount
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Hole count is required and must be a positive integer');
  });

  it('should throw ValidationError when holeCount is invalid', async () => {
    const userId = chance.integer({ min: 1 });
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: 'US',
      holeCount: -5, // Invalid negative hole count
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Hole count is required and must be a positive integer');
  });

  it('should throw ValidationError when country is missing', async () => {
    const userId = chance.integer({ min: 1 });
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: '', // Empty country
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Country is required');
  });

  it('should throw ValidationError when country is invalid', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidCountry = chance.string({ length: 3, alpha: true }); // 3 chars = invalid
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: invalidCountry,
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Country must be a valid 2-character ISO code (e.g., US, CA, AU, GB, JP, BR, MX)');
  });

  it('should throw ValidationError when US state is invalid', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidState = 'ZZ'; // Guaranteed invalid US state
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: invalidState, // Invalid US state
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('State must be a valid 2-character US state abbreviation (e.g., CA, TX, NY)');
  });

  it('should throw ValidationError when Canadian province is invalid', async () => {
    const userId = chance.integer({ min: 1 });
    const invalidProvince = 'ZZ'; // Guaranteed invalid Canadian province
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: invalidProvince, // Invalid Canadian province
      country: 'CA',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Province must be a valid 2-character Canadian province code (e.g., ON, BC, QC)');
  });

  it('should create course with required fields and return course data', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates); // Pick from known valid US states
    const validCountry = 'US'; // Keep US for this test since we're testing the US validation path
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: validCountry,
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const expectedCourseId = `${courseData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${courseData.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${courseData.stateProvince.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${courseData.country.toLowerCase()}`;

    const mockResult = {
      ...courseData,
      id: expectedCourseId,
      is_user_submitted: true,
      approved: false,
      submitted_by_id: userId,
    };

    mockDatabase.queryOne.mockResolvedValueOnce(null); // First call - no existing course
    mockDatabase.queryOne.mockResolvedValueOnce(mockResult); // Second call - insert result

    const result = await coursesSubmitService(userId, courseData);

    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      1,
      'SELECT id FROM courses WHERE id = $1',
      [expectedCourseId],
    );
    expect(mockDatabase.queryOne).toHaveBeenNthCalledWith(
      2,
      `INSERT INTO courses (id, name, city, state_province, country, postal_code, hole_count, latitude, longitude, is_user_submitted, approved, submitted_by_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        expectedCourseId,
        courseData.name,
        courseData.city,
        courseData.stateProvince,
        courseData.country,
        undefined,
        courseData.holeCount,
        undefined,
        undefined,
        true,
        false,
        userId,
      ],
    );
    expect(result).toEqual(mockResult);
  });

  it('should accept any valid country code (inclusive approach)', async () => {
    const userId = chance.integer({ min: 1 });
    const randomStateProvince = chance.city();
    const randomCountry = chance.string({ length: 2, alpha: true }).toUpperCase();
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: randomStateProvince,
      country: randomCountry, // Random country - not in our validation rules but should be accepted
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    const mockResult = { id: chance.string() };
    mockDatabase.queryOne.mockResolvedValueOnce(null); // First call - no existing course
    mockDatabase.queryOne.mockResolvedValueOnce(mockResult); // Second call - insert result

    const result = await coursesSubmitService(userId, courseData);

    expect(result).toEqual(mockResult);
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO courses'),
      expect.arrayContaining([randomStateProvince.toUpperCase(), randomCountry]),
    );
  });

  it('should accept optional latitude field when provided', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const latitude = chance.latitude();
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      latitude,
    };

    const mockResult = { id: chance.string() };
    mockDatabase.queryOne.mockResolvedValueOnce(null); // First call - no existing course
    mockDatabase.queryOne.mockResolvedValueOnce(mockResult); // Second call - insert result

    const result = await coursesSubmitService(userId, courseData);

    expect(result).toEqual(mockResult);
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO courses'),
      expect.arrayContaining([latitude]),
    );
  });

  it('should accept optional longitude field when provided', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const longitude = chance.longitude();
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      longitude,
    };

    const mockResult = { id: chance.string() };
    mockDatabase.queryOne.mockResolvedValueOnce(null); // First call - no existing course
    mockDatabase.queryOne.mockResolvedValueOnce(mockResult); // Second call - insert result

    const result = await coursesSubmitService(userId, courseData);

    expect(result).toEqual(mockResult);
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO courses'),
      expect.arrayContaining([longitude]),
    );
  });

  it('should accept all optional fields together', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const latitude = chance.latitude();
    const longitude = chance.longitude();
    const postalCode = chance.zip();
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      latitude,
      longitude,
      postalCode,
    };

    const mockResult = { id: chance.string() };
    mockDatabase.queryOne.mockResolvedValueOnce(null); // First call - no existing course
    mockDatabase.queryOne.mockResolvedValueOnce(mockResult); // Second call - insert result

    const result = await coursesSubmitService(userId, courseData);

    expect(result).toEqual(mockResult);
    expect(mockDatabase.queryOne).toHaveBeenCalledTimes(2);
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO courses'),
      expect.arrayContaining([latitude, longitude, postalCode]),
    );
  });

  it('should throw ValidationError when latitude is greater than 90', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      latitude: 91, // Invalid - too high
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Latitude must be between -90 and 90');
  });

  it('should throw ValidationError when latitude is less than -90', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      latitude: -91, // Invalid - too low
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Latitude must be between -90 and 90');
  });

  it('should throw ValidationError when longitude is greater than 180', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      longitude: 181, // Invalid - too high
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Longitude must be between -180 and 180');
  });

  it('should throw ValidationError when longitude is less than -180', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
      longitude: -181, // Invalid - too low
    };

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('Longitude must be between -180 and 180');
  });

  it('should throw ValidationError when course already exists', async () => {
    const userId = chance.integer({ min: 1 });
    const validStates = ['CA', 'TX', 'NY', 'FL', 'WA', 'OR', 'CO', 'IL', 'PA', 'OH'];
    const validState = chance.pickone(validStates);
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: validState,
      country: 'US',
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    // Mock that a course with the same ID already exists
    const existingCourse = { id: 'existing-course' };
    mockDatabase.queryOne.mockResolvedValueOnce(existingCourse); // First call finds existing course

    await expect(coursesSubmitService(userId, courseData)).rejects.toThrow('A course with this name and location already exists');
  });
});
