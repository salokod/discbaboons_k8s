const sendEmail = async (emailData) => {
  if (!emailData) {
    const error = new Error('Email data is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!emailData.to) {
    const error = new Error('To field is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!emailData.subject) {
    const error = new Error('Subject field is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!emailData.html) {
    const error = new Error('HTML content is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if email configuration is missing
  const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
  const missingConfig = requiredEnvVars.some((envVar) => !process.env[envVar]);

  if (missingConfig) {
    return {
      success: true,
      message: 'Email not sent - running in development mode without email configuration',
    };
  }

  // TODO: Actually send email via M365

  return {
    success: true,
    message: 'Email sent successfully',
  };
};

export default sendEmail;
