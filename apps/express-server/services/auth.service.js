import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

const registerUser = async (userData) => {
  // Validate required fields
  if (!userData.email) {
    throw new Error('Email is required');
  }
  if (!userData.password) {
    throw new Error('Password is required');
  }
  if (!userData.username) {
    throw new Error('Username is required');
  }

  // Check if email already exists
  const existingEmail = await prisma.users.findUnique({
    where: { email: userData.email },
  });

  const existingUsername = await prisma.users.findUnique({
    where: { username: userData.username },
  });

  if (existingEmail || existingUsername) {
    throw new Error('Email or username already registered');
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
  const { password_hash, ...userWithoutPassword } = createdUser;

  return {
    success: true,
    user: userWithoutPassword,
  };
};

export default registerUser;
