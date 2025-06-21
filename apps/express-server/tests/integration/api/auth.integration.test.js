import {
  describe, test, expect, afterEach, vi,
} from 'vitest';
import request from 'supertest';
import express from 'express';
import Chance from 'chance';

// Import our routes
import authRoutes from '../../../routes/auth.routes.js';
import { prisma } from '../setup.js'; // adjust the path as needed

const chance = new Chance();

// Create Express app for testing
const app = express();
app.use(express.json()); // Parse JSON bodies
app.use('/api/auth', authRoutes); // Mount auth routes

describe('Auth Integration Tests', () => {
  afterEach(async () => {
    await prisma.users.deleteMany({
      where: {
        email: { contains: 'test-auth' },
      },
    });

    vi.restoreAllMocks();
  });

  // Remove afterAll cleanup, since mockPrisma is a mock and does not touch the real DB
  // No cleanup is needed for mocks

  test('POST /api/auth/register should create a new user', async () => {
    const userData = {
      email: `test-auth-oasiojfsioj-${chance.guid()}@example.com`, // <--- use a unique, catchable prefix
      username: chance.string({ length: 8, alpha: true }),
      password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,
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
