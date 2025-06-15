import { isValidEmail } from '../utils/validation.js';
import prisma from '../lib/prisma.js';
import emailService from './email.service.js';

const forgotUsername = async (email) => {
  if (!email) {
    const error = new Error('Email is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!isValidEmail(email)) {
    const error = new Error('Invalid email format');
    error.name = 'ValidationError';
    throw error;
  }

  // Look up user by email
  const user = await prisma.users.findUnique({
    where: { email },
  });

  // If user exists, send email with username
  if (user) {
    console.log(`Sending username email to: ${email}`);
    await emailService({
      to: email,
      subject: 'Your username',
      html: `<p>Your username is: <strong>${user.username}</strong>, you baboon.</p>`,
    });
  }

  // Always return same message for security
  return {
    success: true,
    message: 'If an account associated with this email address exists, an email containing your username has been sent.',
  };
};

export default forgotUsername;
