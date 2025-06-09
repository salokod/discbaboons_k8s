import {
  describe, test, expect, jest,
} from '@jest/globals';
import Chance from 'chance';
import registerUser from '../../../services/auth.service.js';
import { mockPrisma } from '../setup.js';

const chance = new Chance();

describe('AuthService', () => {
  const createTestRegisterData = (overrides = {}) => ({
    email: chance.email(),
    password: chance.string({ length: 10 }),
    username: chance.word(),
    ...overrides, // Allow overriding specific fields
  });

  beforeEach(() => {
    // Clear mocks before each test (following your existing pattern)
    jest.clearAllMocks();
  });

  test('should export registerUser function', () => {
    expect(typeof registerUser).toBe('function');
  });

  test('should return user data when registering', async () => {
    const userData = createTestRegisterData();
    const mockId = chance.integer();

    const createdUser = {
      id: mockId,
      email: userData.email,
      username: userData.username,
      password_hash: 'hashed_password_123', // ✅ Add this!
      createdAt: new Date().toISOString(),
    };

    mockPrisma.users.create.mockResolvedValue(createdUser);

    const result = await registerUser(userData);

    expect(result).toHaveProperty('user');
    expect(result.user).toHaveProperty('email', userData.email);
    expect(result.user).toHaveProperty('username', userData.username);
    expect(result.user).not.toHaveProperty('password'); // Security!
  });

  test('should save user to database when registering', async () => {
    const mockId = chance.integer();
    const userData = createTestRegisterData();

    const createdUser = {
      id: mockId,
      email: userData.email,
      username: userData.username,
      password_hash: 'hashed_password_123', // ✅ Add this!
      createdAt: new Date().toISOString(),
    };

    // Mock Prisma to return the created user
    mockPrisma.users.create.mockResolvedValue(createdUser);

    // Act
    const result = await registerUser(userData);

    // Assert
    expect(mockPrisma.users.create).toHaveBeenCalledWith({
      data: {
        email: userData.email,
        username: userData.username,
        password_hash: expect.any(String),
      },
    });
    expect(result.user.id).toBe(mockId);
    expect(result.user).not.toHaveProperty('password_hash'); // ✅ Security check!
  });

  test('should hash password before saving to database', async () => {
    const userData = createTestRegisterData({ password: 'plaintext123' });

    await registerUser(userData);

    // Check that Prisma was called with a hashed password (not plain text)
    expect(mockPrisma.users.create).toHaveBeenCalledWith({
      data: {
        email: userData.email,
        username: userData.username,
        password_hash: expect.not.stringMatching('plaintext123'), // Should NOT be plain text
      },
    });
  });

  test('should throw error when email is missing', async () => {
    const userData = createTestRegisterData({ email: undefined });

    await expect(registerUser(userData)).rejects.toThrow('Email is required');
  });

  test('should throw error when username is missing', async () => {
    const userData = createTestRegisterData({ username: undefined });

    await expect(registerUser(userData)).rejects.toThrow('Username is required');
  });

  test('should throw error when password is missing', async () => {
    const userData = createTestRegisterData({ password: undefined });

    await expect(registerUser(userData)).rejects.toThrow('Password is required');
  });

  test('should throw error when email already exists', async () => {
    const existingEmail = chance.email();
    const userData = createTestRegisterData({ email: existingEmail });

    // Mock that email already exists in database
    mockPrisma.users.findUnique.mockResolvedValue({
      id: chance.integer(),
      email: existingEmail,
      username: chance.word(),
      password_hash: 'some_hash',
      created_at: new Date().toISOString(),
    });

    await expect(registerUser(userData)).rejects.toThrow('Email or username already registered');
  });

  test('should throw error when username already exists', async () => {
    const existingUsername = chance.word();
    const userData = createTestRegisterData({ username: existingUsername });

    // Mock that username already exists in database
    mockPrisma.users.findUnique.mockResolvedValue({
      id: chance.integer(),
      email: chance.email(),
      username: existingUsername,
      password_hash: chance.hash(),
      created_at: new Date().toISOString(),
    });

    await expect(registerUser(userData)).rejects.toThrow('Email or username already registered');
  });
});
