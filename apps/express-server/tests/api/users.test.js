// apps/express-server/tests/api/users.test.js
// User API integration tests - TDD approach, step by step

import {
  describe, test, expect, beforeEach,
} from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';
import { prisma } from '../setup.js';

describe('Users API - TDD Learning', () => {
  beforeEach(async () => {
    // Clean slate
    await prisma.user_profiles.deleteMany();
    await prisma.users.deleteMany();

    // Create one test user
    await prisma.users.create({
      data: {
        username: 'testbaboon',
        password_hash: 'test_hash_123',
        created_at: new Date(),
        last_password_change: new Date(),
      },
    });
  });
  // Step 1: Test that the route exists and responds
  describe('GET /api/users - Route Existence', () => {
    test('should respond to GET /api/users (route exists)', async () => {
      const response = await request(app)
        .get('/api/users');

      // We just want ANY response, not 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('📋 GET /api/users - Response Format', () => {
    test('should return JSON with success property', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('🗄️ GET /api/users - Database Data', () => {
    test('should return array of users from database', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1); // We created 1 test user
    });
  });

  describe('🔗 GET /api/users - Foreign Key Relationships', () => {
    beforeEach(async () => {
    // Clean up
      await prisma.user_profiles.deleteMany();
      await prisma.users.deleteMany();

      // Create user with profile (using your V4 foreign key!)
      const testUser = await prisma.users.create({
        data: {
          username: 'baboonwithprofile',
          password_hash: 'test_hash_123',
        },
      });

      // Create profile linked via foreign key
      await prisma.user_profiles.create({
        data: {
          user_id: testUser.id, // ← Your V4 foreign key!
          name: 'Alpha Test Baboon',
          email: 'alpha@discbaboons.com',
          location: 'Test Forest',
          bio: 'Testing the foreign key relationship',
        },
      });
    });

    test('should include user profiles via foreign key relationship', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);

      const user = response.body.data[0];
      expect(user.username).toBe('baboonwithprofile');

      // Test foreign key relationship
      expect(user).toHaveProperty('user_profiles');
      expect(user.user_profiles).toHaveProperty('name', 'Alpha Test Baboon');
      expect(user.user_profiles).toHaveProperty('email', 'alpha@discbaboons.com');
    });
  });
});
