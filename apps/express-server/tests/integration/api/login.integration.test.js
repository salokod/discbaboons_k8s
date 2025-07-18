import {
  describe, test, expect, beforeEach, afterAll,
} from 'vitest';
import request from 'supertest';
import { Chance } from 'chance';
import app from '../../../server.js';
import { query } from '../setup.js';

const chance = new Chance();

describe('POST /api/auth/login - Integration Test', () => {
  // Clean up test users after each test
  beforeEach(async () => {
    // Remove any test users that might exist
    await query('DELETE FROM users WHERE email LIKE $1', ['%test-login%']);

    // Set environment variables for JWT
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-integration-tests';
  });

  afterAll(async () => {
    // Final cleanup
    await query('DELETE FROM users WHERE email LIKE $1', ['%test-login%']);

    vi.restoreAllMocks();
  });

  test('should successfully login with valid credentials', async () => {
    // Arrange: Create a user first
    const password = `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`;

    const userData = {
      username: chance.string({ length: 8, alpha: true, numeric: true }),
      email: `test-login-${chance.guid()}@example.com`,
      password,
    };

    // Create user via register endpoint
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(registerResponse.status).toBe(201);

    // Act: Login with the same credentials
    const loginData = {
      username: userData.username,
      password: userData.password,
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(response.status).toBe(200);

    // Assert: Check response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', userData.username);
    expect(response.body.user).toHaveProperty('email', userData.email);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('created_at');

    // Check tokens
    expect(response.body).toHaveProperty('tokens');
    expect(response.body.tokens).toHaveProperty('accessToken');
    expect(response.body.tokens).toHaveProperty('refreshToken');
    expect(typeof response.body.tokens.accessToken).toBe('string');
    expect(typeof response.body.tokens.refreshToken).toBe('string');

    // Security: Should NOT return password
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('password_hash');
  });

  test('should fail with invalid username', async () => {
    const loginData = {
      username: 'nonexistentuser',
      password: 'somepassword123!',
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Invalid username or password');
  });

  test('should fail with invalid password', async () => {
    // Arrange: Create a user first
    const password = `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`;

    const userData = {
      username: chance.string({ length: 8, alpha: true, numeric: true }),
      email: `test-login-${chance.guid()}@example.com`,
      password,
    };

    // Create user via register endpoint
    await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Act: Login with wrong password
    const loginData = {
      username: userData.username,
      password: 'wrongpassword123!',
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', 'Invalid username or password');
  });

  test('should fail when required fields are missing', async () => {
    const incompleteLogin = {
      username: chance.string({ length: 8, alpha: true, numeric: true }),
      // Missing password intentionally
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(incompleteLogin)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  test('should fail with empty request body', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });
});
