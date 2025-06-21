import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getProfileService = async (user) => {
  // Extract userId from user object (from JWT)
  const userId = user?.userId;

  // Validate that we have a userId
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  try {
    // Find user profile by user_id
    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

    return {
      success: true,
      profile,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default getProfileService;
