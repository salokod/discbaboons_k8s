import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { query, queryOne } from '../setup.js';

const chance = new Chance();

export const createCoursesSearchTestSetup = async () => {
  // Generate unique test identifier for this test run
  const timestamp = Date.now().toString().slice(-6);
  const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });
  const testId = `${timestamp}${random}`;
  const createdUserIds = [];
  const createdCourseIds = [];

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
  const token = login.body.tokens.accessToken;
  const { user } = login.body;
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
  const friendToken = friendLogin.body.tokens.accessToken;
  const friend = friendLogin.body.user;
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
  const otherUser = otherLogin.body.user;
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
      submitted_by_id: user.id,
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
      submitted_by_id: friend.id,
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
      submitted_by_id: otherUser.id,
    },
  ];

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

  return {
    testId,
    user,
    friend,
    otherUser,
    token,
    friendToken,
    createdUserIds,
    createdCourseIds,
  };
};

export const cleanupCoursesSearchTest = async (createdCourseIds, createdUserIds) => {
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
};

export const createTestCourse = async (testData, createdCourseIds) => {
  await queryOne(
    'INSERT INTO courses (id, name, city, state_province, country, hole_count, is_user_submitted, approved) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [
      testData.id,
      testData.name,
      testData.city,
      testData.state_province,
      testData.country,
      testData.hole_count,
      testData.is_user_submitted,
      testData.approved,
    ],
  );
  createdCourseIds.push(testData.id);
};
