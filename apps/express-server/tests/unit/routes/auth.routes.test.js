import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import request from 'supertest';
import express from 'express';
import Chance from 'chance';

const chance = new Chance();

// Dynamic import inside describe block
describe('Auth Routes', () => {
  let app;
  let authRoutes;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import routes dynamically
    const authRoutesModule = await import('../../../routes/auth.routes.js');
    authRoutes = authRoutesModule.default;

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  test('POST /api/auth/register should exist', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: chance.email(),
        username: chance.name(),
        password: chance.string(),
      });

    expect(response.status).not.toBe(404);
  });

  test('POST /api/auth/login should exist', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: chance.name(),
        password: chance.string(),
      });

    expect(response.status).not.toBe(404);
  });

  test('POST /api/auth/forgot-username should exist', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-username')
      .send({ email: chance.email() });

    expect(response.status).not.toBe(404);
  });

  test('POST /api/auth/forgot-password should exist', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    // Should not be 404 (route exists)
    expect(response.status).not.toBe(404);
  });
});
