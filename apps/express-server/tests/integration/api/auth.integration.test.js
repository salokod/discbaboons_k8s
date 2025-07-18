import {
  describe, test, expect, afterEach, vi,
} from 'vitest';
import request from 'supertest';
import express from 'express';
import Chance from 'chance';

// Import our routes
import authRoutes from '../../../routes/auth.routes.js';
import { query } from '../setup.js';

const chance = new Chance();

// Create Express app for testing
const app = express();
app.use(express.json()); // Parse JSON bodies
app.use('/api/auth', authRoutes); // Mount auth routes

describe('Auth Integration Tests', () => {
  afterEach(async () => {
    await query('DELETE FROM users WHERE email LIKE $1', ['%test-auth%']);

    vi.restoreAllMocks();
  });

  // No cleanup needed for integration tests as they use real database
  // No cleanup is needed for mocks

  test('POST /api/auth/register should create a new user', async () => {
    const lowercase = chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' });
    const uppercase = chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' });
    const number = chance.integer({ min: 0, max: 9 });
    const special = chance.pick(['!', '@', '#', '$', '%', '^', '&', '*']);

    const userData = {
      email: `test-auth-oasiojfsioj-${chance.guid()}@example.com`, // <--- use a unique, catchable prefix
      username: chance.string({ length: 8, alpha: true }),
      password: `${lowercase}${uppercase}${number}${special}`,
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('email', userData.email);
    expect(response.body.user).toHaveProperty('username', userData.username);
    expect(response.body.user).not.toHaveProperty('password_hash');
  });
});
