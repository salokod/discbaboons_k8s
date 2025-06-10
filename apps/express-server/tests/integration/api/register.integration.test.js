import {
  describe, test, expect, beforeEach, afterAll,
} from '@jest/globals';
import request from 'supertest';
import { Chance } from 'chance';
import app from '../../../server.js';
import { prisma } from '../setup.js';

const chance = new Chance();

describe('POST /api/auth/register - Integration Test', () => {
  // Clean up test users after each test
  beforeEach(async () => {
    // Remove any test users that might exist
    await prisma.users.deleteMany({
      where: {
        email: {
          contains: 'test-register',
        },
      },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.users.deleteMany({
      where: {
        email: {
          contains: 'test-register',
        },
      },
    });
  });

  test('should successfully register a new user', async () => {
    // Arrange: Define new user data using Chance
    const newUser = {
      username: chance.string({ length: 8, alpha: true, numeric: true }),
      email: `test-register-${chance.guid()}@example.com`,
      password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,
    };

    // Act: Make POST request to register endpoint
    const response = await request(app)
      .post('/api/auth/register')
      .send(newUser)
      .expect(201);

    // Assert: Check response structure
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', newUser.username);
    expect(response.body.user).toHaveProperty('email', newUser.email);
    expect(response.body.user).toHaveProperty('id');

    // Security: Should NOT return password
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('password_hash');

    // Verify user was actually created in database
    const userInDb = await prisma.users.findUnique({
      where: { email: newUser.email },
    });

    expect(userInDb).toBeTruthy();
    expect(userInDb.username).toBe(newUser.username);
    expect(userInDb.email).toBe(newUser.email);
    expect(userInDb.password_hash).toBeTruthy(); // Should have hashed password
    expect(userInDb.password_hash).not.toBe(newUser.password); // Should be hashed
  });

  test('should fail when email already exists', async () => {
    // Arrange: Create a user first using Chance
    const sharedEmail = `test-register-duplicate-${chance.guid()}@example.com`;

    const existingUser = {
      username: chance.string({ length: 8, alpha: true, numeric: true }),
      email: sharedEmail,
      password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,

    };

    // Create the first user
    await request(app)
      .post('/api/auth/register')
      .send(existingUser)
      .expect(201);

    // Try to create another user with same email
    const duplicateUser = {
      username: chance.string({ length: 8, alpha: true, numeric: true }),
      email: sharedEmail,
      password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,

    };

    // Act & Assert
    const response = await request(app)
      .post('/api/auth/register')
      .send(duplicateUser)
      .expect(409);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('already registered');
  });

  test('should fail when required fields are missing', async () => {
    const incompleteUser = {
      username: chance.string({ length: 8, alpha: true, numeric: true }),
      // Missing email and password intentionally
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(incompleteUser)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  test('should fail when username already exists', async () => {
    // Arrange: Create a user first using Chance
    const sharedUsername = chance.string({ length: 10, alpha: true, numeric: true });

    const existingUser = {
      username: sharedUsername,
      email: `test-register-first-${chance.guid()}@example.com`,
      password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,

    };

    // Create the first user
    await request(app)
      .post('/api/auth/register')
      .send(existingUser)
      .expect(201);

    // Try to create another user with same username
    const duplicateUser = {
      username: sharedUsername, // Same username!
      email: `test-register-second-${chance.guid()}@example.com`,
      password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,

    };

    // Act & Assert
    const response = await request(app)
      .post('/api/auth/register')
      .send(duplicateUser)
      .expect(409);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('already registered');
  });
});
