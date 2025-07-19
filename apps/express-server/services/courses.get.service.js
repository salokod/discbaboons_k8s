import { queryOne } from '../lib/database.js';

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
    // OR friend's unapproved courses
    query = `
      SELECT * FROM courses 
      WHERE id = $1 AND (
        approved = true 
        OR submitted_by_id = $2
        OR (approved = false AND submitted_by_id IN (
          SELECT CASE 
            WHEN requester_id = $2 THEN recipient_id
            WHEN recipient_id = $2 THEN requester_id
          END as friend_id
          FROM friendship_requests 
          WHERE status = 'accepted' 
            AND (requester_id = $2 OR recipient_id = $2)
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
  return course;
};

export default coursesGetService;
