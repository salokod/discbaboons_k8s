import { queryOne, query } from '../lib/database.js';

const removeDiscService = async (userId, contentId, dbClient = { queryOne, query }) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!contentId) {
    const error = new Error('contentId is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate UUID format - if invalid, return null instead of letting database throw
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(contentId)) {
    return null; // Invalid UUID format, disc content not found
  }

  // Find and validate disc content ownership
  const discContent = await dbClient.queryOne(
    `SELECT id, user_id, bag_id 
     FROM bag_contents 
     WHERE id = $1 AND user_id = $2`,
    [contentId, userId],
  );

  if (!discContent) {
    const error = new Error('Disc not found or access denied');
    error.name = 'NotFoundError';
    throw error;
  }

  // Delete the disc content
  await dbClient.query(
    'DELETE FROM bag_contents WHERE id = $1',
    [contentId],
  );

  return { message: 'Disc removed successfully' };
};

export default removeDiscService;
