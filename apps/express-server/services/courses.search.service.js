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

  const courses = await prismaClient.courses.findMany({
    where,
    orderBy: [
      { state: 'asc' },
      { city: 'asc' },
      { name: 'asc' },
    ],
  });

  return courses;
};

export default coursesSearchService;
