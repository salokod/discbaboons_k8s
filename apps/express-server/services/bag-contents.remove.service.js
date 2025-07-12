import prisma from '../lib/prisma.js';

const removeDiscService = async (userId, contentId, prismaClient = prisma) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!contentId) {
    const error = new Error('contentId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format - if invalid, return null instead of letting Prisma throw
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(contentId)) {
    return null; // Invalid UUID format, disc content not found
  }

  // Find and validate disc content ownership
  const discContent = await prismaClient.bag_contents.findFirst({
    where: {
      id: contentId,
      user_id: userId,
    },
  });

  if (!discContent) {
    const error = new Error('Disc not found or access denied');
    error.name = 'NotFoundError';
    throw error;
  }

  // Delete the disc content
  await prismaClient.bag_contents.delete({
    where: {
      id: contentId,
    },
  });

  return { message: 'Disc removed successfully' };
};

export default removeDiscService;
