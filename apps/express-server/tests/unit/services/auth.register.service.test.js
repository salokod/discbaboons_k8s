import {
  describe, test, expect, vi,
} from 'vitest';
import Chance from 'chance';
import registerUser from '../../../services/auth.register.service.js';
import mockDatabase from '../setup.js';

const chance = new Chance();

describe('AuthService', () => {
  const createTestRegisterData = (overrides = {}) => ({
    email: chance.email(),
    password: `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`,
    username: chance.string({ length: chance.integer({ min: 4, max: 20 }), alpha: true }),
    ...overrides, // Allow overriding specific fields
  });

  beforeEach(() => {
    // Clear mocks before each test (following your existing pattern)
    vi.clearAllMocks();
    mockDatabase.queryOne.mockClear();
  });

  test('should export registerUser function', () => {
    expect(typeof registerUser).toBe('function');
  });

  test('should return user data when registering', async () => {
    const userData = createTestRegisterData();
    const mockId = chance.integer();
    const mockCreatedAt = new Date().toISOString();

    const createdUser = {
      id: mockId,
      email: userData.email,
      username: userData.username,
      created_at: mockCreatedAt,
    };

    // Mock database calls: no existing email, no existing username, then create user
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No existing email
      .mockResolvedValueOnce(null) // No existing username
      .mockResolvedValueOnce(createdUser); // Return created user

    const result = await registerUser(userData);

    expect(result).toHaveProperty('user');
    expect(result.user).toHaveProperty('email', userData.email);
    expect(result.user).toHaveProperty('username', userData.username);
    expect(result.user).not.toHaveProperty('password'); // Security!
  });

  test('should save user to database when registering', async () => {
    const mockId = chance.integer();
    const userData = createTestRegisterData();
    const mockCreatedAt = new Date().toISOString();

    const createdUser = {
      id: mockId,
      email: userData.email,
      username: userData.username,
      created_at: mockCreatedAt,
    };

    // Mock database calls: no existing email, no existing username, then create user
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No existing email
      .mockResolvedValueOnce(null) // No existing username
      .mockResolvedValueOnce(createdUser); // Return created user

    // Act
    const result = await registerUser(userData);

    // Assert - check database insert call
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'INSERT INTO users (email, username, password_hash, created_at)\n     VALUES ($1, $2, $3, $4)\n     RETURNING id, email, username, created_at',
      [userData.email, userData.username, expect.any(String), expect.any(Date)],
    );
    expect(result.user.id).toBe(mockId);
    expect(result.user).not.toHaveProperty('password_hash');
  });

  test('should hash password before saving to database', async () => {
    const randomPassword = `${chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' })}${chance.string({ length: 1, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' })}${chance.integer({ min: 0, max: 9 })}${chance.pick(['!', '@', '#', '$', '%', '^', '&', '*'])}`;

    const userData = createTestRegisterData({ password: randomPassword });
    const mockCreatedAt = new Date().toISOString();

    const createdUser = {
      id: chance.integer(),
      email: userData.email,
      username: userData.username,
      created_at: mockCreatedAt,
    };

    // Mock database calls: no existing email, no existing username, then create user
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No existing email
      .mockResolvedValueOnce(null) // No existing username
      .mockResolvedValueOnce(createdUser); // Return created user

    await registerUser(userData);

    // Check that database was called with a hashed password (not plain text)
    const expectedParams = [
      userData.email, userData.username, expect.not.stringMatching(randomPassword),
      expect.any(Date),
    ];
    expect(mockDatabase.queryOne).toHaveBeenCalledWith(
      'INSERT INTO users (email, username, password_hash, created_at)\n     VALUES ($1, $2, $3, $4)\n     RETURNING id, email, username, created_at',
      expectedParams,
    );
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
    mockDatabase.queryOne.mockResolvedValueOnce({
      id: chance.integer(),
      email: existingEmail,
    });

    await expect(registerUser(userData)).rejects.toThrow('Email or username already registered');
  });

  test('should throw error when username already exists', async () => {
    const existingUsername = chance.string({
      length: chance.integer({ min: 4, max: 20 }),
      alpha: true,
    });
    const userData = createTestRegisterData({ username: existingUsername });

    // Mock that email doesn't exist but username does
    mockDatabase.queryOne
      .mockResolvedValueOnce(null) // No existing email
      .mockResolvedValueOnce({
        id: chance.integer(),
        username: existingUsername,
      }); // Existing username

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

  // ADD USERNAME VALIDATION TESTS
  test('should throw ValidationError for username less than 4 characters', async () => {
    // Generate a random username that's definitely less than 4 characters
    const shortUsername = chance.string({ length: chance.integer({ min: 1, max: 3 }) });
    const userData = createTestRegisterData({ username: shortUsername });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Username must be 4-20 characters');
  });

  test('should throw ValidationError for username more than 20 characters', async () => {
    // Generate a random username that's definitely more than 20 characters
    const longUsername = chance.string({ length: chance.integer({ min: 21, max: 30 }) });
    const userData = createTestRegisterData({ username: longUsername });

    const error = await registerUser(userData).catch((e) => e);

    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Username must be 4-20 characters');
  });
});
