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
    password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,
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
    const randomPassword = `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`;

    const userData = createTestRegisterData();
    const mockId = chance.integer();

    const createdUser = {
      id: mockId,
      email: userData.email,
      username: userData.username,
      password_hash: randomPassword,
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
      password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,
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
    expect(result.user).not.toHaveProperty('password_hash');
  });

  test('should hash password before saving to database', async () => {
    const randomPassword = `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`;

    const userData = createTestRegisterData({ password: randomPassword });

    await registerUser(userData);

    // Check that Prisma was called with a hashed password (not plain text)
    expect(mockPrisma.users.create).toHaveBeenCalledWith({
      data: {
        email: userData.email,
        username: userData.username,
        password_hash: expect.not.stringMatching(randomPassword), // Should NOT be plain text
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

  test('should throw ValidationError for invalid email format', async () => {
    const userData = createTestRegisterData({ email: chance.word() });

    const error = await registerUser(userData).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Please provide a valid email address');
  });

  test('should throw ValidationError for password less than 8 characters', async () => {
    const shortPassword = chance.string({ length: chance.integer({ min: 1, max: 7 }) });
    const userData = createTestRegisterData({ password: shortPassword });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Password must be at least 8 characters');
  });

  test('should throw ValidationError for password more than 32 characters', async () => {
    const shortPassword = chance.string({ length: chance.integer({ min: 33, max: 50 }) });
    const userData = createTestRegisterData({ password: shortPassword });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Password must be no more than 32 characters');
  });

  test('should throw ValidationError for password without uppercase letter', async () => {
    // Generate password with only lowercase, numbers, and symbols
    const lowercasePassword = chance.string({
      length: 10,
      pool: 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%',
    });
    const userData = createTestRegisterData({ password: lowercasePassword });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Password must contain uppercase letter, lowercase letter, number, and special character');
  });

  test('should throw ValidationError for password without lowercase letter', async () => {
    // Generate password with only UPPERCASE, numbers, and symbols
    const uppercasePassword = chance.string({
      length: 10,
      pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%',
    });
    const userData = createTestRegisterData({ password: uppercasePassword });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Password must contain uppercase letter, lowercase letter, number, and special character');
  });

  test('should throw ValidationError for password without number', async () => {
    // Generate password with only letters and symbols (NO numbers)
    const noNumberPassword = chance.string({
      length: 10,
      pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%',
    });
    const userData = createTestRegisterData({ password: noNumberPassword });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Password must contain uppercase letter, lowercase letter, number, and special character');
  });

  test('should throw ValidationError for password without special character', async () => {
    // Generate password with only letters and numbers (NO special chars)
    const noSpecialPassword = chance.string({
      length: 10,
      pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    });
    const userData = createTestRegisterData({ password: noSpecialPassword });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Password must contain uppercase letter, lowercase letter, number, and special character');
  });
});
