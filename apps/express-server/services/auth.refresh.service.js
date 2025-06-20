import jwt from 'jsonwebtoken';

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

  // Generate new access token
  const newAccessToken = jwt.sign(
    { userId: decoded.userId, username: decoded.username },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  // Generate new refresh token (rotating refresh tokens)
  const newRefreshToken = jwt.sign(
    { userId: decoded.userId },
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
