import { queryOne } from '../lib/database.js';

const filterProfileFields = (profile) => {
  if (!profile) return null;

  // Remove internal fields and return only user-facing data
  const {
    id, // eslint-disable-line no-unused-vars
    created_at, // eslint-disable-line camelcase, no-unused-vars
    updated_at, // eslint-disable-line camelcase, no-unused-vars
    ...userFacingFields
  } = profile;

  return userFacingFields;
};

const getProfileService = async (user, dbClient = { queryOne }) => {
  // Extract userId from user object (from JWT)
  const userId = user?.userId;

  // Validate that we have a userId
  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Find user profile by user_id
  let profile = await dbClient.queryOne(
    'SELECT * FROM user_profiles WHERE user_id = $1',
    [userId],
  );

  // If no profile exists, create a default one
  if (!profile) {
    profile = await dbClient.queryOne(
      `INSERT INTO user_profiles (
        user_id, 
        name, 
        bio, 
        country, 
        state_province, 
        city, 
        isnamepublic, 
        isbiopublic, 
        islocationpublic
      ) VALUES ($1, NULL, NULL, NULL, NULL, NULL, false, false, false)
      RETURNING *`,
      [userId],
    );
  }

  return {
    success: true,
    profile: filterProfileFields(profile),
  };
};

export default getProfileService;
