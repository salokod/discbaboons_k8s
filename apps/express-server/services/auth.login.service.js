import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { queryOne } from '../lib/database.js';

const loginUser = async (loginData) => {
  if (!loginData.username) {
    const error = new Error('Username is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!loginData.password) {
    const error = new Error('Password is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if user exists in database
  const user = await queryOne(
    'SELECT id, username, email, password_hash, created_at FROM users WHERE username = $1',
    [loginData.username],
  );

  // If user doesn't exist, throw error
  if (!user) {
    const error = new Error('Invalid username or password');
    error.status = 401;
    throw error;
  }

  // Compare password with stored hash
  const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash);

  if (!isPasswordValid) {
    const error = new Error('Invalid username or password');
    error.status = 401;
    throw error;
  }

  // Generate JWT tokens
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '14d' },
  );

  // Return successful login response
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export default loginUser;
