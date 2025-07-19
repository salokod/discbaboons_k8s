import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import {
  createCoursesSearchTestSetup,
  cleanupCoursesSearchTest,
  createTestCourse,
} from '../helpers/courses.search.helper.js';

describe('GET /api/courses - Basic Functionality Integration', () => {
  let testSetup;

  beforeEach(async () => {
    testSetup = await createCoursesSearchTestSetup();
  });

  afterEach(async () => {
    await cleanupCoursesSearchTest(testSetup.createdCourseIds, testSetup.createdUserIds);
  });

  test('should require authentication', async () => {
    const res = await request(app)
      .get('/api/courses')
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'Access token required',
    });
  });

  test('should return courses from test data with pagination', async () => {
    const res = await request(app)
      .get('/api/courses')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      courses: expect.any(Array),
      total: expect.any(Number),
      limit: expect.any(Number),
      offset: expect.any(Number),
      hasMore: expect.any(Boolean),
    });

    expect(res.body.courses.length).toBeGreaterThan(0);
    expect(res.body.limit).toBe(50); // Default limit
    expect(res.body.total).toBeGreaterThan(0); // Should have our test courses

    // Check structure of first course
    const firstCourse = res.body.courses[0];
    expect(firstCourse).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      city: expect.any(String),
      state_province: expect.any(String),
      country: expect.any(String),
      hole_count: expect.any(Number),
      approved: true,
      is_user_submitted: false,
    });

    // Should be sorted by country, state_province, city, name
    const sortedByLocation = res.body.courses.every((course, index) => {
      if (index === 0) return true;
      const prev = res.body.courses[index - 1];
      return course.country >= prev.country
             || (course.country === prev.country && course.state_province >= prev.state_province);
    });
    expect(sortedByLocation).toBe(true);
  });

  test('should filter courses by state', async () => {
    // Use CA from our test data
    const targetState = 'CA';

    const res = await request(app)
      .get(`/api/courses?state=${encodeURIComponent(targetState)}`)
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should contain the state filter (case-insensitive partial match)
    res.body.courses.forEach((course) => {
      expect(course.state_province.toLowerCase()).toContain(targetState.toLowerCase());
    });
  });

  test('should filter courses by city', async () => {
    // Use Test City from our test data
    const targetCity = 'Test City';

    const res = await request(app)
      .get(`/api/courses?city=${encodeURIComponent(targetCity)}`)
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should contain the city filter (case-insensitive partial match)
    res.body.courses.forEach((course) => {
      expect(course.city.toLowerCase()).toContain(targetCity.toLowerCase());
    });
  });

  test('should filter courses by name (case-insensitive partial match)', async () => {
    // Search for "park" which should match our test course
    const res = await request(app)
      .get('/api/courses?name=park')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should contain "park" in the name (case-insensitive)
    res.body.courses.forEach((course) => {
      expect(course.name.toLowerCase()).toContain('park');
    });
  });

  test('should combine multiple filters', async () => {
    // Use known test data values
    const targetState = 'CA';
    const targetCity = 'Test City';

    const res = await request(app)
      .get(`/api/courses?state=${encodeURIComponent(targetState)}&city=${encodeURIComponent(targetCity)}`)
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // All returned courses should contain both filters (case-insensitive partial match)
    res.body.courses.forEach((course) => {
      expect(course.state_province.toLowerCase()).toContain(targetState.toLowerCase());
      expect(course.city.toLowerCase()).toContain(targetCity.toLowerCase());
    });
  });

  test('should support custom pagination parameters', async () => {
    const res = await request(app)
      .get('/api/courses?limit=10&offset=5')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      courses: expect.any(Array),
      total: expect.any(Number),
      limit: 10,
      offset: 5,
      hasMore: expect.any(Boolean),
    });

    expect(res.body.courses.length).toBeLessThanOrEqual(10);
  });

  test('should enforce maximum limit of 500', async () => {
    const res = await request(app)
      .get('/api/courses?limit=1000')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.limit).toBe(500);
  });

  test('should return empty courses array for non-existent state', async () => {
    const res = await request(app)
      .get('/api/courses?state=NonExistentState')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBe(0);
    expect(res.body.total).toBe(0);
  });

  test('should handle special characters in query params', async () => {
    // Test with URL-encoded special characters
    const res = await request(app)
      .get('/api/courses?name=St.%20Mary%27s')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    // Should not crash and return valid response
  });

  // Case-insensitive search tests (combined into fewer tests)
  test('should perform case-insensitive search across all text fields', async () => {
    // Create test courses with mixed case patterns
    const testCourses = [
      {
        id: `case-test-city-${testSetup.testId}`,
        name: 'Case Test Course',
        city: 'east moline', // lowercase
        state_province: 'IL',
        country: 'US',
        hole_count: 18,
        is_user_submitted: false,
        approved: true,
      },
      {
        id: `case-test-state-${testSetup.testId}`,
        name: 'State Test Course',
        city: 'Chicago',
        state_province: 'Illinois', // full name
        country: 'US',
        hole_count: 18,
        is_user_submitted: false,
        approved: true,
      },
      {
        id: `case-test-country-${testSetup.testId}`,
        name: 'Country Test Course',
        city: 'Toronto',
        state_province: 'ON',
        country: 'CA', // uppercase
        hole_count: 18,
        is_user_submitted: false,
        approved: true,
      },
      {
        id: `case-test-name-${testSetup.testId}`,
        name: 'Heritage Park Disc Golf Course', // mixed case
        city: 'Sample City',
        state_province: 'CA',
        country: 'US',
        hole_count: 18,
        is_user_submitted: false,
        approved: true,
      },
    ];

    // Create all test courses
    await Promise.all(
      testCourses.map((course) => createTestCourse(course, testSetup.createdCourseIds)),
    );

    // Test city case-insensitive search
    const cityRes = await request(app)
      .get('/api/courses?city=East Moline')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    const foundCityCase = cityRes.body.courses.find((course) => course.id === testCourses[0].id);
    expect(foundCityCase).toBeDefined();
    expect(foundCityCase.city).toBe('east moline');

    // Test state case-insensitive search with city filter for specificity
    const stateRes = await request(app)
      .get('/api/courses?stateProvince=illinois&city=Chicago')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    const foundStateCase = stateRes.body.courses.find((course) => course.id === testCourses[1].id);
    expect(foundStateCase).toBeDefined();
    expect(foundStateCase.state_province).toBe('Illinois');

    // Test country case-insensitive search
    const countryRes = await request(app)
      .get('/api/courses?country=ca')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    const foundCountryCase = countryRes.body.courses.find(
      (course) => course.id === testCourses[2].id,
    );
    expect(foundCountryCase).toBeDefined();
    expect(foundCountryCase.country).toBe('CA');

    // Test name case-insensitive search
    const nameRes = await request(app)
      .get('/api/courses?name=HERITAGE')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    const foundNameCase = nameRes.body.courses.find((course) => course.id === testCourses[3].id);
    expect(foundNameCase).toBeDefined();
    expect(foundNameCase.name).toBe('Heritage Park Disc Golf Course');
  });

  test('should combine case-insensitive filters across multiple fields', async () => {
    // Create a course with various case patterns
    const combinedTestCourse = {
      id: `combined-test-${testSetup.testId}`,
      name: 'riverside park disc golf',
      city: 'east moline',
      state_province: 'il',
      country: 'us',
      hole_count: 18,
      is_user_submitted: false,
      approved: true,
    };

    await createTestCourse(combinedTestCourse, testSetup.createdCourseIds);

    // Search with different cases for all filters
    const res = await request(app)
      .get('/api/courses?city=East Moline&stateProvince=IL&country=US&name=RIVERSIDE')
      .set('Authorization', `Bearer ${testSetup.token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // Should find the course despite all case differences
    const foundCourse = res.body.courses.find((course) => course.id === combinedTestCourse.id);
    expect(foundCourse).toBeDefined();
    expect(foundCourse.name).toBe('riverside park disc golf');
    expect(foundCourse.city).toBe('east moline');
    expect(foundCourse.state_province).toBe('il');
    expect(foundCourse.country).toBe('us');
  });
});
