import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLOWED_FIELDS = [
  'name',
  'bio',
  'country',
  'state_province',
  'city',
  'isnamepublic',
  'isbiopublic',
  'islocationpublic',
];

const updateProfileService = async (userId, updateData) => {
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }
  if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
    const error = new Error('Update data is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Filter updateData to only allowed fields
  const filteredData = Object.fromEntries(
    Object.entries(updateData).filter(([key]) => ALLOWED_FIELDS.includes(key)),
  );

  if (Object.keys(filteredData).length === 0) {
    const error = new Error('No valid fields to update');
    error.name = 'ValidationError';
    throw error;
  }

  try {
    const profile = await prisma.user_profiles.upsert({
      where: { user_id: userId },
      update: filteredData,
      create: { user_id: userId, ...filteredData },
    });
    return {
      success: true,
      profile,
    };
  } finally {
    await prisma.$disconnect();
  }
};

export default updateProfileService;
