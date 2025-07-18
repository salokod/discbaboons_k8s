import bcrypt from 'bcrypt';
import { queryOne } from '../lib/database.js';
import { isValidEmail } from '../utils/validation.js';

const registerUser = async (userData, dbClient = { queryOne }) => {
  // Validate required fields - these are ValidationError (400)
  if (!userData.email) {
    const error = new Error('Email is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!userData.password) {
    const error = new Error('Password is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!userData.username) {
    const error = new Error('Username is required');
    error.name = 'ValidationError';
    throw error;
  }

  // ADD USERNAME LENGTH VALIDATION
  if (userData.username.length < 4 || userData.username.length > 20) {
    const error = new Error('Username must be 4-20 characters');
    error.name = 'ValidationError';
    throw error;
  }

  if (!isValidEmail(userData.email)) {
    const error = new Error('Please provide a valid email address');
    error.name = 'ValidationError';
    throw error;
  }

  if (userData.password.length < 8) {
    const error = new Error('Password must be at least 8 characters');
    error.name = 'ValidationError';
    throw error;
  }

  if (userData.password.length > 32) {
    const error = new Error('Password must be no more than 32 characters');
    error.name = 'ValidationError';
    throw error;
  }

  if (!/[A-Z]/.test(userData.password)) {
    const error = new Error('Password must contain uppercase letter, lowercase letter, number, and special character');
    error.name = 'ValidationError';
    throw error;
  }
  if (!/[a-z]/.test(userData.password)) {
    const error = new Error('Password must contain uppercase letter, lowercase letter, number, and special character');
    error.name = 'ValidationError';
    throw error;
  }
  if (!/[0-9]/.test(userData.password)) {
    const error = new Error('Password must contain uppercase letter, lowercase letter, number, and special character');
    error.name = 'ValidationError';
    throw error;
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(userData.password)) {
    const error = new Error('Password must contain uppercase letter, lowercase letter, number, and special character');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if email already exists
  const existingEmail = await dbClient.queryOne(
    'SELECT id, email FROM users WHERE email = $1',
    [userData.email],
  );

  const existingUsername = await dbClient.queryOne(
    'SELECT id, username FROM users WHERE username = $1',
    [userData.username],
  );

  if (existingEmail || existingUsername) {
    const error = new Error('Email or username already registered');
    error.status = 409;
    throw error;
  }

  // Hash password for security
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  // Save user to database
  const createdUser = await dbClient.queryOne(
    `INSERT INTO users (email, username, password_hash, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, username, created_at`,
    [userData.email, userData.username, hashedPassword, new Date()],
  );

  return {
    success: true,
    user: createdUser,
  };
};

export default registerUser;
