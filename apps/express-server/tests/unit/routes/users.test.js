import {
  describe, test, expect, beforeEach, jest,
} from '@jest/globals';
import request from 'supertest';
import Chance from 'chance';
import app from '../../../server.js';
import { mockPrisma } from '../setup.js';

const chance = new Chance();

describe('Users API - Unit Tests (Mocked Database)', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/users - Business Logic', () => {
    test('should return users with correct data structure when database has data', async () => {
      // Arrange: Mock successful database response with random data
      const mockUsers = [
        {
          id: chance.integer({ min: 1, max: 1000 }),
          username: chance.animal(),
          created_at: chance.date({ year: 2024 }).toISOString(),
          user_profiles: {
            name: chance.name(),
            email: chance.email(),
            location: chance.city(),
            bio: chance.sentence({ words: 5 }),
          },
        },
        {
          id: chance.integer({ min: 1, max: 1000 }),
          username: chance.animal(),
          created_at: chance.date({ year: 2024 }).toISOString(),
          user_profiles: {
            name: chance.name(),
            email: chance.email(),
            location: chance.city(),
            bio: chance.sentence({ words: 6 }),
          },
        },
      ];

      mockPrisma.users.findMany.mockResolvedValue(mockUsers);

      // Act: Make request
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert: Verify response structure
      expect(response.body).toEqual({
        success: true,
        data: mockUsers,
      });

      // Verify database was called correctly
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          username: true,
          created_at: true,
          user_profiles: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    });

    test('should return empty array when no users exist', async () => {
      // Arrange: Mock empty database
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    test('should handle database errors gracefully', async () => {
      // Arrange: Mock database error
      mockPrisma.users.findMany.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await request(app)
        .get('/api/users')
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        success: false,
        error: 'Failed to fetch users',
      });
    });

    test('should exclude password_hash from response for security', async () => {
      // Arrange: Generate random user data
      const mockUsers = [
        {
          id: chance.integer({ min: 1, max: 1000 }),
          username: chance.animal(),
          created_at: chance.date({ year: 2024 }).toISOString(),
          user_profiles: null,
        },
      ];

      mockPrisma.users.findMany.mockResolvedValue(mockUsers);

      // Act
      await request(app)
        .get('/api/users')
        .expect(200);

      // Assert: Verify password_hash is not in select
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          username: true,
          created_at: true,
          user_profiles: true,
        }),
        orderBy: expect.any(Object),
      });

      // Verify password_hash is NOT selected
      const selectCall = mockPrisma.users.findMany.mock.calls[0][0].select;
      expect(selectCall).not.toHaveProperty('password_hash');
    });

    test('should order users by created_at descending', async () => {
      // Arrange
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await request(app).get('/api/users');

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            created_at: 'desc',
          },
        }),
      );
    });
  });
});
