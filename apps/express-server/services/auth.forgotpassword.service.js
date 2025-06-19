import crypto from 'crypto';
import redisClient from '../lib/redis.js';
import prisma from '../lib/prisma.js';
import { isValidEmail } from '../utils/validation.js';
import sendEmail from './email/email.service.js';
import { getTemplate } from './email/email.template.service.js';

const forgotPassword = async (forgotPasswordData) => {
  // Validate input
  if (!forgotPasswordData || (!forgotPasswordData.username && !forgotPasswordData.email)) {
    const error = new Error('Username or email is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate email format if email is provided
  if (forgotPasswordData.email && !isValidEmail(forgotPasswordData.email)) {
    const error = new Error('Invalid email format');
    error.name = 'ValidationError';
    throw error;
  }

  // Look up user by username or email
  let user;
  if (forgotPasswordData.username) {
    user = await prisma.users.findUnique({
      where: { username: forgotPasswordData.username },
    });
  } else if (forgotPasswordData.email) {
    user = await prisma.users.findUnique({
      where: { email: forgotPasswordData.email },
    });
  }

  // If user found, generate and store reset token
  if (user) {
    // Generate 6-digit random token
    const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Store token in Redis with 30-minute expiration
    await redisClient.setEx(`password_reset:${user.id}`, 1800, resetToken);

    // Get email template with reset code
    const emailTemplate = await getTemplate('forgotpassword', {
      resetCode: resetToken,
    });

    // Send email with reset code
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
  }

  // Always return generic success message for security
  return {
    success: true,
    message: 'If an account with that information exists, a password reset code has been sent to the associated email address.',
  };
};

export default forgotPassword;
