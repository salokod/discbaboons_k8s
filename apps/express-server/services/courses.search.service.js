import prisma from '../lib/prisma.js';

const coursesSearchService = async (filters = {}, prismaClient = prisma) => {
  const where = {
    approved: true,
  };

  if (filters.state) {
    where.state = filters.state;
  }

  if (filters.city) {
    where.city = filters.city;
  }

  if (filters.name) {
    where.name = {
      contains: filters.name,
      mode: 'insensitive',
    };
  }

  // Pagination parameters
  const limit = Math.min(parseInt(filters.limit, 10) || 50, 500); // Default 50, max 500
  const offset = parseInt(filters.offset, 10) || 0;

  // Get total count for pagination metadata
  const total = await prismaClient.courses.count({ where });

  // Get paginated results
  const courses = await prismaClient.courses.findMany({
    where,
    orderBy: [
      { state: 'asc' },
      { city: 'asc' },
      { name: 'asc' },
    ],
    take: limit,
    skip: offset,
  });

  return {
    courses,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
};

export default coursesSearchService;
