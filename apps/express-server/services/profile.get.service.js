import { queryOne } from '../lib/database.js';

const getProfileService = async (user) => {
  // Extract userId from user object (from JWT)
  const userId = user?.userId;

  // Validate that we have a userId
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Find user profile by user_id
  const profile = await queryOne(
    'SELECT * FROM user_profiles WHERE user_id = $1',
    [userId],
  );

  return {
    success: true,
    profile,
  };
};

export default getProfileService;
