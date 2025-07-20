import { queryOne } from '../lib/database.js';

const roundsCreateService = async (roundData, userId) => {
  const {
    courseId,
    name,
    startingHole = 1,
    isPrivate = false,
    skinsEnabled = false,
    skinsValue,
  } = roundData;

  // Validate required fields
  if (!courseId) {
    const error = new Error('Course ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!name) {
    const error = new Error('Round name is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!userId) {
    const error = new Error('User ID is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Look up the course to validate startingHole
  const course = await queryOne('SELECT hole_count FROM courses WHERE id = $1', [courseId]);

  if (!course) {
    const error = new Error('Course not found');
    error.name = 'ValidationError';
    throw error;
  }

  if (startingHole && (startingHole < 1 || startingHole > course.hole_count)) {
    const error = new Error('Starting hole cannot exceed course hole count');
    error.name = 'ValidationError';
    throw error;
  }

  // Insert round into database
  const result = await queryOne(
    `INSERT INTO rounds (created_by_id, course_id, name, starting_hole, is_private, skins_enabled, skins_value, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      userId,
      courseId,
      name,
      startingHole,
      isPrivate,
      skinsEnabled,
      skinsValue,
      'in_progress',
    ],
  );

  return result;
};

export default roundsCreateService;
