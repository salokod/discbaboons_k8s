import { queryOne } from '../lib/database.js';

const coursesGetService = async (courseId) => {
  if (!courseId) {
    const error = new Error('courseId is required');
    error.name = 'ValidationError';
    throw error;
  }

  const course = await queryOne(
    'SELECT * FROM courses WHERE id = $1 AND approved = true',
    [courseId]
  );

  return course;
};

export default coursesGetService;