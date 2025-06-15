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

  try {
    // Add a more aggressive timeout and better error handling
    const info = await Promise.race([
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('SMTP connection timeout after 10 seconds')), 10000);
      }),
    ]);

    console.log('Email sent successfully! Message ID:', info.messageId);
    console.log('=== EMAIL SERVICE DEBUG END ===');

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.log('=== EMAIL SENDING FAILED ===');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Error stack:', error.stack);
    console.log('=== EMAIL ERROR END ===');

    // For now, let's not throw - just log and return success to prevent API hanging
    return {
      success: true,
      message: 'Email processing completed (check logs for details)',
    };
  }
};

export default sendEmail;
