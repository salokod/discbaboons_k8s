import nodemailer from 'nodemailer';

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

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Send email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
  });

  return {
    success: true,
    message: 'Email sent successfully',
  };
};

export default sendEmail;
