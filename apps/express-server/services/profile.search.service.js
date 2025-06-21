import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SEARCH_MODE = 'insensitive';

const searchProfilesService = async (query) => {
  if (!query || typeof query !== 'object' || Object.keys(query).length === 0) {
    const error = new Error('Search query is required');
    error.name = 'ValidationError';
    throw error;
  }

  const searchFilters = {};
  if (query.city) {
    searchFilters.city = { contains: query.city, mode: SEARCH_MODE };
  }
  searchFilters.OR = [
    { isnamepublic: true },
    { isbiopublic: true },
    { islocationpublic: true },
  ];

  const profiles = await prisma.user_profiles.findMany({
    where: searchFilters,
    include: {
      users: true, // <-- fix: match schema relation name
    },
  });

  // Filter by username if provided
  let filteredProfiles = profiles;
  if (query.username) {
    filteredProfiles = profiles.filter(
      (profile) => profile.users?.username
        ?.toLowerCase()
        .includes(query.username.toLowerCase()),
    );
  }
  return filteredProfiles.map((profile) => {
    const publicProfile = { user_id: profile.user_id };
    if (profile.users?.username) publicProfile.username = profile.users.username;
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
