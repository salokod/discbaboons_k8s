import { queryRows } from '../lib/database.js';

const searchProfilesService = async (query) => {
  if (!query || typeof query !== 'object' || Object.keys(query).length === 0) {
    const error = new Error('Search query is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Build the WHERE clause conditions
  const whereConditions = [];
  const params = [];

  // Add city filter if provided
  if (query.city) {
    whereConditions.push(`up.city ILIKE $${params.length + 1}`);
    params.push(`%${query.city}%`);
  }

  // Add username filter if provided
  if (query.username) {
    whereConditions.push(`u.username ILIKE $${params.length + 1}`);
    params.push(`%${query.username}%`);
  }

  // Add visibility conditions (profiles must have at least one public field)
  whereConditions.push('(up.isnamepublic = true OR up.isbiopublic = true OR up.islocationpublic = true)');

  // Build the complete query
  const searchQuery = `
    SELECT 
      up.user_id,
      up.name,
      up.bio,
      up.city,
      up.country,
      up.state_province,
      up.isnamepublic,
      up.isbiopublic,
      up.islocationpublic,
      u.username
    FROM user_profiles up
    JOIN users u ON up.user_id = u.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY u.username ASC
  `;

  const profiles = await queryRows(searchQuery, params);

  // Transform profiles to only include public data
  return profiles.map((profile) => {
    const publicProfile = { user_id: profile.user_id };
    if (profile.username) publicProfile.username = profile.username;
    if (profile.isnamepublic) publicProfile.name = profile.name;
    if (profile.isbiopublic) publicProfile.bio = profile.bio;
    if (profile.islocationpublic) {
      publicProfile.city = profile.city;
      publicProfile.country = profile.country;
      publicProfile.state_province = profile.state_province;
    }
    return publicProfile;
  });
};

export default searchProfilesService;
