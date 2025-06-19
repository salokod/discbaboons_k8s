import bcrypt from 'bcrypt';
import redisClient from '../lib/redis.js';
import prisma from '../lib/prisma.js';
import { isValidEmail } from '../utils/validation.js';

const changePassword = async (changePasswordData) => {
  // Validate input - require reset code, new password, and username OR email
  if (!changePasswordData
      || !changePasswordData.resetCode
      || !changePasswordData.newPassword
      || (!changePasswordData.username && !changePasswordData.email)) {
    const error = new Error('Reset code, new password, and username or email are required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate email format if email is provided
  if (changePasswordData.email && !isValidEmail(changePasswordData.email)) {
    const error = new Error('Invalid email format');
    error.name = 'ValidationError';
    throw error;
  }

  // Look up user to get their ID for Redis key matching
  let user;
  if (changePasswordData.username) {
    user = await prisma.users.findUnique({
      where: { username: changePasswordData.username },
    });
  } else if (changePasswordData.email) {
    user = await prisma.users.findUnique({
      where: { email: changePasswordData.email },
    });
  }

  // Check if user exists and if the reset token matches
  let tokenFound = false;
  if (user) {
    const storedToken = await redisClient.get(`password_reset:${user.id}`);
    if (storedToken === changePasswordData.resetCode) {
      tokenFound = true;
    }
  }

  if (!tokenFound) {
    const error = new Error('Invalid or expired reset code');
    error.name = 'ValidationError';
    throw error;
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(changePasswordData.newPassword, 10);

  // Update user's password in database
  await prisma.users.update({
    where: { id: user.id },
    data: { password_hash: hashedPassword },
  });

  // Delete the reset token from Redis (one-time use)
  await redisClient.del(`password_reset:${user.id}`);

  return {
    success: true,
    message: 'Password has been successfully changed.',
  };
};

export default changePassword;
