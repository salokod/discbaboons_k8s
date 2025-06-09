import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

const registerUser = async (userData) => {
  // Validate required fields - these are ValidationError (400)
  if (!userData.email) {
    const error = new Error('Email is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!userData.password) {
    const error = new Error('Password is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!userData.username) {
    const error = new Error('Username is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if email already exists
  const existingEmail = await prisma.users.findUnique({
    where: { email: userData.email },
  });

  const existingUsername = await prisma.users.findUnique({
    where: { username: userData.username },
  });

  if (existingEmail || existingUsername) {
    const error = new Error('Email or username already registered');
    error.status = 409; // Conflict - resource already exists
    throw error;
  }

  // Hash password for security
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  // Save user to database
  const createdUser = await prisma.users.create({
    data: {
      email: userData.email,
      username: userData.username,
      password_hash: hashedPassword,
    },
  });

  // Remove sensitive data before returning
  // eslint-disable-next-line no-unused-vars, camelcase
  const { password_hash, ...userWithoutPassword } = createdUser;

  return {
    success: true,
    user: userWithoutPassword,
  };
};

export default registerUser;
