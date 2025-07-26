import 'dotenv/config';
import {
  describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import { query } from '../setup.js';
import {
  createUniqueUserData,
  createTestUser,
  cleanupUsers,
} from '../test-helpers.js';

describe('Auth Integration Tests', () => {
  let createdUserIds = [];

  beforeEach(async () => {
    // Reset arrays for parallel test safety
    createdUserIds = [];
  });

  afterEach(async () => {
    // Clean up created users
    await cleanupUsers(createdUserIds);
  });

  // GOOD: Integration concern - user registration persistence to database
  test('POST /api/auth/register should create user and persist to database', async () => {
    const userData = createUniqueUserData('authtest');

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      user: {
        email: userData.email,
        username: userData.username,
      },
    });
    expect(response.body.user).not.toHaveProperty('password_hash');

    // Track for cleanup
    createdUserIds.push(response.body.user.id);

    // Integration: Verify user was actually saved to database
    const savedUser = await query('SELECT * FROM users WHERE id = $1', [response.body.user.id]);
    expect(savedUser.rows).toHaveLength(1);
    expect(savedUser.rows[0]).toMatchObject({
      email: userData.email,
      username: userData.username,
    });
  });

  // GOOD: Integration concern - user login authentication flow
  test('POST /api/auth/login should authenticate existing user from database', async () => {
    // Register user via API to get proper authentication
    const userData = createUniqueUserData('logintest');

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    createdUserIds.push(registerResponse.body.user.id);

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      user: {
        id: registerResponse.body.user.id,
        email: userData.email,
        username: userData.username,
      },
      tokens: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      },
    });
  });

  // GOOD: Integration concern - login with non-existent user
  test('POST /api/auth/login should return 401 for non-existent user', async () => {
    const fakeUserData = createUniqueUserData('fakeuser');

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: fakeUserData.username,
        password: fakeUserData.password,
      });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid username or password',
    });
  });

  // GOOD: Integration concern - duplicate user registration prevention
  test('POST /api/auth/register should prevent duplicate email registration', async () => {
    // Create user first
    const testUser = await createTestUser({ prefix: 'duptest' });
    createdUserIds.push(testUser.user.id);

    // Try to register with same email
    const duplicateData = createUniqueUserData('dup');
    duplicateData.email = testUser.userData.email; // Use existing email

    const response = await request(app)
      .post('/api/auth/register')
      .send(duplicateData);

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Email or username already registered',
    });
  });

  // GOOD: Integration concern - token refresh flow
  test('POST /api/auth/refresh should generate new access token', async () => {
    // Register user via API to get proper authentication
    const userData = createUniqueUserData('refreshtest');

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    createdUserIds.push(registerResponse.body.user.id);

    // First login to get refresh token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password,
      })
      .expect(200);

    const { refreshToken } = loginResponse.body.tokens;

    // Use refresh token to get new access token
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toMatchObject({
      success: true,
      accessToken: expect.any(String),
    });
  });

  // Note: We do NOT test these validation scenarios in integration tests:
  // - Missing email/username/password fields (unit test concern)
  // - Invalid email format (unit test concern)
  // - Password strength requirements (unit test concern)
  // - Username length constraints (unit test concern)
  // These are all tested at the service unit test level
});
