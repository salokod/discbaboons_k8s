import { isValidEmail } from '../utils/validation.js';
import { queryOne } from '../lib/database.js';
import emailService from './email/email.service.js';
import { getTemplate } from './email/email.template.service.js';

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
  const user = await queryOne(
    'SELECT id, username, email FROM users WHERE email = $1',
    [email],
  );

  // If user exists, send email with username
  if (user) {
    console.log(`Sending username email to: ${email}`);

    const emailTemplate = await getTemplate('forgotusername', {
      username: user.username,
    });

    await emailService({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
  }

  // Always return same message for security
  return {
    success: true,
    message: 'If an account associated with this email address exists, an email containing your username has been sent.',
  };
};

export default forgotUsername;
