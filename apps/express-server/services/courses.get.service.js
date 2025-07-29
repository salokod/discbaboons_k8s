import { queryOne } from '../lib/database.js';
import { processCourseCoordinates } from '../lib/coordinates.js';

const coursesGetService = async (courseId, userId = null) => {
  if (!courseId) {
    const error = new Error('courseId is required');
    error.name = 'ValidationError';
    throw error;
  }

  let query;
  let params;

  if (userId) {
    // Allow access to approved courses OR user's own unapproved courses
    // OR friend's unapproved courses (optimized with EXISTS)
    query = `
      SELECT * FROM courses 
      WHERE id = $1 AND (
        approved = true 
        OR submitted_by_id = $2
        OR (approved = false AND EXISTS (
          SELECT 1 FROM friendship_requests fr
          WHERE fr.status = 'accepted' 
            AND ((fr.requester_id = $2 AND fr.recipient_id = courses.submitted_by_id)
                 OR (fr.recipient_id = $2 AND fr.requester_id = courses.submitted_by_id))
        ))
      )
    `;
    params = [courseId, userId];
  } else {
    // No user context - only show approved courses
    query = 'SELECT * FROM courses WHERE id = $1 AND approved = true';
    params = [courseId];
  }

  const course = await queryOne(query, params);
  return processCourseCoordinates(course);
};

export default coursesGetService;
