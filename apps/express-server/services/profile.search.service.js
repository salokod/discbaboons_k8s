import { queryRows } from '../lib/database.js';

const searchProfilesService = async (query) => {
  if (!query || typeof query !== 'object' || Object.keys(query).length === 0) {
    const error = new Error('Search query is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Pagination parameters
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100); // Default 20, max 100
  const offset = parseInt(query.offset, 10) || 0;

  // Validate pagination parameters
  if (query.limit && (Number.isNaN(limit) || limit <= 0)) {
    const error = new Error('Limit must be a positive integer');
    error.name = 'ValidationError';
    throw error;
  }

  if (query.offset && (Number.isNaN(offset) || offset < 0)) {
    const error = new Error('Offset must be a non-negative integer');
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

  const whereClause = whereConditions.join(' AND ');

  // Build the complete query with pagination
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
    WHERE ${whereClause}
    ORDER BY u.username ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Get total count for pagination metadata
  const countQuery = `
    SELECT COUNT(*) as count
    FROM user_profiles up
    JOIN users u ON up.user_id = u.id
    WHERE ${whereClause}
  `;

  // Execute both queries
  const [profiles, countResult] = await Promise.all([
    queryRows(searchQuery, params),
    queryRows(countQuery, params),
  ]);

  const total = parseInt(countResult[0]?.count || 0, 10);
  const hasMore = offset + limit < total;

  // Transform profiles to only include public data
  const transformedProfiles = profiles.map((profile) => {
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

  return {
    profiles: transformedProfiles,
    total,
    limit,
    offset,
    hasMore,
  };
};

export default searchProfilesService;
