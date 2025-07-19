import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

describe('GET /api/courses - Integration', () => {
  let user;
  let friend;
  let otherUser;
  let token;
  let friendToken;
  let testId;
  let createdUserIds = [];
  let createdCourseIds = [];

  beforeEach(async () => {
    // Generate unique test identifier for this test run
    const timestamp = Date.now().toString().slice(-6);
    const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
    testId = `${timestamp}${random}`;
    createdUserIds = [];
    createdCourseIds = [];

    // Register test user
    const userData = {
      username: `tcs${testId}`, // tcs = "test course search"
      email: `tcs${testId}@ex.co`,
      password: `Test1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(userData).expect(201);
    const login = await request(app).post('/api/auth/login').send({
      username: userData.username,
      password: userData.password,
    }).expect(200);
    token = login.body.tokens.accessToken;
    user = login.body.user;
    createdUserIds.push(user.id);

    // Register friend user for unapproved course visibility tests
    const friendData = {
      username: `friend${testId}`,
      email: `friend${testId}@ex.co`,
      password: `Friend1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(friendData).expect(201);
    const friendLogin = await request(app).post('/api/auth/login').send({
      username: friendData.username,
      password: friendData.password,
    }).expect(200);
    friendToken = friendLogin.body.tokens.accessToken;
    friend = friendLogin.body.user;
    createdUserIds.push(friend.id);

    // Register other user (not a friend)
    const otherUserData = {
      username: `other${testId}`,
      email: `other${testId}@ex.co`,
      password: `Other1!${chance.word({ length: 2 })}`,
    };
    await request(app).post('/api/auth/register').send(otherUserData).expect(201);
    const otherLogin = await request(app).post('/api/auth/login').send({
      username: otherUserData.username,
      password: otherUserData.password,
    }).expect(200);
    otherUser = otherLogin.body.user;
    createdUserIds.push(otherUser.id);

    // Create friendship between user and friend
    await query(
      `INSERT INTO friendship_requests (requester_id, recipient_id, status)
       VALUES ($1, $2, 'accepted')`,
      [user.id, friend.id],
    );

    // Create test course data for integration tests
    const testCourses = [
      {
        id: `test-course-${testId}-1`,
        name: 'Test Park Disc Golf Course',
        city: 'Test City',
        state_province: 'CA',
        country: 'US',
        postal_code: '12345',
        hole_count: 18,
        latitude: 37.7749,
        longitude: -122.4194,
        is_user_submitted: false,
        approved: true,
      },
      {
        id: `test-course-${testId}-2`,
        name: 'Another Test Course',
        city: 'Test City',
        state_province: 'CA',
        country: 'US',
        postal_code: '12346',
        hole_count: 9,
        is_user_submitted: false,
        approved: true,
      },
      {
        id: `test-course-${testId}-3`,
        name: 'Heritage Park Course',
        city: 'Different City',
        state_province: 'TX',
        country: 'US',
        postal_code: '54321',
        hole_count: 18,
        is_user_submitted: false,
        approved: true,
      },
      // Unapproved course visibility test data
      {
        id: `user-unapproved-${testId}`,
        name: 'User Unapproved Course',
        city: 'Unique Test City',
        state_province: 'CA',
        country: 'US',
        hole_count: 9,
        is_user_submitted: true,
        approved: false,
        submitted_by_id: null, // Will be set after user creation
      },
      {
        id: `friend-unapproved-${testId}`,
        name: 'Friend Unapproved Course',
        city: 'Unique Test City',
        state_province: 'TX',
        country: 'US',
        hole_count: 12,
        is_user_submitted: true,
        approved: false,
        submitted_by_id: null, // Will be set after friend creation
      },
      {
        id: `other-unapproved-${testId}`,
        name: 'Other User Course',
        city: 'Unique Test City',
        state_province: 'FL',
        country: 'US',
        hole_count: 15,
        is_user_submitted: true,
        approved: false,
        submitted_by_id: null, // Will be set after other user creation
      },
    ];

    // Set submitted_by_id for unapproved courses
    testCourses[3].submitted_by_id = user.id;
    testCourses[4].submitted_by_id = friend.id;
    testCourses[5].submitted_by_id = otherUser.id;

    // Create test courses using Promise.all to avoid ESLint loop issues
    const coursePromises = testCourses.map(async (course) => {
      const courseParams = [
        course.id,
        course.name,
        course.city,
        course.state_province,
        course.country,
        course.postal_code,
        course.hole_count,
        course.latitude,
        course.longitude,
        course.is_user_submitted,
        course.approved,
        course.submitted_by_id,
      ];
      await queryOne(
        'INSERT INTO courses (id, name, city, state_province, country, postal_code, hole_count, latitude, longitude, is_user_submitted, approved, submitted_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        courseParams,
      );
      createdCourseIds.push(course.id);
    });
    await Promise.all(coursePromises);
  });

  afterEach(async () => {
    // Clean up test courses first
    if (createdCourseIds.length > 0) {
      await query('DELETE FROM courses WHERE id = ANY($1)', [createdCourseIds]);
    }

    // Clean up friendships
    if (createdUserIds.length > 0) {
      await query('DELETE FROM friendship_requests WHERE requester_id = ANY($1) OR recipient_id = ANY($1)', [createdUserIds]);
    }

    // Clean up test users
    if (createdUserIds.length > 0) {
      await query('DELETE FROM users WHERE id = ANY($1)', [createdUserIds]);
    }
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
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.limit).toBe(500);
  });

  test('should return empty courses array for non-existent state', async () => {
    const res = await request(app)
      .get('/api/courses?state=NonExistentState')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBe(0);
    expect(res.body.total).toBe(0);
  });

  test('should return approved courses plus user own and friend unapproved courses', async () => {
    // Filter by our unique test city to isolate test data
    const res = await request(app)
      .get('/api/courses?city=Unique Test City')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses).toHaveLength(2); // user's own + friend's unapproved

    // Should include user's own unapproved course and friend's unapproved course
    const courseIds = res.body.courses.map((course) => course.id);
    expect(courseIds).toContain(`user-unapproved-${testId}`);
    expect(courseIds).toContain(`friend-unapproved-${testId}`);
    expect(courseIds).not.toContain(`other-unapproved-${testId}`);

    // Check that unapproved courses are included
    const userUnapprovedCourse = res.body.courses.find((c) => c.id === `user-unapproved-${testId}`);
    expect(userUnapprovedCourse.approved).toBe(false);
    expect(userUnapprovedCourse.submitted_by_id).toBe(user.id);

    const friendUnapprovedCourse = res.body.courses.find((c) => c.id === `friend-unapproved-${testId}`);
    expect(friendUnapprovedCourse.approved).toBe(false);
    expect(friendUnapprovedCourse.submitted_by_id).toBe(friend.id);
  });

  test('should handle special characters in query params', async () => {
    // Test with URL-encoded special characters
    const res = await request(app)
      .get('/api/courses?name=St.%20Mary%27s')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    // Should not crash and return valid response
  });

  // Unapproved Course Visibility Tests
  test('should filter by name and include unapproved courses', async () => {
    const res = await request(app)
      .get('/api/courses?name=Friend Unapproved Course')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(1);
    expect(res.body.courses[0].id).toBe(`friend-unapproved-${testId}`);
    expect(res.body.courses[0].approved).toBe(false);
  });

  test('should not return other user unapproved courses when no friendship', async () => {
    const res = await request(app)
      .get('/api/courses?name=Other User Course')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(0);
  });

  test('should return different results for friend user', async () => {
    // Test from friend's perspective
    const res = await request(app)
      .get('/api/courses?city=Unique Test City')
      .set('Authorization', `Bearer ${friendToken}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(2); // friend's own + user's unapproved

    const courseIds = res.body.courses.map((course) => course.id);
    expect(courseIds).toContain(`user-unapproved-${testId}`); // friend can see user's
    expect(courseIds).toContain(`friend-unapproved-${testId}`); // friend's own
    expect(courseIds).not.toContain(`other-unapproved-${testId}`); // not friend with other
  });

  test('should respect pagination with unapproved courses', async () => {
    const res = await request(app)
      .get('/api/courses?city=Unique Test City&limit=1&offset=0')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(0);
  });

  test('should combine filters with unapproved course visibility', async () => {
    const res = await request(app)
      .get('/api/courses?city=Unique Test City&stateProvince=TX')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toHaveLength(1);
    expect(res.body.courses[0].id).toBe(`friend-unapproved-${testId}`);
    expect(res.body.courses[0].state_province).toBe('TX');
    expect(res.body.courses[0].approved).toBe(false);
  });

  // Case-insensitive search tests
  test('should perform case-insensitive city search', async () => {
    // Create a course with lowercase city
    const caseTestCourse = {
      id: `case-test-${testId}`,
      name: 'Case Test Course',
      city: 'east moline', // lowercase
      state_province: 'IL',
      country: 'US',
      hole_count: 18,
      is_user_submitted: false,
      approved: true,
    };

    await queryOne(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        caseTestCourse.id,
        caseTestCourse.name,
        caseTestCourse.city,
        caseTestCourse.state_province,
        caseTestCourse.country,
        caseTestCourse.hole_count,
        caseTestCourse.is_user_submitted,
        caseTestCourse.approved,
      ],
    );
    createdCourseIds.push(caseTestCourse.id);

    // Search with different case
    const res = await request(app)
      .get('/api/courses?city=East Moline')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // Should find the course despite case difference
    const foundCourse = res.body.courses.find((course) => course.id === caseTestCourse.id);
    expect(foundCourse).toBeDefined();
    expect(foundCourse.city).toBe('east moline');
  });

  test('should perform case-insensitive state search', async () => {
    // Create a course with mixed case state
    const stateTestCourse = {
      id: `state-test-${testId}`,
      name: 'State Test Course',
      city: 'Chicago',
      state_province: 'Illinois', // full name
      country: 'US',
      hole_count: 18,
      is_user_submitted: false,
      approved: true,
    };

    await queryOne(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        stateTestCourse.id,
        stateTestCourse.name,
        stateTestCourse.city,
        stateTestCourse.state_province,
        stateTestCourse.country,
        stateTestCourse.hole_count,
        stateTestCourse.is_user_submitted,
        stateTestCourse.approved,
      ],
    );
    createdCourseIds.push(stateTestCourse.id);

    // Search with partial state name in different case
    const res = await request(app)
      .get('/api/courses?stateProvince=ILLI')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // Should find the course despite case difference
    const foundCourse = res.body.courses.find((course) => course.id === stateTestCourse.id);
    expect(foundCourse).toBeDefined();
    expect(foundCourse.state_province).toBe('Illinois');
  });

  test('should perform case-insensitive country search', async () => {
    // Create a course with uppercase country
    const countryTestCourse = {
      id: `country-test-${testId}`,
      name: 'Country Test Course',
      city: 'Toronto',
      state_province: 'ON',
      country: 'CA', // uppercase
      hole_count: 18,
      is_user_submitted: false,
      approved: true,
    };

    await queryOne(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        countryTestCourse.id,
        countryTestCourse.name,
        countryTestCourse.city,
        countryTestCourse.state_province,
        countryTestCourse.country,
        countryTestCourse.hole_count,
        countryTestCourse.is_user_submitted,
        countryTestCourse.approved,
      ],
    );
    createdCourseIds.push(countryTestCourse.id);

    // Search with lowercase country
    const res = await request(app)
      .get('/api/courses?country=ca')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // Should find the course despite case difference
    const foundCourse = res.body.courses.find((course) => course.id === countryTestCourse.id);
    expect(foundCourse).toBeDefined();
    expect(foundCourse.country).toBe('CA');
  });

  test('should perform case-insensitive name search', async () => {
    // Create a course with mixed case name
    const nameTestCourse = {
      id: `name-test-${testId}`,
      name: 'Heritage Park Disc Golf Course', // mixed case
      city: 'Sample City',
      state_province: 'CA',
      country: 'US',
      hole_count: 18,
      is_user_submitted: false,
      approved: true,
    };

    await queryOne(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        nameTestCourse.id,
        nameTestCourse.name,
        nameTestCourse.city,
        nameTestCourse.state_province,
        nameTestCourse.country,
        nameTestCourse.hole_count,
        nameTestCourse.is_user_submitted,
        nameTestCourse.approved,
      ],
    );
    createdCourseIds.push(nameTestCourse.id);

    // Search with all uppercase partial name
    const res = await request(app)
      .get('/api/courses?name=HERITAGE')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);

    // Should find the course despite case difference
    const foundCourse = res.body.courses.find((course) => course.id === nameTestCourse.id);
    expect(foundCourse).toBeDefined();
    expect(foundCourse.name).toBe('Heritage Park Disc Golf Course');
  });

  test('should combine case-insensitive filters', async () => {
    // Create a course with various case patterns
    const combinedTestCourse = {
      id: `combined-test-${testId}`,
      name: 'riverside park disc golf',
      city: 'east moline',
      state_province: 'il',
      country: 'us',
      hole_count: 18,
      is_user_submitted: false,
      approved: true,
    };

    await queryOne(
      'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        combinedTestCourse.id,
        combinedTestCourse.name,
        combinedTestCourse.city,
        combinedTestCourse.state_province,
        combinedTestCourse.country,
        combinedTestCourse.hole_count,
        combinedTestCourse.is_user_submitted,
        combinedTestCourse.approved,
      ],
    );
    createdCourseIds.push(combinedTestCourse.id);

    // Search with different cases for all filters
    const res = await request(app)
      .get('/api/courses?city=East Moline&stateProvince=IL&country=US&name=RIVERSIDE')
      .set('Authorization', `Bearer ${token}`)
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
