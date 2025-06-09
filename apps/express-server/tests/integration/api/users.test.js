import {
  describe, test, expect, afterEach,
} from '@jest/globals';
import request from 'supertest';
import app from '../../../server.js';
import { prisma } from '../setup.js';

describe('Users API - Integration Tests (Real Database)', () => {
  // Track test users for cleanup
  const testUsers = [];
  const TEST_PREFIX = 'test_integration_';

  // Helper to create test user with tracking
  const createTestUser = async (userData) => {
    const user = await prisma.users.create({
      data: {
        ...userData,
        username: `${TEST_PREFIX}${userData.username}`,
      },
    });
    testUsers.push(user.id);
    return user;
  };

  afterEach(async () => {
    // Clean up only test users created in this run
    if (testUsers.length > 0) {
      await prisma.user_profiles.deleteMany({
        where: {
          user_id: {
            in: testUsers,
          },
        },
      });

      await prisma.users.deleteMany({
        where: {
          id: {
            in: testUsers,
          },
        },
      });

      // Clear the tracking array
      testUsers.length = 0;
    }
  });

  describe('GET /api/users - Database Integration', () => {
    test('should fetch real users from PostgreSQL database', async () => {
      // Arrange: Create real data in database
      const testUser = await createTestUser({
        username: 'integrationbaboon',
        password_hash: 'hashed_password_123',
        email: 'integration@discbaboons.com',

      });

      await prisma.user_profiles.create({
        data: {
          user_id: testUser.id,
          name: 'Integration Test Baboon',
          location: 'Database Land',
          bio: 'Living in the real database',
        },
      });

      // Act: Make real API call
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert: Verify real database data (should include our test user)
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      const testUserResponse = response.body.data.find(
        (u) => u.username === `${TEST_PREFIX}integrationbaboon`,
      );

      expect(testUserResponse).toBeTruthy();
      expect(testUserResponse.user_profiles.name).toBe('Integration Test Baboon');

      // Security: Verify password is not included
      expect(testUserResponse).not.toHaveProperty('password_hash');
    });

    test('should handle foreign key relationships correctly', async () => {
      // Arrange: Create user without profile
      await createTestUser({
        username: 'noprofilebaboon',
        password_hash: 'hashed_password_456',
      });

      // Create user with profile
      const userWithProfile = await createTestUser({
        username: 'withprofilebaboon',
        password_hash: 'hashed_password_789',
        email: 'profile@discbaboons.com',

      });

      await prisma.user_profiles.create({
        data: {
          user_id: userWithProfile.id,
          name: 'Profile Baboon',
        },
      });

      // Act
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert: Filter to only our test users
      const testUsersInResponse = response.body.data.filter(
        (u) => u.username.startsWith(TEST_PREFIX),
      );

      expect(testUsersInResponse).toHaveLength(2);

      const withProfile = testUsersInResponse.find(
        (u) => u.username === `${TEST_PREFIX}withprofilebaboon`,
      );
      const withoutProfile = testUsersInResponse.find(
        (u) => u.username === `${TEST_PREFIX}noprofilebaboon`,
      );

      expect(withProfile.user_profiles).toBeTruthy();
      expect(withProfile.user_profiles.name).toBe('Profile Baboon');

      expect(withoutProfile.user_profiles).toBeNull();
    });

    test('should return users ordered by created_at descending', async () => {
      // Arrange: Create users with different timestamps
      await createTestUser({
        username: 'firstbaboon',
        password_hash: 'hash1',
        email: 'profile@2discbaboons.com',
        created_at: new Date('2024-01-01'),
      });

      await createTestUser({
        username: 'secondbaboon',
        email: 'profile@discbaboons.com',
        password_hash: 'hash2',
        created_at: new Date('2024-01-02'),
      });

      // Act
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert: Filter to our test users and verify order
      const testUsersInResponse = response.body.data
        .filter((u) => u.username.startsWith(TEST_PREFIX))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      expect(testUsersInResponse).toHaveLength(2);
      expect(testUsersInResponse[0].username).toBe(`${TEST_PREFIX}secondbaboon`);
      expect(testUsersInResponse[1].username).toBe(`${TEST_PREFIX}firstbaboon`);
    });
  });
});
