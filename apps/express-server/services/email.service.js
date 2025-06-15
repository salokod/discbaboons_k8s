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
    console.log('Missing email config, running in development mode');
    return {
      success: true,
      message: 'Email not sent - running in development mode without email configuration',
    };
  }

  console.log('=== EMAIL SERVICE DEBUG ===');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length || 'undefined');

  // Create nodemailer transporter
  console.log('About to create transporter...');
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465',
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log('Transporter created, about to send email...');

  // Send email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
  });

  console.log('Email sent successfully!');
  console.log('=== EMAIL SERVICE DEBUG END ===');

  return {
    success: true,
    message: 'Email sent successfully',
  };
};

export default sendEmail;
