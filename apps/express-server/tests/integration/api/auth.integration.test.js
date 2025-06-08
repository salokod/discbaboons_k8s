import {
  describe, test, expect, beforeEach,
} from '@jest/globals';
import request from 'supertest';
import express from 'express';
import Chance from 'chance';

// Import our routes
import authRoutes from '../../../routes/auth.routes.js';
import { mockPrisma } from '../../unit/setup.js';

const chance = new Chance();

// Create Express app for testing
const app = express();
app.use(express.json()); // Parse JSON bodies
app.use('/api/auth', authRoutes); // Mount auth routes

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    // Mock Prisma for integration tests
    mockPrisma.users.findUnique.mockResolvedValue(null);
    mockPrisma.users.create.mockResolvedValue({
      id: chance.integer({ min: 1, max: 1000 }),
      email: chance.email(),
      username: chance.word(),
      password_hash: chance.hash(),
      created_at: new Date().toISOString(),
    });
  });

  test('POST /api/auth/register should create a new user', async () => {
    const userData = {
      email: chance.email(),
      username: chance.word(),
      password: chance.string({ length: 10 }),
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Debug: Let's see what we actually got
    console.log('Status:', response.status);
    console.log('Body:', response.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('email', userData.email);
    expect(response.body.user).toHaveProperty('username', userData.username);
    expect(response.body.user).not.toHaveProperty('password_hash');
  });
});
