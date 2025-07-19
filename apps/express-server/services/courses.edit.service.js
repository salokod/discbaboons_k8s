import { queryOne } from '../lib/database.js';
import { truncateCoordinates, processCourseCoordinates } from '../lib/coordinates.js';

const edit = async (courseId, updateData, userId) => {
  // Check if user exists and get admin status
  const user = await queryOne(
    'SELECT id, is_admin FROM users WHERE id = $1',
    [userId],
  );

  if (!user) {
    const error = new Error('User not found');
    error.name = 'ValidationError';
    throw error;
  }

  // Check if course exists
  const existingCourse = await queryOne(
    'SELECT id, submitted_by_id FROM courses WHERE id = $1',
    [courseId],
  );

  if (!existingCourse) {
    return null;
  }

  // Check permissions
  let hasPermission = false;

  // Admin can edit any course
  if (user.is_admin) {
    hasPermission = true;
  } else if (existingCourse.submitted_by_id === userId) {
    hasPermission = true;
  } else {
    const friendship = await queryOne(
      `SELECT requester_id, recipient_id FROM friendship_requests 
       WHERE status = 'accepted' 
         AND ((requester_id = $1 AND recipient_id = $2) 
              OR (requester_id = $2 AND recipient_id = $1))`,
      [userId, existingCourse.submitted_by_id],
    );

    if (friendship) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    const error = new Error('You do not have permission to edit this course');
    error.name = 'ValidationError';
    throw error;
  }

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];
  let paramCount = 1;

  const allowedFields = [
    'name', 'city', 'state_province', 'country', 'postal_code',
    'hole_count', 'latitude', 'longitude',
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      let value = updateData[field];

      // Truncate coordinates to 5 decimal places for consistency
      if (field === 'latitude' || field === 'longitude') {
        const coords = truncateCoordinates(
          field === 'latitude' ? value : 0,
          field === 'longitude' ? value : 0,
        );
        value = field === 'latitude' ? coords.latitude : coords.longitude;
      }

      updateFields.push(`${field} = $${paramCount}`);
      updateValues.push(value);
      paramCount += 1;
    }
  });

  if (updateFields.length === 0) {
    const error = new Error('No valid fields to update');
    error.name = 'ValidationError';
    throw error;
  }

  // Add updated_at timestamp
  updateFields.push('updated_at = NOW()');

  // Add course ID as final parameter
  updateValues.push(courseId);

  const updateQuery = `
    UPDATE courses 
    SET ${updateFields.join(', ')} 
    WHERE id = $${paramCount} 
    RETURNING *
  `;

  const updatedCourse = await queryOne(updateQuery, updateValues);

  return processCourseCoordinates(updatedCourse);
};

const coursesEditService = {
  edit,
};

export default coursesEditService;
