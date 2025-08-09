import jwt from 'jsonwebtoken';
import { queryOne } from '../lib/database.js';

const refreshToken = async (refreshData) => {
  // Validate input - refresh token is required
  if (!refreshData || !refreshData.refreshToken || refreshData.refreshToken.trim() === '') {
    const error = new Error('Refresh token is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Verify the refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshData.refreshToken, process.env.JWT_REFRESH_SECRET);
    // Token is valid, decoded contains the payload
  } catch (error) {
    const validationError = new Error('Invalid or expired refresh token');
    validationError.name = 'ValidationError';
    throw validationError;
  }

  // Get current user information from database (including admin status)
  const user = await queryOne(
    'SELECT id, username, is_admin FROM users WHERE id = $1',
    [decoded.userId],
  );

  // If user doesn't exist (deleted account), invalidate token
  if (!user) {
    const error = new Error('Invalid or expired refresh token');
    error.name = 'ValidationError';
    throw error;
  }

  // Generate new access token with current user data
  const newAccessToken = jwt.sign(
    { userId: user.id, username: user.username, isAdmin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  // Generate new refresh token (rotating refresh tokens)
  const newRefreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '14d' },
  );

  return {
    success: true,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export default refreshToken;
